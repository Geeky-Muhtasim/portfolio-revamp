"use client";

import { useEffect } from "react";
import { hasFinePointer } from "../device";

const CLICKABLE = "a[href], button:not(:disabled), [role='button'], label, summary";

/**
 * A thin HUD reticle replaces the pointer on desktop. Over anything
 * clickable, signal-red brackets close around the target itself.
 * Touch devices keep their own behaviour.
 */
export function Reticle() {
  useEffect(() => {
    if (!hasFinePointer()) return;
    const root = document.documentElement;
    const el = document.createElement("div");
    el.className = "reticle";
    el.setAttribute("aria-hidden", "true");
    for (const corner of ["r-tl", "r-tr", "r-bl", "r-br", "r-dot"]) {
      const part = document.createElement("i");
      part.className = corner;
      el.append(part);
    }
    document.body.append(el);
    root.classList.add("has-reticle");

    let target: Element | null = null;
    let raf = 0;
    let px = -100;
    let py = -100;

    const place = () => {
      raf = 0;
      if (target && target.isConnected) {
        const r = target.getBoundingClientRect();
        const pad = 6;
        el.style.transform = `translate3d(${r.left - pad}px, ${r.top - pad}px, 0)`;
        el.style.width = `${r.width + pad * 2}px`;
        el.style.height = `${r.height + pad * 2}px`;
      } else {
        el.style.transform = `translate3d(${px - 13}px, ${py - 13}px, 0)`;
        el.style.width = "26px";
        el.style.height = "26px";
      }
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(place);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px = e.clientX;
      py = e.clientY;
      const hit = e.target instanceof Element ? e.target.closest(CLICKABLE) : null;
      if (hit !== target) {
        target = hit;
        el.classList.toggle("is-locked", Boolean(hit));
      }
      el.classList.add("is-visible");
      schedule();
    };
    const onLeave = () => el.classList.remove("is-visible");
    const onDown = () => el.classList.add("is-pressed");
    const onUp = () => el.classList.remove("is-pressed");

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("scroll", schedule, { passive: true });
    root.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("scroll", schedule);
      root.removeEventListener("mouseleave", onLeave);
      root.classList.remove("has-reticle");
      el.remove();
    };
  }, []);

  return null;
}
