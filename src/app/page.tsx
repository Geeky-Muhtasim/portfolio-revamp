import { blades } from "@/config/site";
import { getPortfolio } from "@/content/load";
import { BrushDefs } from "@/motion/brush/BrushDefs";
import { VowScene } from "@/scenes/02-vow/VowScene";
import { BladeStub } from "@/scenes/03-blades/BladeStub";
import { BladesScene } from "@/scenes/03-blades/BladesScene";
import { Sequence } from "@/scenes/Sequence";

/*
 * Before first paint: the sequence always starts at the top (no restored
 * scroll), and a returning visitor in this session skips the Threshold
 * without a flash.
 */
const BEFORE_PAINT = `history.scrollRestoration="manual";try{if(sessionStorage.getItem("three-blades:entered"))document.documentElement.dataset.phase="returning"}catch(e){}`;

export default function Home() {
  const { profile } = getPortfolio();
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: BEFORE_PAINT }} />
      <noscript>
        <style>{`.threshold{display:none}`}</style>
      </noscript>
      <BrushDefs />
      <Sequence>
        <VowScene name={profile.name} />
        <BladesScene />
        {blades.map((b) => (
          <BladeStub key={b.id} id={b.id} />
        ))}
      </Sequence>
    </>
  );
}
