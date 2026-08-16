# Quantum Compass — companion site

The explainer screen that sits next to the *Quantum Compass* installation: a
vertical touchscreen giving context on the double-slit experiment and on the
project. The live hand-gesture experience runs in a separate application; this
site is the reading material beside it.

Built from the Figma file `Quantum` → page *Booth / Comunicaciones*.

---

## What it is, technically

Static HTML, CSS and one plain JavaScript file. **No build step, no
dependencies, no Node, no bundler.** Around 800 KB of runtime assets in total;
code and markup together are under 70 KB.

(The `tools/` scripts need Python and Pillow, but they only prepare artwork —
nothing the browser loads depends on them.)

It is written as classic `<script>` tags rather than ES modules, and it never
calls `fetch()`. That is deliberate: both of those are blocked by browser
security on `file://`, and avoiding them means the Pi can open the site as a
local file with no web server, no ports and no background service.

```
index.html            markup shell — deliberately contains no user-facing text
css/styles.css        all styling; every value is a literal Figma pixel
js/content.js         ALL copy, all three languages — the only file translators touch
js/app.js             rendering, navigation, language, screensaver, kiosk hardening
assets/               logo, chevron, illustrations, cat, logo lockup
fonts/                drop licensed .woff2 files here (see fonts/README.md)
tools/                sync copy and re-export/animate artwork from Figma
```

All artwork is exported straight from Figma — nothing is hand-drawn. If the
design changes, re-run the exporter rather than editing SVGs by hand:

```sh
export FIGMA_TOKEN=figd_xxx        # Figma → Settings → Security
./tools/export-illustrations.sh
```

It overwrites all seven slide illustrations, the cat, the About mark and the
logo lockup, with no code change needed. The Figma node ids are recorded in the
script.

### If the export is rate-limited

The REST API has a modest quota that repeated exports exhaust, and it returns
`429 Rate limit exceeded` for a while afterwards. Exporting from the **Figma
app** does not use that quota at all, so you can always fall back to it:

1. In Figma, select the illustration group inside a screen — the drawing
   itself, *not* the whole `Experimento N` frame (the site draws the text,
   arrows and header itself).
2. In the right-hand **Export** panel choose **SVG**, then export.
3. Repeat for all seven, plus `Group 82` (the cat), into one folder.
4. Run:

```sh
./tools/import-manual-export.py ~/Downloads/figma-export
```

Filenames do not matter. The script identifies each file by what is inside it
(embedded bitmap, wave gradients, path count), prints what it decided so you
can check, strips Figma's canvas-coloured background rect, files everything
under the right name and re-applies the wavefront animation. Add `--dry-run`
to see the mapping without writing anything.

Three of the slides are told apart by comparing them against each other
(slide 3 vs 4, 6 vs 7, 1 vs 5), so export both members of a pair together — on
its own, the script will say it cannot tell which is which rather than guess.

### Bitmap optimisation

Two slides show a rendered diffraction pattern rather than line art, and Figma
embeds it as a 3600 x 2338 lossless PNG — about 2x more pixels than the largest
display can show, in the worst format for photographic content. Together they
were 7.5 MB.

`tools/optimise-illustrations.py` resamples to 1800px and re-encodes as JPEG,
which takes the pair to **355 KB — a 95% reduction** at 46.6 dB PSNR (measured
by rendering at kiosk size before and after; above 40 dB is generally taken as
visually lossless). Images with an alpha channel stay PNG.

Both export paths run it automatically, because the export overwrites the SVGs.
It skips anything already optimised — re-encoding an existing JPEG on every
export would accumulate generation loss.

```sh
./tools/optimise-illustrations.py --check          # report, change nothing
./tools/optimise-illustrations.py --max-px 1400 --quality 78
```

To check whether the Spanish copy has drifted from Figma:

```sh
./tools/sync-text.py               # reports exactly which strings changed
```

It never rewrites `content.js` automatically, because the English and Catalan
sit alongside the Spanish and would silently go stale.

---

## Running it

Open `index.html` in a browser. That is the whole procedure.

For development, any static server works if you prefer one:

```sh
python3 -m http.server 8777    # then visit http://localhost:8777
```

**Keyboard shortcuts** (for reviewing on a laptop, and for a presenter remote):
`←` / `→` step through slides, `Esc` returns to the home screen.

---

## Deploying to the Raspberry Pi

Copy the folder across and point Chromium at it:

```sh
rsync -av --delete ./ pi@raspberrypi.local:~/quantum-compass/
```

Then on the Pi, autostart Chromium in kiosk mode. Create
`~/.config/autostart/quantum.desktop`:

```ini
[Desktop Entry]
Type=Application
Name=Quantum Compass
Exec=chromium-browser --kiosk --incognito --noerrdialogs --disable-infobars --check-for-update-interval=31536000 file:///home/pi/quantum-compass/index.html
X-GNOME-Autostart-enabled=true
```

Notes for the venue:

- `--incognito` means a visitor cannot accumulate history or leave state behind.
- `--check-for-update-interval` stops Chromium interrupting the installation
  with an update prompt mid-festival.
- Screen blanking should be disabled (`xset s off -dpms`, or via
  `raspi-config`), otherwise the panel sleeps during quiet periods.
- **Fixing a typo on site** needs no laptop and no rebuild: edit
  `js/content.js` over SSH and refresh the page.

### Rotating the display

The design is portrait 9:16. If the panel reports landscape, rotate at the OS
level (`display_rotate=1` in `/boot/config.txt`, or Screen Configuration on
Raspberry Pi OS Bookworm) rather than in CSS — the browser then reports the
right viewport and the layout scales correctly on its own.

---

## Behaviour

**Navigation.** The logo, top-left on every screen, is the home button. Slides
also have prev/next chevrons; the About screen relies on the logo alone.

**Screensaver.** After two minutes of inactivity an attract loop takes over:
the diffraction video full-bleed with the two institutional logos at the
bottom (Figma "Group 81"). Any touch dismisses it and returns to the home
screen, so every visitor starts from the same place rather than halfway
through what the last person was reading.

Tune the delay without editing `app.js` by setting a global before it loads,
in `index.html`:

```html
<script>window.QC_IDLE_MS = 90000;</script>   <!-- 90 seconds -->
```

**Animated wavefronts.** On slides 3 and 4 the gold arcs pulse outward from
each slit. The animation is CSS living *inside* the SVG files, not in the page:
an SVG loaded through `<img>` still runs declarative animation, so this needs
no JavaScript, no `fetch()`, and does not disturb the `file://` deployment.

Because `export-illustrations.sh` overwrites the artwork, the animation is
re-applied afterwards by `tools/animate-illustrations.py` (the export script
calls it automatically). That script derives the geometry — how many wavefront
sets there are and the point each expands from — by solving from the arc
bounding boxes, so the artwork can be redrawn in Figma and re-exported without
anyone editing code. Run `./tools/animate-illustrations.py --check` to verify
the committed SVGs are up to date.

---

## Smoke test before deploying

```sh
./tools/smoke-test.py
```

It opens the real `index.html` over `file://` — exactly how the Pi loads it, no
web server — drives the whole site, and reports pass/fail on 18 checks. Exits
non-zero on failure, so it can gate a deploy.

It covers: the licensed fonts are present, loaded and actually in use; the kiosk
layout is selected and cannot scroll; all seven slides, home and about render;
the seven illustrations load; the wavefront animation survived the last export;
the logo returns home; all three languages switch; the attract loop appears when
idle; and there are no JavaScript errors. Missing assets are listed separately
rather than failed, since the videos are expected to be absent until supplied.

**One trap it exists to catch.** If Obvia Narrow is installed on the machine you
are testing from — likely, since it is a licensed desktop font the designers
use — the site will look perfectly correct even when the web fonts are broken,
because the browser quietly resolves the family from the system. The Pi has no
such fallback and would render in the substitute face. The "Fonts declared and
loaded" check reads the actual `FontFace` status and is the one that catches
this; a visual check on a designer's machine cannot.

### On the panel itself

The automated test cannot see the real hardware, so once it is running on the Pi:

1. **Portrait and full-bleed** — no black bars, no browser chrome, no scrollbar.
2. **Type looks like the design** — headings condensed, not a generic sans. If
   in doubt, compare the About heading against Figma.
3. **Touch** — the logo returns home from any screen; chevrons move between
   slides; the language pills switch; nothing shows a text-selection highlight
   or a zoom on double-tap.
4. **Wavefronts move** on slides 3 and 4.
5. **Leave it alone for two minutes** — the attract loop should appear, and one
   touch should dismiss it back to the home screen.
6. **Leave it running for an hour** before opening — this is where a slow memory
   leak or a Chromium update prompt would show up, not in the first minute.

---

## Two layouts, one set of files

The same markup, content and scripts serve two very different displays:

| | kiosk | fluid |
|---|---|---|
| Where | the installation touchscreen | phones, tablets, desktop |
| Layout | fixed 2227.5 x 3960 canvas, scaled to fit | reflows |
| Attract loop | after 2 min idle | never |
| Cursor | hidden | normal |
| Pinch-zoom | blocked | allowed |
| Text selection | off | on |
| Scrolling | locked | normal |

`js/app.js` picks one at load and again on resize, putting `.layout-kiosk` or
`.layout-fluid` on `<body>`. The installation panel is the only display that is
both portrait and enormous, so that combination selects the kiosk; everything
else gets the fluid layout. Force either for testing:

```
index.html?layout=kiosk
index.html?layout=fluid
```

`css/styles.css` holds the kiosk layout and `css/responsive.css` the fluid one,
every rule scoped under `.layout-fluid`. Nothing in `responsive.css` can affect
the installation — a deliberate split, so work on the website cannot break the
thing that has to run unattended at a festival.

### How the fluid layout works

There are only two real breakpoints; everything between them is handled by
`clamp()`, so type and spacing scale continuously rather than jumping.

- **60rem (960px)** — the slide splits into two columns, reading on the left and
  the drawing on the right. Below it, everything stacks.
- **Short landscape** (`max-height: 34rem`) — phones held sideways also get two
  columns, because there height is the scarce dimension, not width.

### The annotated diagram

The callout labels are the hard part of making this responsive. They are
positioned as percentages of the illustration box rather than in canvas pixels,
so the drawing and its labels scale as one unit. On the kiosk this renders
identically to before — the percentages were derived from the design
coordinates and land within 0.1px of them.

That still leaves legibility: a 24px label inside a 1626px drawing becomes
**5.8px** on a 390px phone, which is well past reading size. So below 60rem the
words on the drawing are replaced by numbered markers, with a legend underneath
that decodes them. Above it, the words sit on the drawing as designed.

Swipe left/right moves between slides on touch devices.

---

## How the layout works

Everything is authored at the Figma canvas size — **2227.5 × 3960**, a 9:16
portrait panel — and scaled to fit whatever display it lands on:

```js
scale = min(viewportWidth / 2227.5, viewportHeight / 3960)
```

So every measurement in `styles.css` is the literal number you can read off the
Figma file. Nothing has been converted to rems or percentages, which keeps the
stylesheet and the design file directly comparable.

The consequence is that it is pixel-faithful at any size but does **not**
reflow: on a laptop in kiosk mode you get a correctly-proportioned portrait
panel with black bars either side. Every other display gets the fluid layout
described above.

---

## Outstanding items

### 1. Translations are drafts

Only Spanish exists in the Figma file. The English and Catalan in
`js/content.js` were written for this build and are clearly marked as drafts.
**They need review before the installation opens** — particularly the credits
and the BSC / Creative Intelligence Lab descriptions, which should use each
organisation's own official wording rather than a translation.

### 2. Videos

Three files are still missing:

| File | Used by | Fallback while absent |
|---|---|---|
| `assets/video/immigrant.mp4` | home screen, left panel | panel shows its label |
| `assets/video/expat.mp4` | home screen, right panel | panel shows its label |
| `assets/video/screensaver.mp4` | attract loop | still poster image |

Encode as H.264 — see `assets/video/README.md` for the reasoning and an ffmpeg
command.

### 3. Institutional logos and the cat

`assets/cat.svg` is still missing, so the cat does not appear on slides 1 and 2.
It hides itself rather than showing a broken image. One export from Figma
(node `1007:34`) fixes it.

---

## Departures from the Figma file

1. **Slide 1 has a back arrow.** In the design it has only a forward arrow,
   which leaves a visitor unable to return. Here it steps back to the home
   screen. Remove the `index === 0` branch in `buildSlide()` for the design's
   behaviour exactly.

2. **The About screen has no back arrow** — requested. The logo covers it.

3. **The home screen's asymmetric layout is reproduced as drawn** — the first
   text block sits in the left column, the second in the right column below the
   videos, leaving two quadrants empty. This looks like the least-finished
   screen in the file; if it was unintentional it is a small CSS change
   (`.home__block--one` / `--two`).

Layout note: the BSC heading on the About screen wraps to three lines with the
fallback font, where the design has two. Obvia Narrow is a condensed face and
should pull it back to two — worth re-checking with the real fonts installed.
