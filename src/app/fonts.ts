import { IBM_Plex_Mono, IBM_Plex_Sans, Shippori_Mincho_B1, Tiro_Bangla } from "next/font/google";

/*
 * next/font downloads and subsets these at build time and serves them from
 * this site's own origin: no third-party requests at runtime.
 */
export const shippori = Shippori_Mincho_B1({
  weight: ["500", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-shippori",
});

export const plexSans = IBM_Plex_Sans({
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-plex-sans",
});

export const plexMono = IBM_Plex_Mono({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-plex-mono",
});

export const tiroBangla = Tiro_Bangla({
  weight: ["400"],
  subsets: ["bengali"],
  display: "swap",
  preload: false,
  variable: "--font-tiro-bangla",
});

export const fontVariables = [shippori, plexSans, plexMono, tiroBangla].map((f) => f.variable).join(" ");
