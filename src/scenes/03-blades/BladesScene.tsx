import { blades } from "@/config/site";
import { placeholderBladeStroke } from "@/ink/bladeStroke";
import { BrushText } from "@/motion/brush/BrushText";

/**
 * Scene 3 stub: three vertical ink strokes. Hover or focus turns a blade
 * jade and writes its line; choosing one cuts to it.
 */
export function BladesScene() {
  return (
    <section id="blades" className="scene scene-blades" data-scene="blades" aria-labelledby="blades-title" tabIndex={-1}>
      <div className="scene-ink" aria-hidden="true" />
      <div className="scene-body blades">
        <h2 id="blades-title" className="sr-only">
          Three blades
        </h2>
        <ul className="blade-list">
          {blades.map((b, i) => (
            <li key={b.id}>
              <a href={`#blade-${b.id}`} className="blade" data-blade={b.id} data-cut="" aria-describedby={`blade-line-${b.id}`}>
                <span className="blade-numeral" aria-hidden="true">
                  {b.numeral}
                </span>
                <svg className="blade-stroke" viewBox="0 0 100 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false">
                  <path d={placeholderBladeStroke(7 + i * 13)} />
                </svg>
                <BrushText phrase={`blade.${b.id}.label`} className="blade-label" />
              </a>
            </li>
          ))}
        </ul>
        <div className="blade-lines">
          {blades.map((b) => (
            <p key={b.id} id={`blade-line-${b.id}`} className="blade-line" data-blade-line={b.id}>
              <BrushText phrase={`blade.${b.id}.line`} instance={`hub-${b.id}`} />
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
