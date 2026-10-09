/*
 * The dusk world behind every scene, painted as flat cel layers: hard sky
 * bands (no gradients), the striped sun, distant hills, a skyline with lit
 * windows, a utility pole close to camera, and the ground with a faint
 * painted grid. Each layer is its own element so it can move with
 * parallax; each lit window is addressable so idle drift can flicker it.
 *
 * Server-rendered and deterministic: the same seed draws the same city.
 */

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

interface Building {
  x: number;
  w: number;
  top: number;
  antenna: boolean;
}

const CITY_W = 1600;
const CITY_H = 420;

function buildCity() {
  const rand = rng(1987);
  const buildings: Building[] = [];
  let x = 0;
  while (x < CITY_W) {
    const w = 46 + Math.round(rand() * 90);
    const tall = rand() > 0.82;
    const top = Math.round(tall ? 40 + rand() * 90 : 150 + rand() * 190);
    buildings.push({ x, w, top, antenna: tall && rand() > 0.35 });
    x += w;
  }
  const outline = `M0 ${CITY_H} ` + buildings.map((b) => `V${b.top} H${b.x + b.w}`).join(" ") + ` V${CITY_H} Z`;

  const windows: Array<{ x: number; y: number; tone: "gold" | "phosphor"; night: boolean }> = [];
  for (const b of buildings) {
    for (let wy = b.top + 18; wy < CITY_H - 40; wy += 26) {
      for (let wx = b.x + 12; wx < b.x + b.w - 14; wx += 22) {
        const roll = rand();
        // Some windows are lit at dusk; more come on after dark.
        if (roll < 0.2) windows.push({ x: wx, y: wy, tone: rand() < 0.18 ? "phosphor" : "gold", night: roll >= 0.11 });
      }
    }
  }
  return { buildings, outline, windows };
}

function buildHills() {
  const rand = rng(77);
  let d = "M0 200";
  for (let x = 0; x <= CITY_W; x += 160) d += ` L${x} ${Math.round(70 + rand() * 80)}`;
  return `${d} L${CITY_W} 200 Z`;
}

const city = buildCity();
const hills = buildHills();

export function CelWorld() {
  return (
    <div className="world" aria-hidden="true">
      <svg className="w-layer w-sky" viewBox="0 0 100 100" preserveAspectRatio="none" shapeRendering="crispEdges">
        {/* Band colours come from the time of day: dusk by default, dawn and night by scene. */}
        <rect className="w-band" width="100" height="100" fill="var(--band-base)" />
        <rect className="w-band" width="100" height="30" fill="var(--band-a)" />
        <rect className="w-band" y="30" width="100" height="24" fill="var(--band-b)" />
        <rect className="w-band" y="54" width="100" height="17" fill="var(--band-c)" />
      </svg>

      <svg className="w-layer w-sun" viewBox="0 0 200 200" data-parallax="0.04">
        <circle cx="100" cy="100" r="92" fill="var(--sun-gold)" />
        {/* Stripes thicken toward the horizon, painted in the sky behind. */}
        <g fill="var(--sunset-amber)" className="w-sun-stripes">
          <rect x="0" y="104" width="200" height="5" />
          <rect x="0" y="122" width="200" height="8" />
          <rect x="0" y="143" width="200" height="11" />
          <rect x="0" y="167" width="200" height="15" />
        </g>
      </svg>

      {/* After dark the light source is the moon: a flat cream crescent. */}
      <svg className="w-layer w-moon" viewBox="0 0 100 100" data-parallax="0.03">
        <circle cx="50" cy="50" r="40" fill="var(--cel-cream)" />
        <circle cx="66" cy="40" r="36" fill="var(--band-a)" />
      </svg>

      <svg className="w-layer w-hills" viewBox={`0 0 ${CITY_W} 200`} preserveAspectRatio="xMidYMax slice" data-parallax="0.08">
        <path d={hills} fill="var(--sky-high)" stroke="var(--outline)" strokeWidth="2" strokeLinejoin="round" />
      </svg>

      <svg className="w-layer w-city" viewBox={`0 0 ${CITY_W} ${CITY_H}`} preserveAspectRatio="xMidYMax slice" data-parallax="0.16">
        {city.buildings
          .filter((b) => b.antenna)
          .map((b) => (
            <path key={b.x} d={`M${b.x + b.w / 2} ${b.top} V${b.top - 46} M${b.x + b.w / 2 - 9} ${b.top - 30} H${b.x + b.w / 2 + 9}`} stroke="var(--outline)" strokeWidth="3" />
          ))}
        <path d={city.outline} fill="var(--skyline)" stroke="var(--outline)" strokeWidth="3" strokeLinejoin="miter" />
        <g shapeRendering="crispEdges">
          {city.windows.map((w, i) => (
            <rect
              key={i}
              data-window={i}
              className={w.night ? "w-window w-window-night" : "w-window"}
              x={w.x}
              y={w.y}
              width="10"
              height="11"
              fill={w.tone === "gold" ? "var(--sun-gold)" : "var(--phosphor)"}
            />
          ))}
        </g>
      </svg>

      <svg className="w-layer w-ground" viewBox="0 0 1600 300" preserveAspectRatio="none" data-parallax="0.24">
        <rect width="1600" height="300" fill="var(--night-green)" />
        {/* The grid stays faint and painted: thin, sparse, no glow. */}
        <g stroke="var(--dusk-green)" strokeWidth="2" vectorEffect="non-scaling-stroke" fill="none">
          <path d="M0 26 H1600 M0 70 H1600 M0 140 H1600 M0 250 H1600" />
          <path d="M800 0 L-400 300 M800 0 L200 300 M800 0 L560 300 M800 0 L1040 300 M800 0 L1400 300 M800 0 L2000 300" />
        </g>
        <rect width="1600" height="3" fill="var(--outline)" />
      </svg>

      <svg className="w-layer w-pole" viewBox="0 0 400 900" preserveAspectRatio="xMinYMax meet" data-parallax="0.4">
        <g stroke="var(--outline)" fill="none" strokeLinecap="round">
          <path d="M70 900 V120" strokeWidth="16" />
          <path d="M18 170 H124 M30 215 H112" strokeWidth="9" />
          {/* The wires run to the next pole, far off the right edge, so they cross the whole sky at any width. */}
          <path d="M18 170 Q2200 420 5200 150 M124 170 Q2300 500 5200 190 M30 215 Q2250 560 5200 230" strokeWidth="3" />
        </g>
      </svg>
    </div>
  );
}
