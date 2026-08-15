#!/usr/bin/env bash
#
# Re-export the slide illustrations from Figma.
#
# Five of the seven illustrations in assets/illustrations/ are placeholders:
# they show the correct apparatus, but not the beam / wavefront / interference
# layers the designer drew on top. That happened because the Figma MCP export
# quota (Starter plan) ran out partway through the first build.
#
# Run this once the quota has reset, or from an account on a paid plan.
#
# Requires: a Figma personal access token with file_read scope.
#   export FIGMA_TOKEN=figd_xxx
#   ./tools/export-illustrations.sh
#
# Get a token at: Figma -> Settings -> Security -> Personal access tokens

set -euo pipefail

FILE_KEY="4papmm6d7DRslpAvtpFPNd"
OUT_DIR="$(cd "$(dirname "$0")/.." && pwd)/assets"

if [[ -z "${FIGMA_TOKEN:-}" ]]; then
  echo "error: FIGMA_TOKEN is not set." >&2
  echo "  export FIGMA_TOKEN=figd_xxx   # Figma > Settings > Security" >&2
  exit 1
fi

# output path (relative to assets/, no .svg) : Figma node id
# Node ids contain a colon, so only the FIRST colon separates the two fields.
NODES=(
  "illustrations/slide1:1021:365"
  "illustrations/slide2:1021:452"
  "illustrations/slide3:1021:540"
  "illustrations/slide4:1021:641"
  "illustrations/slide5:1021:758"
  "illustrations/slide6:1024:83"
  "illustrations/slide7:1027:126"
  # Small drawn mark on the About screen. app.js hides it while missing.
  "about-mark:983:989"
  # The same mark placed over the illustration on slides 1 and 2.
  "cat:1007:34"
  # Institutional logo lockup, used by the About footer and the screensaver.
  "logos-lockup:1000:3"
)

# Figma's image endpoint takes comma-separated ids and returns a JSON map of
# id -> temporary S3 url, so this is one API call plus one download per asset.
ids=""
for entry in "${NODES[@]}"; do
  node="${entry#*:}" # everything after the first colon; node ids contain one too
  ids+="${node},"
done
ids="${ids%,}"

echo "Requesting SVG exports for ${#NODES[@]} nodes..."
response=$(curl -sS -H "X-Figma-Token: ${FIGMA_TOKEN}" \
  "https://api.figma.com/v1/images/${FILE_KEY}?ids=${ids}&format=svg")

if echo "$response" | grep -q '"err":[^n]'; then
  echo "error: Figma API returned an error:" >&2
  echo "$response" >&2
  exit 1
fi

for entry in "${NODES[@]}"; do
  name="${entry%%:*}"
  node="${entry#*:}"
  out="${OUT_DIR}/${name}.svg"

  url=$(python3 -c "
import json,sys
d=json.load(sys.stdin)
print(d.get('images',{}).get('$node') or '')
" <<<"$response")

  if [[ -z "$url" ]]; then
    echo "  ${name}: no URL returned for node ${node} — skipped" >&2
    continue
  fi

  curl -sS -L -o "$out" "$url"

  # Figma wraps exports in a canvas-coloured rect; strip it so the artwork sits
  # on the page's own black background.
  python3 - "$out" <<'PY'
import re, sys
p = sys.argv[1]
s = open(p).read()
s = re.sub(r'<rect width="\d+" height="\d+" fill="#BEBABA"/>\n?', '', s)
open(p, 'w').write(s)
PY

  echo "  ${name}.svg  <- ${node}"
done

# The wavefront animation lives outside the exported files (see that script's
# header for why), so re-apply it now that the artwork has been overwritten.
if [[ -x "$(dirname "$0")/animate-illustrations.py" ]]; then
  echo "Re-applying wavefront animation..."
  "$(dirname "$0")/animate-illustrations.py"
fi

echo "Done. Reload the page to see them."
