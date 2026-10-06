import { crew, episodes, labels, sceneLines, titleCards } from "@/config/site";
import { crewCredits } from "@/content/derive";
import type { Portfolio } from "@/content/schema";
import { SceneHeader } from "../SceneHeader";

/** Scene 10: an end-credits roll. Hover or focus a name for the role and the shared work. */
export function CrewScene({ portfolio }: { portfolio: Portfolio }) {
  const credits = crewCredits(portfolio, crew);
  return (
    <section id="crew" className="scene scene-crew" data-scene="crew" data-time="night" aria-labelledby="crew-title" tabIndex={-1}>
      <div className="track">
        <div className="stage crew-stage">
          <div className="credits-plate">
            <SceneHeader ep={episodes.crew} id="crew-title" title={titleCards.crew} line={sceneLines.crew} />
            <p className="credits-note">{labels.credits}</p>
            {/* The names roll inside their own window, under the title, never across it. */}
            <div className="credits-window">
              <ol className="credits">
                {credits.map((c, i) => (
                  <li key={c.name} className="credit">
                    <p className="credit-role">{c.role}</p>
                    <button type="button" className="credit-name" aria-describedby={`credit-${i}`}>
                      {c.name}
                    </button>
                    <ul id={`credit-${i}`} className="credit-work">
                      {c.shared.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
