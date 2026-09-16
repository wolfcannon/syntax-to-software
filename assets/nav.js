/* Shared chrome: sidebar, topbar, pager. Defined once so nine step pages
   don't drift apart. */
(function () {
  const STEPS = [
    { unit: "Unit 1 — Foundations", n: 1, file: "steps/step-01.html",
      title: "Notebooks as a working environment", ex: ["s01-order", "s01-state"] },
    { n: 2, file: "steps/step-02.html",
      title: "Keywords, types, and syntax", ex: ["s02-fix", "s02-types"] },
    { n: 3, file: "steps/step-03.html",
      title: "Primitives and assignment", ex: ["s03-convert", "s03-geoid", "s03-division"] },
    { n: 4, file: "steps/step-04.html",
      title: "Strings and formatting", ex: ["s04-geoid", "s04-format", "s04-parse"] },
    { n: 5, file: "steps/step-05.html",
      title: "Lists, tuples, and ranges", ex: ["s05-split", "s05-sort", "s05-unpack"] },
    { n: 6, file: "steps/step-06.html",
      title: "Dictionaries", ex: ["s06-zip", "s06-lookup", "s06-join"] },
    { n: 7, file: "steps/step-07.html",
      title: "Control structures", ex: ["s07-category", "s07-count"] },
    { n: 8, file: "steps/step-08.html",
      title: "Comprehensions", ex: ["s08-dictcomp", "s08-sets", "s08-filter"] },
    { n: 9, file: "steps/step-09.html",
      title: "Functions", ex: ["s09-buildgeoid", "s09-bikeshare", "s09-pipeline"] },
  ];
  const LATER = [
    { unit: "Unit 2 — Correctness", items: [
      [10, "Equivalent forms"], [11, "Debugging and refactoring"],
      [12, "Exceptions"], [13, "File I/O"]] },
    { unit: "Unit 3 — Structure and ecosystem", items: [
      [14, "Modules"], [15, "Classes"], [16, "Third-party modules"],
      [17, "Servers and clients"]] },
    { unit: "Unit 4 — Development practice", items: [
      [18, "Notebooks to scripts"], [19, "Git"], [20, "Testing with pytest"],
      [21, "The maintenance cycle"], [22, "Organizing a project"],
      [23, "Capstone"]] },
  ];

  const inSteps = /\/steps\//.test(location.pathname);
  const base = inSteps ? "../" : "";
  const here = location.pathname.split("/").pop() || "index.html";

  let toc = "";
  let unit = null;
  for (const s of STEPS) {
    if (s.unit && s.unit !== unit) { unit = s.unit; toc += `<div class="unit-label">${unit}</div><ul class="toc">`; }
    toc += `<li><a href="${base}${s.file}" data-step-exercises="${s.ex.join(",")}">` +
           `<span class="n">${s.n}</span><span>${s.title}</span><span class="dot"></span></a></li>`;
  }
  toc += "</ul>";
  for (const g of LATER) {
    toc += `<div class="unit-label">${g.unit}</div><ul class="toc">`;
    for (const [n, t] of g.items)
      toc += `<li><a href="${base}index.html#roadmap" style="opacity:.5">` +
             `<span class="n">${n}</span><span>${t}</span></a></li>`;
    toc += "</ul>";
  }

  const sb = document.getElementById("sidebar");
  if (sb) {
    sb.className = "sidebar";
    sb.innerHTML =
      `<a class="brand" href="${base}index.html">` +
      `<b>From Syntax to Software</b><span>Python through a walkability project</span></a>` + toc;
  }

  const tb = document.getElementById("topbar");
  if (tb) {
    const i = STEPS.findIndex((s) => s.file.split("/").pop() === here);
    tb.className = "topbar";
    tb.innerHTML =
      `<button class="menu-btn">☰ Steps</button>` +
      `<span>${i >= 0 ? "Step " + STEPS[i].n + " of 23" : "Course overview"}</span>` +
      `<span class="prog"><span class="lbl small"></span>` +
      `<span class="bar"><i></i></span></span>`;
  }

  const pg = document.getElementById("pager");
  if (pg) {
    const i = STEPS.findIndex((s) => s.file.split("/").pop() === here);
    const prev = i > 0 ? STEPS[i - 1] : null;
    const next = i >= 0 && i < STEPS.length - 1 ? STEPS[i + 1] : null;
    pg.className = "pager";
    pg.innerHTML =
      (prev ? `<a href="${base}${prev.file}"><span class="dir">← Step ${prev.n}</span>` +
              `<span class="t">${prev.title}</span></a>`
            : `<a href="${base}index.html"><span class="dir">← Back</span>` +
              `<span class="t">Course overview</span></a>`) +
      (next ? `<a class="next" href="${base}${next.file}"><span class="dir">Step ${next.n} →</span>` +
              `<span class="t">${next.title}</span></a>`
            : `<a class="next" href="${base}index.html#roadmap"><span class="dir">What's next →</span>` +
              `<span class="t">Unit 2: Correctness</span></a>`);
  }
})();
