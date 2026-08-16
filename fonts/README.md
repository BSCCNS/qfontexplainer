# Fonts

**Supplied and wired up.** The site uses the licensed Obvia Narrow.

| File | Weight | Used for |
|---|---|---|
| `ObviaNarrow-Light.woff2` | 300 | body copy |
| `ObviaNarrow-Book.woff2` | 400 | headings, buttons, labels |

The `.otf` files are the originals as delivered; the `.woff2` are converted from
them and are what the browser loads. woff2 is about 40% smaller and is the only
format the CSS references — keep the originals, but the site does not read them.

To regenerate the woff2 after replacing an original, with `fonttools` installed:

    python3 -c "
    from fontTools.ttLib import TTFont
    for src, dst in [('Obvia_Narrow_Light.otf', 'ObviaNarrow-Light.woff2'),
                     ('obvia-narrow.otf',       'ObviaNarrow-Book.woff2')]:
        f = TTFont(src); f.flavor = 'woff2'; f.save(dst)
    "

Both faces cover every accented character the Spanish, Catalan and English copy
needs, including Catalan's `l·l` and `à` / `è` / `ò`.

## The trap when testing

If Obvia Narrow is installed on your Mac — likely, since it is a licensed
desktop font the designers use — the browser resolves the family from the system
even when the `@font-face` files are missing or broken. The site then looks
completely correct on your machine and wrong on the Pi, which has no such
fallback.

`tools/smoke-test.py` checks the actual `FontFace` load status rather than
appearance, which is the only reliable way to catch this. Run it before
deploying.

## Line height

Figma sets every text style to the font's *intrinsic* line height, which for
Obvia Narrow is a 1.0 ratio — 30px at 30px, 48px at 48px. `--lh-body` in
`css/styles.css` matches that. It is not an arbitrary choice: a looser value
makes every paragraph taller than the design and pushes slide 1's body into the
illustration.

## TT Modernoir

The style guide also lists TT Modernoir for display use. Nothing in the built
screens currently calls for it — the titles use Obvia Narrow Book, which is what
the Figma frames actually specify. If a screen is added that needs it, the same
`@font-face` pattern applies.
