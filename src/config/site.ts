/*
 * Feature flags and fixed copy. Facts (names, numbers, dates) never live
 * here: they come from content/portfolio.md. This file holds only the
 * site's own voice: the vow, scene lines and interface labels.
 */

export const flags = {
  bangla: {
    /** A Bangla version of the vow beneath the English one. Slot exists in the Vow scene. */
    vow: false,
  },
  sound: {
    /** Sound stays off until the visitor picks "Enter with sound". */
    defaultOn: false,
  },
  crt: {
    /** OGL scanlines, grain and gate weave on capable desktops; everyone else gets the CSS layer. */
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
    focusCut: true,
    tripleSeal: true,
    consoleNote: true,
    endlessRoad: true,
  },
} as const;

export const threshold = {
  boot: "BOOT // THREE BLADES",
  loadLabel: "LOAD",
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
  /** The last word, typed in signal red with the cursor left blinking after it. */
  keptWord: "kept",
  sublineAfterName: ["Engineer.", "Researcher.", "Still training."],
  continueHint: "Scroll to continue",
} as const;

/** HUD episode codes. Scene 1 is the boot; the vow is episode one. */
export const episodes = {
  vow: { code: "EP.01", title: "THE VOW" },
  blades: { code: "EP.02", title: "THREE BLADES" },
  research: { code: "EP.03", title: "BLADE I" },
  engineering: { code: "EP.04", title: "BLADE II" },
  security: { code: "EP.05", title: "BLADE III" },
  road: { code: "EP.06", title: "THE ROAD" },
  trainingLog: { code: "EP.07", title: "TRAINING LOG" },
  trials: { code: "EP.08", title: "TRIALS" },
  crew: { code: "EP.09", title: "CREW" },
  crossBlades: { code: "EP.10", title: "CROSS BLADES" },
} as const;

/** Title cards for the scenes after the blades: the scene names from the brief. */
export const titleCards = {
  road: "The Road.",
  trainingLog: "Training Log.",
  trials: "Trials.",
  crew: "Crew.",
  crossBlades: "Cross Blades.",
} as const;

/** HUD labels. Labels only; every number beside them comes from portfolio.md. */
export const labels = {
  citations: "CITATIONS",
  hIndex: "H-INDEX",
  publications: "PUBLICATIONS",
  caseRecord: "CASE",
  abstract: "ABSTRACT",
  contribution: "MY PART",
  impact: "IMPACT",
  authors: "AUTHORS",
  officialProjects: "OFFICIAL PROJECTS",
  status: "STATUS",
  role: "ROLE",
  period: "PERIOD",
  stack: "STACK",
  closeCard: "Close",
  incident: "INCIDENT CANDIDATE",
  howScored: "HOW IT IS SCORED",
  caseFile: "CASE FILE",
  station: "STATION",
  allBlades: "all",
  usedIn: "used in",
  report: "INCIDENT REPORT",
  problem: "PROBLEM",
  cause: "CAUSE",
  decision: "DECISION",
  fix: "FIX",
  credits: "IN ORDER OF APPEARANCE",
  nextEpisode: "NEXT EPISODE",
  powerOn: "Power on",
} as const;

/** Contact links as terminal commands. The addresses come from portfolio.md. */
export const commands = {
  email: "mail",
  github: "open github",
  linkedin: "open linkedin",
  scholar: "open scholar",
} as const;

/**
 * The dataset name, as written in Bangla. Shown in the Research scene in
 * Tiro Bangla beside its English record. Flagged for the owner to confirm.
 */
export const bangla = {
  somajgyaan: "সমাজজ্ঞান",
} as const;

export const hud = {
  signal: "SIGNAL OK",
  /** The time shown beside the city is that city's own time. */
  timeZone: "Asia/Dhaka",
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

/** Small interface words. */
export const ui = {
  bladePrefix: "Blade",
  backToBlades: "Back to the blades",
  sound: "Sound",
  soundOn: "on",
  soundOff: "off",
} as const;

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

/**
 * Public-safe Trials from the brief, split into report fields using only
 * the brief's own words. A field the brief does not state is left out, not
 * filled in. Fuller problem, cause and fix text is still to be written.
 */
export const trials: ReadonlyArray<{
  id: string;
  summary: string;
  problem?: string;
  cause?: string;
  decision?: string;
  fix?: string;
}> = [
  {
    id: "crash-loop",
    summary: "An intrusion detection crash loop traced to one duplicated config block.",
    problem: "An intrusion detection crash loop.",
    cause: "One duplicated config block.",
  },
  {
    id: "missing-grant",
    summary: "A silent bug that dropped records in batches, fixed by a single missing database grant.",
    problem: "A silent bug that dropped records in batches.",
    fix: "A single missing database grant.",
  },
  {
    id: "logs-not-packets",
    summary: "A mid-build decision to switch AEGIS from packet capture to firewall logs, and the redesign around it.",
    decision: "Switch AEGIS from packet capture to firewall logs, mid-build.",
    fix: "The redesign around it.",
  },
];
