"use client";

import { useSyncExternalStore } from "react";
import { ui } from "@/config/site";
import { setMuted, soundStore } from "./sound";

const SERVER_STATE = { enabled: false, muted: true };

/** Always in the corner once the Threshold is passed. Text, not an icon. */
export function MuteToggle({ visible }: { visible: boolean }) {
  const { muted } = useSyncExternalStore(soundStore.subscribe, soundStore.get, () => SERVER_STATE);
  return (
    <button
      type="button"
      className="mute-toggle"
      data-visible={visible ? "" : undefined}
      aria-pressed={!muted}
      tabIndex={visible ? 0 : -1}
      onClick={() => void setMuted(!muted)}
    >
      {ui.sound} <span className="mute-state">{muted ? ui.soundOff : ui.soundOn}</span>
    </button>
  );
}
