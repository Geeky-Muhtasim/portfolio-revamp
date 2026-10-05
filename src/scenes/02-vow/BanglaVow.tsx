import { flags } from "@/config/site";

/**
 * Slot for the brush-lettered Bangla vow, beneath the English one.
 * Renders nothing until the lettering exists and flags.bangla.vow is on.
 */
export function BanglaVow() {
  if (!flags.bangla.vow) return null;
  return null;
}
