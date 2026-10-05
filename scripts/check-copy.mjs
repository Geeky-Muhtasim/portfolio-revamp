/*
 * Copy gate: em dashes, banned words, and forbidden names must not appear
 * in shipped code or copy. Scans source, content, public assets and, when
 * present, the built site in out/. Exits non-zero on any hit.
 *
 * The forbidden names are assembled from character codes so this file
 * never contains them.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const fromCodes = (...codes) => String.fromCharCode(...codes);
const FORBIDDEN_NAMES = [
  fromCodes(122, 111, 114, 111), // the character's name
  fromCodes(111, 110, 101, 32, 112, 105, 101, 99, 101), // the series
  fromCodes(111, 110, 101, 112, 105, 101, 99, 101),
];
const EM_DASH = String.fromCharCode(0x2014);
const BANNED = ["passionate", "cutting-edge", "seamless", "leverage", "innovative", "unlock", "journey", "hi, i'm", "welcome to my portfolio"];

/** Banned words that are allowed in exactly these places, and why. */
const ALLOW = [
  { paths: ["content/portfolio.md", "out/plain"], word: "passionate", why: "Research Statement kept verbatim at the owner's request" },
  { paths: ["content/portfolio.md", "out/plain"], word: "cutting-edge", why: "Research Statement kept verbatim at the owner's request" },
  { paths: ["content/portfolio.md", "out/plain"], word: "innovative", why: "proper noun: the BEA workshop's official name" },
  { paths: ["src/config/site.test.ts"], word: "*", why: "the voice-rule test lists banned words to forbid them" },
  { paths: ["scripts/check-copy.mjs"], word: "*", why: "this gate" },
  { paths: ["out/_next/static/chunks/"], word: "*", why: "minified third-party library internals, not copy" },
];

const ROOTS = ["src", "content", "public", "scripts", "out"];
const FILES = ["package.json", "next.config.ts", "README.md"];
const TEXT = /\.(tsx?|mts|mjs|cjs|js|json|md|css|html|svg|txt|xml|webmanifest)$/i;

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (TEXT.test(name)) out.push(full);
  }
  return out;
}

const files = [...ROOTS.flatMap((r) => walk(r)), ...FILES.filter((f) => existsSync(f))];
const hits = [];

for (const file of files) {
  const rel = file.split(path.sep).join("/");
  const text = readFileSync(file, "utf8");
  const lower = text.toLowerCase();
  const lineOf = (index) => text.slice(0, index).split("\n").length;

  let i = text.indexOf(EM_DASH);
  if (i >= 0) hits.push(`${rel}:${lineOf(i)}  em dash`);

  for (const name of FORBIDDEN_NAMES) {
    const at = lower.indexOf(name);
    if (at >= 0) hits.push(`${rel}:${lineOf(at)}  forbidden name`);
  }

  for (const word of BANNED) {
    const allowed = ALLOW.some((a) => a.paths.some((p) => rel.startsWith(p)) && (a.word === "*" || a.word === word));
    if (allowed) continue;
    // Built bundles are minified; match whole words only to avoid noise like "unlocked" in library code.
    const re = new RegExp(`(^|[^a-z])${word.replace(/[-']/g, (c) => `\\${c}`)}([^a-z]|$)`, "i");
    const m = re.exec(text);
    if (m) hits.push(`${rel}:${lineOf(m.index)}  banned word "${word}"`);
  }
}

if (hits.length) {
  console.error(`Copy gate failed (${hits.length}):\n  ${hits.join("\n  ")}`);
  process.exit(1);
}
console.log(`Copy gate passed: ${files.length} files, no em dashes, banned words or forbidden names.`);
for (const a of ALLOW) console.log(`  allowed: "${a.word}" in ${a.paths.join(", ")} (${a.why})`);
