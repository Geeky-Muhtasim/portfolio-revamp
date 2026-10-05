/*
 * Everything the sequence needs after the first paint, in one chunk that
 * loads while the Threshold boots. Keeps GSAP and Lenis out of the initial
 * bundle. The OGL CRT layer and Howler load later still, and only on choice.
 */
import { gsap } from "./gsap";

export { gsap };
export { createLenis } from "./lenis";
export { clearLines, fillLines, typeLines } from "./typing/typer";
export { glitchSlash } from "./slash/glitchSlash";
export { startParallax } from "./parallax/parallax";

/** The seal lands with weight: oversized, slammed down, and the panel takes the hit. */
export function stampSeal(seal: Element, panel: Element | null) {
  const tl = gsap.timeline();
  tl.fromTo(
    seal,
    { opacity: 0, scale: 2.1, rotation: -18 },
    { opacity: 1, scale: 1, rotation: 0, duration: 0.2, ease: "power4.in" },
  );
  tl.to(seal, { scale: 0.94, duration: 0.05, ease: "power1.out" });
  tl.to(seal, { scale: 1, duration: 0.12, ease: "back.out(3)" });
  if (panel) {
    tl.fromTo(panel, { x: 0, y: 0 }, { x: 3, y: 2, duration: 0.04, ease: "none", repeat: 3, yoyo: true, clearProps: "transform" }, 0.2);
  }
  return tl;
}

export function fadeIn(el: Element, delay = 0, duration = 0.5) {
  return gsap.fromTo(el, { opacity: 0, y: 4 }, { opacity: 1, y: 0, delay, duration, ease: "power2.out" });
}

/** Title cards arrive with one quick cel smear frame. */
export function smearIn(el: Element) {
  return gsap.fromTo(
    el,
    { opacity: 0, x: -36, skewX: -24, scaleX: 1.5, filter: "blur(3px)" },
    { opacity: 1, x: 0, skewX: 0, scaleX: 1, filter: "blur(0px)", duration: 0.22, ease: "steps(3)", clearProps: "filter,transform" },
  );
}
