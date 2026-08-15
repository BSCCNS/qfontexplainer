#!/usr/bin/env python3
"""
Inject the wavefront animation into the exported slide illustrations.

Why this is a separate step
---------------------------
tools/export-illustrations.sh pulls artwork straight from Figma and overwrites
whatever was there. So the animation cannot live inside the exported files as
hand edits — it would be destroyed on the next export. Instead the export stays
pristine and this script re-applies the animation afterwards.
export-illustrations.sh calls it automatically.

Why CSS inside the SVG
----------------------
The illustrations are referenced as <img src="...svg">. An SVG loaded that way
runs in a restricted mode: no scripting and no external resources, but
*declarative* animation still runs, including CSS animations in an internal
<style> block. That means:

  * no JavaScript, so nothing to go wrong unattended on the kiosk
  * no fetch(), so the file:// deployment keeps working
  * no dependencies

Verified empirically: an SVG using `animation-delay: -2s` renders at its
mid-animation position when loaded through <img>.

Geometry is derived, not hardcoded
----------------------------------
Each slit emits a set of concentric arcs whose radii grow by a constant
increment — a wavefront expanding at constant speed. This script finds those
arcs, splits them into per-slit sets, and solves for each set's centre of
expansion from the arc bounding boxes. Nothing about the drawing is assumed, so
the artwork can be redrawn in Figma and re-exported without touching this file.

Usage:  ./tools/animate-illustrations.py [--check]
"""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ILLUS = ROOT / "assets" / "illustrations"

MARK_OPEN = "<!-- qc:animation -->"
MARK_CLOSE = "<!-- /qc:animation -->"

PERIOD = 3.2      # seconds for one full wave cycle
DRIFT = 1.085     # how far an arc expands before it dims out


def numbers(d):
    return [float(x) for x in re.findall(r"-?\d+\.?\d*", d)]


def bbox(path_d):
    v = numbers(path_d)
    xs, ys = v[0::2], v[1::2]
    return min(xs), max(xs), min(ys), max(ys)


def solve_centre(boxes):
    """
    Find the point the arcs expand from.

    For arcs that are scaled copies about a common centre c, corresponding
    points satisfy  p_i = c + s_i * (p_0 - c), where s_i is the size ratio.
    Rearranged,  c = (p_i - s_i * p_0) / (1 - s_i).  Averaging over every arc
    beyond the first keeps a single noisy outline from skewing the result.
    """
    w0 = boxes[0][1] - boxes[0][0]
    xs, ys = [], []
    for xmin, xmax, ymin, ymax in boxes[1:]:
        s = (xmax - xmin) / w0
        if abs(1 - s) < 1e-6:
            continue
        xs.append((xmax - s * boxes[0][1]) / (1 - s))
        ys.append((ymax - s * boxes[0][3]) / (1 - s))
    if not xs:
        return None
    return sum(xs) / len(xs), sum(ys) / len(ys)


def split_sets(boxes):
    """
    Group arcs into one set per slit.

    Arcs are emitted largest-last within a set, so a drop in width marks the
    start of the next slit's set.
    """
    sets, current = [], [0]
    for i in range(1, len(boxes)):
        prev = boxes[i - 1][1] - boxes[i - 1][0]
        cur = boxes[i][1] - boxes[i][0]
        if cur < prev:
            sets.append(current)
            current = []
        current.append(i)
    sets.append(current)
    return sets


def build_style(sets_with_centres):
    blocks = [MARK_OPEN, "<style>", "@keyframes qc-wave {"]
    blocks.append("  0%%   { opacity:.20; transform:scale(1); }")
    blocks.append("  35%%  { opacity:1; }")
    blocks.append("  100%% { opacity:.20; transform:scale(%s); }" % DRIFT)
    blocks.append("}")
    blocks.append(
        "[data-qc-wave]{animation:qc-wave %ss linear infinite;transform-box:view-box}"
        % PERIOD
    )

    for si, (members, centre) in enumerate(sets_with_centres):
        cx, cy = centre
        blocks.append(
            '[data-qc-set="%d"]{transform-origin:%.1fpx %.1fpx}' % (si, cx, cy)
        )
        step = PERIOD / len(members)
        for i in range(len(members)):
            # delay_i = i*step - PERIOD starts every arc mid-cycle, so there is
            # no stagger on load, while each arc still lags the one inside it.
            blocks.append(
                '[data-qc-set="%d"][data-qc-wave="%d"]{animation-delay:%.2fs}'
                % (si, i, i * step - PERIOD)
            )

    blocks.append("@media (prefers-reduced-motion: reduce){[data-qc-wave]{animation:none}}")
    blocks.append("</style>")
    blocks.append(MARK_CLOSE)
    return "\n".join(blocks).replace("%%", "%")


def add_attrs(tag, set_index, wave_index):
    """
    Add the animation hooks to a <path> tag.

    Figma emits self-closing tags, so the closing "/>" has to be reattached
    after the attributes rather than treated as a single character — otherwise
    the slash ends up stranded mid-tag and the SVG stops parsing.
    """
    attrs = ' data-qc-set="%d" data-qc-wave="%d"' % (set_index, wave_index)
    if tag.endswith("/>"):
        return tag[:-2].rstrip() + attrs + "/>"
    return tag[:-1].rstrip() + attrs + ">"


def strip(svg):
    """
    Remove a previous injection so the script is safe to re-run.

    The trailing newline is consumed along with the block: without that, each
    strip/re-inject round trip would leave one more blank line than the last,
    and --check would report a file as stale purely because of whitespace.
    """
    svg = re.sub(
        re.escape(MARK_OPEN) + r".*?" + re.escape(MARK_CLOSE) + r"\n?",
        "",
        svg,
        flags=re.S,
    )
    return re.sub(r'\s+data-qc-(?:wave|set)="\d+"', "", svg)


def animate(path, check=False):
    original = path.read_text()
    svg = strip(original)

    # The wavefronts are the only paths stroked with a radial gradient; the rest
    # of the scene is flat white strokes and black fills.
    arcs = [
        t
        for t in re.findall(r"<path\b[^>]*>", svg)
        if 'stroke="url(#' in t and "radial" in t
    ]
    if not arcs:
        return None, "no wavefront arcs found"

    boxes = [bbox(re.search(r'\sd="([^"]+)"', t).group(1)) for t in arcs]
    sets = split_sets(boxes)

    sets_with_centres = []
    for members in sets:
        centre = solve_centre([boxes[i] for i in members])
        if centre is None:
            return None, "could not solve centre of expansion"
        sets_with_centres.append((members, centre))

    for si, (members, _) in enumerate(sets_with_centres):
        for i, arc_index in enumerate(members):
            tag = arcs[arc_index]
            svg = svg.replace(tag, add_attrs(tag, si, i), 1)

    svg = svg.replace("</svg>", build_style(sets_with_centres) + "\n</svg>", 1)

    detail = "%d arcs in %d set(s) at %s" % (
        len(arcs),
        len(sets),
        ", ".join("(%.0f,%.0f)" % c for _, c in sets_with_centres),
    )

    if check:
        return detail, ("up to date" if svg == original else "NEEDS UPDATE")

    path.write_text(svg)
    return detail, "animated"


def main():
    check = "--check" in sys.argv
    stale = 0
    targets = sorted(ILLUS.glob("slide*.svg"))
    if not targets:
        sys.exit("no illustrations found — run tools/export-illustrations.sh first")

    for p in targets:
        detail, status = animate(p, check)
        if detail is None:
            continue  # slides without wavefronts are simply skipped
        print("  %-12s %s — %s" % (p.name, detail, status))
        if status == "NEEDS UPDATE":
            stale += 1

    if check and stale:
        sys.exit(1)


if __name__ == "__main__":
    main()
