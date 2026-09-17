"""Run every exercise's hidden checks against its own published solution.

An exercise whose checks disagree with its solution is worse than no exercise,
so this runs the same harness the browser runs:

    solution + checks  -> every check must pass
    starter  + checks  -> at least one check must fail

Run from the repo root:  node scripts/extract_exercises.mjs > /tmp/exercises.json
                         python3 scripts/verify_exercises.py
"""
import json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


def harness_source():
    """Lift the Python harness out of runner.js so there is one source of truth."""
    js = (ROOT / "assets/runner.js").read_text()
    m = re.search(r"const HARNESS = `(.*?)`;", js, re.S)
    if not m:
        sys.exit("could not find HARNESS in assets/runner.js")
    return m.group(1).replace("\\`", "`").replace("\\$", "$")


def check_quizzes(quizzes):
    """A quiz with no correct answer, or two, is a broken quiz."""
    problems = []
    for q in quizzes:
        parts = q.get("parts") or [{"options": q.get("options", [])}]
        for i, part in enumerate(parts):
            where = f"{q.get('id', q.get('mount'))}"
            if q.get("parts"):
                where += f" part {part.get('label', i + 1)}"
            options = part.get("options", [])
            right = [o for o in options if o.get("correct")]
            if len(right) != 1:
                problems.append(
                    (where, f"has {len(right)} correct options, expected 1", ""))
            for o in options:
                if not o.get("correct") and not o.get("why"):
                    problems.append((where, "a wrong option explains nothing",
                                     o.get("html", "")[:60]))
        if not q.get("why"):
            problems.append((q.get("id"), "no explanation after the right answer", ""))
    return problems


def check_nav(exercises):
    """The progress dots are driven by ids listed in nav.js. If a page renames
    an exercise and nav.js isn't updated, the dot silently never lights up --
    so compare the two lists rather than trusting them to stay in step."""
    nav = (ROOT / "assets/nav.js").read_text()
    problems = []
    for page, ids in re.findall(r'file:\s*"steps/([^"]+)"[^}]*?ex:\s*\[([^\]]*)\]',
                                nav, re.S):
        listed = set(re.findall(r'"([^"]+)"', ids))
        actual = {e["id"] for e in exercises if e["file"] == page}
        if listed != actual:
            for missing in sorted(actual - listed):
                problems.append((page, f"exercise '{missing}' is on the page but "
                                       "not listed in nav.js", ""))
            for extra in sorted(listed - actual):
                problems.append((page, f"nav.js lists '{extra}', which no page "
                                       "defines", ""))
    pages_with_ex = {e["file"] for e in exercises}
    for page in sorted(pages_with_ex):
        if f'"steps/{page}"' not in nav:
            problems.append((page, "page has exercises but isn't in nav.js", ""))
    return problems


def main():
    everything = json.loads(
        subprocess.run(["node", "scripts/extract_exercises.mjs"], cwd=ROOT,
                       capture_output=True, text=True, check=True).stdout)
    exercises = [e for e in everything if e.get("kind") != "quiz"]
    quizzes = [q for q in everything if q.get("kind") == "quiz"]

    ns = {}
    exec(harness_source(), ns)
    run = ns["_run_exercise"]

    failures, n_checks = [], 0
    for ex in exercises:
        setup = ex.get("setup", "")
        checks = json.dumps(ex.get("checks", []))

        res = json.loads(run(setup, ex.get("solution", ""), checks))
        if res["error"]:
            failures.append((ex["id"], "solution raised", res["error"].strip().splitlines()[-1]))
        for c in res["checks"]:
            n_checks += 1
            if not c["ok"]:
                failures.append((ex["id"], "check fails on solution: " + c["label"],
                                 c.get("detail", "")))

        res = json.loads(run(setup, ex.get("starter", ""), checks))
        if not res["error"] and res["checks"] and all(c["ok"] for c in res["checks"]):
            failures.append((ex["id"], "starter already passes every check", ""))

    failures += check_nav(exercises)
    failures += check_quizzes(quizzes)

    print(f"{len(exercises)} exercises, {n_checks} checks, {len(quizzes)} quizzes")
    for ident, what, detail in failures:
        print(f"  FAIL  {ident}: {what}")
        if detail:
            print(f"        {detail}")
    print("all good" if not failures else f"{len(failures)} problem(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
