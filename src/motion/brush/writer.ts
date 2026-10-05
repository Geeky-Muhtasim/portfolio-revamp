import { gsap } from "../gsap";
import type { BrushStroke } from "./data";
import strokeTable from "./generated/strokes.json";

/*
 * Writes BrushText. The server sends each phrase fully written; here, in
 * the lazy motion chunk, every glyph gets a mask of brush strokes that
 * follow its skeleton. Strokes are paced by their real length, ease in and
 * out like a brush, and overlap slightly so the hand never stops. A short
 * beat separates words and a longer one separates lines.
 */

const STROKES = strokeTable as Record<string, BrushStroke[]>;
const SVG_NS = "http://www.w3.org/2000/svg";
let maskSeq = 0;

interface GlyphMask {
  strokes: SVGPathElement[];
  fill: SVGRectElement;
  word: number;
  /** The jade glyph: its paper fill waits for the final stroke. */
  late: boolean;
}

const built = new WeakMap<Element, GlyphMask[]>();

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/** Builds (once) the stroke masks for every glyph in a phrase. */
function masksFor(root: Element): GlyphMask[] {
  const existing = built.get(root);
  if (existing) return existing;
  const list: GlyphMask[] = [];
  for (const svg of root.querySelectorAll<SVGSVGElement>("svg.brush-word")) {
    const word = Number(svg.dataset.word ?? 0);
    const defs = svg.insertBefore(svgEl("defs", {}), svg.firstChild);
    for (const use of svg.querySelectorAll<SVGUseElement>("use[data-glyph]")) {
      const late = use.hasAttribute("data-jade-glyph");
      const all = STROKES[use.dataset.glyph ?? ""] ?? [];
      const own = late ? all.slice(0, -1) : all;
      const mask = svgEl("mask", {
        id: `bm${++maskSeq}`,
        fill: "none",
        stroke: "#fff",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      });
      const paths = own.map((s) => {
        const dot = s.l <= 2;
        const p = svgEl("path", dot ? { d: s.d, "stroke-width": s.w } : { d: s.d, "stroke-width": s.w, pathLength: 1, "stroke-dasharray": "1 2", "stroke-dashoffset": 0 });
        p.dataset.l = String(s.l);
        if (dot) p.dataset.dot = "";
        mask.append(p);
        return p;
      });
      // Once its strokes are down the glyph is whole, serif tips and all.
      const fill = svgEl("rect", { x: -5000, y: -5000, width: 10000, height: 10000, fill: "#fff" });
      mask.append(fill);
      defs.append(mask);
      use.setAttribute("mask", `url(#${mask.id})`);
      list.push({ strokes: paths, fill, word, late });
    }
  }
  built.set(root, list);
  return list;
}

const isDot = (p: SVGPathElement) => p.hasAttribute("data-dot");
const finals = (roots: Element[]) => roots.flatMap((r) => [...r.querySelectorAll<SVGPathElement>("path[data-jade]")]);

/** Puts every stroke of these phrases back in the inkwell. */
export function hideBrush(roots: Element[]) {
  for (const root of roots) {
    for (const g of masksFor(root)) {
      g.fill.style.opacity = "0";
      for (const p of g.strokes) {
        p.style.opacity = "0";
        if (!isDot(p)) p.setAttribute("stroke-dashoffset", "1");
      }
    }
  }
  for (const p of finals(roots)) {
    p.style.opacity = "0";
    p.setAttribute("stroke-dashoffset", "1");
  }
}

/** Shows every stroke at once: the written state. */
export function showBrush(roots: Element[]) {
  for (const root of roots) {
    for (const g of built.get(root) ?? []) {
      g.fill.style.opacity = "";
      for (const p of g.strokes) {
        p.style.opacity = "";
        if (!isDot(p)) p.setAttribute("stroke-dashoffset", "0");
      }
    }
  }
  for (const p of finals(roots)) {
    p.style.opacity = "";
    p.setAttribute("stroke-dashoffset", "0");
  }
}

export interface WriteOptions {
  /** Time for all regular strokes, gaps included. */
  durationMs: number;
  wordGapMs?: number;
  lineGapMs?: number;
  /** The final jade stroke: a held breath, then one slower stroke. */
  finale?: { pauseMs: number; strokeMs: number };
  /** Fraction of a stroke after which the next one begins. */
  overlap?: number;
}

/** A paused timeline that writes the phrases. Call hideBrush first. */
export function writeBrush(roots: Element[], options: WriteOptions): gsap.core.Timeline {
  const { durationMs, wordGapMs = 70, lineGapMs = 200, finale, overlap = 0.72 } = options;
  const lines = roots.map(masksFor);
  const tl = gsap.timeline({ paused: true });
  // The hand's own rhythm is built at a nominal pace, then scaled to the brief's duration.
  const main = gsap.timeline();
  const totalLength = lines.flat().reduce((sum, g) => sum + g.strokes.reduce((s, p) => s + Number(p.dataset.l ?? 1), 0), 0) || 1;
  const budget = Math.max(0.3, durationMs / 1000);

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
        if (!isDot(stroke)) main.to(stroke, { attr: { "stroke-dashoffset": 0 }, duration: dur, ease: "power1.inOut" }, t);
        end = Math.max(end, t + dur);
        t += dur * overlap;
      }
      if (!glyph.late) main.set(glyph.fill, { opacity: 1 }, end);
      // The next letter starts as this one's last stroke lifts.
      t = Math.max(t, end - 0.01);
    }
  });

  main.timeScale(Math.max(main.duration(), 0.001) / budget);
  tl.add(main, 0);
  t = budget;

  const jade = finals(roots);
  if (finale && jade.length) {
    t += finale.pauseMs / 1000;
    for (const stroke of jade) {
      tl.set(stroke, { opacity: 1 }, t);
      tl.to(stroke, { attr: { "stroke-dashoffset": 0 }, duration: finale.strokeMs / 1000, ease: "power2.inOut" }, t);
    }
    const kept = t + finale.strokeMs / 1000;
    for (const g of lines.flat()) if (g.late) tl.set(g.fill, { opacity: 1 }, kept);
    tl.addLabel("kept", kept);
  }
  return tl;
}
