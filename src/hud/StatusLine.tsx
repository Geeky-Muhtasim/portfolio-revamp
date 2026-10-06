"use client";

import { useSyncExternalStore } from "react";
import { eggCopy, hud } from "@/config/site";

/*
 * "SIGNAL OK // DHAKA 23:41". The time is Dhaka's own, so the label beside
 * it stays true wherever the visitor is. Rendered in the browser only; the
 * server sends a blank clock.
 */

const format = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: hud.timeZone });

const clock = {
  subscribe(onChange: () => void) {
    const id = window.setInterval(onChange, 15000);
    return () => window.clearInterval(id);
  },
  get: () => format.format(new Date()),
  server: () => "--:--",
};

export function StatusLine({ city }: { city: string }) {
  const time = useSyncExternalStore(clock.subscribe, clock.get, clock.server);
  return (
    <div className="hud-status">
      <p className="hud-signal">
        {hud.signal} <span aria-hidden="true">{"//"}</span> {city.toUpperCase()} <time>{time}</time>
      </p>
      {/* Midnight training: shown by the egg between 00:00 and 04:00 local time. */}
      <p className="hud-midnight" data-midnight="" hidden>
        {eggCopy.midnight}
      </p>
    </div>
  );
}
