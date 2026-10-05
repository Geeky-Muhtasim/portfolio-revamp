import { episodes, flags, labels, sceneLines, titleCards, trials } from "@/config/site";
import { SceneHeader } from "../SceneHeader";

/** Scene 9: three incident reports. Each field appears only if the brief states it. */
export function TrialsScene() {
  if (!flags.trials.enabled) return null;
  return (
    <section id="trials" className="scene scene-trials" data-scene="trials" data-time="night" aria-labelledby="trials-title" tabIndex={-1}>
      <div className="scene-body">
        <div className="crt-panel trials-panel">
          <div className="crt-glass">
            <SceneHeader ep={episodes.trials} id="trials-title" title={titleCards.trials} line={sceneLines.trials} />
            <ol className="reports">
              {trials.map((t, i) => (
                <li key={t.id}>
                  <details className="report">
                    <summary>
                      <span className="report-code">
                        {labels.report} {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="report-summary">{t.summary}</span>
                    </summary>
                    <dl className="report-body">
                      {(["problem", "cause", "decision", "fix"] as const).map((k) =>
                        t[k] ? (
                          <div key={k}>
                            <dt>{labels[k]}</dt>
                            <dd>{t[k]}</dd>
                          </div>
                        ) : null,
                      )}
                    </dl>
                  </details>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
