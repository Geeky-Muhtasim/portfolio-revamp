import { hasFinePointer, isMobileLayout } from "@/motion/device";
import type { Egg } from "./index";

const HOLD_MS = 3000;
/** Holding on anything a visitor might be reading or using is not "holding on empty space". */
const NOT_EMPTY = "a, button, input, select, textarea, label, summary, details, [role='button'], p, h1, h2, h3, h4, li, dt, dd, time, code";

/**
 * The focus cut (desktop only): press and hold on empty space for three
 * seconds and crimson light gathers at the reticle; release, and one
 * perfect slash sweeps the page through the point of release, leaving the
 * visitor exactly where they were. Off with reduced motion and on touch.
 */
export const focusCut: Egg = (ctx) => {
  if (!hasFinePointer() || isMobileLayout()) return () => {};
  const root = document.documentElement;
  let start = 0;
  let raf = 0;
  let charging = false;
  let charged = false;
  let stopSound: () => void = () => {};

  const reticle = () => document.querySelector<HTMLElement>(".reticle");

  const end = () => {
    charging = false;
    cancelAnimationFrame(raf);
    stopSound();
    root.classList.remove("is-charging");
    const r = reticle();
    r?.classList.remove("is-charged");
    r?.style.setProperty("--charge", "0");
  };

  const tick = () => {
    const p = Math.min(1, (performance.now() - start) / HOLD_MS);
    reticle()?.style.setProperty("--charge", p.toFixed(3));
    if (p >= 1 && !charged) {
      charged = true;
      reticle()?.classList.add("is-charged");
    }
    if (charging) raf = requestAnimationFrame(tick);
  };

  const onDown = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || ctx.reduced() || !ctx.isFree() || ctx.busy()) return;
    const target = e.target instanceof Element ? e.target : null;
    if (!target || target.closest(NOT_EMPTY)) return;
    e.preventDefault(); // no text selection while the blade charges
    charging = true;
    charged = false;
    start = performance.now();
    root.classList.add("is-charging");
    stopSound = ctx.play("charge");
    raf = requestAnimationFrame(tick);
  };

  const onUp = (e: PointerEvent) => {
    if (!charging) return;
    const release = charged;
    end();
    if (release) void ctx.slashHere({ x: e.clientX, y: e.clientY });
  };

  const onCancel = () => charging && end();
  const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();

  window.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onCancel);
  window.addEventListener("blur", onCancel);
  window.addEventListener("keydown", onKey);
  return () => {
    end();
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
    window.removeEventListener("blur", onCancel);
    window.removeEventListener("keydown", onKey);
  };
};
