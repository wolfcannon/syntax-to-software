/* Pull every COURSE.exercise() spec out of the step pages and print them as
   JSON, so scripts/verify_exercises.py can run each one's checks against its
   own solution. Run from the repo root:  node scripts/extract_exercises.mjs */
import { readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";

const sampleSrc = readFileSync("assets/sample.js", "utf8");
const out = [];

for (const file of readdirSync("steps").filter((f) => f.endsWith(".html")).sort()) {
  const html = readFileSync(`steps/${file}`, "utf8");
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const body = blocks.filter((b) => b.includes("COURSE.exercise")).join("\n");
  if (!body) continue;
  const collected = [];
  const ctx = vm.createContext({
    COURSE: { exercise: (mount, spec) => collected.push({ ...spec, mount }) },
  });
  vm.runInContext(sampleSrc + "\n" + body, ctx, { filename: file });
  for (const spec of collected) out.push({ file, ...spec });
}

process.stdout.write(JSON.stringify(out, null, 1));
