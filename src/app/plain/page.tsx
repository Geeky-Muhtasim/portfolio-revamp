import type { Metadata } from "next";
import { PlainPortfolio } from "@/components/plain/PlainPortfolio";
import { getPortfolio } from "@/content/load";

export function generateMetadata(): Metadata {
  return { title: `${getPortfolio().profile.name}, in plain text` };
}

export default function PlainPage() {
  return <PlainPortfolio portfolio={getPortfolio()} />;
}
