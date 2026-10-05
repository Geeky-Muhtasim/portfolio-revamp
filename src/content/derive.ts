import type { BladeId } from "@/config/site";
import type { OfficialProject, Period, Portfolio, Publication } from "./schema";

/*
 * Views derived from portfolio.md. Nothing here adds a fact: every value is
 * read, matched or regrouped from the content file. Where text has to be
 * parsed (a highlight sentence), the original sentence is kept as the
 * fallback so a rewording never loses information.
 */

/** "Proceedings of ... (IJCNLP-AACL 2025)" -> "IJCNLP-AACL 2025". */
export function venueShort(venue: string): string {
  const m = /\(([^()]+)\)(?!.*\()/.exec(venue);
  return m ? m[1]!.trim() : venue;
}

export function periodStart(p: Period): number {
  return p.start.year * 12 + (p.start.month ?? 1) - 1;
}

/* ---------- Training Log: skills tied to where they were used ---------- */

const BLADE_OF_GROUP: Record<string, BladeId> = {
  "AI & Machine Learning": "research",
  "Research Skills": "research",
  Security: "security",
};

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** The names a skill goes by: "JWT/RBAC" -> jwt, rbac; "Oracle (DBA)" -> oracle; "x (A, B)" -> x, a, b. */
export function skillAliases(skill: string): string[] {
  const inner = /\(([^)]*)\)/.exec(skill)?.[1];
  const base = norm(skill.replace(/\([^)]*\)/g, ""));
  const names = [base, ...base.split("/").map(norm)];
  if (inner && !/^dba$/i.test(inner.trim()) && !/bloc/i.test(inner)) names.push(...inner.split(",").map(norm));
  return [...new Set(names.filter(Boolean))];
}

function stackMatches(alias: string, entry: string) {
  const e = norm(entry.replace(/\([^)]*\)/g, ""));
  return e === alias || e.startsWith(`${alias} `) || alias.startsWith(`${e} `);
}

export interface SkillEntry {
  skill: string;
  group: string;
  blade: BladeId;
  usedIn: string[];
}

export function trainingLog(p: Portfolio): SkillEntry[] {
  const places: Array<{ name: string; stack: string[] }> = [
    ...p.officialProjects.map((x) => ({ name: x.title.split(":")[0]!.trim(), stack: x.techStack })),
    ...p.personalProjects.map((x) => ({ name: x.title.split(":")[0]!.trim(), stack: x.techStack })),
    ...p.experience.map((x) => ({ name: `${x.title.split(",")[0]}, ${shortOrg(x.organization)}`, stack: x.techStack })),
  ];
  return p.skills.flatMap((group) =>
    group.items.map((skill) => {
      const aliases = skillAliases(skill);
      const usedIn = places.filter((pl) => pl.stack.some((s) => aliases.some((a) => stackMatches(a, s)))).map((pl) => pl.name);
      return { skill, group: group.title, blade: BLADE_OF_GROUP[group.title] ?? "engineering", usedIn: [...new Set(usedIn)] };
    }),
  );
}

/* ---------- The Road: stations from education and experience ---------- */

/** "Center for Computational & Data Sciences (CCDS), IUB" -> "CCDS, IUB". */
export function shortOrg(org: string): string {
  const acronym = /\(([A-Z]{2,})\)/.exec(org)?.[1];
  if (!acronym) return org;
  const rest = org.split(")")[1]?.replace(/^,\s*/, "").trim();
  return rest ? `${acronym}, ${rest}` : acronym;
}

export interface Station {
  id: string;
  name: string;
  line: "study" | "research" | "industry" | "volunteer";
  start: number;
  period: string;
  title: string;
  detail: string;
}

export function roadStations(p: Portfolio): Station[] {
  const study = p.education.map((e, i) => ({
    id: `edu-${i}`,
    name: shortOrg(e.institution),
    line: "study" as const,
    start: periodStart(e.period),
    period: e.period.raw,
    title: e.title,
    detail: e.thesis ? `Thesis: ${e.thesis}` : e.institution,
  }));
  const work = p.experience.map((x, i) => ({
    id: `exp-${i}`,
    name: shortOrg(x.organization),
    line: (x.type === "Research" ? "research" : x.type === "Volunteer" ? "volunteer" : "industry") as Station["line"],
    start: periodStart(x.period),
    period: x.period.raw,
    title: x.title,
    detail: x.description,
  }));
  return [...study, ...work].sort((a, b) => a.start - b.start);
}

/* ---------- Crew: roles and shared work ---------- */

export interface Credit {
  name: string;
  role: string;
  shared: string[];
}

const bare = (name: string) => norm(name.replace(/^dr\.?\s+/i, ""));

export function crewCredits(p: Portfolio, crew: ReadonlyArray<{ name: string; kind: "person" | "team" }>): Credit[] {
  return crew.map((member) => {
    if (member.kind === "team") {
      const org = p.officialProjects.find((x) => /IT Division/i.test(x.role));
      const shared = p.officialProjects.filter((x) => /IT Division/i.test(x.role)).map((x) => x.title);
      return { name: member.name, role: org ? org.role.split(",").slice(1).join(",").trim() || "Team" : "Team", shared };
    }
    const supervisor = p.education.some((e) => e.supervisor && bare(e.supervisor) === bare(member.name));
    const papers = p.publications.filter((pub) => pub.authors.some((a) => !a.isSelf && bare(a.name) === bare(member.name)));
    const role = supervisor ? "Supervisor" : papers.length ? "Co-author" : "";
    const where = (x: Publication) => (x.type === "Undergraduate Thesis" ? "undergraduate thesis" : venueShort(x.venue));
    return { name: member.name, role, shared: papers.map((x) => `${shortTitle(x)} (${where(x)})`) };
  });
}

/** "SOMAJGYAAN: A Dataset for ..." -> "SOMAJGYAAN"; long titles are cut at their colon. */
export function shortTitle(pub: Publication): string {
  const head = pub.title.replace(/^Thesis:\s*/, "").split(":")[0]!.trim();
  return head.length >= 3 ? head : pub.title;
}

/* ---------- Security: AEGIS ---------- */

export function aegis(p: Portfolio): OfficialProject | undefined {
  return p.officialProjects.find((x) => /^AEGIS\b/.test(x.title));
}

/** The telemetry sources, read from the "Ingests ... sources: a, b, c, and d" highlight. */
export function telemetrySources(project: OfficialProject): string[] {
  const line = project.highlights.find((h) => /telemetry sources:/i.test(h));
  if (!line) return [];
  return line
    .split(":")
    .slice(1)
    .join(":")
    .split(/,\s*(?:and\s+)?/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** The scoring model, read from the "risk scoring ... weighs a, b, c, and d, with damping for x" highlight. */
export function scoringModel(project: OfficialProject): { sentence: string; factors: string[]; damping?: string; range?: string } | null {
  const sentence = project.highlights.find((h) => /risk scoring/i.test(h));
  if (!sentence) return null;
  const weighs = /weighs (.+?), with damping for ([^;.]+)/i.exec(sentence);
  const range = /\((\d+\s*-\s*\d+)\)/.exec(sentence)?.[1];
  const factors = weighs ? weighs[1]!.split(/,\s*(?:and\s+)?/).map((s) => s.trim()).filter(Boolean) : [];
  return { sentence, factors, damping: weighs?.[2]?.trim(), range };
}
