/** Motion constants from the brief. Mirrored in src/styles/tokens.css. */
export const motion = {
  slash: {
    freezeMs: 100,
    impactMs: 80,
    splitMs: 250,
    angleDeg: 20,
    /** Each half travels this fraction of the viewport diagonal and tilts this far. */
    splitTravel: 0.32,
    splitTiltDeg: 1.5,
    /** RGB channel offset in px at the moment of the tear. */
    rgbOffsetPx: 6,
    glitchBands: 4,
  },
  easeExpoOut: "cubic-bezier(0.16, 1, 0.3, 1)",
  vowTypeMs: 4000,
  drift: { idleMs: 10000 },
} as const;
