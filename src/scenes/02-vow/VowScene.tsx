import { episodes, vow } from "@/config/site";
import { TypeLine } from "@/motion/typing/TypeLine";
import { BanglaVow } from "./BanglaVow";
import { Seal } from "./Seal";

/** Splits the last line so its final word can land in signal red. */
function lastLineSegments(line: string, word: string) {
  const at = line.lastIndexOf(word);
  return [
    { text: line.slice(0, at) },
    { text: line.slice(at), className: "kept" },
  ];
}

/** Scene 2: the vow types onto a CRT panel over the dusk city, then the seal stamps. */
export function VowScene({ name }: { name: string }) {
  const last = vow.lines.length - 1;

  return (
    <section id="vow" className="scene scene-vow" data-scene="vow" aria-labelledby="vow-signature" tabIndex={-1}>
      <div className="scene-body vow-stage">
        <div className="crt-panel vow-panel" data-panel="">
          <div className="crt-glass">
            <p className="ep-code">
              {episodes.vow.code} <span aria-hidden="true">{"//"}</span> {episodes.vow.title}
            </p>
            <div className="vow-lines">
              {vow.lines.map((line, i) => (
                <p key={i} className={`vow-line ${i === last ? "vow-line-last" : ""}`} data-type-line="">
                  <TypeLine segments={i === last ? lastLineSegments(line, vow.keptWord) : [{ text: line }]} cursor={i === last} />
                </p>
              ))}
            </div>
            <BanglaVow />
            <h1 id="vow-signature" className="vow-subline" data-subline="">
              <span className="vow-name">{name}.</span> {vow.sublineAfterName.join(" ")}
            </h1>
          </div>
          <div className="seal-slot" data-seal="">
            <Seal />
          </div>
        </div>
      </div>
      <button type="button" className="vow-continue" data-continue="">
        {vow.continueHint}
      </button>
    </section>
  );
}
