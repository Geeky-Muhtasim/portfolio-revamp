/*
 * Everything the sequence needs after the first paint, in one chunk that
 * loads while the Threshold draws its blade. Keeps GSAP and Lenis out of
 * the initial bundle. OGL and Howler load later still, and only on choice.
 */
import { gsap } from "./gsap";

export { gsap };
export { createLenis } from "./lenis";
export { hideBrush, showBrush, writeBrush } from "./brush/writer";
export { runCut } from "./cut/runCut";

/** The seal lands: a quick press with a little give, as ink meets paper. */
export function stampSeal(seal: Element) {
  return gsap.fromTo(
    seal,
    { opacity: 0, scale: 1.35, rotation: -7, filter: "blur(2px)" },
    { opacity: 1, scale: 1, rotation: -3, filter: "blur(0px)", duration: 0.22, ease: "power4.in", clearProps: "filter" },
  );
}

export function fadeIn(el: Element, delay = 0, duration = 0.6) {
  return gsap.fromTo(el, { opacity: 0, y: 6 }, { opacity: 1, y: 0, delay, duration, ease: "power2.out" });
}

export function hide(el: Element | Element[]) {
  gsap.set(el, { opacity: 0 });
}

export function show(el: Element | Element[]) {
  gsap.set(el, { opacity: 1, clearProps: "transform" });
}
