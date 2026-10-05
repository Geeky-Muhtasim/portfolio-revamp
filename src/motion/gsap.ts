import { gsap } from "gsap";

/*
 * One place to register GSAP. Core only for now: the prototype has no
 * scroll-scrubbed scenes. ScrollTrigger is registered on demand so it stays
 * out of the bundle until a scene needs it.
 */

gsap.defaults({ overwrite: "auto" });
gsap.config({ nullTargetWarn: false });

export async function loadScrollTrigger() {
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);
  return ScrollTrigger;
}

export { gsap };
