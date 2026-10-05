import type { Howl } from "howler";

/*
 * Sound stays silent until the visitor asks for it. Howler is imported
 * only then. A small store lets the mute toggle follow the state.
 */

export const SPRITE_SRC = "/audio/placeholder-sprite.wav";
/** Must match scripts/build-placeholder-audio.mjs. */
export const SPRITE: Record<"power" | "slash" | "tick", [number, number]> = { power: [0, 1600], slash: [1800, 900], tick: [2900, 60] };

export type SoundName = keyof typeof SPRITE;

interface SoundState {
  enabled: boolean;
  muted: boolean;
}

let state: SoundState = { enabled: false, muted: true };
let howl: Howl | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();

const set = (next: Partial<SoundState>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
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
    howl = new Howl({ src: [SPRITE_SRC], sprite: SPRITE, preload: true, volume: 0.8 });
  });
  return loading.then(() => set({ enabled: true, muted: false }));
}

export async function setMuted(muted: boolean) {
  if (!muted && !state.enabled) await enableSound();
  const { Howler } = await import("howler");
  Howler.mute(muted);
  set({ muted });
}

export function play(name: SoundName) {
  if (!howl || state.muted) return;
  const id = howl.play(name);
  if (name === "tick") howl.volume(0.25, id);
}
