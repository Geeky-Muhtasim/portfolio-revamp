import { episodes, titleCards } from "@/config/site";
import { roadStations } from "@/content/derive";
import type { Portfolio } from "@/content/schema";
import { SceneHeader } from "../SceneHeader";

/*
 * Scene 7: a transit map from IUB in 2020 to now. Each station is an
 * education or experience entry, in date order, on the line for its kind of
 * work. Station names only; focus a station to expand it. The sky moves
 * from dawn to night as the line runs. Horizontal on desktop, vertical on
 * phones.
 */

const LINE_NAMES = { study: "Study", research: "Research", industry: "Industry", volunteer: "Volunteer" } as const;

export function RoadScene({ portfolio }: { portfolio: Portfolio }) {
  const stations = roadStations(portfolio);
  const lines = [...new Set(stations.map((s) => s.line))];

  return (
    <section id="road" className="scene scene-road" data-scene="road" aria-labelledby="road-title" tabIndex={-1}>
      <div className="track">
        <div className="stage road-stage">
          <div className="crt-panel road-head">
            <div className="crt-glass">
              <SceneHeader ep={episodes.road} id="road-title" title={titleCards.road} />
              <ul className="road-legend">
                {lines.map((l) => (
                  <li key={l} data-line={l}>
                    {LINE_NAMES[l]}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="road-window">
            <ol className="road-line">
              {stations.map((s, i) => {
                const year = Math.floor(s.start / 12);
                const prevYear = i > 0 ? Math.floor(stations[i - 1]!.start / 12) : null;
                return (
                  <li key={s.id} className="station" data-line={s.line}>
                    <span className="station-year" aria-hidden={prevYear === year}>
                      {prevYear === year ? "" : year}
                    </span>
                    <button type="button" className="station-stop" aria-describedby={`${s.id}-detail`}>
                      <span className="station-dot" aria-hidden="true" />
                      <span className="station-name">{s.name}</span>
                    </button>
                    <div id={`${s.id}-detail`} className="station-detail">
                      <p className="station-title">{s.title}</p>
                      <p className="station-period">{s.period}</p>
                      <p className="station-text">{s.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
