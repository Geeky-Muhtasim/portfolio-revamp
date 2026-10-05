import { gsap } from "../gsap";

/*
 * Terminal typing with a human rhythm: each keystroke jitters, spaces take
 * a little longer, punctuation holds a beat, and a new line waits for its
 * prompt. The rhythm is built from relative weights and then scaled so the
 * whole run lands on the requested duration. Seeded, so it is the same
 * hand every time.
 *
 * Works on TypeLine markup: `.type` containing `.prompt`, `.seg` spans and
 * an optional `.term-cursor`.
 */

interface Line {
  root: HTMLElement;
  prompt: HTMLElement | null;
  segs: Array<{ el: HTMLElement; text: string }>;
}

const lines = new WeakMap<Element, Line>();

function lineFor(container: Element): Line {
  const existing = lines.get(container);
  if (existing) return existing;
  const root = container.querySelector<HTMLElement>(".type")!;
  const line: Line = {
    root,
    prompt: root.querySelector<HTMLElement>(".prompt"),
    segs: [...root.querySelectorAll<HTMLElement>(".seg")].map((el) => ({ el, text: el.dataset.text ?? el.textContent ?? "" })),
  };
  line.segs.forEach((s) => (s.el.dataset.text = s.text));
  lines.set(container, line);
  return line;
}

function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

/** How long a keystroke takes relative to an average one. */
function weight(ch: string, next: string | undefined, rand: () => number) {
  const jitter = 0.6 + rand() * 0.9;
  if (ch === "." || ch === "?") return (next === undefined ? 2 : 6) * jitter;
  if (ch === ",") return 3.2 * jitter;
  if (ch === " ") return 1.35 * jitter;
  return jitter;
}

/** Blanks the lines, ready to be typed. */
export function clearLines(containers: Element[]) {
  for (const c of containers) {
    const line = lineFor(c);
    // The untyped rest stays as an invisible ghost, so nothing reflows while typing.
    line.segs.forEach((s) => {
      s.el.textContent = "";
      s.el.dataset.rest = s.text;
    });
    line.root.dataset.pending = "";
  }
}

/** Shows the lines fully typed. */
export function fillLines(containers: Element[]) {
  for (const c of containers) {
    const line = lineFor(c);
    line.segs.forEach((s) => {
      s.el.textContent = s.text;
      delete s.el.dataset.rest;
    });
    delete line.root.dataset.pending;
  }
}

export interface TypeOptions {
  durationMs: number;
  /** The beat a new line waits after its prompt appears, as keystroke weights. */
  lineGap?: number;
  /** The cursor to carry along; it rests on the last line when done. */
  cursor?: HTMLElement | null;
  seed?: number;
  onKey?: (ch: string) => void;
  /** Called once, whether the typing ran out or was finished early. */
  onDone?: () => void;
}

export interface Typing {
  timeline: gsap.core.Timeline;
  /** Completes the typing at once. */
  finish: () => void;
}

export function typeLines(containers: Element[], options: TypeOptions): Typing {
  const { durationMs, lineGap = 7, cursor = null, seed = 7, onKey, onDone } = options;
  const rand = seeded(seed);
  const all = containers.map(lineFor);
  clearLines(containers);

  type Step = { at: number; run: () => void };
  const steps: Step[] = [];
  let t = 0;

  all.forEach((line, li) => {
    if (li > 0) t += lineGap;
    steps.push({
      at: t,
      run: () => {
        delete line.root.dataset.pending;
        if (cursor) {
          cursor.classList.remove("is-final");
          line.segs[0]?.el.append(cursor);
        }
      },
    });
    t += 1.5;
    line.segs.forEach((seg, si) => {
      for (let i = 0; i < seg.text.length; i++) {
        const ch = seg.text[i]!;
        const isLastChar = si === line.segs.length - 1 && i === seg.text.length - 1;
        steps.push({
          at: t,
          run: () => {
            seg.el.textContent = seg.text.slice(0, i + 1);
            seg.el.dataset.rest = seg.text.slice(i + 1);
            // Inside the segment, so the cursor sits before the ghost of what is still to come.
            if (cursor) seg.el.append(cursor);
            onKey?.(ch);
          },
        });
        t += weight(ch, isLastChar ? undefined : seg.text[i + 1], rand);
      }
    });
  });

  const unit = durationMs / 1000 / Math.max(t, 1);
  const timeline = gsap.timeline({ paused: true });
  for (const step of steps) timeline.call(step.run, undefined, step.at * unit);
  timeline.set({}, {}, t * unit);

  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    fillLines(containers);
    const last = all.at(-1);
    if (cursor && last) {
      (last.segs.at(-1)?.el ?? last.root).after(cursor);
      cursor.classList.add("is-final");
    }
    onDone?.();
  };
  timeline.eventCallback("onComplete", settle);

  return {
    timeline,
    finish: () => {
      timeline.kill();
      settle();
    },
  };
}
