import { blades, episodes, labels } from "@/config/site";
import type { OfficialProject, Portfolio } from "@/content/schema";
import { BackToBlades } from "../BackToBlades";
import { SceneHeader } from "../SceneHeader";

/*
 * Scene 5, Blade II. Paper forms fly in, the slash cuts them, and the
 * fragments become data traces that assemble FinX360's module map like a
 * circuit board. Every node opens a project card with its real status.
 *
 * The board is laid out on a 1000 x 560 grid: FinX360 at the centre, its
 * four modules around it, every other official project on the edges.
 */

interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  kind: "hub" | "module" | "project";
  status?: string;
  /** The trace runs from here to (tx, ty). */
  tx: number;
  ty: number;
}

const CX = 500;
const CY = 280;

function layout(finx: OfficialProject, others: OfficialProject[], lms: OfficialProject | undefined): Node[] {
  const modulePos = [
    [330, 170],
    [670, 170],
    [330, 390],
    [670, 390],
  ] as const;
  const modules: Node[] = finx.modules.map((m, i) => {
    const [x, y] = modulePos[i % 4]!;
    const isLms = lms && m.name === "LMS";
    return { id: isLms ? lms.id : `module-${m.name}`, label: m.name, x, y, kind: "module", status: isLms ? lms.status : undefined, tx: CX, ty: CY };
  });
  // Remaining projects alternate down the left and right edges, each wired to the nearest module.
  const left = others.filter((_, i) => i % 2 === 0);
  const right = others.filter((_, i) => i % 2 === 1);
  const column = (list: OfficialProject[], x: number) =>
    list.map((p, i) => {
      const y = 50 + (i * 460) / Math.max(1, list.length - 1);
      const near = modules.reduce((best, m) => (Math.abs(m.x - x) + Math.abs(m.y - y) < Math.abs(best.x - x) + Math.abs(best.y - y) ? m : best), modules[0]!);
      // The name before any subtitle: "eKYC Platform & Shared eKYC Hub" -> "eKYC Platform".
      const label = p.title.split(/:| & | \(/)[0]!.trim();
      return { id: p.id, label, x, y, kind: "project" as const, status: p.status, tx: near.x, ty: near.y };
    });
  return [
    { id: finx.id, label: finx.title.replace(/ Digital Ecosystem$/, ""), x: CX, y: CY, kind: "hub", status: finx.status, tx: CX, ty: CY },
    ...modules,
    ...column(left, 135),
    ...column(right, 865),
  ];
}

/** A circuit trace: out horizontally, then a 45 degree bend, then in. */
function trace(n: Node) {
  const dx = n.tx - n.x;
  const dy = n.ty - n.y;
  const bend = Math.min(Math.abs(dx), Math.abs(dy)) * Math.sign(dx || 1);
  const mid = n.x + dx - bend;
  return `M${n.x} ${n.y} H${mid} L${n.tx} ${n.y + Math.min(Math.abs(dx), Math.abs(dy)) * Math.sign(dy || 1)} V${n.ty}`;
}

function Card({ project }: { project: OfficialProject }) {
  return (
    <article id={`card-${project.id}`} className="eng-card" data-card={project.id} aria-labelledby={`card-${project.id}-title`}>
      <h3 id={`card-${project.id}-title`}>{project.title}</h3>
      <dl className="eng-card-meta">
        <dt>{labels.status}</dt>
        <dd data-status={project.status}>{project.status}</dd>
        <dt>{labels.role}</dt>
        <dd>{project.role}</dd>
        <dt>{labels.period}</dt>
        <dd>{project.period.raw}</dd>
      </dl>
      <p>{project.description}</p>
      {project.highlights.length > 0 && (
        <ul>
          {project.highlights.slice(0, 4).map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      )}
      {project.impact && (
        <p className="eng-card-impact">
          <span className="eng-card-label">{labels.impact}</span> {project.impact}
        </p>
      )}
      {project.techStack.length > 0 && (
        <p className="eng-card-stack">
          <span className="eng-card-label">{labels.stack}</span> {project.techStack.join(", ")}
        </p>
      )}
      <button type="button" className="eng-card-close" data-card-close="">
        {labels.closeCard}
      </button>
    </article>
  );
}

export function EngineeringScene({ portfolio }: { portfolio: Portfolio }) {
  const blade = blades.find((b) => b.id === "engineering")!;
  const projects = portfolio.officialProjects;
  const finx = projects.find((p) => p.modules.length > 0)!;
  const lms = projects.find((p) => /LMS module/i.test(p.description));
  const others = projects.filter((p) => p !== finx && p !== lms);
  const nodes = layout(finx, others, lms);

  return (
    <section id="blade-engineering" className="scene scene-eng" data-scene="blade-engineering" aria-labelledby="engineering-title" tabIndex={-1}>
      <div className="track">
        <div className="stage eng-stage">
          <div className="crt-panel eng-head">
            <div className="crt-glass">
              <SceneHeader ep={episodes.engineering} id="engineering-title" title={blade.label} line={blade.line} />
              <p className="hud-readout">
                {labels.officialProjects} <span>{String(portfolio.profile.stats.officialProjects).padStart(2, "0")}</span>
              </p>
            </div>
          </div>
          <div className="eng-board">
            <svg className="eng-papers" viewBox="0 0 1000 560" aria-hidden="true" focusable="false">
              {[0, 1, 2, 3, 4].map((i) => (
                <g key={i} className="eng-paper" data-i={i} transform={`translate(${190 + i * 130} ${150 + (i % 2) * 70}) rotate(${(i % 2 ? 1 : -1) * (4 + i * 2)})`}>
                  <rect x="-48" y="-62" width="96" height="124" fill="var(--cel-cream)" stroke="var(--outline)" strokeWidth="3" />
                  <path d="M-34 -40 H30 M-34 -24 H22 M-34 -8 H30 M-34 8 H14 M-34 24 H26" stroke="var(--moss)" strokeWidth="4" />
                  <rect x="12" y="34" width="22" height="16" fill="var(--crimson)" opacity="0.85" />
                </g>
              ))}
            </svg>
            <svg className="eng-traces" viewBox="0 0 1000 560" aria-hidden="true" focusable="false">
              {nodes
                .filter((n) => n.kind !== "hub")
                .map((n) => (
                  <path key={n.id} className="eng-trace" d={trace(n)} pathLength={1} />
                ))}
              {nodes
                .filter((n) => n.kind !== "hub")
                .map((n) => (
                  <circle key={`${n.id}-via`} className="eng-via" cx={n.tx} cy={n.ty} r="5" />
                ))}
            </svg>
            <i className="eng-slash" aria-hidden="true" />
            <ul className="eng-nodes">
              {nodes.map((n) => {
                return (
                  <li key={n.id} className={`eng-node-wrap kind-${n.kind}`} style={{ left: `${n.x / 10}%`, top: `${(n.y / 560) * 100}%` }}>
                    <button type="button" className="eng-node" data-card-open={n.id} aria-controls={`card-${n.id}`} aria-expanded="false" data-status={n.status}>
                      <span className="eng-node-label">{n.label}</span>
                      {n.status && <span className="eng-node-status">{n.status}</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="eng-cards">
            {projects.map((p) => (
              <Card key={p.id} project={p} />
            ))}
            {nodes
              .filter((n) => n.id.startsWith("module-"))
              .map((n) => {
                const m = finx.modules.find((x) => `module-${x.name}` === n.id)!;
                return (
                  <article key={n.id} id={`card-${n.id}`} className="eng-card" data-card={n.id} aria-labelledby={`card-${n.id}-title`}>
                    <h3 id={`card-${n.id}-title`}>{m.name}</h3>
                    <p className="eng-card-part">{finx.title}</p>
                    <p>{m.description}</p>
                    <button type="button" className="eng-card-close" data-card-close="">
                      {labels.closeCard}
                    </button>
                  </article>
                );
              })}
          </div>
        </div>
      </div>
      <div className="scene-foot">
        <BackToBlades />
      </div>
    </section>
  );
}
