import type { Metadata, Viewport } from "next";
import { getPortfolio } from "@/content/load";
import { seoDescription, seoTitle, siteUrl } from "@/content/seo";
import { fontVariables } from "./fonts";
import "./globals.css";

export function generateMetadata(): Metadata {
  const portfolio = getPortfolio();
  const { profile } = portfolio;
  const title = seoTitle(portfolio);
  const description = seoDescription(portfolio);
  return {
    metadataBase: new URL(profile.website),
    title,
    description,
    applicationName: profile.name,
    authors: [{ name: profile.name, url: siteUrl(portfolio) }],
    creator: profile.name,
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
    },
    // The share images come from opengraph-image.jpg and twitter-image.jpg beside this file.
    openGraph: {
      type: "profile",
      siteName: profile.name,
      title,
      description,
      url: siteUrl(portfolio),
      locale: "en_US",
    },
    twitter: { card: "summary_large_image", title, description },
    formatDetection: { email: false, telephone: false, address: false },
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
