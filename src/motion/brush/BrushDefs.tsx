import { brush } from "./data";

/** Every glyph outline once, referenced by each written word through <use>. */
export function BrushDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" focusable="false" style={{ position: "absolute" }}>
      <defs>
        {Object.entries(brush.glyphs).map(([id, g]) => (
          <path key={id} id={`bg-${id}`} d={g.d} />
        ))}
      </defs>
    </svg>
  );
}
