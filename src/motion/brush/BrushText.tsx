import { Fragment, type ReactNode } from "react";
import { brush, getPhrase, strokes, type BrushStroke } from "./data";

/*
 * A phrase drawn with the brush. The server renders it fully written: one
 * <use> of the real outline per glyph, so the words are there with no
 * JavaScript and with reduced motion, at a fraction of the markup. When
 * motion is welcome, the writer (writer.ts) builds stroke masks in the
 * browser and writes each glyph along its own skeleton.
 *
 * Each word is its own inline SVG, so lines wrap like text. Screen readers
 * get the plain text.
 */

interface Props {
  phrase: string;
  className?: string;
  /** Word and glyph whose final stroke lands in jade. */
  jade?: { word: number; glyph: number };
  /** Rendered after the last word, positioned against it (the seal sits beneath "kept"). */
  afterLastWord?: ReactNode;
}

const { upm, ascender, descender } = brush.metrics;
const height = ascender - descender;
const em = (units: number) => `${(units / upm).toFixed(4)}em`;

export function BrushText({ phrase, className, jade, afterLastWord }: Props) {
  const { text, words } = getPhrase(phrase);

  return (
    <span className={`brush ${className ?? ""}`} data-brush={phrase}>
      <span className="sr-only">{text}</span>
      <span className="brush-ink" aria-hidden="true">
        {words.map((word, wi) => {
          const svg = (
            <svg
              className="brush-word"
              viewBox={`0 ${-ascender} ${word.advance} ${height}`}
              style={{ width: em(word.advance), height: em(height), verticalAlign: em(descender) }}
              focusable="false"
              overflow="visible"
              data-word={wi}
            >
              {word.glyphs.map((placed, gi) => {
                const isJade = jade?.word === wi && jade.glyph === gi;
                return (
                  <g key={gi} transform={`translate(${placed.x} 0)`}>
                    <use href={`#bg-${placed.id}`} fill="currentColor" data-glyph={placed.id} data-jade-glyph={isJade ? "" : undefined} />
                    {/* The final stroke is drawn, not revealed: a jade brush crossing the letter. */}
                    {isJade && <FinalStroke stroke={strokes[placed.id]!.at(-1)!} />}
                  </g>
                );
              })}
            </svg>
          );
          const isLast = wi === words.length - 1;
          return (
            <Fragment key={wi}>
              {wi > 0 && " "}
              {isLast && afterLastWord ? (
                <span className="brush-last">
                  {svg}
                  {afterLastWord}
                </span>
              ) : (
                svg
              )}
            </Fragment>
          );
        })}
      </span>
    </span>
  );
}

/**
 * The last stroke of the vow, as a hand would make it: the same line as the
 * letter's crossbar, carried a little past both ends and lifted at the
 * finish, so it reads as a decision rather than a hairline.
 */
function FinalStroke({ stroke }: { stroke: BrushStroke }) {
  const pts = [...stroke.d.matchAll(/(-?\d+) (-?\d+)/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
  const [x0, y0] = pts[0]!;
  const [x1, y1] = pts.at(-1)!;
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const [dx, dy] = [(x1 - x0) / len, (y1 - y0) / len];
  const reach = len * 0.28;
  const sx = x0 - dx * reach, sy = y0 - dy * reach;
  const ex = x1 + dx * reach, ey = y1 + dy * reach - upm * 0.045;
  const mx = (sx + ex) / 2, my = (sy + ey) / 2 + upm * 0.012;
  return (
    <path
      className="brush-final"
      data-jade=""
      data-l={Math.round(len + 2 * reach)}
      d={`M${Math.round(sx)} ${Math.round(sy)}Q${Math.round(mx)} ${Math.round(my)} ${Math.round(ex)} ${Math.round(ey)}`}
      fill="none"
      stroke="var(--jade)"
      strokeWidth={Math.round(upm * 0.085)}
      strokeLinecap="round"
      pathLength={1}
      strokeDasharray="1 2"
      strokeDashoffset={0}
    />
  );
}
