import { dropLeadingTitle, extractDescription, extractTitle, humanize, kebab } from "../domain";
import type { Document, SourceFile } from "../domain";

function slugFor(file: SourceFile): string {
  if (file.collection === "changelog") return "changelog";
  const parts = file.path.split("/");
  const name = parts[parts.length - 1]!;
  const stem = kebab(name);
  // docs/guide/README.md and docs/guide/index.md are the page called "guide".
  if ((stem === "readme" || stem === "index") && parts.length > 1)
    return kebab(parts[parts.length - 2]!);
  return stem;
}

function text(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function orderOf(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

/**
 * Turn source files into pages. Title, description and order come from the frontmatter first and
 * from the content second. Two files that would get the same route are an error, not a silent skip.
 */
export function buildDocuments(
  files: readonly SourceFile[],
  options: { base: string },
): Document[] {
  const documents = files.map((file): Document => {
    const slug = slugFor(file);
    const title = text(file.frontmatter.title) ?? extractTitle(file.content, humanize(slug));
    const fromFrontmatter = text(file.frontmatter.description);
    const fromContent = fromFrontmatter ? "" : extractDescription(file.content);
    return {
      collection: file.collection,
      path: file.path,
      slug,
      route:
        file.collection === "changelog"
          ? `${options.base}changelog/`
          : `${options.base}${file.collection}/${slug}/`,
      title,
      description: fromFrontmatter ?? fromContent,
      descriptionSource: fromFrontmatter ? "frontmatter" : fromContent ? "content" : "none",
      order: orderOf(file.frontmatter.order),
      body: dropLeadingTitle(file.content, title),
    };
  });

  const byRoute = new Map<string, Document>();
  for (const document of documents) {
    const clash = byRoute.get(document.route);
    if (clash) {
      throw new Error(
        `Two files produce the route ${document.route}: ${clash.path} and ${document.path}`,
      );
    }
    byRoute.set(document.route, document);
  }

  return documents.sort((a, b) => {
    if (a.collection !== b.collection) return a.collection.localeCompare(b.collection);
    if (a.order !== null && b.order !== null && a.order !== b.order) return a.order - b.order;
    if (a.order !== null && b.order === null) return -1;
    if (a.order === null && b.order !== null) return 1;
    return a.slug.localeCompare(b.slug);
  });
}

/** Repository path to route, the map link rewriting needs. */
export function publishedRoutes(documents: readonly Document[]): Map<string, string> {
  return new Map(documents.map((document) => [document.path, document.route]));
}
