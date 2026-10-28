import { z } from "zod";

const link = z.strictObject({
  label: z.string().min(1),
  href: z.string().min(1),
});

const feature = z.strictObject({
  /** Name of a lucide icon, in kebab-case, for example `shield-check`. */
  icon: z.string().regex(/^[a-z0-9-]+$/),
  eyebrow: z.string().min(1),
  title: z.string().min(1),
  text: z.string().min(1),
});

/**
 * The closed contract of `sitekit.config.json`. A key that is not declared here is an error,
 * so nothing reaches a published page by accident.
 */
export const siteConfigSchema = z.strictObject({
  site: z.strictObject({
    name: z.string().min(1),
    description: z.string().min(1),
    /** Origin of the published site, for example `https://user.github.io`. */
    url: z.url(),
    /** Path the site is served from, `/` or `/repository-name/`. */
    base: z
      .string()
      .regex(/^\/([\w.-]+\/)*$/, "base must start and end with a slash")
      .default("/"),
    repository: z.url().optional(),
    license: z.string().min(1).optional(),
    version: z.string().min(1).optional(),
    installCommand: z.string().min(1).optional(),
  }),
  hero: z.strictObject({
    badge: z.string().min(1).optional(),
    title: z.string().min(1),
    lede: z.string().min(1),
    primary: link,
    secondary: link.optional(),
  }),
  features: z.array(feature).default([]),
  nav: z.array(link).default([]),
  footer: z.strictObject({ links: z.array(link).default([]) }).default({ links: [] }),
  /** Folders and files to document, relative to the site folder. */
  sources: z
    .strictObject({
      /** Root of the repository being documented, relative to the site folder. */
      root: z.string().default(".."),
      docs: z.string().default("../docs"),
      examples: z.string().default("../examples"),
      changelog: z.string().default("../CHANGELOG.md"),
    })
    .default({
      root: "..",
      docs: "../docs",
      examples: "../examples",
      changelog: "../CHANGELOG.md",
    }),
  deploy: z
    .strictObject({
      target: z.enum(["github-pages", "none"]).default("github-pages"),
      /** Say that a private repository's Pages site is meant to be public. */
      acknowledgePublicPages: z.boolean().default(false),
      /** For runners where `gh` cannot tell. Otherwise the check asks GitHub. */
      repositoryVisibility: z.enum(["public", "private", "internal"]).optional(),
    })
    .default({ target: "github-pages", acknowledgePublicPages: false }),
  anonymize: z
    .strictObject({
      excludePaths: z.array(z.string()).default([]),
      replace: z.record(z.string(), z.string()).default({}),
      denyPatterns: z.array(z.string()).default([]),
      allow: z.array(z.string()).default([]),
    })
    .default({ excludePaths: [], replace: {}, denyPatterns: [], allow: [] }),
});

/** A validated `sitekit.config.json`. */
export type SiteConfig = z.infer<typeof siteConfigSchema>;
/** A labelled link, used in the navigation and the footer. */
export type NavLink = z.infer<typeof link>;
/** One card of the home page features section. */
export type Feature = z.infer<typeof feature>;

/** Validate a parsed `sitekit.config.json`. Throws a readable error listing every problem. */
export function parseSiteConfig(input: unknown): SiteConfig {
  const result = siteConfigSchema.safeParse(input);
  if (result.success) return result.data;
  const problems = result.error.issues.map(
    (issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`,
  );
  throw new Error(`Invalid sitekit.config.json:\n${problems.join("\n")}`);
}
