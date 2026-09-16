# From Syntax to Software

A 23-step Python course for someone with a strong mathematical background and
no Python experience, aimed at data work. Every step teaches one layer of the
language or of the development process, and every step advances the same
project: **does neighbourhood walkability predict bike commuting, and what
explains the places that don't fit the trend?**

**Unit 1 (steps 1–9) is built.** Units 2–4 are outlined in the course home page
and not yet written.

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
The first exercise run downloads the Python runtime (~10 MB) from a CDN, so
that one moment needs an internet connection.

## What's here

```
index.html            course home: how it works, the data, all 23 steps
steps/step-01..09     Unit 1, one page per step
assets/course.css     styles (light and dark, follows the browser)
assets/nav.js         sidebar, topbar, pager — defined once for every page
assets/runner.js      the exercise harness: Pyodide + the hidden checks
assets/sample.js      sample rows, generated — do not hand-edit
data/                 the project's two datasets, plus the sample cell
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

Two checks, both worth running after touching any page:

```sh
python3 scripts/verify_exercises.py   # every check must pass on its own solution,
                                      # and no starter may already pass
node /tmp/…/dom.mjs                   # (see below) pages render, cards mount
```

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
| `data/sample_rows.py` | ~11 rows of each, for steps 2–12 | generated |

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
curriculum — steps 6, 7, 8 and 12 each exist partly to deal with one of them.

Use the **2015–2019** ACS release (`/data/2019/acs/acs5`). Later releases use
2020 block group boundaries and will not join cleanly to the EPA file, which is
ticket B in step 21.

## Texts

- [*Think Python*, 3rd ed.](https://allendowney.github.io/ThinkPython/) — free; covers steps 1–15
- [*Research Software Engineering with Python*](https://third-bit.com/py-rse/) — free; covers steps 18–22
- [The official Python tutorial](https://docs.python.org/3/tutorial/),
  [*Beyond the Basic Stuff with Python*](https://inventwithpython.com/),
  [The Missing Semester](https://missing.csail.mit.edu/)

## Sources and licensing

Walkability data: EPA Smart Location Database / National Walkability Index,
US public domain. Commute data: US Census Bureau American Community Survey,
US public domain. Course text: yours.
