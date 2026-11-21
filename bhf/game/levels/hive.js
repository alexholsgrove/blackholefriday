import { cv, pix, dith, hash, put, flip, tint, TAU, drawText, GRAD, noise, fr, scaleFr, tintAll, sky, blank, pitCycle, LOOK, arcadeCanvas, deckCanvas, px, panels, glow, rivets, box } from '../kit.js';
import { BW, BH, FL, hurt, win, pips, pop } from '../bosskit.js';
import { hiveChr, hiveFx, tracker, HANG_H } from './hive-art.js';
import { LOGO } from '../../../logo-masks.js';
import { renderShapes, cap, ell, poly, scaleShapes } from '../../../rig.js';
// ---------- THE HIVE ----------
// A colony corridor being eaten by the hive: steel bulkheads, a clawed blast door, and black ribbed resin
// growing over all of it. Acid has burnt down through the decks above and drips through the melted holes.

const RES = ['#020405', '#0a1416', '#16282b', '#2a4447', '#4d7072', '#8fb0aa'];      // resin: black-teal, glossy
const DIM = ['#010303', '#050c0d', '#0a1719', '#12272a', '#1e3d40', '#2f5a5a'];      // resin far away
const ST = { base: '#262e34', top: '#353f47', deep: '#12171a', dark: '#1e252a' };    // colony steel
const ACID = ['#0c2c10', '#22801e', '#46c02a', '#8aff4a', '#e0ffb0'];
const PR = ['#04090a', '#12292c', '#24484b', '#3f7577', '#6fb0aa', '#c8f2e4'];        // resin you can stand on: lit, so it reads against the wall

// ---- drawing: curves, ribbed hoses and knuckles (what the resin is made of) ----
function curve(pts, step = 0.5) {
  const out = [], P = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))]; let d = 0, prev = null;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = P(i - 1), b = P(i), c = P(i + 1), e = P(i + 2), n = Math.max(2, Math.ceil(Math.hypot(c[0] - b[0], c[1] - b[1]) / step));
    for (let k = 0; k <= (i === pts.length - 2 ? n : n - 1); k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t, q = (m) => 0.5 * (2 * b[m] + (-a[m] + c[m]) * t + (2 * a[m] - 5 * b[m] + 4 * c[m] - e[m]) * t2 + (-a[m] + 3 * b[m] - 3 * c[m] + e[m]) * t3);
      const x = q(0), y = q(1); if (prev) d += Math.hypot(x - prev[0], y - prev[1]); out.push({ x, y, d }); prev = [x, y];
    }
  }
  const L = d || 1;
  out.forEach((p, i) => { const a = out[Math.max(0, i - 2)], b = out[Math.min(out.length - 1, i + 2)]; let tx = b.x - a.x, ty = b.y - a.y; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m; let nx = -ty, ny = tx; if (nx * -0.5 + ny * -0.85 < 0) { nx = -nx; ny = -ny; } p.nx = nx; p.ny = ny; p.t = p.d / L; });
  return out;
}
const disc = (x, cx, cy, r) => { const R = Math.ceil(r); for (let j = -R; j <= R; j++) { const w = Math.floor(Math.sqrt(Math.max(0, r * r + r * 0.6 - j * j))); if (r * r + r * 0.6 - j * j >= 0) x.fillRect(Math.round(cx) - w, Math.round(cy) + j, w * 2 + 1, 1); } };
// a ribbed hose from pts[0] to the last point, w0 wide tapering to w1, a groove every `seg` pixels
function hose(x, pts, w0, w1 = w0, o = {}) {
  const { seg = 4, pal = RES, edge = '#000' } = o, S = curve(pts);
  if (edge) { x.fillStyle = edge; for (let i = 0; i < S.length; i += 2) { const p = S[i]; disc(x, p.x, p.y, (w0 + (w1 - w0) * p.t) / 2 + 0.6); } }
  for (const p of S) {
    const w = (w0 + (w1 - w0) * p.t) / 2, m = Math.floor(p.d) % seg;
    for (let k = -w; k <= w; k += 0.5) {
      const s = k / Math.max(0.5, w); let sh = s > 0.55 ? 3 : s > 0.05 ? 4 : s > -0.35 ? 3 : s > -0.75 ? 2 : 1;
      if (m === 0) sh = Math.max(0, sh - 2); else if (m === 1 && s > 0.05 && s <= 0.55) sh = 5;
      x.fillStyle = pal[sh]; x.fillRect(Math.round(p.x + p.nx * k), Math.round(p.y + p.ny * k), 1, 1);
    }
  }
}
// a knuckle / socket: a glossy ball
function node(x, cx, cy, r, pal = RES) {
  x.fillStyle = '#000'; disc(x, cx, cy, r + 1);
  for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { if (i * i + j * j > r * r + r * 0.6) continue; const s = (-i * 0.5 - j * 0.85) / r, hot = Math.hypot(i + r * 0.35, j + r * 0.45) < r * 0.3; x.fillStyle = pal[hot ? 5 : s > 0.4 ? 4 : s > 0 ? 3 : s > -0.5 ? 2 : 1]; x.fillRect(cx + i, cy + j, 1, 1); }
}
// a stretch of wall grown over: ribbed columns, cross ribs, knuckles where they meet
function resinField(x, x0, y0, w, h, n, pal = RES, dense = 1) {
  x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip();
  x.fillStyle = pal[0]; x.fillRect(x0, y0, w, h);
  for (let i = x0; i < x0 + w; i += 3) { x.fillStyle = pal[1]; x.fillRect(i + ((i >> 1) % 2), y0, 1, h); }
  const cols = [];
  for (let cx = x0 + 5; cx < x0 + w + 4; cx += (13 + n() * 7) / dense) { const a = (n() - 0.5) * 8, b = (n() - 0.5) * 8; cols.push(cx); hose(x, [[cx, y0 - 3], [cx + a, y0 + h * 0.33], [cx + b, y0 + h * 0.66], [cx + (n() - 0.5) * 4, y0 + h + 3]], 6 + n() * 4, 5 + n() * 3, { seg: 3 + Math.floor(n() * 3), pal }); }
  for (let k = 0; k < cols.length - 1; k++) {       // cross ribs sagging between the columns
    for (let y = y0 + 6 + n() * 10; y < y0 + h - 4; y += 12 + n() * 14) { const a = cols[k], b = cols[k + 1]; hose(x, [[a, y], [(a + b) / 2, y + 4 + n() * 4], [b, y + (n() - 0.5) * 6]], 3, 2.4, { seg: 3, pal }); if (n() < 0.6) node(x, Math.round(a + (n() - 0.5) * 2), Math.round(y), 2 + Math.floor(n() * 2), pal); }
  }
  x.restore();
}
// make every pixel fully opaque or fully clear (after cutting a hole with a canvas path)
function crisp(x, x0, y0, w, h) { const d = x.getImageData(x0, y0, w, h); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] < 128 ? 0 : 255; x.putImageData(d, x0, y0); }
// tear a ragged hole through the wall (you see the hive behind), with a bent, lit metal lip
function breach(x, cx, cy, rx, ry, n) {
  const pts = []; for (let a = 0; a < 22; a++) { const t = (a / 22) * TAU, k = 0.78 + n() * 0.34 + (a % 3 === 0 ? 0.12 : 0); pts.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]); }
  x.save(); x.globalCompositeOperation = 'destination-out'; x.beginPath(); pts.forEach((p, i) => (i ? x.lineTo(p[0], p[1]) : x.moveTo(p[0], p[1]))); x.closePath(); x.fill(); x.restore();
  const x0 = Math.floor(cx - rx * 1.3), y0 = Math.floor(cy - ry * 1.3), w = Math.ceil(rx * 2.6), h = Math.ceil(ry * 2.6);
  crisp(x, x0, y0, w, h);
  const d = x.getImageData(x0, y0, w, h), A = (i, j) => (i < 0 || j < 0 || i >= w || j >= h ? 255 : d.data[(j * w + i) * 4 + 3]);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (!A(i, j)) continue;
    const open = !A(i - 1, j) || !A(i + 1, j) || !A(i, j - 1) || !A(i, j + 1), near = !A(i - 2, j) || !A(i + 2, j) || !A(i, j - 2) || !A(i, j + 2);
    if (open) { x.fillStyle = !A(i, j + 1) || !A(i + 1, j) ? '#07090a' : '#7d8b95'; x.fillRect(x0 + i, y0 + j, 1, 1); }
    else if (near) { x.fillStyle = (i + j) % 3 ? '#151b1f' : '#3d4850'; x.fillRect(x0 + i, y0 + j, 1, 1); }
  }
}

// ---- the corridor wall: 384 wide, the whole height of the world (y 0..204) ----
function buildWall() {
  const { c, x, w } = arcadeCanvas(384, 0), n = noise(77);
  // ceiling: beam, a fat duct, cable tray
  x.fillStyle = '#0d1114'; x.fillRect(0, 0, w, 40);
  x.fillStyle = '#232b30'; x.fillRect(0, 0, w, 6); x.fillStyle = '#39444c'; x.fillRect(0, 0, w, 1); x.fillStyle = '#07090a'; x.fillRect(0, 6, w, 1); rivets(x, 4, 3, w, 12, '#56626a');
  for (let j = 0; j < 16; j++) { x.fillStyle = ['#56626a', '#48535b', '#3d4850', '#39444c', '#343e45', '#303a41', '#2c353c', '#283137', '#242c32', '#20282d', '#1c2327', '#181e22', '#151a1e', '#12171a', '#0f1316', '#07090a'][j]; x.fillRect(0, 10 + j, w, 1); }
  for (let i = 20; i < w; i += 64) { x.fillStyle = '#07090a'; x.fillRect(i - 1, 8, 6, 20); x.fillStyle = '#48535b'; x.fillRect(i, 9, 4, 18); x.fillStyle = '#6a7882'; x.fillRect(i, 9, 4, 1); x.fillStyle = '#20282d'; x.fillRect(i, 22, 4, 5); x.fillStyle = '#232b30'; x.fillRect(i + 1, 6, 2, 3); }
  x.fillStyle = '#07090a'; x.fillRect(0, 34, w, 5); x.fillStyle = '#20282d'; x.fillRect(0, 35, w, 3); x.fillStyle = '#39444c'; x.fillRect(0, 35, w, 1);
  for (let i = 0; i < w; i += 48) { hose(x, [[i, 31], [i + 24, 34 + (i % 96 ? 1 : 3)], [i + 48, 31]], 2, 2, { seg: 99, pal: ['#07090a', '#12171a', '#1c2327', '#2c353c', '#39444c', '#56626a'], edge: null }); x.fillStyle = '#39444c'; x.fillRect(i, 28, 1, 7); }
  // upper wall: panels, strip lights, a monitor, a vent, stencils
  panels(x, 0, 40, w, 62, ST, 48, 31, n, 0);
  x.fillStyle = '#07090a'; x.fillRect(0, 39, w, 1); x.fillStyle = '#3d4850'; x.fillRect(0, 40, w, 1);
  rivets(x, 3, 43, w, 16, '#48535b'); rivets(x, 3, 98, w, 16, '#12171a');
  for (const lx of [22, 214]) { glow(x, lx + 15, 47, 26, '#8fd0e0', 0.3); box(x, lx, 44, 30, 5, '#343e45', '#56626a', '#12171a'); x.fillStyle = '#e8fbff'; x.fillRect(lx + 2, 46, 26, 2); x.fillStyle = '#9fe0f0'; x.fillRect(lx + 2, 48, 26, 1); }
  box(x, 310, 44, 30, 5, '#343e45', '#56626a', '#12171a'); x.fillStyle = '#2a3a42'; x.fillRect(312, 46, 26, 2);            // the dead one (flickers in wallFx)
  box(x, 66, 58, 28, 20, '#1c2327', '#48535b', '#07090a'); x.fillStyle = '#061a14'; x.fillRect(68, 60, 24, 14); for (let j = 0; j < 14; j += 2) { x.fillStyle = '#0c3a2a'; x.fillRect(68, 60 + j, 24, 1); }
  px(x, 70, 62, ['###.##.###', '..........', '##.####.#.', '..........', '####.##...', '..........', '#.###.####'], { '#': '#3ad89a' }); x.fillStyle = '#48535b'; x.fillRect(70, 76, 3, 1); x.fillStyle = '#ff3a2a'; x.fillRect(89, 76, 2, 1);
  box(x, 118, 60, 30, 24, '#1c2327', '#48535b', '#07090a'); for (let j = 0; j < 20; j += 3) { x.fillStyle = '#07090a'; x.fillRect(120, 62 + j, 26, 2); x.fillStyle = '#3d4850'; x.fillRect(120, 64 + j, 26, 1); }
  drawText(x, 'DECK 03', 14, 62, { fill: '#59656d', outline: null }); x.fillStyle = '#59656d'; x.fillRect(14, 71, 41, 1);
  for (let i = 0; i < 40; i++) { x.fillStyle = (i >> 2) % 2 ? '#8a6c18' : '#15181a'; x.fillRect(250 + i, 86 + (i % 4 < 2 ? 0 : 0), 1, 6); } x.fillStyle = '#07090a'; x.fillRect(249, 85, 42, 1); x.fillRect(249, 92, 42, 1);
  drawText(x, 'HATCH 7', 251, 76, { fill: '#59656d', outline: null });
  // gallery: a rail, then the slab you see edge-on (floor line at y 110)
  for (let i = 0; i < w; i += 16) { x.fillStyle = '#07090a'; x.fillRect(i + 7, 100, 3, 10); x.fillStyle = '#3d4850'; x.fillRect(i + 8, 100, 1, 10); }
  x.fillStyle = '#07090a'; x.fillRect(0, 99, w, 3); x.fillStyle = '#6a7882'; x.fillRect(0, 100, w, 1); x.fillStyle = '#2c353c'; x.fillRect(0, 105, w, 1);
  x.fillStyle = '#07090a'; x.fillRect(0, 109, w, 10); x.fillStyle = '#8f9da8'; x.fillRect(0, 110, w, 1); x.fillStyle = '#4b5760'; x.fillRect(0, 111, w, 2);
  for (let i = 0; i < w; i += 3) { x.fillStyle = '#12171a'; x.fillRect(i, 112, 1, 1); }
  for (let i = 0; i < w; i++) for (let j = 0; j < 4; j++) { x.fillStyle = ((i + j) >> 2) % 2 ? '#9a7a1c' : '#15181a'; x.fillRect(i, 113 + j, 1, 1); }
  x.fillStyle = '#2c353c'; x.fillRect(0, 117, w, 1);
  // lower wall: panels in shadow under the gallery, bulkhead frames, four bays
  panels(x, 0, 119, w, 71, ST, 44, 24, n, 0);
  for (let j = 0; j < 12; j++) for (let i = 0; i < w; i++) if (dith([1, 0], j / 12, i, j)) { x.fillStyle = '#0b0f11'; x.fillRect(i, 119 + j, 1, 1); }
  // bay A (8..96): locker, extinguisher, a stencil, a floor light
  box(x, 18, 146, 20, 40, '#2c353c', '#56626a', '#12171a'); x.fillStyle = '#12171a'; x.fillRect(28, 147, 1, 38); for (const yy of [150, 153, 156]) { x.fillRect(20, yy, 6, 1); x.fillRect(31, yy, 6, 1); } x.fillStyle = '#8f9da8'; x.fillRect(26, 166, 1, 4); x.fillRect(30, 166, 1, 4);
  box(x, 46, 160, 6, 18, '#8a2a22', '#c8483a', '#4a1410'); x.fillStyle = '#07090a'; x.fillRect(47, 156, 4, 4); x.fillStyle = '#56626a'; x.fillRect(48, 157, 2, 2); x.fillStyle = '#e8d8c0'; x.fillRect(47, 166, 4, 3);
  drawText(x, '03', 62, 134, { scale: 2, fill: '#3d4850', outline: null });
  x.fillStyle = '#07090a'; x.fillRect(60, 152, 26, 12); x.fillStyle = '#1c2327'; x.fillRect(61, 153, 24, 10); px(x, 63, 155, ['.#....#...#.....#...', '#.#..#.#.#.#...#.#..', '...##...#...###...##'], { '#': '#2a8a5a' });
  // bay B (104..192): the blast door, clawed
  x.fillStyle = '#07090a'; x.fillRect(110, 126, 76, 64); x.fillStyle = '#39444c'; x.fillRect(111, 127, 74, 63); x.fillStyle = '#56626a'; x.fillRect(111, 127, 74, 1); x.fillRect(111, 127, 1, 63);
  x.fillStyle = '#07090a'; x.fillRect(115, 131, 66, 59);
  for (let j = 0; j < 58; j++) { x.fillStyle = j % 8 === 0 ? '#4b5760' : j % 8 === 7 ? '#12171a' : '#2a3238'; x.fillRect(116, 132 + j, 64, 1); }
  for (let i = 0; i < 64; i++) for (let j = 0; j < 9; j++) { x.fillStyle = ((i + j) >> 3) % 2 ? '#a8841c' : '#15181a'; x.fillRect(116 + i, 154 + j, 1, 1); }
  x.fillStyle = '#07090a'; x.fillRect(147, 132, 2, 58); x.fillStyle = '#4b5760'; x.fillRect(149, 132, 1, 58);
  x.fillStyle = '#07090a'; x.fillRect(124, 138, 14, 6); x.fillStyle = '#5a1410'; x.fillRect(125, 139, 12, 4); x.fillStyle = '#a82a1e'; x.fillRect(125, 139, 12, 1);
  drawText(x, 'C7', 157, 137, { fill: '#56626a', outline: null });
  for (const [ax, ay] of [[120, 148], [126, 146], [132, 147]]) for (let k = 0; k < 30; k++) { x.fillStyle = '#07090a'; x.fillRect(ax + k * 1.4, ay + k * 1.1, 2, 2); if (k % 3) { x.fillStyle = '#9aa8b2'; x.fillRect(ax + k * 1.4 - 1, ay + k * 1.1, 1, 1); } }
  box(x, 187, 150, 5, 10, '#1c2327', '#56626a', '#07090a'); x.fillStyle = '#07090a'; x.fillRect(143, 121, 11, 5); x.fillStyle = '#3d1210'; x.fillRect(144, 122, 9, 4);
  // bulkhead frames between the bays
  for (const bx of [0, 96, 192, 288]) { x.fillStyle = '#07090a'; x.fillRect(bx - 1, 119, 10, 71); for (let i = 0; i < 8; i++) { x.fillStyle = ['#6a7882', '#4b5760', '#414c54', '#3a444c', '#343e45', '#2e373d', '#262e34', '#1a2125'][i]; x.fillRect(bx + i, 119, 1, 71); } for (let yy = 124; yy < 188; yy += 10) { x.fillStyle = '#12171a'; x.fillRect(bx + 3, yy, 2, 2); x.fillStyle = '#8f9da8'; x.fillRect(bx + 3, yy, 1, 1); } x.fillStyle = '#07090a'; x.fillRect(bx - 2, 119, 12, 1); x.fillStyle = '#4b5760'; x.fillRect(bx - 2, 120, 12, 2); for (let k = 0; k < 9; k++) { x.fillStyle = '#20282d'; x.fillRect(bx + 8, 122 + k, 9 - k, 1); x.fillStyle = '#07090a'; x.fillRect(bx + 17 - k, 122 + k, 1, 1); } }
  // skirting + floor conduit
  x.fillStyle = '#07090a'; x.fillRect(0, 189, w, 1); x.fillStyle = '#414c54'; x.fillRect(0, 190, w, 1); x.fillStyle = '#1a2125'; x.fillRect(0, 191, w, 13);
  for (let j = 0; j < 4; j++) { x.fillStyle = ['#56626a', '#3d4850', '#2c353c', '#12171a'][j]; x.fillRect(0, 194 + j, w, 1); } for (let i = 30; i < w; i += 60) { x.fillStyle = '#07090a'; x.fillRect(i, 193, 4, 6); x.fillStyle = '#6a7882'; x.fillRect(i + 1, 193, 2, 5); }
  // bay C (200..288): grown over. A colonist cocooned in the wall under a ribbed arch
  resinField(x, 198, 119, 92, 85, n);
  x.fillStyle = '#000'; for (let j = 0; j < 44; j++) { const hw = Math.round(11 * Math.sqrt(Math.max(0, 1 - Math.pow((j - 30) / 30, 2)))) + (j > 30 ? 0 : 0); x.fillRect(244 - (j < 30 ? hw : 11), 140 + j, (j < 30 ? hw : 11) * 2, 1); }
  px(x, 238, 148, ['....hhhh....', '...hhhhhh...', '...hsssdh...', '...sskssd...', '...ssssdd...', '....ssdd....', '..rruuuurr..', '.rruuuuuurr.', 'rrruurruurrr', 'rsuurrrruusr', 'rdurruurrudr', 'rruuurruuurr', '.rruurruurr.', '.rrrurrurrr.', '..rruuuurr..', '..rrurrurr..', '..rruurrur..', '..rrurruur..', '..rruuuurr..', '...ruurur...', '...rrurrr...', '...ruurur...', '...rrrrrr...', '....rrrr....'],
    { h: '#1a1412', s: '#8f7260', d: '#58463c', k: '#2a1c18', u: '#3a5360', r: RES[3] });
  hose(x, [[226, 190], [228, 160], [236, 142], [244, 136], [252, 142], [260, 160], [262, 190]], 5, 5, { seg: 4 });
  hose(x, [[232, 158], [244, 163], [257, 158]], 2.4, 2.4, { seg: 3 }); hose(x, [[234, 176], [244, 172], [255, 177]], 2.4, 2.4, { seg: 3 });
  node(x, 244, 135, 3); node(x, 226, 188, 3); node(x, 262, 188, 3);
  // ... and creeping out over the steel: across the door frame, up to the gallery, along the floor
  hose(x, [[200, 126], [186, 122], [170, 124], [150, 121], [128, 124], [112, 121]], 5, 1.6, { seg: 4 }); hose(x, [[199, 150], [192, 158], [190, 172], [184, 188]], 4, 1.6, { seg: 3 });
  hose(x, [[288, 132], [300, 126], [312, 128], [322, 122]], 5, 1.6, { seg: 4 }); hose(x, [[200, 196], [176, 198], [150, 196], [132, 199]], 4, 1.4, { seg: 4 }); hose(x, [[290, 197], [310, 195], [330, 198]], 4, 1.4, { seg: 4 });
  node(x, 199, 126, 4); node(x, 289, 131, 4); node(x, 199, 150, 3);
  // upper breach above the door: the hive has come through, and is pouring down the wall
  breach(x, 172, 70, 25, 17, n);
  hose(x, [[150, 62], [160, 74], [176, 80], [194, 72]], 4, 3, { seg: 3 }); hose(x, [[188, 58], [182, 70], [186, 84]], 3, 2.4, { seg: 3 });
  hose(x, [[196, 78], [204, 92], [200, 108], [206, 120]], 6, 4, { seg: 4 }); hose(x, [[152, 80], [146, 92], [150, 100]], 4, 1.6, { seg: 3 }); node(x, 196, 77, 4); node(x, 151, 79, 3);
  resinField(x, 200, 40, 74, 59, n, RES, 1.15);
  hose(x, [[274, 44], [284, 52], [280, 70], [290, 84], [286, 99]], 6, 3, { seg: 4 }); hose(x, [[232, 99], [236, 106], [232, 112]], 4, 3, { seg: 3 }); hose(x, [[262, 99], [258, 108], [262, 118]], 4, 3, { seg: 3 });
  // bay D (296..384): the wall torn open
  breach(x, 340, 156, 33, 27, n);
  for (let k = 0; k < 12; k++) { x.fillStyle = k < 2 ? '#8f9da8' : '#4b5760'; x.fillRect(306 + k, 176 + Math.round(k * 0.9), 12 - k, 1); } x.fillStyle = '#07090a'; for (let k = 0; k < 12; k++) x.fillRect(305 + k, 177 + Math.round(k * 0.9), 1, 1);
  hose(x, [[300, 140], [318, 150], [330, 168], [336, 186]], 4, 2, { seg: 3 }); hose(x, [[378, 132], [366, 142], [362, 160], [370, 180]], 5, 2.4, { seg: 4 }); hose(x, [[322, 131], [338, 136], [356, 131]], 3, 2.4, { seg: 3 });
  for (const [cx0, len] of [[332, 22], [346, 30], [351, 16]]) { for (let k = 0; k < len; k++) { x.fillStyle = '#07090a'; x.fillRect(cx0 + Math.round(Math.sin(k / 5) * 1.5) - 1, 130 + k, 3, 1); x.fillStyle = k % 6 < 3 ? '#4b5760' : '#2c353c'; x.fillRect(cx0 + Math.round(Math.sin(k / 5) * 1.5), 130 + k, 1, 1); } x.fillStyle = '#d8a020'; x.fillRect(cx0 + Math.round(Math.sin(len / 5) * 1.5), 130 + len, 1, 2); }
  return c;
}
// ---- what you see through the holes: the hive itself ----
function buildHive() {
  const c = cv(320, 240), x = c.getContext('2d'), n = noise(31);
  for (let j = 0; j < 240; j++) for (let i = 0; i < 320; i++) { x.fillStyle = dith(['#010303', '#040b0b', '#07140f', '#0b1e16'], j / 240 + Math.sin(i / 40) * 0.08, i, j); x.fillRect(i, j, 1, 1); }
  for (let k = 0; k < 6; k++) { const cx = 20 + k * 55 + n() * 14; hose(x, [[cx, -4], [cx + (n() - 0.5) * 20, 80], [cx + (n() - 0.5) * 20, 160], [cx, 244]], 12 + n() * 8, 10 + n() * 6, { seg: 5, pal: DIM }); }
  for (let k = 0; k < 7; k++) { const a = k * 55 - 10, y = 30 + n() * 150; hose(x, [[a, y + 20], [a + 28, y - 16 - n() * 10], [a + 56, y + 20]], 5, 5, { seg: 4, pal: DIM }); node(x, Math.round(a + 28), Math.round(y - 14), 3, DIM); }
  for (let k = 0; k < 9; k++) {                        // eggs far below, glowing
    const ex = 14 + k * 36 + Math.floor(n() * 12), ey = 172 + Math.floor(n() * 40); glow(x, ex, ey - 4, 9, '#2a8a1a', 0.35);
    px(x, ex - 3, ey - 9, ['..##..', '.#oo#.', '#oooo#', '#oooo#', '#oooo#', '#oooo#', '.#oo#.', '.####.'], { '#': '#07140f', o: '#2a4a34' }); x.fillStyle = '#8aff4a'; x.fillRect(ex, ey - 9, 1, 1);
  }
  for (let k = 0; k < 5; k++) { const ex = 30 + k * 64 + Math.floor(n() * 20), ey = 40 + Math.floor(n() * 60); px(x, ex, ey, ['.##.', '####', '#oo#', '#oo#', '####', '####', '####', '.##.', '.##.', '..#.'], { '#': DIM[3], o: DIM[5] }); x.fillStyle = DIM[2]; x.fillRect(ex + 1, ey - 8, 1, 8); }
  return c;
}
// ---- the floor: tread plate over a frame; the acid sump shows between the legs ----
function buildDeck() {
  const { c, x } = deckCanvas(96);
  x.fillStyle = '#07090a'; x.fillRect(0, 0, 96, 13);
  x.fillStyle = '#b8c6d0'; x.fillRect(0, 0, 96, 1); x.fillStyle = '#6a7882'; x.fillRect(0, 1, 96, 1); x.fillStyle = '#3d4850'; x.fillRect(0, 2, 96, 3);
  for (let i = 0; i < 96; i += 4) { x.fillStyle = '#56626a'; x.fillRect(i + ((i >> 2) % 2 ? 0 : 2), 2 + ((i >> 2) % 2), 2, 1); }
  x.fillStyle = '#07090a'; x.fillRect(0, 5, 96, 1); x.fillStyle = '#2c353c'; x.fillRect(0, 6, 96, 6); x.fillStyle = '#414c54'; x.fillRect(0, 6, 96, 1); rivets(x, 3, 9, 96, 8, '#6a7882');
  for (let i = 0; i < 24; i++) for (let j = 0; j < 4; j++) { x.fillStyle = ((i + j) >> 2) % 2 ? '#c89c1e' : '#15181a'; x.fillRect(36 + i, 7 + j, 1, 1); }
  for (const lx of [8, 56]) {
    x.fillStyle = '#07090a'; x.fillRect(lx - 1, 13, 10, 27); for (let i = 0; i < 8; i++) { x.fillStyle = ['#4b5760', '#3a444c', '#343e45', '#2e373d', '#262e34', '#20282d', '#1a2125', '#12171a'][i]; x.fillRect(lx + i, 13, 1, 27); }
    for (let k = 0; k < 40; k++) { x.fillStyle = '#07090a'; x.fillRect(lx + 8 + k, 13 + Math.round(k * 0.55), 1, 3); x.fillStyle = '#262e34'; x.fillRect(lx + 8 + k, 14 + Math.round(k * 0.55), 1, 1); }
  }
  x.fillStyle = '#07090a'; x.fillRect(0, 35, 96, 5); x.fillStyle = '#1a2125'; x.fillRect(0, 36, 96, 4);
  hose(x, [[60, 14], [57, 22], [63, 30], [59, 38]], 3, 2.4, { seg: 3 });
  return c;
}

// ---- platforms: four kinds ----
const fade = (ctx, p) => { if (p.gone) ctx.globalAlpha = Math.max(0, 1 - (p.fallT || 0) / 40); };
function platCatwalk(ctx, x, y, w, Y) {             // a steel grating catwalk hung from the gallery
  for (const cx of [x + 5, x + w - 6]) { ctx.fillStyle = '#07090a'; ctx.fillRect(cx - 1, Y(118), 3, y - Y(118)); ctx.fillStyle = '#6a7882'; ctx.fillRect(cx, Y(118), 1, y - Y(118)); }
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 10);
  ctx.fillStyle = '#d0dde6'; ctx.fillRect(x, y, w, 1); ctx.fillStyle = '#7d8b95'; ctx.fillRect(x, y + 1, w, 1); ctx.fillStyle = '#414c54'; ctx.fillRect(x, y + 2, w, 2);
  ctx.fillStyle = '#07090a'; for (let i = 1; i < w - 1; i += 3) ctx.fillRect(x + i, y + 2, 1, 2);
  for (let i = 0; i < w; i++) { ctx.fillStyle = ((i + 1) >> 2) % 2 ? '#f0c020' : '#15181a'; ctx.fillRect(x + i, y + 4, 1, 3); }
  ctx.fillStyle = '#2c353c'; ctx.fillRect(x, y + 7, w, 1);
  for (const cx of [x, x + w - 3]) { ctx.fillStyle = '#56626a'; ctx.fillRect(cx, y + 1, 3, 7); ctx.fillStyle = '#8f9da8'; ctx.fillRect(cx, y + 1, 1, 7); }
}
function platResin(ctx, x, y, w, f) {               // a shelf of hive resin: ribbed, glossy, trailing strands
  for (let i = 4; i < w - 3; i += 7) { const L = 3 + Math.floor(hash(i, w) * 9); ctx.fillStyle = '#000'; ctx.fillRect(x + i - 1, y + 6, 3, L + 2); ctx.fillStyle = PR[3]; ctx.fillRect(x + i, y + 6, 1, L); ctx.fillStyle = PR[5]; ctx.fillRect(x + i, y + 6 + L, 1, 1); if ((f + i * 13 + w) % 90 < 30) { ctx.fillStyle = '#8aff4a'; ctx.fillRect(x + i, y + 7 + L + Math.floor(((f + i * 13 + w) % 90) / 6), 1, 1); } }
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y, 1, 5); ctx.fillRect(x + w, y, 1, 5);
  for (let i = 0; i < w; i++) {
    const e = Math.min(i, w - 1 - i), th = Math.min(10, 5 + e) - ((i * 7 + w) % 5 === 0 ? 1 : 0), k = i % 5;
    ctx.fillStyle = '#000'; ctx.fillRect(x + i, y - 1, 1, th + 2);
    ctx.fillStyle = '#eafff6'; ctx.fillRect(x + i, y, 1, 1);
    ctx.fillStyle = k === 0 ? PR[4] : '#a4e0d0'; ctx.fillRect(x + i, y + 1, 1, 1);
    ctx.fillStyle = k === 0 ? PR[2] : PR[4]; ctx.fillRect(x + i, y + 2, 1, 1);
    ctx.fillStyle = k === 0 ? PR[0] : k === 1 ? PR[4] : k === 4 ? PR[1] : PR[3]; ctx.fillRect(x + i, y + 3, 1, Math.max(0, th - 4));
    ctx.fillStyle = k === 1 ? PR[2] : PR[1]; ctx.fillRect(x + i, y + 3 + Math.max(0, th - 5), 1, 2);
  }
}
function platEaten(ctx, p, x, y, w, f) {            // steel plate the acid is eating: bites out of the top, and it will not hold
  const hot = p.crumble > 0, pulse = hot ? (f >> 1) % 2 : (f >> 4) % 2;
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 11);
  ctx.fillStyle = '#eef6e0'; ctx.fillRect(x, y, w, 1); ctx.fillStyle = '#a8b49c'; ctx.fillRect(x, y + 1, w, 1); ctx.fillStyle = '#667262'; ctx.fillRect(x, y + 2, w, 5); ctx.fillStyle = '#414c42'; ctx.fillRect(x, y + 7, w, 1); ctx.fillStyle = '#242c26'; ctx.fillRect(x, y + 8, w, 1);
  for (let i = 2; i < w - 1; i += 6) { ctx.fillStyle = '#8a9884'; ctx.fillRect(x + i, y + 3, 1, 1); ctx.fillStyle = '#414c42'; ctx.fillRect(x + i, y + 4, 1, 1); }
  const n = Math.max(1, Math.round(w / 24));
  for (let k = 0; k < n; k++) {                     // the burns: a glowing-rimmed bite, and a dribble through
    const i = Math.round(((k + 0.5) / n) * w + (hash(k, w) - 0.5) * 6), hw = 3 + Math.floor(hash(k + 3, w) * 2);
    for (let j = 0; j < 6; j++) { const ww = Math.max(1, hw - (j >> 1)); ctx.fillStyle = ACID[pulse && j < 2 ? 4 : 3]; ctx.fillRect(x + i - ww - 1, y + j, ww * 2 + 2, 1); ctx.fillStyle = j > 3 ? ACID[1] : '#020403'; ctx.fillRect(x + i - ww, y + j, ww * 2, 1); }
    ctx.fillStyle = '#020403'; ctx.fillRect(x + i - hw, y - 1, hw * 2, 1);
    ctx.fillStyle = ACID[2]; ctx.fillRect(x + i, y + 6, 1, 3); const d = (f + k * 23 + w) % (hot ? 18 : 64); if (d < 14) { ctx.fillStyle = ACID[3]; ctx.fillRect(x + i, y + 10 + d, 1, 2); }
  }
  if (hot) { ctx.fillStyle = ACID[4]; for (let i = 3; i < w; i += 9) ctx.fillRect(x + i + (f % 3), y + 9, 1, 1); }
}
function platLift(ctx, x, y, w, f) {                // a cargo lift pad
  const m = x + (w >> 1), fl = (f >> 2) % 2;
  ctx.fillStyle = fl ? '#9fe8ff' : '#4aa8ff'; ctx.fillRect(m - 3, y + 8, 6, 2 + fl); ctx.fillStyle = '#e8fbff'; ctx.fillRect(m - 1, y + 8, 2, 2);
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 9); ctx.fillRect(m - 6, y + 7, 12, 2);
  ctx.fillStyle = '#ffe14a'; ctx.fillRect(x, y, w, 1); ctx.fillStyle = '#c89c1e'; ctx.fillRect(x, y + 1, w, 1); ctx.fillStyle = '#3d4850'; ctx.fillRect(x, y + 2, w, 4); ctx.fillStyle = '#20282d'; ctx.fillRect(x, y + 6, w, 1);
  for (let i = 0; i < 10; i++) for (let j = 0; j < 4; j++) { ctx.fillStyle = ((i + j) >> 1) % 2 ? '#f0c020' : '#15181a'; ctx.fillRect(x + i, y + 2 + j, 1, 1); ctx.fillRect(x + w - 1 - i, y + 2 + j, 1, 1); }
  ctx.fillStyle = '#56626a'; ctx.fillRect(m - 5, y + 7, 10, 1);
  const on = (f >> 4) % 2; ctx.fillStyle = on ? '#ffb03a' : '#5a3a10'; ctx.fillRect(x + 12, y + 3, 2, 2); ctx.fillStyle = on ? '#5a3a10' : '#ffb03a'; ctx.fillRect(x + w - 14, y + 3, 2, 2);
}
function drawPlat(ctx, p, x, y, w, f, Y) {
  if (p.kind === 'crumble' && p.crumble > 0) { y += f % 4 < 2 ? 1 : 0; x += (f % 3) - 1; }
  fade(ctx, p);
  if (p.kind === 'ledge') platCatwalk(ctx, x, y, w, Y);
  else if (p.kind === 'crumble') platEaten(ctx, p, x, y, w, f);
  else if (p.kind === 'movev' || p.kind === 'moveh') platLift(ctx, x, y, w, f);
  else platResin(ctx, x, y, w, f);
  ctx.globalAlpha = 1;
}
// ---- the drip: acid that has burnt down through the ceiling duct, then through the gallery floor ----
const HOLE = [12, 10, 8, 7, 6, 6, 5, 6, 6, 7, 8];    // the melted hole through the slab, row by row (y 109..119): a crater at the top
function drawPipe(ctx, x, Y, prog, f) {
  const pulse = (f >> 3) % 2, y0 = Y(109);
  // up in the duct: a small burnt hole, and the channel the acid has eaten down the wall
  ctx.fillStyle = '#020403'; ctx.fillRect(x - 3, Y(22), 6, 5); ctx.fillStyle = ACID[2]; ctx.fillRect(x - 4, Y(23), 1, 3); ctx.fillRect(x + 3, Y(23), 1, 3); ctx.fillStyle = ACID[pulse ? 4 : 3]; ctx.fillRect(x - 3, Y(26), 6, 1);
  for (let yy = 28; yy < 109; yy++) { const k = hash(yy, 7), dx = hash(yy >> 4, 3) < 0.5 ? 0 : -1; ctx.fillStyle = '#060a08'; ctx.fillRect(x + dx - 1, Y(yy), 3, 1); ctx.fillStyle = k < 0.25 ? ACID[2] : k < 0.5 ? ACID[1] : '#0d1a12'; ctx.fillRect(x + dx, Y(yy), 1, 1); }
  for (const [yy, L] of [[40, 5], [66, 7], [88, 4]]) { ctx.fillStyle = '#060a08'; ctx.fillRect(x + 2, Y(yy), 2, L); ctx.fillStyle = ACID[1]; ctx.fillRect(x + 2, Y(yy + L - 1), 1, 1); }
  const g = (f + x * 7) % 50; ctx.fillStyle = ACID[4]; ctx.fillRect(x, Y(30 + g * 1.5), 1, 2);                         // a bead running down the channel
  if (prog < 0.5) { const dy = Y(27 + (prog / 0.5) * (prog / 0.5) * 82); ctx.fillStyle = ACID[3]; ctx.fillRect(x - 1, dy, 2, 3); ctx.fillStyle = ACID[4]; ctx.fillRect(x - 1, dy + 2, 1, 1); }
  // the hole in the gallery floor: rail gone, slab scorched, edges still glowing, metal sagging underneath
  ctx.fillStyle = '#12171a'; ctx.fillRect(x - 9, Y(99), 18, 10); ctx.fillStyle = '#07090a'; ctx.fillRect(x - 10, Y(99), 1, 3); ctx.fillRect(x + 9, Y(99), 1, 3);
  for (const s of [-1, 1]) { ctx.fillStyle = '#6a7882'; ctx.fillRect(x + s * 10 + (s < 0 ? -1 : 0), Y(100), 2, 1); ctx.fillRect(x + s * 9 + (s < 0 ? -1 : 0), Y(101), 2, 1); ctx.fillRect(x + s * 8 + (s < 0 ? -1 : 0), Y(102), 2, 2); ctx.fillStyle = ACID[3]; ctx.fillRect(x + s * 8 + (s < 0 ? -1 : 0), Y(104), 1, 1); }
  ctx.fillStyle = '#0b0f0c'; ctx.fillRect(x - 17, y0 + 1, 34, 3); ctx.fillStyle = '#1a2018'; ctx.fillRect(x - 20, y0 + 1, 3, 1); ctx.fillRect(x + 17, y0 + 1, 3, 1);
  HOLE.forEach((hw, j) => { ctx.fillStyle = j < 3 || j > 8 ? ACID[pulse ? 4 : 3] : ACID[2]; ctx.fillRect(x - hw - 1, y0 + j, hw * 2 + 2, 1); ctx.fillStyle = ACID[1]; ctx.fillRect(x - hw, y0 + j, hw * 2, 1); ctx.fillStyle = '#020403'; ctx.fillRect(x - hw + 1, y0 + j, hw * 2 - 2, 1); });
  ctx.fillStyle = ACID[4]; ctx.fillRect(x - 13, y0, 2, 1); ctx.fillRect(x + 11, y0, 2, 1);
  for (const [dx, L] of [[-11, 3], [-8, 6], [-6, 3], [7, 5], [10, 2]]) { ctx.fillStyle = '#000'; ctx.fillRect(x + dx - 1, y0 + 10, 3, L + 1); ctx.fillStyle = '#56626a'; ctx.fillRect(x + dx, y0 + 10, 1, L); ctx.fillStyle = ACID[pulse ? 4 : 3]; ctx.fillRect(x + dx, y0 + 9 + L, 1, 1); }
  for (let k = 0; k < 3; k++) { const s = (f + k * 19) % 56; ctx.globalAlpha = 0.3 * (1 - s / 56); ctx.fillStyle = '#b8e8b0'; ctx.fillRect(x - 5 + k * 4 + Math.round(Math.sin((f + k * 30) / 11) * 2), y0 - 2 - (s >> 1), 3 + (s >> 4), 3); } ctx.globalAlpha = 1;
  if (prog > 0.45) { const r = 1 + Math.floor(((prog - 0.45) / 0.55) * 3); ctx.fillStyle = ACID[3]; ctx.fillRect(x - (r >> 1), Y(120), r, r + 2); ctx.fillStyle = ACID[4]; ctx.fillRect(x, Y(120), 1, 1); }
}
// ---- the outfitter's stencils: whoever kitted this colony out painted their name on the bulkheads, in the same grey as
// DECK 03. Old paint, worn through and scratched, and the hive has started growing over it. Backdrop only: drawn on
// the odd wall bay (see wallFx), never on every one.
const STENCIL = (() => {
  const mk = (rows, w, h, ox, oy, sd, grow) => { const c = cv(w, h), x = c.getContext('2d');
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') {
      const wear = hash(i >> 1, (j >> 1) + sd), scr = ((i + j * 3 + sd) % 41) === 0;           // paint flaked and faded in patches; a long scratch
      if ((wear < 0.07 && hash(i, j + sd) < 0.7) || scr) continue;
      x.fillStyle = wear < 0.3 ? '#4b575e' : j < 2 ? '#667279' : '#59656d'; x.fillRect(ox + i, oy + j, 1, 1); } });
    grow(x); return c; };
  const word = mk(LOGO.W7, 72, 28, 3, 4, 5, (x) => { x.fillStyle = '#59656d'; for (let i = 3; i < 68; i++) if (hash(i >> 2, 91) > 0.25) x.fillRect(i, 13, 1, 1);
    hose(x, [[66, -2], [63, 8], [67, 16], [64, 22], [66, 29]], 2.6, 2, { seg: 3 }); hose(x, [[64, 12], [56, 15], [50, 13]], 1.6, 1.2, { seg: 3 }); node(x, 64, 12, 2); });
  const vee = mk(LOGO.V30, 40, 40, 4, 4, 13, (x) => { hose(x, [[41, 3], [34, 8], [30, 6], [27, 13], [29, 19]], 2.4, 1.6, { seg: 3 }); node(x, 30, 6, 2); });
  return { word, vee };
})();
let scroll = 0;        // how far the wall has scrolled (noted in backFx), so wallFx can tell which bay it is drawing
// ---- live details on the wall (x = position in the 384 tile) ----
function wallFx(ctx, base, Y, f) {
  const on = (tx) => base + tx > -40 && base + tx < 360;
  const bay = ((Math.round((scroll + base) / 384) % 8) + 8) % 8;      // each stencil turns up on one bay in eight: three or four marks in the whole level
  if (bay === 1 && on(340)) ctx.drawImage(STENCIL.word, base + 303, Y(71));
  if (bay === 5 && on(340)) ctx.drawImage(STENCIL.vee, base + 318, Y(61));
  if (on(148)) { const a = (f % 60) / 60, k = Math.abs(Math.sin(a * TAU)); ctx.globalAlpha = 0.07 * k; ctx.fillStyle = '#ff3a2a'; for (let r = 22; r > 0; r -= 5) ctx.fillRect(base + 148 - r, Y(123) - r, r * 2, r * 2); ctx.globalAlpha = 1; ctx.fillStyle = k > 0.5 ? '#ff5a3a' : '#7a1c14'; ctx.fillRect(base + 144, Y(122), 9, 4); if (k > 0.5) { ctx.fillStyle = '#ffd0c0'; ctx.fillRect(base + 144 + Math.floor(a * 16) % 8, Y(122), 2, 2); } }
  if (on(325)) { const lit = hash(f >> 2, 9) > 0.55 && (f % 200) < 120; if (lit) { ctx.globalAlpha = 0.06; ctx.fillStyle = '#8fd0e0'; for (let r = 24; r > 0; r -= 6) ctx.fillRect(base + 325 - r - 8, Y(47) - r, r * 2 + 16, r * 2); ctx.globalAlpha = 1; ctx.fillStyle = '#e8fbff'; ctx.fillRect(base + 312, Y(46), 26, 2); } }
  if (on(80)) { ctx.fillStyle = '#7affc8'; ctx.fillRect(base + 68, Y(60 + ((f >> 2) % 14)), 24, 1); if ((f >> 4) % 2) ctx.fillRect(base + 86, Y(72), 3, 1); }
  if (on(189)) { ctx.fillStyle = (f >> 5) % 2 ? '#ff3a2a' : '#5a1410'; ctx.fillRect(base + 188, Y(152), 2, 2); ctx.fillStyle = '#3ad89a'; ctx.fillRect(base + 188, Y(156), 2, 1); }
  if (on(133)) for (let k = 0; k < 3; k++) { const a = (f + k * 27) % 80; ctx.globalAlpha = 0.28 * (1 - a / 80); ctx.fillStyle = '#b8c8d0'; ctx.fillRect(base + 128 + k * 4 + Math.round(Math.sin((f + k * 40) / 17) * 2), Y(60) - (a >> 1), 5 + (a >> 4), 4); } ctx.globalAlpha = 1;
  if (on(346)) { const s = f % 140; if (s < 8) { ctx.fillStyle = s % 2 ? '#fff7c0' : '#ffd21a'; for (let k = 0; k < 5; k++) ctx.fillRect(base + 346 + Math.round(Math.cos(k * 1.3 + s) * (2 + s)), Y(161) + Math.round(Math.sin(k * 1.3 + s) * (1 + s * 0.6)) + s, 1, 1); ctx.fillRect(base + 345, Y(160), 3, 2); } }
  if (on(244)) { const k = 0.5 + 0.5 * Math.sin(f / 23); ctx.globalAlpha = 0.05 + 0.05 * k; ctx.fillStyle = '#46c02a'; for (let r = 14; r > 0; r -= 4) ctx.fillRect(base + 244 - r, Y(190) - r, r * 2, r); ctx.globalAlpha = 1; }
  if (on(176)) { const d = (f % 110); if (d < 40) { ctx.fillStyle = ACID[3]; ctx.fillRect(base + 181, Y(86 + d * d * 0.012), 1, 2); } }
}

// ---------- the boss: THE QUEEN. One rule: jump her tail. ----------
const QP = ['#05070a', '#141a22', '#28323e', '#6a7c8e', '#a8bccc', '#e8f4ff'];
const VERT = []; for (let r = 1; r <= 8; r++) { const c = cv(r * 2 + 3, r * 2 + 3), x = c.getContext('2d'); node(x, r + 1, r + 1, r, QP); VERT[r] = c; }
const lerp = (a, b, t) => a + (b - a) * t, ease = (t) => t * t * (3 - 2 * t), mix = (A, B, t) => A.map((p, i) => [lerp(p[0], B[i][0], t), lerp(p[1], B[i][1], t)]);
const QX = 264, HIP = [278, FL - 44];
const POSE = {
  rest: [HIP, [303, 100], [308, 62], [284, 36], [250, 32], [226, 48]],
  wind: [HIP, [306, 104], [314, 64], [298, 30], [272, 20], [262, 40]],
  near: [HIP, [300, 130], [290, 152], [264, 157], [238, 157], [212, 156]],
  out: [HIP, [298, 132], [282, 154], [220, 157], [110, 157], [12, 156]],
};
// two attacks. Her TAIL whips along the floor and is gone: one jump clears it. Her ACID is a long surge that takes longer to pass
// than one jump stays up (ACID_T ticks over any spot; the longest single jump is 37 in the air): it needs the double jump.
const PATTERN = [{ T: 64, gap: 18 }, { acid: 1, T: 62, v: 3.2 }, { T: 52, gap: 17, feint: 1 }, { acid: 1, T: 50, v: 3.7 }, { T: 42, gap: 16, dbl: 1 }, { acid: 1, T: 40, v: 4.2 }, { T: 36, gap: 15, feint: 1, dbl: 1 }];
const ACID_X = 204, ACID_T = 34, MOUTH = [QX - 37, FL - 77];        // MOUTH: where the acid comes out on screen (drawing only): between her mandibles
export const QUEEN = { PATTERN, ACID_X, ACID_T };
function tailPose(q, f) {
  const sway = (P, a) => P.map((p, i) => [p[0] + Math.sin(f / 19 + i * 0.7) * a * i, p[1] + Math.cos(f / 23 + i) * a * i * 0.6]);
  const shiver = (P) => P.map((p, i) => [p[0] + (i > 2 ? ((f >> 1) % 2) * 2 - 1 : 0), p[1]]);
  const pat = (q.P || PATTERN)[Math.min(q.n, PATTERN.length - 1)];
  switch (q.ph) {
    case 'feint': return q.t < 10 ? mix(sway(POSE.rest, 0.5), POSE.wind, ease(q.t / 10)) : q.t < 22 ? shiver(POSE.wind) : mix(POSE.wind, sway(POSE.rest, 0.5), ease((q.t - 22) / 8));
    case 'wind': return q.t < 12 ? mix(sway(POSE.rest, 0.5), POSE.wind, ease(q.t / 12)) : q.t < pat.T - 6 ? shiver(POSE.wind) : mix(POSE.wind, POSE.near, Math.min(1, (q.t - (pat.T - 6)) / 5) ** 2);
    case 'wind2': return q.t < 8 ? mix(POSE.near, POSE.wind, ease(q.t / 8)) : q.t < 14 ? shiver(POSE.wind) : mix(POSE.wind, POSE.near, Math.min(1, (q.t - 14) / 5) ** 2);
    case 'slam': return POSE.near;
    case 'out': return mix(POSE.near, POSE.out, q.t / 5);
    case 'hold': return POSE.out;
    case 'back': return mix(POSE.out, POSE.near, q.t / 4);
    case 'lift': return mix(POSE.near, sway(POSE.rest, 0.5), ease(q.t / 14));
    default: return sway(POSE.rest, 0.5);
  }
}
function drawTail(ctx, P, f, dy = 0) {
  const S = curve(P, 2), L = S[S.length - 1].d, N = Math.max(8, Math.round(L / 6.5)), segs = [];
  let k = 0; for (let i = 0; i <= N; i++) { const d = (i / N) * L; while (k < S.length - 1 && S[k].d < d) k++; segs.push(S[k]); }
  const R = (i) => Math.max(2, Math.round(7.5 - (i / N) * 5.5));
  const tip = segs[N], pre = segs[N - 1], ux = tip.x - pre.x, uy = tip.y - pre.y, um = Math.hypot(ux, uy) || 1;
  for (let i = 0; i <= N; i += 2) { const s = segs[i], r = R(i); ctx.fillStyle = '#000'; ctx.fillRect(Math.round(s.x + s.nx * (r + 1)) - 1, Math.round(s.y + s.ny * (r + 1)) - 1 + dy, 3, 3); ctx.fillStyle = QP[4]; ctx.fillRect(Math.round(s.x + s.nx * (r + 1)), Math.round(s.y + s.ny * (r + 1)) + dy, 1, 1); ctx.fillRect(Math.round(s.x + s.nx * (r + 2)), Math.round(s.y + s.ny * (r + 2)) + dy, 1, 1); }
  for (let j = 0; j < 16; j++) { const w = j < 4 ? 2 : j < 11 ? 1.5 : 0.5, bx = tip.x + (ux / um) * j, by = tip.y + (uy / um) * j - Math.sin((j / 15) * 1.2) * 3; ctx.fillStyle = '#000'; ctx.fillRect(Math.round(bx - w) - 1, Math.round(by - w) - 1 + dy, Math.ceil(w * 2) + 2, Math.ceil(w * 2) + 2); }
  for (let i = N; i >= 0; i--) { const s = segs[i], r = R(i), v = VERT[r]; ctx.drawImage(v, Math.round(s.x) - r - 1, Math.round(s.y) - r - 1 + dy); }
  for (let j = 0; j < 16; j++) { const w = j < 4 ? 2 : j < 11 ? 1.5 : 0.5, bx = tip.x + (ux / um) * j, by = tip.y + (uy / um) * j - Math.sin((j / 15) * 1.2) * 3; ctx.fillStyle = j > 11 ? QP[5] : QP[4]; ctx.fillRect(Math.round(bx - w), Math.round(by - w) + dy, Math.ceil(w * 2), Math.ceil(w * 2)); ctx.fillStyle = QP[2]; ctx.fillRect(Math.round(bx - w), Math.round(by + w) - 1 + dy, Math.ceil(w * 2), 1); }
  return tip;
}
function buildChamber(B) {
  const c = cv(BW, BH), x = c.getContext('2d'), n = noise(5);
  for (let j = 0; j < BH; j++) for (let i = 0; i < BW; i++) { x.fillStyle = dith(['#010303', '#030909', '#06120f', '#0a1c16'], j / BH, i, j); x.fillRect(i, j, 1, 1); }
  // the vault of the egg chamber: ribs like a cathedral
  for (let k = 0; k < 5; k++) { const a = -30 + k * 80; hose(x, [[a, 170], [a + 6, 90], [a + 40, 26], [a + 74, 90], [a + 80, 170]], 9, 9, { seg: 5, pal: DIM }); }
  for (let k = 0; k < 5; k++) { const cx = 10 + k * 80; hose(x, [[cx, -4], [cx + (n() - 0.5) * 8, 60], [cx + (n() - 0.5) * 8, 120], [cx, 164]], 13, 11, { seg: 5, pal: DIM }); node(x, cx, 26, 5, DIM); node(x, cx, 96, 4, DIM); }
  for (let k = 0; k < 9; k++) { const a = k * 40 - 10, y = 20 + n() * 30; hose(x, [[a, y], [a + 20, y + 8 + n() * 6], [a + 40, y]], 3, 3, { seg: 3, pal: DIM }); }
  for (let k = 0; k < 6; k++) { const ex = 26 + k * 52 + Math.floor(n() * 14), ey = 44 + Math.floor(n() * 26); x.fillStyle = DIM[2]; x.fillRect(ex + 2, ey - 14, 1, 14); px(x, ex, ey, ['.###.', '#####', '#ooo#', '#ooo#', '#####', '#####', '#####', '#####', '.###.', '.###.', '..#..'], { '#': DIM[3], o: DIM[5] }); }
  // her eggs, rows of them going back into the dark
  for (let row = 0; row < 3; row++) for (let k = 0; k < 13; k++) { const ex = 92 + k * 19 + row * 7 + Math.floor(n() * 5), ey = 138 + row * 9; if (row === 2 && ex > 190) continue; glow(x, ex, ey - 6, 8, '#2a8a1a', 0.22 + row * 0.06); const e = tint(B.egg, '#020605', 0.72 - row * 0.17); x.drawImage(e.c, ex - e.ox, ey - e.oy); }
  // the last of the colony's steel: the bulkhead on the left with the hatch's junction box, and the deck
  for (let i = 0; i < 26; i++) { x.fillStyle = ['#6a7882', '#4b5760', '#3a444c', '#343e45', '#2e373d', '#262e34'][Math.min(5, i >> 2)]; x.fillRect(i, 0, 1, FL); } x.fillStyle = '#07090a'; x.fillRect(26, 0, 2, FL); for (let yy = 8; yy < FL; yy += 14) { x.fillStyle = '#12171a'; x.fillRect(20, yy, 2, 2); x.fillStyle = '#8f9da8'; x.fillRect(20, yy, 1, 1); }
  for (let j = 0; j < 30; j++) for (let i = 0; i < 26; i++) { x.fillStyle = ((i + j) >> 3) % 2 ? '#8a6c18' : '#15181a'; if (j < 6 || j > 23) x.fillRect(i, 58 + j, 1, 1); }
  hose(x, [[27, 30], [36, 44], [30, 70], [40, 96]], 5, 2, { seg: 4 }); hose(x, [[26, 4], [44, 10], [60, 4]], 5, 2, { seg: 4 });
  box(x, 3, 120, 20, 34, '#39444c', '#8f9da8', '#12171a'); x.fillStyle = '#12171a'; x.fillRect(5, 131, 16, 21); drawText(x, 'HATCH', 0, 110, { fill: '#c89c1e', outline: '#000' });
  for (let j = 0; j < 4; j++) { x.fillStyle = ['#56626a', '#3d4850', '#2c353c', '#12171a'][j]; x.fillRect(12 + j, 154, 1, 6); }
  x.fillStyle = '#07090a'; x.fillRect(0, FL - 1, BW, BH - FL + 1); x.fillStyle = '#b8c6d0'; x.fillRect(0, FL, BW, 1); x.fillStyle = '#6a7882'; x.fillRect(0, FL + 1, BW, 1); x.fillStyle = '#3d4850'; x.fillRect(0, FL + 2, BW, 3);
  for (let i = 0; i < BW; i += 4) { x.fillStyle = '#56626a'; x.fillRect(i + ((i >> 2) % 2 ? 0 : 2), FL + 2 + ((i >> 2) % 2), 2, 1); }
  x.fillStyle = '#07090a'; x.fillRect(0, FL + 5, BW, 1); x.fillStyle = '#20282d'; x.fillRect(0, FL + 6, BW, 14); x.fillStyle = '#343e45'; x.fillRect(0, FL + 6, BW, 1); rivets(x, 4, FL + 10, BW, 10, '#56626a');
  for (let j = 0; j < 3; j++) { x.fillStyle = ['#56626a', '#3d4850', '#12171a'][j]; x.fillRect(14, FL + 13 + j, 190, 1); }      // the cable from the box to the hatch
  return c;
}
const HX0 = 196, HX1 = 318;                          // the hatch she is standing on
const AC = ['#0e3812', '#2a8a1a', '#46c02a', '#8aff4a', '#e0ffb0'];
function drawAcid(ctx, st, f, ox, oy) {
  const q = st.q, pat = (q.P || PATTERN)[Math.min(q.n, PATTERN.length - 1)], mx = MOUTH[0] + ox, my = MOUTH[1] + oy, R = (c, x, y, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  if (q.ph === 'awind') {                                // her throat fills: a green glow at the jaws, and it starts to run out between her teeth
    const k = Math.min(1, q.t / pat.T), r = 4 + Math.round(k * 9);
    for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j) * 1.3); ctx.globalAlpha = (0.12 + 0.3 * k) * (1 - Math.abs(j) / (r + 1)) * ((f >> 1) % 2 ? 1 : 0.7); ctx.fillStyle = AC[3]; ctx.fillRect(mx - 3 - w, my + 1 + j, w * 2, 1); } ctx.globalAlpha = 1;
    const g = 1 + Math.round(k * 2), rows = [g, g + 1, g + 1, g];                                                                   // a glob of it wells up between her mandibles
    rows.forEach((w, j) => R('#000', mx - w - 1, my - 2 + j, 2 * w + 2, 1)); R('#000', mx - g, my - 3, 2 * g, 1); R('#000', mx - g, my + 2, 2 * g, 1);
    rows.forEach((w, j) => R(j ? AC[2] : AC[3], mx - w, my - 2 + j, 2 * w, 1)); R(AC[4], mx - g + 1, my - 2, 1 + Math.round(k), 1); if ((f >> 2) % 2) R(AC[4], mx + g - 1, my, 1, 1);
    for (let i = 0; i < 4; i++) { const t = (f * 2 + i * 23) % 64; if (t < 14 + k * 50) { const y = my + 4 + t * 0.6 + t * t * 0.02; if (y < FL - 2) { R('#000', mx - 4 + i * 2 - 1, y - 1, 3, 6); R(AC[3], mx - 4 + i * 2, y, 1, 4); R(AC[4], mx - 4 + i * 2, y + 3, 1, 1); } } }
    return;
  }
  if (q.ph !== 'spew' && q.ph !== 'flood') return;
  // the gush: out of her jaws, forward and down in an arc to the floor in front of her, fattening as it falls
  const pour = q.ph === 'spew' ? 1 : Math.max(0, 1 - q.t / 16);
  if (pour > 0) { const reach = q.ph === 'spew' ? Math.min(1, q.t / 8) : 1, N = 46, lx = ACID_X + 6;
    const at = (u) => [mx - 1 - (mx - 1 - lx) * (u * 0.55 + u * u * 0.45) + Math.sin(u * 9 + f / 2) * 1.2 * u, my + (FL - my - 1) * u * u, (2.5 + 4.5 * u) * pour + 1];
    for (let k = 0; k <= N * reach; k++) { const [x, y, w] = at(k / N); R('#000', x - w - 1, y - 1, Math.round(w * 2) + 2, 4); }
    for (let k = 0; k <= N * reach; k++) { const u = k / N, [x, y, w] = at(u), W = Math.round(w * 2); R(AC[1], x - w, y, W, 3); R(AC[2], x - w, y, Math.max(1, W - 1), 3); R(AC[3], x - w, y, Math.max(1, Math.round(W * 0.6)), 3); if ((k + f) % 6 < 2) R(AC[4], x - w + 1, y, 1, 3); }
    for (let i = 0; i < 7; i++) { const t = (f * 2 + i * 11) % 22, u = Math.min(1, (i + 1) / 8 * reach), [x, y] = at(u); R('#000', x - 9 - t * 0.5 - 1, y + t * 1.3 - 1, 3, 3); R(AC[i % 2 ? 4 : 3], x - 9 - t * 0.5, y + t * 1.3, 1, 1); }                    // flecks coming off it
    if (reach >= 1) for (let i = 0; i < 8; i++) { const t = (f * 2 + i * 5) % 14, dir = i % 2 ? 1 : -1; R('#000', lx + dir * (2 + t * (0.6 + (i % 3) * 0.4)) - 1, FL - 3 - t * (1.6 + (i % 3) * 0.5) + t * t * 0.13 - 1, 4, 4); R(AC[4], lx + dir * (2 + t * (0.6 + (i % 3) * 0.4)), FL - 3 - t * (1.6 + (i % 3) * 0.5) + t * t * 0.13, 2, 2); } }
  if (q.ph !== 'flood') return;
  // the surge: a crest at the front, a long bubbling body behind it, running out to nothing at the back
  const front = Math.max(26, ACID_X - pat.v * q.t), back = Math.min(ACID_X + 6, ACID_X - pat.v * q.t + pat.v * ACID_T), hit = front <= 26.5;
  if (back <= front) return;
  const top = (x) => { const d = x - front, tail = back - x; let h = 7 + Math.sin((x + f * 1.5) / 5) * 1.3 + Math.sin((x - f) / 2.3) * 0.7; if (d < 20 && !hit) h += 15 * Math.sin((d / 20) * Math.PI) ** 0.6 + (d < 6 ? -4 + d * 0.7 : 0); if (hit && d < 12) h += (12 - d) * 1.2 * (0.6 + 0.4 * Math.sin(f / 2)); if (tail < 22) h *= tail / 22; return Math.max(1, h); };
  for (let x = Math.round(front); x < back; x++) { const h = Math.round(top(x)); R('#000', x, FL - h - 1, 1, h + 1); }
  for (let x = Math.round(front); x < back; x++) { const h = Math.round(top(x));
    R(AC[2], x, FL - h, 1, h); R(AC[4], x, FL - h, 1, 1); if (h > 2) R(AC[3], x, FL - h + 1, 1, Math.max(1, h >> 1)); if (h > 4 && hash(x, 3) > 0.6) R(AC[1], x, FL - 2, 1, 1);
    if (hash(x >> 1, 9) > 0.82) { const t = (f + x * 7) % 16; if (t < 10) R(AC[4], x, FL - h - 2 - t * 0.5, 1, 1); } }           // bubbles popping off it
  for (let i = 0; i < 5; i++) { const t = (f * 2 + i * 9) % 14; R(AC[4], front + 2 - t * 0.5 + i * 2, FL - 12 - i * 2 - t + t * t * 0.07, 2, 1); }                           // spray off the crest
  for (let i = 0; i < 7; i++) { const sx = front + 14 + ((i * 37 + (f >> 1)) % Math.max(1, Math.round(back - front - 14))), t = (f + i * 13) % 30; ctx.globalAlpha = 0.3 * (1 - t / 30); R('#c8ffb0', sx, FL - 10 - t * 0.6, 2, 2); } ctx.globalAlpha = 1;   // it smokes
}
// ---------- the junction box takes the beating: every strike she lands on it blows another LED ----------
const LED = (i) => [7 + (i % 3) * 5, 134 + Math.floor(i / 3) * 7];
const RR = (ctx) => (c, x, y, w = 1, h = 1) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
// how hard the hatch is shaking, 0 or 1 px this frame: nothing at first, a rattle from the third LED, a constant shudder by the sixth
const vibOf = (st, f) => { const n = st.q.n; return st.won ? 0 : n >= 6 ? f & 1 : n >= 5 ? (f >> 1) & 1 : n >= 3 ? ((f % (n === 3 ? 22 : 12)) < 2 ? 1 : 0) : 0; };
// the box as it stands: dead LEDs, cracks, smoke, shorting wires, and finally a fire. All of it only looked at: nothing here changes play.
function drawPanel(ctx, q, f) {
  const n = q.n, R = RR(ctx);
  if (n >= 3) { ctx.globalAlpha = 0.5; R('#000', 3, 127, 20, 3); R('#000', 19, 130, 4, 12); ctx.globalAlpha = 1; }                      // scorched
  if (n >= 5) { R('#000', 1, 118, 11, 5); R('#12171a', 2, 119, 9, 3); for (let i = 0; i < 6; i++) R('#56626a', 17 + i, 121 + i * 2, 5, 2); R('#000', 16, 120, 1, 13); }   // the cover has come off its top hinge and hangs
  for (let i = 0; i < PATTERN.length; i++) { const [lx, ly] = LED(i);
    if (i < n) {                                              // blown: a black socket with broken glass in it
      R('#000', lx - 1, ly - 1, 5, 5); R('#1c120e', lx, ly, 3, 3); R('#6a5a50', lx + (i % 2 ? 0 : 2), ly + (i % 2 ? 2 : 0), 1, 1); R('#3a2c26', lx + 1, ly + 1, 1, 1);
      const ph = (f + i * 23) % 44; ctx.globalAlpha = 0.55 * (1 - ph / 44); R('#aab6be', lx + 1 + ((ph >> 3) % 2), ly - 2 - (ph >> 2), 1, 2); ctx.globalAlpha = 1;      // a thread of smoke off it
    } else {                                                  // still alive: the more the box is hurt the more it stutters
      const dim = n >= 1 && hash(i * 7 + (f >> 2), 3) < n * 0.07;
      R('#000', lx - 1, ly - 1, 5, 5); R(dim ? '#5a1810' : '#ff3a2a', lx, ly, 3, 3); if (!dim) { R('#ffb0a0', lx, ly, 1, 1); ctx.globalAlpha = 0.25; R('#ff3a2a', lx - 1, ly - 1, 5, 5); ctx.globalAlpha = 1; }
    } }
  const crack = (pts, c = '#000') => { for (const [x, y] of pts) R(c, x, y); };
  if (n >= 1) crack([[9, 131], [10, 132], [10, 133], [11, 134], [11, 135], [12, 136], [11, 137]]);
  if (n >= 2) crack([[20, 139], [19, 140], [18, 140], [17, 141], [16, 142], [16, 143], [15, 144], [14, 144]]);
  if (n >= 3) crack([[5, 146], [6, 146], [7, 147], [8, 148], [9, 148], [10, 149], [10, 150], [11, 151]]);
  if (n >= 4) { crack([[21, 131], [20, 132], [20, 133], [19, 134], [18, 134], [18, 135]]); crack([[5, 138], [6, 139], [7, 139], [8, 140]]); }
  if (n >= 2) crack([[4, 124], [5, 125], [6, 125], [7, 126], [15, 123], [16, 124], [17, 124]], '#12171a');
  // a wire torn loose out of the bottom of the box, swinging and spitting
  if (n >= 4) { const sw = Math.round(Math.sin(f / 9) * 2); for (let k = 0; k < 9; k++) { const wx = 23 + k * 0.6 + sw * (k / 8), wy = 150 + k; R('#000', wx - 1, wy, 3, 1); R(k % 3 ? '#c83a2a' : '#e8c93a', wx, wy); }
    if ((f % 26) < 5 || (n >= 6 && (f % 9) < 3)) { const ex = 23 + 5 + sw, ey = 159; R('#ffffff', ex - 1, ey - 1, 3, 3); R('#8ae8ff', ex - 3, ey, 7, 1); R('#8ae8ff', ex, ey - 3, 1, 7); } }
  // it shorts: a white-blue arc jumps out of a dead socket and drops a few sparks. Rare after one hit, all the time after six.
  if (n >= 1) { const per = Math.max(11, 74 - n * 11), k = Math.floor(f / per), ph = f % per, [lx, ly] = LED(Math.floor(hash(k, 5) * n));
    if (ph < 4) { let ax = lx + 1, ay = ly + 1; for (let j = 0; j < 5 + n; j++) { const nx = ax + 1 + (hash(k * 9 + j, ph) > 0.5 ? 1 : 0), ny = ay + Math.round((hash(k * 5 + j, ph + 3) - 0.4) * 4); R('#000', nx - 1, ny - 1, 3, 3); R(j % 2 ? '#8ae8ff' : '#ffffff', nx, ny, 1, 1); R('#ffffff', ax, ay, 1, 1); ax = nx; ay = ny; } R('#ffffff', lx, ly, 3, 3); }
    if (ph < 16) for (let j = 0; j < 2 + (n >> 1); j++) { const vx = 0.5 + hash(k + j, 11) * 1.6, vy = -0.8 - hash(k + j, 12) * 1.4, y = ly + vy * ph + 0.11 * ph * ph; if (y < FL - 1) R(ph < 6 ? '#fff7c0' : ph < 11 ? '#ffb03a' : '#c84a1a', lx + 2 + vx * ph, y, 1, 1); } }
  // smoke off the top of the box, thicker every time
  if (n >= 2) for (let k = 0; k < n * 2; k++) { const t = (f + k * 19) % 60, x = 8 + hash(k, 1) * 9 + Math.sin((f + k * 31) / 11) * t * 0.08, y = 119 - t * 0.75, sz = 2 + (t >> 4); ctx.globalAlpha = Math.min(0.5, 0.1 + n * 0.06) * (1 - t / 60); R(k % 3 ? '#8a969e' : '#565f66', x, y, sz, sz); } ctx.globalAlpha = 1;
  // and by the end it is on fire
  if (n >= 6) for (let k = 0; k < 6; k++) { const t = (f * 2 + k * 5) % 10, x = 6 + k * 2.6; R('#000', x - 1, 117 - t, 4, t + 3); R(t < 3 ? '#fff7c0' : t < 6 ? '#ffb03a' : '#ff5a2a', x, 118 - t, 2, t + 2); }
  // the sign over it starts to fail
  if (n >= 4 && hash(f >> 1, 21) < (n - 3) * 0.16) { ctx.globalAlpha = 0.75; R('#07090a', 0, 108, 27, 9); ctx.globalAlpha = 1; }
}
// the strike itself: the tail (or the acid) lands on the box. q.boom = ticks since it landed.
function drawBoom(ctx, q, f) {
  const t = q.boom; if (t > 52) return;
  const R = RR(ctx), acid = q.boomK === 1, n = q.n, cx = 13, cy = 142, hot = acid ? ['#ffffff', '#e0ffb0', '#8aff4a', '#2a8a1a'] : ['#ffffff', '#fff7c0', '#ffb03a', '#ff5a2a'];
  if (t < 14) {                                              // the blast: a ball of light that swells off the panel, then breaks up
    const r = Math.min(15, 6 + t * 1.5 + n * 0.5), gone = Math.max(0, (t - 7) / 7);
    for (let j = -Math.ceil(r); j <= r; j++) for (let i = -Math.ceil(r); i <= r; i++) { const d = Math.sqrt(i * i + j * j) / r; if (d > 1 || cx + i < 0 || cy + j >= FL) continue; if (gone > 0 && hash(i * 31 + j, 4) < gone) continue; R(d > 0.86 ? '#000' : d > 0.66 ? hot[3] : d > 0.42 ? hot[2] : d > 0.2 ? hot[1] : hot[0], cx + i, cy + j); }
  }
  if (t < 5) {                                               // the flash: the whole panel whites out and a star of light jumps off it
    R(hot[0], 4, 130, 18, 23); const r = 9 + t * 5;
    for (let k = 0; k < 8; k++) { const dx = [1, 0.7, 0, -0.7, -1, -0.7, 0, 0.7][k], dy = [0, 0.7, 1, 0.7, 0, -0.7, -1, -0.7][k]; for (let d = 5; d < r * (k % 2 ? 0.7 : 1); d++) { const y = cy + dy * d; if (y < FL) R(d < r - 5 ? hot[0] : hot[1], cx + dx * d, y, k % 2 ? 1 : 2, k % 2 ? 1 : 2); } }
  }
  // sparks: thrown out across the deck, bouncing once, cooling from white to red. More of them every hit.
  const N = Math.min(54, (acid ? 12 : 18) + n * 6);
  for (let i = 0; i < N; i++) { const h1 = hash(i, n * 7 + 1), h2 = hash(i, n * 7 + 2), h3 = hash(i, n * 7 + 3), life = 16 + h3 * 34; if (t > life) continue;
    const vx = 0.5 + h1 * (3 + n * 0.35), vy = -0.4 - h2 * 4.4; let x = 20 + vx * t, y = 141 + vy * t + 0.14 * t * t;
    if (y > FL - 1) { y = FL - 1 - (y - (FL - 1)) * 0.3; if (y > FL - 1 || y < FL - 14) y = FL - 1; }
    const a = t / life, c = a < 0.25 ? hot[0] : a < 0.55 ? hot[1] : a < 0.82 ? hot[2] : hot[3], big = h3 > 0.4 && a < 0.6;
    if (big) R('#000', x - 1, y - 1, 4, 4); R(c, x, y, big ? 2 : 1, big ? 2 : 1); if (a < 0.6) { ctx.globalAlpha = 0.5; R(hot[2], x - vx, y - (vy + 0.28 * t), 1, 1); ctx.globalAlpha = 1; } }
  // and what is left of it: smoke (steam and a green fizz when it was acid)
  if (t > 5) for (let k = 0; k < 7; k++) { const tt = t - 5 - k * 2; if (tt < 0 || tt > 34) continue; const x = 6 + hash(k, n + 40) * 16 + tt * 0.25, y = 136 - tt * 0.9 - hash(k, 2) * 8, sz = 3 + (tt >> 3); ctx.globalAlpha = 0.5 * (1 - tt / 34); R(acid ? (k % 2 ? '#c8ffb0' : '#e8f4f0') : (k % 2 ? '#8a969e' : '#565f66'), x, y, sz, sz); } ctx.globalAlpha = 1;
}
// steam off the seams of the hatch under her: a wisp after two LEDs, jets by six. two layers, so some of it is behind her and some in front
function hatchSteam(ctx, n, f, layer) {
  if (n < 2) return; const R = RR(ctx), src = [HX0 + 2, HX0 + 34, (HX0 + HX1) >> 1, HX1 - 34, HX1 - 4];
  for (let s = 0; s < src.length; s++) { if ((s & 1) !== layer) continue; if (n < 3 && s !== 2 && s !== 0) continue;
    const P = 46 - n * 3, sp = 0.45 + n * 0.2;
    for (let k = 0; k < n + 2; k++) { const t = (f + k * 11 + s * 7) % P, x = src[s] + (hash(k, s) - 0.5) * 8 + Math.sin((f + k * 9 + s * 5) / 7) * t * 0.16, y = FL - 3 - t * sp, sz = 2 + (t >> 2) + (n >> 2); ctx.globalAlpha = Math.min(0.7, 0.24 + n * 0.08) * (1 - t / P); R(k % 4 === 3 && n >= 4 ? '#c8ffb0' : '#e4eef4', x, y, sz, sz); }
    if (n >= 5 && (s === 0 || s === 2 || (n >= 6 && s === 4))) { const hgt = (n >= 6 ? 30 : 16) + ((f >> 1) % 3) * 3; ctx.globalAlpha = 0.75; for (let j = 0; j < hgt; j++) { const w = 1 + (j >> 3), wob = Math.round(Math.sin((f + j) / 2.2) * (j / 12)); R(j < 4 ? '#ffffff' : '#d8e8f0', src[s] - (w >> 1) + wob, FL - 2 - j, w, 1); } }
  }
  ctx.globalAlpha = 1;
}
// ---------- her art: the old body (legs, torso, two pairs of arms), and a new head of her own ----------
// The head is an armoured hive-mother's: a broad, low, banded carapace with stubby spines at the back, a cluster of eight glowing eyes
// on its front, and two big hooked mandibles under it that open as she draws up the acid. Drawing only: none of this is read by play.
const V2 = (x, y) => ({ x, y }), V2a = (a, b) => V2(a.x + b.x, a.y + b.y), V2d = (l, a) => V2(Math.sin(a) * l, Math.cos(a) * l);
const QK = 1.6;                                                      // the boss draws her 1.6x the rig size
function queenBodyShapes(phase) {                                   // the rig queen with no tail and no head: just a neck stump for the new head to sit on
  const T = phase * Math.PI * 2, sh = [], b = Math.sin(T) * 0.6;
  const Hp = V2(8, -26), Sh = V2(-2, -46 + b);
  const leg = (dx, m, z, g) => { const r = V2a(Hp, V2(dx, 0)), K = V2a(r, V2(-6, 10)), A = V2a(K, V2(5, 9)), F = V2a(A, V2(-4, 7)); sh.push(cap(m, r, K, 3.4, z, { g }), cap(m, K, A, 2.4, z, { g }), cap(m, A, F, 1.8, z, { g }), cap(m, F, V2a(F, V2(-4, 0)), 1.4, z, { g })); };
  leg(4, 'xenoFar', 1, 'lf'); leg(0, 'queen', 4, 'ln');
  sh.push(poly('queen', [V2a(Sh, V2(-5, -1)), V2a(Sh, V2(5, -2)), V2a(Hp, V2(5, 0)), V2a(Hp, V2(-2, 3)), V2a(Sh, V2(-3, 10))], 3, { g: 'body' }));
  for (let k = 0; k < 3; k++) sh.push(cap('xenoFar', V2a(Sh, V2(2 + k * 3, -1)), V2a(Sh, V2(7 + k * 3, -8 + k)), 1.2, 2.6));
  sh.push(cap('queen', V2a(Sh, V2(-1, 0)), V2a(Sh, V2(-5, -5)), 3.4, 3.5, { g: 'neck' }));                  // a thick armoured neck
  for (let k = 0; k < 2; k++) sh.push(cap('xenoFar', V2a(Sh, V2(-1.5 - k * 1.6, -1 - k * 1.8)), V2a(Sh, V2(1.5 - k * 1.6, -3 - k * 1.8)), 0.9, 3.6, { g: 'nk' + k }));   // its collar rings
  const arm = (root, a, bb, l1, l2, r, m, z, g) => { const E = V2a(root, V2d(l1, a)), Hd = V2a(E, V2d(l2, bb)); sh.push(cap(m, root, E, r, z, { g }), cap(m, E, Hd, r * 0.8, z, { g })); for (const f of [-0.5, 0, 0.5]) sh.push(cap(m, Hd, V2a(Hd, V2d(3, bb + f)), 0.6, z, { g })); };
  arm(V2a(Sh, V2(1, 1)), -0.2 + b * 0.1, -1.9, 9, 9, 2, 'xenoFar', 2, 'af');
  arm(V2a(Sh, V2(-2, 0)), -0.5 - b * 0.1, -2.2, 10, 10, 2.2, 'queen', 7, 'an');
  arm(V2a(Sh, V2(-2, 6)), -0.9, -2.3, 4, 4, 1, 'queen', 7.5, 'sm');
  return { shapes: sh, post: null };
}
// the head, in rig units round its own centre (faces left). o: how far the mandibles are open, 0..1
const QEYES = [[-8.9, -2.6, 2], [-7.2, -4.6, 2], [-8.4, -0.2, 2], [-5.0, -5.8, 2], [-6.2, -2.2, 1], [-2.6, -6.2, 1], [-4.4, -3.8, 1], [-6.4, 0.6, 1]];   // x, y (rig units), size (screen px)
const QHS = 1.45;                                                    // the head is drawn this much bigger than the rig
function queenHeadShapes(o) {
  const sh = [];
  // the carapace: a broad low shield in three overlapping bands, the back one with three short spines
  sh.push(poly('queen', [V2(-9.6, 1.2), V2(-9.4, -3.8), V2(-6.4, -6.6), V2(-1, -7.4), V2(4.6, -6.6), V2(8.4, -3.6), V2(8.8, 0.6), V2(5.4, 3.0), V2(-2, 3.6), V2(-7.4, 3.2)], 5, { g: 'cara' }));
  sh.push(poly('queen', [V2(-0.8, -7.4), V2(4.4, -6.8), V2(7.8, -4.4), V2(8.2, -0.6), V2(3.6, -1.6), V2(0.2, -3.4)], 5.2, { g: 'band1' }));
  sh.push(poly('queen', [V2(4.4, -6.4), V2(7.8, -5.0), V2(10.2, -2.4), V2(10.2, 1.2), V2(7.8, 1.8), V2(6.6, -1.8)], 5.4, { g: 'band2' }));
  for (const [x, y, a] of [[6.6, -5.8, 2.0], [8.8, -3.8, 2.3], [10.0, -1.0, 2.6]]) sh.push(cap('xenoFar', V2(x, y), V2a(V2(x, y), V2d(2.4, a)), 0.7, 4.8));
  sh.push(poly('xenoFar', [V2(1.0, 1.4), V2(5.4, 1.6), V2(4.2, 5.4), V2(1.2, 5.8), V2(-0.8, 3.6)], 5.8, { g: 'cheek' }));                       // the cheek guard over the mandible hinge
  // the mandibles: two big hooked blades hinged under the face, upper and lower, closing like pliers
  const up = -0.06 - o * 0.8, dn = 0.3 + o * 0.75, hu = V2(-6.4, 2.2), hd = V2(-5.4, 3.6);
  const blade = (h, a, s, g) => { const k1 = V2a(h, V2(-Math.cos(a) * 4.6, Math.sin(a) * 4.6)), k2 = V2a(k1, V2(-Math.cos(a + s * 0.3) * 3.4, Math.sin(a + s * 0.3) * 3.4)), tip = V2a(k2, V2(-Math.cos(a + s * 1.15) * 2.2, Math.sin(a + s * 1.15) * 2.2));
    sh.push(cap('egg', h, k1, 0.95, 6.2, { g }), cap('egg', k1, k2, 0.7, 6.2, { g }), cap('egg', k2, tip, 0.4, 6.2, { g })); return [k1, k2, tip]; };
  const U = blade(hu, up, 1, 'mu'), D = blade(hd, dn, -1, 'md');
  sh.push(cap('xenoFar', V2(-5.0, 3.2), V2(-6.8 - o * 0.6, 6.0 + o * 1.4), 0.5, 6.0), cap('xenoFar', V2(-4.2, 3.6), V2(-5.4, 6.8 + o * 1.6), 0.5, 6.0));   // two little palps between them
  const post = (ctx, px) => {
    ctx.fillStyle = '#665a3c'; for (const [P0, P1] of [[U[0], U[1]], [D[0], D[1]]]) { const q = px(V2((P0.x + P1.x) / 2, (P0.y + P1.y) / 2)); ctx.fillRect(q.x, q.y, 1, 1); }
    ctx.fillStyle = '#fff4d8'; for (const T of [U[2], D[2]]) { const q = px(T); ctx.fillRect(q.x, q.y, 1, 1); }                                            // the hooks catch the light
    for (const [x, y, s] of QEYES) { const e = px(V2(x, y)); ctx.fillStyle = '#000'; ctx.fillRect(e.x - 1, e.y - 1, s + 2, s + 2); ctx.fillStyle = '#ff3a1a'; ctx.fillRect(e.x, e.y, s, s); ctx.fillStyle = s > 1 ? '#ffe0a0' : '#ff6a2a'; ctx.fillRect(e.x, e.y, 1, 1); }
    ctx.fillStyle = '#8a9cb0'; for (let k = 0; k < 4; k++) { const r = px(V2(-0.4 + k * 2.2, -6.8 + k * 0.6)); ctx.fillRect(r.x, r.y, 2, 1); }                        // a lit edge on the bands
  };
  return { shapes: sh, post };
}
const QHN = 6;                                                       // mandible steps
let QART = null;                                                     // built on the first draw (in the browser only)
function queenArt() {
  if (QART) return QART;
  const body = [0, 1, 2, 3].map((i) => { const g = queenBodyShapes(i / 4); return rim(scaleFr(renderShapes(g.shapes, 76, 76, 32, 72), QK), '#2f7f78'); });
  const head = []; for (let i = 0; i < QHN; i++) { const g = scaleShapes(queenHeadShapes(i / (QHN - 1)), QK * QHS); head.push(rim(renderShapes(g.shapes, 64, 46, 34, 20, { post: g.post }), '#2f7f78')); }
  return (QART = { body, head });
}
// how far her mandibles are open: a slow chew at rest, wide as the acid comes up, snapped shut as the tail goes
function jawOpen(q, st, f) {
  if (st.won) return 1;
  const pat = (q.P || PATTERN)[Math.min(q.n, PATTERN.length - 1)];
  switch (q.ph) {
    case 'awind': { const k = Math.min(1, q.t / pat.T); return Math.min(1, 0.2 + 0.8 * ease(k)) - ((f >> 1) % 2) * 0.12 * k; }
    case 'spew': return 1;
    case 'flood': return q.t < 12 ? 1 : Math.max(0.1, 1 - (q.t - 12) / 10);
    case 'wind': case 'wind2': case 'feint': return 0.55 + ((f >> 2) % 2) * 0.1;
    case 'slam': return 0.4;
    case 'out': case 'hold': case 'back': return 0;
    default: return 0.2 + 0.2 * (0.5 + 0.5 * Math.sin(f / 9));
  }
}
function drawQueenHead(ctx, st, f, x, y, frame) {
  const A = queenArt(), q = st.q, o = jawOpen(q, st, f), b = Math.round(Math.sin((frame / 4) * Math.PI * 2) * 0.6 * QK);
  const hx = x - 10 * QK, hy = y + (-53) * QK + b;
  const hd = A.head[Math.max(0, Math.min(QHN - 1, Math.round(o * (QHN - 1))))]; put(ctx, hd, Math.round(hx), Math.round(hy));
  // the eyes glow: a faint halo round the big ones, brighter as the acid comes up
  const hot = q.ph === 'awind' || q.ph === 'spew' ? 0.45 : 0.22, K = QK * QHS, X0 = Math.round(hx) - hd.ox + 1, Y0 = Math.round(hy) - hd.oy + 1;
  for (const [ex, ey, s] of QEYES) { if (s < 2) continue; const cx = X0 + Math.round(ex * K + 34 - 0.5), cy = Y0 + Math.round(ey * K + 20 - 0.5); ctx.globalAlpha = hot * (0.7 + 0.3 * Math.sin(f / 6 + ex)); ctx.fillStyle = '#ff6a2a'; ctx.fillRect(cx - 1, cy - 2, 4, 1); ctx.fillRect(cx - 1, cy + 3, 4, 1); ctx.fillRect(cx - 2, cy - 1, 1, 4); ctx.fillRect(cx + 3, cy - 1, 1, 4); } ctx.globalAlpha = 1;
}
function queenBoss(B) {
  const stage = buildChamber(B);
  return {
    name: 'THE QUEEN', tip: 'TAIL: JUMP    ACID: DOUBLE JUMP', tips: ['TAIL ATTACK: JUMP', 'ACID ATTACK: DOUBLE JUMP'], hero: 'stand', heroX: 72,
    init(st) { const k = 1 - 0.1 * Math.min(3, st.lap || 0);   /* every loop of the game she winds up for less time */
      st.q = { P: PATTERN.map((p) => ({ ...p, T: Math.round(p.T * k) })), n: 0, ph: 'idle', t: 0, wait: 60, hit: false, feinted: false, second: false, fall: 0, boom: 99, boomK: 0, flash: 0, tipX: 226 }; },
    update(st) {
      const q = st.q, h = st.h; q.t++; if (q.flash > 0) q.flash--;
      if (q.boom < 99) q.boom++;
      if (st.won) { q.fall++; if (q.fall === 12) st.events.push('roar'); if (q.fall > 12 && q.fall < 60) st.shake = 3; return; }
      const pat = q.P[q.n], go = (ph) => { q.ph = ph; q.t = 0; };
      if (q.ph === 'idle') { if (q.t >= q.wait) { st.events.push('warn'); go(pat.acid ? 'awind' : pat.feint && !q.feinted ? 'feint' : 'wind'); } }
      // the acid: she rears and her throat fills (awind), it pours to the floor in front of her (spew), then the surge runs to the wall (flood)
      else if (q.ph === 'awind') { if (q.t === 9 || q.t === pat.T - 14) st.events.push('warn'); if (q.t >= pat.T) { st.events.push('puke'); go('spew'); } }
      else if (q.ph === 'spew') { if (q.t >= 12) { st.events.push('rain'); go('flood'); } }
      else if (q.ph === 'flood') {
        const front = ACID_X - pat.v * q.t, back = front + pat.v * ACID_T;
        if (h.x + 4 > front && h.x - 4 < back && h.y > FL - 6 && front > 20 - pat.v * ACID_T && hurt(st, 'acid')) q.hit = true;
        if (Math.abs(front - 26) < pat.v / 2 + 0.01) { st.events.push('thump'); st.shake = 4; }
        if (back < 30) go('lift');
      }
      else if (q.ph === 'feint') { if (q.t >= 30) { q.feinted = true; q.wait = 26; go('idle'); } }
      else if (q.ph === 'wind') { if (q.t >= pat.T) { st.events.push('thump'); st.shake = 3; q.flash = pat.gap; go('slam'); } }
      else if (q.ph === 'wind2') { if (q.t >= 19) { st.events.push('thump'); st.shake = 3; q.flash = pat.gap; go('slam'); } }
      else if (q.ph === 'slam') { if (q.t >= pat.gap) { st.events.push('whoosh'); go('out'); } }
      else if (q.ph === 'out') { if (q.t >= 5) { go('hold'); if (!q.hit) { st.shake = 6 + Math.min(4, q.n); st.events.push('thump'); st.events.push('zap'); q.boom = 0; q.boomK = 0; } } }      // her tail goes into the junction box
      else if (q.ph === 'hold') { if (q.t >= 1) go('back'); }
      else if (q.ph === 'back') { if (q.t >= 4) { if (pat.dbl && !q.second) { q.second = true; go('wind2'); } else go('lift'); } }
      else if (q.ph === 'lift') {
        if (q.t === 1 && !q.hit) { q.n++; st.events.push('bosshit'); st.bonus += 50; if (pat.acid) { q.boom = 0; q.boomK = 1; st.shake = 5; st.events.push('zap'); } pop(st, q.n >= PATTERN.length ? 'HATCH OPEN!' : 'LED ' + q.n + (pat.acid ? ' MELTED' : ' BLOWN'), 150, 96); if (q.n >= PATTERN.length) { win(st, 'SHE IS GONE  +500', 140); return; } }
        if (q.t >= 14) { q.hit = false; q.feinted = false; q.second = false; q.wait = 44; go('idle'); }
      }
      // the lash itself: her tail shoots along the floor from her to the wall. Be in the air when it gets to you.
      q.tipX = q.ph === 'out' ? lerp(212, 12, q.t / 5) : q.ph === 'hold' ? 12 : 999;          // only the strike hurts, not the tail going home
      if (q.tipX < h.x + 5 && h.y > FL - 5 && hurt(st, 'tail')) q.hit = true;
    },
    stage(ctx, st, f) {
      ctx.drawImage(stage, 0, 0);
      const q = st.q, open = st.won ? Math.min(1, q.fall / 14) : 0, vib = vibOf(st, f), n = q.n;
      // the hatch: hazard border, seven clamps, and the doors. It rattles in its frame as the clamps let go.
      if (vib) { ctx.fillStyle = '#07090a'; ctx.fillRect(HX0, FL - 1, HX1 - HX0, 1); }
      for (let i = HX0; i < HX1; i++) { ctx.fillStyle = ((i - HX0) >> 2) % 2 ? '#f0c020' : '#15181a'; ctx.fillRect(i, FL + vib, 1, 2); }
      ctx.fillStyle = '#07090a'; ctx.fillRect((HX0 + HX1) / 2, FL, 1, 5);
      if (n >= 4 && !st.won) { ctx.globalAlpha = (n - 3) * 0.22 * ((f >> 1) % 3 ? 1 : 0.6); ctx.fillStyle = '#8aff4a'; ctx.fillRect((HX0 + HX1) / 2 - 1, FL + 1, 3, 5); ctx.fillRect(HX0, FL + 2 + vib, 2, 3); ctx.globalAlpha = 1; }      // light from below starts to show at the seams
      if (open > 0) { const half = (HX1 - HX0) / 2, w = Math.round(half * open); ctx.fillStyle = '#020403'; ctx.fillRect(HX0 + half - w, FL, w * 2, BH - FL); for (let j = 0; j < BH - FL; j++) { ctx.globalAlpha = 0.5 * (j / (BH - FL)) * open; ctx.fillStyle = '#46c02a'; ctx.fillRect(HX0 + half - w, FL + j, w * 2, 1); } ctx.globalAlpha = 1; ctx.fillStyle = '#6a7882'; ctx.fillRect(HX0 + half - w - 2, FL, 2, 12 * open); ctx.fillRect(HX0 + half + w, FL, 2, 12 * open); }
      for (let i = 0; i < PATTERN.length; i++) { const cx = HX0 + 8 + i * 21, blown = i < q.n; ctx.fillStyle = '#000'; ctx.fillRect(cx - 1, FL + 6, 9, 6); ctx.fillStyle = blown ? '#1c2327' : '#56626a'; ctx.fillRect(cx, FL + 7 + (blown ? 1 : vib), 7, 4); ctx.fillStyle = blown ? ((f + i * 9) % 30 < 3 ? '#ffb03a' : '#2a1a14') : (f >> 4) % 2 ? '#ff3a2a' : '#a82a1e'; ctx.fillRect(cx + 2, FL + 8 + (blown ? 1 : vib), 3, 2); }
      drawPanel(ctx, q, f); if (!st.won) hatchSteam(ctx, n, f, 1);
      // the lane her tail is about to come down: lights up between the slam and the lash
      if (q.ph === 'slam' && (q.t >> 1) % 2) { ctx.globalAlpha = 0.5; ctx.fillStyle = '#ff5a3a'; ctx.fillRect(28, FL - 2, 180, 2); ctx.globalAlpha = 1; }
      if ((q.ph === 'awind' && q.t > 10) || q.ph === 'spew') {                 // acid coming: the lane goes green and two arrows say "twice"
        if ((q.t >> 2) % 2) { ctx.globalAlpha = 0.55; ctx.fillStyle = '#8aff4a'; ctx.fillRect(28, FL - 3, 180, 3); ctx.globalAlpha = 1; }
        const ax = Math.round(st.h.x), ay = FL - 52 - ((q.t >> 2) % 3);
        for (let k = 0; k < 2; k++) for (let i = 0; i < 5; i++) { ctx.fillStyle = '#000'; ctx.fillRect(ax - i - 1, ay - k * 7 + i - 1, 3, 4); ctx.fillRect(ax + i - 1, ay - k * 7 + i - 1, 3, 4); }
        for (let k = 0; k < 2; k++) for (let i = 0; i < 5; i++) { ctx.fillStyle = k ? '#e0ffb0' : '#8aff4a'; ctx.fillRect(ax - i, ay - k * 7 + i, 1, 2); ctx.fillRect(ax + i, ay - k * 7 + i, 1, 2); }
      }
    },
    draw(ctx, st, f) {
      const q = st.q, fall = st.won ? Math.max(0, q.fall - 12) : 0, dy = Math.round(fall * fall * 0.09), rear = q.ph === 'wind' || q.ph === 'wind2' || q.ph === 'feint' || q.ph === 'awind' ? Math.min(1, q.t / 10) : 0, lunge = q.ph === 'out' || q.ph === 'hold' || q.ph === 'spew' || (q.ph === 'flood' && q.t < 12) ? 1 : 0;
      if (dy > 150) return;
      const ox = Math.round(rear * 3 - lunge * 5), oy = Math.round(-rear * 3) + dy + vibOf(st, f);
      const P = tailPose(q, f).map((p, i) => (i < 2 ? [p[0] + ox, p[1] + oy] : [p[0], p[1] + dy * (st.won ? 1 : 0)]));
      if (st.won) for (let i = 2; i < P.length; i++) { P[i][0] += Math.sin(f / 3 + i) * 6; P[i][1] -= Math.min(30, q.fall) * (i / 5) * 0.6; }
      drawTail(ctx, P, f);
      const qf = st.won ? (f >> 1) % 4 : (f >> 3) % 4; put(ctx, queenArt().body[qf], QX + ox, FL + oy); drawQueenHead(ctx, st, f, QX + ox, FL + oy, qf);
      if (rear > 0.5 && !st.won && q.ph !== 'awind') { const hx = QX + ox - 44, hy = FL + oy - 79; ctx.fillStyle = '#e8f4ff'; for (let k = 0; k < 3; k++) { const a = ((f >> 1) + k * 3) % 9; ctx.fillRect(hx - 4 - a * 2, hy + (k - 1) * (3 + a), 3, 1); } }
      drawAcid(ctx, st, f, ox, oy);
      if (!st.won) hatchSteam(ctx, q.n, f, 0);
      drawBoom(ctx, q, f);
      pips(ctx, 'BLOW THE HATCH', q.n, PATTERN.length, '#8aff4a');
    },
  };
}

// a thin bright edge so black creatures read against a dark wall
const rim = (f, col) => { const c = cv(f.c.width + 2, f.c.height + 2), x = c.getContext('2d'), t = tint(f, col, 1).c; for (const [dx, dy] of [[0, 1], [2, 1], [1, 0], [1, 2]]) x.drawImage(t, dx, dy); x.drawImage(f.c, 1, 1); return { c, ox: f.ox + 1, oy: f.oy + 1 }; };

export function skin(B, K, D) {
  const P = { base: '#4a545c', hi: '#b8c6d0', top: '#6a747c', deep: '#1c2226', dark: '#2e363c', wall: '#11221c', lamp: '#ff3a2a', glow: '#ff6a3a' };
  const R = (f) => rim(f, '#3fa898');
  const RD = (f) => rim(rim(tint(f, '#4f7f8c', 0.3), '#7fffe6'), '#000000');           // the drones: lifted off black and lit hard round the edge, or they vanish into the wall
  const drone = B.drone.map(RD), grab = B.grabber.map(R), big = B.drone.slice(0, 4).map((f) => RD(scaleFr(f, 1.3)));
  const spit = B.grabber.map((f) => rim(tint(f, '#6ad040', 0.42), '#c8ff7a'));                 // the spitter: an acid-green grabber, so you can tell which one is going to puke
  const lurk = B.drone.map((f) => rim(tint(f, '#7a8ea0', 0.3), '#d8ecf4'));                    // the lurker that sits and springs: a paler, bone-rimmed drone
  const chr = { ...hiveChr(), grunt: grab, puker: spit, brute: big, bruteDizzy: tint(big[0], '#ffffff', 0.4), brutePuke: [big[3]],
    gruntAlt: drone, ghoul: { sit: lurk[0], leap: lurk[2], land: lurk[4] }, slime: tintAll(B.chr.slime, '#46c02a', 0.45), slimeSmall: tintAll(B.chr.slimeSmall, '#46c02a', 0.45), biker: drone,
    batF: [fr(R(B.grabberLeap).c, B.grabberLeap.ox + 1, B.grabberLeap.oy - 5)], batFlashF: tint(B.grabberLeap, '#ffffff', 0.8), unicornFly: [flip(drone[1])], flyFlash: tint(B.drone[1], '#ffffff', 0.8),
    unicorn: [B.egg], unicornPuke: B.eggOpen, unicornFlash: tint(B.egg, '#ffffff', 0.8) };
  // the hive's own dangers (see danger.js): sentry guns, hatchlings under the gallery, coolant jets, larvae squirming away, acid for blood.
  // and now and then a power loader is parked on the deck
  const danger = { spawn: { dropper: 14, gunner: 11, vent: 10, backer: 7 }, dropper: { to: 'leaper', h: HANG_H }, ride: { fly: false, chance: 65 }, box: { bomb: 10, shield: 8 }, acidBlood: true };
  const labels = { ride: 'POWER LOADER!', bomb: 'NUKE IT!', shield: 'FLAK ARMOUR!' };
  return { name: 'THE HIVE', style: 'hive', P, drip: LOOK.hive, puddle: LOOK.hive, drawPipe, drawPlat, wallFx, extras: ['elevator', 'slider', 'crumble', 'highsteps', 'biker'],
    danger, labels, fx: hiveFx, frontFx(ctx, f, fdist, cam, s) { tracker(ctx, f, s); }, backFx(ctx, f, fdist) { scroll = Math.floor(fdist); }, noBlimp: true,
    sky: sky(['#010303', '#030909', '#06120f', '#0a1c16']), far: null, farY: 0, mid: buildHive(), midY: 0, near: blank(), arcade: buildWall(), arcadeTop: 0, deck: buildDeck(),
    pit: pitCycle(['#041006', '#08200c', '#0e3812', '#165018', '#22801e', '#6ad040', '#165018', '#0e3812'], 13), pitUp: 4, fg: blank(), particles: 'steam',
    blob: ['#2a8a1a', '#8aff4a', '#e0ffb0'], bile: ['#2a8a1a', '#8aff4a', '#e0ffb0'], titleFill: GRAD.green, tintCol: '#46c02a', chr, boss: queenBoss(B) };
}
