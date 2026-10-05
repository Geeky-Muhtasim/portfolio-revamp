import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import localFont from "next/font/local";

/*
 * Every font is served from this site's own origin: no third-party
 * requests at runtime. next/font downloads and subsets the Google families
 * at build time. Shippori Mincho B1 is a Japanese family whose stock CSS
 * runs to hundreds of slices, so it is a committed Latin-only subset
 * instead (scripts/fetch-fonts.mjs, SIL Open Font License).
 *
 * IBM Plex Mono is the terminal, the vow and the HUD: the first text on
 * screen, so it is preloaded.
 */
export const plexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-mono",
});

/** Title cards and the seal. */
export const shippori = localFont({
  src: "./fonts/shippori-mincho-b1-500-latin.woff2",
  weight: "500",
  display: "swap",
  variable: "--font-shippori",
  fallback: ["Times New Roman", "serif"],
});

/** Longer reading, such as /plain. */
export const plexSans = IBM_Plex_Sans({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-plex-sans",
});

/** Only the Bangla the site shows (scripts/fetch-fonts.mjs, tested against site.ts). */
export const tiroBangla = localFont({
  src: "./fonts/tiro-bangla-400-subset.woff2",
  weight: "400",
  display: "swap",
  preload: false,
  variable: "--font-tiro-bangla",
  fallback: ["serif"],
});

export const fontVariables = [plexMono, shippori, plexSans, tiroBangla].map((f) => f.variable).join(" ");
