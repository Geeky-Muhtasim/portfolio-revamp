import { blades, episodes, ui } from "@/config/site";
import { TypeLine } from "@/motion/typing/TypeLine";

/**
 * Scene 3 stub: a HUD menu of the three blades over the skyline. The
 * active blade (hovered, focused, or chosen with the arrow keys) turns
 * crimson inside closing brackets and its line appears; Enter or a click
 * cuts to it.
 */
export function BladesScene() {
  return (
    <section id="blades" className="scene scene-blades" data-scene="blades" aria-labelledby="blades-title" tabIndex={-1}>
      <div className="scene-body hub">
        <nav className="hud-menu" aria-labelledby="blades-title">
          <i className="hud-corner c-tl" aria-hidden="true" />
          <i className="hud-corner c-tr" aria-hidden="true" />
          <i className="hud-corner c-bl" aria-hidden="true" />
          <i className="hud-corner c-br" aria-hidden="true" />
          <h2 id="blades-title" className="ep-code">
            {episodes.blades.code} <span aria-hidden="true">{"//"}</span> {episodes.blades.title}
          </h2>
          <ul className="hud-list">
            {blades.map((b) => (
              <li key={b.id}>
                <a href={`#blade-${b.id}`} className="hud-item" data-blade={b.id} data-cut="" aria-describedby={`blade-line-${b.id}`}>
                  <span className="hud-item-num">
                    {ui.bladePrefix} {b.numeral}
                  </span>
                  <span className="hud-item-label">{b.label}</span>
                  <i className="hud-bracket b-tl" aria-hidden="true" />
                  <i className="hud-bracket b-tr" aria-hidden="true" />
                  <i className="hud-bracket b-bl" aria-hidden="true" />
                  <i className="hud-bracket b-br" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
          <div className="hud-lines">
            {blades.map((b) => (
              <p key={b.id} id={`blade-line-${b.id}`} className="hud-line" data-blade-line={b.id} data-type-line="">
                <TypeLine segments={[{ text: b.line }]} />
              </p>
            ))}
          </div>
        </nav>
      </div>
    </section>
  );
}
