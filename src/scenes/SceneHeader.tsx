import { TypeLine } from "@/motion/typing/TypeLine";

interface Props {
  ep: { code: string; title: string };
  /** id for the heading, so the section can be labelled by it. */
  id: string;
  title: string;
  /** The scene's one line, typed in when the scene arrives. */
  line?: string;
}

/** Episode code, a title card that arrives with a cel smear, and the scene's line. */
export function SceneHeader({ ep, id, title, line }: Props) {
  return (
    <header className="scene-header">
      <p className="ep-code">
        {ep.code} <span aria-hidden="true">{"//"}</span> {ep.title}
      </p>
      <h2 id={id} className="title-card" data-smear="">
        {title}
      </h2>
      {line && (
        <p className="scene-line" data-type-line="">
          <TypeLine segments={[{ text: line }]} />
        </p>
      )}
    </header>
  );
}
