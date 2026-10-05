/*
 * Shippori Mincho B1 is a Japanese family; the stock web CSS splits it into
 * hundreds of unicode-range slices. The site only sets Latin in it, so this
 * fetches one small subset per weight: printable ASCII plus typographic
 * quotes, apostrophes, the en dash and the ellipsis. No em dash, on purpose.
 *
 * Run with `node scripts/fetch-fonts.mjs` when the weights or the character
 * set change. Output is committed under src/app/fonts/ with the OFL text.
 */
import { mkdirSync, writeFileSync } from "node:fs";

const DIR = "src/app/fonts";
const WEIGHTS = [500];
const CHROME_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

let text = "";
for (let c = 0x20; c <= 0x7e; c++) text += String.fromCharCode(c);
text += "‘’“”–…· ";

mkdirSync(DIR, { recursive: true });

for (const weight of WEIGHTS) {
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@${weight}&text=${encodeURIComponent(text)}`, {
      headers: { "User-Agent": CHROME_UA },
    })
  ).text();
  const url = /url\((https:[^)]+)\)\s*format\('woff2'\)/.exec(css)?.[1];
  if (!url) throw new Error(`no woff2 for weight ${weight}:\n${css}`);
  const file = `${DIR}/shippori-mincho-b1-${weight}-latin.woff2`;
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  writeFileSync(file, buf);
  console.log(`wrote ${file} (${(buf.length / 1024).toFixed(1)} KB)`);
}

const license = await (await fetch("https://raw.githubusercontent.com/google/fonts/main/ofl/shipporiminchob1/OFL.txt")).text();
writeFileSync(`${DIR}/OFL-shippori-mincho-b1.txt`, license);
console.log(`wrote ${DIR}/OFL-shippori-mincho-b1.txt`);
