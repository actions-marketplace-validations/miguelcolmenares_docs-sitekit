import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import matter from "gray-matter";
import { applyReplacements, matchesAny } from "../domain";
import type { Collection, SiteConfig, SourceFile } from "../domain";

const SKIPPED_FOLDERS = new Set(["node_modules", ".git", "dist", ".astro", ".next", "coverage"]);

function posix(path: string): string {
  return path.split(sep).join("/");
}

function walk(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (SKIPPED_FOLDERS.has(entry.name)) return [];
    const full = join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

/** The markdown read from a repository, and the paths of every file in it. */
export interface RepositorySources {
  /** Absolute path of the repository root. */
  root: string;
  files: SourceFile[];
  /** Every file of the repository, as repository-relative paths, for checking links. */
  existing: Set<string>;
}

/**
 * Read the markdown the site documents. A file matched by `anonymize.excludePaths` is never read,
 * and `anonymize.replace` is applied to everything that is.
 */
export function readSources(siteDir: string, config: SiteConfig): RepositorySources {
  const root = resolve(siteDir, config.sources.root);
  const toRepoPath = (absolute: string) => posix(relative(root, absolute));
  const existing = new Set(walk(root).map(toRepoPath));
  const { excludePaths, replace } = config.anonymize;

  const read = (absolute: string, collection: Collection): SourceFile | null => {
    const path = toRepoPath(absolute);
    if (matchesAny(path, excludePaths)) return null;
    const parsed = matter(readFileSync(absolute, "utf8"));
    return {
      path,
      collection,
      frontmatter: JSON.parse(applyReplacements(JSON.stringify(parsed.data), replace)) as Record<
        string,
        unknown
      >,
      content: applyReplacements(parsed.content, replace),
    };
  };

  const collect = (directory: string, collection: Collection): SourceFile[] =>
    walk(resolve(siteDir, directory))
      .filter((file) => /\.mdx?$/i.test(file))
      .sort()
      .map((file) => read(file, collection))
      .filter((file): file is SourceFile => file !== null);

  const files = [
    ...collect(config.sources.docs, "docs"),
    ...collect(config.sources.examples, "examples"),
  ];

  const changelog = resolve(siteDir, config.sources.changelog);
  if (existsSync(changelog) && statSync(changelog).isFile()) {
    const file = read(changelog, "changelog");
    if (file) files.push(file);
  }
  return { root, files, existing };
}
