// LEVEL 1 (nod to Interstellar). Three zones, then a boss arena:
//   1. the dust farm, 2. the water planet (the wave), 3. the ice planet (the singularity at your back), 4. the arena.
// build(A, n) -> { meta, views: [{ label, fn }], cards }
import { MATS, cap, ell, poly, heroShapes, scaleShapes, R, P, add, cv, frames, put, flip, tint, hash, TAU, recolor, W, H, GY, dith, pix, blackHole, hud, rng, tile, rect, putC, stars, drawStars, sparks, GRAD, skyGrad, drawText } from './lvkit.js';
import { waveArt } from './scenes.js';

Object.assign(MATS, {
  astro: ['#ffffff', '#e4e6ea', '#b4b8c0', '#6e7480'],
  astroFar: ['#d4d8de', '#b4b8c0', '#8a909a', '#4e545e'],
  visor: ['#c8a050', '#8a6a2a', '#4a3a18', '#1a140a'],
});

// ---------- sprites ----------
// the liar: an astronaut in a white suit, a gold visor with a crack across it, a backpack (faces left)
function liarShapes(phase) {
  const g = recolor(heroShapes(phase), { coat: 'astro', coatFar: 'astroFar', trousers: 'astro', trousersFar: 'astroFar', tee: 'astroFar', skin: 'astro', skinFar: 'astroFar' }, ['hair', 'glasses']);
  const head = g.shapes.find((s) => s.m === 'astro' && s.kind === 'ell' && s.z === 7), C = P(head.c.x - 0.4, head.c.y - 0.4);
  g.shapes.push(ell('astro', add(C, P(0.2, 0.2)), 6, 6, 8.5, { g: 'helmet' }), ell('visor', add(C, P(2.2, 0.2)), 3.6, 3.4, 8.6, { g: 'visor' }));
  g.shapes.push(poly('astroFar', [add(C, P(-7.6, 6)), add(C, P(-3, 6)), add(C, P(-3, 17)), add(C, P(-8, 16))], 4.5, { g: 'pack' }));
  return { shapes: g.shapes, post: (c, px) => {
    const v = px(add(C, P(2.2, 0.2))); c.fillStyle = '#ffffff'; for (const [dx, dy] of [[-2, -2], [-1, -1], [0, -1], [1, 0], [1, 1], [2, 2], [0, 0], [-1, 1]]) c.fillRect(v.x + dx, v.y + dy, 1, 1);   // the crack
    const l = px(add(C, P(-5.4, 9))); c.fillStyle = '#ff3a2a'; c.fillRect(l.x, l.y, 1, 1);
  } };
}
// the survey drone: an old solar glider with long thin wings (faces left)
const droneArt = pix(56, 12, (i, j) => {
  const body = Math.abs(i - 28) < 7 && j > 3 && j < 9, nose = i >= 20 && i < 22 && j > 4 && j < 8;
  if (nose) return '#ff4a2a';
  if (body) return dith(['#e8e4dc', '#a8a49c', '#5a5850'], (j - 3) / 6, i, j);
  if (j >= 4 && j <= 6 && i > 1 && i < 55) return i % 4 === 0 ? '#8a9ab0' : j === 4 ? '#3a5a8a' : '#1a2a4a';     // the long solar wings
  if (j === 9 && (i === 24 || i === 32)) return '#3a3830';
  return null;
});
// a frozen cloud: flat-topped, so you can stand on it, with lumpy underside and icicles. surface at y = 3
const iceCloud = (w, seed = 1, cracked = 0) => pix(w, 22, (i, j) => {
  if (j < 3) return null;
  const end = Math.min(i, w - 1 - i);
  if (end < 4 && j < 3 + (4 - end)) return null;
  const puff = 10 + 4 * Math.abs(Math.sin(i * 0.22 + seed)) + 2 * Math.sin(i * 0.61 + seed * 3);
  const ic = hash(i, seed) > 0.8 && i % 3 === 0 ? 4 + Math.floor(hash(i, seed + 1) * 6) : 0;
  if (j > puff + ic || (end < 6 && j > puff - (6 - end))) return null;
  if (cracked && Math.abs(i - w * 0.55 - (j - 3) * 0.6 + Math.sin(j) * 1.5) < 0.8) return '#14304a';
  if (j > puff) return '#bfe8ff';
  if (j === 3) return '#ffffff';
  return dith(['#f4fcff', '#c8ecff', '#8ac4e8', '#4a86b8', '#24507a'], (j - 3) / (puff - 2) * 0.9 + (i % 9 === 0 ? 0.1 : 0), i, j);
});
const putCloud = (ctx, c, x, top) => ctx.drawImage(c, Math.round(x - c.width / 2), Math.round(top - 3));
// a cryo pod lying in the ice; open > 0 slides the lid
const pod = (open) => { const c = cv(44, 22), x = c.getContext('2d');
  x.fillStyle = '#4a5260'; x.beginPath(); x.ellipse(22, 14, 20, 7, 0, 0, TAU); x.fill(); x.fillStyle = '#8a929e'; x.fillRect(4, 12, 36, 2);
  x.fillStyle = '#c8e8ff'; x.globalAlpha = 0.85; x.beginPath(); x.ellipse(22 + open * 16, 10 - open * 4, 16, 5, -open * 0.3, 0, TAU); x.fill(); x.globalAlpha = 1;
  x.fillStyle = '#ffffff'; x.fillRect(12 + open * 16, 7 - open * 4, 6, 1); x.fillStyle = (open ? '#3aff6a' : '#ff3a2a'); x.fillRect(38, 15, 2, 2); return c; };
// a spinning piece of the docking ring: a hull panel with a stub of truss
const debris = frames(12, (t) => { const c = cv(30, 30), x = c.getContext('2d'); x.translate(15, 15); x.rotate(t * TAU);
  x.fillStyle = '#000'; x.fillRect(-10, -5, 20, 10); x.fillStyle = '#d8dce4'; x.fillRect(-9, -4, 18, 8); x.fillStyle = '#8a909c'; x.fillRect(-9, 1, 18, 3); x.fillStyle = '#3a404c'; for (let k = -6; k < 9; k += 5) x.fillRect(k, -4, 1, 8);
  x.fillStyle = '#c8a050'; x.fillRect(9, -1, 6, 2); x.fillStyle = '#ff7a2a'; x.fillRect(-12, -1, 2, 2); return c; });
// a falling book from the shelf, spine out (5 colours)
const BOOK = ['#c0402a', '#2a6ac0', '#e8b030', '#3a8a4a', '#8a3ac0'];
const book = (k, open) => pix(open ? 14 : 7, 10, (i, j) => { const col = BOOK[k % 5]; if (open) { if (j === 0 || j === 9) return null; if (i === 7 || i === 6) return col; return j % 2 ? '#f0e8d8' : '#d8d0c0'; } if (i === 0 || i === 6) return '#1a1418'; return j === 2 || j === 7 ? '#ffe8a0' : col; });
const books = BOOK.map((_, k) => [book(k, 0), book(k, 1)]);
// a dust devil: a twisting column of grit
function dustDevil(ctx, x, f, hgt = 64) { for (let k = 0; k < 90; k++) { const t = k / 90, y = GY - t * hgt, r = 2 + t * t * 16, a = f * 0.45 + k * 0.9, front = Math.sin(a) > 0; ctx.globalAlpha = front ? 0.9 : 0.45; rect(ctx, k % 4 ? (front ? '#c8a070' : '#8a6a44') : '#5a4430', x + Math.cos(a) * r + Math.sin(t * 6 + f * 0.1) * 3 * t, y, k % 5 ? 1 : 2, 1); } ctx.globalAlpha = 1; for (let k = 0; k < 6; k++) rect(ctx, '#7a5a3a', x - 10 + ((f * 3 + k * 7) % 20), GY - 1 - (k % 2), 2, 1); }
// the gravity anomaly: a column where dust and books float upwards
function anomaly(ctx, x, f, h = 100) { ctx.globalAlpha = 0.12; rect(ctx, '#c8d8ff', x - 12, GY - h, 24, h); ctx.globalAlpha = 1; for (let k = 0; k < 24; k++) { const y = GY - ((f * (0.6 + hash(k, 2)) + k * 13) % h); rect(ctx, k % 3 ? '#e8f0ff' : '#ffe8a0', x - 10 + hash(k, 1) * 20 + Math.sin(f * 0.1 + k) * 2, y, 1, k % 4 ? 1 : 2); } }

// bend the picture around a black hole: point-lens warp, sampling closer in (the Einstein ring look)
function lens(ctx, cx, cy, r) {
  const E = r * 1.45, R0 = Math.ceil(r * 3.4), x0 = Math.max(0, Math.round(cx - R0)), y0 = Math.max(0, Math.round(cy - R0)), x1 = Math.min(W, Math.round(cx + R0)), y1 = Math.min(H, Math.round(cy + R0));
  if (x1 <= x0 || y1 <= y0) return;
  const src = ctx.getImageData(0, 0, W, H), out = ctx.getImageData(x0, y0, x1 - x0, y1 - y0), s = src.data, d = out.data, ow = x1 - x0;
  for (let j = y0; j < y1; j++) for (let i = x0; i < x1; i++) {
    const dx = i - cx, dy = j - cy, dd = Math.hypot(dx, dy); if (dd > R0 || dd < 0.5) continue;
    const fade = Math.pow(1 - dd / R0, 1.4), b = dd - (E * E / dd) * fade, k = b / dd;
    const sx = Math.round(cx + dx * k), sy = Math.round(cy + dy * k); if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
    const so = (sy * W + sx) * 4, o = ((j - y0) * ow + (i - x0)) * 4; d[o] = s[so]; d[o + 1] = s[so + 1]; d[o + 2] = s[so + 2];
  }
  ctx.putImageData(out, x0, y0);
}
// a smooth hop from (y0) to (y1) over t 0..1, peaking h above the higher end
const hop = (t, y0, y1, h) => y0 + (y1 - y0) * t - (h + Math.max(0, y0 - y1) * 0) * 4 * t * (1 - t);

export function build(A, n) {
  const hero = A.hero, heroL = hero.run.map(flip), jumpL = flip(hero.jump), fallL = flip(hero.fall);
  const liar = frames(8, (p) => flip(R(liarShapes(p), 40, 50, 18, 46)));
  const mini = frames(8, (p) => blackHole(6, p, { tilt: 0.38, pal: ['#ffffff', '#d8b0ff', '#a060ff', '#6a2ae0', '#3a1290', '#1a0848'] }));
  const gargantua = frames(10, (p) => blackHole(22, p));
  const huge = frames(8, (p) => blackHole(34, p, { tilt: 0.16 }));
  const S = stars(11, 140), S2 = stars(17, 90);
  const clouds = [iceCloud(64, 1), iceCloud(52, 2), iceCloud(80, 3), iceCloud(58, 4)], crackedCloud = iceCloud(58, 4, 1);

  // ===== ZONE 1: THE DUST FARM =====
  const dustSky = skyGrad(['#e8c898', '#d8b07a', '#c09060', '#a07448', '#7a5634'], 150);
  const storm = pix(640, 90, (i, j) => { const top = 26 + 10 * Math.sin(i * 0.02) + 6 * Math.sin(i * 0.071 + 1) + 4 * Math.abs(Math.sin(i * 0.15)); if (j < top) return null; return dith(['#a07a52', '#8a6440', '#6e4e32', '#54381e'], (j - top) / 60 + Math.sin(i * 0.05 + j * 0.2) * 0.08, i, j); });
  const farm = pix(640, 40, (i, j) => { const h = i > 120 && i < 160 ? 22 + (i < 140 ? (i - 120) * 0.6 : (160 - i) * 0.6) : i > 400 && i < 404 ? 34 : i > 392 && i < 412 && j > 6 && j < 14 ? 34 : 0; if (40 - j > h) return null; if (i > 128 && i < 152 && j > 26 && j < 32 && i % 6 > 2) return '#ffd890'; return '#4a3424'; });
  const corn = (seed, h, cols) => pix(640, h, (i, j) => { const s = i % 7, hh = h - 4 - hash(i >> 3, seed) * 6; if (h - j > hh) return null; if (s === 3) return dith(cols, j / h, i, j); const leaf = Math.abs(s - 3) < 3 && Math.sin(j * 0.9 + (i >> 3) * 2) > 0.55; if (leaf) return dith(cols, j / h + 0.2, i, j); if (j < 5 && s > 1 && s < 5 && hash(i, j) > 0.4) return '#e8c86a'; return null; });
  const cornFar = corn(3, 30, ['#a89a5a', '#7a7040', '#4e4628']), cornNear = corn(7, 42, ['#c8b85a', '#8a8a34', '#4a4a1a']);
  const dirt = pix(640, H - GY, (i, j) => (j < 1 ? '#c09a68' : (j === 6 || j === 14) && (i % 40) < 28 ? '#6a4a2e' : dith(['#a07a52', '#7a5a3a', '#54381e'], j / 24, i, j)));
  const dustFarm = (ctx, f) => {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(dustSky, 0, 0);
    putC(ctx, gargantua[0], 250, 30); ctx.globalAlpha = 0.75; ctx.drawImage(dustSky, 0, 0, W, 70, 0, 0, W, 70); ctx.globalAlpha = 1;   // the sun, low and smothered
    tile(ctx, storm, f * 0.15, GY - 100);
    tile(ctx, farm, f * 0.4, GY - 58); tile(ctx, cornFar, f * 0.8, GY - 30);
    tile(ctx, dirt, f * 2, GY);
    // a book drifting out of the gravity anomaly, upwards
    const ax = ((420 - f * 2) % 560 + 560) % 560 - 60; anomaly(ctx, ax, f, 110); ctx.drawImage(books[(f >> 5) % 5][0], Math.round(ax - 3), Math.round(GY - 20 - ((f * 0.8) % 80)));
    // the dust devil crossing the track, faster than the scroll
    dustDevil(ctx, ((300 - f * 3) % 520 + 520) % 520 - 50, f);
    // the survey drone swooping
    const dx = ((360 - f * 1.4) % 560 + 560) % 560 - 80; ctx.drawImage(droneArt, Math.round(dx), Math.round(34 + Math.sin(f * 0.06) * 14));
    // you: jump the dust devil when it reaches you
    const dvx = ((300 - f * 3) % 520 + 520) % 520 - 50, near = dvx > 30 && dvx < 104;
    if (near) { const t = (104 - dvx) / 74; put(ctx, t < 0.5 ? hero.jump : hero.fall, 70, GY - Math.sin(t * Math.PI) * 30); } else put(ctx, hero.run[f % 8], 70, GY);
    tile(ctx, cornNear, f * 2.6, GY - 30);
    // dust in the air
    ctx.globalAlpha = 0.5; for (let k = 0; k < 50; k++) rect(ctx, '#e8d0a8', ((hash(k, 4) * W - f * (3 + hash(k, 5) * 3)) % W + W) % W, hash(k, 6) * GY, 1, 1); ctx.globalAlpha = 1;
    hud(ctx, A, f, n, null, GRAD.gold);
  };

  // ===== ZONE 2: THE WATER PLANET (the wave) =====
  const sky = pix(W, H, (i, j) => dith(['#000000', '#03030c', '#070a1c', '#0e1230', '#1a1a40'], j / 120, i, j));
  const hills = pix(640, 40, (i, j) => { const h = 6 + 4 * Math.sin(i * 0.05) + 3 * Math.sin(i * 0.013 + 1) + 6 * Math.abs(Math.sin(i * 0.02)); if (39 - j > h) return null; return 39 - j > h - 2 ? '#4a7aa8' : dith(['#2a4a72', '#16304e', '#0c2038'], (j - (39 - h)) / 22, i, j); });
  const sea = pix(640, H - 118, (i, j) => { const r = Math.sin(i * 0.11 + j * 1.7) + Math.sin(i * 0.031 - j * 0.9); return r > 1.3 ? '#3a6a98' : dith(['#163452', '#0e2640', '#081a30'], j / 40, i, j); });
  const refl = pix(70, H - 118, (i, j) => { const d = Math.abs(i - 35) / (12 + j * 0.6); return d < 1 && Math.sin(j * 1.9 + i * 0.4) > 0.2 ? dith(['#fff0c0', '#ffb35a', '#c05a1a'], d * 0.7 + j / 80, i, j) : null; });
  const big = waveArt(160, 76);
  const L2 = 150, STEPS = [[60, GY - 2, 'floe'], [76, GY - 28, 0], [92, GY - 54, 2], [108, GY - 80, 1]];
  const waterPlanet = (ctx, f) => {
    ctx.imageSmoothingEnabled = false;
    const p = f % L2, shake = p > 10 && p < 110 ? ((f >> 1) % 2) : 0;
    ctx.save(); ctx.translate(0, shake);
    ctx.drawImage(sky, 0, 0); drawStars(ctx, S, f);
    putC(ctx, gargantua[Math.floor(f / 2) % 10], 214, 52);
    tile(ctx, hills, f * 0.25, 82);
    // the wave: first it is the tallest "mountain" on the horizon, then it rises and comes at you
    let s, base, lx;
    if (p < 30) { s = 0.3; base = 118 + Math.max(0, (30 - p) / 20) * 23; lx = 300; }
    else { const k = Math.min(1, (p - 30) / 50); s = 0.3 + 0.7 * k; base = 118 + 22 * k; lx = p < 92 ? 300 - 230 * Math.pow((p - 30) / 62, 2) : 70 - 7.4 * (p - 92); }
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, base); ctx.clip();
    if (p >= 10 && p < 126) ctx.drawImage(big, Math.round(lx), Math.round(base - big.height * s), Math.round(big.width * s), Math.round(big.height * s));
    ctx.restore();
    tile(ctx, sea, f * 2, 118); ctx.drawImage(refl, 214 - 35, 118);
    // spray off the top of the wave once it is close
    if (p > 70 && p < 124) for (let k = 0; k < 16; k++) rect(ctx, k % 2 ? '#ffffff' : '#bfe8ff', lx + big.width * s * (0.3 + hash(k, 1) * 0.3) + ((f * 2 + k * 5) % 16), base - big.height * s - 2 - ((f + k * 3) % 8), 1, 1);
    // the staircase: a floe in the water, then frozen clouds, higher and higher
    for (const [t, top, kind] of STEPS) { const x = 70 + (t - p) * 2; if (x < -60 || x > W + 60) continue; if (kind === 'floe') put(ctx, A.floe, x, top + 5); else putCloud(ctx, clouds[kind], x, top); }
    // you: up the staircase, ride the top while the wave goes under, then drop down behind it
    let y = GY, spr = hero.run[f % 8];
    const seg = [[52, 60, GY, GY - 28], [68, 76, GY - 28, GY - 28], [70, 78, GY - 28, GY - 54], [86, 94, GY - 54, GY - 80], [114, 126, GY - 80, GY]];
    if (p >= 52 && p < 60) { const t = (p - 52) / 8; y = hop(t, GY, GY - 28, 14); spr = t < 0.5 ? hero.jump : hero.fall; }
    else if (p >= 60 && p < 70) y = GY - 28;
    else if (p >= 70 && p < 78) { const t = (p - 70) / 8; y = hop(t, GY - 28, GY - 54, 14); spr = t < 0.5 ? hero.jump : hero.fall; }
    else if (p >= 78 && p < 86) y = GY - 54;
    else if (p >= 86 && p < 94) { const t = (p - 86) / 8; y = hop(t, GY - 54, GY - 80, 14); spr = t < 0.5 ? hero.jump : hero.fall; }
    else if (p >= 94 && p < 116) y = GY - 80;
    else if (p >= 116 && p < 130) { const t = (p - 116) / 14; y = hop(t, GY - 80, GY, 8); spr = t < 0.3 ? hero.jump : hero.fall; }
    put(ctx, spr, 70, y);
    // a mini black hole drifting about
    const mx = ((260 - f * 1.2) % 400 + 400) % 400 - 40, my = 70 + Math.sin(f * 0.1) * 6; putC(ctx, mini[(f >> 1) % 8], mx, my); sparks(ctx, mx, my, f, 6);
    ctx.restore();
    if (p > 10 && p < 80 && (f >> 2) % 2) { drawText(ctx, 'WAVE!', W / 2, 26, { scale: 2, fill: GRAD.red, outline: '#000', align: 'center' }); drawText(ctx, 'GET UP HIGH', W / 2, 44, { fill: GRAD.white, outline: '#000', align: 'center' }); }
    hud(ctx, A, f, n, null, GRAD.gold);
  };

  // ===== ZONE 3: THE ICE PLANET (the singularity at your back) =====
  const iceSky = skyGrad(['#f4faff', '#d8ecf8', '#b0d0e8', '#88b0d0', '#6a90b4'], 150);
  const cloudBank = (seed, cols, h, a) => pix(640, h, (i, j) => { const top = h * (0.35 + 0.25 * Math.sin(i * 0.013 + seed) + 0.15 * Math.sin(i * 0.05 + seed * 2)); if (j < top) return null; if (j > top + 30 + 10 * Math.sin(i * 0.03)) return null; return dith(cols, (j - top) / 40, i, j); });
  const bankFar = cloudBank(1, ['#ffffff', '#e0f0fa', '#c0dcf0'], 90), bankNear = cloudBank(4, ['#f4fcff', '#c8e4f4', '#9ac4e0', '#6a9ac4'], 70);
  const ice = pix(640, H - GY, (i, j) => { if (j < 1) return '#ffffff'; const crk = Math.abs(((i * 0.37 + j * 1.3) % 23) - 11) < 0.6 && j < 10; return crk ? '#4a86b8' : dith(['#e0f4ff', '#a8d4f0', '#6aa0c8', '#3a6a98'], j / 24, i, j); });
  const icePlanet = (ctx, f) => {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(iceSky, 0, 0); tile(ctx, bankFar, f * 0.2, 10); tile(ctx, bankNear, f * 0.5, 44);
    // tumbling debris from the docking ring, high up
    for (let k = 0; k < 2; k++) { const x = ((k * 230 + 300 - f * (1.6 + k)) % 460 + 460) % 460 - 40; ctx.drawImage(debris[(f + k * 5) % 12], Math.round(x), Math.round(12 + k * 18 + Math.sin(f * 0.07 + k) * 4)); }
    tile(ctx, ice, f * 2, GY);
    // frozen clouds you can stand on; the cracked one drops away
    const cyc = 230;
    for (const [x0, top, k] of [[120, GY - 34, 0], [210, GY - 62, 1], [330, GY - 40, 2], [420, GY - 70, 3]]) { const x = ((x0 - f * 2) % cyc * 2 + cyc * 2) % (cyc * 2) - 60; const drop = k === 3 && x < 120 ? (120 - x) * 0.5 : 0; putCloud(ctx, k === 3 ? crackedCloud : clouds[k], x, top + drop * drop * 0.08); }
    // the cryo pod and the liar climbing out and walking at you
    const px = ((380 - f * 2) % 520 + 520) % 520 - 60; ctx.drawImage(pod(Math.min(1, Math.max(0, (260 - px) / 60))), Math.round(px - 22), GY - 18);
    if (px < 230) put(ctx, liar[(f >> 1) % 8], px - 12 - (230 - px) * 0.5, GY);
    // cloud shards falling
    put(ctx, A.ice, 180 + Math.sin(f * 0.2) * 2, ((f * 3) % 150) - 20);
    // you: knocked back towards the edge when the debris hits, then fighting back to your spot
    const hit = f % 120, hx = hit < 6 ? 70 - hit * 4 : hit < 66 ? 46 + (hit - 6) * 0.4 : 70;
    put(ctx, hit < 6 ? tint(hero.fall, '#ff3a2a', 0.5) : hero.run[f % 8], hx, GY);
    // the singularity on your heels: the world behind you is being torn up and pulled in
    putC(ctx, huge[(f >> 1) % 8], -24, 76);
    lens(ctx, -24, 76, 34);
    for (let k = 0; k < 18; k++) { const t = ((f * 0.04 + k / 18) % 1), y = 20 + hash(k, 3) * 120; rect(ctx, k % 3 ? '#c8e4f4' : '#ffb35a', 60 - t * 70, y + (76 - y) * t, 3 - t * 2, 1); }
    if (hit < 66 && (f >> 2) % 2) drawText(ctx, 'HIT! IT PULLS YOU BACK', W / 2 + 20, 26, { fill: GRAD.red, outline: '#000', align: 'center' });
    hud(ctx, A, f, n, null, GRAD.gold);
  };

  // ===== THE BOSS ARENA: the screen stops. survive the bouncing black hole until the portal opens =====
  const arenaSky = pix(W, H, (i, j) => dith(['#000000', '#020208', '#06081c', '#0e1230'], j / 150, i, j));
  const floorIce = pix(W, H - GY, (i, j) => (j < 1 ? '#ffffff' : dith(['#c8ecff', '#6aa0c8', '#24507a', '#0e2640'], j / 24, i, j)));
  const PLAT = [[90, GY - 30, 0], [230, GY - 30, 1], [160, GY - 60, 3], [62, GY - 90, 1], [258, GY - 90, 1]];
  const pcl = [iceCloud(64, 6), iceCloud(52, 7), null, iceCloud(58, 8)];
  // the script of a good run: auto-run, turn at the walls, tap to jump, tap twice to double jump, fall off edges
  const SEG = [];
  const run = (x0, x1, y) => SEG.push({ k: 'run', x0, x1, y0: y, y1: y, n: Math.abs(x1 - x0) / 1.8 });
  const jump = (x0, x1, y0, y1, dbl) => SEG.push({ k: 'jump', x0, x1, y0, y1, n: dbl ? 22 : 14, dbl });
  const drop = (x0, x1, y0, y1) => SEG.push({ k: 'drop', x0, x1, y0, y1, n: 12 });
  run(20, 58, GY); jump(58, 82, GY, GY - 30); run(82, 112, GY - 30); jump(112, 142, GY - 30, GY - 60); run(142, 176, GY - 60); jump(176, 238, GY - 60, GY - 90, 1); run(238, 284, GY - 90);
  drop(284, 300, GY - 90, GY); run(300, 304, GY); run(304, 282, GY); jump(282, 252, GY, GY - 30); run(252, 204, GY - 30); jump(204, 176, GY - 30, GY - 60); run(176, 142, GY - 60); jump(142, 82, GY - 60, GY - 90, 1); run(82, 36, GY - 90); drop(36, 22, GY - 90, GY); run(22, 16, GY); run(16, 20, GY);
  const TOTAL = SEG.reduce((a, s) => a + s.n, 0);
  const at = (t) => { for (const s of SEG) { if (t < s.n) return [s, t / s.n]; t -= s.n; } return [SEG[0], 0]; };
  const holes = [8, 11, 14, 17, 20].map((r) => frames(4, (p) => blackHole(r, p, { tilt: 0.24 })));
  const tri = (v, a, b) => { const L = b - a, m = ((v % (2 * L)) + 2 * L) % (2 * L); return a + (m < L ? m : 2 * L - m); };
  const rift = (ctx, cx, cy, h, f) => { for (let j = -h; j <= h; j++) { const w = (1 - Math.abs(j) / (h + 1)) * (3 + Math.sin(j * 0.5 - f * 0.4)); for (let i = -Math.ceil(w * 2); i <= Math.ceil(w * 2); i++) { const q = Math.abs(i) / Math.max(0.5, w); rect(ctx, q < 0.4 ? '#fff4d0' : q < 1 ? '#ff8a2a' : q < 1.6 ? '#3ad8ff' : '#0a5a8a', cx + i, cy + j, 1, 1); } } };
  const arena = (ctx, f) => {
    ctx.imageSmoothingEnabled = false;
    const t = f % TOTAL, charge = t / TOTAL;
    ctx.drawImage(arenaSky, 0, 0); drawStars(ctx, S2, f);
    ctx.drawImage(floorIce, 0, GY);
    for (const [x, top, k] of PLAT) putCloud(ctx, pcl[k] || pcl[0], x, top);
    // the portal (the Breach) tearing open at the top as it charges
    rift(ctx, 160, 40, Math.round(2 + charge * 22), f);
    // you
    const [s, u] = at(t), dirL = s.x1 < s.x0, x = s.x0 + (s.x1 - s.x0) * u;
    let y = s.y0, spr = (dirL ? heroL : hero.run)[f % 8];
    if (s.k === 'jump') { y = s.dbl ? (u < 0.5 ? hop(u * 2, s.y0, s.y0 - 16, 12) * 1 : hop((u - 0.5) * 2, s.y0 - 16, s.y1, 12)) : hop(u, s.y0, s.y1, 14); spr = (u < 0.5 || (s.dbl && u < 0.75 && u > 0.5)) ? (dirL ? jumpL : hero.jump) : (dirL ? fallL : hero.fall); }
    if (s.k === 'drop') { y = s.y0 + (s.y1 - s.y0) * u * u; spr = dirL ? fallL : hero.fall; }
    put(ctx, spr, x, y);
    // the black hole: bounces round the arena, growing every time it hits a wall, bending everything near it
    const r = 8 + Math.floor(charge * 4.99) * 3, hx = tri(f * 1.7, 16 + r, W - 16 - r), hy = tri(f * 1.1 + 40, 20 + r, GY - 4 - r);
    lens(ctx, hx, hy, r);
    putC(ctx, holes[Math.floor(charge * 4.99)][(f >> 1) % 4], hx, hy);
    // what your thumb is doing
    if (s.k === 'jump' && u < 0.35) { drawText(ctx, s.dbl && u > 0.05 ? 'TAP TAP' : 'TAP', x, y - 56, { fill: GRAD.gold, outline: '#000', align: 'center' }); }
    if (s.k === 'drop' && u < 0.4) drawText(ctx, 'OFF THE EDGE', x - (dirL ? -10 : 10), y - 54, { fill: GRAD.white, outline: '#000', align: 'center' });
    // portal charge bar
    rect(ctx, '#000', 110, 14, 100, 5); rect(ctx, '#3a2010', 111, 15, 98, 3); rect(ctx, charge > 0.97 ? '#ffffff' : '#ff8a2a', 111, 15, Math.round(98 * charge), 3);
    drawText(ctx, charge > 0.97 ? 'PORTAL OPEN: JUMP IN' : 'PORTAL ' + Math.floor(charge * 100) + '%', W / 2, 4, { fill: charge > 0.97 ? GRAD.white : GRAD.gold, outline: '#000', align: 'center' });
    drawText(ctx, 'TAP: JUMP  /  TAP TAP: DOUBLE  /  SWIPE DOWN: DROP', W / 2, GY + 10, { fill: GRAD.white, outline: '#000', align: 'center' });
  };

  const w = (c) => c.canvas.width, h = (c) => c.canvas.height;
  // the raw art, for the playable game (bhf/play.js)
  const kit = { dustSky, storm, farm, cornFar, cornNear, dirt, gargantua, sky, S, S2, hills, sea, refl, big, iceSky, bankFar, bankNear, ice, arenaSky, floorIce, clouds, crackedCloud, iceCloud, putCloud, liar, droneArt, debris, books, pod, dustDevil, anomaly, lens, huge, mini, holes, rift, sparks };
  return {
    kit,
    meta: { nod: 'Nod to: Interstellar', c: '#f5a560', stage: ['#06081c', '#163452'], d: 'Three zones, then a boss arena. The <b>dust farm</b>: dust storms rolling in over the corn, dust devils and an old survey drone. The <b>water planet</b>: the tallest mountain on the horizon turns out to be a wave, and you climb a staircase of ice floes and frozen clouds to get over it. The <b>ice planet</b>: frozen clouds you can stand on (until they crack), a liar in a cryo pod, and the singularity right behind you. You’re in a fixed spot on screen, so your spot is your health: every hit knocks you back towards it, and clean running pulls you away again. Then the screen stops for the <b>arena</b>: survive the bouncing, growing black hole until the portal opens. One thumb on mobile.' },
    views: [{ label: 'ZONE 1: THE DUST FARM', fn: dustFarm }, { label: 'ZONE 2: THE WATER PLANET (THE WAVE)', fn: waterPlanet }, { label: 'ZONE 3: THE ICE PLANET (THE SINGULARITY AT YOUR BACK)', fn: icePlanet }, { label: 'BOSS ARENA: THE SCREEN STOPS SCROLLING', fn: arena }],
    cards: [
      { n: 'DUST DEVIL', t: 'OBSTACLE', d: 'A twisting column of grit that cuts across the track faster than you run. Jump it or get spun round and lose 1 energy.', draw: (c, f) => dustDevil(c, w(c) / 2 + Math.sin(f * 0.05) * 10, f, 40) },
      { n: 'SURVEY DRONE', t: 'BADDIE', d: 'An old solar glider still flying its patrol. Swoops low over the corn. Jump up and hit it from below to bring it down: 60 pts.', draw: (c, f) => c.drawImage(droneArt, Math.round(w(c) / 2 - 28 + Math.sin(f * 0.05) * 6), Math.round(16 + Math.sin(f * 0.1) * 6)) },
      { n: 'GRAVITY ANOMALY', t: 'POWER-UP', good: 1, d: 'A patch where gravity goes floaty and dust drifts upwards. Run through it and your jumps go twice as high for 5 seconds.', draw: (c, f) => { c.save(); c.translate(0, h(c) - GY - 8); anomaly(c, w(c) / 2, f, 50); c.restore(); } },
      { n: 'FALLING BOOKS', t: 'COLLECT', good: 1, d: 'Books slide off a shelf in the sky, one at a time. Catch all five and their spines spell out a message: +250.', draw: (c, f) => { for (let k = 0; k < 5; k++) c.drawImage(books[k][(f >> 4) % 2 && k === 2 ? 1 : 0], 6 + k * 13, Math.round(10 + ((f * (0.6 + k * 0.1) + k * 9) % 30))); } },
      { n: 'THE WAVE', t: 'OBSTACLE', d: 'That mountain on the horizon is getting taller. WAVE! comes up, the ground shakes, and a staircase of floes and frozen clouds drifts in. Get to the top before it arrives.', draw: (c, f) => { const s = 0.4 + 0.12 * Math.sin(f * 0.05); c.drawImage(big, Math.round(w(c) - big.width * s - 4), Math.round(h(c) - 8 - big.height * s), Math.round(big.width * s), Math.round(big.height * s)); } },
      { n: 'FROZEN CLOUD', t: 'PLATFORM', good: 1, d: 'Clouds frozen solid, hanging in the air. Stand on one for too long and it cracks and drops away under you.', draw: (c, f) => { const d = (f % 60) > 40 ? ((f % 60) - 40) * 0.6 : 0; putCloud(c, (f % 60) > 25 ? crackedCloud : clouds[3], w(c) / 2, 26 + d * d * 0.1); } },
      { n: 'CLOUD SHARD', t: 'OBSTACLE', d: 'Chunks of frozen cloud fall out of the sky. Stomp a big one to smash it: 40 pts.', draw: (c, f) => put(c, A.ice, w(c) / 2, ((f * 2) % (h(c) + 20)) - 4) },
      { n: 'THE LIAR', t: 'BADDIE', d: 'A stranded astronaut wakes up in a cryo pod and waves at you, all smiles. Then he cracks your visor. Stomp him twice: 100 pts.', draw: (c, f) => { c.drawImage(pod(1), Math.round(w(c) / 2 - 36), h(c) - 26); put(c, liar[(f >> 1) % 8], w(c) / 2 + 14, h(c) - 8); } },
      { n: 'DOCKING DEBRIS', t: 'OBSTACLE', d: 'Hull panels from an exploded docking ring, spinning end over end. Each hit knocks you back towards the singularity.', draw: (c, f) => c.drawImage(debris[f % 12], Math.round(w(c) / 2 - 15 + Math.sin(f * 0.05) * 14), 10) },
      { n: 'MINI BLACK HOLE', t: 'OBSTACLE', d: 'Drifts across your path and drags you towards it. Jump clear or get spaghettified (lose 1 energy).', draw: (c, f) => { const k = mini[(f >> 1) % 8]; c.drawImage(k, Math.round(w(c) / 2 - k.width / 2), Math.round(h(c) / 2 - k.height / 2 - 2)); sparks(c, w(c) / 2, h(c) / 2 - 2, f, 6); } },
      { sz: [140, 72], n: 'THE SINGULARITY', t: 'BOSS', d: 'Chases you through the ice planet, tearing the level up behind you. At the end the screen stops: it breaks loose and bounces round the arena, growing every time it hits a wall and bending everything near it. Survive until the portal opens and jump in: +500.', draw: (c, f) => { const r = 8 + ((f >> 5) % 4) * 3, x = tri(f * 1.4, r + 4, w(c) - r - 4), y = tri(f * 0.9, r + 4, h(c) - 8 - r); lensSmall(c, x, y, r); putC(c, holes[Math.min(4, (f >> 5) % 4)][(f >> 1) % 4], x, y); } },
    ],
  };
}
// the lens for a card canvas of any size
function lensSmall(ctx, cx, cy, r) { const w = ctx.canvas.width, h = ctx.canvas.height; for (let k = 0; k < 16; k++) { const a = k / 16 * TAU, rr = r * 1.6; rect(ctx, '#ffe2a0', cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.9, 1, 1); } }
