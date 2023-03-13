import { build } from "esbuild";
import { writeFile, readFile } from "fs/promises";

await build({
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  sourcemap: true,
  format: "esm",
  platform: "node",
  target: "node18",
});

