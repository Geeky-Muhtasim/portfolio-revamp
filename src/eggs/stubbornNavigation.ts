import type { Egg } from "./index";
import { burstDetector } from "./timing";

/**
 * Stubborn navigation: click "Contact" three times within 1.5 seconds and
 * the HUD arrow points the wrong way for 600 ms, then snaps back. A hopeless
 * sense of direction, briefly. The link still does its job.
 */
export const stubbornNavigation: Egg = () => {
  const burst = burstDetector(3, 1500);
  let reset = 0;
  const onClick = (e: MouseEvent) => {
    const link = e.target instanceof Element ? e.target.closest<HTMLElement>(".hud-contact") : null;
    if (!link || !burst(performance.now())) return;
    link.classList.add("is-stubborn");
    window.clearTimeout(reset);
    reset = window.setTimeout(() => link.classList.remove("is-stubborn"), 600);
  };
  document.addEventListener("click", onClick, true);
  return () => {
    window.clearTimeout(reset);
    document.removeEventListener("click", onClick, true);
  };
};
