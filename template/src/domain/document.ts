export type Collection = "docs" | "examples" | "changelog";

/** A markdown file read from the repository, before it becomes a page. */
export interface SourceFile {
  /** Repository-relative path with forward slashes. */
  path: string;
  collection: Collection;
  frontmatter: Record<string, unknown>;
  content: string;
}

/** A page of the site. */
export interface Document {
  collection: Collection;
  /** Repository-relative path of the source file. */
  path: string;
  slug: string;
  /** Route including the site base, with a trailing slash. */
  route: string;
  title: string;
  description: string;
  /** Where the description came from. A description taken from the body is already on the page. */
  descriptionSource: "frontmatter" | "content" | "none";
  /** Explicit position from the frontmatter, or null. */
  order: number | null;
  /** Markdown body, without a leading heading that repeats the title. */
  body: string;
}
