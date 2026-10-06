import { describe, expect, it } from "vitest";
import { burstDetector, isMidnightTraining, wheelPixels } from "./timing";

describe("egg timing rules", () => {
  it("knows midnight training is 00:00 to 03:59 local time", () => {
    const at = (h: number, m = 0) => new Date(2026, 9, 6, h, m);
    expect(isMidnightTraining(at(0, 0))).toBe(true);
    expect(isMidnightTraining(at(3, 59))).toBe(true);
    expect(isMidnightTraining(at(4, 0))).toBe(false);
    expect(isMidnightTraining(at(23, 59))).toBe(false);
    expect(isMidnightTraining(at(12))).toBe(false);
  });

  it("detects three presses within 1.5 seconds, and only then", () => {
    const press = burstDetector(3, 1500);
    expect(press(0)).toBe(false);
    expect(press(700)).toBe(false);
    expect(press(1400)).toBe(true);
    // the burst resets after it fires
    expect(press(1500)).toBe(false);
    const slow = burstDetector(3, 1500);
    expect(slow(0)).toBe(false);
    expect(slow(1000)).toBe(false);
    expect(slow(2000)).toBe(false); // the first press has expired
    expect(slow(2400)).toBe(true);
  });

  it("converts wheel deltas to pixels", () => {
    expect(wheelPixels({ deltaY: 100, deltaMode: 0 }, 800)).toBe(100);
    expect(wheelPixels({ deltaY: 3, deltaMode: 1 }, 800)).toBe(120);
    expect(wheelPixels({ deltaY: 1, deltaMode: 2 }, 800)).toBe(800);
  });
});
