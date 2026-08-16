#!/usr/bin/env python3
"""
Import illustrations exported by hand from the Figma app.

Why this exists
---------------
tools/export-illustrations.sh pulls artwork through the Figma REST API, which
has a modest rate limit that is easy to exhaust. Exporting from the Figma
desktop or web app does not touch that quota at all, so when the API is
throttled you can still get the artwork out immediately by hand.

The catch is that Figma names exported files after their layer names, which in
this file are inconsistent ("Group", "Step 3", "Group 82") and in some cases
duplicated. Rather than making you rename eight files correctly, this script
identifies each one by what is actually inside it:

    slide1  no gradients at all, no word mask       (bare apparatus)
    slide2  one linear gradient, no wave arcs       (beam only)
    slide3  wave arcs, no interference fringes      (wavefronts)
    slide4  wave arcs plus many extra gradients     (fringes on screen)
    slide5  no gradients, large path count          (word mask, no beam)
    slide6  embedded bitmap, very large             (diffraction pattern)
    slide7  embedded bitmap, smaller                (collapsed wordmark)
    cat     ~106x86 viewBox, a single path          (the cat)

It prints what it decided before writing anything, and refuses to guess when
two files look alike.

Usage:
    ./tools/import-manual-export.py ~/Downloads/figma-export
    ./tools/import-manual-export.py ~/Downloads/figma-export --dry-run
"""

import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ILLUS = ROOT / "assets" / "illustrations"


def analyse(path):
    svg = path.read_text(errors="replace")
    m = re.search(r'viewBox="([\d.\-\s]+)"', svg)
    vb = [float(x) for x in m.group(1).split()] if m else [0, 0, 0, 0]
    return {
        "path": path,
        "size": path.stat().st_size,
        "w": vb[2] if len(vb) > 3 else 0,
        "h": vb[3] if len(vb) > 3 else 0,
        "paths": len(re.findall(r"<path\b", svg)),
        "radial": len(re.findall(r"radialGradient", svg)),
        "linear": len(re.findall(r"linearGradient", svg)),
        "images": len(re.findall(r"<image\b", svg)),
    }


def bucket(f):
    """
    Sort a file into a family by the kind of artwork it contains.

    Families, not exact identities: within a family the members are told apart
    by ranking them against each other (see classify), never by an absolute
    threshold. Absolute counts drift every time the artwork is redrawn —
    "slide 4 has more wave gradients than slide 3" stays true regardless.
    """
    if f["w"] and f["w"] < 200 and f["h"] < 200:
        return "cat" if f["paths"] <= 3 else None
    if not (1500 < f["w"] < 1750):
        return None  # not one of the illustration boxes
    if f["images"]:
        return "bitmap"  # slides 6 and 7
    if f["radial"]:
        return "waves"  # slides 3 and 4
    if f["linear"]:
        return "beam"  # slide 2
    return "plain"  # slides 1 and 5


def classify(files):
    """Map every input file to a slide name. Returns {name: [file, ...]}."""
    groups = {}
    for f in files:
        b = bucket(f)
        if b is None:
            continue
        groups.setdefault(b, []).append(f)

    out = {}

    def rank(family, key, low_name, high_name):
        """Assign two names within a family by ordering on `key`."""
        members = sorted(groups.get(family, []), key=key)
        if len(members) == 1:
            # Only one supplied — cannot rank, so leave it for the caller to
            # report as ambiguous rather than guessing which of the two it is.
            out.setdefault("?" + family, []).append(members[0])
        else:
            for i, f in enumerate(members):
                out.setdefault(low_name if i == 0 else high_name, []).append(f)
                if i > 1:
                    out.setdefault(high_name, []).append(f)

    # Slide 6's embedded render is far heavier than slide 7's.
    rank("bitmap", lambda f: f["size"], "slide7", "slide6")
    # Slide 4 adds interference fringes on top of slide 3's wavefronts.
    rank("waves", lambda f: f["radial"], "slide3", "slide4")
    # Slide 5 carries the word mask, so noticeably more geometry than slide 1.
    rank("plain", lambda f: f["paths"], "slide1", "slide5")

    for f in groups.get("beam", []):
        out.setdefault("slide2", []).append(f)
    for f in groups.get("cat", []):
        out.setdefault("cat", []).append(f)

    return out


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    dry = "--dry-run" in sys.argv
    if not args:
        sys.exit("usage: ./tools/import-manual-export.py <folder-of-svgs> [--dry-run]")

    src = Path(args[0]).expanduser()
    if not src.is_dir():
        sys.exit("error: %s is not a folder" % src)

    svgs = sorted(src.glob("*.svg"))
    if not svgs:
        sys.exit("error: no .svg files in %s" % src)

    analysed = [analyse(p) for p in svgs]
    found = classify(analysed)
    recognised = {id(f) for fs in found.values() for f in fs}
    unknown = [f["path"].name for f in analysed if id(f) not in recognised]

    print("%-9s %-34s %8s  %s" % ("target", "source file", "bytes", "signature"))
    print("-" * 78)
    clash = False
    ambiguous = []
    for name in sorted(found):
        for f in found[name]:
            label = name
            if name.startswith("?"):
                label = "AMBIG"
                ambiguous.append((name[1:], f))
            print(
                "%-9s %-34s %8d  paths=%-3d radial=%-2d linear=%-2d img=%d"
                % (label, f["path"].name[:34], f["size"], f["paths"], f["radial"], f["linear"], f["images"])
            )
        if not name.startswith("?") and len(found[name]) > 1:
            clash = True

    for u in unknown:
        print("%-9s %-34s   (not recognised — ignored)" % ("-", u[:34]))

    if ambiguous:
        pairs = {"bitmap": "slide6/slide7", "waves": "slide3/slide4", "plain": "slide1/slide5"}
        print()
        for family, f in ambiguous:
            print(
                "error: %s could be either of %s — they are told apart by "
                "comparing them, so export both together."
                % (f["path"].name, pairs.get(family, family))
            )
        sys.exit("Nothing was written.")

    if clash:
        sys.exit(
            "\nerror: two files matched the same slide. Export them one at a "
            "time, or remove the duplicate, and run this again. Nothing was "
            "written."
        )

    missing = [n for n in ["slide%d" % i for i in range(1, 8)] + ["cat"] if n not in found]
    if missing:
        print("\nnot supplied: %s" % ", ".join(missing))
        print("(existing files for those are left untouched)")

    if dry:
        print("\n--dry-run: nothing written.")
        return

    print()
    for name, files in sorted(found.items()):
        f = files[0]
        dest = (ROOT / "assets" / "cat.svg") if name == "cat" else (ILLUS / (name + ".svg"))
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(f["path"], dest)

        # Figma renders exports against the canvas colour; drop that rect so the
        # artwork sits on the page's own black background.
        svg = dest.read_text()
        cleaned = re.sub(r'<rect width="\d+" height="\d+" fill="#BEBABA"/>\n?', "", svg)
        if cleaned != svg:
            dest.write_text(cleaned)

        print("  %s  <-  %s" % (dest.relative_to(ROOT), f["path"].name))

    # Figma embeds bitmaps at full resolution; shrink them before the animation
    # is applied, so the animation lands on the final bytes.
    optimiser = ROOT / "tools" / "optimise-illustrations.py"
    if optimiser.exists():
        print("\nOptimising embedded bitmaps...")
        subprocess.run([sys.executable, str(optimiser)], check=False)

    # Wavefront animation lives outside the exported files, so re-apply it.
    animator = ROOT / "tools" / "animate-illustrations.py"
    if animator.exists():
        print("\nRe-applying wavefront animation...")
        subprocess.run([sys.executable, str(animator)], check=False)

    print("\nDone. Reload the page to see them.")


if __name__ == "__main__":
    main()
