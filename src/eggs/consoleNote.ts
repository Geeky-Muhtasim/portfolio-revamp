import { eggCopy } from "@/config/site";
import type { Egg } from "./index";

/**
 * Console note. Detecting dev tools opening is unreliable, so the note is
 * logged once on load, where anyone who opens the console will find it.
 */
export const consoleNote: Egg = () => {
  console.log(
    `%c${eggCopy.consoleNote}`,
    "font: 500 13px/1.6 ui-monospace, monospace; color: #7fe0a0; background: #0e1f1b; padding: 6px 10px; border-left: 3px solid #ec6c5e;",
  );
  return () => {};
};
