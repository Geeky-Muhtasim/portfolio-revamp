import { gsap } from "../gsap";
import { motion } from "../tokens";
import type { CutMode } from "../device";

/*
 * The glitch slash, as the brief defines it:
 *   1. freeze: the frame holds about 100 ms while the scanlines intensify
 *   2. impact: a crimson slash crosses in about 80 ms at 18 to 22 degrees,
 *      anime speed lines radiating from it
 *   3. split: the screen tears along the slash with a brief RGB channel
 *      offset and a few horizontal glitch bands while the halves slide
 *      apart over about 250 ms, revealing the next scene
 *   4. it always passes through `origin`, the thing it lands on
 *
 * The frame is a snapshot of the world and the current scene. The split is
 * clip-path in every mode. "webgl" mode (capable desktops) adds the RGB
 * offset through an SVG filter; "css" mode (mobile, low power) keeps the
 * bands and speed lines; "fade" (reduced motion) is a crossfade.
 */

export interface SlashOptions {
  from: HTMLElement;
  /** Viewport point the slash passes through. */
  origin: { x: number; y: number };
  mode: CutMode;
  /** Moves the page so the next scene sits under the halves. Called once, instantly. */
  reveal: () => void;
  onImpact?: () => void;
  /** Raises the CRT overlay's scanline intensity, 0 to 1. */
  intensity?: (value: number) => void;
}

const SVG_NS = "http://www.w3.org/2000/svg";

/** A still of the world plus the scene, as one layer. */
function snapshot(from: HTMLElement): HTMLElement {
  const frame = document.createElement("div");
  frame.className = "slash-frame";
  frame.setAttribute("aria-hidden", "true");
  frame.inert = true;
  const world = document.querySelector(".world");
  if (world) frame.append(world.cloneNode(true));
  // In a tall scroll scene what is on screen is its sticky stage, not the top of the section.
  const stage = from.querySelector<HTMLElement>(".stage");
  const visible = stage && getComputedStyle(stage).position === "sticky" ? stage : from;
  const rect = visible.getBoundingClientRect();
  const scene = visible.cloneNode(true) as HTMLElement;
  scene.removeAttribute("id");
  scene.style.cssText = `position:absolute;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;margin:0`;
  frame.append(scene);
  return frame;
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

/**
 * Anime speed lines: a burst of thin wedges radiating from the impact
 * point, sharp near the strike and widening toward the frame's edge,
 * leaving a clear ring around the point itself.
 */
function speedLines(origin: { x: number; y: number }, reach: number, count: number) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", "slash-speed");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  let seed = 41;
  const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + (rand() - 0.5) * 0.12;
    const inner = reach * (0.12 + rand() * 0.18);
    const outer = reach * (0.42 + rand() * 0.5);
    const half = (0.0025 + rand() * 0.006) * (outer / reach);
    const at = (r: number, a: number) => `${(origin.x + Math.cos(a) * r).toFixed(1)},${(origin.y + Math.sin(a) * r).toFixed(1)}`;
    const poly = document.createElementNS(SVG_NS, "polygon");
    poly.setAttribute("points", `${at(inner, angle)} ${at(outer, angle - half)} ${at(outer, angle + half)}`);
    poly.setAttribute("fill", i % 7 === 0 ? "var(--crimson)" : "var(--cel-cream)");
    svg.append(poly);
  }
  return svg;
}

export function glitchSlash({ from, origin, mode, reveal, onImpact, intensity }: SlashOptions): Promise<void> {
  const layer = document.createElement("div");
  layer.className = "slash-layer";
  document.body.append(layer);
  const root = document.documentElement;

  return new Promise((resolve) => {
    const done = () => {
      layer.remove();
      root.classList.remove("is-freezing");
      intensity?.(0);
      resolve();
    };

    if (mode === "fade") {
      const ghost = snapshot(from);
      layer.append(ghost);
      reveal();
      gsap.to(ghost, { opacity: 0, duration: 0.45, ease: "power1.inOut", onComplete: done });
      return;
    }

    const { freezeMs, impactMs, splitMs, angleDeg, splitTravel, splitTiltDeg, rgbOffsetPx, glitchBands } = motion.slash;
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

    // Glitch bands: thin horizontal slices of the frame, knocked sideways for a few frames.
    const bands: HTMLElement[] = [];
    const bandCount = mode === "webgl" ? glitchBands : Math.ceil(glitchBands / 2);
    for (let i = 0; i < bandCount; i++) {
      const band = snapshot(from);
      const top = 0.12 + ((i * 0.618) % 1) * 0.76;
      const h = 0.012 + (i % 3) * 0.01;
      band.style.clipPath = `inset(${(top * 100).toFixed(2)}% 0 ${((1 - top - h) * 100).toFixed(2)}% 0)`;
      band.style.opacity = "0";
      bands.push(band);
      layer.append(band);
    }

    const span = viewportSpan(origin, d, vw, vh);
    const start = { x: origin.x + d.x * span[0], y: origin.y + d.y * span[0] };
    const line = document.createElement("div");
    line.className = "slash-line";
    line.style.cssText = `left:${start.x}px;top:${start.y}px;width:${span[1] - span[0]}px;transform:rotate(${-angleDeg}deg) scaleX(0)`;
    const speed = speedLines(origin, diag, mode === "webgl" ? 44 : 26);
    speed.style.opacity = "0";
    layer.append(speed, line);

    const travel = diag * splitTravel;
    const s = (ms: number) => ms / 1000;
    const tl = gsap.timeline({ onComplete: done });

    // 1. Freeze.
    tl.add(() => {
      root.classList.add("is-freezing");
      intensity?.(1);
    });
    tl.to({}, { duration: s(freezeMs) });

    // 2. Impact.
    tl.add(() => onImpact?.());
    tl.to(line, { scaleX: 1, duration: s(impactMs), ease: "power2.in", transformOrigin: "0 50%", rotation: -angleDeg });
    tl.fromTo(speed, { opacity: 0, scale: 0.6, transformOrigin: `${origin.x}px ${origin.y}px` }, { opacity: 0.85, scale: 1, duration: s(impactMs), ease: "power2.out" }, "<");

    // 3. Split.
    tl.addLabel("split");
    tl.add(() => {
      reveal();
      root.classList.remove("is-freezing");
      intensity?.(0.4);
      if (mode === "webgl") for (const half of [upper, lower]) half.style.filter = "url(#rgb-split)";
    }, "split");
    tl.to(upper, { x: -n.x * travel, y: -n.y * travel, rotation: -splitTiltDeg, duration: s(splitMs), ease: "expo.out" }, "split");
    tl.to(lower, { x: n.x * travel, y: n.y * travel, rotation: splitTiltDeg, duration: s(splitMs), ease: "expo.out" }, "split");
    tl.to([upper, lower], { opacity: 0, duration: s(splitMs), ease: "power3.in" }, "split");
    tl.add(() => {
      for (const half of [upper, lower]) half.style.filter = "";
    }, `split+=${s(splitMs * 0.45)}`);
    bands.forEach((band, i) => {
      const shift = (i % 2 ? 1 : -1) * (rgbOffsetPx * 4 + i * 9);
      tl.set(band, { opacity: 1, x: shift }, `split+=${s(i * 18)}`);
      tl.set(band, { x: -shift * 0.5 }, `split+=${s(i * 18 + 40)}`);
      tl.set(band, { opacity: 0 }, `split+=${s(i * 18 + 80)}`);
    });
    tl.to(line, { opacity: 0, duration: s(splitMs), ease: "power1.out" }, "split");
    tl.to(speed, { opacity: 0, scale: 1.25, duration: s(splitMs * 0.8), ease: "power2.out" }, "split");
  });
}
