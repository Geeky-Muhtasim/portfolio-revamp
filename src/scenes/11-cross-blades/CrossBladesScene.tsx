import { commands, episodes, labels, sceneLines, titleCards } from "@/config/site";
import type { Portfolio } from "@/content/schema";
import { Seal } from "../02-vow/Seal";
import { SceneHeader } from "../SceneHeader";

const display = (url: string) => url.replace(/^https?:\/\//, "").replace(/\/$/, "").split("?")[0]!;

/**
 * Scene 11: a "Next episode" card, contact links as terminal commands and
 * the seal; then, at the very end, the CRT powers off to a dot.
 */
export function CrossBladesScene({ portfolio }: { portfolio: Portfolio }) {
  const { profile } = portfolio;
  const links: Array<{ cmd: string; href: string; text: string }> = [{ cmd: commands.email, href: `mailto:${profile.email}`, text: profile.email }];
  if (profile.socials.github) links.push({ cmd: commands.github, href: profile.socials.github, text: display(profile.socials.github) });
  if (profile.socials.linkedin) links.push({ cmd: commands.linkedin, href: profile.socials.linkedin, text: display(profile.socials.linkedin) });
  if (profile.socials.scholar) links.push({ cmd: commands.scholar, href: profile.socials.scholar, text: display(profile.socials.scholar) });

  return (
    <section id="cross-blades" className="scene scene-cross" data-scene="cross-blades" data-time="night" aria-labelledby="cross-title" tabIndex={-1}>
      <div className="scene-body">
        <div className="crt-panel cross-panel">
          <div className="crt-glass">
            <SceneHeader ep={episodes.crossBlades} id="cross-title" title={titleCards.crossBlades} line={sceneLines.crossBlades} />
            <div className="next-episode">
              <p className="ep-code">{labels.nextEpisode}</p>
              <p className="next-episode-text">{profile.tagline}</p>
            </div>
            <ul className="commands">
              {links.map((l) => (
                <li key={l.cmd}>
                  <a href={l.href} target={l.href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer">
                    <span className="cmd-prompt" aria-hidden="true">
                      {"$ "}
                    </span>
                    <span className="cmd-name">{l.cmd}</span> <span className="cmd-arg">{l.text}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="seal-slot cross-seal">
            <Seal />
          </div>
        </div>
      </div>
      <div className="power-off" aria-hidden="true">
        <i className="po-top" />
        <i className="po-bottom" />
        <i className="po-dot" />
      </div>
    </section>
  );
}
