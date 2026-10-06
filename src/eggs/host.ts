import type Lenis from "lenis";
import { flags } from "@/config/site";
import { pickCutMode } from "@/motion/device";
import { motion } from "@/motion/tokens";
import type { Typing } from "@/motion/typing/typer";
import type { EggContext } from "./index";

/*
 * What the director lends the eggs, and the two larger moves built from it
 * (a slash in place, and the reboot at dawn). Kept here, in the lazy egg
 * chunk, so none of it weighs on the first load.
 */

type Experience = typeof import("@/motion/experience");

export interface EggHost {
  exp: () => Experience | null;
  lenis: () => Lenis | null;
  crtIntensity: (v: number) => void;
  reduced: () => boolean;
  play: EggContext["play"];
  /** A fresh key-tick counter for typing. */
  tick: () => () => void;
  isFree: () => boolean;
  busy: () => boolean;
  setBusy: (on: boolean) => void;
  vowTyping: { current: Typing | null };
}

const $ = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel);
const $$ = <T extends Element = HTMLElement>(sel: string) => [...document.querySelectorAll<T>(sel)];

/** The scene holding the middle of the screen. */
function sceneOnScreen() {
  return $$("main [data-scene]").find((s) => {
    const r = s.getBoundingClientRect();
    return r.top <= window.innerHeight / 2 && r.bottom >= window.innerHeight / 2;
  });
}

export function createEggContext(host: EggHost): EggContext {
  const root = document.documentElement;

  /** One slash through the scene on screen; the visitor stays where they are. */
  const slashHere = async (origin: { x: number; y: number }) => {
    const mod = host.exp();
    const from = sceneOnScreen();
    if (!mod || !from || host.busy()) return;
    host.setBusy(true);
    root.classList.remove("is-drifting");
    await mod.glitchSlash({
      from,
      origin,
      mode: pickCutMode(host.reduced(), flags.crt.webgl),
      onImpact: () => host.play("slash"),
      intensity: host.crtIntensity,
      reveal: () => {},
    });
    host.setBusy(false);
  };

  /** Endless road: the tube warms up again at dawn, back at the vow, and the vow is typed anew. */
  const reboot = () => {
    const mod = host.exp();
    const vow = $("#vow");
    if (!mod || !vow) return;
    root.classList.remove("is-powered-off");
    host.play("power");

    const tube = document.createElement("div");
    tube.className = "reboot";
    tube.setAttribute("aria-hidden", "true");
    for (const part of ["cover-top", "cover-bottom", "tube-flash"]) {
      const i = document.createElement("i");
      i.className = part;
      tube.append(i);
    }
    document.body.append(tube);
    window.setTimeout(() => tube.remove(), 900);

    // Scroll is held while the tube warms, so the wheel that rebooted it (and
    // any trackpad momentum behind it) cannot carry the visitor past the vow.
    const lenis = host.lenis();
    root.classList.add("is-locked");
    lenis?.stop();
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
    else window.scrollTo({ top: 0, behavior: "instant" });
    vow.focus({ preventScroll: true });
    window.setTimeout(() => {
      root.classList.remove("is-locked");
      lenis?.start();
    }, 1200);
    // After the jump settles, so the scroll triggers do not paint it back to dusk.
    window.setTimeout(() => {
      const world = $(".world");
      if (world) world.dataset.time = "dawn";
    }, 120);

    const seal = $("[data-seal]");
    if (seal) mod.gsap.set(seal, { opacity: 0 });
    host.vowTyping.current?.finish();
    const typing = mod.typeLines($$("#vow [data-type-line]"), {
      durationMs: motion.vowTypeMs,
      cursor: $("#vow .term-cursor"),
      onKey: host.tick(),
      onDone: () => seal && mod.stampSeal(seal, $("[data-panel]")),
    });
    host.vowTyping.current = typing;
    typing.timeline.delay(0.5).play();
  };

  return {
    reduced: host.reduced,
    play: host.play,
    slashHere,
    stamp: (slot) => host.exp()?.stampSeal(slot, slot.closest(".crt-panel")),
    isFree: host.isFree,
    busy: host.busy,
    reboot,
  };
}
