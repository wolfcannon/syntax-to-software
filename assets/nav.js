/* Shared chrome: sidebar, topbar, pager. Defined once so the pages don't drift.

   ITEMS is the whole course in order — 21 numbered steps and 2 interludes.
   An entry with `n: null` is an interlude: a level-up between units, where the
   work moves onto the learner's own machine. An entry with `file: null` is not
   written yet; it shows greyed in the sidebar and the pager skips over it, so
   filling one in is a one-line change here. */
(function () {
  const ITEMS = [
    { unit: "Unit 1 — Foundations", n: 1, file: "steps/step-01.html",
      title: "Keywords, types, and syntax", ex: ["s01-fix", "s01-types"] },
    { n: 2, file: "steps/step-02.html", title: "Primitives and assignment",
      ex: ["s02-convert", "s02-geoid", "s02-division"] },
    { n: 3, file: "steps/step-03.html", title: "Strings and formatting",
      ex: ["s03-geoid", "s03-format", "s03-parse"] },
    { n: 4, file: "steps/step-04.html", title: "Lists, tuples, and ranges",
      ex: ["s04-split", "s04-sort", "s04-unpack"] },
    { n: 5, file: "steps/step-05.html", title: "Dictionaries",
      ex: ["s05-zip", "s05-lookup", "s05-join"] },
    { n: 6, file: "steps/step-06.html", title: "Control structures",
      ex: ["s06-category", "s06-count"] },
    { n: 7, file: "steps/step-07.html", title: "Comprehensions",
      ex: ["s07-dictcomp", "s07-sets", "s07-filter"] },
    { n: 8, file: "steps/step-08.html", title: "Functions",
      ex: ["s08-buildgeoid", "s08-bikeshare", "s08-pipeline"] },

    { unit: "Level up", n: null, file: "steps/interlude-jupyter.html",
      title: "Jupyter notebooks", ex: ["int-order", "int-state"] },

    { unit: "Unit 2 — Correctness", n: 9, file: null, title: "Equivalent forms" },
    { n: 10, file: null, title: "Debugging and refactoring" },
    { n: 11, file: null, title: "Exceptions" },
    { n: 12, file: null, title: "File I/O" },

    { unit: "Unit 3 — Structure and ecosystem", n: 13, file: null, title: "Modules" },
    { n: 14, file: null, title: "Classes" },
    { n: 15, file: null, title: "Third-party modules" },
    { n: 16, file: null, title: "Servers and clients" },

    { unit: "Level up", n: null, file: "steps/interlude-scripts.html",
      title: "Notebooks to scripts",
      ex: ["scr-layout", "scr-requirements", "scr-order"] },

    { unit: "Unit 4 — Development practice", n: 17, file: null, title: "Git" },
    { n: 18, file: null, title: "Testing with pytest" },
    { n: 19, file: null, title: "The maintenance cycle" },
    { n: 20, file: null, title: "Organizing a project" },
    { n: 21, file: null, title: "Capstone" },
  ];

  const base = /\/steps\//.test(location.pathname) ? "../" : "";
  const here = location.pathname.split("/").pop() || "index.html";
  const label = (it) => (it.n === null ? "Level up" : "Step " + it.n);

  let toc = "", unit = null;
  for (const it of ITEMS) {
    if (it.unit && it.unit !== unit) {
      if (unit !== null) toc += "</ul>";
      unit = it.unit;
      toc += `<div class="unit-label">${unit}</div><ul class="toc">`;
    }
    const num = it.n === null ? "↑" : it.n;
    toc += it.file
      ? `<li><a href="${base}${it.file}" data-step-exercises="${(it.ex || []).join(",")}">` +
        `<span class="n">${num}</span><span>${it.title}</span><span class="dot"></span></a></li>`
      : `<li><a href="${base}index.html#roadmap" style="opacity:.45">` +
        `<span class="n">${num}</span><span>${it.title}</span></a></li>`;
  }
  toc += "</ul>";

  const sb = document.getElementById("sidebar");
  if (sb) {
    sb.className = "sidebar";
    sb.innerHTML =
      `<a class="brand" href="${base}index.html">` +
      `<b>From Syntax to Software</b><span>Python through a walkability project</span></a>` + toc;
  }

  const i = ITEMS.findIndex((it) => it.file && it.file.split("/").pop() === here);

  const tb = document.getElementById("topbar");
  if (tb) {
    const steps = ITEMS.filter((it) => it.n !== null).length;
    tb.className = "topbar";
    tb.innerHTML =
      `<button class="menu-btn">☰ Steps</button>` +
      `<span>${i < 0 ? "Course overview"
                     : ITEMS[i].n === null ? "Level up — " + ITEMS[i].title
                     : "Step " + ITEMS[i].n + " of " + steps}</span>` +
      `<span class="prog"><span class="lbl small"></span>` +
      `<span class="bar"><i></i></span></span>`;
  }

  const pg = document.getElementById("pager");
  if (pg) {
    // Skip over steps that aren't written yet, so the pager never dead-ends.
    let prev = null, next = null, skipped = 0;
    for (let k = i - 1; k >= 0; k--) if (ITEMS[k].file) { prev = ITEMS[k]; break; }
    for (let k = i + 1; i >= 0 && k < ITEMS.length; k++) {
      if (ITEMS[k].file) { next = ITEMS[k]; break; }
      skipped++;
    }
    // Don't imply adjacency across steps that aren't written yet.
    const nextDir = !next ? ""
                  : skipped ? `Skipping ${skipped} unwritten →`
                  : label(next) + " →";
    pg.className = "pager";
    pg.innerHTML =
      (prev ? `<a href="${base}${prev.file}"><span class="dir">← ${label(prev)}</span>` +
              `<span class="t">${prev.title}</span></a>`
            : `<a href="${base}index.html"><span class="dir">← Back</span>` +
              `<span class="t">Course overview</span></a>`) +
      (next ? `<a class="next" href="${base}${next.file}"><span class="dir">${nextDir}</span>` +
              `<span class="t">${next.title}</span></a>`
            : `<a class="next" href="${base}index.html#roadmap"><span class="dir">What's next →</span>` +
              `<span class="t">Unit 2: Correctness</span></a>`);
  }
})();
