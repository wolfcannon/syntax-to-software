"""Rebuild data/walkability_marion.csv and data/acs_commute_marion.csv.

You do not need to run this. Both files are committed, and Units 1-3 use them
as they are. It is here for two reasons: so the data in this repo is
reproducible rather than mysterious, and because step 17 has you write the ACS
half of it yourself -- at which point it is worth comparing notes.

Walkability comes from the EPA's ArcGIS service rather than the 200 MB ZIP on
data.gov, because querying one county is faster than downloading the country.

    export CENSUS_API_KEY=...        # free: api.census.gov/data/key_signup.html
    python scripts/prepare_data.py --state 18 --county 097

Run it for another county and you have ticket A from step 21 waiting for you --
try Jefferson County, Alabama (--state 01 --county 073) and watch what a
leading zero does.
"""
import argparse, csv, json, os, pathlib, sys, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
EPA_URL = ("https://geodata.epa.gov/arcgis/rest/services/OA/WalkabilityIndex"
           "/MapServer/0/query")
ACS_URL = "https://api.census.gov/data/2019/acs/acs5"
EPA_FIELDS = ["STATEFP", "COUNTYFP", "TRACTCE", "BLKGRPCE", "NatWalkInd",
              "D2A_Ranked", "D2B_Ranked", "D3B_Ranked", "D4A_Ranked", "TotPop"]
ACS_VARS = ["NAME", "B08301_001E", "B08301_018E", "B08301_018M",
            "B08301_019E", "B08301_021E"]


def get_json(url, params, timeout=90):
    with urllib.request.urlopen(url + "?" + urllib.parse.urlencode(params),
                                timeout=timeout) as resp:
        return json.load(resp)


def fetch_walkability(state, county):
    """Every block group in one county, paged 1000 at a time."""
    rows, offset = [], 0
    while True:
        page = get_json(EPA_URL, {
            "where": f"STATEFP='{state}' AND COUNTYFP='{county}'",
            "outFields": ",".join(EPA_FIELDS), "returnGeometry": "false",
            "resultOffset": offset, "resultRecordCount": 1000, "f": "json"})
        features = page.get("features", [])
        rows += [f["attributes"] for f in features]
        if len(features) < 1000:
            return [r for r in rows if r.get("NatWalkInd") is not None]
        offset += 1000


def fetch_acs(state, county, key):
    """Commute-mode counts, as the API returns them: list of lists, header first."""
    return get_json(ACS_URL, [
        ("get", ",".join(ACS_VARS)), ("for", "block group:*"),
        ("in", f"state:{state}"), ("in", f"county:{county}"), ("in", "tract:*"),
        ("key", key)])


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--state", default="18", help="state FIPS, as text (Indiana is 18)")
    ap.add_argument("--county", default="097", help="county FIPS, as text (Marion is 097)")
    args = ap.parse_args()

    # Note these stay strings all the way through. int('097') would be 97, and
    # the whole of step 3 is about why that ruins the join.
    state, county = args.state, args.county

    walk = fetch_walkability(state, county)
    walk.sort(key=lambda r: (r["TRACTCE"], int(r["BLKGRPCE"])))
    out = ROOT / "data/walkability_marion.csv"
    with open(out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(EPA_FIELDS)
        for r in walk:
            w.writerow([r[c] for c in EPA_FIELDS])
    print(f"wrote {out.name}: {len(walk)} block groups")

    key = os.environ.get("CENSUS_API_KEY")
    if not key:
        print("\nCENSUS_API_KEY is not set, so the ACS half was skipped.\n"
              "Get a free key at https://api.census.gov/data/key_signup.html\n"
              "and re-run. The committed file is still valid.", file=sys.stderr)
        return 1

    rows = fetch_acs(state, county, key)
    out = ROOT / "data/acs_commute_marion.csv"
    with open(out, "w", newline="") as f:
        csv.writer(f).writerows(rows)
    print(f"wrote {out.name}: {len(rows) - 1} block groups")
    print("\nNow re-run scripts/make_sample.py to refresh the sample rows.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
