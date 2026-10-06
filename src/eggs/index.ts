import { flags } from "@/config/site";
import { consoleNote } from "./consoleNote";
import { endlessRoad } from "./endlessRoad";
import { focusCut } from "./focusCut";
import { midnightTraining } from "./midnightTraining";
import { napMode } from "./napMode";
import { stubbornNavigation } from "./stubbornNavigation";
import { tripleSeal } from "./tripleSeal";

/*
 * Easter eggs. Each lives in its own file, installs itself, returns its
 * own cleanup, and is switched on or off in flags.eggs. None of them
 * blocks content; all of them respect reduced motion and mute. The whole
 * folder loads lazily after the Threshold. ("Wrong turn" is the 404 page,
 * which is server-rendered and needs nothing from here.)
 */

export interface EggContext {
  reduced: () => boolean;
  /** Plays a sound if the visitor chose sound; returns a stop function. */
  play: (name: "power" | "slash" | "tick" | "charge" | "sting") => () => void;
  /** One slash through the scene on screen that leaves the visitor where they are. */
  slashHere: (origin: { x: number; y: number }) => Promise<void>;
  /** Stamps a seal again, with weight. */
  stamp: (slot: Element) => void;
  /** Past the vow and free to roam: eggs stay quiet before that. */
  isFree: () => boolean;
  /** A slash is running. */
  busy: () => boolean;
  /** Powers the CRT back on at dawn, at the top of the episode. */
  reboot: () => void;
}

export type Egg = (ctx: EggContext) => () => void;

const EGGS: Array<[keyof typeof flags.eggs, Egg]> = [
  ["consoleNote", consoleNote],
  ["midnightTraining", midnightTraining],
  ["napMode", napMode],
  ["stubbornNavigation", stubbornNavigation],
  ["focusCut", focusCut],
  ["tripleSeal", tripleSeal],
  ["endlessRoad", endlessRoad],
];

export function installEggs(ctx: EggContext): () => void {
  const cleanups = EGGS.filter(([flag]) => flags.eggs[flag]).map(([, egg]) => egg(ctx));
  return () => cleanups.forEach((c) => c());
}
export { createEggContext } from "./host";
