"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

/** Development only: ?motion=reduce previews the reduced-motion path without changing OS settings. */
function forcedForReview(): boolean {
  return process.env.NODE_ENV !== "production" && new URLSearchParams(window.location.search).get("motion") === "reduce";
}

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/** True when the visitor asked for less motion. Server render assumes motion is reduced, the calm default. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches || forcedForReview(),
    () => true,
  );
}

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && (window.matchMedia(QUERY).matches || forcedForReview());
}
