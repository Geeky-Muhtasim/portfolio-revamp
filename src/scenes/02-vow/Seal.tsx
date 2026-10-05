import { brush } from "@/motion/brush/data";

/*
 * The seal: a jade square with the initials cut out of it, edges roughened
 * like a stone stamp pressed into paper. Placeholder until a carved seal is
 * scanned; it keeps the same 100 x 100 box.
 */

function bounds(d: string) {
  const nums = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  let minY = Infinity, maxY = -Infinity;
  for (let i = 1; i < nums.length; i += 2) {
    minY = Math.min(minY, nums[i]!);
    maxY = Math.max(maxY, nums[i]!);
  }
  return { minY, maxY };
}

export function Seal({ id = "seal" }: { id?: string }) {
  const { glyphs, words } = brush.seal;
  const word = words[0]!;
  const ys = Object.values(glyphs).map(bounds);
  const top = Math.min(...ys.map((b) => b.minY));
  const bottom = Math.max(...ys.map((b) => b.maxY));
  // Letters fill 66 of the 100-unit square, centred.
  const scale = Math.min(66 / word.advance, 50 / (bottom - top));
  const tx = 50 - (word.advance * scale) / 2;
  const ty = 50 - ((top + bottom) / 2) * scale;

  return (
    <svg className="seal" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <filter id={`${id}-rough`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.6" />
        </filter>
        <mask id={`${id}-cut`}>
          <rect width="100" height="100" fill="#fff" />
          <rect x="11" y="11" width="78" height="78" fill="none" stroke="#000" strokeWidth="2.2" />
          <g transform={`translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${scale.toFixed(4)})`} fill="#000">
            {word.glyphs.map((g) => (
              <path key={g.id} d={glyphs[g.id]} transform={`translate(${g.x} 0)`} />
            ))}
          </g>
        </mask>
      </defs>
      <g filter={`url(#${id}-rough)`}>
        <rect x="4" y="4" width="92" height="92" rx="2.5" fill="var(--jade)" mask={`url(#${id}-cut)`} />
      </g>
    </svg>
  );
}
