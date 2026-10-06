"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type Lenis from "lenis";
import { flags, ui } from "@/config/site";
import type { CrtLayer } from "@/motion/crt/webglCrt";
import { Reticle } from "@/motion/cursor/Reticle";
import { pickCutMode } from "@/motion/device";
import { useIdleDrift } from "@/motion/drift/useIdleDrift";
import { MuteToggle } from "@/motion/sound/MuteToggle";
import { enableSound, play } from "@/motion/sound/sound";
import { motion } from "@/motion/tokens";
import type { Typing } from "@/motion/typing/typer";
import { prefersReducedMotion, useReducedMotion } from "@/motion/useReducedMotion";
import { StatusLine } from "@/hud/StatusLine";
import { Threshold } from "./01-threshold/Threshold";

/*
 * The director. Runs one continuous sequence:
 *   threshold -> entering -> typing -> sealed -> (the slash) -> free
 * Scenes are server-rendered children; this component only adds motion,
 * found through data attributes. Without JavaScript, everything is simply
 * there, fully typed.
 */

type Phase = "threshold" | "entering" | "typing" | "sealed" | "free";
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

/** The scene holding the middle of the screen. */
function sceneOnScreen() {
  return $$<HTMLElement>("main [data-scene]").find((s) => {
    const r = s.getBoundingClientRect();
    return r.top <= window.innerHeight / 2 && r.bottom >= window.innerHeight / 2;
  });
}

function center(el: Element) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function Sequence({ city, children }: { city: string; children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("threshold");
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [slashing, setSlashing] = useState(false);

  const exp = useRef<Experience | null>(null);
  const lenis = useRef<Lenis | null>(null);
  const crt = useRef<CrtLayer | null>(null);
  const vowTyping = useRef<Typing | null>(null);
  const lineTyping = useRef<Typing | null>(null);
  const stopParallax = useRef<(() => void) | null>(null);
  const stopScenes = useRef<(() => void) | null>(null);
  const scenesStarted = useRef(false);
  const stopEggs = useRef<(() => void) | null>(null);
  const eggsStarted = useRef(false);
  const arrived = useRef(new WeakSet<Element>());
  const phaseRef = useRef<Phase>("threshold");
  const slashingRef = useRef(false);

  const go = useCallback((next: Phase) => {
    phaseRef.current = next;
    document.documentElement.dataset.phase = next;
    setPhase(next);
  }, []);

  useIdleDrift(!reducedMotion && !slashing && (phase === "sealed" || phase === "free"));

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => crt.current?.setRolling(root.classList.contains("is-drifting"));
    const mo = new MutationObserver(sync);
    mo.observe(root, { attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  /* ---------- scroll and parallax ---------- */

  const startScroll = useCallback(() => {
    const mod = exp.current;
    if (!mod) return;
    const reduced = prefersReducedMotion();
    if (!reduced) {
      if (!lenis.current) {
        lenis.current = mod.createLenis();
        lenis.current.stop();
      }
      stopParallax.current ??= mod.startParallax();
    }
    if (!scenesStarted.current) {
      scenesStarted.current = true;
      void mod.initScenes({ lenis: lenis.current, reduced }).then((stop) => (stopScenes.current = stop));
    }
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

  /* ---------- typing ---------- */

  const tick = useCallback(() => {
    let n = 0;
    return () => {
      if (n++ % 3 === 0) play("tick");
    };
  }, []);

  const typeQuick = useCallback(
    (containers: Element[], durationMs: number) => {
      const mod = exp.current;
      if (!mod || !containers.length) return null;
      if (prefersReducedMotion()) {
        mod.fillLines(containers);
        return null;
      }
      const typing = mod.typeLines(containers, { durationMs, lineGap: 2, onKey: tick() });
      typing.timeline.play();
      return typing;
    },
    [tick],
  );

  const seal = useCallback(() => {
    const mod = exp.current;
    if (!mod) return;
    if (!prefersReducedMotion()) {
      const sealEl = $("[data-seal]");
      if (sealEl) mod.stampSeal(sealEl, $("[data-panel]"));
      const subline = $("[data-subline]");
      const cont = $("[data-continue]");
      if (subline) mod.fadeIn(subline, 0.45, 0.6);
      if (cont) mod.fadeIn(cont, 1.1, 0.5);
    }
    go("sealed");
  }, [go]);

  const begin = useCallback(() => {
    const mod = exp.current;
    if (!mod) return;
    startScroll();
    lock(true);
    $("#vow")?.focus({ preventScroll: true });
    const lines = $$("#vow [data-type-line]");
    if (prefersReducedMotion()) {
      mod.fillLines(lines);
      seal();
      return;
    }
    go("typing");
    vowTyping.current = mod.typeLines(lines, {
      durationMs: motion.vowTypeMs,
      cursor: $("#vow .term-cursor"),
      onKey: tick(),
      onDone: seal,
    });
    vowTyping.current.timeline.play();
  }, [go, seal, startScroll, tick]);

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
          // Everything that will be typed is blanked, unseen behind the Threshold.
          mod.clearLines($$("main [data-type-line]"));
        }
      }),
      document.fonts.ready,
      document.readyState === "complete" ? Promise.resolve() : new Promise((r) => window.addEventListener("load", r, { once: true })),
    ];
    // The blade is drawn by real loading, but never faster than the ceremony's minimum.
    let real = 0;
    let frame = 0;
    const draw = () => {
      const paced = reduced ? 1 : Math.min(1, (performance.now() - started) / MIN_CEREMONY_MS);
      setProgress(Math.min(real, paced));
      if (Math.min(real, paced) < 1) frame = requestAnimationFrame(draw);
    };
    tasks.forEach((t) =>
      t.then(() => {
        real = ++done / tasks.length;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(draw);
      }),
    );
    Promise.all(tasks).then(() => {
      const wait = reduced ? 0 : Math.max(0, MIN_CEREMONY_MS - (performance.now() - started)) + 120;
      window.setTimeout(() => setReady(true), wait);
    });

    let entered: string | null = null;
    try {
      entered = sessionStorage.getItem(ENTERED_KEY);
    } catch {
      /* no storage */
    }
    if (entered) {
      // Second visit this session: no ceremony, straight to the typing.
      phaseRef.current = "entering";
      document.documentElement.dataset.phase = "returning";
      tasks[0]!.then(() => begin());
    } else {
      document.documentElement.dataset.phase = "threshold";
    }
    // The sequence starts at the top. Nothing scrolls behind the Threshold or under the vow.
    window.scrollTo(0, 0);
    document.documentElement.classList.add("is-locked");
    return () => {
      vowTyping.current?.timeline.kill();
      lenis.current?.destroy();
      stopParallax.current?.();
      stopScenes.current?.();
      crt.current?.destroy();
    };
    // Runs once: the ceremony happens once per page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Any click (or scroll) during the typing finishes it at once. */
  const completeTyping = () => vowTyping.current?.finish();

  /* ---------- arriving at a scene ---------- */

  /** A scene arrives: its title card smears in and its line types. Focus moves only after a slash. */
  const arrive = useCallback(
    (scene: HTMLElement, focus = false) => {
      if (focus) scene.focus({ preventScroll: true });
      if (arrived.current.has(scene)) return;
      arrived.current.add(scene);
      const mod = exp.current;
      if (!mod) return;
      const title = $("[data-smear]", scene);
      if (title && !prefersReducedMotion()) mod.smearIn(title);
      const lines = $$("[data-type-line]", scene).filter((l) => !l.closest(".hud-lines"));
      if (lines.length) window.setTimeout(() => typeQuick(lines, 900), prefersReducedMotion() ? 0 : 220);
    },
    [typeQuick],
  );

  /* ---------- the glitch slash ---------- */

  const slashTo = useCallback(
    async (to: HTMLElement, origin: { x: number; y: number }) => {
      const mod = exp.current;
      if (!mod || slashingRef.current) return;
      const from = sceneOnScreen();
      if (!from || from === to) return;
      slashingRef.current = true;
      setSlashing(true);
      document.documentElement.classList.remove("is-drifting");
      const mode = pickCutMode(prefersReducedMotion(), flags.crt.webgl);
      await mod.glitchSlash({
        from,
        origin,
        mode,
        onImpact: () => play("slash"),
        intensity: (v) => crt.current?.setIntensity(v),
        reveal: () => {
          if (phaseRef.current !== "free") {
            go("free");
            lock(false);
          }
          scrollTo(to);
        },
      });
      slashingRef.current = false;
      setSlashing(false);
      arrive(to, true);
    },
    [arrive, go],
  );

  /** The slash out of the vow lands on "kept._". */
  const continueToHub = useCallback(() => {
    const hub = $("#blades");
    const mark = $("#vow .kept") ?? $("[data-seal]");
    if (hub) void slashTo(hub, mark ? center(mark) : { x: window.innerWidth / 2, y: window.innerHeight / 2 });
  }, [slashTo]);

  /* ---------- entering ---------- */

  const enter = (withSound: boolean) => {
    remember(withSound ? "sound" : "silence");
    if (withSound) void enableSound().then(() => play("power"));
    if (flags.crt.webgl && pickCutMode(prefersReducedMotion(), true) === "webgl") {
      void import("@/motion/crt/webglCrt").then((m) => (crt.current = m.createWebglCrt()));
    }
    go("entering");
    window.setTimeout(begin, prefersReducedMotion() ? 0 : 420);
  };

  const skip = () => {
    remember("silence");
    exp.current?.fillLines($$("main [data-type-line]"));
    $$("main [data-scene]").forEach((s) => s.id !== "blades" && arrived.current.add(s));
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
    if (phase !== "typing" && phase !== "sealed") return;
    const advance = () => {
      if (slashingRef.current) return;
      if (phaseRef.current === "typing") completeTyping();
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
      if (phaseRef.current === "typing") completeTyping();
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

  /* ---------- the hub menu, slashes on click ---------- */

  useEffect(() => {
    const hub = () => $("#blades");
    const items = () => $$<HTMLAnchorElement>("#blades .hud-item");

    /** One active blade at most; its line shows only while it is active. */
    const activate = (item: Element | null) => {
      const h = hub();
      if (!h) return;
      const id = item?.getAttribute("data-blade") ?? null;
      if ((h.dataset.active ?? null) === id) return;
      lineTyping.current?.finish();
      if (!id) {
        delete h.dataset.active;
        return;
      }
      h.dataset.active = id;
      const line = $(`[data-blade-line="${id}"]`, h);
      if (line) lineTyping.current = typeQuick([line], 420);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target instanceof Element ? e.target : null;
      if (!target) return;
      if (target.closest("[data-continue]")) {
        e.preventDefault();
        if (phaseRef.current === "typing") completeTyping();
        else continueToHub();
        return;
      }
      const link = target.closest<HTMLAnchorElement>("a[data-cut]");
      if (link && phaseRef.current === "free") {
        const dest = $(link.hash);
        if (!dest) return;
        e.preventDefault();
        // The slash lands on the chosen item itself.
        void slashTo(dest, center(link));
      }
    };
    const onOver = (e: Event) => {
      const item = e.target instanceof Element ? e.target.closest("#blades .hud-item") : null;
      if (item) activate(item);
    };
    const onOut = (e: PointerEvent) => {
      const from = e.target instanceof Element ? e.target.closest("#blades .hud-item") : null;
      const to = e.relatedTarget instanceof Element ? e.relatedTarget.closest("#blades .hud-item") : null;
      if (from && !to) activate(document.activeElement?.closest("#blades .hud-item") ?? null);
    };
    const onFocusIn = (e: FocusEvent) => {
      const item = e.target instanceof Element ? e.target.closest("#blades .hud-item") : null;
      if (item) activate(item);
    };
    const onFocusOut = (e: FocusEvent) => {
      const to = e.relatedTarget instanceof Element ? e.relatedTarget.closest("#blades .hud-item") : null;
      const hovered = $("#blades .hud-item:hover");
      if (!to) activate(hovered);
    };
    const onKey = (e: KeyboardEvent) => {
      if (phaseRef.current !== "free" || !["ArrowDown", "ArrowUp"].includes(e.key)) return;
      const h = hub();
      const list = items();
      const inHub = h && (document.activeElement === h || h.contains(document.activeElement));
      if (!h || !inHub || !list.length) return;
      e.preventDefault();
      const current = list.indexOf(document.activeElement as HTMLAnchorElement);
      const step = e.key === "ArrowDown" ? 1 : -1;
      const next = current < 0 ? (step > 0 ? 0 : list.length - 1) : (current + step + list.length) % list.length;
      list[next]!.focus();
    };

    document.addEventListener("click", onClick);
    document.addEventListener("pointerover", onOver);
    document.addEventListener("pointerout", onOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerover", onOver);
      document.removeEventListener("pointerout", onOut);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      document.removeEventListener("keydown", onKey);
    };
  }, [continueToHub, slashTo, typeQuick]);

  /* ---------- scenes reached by scrolling arrive too ---------- */

  useEffect(() => {
    if (phase !== "free") return;
    // A scene arrives once it fills half the screen (tall scroll scenes never reach half their own height).
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRect.height >= window.innerHeight * 0.5 && !slashingRef.current) arrive(entry.target as HTMLElement);
        }
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );
    $$("main [data-scene]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [phase, arrive]);

  /* ---------- easter eggs: loaded once the Threshold is passed ---------- */

  useEffect(() => {
    if (phase === "threshold" || eggsStarted.current) return;
    eggsStarted.current = true;
    void import("@/eggs").then(({ createEggContext, installEggs }) => {
      stopEggs.current = installEggs(
        createEggContext({
          exp: () => exp.current,
          lenis: () => lenis.current,
          crtIntensity: (v) => crt.current?.setIntensity(v),
          reduced: prefersReducedMotion,
          play,
          tick,
          isFree: () => phaseRef.current === "free",
          busy: () => slashingRef.current,
          setBusy: (on) => {
            slashingRef.current = on;
            setSlashing(on);
          },
          vowTyping,
        }),
      );
    });
  }, [phase, tick]);

  useEffect(() => () => stopEggs.current?.(), []);

  const showThreshold = phase === "threshold" || phase === "entering";

  return (
    <>
      {showThreshold && (
        <Threshold progress={progress} ready={ready} leaving={phase === "entering"} onEnter={enter} onSkip={skip} />
      )}
      <main id="content" inert={phase === "threshold"}>
        {children}
      </main>
      <div className="hud" data-visible={showThreshold ? undefined : ""}>
        <StatusLine city={city} />
        <div className="hud-tr">
          {/* Contact: a slash straight to Cross Blades, once the visitor is past the vow. */}
          <a
            href="#cross-blades"
            className="hud-contact"
            data-cut=""
            data-visible={phase === "free" ? "" : undefined}
            tabIndex={phase === "free" ? 0 : -1}
          >
            {ui.contact}
            <i className="hud-arrow" aria-hidden="true" />
          </a>
          <MuteToggle visible={!showThreshold} />
        </div>
      </div>
      <Reticle />
    </>
  );
}
