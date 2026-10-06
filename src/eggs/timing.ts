/*
 * Small, pure rules the eggs share, kept apart so they can be tested
 * without a browser.
 */

/** Local time from 00:00 up to (not including) 04:00. */
export function isMidnightTraining(date: Date): boolean {
  const h = date.getHours();
  return h >= 0 && h < 4;
}

/**
 * Counts presses and reports when `count` of them land within `windowMs`.
 * Each call takes the press time and returns true on the press that
 * completes a burst; the burst then starts over.
 */
export function burstDetector(count: number, windowMs: number) {
  let times: number[] = [];
  return (now: number): boolean => {
    times = [...times.filter((t) => now - t <= windowMs), now];
    if (times.length >= count) {
      times = [];
      return true;
    }
    return false;
  };
}

/** Wheel deltas in pixels, whatever unit the device reports. */
export function wheelPixels(e: { deltaY: number; deltaMode: number }, viewport: number): number {
  if (e.deltaMode === 1) return e.deltaY * 40;
  if (e.deltaMode === 2) return e.deltaY * viewport;
  return e.deltaY;
}
