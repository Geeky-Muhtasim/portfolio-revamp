import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/styles/tokens.css", "utf8");
const hex = (name: string) => {
  const value = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6});`).exec(css)?.[1];
  if (!value) throw new Error(`missing token ${name}`);
  return value;
};

function luminance(color: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(color.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe("WCAG AA contrast for text pairs", () => {
  it.each([
    ["paper", "ink"],
    ["steel", "ink"],
    ["jade", "ink"],
    ["deep-jade", "paper"],
    ["ink", "paper"],
  ])("%s on %s is at least 4.5:1", (fg, bg) => {
    expect(contrast(hex(fg), hex(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it("jade on paper fails, so it is never used for text there", () => {
    expect(contrast(hex("jade"), hex("paper"))).toBeLessThan(4.5);
  });
});
