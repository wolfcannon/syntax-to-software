"""Enforce the course's one hard rule: never use what you haven't taught.

A page may *mention* anything — "step 7 is about comprehensions" is orientation,
and the learner is not expected to follow it. A page may not *use* syntax in
code the learner reads before the step that introduces it, because then the
example is teaching two things and only one of them is labelled.

What counts as learner-visible code:
  - <pre> blocks in the page body
  - each exercise's `starter` and `solution`
Not scanned: hidden check code and `setup` (the learner never sees either), and
the keyword explorer's data, which is prose about words rather than code.

A forward use is allowed when the surrounding block signposts it — the same
block says "step N" for the step that introduces the concept. That is how
step 1's exercise can show a comprehension while calling it out as one.

    python3 scripts/check_vocabulary.py [--verbose]
"""
import json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LEDGER = json.loads((ROOT / "scripts/vocabulary.json").read_text())
POSITIONS = LEDGER["positions"]
CONCEPTS = LEDGER["concepts"]
EXEMPT = {(e["page"], e["concept"]) for e in LEDGER["exemptions"]}
PROSE_EXEMPT = {(e["page"], e["term"]) for e in LEDGER.get("prose_exemptions", [])}
USED_EXEMPTIONS = set()   # an exemption that suppresses nothing has gone stale


def page_key(filename):
    return filename.replace(".html", "")


def pre_blocks(html):
    """Code shown in the page body, with tags and entities resolved."""
    out = []
    for m in re.finditer(r"<pre>(.*?)</pre>", html, re.S):
        text = re.sub(r"<[^>]+>", "", m.group(1))
        text = (text.replace("&lt;", "<").replace("&gt;", ">")
                    .replace("&amp;", "&").replace("&quot;", '"'))
        out.append(text)
    return out


def signposted(block, step):
    """Does this block admit it is reaching forward?"""
    return re.search(rf"\b[Ss]teps?\s+{step}\b", block) is not None


def scan(label, block, position, page, problems):
    for concept in CONCEPTS:
        if concept["step"] <= position:
            continue
        exempt = (page, concept["name"]) in EXEMPT
        for pattern in concept["patterns"]:
            m = re.search(pattern, block, re.M)
            if not m:
                continue
            if exempt:
                USED_EXEMPTIONS.add((page, concept["name"]))
                break
            if signposted(block, concept["step"]):
                break
            line = block[:m.start()].count("\n") + 1
            snippet = block.splitlines()[line - 1].strip()[:64]
            problems.append(
                f"{page} [{label}] uses {concept['name']} "
                f"(taught in step {concept['step']}) — line {line}: {snippet}")
            break


def paragraphs(html):
    """Learner-visible prose: the page body minus code, scripts and svg."""
    body = re.sub(r"<script.*?</script>", "", html, flags=re.S)
    body = re.sub(r"<svg.*?</svg>", "", body, flags=re.S)
    body = re.sub(r"<pre>.*?</pre>", "", body, flags=re.S)
    out = []
    for m in re.finditer(r"<(p|li|h2|h3|h4|figcaption)[^>]*>(.*?)</\1>", body, re.S):
        text = re.sub(r"<[^>]+>", " ", m.group(2))
        text = (text.replace("&lt;", "<").replace("&gt;", ">")
                    .replace("&amp;", "&").replace("&quot;", '"'))
        out.append(re.sub(r"\s+", " ", text).strip())
    return out


def scan_prose(page, position, html, problems):
    for para in paragraphs(html):
        # A paragraph that says where the idea comes from is signposting,
        # not assuming.
        if re.search(r"\b[Ss]teps?\s+\d+\b|\bUnits?\s+\d+\b|level-up|Level up", para):
            continue
        for term in LEDGER.get("prose_terms", []):
            if term["position"] <= position or (page, term["term"]) in PROSE_EXEMPT:
                continue
            for pattern in term["patterns"]:
                if re.search(pattern, para, re.I):
                    problems.append(
                        f"{page} [prose] says {term['term']!r} "
                        f"(not available until {term['position']}): "
                        f"{para[:72]}…")
                    break


def main():
    verbose = "--verbose" in sys.argv
    exercises = json.loads(
        subprocess.run(["node", "scripts/extract_exercises.mjs"], cwd=ROOT,
                       capture_output=True, text=True, check=True).stdout)

    problems, scanned = [], 0
    for path in sorted((ROOT / "steps").glob("*.html")):
        page = page_key(path.name)
        if page not in POSITIONS:
            problems.append(f"{page} has no entry in vocabulary.json positions")
            continue
        position = POSITIONS[page]
        html = path.read_text()

        for i, block in enumerate(pre_blocks(html), 1):
            scanned += 1
            scan(f"pre {i}", block, position, page, problems)

        scan_prose(page, position, html, problems)

        for q in (e for e in exercises
                  if e["file"] == path.name and e.get("kind") == "quiz"):
            parts = q.get("parts") or [{"options": q.get("options", [])}]
            raw = [q.get("question", ""), q.get("intro", ""), q.get("why", "")]
            for part in parts:
                raw += [part.get("code", ""), part.get("highlighted", ""),
                        part.get("question", "")]
                for o in part.get("options", []):
                    raw += [o.get("html", ""), o.get("why", "")]
            text = re.sub(r"<[^>]+>", " ", " ".join(raw))
            text = (text.replace("&lt;", "<").replace("&gt;", ">")
                        .replace("&amp;", "&").replace("&quot;", '"'))
            scanned += 1
            scan(f"quiz {q.get('id')}", text, position, page, problems)

        for ex in (e for e in exercises
                   if e["file"] == path.name and e.get("kind") != "quiz"):
            for field in ("starter", "solution"):
                if ex.get(field):
                    scanned += 1
                    scan(f"{ex['id']} {field}", ex[field], position, page, problems)

    for e in LEDGER["exemptions"]:
        if (e["page"], e["concept"]) not in USED_EXEMPTIONS:
            problems.append(
                f"{e['page']} carries a stale exemption for {e['concept']!r} — "
                "nothing on the page uses it any more; delete the entry")

    print(f"{scanned} learner-visible code blocks checked "
          f"against {len(CONCEPTS)} concepts")
    for p in problems:
        print("  " + p)
    if verbose:
        for e in LEDGER["exemptions"]:
            print(f"  exempt: {e['page']} / {e['concept']} — {e['why']}")
    print("vocabulary is in order" if not problems
          else f"{len(problems)} forward use(s) to fix or signpost")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
