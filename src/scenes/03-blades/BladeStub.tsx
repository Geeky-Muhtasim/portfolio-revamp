import { blades, ui, type BladeId } from "@/config/site";
import { BrushText } from "@/motion/brush/BrushText";

/** Where a cut from the hub lands until the blade's full scene is built (Phase 4). */
export function BladeStub({ id }: { id: BladeId }) {
  const blade = blades.find((b) => b.id === id)!;
  return (
    <section id={`blade-${id}`} className="scene scene-stub" data-scene={`blade-${id}`} aria-labelledby={`blade-${id}-title`} tabIndex={-1}>
      <div className="scene-ink" aria-hidden="true" />
      <div className="scene-body stub">
        <p className="stub-numeral">
          {ui.bladePrefix} {blade.numeral}
        </p>
        <h2 id={`blade-${id}-title`} className="stub-title">
          <BrushText phrase={`blade.${id}.label`} instance={`stub-label-${id}`} />
        </h2>
        <p className="stub-line">
          <BrushText phrase={`blade.${id}.line`} instance={`stub-${id}`} />
        </p>
        <a href="#blades" className="stub-back" data-cut="">
          {ui.backToBlades}
        </a>
      </div>
    </section>
  );
}
