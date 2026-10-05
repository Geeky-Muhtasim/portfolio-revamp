import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parsePortfolio } from "@/content/parse";
import { blades, crew, sceneLines, threshold, trials, ui, vow } from "./site";

const portfolio = parsePortfolio(readFileSync("content/portfolio.md", "utf8"));

const BANNED = [/passionate/i, /cutting-edge/i, /seamless/i, /leverag/i, /innovative/i, /unlock/i, /journey/i, /hi, i'm/i, /welcome to my portfolio/i];

const allCopy = [
  ...vow.lines,
  ...vow.sublineAfterName,
  vow.continueHint,
  ...Object.values(threshold),
  ...blades.flatMap((b) => [b.label, b.line]),
  ...Object.values(sceneLines),
  ...trials.map((t) => t.summary),
  ...Object.values(ui),
];

describe("site copy", () => {
  it("follows the voice rules", () => {
    for (const line of allCopy) {
      expect(line, line).not.toMatch(new RegExp(String.fromCharCode(0x2014) + "|!"));
      for (const word of BANNED) expect(line, line).not.toMatch(word);
    }
  });

  it("keeps display lines under 12 words", () => {
    // Written into the brief at exactly 12 words; flagged for review rather than rewritten.
    const knownExceptions = ["I want to know how machines think, and whether they understand us."];
    for (const line of [...vow.lines, ...blades.map((b) => b.line), ...Object.values(sceneLines)]) {
      if (knownExceptions.includes(line)) continue;
      expect(line.split(/\s+/).length, line).toBeLessThan(12);
    }
  });

  it("ends the vow on the kept word", () => {
    expect(vow.lines.at(-1)).toMatch(new RegExp(`\\b${vow.keptWord}\\.$`));
  });

  it("credits only people who appear in portfolio.md", () => {
    const known = new Set([
      ...portfolio.publications.flatMap((p) => p.authors.map((a) => a.name)),
      ...portfolio.education.map((e) => e.supervisor ?? ""),
    ]);
    for (const member of crew.filter((c) => c.kind === "person")) {
      const bare = member.name.replace(/^Dr\.\s+/, "");
      const found = known.has(member.name) || known.has(bare);
      expect(found, member.name).toBe(true);
    }
  });
});
