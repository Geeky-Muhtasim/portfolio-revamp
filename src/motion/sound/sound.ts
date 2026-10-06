import type { Howl } from "howler";

/*
 * Sound stays silent until the visitor asks for it. Howler is imported
 * only then. A small store lets the mute toggle follow the state.
 */

export const SPRITE_SRC = "/audio/placeholder-sprite.wav";

/** Must match scripts/build-placeholder-audio.mjs. The third value marks a loop. */
export const SPRITE: Record<SoundName | AmbientName, [number, number] | [number, number, boolean]> = {
  power: [0, 1600],
  slash: [1800, 900],
  tick: [2900, 60],
  charge: [3100, 3000],
  sting: [6300, 1900],
  rain: [8400, 3700, true],
};

export type SoundName = "power" | "slash" | "tick" | "charge" | "sting";
export type AmbientName = "rain";

interface SoundState {
  enabled: boolean;
  muted: boolean;
}

let state: SoundState = { enabled: false, muted: true };
let howl: Howl | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

/** Ambient loops that should be playing, and the ids of those that are. */
const wanted = new Set<AmbientName>();
const playing = new Map<AmbientName, number>();

const set = (next: Partial<SoundState>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
  syncAmbient();
};

export const soundStore = {
  get: () => state,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export function enableSound(): Promise<void> {
  loading ??= import("howler").then(({ Howl, Howler }) => {
    Howler.autoUnlock = true;
    howl = new Howl({ src: [SPRITE_SRC], sprite: SPRITE as Record<string, [number, number]>, preload: true, volume: 0.8 });
  });
  return loading.then(() => set({ enabled: true, muted: false }));
}

export async function setMuted(muted: boolean) {
  if (!muted && !state.enabled) await enableSound();
  const { Howler } = await import("howler");
  Howler.mute(muted);
  set({ muted });
}

const VOLUME: Partial<Record<SoundName, number>> = { tick: 0.25, charge: 0.5 };

/** Plays a one-shot if the visitor chose sound. Returns a stop function (a short fade). */
export function play(name: SoundName): () => void {
  if (!howl || state.muted) return () => {};
  const h = howl;
  const id = h.play(name);
  const volume = VOLUME[name] ?? 1;
  h.volume(volume, id);
  return () => {
    h.fade(volume, 0, 120, id);
    window.setTimeout(() => h.stop(id), 130);
  };
}

/** Asks for an ambient loop to be on or off; it follows mute and late opt-in by itself. */
export function setAmbient(name: AmbientName, on: boolean) {
  if (on) wanted.add(name);
  else wanted.delete(name);
  syncAmbient();
}

function syncAmbient() {
  if (!howl) return;
  const h = howl;
  for (const name of ["rain"] as AmbientName[]) {
    const should = wanted.has(name) && !state.muted;
    const id = playing.get(name);
    if (should && id === undefined) {
      const nid = h.play(name);
      h.volume(0, nid);
      h.fade(0, 0.45, 1200, nid);
      playing.set(name, nid);
    } else if (!should && id !== undefined) {
      h.fade(0.45, 0, 900, id);
      playing.delete(name);
      window.setTimeout(() => h.stop(id), 950);
    }
  }
}
