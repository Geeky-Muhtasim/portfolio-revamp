import type { Egg } from "./index";
import { wheelPixels } from "./timing";

/**
 * Endless road: after the CRT powers off at the end of Cross Blades, keep
 * scrolling down for two more screens and it reboots at dawn, back at the
 * vow. Scrolling up (or a click, or most keys) turns the picture back on
 * instead. While the screen is dark, the dot grows with the distance
 * scrolled, so the road shows it is still there.
 *
 * Installing this egg takes over waking from the CRT (data-endless), so
 * a downward scroll in the dark counts toward the reboot instead.
 */
export const endlessRoad: Egg = (ctx) => {
  const root = document.documentElement;
  root.dataset.endless = "";
  let distance = 0;
  let touchY = 0;

  const off = () => root.classList.contains("is-powered-off");
  const need = () => window.innerHeight * 2;
  const show = () => root.style.setProperty("--reboot", Math.min(1, distance / need()).toFixed(3));

  const wake = () => {
    distance = 0;
    show();
    root.classList.remove("is-powered-off");
  };
  const travel = (px: number) => {
    distance += px;
    show();
    if (distance >= need()) {
      distance = 0;
      show();
      ctx.reboot();
    }
  };

  const onWheel = (e: WheelEvent) => {
    if (!off()) return;
    const px = wheelPixels(e, window.innerHeight);
    if (px > 0) travel(px);
    else if (px < 0) wake();
  };
  const onKey = (e: KeyboardEvent) => {
    if (!off()) return;
    if (["ArrowDown", "PageDown", "End", " "].includes(e.key)) travel(window.innerHeight * 0.5);
    else if (!["Shift", "Control", "Alt", "Meta"].includes(e.key)) wake();
  };
  const onTouchStart = (e: TouchEvent) => (touchY = e.touches[0]?.clientY ?? 0);
  const onTouchMove = (e: TouchEvent) => {
    if (!off()) return;
    const y = e.touches[0]?.clientY ?? touchY;
    const dy = touchY - y;
    touchY = y;
    if (dy > 0) travel(dy * 1.5);
    else if (dy < -2) wake();
  };
  const onPointer = (e: PointerEvent) => {
    if (off() && e.pointerType !== "touch") wake();
  };

  window.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("keydown", onKey);
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: true });
  window.addEventListener("pointerdown", onPointer);
  return () => {
    delete root.dataset.endless;
    root.style.removeProperty("--reboot");
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKey);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("pointerdown", onPointer);
  };
};
