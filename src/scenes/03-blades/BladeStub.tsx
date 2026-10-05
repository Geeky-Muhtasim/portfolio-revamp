import { blades, episodes, ui, type BladeId } from "@/config/site";
import { TypeLine } from "@/motion/typing/TypeLine";

/** Where the slash from the hub lands until the blade's full scene is built. */
export function BladeStub({ id }: { id: BladeId }) {
  const blade = blades.find((b) => b.id === id)!;
  const ep = episodes[id];
  return (
    <section id={`blade-${id}`} className="scene scene-stub" data-scene={`blade-${id}`} aria-labelledby={`blade-${id}-title`} tabIndex={-1}>
      <div className="scene-body stub">
        <div className="crt-panel stub-panel">
          <div className="crt-glass">
            <p className="ep-code">
              {ep.code} <span aria-hidden="true">{"//"}</span> {ep.title}
            </p>
            <h2 id={`blade-${id}-title`} className="title-card" data-smear="">
              {blade.label}
            </h2>
            <p className="stub-line" data-type-line="">
              <TypeLine segments={[{ text: blade.line }]} />
            </p>
            <a href="#blades" className="stub-back" data-cut="">
              {ui.backToBlades}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
