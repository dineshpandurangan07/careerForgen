import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/seed.ts"],
  format: ["esm"],
  target: "node20",
  platform: "node",
  splitting: false,
  sourcemap: true,
  clean: true,
  // Bundle the shared workspace package (it ships TypeScript source).
  noExternal: ["@careerforge/shared"],
  // Keep the in-memory DB dependency external: bundling it breaks ESM due to
  // dynamic `require("path")` deep in the package.
  external: ["mongodb-memory-server"],
});
