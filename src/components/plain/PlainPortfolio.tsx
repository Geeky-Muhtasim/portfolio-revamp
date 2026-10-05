import Link from "next/link";
import type {
  Experience,
  Portfolio,
  Project,
  Publication,
} from "@/content/schema";
import { blades, vow } from "@/config/site";

/*
 * Every fact in portfolio.md as plain, semantic HTML. This proves the
 * content pipeline and is the fallback for anyone who wants the words
 * without the ceremony.
 */

const LINK_LABELS: Record<string, string> = {
  publisher: "Publisher",
  pdf: "PDF",
  arxiv: "arXiv",
  code: "Code",
  dataset: "Dataset",
  github: "GitHub",
};

function Links({ links }: { links: Record<string, string> }) {
  const entries = Object.entries(links);
  if (!entries.length) return null;
  return (
    <ul className="plain-inline">
      {entries.map(([key, href]) => (
        <li key={key}>
          <a href={href} rel="noopener noreferrer" target="_blank">
            {LINK_LABELS[key] ?? key}
          </a>
        </li>
      ))}
    </ul>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  if (children === undefined || children === null || children === "") return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </>
  );
}

function List({ label, items }: { label: string; items: readonly string[] }) {
  if (!items.length) return null;
  return (
    <>
      <h4>{label}</h4>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </>
  );
}

function ExperienceEntry({ job }: { job: Experience }) {
  return (
    <article>
      <h3>{job.title}</h3>
      <dl>
        <Field label="Organization">{job.organization}</Field>
        <Field label="Location">{job.location}</Field>
        <Field label="Period">{job.period.raw}</Field>
        <Field label="Type">{job.type}</Field>
      </dl>
      <p>{job.description}</p>
      <List label="Responsibilities" items={job.responsibilities} />
      <List label="Achievements" items={job.achievements} />
      {job.techStack.length > 0 && <p>Stack: {job.techStack.join(", ")}</p>}
    </article>
  );
}

function PublicationEntry({ pub }: { pub: Publication }) {
  return (
    <article>
      <h3>{pub.title}</h3>
      <p>
        {pub.authors.map((author, i) => (
          <span key={author.name}>
            {i > 0 && ", "}
            {author.isSelf ? <strong>{author.name}</strong> : author.name}
          </span>
        ))}
      </p>
      <dl>
        <Field label="Venue">{pub.venue}</Field>
        <Field label="Year">{pub.year}</Field>
        <Field label="Type">{pub.type}</Field>
        <Field label="Citations">{pub.citations}</Field>
        <Field label="Abstract">{pub.abstract}</Field>
        <Field label="My contribution">{pub.contribution}</Field>
        <Field label="Impact">{pub.impact}</Field>
        <Field label="Tags">{pub.tags.join(", ")}</Field>
      </dl>
      <Links links={pub.links} />
    </article>
  );
}

function ProjectEntry({ project }: { project: Project }) {
  return (
    <article>
      <h3>{project.title}</h3>
      <dl>
        <Field label="Status">{project.status}</Field>
        <Field label="Role">{project.role}</Field>
        <Field label="Period">{project.period.raw}</Field>
        <Field label="Category">{project.category}</Field>
      </dl>
      <p>{project.description}</p>
      {project.modules.length > 0 && (
        <>
          <h4>Modules</h4>
          <dl>
            {project.modules.map((m) => (
              <Field key={m.name} label={m.name}>
                {m.description}
              </Field>
            ))}
          </dl>
        </>
      )}
      <List label="Highlights" items={project.highlights} />
      {project.impact && <p>Impact: {project.impact}</p>}
      {project.techStack.length > 0 && <p>Stack: {project.techStack.join(", ")}</p>}
      <Links links={project.links} />
    </article>
  );
}

export function PlainPortfolio({ portfolio }: { portfolio: Portfolio }) {
  const { profile } = portfolio;
  const socials = Object.entries(profile.socials) as Array<[string, string]>;
  const SOCIAL_LABELS: Record<string, string> = {
    github: "GitHub",
    linkedin: "LinkedIn",
    scholar: "Google Scholar",
    twitter: "X",
  };

  return (
    <main id="content" className="plain">
      <header>
        <h1>{profile.name}</h1>
        <p>{profile.title}</p>
        <p>{profile.tagline}</p>
        <p>{profile.location}</p>
        <ul className="plain-inline">
          <li>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </li>
          {socials.map(([key, href]) => (
            <li key={key}>
              <a href={href} rel="noopener noreferrer" target="_blank">
                {SOCIAL_LABELS[key] ?? key}
              </a>
            </li>
          ))}
        </ul>
        <p>
          <Link href="/">Back to the full site</Link>
        </p>
      </header>

      <section aria-labelledby="vow">
        <h2 id="vow">The vow</h2>
        <blockquote>
          {vow.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </blockquote>
        <p>
          {profile.name}. {vow.sublineAfterName.join(" ")}
        </p>
      </section>

      <section aria-labelledby="blades">
        <h2 id="blades">Three blades</h2>
        <dl>
          {blades.map((b) => (
            <Field key={b.id} label={b.label}>
              {b.line}
            </Field>
          ))}
        </dl>
      </section>

      <section aria-labelledby="about">
        <h2 id="about">About</h2>
        <p>{portfolio.about}</p>
      </section>

      <section aria-labelledby="statement">
        <h2 id="statement">Research statement</h2>
        <p>{portfolio.researchStatement}</p>
      </section>

      <section aria-labelledby="interests">
        <h2 id="interests">Research interests</h2>
        <dl>
          {portfolio.researchInterests.map((r) => (
            <Field key={r.title} label={r.title}>
              {r.description}
            </Field>
          ))}
        </dl>
      </section>

      <section aria-labelledby="education">
        <h2 id="education">Education</h2>
        {portfolio.education.map((e) => (
          <article key={e.title}>
            <h3>{e.title}</h3>
            <dl>
              <Field label="Institution">{e.institution}</Field>
              <Field label="Period">{e.period.raw}</Field>
              <Field label="Thesis">{e.thesis}</Field>
              <Field label="About the thesis">{e.thesisDescription}</Field>
              <Field label="Supervisor">{e.supervisor}</Field>
              <Field label="Coursework">{e.coursework.join(", ")}</Field>
            </dl>
          </article>
        ))}
      </section>

      <section aria-labelledby="experience">
        <h2 id="experience">Experience</h2>
        {portfolio.experience.map((job) => (
          <ExperienceEntry key={`${job.title}-${job.period.raw}`} job={job} />
        ))}
      </section>

      <section aria-labelledby="publications">
        <h2 id="publications">Publications</h2>
        <p>
          Google Scholar: {portfolio.scholar.citations} citations, h-index {portfolio.scholar.hIndex}, i10-index{" "}
          {portfolio.scholar.i10Index}
        </p>
        {portfolio.publications.map((pub) => (
          <PublicationEntry key={pub.id} pub={pub} />
        ))}
      </section>

      <section aria-labelledby="official">
        <h2 id="official">Official projects at Bangladesh Finance PLC</h2>
        {portfolio.officialProjects.map((p) => (
          <ProjectEntry key={p.id} project={p} />
        ))}
      </section>

      <section aria-labelledby="personal">
        <h2 id="personal">Personal, client and research projects</h2>
        {portfolio.personalProjects.map((p) => (
          <ProjectEntry key={p.id} project={p} />
        ))}
      </section>

      <section aria-labelledby="skills">
        <h2 id="skills">Skills</h2>
        <dl>
          {portfolio.skills.map((s) => (
            <Field key={s.title} label={s.title}>
              {s.items.join(", ")}
            </Field>
          ))}
        </dl>
      </section>

      <section aria-labelledby="awards">
        <h2 id="awards">Awards and recognition</h2>
        <ul>
          {portfolio.awards.map((a) => (
            <li key={a.title}>
              {a.title}
              {a.organization && `, ${a.organization}`}
              {a.year && ` (${a.year})`}
              {a.description && `. ${a.description}`}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="certifications">
        <h2 id="certifications">Certifications</h2>
        <ul>
          {portfolio.certifications.map((c) => (
            <li key={c.title}>
              {c.title}, {c.provider}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="leadership">
        <h2 id="leadership">Leadership and service</h2>
        {portfolio.leadership.map((l) => (
          <article key={l.title}>
            <h3>{l.title}</h3>
            <dl>
              <Field label="Roles">{l.roles.join("; ")}</Field>
              <Field label="Period">{l.period?.raw}</Field>
            </dl>
            {l.description && <p>{l.description}</p>}
            {l.items.length > 0 && (
              <ul>
                {l.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
