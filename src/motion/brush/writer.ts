import { gsap } from "../gsap";

/*
 * Animates BrushText masks. Strokes are paced by their real length, ease
 * in and out like a brush, and overlap slightly so the hand never stops.
 * A short beat separates words and a longer one separates lines.
 */

interface GlyphMask {
  strokes: SVGPathElement[];
  fill: SVGRectElement | null;
  word: number;
}

function glyphMasks(root: Element): GlyphMask[] {
  return [...root.querySelectorAll<SVGMaskElement>("mask[data-g]")].map((mask) => ({
    strokes: [...mask.querySelectorAll<SVGPathElement>("path.bs")],
    fill: mask.querySelector<SVGRectElement>("rect[data-c]"),
    word: Number(mask.dataset.word ?? 0),
  }));
}

const isDot = (p: SVGPathElement) => p.hasAttribute("data-dot");

/** Puts every stroke of these phrases back in the inkwell. */
export function hideBrush(roots: Element[]) {
  for (const root of roots) {
    root.querySelectorAll<SVGPathElement>("path.bs").forEach((p) => {
      p.style.opacity = "0";
      if (!isDot(p)) p.setAttribute("stroke-dashoffset", "1");
    });
    root.querySelectorAll<SVGRectElement>("rect[data-c]").forEach((r) => (r.style.opacity = "0"));
  }
}

/** Shows every stroke at once: the written state. */
export function showBrush(roots: Element[]) {
  for (const root of roots) {
    root.querySelectorAll<SVGPathElement>("path.bs").forEach((p) => {
      p.style.opacity = "";
      if (!isDot(p)) p.setAttribute("stroke-dashoffset", "0");
    });
    root.querySelectorAll<SVGRectElement>("rect[data-c]").forEach((r) => (r.style.opacity = ""));
  }
}

export interface WriteOptions {
  /** Total time for all regular strokes, gaps included. */
  durationMs: number;
  wordGapMs?: number;
  lineGapMs?: number;
  /** The final jade stroke: a held breath, then one slower stroke. */
  finale?: { pauseMs: number; strokeMs: number };
  /** Fraction of a stroke after which the next one begins. */
  overlap?: number;
}

export function writeBrush(roots: Element[], options: WriteOptions): gsap.core.Timeline {
  const { durationMs, wordGapMs = 70, lineGapMs = 200, finale, overlap = 0.72 } = options;
  const lines = roots.map(glyphMasks);
  const tl = gsap.timeline({ paused: true });
  // The hand's own rhythm is built at a nominal pace, then scaled to the brief's duration.
  const main = gsap.timeline();
  const totalLength = lines.flat().reduce((sum, g) => sum + g.strokes.reduce((s, p) => s + Number(p.dataset.l ?? 1), 0), 0);
  const budget = Math.max(0.4, durationMs / 1000);

  let t = 0;
  lines.forEach((glyphs, li) => {
    if (li > 0) t += lineGapMs / 1000;
    let word = glyphs[0]?.word ?? 0;
    for (const glyph of glyphs) {
      if (glyph.word !== word) {
        t += wordGapMs / 1000;
        word = glyph.word;
      }
      let end = t;
      for (const stroke of glyph.strokes) {
        const dur = Math.max(0.018, (Number(stroke.dataset.l ?? 1) / totalLength) * budget);
        main.set(stroke, { opacity: 1 }, t);
        if (!isDot(stroke)) {
          main.to(stroke, { attr: { "stroke-dashoffset": 0 }, duration: dur, ease: "power1.inOut" }, t);
        }
        end = Math.max(end, t + dur);
        t += dur * overlap;
      }
      // Once its strokes are down, the glyph is whole: serif tips and all.
      if (glyph.fill && !glyph.fill.hasAttribute("data-late")) main.set(glyph.fill, { opacity: 1 }, end);
      // The next letter starts as this one's last stroke lifts.
      t = Math.max(t, end - 0.01);
    }
  });

  main.timeScale(Math.max(main.duration(), 0.001) / budget);
  tl.add(main, 0);
  t = budget;

  const jade = roots.flatMap((r) => [...r.querySelectorAll<SVGPathElement>("path.bs[data-jade]")]);
  if (finale && jade.length) {
    t += finale.pauseMs / 1000;
    for (const stroke of jade) {
      tl.set(stroke, { opacity: 1 }, t);
      tl.to(stroke, { attr: { "stroke-dashoffset": 0 }, duration: finale.strokeMs / 1000, ease: "power2.inOut" }, t);
    }
    const kept = t + finale.strokeMs / 1000;
    roots.forEach((r) => r.querySelectorAll("rect[data-late]").forEach((rect) => tl.set(rect, { opacity: 1 }, kept)));
    tl.addLabel("kept", kept);
  }
  return tl;
}
