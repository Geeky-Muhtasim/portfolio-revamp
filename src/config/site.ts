/*
 * Feature flags and fixed copy. Facts (names, numbers, dates) never live
 * here: they come from content/portfolio.md. This file holds only the
 * site's own voice: the vow, scene lines and interface labels.
 */

export const flags = {
  bangla: {
    /** Brush-lettered Bangla vow beneath the English one. Slot exists in the Vow scene. */
    vow: false,
  },
  sound: {
    /** Sound stays off until the visitor picks "Enter with sound". */
    defaultOn: false,
  },
  cut: {
    /** WebGL edge glow on capable desktops. Mobile and low-power devices always use clip-path. */
    webgl: true,
  },
  trials: {
    enabled: true,
  },
  /** Easter eggs ship in Phase 5. Each one is toggled independently. */
  eggs: {
    wrongTurn: true,
    napMode: true,
    stubbornNavigation: true,
    midnightTraining: true,
    meditationCut: true,
    tripleSeal: true,
    consoleNote: true,
    endlessRoad: true,
  },
} as const;

export const threshold = {
  word: "Draw.",
  withSound: "Enter with sound",
  inSilence: "Enter in silence",
  skip: "Skip the ceremony",
  /** Progress announcement for screen readers while the blade is drawn. */
  loading: "Drawing the blade",
} as const;

export const vow = {
  lines: [
    "I made one promise.",
    "Teach machines to understand my language and my people.",
    "Build what they can trust.",
    "Guard what no one sees.",
    "I don't sheathe the blade until it's kept.",
  ],
  /** The word whose last stroke lands in jade. */
  keptWord: "kept",
  sublineAfterName: ["Engineer.", "Researcher.", "Still training."],
  continueHint: "Scroll to continue",
} as const;

export type BladeId = "research" | "engineering" | "security";

/** The hub. `vowLine` is the index of the vow line each blade answers. */
export const blades: ReadonlyArray<{ id: BladeId; numeral: string; label: string; line: string; vowLine: number }> = [
  {
    id: "research",
    numeral: "I",
    label: "Research.",
    line: "I want to know how machines think, and whether they understand us.",
    vowLine: 1,
  },
  {
    id: "engineering",
    numeral: "II",
    label: "Engineering.",
    line: "Paper in. Nothing lost. Nothing waiting.",
    vowLine: 2,
  },
  {
    id: "security",
    numeral: "III",
    label: "Security.",
    line: "The company slept. Nothing happened. That was the job.",
    vowLine: 3,
  },
];

export const sceneLines = {
  trainingLog: "Every day. Even when no one is watching.",
  trials: "Things broke. I learned why.",
  crew: "No blade is forged alone.",
  crossBlades: "If you're building something hard, I want to hear about it.",
} as const;

/**
 * Crew, limited to the names in the design brief's draft. Every person here
 * must appear in portfolio.md (tested), so nobody is credited by invention.
 */
export const crew: ReadonlyArray<{ name: string; kind: "person" | "team" }> = [
  { name: "Dr. Amin Ahsan Ali", kind: "person" },
  { name: "Mohammad Ashfaq Ur Rahman", kind: "person" },
  { name: "Md Fahim", kind: "person" },
  { name: "Shadman Rohan", kind: "person" },
  { name: "Bangladesh Finance PLC IT Division", kind: "team" },
];

/** Public-safe Trials candidates from the brief. Full problem/cause/lesson text is still to be written. */
export const trials: ReadonlyArray<{ id: string; summary: string }> = [
  { id: "crash-loop", summary: "An intrusion detection crash loop traced to one duplicated config block." },
  { id: "missing-grant", summary: "A silent bug that dropped records in batches, fixed by a single missing database grant." },
  {
    id: "logs-not-packets",
    summary: "A mid-build decision to switch AEGIS from packet capture to firewall logs, and the redesign around it.",
  },
];
