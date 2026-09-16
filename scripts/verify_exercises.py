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


def main():
    exercises = json.loads(
        subprocess.run(["node", "scripts/extract_exercises.mjs"], cwd=ROOT,
                       capture_output=True, text=True, check=True).stdout)

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

    print(f"{len(exercises)} exercises, {n_checks} checks")
    for ident, what, detail in failures:
        print(f"  FAIL  {ident}: {what}")
        if detail:
            print(f"        {detail}")
    print("all good" if not failures else f"{len(failures)} problem(s)")
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
