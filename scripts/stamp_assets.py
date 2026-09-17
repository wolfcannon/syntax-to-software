"""Stamp every asset link with a hash of the file it points at.

`python3 -m http.server` sends no cache headers, so a browser is free to keep
serving assets/course.css from memory after you have edited it — which looks
exactly like a CSS bug, and wasted a round of review once already. A content
hash in the query string changes the URL whenever the bytes change, so the
browser has no cached copy to reuse.

Run it after editing anything in assets/, and before believing a page looks
wrong:

    python3 scripts/stamp_assets.py
"""
import hashlib, pathlib, re, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
LINK = re.compile(r'(?P<attr>href|src)="(?P<path>(?:\.\./)?assets/[\w.-]+)(?:\?v=[0-9a-f]+)?"')


def digest(name):
    return hashlib.sha256((ROOT / "assets" / name).read_bytes()).hexdigest()[:8]


def main():
    hashes, changed = {}, []
    for page in [ROOT / "index.html", *sorted((ROOT / "steps").glob("*.html"))]:
        text = original = page.read_text()

        def stamp(m):
            name = m["path"].split("/")[-1]
            if name not in hashes:
                hashes[name] = digest(name)
            return f'{m["attr"]}="{m["path"]}?v={hashes[name]}"'

        text = LINK.sub(stamp, text)
        if text != original:
            page.write_text(text)
            changed.append(page.relative_to(ROOT).as_posix())

    for name, h in sorted(hashes.items()):
        print(f"  {name:<12} {h}")
    print(f"{len(changed)} page(s) restamped" if changed else "all pages already current")
    return 0


if __name__ == "__main__":
    sys.exit(main())
