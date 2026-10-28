import { buildDocuments, publishedRoutes } from "../../../template/src/application";
import type { SourceFile } from "../../../template/src/domain";

const file = (
  path: string,
  content: string,
  frontmatter: Record<string, unknown> = {},
  collection: SourceFile["collection"] = "docs",
): SourceFile => ({
  path,
  collection,
  frontmatter,
  content,
});

describe("buildDocuments", () => {
  it("takes title and description from the content when the frontmatter has none", () => {
    const [doc] = buildDocuments(
      [file("docs/start.md", "# Getting going\n\nThe first steps.\n\nMore.")],
      { base: "/" },
    );
    expect(doc).toMatchObject({
      slug: "start",
      route: "/docs/start/",
      title: "Getting going",
      description: "The first steps.",
    });
    expect(doc!.body.startsWith("# Getting going")).toBe(false);
  });

  it("records where the description came from, so a page does not repeat its own first paragraph", () => {
    const docs = buildDocuments(
      [
        file("docs/a.md", "# A\n\nFrom the body."),
        file("docs/b.md", "# B\n\nBody.", { description: "From frontmatter" }),
        file("docs/c.md", "# C"),
      ],
      { base: "/" },
    );
    expect(docs.map((d) => d.descriptionSource)).toEqual(["content", "frontmatter", "none"]);
  });

  it("prefers the frontmatter and keeps a body heading that differs from the title", () => {
    const [doc] = buildDocuments(
      [
        file("docs/a.md", "# Heading\n\nProse.", {
          title: "Custom",
          description: "Custom description",
        }),
      ],
      { base: "/" },
    );
    expect(doc).toMatchObject({ title: "Custom", description: "Custom description" });
    expect(doc!.body).toContain("# Heading");
  });

  it("falls back to the file name when there is no heading", () => {
    const [doc] = buildDocuments([file("docs/design-tokens.md", "Just prose.")], { base: "/" });
    expect(doc!.title).toBe("Design tokens");
  });

  it("prefixes routes with the site base", () => {
    const [doc] = buildDocuments([file("docs/a.md", "# A")], { base: "/recaptcha/" });
    expect(doc!.route).toBe("/recaptcha/docs/a/");
  });

  it("names a folder page after its folder", () => {
    const docs = buildDocuments(
      [file("docs/guide/README.md", "# G"), file("docs/other/index.md", "# O")],
      { base: "/" },
    );
    expect(docs.map((d) => d.slug).sort()).toEqual(["guide", "other"]);
  });

  it("gives the changelog one fixed route", () => {
    const [doc] = buildDocuments(
      [file("CHANGELOG.md", "# Changelog\n\n## 1.0.0", {}, "changelog")],
      { base: "/x/" },
    );
    expect(doc).toMatchObject({ slug: "changelog", route: "/x/changelog/" });
  });

  it("sorts by explicit order first, then by slug", () => {
    const docs = buildDocuments(
      [
        file("docs/b.md", "# B"),
        file("docs/a.md", "# A"),
        file("docs/z.md", "# Z", { order: 1 }),
        file("docs/y.md", "# Y", { order: 2 }),
      ],
      { base: "/" },
    );
    expect(docs.map((d) => d.slug)).toEqual(["z", "y", "a", "b"]);
  });

  it("fails loudly when two files get the same route", () => {
    expect(() =>
      buildDocuments([file("docs/a/guide.md", "# One"), file("docs/b/guide.md", "# Two")], {
        base: "/",
      }),
    ).toThrow(/docs\/a\/guide\.md and docs\/b\/guide\.md/);
  });

  it("maps repository paths to routes", () => {
    const docs = buildDocuments([file("docs/a.md", "# A")], { base: "/" });
    expect(publishedRoutes(docs).get("docs/a.md")).toBe("/docs/a/");
  });
});
