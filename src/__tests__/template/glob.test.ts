import { applyReplacements, globToRegExp, matchesAny } from "../../../template/src/domain";

describe("globToRegExp", () => {
  it.each([
    ["docs/internal/**", "docs/internal/a.md", true],
    ["docs/internal/**", "docs/internal/deep/a.md", true],
    ["docs/internal/**", "docs/public/a.md", false],
    ["**/*.test.md", "docs/a/b.test.md", true],
    ["**/*.test.md", "x.test.md", true],
    ["docs/*.md", "docs/a.md", true],
    ["docs/*.md", "docs/sub/a.md", false],
    ["docs/?.md", "docs/a.md", true],
    ["docs/a.md", "docs/aXmd", false],
  ])("%s against %s is %s", (glob, path, expected) => {
    expect(globToRegExp(glob).test(path)).toBe(expected);
  });

  it("matchesAny is false for an empty list", () => {
    expect(matchesAny("a.md", [])).toBe(false);
  });
});

describe("applyReplacements", () => {
  it("replaces literal text everywhere", () => {
    expect(applyReplacements("Acme Corp and Acme Corp.", { "Acme Corp": "<client>" })).toBe(
      "<client> and <client>.",
    );
  });

  it("treats the key as literal text, not a pattern", () => {
    expect(applyReplacements("a.b axb", { "a.b": "X" })).toBe("X axb");
  });
});
