import type { MetadataRoute } from "next";
import { getPortfolio } from "@/content/load";
import { siteUrl } from "@/content/seo";

export const dynamic = "force-static";

/** The two pages: the episode itself, and the same portfolio in plain text. */
export default function sitemap(): MetadataRoute.Sitemap {
  const p = getPortfolio();
  const now = new Date();
  return [
    { url: siteUrl(p), lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: siteUrl(p, "/plain"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];
}
