import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parsePortfolio } from "./parse";
import { jsonLd, jsonLdScript, seoDescription, seoTitle, siteUrl } from "./seo";

const p = parsePortfolio(readFileSync("content/portfolio.md", "utf8"));
const graph = jsonLd(p)["@graph"] as Array<Record<string, unknown>>;
const byType = (t: string) => graph.filter((n) => n["@type"] === t);

describe("search metadata from portfolio.md", () => {
  it("leads the title with the name and the role", () => {
    expect(seoTitle(p)).toBe(`${p.profile.name} | ${p.profile.title}`);
  });

  it("describes the current job and lab, in the site's voice", () => {
    const d = seoDescription(p);
    expect(d.startsWith(p.profile.name)).toBe(true);
    expect(d).toContain("Bangladesh Finance PLC");
    expect(d).toContain("CCDS, IUB");
    expect(d).not.toMatch(new RegExp(String.fromCharCode(0x2014) + "|!"));
    expect(d.endsWith(".")).toBe(true);
  });

  it("describes one Person on one ProfilePage of one WebSite", () => {
    expect(byType("WebSite")).toHaveLength(1);
    expect(byType("ProfilePage")).toHaveLength(1);
    const [person] = byType("Person");
    expect(person!.name).toBe(p.profile.name);
    expect(person!.alternateName).toEqual([p.profile.nickname, p.profile.shortName]);
    expect(byType("ProfilePage")[0]!.mainEntity).toEqual({ "@id": person!["@id"] });
  });

  it("links the Person to every profile listed, and to nothing else", () => {
    const listed = Object.values(p.profile.socials).filter(Boolean);
    expect(byType("Person")[0]!.sameAs).toEqual(listed);
  });

  it("lists every publication once, the thesis as a Thesis", () => {
    expect(byType("ScholarlyArticle").length + byType("Thesis").length).toBe(p.publications.length);
    expect(byType("Thesis")[0]!.name).not.toMatch(/^Thesis:/);
  });

  it("uses only absolute URLs", () => {
    const urls = JSON.stringify(jsonLd(p)).match(/"(?:url|@id)":"([^"]+)"/g) ?? [];
    for (const u of urls) expect(u, u).toMatch(/"https:\/\//);
    expect(siteUrl(p)).toMatch(/^https:\/\/.+\/$/);
  });

  it("can never close its script tag early", () => {
    expect(jsonLdScript(p)).not.toContain("<");
  });
});
