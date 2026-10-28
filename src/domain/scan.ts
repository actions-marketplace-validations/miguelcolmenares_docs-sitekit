/** How likely a match is a real problem. `high` rules also run over built bundles. */
export type Confidence = "high" | "medium";

/** One pattern the scanner looks for, with a stable id and a confidence. */
export interface ScanRule {
  id: string;
  confidence: Confidence;
  pattern: RegExp;
}

/** A match, located and masked so a log never repeats the secret. */
export interface Finding {
  rule: string;
  confidence: Confidence;
  /** Where it was found: a file path or a content path. */
  location: string;
  /** Only the first characters of the match, so a log never leaks a secret. */
  preview: string;
}

/** Shapes that almost never appear by accident. They are checked in content and in built files. */
export const HIGH_CONFIDENCE_RULES: readonly ScanRule[] = [
  { id: "aws-access-key", confidence: "high", pattern: /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g },
  {
    id: "private-key",
    confidence: "high",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/g,
  },
  {
    id: "github-token",
    confidence: "high",
    pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{50,})\b/g,
  },
  { id: "slack-token", confidence: "high", pattern: /\bxox[abprs]-[A-Za-z0-9-]{10,}\b/g },
  { id: "npm-token", confidence: "high", pattern: /\bnpm_[A-Za-z0-9]{36}\b/g },
  {
    id: "jwt",
    confidence: "high",
    pattern: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
  },
];

/** Looser shapes with more false positives. They are checked in content only. */
export const MEDIUM_CONFIDENCE_RULES: readonly ScanRule[] = [
  {
    id: "credential-assignment",
    confidence: "medium",
    pattern: /\b(?:password|passwd|secret|api[_-]?key|token)\b\s*[:=]\s*["'][^"'\s]{8,}["']/gi,
  },
  {
    id: "aws-arn-with-account",
    confidence: "medium",
    pattern: /\barn:aws[a-z-]*:[a-z0-9-]*:[a-z0-9-]*:\d{12}:[^\s"']+/g,
  },
  {
    id: "private-address",
    confidence: "medium",
    pattern:
      /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})\b/g,
  },
  {
    id: "internal-hostname",
    confidence: "medium",
    pattern: /\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:internal|corp|lan|intranet)\b/gi,
  },
  {
    id: "email-address",
    confidence: "medium",
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
];

const HARMLESS_EMAIL =
  /@(example\.(com|org|net)|[a-z0-9.-]+\.(test|invalid|localhost))$|^(no-?reply)@/i;

/** Where the text came from and which rules to run over it. */
export interface ScanOptions {
  location: string;
  /** Run the medium confidence rules too. Built bundles skip them. */
  includeMedium: boolean;
  /** Extra patterns from the config. They count as high confidence. */
  denyPatterns?: readonly string[];
  /** Exact strings that are fine, for example a public support address. */
  allow?: readonly string[];
}

/** Look for credentials and internal details in a piece of text. */
export function scanText(text: string, options: ScanOptions): Finding[] {
  const rules: ScanRule[] = [
    ...HIGH_CONFIDENCE_RULES,
    ...(options.includeMedium ? MEDIUM_CONFIDENCE_RULES : []),
    ...(options.denyPatterns ?? []).map((source, index): ScanRule => ({
      id: `deny-pattern-${index + 1}`,
      confidence: "high",
      pattern: new RegExp(source, "g"),
    })),
  ];
  const allow = new Set(options.allow ?? []);
  const findings: Finding[] = [];
  for (const rule of rules) {
    for (const match of text.matchAll(rule.pattern)) {
      const value = match[0];
      if (allow.has(value)) continue;
      if (rule.id === "email-address" && HARMLESS_EMAIL.test(value)) continue;
      findings.push({
        rule: rule.id,
        confidence: rule.confidence,
        location: options.location,
        preview: `${value.slice(0, 3)}…`,
      });
    }
  }
  return findings;
}
