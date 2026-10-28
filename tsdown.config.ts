import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts", cli: "src/presentation/cli.ts" },
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "es2022",
  platform: "node",
  fixedExtension: false,
  // Used by the generated site, never by the CLI. If it shows up in the bundle, an import is wrong.
  deps: { neverBundle: ["@astrojs/markdown-remark"] },
});
