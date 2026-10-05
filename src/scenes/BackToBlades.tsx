import { ui } from "@/config/site";

export function BackToBlades() {
  return (
    <a href="#blades" className="back-link" data-cut="">
      {ui.backToBlades}
    </a>
  );
}
