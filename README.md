# Quantum Compass — companion site

The explainer screen that sits next to the *Quantum Compass* installation: a
vertical touchscreen giving context on the double-slit experiment and on the
project. The live hand-gesture experience runs in a separate application; this
site is the reading material beside it.

Built from the Figma file `Quantum` → page *Booth / Comunicaciones*.

---

## What it is, technically

Static HTML, CSS and one plain JavaScript file. **No build step, no
dependencies, no Node, no bundler.** About 2 MB in total, nearly all of which
is one asset: `slide6.svg` embeds the rendered diffraction bitmap. Code and
markup together are under 60 KB.

It is written as classic `<script>` tags rather than ES modules, and it never
calls `fetch()`. That is deliberate: both of those are blocked by browser
security on `file://`, and avoiding them means the Pi can open the site as a
local file with no web server, no ports and no background service.

```
index.html            markup shell — deliberately contains no user-facing text
css/styles.css        all styling; every value is a literal Figma pixel
js/content.js         ALL copy, all three languages — the only file translators touch
js/app.js             rendering, navigation, language, kiosk hardening
assets/               logo, chevron, seven slide illustrations, About mark
fonts/                drop licensed .woff2 files here (see fonts/README.md)
tools/                re-export illustrations from Figma
```

All artwork is exported straight from Figma — nothing is hand-drawn. If the
design changes, re-run the exporter rather than editing SVGs by hand:

```sh
export FIGMA_TOKEN=figd_xxx        # Figma → Settings → Security
./tools/export-illustrations.sh
```

It overwrites all seven slide illustrations plus the About mark, with no code
change needed. The Figma node ids are recorded in the script. Note this uses
the Figma **REST API**, which has a separate quota from the MCP/plugin
integration — so it keeps working when the editor integration is rate-limited.

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
reflow: on a laptop you get a correctly-proportioned portrait panel with black
bars either side. That was the agreed trade-off — the public website will reuse
`js/content.js` with a different stylesheet rather than trying to make one
layout serve both.

---

## Outstanding items

### 1. Fonts — check the licence before shipping

The design uses **Obvia Narrow** and **TT Modernoir**. An Adobe Fonts
subscription may not be enough: desktop sync does not permit self-hosting, and
an Adobe *web project* loads from `use.typekit.net`, which needs a live
internet connection on every page load. An offline kiosk satisfies neither.

See `fonts/README.md`. This is the one item that cannot be fixed on site.

### 2. Translations are drafts

Only Spanish exists in the Figma file. The English and Catalan in
`js/content.js` were written for this build and are clearly marked as drafts.
**They need review before the installation opens** — particularly the credits
and the BSC / Creative Intelligence Lab descriptions, which should use each
organisation's own official wording rather than a translation.

### 3. Videos

`assets/video/immigrant.mp4` and `expat.mp4` are not present yet. Each panel
falls back to showing its label, so the layout stays reviewable. Encode as
H.264 — see `assets/video/README.md` for the reasoning and an ffmpeg command.

### 4. Institutional logos

The About footer currently shows the two organisation names as plain text
placeholders. Replace them in `buildAbout()` in `js/app.js` once the real logo
files are supplied.

---

## Two deliberate departures from the Figma file

1. **Slide 1 has a back arrow.** In the design it has only a forward arrow,
   which leaves a visitor unable to return to the home screen. Here it steps
   back to the home screen. Remove the `index === 0` branch in `buildSlide()`
   if you want the design's behaviour exactly.

2. **The home screen's asymmetric layout is reproduced as drawn** — the first
   text block sits in the left column, the second in the right column below the
   videos, leaving two quadrants empty. This looks like the least-finished
   screen in the file; if it was unintentional it is a small CSS change
   (`.home__block--one` / `--two`).

One transcription note: the Spanish body text on slide 2 reads *"y esas leyes
radicalmente distintas"*, which is missing a verb. It has been kept verbatim
and flagged in `js/content.js` rather than silently corrected.
