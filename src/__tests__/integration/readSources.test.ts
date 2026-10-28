import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildDocuments, publishedRoutes } from "../../../template/src/application";
import { loadSiteConfig, readSources } from "../../../template/src/infrastructure";

let repo: string;
let site: string;

const write = (path: string, content: string) => {
  const full = join(repo, path);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, content);
};

const config = (extra: Record<string, unknown> = {}) =>
  JSON.stringify({
    site: { name: "Demo", description: "d", url: "https://me.github.io" },
    hero: { title: "Demo", lede: "l", primary: { label: "Go", href: "/docs/" } },
    ...extra,
  });

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), "sitekit-repo-"));
  site = join(repo, "site");
  mkdirSync(site);
  // A repository that has a `src/` of its own, which once confused root detection.
  write("src/index.ts", "export {}");
  write(
    "docs/start.md",
    "---\ntitle: Start here\norder: 1\n---\n\n# Ignored heading\n\nWelcome to **Acme Corp**.\n",
  );
  write("docs/internal/plan.md", "# Plan\n\nPrivate.\n");
  write("examples/basic/README.md", "# Basic\n\nA basic example.\n");
  write("CHANGELOG.md", "# Changelog\n\n## 1.0.0\n");
  write("LICENSE", "MIT");
});

afterEach(() => rmSync(repo, { recursive: true, force: true }));

describe("readSources", () => {
  it("reads docs, examples and the changelog from the repository root", () => {
    writeFileSync(join(site, "sitekit.config.json"), config());
    const sources = readSources(site, loadSiteConfig(site));
    expect(sources.files.map((f) => `${f.collection}:${f.path}`).sort()).toEqual([
      "changelog:CHANGELOG.md",
      "docs:docs/internal/plan.md",
      "docs:docs/start.md",
      "examples:examples/basic/README.md",
    ]);
    expect(sources.existing.has("LICENSE")).toBe(true);
    expect(sources.existing.has("src/index.ts")).toBe(true);
  });

  it("never reads a file matched by excludePaths", () => {
    writeFileSync(
      join(site, "sitekit.config.json"),
      config({ anonymize: { excludePaths: ["docs/internal/**"] } }),
    );
    const sources = readSources(site, loadSiteConfig(site));
    expect(sources.files.some((f) => f.path.includes("internal"))).toBe(false);
    expect(sources.existing.has("docs/internal/plan.md")).toBe(true); // still exists, so links to it can be detected
  });

  it("applies replacements to content and frontmatter", () => {
    writeFileSync(
      join(site, "sitekit.config.json"),
      config({ anonymize: { replace: { "Acme Corp": "<client>" } } }),
    );
    const start = readSources(site, loadSiteConfig(site)).files.find(
      (f) => f.path === "docs/start.md",
    )!;
    expect(start.content).toContain("<client>");
    expect(start.content).not.toContain("Acme");
  });

  it("builds documents from what it read, using frontmatter first", () => {
    writeFileSync(join(site, "sitekit.config.json"), config());
    const documents = buildDocuments(readSources(site, loadSiteConfig(site)).files, {
      base: "/demo/",
    });
    const start = documents.find((d) => d.slug === "start")!;
    expect(start).toMatchObject({ title: "Start here", route: "/demo/docs/start/", order: 1 });
    expect(documents.find((d) => d.slug === "basic")).toMatchObject({
      collection: "examples",
      route: "/demo/examples/basic/",
    });
    expect(publishedRoutes(documents).get("CHANGELOG.md")).toBe("/demo/changelog/");
  });
});

describe("loadSiteConfig", () => {
  it("explains how to create a missing config", () => {
    expect(() => loadSiteConfig(site)).toThrow(/sitekit init/);
  });

  it("reports invalid JSON with the file name", () => {
    writeFileSync(join(site, "sitekit.config.json"), "{ nope");
    expect(() => loadSiteConfig(site)).toThrow(/not valid JSON/);
  });

  it("reports schema errors with their paths", () => {
    writeFileSync(join(site, "sitekit.config.json"), JSON.stringify({ site: {}, hero: {} }));
    expect(() => loadSiteConfig(site)).toThrow(/site\.name/);
  });
});
