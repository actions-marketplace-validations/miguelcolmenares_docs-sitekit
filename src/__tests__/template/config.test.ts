import { kebab, parseSiteConfig } from "../../../template/src/domain";

const valid = {
  site: { name: "Demo", description: "A demo", url: "https://me.github.io" },
  hero: { title: "Demo", lede: "Lede", primary: { label: "Start", href: "/docs/" } },
};

describe("parseSiteConfig", () => {
  it("accepts a minimal config and fills the defaults", () => {
    const config = parseSiteConfig(valid);
    expect(config.site.base).toBe("/");
    expect(config.sources.docs).toBe("../docs");
    expect(config.deploy.target).toBe("github-pages");
    expect(config.features).toEqual([]);
  });

  it("rejects a key that is not declared, at any depth", () => {
    expect(() => parseSiteConfig({ ...valid, extra: 1 })).toThrow(/extra/);
    expect(() => parseSiteConfig({ ...valid, site: { ...valid.site, secret: "x" } })).toThrow(
      /secret/,
    );
  });

  it("requires a base path that starts and ends with a slash", () => {
    expect(() => parseSiteConfig({ ...valid, site: { ...valid.site, base: "/docs" } })).toThrow(
      /base/,
    );
    expect(
      parseSiteConfig({ ...valid, site: { ...valid.site, base: "/recaptcha/" } }).site.base,
    ).toBe("/recaptcha/");
  });

  it("lists every problem with its path", () => {
    expect(() => parseSiteConfig({ site: {}, hero: {} })).toThrow(/site\.name[\s\S]*hero\.title/);
  });

  it("rejects an icon name that is not kebab-case", () => {
    const features = [{ icon: "Shield Check", eyebrow: "e", title: "t", text: "x" }];
    expect(() => parseSiteConfig({ ...valid, features })).toThrow(/icon/);
  });
});

describe("kebab", () => {
  it("makes a slug from a file name", () => {
    expect(kebab("Getting Started.md")).toBe("getting-started");
    expect(kebab("designTokens.mdx")).toBe("design-tokens");
  });
});
