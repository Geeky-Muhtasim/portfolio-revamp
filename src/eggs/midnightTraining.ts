import type { Egg } from "./index";
import { isMidnightTraining } from "./timing";

/** Midnight training: between 00:00 and 04:00 local time, a second status line appears. */
export const midnightTraining: Egg = () => {
  const line = document.querySelector<HTMLElement>("[data-midnight]");
  if (!line) return () => {};
  const check = () => {
    line.hidden = !isMidnightTraining(new Date());
  };
  check();
  const id = window.setInterval(check, 60_000);
  return () => {
    window.clearInterval(id);
    line.hidden = true;
  };
};
