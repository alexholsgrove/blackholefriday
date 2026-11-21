// Vollebak logos dotted through each level: graffiti, painted stencils, neon signs, banners, a billboard.
// Cosmetic only (drawn by render.js after the wall layer); positions are fixed per zone, so every run
// sees the same ones. Both logo states from the vollebak.com header: the VOLLEBAK wordmark and the V.
import { LOGO } from './logo-masks.js';
import { FP, W, ZONE_PX, ZONES, zoneOf } from './sim.js';

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const rng = (seed) => { let s = (seed * 2654435761) >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
// lean a mask over (graffiti is never level): shift each row sideways, crisp, no smoothing
function shear(mask, slope) {
  if (!slope) return mask;
  const h = mask.length, raw = mask.map((_, y) => Math.round((h - 1 - y) * slope)), lo = Math.min(...raw), shifts = raw.map((v) => v - lo), max = Math.max(...shifts);
  return mask.map((r, y) => '.'.repeat(shifts[y]) + r + '.'.repeat(max - shifts[y]));
}
const onOf = (m) => (x, y) => y >= 0 && y < m.length && x >= 0 && x < m[0].length && m[y][x] === '#';
const near = (on, x, y, d) => { for (let j = -d; j <= d; j++) for (let i = -d; i <= d; i++) if (on(x + i, y + j)) return true; return false; };

// spray paint: overspray, dark outline, two-tone fill, top highlights, drips
function spray(mask, { a, b, line = '#12091a', hi = '#ffffff', slope = 0, seed = 1 }) {
  const m = shear(mask, slope), h = m.length, w = m[0].length, P = 3, on = onOf(m), r = rng(seed);
  const c = mk(w + P * 2, h + P * 2 + 8), g = c.getContext('2d'), px = (x, y, col, al = 1) => { g.globalAlpha = al; g.fillStyle = col; g.fillRect(x + P, y + P, 1, 1); };
  for (let i = 0; i < (w * h) / 5; i++) { const x = Math.floor(r() * (w + 4)) - 2, y = Math.floor(r() * (h + 4)) - 2; if (!on(x, y) && near(on, x, y, 2)) px(x, y, a, 0.35); }
  for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) if (!on(x, y) && near(on, x, y, 1)) px(x, y, line);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (on(x, y)) {
    const t = y / (h - 1), col = t < 0.45 ? a : t > 0.6 ? b : (x + y) % 2 ? a : b;
    px(x, y, !on(x, y - 1) && x % 3 === 0 ? hi : col);
  }
  for (let x = 0; x < w; x++) {
    let y = h - 1; while (y >= 0 && !on(x, y)) y--;
    if (y < h * 0.5 || on(x, y + 1) || r() > 0.2) continue;
    const len = 2 + Math.floor(r() * 6);
    for (let k = 1; k <= len; k++) px(x, y + k, b);
    px(x, y + len + 1, line);
  }
  return c;
}
// painted / chalk stencil: one flat colour, worn patches, no outline
function paint(mask, { col, alpha = 0.8, wear = 0.14, slope = 0, seed = 1 }) {
  const m = shear(mask, slope), h = m.length, w = m[0].length, on = onOf(m), r = rng(seed);
  const c = mk(w, h), g = c.getContext('2d'); g.fillStyle = col; g.globalAlpha = alpha;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (on(x, y) && r() > wear) g.fillRect(x, y, 1, 1);
  return c;
}
// small neon tubes bolted to the wall: brackets, dim tinted glass, glow spilling onto the wall
// (no backing box); [lit, flickered-off]
function neon(mask, { glow, core, dim = 0.8 }) {
  const h = mask.length, w = mask[0].length, on = onOf(mask), P = 5;
  const build = (lit) => {
    const c = mk(w + P * 2, h + P * 2 + 3), g = c.getContext('2d');
    if (lit) for (let r = 5; r >= 1; r--) { g.globalAlpha = 0.035; g.fillStyle = glow; g.fillRect(P - r, P - r + 3, w + r * 2, h + r * 2); }
    g.globalAlpha = 1; g.fillStyle = '#5a5a6a';   // two wall brackets and the wire between them
    for (const bx of [P + 4, P + w - 6]) { g.fillRect(bx, 0, 2, 4); g.fillRect(bx - 1, 0, 4, 1); }
    g.fillStyle = '#2a2a36'; g.fillRect(P + 5, 1, w - 10, 1);
    for (let y = -1; y < h + 1; y++) for (let x = -1; x < w + 1; x++) {
      if (on(x, y)) { g.globalAlpha = lit ? dim : 0.3; g.fillStyle = lit ? core || glow : shade(shade(glow)); }
      else if (lit && near(on, x, y, 1)) { g.globalAlpha = 0.25; g.fillStyle = glow; }
      else continue;
      g.fillRect(x + P, y + P + 3, 1, 1);
    }
    return c;
  };
  return [build(true), build(false)];
}
// an old painted mural: the level's own tint, faded, peeling in patches, grimier towards the bottom
function mural(mask, { col, alpha = 0.4, seed = 1, peel = 6 }) {
  const h = mask.length, w = mask[0].length, on = onOf(mask), r = rng(seed);
  const holes = Array.from({ length: peel }, () => [r() * w, r() * h, 1 + r() * 3]);
  const c = mk(w, h + 1), g = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!on(x, y) || holes.some(([hx, hy, hr]) => (x - hx) ** 2 + (y - hy) ** 2 < hr * hr) || r() < 0.08) continue;
    g.globalAlpha = alpha * (1 - 0.45 * (y / h)); g.fillStyle = col; g.fillRect(x, y, 1, 1);
    if (!on(x, y + 1)) { g.globalAlpha = alpha * 0.35; g.fillStyle = '#000'; g.fillRect(x, y + 1, 1, 1); }
  }
  return c;
}
// cloth banner on a rod with a swallow-tail, logo as the emblem
function banner(mask, { cloth, trim, emblem }) {
  const h = mask.length, w = mask[0].length, on = onOf(mask), bw = w + 8, bh = h + 18;
  const c = mk(bw + 4, bh + 2), g = c.getContext('2d');
  g.fillStyle = '#6a4a2a'; g.fillRect(0, 0, bw + 4, 2); g.fillStyle = '#a07040'; g.fillRect(0, 0, bw + 4, 1);
  for (let y = 0; y < bh; y++) {
    const tail = y - (bh - 7);   // the last 6 rows are cut into a swallow-tail
    for (let x = 0; x < bw; x++) {
      if (tail > 0 && Math.abs(x - (bw - 1) / 2) < tail * (bw / 12)) continue;
      const edge = x === 0 || x === bw - 1 || y === 0;
      g.fillStyle = edge ? trim : (x % 4 === 0 ? shade(cloth) : cloth); g.fillRect(x + 2, y + 2, 1, 1);
    }
  }
  g.fillStyle = emblem;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (on(x, y)) g.fillRect(x + 6, y + 7, 1, 1);
  return c;
}
const shade = (hex) => '#' + hex.slice(1).match(/../g).map((p) => Math.round(parseInt(p, 16) * 0.8).toString(16).padStart(2, '0')).join('');

// a solid sign with the wordmark on it: steel plate (factory), stone plaque, wooden board, pasted poster.
// Fully opaque, with a 1px drop shadow on the wall so it reads as an object fixed to the wall.
function plate(mask, { kind, ink, seed = 1 }) {
  const h = mask.length, w = mask[0].length, on = onOf(mask), r = rng(seed), PX = 6, PY = 5, bw = w + PX * 2, bh = h + PY * 2 + (kind === 'steel' ? 3 : 0);
  const c = mk(bw + 1, bh + 1), g = c.getContext('2d'), px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); };
  g.fillStyle = 'rgba(0,0,0,0.45)'; g.fillRect(1, 1, bw, bh);   // shadow on the wall
  const torn = (x, y) => kind === 'poster' && (x === 0 || y === 0 || x === bw - 1 || y === bh - 1) && r() < 0.35;
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    if (torn(x, y)) continue;
    const edge = x === 0 || y === 0 || x === bw - 1 || y === bh - 1;
    let col;
    if (kind === 'steel') col = edge ? '#121418' : y === 1 ? '#6a7480' : y >= bh - 4 && y < bh - 1 ? (((x + y) >> 1) % 2 ? '#e8c020' : '#16161a') : y > bh - 6 ? '#2a3038' : '#3a424c';
    else if (kind === 'wood') col = edge ? '#24160c' : y % 6 === 0 ? '#3a2414' : (x * 7 + y * 3) % 11 === 0 ? '#4e3220' : y % 6 === 1 ? '#7a5232' : '#5e3e24';
    else if (kind === 'stone') col = edge ? '#1a1624' : x === 1 || y === 1 ? '#7a7090' : x === bw - 2 || y === bh - 2 ? '#2e2a3a' : (x * 5 + y * 3) % 13 === 0 ? '#4e4860' : '#585270';
    else col = (x * 3 + y * 7) % 17 === 0 ? '#b8a880' : y > bh - 5 && r() < 0.3 ? '#a89870' : '#d4c49c';   // poster paper, a little stained
    px(x, y, col);
  }
  if (kind === 'steel') for (const [x, y] of [[2, 2], [bw - 3, 2], [2, bh - 6], [bw - 3, bh - 6], [bw >> 1, 2]]) { px(x, y, '#a8b0bc'); px(x, y + 1, '#5a3a24'); px(x, y + 2, '#6a4628'); }   // rivets + rust streaks
  if (kind === 'wood') for (const [x, y] of [[2, 2], [bw - 3, 2], [2, bh - 3], [bw - 3, bh - 3]]) px(x, y, '#b0b0b8');   // nails
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (!on(x, y)) continue;
    if (kind === 'stone') { px(x + PX, y + PY, ink); if (!on(x, y + 1)) px(x + PX, y + PY + 1, '#8a80a0'); continue; }   // carved: dark cut, lit lower lip
    if ((kind === 'wood' || kind === 'poster') && r() < 0.06) continue;   // worn paint
    px(x + PX, y + PY, ink);
  }
  return c;
}

// per level: x = world px into the zone, y = world y of the top edge.
// The Vs are loud (graffiti, banners); the wordmarks sit on modest, solid signs fixed to a wall.
const DECALS = {
  bridge: [
    { x: 620, y: 116, k: 'spray', m: 'V30', o: { a: '#ff2d7a', b: '#ffd21a', slope: 0.2, seed: 3 } },
    { x: 1880, y: 120, k: 'plate', m: 'W10', o: { kind: 'stone', ink: '#24202e' } },
    { x: 3150, y: 110, k: 'spray', m: 'V38', o: { a: '#5fff6a', b: '#1fae4a', slope: -0.15, seed: 11 } },
    { x: 4150, y: 122, k: 'plate', m: 'W10', o: { kind: 'poster', ink: '#8a1a3a', seed: 5 } },
  ],
  dungeon: [
    { x: 560, y: 124, k: 'plate', m: 'W10', o: { kind: 'wood', ink: '#e0d0a8', seed: 2 } },
    { x: 1750, y: 116, k: 'spray', m: 'V30', o: { a: '#ff3a2a', b: '#a01020', slope: 0.2, seed: 9 } },
    { x: 2950, y: 128, k: 'plate', m: 'W10', o: { kind: 'wood', ink: '#e8b040', seed: 4 } },
    { x: 4050, y: 108, k: 'paint', m: 'V38', o: { col: '#e8e4d0', alpha: 0.6, seed: 6 } },
  ],
  // volcano: nothing on the ground. It's open rock with no wall to paint on, so anything there floats;
  // the user also felt the wordmark was out of place there. The blimp still crosses its sky.
  factory: [
    { x: 430, y: 124, k: 'plate', m: 'W10', o: { kind: 'steel', ink: '#d8e0c8' } },
    { x: 1520, y: 128, k: 'paint', m: 'V30', o: { col: '#ffd21a', alpha: 0.85, wear: 0.06, seed: 12 } },
    { x: 2780, y: 128, k: 'plate', m: 'W10', o: { kind: 'poster', ink: '#1a3a22', seed: 13 } },
    { x: 3980, y: 96, k: 'neon', m: 'V30', o: { glow: '#ff2d7a', core: '#ffc0d8', dim: 0.85 } },
  ],
  castle: [
    { x: 700, y: 104, k: 'banner', m: 'V22', o: { cloth: '#14121c', trim: '#ffd21a', emblem: '#ffd21a' } },
    { x: 1980, y: 124, k: 'plate', m: 'W10', o: { kind: 'stone', ink: '#1c2030' } },
    { x: 3300, y: 104, k: 'banner', m: 'V22', o: { cloth: '#7a1424', trim: '#ffffff', emblem: '#ffffff' } },
    { x: 4300, y: 118, k: 'spray', m: 'V30', o: { a: '#ff2d7a', b: '#ffe14a', slope: -0.2, seed: 15 } },
  ],
};
const MAKE = { spray: (m, o) => [spray(m, o)], paint: (m, o) => [paint(m, o)], banner: (m, o) => [banner(m, o)], mural: (m, o) => [mural(m, o)], plate: (m, o) => [plate(m, o)], neon };
const cache = new Map();
function art(d) { if (!cache.has(d)) cache.set(d, MAKE[d.k](LOGO[d.m], d.o)); return cache.get(d); }

export function drawDecals(ctx, s, A, Y, f) {
  const z0 = zoneOf(s.dist);
  for (const zi of [z0, z0 + 1]) {
    const list = DECALS[A.zones[((zi % ZONES) + ZONES) % ZONES].style];
    if (!list) continue;
    for (const d of list) {
      const x = Math.round(((zi * ZONE_PX + d.x) * FP - s.dist) / FP);
      if (x > W + 8 || x < -160) continue;
      const imgs = art(d);
      ctx.drawImage(d.k === 'neon' && ((f + d.x) % 131 < 4 || (f + d.x) % 131 === 7) ? imgs[1] : imgs[0], x, Y(d.y));
    }
  }
}

// ---- the VOLLEBAK blimp: drifts across the far sky now and then (every ~70 s of play, ~27 s to cross)
let blimpArt = null;
function buildBlimp() {
  const BW = 78, BH = 22, c = mk(BW + 12, BH + 10), g = c.getContext('2d'), cx = 6 + BW / 2, cy = BH / 2 + 1;
  const inBody = (x, y) => ((x - cx) / (BW / 2)) ** 2 + ((y - cy) / (BH / 2)) ** 2 <= 1;
  // tail fins (right-hand end; the art is flipped when it flies the other way)
  g.fillStyle = '#5a1420'; for (let k = 0; k < 7; k++) { g.fillRect(BW - 2 + k, cy - 4 - k, 3, 2); g.fillRect(BW - 2 + k, cy + 2 + k, 3, 2); }   // swept fins
  g.fillStyle = '#8a2030'; g.fillRect(BW + 2, cy - 2, 7, 4);
  for (let y = 0; y < BH + 2; y++) for (let x = 0; x < BW + 12; x++) {
    if (!inBody(x, y)) continue;
    const edge = !inBody(x - 1, y) || !inBody(x + 1, y) || !inBody(x, y - 1) || !inBody(x, y + 1), t = (y - 1) / BH;
    g.fillStyle = edge ? '#16141e' : t < 0.25 ? '#b4b2c4' : t < 0.6 ? '#8a889c' : t < 0.82 ? '#646278' : '#46445a';
    if (!edge && (x - 6) % 13 === 0 && t > 0.15) g.fillStyle = '#76748a';   // envelope panel seams
    g.fillRect(x, y, 1, 1);
  }
  g.fillStyle = '#2a2836'; g.fillRect(cx - 9, BH + 2, 16, 5); g.fillStyle = '#16141e'; g.fillRect(cx - 9, BH + 6, 16, 1);
  g.fillStyle = '#ffd27a'; for (let i = 0; i < 4; i++) g.fillRect(cx - 7 + i * 4, BH + 3, 2, 2);   // lit gondola windows
  const flip = mk(c.width, c.height), fg = flip.getContext('2d'); fg.translate(c.width, 0); fg.scale(-1, 1); fg.drawImage(c, 0, 0); fg.setTransform(1, 0, 0, 1, 0, 0);
  // the lettering goes on after the flip, so it reads the right way whichever way the blimp flies
  const m = LOGO.W7, on = onOf(m), oy = Math.round(cy - 3);
  for (const [cv, ox] of [[c, Math.round(cx - m[0].length / 2)], [flip, Math.round(c.width - cx - m[0].length / 2)]]) {
    const q = cv.getContext('2d'); q.fillStyle = '#16141e';
    for (let y = 0; y < m.length; y++) for (let x = 0; x < m[0].length; x++) if (on(x, y)) q.fillRect(ox + x, oy + y, 1, 1);
  }
  return { right: c, left: flip };
}
const BLIMP_EVERY = 4200, BLIMP_SPEED = 0.25;   // sim ticks (60 a second); px per tick
export function drawBlimp(ctx, z, tick, cam) {
  if (z.style === 'dungeon') return;   // indoors: no sky to fly through
  const n = Math.floor((tick + 1500) / BLIMP_EVERY), ph = (tick + 1500) % BLIMP_EVERY, run = (W + 110) / BLIMP_SPEED;
  if (ph > run) return;
  blimpArt ||= buildBlimp();
  const goRight = n % 2 === 1, img = goRight ? blimpArt.left : blimpArt.right, step = Math.floor(ph * BLIMP_SPEED);
  const x = goRight ? -100 + step : W + 10 - step, y = Math.round(16 + (n % 3) * 7 + Math.sin(ph / 90) * 1.5 - cam * 0.25);
  ctx.save(); ctx.globalAlpha = 0.82; ctx.drawImage(img, x, y); ctx.restore();
  if ((tick >> 4) % 4 === 0) { ctx.fillStyle = '#ff3a3a'; ctx.fillRect(goRight ? x + 4 : x + img.width - 5, y + 11, 1, 1); }   // tail light
}
