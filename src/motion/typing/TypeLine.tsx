/*
 * A line of terminal text. Screen readers get the plain sentence; sighted
 * visitors see a visual copy, split into segments, that the typer
 * (typer.ts) clears and types back in. The server sends it fully typed,
 * so it reads correctly with no JavaScript and with reduced motion.
 */

export interface Segment {
  text: string;
  className?: string;
}

interface Props {
  segments: Segment[];
  /** Show the prompt before the line. */
  prompt?: boolean;
  /** Leave the terminal cursor at the end of this line. */
  cursor?: boolean;
}

export function TypeLine({ segments, prompt = true, cursor = false }: Props) {
  return (
    <>
      <span className="sr-only">{segments.map((s) => s.text).join("")}</span>
      <span className="type" aria-hidden="true">
        {prompt && <span className="prompt">&gt; </span>}
        {segments.map((s, i) => (
          <span key={i} className={`seg ${s.className ?? ""}`}>
            {s.text}
          </span>
        ))}
        {cursor && <i className="term-cursor is-final" />}
      </span>
    </>
  );
}
