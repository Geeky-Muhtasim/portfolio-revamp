import type { Metadata, Viewport } from "next";
import { getPortfolio } from "@/content/load";
import { fontVariables } from "./fonts";
import "./globals.css";

export function generateMetadata(): Metadata {
  const { profile } = getPortfolio();
  return {
    metadataBase: new URL(profile.website),
    title: profile.name,
    description: `${profile.title}. ${profile.location}.`,
    authors: [{ name: profile.name, url: profile.website }],
    openGraph: {
      type: "website",
      title: profile.name,
      description: `${profile.title}. ${profile.location}.`,
      url: profile.website,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0f2420",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
