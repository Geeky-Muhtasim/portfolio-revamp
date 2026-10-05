/*
 * Device tiers. The brief: mobile and low-power devices use the CSS
 * clip-path cut; capable desktops may use WebGL. No cursor effects on touch.
 */

interface NavigatorHints extends Navigator {
  deviceMemory?: number;
}

export function hasFinePointer(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export function isLowPower(): boolean {
  const nav = navigator as NavigatorHints;
  const fewCores = (nav.hardwareConcurrency ?? 8) <= 4;
  const lowMemory = (nav.deviceMemory ?? 8) <= 4;
  return fewCores || lowMemory;
}

export function isMobileLayout(): boolean {
  return window.matchMedia("(max-width: 767px), (pointer: coarse)").matches;
}

export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export type CutMode = "webgl" | "css" | "fade";

export function pickCutMode(reducedMotion: boolean, webglAllowed: boolean): CutMode {
  if (reducedMotion) return "fade";
  if (!webglAllowed || isMobileLayout() || isLowPower() || !hasFinePointer()) return "css";
  return supportsWebGL() ? "webgl" : "css";
}
