#!/usr/bin/env python3
"""
Shrink the bitmaps embedded in the exported illustrations.

Why
---
Two slides show a rendered diffraction pattern rather than line art, and Figma
embeds it at full resolution: a 3600 x 2338 PNG in each, ~7.5 MB together. That
is roughly 2x more pixels than the largest display can ever show, and the PNGs
are lossless encodings of what is effectively a photograph — the worst possible
format for that content.

Survivable on the kiosk, which loads from local disk once. Not survivable on a
phone over mobile data, which is where the same files are now headed.

Like the wavefront animation, this has to be re-applied after every export
because the export overwrites the SVGs — so export-illustrations.sh and
import-manual-export.py both call it.

Only the embedded rasters change. Vector geometry, the clip paths that shape
them, and the SVG's own coordinates are untouched, so nothing moves.

Usage:
    ./tools/optimise-illustrations.py              # optimise in place
    ./tools/optimise-illustrations.py --check      # report, change nothing
    ./tools/optimise-illustrations.py --max-px 1400 --quality 78
"""

import base64
import io
import re
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit(
        "error: this needs Pillow.\n"
        "  pip install Pillow\n"
        "(only needed to prepare artwork — the site itself has no dependencies)"
    )

ROOT = Path(__file__).resolve().parent.parent
ILLUS = ROOT / "assets" / "illustrations"

# Longest edge to keep. The scene is at most ~1626 CSS px wide on the kiosk and
# the bitmap covers part of that, so 1800 still leaves headroom for a 2x display.
DEFAULT_MAX_PX = 1800
DEFAULT_QUALITY = 88  # text is baked into these rasters; 82 softened its edges

DATA_URI = re.compile(r'(data:image/)(\w+)(;base64,)([A-Za-z0-9+/=]+)')


def optimise_payload(b64, max_px, quality):
    """Return (new_b64, new_format, before_bytes, after_bytes) or None if no gain."""
    raw = base64.b64decode(b64)
    im = Image.open(io.BytesIO(raw))
    before = len(raw)

    # Already done. Re-encoding an existing JPEG would quietly degrade it a
    # little more on every run — generation loss — and this script is called
    # automatically after every export, so that would accumulate.
    if im.format == "JPEG" and max(im.size) <= max_px:
        return None

    # An alpha channel has to survive, so those stay PNG. Neither of the current
    # images has one, but a future export might.
    has_alpha = im.mode in ("RGBA", "LA") or (
        im.mode == "P" and "transparency" in im.info
    )

    if max(im.size) > max_px:
        im = im.copy()
        im.thumbnail((max_px, max_px), Image.LANCZOS)

    buf = io.BytesIO()
    if has_alpha:
        im.save(buf, "PNG", optimize=True)
        fmt = "png"
    else:
        im.convert("RGB").save(buf, "JPEG", quality=quality, optimize=True, progressive=True)
        fmt = "jpeg"

    after = buf.getvalue()
    if len(after) >= before:
        return None  # already smaller than anything we would produce
    return base64.b64encode(after).decode("ascii"), fmt, before, len(after)


def process(path, max_px, quality, check):
    svg = path.read_text()
    total_before = total_after = 0
    out = []
    last = 0
    changed = False

    for m in DATA_URI.finditer(svg):
        result = optimise_payload(m.group(4), max_px, quality)
        if result is None:
            continue
        new_b64, fmt, before, after = result
        total_before += before
        total_after += after
        changed = True
        out.append(svg[last : m.start()])
        out.append(m.group(1) + fmt + m.group(3) + new_b64)
        last = m.end()

    if not changed:
        return None

    out.append(svg[last:])
    new_svg = "".join(out)

    if not check:
        path.write_text(new_svg)

    return {
        "file": path.name,
        "before_kb": len(svg) // 1024,
        "after_kb": len(new_svg) // 1024,
        "raster_before_kb": total_before // 1024,
        "raster_after_kb": total_after // 1024,
    }


def main():
    args = sys.argv[1:]
    check = "--check" in args
    max_px = DEFAULT_MAX_PX
    quality = DEFAULT_QUALITY
    if "--max-px" in args:
        max_px = int(args[args.index("--max-px") + 1])
    if "--quality" in args:
        quality = int(args[args.index("--quality") + 1])

    targets = sorted(ILLUS.glob("*.svg"))
    if not targets:
        sys.exit("no illustrations found — run tools/export-illustrations.sh first")

    results = [process(p, max_px, quality, check) for p in targets]
    results = [r for r in results if r]

    if not results:
        print("  all illustrations already optimised")
        return

    print("  %-13s %10s %10s   %s" % ("file", "before", "after", "saved"))
    saved = 0
    for r in results:
        saved += r["before_kb"] - r["after_kb"]
        print(
            "  %-13s %8dKB %8dKB   %.0f%% smaller"
            % (
                r["file"],
                r["before_kb"],
                r["after_kb"],
                100 * (1 - r["after_kb"] / max(r["before_kb"], 1)),
            )
        )
    print("  %s%d KB" % ("would save " if check else "saved ", saved))

    if check:
        print("  (--check: nothing written)")
        sys.exit(1)


if __name__ == "__main__":
    main()
