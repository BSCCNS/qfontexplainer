# Fonts

The design specifies **Obvia Narrow** (Light and Book) with **TT Modernoir**
for display use.

`css/styles.css` already has `@font-face` rules pointing at:

- `ObviaNarrow-Light.woff2`  (weight 300)
- `ObviaNarrow-Book.woff2`   (weight 400)

Drop those two files in this folder and the site picks them up with no other
change. Until then it falls back to a condensed grotesque stack, which is
close in proportion but not the real typeface.

## Important: an Adobe Fonts licence may not cover this

Adobe Fonts works two ways, and only one of them helps here:

- **Desktop sync** — lets you use the font in Figma, Illustrator, etc. It does
  **not** grant the right to convert the font to `.woff2` and self-host it.
- **Web project** — gives you an embed code that loads the font from
  `use.typekit.net`. This is licensed for web use, **but it requires a live
  internet connection every time the page loads.**

An offline kiosk therefore satisfies neither path cleanly:

| Situation | What to do |
|---|---|
| Pi has reliable internet | Use an Adobe Fonts web project; add its `<link>` to `index.html` |
| Pi is offline | You need a licence that permits self-hosting — buy the webfont from the foundry (TypeType for TT Modernoir; Obvia via its foundry) |

Check this before the installation ships. It is the one part of the build that
cannot be fixed on site.
