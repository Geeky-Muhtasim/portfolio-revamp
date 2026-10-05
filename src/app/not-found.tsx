import Link from "next/link";
import { CelWorld } from "@/world/CelWorld";

/** A missing route still lands at dusk, on a terminal. The full wrong-turn moment comes with the easter eggs. */
export default function NotFound() {
  return (
    <>
      <CelWorld />
      <main className="scene not-found">
        <div className="scene-body stub">
          <div className="crt-panel stub-panel">
            <div className="crt-glass">
              <h1 className="ep-code">ROUTE NOT FOUND.</h1>
              <p className="stub-line">
                <Link href="/">&gt; Back to the start</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
