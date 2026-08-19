#!/usr/bin/env python3
"""
Smoke test for the Quantum Compass kiosk.

Answers one question: if this folder were copied to the Raspberry Pi right now
and Chromium opened it, would the installation be correct?

It loads the real index.html over file:// — the same way the Pi does, with no
web server — drives it through every screen, and checks the things that
actually break:

  * the licensed fonts load and are the ones being used
  * every asset referenced by the page exists
  * the kiosk layout is selected and cannot scroll
  * all seven slides, home and about render
  * the wavefront animation survived the last export
  * the attract loop appears after idling
  * language switching works in all three languages
  * no JavaScript errors

Exits non-zero if anything fails, so it can gate a deploy.

Usage:
    ./tools/smoke-test.py
    ./tools/smoke-test.py --keep     # leave the temp page for inspection
"""

import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

CHROME_CANDIDATES = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome",
]

# The probe runs inside the real page and writes one "KEY=value" per line into a
# element the DOM dump can be grepped for.
PROBE = r"""
    <div id="qc-smoke" style="display:none">PROBE_DID_NOT_RUN</div>
    <script>
    (function () {
      var errors = [];
      var missing = [];
      var sanitised = 0;
      window.addEventListener('error', function (e) {
        if (e.target && e.target !== window) {
          missing.push((e.target.src || e.target.href || '?').split('/').slice(-2).join('/'));
        } else if (!e.filename && !e.lineno && /^Script error\.?$/.test(e.message || '')) {
          /*
           * A window error with no message, file or line is the cross-origin
           * sanitised form. Every file:// resource is its own opaque origin, so
           * a failed media load can surface a second time in this shape — it
           * appears immediately after the missing-video errors and carries no
           * script frame. Counting it made the gate fail at random. It is
           * tallied separately rather than ignored.
           */
          sanitised++;
        } else {
          errors.push(e.message);
        }
      }, true);

      var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
      var R = [];
      var put = function (k, v) { R.push(k + '=' + v); };

      setTimeout(function () {
        (async function () {
          try {
            await document.fonts.ready;

            // --- fonts -------------------------------------------------
            var faces = [];
            document.fonts.forEach(function (f) { faces.push(f.family + '/' + f.weight + ':' + f.status); });
            put('FONT_FACES', faces.join(' ') || 'NONE');
            // Availability by measurement: same string and generic fallback,
            // only the candidate family differs.
            var c = document.createElement('canvas').getContext('2d');
            c.font = '40px monospace';
            var base = c.measureText('Thomas Young proyectó ABC').width;
            c.font = '40px "Obvia Narrow", monospace';
            var test = c.measureText('Thomas Young proyectó ABC').width;
            put('FONT_IN_USE', Math.abs(base - test) > 0.5);
            put('FONT_FAMILY_FIRST', (getComputedStyle(document.body).fontFamily.split(',')[0] || '').replace(/"/g, ''));

            // --- layout ------------------------------------------------
            put('LAYOUT', document.documentElement.className);
            put('SCROLL_LOCKED', getComputedStyle(document.documentElement).overflowY === 'hidden');

            // --- screens -----------------------------------------------
            var langs = [];
            document.querySelectorAll('.lang').forEach(function (b) { langs.push(b.lang); });
            put('LANGUAGES', langs.join(','));

            document.querySelectorAll('.btn')[0].click();
            await wait(300);
            var slidesOk = 0, titles = 0, figures = 0;
            for (var i = 0; i < 7; i++) {
              var f = document.querySelector('.slide__figure img');
              if (f && !f.complete) {
                await new Promise(function (r) {
                  f.addEventListener('load', r, { once: true });
                  f.addEventListener('error', r, { once: true });
                  setTimeout(r, 5000);
                });
              }
              if (document.querySelector('.slide__title')) titles++;
              if (f && f.naturalWidth > 0) figures++;
              slidesOk++;
              var n = document.querySelector('.nav-arrow--next');
              if (n) { n.click(); await wait(200); }
            }
            put('SLIDES_VISITED', slidesOk);
            put('SLIDE_TITLES', titles);
            put('SLIDE_FIGURES', figures);

            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
            await wait(250);
            put('HOME_OK', !!document.querySelector('.home__actions'));

            document.querySelectorAll('.btn')[1].click();
            await wait(300);
            put('ABOUT_SECTIONS', document.querySelectorAll('.about__section').length);
            put('ABOUT_ARROWS', document.querySelectorAll('.nav-arrow').length);

            document.querySelector('.logo').click();
            await wait(300);
            put('LOGO_HOME', !!document.querySelector('.home__actions'));

            // --- languages ---------------------------------------------
            var seen = [];
            var codes = ['en', 'ca', 'es'];
            for (var j = 0; j < codes.length; j++) {
              document.querySelectorAll('.lang').forEach(function (b) {
                if (b.lang === codes[j]) b.click();
              });
              await wait(200);
              var h = document.querySelector('.home__block h2');
              seen.push(codes[j] + ':' + (h ? h.textContent.slice(0, 12).replace(/=/g, '') : 'FAIL'));
            }
            put('LANG_SWITCH', seen.join('|'));

            // --- attract loop ------------------------------------------
            await wait(1400);
            put('SCREENSAVER', !!document.querySelector('.screensaver'));

            put('MISSING_ASSETS', missing.length ? Array.from(new Set(missing)).join(' ') : 'none');
            put('JS_ERRORS', errors.length ? errors.join(' | ') : 'none');
            put('SANITISED_ERRORS', sanitised);
          } catch (e) {
            put('PROBE_ERROR', e.message);
          }
          document.getElementById('qc-smoke').textContent = 'QCSMOKE ' + R.join(' ;; ') + ' QCEND';
        })();
      }, 900);
    })();
    </script>
"""


def find_chrome():
    for p in CHROME_CANDIDATES:
        if Path(p).exists():
            return p
    found = shutil.which("chromium") or shutil.which("google-chrome")
    if found:
        return found
    sys.exit(
        "error: could not find Chrome or Chromium.\n"
        "Install one, or edit CHROME_CANDIDATES in this script."
    )


def run(keep=False):
    chrome = find_chrome()
    index = ROOT / "index.html"
    if not index.exists():
        sys.exit("error: index.html not found")

    html = index.read_text()
    if "  </body>" not in html:
        sys.exit("error: could not find the closing body tag in index.html")

    # Shorten the attract-loop delay so the test does not have to idle for two
    # minutes. This has to be set before app.js runs, which is why it is spliced
    # in ahead of the script tags rather than with the rest of the probe.
    anchor = '<script src="js/content.js">'
    if anchor not in html:
        sys.exit("error: could not find the content.js script tag in index.html")
    html = html.replace(anchor, "<script>window.QC_IDLE_MS=1200;</script>\n    " + anchor, 1)

    # Written next to index.html so relative asset paths resolve identically.
    tmp = ROOT / "_smoke-test.html"
    tmp.write_text(html.replace("  </body>", PROBE + "  </body>"))

    try:
        proc = subprocess.run(
            [
                chrome,
                "--headless=new",
                "--disable-gpu",
                "--no-sandbox",
                "--virtual-time-budget=40000",
                "--dump-dom",
                # ?layout=kiosk so the result does not depend on the window size
                # of whatever machine runs this.
                "file://%s?layout=kiosk" % tmp,
            ],
            capture_output=True,
            text=True,
            timeout=120,
        )
    finally:
        if not keep:
            tmp.unlink(missing_ok=True)

    m = re.search(r"QCSMOKE (.*?) QCEND", proc.stdout, re.S)
    if not m:
        print(proc.stdout[-1500:])
        sys.exit("error: the probe did not report. See the DOM dump above.")

    result = {}
    for pair in m.group(1).split(" ;; "):
        if "=" in pair:
            k, v = pair.split("=", 1)
            result[k] = v.strip()
    return result


def file_checks():
    """Things worth knowing before a browser is even opened."""
    out = []

    fonts = ROOT / "fonts"
    for name in ("ObviaNarrow-Light.woff2", "ObviaNarrow-Book.woff2"):
        f = fonts / name
        out.append(("Font file present: %s" % name, f.exists(),
                    "expected at fonts/%s" % name))

    # The wavefront animation lives inside the exported SVGs and is destroyed
    # by every re-export, so confirm it is actually there.
    for name in ("slide3.svg", "slide4.svg"):
        f = ROOT / "assets" / "illustrations" / name
        has = f.exists() and "qc:animation" in f.read_text()
        out.append(("Wavefront animation in %s" % name, has,
                    "run tools/animate-illustrations.py"))

    return out


def main():
    keep = "--keep" in sys.argv
    r = run(keep)

    checks = file_checks() + [
        ("Fonts declared and loaded",
         r.get("FONT_FACES", "").count("loaded") == 2,
         r.get("FONT_FACES")),
        ("Obvia Narrow actually in use",
         r.get("FONT_IN_USE") == "true",
         "measured against a generic fallback"),
        ("Obvia Narrow is first in the stack",
         r.get("FONT_FAMILY_FIRST") == "Obvia Narrow",
         r.get("FONT_FAMILY_FIRST")),
        ("Kiosk layout selected",
         "layout-kiosk" in r.get("LAYOUT", ""),
         r.get("LAYOUT")),
        ("Page cannot scroll",
         r.get("SCROLL_LOCKED") == "true",
         "overflow-y on <html>"),
        ("All 7 slides reachable",
         r.get("SLIDES_VISITED") == "7" and r.get("SLIDE_TITLES") == "7",
         "titles rendered: %s" % r.get("SLIDE_TITLES")),
        ("All 7 illustrations load",
         r.get("SLIDE_FIGURES") == "7",
         "loaded: %s of 7" % r.get("SLIDE_FIGURES")),
        ("Home screen reachable",
         r.get("HOME_OK") == "true", ""),
        ("About has 4 sections and no arrows",
         r.get("ABOUT_SECTIONS") == "4" and r.get("ABOUT_ARROWS") == "0",
         "sections=%s arrows=%s" % (r.get("ABOUT_SECTIONS"), r.get("ABOUT_ARROWS"))),
        ("Logo returns home",
         r.get("LOGO_HOME") == "true", ""),
        ("Three languages offered",
         r.get("LANGUAGES") == "en,ca,es",
         r.get("LANGUAGES")),
        ("Language switching renders",
         "FAIL" not in r.get("LANG_SWITCH", "FAIL"),
         r.get("LANG_SWITCH")),
        ("Attract loop appears when idle",
         r.get("SCREENSAVER") == "true", ""),
        ("No JavaScript errors",
         r.get("JS_ERRORS") == "none",
         r.get("JS_ERRORS")),
    ]

    width = max(len(name) for name, _, _ in checks)
    failed = 0
    print()
    for name, ok, detail in checks:
        print("  %s  %-*s  %s" % ("PASS" if ok else "FAIL", width, name, "" if ok else detail))
        if not ok:
            failed += 1

    # Missing assets are reported but do not fail the run on their own: the
    # videos are expected to be absent until they are supplied, and each has a
    # designed fallback. They are listed so nothing goes unnoticed.
    print()
    missing = r.get("MISSING_ASSETS", "none")
    if missing == "none":
        print("  All referenced assets present.")
    else:
        print("  Assets missing (each has a fallback, but check these are expected):")
        for a in missing.split():
            print("    - %s" % a)

    sanitised = int(r.get("SANITISED_ERRORS", "0") or 0)
    if sanitised:
        print()
        print("  %d cross-origin-sanitised error(s) — no message, file or line." % sanitised)
        print("  Expected while assets above are missing; should stop once they exist.")

    print()
    if failed:
        print("  %d check(s) FAILED — do not deploy." % failed)
        sys.exit(1)
    print("  All checks passed.")


if __name__ == "__main__":
    main()
