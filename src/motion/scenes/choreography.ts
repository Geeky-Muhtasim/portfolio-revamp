import type Lenis from "lenis";
import { gsap, loadScrollTrigger } from "../gsap";

/*
 * Scene choreography after the hub. Scroll-scrubbed scenes are tall tracks
 * with a sticky stage (CSS), driven by ScrollTrigger; nothing is pinned, so
 * the slash and Lenis can scroll to any scene directly.
 *
 * With reduced motion (or no JavaScript) none of this runs: every scene is
 * already laid out in its final state as ordinary flowing content. The
 * time of day and the project cards still work, without movement.
 */

type Time = "dawn" | "dusk" | "night";

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

function setTime(time: Time) {
  const world = $(".world");
  if (world && world.dataset.time !== time) world.dataset.time = time;
}

/* ---------- project cards on the circuit board ---------- */

function initCards(): () => void {
  const scene = $("#blade-engineering");
  if (!scene) return () => {};
  let opener: HTMLElement | null = null;

  const close = () => {
    const id = scene.dataset.card;
    if (!id) return;
    delete scene.dataset.card;
    $$(".eng-card.is-open", scene).forEach((c) => c.classList.remove("is-open"));
    $$("[data-card-open]", scene).forEach((b) => b.setAttribute("aria-expanded", "false"));
    opener?.focus({ preventScroll: true });
    opener = null;
  };
  const open = (button: HTMLElement) => {
    const id = button.dataset.cardOpen!;
    if (scene.dataset.card === id) return close();
    $$(".eng-card.is-open", scene).forEach((c) => c.classList.remove("is-open"));
    scene.dataset.card = id;
    $$("[data-card-open]", scene).forEach((b) => b.setAttribute("aria-expanded", String(b === button)));
    opener = button;
    const card = $(`[data-card="${id}"]`, scene);
    card?.classList.add("is-open");
    card?.setAttribute("tabindex", "-1");
    card?.focus({ preventScroll: true });
  };

  const onClick = (e: MouseEvent) => {
    const target = e.target instanceof Element ? e.target : null;
    const button = target?.closest<HTMLElement>("[data-card-open]");
    if (button && scene.contains(button)) return open(button);
    if (target?.closest("[data-card-close]")) return close();
    // A click on the board outside any card closes the open one.
    if (scene.dataset.card && target && scene.contains(target) && !target.closest(".eng-card")) close();
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape" && scene.dataset.card) close();
  };
  document.addEventListener("click", onClick);
  document.addEventListener("keydown", onKey);
  return () => {
    document.removeEventListener("click", onClick);
    document.removeEventListener("keydown", onKey);
  };
}

/* ---------- the CRT powers off at the very end ---------- */

function initPowerOff(): () => void {
  const root = document.documentElement;
  const wake = () => {
    if (!root.classList.contains("is-powered-off")) return;
    root.classList.remove("is-powered-off");
  };
  const events = ["wheel", "keydown", "pointerdown", "touchstart"] as const;
  events.forEach((t) => window.addEventListener(t, wake, { passive: true }));
  return () => events.forEach((t) => window.removeEventListener(t, wake));
}

/* ---------- everything ---------- */

export async function initScenes({ lenis, reduced }: { lenis: Lenis | null; reduced: boolean }): Promise<() => void> {
  const ScrollTrigger = await loadScrollTrigger();
  const cleanups: Array<() => void> = [initCards()];
  const root = document.documentElement;

  if (lenis) {
    const update = () => ScrollTrigger.update();
    lenis.on("scroll", update);
    cleanups.push(() => lenis.off("scroll", update));
  }

  // Time of day: each scene that names a time sets it while it holds the middle of the screen.
  for (const scene of $$("main [data-scene]")) {
    if (scene.id === "road") continue;
    ScrollTrigger.create({
      trigger: scene,
      start: "top 50%",
      end: "bottom 50%",
      onToggle: (self) => self.isActive && setTime((scene.dataset.time as Time) ?? "dusk"),
    });
  }

  if (reduced) {
    // Still honour the time of day on the road, without any movement.
    const road = $("#road");
    if (road) ScrollTrigger.create({ trigger: road, start: "top 50%", end: "bottom 50%", onToggle: (s) => s.isActive && setTime("dusk") });
    return () => {
      cleanups.forEach((c) => c());
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }

  root.classList.add("scrub");
  cleanups.push(() => root.classList.remove("scrub"), initPowerOff());
  const scrub = (trigger: Element, tl: gsap.core.Timeline) =>
    ScrollTrigger.create({ trigger, start: "top top", end: "bottom bottom", scrub: 0.5, animation: tl, invalidateOnRefresh: true });

  /* Research: the counters tick up once. */
  for (const count of $$(".scene-research .count")) {
    const target = Number(count.dataset.count ?? 0);
    const width = Number(count.dataset.width ?? 2);
    const state = { n: 0 };
    count.textContent = "0".padStart(width, "0");
    ScrollTrigger.create({
      trigger: count,
      start: "top 85%",
      once: true,
      onEnter: () =>
        gsap.to(state, {
          n: target,
          duration: 1.4,
          ease: "power2.out",
          onUpdate: () => (count.textContent = String(Math.round(state.n)).padStart(width, "0")),
        }),
    });
  }

  /* Engineering: paper in, the slash, traces, the board. On a phone the board is a plain grid. */
  const eng = $("#blade-engineering .track");
  if (eng && window.matchMedia("(min-width: 900px)").matches) {
    const tl = gsap.timeline();
    const papers = $$(".eng-paper", eng);
    tl.fromTo(papers, { x: -900, rotation: -24, opacity: 0 }, { x: 0, rotation: 0, opacity: 1, duration: 0.24, stagger: 0.02, ease: "power2.out" }, 0);
    tl.fromTo(".eng-slash", { scaleX: 0, rotation: -20, opacity: 1 }, { scaleX: 1, rotation: -20, duration: 0.05, ease: "power2.in" }, 0.3);
    tl.to(papers, { opacity: 0, scale: 0.5, y: (i) => (i % 2 ? 40 : -40), duration: 0.12, stagger: 0.01 }, 0.36);
    tl.to(".eng-slash", { opacity: 0, duration: 0.06 }, 0.38);
    tl.fromTo(".eng-trace", { attr: { "stroke-dashoffset": 1 } }, { attr: { "stroke-dashoffset": 0 }, duration: 0.3, stagger: 0.012, ease: "none" }, 0.42);
    tl.fromTo(".eng-via", { opacity: 0 }, { opacity: 1, duration: 0.05, stagger: 0.01 }, 0.6);
    tl.fromTo(".eng-node-wrap", { scale: 0.4, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.12, stagger: 0.015, ease: "back.out(2)" }, 0.55);
    tl.to({}, { duration: 0.1 });
    scrub(eng, tl);
  }

  /* Security: night, rain, the slash, one incident left glowing. */
  const sec = $("#blade-security .track");
  if (sec) {
    const tl = gsap.timeline();
    $$(".sec-col", sec).forEach((col, i) => {
      tl.fromTo(col, { yPercent: -55 - (i % 3) * 8 }, { yPercent: 5 + (i % 2) * 6, duration: 1, ease: "none" }, 0);
    });
    tl.fromTo(".sec-slash", { scaleX: 0, rotation: -20, opacity: 1 }, { scaleX: 1, rotation: -20, duration: 0.05, ease: "power2.in" }, 0.5);
    tl.to(".sec-rain", { opacity: 0.16, duration: 0.08 }, 0.56);
    tl.to(".sec-slash", { opacity: 0, duration: 0.08 }, 0.58);
    tl.fromTo(".sec-incident", { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1, duration: 0.08, ease: "back.out(2)" }, 0.57);
    scrub(sec, tl);
  }

  /* The Road: the line runs sideways on desktop while the sun crosses the sky. */
  const road = $("#road .track");
  const world = $(".world");
  if (road) {
    const line = $(".road-line", road)!;
    const sideways = window.matchMedia("(min-width: 900px)").matches;
    const tl = gsap.timeline();
    if (sideways) tl.to(line, { x: () => -(line.scrollWidth - (line.parentElement?.clientWidth ?? window.innerWidth)), duration: 1, ease: "none" }, 0);
    else tl.to({}, { duration: 1 });
    ScrollTrigger.create({
      trigger: road,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.5,
      animation: tl,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p = self.progress;
        setTime(p < 0.3 ? "dawn" : p < 0.72 ? "dusk" : "night");
        // The sun rises at the left, crosses, and sets at the right.
        world?.style.setProperty("--sun-x", `${16 + p * 64}%`);
        world?.style.setProperty("--sun-lift", `${Math.sin(Math.min(p, 0.85) / 0.85 * Math.PI).toFixed(3)}`);
      },
      onToggle: (self) => {
        if (!self.isActive) {
          world?.style.removeProperty("--sun-x");
          world?.style.removeProperty("--sun-lift");
        }
      },
    });
  }

  /*
   * Crew: the credits roll up through their window. They enter from its
   * bottom edge and stop with the last name in the middle, so every name
   * can be read and hovered; they never pass over the title above.
   */
  const crew = $("#crew .track");
  if (crew) {
    const list = $(".credits", crew)!;
    const view = $(".credits-window", crew)!;
    const last = list.lastElementChild as HTMLElement | null;
    const tl = gsap.timeline();
    tl.fromTo(
      list,
      { y: () => view.clientHeight * 0.85 },
      { y: () => view.clientHeight * 0.5 - ((last?.offsetTop ?? list.offsetHeight) + (last?.offsetHeight ?? 0) / 2), duration: 1, ease: "none" },
    );
    scrub(crew, tl);
  }

  /*
   * Cross Blades: the CRT powers off only after the visitor has scrolled
   * through the empty run-out below the last panel, never while the panel
   * is being read. It fires once; any input turns the picture back on; it
   * re-arms only after scrolling back up above the run-out, so momentum or a
   * phone's address bar resizing the viewport cannot make it flicker.
   */
  const runout = $("#cross-blades .cross-runout");
  if (runout) {
    let armed = true;
    ScrollTrigger.create({
      trigger: runout,
      start: "bottom bottom+=2",
      onEnter: () => {
        if (!armed) return;
        armed = false;
        root.classList.add("is-powered-off");
      },
    });
    ScrollTrigger.create({
      trigger: runout,
      start: "top bottom",
      onLeaveBack: () => {
        armed = true;
        root.classList.remove("is-powered-off");
      },
    });
  }

  // A phone's address bar showing and hiding is not a layout change worth re-measuring.
  ScrollTrigger.config({ ignoreMobileResize: true });
  ScrollTrigger.refresh();
  return () => {
    cleanups.forEach((c) => c());
    ScrollTrigger.getAll().forEach((t) => t.kill());
  };
}
