import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { motion } from "./tokens";

const css = readFileSync("src/styles/tokens.css", "utf8");
const cssVar = (name: string) => new RegExp(`--${name}:\\s*([^;]+);`).exec(css)?.[1]?.trim();

describe("motion tokens", () => {
  it("match between CSS and TS", () => {
    expect(Number(cssVar("slash-freeze-ms"))).toBe(motion.slash.freezeMs);
    expect(Number(cssVar("slash-impact-ms"))).toBe(motion.slash.impactMs);
    expect(Number(cssVar("slash-split-ms"))).toBe(motion.slash.splitMs);
    expect(Number(cssVar("slash-angle-deg"))).toBe(motion.slash.angleDeg);
    expect(cssVar("ease-expo-out")).toBe(motion.easeExpoOut);
    expect(Number(cssVar("vow-type-ms"))).toBe(motion.vowTypeMs);
    expect(Number(cssVar("drift-idle-ms"))).toBe(motion.drift.idleMs);
  });

  it("stay inside the brief's ranges", () => {
    expect(motion.slash.angleDeg).toBeGreaterThanOrEqual(18);
    expect(motion.slash.angleDeg).toBeLessThanOrEqual(22);
    expect(motion.slash.freezeMs).toBe(100);
    expect(motion.slash.impactMs).toBe(80);
    expect(motion.slash.splitMs).toBe(250);
  });
});
