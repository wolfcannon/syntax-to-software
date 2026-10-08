"""Enforce the five plain-writing rules the course text follows.

They are the countable part of Simplified Technical English (ASD-STE100),
taken because a reader new to programming, or reading in a second language,
loses a long sentence before its end:

  1. A sentence is at most 25 words — 20 where it tells the reader what to do
     (exercise prompts, quiz questions, the README's "Running it").
  2. No contractions: "it is", not "it's".
  3. No dash joining two ideas. Write two sentences.
  4. No semicolon. Write two sentences.
  5. Instructions are active: "write the condition", not "the condition
     should be written". This one is reported for review and never fails,
     because a pattern cannot tell a passive from "is indented".

What counts as text: paragraphs, list items and captions in the pages, the
prose of every exercise and quiz, check labels, and the README. Not scanned:
headings, the eyebrow, tables, code, and comments inside code. A <code> span is one word.

    python3 scripts/check_style.py [file ...] [--verbose]

Run from the repo root. With no files, every page and the README are checked.
"""
import html.parser, json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LIMIT, LIMIT_INSTRUCTION = 25, 20

PROSE_TAGS = {"p", "li", "figcaption", "summary"}
SKIP_TAGS = {"pre", "script", "style", "svg", "table", "h1", "h2", "h3", "h4"}
CONTRACTION = re.compile(
    r"\b\w+(n['’]t|['’]re|['’]ve|['’]ll|['’]d)\b"
    r"|\b(it|that|there|what|here|who|let|he|she)['’]s\b", re.I)
PASSIVE = re.compile(
    r"\b(is|are|was|were|be|been|being)\s+(\w+ly\s+)?"
    r"(\w+ed|written|shown|given|taken|done|made|kept|left|built|run|read|"
    r"put|found|thrown|seen|held|cut|set|drawn)\b", re.I)


class Prose(html.parser.HTMLParser):
    """Collect the text of each prose block, with code spans as one word."""

    def __init__(self):
        super().__init__()
        self.blocks, self.current, self.skipping, self.in_code = [], None, 0, False

    def handle_starttag(self, tag, attrs):
        if tag in SKIP_TAGS:
            self.skipping += 1
        elif tag in PROSE_TAGS and not self.skipping:
            self.close_block()
            # the eyebrow is a label ("Unit 1 — Foundations · Step 5"), not prose
            self.current = None if ("class", "eyebrow") in attrs else []
        elif tag == "code":
            self.in_code = True
            if self.current is not None:
                self.current.append(" CODE ")

    def handle_endtag(self, tag):
        if tag in SKIP_TAGS:
            self.skipping -= 1
        elif tag in PROSE_TAGS:
            self.close_block()
        elif tag == "code":
            self.in_code = False

    def handle_data(self, data):
        if self.current is not None and not self.skipping and not self.in_code:
            self.current.append(data)

    def close_block(self):
        if self.current:
            text = re.sub(r"\s+", " ", "".join(self.current)).strip()
            if text:
                self.blocks.append(text)
        self.current = None


def prose_blocks(source):
    """Prose blocks in a piece of HTML. Bare text counts as one paragraph."""
    if not re.search(r"<(p|li|figcaption)\b", source):
        source = f"<p>{source}</p>"
    parser = Prose()
    parser.feed(source)
    parser.close_block()
    return parser.blocks


def sentences(text):
    # a full stop ends a sentence before a capital, a quote or a number; a
    # colon only before a capital, so "three parts: a, b and c" stays whole
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'“(])|(?<=:)\s+(?=[A-Z])", text)
    return [s for s in parts if re.search(r"[A-Za-z]", s)]


def word_count(sentence):
    return len(re.findall(r"[A-Za-z0-9][A-Za-z0-9'’%.,-]*", sentence))


def check(where, text, limit, problems, reviews):
    for s in sentences(text):
        short = s if len(s) <= 90 else s[:87] + "…"
        n = word_count(s)
        if n > limit:
            problems.append(f"{where}: {n} words, limit {limit}: {short}")
        if CONTRACTION.search(s):
            problems.append(f"{where}: contraction "
                            f"{CONTRACTION.search(s).group(0)!r}: {short}")
        if "—" in s or " -- " in s or " – " in s:
            problems.append(f"{where}: a dash joins two ideas: {short}")
        if ";" in s:
            problems.append(f"{where}: semicolon: {short}")
        if limit == LIMIT_INSTRUCTION and PASSIVE.search(s):
            reviews.append(f"{where}: passive? "
                           f"{PASSIVE.search(s).group(0)!r}: {short}")


def page_texts(path, exercises):
    """(where, text, limit) for a page's body and its exercises and quizzes."""
    name = path.relative_to(ROOT).as_posix()
    for block in prose_blocks(path.read_text()):
        yield name, block, LIMIT
    for e in (e for e in exercises if e["file"] == path.name):
        where = f"{name} [{e.get('id')}]"
        told = [e.get("prompt", ""), e.get("question", ""), e.get("intro", "")]
        said = [e.get("why", "")]
        for part in e.get("parts") or [{"options": e.get("options", [])}]:
            told.append(part.get("question", ""))
            for o in part.get("options", []):
                said += [o.get("html", ""), o.get("why", "")]
        said += [c.get("label", "") for c in e.get("checks", [])]
        for limit, sources in ((LIMIT_INSTRUCTION, told), (LIMIT, said)):
            for source in filter(None, sources):
                for block in prose_blocks(source):
                    yield where, block, limit


def readme_texts(path):
    """(where, text, limit) for each README paragraph, code and tables removed."""
    text = re.sub(r"```.*?```", "", path.read_text(), flags=re.S)
    text = re.sub(r"^\|.*$", "", text, flags=re.M)
    section = ""
    # a list item is its own block, as a paragraph is
    for block in re.split(r"\n\s*\n|\n(?=\s*(?:[-*]|\d+\.)\s)", text):
        block = block.strip()
        if block.startswith("#"):
            if block.startswith("## "):
                section = block.lstrip("# ").strip()
            continue
        block = re.sub(r"^\s*(?:[-*]|\d+\.)\s+", "", block)
        block = re.sub(r"`[^`]+`", " CODE ", block)
        block = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", block)
        block = re.sub(r"<[^>]+>", " CODE ", block)
        block = re.sub(r"\s+", " ", re.sub(r"[*_>]", "", block)).strip()
        limit = LIMIT_INSTRUCTION if section == "Running it" else LIMIT
        if block:
            yield f"README.md [{section or 'top'}]", block, limit


def main():
    verbose = "--verbose" in sys.argv
    wanted = [a for a in sys.argv[1:] if not a.startswith("--")]
    targets = ([ROOT / w for w in wanted] if wanted else
               [ROOT / "index.html", *sorted((ROOT / "steps").glob("*.html")),
                ROOT / "README.md"])
    exercises = json.loads(
        subprocess.run(["node", "scripts/extract_exercises.mjs"], cwd=ROOT,
                       capture_output=True, text=True, check=True).stdout)

    problems, reviews, scanned = [], [], 0
    for path in targets:
        texts = (readme_texts(path) if path.suffix == ".md"
                 else page_texts(path, exercises))
        for where, text, limit in texts:
            scanned += len(sentences(text))
            check(where, text, limit, problems, reviews)

    if verbose or wanted:
        for line in reviews:
            print(f"  review  {line}")
    for line in problems:
        print(f"  FAIL  {line}")
    print(f"{scanned} sentences checked in {len(targets)} file(s)")
    if problems:
        print(f"{len(problems)} problem(s)")
        return 1
    print("style is in order")
    return 0


if __name__ == "__main__":
    sys.exit(main())
