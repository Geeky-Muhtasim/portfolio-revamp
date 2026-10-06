import Link from "next/link";
import { eggCopy, flags } from "@/config/site";
import { CelWorld } from "@/world/CelWorld";

/**
 * Wrong turn: any missing route lands at dusk on a terminal that admits it
 * got lost. The line types itself in with CSS, so it works without
 * JavaScript; reduced motion shows it already typed.
 */
export default function NotFound() {
  return (
    <>
      <CelWorld />
      <main className="scene not-found">
        <div className="scene-body stub">
          <div className="crt-panel stub-panel">
            <div className="crt-glass">
              <h1 className="ep-code">{eggCopy.wrongTurnCode}</h1>
              {flags.eggs.wrongTurn && (
                <p className="wrong-turn-line">
                  <span className="typed-in" style={{ ["--chars" as string]: eggCopy.wrongTurnLine.length }}>
                    {eggCopy.wrongTurnLine}
                  </span>
                  <i className="term-cursor" aria-hidden="true" />
                </p>
              )}
              <p className="stub-line">
                <Link href="/">&gt; {eggCopy.wrongTurnLink}</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
