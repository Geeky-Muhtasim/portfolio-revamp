/*
 * Build-time brush data for written headlines.
 *
 * For every phrase the site writes with a brush, this fetches a tiny subset
 * of Shippori Mincho B1 (OFL) containing only the characters it needs, then
 * for each glyph:
 *   1. takes the real outline (what the visitor finally sees),
 *   2. rasterises it and computes a distance transform (stroke thickness),
 *   3. thins it to a one-pixel skeleton,
 *   4. turns the skeleton into a graph, prunes serif spurs, and pairs
 *      edges through junctions by straightness into strokes,
 *   5. orders and orients the strokes like a hand would write them.
 *
 * The strokes become an animated SVG mask that reveals the outline along
 * its own letterforms. Output: src/motion/brush/generated/glyphs.json.
 *
 * Run with `npm run glyphs` whenever brushed copy in src/config/site.ts changes.
 * Hand-lettered strokes can replace the generated ones later: same format.
 */

import opentype from "opentype.js";
import { mkdirSync, writeFileSync } from "node:fs";
import { blades, vow } from "../src/config/site.ts";

type Pt = [number, number];

const OUT = "src/motion/brush/generated/glyphs.json";
const STROKES_OUT = "src/motion/brush/generated/strokes.json";
const FAMILY = "Shippori+Mincho+B1";
/** Raster pixels per font unit. 1000 upm -> 260 px em, stems about 20 px. */
const SCALE = 0.26;

export const PHRASES: Record<string, string> = {
  ...Object.fromEntries(vow.lines.map((line, i) => [`vow.${i}`, line])),
  ...Object.fromEntries(blades.flatMap((b) => [[`blade.${b.id}.label`, b.label], [`blade.${b.id}.line`, b.line]])),
};
const SEAL_TEXT = "MIS";

/* ---------- font loading ---------- */

async function loadFont(weight: number, text: string) {
  const chars = [...new Set(text + " ")].sort().join("");
  const css = await (
    await fetch(`https://fonts.googleapis.com/css2?family=${FAMILY}:wght@${weight}&text=${encodeURIComponent(chars)}`, {
      headers: { "User-Agent": "node" },
    })
  ).text();
  const url = /url\((https:[^)]+)\)\s*format\('truetype'\)/.exec(css)?.[1];
  if (!url) throw new Error(`no truetype url in font css:\n${css}`);
  const buffer = await (await fetch(url)).arrayBuffer();
  return opentype.parse(buffer);
}

/* ---------- geometry helpers ---------- */

/** Path data with explicit separators. (opentype's compact output can run numbers together.) */
function pathData(path: opentype.Path): string {
  const r = (n: number) => String(Math.round(n));
  return path.commands
    .map((c) => {
      switch (c.type) {
        case "M":
        case "L":
          return `${c.type}${r(c.x)} ${r(c.y)}`;
        case "Q":
          return `Q${r(c.x1)} ${r(c.y1)} ${r(c.x)} ${r(c.y)}`;
        case "C":
          return `C${r(c.x1)} ${r(c.y1)} ${r(c.x2)} ${r(c.y2)} ${r(c.x)} ${r(c.y)}`;
        default:
          return "Z";
      }
    })
    .join("");
}

function flatten(path: opentype.Path): Pt[][] {
  const contours: Pt[][] = [];
  let cur: Pt[] = [];
  let last: Pt = [0, 0];
  for (const c of path.commands) {
    if (c.type === "M") {
      if (cur.length) contours.push(cur);
      cur = [[c.x, c.y]];
      last = [c.x, c.y];
    } else if (c.type === "L") {
      cur.push([c.x, c.y]);
      last = [c.x, c.y];
    } else if (c.type === "Q") {
      for (let i = 1; i <= 10; i++) {
        const t = i / 10, u = 1 - t;
        cur.push([u * u * last[0] + 2 * u * t * c.x1 + t * t * c.x, u * u * last[1] + 2 * u * t * c.y1 + t * t * c.y]);
      }
      last = [c.x, c.y];
    } else if (c.type === "C") {
      for (let i = 1; i <= 14; i++) {
        const t = i / 14, u = 1 - t;
        cur.push([
          u * u * u * last[0] + 3 * u * u * t * c.x1 + 3 * u * t * t * c.x2 + t * t * t * c.x,
          u * u * u * last[1] + 3 * u * u * t * c.y1 + 3 * u * t * t * c.y2 + t * t * t * c.y,
        ]);
      }
      last = [c.x, c.y];
    } else if (c.type === "Z") {
      if (cur.length) contours.push(cur);
      cur = [];
    }
  }
  if (cur.length) contours.push(cur);
  return contours;
}

interface Raster {
  w: number;
  h: number;
  ox: number; // font units at pixel x = 0
  oy: number;
  px: Uint8Array;
}

/** Non-zero scanline fill sampled at pixel centres. */
function rasterise(contours: Pt[][]): Raster {
  const xs = contours.flat().map((p) => p[0]);
  const ys = contours.flat().map((p) => p[1]);
  const pad = 4 / SCALE;
  const ox = Math.min(...xs) - pad, oy = Math.min(...ys) - pad;
  const w = Math.ceil((Math.max(...xs) + pad - ox) * SCALE);
  const h = Math.ceil((Math.max(...ys) + pad - oy) * SCALE);
  const px = new Uint8Array(w * h);
  const edges = contours.flatMap((c) => c.map((p, i) => [p, c[(i + 1) % c.length]!] as [Pt, Pt]));
  for (let row = 0; row < h; row++) {
    const y = oy + (row + 0.5) / SCALE;
    const hits: Array<[number, number]> = [];
    for (const [a, b] of edges) {
      if (a[1] === b[1]) continue;
      const up = a[1] < b[1];
      const [lo, hi] = up ? [a, b] : [b, a];
      if (y < lo[1] || y >= hi[1]) continue;
      hits.push([lo[0] + ((y - lo[1]) / (hi[1] - lo[1])) * (hi[0] - lo[0]), up ? 1 : -1]);
    }
    hits.sort((p, q) => p[0] - q[0]);
    let wind = 0;
    for (let i = 0; i < hits.length - 1; i++) {
      wind += hits[i]![1];
      if (wind === 0) continue;
      const x0 = Math.ceil((hits[i]![0] - ox) * SCALE - 0.5), x1 = Math.floor((hits[i + 1]![0] - ox) * SCALE - 0.5);
      for (let x = Math.max(0, x0); x <= Math.min(w - 1, x1); x++) px[row * w + x] = 1;
    }
  }
  return { w, h, ox, oy, px };
}

/** Exact Euclidean distance to the nearest background pixel (Felzenszwalb). */
function distanceTransform({ w, h, px }: Raster): Float64Array {
  const INF = 1e12;
  const f = new Float64Array(w * h);
  for (let i = 0; i < w * h; i++) f[i] = px[i] ? INF : 0;
  const edt1d = (get: (i: number) => number, set: (i: number, v: number) => void, n: number) => {
    const v = new Int32Array(n), z = new Float64Array(n + 1), d = new Float64Array(n);
    let k = 0;
    v[0] = 0; z[0] = -INF; z[1] = INF;
    for (let q = 1; q < n; q++) {
      let s = ((get(q) + q * q) - (get(v[k]!) + v[k]! * v[k]!)) / (2 * q - 2 * v[k]!);
      while (s <= z[k]!) {
        k--;
        s = ((get(q) + q * q) - (get(v[k]!) + v[k]! * v[k]!)) / (2 * q - 2 * v[k]!);
      }
      k++; v[k] = q; z[k] = s; z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < n; q++) {
      while (z[k + 1]! < q) k++;
      d[q] = (q - v[k]!) ** 2 + get(v[k]!);
    }
    for (let q = 0; q < n; q++) set(q, d[q]!);
  };
  for (let x = 0; x < w; x++) edt1d((i) => f[i * w + x]!, (i, val) => (f[i * w + x] = val), h);
  for (let y = 0; y < h; y++) edt1d((i) => f[y * w + i]!, (i, val) => (f[y * w + i] = val), w);
  for (let i = 0; i < w * h; i++) f[i] = Math.sqrt(f[i]!);
  return f;
}

const N8: Pt[] = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];

/** Zhang-Suen thinning. */
function thin({ w, h, px }: Raster): Uint8Array {
  const img = px.slice();
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : img[y * w + x]!);
  let changed = true;
  while (changed) {
    changed = false;
    for (const pass of [0, 1]) {
      const remove: number[] = [];
      for (let y = 0; y < h; y++)
        for (let x = 0; x < w; x++) {
          if (!img[y * w + x]) continue;
          const p = N8.map(([dx, dy]) => at(x + dx, y + dy));
          const b = p.reduce((s, v) => s + v, 0);
          if (b < 2 || b > 6) continue;
          let a = 0;
          for (let i = 0; i < 8; i++) if (!p[i] && p[(i + 1) % 8]) a++;
          if (a !== 1) continue;
          const [p2, , p4, , p6, , p8] = p;
          if (pass === 0 ? p2! * p4! * p6! || p4! * p6! * p8! : p2! * p4! * p8! || p2! * p6! * p8!) continue;
          remove.push(y * w + x);
        }
      for (const i of remove) img[i] = 0;
      if (remove.length) changed = true;
    }
  }
  // Zhang-Suen can erase a small round blob (a dot) completely. Any filled
  // component left without a skeleton pixel gets one at its middle.
  const seen = new Uint8Array(w * h);
  for (let start = 0; start < w * h; start++) {
    if (!px[start] || seen[start]) continue;
    const comp: number[] = [];
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      comp.push(i);
      const x = i % w, y = (i - x) / w;
      for (const [dx, dy] of N8) {
        const nx = x + dx, ny = y + dy, j = ny * w + nx;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h && px[j] && !seen[j]) {
          seen[j] = 1;
          stack.push(j);
        }
      }
    }
    if (comp.some((i) => img[i])) continue;
    const cx = comp.reduce((s, i) => s + (i % w), 0) / comp.length;
    const cy = comp.reduce((s, i) => s + Math.floor(i / w), 0) / comp.length;
    img[Math.round(cy) * w + Math.round(cx)] = 1;
  }
  return img;
}

/* ---------- skeleton graph -> strokes ---------- */

interface Edge {
  a: number; // node id or -1 for a loop
  b: number;
  pts: Pt[];
  alive: boolean;
}

function skeletonEdges(sk: Uint8Array, w: number, h: number) {
  const on = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && sk[y * w + x] === 1;
  const nbrs = (x: number, y: number) => N8.map(([dx, dy]) => [x + dx, y + dy] as Pt).filter(([nx, ny]) => on(nx, ny));
  const crossing = (x: number, y: number) => {
    const p = N8.map(([dx, dy]) => (on(x + dx, y + dy) ? 1 : 0));
    let c = 0;
    for (let i = 0; i < 8; i++) if (!p[i] && p[(i + 1) % 8]) c++;
    return c;
  };

  // Node pixels: endpoints and junctions. Adjacent junction pixels form one node.
  const nodeOf = new Int32Array(w * h).fill(-1);
  const nodes: Pt[][] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!on(x, y) || nodeOf[y * w + x]! >= 0) continue;
      const n = nbrs(x, y).length;
      if (!(n <= 1 || crossing(x, y) >= 3)) continue;
      const id = nodes.length;
      const members: Pt[] = [];
      const stack: Pt[] = [[x, y]];
      nodeOf[y * w + x] = id;
      while (stack.length) {
        const [cx, cy] = stack.pop()!;
        members.push([cx, cy]);
        for (const [nx, ny] of nbrs(cx, cy)) {
          if (nodeOf[ny * w + nx]! >= 0) continue;
          if (nbrs(nx, ny).length <= 1 || crossing(nx, ny) >= 3) {
            nodeOf[ny * w + nx] = id;
            stack.push([nx, ny]);
          }
        }
      }
      nodes.push(members);
    }

  const visited = new Uint8Array(w * h);
  const edges: Edge[] = [];
  const walk = (start: Pt, from: number): Edge | null => {
    const pts: Pt[] = [start];
    visited[start[1] * w + start[0]] = 1;
    let cur = start;
    for (;;) {
      const next = nbrs(cur[0], cur[1]).filter(([nx, ny]) => {
        const i = ny * w + nx;
        if (nodeOf[i]! >= 0) return nodeOf[i] !== from || pts.length > 2;
        return !visited[i];
      });
      const toNode = next.find(([nx, ny]) => nodeOf[ny * w + nx]! >= 0);
      if (toNode) {
        pts.push(toNode);
        return { a: from, b: nodeOf[toNode[1] * w + toNode[0]]!, pts, alive: true };
      }
      const step = next.find(([nx, ny]) => nx === cur[0] || ny === cur[1]) ?? next[0];
      if (!step) return { a: from, b: from, pts, alive: true };
      visited[step[1] * w + step[0]] = 1;
      pts.push(step);
      cur = step;
    }
  };

  nodes.forEach((members, id) => {
    for (const [mx, my] of members)
      for (const [nx, ny] of nbrs(mx, my)) {
        const i = ny * w + nx;
        if (nodeOf[i]! >= 0 || visited[i]) continue;
        const e = walk([nx, ny], id);
        if (e) {
          e.pts.unshift([mx, my]);
          edges.push(e);
        }
      }
  });
  // An isolated node with no edges (a dot) becomes a zero-length stroke.
  nodes.forEach((members, id) => {
    if (!edges.some((e) => e.a === id || e.b === id)) {
      const c = centroid(members);
      edges.push({ a: id, b: id, pts: [c, c], alive: true });
    }
  });
  // Remaining unvisited pixels are closed loops (an "o" has no nodes at all).
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!on(x, y) || visited[y * w + x] || nodeOf[y * w + x]! >= 0) continue;
      const e = walk([x, y], -1);
      // A tiny ring is a thinned dot: keep it as a single point.
      if (e) edges.push(e.pts.length > 3 ? { ...e, a: -1, b: -1 } : { a: -1, b: -1, pts: [centroid(e.pts), centroid(e.pts)], alive: true });
    }
  return { nodes: nodes.map(centroid), edges };
}

const centroid = (pts: Pt[]): Pt => [
  pts.reduce((s, p) => s + p[0], 0) / pts.length,
  pts.reduce((s, p) => s + p[1], 0) / pts.length,
];
const len = (pts: Pt[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p[0] - pts[i]![0], p[1] - pts[i]![1]), 0);
const degree = (edges: Edge[], id: number) =>
  edges.filter((e) => e.alive && (e.a === id || e.b === id)).reduce((s, e) => s + (e.a === e.b ? 2 : 1), 0);

/** Removes short spurs that end in a serif rather than a stroke. */
function prune(edges: Edge[], dist: Float64Array, w: number) {
  for (let round = 0; round < 2; round++) {
    for (const e of edges) {
      if (!e.alive || e.a < 0 || e.a === e.b) continue;
      const da = degree(edges, e.a), db = degree(edges, e.b);
      if (!((da === 1 && db >= 3) || (db === 1 && da >= 3))) continue;
      const junction = da === 1 ? e.pts.at(-1)! : e.pts[0]!;
      const halfWidth = dist[Math.round(junction[1]) * w + Math.round(junction[0])] ?? 0;
      if (len(e.pts) < halfWidth * 1.7) e.alive = false;
    }
  }
}

/** Outgoing direction of an edge from one of its ends, measured a few pixels in. */
function direction(pts: Pt[], fromStart: boolean): Pt {
  const seq = fromStart ? pts : [...pts].reverse();
  const a = seq[0]!, b = seq[Math.min(seq.length - 1, 7)]!;
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  return [(b[0] - a[0]) / d, (b[1] - a[1]) / d];
}

/** Joins edges through junctions where the line continues straight on. */
function assemble(nodes: Pt[], edges: Edge[]): Pt[][] {
  const live = edges.filter((e) => e.alive);
  type End = { e: number; start: boolean };
  const partner = new Map<string, End>();
  const key = (end: End) => `${end.e}:${end.start}`;

  nodes.forEach((_, id) => {
    const ends: End[] = [];
    live.forEach((e, i) => {
      if (e.a === id) ends.push({ e: i, start: true });
      if (e.b === id) ends.push({ e: i, start: false });
    });
    if (ends.length < 2) return;
    const pairs: Array<[number, End, End]> = [];
    for (let i = 0; i < ends.length; i++)
      for (let j = i + 1; j < ends.length; j++) {
        if (ends[i]!.e === ends[j]!.e) continue;
        const di = direction(live[ends[i]!.e]!.pts, ends[i]!.start);
        const dj = direction(live[ends[j]!.e]!.pts, ends[j]!.start);
        pairs.push([di[0] * dj[0] + di[1] * dj[1], ends[i]!, ends[j]!]);
      }
    pairs.sort((p, q) => p[0] - q[0]);
    // Only nearly straight continuations (more than about 130 degrees apart) join.
    // A plain bend (exactly two ends) always joins.
    for (const [dot, p, q] of pairs) {
      if (partner.has(key(p)) || partner.has(key(q))) continue;
      if (dot > -0.64 && ends.length > 2) continue;
      partner.set(key(p), q);
      partner.set(key(q), p);
    }
  });

  const used = new Set<number>();
  const strokes: Pt[][] = [];
  const follow = (first: End) => {
    let pts: Pt[] = [];
    let end: End | undefined = first;
    while (end && !used.has(end.e)) {
      used.add(end.e);
      const seg = live[end.e]!.pts;
      const ordered = end.start ? seg : [...seg].reverse();
      pts = pts.concat(pts.length ? ordered.slice(1) : ordered);
      end = partner.get(key({ e: end.e, start: !end.start }));
    }
    strokes.push(pts);
  };
  // Open strokes start at an end with no partner; whatever remains is a loop.
  live.forEach((_, i) => {
    for (const start of [true, false]) if (!used.has(i) && !partner.has(key({ e: i, start }))) follow({ e: i, start });
  });
  live.forEach((_, i) => {
    if (!used.has(i)) follow({ e: i, start: true });
  });
  return strokes;
}

/** Ramer-Douglas-Peucker. */
function simplify(pts: Pt[], eps: number): Pt[] {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0]!, pts.at(-1)!];
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l = Math.hypot(dx, dy);
  let maxD = 0, idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i]!;
    const d = l ? Math.abs(dy * p[0] - dx * p[1] + b[0] * a[1] - b[1] * a[0]) / l : Math.hypot(p[0] - a[0], p[1] - a[1]);
    if (d > maxD) [maxD, idx] = [d, i];
  }
  if (maxD <= eps) return [a, b];
  return [...simplify(pts.slice(0, idx + 1), eps).slice(0, -1), ...simplify(pts.slice(idx), eps)];
}

function smooth(pts: Pt[]): Pt[] {
  if (pts.length < 3) return pts;
  const out: Pt[] = [pts[0]!];
  for (let i = 1; i < pts.length - 1; i++) {
    const [p, c, n] = [pts[i - 1]!, pts[i]!, pts[i + 1]!];
    out.push([(p[0] + 2 * c[0] + n[0]) / 4, (p[1] + 2 * c[1] + n[1]) / 4]);
  }
  out.push(pts.at(-1)!);
  return out;
}

/** Hand-like direction: closed loops run counterclockwise from about one o'clock; open strokes from the top or the left. */
function orient(pts: Pt[]): Pt[] {
  const first = pts[0]!, last = pts.at(-1)!;
  const closed = pts.length > 4 && Math.hypot(first[0] - last[0], first[1] - last[1]) < 3;
  if (closed) {
    let ring = pts.slice(0, -1);
    let area = 0;
    ring.forEach((p, i) => {
      const q = ring[(i + 1) % ring.length]!;
      area += p[0] * q[1] - q[0] * p[1];
    });
    if (area > 0) ring = ring.reverse(); // y points down: negative area reads counterclockwise
    let best = 0;
    ring.forEach((p, i) => {
      if (p[0] - 1.6 * p[1] > ring[best]![0] - 1.6 * ring[best]![1]) best = i;
    });
    const rotated = [...ring.slice(best), ...ring.slice(0, best)];
    return [...rotated, rotated[0]!];
  }
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const tall = Math.max(...ys) - Math.min(...ys) > 0.8 * (Math.max(...xs) - Math.min(...xs));
  const startFirst = tall ? first[1] <= last[1] : first[0] <= last[0];
  return startFirst ? pts : [...pts].reverse();
}

interface Stroke {
  d: string;
  /** Mask brush width in font units. */
  w: number;
  /** Length in font units, used to pace the writing. */
  l: number;
}

/** Joins strokes that meet end to end and carry on in the same line (a crossbar split by a stem). */
function joinCollinear(strokes: Pt[][], reach: number): Pt[][] {
  const out = strokes.map((s) => [...s]);
  for (let merged = true; merged; ) {
    merged = false;
    search: for (let i = 0; i < out.length; i++)
      for (let j = i + 1; j < out.length; j++) {
        for (const ri of [false, true])
          for (const rj of [false, true]) {
            const a = ri ? [...out[i]!].reverse() : out[i]!; // a ends where b starts
            const b = rj ? [...out[j]!].reverse() : out[j]!;
            if (a.length < 2 || b.length < 2) continue;
            const gap = Math.hypot(a.at(-1)![0] - b[0]![0], a.at(-1)![1] - b[0]![1]);
            if (gap > reach) continue;
            const da = direction(a, false), db = direction(b, true);
            if (da[0] * db[0] + da[1] * db[1] > -0.85) continue;
            out[i] = [...a, ...b];
            out.splice(j, 1);
            merged = true;
            break search;
          }
      }
  }
  return out;
}

function glyphStrokes(path: opentype.Path, char: string, upm: number): Stroke[] {
  const contours = flatten(path);
  if (!contours.length) return [];
  const raster = rasterise(contours);
  const dist = distanceTransform(raster);
  const sk = thin(raster);
  const { nodes, edges } = skeletonEdges(sk, raster.w, raster.h);
  prune(edges, dist, raster.w);
  const em = upm * SCALE;
  const strokes = joinCollinear(assemble(nodes, edges).filter((s) => s.length), em * 0.05);

  const toUnits = ([x, y]: Pt): Pt => [raster.ox + (x + 0.5) / SCALE, raster.oy + (y + 0.5) / SCALE];
  const shaped = strokes.map((pts) => {
    const oriented = orient(smooth(simplify(pts, 0.9)));
    const half = Math.max(...pts.map(([x, y]) => dist[Math.round(y) * raster.w + Math.round(x)] ?? 1));
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const box = { minX: Math.min(...xs), minY: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
    return { pts: oriented, half, box, length: len(pts), dot: box.w < em * 0.1 && box.h < em * 0.1 && strokes.length > 1 };
  });

  // Main strokes go left to right (top first on ties). Short strokes, mostly
  // serifs and feet, follow the main stroke they touch. Dots come last.
  const isMinor = (s: (typeof shaped)[number]) => !s.dot && s.length < em * 0.22;
  const majors = shaped.filter((s) => !s.dot && !isMinor(s));
  const tie = em * 0.12;
  majors.sort((p, q) => (Math.abs(p.box.minX - q.box.minX) > tie ? p.box.minX - q.box.minX : p.box.minY - q.box.minY));
  const ordered: typeof shaped = majors.length ? [...majors] : shaped.filter(isMinor);
  if (majors.length) {
    for (const minor of shaped.filter(isMinor)) {
      const ends = [minor.pts[0]!, minor.pts.at(-1)!];
      let best = 0, bestD = Infinity;
      ordered.forEach((s, i) => {
        for (const p of s.pts)
          for (const e of ends) {
            const d = Math.hypot(p[0] - e[0], p[1] - e[1]);
            if (d < bestD) [bestD, best] = [d, i];
          }
      });
      ordered.splice(best + 1, 0, minor);
    }
  }
  ordered.push(...shaped.filter((s) => s.dot));

  // A t is crossed last: its most horizontal stroke moves to the end.
  if (char === "t" && ordered.length > 1) {
    const bar = ordered.reduce((b, s) => (s.box.w / (s.box.h + 1) > b.box.w / (b.box.h + 1) ? s : b));
    ordered.splice(ordered.indexOf(bar), 1);
    ordered.push(bar);
  }

  return ordered.map(({ pts: rasterPts, half }) => ({ pts: rasterPts.map(toUnits), half })).map(({ pts, half }) => ({
    d: "M" + pts.map(([x, y]) => `${x.toFixed(0)} ${y.toFixed(0)}`).join("L"),
    w: Math.round((2 * half + 3) / SCALE),
    l: Math.max(1, Math.round(len(pts))),
  }));
}

/* ---------- build ---------- */

async function main() {
  const allText = Object.values(PHRASES).join(" ");
  const font = await loadFont(500, allText);
  const seal = await loadFont(700, SEAL_TEXT);
  const upm = font.unitsPerEm;

  const glyphs: Record<string, { d: string; strokes: Stroke[] }> = {};
  const glyphId = (g: opentype.Glyph) => {
    const id = `g${g.unicode?.toString(16) ?? g.index}`;
    if (!glyphs[id]) {
      const path = g.getPath(0, 0, upm);
      glyphs[id] = { d: pathData(path), strokes: glyphStrokes(path, String.fromCodePoint(g.unicode ?? 32), upm) };
    }
    return id;
  };

  const layout = (f: opentype.Font, text: string, register: (g: opentype.Glyph) => string) =>
    text.split(" ").map((word) => {
      const placed: Array<{ id: string; x: number }> = [];
      f.forEachGlyph(word, 0, 0, upm, { kerning: true }, (g, x) => {
        placed.push({ id: register(g), x: Math.round(x) });
      });
      return { text: word, advance: Math.round(f.getAdvanceWidth(word, upm, { kerning: true })), glyphs: placed };
    });

  const phrases = Object.fromEntries(
    Object.entries(PHRASES).map(([k, text]) => [k, { text, words: layout(font, text, glyphId) }]),
  );

  const sealGlyphs: Record<string, string> = {};
  const sealWords = layout(seal, SEAL_TEXT, (g) => {
    const id = `s${g.unicode?.toString(16) ?? g.index}`;
    sealGlyphs[id] ??= pathData(g.getPath(0, 0, upm));
    return id;
  });

  const metrics = {
    upm,
    ascender: font.tables.hhea.ascender as number,
    descender: font.tables.hhea.descender as number,
    space: Math.round(font.charToGlyph(" ").advanceWidth ?? upm / 4),
  };

  mkdirSync("src/motion/brush/generated", { recursive: true });
  // Outlines and layout render on the server. Strokes only animate, so they
  // live in their own file that ships with the lazy motion chunk.
  writeFileSync(
    OUT,
    JSON.stringify({
      source: "Shippori Mincho B1 500 (SIL Open Font License 1.1); strokes generated by scripts/build-glyphs.mts",
      metrics,
      outlines: Object.fromEntries(Object.entries(glyphs).map(([id, g]) => [id, g.d])),
      phrases,
      seal: { text: SEAL_TEXT, glyphs: sealGlyphs, words: sealWords },
    }),
  );
  writeFileSync(STROKES_OUT, JSON.stringify(Object.fromEntries(Object.entries(glyphs).map(([id, g]) => [id, g.strokes]))));
  const strokeCount = Object.values(glyphs).reduce((s, g) => s + g.strokes.length, 0);
  console.log(`wrote ${OUT}: ${Object.keys(glyphs).length} glyphs, ${strokeCount} strokes, ${Object.keys(phrases).length} phrases`);
}

await main();
