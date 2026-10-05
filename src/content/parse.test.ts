import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ContentError, parsePeriod, parsePortfolio, splitList, stripComment, unquote } from "./parse";
import { OFFICIAL_STATUSES } from "./schema";

const source = readFileSync(path.join(process.cwd(), "content", "portfolio.md"), "utf8");
const portfolio = parsePortfolio(source);

const byTitle = <T extends { title: string }>(items: T[], title: string) => {
  const found = items.find((i) => i.title === title);
  if (!found) throw new Error(`missing "${title}"`);
  return found;
};

describe("real portfolio.md", () => {
  it("reads the frontmatter profile", () => {
    expect(portfolio.profile.name).toBe("Muhtasim Ibteda Shochcho");
    expect(portfolio.profile.socials.github).toBe("https://github.com/Geeky-Muhtasim");
    // twitter is "" in the file, so it must be absent rather than an empty link
    expect(portfolio.profile.socials.twitter).toBeUndefined();
  });

  it("keeps stats consistent with the entries they count", () => {
    const { stats } = portfolio.profile;
    const papers = portfolio.publications.filter((p) => p.type !== "Undergraduate Thesis");
    expect(papers).toHaveLength(stats.publications);
    expect(portfolio.officialProjects).toHaveLength(stats.officialProjects);
    expect(portfolio.personalProjects).toHaveLength(stats.personalProjects);
    expect(portfolio.scholar.citations).toBe(stats.citations);
    expect(portfolio.scholar.hIndex).toBe(stats.hIndex);
    expect(portfolio.scholar.i10Index).toBe(2);
  });

  it("reads every section", () => {
    expect(portfolio.about).toMatch(/^I build secure/);
    expect(portfolio.researchStatement.length).toBeGreaterThan(100);
    expect(portfolio.researchInterests).toHaveLength(6);
    expect(portfolio.education).toHaveLength(1);
    expect(portfolio.experience).toHaveLength(5);
    expect(portfolio.skills).toHaveLength(8);
    expect(portfolio.awards).toHaveLength(4);
    expect(portfolio.certifications).toHaveLength(5);
    expect(portfolio.leadership).toHaveLength(3);
  });

  it("marks exactly one self author per publication", () => {
    for (const pub of portfolio.publications) {
      const selves = pub.authors.filter((a) => a.isSelf);
      expect(selves.map((a) => a.name)).toEqual(["Muhtasim Ibteda Shochcho"]);
    }
  });

  it("reads inline link lists, including URLs and empty quoted values", () => {
    const pubs = Object.fromEntries(portfolio.publications.map((p) => [p.id, p]));
    expect(pubs["pub-1"]!.links).toEqual({});
    expect(pubs["pub-2"]!.links).toEqual({ publisher: "https://dl.acm.org/doi/10.1145/3706599.3720240" });
    expect(pubs["pub-3"]!.links).toEqual({
      publisher: "https://aclanthology.org/2025.bea-1.102/",
      arxiv: "https://arxiv.org/abs/2506.01817",
    });
    // `github: "" # Private` -> no link at all
    expect(portfolio.officialProjects.find((p) => p.id === "off-1")!.links).toEqual({});
  });

  it("keeps the thesis title consistent between education and publications", () => {
    const thesis = portfolio.publications.find((p) => p.type === "Undergraduate Thesis")!;
    expect(`Thesis: ${portfolio.education[0]!.thesis}`).toBe(thesis.title);
  });

  it("validates official statuses against the note in the file", () => {
    const note = /> Status values: (.*)\./.exec(source)?.[1] ?? "";
    const listed = [...note.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
    expect(listed).toEqual([...OFFICIAL_STATUSES]);
  });

  it("parses periods in every form the file uses", () => {
    const off = Object.fromEntries(portfolio.officialProjects.map((p) => [p.id, p]));
    expect(off["off-1"]!.period).toMatchObject({ start: { year: 2026, month: 7 }, end: "present" });
    expect(off["off-4"]!.period.end).toBe("present"); // "April 2025 – present"
    expect(off["off-5"]!.period).toMatchObject({ start: { year: 2025, month: 10 }, end: null });
    expect(off["off-12"]!.period).toMatchObject({ start: { year: 2025, month: 5 }, end: { year: 2026 } }); // hyphen
    expect(portfolio.education[0]!.period).toMatchObject({
      start: { year: 2020, month: 1 },
      end: { year: 2024, month: 11 },
    });
  });

  it("reads nested lists and module maps", () => {
    const finx = byTitle(portfolio.officialProjects, "FinX360 Digital Ecosystem");
    expect(finx.modules.map((m) => m.name)).toEqual(["DigiTion", "DGdocX", "PMS", "LMS"]);
    const aegis = byTitle(portfolio.officialProjects, "AEGIS: Security Operations Platform");
    expect(aegis.highlights).toHaveLength(6);
    expect(aegis.featured).toBe(true);
    expect(byTitle(portfolio.officialProjects, "GRC Platform").featured).toBe(false);
  });

  it("keeps a description that merely starts with a quote", () => {
    const netscope = portfolio.personalProjects.find((p) => p.id === "per-3")!;
    expect(netscope.description.startsWith('"Wireshark, but animated." A Matrix-style')).toBe(true);
  });

  it("splits skills without breaking parenthesised lists", () => {
    const security = byTitle(portfolio.skills, "Security");
    expect(security.items).toContain("firewall log analysis (FortiGate, Palo Alto)");
    expect(byTitle(portfolio.skills, "Backend & Web").items).toContain("Flutter (BLoC)");
  });

  it("reads leadership roles, single roles and plain items", () => {
    expect(byTitle(portfolio.leadership, "IEEE Computer Society IUB Student Branch Chapter").roles).toEqual([
      "Student Advisor",
      "Vice Chair (2023 – 2024)",
      "Logistics Assistant",
    ]);
    const esports = byTitle(portfolio.leadership, "IUB Esports Club");
    expect(esports.roles).toEqual(["Visual Executive"]);
    expect(esports.period?.raw).toBe("2022 – 2023");
    const teaching = byTitle(portfolio.leadership, "Teaching & Mentoring");
    expect(teaching.items).toHaveLength(2);
    expect(teaching.items[0]).toMatch(/^Volunteer course support:/);
  });

  it("contains no em dashes", () => {
    expect(source.includes(String.fromCharCode(0x2014))).toBe(false);
  });
});

describe("parser guards", () => {
  const minimal = (body: string) => `---\nname: x\n---\n${body}`;

  it("fails on an unknown section", () => {
    expect(() => parsePortfolio(minimal("## Hobbies\ntext"))).toThrow(ContentError);
  });

  it("fails on an unknown key", () => {
    const withTypo = source.replace("- institution: Independent", "- instituion: Independent");
    expect(() => parsePortfolio(withTypo)).toThrow(/instituion/);
  });

  it("fails on an invalid official status", () => {
    const bad = source.replace("- status: Pilot", "- status: Almost done");
    expect(() => parsePortfolio(bad)).toThrow(ContentError);
  });

  it("helpers behave", () => {
    expect(splitList("a, b (c, d), e")).toEqual(["a", "b (c, d)", "e"]);
    expect(stripComment('"" # Private')).toBe('""');
    expect(unquote('""')).toBe("");
    expect(parsePeriod("2024")).toEqual({ raw: "2024", start: { year: 2024 }, end: null });
    expect(() => parsePeriod("Someday 2024")).toThrow(ContentError);
  });
});
