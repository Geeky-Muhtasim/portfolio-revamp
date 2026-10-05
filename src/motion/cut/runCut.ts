import { gsap } from "../gsap";
import { motion } from "../tokens";
import type { CutMode } from "../device";

/*
 * The cut, as the brief defines it:
 *   1. stillness: the scene dims 8% for 120 ms
 *   2. the slash: a diagonal line crosses the screen in 80 ms, 18 to 22
 *      degrees, jade edge glow
 *   3. the split: the halves slide apart and tilt over 250 ms, expo-out,
 *      revealing the next scene beneath
 *   4. the cut always passes through `origin`, the thing it lands on
 *
 * The split is CSS clip-path in every mode. Capable desktops draw the slash
 * with a WebGL shader; everyone else gets a DOM line. Reduced motion gets a
 * crossfade.
 */

export interface SlashRenderer {
  /** `span` is where the line enters and leaves the viewport, in px along it from `origin`. */
  draw(state: { origin: { x: number; y: number }; angleRad: number; span: [number, number]; drawn: number; fade: number }): void;
  show(visible: boolean): void;
}

export interface CutOptions {
  from: HTMLElement;
  /** Viewport point the cut passes through. */
  origin: { x: number; y: number };
  mode: CutMode;
  /** Moves the page so the next scene sits under the halves. Called once, instantly. */
  reveal: () => void;
  webgl?: SlashRenderer | null;
  onSlash?: () => void;
}

/** Distances along the line (from origin, direction d) where it enters and leaves the viewport. */
function viewportSpan(o: { x: number; y: number }, d: { x: number; y: number }, vw: number, vh: number): [number, number] {
  const ts: number[] = [];
  if (d.x) ts.push(-o.x / d.x, (vw - o.x) / d.x);
  if (d.y) ts.push(-o.y / d.y, (vh - o.y) / d.y);
  const inside = ts.filter((t) => {
    const x = o.x + d.x * t, y = o.y + d.y * t;
    return x >= -1 && x <= vw + 1 && y >= -1 && y <= vh + 1;
  });
  return [Math.min(...inside), Math.max(...inside)];
}

function snapshot(from: HTMLElement): HTMLElement {
  const rect = from.getBoundingClientRect();
  const wrap = document.createElement("div");
  wrap.className = "cut-half";
  wrap.setAttribute("aria-hidden", "true");
  wrap.inert = true;
  const clone = from.cloneNode(true) as HTMLElement;
  clone.removeAttribute("id");
  clone.style.cssText = `position:absolute;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;margin:0`;
  const dim = document.createElement("div");
  dim.className = "cut-dim";
  wrap.append(clone, dim);
  return wrap;
}

export function runCut({ from, origin, mode, reveal, webgl, onSlash }: CutOptions): Promise<void> {
  const layer = document.createElement("div");
  layer.className = "cut-layer";
  document.body.append(layer);

  return new Promise((resolve) => {
    const done = () => {
      layer.remove();
      webgl?.show(false);
      resolve();
    };

    if (mode === "fade") {
      const ghost = snapshot(from);
      layer.append(ghost);
      reveal();
      gsap.to(ghost, { opacity: 0, duration: 0.45, ease: "power1.inOut", onComplete: done });
      return;
    }

    const { stillMs, dim, slashMs, splitMs, angleDeg, splitTravel, splitTiltDeg } = motion.cut;
    const vw = window.innerWidth, vh = window.innerHeight;
    const diag = Math.hypot(vw, vh);
    // Rising slash, lower left to upper right.
    const a = (angleDeg * Math.PI) / 180;
    const d = { x: Math.cos(a), y: -Math.sin(a) };
    const n = { x: Math.sin(a), y: Math.cos(a) }; // normal pointing below the line
    const L = diag * 2;
    const p1 = { x: origin.x - d.x * L, y: origin.y - d.y * L };
    const p2 = { x: origin.x + d.x * L, y: origin.y + d.y * L };
    const poly = (s: number) =>
      `polygon(${p1.x}px ${p1.y}px, ${p2.x}px ${p2.y}px, ${p2.x + n.x * L * s}px ${p2.y + n.y * L * s}px, ${p1.x + n.x * L * s}px ${p1.y + n.y * L * s}px)`;

    const upper = snapshot(from);
    const lower = snapshot(from);
    upper.style.clipPath = poly(-1);
    lower.style.clipPath = poly(1);
    for (const half of [upper, lower]) half.style.transformOrigin = `${origin.x}px ${origin.y}px`;
    layer.append(upper, lower);

    // The slash spends its 80 ms where it can be seen: from entry to exit.
    const span = viewportSpan(origin, d, vw, vh);
    const start = { x: origin.x + d.x * span[0], y: origin.y + d.y * span[0] };
    const line = document.createElement("div");
    line.className = "cut-line";
    line.style.cssText = `left:${start.x}px;top:${start.y}px;width:${span[1] - span[0]}px;transform:rotate(${-angleDeg}deg) scaleX(0)`;
    if (mode === "css" || !webgl) layer.append(line);
    else webgl.show(true);

    const dims = layer.querySelectorAll(".cut-dim");
    const slash = { drawn: 0, fade: 0 };
    const paintSlash = () => {
      if (mode === "webgl" && webgl) webgl.draw({ origin, angleRad: a, span, ...slash });
      else line.style.transform = `rotate(${-angleDeg}deg) scaleX(${slash.drawn})`;
      if (mode !== "webgl" || !webgl) line.style.opacity = String(1 - slash.fade);
    };

    const travel = diag * splitTravel;
    const s = (ms: number) => ms / 1000;
    const tl = gsap.timeline({ onComplete: done });
    tl.to(dims, { opacity: dim, duration: s(stillMs), ease: "none" });
    tl.add(() => onSlash?.());
    tl.to(slash, { drawn: 1, duration: s(slashMs), ease: "power1.in", onUpdate: paintSlash });
    tl.add(() => reveal());
    tl.addLabel("split");
    tl.to(upper, { x: -n.x * travel, y: -n.y * travel, rotation: -splitTiltDeg, duration: s(splitMs), ease: "expo.out" }, "split");
    tl.to(lower, { x: n.x * travel, y: n.y * travel, rotation: splitTiltDeg, duration: s(splitMs), ease: "expo.out" }, "split");
    tl.to([upper, lower], { opacity: 0, duration: s(splitMs), ease: "power2.in" }, "split");
    tl.to(slash, { fade: 1, duration: s(splitMs), ease: "power1.out", onUpdate: paintSlash }, "split");
  });
}
