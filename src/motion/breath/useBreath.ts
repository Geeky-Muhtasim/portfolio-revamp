"use client";

import { useEffect } from "react";
import { motion } from "../tokens";

const INPUTS = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;

/**
 * Breath: after ten seconds without input the current scene swells 0.8% on
 * a six second loop while its ink drifts. Any input ends it at once.
 * The animation itself lives in CSS under html.is-breathing.
 */
export function useBreath(enabled: boolean) {
  useEffect(() => {
    const root = document.documentElement;
    if (!enabled) {
      root.classList.remove("is-breathing");
      return;
    }
    let timer = window.setTimeout(() => root.classList.add("is-breathing"), motion.breath.idleMs);
    const wake = () => {
      root.classList.remove("is-breathing");
      window.clearTimeout(timer);
      timer = window.setTimeout(() => root.classList.add("is-breathing"), motion.breath.idleMs);
    };
    INPUTS.forEach((type) => window.addEventListener(type, wake, { passive: true, capture: true }));
    return () => {
      window.clearTimeout(timer);
      INPUTS.forEach((type) => window.removeEventListener(type, wake, { capture: true }));
      root.classList.remove("is-breathing");
    };
  }, [enabled]);
}
