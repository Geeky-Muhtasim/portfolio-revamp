import { z } from "zod";

/*
 * Schemas for content/portfolio.md. Objects are strict: an unknown or
 * misspelled key in the markdown fails the build instead of vanishing.
 */

const text = z.string().trim().min(1);
const url = z.url();
const list = z.array(text);

const yearMonth = z.strictObject({
  year: z.int().min(1990).max(2100),
  month: z.int().min(1).max(12).optional(),
});

export const periodSchema = z.strictObject({
  raw: text,
  start: yearMonth,
  /** "present" for ongoing work, null for a single point in time. */
  end: z.union([yearMonth, z.literal("present"), z.null()]),
});

export const profileSchema = z.strictObject({
  name: text,
  shortName: text,
  nickname: text,
  title: text,
  tagline: text,
  location: text,
  email: z.email(),
  website: url,
  socials: z.strictObject({
    github: url.optional(),
    linkedin: url.optional(),
    scholar: url.optional(),
    twitter: url.optional(),
  }),
  stats: z.strictObject({
    publications: z.number().int().nonnegative(),
    citations: z.number().int().nonnegative(),
    hIndex: z.number().int().nonnegative(),
    officialProjects: z.number().int().nonnegative(),
    personalProjects: z.number().int().nonnegative(),
    yearsIndustry: z.number().nonnegative(),
    yearsResearch: z.number().nonnegative(),
  }),
});

export const researchInterestSchema = z.strictObject({
  title: text,
  description: text,
  /** Parsed for completeness. Never rendered: stock icons are off the table. */
  icon: text.optional(),
});

export const educationSchema = z.strictObject({
  title: text,
  institution: text,
  period: periodSchema,
  thesis: text.optional(),
  thesisDescription: text.optional(),
  supervisor: text.optional(),
  coursework: list.default([]),
});

export const experienceSchema = z.strictObject({
  title: text,
  organization: text,
  location: text,
  period: periodSchema,
  type: z.enum(["Full-time", "Internship", "Research", "Volunteer"]),
  description: text,
  responsibilities: list.default([]),
  techStack: list.default([]),
  achievements: list.default([]),
});

export const authorSchema = z.strictObject({ name: text, isSelf: z.boolean() });

const linkMap = z.record(z.string(), url);

export const publicationSchema = z.strictObject({
  title: text,
  id: text,
  authors: z.array(authorSchema).min(1),
  venue: text,
  year: z.int(),
  type: z.enum(["Conference", "Extended Abstract", "Workshop", "Undergraduate Thesis"]),
  tags: list.default([]),
  abstract: text.optional(),
  contribution: text.optional(),
  impact: text.optional(),
  citations: z.int().nonnegative().optional(),
  links: linkMap.default({}),
});

export const scholarSchema = z.strictObject({
  citations: z.int().nonnegative(),
  hIndex: z.int().nonnegative(),
  i10Index: z.int().nonnegative(),
});

export const OFFICIAL_STATUSES = ["Live", "Pilot", "Built, awaiting launch", "In development"] as const;

const moduleSchema = z.strictObject({ name: text, description: text });

const projectBase = {
  title: text,
  id: text,
  featured: z.boolean().default(false),
  category: text,
  role: text,
  period: periodSchema,
  description: text,
  techStack: list.default([]),
  highlights: list.default([]),
  modules: z.array(moduleSchema).default([]),
  impact: text.optional(),
  links: linkMap.default({}),
};

export const officialProjectSchema = z.strictObject({
  ...projectBase,
  status: z.enum(OFFICIAL_STATUSES),
});

export const personalProjectSchema = z.strictObject({
  ...projectBase,
  status: text,
});

export const skillGroupSchema = z.strictObject({ title: text, items: list.min(1) });

export const awardSchema = z.strictObject({
  title: text,
  description: text.optional(),
  year: z.int().optional(),
  organization: text.optional(),
});

export const certificationSchema = z.strictObject({ title: text, provider: text });

export const leadershipSchema = z.strictObject({
  title: text,
  roles: list.default([]),
  period: periodSchema.optional(),
  description: text.optional(),
  items: list.default([]),
});

export const portfolioSchema = z.strictObject({
  profile: profileSchema,
  about: text,
  researchStatement: text,
  researchInterests: z.array(researchInterestSchema),
  education: z.array(educationSchema),
  experience: z.array(experienceSchema),
  scholar: scholarSchema,
  publications: z.array(publicationSchema),
  officialProjects: z.array(officialProjectSchema),
  personalProjects: z.array(personalProjectSchema),
  skills: z.array(skillGroupSchema),
  awards: z.array(awardSchema),
  certifications: z.array(certificationSchema),
  leadership: z.array(leadershipSchema),
});

export type Period = z.infer<typeof periodSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type ResearchInterest = z.infer<typeof researchInterestSchema>;
export type Education = z.infer<typeof educationSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Author = z.infer<typeof authorSchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type ScholarSummary = z.infer<typeof scholarSchema>;
export type OfficialStatus = (typeof OFFICIAL_STATUSES)[number];
export type OfficialProject = z.infer<typeof officialProjectSchema>;
export type PersonalProject = z.infer<typeof personalProjectSchema>;
export type Project = OfficialProject | PersonalProject;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type Award = z.infer<typeof awardSchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type LeadershipEntry = z.infer<typeof leadershipSchema>;
export type Portfolio = z.infer<typeof portfolioSchema>;
