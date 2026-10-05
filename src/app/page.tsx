import { blades } from "@/config/site";
import { getPortfolio } from "@/content/load";
import { VowScene } from "@/scenes/02-vow/VowScene";
import { BladeStub } from "@/scenes/03-blades/BladeStub";
import { BladesScene } from "@/scenes/03-blades/BladesScene";
import { Sequence } from "@/scenes/Sequence";
import { CelWorld } from "@/world/CelWorld";

/*
 * Before first paint (only when JavaScript runs): the sequence starts at
 * the top with no restored scroll; the page beneath the Threshold stays
 * unpainted until the ceremony ends; a returning visitor in this session
 * skips the Threshold without a flash.
 */
const BEFORE_PAINT = `history.scrollRestoration="manual";var d=document.documentElement;d.dataset.phase="threshold";try{if(sessionStorage.getItem("three-blades:entered"))d.dataset.phase="returning"}catch(e){}`;

export default function Home() {
  const { profile } = getPortfolio();
  const city = profile.location.split(",")[0]!.trim();
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: BEFORE_PAINT }} />
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
        {blades.map((b) => (
          <BladeStub key={b.id} id={b.id} />
        ))}
      </Sequence>
      <div className="crt-layer" aria-hidden="true">
        <i className="crt-scan" />
        <i className="crt-grain" />
        <i className="crt-roll" />
      </div>
    </>
  );
}
