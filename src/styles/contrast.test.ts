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

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

describe("WCAG AA contrast for every text pair the site uses", () => {
  it.each([
    ["phosphor", "night-green"],
    ["phosphor", "crt-screen"],
    ["phosphor", "outline"],
    ["signal-red", "night-green"],
    ["signal-red", "crt-screen"],
    ["signal-red", "outline"],
    ["cel-cream", "crt-screen"],
    ["cel-cream", "night-green"],
    ["cel-cream", "crimson"],
    ["sun-gold", "crt-screen"],
  ])("%s on %s is at least 4.5:1", (fg, bg) => {
    expect(contrast(hex(fg), hex(bg))).toBeGreaterThanOrEqual(4.5);
  });

  it("crimson and moss fail as small text, so they are only ever fills and shapes", () => {
    expect(contrast(hex("crimson"), hex("crt-screen"))).toBeLessThan(4.5);
    expect(contrast(hex("moss"), hex("night-green"))).toBeLessThan(4.5);
  });

  it("never uses pure black", () => {
    const black = new RegExp(`#${"0".repeat(3)}(${"0".repeat(3)})?(?![0-9a-f])`);
    expect(css.toLowerCase()).not.toMatch(black);
  });
});
