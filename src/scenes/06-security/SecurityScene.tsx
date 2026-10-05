import { blades, episodes, labels } from "@/config/site";
import { aegis, scoringModel, telemetrySources } from "@/content/derive";
import type { Portfolio } from "@/content/schema";
import { BackToBlades } from "../BackToBlades";
import { SceneHeader } from "../SceneHeader";

/*
 * Scene 6, Blade III. Night falls; log lines rain down the screen; the
 * slash cuts through them and leaves one incident glowing crimson inside a
 * target reticle. Hover or focus it to see how incidents are scored.
 *
 * The rain is texture, not data: each line names one of AEGIS's telemetry
 * sources and a stage of its pipeline, both read from portfolio.md. No
 * addresses, hosts, accounts or findings, real or made up.
 */

const STAGES = ["normalize", "ledger", "correlate", "score"];

/** "Wazuh/Windows endpoint events" -> "WAZUH/WINDOWS": the leading proper names. */
function sourceTag(source: string) {
  const words = source.split(" ");
  const tag: string[] = [];
  for (const w of words) {
    if (tag.length && /^[a-z]/.test(w)) break;
    tag.push(w);
  }
  return tag.join(" ").toUpperCase();
}

export function SecurityScene({ portfolio }: { portfolio: Portfolio }) {
  const blade = blades.find((b) => b.id === "security")!;
  const project = aegis(portfolio);
  const sources = project ? telemetrySources(project).map(sourceTag) : [];
  const model = project ? scoringModel(project) : null;
  const columns = 8;
  const perColumn = 46;

  return (
    <section id="blade-security" className="scene scene-sec" data-scene="blade-security" data-time="night" aria-labelledby="security-title" tabIndex={-1}>
      <div className="track">
        <div className="stage sec-stage">
          <div className="sec-rain" aria-hidden="true">
            {Array.from({ length: columns }, (_, c) => (
              <ul key={c} className="sec-col" style={{ ["--c" as string]: c }}>
                {Array.from({ length: perColumn }, (_, r) => {
                  const k = c * 7 + r * 3;
                  return (
                    <li key={r}>
                      {sources.length ? sources[k % sources.length] : "EVENT"} {STAGES[k % STAGES.length]}
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>
          <i className="sec-slash" aria-hidden="true" />
          <div className="crt-panel sec-head">
            <div className="crt-glass">
              <SceneHeader ep={episodes.security} id="security-title" title={blade.label} line={blade.line} />
            </div>
          </div>
          {model && (
            <div className="sec-incident">
              <button type="button" className="incident" aria-describedby="sec-score">
                <i className="hud-bracket b-tl" aria-hidden="true" />
                <i className="hud-bracket b-tr" aria-hidden="true" />
                <i className="hud-bracket b-bl" aria-hidden="true" />
                <i className="hud-bracket b-br" aria-hidden="true" />
                {labels.incident}
              </button>
              <div id="sec-score" className="score-card" role="note">
                <p className="ep-code">{labels.howScored}</p>
                {model.range && <p className="score-range">{model.range}</p>}
                {model.factors.length > 0 ? (
                  <ul>
                    {model.factors.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                    {model.damping && <li className="score-damp">damping: {model.damping}</li>}
                  </ul>
                ) : (
                  <p>{model.sentence}</p>
                )}
                {project?.highlights.filter((h) => /explainable/i.test(h)).map((h) => (
                  <p key={h} className="score-note">
                    {h}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {project && (
        <div className="scene-body sec-case">
          <div className="crt-panel">
            <div className="crt-glass">
              <p className="ep-code">{labels.caseFile}</p>
              <h3 className="case-file-title">{project.title}</h3>
              <dl className="eng-card-meta">
                <dt>{labels.status}</dt>
                <dd data-status={project.status}>{project.status}</dd>
                <dt>{labels.role}</dt>
                <dd>{project.role}</dd>
                <dt>{labels.period}</dt>
                <dd>{project.period.raw}</dd>
              </dl>
              <p>{project.description}</p>
              <ul className="case-file-list">
                {project.highlights.map((h) => (
                  <li key={h}>{h}</li>
                ))}
              </ul>
              {project.impact && (
                <p className="eng-card-impact">
                  <span className="eng-card-label">{labels.impact}</span> {project.impact}
                </p>
              )}
              <BackToBlades />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
