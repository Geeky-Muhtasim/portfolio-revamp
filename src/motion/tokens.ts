/** Motion constants from the brief. Mirrored in src/styles/tokens.css. */
export const motion = {
  cut: {
    stillMs: 120,
    dim: 0.08,
    slashMs: 80,
    splitMs: 250,
    angleDeg: 20,
    /** Each half travels this fraction of the viewport diagonal and tilts this far. */
    splitTravel: 0.4,
    splitTiltDeg: 1.2,
  },
  easeExpoOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  vowWriteMs: 4000,
  trailFadeMs: 900,
  breath: { idleMs: 10000, periodMs: 6000, scale: 1.008 },
} as const;
