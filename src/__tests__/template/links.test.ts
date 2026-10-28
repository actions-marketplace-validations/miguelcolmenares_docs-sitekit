import { resolveLink } from "../../../template/src/domain";
import type { LinkContext } from "../../../template/src/domain";

const context = (overrides: Partial<LinkContext> = {}): LinkContext => ({
  file: "docs/guides/start.md",
  published: new Map([
    ["docs/guides/convert.md", "/docs/convert/"],
    ["docs/tutorials/setup.md", "/docs/setup/"],
  ]),
  existing: new Set([
    "docs/guides/convert.md",
    "docs/tutorials/setup.md",
    "LICENSE",
    "docs/secret.md",
  ]),
  isExcluded: (path) => path === "docs/secret.md",
  repositoryUrl: "https://github.com/me/proj",
  ...overrides,
});

describe("resolveLink", () => {
  it.each([
    "https://example.com/x",
    "mailto:me@x.dev",
    "#anchor",
    "/already/a/route",
    "//cdn.test/a",
  ])("leaves %s as written", (href) => {
    expect(resolveLink(href, context())).toEqual({ kind: "unchanged", href });
  });

  it("turns a link to a published document into its route and keeps the anchor", () => {
    expect(resolveLink("./convert.md#step-2", context())).toEqual({
      kind: "route",
      href: "/docs/convert/#step-2",
    });
    expect(resolveLink("../tutorials/setup.md", context())).toEqual({
      kind: "route",
      href: "/docs/setup/",
    });
  });

  it("resolves an extensionless link", () => {
    expect(resolveLink("./convert", context())).toEqual({ kind: "route", href: "/docs/convert/" });
  });

  it("points to the repository host for a file that is not on the site", () => {
    expect(resolveLink("../../LICENSE", context())).toEqual({
      kind: "repository",
      href: "https://github.com/me/proj/blob/HEAD/LICENSE",
    });
  });

  it("leaves the link alone when it needs a repository URL and there is none", () => {
    expect(resolveLink("../../LICENSE", context({ repositoryUrl: undefined }))).toEqual({
      kind: "unchanged",
      href: "../../LICENSE",
    });
  });

  it("keeps only the text of a link to an excluded file, with a warning", () => {
    const result = resolveLink("../secret.md", context());
    expect(result.kind).toBe("text-only");
    expect(result).toHaveProperty("warning");
  });

  it("leaves a link to a missing file as written, with a warning", () => {
    const result = resolveLink("./nope.md", context());
    expect(result).toMatchObject({ kind: "missing", href: "./nope.md" });
  });

  it("warns when a link climbs out of the repository", () => {
    expect(resolveLink("../../../../x.md", context())).toMatchObject({ kind: "missing" });
  });
});
