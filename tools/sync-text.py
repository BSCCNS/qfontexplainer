#!/usr/bin/env python3
"""
Compare the Spanish copy in js/content.js against what is currently in Figma.

The Figma file is the source of truth for Spanish. When the copy is edited
there, run this to see exactly which strings drifted, then paste the new ones
into js/content.js.

It deliberately does NOT rewrite content.js automatically: the English and
Catalan translations sit alongside the Spanish and would silently go stale, so
a human needs to see what changed and re-translate.

Usage:
    export FIGMA_TOKEN=figd_xxx        # Figma > Settings > Security
    ./tools/sync-text.py               # report differences
    ./tools/sync-text.py --dump        # print all current Figma text

Uses the Figma REST API, which has a separate quota from the editor/MCP
integration — so it still works when that is rate-limited.

Frames are addressed by NAME, not by node id. Node ids change whenever a
designer redraws a screen, which silently breaks id-based lookups; the frame
names ("Experimento 3", "About") have been stable and are far easier to check
by eye against the Figma canvas.
"""

import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

FILE_KEY = "4papmm6d7DRslpAvtpFPNd"
PAGE_PREFIX = "Booth"
ROOT = Path(__file__).resolve().parent.parent

# Frame name -> where its slide sits in content.js `slides`
SLIDE_FRAMES = ["Experimento %d" % n for n in range(1, 8)]

# Vertical bands, in frame-local pixels, where the title and body sit. Generous
# enough to absorb the few pixels of hand-nudging between screens.
TITLE_BAND = (760, 800)
BODY_BAND = (840, 880)


def fetch(url):
    token = os.environ.get("FIGMA_TOKEN")
    if not token:
        sys.exit("error: FIGMA_TOKEN is not set (Figma > Settings > Security)")
    req = urllib.request.Request(url, headers={"X-Figma-Token": token})
    try:
        with urllib.request.urlopen(req) as r:
            return json.load(r)
    except urllib.error.HTTPError as e:
        # Figma's REST quota is easy to hit when re-exporting repeatedly. Say so
        # plainly instead of dumping a traceback that looks like a code fault.
        if e.code == 429:
            sys.exit(
                "error: Figma rate limit reached (HTTP 429). Wait a few minutes "
                "and run this again — nothing was changed."
            )
        sys.exit("error: Figma API returned HTTP %s for %s" % (e.code, url))


def load_frames():
    """Return {frame name: node} for every full-screen frame on the page."""
    doc = fetch("https://api.figma.com/v1/files/%s?depth=2" % FILE_KEY)
    pages = [
        p for p in doc["document"]["children"] if p["name"].startswith(PAGE_PREFIX)
    ]
    if not pages:
        sys.exit("error: could not find the '%s...' page" % PAGE_PREFIX)

    wanted = {}
    for n in pages[0]["children"]:
        bb = n.get("absoluteBoundingBox") or {}
        if bb.get("height", 0) > 3000:
            wanted[n["name"]] = n["id"]
    if not wanted:
        sys.exit("error: no full-screen frames found on the page")

    ids = ",".join(wanted.values())
    detail = fetch("https://api.figma.com/v1/files/%s/nodes?ids=%s" % (FILE_KEY, ids))
    return {
        name: detail["nodes"][nid]["document"]
        for name, nid in wanted.items()
        if nid in detail.get("nodes", {})
    }


def texts_in(frame):
    """Every text node in a frame, as (local_y, local_x, characters)."""
    bb = frame["absoluteBoundingBox"]
    ox, oy = bb["x"], bb["y"]
    out = []

    def walk(n):
        if n.get("characters") is not None:
            b = n.get("absoluteBoundingBox") or {}
            out.append((b.get("y", 0) - oy, b.get("x", 0) - ox, n["characters"]))
        for c in n.get("children") or []:
            walk(c)

    walk(frame)
    return out


def paragraphs(s):
    """Blank line = new paragraph. Single break = hard break kept as '\n'."""
    s = s.replace("​", "")
    out = []
    for block in re.split(r"\n\s*\n", s):
        lines = [re.sub(r"\s+", " ", ln).strip() for ln in block.split("\n")]
        lines = [ln for ln in lines if ln]
        if lines:
            out.append("\n".join(lines))
    return out


def figma_slides(frames):
    res = {}
    for name in SLIDE_FRAMES:
        if name not in frames:
            continue
        title = body = None
        for y, x, chars in texts_in(frames[name]):
            if TITLE_BAND[0] <= y <= TITLE_BAND[1]:
                title = chars.strip()
            elif BODY_BAND[0] <= y <= BODY_BAND[1]:
                body = paragraphs(chars)
        res[name] = {"title": title, "body": body}
    return res


def local_slides():
    """Load window.CONTENT.es.slides out of content.js by running it in node."""
    script = (
        "global.window={};"
        f"require({json.dumps(str(ROOT / 'js' / 'content.js'))});"
        "process.stdout.write(JSON.stringify(window.CONTENT.es.slides));"
    )
    try:
        raw = subprocess.run(
            ["node", "-e", script], capture_output=True, text=True, check=True
        ).stdout
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        sys.exit("error: could not read js/content.js via node: %s" % e)
    return json.loads(raw)


def main():
    frames = load_frames()

    if "--dump" in sys.argv:
        for name in sorted(frames):
            print("=" * 70)
            print(name)
            for y, x, chars in sorted(texts_in(frames[name])):
                print("  y=%-8.1f %r" % (y, chars))
        return

    remote = figma_slides(frames)
    local = local_slides()
    drift = 0

    for i, name in enumerate(SLIDE_FRAMES):
        r = remote.get(name, {})
        l = local[i] if i < len(local) else {}

        if r.get("title") and r["title"] != l.get("title"):
            drift += 1
            print("\n%s TITLE differs" % name)
            print("  content.js : %r" % l.get("title"))
            print("  figma      : %r" % r["title"])

        if r.get("body") and r["body"] != l.get("body"):
            drift += 1
            print("\n%s BODY differs" % name)
            print("  content.js : %s" % json.dumps(l.get("body"), ensure_ascii=False))
            print("  figma      : %s" % json.dumps(r["body"], ensure_ascii=False))

    if drift:
        print(
            "\n%d block(s) drifted. Update the `es` section of js/content.js, "
            "then re-check the en/ca translations for the same blocks — they "
            "will now be out of date." % drift
        )
        sys.exit(1)

    print("Spanish slide copy in js/content.js matches Figma.")


if __name__ == "__main__":
    main()
