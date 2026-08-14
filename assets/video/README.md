# Videos

The home screen expects two files here:

- `immigrant.mp4`
- `expat.mp4`

Until they exist, each panel falls back to showing its label, so the layout
stays reviewable.

## Encoding for the Raspberry Pi

Use **H.264 in an MP4 container**. A Pi 4 has hardware decode for H.264 but
software-decodes VP9 and AV1, which drops frames badly on a 4K portrait panel.

Both videos autoplay muted and loop, so keep them short and seamless.

Panels are 850 x 412 in design pixels and the video is cropped to fill
(`object-fit: cover`), so encode at that aspect ratio (~2.06:1) to avoid
losing anything important at the edges.

```sh
ffmpeg -i source.mov \
  -c:v libx264 -profile:v high -level 4.2 \
  -pix_fmt yuv420p -crf 22 -preset slow \
  -an -movflags +faststart \
  immigrant.mp4
```

`-an` strips audio: the panels are muted, and dropping the track saves the Pi
from decoding it. Remove that flag if these videos ever need sound.
