import type { MetadataRoute } from "next";
import { getPortfolio } from "@/content/load";
import { siteUrl } from "@/content/seo";

export const dynamic = "force-static";

/** Every crawler is welcome, search and AI search alike; the sitemap lists the pages. */
export default function robots(): MetadataRoute.Robots {
  const p = getPortfolio();
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: siteUrl(p, "/sitemap.xml"),
  };
}
