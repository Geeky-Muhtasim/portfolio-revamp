import { episodes, labels, sceneLines, titleCards, type BladeId } from "@/config/site";
import { trainingLog } from "@/content/derive";
import type { Portfolio } from "@/content/schema";
import { SceneHeader } from "../SceneHeader";

/*
 * Scene 8: a terminal log of skills, each tied to where it was used (read
 * from the tech stacks in portfolio.md). Command chips filter by blade.
 * The chips are radio buttons and the filtering is CSS, so it works with
 * no JavaScript.
 */

const TAGS: Record<BladeId, string> = { research: "RES", engineering: "ENG", security: "SEC" };
const FILTERS: Array<BladeId | "all"> = ["all", "research", "engineering", "security"];

export function TrainingLogScene({ portfolio }: { portfolio: Portfolio }) {
  const entries = trainingLog(portfolio);

  return (
    <section id="training-log" className="scene scene-log" data-scene="training-log" data-time="night" aria-labelledby="log-title" tabIndex={-1}>
      <div className="scene-body wide">
        <div className="crt-panel">
          <div className="crt-glass">
            <SceneHeader ep={episodes.trainingLog} id="log-title" title={titleCards.trainingLog} line={sceneLines.trainingLog} />
            <fieldset className="log-filter">
              <legend className="sr-only">Filter the log by blade</legend>
              {FILTERS.map((f) => (
                <label key={f} className="chip">
                  <input type="radio" name="log-blade" value={f} id={`log-${f}`} defaultChecked={f === "all"} />
                  <span>--{f === "all" ? labels.allBlades : f}</span>
                </label>
              ))}
            </fieldset>
            <ol className="log-entries">
              {entries.map((e, i) => (
                <li key={`${e.group}-${e.skill}`} className="log-entry" data-blade={e.blade}>
                  <span className="log-n" aria-hidden="true">
                    {String(i + 1).padStart(4, "0")}
                  </span>
                  <span className="log-tag">[{TAGS[e.blade]}]</span>
                  <span className="log-skill">{e.skill}</span>
                  {e.usedIn.length > 0 && (
                    <span className="log-used">
                      {labels.usedIn} {e.usedIn.slice(0, 3).join(", ")}
                      {e.usedIn.length > 3 && <span className="log-more"> +{e.usedIn.length - 3}</span>}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
