import type { Metadata } from "next";
import { getPortfolio } from "@/content/load";
import { jsonLdScript } from "@/content/seo";
import { VowScene } from "@/scenes/02-vow/VowScene";
import { BladesScene } from "@/scenes/03-blades/BladesScene";
import { ResearchScene } from "@/scenes/04-research/ResearchScene";
import { EngineeringScene } from "@/scenes/05-engineering/EngineeringScene";
import { SecurityScene } from "@/scenes/06-security/SecurityScene";
import { RoadScene } from "@/scenes/07-road/RoadScene";
import { TrainingLogScene } from "@/scenes/08-training-log/TrainingLogScene";
import { TrialsScene } from "@/scenes/09-trials/TrialsScene";
import { CrewScene } from "@/scenes/10-crew/CrewScene";
import { CrossBladesScene } from "@/scenes/11-cross-blades/CrossBladesScene";
import { Sequence } from "@/scenes/Sequence";
import { CelWorld } from "@/world/CelWorld";

/*
 * Before first paint (only when JavaScript runs): the sequence starts at
 * the top with no restored scroll; the page beneath the Threshold stays
 * unpainted until the ceremony ends; a returning visitor in this session
 * skips the Threshold without a flash.
 */
const BEFORE_PAINT = `history.scrollRestoration="manual";var d=document.documentElement;d.dataset.phase="threshold";try{if(sessionStorage.getItem("three-blades:entered"))d.dataset.phase="returning"}catch(e){}`;

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  const portfolio = getPortfolio();
  const { profile } = portfolio;
  const city = profile.location.split(",")[0]!.trim();
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: BEFORE_PAINT }} />
      {/* Who this site is about, for search engines: built from portfolio.md (src/content/seo.ts). */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(portfolio) }} />
      <noscript>
        <style>{`.threshold{display:none}`}</style>
      </noscript>
      <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
        {/* The tear's RGB channel offset: red one way, green and blue the other. */}
        <filter id="rgb-split" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
          <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
          <feOffset in="r" dx="6" result="rs" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 1 0" result="gb" />
          <feOffset in="gb" dx="-6" result="gbs" />
          <feBlend in="rs" in2="gbs" mode="screen" />
        </filter>
      </svg>
      <CelWorld />
      <Sequence city={city}>
        <VowScene name={profile.name} />
        <BladesScene />
        <ResearchScene portfolio={portfolio} />
        <EngineeringScene portfolio={portfolio} />
        <SecurityScene portfolio={portfolio} />
        <RoadScene portfolio={portfolio} />
        <TrainingLogScene portfolio={portfolio} />
        <TrialsScene />
        <CrewScene portfolio={portfolio} />
        <CrossBladesScene portfolio={portfolio} />
      </Sequence>
      <div className="crt-layer" aria-hidden="true">
        <i className="crt-scan" />
        <i className="crt-grain" />
        <i className="crt-roll" />
      </div>
    </>
  );
}
