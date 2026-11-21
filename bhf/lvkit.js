// Shared kit for the extra Black Hole Friday levels (bhf/lv-*.js): one import line per level file.
// Each level file exports build(A, n) -> { meta, level(ctx, f), cards: [...] }.
export { MATS, cap, ell, poly, heroShapes, scaleShapes, bruteShapes, goblinShapes, ghoulShapes, scientistShapes, bikerShapes, slimeShapes } from '../rig.js';
export { R, P, add, dir, cv, frames, put, flip, flipV, tint, hash, TAU, recolor, crinkle, soldierShapes } from './chars.js';
export { W, H, GY, dith, pix, blackHole, hud, rng, tile, rect, putC, stars, drawStars, sparks, COPPER } from './scenes.js';
export { drawText, GRAD } from '../font.js';
import { pix, dith } from './scenes.js';

// a dithered disc: light from the top left, pal runs light -> dark
export const disc = (r, pal, rim = null) => pix(r * 2 + 1, r * 2 + 1, (i, j) => {
  const x = i - r, y = j - r, d = Math.hypot(x, y); if (d > r + 0.3) return null;
  if (rim && d > r - 1) return rim;
  return dith(pal, Math.min(1, (d / r) * 0.6 + (x + y) / (r * 4) + 0.35), i, j);
});
// a vertical sky gradient the size of the screen
export const skyGrad = (pal, span = 130) => pix(320, 160, (i, j) => dith(pal, j / span, i, j));
// a strip of hills or dunes, 640 wide, tiling: amp height, cols light -> dark
export const ridge = (seed, amp, cols, h, rough = 0) => pix(640, h, (i, j) => {
  const t = (i / 640) * Math.PI * 2;
  const top = h - amp * (0.55 + 0.25 * Math.sin(t * 2 + seed) + 0.2 * Math.sin(t * 5 + seed * 3)) - (rough ? (Math.sin(i * 0.9 + seed) > 0.6 ? rough : 0) : 0);
  if (j < top) return null; return dith(cols, (j - top) / (h - top + 1), i, j);
});
