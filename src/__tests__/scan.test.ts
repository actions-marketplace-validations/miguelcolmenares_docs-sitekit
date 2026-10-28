import { scanText } from "../domain";

// Credential-shaped values are built at run time, so no literal in this repository looks like a leak.
const awsKey = ["AKIA", "IOSFODNN7EXAMPLE"].join("");
const githubToken = `ghp_${"a1B2".repeat(9)}`;
const slackToken = ["xoxb", "1234567890", "abcdefghij"].join("-");
const privateKey = ["-----BEGIN ", "RSA PRIVATE KEY-----"].join("");
const npmToken = `npm_${"Ab1".repeat(12)}`;
const jwt = [`eyJ${"a".repeat(12)}`, `eyJ${"b".repeat(12)}`, "c".repeat(12)].join(".");

const scan = (text: string, extra: Partial<Parameters<typeof scanText>[1]> = {}) =>
  scanText(text, { location: "docs/a.md", includeMedium: true, ...extra });

describe("scanText high confidence", () => {
  it.each([
    ["aws-access-key", `key ${awsKey} here`],
    ["github-token", `token ${githubToken}`],
    ["slack-token", slackToken],
    ["private-key", privateKey],
    ["npm-token", npmToken],
    ["jwt", jwt],
  ])("finds %s", (rule, text) => {
    expect(scan(text).map((f) => f.rule)).toContain(rule);
  });

  it("masks the match so a log never leaks it", () => {
    const [finding] = scan(`x ${githubToken}`);
    expect(finding!.preview).toBe("ghp…");
    expect(JSON.stringify(finding)).not.toContain(githubToken);
  });

  it("still runs when medium rules are off, as in built bundles", () => {
    expect(scan(awsKey, { includeMedium: false })).toHaveLength(1);
    expect(scan("mail me@corp-team.dev", { includeMedium: false })).toHaveLength(0);
  });
});

describe("scanText medium confidence", () => {
  it.each([
    ["credential-assignment", 'password = "hunter2hunter2"'],
    ["private-address", "connect to 10.20.30.40 now"],
    ["internal-hostname", "see build.team.internal for logs"],
    ["email-address", "write to someone@company.dev"],
    ["aws-arn-with-account", "arn:aws:iam::123456789012:role/Deploy"],
  ])("finds %s", (rule, text) => {
    expect(scan(text).map((f) => f.rule)).toContain(rule);
  });

  it("accepts harmless addresses", () => {
    expect(scan("a@example.com b@x.test noreply@site.dev no-reply@site.dev")).toHaveLength(0);
  });

  it("honours an exact allow entry", () => {
    expect(scan("support@company.dev", { allow: ["support@company.dev"] })).toHaveLength(0);
  });
});

describe("scanText custom patterns", () => {
  it("counts a deny pattern as high confidence, even in bundles", () => {
    const findings = scan("host acme-prod.example.io", {
      includeMedium: false,
      denyPatterns: ["acme-[a-z]+\\.example\\.io"],
    });
    expect(findings).toMatchObject([{ rule: "deny-pattern-1", confidence: "high" }]);
  });
});
