#!/usr/bin/env node
// Generate template/src/styles/tokens.css from template/design/tokens.json.
// The JSON is the source of truth. Run with --check to fail when the CSS is out of date.
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const SOURCE = join(ROOT, "template", "design", "tokens.json");
const TARGET = join(ROOT, "template", "src", "styles", "tokens.css");

export function renderTokens(tokens) {
  const lines = [
    "/* Generated from design/tokens.json by scripts/build-tokens.mjs. Do not edit. */",
    ":root {",
  ];
  for (const [group, values] of Object.entries(tokens)) {
    for (const [name, value] of Object.entries(values))
      lines.push(`  --sk-${group === "color" ? "" : `${group}-`}${name}: ${value};`);
  }
  lines.push("}", "");
  return lines.join("\n");
}

const css = renderTokens(JSON.parse(readFileSync(SOURCE, "utf8")));
if (process.argv.includes("--check")) {
  let current = "";
  try {
    current = readFileSync(TARGET, "utf8");
  } catch {
    // a missing file counts as out of date
  }
  if (current !== css) {
    console.error(
      "template/src/styles/tokens.css is out of date. Run `node scripts/build-tokens.mjs`.",
    );
    process.exit(1);
  }
} else {
  writeFileSync(TARGET, css);
}
