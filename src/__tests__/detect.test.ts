import { deriveConfig, parseGitHubUrl } from "../domain";
import type { RepositoryFacts } from "../domain";

const facts = (overrides: Partial<RepositoryFacts> = {}): RepositoryFacts => ({
  folders: { docs: true, examples: false, changelog: true },
  folderName: "my-folder",
  ...overrides,
});

describe("parseGitHubUrl", () => {
  it.each([
    ["https://github.com/me/proj.git", "me", "proj"],
    ["git@github.com:me/proj.git", "me", "proj"],
    ["git+https://github.com/me/proj.git", "me", "proj"],
    ["https://github.com/me/proj/", "me", "proj"],
  ])("reads %s", (url, owner, name) => {
    expect(parseGitHubUrl(url)).toEqual({
      owner,
      name,
      url: `https://github.com/${owner}/${name}`,
    });
  });

  it("returns undefined for other hosts and for nothing", () => {
    expect(parseGitHubUrl("https://bitbucket.org/me/proj.git")).toBeUndefined();
    expect(parseGitHubUrl(undefined)).toBeUndefined();
  });
});

describe("deriveConfig", () => {
  it("builds a project site URL and base from the GitHub remote", () => {
    const config = deriveConfig(
      facts({
        packageJson: {
          name: "@me/widget",
          description: "A widget.",
          license: "MIT",
          version: "1.2.3",
        },
        remoteUrl: "https://github.com/Me/widget.git",
      }),
    );
    expect(config.site).toMatchObject({
      name: "widget",
      description: "A widget.",
      url: "https://me.github.io",
      base: "/widget/",
      repository: "https://github.com/Me/widget",
      license: "MIT",
      version: "1.2.3",
      installCommand: "npm install @me/widget",
    });
    expect(config.hero.primary).toEqual({ label: "Get started", href: "/docs/" });
    expect(config.hero.secondary?.href).toBe("https://github.com/Me/widget");
  });

  it("uses base / for a user site", () => {
    const config = deriveConfig(facts({ remoteUrl: "https://github.com/me/me.github.io.git" }));
    expect(config.site.base).toBe("/");
  });

  it("does not suggest an install command for a private package", () => {
    const config = deriveConfig(facts({ packageJson: { name: "internal", private: true } }));
    expect(config.site.installCommand).toBeUndefined();
  });

  it("falls back to the README, then to the folder name", () => {
    expect(deriveConfig(facts({ readmeDescription: "From the readme." })).site.description).toBe(
      "From the readme.",
    );
    const bare = deriveConfig(facts());
    expect(bare.site.name).toBe("my-folder");
    expect(bare.site.description).toBe("Documentation for my-folder.");
  });

  it("points the primary action at the first page that exists", () => {
    expect(
      deriveConfig(facts({ folders: { docs: false, examples: true, changelog: false } })).hero
        .primary.href,
    ).toBe("/examples/");
    expect(
      deriveConfig(facts({ folders: { docs: false, examples: false, changelog: false } })).hero
        .primary.href,
    ).toBe("/");
  });

  it("produces a config that passes the schema without a GitHub remote", () => {
    const config = deriveConfig(facts({ packageJson: { name: "x" } }));
    expect(config.site.url).toBe("https://example.github.io");
    expect(config.site.base).toBe("/");
    expect(config.site.repository).toBeUndefined();
  });
});
