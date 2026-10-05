"use client";

import { useEffect } from "react";
import { motion } from "../tokens";

const INPUTS = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

/**
 * Idle drift: after ten seconds without input the scanlines roll slowly,
 * the sun shimmers (CSS, under html.is-drifting) and a few lit windows in
 * the skyline flicker off and on. Any input ends it at once.
 */
export function useIdleDrift(enabled: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    let timer = 0;
    let flicker = 0;
    const dark = new Set<Element>();

    const stop = () => {
      root.classList.remove("is-drifting");
      window.clearInterval(flicker);
      dark.forEach((w) => w.classList.remove("is-off"));
      dark.clear();
    };
    const start = () => {
      root.classList.add("is-drifting");
      const windows = [...document.querySelectorAll(".world .w-window")];
      flicker = window.setInterval(() => {
        const w = windows[Math.floor(Math.random() * windows.length)];
        if (!w) return;
        if (dark.has(w)) {
          w.classList.remove("is-off");
          dark.delete(w);
        } else if (dark.size < 4) {
          w.classList.add("is-off");
          dark.add(w);
        }
      }, 700);
    };

    if (!enabled) {
      stop();
      return;
    }
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(start, motion.drift.idleMs);
    };
    const wake = () => {
      stop();
      arm();
    };
    arm();
    INPUTS.forEach((type) => window.addEventListener(type, wake, { passive: true, capture: true }));
    return () => {
      window.clearTimeout(timer);
      INPUTS.forEach((type) => window.removeEventListener(type, wake, { capture: true }));
      stop();
    };
  }, [enabled]);
}
