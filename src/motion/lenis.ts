import Lenis from "lenis";
import { gsap } from "./gsap";

/** Smooth scroll driven by GSAP's ticker, so scroll and choreography share one clock. */
export function createLenis(): Lenis {
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
  const tick = (time: number) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  const destroy = lenis.destroy.bind(lenis);
  lenis.destroy = () => {
    gsap.ticker.remove(tick);
    destroy();
  };
  return lenis;
}
