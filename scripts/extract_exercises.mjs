/* Pull every COURSE.exercise() and COURSE.quiz() spec out of the step pages and
   print them as JSON. verify_exercises.py runs each exercise's checks against
   its own solution; check_vocabulary.py reads both, so quiz text cannot hide
   from the show-before-use rule.
   Run from the repo root:  node scripts/extract_exercises.mjs */
import { readFileSync, readdirSync } from "node:fs";
import vm from "node:vm";

const sampleSrc = readFileSync("assets/sample.js", "utf8");
const out = [];

for (const file of readdirSync("steps").filter((f) => f.endsWith(".html")).sort()) {
  const html = readFileSync(`steps/${file}`, "utf8");
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const body = blocks
    .filter((b) => b.includes("COURSE.exercise") || b.includes("COURSE.quiz"))
    .join("\n");
  if (!body) continue;
  const collected = [];
  const ctx = vm.createContext({
    COURSE: {
      exercise: (mount, spec) => collected.push({ kind: "exercise", ...spec, mount }),
      quiz: (mount, spec) => collected.push({ kind: "quiz", ...spec, mount }),
    },
    document: { getElementById: () => null, addEventListener: () => {} },
  });
  vm.runInContext(sampleSrc + "\n" + body, ctx, { filename: file });
  for (const spec of collected) out.push({ file, ...spec });
}

process.stdout.write(JSON.stringify(out, null, 1));
