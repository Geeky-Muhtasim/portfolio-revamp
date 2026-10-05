import { vow } from "@/config/site";
import { BrushText } from "@/motion/brush/BrushText";
import { getPhrase } from "@/motion/brush/data";
import { BanglaVow } from "./BanglaVow";
import { Seal } from "./Seal";

/** Scene 2: the vow, written stroke by stroke, sealed, then signed with the subline. */
export function VowScene({ name }: { name: string }) {
  const last = vow.lines.length - 1;
  const lastWords = getPhrase(`vow.${last}`).words;
  const keptIndex = lastWords.findIndex((w) => w.text.replace(/[^a-z]/gi, "") === vow.keptWord);
  const jade = { word: keptIndex, glyph: vow.keptWord.length - 1 };

  return (
    <section id="vow" className="scene scene-vow" data-scene="vow" aria-labelledby="vow-signature" tabIndex={-1}>
      <div className="scene-ink" aria-hidden="true" />
      <div className="scene-body vow">
        <div className="vow-lines">
          {vow.lines.map((_, i) => (
            <p key={i} className="vow-line">
              <BrushText
                phrase={`vow.${i}`}
                jade={i === last ? jade : undefined}
                afterLastWord={
                  i === last ? (
                    <span className="seal-slot" data-seal="">
                      <Seal />
                    </span>
                  ) : undefined
                }
              />
            </p>
          ))}
        </div>
        <BanglaVow />
        <h1 id="vow-signature" className="vow-subline" data-subline="">
          <span className="vow-name">{name}.</span> {vow.sublineAfterName.join(" ")}
        </h1>
      </div>
      <button type="button" className="vow-continue" data-continue="">
        <span className="vow-continue-rule" aria-hidden="true" />
        {vow.continueHint}
      </button>
    </section>
  );
}
