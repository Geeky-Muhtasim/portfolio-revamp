import type { Egg } from "./index";
import { burstDetector } from "./timing";

/**
 * Triple seal: click a seal three times and three rapid slashes cut
 * through it, then it stamps again. With reduced motion the seal simply
 * stays put; there is no cinematic to swap in.
 */
export const tripleSeal: Egg = (ctx) => {
  const burst = burstDetector(3, 1500);
  let running = false;

  const onClick = async (e: MouseEvent) => {
    const seal = e.target instanceof Element ? e.target.closest<HTMLElement>("[data-seal-button]") : null;
    if (!seal || !burst(performance.now()) || running || ctx.busy() || ctx.reduced()) return;
    running = true;
    const r = seal.getBoundingClientRect();
    const c = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    // Three cuts, each a little off the last, as fast as the slash allows.
    for (const [dx, dy] of [[0, 0], [-26, 14], [24, -12]] as const) {
      await ctx.slashHere({ x: c.x + dx, y: c.y + dy });
    }
    const slot = seal.closest(".seal-slot");
    if (slot) ctx.stamp(slot);
    running = false;
  };

  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
};
