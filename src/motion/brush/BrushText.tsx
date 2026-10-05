import { Fragment, type ReactNode } from "react";
import { brush, getPhrase } from "./data";

/*
 * A phrase drawn with the brush. Server rendered and fully written, so the
 * words are there with no JavaScript and with reduced motion. The writer
 * (writer.ts) hides and rewrites the masks when motion is welcome.
 *
 * Each word is its own inline SVG, so lines wrap like text. Each glyph is
 * its real outline, revealed through a mask of brush strokes that follow
 * the letter's skeleton. Screen readers get the plain text.
 */

interface Props {
  phrase: string;
  /** Unique per page when a phrase appears more than once. */
  instance?: string;
  className?: string;
  /** Word and glyph whose final stroke lands in jade. */
  jade?: { word: number; glyph: number };
  /** Rendered after the last word, positioned against it (the seal sits beneath "kept"). */
  afterLastWord?: ReactNode;
}

const { upm, ascender, descender } = brush.metrics;
const height = ascender - descender;
const em = (units: number) => `${(units / upm).toFixed(4)}em`;

export function BrushText({ phrase, instance, className, jade, afterLastWord }: Props) {
  const { text, words } = getPhrase(phrase);
  const prefix = `b-${(instance ?? phrase).replace(/[^a-z0-9]+/gi, "-")}`;

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
            >
              <defs>
                {word.glyphs.map((placed, gi) => {
                  const glyph = brush.glyphs[placed.id]!;
                  const isJade = jade?.word === wi && jade.glyph === gi;
                  const strokes = isJade ? glyph.strokes.slice(0, -1) : glyph.strokes;
                  const id = `${prefix}-${wi}-${gi}`;
                  return (
                    <Fragment key={id}>
                      <mask id={id} data-g="" data-word={wi} maskUnits="userSpaceOnUse" x={-200} y={-ascender - 200} width={word.advance + 400} height={height + 400}>
                        {strokes.map((s, si) => (
                          <BrushStrokePath key={si} stroke={s} />
                        ))}
                        <rect data-c="" data-late={isJade ? "" : undefined} x={-200} y={-ascender - 200} width={word.advance + 400} height={height + 400} fill="#fff" />
                      </mask>
                    </Fragment>
                  );
                })}
              </defs>
              {word.glyphs.map((placed, gi) => {
                const id = `${prefix}-${wi}-${gi}`;
                const isJade = jade?.word === wi && jade.glyph === gi;
                return (
                  <g key={id} transform={`translate(${placed.x} 0)`}>
                    <use href={`#bg-${placed.id}`} mask={`url(#${id})`} fill="currentColor" />
                    {/* The final stroke is drawn, not revealed: a jade brush crossing the letter. */}
                    {isJade && <BrushStrokePath stroke={finalStroke(brush.glyphs[placed.id]!.strokes.at(-1)!)} jade />}
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
function finalStroke(stroke: { d: string; w: number; l: number }) {
  const pts = [...stroke.d.matchAll(/(-?\d+) (-?\d+)/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
  const [x0, y0] = pts[0]!;
  const [x1, y1] = pts.at(-1)!;
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const [dx, dy] = [(x1 - x0) / len, (y1 - y0) / len];
  const reach = len * 0.28;
  const sx = x0 - dx * reach, sy = y0 - dy * reach;
  const ex = x1 + dx * reach, ey = y1 + dy * reach - upm * 0.045;
  const mx = (sx + ex) / 2, my = (sy + ey) / 2 + upm * 0.012;
  const d = `M${Math.round(sx)} ${Math.round(sy)}Q${Math.round(mx)} ${Math.round(my)} ${Math.round(ex)} ${Math.round(ey)}`;
  return { d, w: Math.round(upm * 0.085), l: Math.round(len + 2 * reach) };
}

function BrushStrokePath({ stroke, jade }: { stroke: { d: string; w: number; l: number }; jade?: boolean }) {
  const dot = stroke.l <= 2;
  return (
    <path
      data-l={stroke.l}
      data-dot={dot ? "" : undefined}
      data-jade={jade ? "" : undefined}
      className={jade ? "bs brush-final" : "bs"}
      d={stroke.d}
      fill="none"
      stroke={jade ? "var(--jade)" : "#fff"}
      strokeWidth={stroke.w}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={dot ? undefined : 1}
      strokeDasharray={dot ? undefined : "1 2"}
      strokeDashoffset={dot ? undefined : 0}
    />
  );
}
