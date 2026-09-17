# From Syntax to Software

A Python course that starts at what a statement is and ends with a tested
project under version control — 23 steps and two level-ups. It assumes no
programming experience and no maths beyond arithmetic. Every step teaches one
layer of the language or of the development process, and advances the same
project: **does neighbourhood walkability predict bike commuting, and what
explains the places that don't fit the trend?**

The last unit is the part most courses leave out: git, pytest, two real bug
reports worked end to end, project layout, and a capstone that reports its own
uncertainty.

### Shape

| | Where the work happens |
| --- | --- |
| **Unit 1 — Foundations** (steps 1–10) ✅ built | the browser |
| **↑ Level up: Jupyter notebooks** ✅ built | your machine, in a notebook |
| **Unit 2 — Correctness** (steps 11–14) | " |
| **Unit 3 — Structure and the ecosystem** (steps 15–18) | " |
| **↑ Level up: Notebooks to scripts** ✅ built | your machine, in a terminal |
| **Unit 4 — Development practice** (steps 19–23) | " |

The two level-ups are deliberate. Each is a change of environment, and each
lands *after* the learner has something worth putting there — Jupyter arrives
once there is a pipeline to run in it, and virtual environments arrive once
there are dependencies to isolate. Putting either at the front would be
teaching a tool before the problem it solves.

Units 2–4 are outlined on the course home page and not yet written. Adding a
step is: write `steps/step-NN.html`, then give it a `file:` in the `ITEMS`
array in `assets/nav.js` — the sidebar, progress bar and pager all follow from
there.

## Running it

The exercises run Python in your browser via
[Pyodide](https://pyodide.org). That needs the pages served over HTTP rather
than opened off the disk, which is one command:

```sh
git clone <this repo>
cd syntax-to-software
python3 -m http.server 8000
# open http://localhost:8000
```

Nothing is installed, no account is needed, and nothing you type leaves the
machine. Progress and your answers are kept in the browser's `localStorage`.

The first exercise you run downloads the Python runtime (~10 MB) from the
Pyodide CDN, so step 1 needs an internet connection. After that the browser
caches it, and nothing else phones home.

## What's here

```
index.html            course home: how it works, the data, all 23 steps
steps/step-01..10     Unit 1, one page per step
steps/interlude-*     the two level-ups
assets/course.css     styles (light and dark, follows the browser)
assets/nav.js         sidebar, topbar, pager — defined once for every page
assets/runner.js      the exercise harness: Pyodide + the hidden checks
assets/sample.js      sample rows, generated — do not hand-edit
data/                 the project's two datasets, the sample cell, and
                      marion_full.py — the whole county as literals, a
                      stopgap so the first level-up can run on real data
                      before file I/O (step 14) exists
notebooks/            where the learner's own work goes
scripts/              data preparation and the repo's own tests
```

### The exercise harness

Each exercise is a starter stub plus a handful of Python assertions the learner
never sees. `assets/runner.js` runs their code in a fresh namespace, then runs
the assertions against it, and reports each one separately — `got '1731001'
(str), expected '017300001001' (str)` rather than a bare red traceback.

That is a setup for **step 20**, where the harness stops being hidden: the
assertions grading the learner turn out to be ordinary `pytest`-style
assertions, and they start writing their own. Keep the checks honest and
readable, because they eventually get read.

Adding an exercise means a `<div id="...">` in the page and one
`COURSE.exercise()` call at the bottom of it. Look at any step page.

## Testing

### Writing a new page

`.claude/skills/course-page/SKILL.md` is the house style — page skeleton, voice,
the exercise contract, and the rule that nothing may be used before it is
taught. Claude Code picks it up automatically in this directory; read it
directly if you're working by hand.

Three checks, all of which must be green before a page is done:

```sh
python3 scripts/stamp_assets.py       # after editing anything in assets/
python3 scripts/check_vocabulary.py   # nothing used before the step that teaches it
python3 scripts/verify_exercises.py   # solutions pass, starters don't, nav ids match,
                                      # quizzes are answerable, asset stamps current
python3 -m http.server 8000           # then actually read it
```

Asset links carry a content hash (`course.css?v=7cf7e96b`) because
`http.server` sends no cache headers and a browser will otherwise keep serving
a stale stylesheet after you edit it.

`scripts/vocabulary.json` is the ledger of which step first shows each piece of
Python, plus written exemptions where a page deliberately builds something in
early. An exemption has to describe something the page actually does.


Two checks, both worth running after touching any page:

```sh
python3 scripts/verify_exercises.py
```

It asserts three things: every hidden check passes against its own published
solution, no starter already passes (an exercise with nothing to do is a bug),
and the exercise ids listed in `assets/nav.js` match the ones the pages
actually define — otherwise a progress dot silently never lights up.

`verify_exercises.py` lifts the Python harness straight out of `runner.js`, so
there is one source of truth. It runs under whatever CPython you have; to run
it under the *exact* interpreter the browser uses, `npm install pyodide@0.26.4`
and drive `_run_exercise` the same way.

## The data

Both datasets are committed, so Unit 1 needs no downloads and no API key.

| File | Source | Rows |
| --- | --- | --- |
| `data/walkability_marion.csv` | EPA National Walkability Index, via the EPA's ArcGIS service | 632 block groups |
| `data/acs_commute_marion.csv` | Census ACS 5-year 2015–2019, table B08301 | 630 block groups |
| `data/sample_rows.py` | ~11 rows of each, for steps 1–11 | generated |
| `data/marion_full.py` | the whole county as Python literals | generated |

> **The walkability data is real. The commute data is not yet.**
> `acs_commute_marion.csv` is currently **synthetic** — generated with a
> plausible relationship to the real walkability scores, plus realistic
> margins of error, zero-worker block groups and `-666666666` sentinels. It is
> shaped exactly like the real API response, so swapping it in is a
> file replacement and nothing else. To make it real:
>
> ```sh
> export CENSUS_API_KEY=...     # free: api.census.gov/data/key_signup.html
> python3 scripts/prepare_data.py --state 18 --county 097
> python3 scripts/make_sample.py
> python3 scripts/verify_exercises.py
> ```
>
> Several exercises assert on specific values from the sample rows, so
> `verify_exercises.py` will tell you exactly which prompts need their numbers
> updated. **The capstone's findings are not meaningful until this is done** —
> the correlation currently in the data is one that was put there on purpose.

The two files deliberately do not line up: 7 block groups have a walkability
score and no commute data, 5 the reverse, 14 have no workers, and 9 carry the
Census "estimate unavailable" sentinel. Those aren't blemishes, they're the
curriculum — steps 5, 6, 8 and 12 each exist partly to deal with one of them.

Use the **2015–2019** ACS release (`/data/2019/acs/acs5`). Later releases use
2020 block group boundaries and will not join cleanly to the EPA file, which is
ticket B in step 21.

## Texts

- [*Think Python*, 3rd ed.](https://allendowney.github.io/ThinkPython/) — free; covers steps 1–14
- [*Research Software Engineering with Python*](https://third-bit.com/py-rse/) — free; covers steps 16–20
- [The official Python tutorial](https://docs.python.org/3/tutorial/),
  [*Beyond the Basic Stuff with Python*](https://inventwithpython.com/),
  [The Missing Semester](https://missing.csail.mit.edu/)

## Sources and licensing

Walkability data: EPA Smart Location Database / National Walkability Index,
US public domain. Commute data: US Census Bureau American Community Survey,
US public domain. Course text: yours.
