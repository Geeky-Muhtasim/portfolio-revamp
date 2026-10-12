import type { Metadata } from "next";
import { PlainPortfolio } from "@/components/plain/PlainPortfolio";
import { getPortfolio } from "@/content/load";

const SHARE_IMAGE = { url: "/opengraph-image.jpg", width: 1200, height: 630 };

export function generateMetadata(): Metadata {
  const { profile } = getPortfolio();
  const title = `${profile.name}, in plain text`;
  const description = `${profile.name}'s full portfolio as one plain, readable page: research, publications, engineering projects, experience and contact.`;
  return {
    title,
    description,
    alternates: { canonical: "/plain" },
    // A page's own openGraph replaces the inherited one, so the share image is named again here.
    openGraph: { type: "profile", siteName: profile.name, title, description, url: "/plain", images: [SHARE_IMAGE] },
    twitter: { card: "summary_large_image", title, description, images: [SHARE_IMAGE] },
  };
}

export default function PlainPage() {
  return <PlainPortfolio portfolio={getPortfolio()} />;
}
