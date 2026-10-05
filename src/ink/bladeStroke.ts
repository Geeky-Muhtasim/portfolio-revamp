/*
 * Placeholder vertical brush stroke for the Three Blades hub, generated
 * from a seed so it is stable between builds. Same role as a scanned
 * stroke: a filled outline in a 100 x 1000 box.
 */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

export function placeholderBladeStroke(seed: number): string {
  const rand = rng(seed);
  const steps = 28;
  const left: string[] = [];
  const right: string[] = [];
  let wobble = 0;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = 20 + t * 960;
    // A brush loads at the top, presses, and lifts into a dry tail.
    const press = Math.sin(Math.PI * Math.min(1, t * 1.15)) ** 0.6;
    const half = 4 + 15 * press * (1 - 0.35 * t);
    wobble += (rand() - 0.5) * 1.6;
    const cx = 50 + wobble + Math.sin(t * 3.1 + seed) * 2.5;
    left.push(`${(cx - half - rand() * 1.4).toFixed(1)} ${y.toFixed(1)}`);
    right.push(`${(cx + half + rand() * 1.4).toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M${left.join("L")}L${right.reverse().join("L")}Z`;
}
