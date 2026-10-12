import { shortOrg } from "./derive";
import type { Experience, Portfolio, Publication } from "./schema";

/*
 * Search metadata, built from portfolio.md like everything else: the page
 * title and description, and the JSON-LD graph that tells search engines
 * who the site is about (a Person on a ProfilePage, their roles, school,
 * profiles and papers). Nothing here is written by hand; missing data is
 * simply left out.
 */

function current(p: Portfolio, type: Experience["type"]): Experience | undefined {
  return p.experience.find((e) => e.type === type && e.period.end === "present");
}

/** Siteroot URL with a trailing slash, the one canonical form of the home page. */
export function siteUrl(p: Portfolio, path = "/"): string {
  return new URL(path, p.profile.website).href;
}

export function seoTitle(p: Portfolio): string {
  return `${p.profile.name} | ${p.profile.title}`;
}

/** One sentence: who, where they work, where they research, and on what. */
export function seoDescription(p: Portfolio): string {
  const job = current(p, "Full-time");
  const lab = current(p, "Research");
  const topics = p.about.match(/I work on ([^.]+)\./)?.[1];
  const roles = [job && `a software engineer at ${job.organization}`, lab && `an NLP researcher at ${shortOrg(lab.organization)}`].filter(Boolean);
  let s = roles.length ? `${p.profile.name} is ${roles.join(" and ")}` : `${p.profile.name}, ${p.profile.title}`;
  if (topics) s += `, working on ${topics}`;
  return `${s}.`;
}

function publicationNode(p: Portfolio, pub: Publication, personId: string) {
  const links = Object.values(pub.links).filter(Boolean);
  const thesis = pub.type === "Undergraduate Thesis";
  return {
    "@type": thesis ? "Thesis" : "ScholarlyArticle",
    "@id": siteUrl(p, `/#${pub.id}`),
    // The type already says "Thesis"; the title need not repeat it.
    name: thesis ? pub.title.replace(/^Thesis:\s*/, "") : pub.title,
    author: pub.authors.map((a) => (a.isSelf ? { "@id": personId } : { "@type": "Person", name: a.name })),
    datePublished: String(pub.year),
    ...(pub.abstract && { abstract: pub.abstract }),
    ...(pub.tags.length && { keywords: pub.tags.join(", ") }),
    publication: { "@type": "PublicationEvent", name: pub.venue },
    ...(links[0] && { url: links[0] }),
    ...(links.length > 1 && { sameAs: links.slice(1) }),
  };
}

/** The JSON-LD graph for the home page: WebSite, ProfilePage, Person, and the Person's papers. */
export function jsonLd(p: Portfolio) {
  const { profile } = p;
  const home = siteUrl(p);
  const personId = `${home}#person`;
  const websiteId = `${home}#website`;
  const job = current(p, "Full-time");
  const lab = current(p, "Research");
  const [locality, country] = profile.location.split(",").map((s) => s.trim());
  const sameAs = Object.values(profile.socials).filter((u): u is string => Boolean(u));

  const person = {
    "@type": "Person",
    "@id": personId,
    name: profile.name,
    alternateName: [profile.nickname, profile.shortName].filter((n) => n !== profile.name),
    url: home,
    email: `mailto:${profile.email}`,
    jobTitle: profile.title,
    description: seoDescription(p),
    ...(job && { worksFor: { "@type": "Organization", name: job.organization } }),
    ...(lab && { affiliation: { "@type": "ResearchOrganization", name: lab.organization } }),
    alumniOf: p.education.map((e) => ({ "@type": "CollegeOrUniversity", name: e.institution })),
    ...(locality && { address: { "@type": "PostalAddress", addressLocality: locality, ...(country && { addressCountry: country }) } }),
    knowsAbout: p.researchInterests.map((r) => r.title),
    sameAs,
  };

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: home,
        name: profile.name,
        alternateName: profile.nickname,
        inLanguage: "en",
        publisher: { "@id": personId },
      },
      {
        "@type": "ProfilePage",
        "@id": `${home}#profile`,
        url: home,
        name: seoTitle(p),
        isPartOf: { "@id": websiteId },
        mainEntity: { "@id": personId },
        inLanguage: "en",
      },
      person,
      ...p.publications.map((pub) => publicationNode(p, pub, personId)),
    ],
  };
}

/** JSON-LD for a <script> tag: "<" escaped so text can never close the tag early. */
export function jsonLdScript(p: Portfolio): string {
  return JSON.stringify(jsonLd(p)).replace(/</g, "\\u003c");
}
