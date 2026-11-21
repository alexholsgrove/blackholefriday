// ---------- 1. NEON RAIN: a rainy night street under a megacity. Boss: THE NEXUS (stomp him three times) ----------
import { cv, dith, hash, put, tint, TAU, drawText, GRAD, noise, fr, tintAll, sky, pitCycle, LOOK, arcadeCanvas, deckCanvas, panels, glow, vgrad, rivets, box } from '../kit.js';
import { BW, BH, FL, hurt, win, pips, pop, dizzy, flipCache } from '../bosskit.js';
import { MATS, cap, ell, poly, renderShapes, scientistShapes, scaleShapes } from '../../../rig.js';
import { recolor } from '../../chars.js';
import { hopBot } from '../critters.js';
import { city, dangers } from './neon-art.js';

// concrete + steel (dark, so the copper hero and the baddies stay the brightest things), and the three neons
const C = { k: '#06050c', d0: '#0d0b16', d1: '#131020', d2: '#1a1629', d3: '#221d34', d4: '#2c2640', d5: '#3a3352', s0: '#1c1e2e', s1: '#2a2c40', s2: '#3c3f58', s3: '#565a7a', s4: '#7c82a6' };
const N = { p: '#ff4fae', p2: '#b02c78', p3: '#5a1640', c: '#4af0ff', c2: '#1f8ea6', c3: '#0e3c4c', a: '#ffd06a', a2: '#b8802c', a3: '#553812', r: '#ff3a4a' };

// the coats: slate-blue raincoats for the street synths, a heavy teal storm coat (pink lining) for the Nexus
Object.assign(MATS, {
  nrCoat: ['#a8a2c8', '#666088', '#423c5e', '#1e1a34'], nrCoatFar: ['#7a7498', '#4c4768', '#322e4a', '#18152c'],
  nrNexCoat: ['#86e0d0', '#3a9c94', '#21606a', '#0c2c36'], nrNexCoatFar: ['#5cb4aa', '#2c7a78', '#1a4a54', '#0a222c'],
  nrNexTop: ['#6a4c9a', '#3a2660', '#22163c', '#0c0818'], nrNexShave: ['#9a9ab4', '#6a6a88', '#4a4a66', '#26263c'],
  nrLining: ['#ff8ad0', '#d83a90', '#8a1a5c', '#42082c'],
  nrSlick: ['#f6f2a4', '#cfc64e', '#8e8626', '#3e3a10'], nrSlickFar: ['#c4c07c', '#9a9440', '#6a6420', '#302c0c'], nrBob: ['#ff9ad8', '#e84aa8', '#9a1a6a', '#4a0a30'],
  nrVinyl: ['#ff8a76', '#d8323a', '#8a1420', '#40060c'], nrVinylFar: ['#c4685c', '#a02830', '#66101a', '#30050a'], nrTeal: ['#b0fff8', '#3ad8d0', '#16888a', '#064044'],
  nrRain: ['#c0d0ea', '#7c92b8', '#52648c', '#283250'], nrRainFar: ['#92a4c4', '#60729a', '#404e74', '#202844'],
});

// a made-up 5x7 character (no real script): a few bars, posts and a dot
const glyph = (x, gx, gy, seed, col, s = 1) => {
  x.fillStyle = col; const h = (k) => hash(seed * 13 + 5, k), Rr = (i, j, w, hh) => x.fillRect(gx + i * s, gy + j * s, w * s, hh * s);
  [0, 3, 6].forEach((j, k) => { if (h(k) > 0.3) { const a = h(k + 10) > 0.6 ? 1 : 0; Rr(a, j, 5 - a - (h(k + 20) > 0.7 ? 1 : 0), 1); } });
  [0, 2, 4].forEach((i, k) => { if (h(k + 30) > 0.35) { const a = Math.floor(h(k + 40) * 3); Rr(i, a, 1, Math.min(7 - a, 3 + Math.floor(h(k + 50) * 4))); } });
  if (h(60) > 0.4) Rr(1 + Math.floor(h(61) * 3), 1 + Math.floor(h(62) * 4), 1, 1);
};

// ---------- THE NEXUS rig (faces left): a big replicant-hunter in a long trench coat ----------
// legs/arms: [angle, bend], angle 0 = straight down, + = forward. lean: torso forward lean. fly: coat tails streaming out behind.
function nexusRig(o, info) {
  const { T = 0, lean = 0, headLean = lean, legs, armN, armF, fly = 0, K = 1.5 } = o;
  const P = (x, y) => ({ x, y }), add = (a, b) => P(a.x + b.x, a.y + b.y);
  const d = (len, a) => P(-Math.sin(a) * len, Math.cos(a) * len);
  const rf = (p, a) => P(p.x * Math.cos(a) + p.y * Math.sin(a), -p.x * Math.sin(a) + p.y * Math.cos(a));
  const L = legs.map(([a, kn]) => { const Kn = d(7.8, a); return { Kn, F: add(Kn, d(8, a - kn)) }; });
  const H = P(0, -Math.max(...L.map((l) => l.F.y)) - 2.1), sh = [];
  L.forEach((l, i) => { const m = i ? 'dark' : 'cape', z = i ? 2 : 1, Kn = add(H, l.Kn), F = add(H, l.F);
    sh.push(cap(m, H, Kn, 2.7, z, { g: 'leg' + i }), cap(m, Kn, F, 2.4, z, { g: 'leg' + i }), cap('boot', add(F, P(1.2, 0.2)), add(F, P(-3.6, 0.5)), 2.1, z + 0.1)); });
  const tp = (x, y) => add(H, rf(P(x, y), lean)), floor = (p) => P(p.x, Math.min(p.y, -0.6));
  const Sh = tp(-1.2, -12.6), flap = Math.sin(T * 2) * 0.9;
  const hb = floor(add(H, P(5 + fly * 9.5 + flap, 10.6 - fly * 7))), hm = floor(add(H, P(1 + fly * 5.5, 11 - fly * 4))), hf = floor(add(H, P(-4.6 + fly * 2.5, 10.2 - fly * 2.5)));
  sh.push(poly('nrLining', [tp(4.6, -1), floor(add(hb, P(1.3, 0.9))), floor(add(hm, P(0, 1.3))), floor(add(hf, P(-0.7, 1))), tp(-4.8, -1)], 2.5, { g: 'lining' }));
  sh.push(poly('nrNexCoat', [tp(-5.4, -13.6), tp(4.8, -13.6), tp(5.8, -6), tp(5.2, 0), hb, hm, hf, tp(-5.2, 0), tp(-5.9, -7)], 3, { g: 'coat' }));
  sh.push(poly('tee', [tp(-5.3, -12.6), tp(-3.3, -13), tp(-2.7, -1), tp(-5.2, -0.6)], 3.5, { noSeam: true }));
  sh.push(poly('nrNexCoatFar', [tp(-3.2, -13.2), tp(0.4, -13.4), tp(-2.2, -6.4)], 3.6, { g: 'lapel' }), poly('nrNexCoatFar', [tp(1.2, 2.6), tp(4.6, 2.2), tp(4.8, 3.6), tp(1.3, 4)], 3.6, { g: 'pocket' }));
  sh.push(cap('boot', tp(-5, -1.9), tp(5, -1.9), 0.9, 3.8, { g: 'belt' }));
  sh.push(poly('nrNexCoat', [tp(-5.8, -13), tp(-3.6, -17.4), tp(0, -15.4), tp(3.6, -17), tp(5.2, -12.8), tp(0, -11.2)], 4.5, { g: 'collar' }));
  // head: pale, heavy jaw; sides shaved to stubble, a dark violet crest swept up and back on top
  const Cn = add(Sh, rf(P(-2, -7.2), headLean)), hp = (x, y) => add(Cn, rf(P(x, y), headLean));
  sh.push(ell('skinPale', Cn, 4.6, 5, 5, { g: 'head', rot: -headLean }), poly('skinPale', [hp(-4.2, -1.2), hp(-6.2, 1), hp(-4.2, 1.8)], 5.05, { g: 'head' }), poly('skinPale', [hp(-4.5, 1.2), hp(-4, 5), hp(-0.5, 5.6), hp(2.4, 2.5)], 5.02, { g: 'head' }));
  sh.push(poly('nrNexShave', [[-4.4, -2.6], [-4.6, -4.6], [-2, -5.6], [2, -5.8], [4.6, -4.8], [5.6, -2.4], [5.2, 0.8], [3.8, 1.2], [3, -1], [0.8, -2.8], [-2, -3]].map(([a, b]) => hp(a, b)), 5.98));
  sh.push(poly('nrNexTop', [[-4.8, -3.6], [-4.8, -5.4], [-2.6, -7], [0.6, -8.2], [4, -8.7], [8.4, -8.4], [6.8, -6.8], [5.2, -5.4], [2.2, -4.6], [-1, -4.2], [-3.4, -3.6]].map(([a, b]) => hp(a, b)), 6));
  sh.push(ell('skinPale', hp(2.2, 0.4), 1.1, 1.5, 6.2, { g: 'ear' }));
  const arm = ([a, bend], z, far) => { const S0 = far ? add(Sh, rf(P(1.8, 0), lean)) : Sh, E = add(S0, d(6.4, a)), Hd = add(E, d(5.6, a + bend)), m = far ? 'nrNexCoatFar' : 'nrNexCoat', g = far ? 'armF' : 'armN';
    sh.push(cap(m, S0, E, 2.6, z, { g }), cap(m, E, Hd, 2.3, z + 0.1, { g }), ell('boot', Hd, 2.1, 2.1, z + 0.2)); };
  arm(armF, 0.5, true); arm(armN, 8, false);
  const post = (ctx, px) => {
    const e = px(hp(-2.7, -0.9)); info.eye = e; ctx.fillStyle = '#16101a'; ctx.fillRect(e.x - 2, e.y - 2, 5, 1);     // heavy brow
    ctx.fillStyle = '#ff3a4a'; ctx.fillRect(e.x - 1, e.y, 3, 1); ctx.fillStyle = '#ffd0d0'; ctx.fillRect(e.x - 1, e.y, 1, 1);   // red implant eye
    ctx.fillStyle = '#9a7ad0'; for (const [sx, sy] of [[-2.6, -6.2], [0.2, -7.2], [3, -7.8]]) { const q = px(hp(sx, sy)); ctx.fillRect(q.x, q.y, 2, 1); }   // the crest catches the neon
    const m = px(hp(-3.4, 3.1)); ctx.fillStyle = '#5a2a2a'; ctx.fillRect(m.x, m.y, 3, 1);
    ctx.fillStyle = '#1e1a34'; for (const by of [-5, 1.5, 5]) { const q = px(tp(-1.4, by)); ctx.fillRect(q.x, q.y, 2, 2); }
    const bk = px(tp(-3.8, -1.9)); ctx.fillStyle = '#c8d0e0'; ctx.fillRect(bk.x, bk.y - 1, 2, 2);                       // belt buckle
  };
  return scaleShapes({ shapes: sh, post }, K);
}

export function skin(B, K, D) {
  const P = { base: '#2a2238', hi: '#ff4fae', top: '#4a3a5a', deep: '#0e0a16', dark: '#1a1424', wall: '#141018', lamp: '#4af0ff', glow: '#4af0ff' };

  // ================= backdrop: the city (neon-art.js). The level and the Nexus's rooftop both stand in front of it =================
  const CITY = city(N, glyph);

  // ================= the wall: shopfronts under a steel gallery =================
  const A = arcadeCanvas(384, 36), x = A.x, Y = A.Y, nz = noise(7);
  const R = (col, x0, y0, w, h) => { x.fillStyle = col; x.fillRect(x0, Y(y0), w, h); };
  const frame = (x0, y0, w, h, col, dim) => { R(C.k, x0 - 1, y0 - 1, w + 2, h + 2); R('#0c0812', x0, y0, w, h); R(dim, x0, y0, w, 1); R(dim, x0, y0 + h - 1, w, 1); R(dim, x0, y0, 1, h); R(dim, x0 + w - 1, y0, 1, h); };
  const text = (s, cx, y, col) => drawText(x, s, cx, Y(y), { fill: col, outline: null, align: 'center' });
  const wdw = (x0, y0, w, h, lit) => { R(C.k, x0 - 1, y0 - 1, w + 2, h + 3); R(C.s1, x0, y0, w, h); R(C.s2, x0, y0, w, 1);
    if (lit) { vgrad(x, x0 + 1, Y(y0 + 1), w - 2, h - 2, lit); for (let j = y0 + 2; j < y0 + h - 2; j += 2) R('rgba(6,5,12,0.45)', x0 + 1, j, w - 2, 1); }
    else { R('#0a0a18', x0 + 1, y0 + 1, w - 2, h - 2); for (let k = 0; k < 4; k++) R('#161a30', x0 + 2 + k, y0 + 5 - k, 1, 1); }
    R(C.s1, x0 + (w >> 1), y0 + 1, 1, h - 2); R(C.s3, x0 - 1, y0 + h, w + 2, 1); };
  const ac = (x0, y0, w = 16, h = 11) => { box(x, x0, Y(y0), w, h, C.s2, C.s4, C.s0); R(C.k, x0 + 2, y0 + 2, 7, 7); R(C.s1, x0 + 3, y0 + 3, 5, 5); R(C.s3, x0 + 5, y0 + 3, 1, 5); R(C.s3, x0 + 3, y0 + 5, 5, 1); R(C.k, x0 + 5, y0 + 5, 1, 1);
    for (let j = y0 + 3; j < y0 + h - 2; j += 2) R(C.s0, x0 + 11, j, w - 13, 1); R(C.k, x0 + 1, y0 + h + 1, 2, 3); R(C.k, x0 + w - 3, y0 + h + 1, 2, 3); };
  const wallP = { base: C.d2, top: C.d3, deep: C.d0, dark: C.d1 };

  // --- above the gallery: low roofs only, so the whole band over the walkway is a window on the city. Flues, a tank, two blade signs, lanterns ---
  const cable = (x0, y0, x1, y1, sag, col = C.k) => { for (let i = x0; i <= x1; i++) { const t = (i - x0) / (x1 - x0); R(col, i, Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag), 1, 1); } };
  const lantern = (lx, ly, col) => { R(C.k, lx + 1, ly - 3, 1, 3); R(C.k, lx - 1, ly - 1, 5, 7); R(col, lx, ly, 3, 5); R('#d08a4a', lx + 1, ly + 1, 1, 3); };
  const roof = (x0, w) => { R(C.k, x0, 93, w, 7); R(C.d2, x0, 94, w, 6); R(C.s2, x0, 93, w, 1); for (let i = x0 + 9; i < x0 + w - 4; i += 19) R(C.d0, i, 95, 1, 5); };
  const mastUp = (mx0, top) => { R(C.k, mx0, top, 1, 93 - top); R(C.k, mx0 - 3, top + 5, 7, 1); R(C.k, mx0 - 2, top + 10, 5, 1); R(C.k, mx0 - 1, 90, 3, 3); };
  // over the noodle bar (x 0..74): the kitchen flue, a fan, the pink blade
  roof(0, 74);
  R(C.k, 8, 62, 7, 31); R(C.s1, 9, 62, 5, 31); R(C.s3, 9, 62, 1, 31); R(C.k, 6, 60, 11, 3); R(C.s2, 7, 60, 9, 2); R(C.s2, 8, 72, 7, 1); R(C.s2, 8, 84, 7, 1);
  R(C.k, 24, 80, 13, 13); R(C.s1, 25, 81, 11, 12); R(C.s3, 25, 81, 11, 1); R(C.k, 26, 82, 9, 9); R(C.s0, 27, 83, 7, 7);   // fan housing (the blades turn in wallFx)
  ac(42, 82, 14, 11);
  glow(x, 65, Y(66), 16, N.p3, 0.45); frame(60, 40, 11, 54, N.p, N.p3); for (let k = 0; k < 5; k++) glyph(x, 63, Y(43 + k * 10), 11 + k, N.p);
  // out over the open walkway (x 74..262) there is no roof at all: one long cable swung across the gap, lanterns all the way down it
  { const cy = (i) => 46 + 34 * ((i - 71) / 193) + Math.sin(((i - 71) / 193) * Math.PI) * 14; cable(71, 46, 264, 80, 14);
    [86, 106, 128, 150, 172, 194, 216, 238].forEach((lx, k) => lantern(lx, Math.round(cy(lx + 1)) + 3, ['#8a3024', '#8a6a24', '#8a3024', '#1f6a7a', '#8a3024', '#8a6a24', '#8a2c66', '#8a6a24'][k])); }
  // over the capsule hotel (x 262..336): a vent, an aerial, the amber 24H blade
  roof(262, 74);
  ac(268, 82, 14, 11); R(C.k, 288, 84, 16, 9); R(C.s1, 289, 85, 14, 8); R(C.s3, 289, 85, 14, 1); for (let i = 291; i < 302; i += 3) R(C.k, i, 87, 1, 5); mastUp(310, 58);
  glow(x, 327, Y(76), 14, N.a3, 0.4); frame(321, 58, 13, 36, N.a, N.a3); ['2', '4', 'H'].forEach((ch, k) => text(ch, 328, 62 + k * 11, N.a));
  // over the second crossing (x 336..384): the cable runs on to the next flue
  cable(334, 60, 392, 62, 9); cable(-50, 60, 8, 62, 9); lantern(350, 69, '#1f6a7a'); lantern(366, 72, '#8a2c66');
  // --- the street wall, bay by bay (world y 118..200) ---
  // 1. the noodle bar (x 0..74)
  R('#1c1418', 0, 118, 74, 82); for (let i = 0; i < 74; i += 6) R('#140e12', i, 118, 1, 82);
  frame(6, 121, 62, 12, N.p2, N.p3); text('NOVA', 24, 124, N.p);
  R(N.a, 42, 127, 9, 1); R(N.a2, 43, 128, 7, 1); R(N.a2, 44, 129, 5, 1); R(N.a2, 45, 130, 3, 1); R('#e8e0d0', 44, 123, 1, 4); R('#e8e0d0', 47, 123, 1, 4);   // bowl + chopsticks
  glyph(x, 54, Y(124), 5, N.a); glyph(x, 61, Y(124), 6, N.a);
  vgrad(x, 6, Y(144), 62, 32, ['#2e1c0e', '#46290f', '#5a3612', '#3e2610']);   // the lit kitchen
  R('#2a1808', 6, 152, 62, 1); R('#2a1808', 6, 161, 62, 1);
  for (let i = 8; i < 66; i += 3) { if (hash(i, 3) > 0.45) R(['#2a5a3a', '#8a6a2a', '#6a2a2a', '#3a4a6a'][Math.floor(hash(i, 4) * 4)], i, 148, 2, 4); if (hash(i, 5) > 0.5) R(['#7a6a4a', '#5a3a2a', '#3a5a5a'][Math.floor(hash(i, 6) * 3)], i, 158, 2, 3); }
  R('#120c10', 31, 158, 13, 18); R('#120c10', 34, 152, 7, 7); R('#b8b8c8', 34, 149, 7, 3); R('#8a8a9c', 34, 151, 7, 1); R('#120c10', 44, 164, 6, 2);   // the cook
  R(C.k, 19, 167, 12, 9); R(C.s2, 20, 168, 10, 8); R(C.s4, 20, 168, 10, 1); R(C.s1, 20, 172, 10, 1); R(C.k, 17, 169, 2, 1); R(C.k, 31, 169, 2, 1);   // the stock pot
  R('#d8d0c0', 50, 174, 6, 1); R('#a8a090', 51, 175, 4, 1); R('#d8d0c0', 59, 174, 6, 1); R('#a8a090', 60, 175, 4, 1);
  for (const lx of [12, 60]) { glow(x, lx + 2, Y(151), 9, '#6a3410', 0.5); R(C.k, lx + 2, 144, 1, 2); R(C.k, lx - 1, 146, 7, 9); R('#a83a26', lx, 147, 5, 7); R('#e8843a', lx + 1, 148, 3, 5); R('#ffc06a', lx + 2, 149, 1, 3); R('#4a1810', lx, 146, 5, 1); R('#4a1810', lx, 154, 5, 1); }
  for (let k = 0; k < 5; k++) { const cx0 = 20 + k * 8; if (k === 0 || k === 4) continue; R('#1a2046', cx0, 144, 7, 7); R('#262e5e', cx0, 144, 7, 1); glyph(x, cx0 + 1, Y(145), 50 + k, '#7a82a8'); }
  // awning: dull red + cream stripes, scalloped
  for (let i = 2; i < 72; i++) { const band = Math.floor((i - 2) / 7) % 2, u = (i - 2) % 7, col = band ? '#8a7a5c' : '#6e2638'; R(col, i, 135, 1, 6); R(band ? '#a8987a' : '#8a3448', i, 135, 1, 1); R(band ? '#6a5c44' : '#4a1626', i, 141, 1, u === 0 || u === 6 ? 1 : u === 1 || u === 5 ? 2 : 3); }
  R(C.k, 1, 134, 72, 1); R(C.k, 1, 135, 1, 7); R(C.k, 72, 135, 1, 7); R('rgba(4,3,8,0.5)', 6, 144, 62, 2);
  R(C.k, 3, 176, 68, 1); R('#6a4a30', 4, 177, 66, 1); R('#4a3424', 4, 178, 66, 2); R(C.k, 4, 180, 66, 1); R('#22161a', 5, 181, 64, 19); for (let i = 5; i < 69; i += 8) R('#180e12', i, 181, 1, 19);
  R('#2e1e22', 8, 184, 14, 9); R('#3c2a2e', 8, 184, 14, 1); glyph(x, 10, Y(185), 77, '#8a7a5c'); glyph(x, 16, Y(185), 78, '#8a7a5c');
  for (const sx of [29, 45, 61]) { R(C.k, sx - 1, 185, 9, 4); R('#6e2638', sx, 186, 7, 2); R('#a03c50', sx, 186, 7, 1); R(C.k, sx + 2, 189, 3, 11); R(C.s2, sx + 3, 189, 1, 10); R(C.s1, sx + 1, 195, 5, 1); R(C.k, sx, 199, 7, 1); }
  // two customers hunched over their bowls, backs to us: silhouettes with a rim of kitchen light
  for (const [sx, hood] of [[45, 0], [61, 1]]) { R('#0a0810', sx - 1, 175, 9, 11); R('#0a0810', sx, 173, 7, 2); R('#0a0810', sx + 1 - hood, 167 - hood, 5 + hood * 2, 6 + hood); R('#7a5428', sx - 1, 175, 1, 9); R('#7a5428', sx, 173, 1, 2); R('#9a6c30', sx + 1 - hood, 167 - hood, 4 + hood * 2, 1); R('#7a5428', sx + 1 - hood, 168 - hood, 1, 4); }
  // --- from here the walkway's back edge is OPEN: this is a deck high over the city canyon. A railing, slim posts up to the gallery, things hung
  // from the gallery's beam, and behind all of it the city (neon-art.js). Only the bar and the capsule hotel are built up ---
  const open = (x0, w) => { x.clearRect(x0, Y(118), w, 86); R(C.k, x0, 118, w, 4); R(C.d1, x0, 118, w, 3); R(C.s1, x0, 118, w, 1); R(C.k, x0, 122, 2, 78); R(C.d3, x0, 122, 1, 78); R(C.k, x0 + w - 2, 122, 2, 78); };
  const post = (px0) => { R(C.k, px0, 122, 4, 78); R(C.s1, px0 + 1, 122, 2, 78); R(C.s3, px0 + 1, 122, 1, 78); for (const j of [122, 152, 182]) { R(C.k, px0 - 1, j, 6, 3); R(C.s2, px0, j, 4, 1); } };
  const rail = (x0, w) => { R('rgba(8,10,18,0.5)', x0, 188, w, 12); for (let i = x0 + 5; i < x0 + w; i += 12) R(C.k, i, 188, 1, 12); R(C.k, x0, 185, w, 3); R(C.s3, x0, 185, w, 1); R(C.s1, x0, 186, w, 1); R(C.k, x0, 193, w, 1);
    for (let i = x0 + 11; i < x0 + w - 2; i += 24) { R(C.k, i - 1, 188, 3, 3); R(N.a2, i, 189, 1, 1); } };
  const lamp = (lx, ly, col) => { R(C.k, lx + 1, ly - 3, 1, 2); R(C.k, lx - 1, ly - 1, 5, 6); R(col, lx, ly, 3, 4); R('rgba(255,255,255,0.3)', lx + 1, ly + 1, 1, 2); };
  const str = (x0, x1, sag, items) => { cable(x0, 124, x1, 124, sag); for (const [lx, col] of items) lamp(lx, Math.round(124 + Math.sin(((lx + 1 - x0) / (x1 - x0)) * Math.PI) * sag) + 3, col); };
  const hang = (x0, y0, n, col, dim, seed) => { R(C.k, x0 + 2, 122, 1, y0 - 122); R(C.k, x0 + 8, 122, 1, y0 - 122); frame(x0, y0, 11, n * 10 + 4, col, dim); for (let k = 0; k < n; k++) glyph(x, x0 + 3, Y(y0 + 3 + k * 10), seed + k, col); };
  // people wait at the rail under umbrellas with lit shafts (all silhouette, far darker than anything you can touch, so nobody mistakes them for trouble)
  const ped = (cx, h, col, dim) => { const y0 = 200 - h;
    glow(x, cx + 3, Y(y0 + 7), 7, dim, 0.55);
    R('#0d0e1a', cx - 7, y0 + 1, 15, 2); R('#0d0e1a', cx - 5, y0, 11, 1); R('#0d0e1a', cx - 2, y0 - 1, 5, 1); R('#2e3350', cx - 5, y0, 11, 1); R('#2e3350', cx - 2, y0 - 1, 5, 1); R('#2e3350', cx - 7, y0 + 1, 2, 1); R('#2e3350', cx + 6, y0 + 1, 2, 1);
    R(dim, cx - 6, y0 + 3, 13, 1);
    R('#08090f', cx - 2, y0 + 5, 4, 4); R('#08090f', cx - 3, y0 + 9, 7, h - 9); R('#08090f', cx - 4, y0 + 12, 9, h - 14); R('#1f2338', cx - 4, y0 + 12, 1, h - 16); R('#1f2338', cx - 2, y0 + 5, 1, 3);
    R(col, cx + 3, y0 + 3, 1, 11); R('#08090f', cx + 2, y0 + 14, 3, 2); };
  const vend = (x0, body, hi, pane, shelf, items) => { R(C.k, x0 - 1, 163, 14, 37); R(body, x0, 164, 12, 36); R(hi, x0, 164, 12, 1); R(hi, x0, 164, 1, 36); R(C.k, x0 + 1, 167, 8, 20); R(pane, x0 + 2, 168, 6, 18);
    for (let j = 169; j < 186; j += 6) { for (let i = 0; i < 3; i++) R(items[(i + j) % items.length], x0 + 2 + i * 2, j, 1, 3); R(shelf, x0 + 2, j + 4, 6, 1); }
    R(C.k, x0 + 10, 170, 1, 6); R(N.a, x0 + 10, 178, 1, 1); R(C.k, x0 + 2, 190, 8, 4); R(C.s0, x0 + 3, 191, 6, 2); glyph(x, x0 + 3, Y(195), x0, hi); };
  // 2. the long open run (x 74..262): the queue for the bar, a string of warm lanterns, a hanging blade sign, more lanterns, a hologram ad
  open(74, 188); rail(76, 184); post(118); post(166); post(214);
  ped(85, 26, '#9aeaff', N.c3); ped(99, 23, '#ffb0e0', N.p3); ped(110, 27, '#ffe8a0', N.a3);
  str(76, 118, 8, [[84, '#c8502c'], [95, '#d89030'], [106, '#c8502c']]);
  hang(137, 128, 3, N.p, N.p3, 31);
  str(170, 214, 7, [[178, '#1f8ea6'], [190, '#b02c78'], [202, '#b8802c']]);
  R(C.k, 226, 122, 24, 4); R(C.s2, 227, 122, 22, 2); R(N.c2, 229, 125, 18, 1); R(C.k, 225, 122, 1, 7); R(C.k, 250, 122, 1, 7);   // the emitter that throws a hologram ad down into the walkway (she is drawn in wallFx)
  // 4. the capsule hotel (x 262..336)
  panels(x, 262, Y(118), 74, 82, { base: '#221628', top: '#2c1e34', deep: '#100a16', dark: '#1a1020' }, 24, 20, nz, 3);
  for (let k = 0; k < 6; k++) { const wx = 265 + k * 12, lit = k === 1 ? '#1a5a6a' : k === 4 ? '#6a4a1c' : '#0c0a14'; R(C.k, wx, 122, 10, 10); R(C.s1, wx + 1, 123, 8, 8); R(lit, wx + 2, 124, 6, 6); R(C.k, wx + 1, 123, 1, 1); R(C.k, wx + 8, 123, 1, 1); R(C.k, wx + 1, 130, 1, 1); R(C.k, wx + 8, 130, 1, 1); R('rgba(255,255,255,0.14)', wx + 2, 124, 6, 1); }
  glow(x, 299, Y(142), 20, N.a3, 0.35); frame(276, 136, 46, 12, N.a2, N.a3); glyph(x, 280, Y(139), 90, N.a); text('PODS', 299, 139, N.a); glyph(x, 314, Y(139), 91, N.a);
  R(C.k, 283, 150, 32, 50); vgrad(x, 285, Y(152), 28, 48, ['#34142c', '#4a1c3c', '#3a1630', '#220c1c']);
  R('#1a0a16', 300, 176, 12, 18); R('#2a1022', 300, 176, 12, 1); R('#1a0a16', 304, 168, 4, 8); R('#1a0a16', 303, 164, 6, 5); R('#e8a0c8', 290, 152, 1, 6); R('#ffd0ec', 289, 158, 3, 2);   // desk, clerk, hanging lamp
  R('rgba(120,200,220,0.16)', 285, 152, 11, 42); R('rgba(255,255,255,0.14)', 287, 154, 1, 30); R(C.k, 296, 152, 1, 42);
  R(N.p, 284, 151, 30, 1); R(N.p, 284, 151, 1, 43); R(N.p, 313, 151, 1, 43);
  R(C.k, 281, 193, 36, 7); R(C.s2, 282, 194, 34, 3); R(C.s4, 282, 194, 34, 1); R(C.k, 279, 196, 40, 4); R(C.s1, 280, 197, 38, 3); R(C.s3, 280, 197, 38, 1);
  // the vending block either side of the door
  glow(x, 272, Y(178), 12, '#12303c', 0.4); glow(x, 326, Y(178), 12, '#3a2a10', 0.4);
  vend(267, '#44202e', '#6e3044', '#1c5868', '#3aa0b8', ['#e86a8a', '#ffd06a', '#8af0c0']); vend(320, '#1a2a48', '#2c4470', '#6a5218', '#c8a040', ['#ff6a3a', '#f0f0f0', '#6ac8ff']);
  R(C.k, 269, 149, 7, 6); R(N.c2, 270, 150, 5, 4); R(N.c, 271, 151, 3, 2);
  glow(x, 325, Y(152), 8, N.a3, 0.5); R(C.k, 322, 149, 7, 6); R(N.a2, 323, 150, 5, 4); R(N.a, 324, 151, 3, 2);
  // 5. the second open run (x 336..384): more umbrellas at the rail, an amber sign
  open(336, 48); rail(338, 44); post(358);
  ped(347, 26, '#ffb0e0', N.p3); ped(373, 23, '#9aeaff', N.c3);
  hang(366, 128, 2, N.a, N.a3, 37);
  // --- the gallery: a steel walkway with a railing and a strip of cyan tube; brackets and cable runs under it, its shadow on the two frontages ---
  for (let j = 0; j < 6; j++) for (const sx of [0, 262]) R(`rgba(3,2,8,${0.6 - j * 0.09})`, sx, 118 + j, 74, 1);
  for (let i = 4; i < 384; i += 8) { R(C.k, i, 101, 1, 9); } R(C.k, 0, 100, 384, 2); R(C.s2, 0, 100, 384, 1); R(C.s0, 0, 105, 384, 1);
  R(C.k, 0, 109, 384, 10); R(C.s1, 0, 110, 384, 7); R(C.s4, 0, 110, 384, 1); R(C.s2, 0, 111, 384, 1); R(C.s0, 0, 116, 384, 1);
  for (let i = 0; i < 384; i += 24) { R(C.k, i, 111, 1, 6); R(C.s3, i + 2, 114, 1, 1); R(C.s3, i + 21, 114, 1, 1); }
  for (let i = 6; i < 384; i += 24) { R(N.c3, i - 1, 113, 14, 1); R(N.c2, i, 113, 12, 1); }
  for (let i = 22; i < 384; i += 48) { for (let k = 0; k < 6; k++) { R(C.k, i - 1, 119 + k, 7 - k + 1, 1); R(C.s1, i, 119 + k, 6 - k, 1); } R(C.s3, i, 119, 1, 6); }
  for (let i = 0; i < 384; i += 32) cable(i, 125, i + 32, 125, 2 + ((i >> 5) % 2)); for (let i = 16; i < 384; i += 32) R(C.s1, i, 124, 1, 2);
  R(C.d0, 0, 200, 384, 4);
  const arc = A.c;

  // live on the wall: flickering signs, steam, the vending machines' glow, drips off the awning
  const steam = (ctx, sx, sy, f, n, rise, col, seed) => { for (let i = 0; i < n; i++) { const t = (f + i * Math.floor(rise / n) + seed * 13) % rise, k = t / rise; ctx.globalAlpha = 0.3 * (1 - k); ctx.fillStyle = col; const s = 2 + Math.floor(k * 5);
    ctx.fillRect(Math.round(sx + Math.sin((f + i * 37 + seed * 5) / 15) * (1 + k * 3) - s / 2 + k * 4), Math.round(sy - k * rise * 0.42 - s / 2), s, s - 1); } ctx.globalAlpha = 1; };
  const flick = (f, seed) => { const k = (f + seed * 67) % 310; return (k > 240 && k < 246) || (k > 252 && k < 255) || (k > 262 && k < 290 && (k >> 1) % 3 === 0); };
  // a VOLLEBAK ad stand in the long open run, on one wall tile in three (four or so a level): the name on a board across the two posts,
  // and under it a light box showing the three jackets in turn (Full Metal Jacket, Solar Charged Jacket, Black Squid Jacket: the art is CITY.ads). Drawing only.
  let scroll = 0;                                    // how far the wall has scrolled (backFx is told, wallFx is not)
  const kiosk = (ctx, base, Yw, f) => {
    const X = base + 166, y0 = Yw(126), KA = CITY.ads.kiosk, B = (col, x0, y, w, h) => { ctx.fillStyle = col; ctx.fillRect(X + x0, y0 + y, w, h); };
    B(C.k, -1, -1, 54, 14); B('#0c0812', 0, 0, 52, 12); B(N.a3, 0, 0, 52, 1); B(N.a3, 0, 11, 52, 1); B(N.a3, 0, 0, 1, 12); B(N.a3, 51, 0, 1, 12);
    drawText(ctx, 'VOLLEBAK', X + 26, y0 + 2, { fill: flick(f, 21) ? '#5a4424' : '#d8a850', outline: null, align: 'center' });
    const slot = Math.floor(f / 270) % 3, t = f % 270; let img, rim;
    if (slot === 0) { const q = t % 124; img = KA.fmj[q < 40 ? 1 + (q >> 2) : 0]; rim = '#6e3814'; }
    else if (slot === 1) { const g = t < 40 ? 0 : Math.max(0, 1 - (t - 40) / 210); img = KA.solar[Math.round(Math.pow(g, 0.7) * 4)]; rim = '#1c5a34'; }
    else { img = KA.squid[(f >> 3) % 12]; rim = '#6a64a8'; }
    B(C.k, 10, 13, 32, 38); B(slot === 2 ? '#4a4682' : '#0a0710', 11, 14, 30, 36); if (slot === 2) B('#5a5494', 12, 15, 28, 12); B(rim, 11, 14, 30, 1); B(rim, 11, 49, 30, 1); B(rim, 11, 14, 1, 36); B(rim, 40, 14, 1, 36);
    if (t > 3) { ctx.drawImage(img, X + 12, y0 + 16); if (slot === 1 && t < 40) { ctx.globalAlpha = 0.2 * Math.sin((t / 40) * Math.PI); B('#e8fff0', 12, 15, 28, 34); ctx.globalAlpha = 1; } }
    ctx.drawImage(CITY.ads.scan, 0, 0, 28, 34, X + 12, y0 + 15, 28, 34);
    ctx.fillStyle = 'rgba(16,12,30,0.26)'; ctx.fillRect(X + 12, y0 + 15, 28, 34);      // held back: an ad behind the street, dimmer than anything you can touch
  };
  const wallFx = (ctx, base, Yw, f) => {
    if (base > 330 || base + 384 < -10) return;
    if ((((Math.round((scroll + base) / 384) % 3) + 3) % 3) === 1) kiosk(ctx, base, Yw, f);
    const dark = (x0, y0, w, h, a = 0.78) => { ctx.fillStyle = `rgba(10,8,18,${a})`; ctx.fillRect(base + x0, Yw(y0), w, h); };
    const lit = (x0, y0, w, h, col, a) => { ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(base + x0, Yw(y0), w, h); ctx.globalAlpha = 1; };
    const pulse = 0.05 + 0.03 * Math.sin(f / 23);
    lit(54, 36, 23, 62, N.p, pulse); lit(316, 54, 23, 44, N.a, pulse * 0.7); lit(133, 124, 19, 42, N.p, pulse * 0.8); lit(362, 124, 19, 32, N.a, pulse * 0.6);   // halos
    if (flick(f, 4)) dark(323, 71, 9, 10, 0.7);                                 // the 4 in 24H
    if ((f >> 4) % 3 === 0) lit(310, 57, 1, 1, '#ff3a4a', 1);
    if (flick(f, 7)) dark(61, 62, 9, 10, 0.7);                                  // one glyph on the pink blade
    if (flick(f, 12)) dark(139, 140, 7, 9, 0.7);                                // ...and one on the hanging one
    if (!flick(f, 9)) { lit(284, 151, 30, 1, '#ffc0e4', 0.7); lit(284, 151, 1, 43, '#ffc0e4', 0.7); lit(313, 151, 1, 43, '#ffc0e4', 0.7); lit(280, 148, 38, 48, N.p, 0.05); } else dark(284, 151, 30, 43, 0.35);
    // the hologram ad hung in the open run: a small cyan dancer in the cone under her emitter. She stutters
    { const k = (f + 150) % 260, on = !(k < 4 || (k > 8 && k < 11) || (k > 200 && k < 204)), hx = base + 228;
      ctx.globalAlpha = 0.06; ctx.fillStyle = N.c; ctx.beginPath(); ctx.moveTo(hx + 6, Yw(126)); ctx.lineTo(hx - 3, Yw(172)); ctx.lineTo(hx + 23, Yw(172)); ctx.lineTo(hx + 14, Yw(126)); ctx.fill();
      if (on) { ctx.globalAlpha = 0.5 + 0.12 * Math.sin(f / 4); ctx.drawImage(CITY.small, hx, Yw(128) + ((f >> 4) % 2)); if (k > 120 && k < 128) ctx.drawImage(CITY.small, 0, 14, 20, 5, hx + 3, Yw(142), 20, 5); }
      ctx.globalAlpha = 1; lit(229, 125, 18, 1, '#c8fbff', on ? 0.9 : 0.3); }
    for (const [ux, uy] of [[88, 177], [102, 180], [113, 176], [350, 177], [376, 180]]) lit(ux, uy, 1, 11, '#ffffff', 0.3 + 0.25 * Math.sin(f / 9 + ux));   // the umbrella shafts hum
    if ((f >> 2) % 2) { lit(28, 86, 5, 1, C.s4, 0.8); lit(30, 84, 1, 5, C.s2, 0.8); } else { lit(30, 84, 1, 5, C.s4, 0.8); lit(28, 86, 5, 1, C.s2, 0.8); }   // the fan
    lit(6, 144, 62, 32, '#ffb04a', 0.04 + 0.02 * Math.sin(f / 9));              // the kitchen light breathes
    lit(80, 126, 32, 14, '#ff9a4a', 0.04 + 0.02 * Math.sin(f / 13));            // ...and so do the lanterns over the queue
    steam(ctx, base + 25, Yw(166), f, 4, 60, '#c8b8a8', 1); steam(ctx, base + 53, Yw(166), f, 3, 50, '#c8b8a8', 8); steam(ctx, base + 11, Yw(58), f, 5, 110, '#6a6a8a', 3); steam(ctx, base + 296, Yw(84), f, 4, 90, '#6a6a8a', 5);
    steam(ctx, base + 90, Yw(200), f, 5, 90, '#8a8aa8', 2); steam(ctx, base + 250, Yw(200), f, 5, 90, '#8a8aa8', 6);   // steam off the deck grates
    for (const [vx, col] of [[269, '#8af0ff'], [322, '#ffe09a']]) { const j = (f >> 2) % 26; if (j < 18) lit(vx, 168 + j, 6, 1, col, 0.35); lit(vx - 3, 196, 12, 4, col, 0.07); }
    for (const [dx, ph] of [[9, 0], [37, 23], [65, 47]]) { const t = (f + ph) % 70; if (t < 30) { const yy = 144 + t * t * 0.062; ctx.fillStyle = '#9ab8e0'; ctx.fillRect(base + dx, Yw(yy), 1, 2); } }
  };

  // ================= the deck: wet pavement, kerb, drain, foundation (384 wide, in step with the wall) =================
  const DK = deckCanvas(384), dx = DK.x; { const R = (col, x0, y0, w, h) => { dx.fillStyle = col; dx.fillRect(x0, y0, w, h); };
    R('#2a2a44', 0, 0, 384, 4); R('#8a90b8', 0, 0, 384, 1); R('#3a3c5a', 0, 1, 384, 1); R(C.k, 0, 4, 384, 1);
    for (let i = 0; i < 384; i += 16) { R('#16162a', i + 7, 1, 1, 3); if (hash(i, 2) > 0.5) R('#b8c0e0', i + 2 + Math.floor(hash(i, 3) * 8), 0, 3, 1); }
    R('#20203a', 0, 5, 384, 7); R('#2e2e4c', 0, 5, 384, 1); for (let i = 20; i < 384; i += 32) R('#12122a', i, 5, 1, 7); R(C.k, 0, 12, 384, 1);
    // what the signs do to a wet street
    const smear = (x0, w, col, a) => { for (let i = x0; i < x0 + w; i++) { const hh = Math.floor(hash(i, 41) * 9 * (1 - Math.abs((i - x0) / w - 0.5) * 1.4)); dx.globalAlpha = a; dx.fillStyle = col; for (let j = 1; j < 1 + hh; j++) if (j !== 4 && (i + j) % 2 === 0) dx.fillRect(i, j, 1, 1); if (hh > 2) dx.fillRect(i, 1, 1, 1); } dx.globalAlpha = 1; };
    smear(6, 62, '#ffb04a', 0.5); smear(282, 34, N.p, 0.5); smear(266, 14, '#8af0ff', 0.3); smear(319, 14, '#ffe09a', 0.3); smear(224, 28, N.c, 0.35); smear(132, 20, N.p, 0.3); smear(78, 40, '#ff8a4a', 0.2);
    for (const gx of [84, 244]) { R(C.k, gx - 1, 5, 14, 7); R(C.s1, gx, 6, 12, 5); for (let i = gx + 1; i < gx + 12; i += 2) R(C.k, i, 7, 1, 3); }
    vgrad(dx, 0, 13, 384, 27, ['#18182e', '#121226', '#0c0c1a', '#07070f']); for (let j = 13; j < 40; j += 7) { R('#0a0a16', 0, j, 384, 1); for (let i = (j % 14 ? 0 : 20); i < 384; i += 40) R('#0a0a16', i, j, 1, 7); }
    R(C.k, 0, 18, 384, 4); R(C.s1, 0, 19, 384, 2); R(C.s3, 0, 19, 384, 1); for (let i = 10; i < 384; i += 48) { R(C.k, i, 17, 4, 6); R(C.s2, i + 1, 18, 2, 4); }
    R(C.k, 130, 24, 7, 6); R(C.s1, 131, 25, 5, 4); R(C.k, 132, 26, 3, 3); R(N.c2, 133, 29, 1, 5); R(N.c3, 133, 34, 1, 4); R(C.k, 318, 24, 7, 6); R(C.s1, 319, 25, 5, 4); R(C.k, 320, 26, 3, 3); R(N.p2, 321, 29, 1, 4); R(N.p3, 321, 33, 1, 4); }
  const pit = pitCycle(['#05040c', '#0c0a1e', '#1a1040', '#3a1660', '#b8389a', '#4af0ff', '#2a1458', '#120c2a'], 31);

  // ================= foreground: black street furniture close to the lens =================
  const fg = cv(640, 240); { const g = fg.getContext('2d'), kk = '#040309', R = (col, x0, y0, w, h) => { g.fillStyle = col; g.fillRect(x0, y0, w, h); };
    const cab = (x0, y0, x1, y1, sag) => { for (let i = x0; i <= x1; i++) { const t = (i - x0) / (x1 - x0); R(kk, i, Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag), 1, 2); } };
    cab(0, 58, 210, 60, 12); cab(210, 60, 430, 56, 14); cab(430, 56, 640, 58, 10); cab(120, 52, 520, 54, 6);
    R(kk, 140, 68, 1, 6); R(kk, 151, 69, 1, 5); R(kk, 136, 74, 20, 12); R('#141028', 137, 75, 18, 1);                       // a hanging sign, seen from behind
    R(kk, 330, 70, 1, 5); R(kk, 327, 75, 7, 9); R('#3a1020', 329, 78, 3, 3);                                                // a dead lantern
    R(kk, 520, 64, 1, 6); R(kk, 517, 70, 7, 14); R('#5a1420', 519, 72, 3, 3); R('#14122a', 519, 77, 3, 3);                   // signal light
    for (let i = 30; i < 640; i += 118) { R(kk, i, 230, 5, 10); R(kk, i - 1, 229, 7, 2); R('#14122a', i, 230, 1, 9); }       // bollards
    R(kk, 196, 228, 9, 12); R(kk, 194, 232, 13, 3); R(kk, 198, 225, 5, 3); R('#14122a', 196, 228, 1, 11);                    // hydrant
    for (let i = 380; i < 470; i += 12) R(kk, i, 228, 2, 12); R(kk, 378, 227, 96, 2); R(kk, 378, 233, 96, 1); R('#14122a', 378, 227, 96, 1);   // a run of railing
    for (const [bx0, w] of [[560, 14], [570, 18], [584, 11]]) { for (let k = 0; k < w; k++) { const hh = Math.round(Math.sin((k / w) * Math.PI) * (5 + (w >> 2))); R(kk, bx0 + k, 240 - hh, 1, hh); } } R(kk, 577, 229, 2, 3);   // bin bags
  }

  // ================= platforms =================
  const drawPlat = (ctx, p, x, y, w, f, Yw) => {
    const k = p.kind, R = (col, x0, y0, ww, hh) => { ctx.fillStyle = col; ctx.fillRect(x0, y0, ww, hh); };
    if (k === 'crumble' && p.crumble > 0) { y += f % 4 < 2 ? 1 : 0; x += (f % 3) - 1; }
    if (p.gone) ctx.globalAlpha = Math.max(0, 1 - (p.fallT || 0) / 40);
    if (k === 'ledge') {                       // a steel balcony hung from the gallery, striped awning valance, a cyan tube along the edge
      if (!p.gone) for (const cx of [x + 5, x + w - 6]) { R('#000', cx - 1, Yw(118), 3, y - Yw(118)); R(C.s3, cx, Yw(118), 1, y - Yw(118)); R(C.s4, cx - 1, y - 14, 3, 2); }
      R('#000', x - 1, y - 1, w + 2, 10); R(C.s2, x, y, w, 8); R('#e0e4ff', x, y, w, 1); R(C.s4, x, y + 1, w, 1); for (let i = x + 3; i < x + w - 2; i += 8) R(C.s0, i, y + 3, 1, 2);
      R((f >> 3) % 9 === 0 ? '#c8fbff' : N.c, x + 1, y + 6, w - 2, 1); R(N.c3, x, y + 7, w, 1);
      for (let i = 1; i < w - 1; i++) { const band = Math.floor(i / 6) % 2, u = i % 6, hh = u === 0 || u === 5 ? 2 : 4; R('#000', x + i, y + 9, 1, hh + 1); R(band ? '#3a1638' : N.p2, x + i, y + 9, 1, hh); }
    } else if (k === 'crumble') {              // a hologram: stands on light, glitches, then drops you
      const bad = p.crumble > 0, id = p.id || 0, g = bad ? (f >> 1) : (f >> 2);
      ctx.save(); ctx.globalAlpha *= 0.5; R('#000', x + 3, y - 1, w - 6, 9); ctx.restore();
      for (let j = 0; j < 7; j++) { const gl = hash(g + j * 7, id) > (bad ? 0.5 : 0.93) ? Math.round((hash(g, j + id) - 0.5) * (bad ? 10 : 5)) : 0, a = j === 0 ? 1 : ((j + (f >> 3)) % 2 ? 0.7 : 0.35);
        const al = ctx.globalAlpha; ctx.globalAlpha = al * a; R(j === 0 ? '#e8ffff' : bad && (f >> 1) % 2 ? N.p : N.c, x + 3 + gl, y + j, w - 6, 1); ctx.globalAlpha = al; }
      if (!bad) for (let i = x + 8; i < x + w - 8; i += 9) { const al = ctx.globalAlpha; ctx.globalAlpha = al * 0.8; R('#e8ffff', i, y + 3, 4, 1); ctx.globalAlpha = al; }
      for (const ex of [x, x + w - 4]) { R('#000', ex - 1, y - 2, 6, 11); R(C.s3, ex, y - 1, 4, 9); R('#e0e4ff', ex, y - 1, 4, 1); R(C.s1, ex + 2, y, 2, 8); R(bad ? ((f >> 1) % 2 ? '#fff' : N.r) : N.p, ex + 1, y + 2, 2, 2); }
    } else if (k === 'movev' || k === 'moveh') {   // a hover drone pad: hazard stripes, thrusters, a beacon
      const fl = (f >> 1) % 3;
      for (const ex of [x + 2, x + w - 9]) { R('#000', ex - 1, y + 7, 9, 5); R(C.s1, ex, y + 8, 7, 3); R(C.s3, ex, y + 8, 7, 1); R('#bff4ff', ex + 1, y + 11, 5, 1 + fl); R(N.c, ex + 2, y + 12 + fl, 3, 2); R('#1f8ea6', ex + 3, y + 14 + fl, 1, 2); }
      R('#000', x - 1, y - 1, w + 2, 9); R(C.s3, x, y, w, 7); R('#f0f2ff', x, y, w, 1); R(C.s4, x, y + 1, w, 1); R(C.s1, x, y + 6, w, 1);
      for (let i = 2; i < w - 2; i++) R(((i + 2) >> 2) % 2 ? N.a : '#16141c', x + i, y + 3, 1, 2);
      R('#000', x + (w >> 1) - 2, y + 7, 5, 3); R((f >> 4) % 2 ? (k === 'movev' ? N.r : '#4aff8a') : '#3a1a1a', x + (w >> 1) - 1, y + 7, 3, 2);
    } else {                                   // a hover sign: amber characters, two lifters under it
      const fl = (f >> 2) % 2;
      for (const ex of [x + 3, x + w - 7]) { R('#000', ex - 1, y + 7, 6, 3); R(C.s2, ex, y + 7, 4, 2); R(fl ? '#bff4ff' : N.c, ex + 1, y + 9, 2, 2 + fl); }
      R('#000', x - 1, y - 1, w + 2, 9); R('#2a1c0e', x, y, w, 7); R('#fff0c0', x, y, w, 1); R(N.a2, x, y + 1, w, 1); R(N.a3, x, y + 6, w, 1); R(N.a2, x, y + 1, 1, 6); R(N.a2, x + w - 1, y + 1, 1, 6);
      for (let i = 3; i < w - 5; i += 5) { const s = (p.id || 0) * 7 + i; R(N.a, x + i, y + 3, 3, 1); if (hash(s, 1) > 0.4) R(N.a, x + i, y + 3, 1, 3); if (hash(s, 2) > 0.4) R(N.a, x + i + 2, y + 4, 1, 2); if (hash(s, 3) > 0.6) R(N.a, x + i, y + 5, 3, 1); }
    }
    ctx.globalAlpha = 1;
  };
  // the drips: a broken neon tube under the gallery, leaking its glowing coolant
  const drawPipe = (ctx, x, Yw, prog, f) => {
    const y0 = Yw(118), py = Yw(122), R = (col, x0, yy, w, h) => { ctx.fillStyle = col; ctx.fillRect(x0, yy, w, h); };
    const sp = hash(f >> 2, x & 63) > 0.72;
    ctx.globalAlpha = 0.1 + 0.05 * Math.sin(f / 7); R(N.c, x - 17, y0 - 2, 20, 11); ctx.globalAlpha = 1;
    R('#000', x - 15, y0 - 1, 3, 5); R(C.s3, x - 14, y0, 1, 3); R('#000', x + 11, y0 - 1, 3, 5); R(C.s3, x + 12, y0, 1, 3);                // brackets
    R('#000', x - 16, y0 + 2, 15, 5); R(N.c, x - 15, y0 + 3, 13, 3); R('#e8ffff', x - 15, y0 + 3, 13, 1); R(N.c2, x - 15, y0 + 5, 13, 1);   // the half that still works
    R('#000', x - 2, y0 + 3, 2, 3); R('#bff4ff', x - 2, y0 + 4, 1, 1);                                                                       // the jagged break (the leak)
    for (let k = 0; k < 11; k++) { const yy = y0 + 3 + Math.round(k * k * 0.07); R('#000', x + 2 + k, yy - 1, 1, 5); R(sp ? N.c2 : '#16384a', x + 2 + k, yy, 1, 3); R(sp ? '#bff4ff' : '#24566a', x + 2 + k, yy, 1, 1); }   // the dead half, sagging
    if (sp) { R('#fff', x + (f % 5) - 1, py + 2 + (f % 3), 1, 1); R(N.p, x + 3 - (f % 4), py + 3, 1, 1); R('#fff', x + 1, y0 + 4, 1, 1); }
    R(N.c, x - 1, py, 2, 2); R('#e8ffff', x - 1, py, 1, 1); const r = Math.floor(prog * 4); if (r > 0) { R(N.c, x - Math.floor(r / 2), py + 2, r, r + 1); R('#fff', x - Math.floor(r / 2), py + 2, 1, 1); }
  };

  // ================= the cast =================
  const SYN = { denim: 'skinPale', blond: 'platinum', skin: 'skinPale', skinFar: 'skinPale', trousers: 'dark', trousersFar: 'cape' }, DROP = ['acid', 'glass', 'beard'];
  const sci = (p, map, k, w, h, ox, oy) => { let g = recolor(scientistShapes(p), { ...SYN, ...map }, DROP); if (k !== 1) g = scaleShapes(g, k); return renderShapes(g.shapes, w, h, ox, oy, { post: g.post }); };
  const six = (fn) => Array.from({ length: 6 }, (_, i) => fn(i / 6));
  const synth = six((p) => sci(p, { white: 'nrRain', whiteFar: 'nrRainFar' }, 1, 36, 48, 18, 45));
  const brute = six((p) => sci(p, { white: 'nrCoat', whiteFar: 'nrCoatFar' }, 1.35, 50, 66, 25, 62));
  // the replicant: every other walker wears a clear yellow slicker and a pink bob. The puker gets red vinyl and teal hair, so no two jobs share a body
  const repl = six((p) => sci(p, { white: 'nrSlick', whiteFar: 'nrSlickFar', blond: 'nrBob' }, 1, 36, 48, 18, 45)), punk = six((p) => sci(p, { white: 'nrVinyl', whiteFar: 'nrVinylFar', blond: 'nrTeal' }, 1, 36, 48, 18, 45));
  const DG = dangers();
  const chr = { grunt: synth, gruntAlt: repl, puker: punk, gunner: DG.gunner, seeker: DG.seeker, brute: brute.slice(0, 4), bruteDizzy: tint(brute[0], '#ffffff', 0.4), brutePuke: [brute[2], brute[3]],
    ghoul: { sit: synth[0], leap: synth[2], land: synth[4] }, biker: [fr(B.spinner.c, B.spinner.ox, B.spinner.oy - 4)], slime: hopBot(1), slimeSmall: hopBot(0.62),
    batF: [B.owl, B.owlSit], batFlashF: tint(B.owl, '#ffffff', 0.8), unicornFly: [B.spinner], flyFlash: tint(B.spinner, '#ffffff', 0.8),
    unicorn: [B.owlSit], unicornPuke: B.owl, unicornFlash: tint(B.owlSit, '#ffffff', 0.8) };

  // ================= the boss: THE NEXUS. He charges; jump and land on his head. Three times. =================
  const NW = 124, NH = 96, NOX = 70, NOY = 90;
  const mk = (o) => { const info = {}, g = nexusRig(o, info), r = renderShapes(g.shapes, NW, NH, NOX, NOY, { post: g.post }); r.eye = { x: info.eye.x - NOX, y: info.eye.y - NOY }; return r; };
  const cyc = (n, fn) => Array.from({ length: n }, (_, i) => mk(fn((i / n) * TAU)));
  const stride = (T, amp, k0, k1) => [[amp * Math.sin(T + Math.PI), k0 + k1 * Math.max(0, Math.cos(T + Math.PI))], [amp * Math.sin(T), k0 + k1 * Math.max(0, Math.cos(T))]];
  const F = {
    walk: cyc(8, (T) => ({ T, lean: 0.07, headLean: 0.1, legs: stride(T, 0.42, 0.15, 0.9), armN: [-0.35 * Math.sin(T), 0.35], armF: [0.35 * Math.sin(T), 0.35], fly: 0.06 })),
    run: cyc(6, (T) => ({ T, lean: 1.3, headLean: 0.82, legs: stride(T, 0.95, 0.55, 1.3), armN: [0.25 - 0.9 * Math.sin(T), 1.3], armF: [1.25, 0.25], fly: 1 })),
    crouch: mk({ lean: 0.78, headLean: 0.3, legs: [[-0.55, 0.9], [1, 1.7]], armN: [0.55, 0.15], armF: [-0.9, 0.5], fly: 0.25 }),
    skid: mk({ lean: -0.32, headLean: -0.05, legs: [[-0.3, 0.9], [0.8, 0.05]], armN: [0.9, 0.5], armF: [-0.7, -0.3], fly: 0.1 }),
    dizzy: cyc(6, (T) => ({ T, lean: -0.1 + 0.08 * Math.sin(T), headLean: -0.1 + 0.3 * Math.sin(T + 1), legs: [[-0.22 * Math.sin(T), 0.3], [0.22 * Math.sin(T), 0.3]], armN: [0.15 + 0.25 * Math.sin(T), 0.15], armF: [-0.2 - 0.2 * Math.sin(T), 0.15], fly: 0 })),
    down: mk({ lean: -0.3, headLean: 0.45, legs: [[1.2, 0.5], [1.42, 0.12]], armN: [0.2, 1], armF: [-0.7, 0.2], fly: 0 }),
  };
  // the stage: a rooftop landing pad in the rain, the city behind
  const ST = cv(BW, BH); { const g = ST.getContext('2d'), R = (col, x0, y0, w, h) => { g.fillStyle = col; g.fillRect(x0, y0, w, h); };
    for (let j = 0; j < 46; j++) R(`rgba(6,5,16,${(j / 46) * 0.4})`, 0, 104 + j, BW, 1);
    // the big sign on its scaffold
    for (const lx of [112, 150, 190, 206]) { R(C.k, lx, 118, 2, 32); } for (let j = 122; j < 150; j += 9) R(C.k, 112, j, 96, 1); for (let k = 0; k < 28; k++) { R(C.k, 114 + k, 122 + k, 1, 1); R(C.k, 204 - k, 122 + k, 1, 1); }
    R(C.k, 104, 88, 112, 32); R('#0c0814', 105, 89, 110, 30); R(N.c3, 105, 89, 110, 1); R(N.c3, 105, 118, 110, 1); R(N.c3, 105, 89, 1, 30); R(N.c3, 214, 89, 1, 30);
    drawText(g, 'ORBIT', 160, 94, { scale: 2, fill: ['#2ab8cc', '#1f8ea6', '#1f8ea6', '#187488', '#187488', '#125a6a', '#125a6a'], outline: null, align: 'center' }); for (let k = 0; k < 7; k++) glyph(g, 132 + k * 8, 110, 120 + k, N.p2);
    // left: air-con and a vent stack. right: the stairhead he came out of
    box(g, 4, 124, 22, 26, C.s1, C.s3, C.s0); R(C.k, 7, 128, 10, 10); R(C.s0, 8, 129, 8, 8); R(C.s2, 11, 129, 1, 8); R(C.s2, 8, 132, 8, 1); for (let j = 141; j < 148; j += 2) R(C.s0, 7, j, 16, 1);
    box(g, 28, 134, 16, 16, C.s1, C.s3, C.s0); for (let j = 138; j < 148; j += 2) R(C.s0, 31, j, 10, 1); R(C.k, 49, 104, 9, 46); R(C.s1, 50, 105, 7, 45); R(C.s3, 50, 105, 1, 45); R(C.k, 47, 102, 13, 3); R(C.s2, 48, 102, 11, 2);
    R(C.k, 271, 97, 49, 53); panels(g, 272, 98, 48, 52, wallP, 16, 13, noise(5), 2); R(C.s3, 272, 98, 48, 1); R(C.k, 268, 94, 52, 4); R(C.s2, 269, 95, 51, 2); R(C.s4, 269, 95, 51, 1);
    R(C.k, 286, 114, 20, 36); R('#1a1c2c', 287, 115, 18, 35); R('#2a2c40', 287, 115, 18, 1); R('#2a2c40', 287, 115, 1, 35); R(C.k, 296, 115, 1, 35); R(C.s4, 293, 132, 1, 4); R(C.s4, 299, 132, 1, 4);
    for (let i = 0; i < 18; i++) for (let j = 0; j < 3; j++) R(((i + j) >> 2) % 2 ? '#8a6a24' : '#16141c', 287 + i, 146 + j, 1, 1);
    glow(g, 296, 108, 12, N.a3, 0.5); R(C.k, 292, 105, 9, 6); R(N.a2, 293, 106, 7, 4); R(N.a, 294, 107, 5, 2); R(C.k, 310, 70, 1, 25); R(C.k, 306, 76, 9, 1); R(C.k, 308, 82, 5, 1);
    // parapet + rail at the back of the roof, then the wet pad
    for (let i = 2; i < BW; i += 10) R(C.k, i, 129, 1, 10); R(C.k, 0, 128, BW, 2); R(C.s1, 0, 128, BW, 1);
    R(C.k, 0, 138, BW, 12); R('#1a1a30', 0, 139, BW, 11); R(C.s3, 0, 139, BW, 1); R('#24243e', 0, 140, BW, 1); for (let i = 14; i < BW; i += 32) R('#101022', i, 140, 1, 10);
    box(g, 4, 124, 22, 26, C.s1, C.s3, C.s0); R(C.k, 7, 128, 10, 10); R(C.s0, 8, 129, 8, 8); R(C.s2, 11, 129, 1, 8); R(C.s2, 8, 132, 8, 1); for (let j = 141; j < 148; j += 2) R(C.s0, 7, j, 16, 1);
    box(g, 28, 134, 16, 16, C.s1, C.s3, C.s0); for (let j = 138; j < 148; j += 2) R(C.s0, 31, j, 10, 1); R(C.k, 49, 104, 9, 46); R(C.s1, 50, 105, 7, 45); R(C.s3, 50, 105, 1, 45);
    R(C.k, 271, 139, 49, 11); panels(g, 272, 139, 48, 11, wallP, 16, 13, noise(6), 2); R(C.k, 286, 139, 20, 11); R('#1a1c2c', 287, 139, 18, 11); R(C.k, 296, 139, 1, 11); for (let i = 0; i < 18; i++) for (let j = 0; j < 3; j++) R(((i + j) >> 2) % 2 ? '#8a6a24' : '#16141c', 287 + i, 146 + j, 1, 1);
    vgrad(g, 0, 150, BW, 30, ['#20203a', '#1a1a32', '#141428', '#0e0e1e', '#0a0a16']); R('#3c3f58', 0, 150, BW, 1); R(C.k, 0, 149, BW, 1);
    for (let i = 0; i < BW; i += 40) for (let j = 0; j < 30; j++) R('#0c0c1a', i + 14 - Math.round(j * (i - 160) / -90), 150 + j, 1, 1);          // slab joints, fanning towards you
    for (let t = 0; t < 400; t++) { const a = (t / 400) * TAU; if (Math.floor(t / 10) % 2) R('#8a6a24', Math.round(150 + Math.cos(a) * 128), Math.round(165 + Math.sin(a) * 11), 2, 1); }   // the landing ring
    for (let t = 0; t < 200; t++) { const a = (t / 200) * TAU; R('#5a4418', Math.round(150 + Math.cos(a) * 60), Math.round(165 + Math.sin(a) * 5), 1, 1); }
    const smear = (x0, w, col, a, len) => { for (let i = x0; i < x0 + w; i++) { const hh = Math.floor(hash(i, 91) * len * (1 - Math.abs((i - x0) / w - 0.5) * 1.5)); g.globalAlpha = a; g.fillStyle = col; for (let j = 0; j < hh; j++) if ((i + j) % 2 === 0) g.fillRect(i, 151 + j, 1, 1); } g.globalAlpha = 1; };
    smear(108, 104, N.c, 0.3, 22); smear(284, 26, N.a, 0.4, 18); smear(0, 60, N.p, 0.12, 14);
    for (let k = 0; k < 26; k++) R('#3c3f58', Math.floor(hash(k, 61) * 310), 152 + Math.floor(hash(k, 62) * 26), 3 + Math.floor(hash(k, 63) * 6), 1);
    R(C.k, 0, 176, BW, 4); R('#2a2c40', 0, 176, BW, 1); }
  const heroFr = (h, f) => (!h.ground ? (h.vy < 0 ? B.hero.jump : B.hero.fall) : h.moving ? B.hero.run[(f >> 2) % 8] : B.hero.run[2]);
  const mirror = (ctx, im, X, Yy, a) => { ctx.save(); ctx.globalAlpha = a; ctx.translate(Math.round(X), Math.round(Yy)); ctx.scale(1, -0.55); ctx.drawImage(im.c, -im.ox, -im.oy); ctx.restore(); };
  const HOME = 256, SPEED = [2.3, 2.9, 3.5];
  const HEAD_X = -31, HEAD_T = 45;                    // charging, the top of his head is 45 px up and 31 px ahead of his feet
  const boss = {
    name: 'THE NEXUS', tip: 'JUMP ON HIS HEAD', tips: ['HE RUNS AT YOU: JUMP AS HE COMES', 'LAND ON HIS HEAD TO HIT HIM', 'THREE STOMPS AND HE IS DONE'], hero: 'stand', heroX: 60, F,
    init(st) { st.b = { x: HOME, dir: -1, s: 'pace', t: 0, hits: 0, v: 0, feint: false, fx: [], hT: HEAD_T, C: HEAD_T, fr: 0, land: 0, star: 0 }; },
    update(st) {
      const b = st.b, h = st.h; b.t++; if (b.star > 0) b.star--; if (b.s !== 'stomp' && b.hT < HEAD_T) b.hT = Math.min(HEAD_T, b.hT + 5);
      const go = (s) => { b.s = s; b.t = 0; };
      const dust = (X, n, dir) => { for (let i = 0; i < n; i++) b.fx.push({ x: X, y: FL - 1 - Math.random() * 3, vx: dir * (0.3 + Math.random() * 1.1), vy: -0.2 - Math.random() * 0.5, t: 14 + Math.random() * 12 }); };
      for (const p of b.fx) { p.x += p.vx; p.y += p.vy; p.t--; } b.fx = b.fx.filter((p) => p.t > 0);
      if (b.s === 'pace') {                                     // prowling at the far side of the pad
        b.x += b.dir * 0.7; if (b.x < 234) b.dir = 1; if (b.x > 272) b.dir = -1;
        if (!st.won && b.t > (b.hits ? 90 : 125) && b.dir < 0 && b.x < 264) { go('tell'); st.events.push('warn'); }
      } else if (b.s === 'tell') {                              // drops into a crouch, his eye flashes three times
        if (b.t === 22 || b.t === 44) st.events.push('warn');
        if (b.t > 8 && b.t % 7 === 0) dust(b.x + 16, 1, 1);
        if (b.t >= 66) { go('charge'); b.v = SPEED[Math.min(2, b.hits)] * (1 + 0.12 * Math.min(3, st.lap || 0));   /* every loop of the game he charges faster */ b.feint = b.hits > 0; st.events.push('roar'); }
      } else if (b.s === 'charge') {
        b.x -= b.v; if (b.t % 3 === 0) dust(b.x + 14, 1, 1);
        const up = FL - h.y;
        if (b.feint && b.t >= 13) { b.feint = false; go('feint'); st.events.push('thump'); dust(b.x - 20, 7, -1); }      // he stops dead... then comes again
        else if (!h.ground && up > 23 && h.vy > -1.2 && h.x > b.x + HEAD_X - 16 && h.x < b.x + HEAD_X + 24) {            // over his head as it arrives: he comes down on it
          b.fr = (b.t >> 2) % 6; b.C = Math.max(25, Math.min(HEAD_T, up - 3)); b.land = 0; go('stomp');
        } else if (h.x > b.x - 38 && h.x < b.x + 8 && up < 14) { hurt(st, 'charged down'); go('back'); dust(b.x - 30, 5, -1); }   // ran you down
        else if (b.x < 28) go('back');
      } else if (b.s === 'stomp') {                             // boots meet head: he is driven down, they both stop dead for a moment, then the hero springs off
        const dx = h.x - (b.x + HEAD_X); b.x += Math.max(-7, Math.min(7, dx));                       // his head ends up right under the boots
        if (!b.land) {
          const tgt = FL - b.C; h.vy = Math.max(h.vy, 4.5); b.hT = Math.max(b.C, b.hT - 6);
          if (h.y >= tgt - 2 || b.t > 7) { h.y = tgt; h.vy = 0; b.hT = b.C; b.land = 1; b.t = 0; b.hits++; st.shake = 9; st.events.push('bosshit'); b.star = 9;
            if (b.hits < 3) pop(st, ['ONE!', 'TWO!'][b.hits - 1], h.x + 6, FL - b.C - 40); dust(b.x - 24, 6, -1); dust(b.x + 12, 6, 1); }
        } else {
          b.hT = b.C - Math.min(5, b.t * 2); h.y = FL - b.hT; h.vy = 0; h.ground = false;            // the hit lands: his head goes down under the weight
          if (b.t >= 5) { h.vy = -4.9; h.jumps = 1; h.hold = 0; st.events.push('djump'); if (b.hits >= 3) { go('ko'); win(st, 'NEXUS RETIRED  +500'); } else go('dizzy'); }
        }
      } else if (b.s === 'feint') {
        if (b.t < 12) { b.x -= (12 - b.t) * 0.14; if (b.t % 2) dust(b.x - 22, 1, -1); }
        if (b.t === 22) st.events.push('warn');
        if (b.t >= 46) { go('charge'); st.events.push('whoosh'); }
      } else if (b.s === 'dizzy') {                             // reels back to his side seeing stars
        if (b.t > 16 && b.x < HOME) b.x += 0.85;
        if (b.t > 70 && b.x >= HOME) { go('pace'); b.dir = -1; b.t = 30; }
      } else if (b.s === 'back') { b.x += 1.6; if (b.x >= HOME) { go('pace'); b.dir = -1; b.t = 40; } }
      else if (b.s === 'ko') { if (b.t < 44) b.x += (44 - b.t) * 0.12; if (b.t === 44) { st.events.push('thump'); st.shake = 6; dust(b.x, 8, 1); dust(b.x, 8, -1); } }
    },
    stage(ctx, st, f) {
      ctx.drawImage(CITY.sky, 0, -12); CITY.backFx(ctx, f, 40086, 50); ctx.drawImage(ST, 0, 0);   // the same city as the level, seen from the pad (the props are ST)
      if (flick(f, 2)) { ctx.fillStyle = 'rgba(10,8,18,0.75)'; ctx.fillRect(106, 90, 108, 28); } else { ctx.globalAlpha = 0.05 + 0.02 * Math.sin(f / 19); ctx.fillStyle = N.c; ctx.fillRect(98, 82, 124, 44); ctx.globalAlpha = 1; }
      if ((f >> 5) % 2) { ctx.fillStyle = N.r; ctx.fillRect(310, 69, 1, 1); ctx.globalAlpha = 0.2; ctx.fillRect(308, 67, 5, 5); ctx.globalAlpha = 1; }
      ctx.globalAlpha = 0.06 + 0.03 * Math.sin(f / 11); ctx.fillStyle = N.a; ctx.fillRect(284, 98, 26, 52); ctx.globalAlpha = 1;
      steam(ctx, 53, 101, f, 5, 110, '#7a7a9a', 4);
      for (let i = 0; i < 8; i++) { const on = ((f >> 3) + i) % 8 < 2; ctx.fillStyle = '#000'; ctx.fillRect(18 + i * 40, 173, 5, 4); ctx.fillStyle = on ? '#ffe9a8' : '#6a4a1a'; ctx.fillRect(19 + i * 40, 174, 3, 2); if (on) { ctx.globalAlpha = 0.25; ctx.fillStyle = N.a; ctx.fillRect(16 + i * 40, 171, 9, 6); ctx.globalAlpha = 1; } }
      for (let i = 0; i < 9; i++) { const t = (f + i * 11) % 24; if (t < 6) { const sx = Math.floor(hash(i, (f - t) >> 3) * 316), sy = 153 + Math.floor(hash(i + 9, (f - t) >> 3) * 24); ctx.fillStyle = '#7c82a6'; ctx.fillRect(sx - (t >> 1), sy - (t >> 2), 1, 1); ctx.fillRect(sx + (t >> 1) + 1, sy - (t >> 2), 1, 1); ctx.fillRect(sx, sy, 2, 1); } }
      const h = st.h; if (!(h.inv > 0 && (h.inv >> 2) % 2) && !(st.portal && st.portal.in > 0)) { const im = heroFr(h, f); mirror(ctx, h.dir < 0 ? flipCache(im) : im, h.x, FL + 1 + (FL - h.y) * 0.5, 0.2); }
    },
    draw(ctx, st, f) {
      const b = st.b; let im, fl = false;
      if (b.s === 'pace') { im = F.walk[(b.t >> 3) % 8]; fl = b.dir > 0; }
      else if (b.s === 'tell') im = b.t < 5 ? F.walk[0] : F.crouch;
      else if (b.s === 'charge') im = F.run[(b.t >> 2) % 6];
      else if (b.s === 'feint') im = b.t < 28 ? F.skid : F.crouch;
      else if (b.s === 'stomp' || (b.hT < HEAD_T && (b.s === 'dizzy' || b.s === 'ko'))) im = F.run[b.fr];          // still bent double under the boots
      else if (b.s === 'dizzy') im = F.dizzy[(b.t >> 3) % 6];
      else if (b.s === 'back') { im = F.walk[(b.t >> 2) % 8]; fl = true; }
      else im = b.t < 44 ? F.dizzy[(b.t >> 2) % 6] : F.down;
      const eye = { x: fl ? -im.eye.x : im.eye.x, y: im.eye.y }; if (fl) im = flipCache(im);
      const X = Math.round(b.x), bob = b.s === 'tell' && b.t > 5 ? ((b.t >> 1) % 2) : 0;
      mirror(ctx, im, X, FL + 1, 0.2);
      if (b.s === 'charge') for (let k = 0; k < 5; k++) { const yy = FL - 8 - k * 8 - ((f + k) % 3), len = 10 + ((f * 3 + k * 7) % 14); ctx.globalAlpha = 0.35; ctx.fillStyle = '#c8d0f0'; ctx.fillRect(X + 26 + ((f * 5 + k * 9) % 16), yy, len, 1); ctx.globalAlpha = 1; }
      if (b.hT < HEAD_T) { const sy = b.hT / HEAD_T; ctx.save(); ctx.translate(X, FL); ctx.scale(1 + (1 - sy) * 0.35, sy); ctx.drawImage(im.c, -im.ox, -im.oy); ctx.restore(); }   // squashed so the top of his head is exactly b.hT up
      else put(ctx, im, X + bob, FL);
      if (b.star > 0) { const cx = Math.round(st.h.x), cy = Math.round(FL - b.C) + 1, r = 4 + (9 - b.star) * 2; ctx.fillStyle = b.star > 5 ? '#fff' : '#ffe9a8';                    // the impact, at the point of contact
        for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + 0.4, x1 = cx + Math.cos(a) * r, y1 = cy + Math.sin(a) * r * 0.6; if (y1 < cy + 3) ctx.fillRect(Math.round(x1) - 1, Math.round(y1), k % 2 ? 2 : 3, k % 2 ? 2 : 1); }
        ctx.globalAlpha = b.star / 9; ctx.fillStyle = '#fff'; ctx.fillRect(cx - 12, cy, 24, 2); ctx.globalAlpha = 1; }
      const warn = (b.s === 'tell' && b.t % 22 >= 6 && b.t % 22 < 18) || (b.s === 'feint' && b.t >= 22 && b.t < 40 && (b.t >> 2) % 2);
      if (warn) { const ex = X + bob + eye.x, ey = FL + eye.y; ctx.globalAlpha = 0.3; ctx.fillStyle = N.r; ctx.fillRect(ex - 6, ey - 4, 13, 9); ctx.globalAlpha = 0.5; ctx.fillRect(ex - 3, ey - 2, 7, 5); ctx.globalAlpha = 1; ctx.fillStyle = '#fff'; ctx.fillRect(ex - 2, ey, 5, 1); ctx.fillRect(ex, ey - 1, 1, 3); ctx.fillStyle = N.r; ctx.fillRect(ex - 9, ey, 5, 1); ctx.fillRect(ex + 5, ey, 3, 1);
        drawText(ctx, '!', X + eye.x - 2, FL + eye.y - 26, { scale: 2, fill: GRAD.red, outline: '#000' }); }
      if (b.s === 'dizzy' || b.s === 'ko') dizzy(ctx, X + eye.x + 4, FL + eye.y - 16, f);
      for (const p of b.fx) { ctx.globalAlpha = Math.min(1, p.t / 12) * 0.6; ctx.fillStyle = '#9aa2c8'; const s = p.t > 14 ? 2 : 3; ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s - 1); } ctx.globalAlpha = 1;
      pips(ctx, 'THE NEXUS', b.hits, 3, N.p);
    },
    front(ctx, st, f) {                                           // the rain, in front of everything
      ctx.fillStyle = '#6a7aa8';
      for (let i = 0; i < 46; i++) { const t = (f * 5 + i * 53) % 210, xx = Math.round(((i * 71) % 380) - t * 0.32), yy = t - 12; ctx.globalAlpha = i % 3 ? 0.55 : 0.85; ctx.fillRect(xx, yy, 1, 3); ctx.fillRect(xx - 1, yy + 3, 1, 2); }
      ctx.globalAlpha = 1;
    },
  };

  return { name: 'NEON RAIN', style: 'neon', P, drip: LOOK.neon, puddle: LOOK.neon, drawPipe, sky: CITY.sky, farY: 0, mid: CITY.mid, midY: 0, near: CITY.near, art: CITY.parts,
    arcade: arc, arcadeTop: 36, deck: DK.c, pit, pitUp: 6, fg, particles: 'rain', drawPlat, wallFx, backFx: (ctx, f, fdist, cam) => { scroll = Math.floor(fdist); CITY.backFx(ctx, f, fdist, cam); }, frontFx: CITY.frontFx, extras: ['elevator', 'slider', 'crumble'], boss,
    blob: ['#8a1a6a', '#ff4fae', '#ffd0f4'], titleFill: GRAD.pink, tintCol: '#ff4fae', chr,
    // level 1, so the gentlest mix of the six: four kinds, 41% of spawns. Acid rain on a slant, flame stacks, a police drone, a hunter with a blaster
    danger: { spawn: { vent: 12, rain: 11, seeker: 10, gunner: 8 }, rain: { vx: -90, every: 20 }, ride: { fly: true, chance: 65, ticks: 420 }, box: { shield: 10, bomb: 6 } },
    fx: DG.fx, labels: { ride: 'SPINNER!', shield: 'ORIGAMI UNICORN!', bomb: 'TEARS IN RAIN!' } };
}
