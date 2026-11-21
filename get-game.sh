#!/usr/bin/env bash
# Saves a local copy of the Black Hole Friday game modules (rules + drawing) next to the bot viewer.
# Run once from this folder:  bash get-game.sh
set -euo pipefail
BASE="https://blackholefriday.vollebak.com"
FILES=(
  bhf/game/core.js bhf/game/sim.js bhf/game/render.js bhf/game/skins.js bhf/game/kit.js bhf/game/danger.js
  bhf/game/coins.js bhf/game/portals.js bhf/game/critters.js bhf/game/bosskit.js bhf/game/home.js bhf/game/audio.js
  bhf/game/levels/neon.js bhf/game/levels/neon-art.js
  bhf/game/levels/ice.js bhf/game/levels/ice-art.js
  bhf/game/levels/hive.js bhf/game/levels/hive-art.js
  bhf/game/levels/code.js bhf/game/levels/code-art.js bhf/game/levels/code-boss.js bhf/game/levels/code-rig.js
  bhf/game/levels/desert.js bhf/game/levels/desert-art.js bhf/game/levels/desert-worm.js
  bhf/game/levels/tenet.js bhf/game/levels/tenet-duo.js bhf/game/levels/tenet-film.js bhf/game/levels/tenet-road.js
  bhf/chars.js bhf/lv-dune.js bhf/lv-gravity.js bhf/scenes.js bhf/lvkit.js bhf/portals.js
  rig.js font.js sprites.js music.js scenery.js decals.js sim.js logo-masks.js
)
for f in "${FILES[@]}"; do
  mkdir -p "$(dirname "$f")"
  echo "  $f"
  curl -fsSL "$BASE/$f" -o "$f"
done
echo
echo "Done. Now run:  python3 -m http.server 8000   and open http://localhost:8000"
