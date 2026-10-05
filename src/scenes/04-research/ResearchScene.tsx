import { bangla, blades, episodes, labels } from "@/config/site";
import { venueShort } from "@/content/derive";
import type { Portfolio } from "@/content/schema";
import { BackToBlades } from "../BackToBlades";
import { SceneHeader } from "../SceneHeader";

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

const LINK_LABELS: Record<string, string> = { publisher: "publisher", pdf: "pdf", arxiv: "arxiv", code: "code", dataset: "dataset" };

/** Scene 4, Blade I: publications as terminal case records, citations on a HUD counter. */
export function ResearchScene({ portfolio }: { portfolio: Portfolio }) {
  const blade = blades.find((b) => b.id === "research")!;
  const { stats } = portfolio.profile;
  const counters = [
    { label: labels.citations, value: stats.citations, width: 3 },
    { label: labels.hIndex, value: stats.hIndex, width: 2 },
    { label: labels.publications, value: stats.publications, width: 2 },
  ];

  return (
    <section id="blade-research" className="scene scene-research" data-scene="blade-research" aria-labelledby="research-title" tabIndex={-1}>
      <div className="scene-body wide">
        <div className="crt-panel">
          <div className="crt-glass">
            <SceneHeader ep={episodes.research} id="research-title" title={blade.label} line={blade.line} />
            <dl className="hud-counters">
              {counters.map((c) => (
                <div key={c.label} className="hud-counter">
                  <dt>{c.label}</dt>
                  <dd>
                    <span className="count" data-count={c.value} data-width={c.width}>
                      {pad(c.value, c.width)}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            <ol className="cases">
              {portfolio.publications.map((pub, i) => (
                <li key={pub.id}>
                  <details className="case">
                    <summary>
                      <span className="case-code">
                        {labels.caseRecord} {pad(i + 1)}
                      </span>
                      <span className="case-meta">
                        {pub.year} <span aria-hidden="true">{"//"}</span> {pub.type === "Undergraduate Thesis" ? pub.type : venueShort(pub.venue)}
                      </span>
                      <span className="case-title">{pub.title}</span>
                      {pub.id === "pub-1" && (
                        <span className="bangla-mark" lang="bn">
                          {bangla.somajgyaan}
                        </span>
                      )}
                    </summary>
                    <dl className="case-body">
                      <dt>{labels.authors}</dt>
                      <dd>
                        {pub.authors.map((a, ai) => (
                          <span key={a.name}>
                            {ai > 0 && ", "}
                            {a.isSelf ? <strong>{a.name}</strong> : a.name}
                          </span>
                        ))}
                      </dd>
                      {pub.abstract && (
                        <>
                          <dt>{labels.abstract}</dt>
                          <dd>{pub.abstract}</dd>
                        </>
                      )}
                      {pub.contribution && (
                        <>
                          <dt>{labels.contribution}</dt>
                          <dd>{pub.contribution}</dd>
                        </>
                      )}
                      {pub.impact && (
                        <>
                          <dt>{labels.impact}</dt>
                          <dd>{pub.impact}</dd>
                        </>
                      )}
                      {pub.citations !== undefined && (
                        <>
                          <dt>{labels.citations}</dt>
                          <dd>{pub.citations}</dd>
                        </>
                      )}
                    </dl>
                    {Object.keys(pub.links).length > 0 && (
                      <ul className="case-links">
                        {Object.entries(pub.links).map(([k, href]) => (
                          <li key={k}>
                            <a href={href} target="_blank" rel="noopener noreferrer">
                              &gt; open {LINK_LABELS[k] ?? k}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </details>
                </li>
              ))}
            </ol>
            <BackToBlades />
          </div>
        </div>
      </div>
    </section>
  );
}
