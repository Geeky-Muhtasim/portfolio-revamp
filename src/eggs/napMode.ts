import { eggCopy } from "@/config/site";
import type { Egg } from "./index";

const NAP_AFTER_MS = 60_000;
const INPUTS = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

/**
 * Nap mode: after a minute without input the CRT dims into a screensaver
 * and "zzz" types itself, over and over. Any input wakes it at once.
 * With reduced motion the dim is instant and the "zzz" simply sits there.
 */
export const napMode: Egg = (ctx) => {
  const root = document.documentElement;
  let timer = 0;
  let typing = 0;
  let screen: HTMLElement | null = null;

  const arm = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(sleep, NAP_AFTER_MS);
  };

  function sleep() {
    // Not before the vow is done, not mid-slash, not while the CRT is already off.
    if (!ctx.isFree() || ctx.busy() || root.classList.contains("is-powered-off")) return arm();
    screen = document.createElement("div");
    screen.className = "nap";
    screen.setAttribute("aria-hidden", "true");
    const line = document.createElement("p");
    line.className = "nap-line";
    const z = document.createElement("span");
    const cursor = document.createElement("i");
    cursor.className = "term-cursor";
    line.append(z, cursor);
    screen.append(line);
    document.body.append(screen);
    root.classList.add("is-napping");
    if (ctx.reduced()) {
      z.textContent = eggCopy.nap;
      return;
    }
    let n = 0;
    typing = window.setInterval(() => {
      n = (n + 1) % (eggCopy.nap.length + 2);
      z.textContent = eggCopy.nap.slice(0, Math.min(n, eggCopy.nap.length));
    }, 520);
  }

  const wake = () => {
    if (screen) {
      window.clearInterval(typing);
      screen.remove();
      screen = null;
      root.classList.remove("is-napping");
    }
    arm();
  };

  INPUTS.forEach((t) => window.addEventListener(t, wake, { passive: true, capture: true }));
  arm();
  return () => {
    window.clearTimeout(timer);
    INPUTS.forEach((t) => window.removeEventListener(t, wake, { capture: true }));
    if (screen) {
      window.clearInterval(typing);
      screen.remove();
      root.classList.remove("is-napping");
    }
  };
};
