/*
 * Ink assets behind one interface. Today every entry is a procedural
 * placeholder; scanned sumi ink replaces them by changing `src` and
 * flipping `placeholder` to false. Nothing else needs to change.
 */

export interface InkAsset {
  id: string;
  src: string;
  width: number;
  height: number;
  kind: "wash" | "grain";
  /** Opacity the brief asks for on dark scenes. */
  opacity: number;
  placeholder: boolean;
}

export const ink = {
  wash: {
    id: "wash",
    src: "/ink/placeholder-wash.svg",
    width: 1200,
    height: 800,
    kind: "wash",
    opacity: 0.07,
    placeholder: true,
  },
  grain: {
    id: "grain",
    src: "/ink/placeholder-grain.svg",
    width: 256,
    height: 256,
    kind: "grain",
    opacity: 0.04,
    placeholder: true,
  },
} as const satisfies Record<string, InkAsset>;
