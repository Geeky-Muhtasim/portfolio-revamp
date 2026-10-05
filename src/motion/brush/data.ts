import data from "./generated/glyphs.json";
import strokeData from "./generated/strokes.json";

/*
 * The shared brush interface. Generated strokes today; hand-lettered
 * strokes later. Anything that provides these shapes can be written.
 *
 * Server code reads outlines and layout from here. The browser reads
 * strokes from strokes.ts, which ships only in the lazy motion chunk.
 */

export interface BrushStroke {
  /** Centreline path in font units, y down, baseline at 0. */
  d: string;
  /** Brush width in font units. */
  w: number;
  /** Length in font units; paces the writing. */
  l: number;
}

export interface BrushWord {
  text: string;
  advance: number;
  glyphs: Array<{ id: string; x: number }>;
}

export interface BrushData {
  metrics: { upm: number; ascender: number; descender: number; space: number };
  outlines: Record<string, string>;
  phrases: Record<string, { text: string; words: BrushWord[] }>;
  seal: { text: string; glyphs: Record<string, string>; words: BrushWord[] };
}

export const brush = data as BrushData;
export const strokes = strokeData as Record<string, BrushStroke[]>;

export function getPhrase(key: string) {
  const phrase = brush.phrases[key];
  if (!phrase) throw new Error(`No brush data for "${key}". Run npm run glyphs.`);
  return phrase;
}
