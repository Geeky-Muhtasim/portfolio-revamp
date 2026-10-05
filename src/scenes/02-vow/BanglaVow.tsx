import { flags } from "@/config/site";

/**
 * Slot for a Bangla version of the vow, beneath the English one.
 * Renders nothing until the lettering exists and flags.bangla.vow is on.
 */
export function BanglaVow() {
  if (!flags.bangla.vow) return null;
  return null;
}
