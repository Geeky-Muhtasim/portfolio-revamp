import matter from "gray-matter";
import { z } from "zod";
import { portfolioSchema, type Period, type Portfolio } from "./schema";

/*
 * portfolio.md -> typed Portfolio.
 *
 * The file is regular enough that a small line parser is clearer than a
 * markdown AST: `##` sections, `###` entries, `- key: value` bullets, and
 * indented `  - item` bullets for list values. Pure function, no fs, so it
 * runs the same in the build and in tests.
 */

export class ContentError extends Error {
  constructor(message: string, line?: number) {
    super(line ? `portfolio.md:${line}: ${message}` : `portfolio.md: ${message}`);
    this.name = "ContentError";
  }
}

type FieldValue = string | string[];

interface RawEntry {
  title: string;
  line: number;
  fields: Map<string, FieldValue>;
  /** Top-level bullets without a key, e.g. "- Mentor university students". */
  items: string[];
  /** Plain paragraph lines inside the entry. */
  text: string[];
}

interface RawSection {
  title: string;
  line: number;
  preamble: string[];
  entries: RawEntry[];
}

const KEYED_BULLET = /^- ([a-z][A-Za-z0-9]*):(?:\s+(.*))?$/;
const NESTED_BULLET = /^\s{2,}- (.*)$/;
const PLAIN_BULLET = /^- (.*)$/;

export function splitSections(body: string): RawSection[] {
  const sections: RawSection[] = [];
  let section: RawSection | undefined;
  let entry: RawEntry | undefined;
  let listKey: string | undefined;

  body.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.trimEnd();
    const n = index + 1;

    if (line.startsWith("## ")) {
      section = { title: line.slice(3).trim(), line: n, preamble: [], entries: [] };
      sections.push(section);
      entry = undefined;
      listKey = undefined;
      return;
    }
    if (line.startsWith("### ")) {
      if (!section) throw new ContentError("entry outside of a section", n);
      entry = { title: line.slice(4).trim(), line: n, fields: new Map(), items: [], text: [] };
      section.entries.push(entry);
      listKey = undefined;
      return;
    }
    // The document title and horizontal rules carry no data.
    if (line.startsWith("# ") || /^-{3,}$/.test(line)) return;
    if (line.trim() === "") return;
    if (!section) throw new ContentError(`text before the first section: "${line}"`, n);

    const nested = NESTED_BULLET.exec(line);
    if (nested) {
      const target = listKey && entry?.fields.get(listKey);
      if (!Array.isArray(target)) throw new ContentError("nested bullet without a list key above it", n);
      target.push(nested[1]!.trim());
      return;
    }

    if (!entry) {
      section.preamble.push(line);
      return;
    }

    const keyed = KEYED_BULLET.exec(line);
    if (keyed) {
      const key = keyed[1]!;
      const value = (keyed[2] ?? "").trim();
      if (entry.fields.has(key)) throw new ContentError(`duplicate key "${key}" in "${entry.title}"`, n);
      if (value === "") {
        entry.fields.set(key, []);
        listKey = key;
      } else {
        entry.fields.set(key, value);
        listKey = undefined;
      }
      return;
    }

    const plain = PLAIN_BULLET.exec(line);
    if (plain) {
      entry.items.push(plain[1]!.trim());
      listKey = undefined;
      return;
    }

    entry.text.push(line.trim());
  });

  return sections;
}

/* ---------- value helpers ---------- */

/** Removes a trailing ` # comment` that sits outside of double quotes. */
export function stripComment(value: string): string {
  let inQuote = false;
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === '"') inQuote = !inQuote;
    if (!inQuote && ch === "#" && i > 0 && /\s/.test(value[i - 1]!)) return value.slice(0, i).trim();
  }
  return value.trim();
}

/** `""` becomes empty; a value wrapped in quotes with none inside is unwrapped. */
export function unquote(value: string): string {
  const v = value.trim();
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"') && !v.slice(1, -1).includes('"')) {
    return v.slice(1, -1);
  }
  return v;
}

/** Splits on a separator, ignoring separators inside parentheses. */
export function splitList(value: string, separator = ","): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === separator && depth === 0) {
      out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current);
  return out.map((s) => s.trim()).filter(Boolean);
}

/** `publisher: https://a, arxiv: https://b` -> { publisher, arxiv }. Empty values are dropped. */
export function parseInlineMap(value: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of stripComment(value).split(/,\s*(?=[a-z][A-Za-z0-9]*:\s)/)) {
    const match = /^([a-z][A-Za-z0-9]*):\s*(.*)$/.exec(part.trim());
    if (!match) throw new ContentError(`cannot read link "${part}"`);
    const v = unquote(match[2]!);
    if (v) out[match[1]!] = v;
  }
  return out;
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

function parsePoint(value: string): { year: number; month?: number } {
  const match = /^(?:([A-Za-z]+)\s+)?(\d{4})$/.exec(value.trim());
  if (!match) throw new ContentError(`cannot read date "${value}"`);
  const year = Number(match[2]);
  if (!match[1]) return { year };
  const month = MONTHS.indexOf(match[1].slice(0, 3).toLowerCase()) + 1;
  if (month === 0) throw new ContentError(`unknown month "${match[1]}"`);
  return { year, month };
}

/** Accepts "Jan 2020 – Nov 2024", "September 2025 – present", "May 2025 - 2026", "2024". */
export function parsePeriod(raw: string): Period {
  const [from, to, ...rest] = raw.split(/\s+[–-]\s+/);
  if (!from || rest.length) throw new ContentError(`cannot read period "${raw}"`);
  const start = parsePoint(from);
  if (to === undefined) return { raw, start, end: null };
  const end = /^present$/i.test(to.trim()) ? "present" : parsePoint(to);
  return { raw, start, end };
}

export function parseAuthors(value: string) {
  return splitList(value).map((name) => {
    const bold = /^\*\*(.+)\*\*$/.exec(name);
    return { name: bold ? bold[1]!.trim() : name, isSelf: Boolean(bold) };
  });
}

/* ---------- entry conversion ---------- */

type Converter = (value: FieldValue, key: string) => unknown;

const asString = (value: FieldValue, key: string): string => {
  if (Array.isArray(value)) throw new ContentError(`"${key}" should be a single value`);
  return unquote(stripComment(value));
};
const asList = (value: FieldValue, key: string): string[] => {
  if (!Array.isArray(value)) throw new ContentError(`"${key}" should be a nested list`);
  return value;
};

const CONVERTERS: Record<string, Converter> = {
  techStack: (v, k) => splitList(asString(v, k)),
  tags: (v, k) => splitList(asString(v, k)),
  coursework: (v, k) => splitList(asString(v, k)),
  roles: (v, k) => splitList(asString(v, k), ";"),
  featured: (v, k) => {
    const s = asString(v, k);
    if (s !== "true" && s !== "false") throw new ContentError(`"featured" must be true or false, got "${s}"`);
    return s === "true";
  },
  year: (v, k) => Number(asString(v, k)),
  citations: (v, k) => Number(asString(v, k)),
  period: (v, k) => parsePeriod(asString(v, k)),
  links: (v) => parseInlineMap(Array.isArray(v) ? v.join(", ") : v),
  authors: (v, k) => parseAuthors(asString(v, k)),
  responsibilities: asList,
  achievements: asList,
  highlights: asList,
  modules: (v, k) =>
    asList(v, k).map((item) => {
      const i = item.indexOf(":");
      if (i < 1) throw new ContentError(`module "${item}" needs "Name: description"`);
      return { name: item.slice(0, i).trim(), description: item.slice(i + 1).trim() };
    }),
};

function convertEntry(entry: RawEntry): Record<string, unknown> {
  const out: Record<string, unknown> = { title: entry.title };
  for (const [key, value] of entry.fields) {
    const converted = (CONVERTERS[key] ?? asString)(value, key);
    // Missing data renders nothing, so empty strings become absent fields.
    if (converted === "") continue;
    out[key] = converted;
  }
  if (entry.items.length) out.items = entry.items;
  return out;
}

const paragraph = (lines: string[]) => lines.join(" ").replace(/\s+/g, " ").trim();

function parseScholar(preamble: string[]) {
  const line = preamble.find((l) => l.startsWith("Google Scholar:")) ?? "";
  const num = (re: RegExp) => {
    const m = re.exec(line);
    return m ? Number(m[1]) : undefined;
  };
  return {
    citations: num(/(\d+)\s+citations/),
    hIndex: num(/h-index\s+(\d+)/),
    i10Index: num(/i10-index\s+(\d+)/),
  };
}

/** Removes empty strings from frontmatter maps so they read as "missing". */
function dropEmpty<T>(value: T): T {
  if (Array.isArray(value)) return value.map(dropEmpty) as T;
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== "" && v !== null && v !== undefined)
        .map(([k, v]) => [k, dropEmpty(v)]),
    ) as T;
  }
  return value;
}

/* ---------- section mapping ---------- */

const SECTION_KEYS: Array<[RegExp, keyof Omit<Portfolio, "profile" | "scholar">]> = [
  [/^About$/, "about"],
  [/^Research Statement$/, "researchStatement"],
  [/^Research Interests$/, "researchInterests"],
  [/^Education$/, "education"],
  [/^Experience$/, "experience"],
  [/^Publications$/, "publications"],
  [/^Official Projects\b/, "officialProjects"],
  [/^Personal, Client & Research Projects$/, "personalProjects"],
  [/^Skills$/, "skills"],
  [/^Awards & Recognition$/, "awards"],
  [/^Certifications$/, "certifications"],
  [/^Leadership & Service$/, "leadership"],
];

export function parsePortfolio(source: string): Portfolio {
  const { data, content } = matter(source);
  const draft: Record<string, unknown> = { profile: dropEmpty(data) };

  for (const section of splitSections(content)) {
    const key = SECTION_KEYS.find(([re]) => re.test(section.title))?.[1];
    if (!key) throw new ContentError(`unknown section "${section.title}"`, section.line);
    if (key in draft) throw new ContentError(`section "${section.title}" appears twice`, section.line);

    switch (key) {
      case "about":
      case "researchStatement":
        draft[key] = paragraph(section.preamble);
        break;
      case "publications":
        draft.scholar = parseScholar(section.preamble);
        draft[key] = section.entries.map(convertEntry);
        break;
      case "skills":
        draft[key] = section.entries.map((e) => ({ title: e.title, items: splitList(paragraph(e.text)) }));
        break;
      case "leadership":
        draft[key] = section.entries.map((e) => {
          const { role, ...rest } = convertEntry(e);
          return role === undefined ? rest : { ...rest, roles: [role] };
        });
        break;
      default:
        draft[key] = section.entries.map(convertEntry);
    }
  }

  const result = portfolioSchema.safeParse(draft);
  if (!result.success) {
    throw new ContentError(`content does not match the schema\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
