import { cp, mkdir } from "node:fs/promises";

const files = [
  "index.html",
  "styles.css",
  "exercise-library.js",
  "app.js",
  "manifest.webmanifest",
  "sw.js",
];

await mkdir("dist", { recursive: true });

for (const file of files) {
  await cp(file, `dist/${file}`);
}

await cp("assets", "dist/assets", { recursive: true });
console.log("Built FitPlan AI into dist/");
