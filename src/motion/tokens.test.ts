import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { motion } from "./tokens";

const css = readFileSync("src/styles/tokens.css", "utf8");
const cssVar = (name: string) => new RegExp(`--${name}:\\s*([^;]+);`).exec(css)?.[1]?.trim();

describe("motion tokens", () => {
  it("match between CSS and TS", () => {
    expect(Number(cssVar("cut-still-ms"))).toBe(motion.cut.stillMs);
    expect(Number(cssVar("cut-dim"))).toBe(motion.cut.dim);
    expect(Number(cssVar("cut-slash-ms"))).toBe(motion.cut.slashMs);
    expect(Number(cssVar("cut-split-ms"))).toBe(motion.cut.splitMs);
    expect(Number(cssVar("cut-angle-deg"))).toBe(motion.cut.angleDeg);
    expect(cssVar("ease-expo-out")).toBe(motion.easeExpoOut);
    expect(Number(cssVar("vow-write-ms"))).toBe(motion.vowWriteMs);
    expect(Number(cssVar("trail-fade-ms"))).toBe(motion.trailFadeMs);
    expect(Number(cssVar("breath-idle-ms"))).toBe(motion.breath.idleMs);
    expect(Number(cssVar("breath-period-ms"))).toBe(motion.breath.periodMs);
    expect(Number(cssVar("breath-scale"))).toBe(motion.breath.scale);
  });

  it("stay inside the brief's ranges", () => {
    expect(motion.cut.angleDeg).toBeGreaterThanOrEqual(18);
    expect(motion.cut.angleDeg).toBeLessThanOrEqual(22);
  });
});
