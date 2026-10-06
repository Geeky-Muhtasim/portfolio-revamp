import { ui } from "@/config/site";

/**
 * The seal: a crimson square, initials MIS, rotated about -8 degrees.
 * Flat cel paint with a cream inner frame. It is a button so the triple
 * seal easter egg is reachable by keyboard too; a single press just gives.
 */
export function Seal() {
  return (
    <button type="button" className="seal" aria-label={ui.sealLabel} data-seal-button="">
      <span className="seal-frame" aria-hidden="true">
        MIS
      </span>
    </button>
  );
}
