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
"""

import json
import os
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

FILE_KEY = "4papmm6d7DRslpAvtpFPNd"
ROOT = Path(__file__).resolve().parent.parent

# Frame origins on the Figma canvas. The seven slides sit in a horizontal strip
# at y=3984; the About screen sits above it.
SLIDE_ORIGINS = [
    ("slide1", 53.5), ("slide2", 2341), ("slide3", 4628.5), ("slide4", 6916),
    ("slide5", 9203.5), ("slide6", 11498), ("slide7", 13785.5),
]
NODE_IDS = "894:1284,983:114,980:2,980:6,980:11,980:14,980:22,980:23,983:993"

TITLE_Y = 4769.15   # every slide title shares this top edge
BODY_Y = (4840, 5300)


def fetch():
    token = os.environ.get("FIGMA_TOKEN")
    if not token:
        sys.exit("error: FIGMA_TOKEN is not set (Figma > Settings > Security)")
    url = f"https://api.figma.com/v1/files/{FILE_KEY}/nodes?ids={NODE_IDS}"
    req = urllib.request.Request(url, headers={"X-Figma-Token": token})
    with urllib.request.urlopen(req) as r:
        return json.load(r)


def text_nodes(doc):
    out = []

    def walk(n):
        if n.get("type") == "TEXT":
            bb = n.get("absoluteBoundingBox") or {}
            out.append((bb.get("x", 0), bb.get("y", 0), n.get("characters", "")))
        for c in n.get("children") or []:
            walk(c)

    for v in doc["nodes"].values():
        walk(v["document"])
    return out


def paragraphs(s):
    """Blank line = new paragraph. Single break = hard break kept as '\n'."""
    s = s.replace("​", "")
    blocks = re.split(r"\n\s*\n", s)
    out = []
    for b in blocks:
        lines = [ln.strip() for ln in b.split("\n")]
        lines = [re.sub(r"\s+", " ", ln) for ln in lines if ln]
        if lines:
            out.append("\n".join(lines))
    return out


def figma_slides(nodes):
    res = {}
    for x, y, c in nodes:
        if y < 3900:
            continue
        for name, ox in SLIDE_ORIGINS:
            if ox - 30 <= x < ox + 2227.5:
                lx = x - ox
                if abs(y - TITLE_Y) < 3:
                    res.setdefault(name, {})["title"] = c.strip()
                elif BODY_Y[0] < y < BODY_Y[1] and lx < 700:
                    res.setdefault(name, {})["body"] = paragraphs(c)
    return res


def local_slides():
    """Load window.CONTENT.es out of content.js by running it in node."""
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
        sys.exit(f"error: could not read js/content.js via node: {e}")
    return json.loads(raw)


def main():
    data = fetch()
    nodes = text_nodes(data)
    remote = figma_slides(nodes)

    if "--dump" in sys.argv:
        for x, y, c in sorted(nodes, key=lambda t: (t[1], t[0])):
            print(f"--- x={x:.0f} y={y:.0f}\n{c}\n")
        return

    local = local_slides()
    drift = 0

    for i, (name, _) in enumerate(SLIDE_ORIGINS):
        r = remote.get(name, {})
        l = local[i] if i < len(local) else {}

        if r.get("title") and r["title"] != l.get("title"):
            drift += 1
            print(f"\n{name} TITLE differs")
            print(f"  content.js : {l.get('title')!r}")
            print(f"  figma      : {r['title']!r}")

        if r.get("body") and r["body"] != l.get("body"):
            drift += 1
            print(f"\n{name} BODY differs")
            print(f"  content.js : {json.dumps(l.get('body'), ensure_ascii=False)}")
            print(f"  figma      : {json.dumps(r['body'], ensure_ascii=False)}")

    if drift:
        print(
            f"\n{drift} block(s) drifted. Update the `es` section of "
            "js/content.js, then re-check the en/ca translations for the same "
            "blocks — they will now be out of date."
        )
        sys.exit(1)

    print("Spanish copy in js/content.js matches Figma.")


if __name__ == "__main__":
    main()
