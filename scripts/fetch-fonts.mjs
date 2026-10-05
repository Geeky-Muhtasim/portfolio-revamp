/*
 * Self-hosted subsets for the two families whose stock web CSS is far
 * larger than what the site sets in them.
 *
 * Shippori Mincho B1 is a Japanese family; the stock CSS splits it into
 * hundreds of unicode-range slices. The site only sets Latin in it: printable
 * ASCII plus typographic quotes, apostrophes, the en dash and the ellipsis.
 * No em dash, on purpose.
 *
 * Tiro Bangla is needed only for the Bangla the site actually shows. Its
 * subset is exactly the Bangla characters found in src/config/site.ts.
 *
 * Run with `node scripts/fetch-fonts.mjs` when the weights, the Latin set or
 * any Bangla copy changes. Output is committed under src/app/fonts/ with the
 * OFL texts. A test fails if site.ts uses a Bangla character the subset lacks.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

const DIR = "src/app/fonts";
const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

let latin = "";
for (let c = 0x20; c <= 0x7e; c++) latin += String.fromCharCode(c);
latin += "‘’“”–…· ";

const bangla = [...new Set(readFileSync("src/config/site.ts", "utf8").match(/[ঀ-৿‌‍]/g) ?? [])].sort().join("");

const subsets = [
  { family: "Shippori+Mincho+B1", weight: 500, text: latin, file: "shippori-mincho-b1-500-latin.woff2", ofl: "shipporiminchob1", license: "OFL-shippori-mincho-b1.txt" },
  { family: "Tiro+Bangla", weight: 400, text: bangla, file: "tiro-bangla-400-subset.woff2", ofl: "tirobangla", license: "OFL-tiro-bangla.txt" },
];

mkdirSync(DIR, { recursive: true });

for (const s of subsets) {
  if (!s.text) throw new Error(`no characters to subset for ${s.family}`);
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${s.family}:wght@${s.weight}&text=${encodeURIComponent(s.text)}`, {
      headers: { "User-Agent": CHROME_UA },
    })
  ).text();
  const url = /url\((https:[^)]+)\)\s*format\('woff2'\)/.exec(css)?.[1];
  if (!url) throw new Error(`no woff2 for ${s.family}:\n${css}`);
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  writeFileSync(`${DIR}/${s.file}`, buf);
  console.log(`wrote ${DIR}/${s.file} (${(buf.length / 1024).toFixed(1)} KB, ${[...s.text].length} characters)`);
  const license = await (await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${s.ofl}/OFL.txt`)).text();
  writeFileSync(`${DIR}/${s.license}`, license);
}

writeFileSync(`${DIR}/bangla-subset.txt`, bangla);
console.log(`wrote ${DIR}/bangla-subset.txt`);
