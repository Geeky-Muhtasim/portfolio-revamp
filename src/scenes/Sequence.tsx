"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type Lenis from "lenis";
import { flags } from "@/config/site";
import { BladeCursor } from "@/motion/cursor/BladeCursor";
import { useBreath } from "@/motion/breath/useBreath";
import { pickCutMode } from "@/motion/device";
import type { SlashRenderer } from "@/motion/cut/runCut";
import { MuteToggle } from "@/motion/sound/MuteToggle";
import { enableSound, play } from "@/motion/sound/sound";
import { motion } from "@/motion/tokens";
import { prefersReducedMotion, useReducedMotion } from "@/motion/useReducedMotion";
import { Threshold } from "./01-threshold/Threshold";

/*
 * The director. Runs one continuous sequence:
 *   threshold -> entering -> writing -> sealed -> (the cut) -> free
 * Scenes are server-rendered children; this component only adds motion,
 * found through data attributes. Without JavaScript, everything is simply
 * there.
 */

type Phase = "threshold" | "entering" | "writing" | "sealed" | "free";
type Experience = typeof import("@/motion/experience");

const ENTERED_KEY = "three-blades:entered";
const MIN_CEREMONY_MS = 1400;

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

function remember(value: string) {
  try {
    sessionStorage.setItem(ENTERED_KEY, value);
  } catch {
    /* private mode: the ceremony simply runs again */
  }
}

function center(el: Element) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function Sequence({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("threshold");
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [cutting, setCutting] = useState(false);

  const exp = useRef<Experience | null>(null);
  const lenis = useRef<Lenis | null>(null);
  const slash = useRef<SlashRenderer | null>(null);
  const writing = useRef<gsap.core.Timeline | null>(null);
  const lineTl = useRef<gsap.core.Timeline | null>(null);
  const written = useRef(new WeakSet<Element>());
  const phaseRef = useRef<Phase>("threshold");
  const cuttingRef = useRef(false);

  const go = useCallback((next: Phase) => {
    phaseRef.current = next;
    document.documentElement.dataset.phase = next;
    setPhase(next);
  }, []);

  useBreath(!reducedMotion && !cutting && (phase === "sealed" || phase === "free"));

  /* ---------- scroll ---------- */

  const startScroll = useCallback(() => {
    const mod = exp.current;
    if (!mod || lenis.current || prefersReducedMotion()) return;
    lenis.current = mod.createLenis();
    lenis.current.stop();
  }, []);

  const lock = (locked: boolean) => {
    document.documentElement.classList.toggle("is-locked", locked);
    if (locked) lenis.current?.stop();
    else lenis.current?.start();
  };

  const scrollTo = (el: HTMLElement) => {
    if (lenis.current) lenis.current.scrollTo(el, { immediate: true, force: true });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
  };

  /* ---------- writing ---------- */

  const writePhrases = useCallback((roots: Element[], durationMs: number) => {
    const mod = exp.current;
    if (!mod || !roots.length) return null;
    if (prefersReducedMotion()) {
      mod.showBrush(roots);
      return null;
    }
    mod.hideBrush(roots);
    return mod.writeBrush(roots, { durationMs }).play();
  }, []);

  const seal = useCallback(() => {
    const mod = exp.current;
    if (!mod) return;
    const sealEl = $("[data-seal]");
    if (sealEl && !prefersReducedMotion()) mod.stampSeal(sealEl);
    const subline = $("[data-subline]");
    const cont = $("[data-continue]");
    if (!prefersReducedMotion()) {
      if (subline) mod.fadeIn(subline, 0.35, 0.8);
      if (cont) mod.fadeIn(cont, 1.2, 0.6);
    }
    go("sealed");
  }, [go]);

  const begin = useCallback(() => {
    const mod = exp.current;
    if (!mod) return;
    startScroll();
    lock(true);
    $("#vow")?.focus({ preventScroll: true });
    const roots = $$(".vow-line .brush");
    if (prefersReducedMotion()) {
      mod.showBrush(roots);
      seal();
      return;
    }
    go("writing");
    writing.current = mod.writeBrush(roots, {
      durationMs: motion.vowWriteMs,
      finale: { pauseMs: 280, strokeMs: 460 },
    });
    writing.current.eventCallback("onComplete", seal);
    writing.current.play();
  }, [go, seal, startScroll]);

  /* ---------- loading: the blade is drawn by real work ---------- */

  useEffect(() => {
    const started = performance.now();
    const reduced = prefersReducedMotion();
    let done = 0;
    const tasks: Array<Promise<unknown>> = [
      import("@/motion/experience").then((mod) => {
        exp.current = mod;
        if (process.env.NODE_ENV !== "production") {
          // Review aid: __tb.gsap.globalTimeline.timeScale(0.2) plays everything in slow motion.
          (window as unknown as { __tb: unknown }).__tb = { gsap: mod.gsap };
        }
        if (!reduced && (phaseRef.current === "threshold" || phaseRef.current === "entering")) {
          // Everything the brush will write goes back into the inkwell, unseen behind the Threshold.
          mod.hideBrush($$(".vow-line .brush, .blade-label, .stub-title .brush, .stub-line .brush, .blade-line .brush"));
        }
      }),
      document.fonts.ready,
      document.readyState === "complete" ? Promise.resolve() : new Promise((r) => window.addEventListener("load", r, { once: true })),
    ];
    tasks.forEach((t) => t.then(() => setProgress(++done / tasks.length)));
    Promise.all(tasks).then(() => {
      const wait = reduced ? 0 : Math.max(0, MIN_CEREMONY_MS - (performance.now() - started));
      window.setTimeout(() => setReady(true), wait);
    });

    let entered: string | null = null;
    try {
      entered = sessionStorage.getItem(ENTERED_KEY);
    } catch {
      /* no storage */
    }
    if (entered) {
      // Second visit this session: no ceremony, straight to the writing.
      phaseRef.current = "entering";
      document.documentElement.dataset.phase = "returning";
      tasks[0]!.then(() => begin());
      // begin() calls go(); the state update happens after the chunk loads, not in this effect.
    } else {
      document.documentElement.dataset.phase = "threshold";
    }
    // The sequence starts at the top. Nothing scrolls behind the Threshold or under the vow.
    window.scrollTo(0, 0);
    document.documentElement.classList.add("is-locked");
    return () => {
      writing.current?.kill();
      lenis.current?.destroy();
    };
    // Runs once: the ceremony happens once per page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Any click (or scroll) during the writing finishes it at once. */
  const completeWriting = () => {
    const tl = writing.current;
    if (tl && tl.progress() < 1) tl.progress(1);
  };

  /* ---------- the cut ---------- */

  const arrive = useCallback(
    (scene: HTMLElement) => {
      scene.focus({ preventScroll: true });
      scene.dataset.arrived = "";
      const targets = $$(".blade-label, .stub-title .brush, .stub-line .brush", scene).filter((el) => !written.current.has(el));
      targets.forEach((el) => written.current.add(el));
      if (targets.length) writePhrases(targets, scene.id === "blades" ? 900 : 1300);
    },
    [writePhrases],
  );

  const cutTo = useCallback(
    async (to: HTMLElement, origin: { x: number; y: number }) => {
      const mod = exp.current;
      if (!mod || cuttingRef.current) return;
      const from = $$<HTMLElement>("main [data-scene]").find((s) => {
        const r = s.getBoundingClientRect();
        return r.top <= window.innerHeight / 2 && r.bottom >= window.innerHeight / 2;
      });
      if (!from || from === to) return;
      cuttingRef.current = true;
      setCutting(true);
      document.documentElement.classList.remove("is-breathing");
      const mode = pickCutMode(prefersReducedMotion(), flags.cut.webgl && Boolean(slash.current));
      await mod.runCut({
        from,
        origin,
        mode,
        webgl: slash.current,
        onSlash: () => play("cut"),
        reveal: () => {
          if (phaseRef.current !== "free") {
            go("free");
            lock(false);
          }
          scrollTo(to);
        },
      });
      cuttingRef.current = false;
      setCutting(false);
      arrive(to);
    },
    [arrive, go],
  );

  const continueToHub = useCallback(() => {
    const hub = $("#blades");
    const jade = $("[data-jade]") ?? $("[data-seal]");
    if (hub) void cutTo(hub, jade ? center(jade) : { x: window.innerWidth / 2, y: window.innerHeight / 2 });
  }, [cutTo]);

  /* ---------- entering ---------- */

  const enter = (withSound: boolean) => {
    remember(withSound ? "sound" : "silence");
    if (withSound) void enableSound().then(() => play("drone"));
    if (flags.cut.webgl && pickCutMode(prefersReducedMotion(), true) === "webgl") {
      void import("@/motion/cut/webglSlash").then((m) => (slash.current = m.createWebglSlash()));
    }
    go("entering");
    window.setTimeout(begin, prefersReducedMotion() ? 0 : 450);
  };

  const skip = () => {
    remember("silence");
    const mod = exp.current;
    if (mod) mod.showBrush($$(".brush"));
    $$(".brush").forEach((el) => written.current.add(el));
    startScroll();
    go("free");
    lock(false);
    const hub = $("#blades");
    if (hub) {
      // Wait a frame so the Threshold is gone and the page can scroll.
      requestAnimationFrame(() => {
        scrollTo(hub);
        hub.focus({ preventScroll: true });
      });
    }
  };

  /* ---------- input during the vow ---------- */

  useEffect(() => {
    if (phase !== "writing" && phase !== "sealed") return;
    const advance = () => {
      if (cuttingRef.current) return;
      if (phaseRef.current === "writing") completeWriting();
      else continueToHub();
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 4) advance();
    };
    const onKey = (e: KeyboardEvent) => {
      if (["ArrowDown", "PageDown", "End", " "].includes(e.key) && !(e.target instanceof HTMLButtonElement)) {
        e.preventDefault();
        advance();
      }
    };
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0]?.clientY ?? 0);
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (touchY - (e.touches[0]?.clientY ?? touchY) > 28) {
        touchY = Infinity;
        advance();
      }
    };
    const onPointer = () => {
      if (phaseRef.current === "writing") completeWriting();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [phase, continueToHub]);

  /* ---------- clicks: continue, cuts, blade lines ---------- */

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      if (target.closest("[data-continue]")) {
        e.preventDefault();
        if (phaseRef.current === "writing") completeWriting();
        else if (phaseRef.current === "sealed") continueToHub();
        return;
      }
      const link = target.closest<HTMLAnchorElement>("a[data-cut]");
      if (link && phaseRef.current === "free") {
        const dest = $(link.hash);
        if (!dest) return;
        e.preventDefault();
        const mark = link.querySelector(".blade-stroke") ?? link;
        void cutTo(dest, center(mark));
      }
    };

    const showLine = (blade: Element | null) => {
      const hub = $("#blades");
      const id = blade?.getAttribute("data-blade");
      if (!hub || !id || hub.dataset.line === id) {
        if (hub && id) hub.dataset.active = id;
        return;
      }
      hub.dataset.active = id;
      hub.dataset.line = id;
      lineTl.current?.progress(1).kill();
      const root = $(`[data-blade-line="${id}"] .brush`);
      if (root) lineTl.current = writePhrases([root], 800);
    };
    const onOver = (e: Event) => showLine(e.target instanceof Element ? e.target.closest("[data-blade]") : null);
    const onOut = (e: Event) => {
      const hub = $("#blades");
      const blade = e.target instanceof Element ? e.target.closest("[data-blade]") : null;
      if (hub && blade) delete hub.dataset.active;
    };

    document.addEventListener("click", onClick);
    document.addEventListener("pointerover", onOver);
    document.addEventListener("focusin", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("focusin", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("focusout", onOut);
    };
  }, [continueToHub, cutTo, writePhrases]);

  /* ---------- scenes reached by scrolling get written too ---------- */

  useEffect(() => {
    if (phase !== "free") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !cuttingRef.current) arrive(entry.target as HTMLElement);
        }
      },
      { threshold: 0.45 },
    );
    $$("main [data-scene]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [phase, arrive]);

  const showThreshold = phase === "threshold" || phase === "entering";

  return (
    <>
      {showThreshold && (
        <Threshold progress={progress} ready={ready} leaving={phase === "entering"} onEnter={enter} onSkip={skip} />
      )}
      <main id="content" inert={phase === "threshold"}>
        {children}
      </main>
      <MuteToggle visible={!showThreshold} />
      <BladeCursor trail={!reducedMotion} />
    </>
  );
}
