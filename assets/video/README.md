# Videos

Three files are expected here:

- `immigrant.mp4` — home screen, left panel
- `expat.mp4` — home screen, right panel
- `screensaver.mp4` — the attract loop shown after two minutes of inactivity

Until they exist, each home panel falls back to showing its label and the
screensaver falls back to `assets/screensaver-poster.png`, so the layout stays
reviewable.

## Encoding for the Raspberry Pi

Use **H.264 in an MP4 container**. A Pi 4 has hardware decode for H.264 but
software-decodes VP9 and AV1, which drops frames badly on a 4K portrait panel.

Both videos autoplay muted and loop, so keep them short and seamless.

The home panels are 850 x 412 in design pixels and the video is cropped to fill
(`object-fit: cover`), so encode at that aspect ratio (~2.06:1) to avoid losing
anything important at the edges. The screensaver is full-bleed portrait and
also cropped to fill, so encode it 9:16 to match the panel.

```sh
ffmpeg -i source.mov \
  -c:v libx264 -profile:v high -level 4.2 \
  -pix_fmt yuv420p -crf 22 -preset slow \
  -an -movflags +faststart \
  immigrant.mp4
```

`-an` strips audio: the panels are muted, and dropping the track saves the Pi
from decoding it. Remove that flag if these videos ever need sound.
