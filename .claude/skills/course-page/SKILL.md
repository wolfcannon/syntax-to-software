---
name: course-page
description: Write or revise a step or interlude page for the "From Syntax to Software" Python course — the page skeleton, the house voice, the show-before-use rule, the exercise contract, and the verification that must pass before the page is done. Use whenever adding a step, editing an existing one, or adding exercises.
---

# Building a course page

This course teaches Python to someone with strong mathematics and no
programming, through one running project: does neighbourhood walkability
predict bike commuting in Marion County, Indiana?

Everything below exists because a page that ignores it reads like a different
course. Follow it, then run the checks — they are not optional and they catch
things reading does not.

## The one rule everything else serves

**Never use what you haven't taught.** A page may *mention* anything ahead —
"step 7 is about comprehensions" is orientation, and the learner is not
expected to follow it. A page may not *use* unexplained syntax in code the
learner reads, because then the example teaches two things and labels one.

When a later concept is genuinely unavoidable — you cannot demonstrate a list
without walking it — **build it in**: show the shape in two lines, say which
step teaches it properly, then use it. Do not apologise for it in passing and
carry on. Step 4's "Two shapes you need now" box is the pattern.

This applies to vocabulary as much as syntax. A page before the first level-up
may not say "cell", "kernel" or "notebook" — the learner is in a browser and
has none of those. Watch for prose that describes an environment the reader is
not in; it is the easiest thing in the course to get wrong, because the author
knows what the finished project looks like and the reader does not.

This is enforced. `scripts/vocabulary.json` records which step first shows each
piece of Python and each piece of vocabulary; `scripts/check_vocabulary.py`
scans every `<pre>` block, every exercise `starter` and `solution`, and every
paragraph, and fails on a forward use. Prose signposts by naming where the idea
comes from — "step 12", "Unit 4", "the level-up" — and a paragraph that does is
left alone. A forward
use passes only if the block signposts it (says "step N" for the introducing
step) or the ledger carries an exemption with a written reason. **An exemption
must describe something the page actually does** — if you exempt a concept,
build it in first.

## Page skeleton

Copy an existing page. The scaffolding is identical everywhere:

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Step N — Title</title>
<link rel="stylesheet" href="../assets/course.css">
</head>
<body>
<div class="shell">
  <div id="sidebar"></div>
  <div class="main">
    <div id="topbar"></div>
    <div class="wrap">
      <p class="eyebrow">Unit N — Name · Step N</p>
      <h1>Title</h1>
      <ul class="lede-points">…three terse points…</ul>
      …sections…
      <div id="ex1"></div>
      <div class="project"><h4>Take it further</h4>…</div>
      <details class="checkq">…the step's Check question…</details>
      <div id="pager"></div>
    </div>
  </div>
</div>
<script src="../assets/nav.js"></script>
<script src="../assets/runner.js"></script>
<script src="../assets/sample.js"></script>   <!-- only if exercises use the data -->
<script>COURSE.exercise("ex1", { … });</script>
</body>
</html>
```

Then add the page to the `ITEMS` array in `assets/nav.js`: set its `file:` and
list its exercise ids in `ex:`. Sidebar, progress dots and pager all follow.
`n: null` marks an interlude.

### Required elements

1. **Eyebrow, title, three `.lede-points`.** Terse. Not a sentence broken into
   pieces — three separate claims the page will make good on.
2. **Sections that build.** Each `<h2>` introduces one idea and then uses it.
3. **One diagram** where a picture shows something prose can't — see below.
4. **One callout naming a real failure.** `.note.trap` for a bug this causes
   in *this* project, `.note.warn` for a sharp edge. Not general advice.
5. **Two or three exercises.**
6. **A "Take it further" box** — extensions in the exercise editors for Unit 1,
   notebook or project work after the first interlude.
7. **The step's Check question** as a `<details class="checkq">`, answered
   properly. The answer is a teaching slot, not a footnote.

## Voice

- **Terse and precise, always.** Say it once, in the fewest words that stay
  exact. Cut any sentence that restates the one before it, tells the reader
  what the page is about to do, or reassures them. A definition is one
  sentence; if it needs three, the term is doing too much work.
- Say the thing, then show it working. No tours of what's coming.
- Concrete over general: `int("01073…")` drops Alabama's zero, not "be careful
  with type conversion".
- Name the failure and its consequence. The best moments in this course are
  where a plausible-looking answer is wrong — a `.get(geoid, 0)` that turns a
  missing score into the lowest score, a string sort that puts `"9"` after
  `"1303"`. Hunt for those.
- **No comparisons to other languages.** Not "unlike C", not "most languages
  use braces", not "if you know Java". The reader may not know them, and if
  they do it is still a detour. Say what Python does. This extends to borrowed
  vocabulary: prefer "nothing closes a block" over "there is no closing brace".
- Define a term with a subheading and a sentence, not a lead-in explaining that
  you are about to define it.
- **One word per idea.** Once a term is defined, use it and no synonym. Step 1
  defines *syntax*, so nothing says "grammar" — a reader cannot tell whether a
  new word is a new concept, and has to hold both open until they find out.
- British spelling, Oxford comma off, em dashes fine.
- Never flatter the learner and never say "simply", "just", or "obviously".
- Every example uses the project's real data. No `foo`, no animals, no shapes.
- Cross-reference by number — "step 12" — and only backwards or with a
  signpost. Renumbering is scripted; see the git history for the pattern.

## Diagrams

Inline `<svg viewBox="0 0 720 H">` inside `<figure>`, with a `<figcaption>`
that says what to take away rather than restating the picture. Use the theme
classes (`svg-ink`, `svg-muted`, `svg-accent`, `svg-bad`, `svg-ok`, `svg-line`,
`svg-box`) so it works in both light and dark — never hard-code a colour.
Always set `role="img"` and a real `aria-label`.

Draw a diagram when it shows a *mechanism*: what a GEOID is made of, why a
join drops rows, where slice boundaries fall. Do not draw one to decorate a
list.

## The exercise contract

```js
COURSE.exercise("ex1", {
  id: "sNN-slug",        // must match assets/nav.js; the localStorage key
  tag: "Exercise 1",
  title: "Short imperative title",
  prompt: "<p>HTML…</p>",
  setup: SAMPLE,         // hidden: data and helpers, never the answer
  starter: "…",          // what they see in the editor
  checks: [ { label: "…", code: "…" } ],
  solution: "…",         // revealed under "Show one way to do it"
});
```

Rules, each of which has already caught a real bug:

- **The solution must be a complete, runnable cell.** It is `exec`'d on its own
  with only `setup` present. If it relies on lines from the starter, it fails —
  this caught four pages during Unit 1.
- **The starter must not already pass.** An exercise with nothing to do is a
  bug, and the checker asserts it.
- **Checks report, they don't just fail.** Use `expect`, `expect_close`,
  `expect_type`, `expect_defined`, `expect_raises` from the harness, so a wrong
  answer says `got '1731001' (str), expected '010730001001' (str)`. Never leave
  a bare `assert`.
- **Order checks from "did it run" to "is it right" to "does it generalise".**
  The last check should be the one that fails for someone who hard-coded the
  answer — pass a second, different input.
- **Label checks in the learner's language.** "the boundary values 5.75, 10.5
  and 15.25 fall in the lower band", not "test_boundaries".
- **Put given data in `setup`, not the starter**, and show it in the prompt if
  they need to see it. The editor is for their work.
- Comment the solution with *why*, especially the trap it avoids.

These checks are read later: **step 18 reveals the harness** and the learner
starts writing them as pytest. Write them as something you would be happy to
show a learner as an example of a test.

## Data

`assets/sample.js` exposes `SAMPLE`, which defines `acs_raw` and `walk_raw` —
about eleven rows of each, shaped exactly as the real data arrives (list of
lists, header row, every value a string). Regenerate with
`python3 scripts/make_sample.py` after changing the CSVs.

The sample deliberately contains every failure mode: a zero-worker row, a
`-666666666` sentinel, one block group in the ACS and not the EPA, and one the
other way round. Exercises should meet them rather than route around them.

## Verification — run all three, every time

```sh
python3 scripts/check_vocabulary.py    # nothing used before it is taught
python3 scripts/verify_exercises.py    # checks pass on solutions, starters don't,
                                       # nav.js ids match the pages
python3 -m http.server 8000            # then read the page
```

`verify_exercises.py` runs under local CPython. To run the same checks under
the interpreter the browser actually loads, `npm install pyodide@0.26.4` and
drive `_run_exercise` the same way — worth doing before calling a unit done.

A page is finished when all three are green **and** you have read it start to
finish in a browser, because neither script can tell you the prose is any good.
