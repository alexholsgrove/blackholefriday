// Black Hole Friday, level 6: INVERSION. A freeport container terminal at grey dawn where time runs both ways.
// RED = forward, BLUE = inverted. Everything else is steel and concrete so the hero and the baddies pop.
import { cv, pix, dith, hash, put, flip, tint, TAU, drawText, GRAD, noise, scaleFr, tintAll, sky, blank, pitCycle, LOOK, arcadeCanvas, deckCanvas, px, panels, glow, vgrad, rivets, box } from '../kit.js';
import { BW, BH, FL, RUN, hitR, hurt, win, pips, pop } from '../bosskit.js';
import { drum, forklift, camDrone, gulls } from '../critters.js';
import { pastInit, pastUpdate, PS, hazX, filmDanger } from './tenet-duo.js';
import { ZONE_PX } from '../sim.js';
import { film } from './tenet-film.js';
const GULL = gulls(), DRONE = camDrone();

const PX0 = 72 * 256;                               // the hero's place on screen, in sim units
const RED = '#e03a2a', BLUE = '#3a8ae0', RED_HI = '#ff8a6a', BLUE_HI = '#8ac8ff', RED_LO = '#5a1a16', BLUE_LO = '#14305a';
const HAZ = '#b0902c', INK = '#16181d';
const hx = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// ---- local helpers (kept here, not in kit.js) ----
function ln(x, x0, y0, x1, y1, col) { x.fillStyle = col; const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let k = 0; k <= n; k++) x.fillRect(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), 1, 1); }
function disc(x, cx, cy, r, col) { x.fillStyle = col; for (let j = -r; j <= r; j++) { const w = Math.floor(Math.sqrt(r * r - j * j + r * 0.8)); x.fillRect(Math.round(cx - w), Math.round(cy + j), w * 2 + 1, 1); } }
function stripes(x, x0, y0, w, h, a = HAZ, b = INK) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { x.fillStyle = ((i + j) >> 2) % 2 ? a : b; x.fillRect(x0 + i, y0 + j, 1, 1); } }
// swap exact colours in a sprite frame
function recol(f, map) {
  const c = cv(f.c.width, f.c.height), x = c.getContext('2d'); x.drawImage(f.c, 0, 0);
  const im = x.getImageData(0, 0, c.width, c.height), d = im.data;
  for (let o = 0; o < d.length; o += 4) { if (!d[o + 3]) continue; const m = map[(d[o] << 16) | (d[o + 1] << 8) | d[o + 2]]; if (m) { d[o] = m[0]; d[o + 1] = m[1]; d[o + 2] = m[2]; } }
  x.putImageData(im, 0, 0); return { c, ox: f.ox, oy: f.oy };
}
const cmap = (pairs) => { const m = {}; for (const [a, b] of pairs) { const [r, g, bl] = hx(a); m[(r << 16) | (g << 8) | bl] = hx(b); } return m; };
// the soldier's gas-mask eye becomes a lit visor in his colour, plus an armband
function visor(f, col, hi, band) {
  const c = cv(f.c.width, f.c.height), x = c.getContext('2d'); x.drawImage(f.c, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data; let ex = -1, ey = -1;
  for (let j = 0; j < c.height && ex < 0; j++) for (let i = 0; i < c.width; i++) { const o = (j * c.width + i) * 4; if (d[o] === 255 && d[o + 1] === 74 && d[o + 2] === 58) { ex = i; ey = j; break; } }
  if (ex < 0) return f;
  const solid = (i, j) => i >= 0 && j >= 0 && i < c.width && j < c.height && d[(j * c.width + i) * 4 + 3] > 0;
  x.fillStyle = col; for (let i = -1; i < 4; i++) for (let j = -1; j < 1; j++) if (solid(ex + i, ey + j)) x.fillRect(ex + i, ey + j, 1, 1);
  x.fillStyle = hi; x.fillRect(ex, ey - 1, 2, 1);
  x.fillStyle = band; for (let i = 5; i < 12; i++) for (let j = 10; j < 12; j++) if (solid(ex + i, ey + j) && solid(ex + i, ey + j + 3)) x.fillRect(ex + i, ey + j, 1, 1);
  return { c, ox: f.ox, oy: f.oy };
}

// ---------- the backdrop: a harbour at grey dawn ----------
function buildSky() {
  return sky(['#1a2330', '#2a3648', '#445266', '#6a788a', '#9aa4ae', '#7c8a9a', '#4a586c', '#2e3a4c', '#1c2430', '#1c2430', '#1c2430', '#1c2430'], (x) => {
    const n = noise(31);
    for (let k = 0; k < 30; k++) {                    // long flat cloud bands
      const cy = 22 + Math.floor(n() * 62), cx = Math.floor(n() * 360) - 40, w = 36 + Math.floor(n() * 90);
      x.globalAlpha = 0.5; x.fillStyle = cy > 76 ? '#c4cace' : cy > 60 ? '#8492a2' : cy > 42 ? '#34415a' : '#222c3c';
      x.fillRect(cx, cy, w, 1); x.fillRect(cx + 8, cy + 1, w - 20, 1); x.fillRect(cx + 14, cy - 1, w - 34, 1);
    }
    x.globalAlpha = 1; glow(x, 232, 82, 24, '#d0d4d4', 0.45); disc(x, 232, 82, 5, '#eceadc'); x.fillStyle = '#c4cace'; x.fillRect(214, 81, 40, 1); x.fillRect(222, 84, 22, 1);
  });
}
const SHIPCOL = ['#56647a', '#5c5a70', '#4e6470', '#665e68'];
function buildFar() {                                   // horizon at row 75: open water, ships at anchor, the far shore
  const c = pix(640, 184, (i, j) => {
    if (j < 75) return null;
    const t = Math.pow((j - 75) / 109, 0.55);
    if (hash(Math.floor(i / (5 + (j % 7))), j) > 0.88) return dith(['#93a0ae', '#5c6a7e', '#3a4860', '#2a3648'], t, i, j);
    return dith(['#6a7889', '#4a586c', '#324058', '#222e42', '#18222f'], t, i, j);
  });
  const x = c.getContext('2d'), n = noise(5);
  for (let i = 0; i < 640;) {                          // the far shore: sheds, tanks, chimneys
    const w = 6 + Math.floor(n() * 22), h = 2 + Math.floor(n() * 6); x.fillStyle = '#4c5a6e'; x.fillRect(i, 75 - h, w, h);
    if (n() < 0.25) { x.fillRect(i + 2, 75 - h - 7, 1, 7); x.fillStyle = n() < 0.5 ? '#a04a40' : '#4a7ab0'; x.fillRect(i + 2, 75 - h - 8, 1, 1); }
    i += w + Math.floor(n() * 3);
  }
  for (const cx of [196, 214, 486]) { x.fillStyle = '#44526a'; x.fillRect(cx, 58, 1, 17); x.fillRect(cx + 6, 58, 1, 17); x.fillRect(cx - 8, 58, 26, 1); ln(x, cx + 3, 52, cx - 8, 58, '#44526a'); ln(x, cx + 3, 52, cx + 17, 58, '#44526a'); }
  const ship = (x0, len) => {
    x.fillStyle = '#39465a'; x.fillRect(x0, 71, len, 4); x.fillRect(x0 - 2, 71, 2, 2); x.fillRect(x0 - 4, 71, 2, 1); x.fillStyle = '#93a0ae'; x.fillRect(x0 - 2, 75, len + 4, 1);
    x.fillStyle = '#48566c'; x.fillRect(x0 + len - 11, 63, 7, 8); x.fillRect(x0 + len - 9, 59, 2, 4); x.fillStyle = '#93a0ae'; x.fillRect(x0 + len - 10, 65, 5, 1);
    for (let i = x0 + 3; i < x0 + len - 14; i += 5) { const h = 1 + Math.floor(n() * 3); for (let k = 0; k < h; k++) { x.fillStyle = SHIPCOL[Math.floor(n() * 4)]; x.fillRect(i, 69 - k * 2, 4, 2); } }
  };
  ship(40, 62); ship(292, 84); ship(540, 54);
  return c;
}
const STACK = ['#27303d', '#322e38', '#283638', '#372f2e', '#2c3444'];
const MIDW = 640, QUAY = 96, FUNNEL = [365, 52], WRECK = 548;      // mid layer landmarks (used by backFx)
function buildMid() {                                   // the working quay: ship-to-shore cranes, stacks, a freighter alongside
  const c = cv(MIDW, 130), x = c.getContext('2d'), n = noise(9);
  const D = '#1b212b', D2 = '#262e3a', L = '#343e4e';
  // water under the quay
  for (let j = 103; j < 130; j++) for (let i = 0; i < MIDW; i++) { x.fillStyle = hash(Math.floor(i / 9), j) > 0.9 ? '#2a3648' : dith(['#141c28', '#0e1520'], (j - 103) / 27, i, j); x.fillRect(i, j, 1, 1); }
  x.fillStyle = '#10151d'; x.fillRect(0, QUAY, MIDW, 7); x.fillStyle = L; x.fillRect(0, QUAY, MIDW, 1); for (let i = 6; i < MIDW; i += 22) { x.fillStyle = '#05070a'; x.fillRect(i, QUAY + 2, 5, 5); x.fillStyle = D2; x.fillRect(i + 1, QUAY + 3, 3, 3); }
  // a transit shed
  x.fillStyle = D; x.fillRect(0, 74, 58, 22); for (let i = 0; i < 58; i += 14) { for (let k = 0; k < 7; k++) x.fillRect(i + k, 74 - k, 14 - k, 1); } x.fillStyle = L; x.fillRect(0, 74, 58, 1); x.fillStyle = '#0f131a'; for (let i = 4; i < 54; i += 12) x.fillRect(i, 82, 8, 14);
  x.fillStyle = '#8a8468'; x.fillRect(18, 79, 2, 1); x.fillRect(42, 79, 2, 1);
  // container stacks
  const stacks = (x0, x1) => { for (let bx = x0; bx < x1; bx += 15) { const h = 1 + Math.floor(n() * 5); for (let k = 0; k < h; k++) { const y = QUAY - (k + 1) * 6; x.fillStyle = STACK[Math.floor(n() * 5)]; x.fillRect(bx, y, 14, 6); x.fillStyle = L; x.fillRect(bx, y, 14, 1); x.fillStyle = '#12161d'; x.fillRect(bx, y + 5, 14, 1); for (let i = 2; i < 13; i += 3) x.fillRect(bx + i, y + 2, 1, 3); } } };
  stacks(150, 240); stacks(452, 530);
  // ship-to-shore cranes
  const crane = (x0, lamp) => {
    x.fillStyle = D; x.fillRect(x0, 40, 3, 56); x.fillRect(x0 + 24, 40, 3, 56); x.fillRect(x0, 78, 27, 2); x.fillRect(x0 - 2, 92, 31, 4);
    ln(x, x0 + 2, 44, x0 + 24, 76, D2); ln(x, x0 + 24, 44, x0 + 2, 76, D2);
    x.fillStyle = D; x.fillRect(x0 - 26, 36, 110, 5); x.fillStyle = L; x.fillRect(x0 - 26, 36, 110, 1); x.fillStyle = D2; for (let i = x0 - 24; i < x0 + 82; i += 6) x.fillRect(i, 38, 3, 2);
    ln(x, x0 + 13, 10, x0 - 26, 36, D); ln(x, x0 + 13, 10, x0 + 83, 36, D); ln(x, x0 + 13, 10, x0 + 40, 36, D); x.fillStyle = D; x.fillRect(x0 + 12, 10, 3, 27); x.fillRect(x0 - 12, 30, 22, 7);
    x.fillStyle = D; x.fillRect(x0 + 52, 41, 10, 4); x.fillRect(x0 + 54, 45, 1, 22); x.fillRect(x0 + 59, 45, 1, 22); x.fillRect(x0 + 50, 67, 14, 2); x.fillStyle = STACK[2]; x.fillRect(x0 + 50, 69, 14, 6); x.fillStyle = L; x.fillRect(x0 + 50, 69, 14, 1);
    x.fillStyle = lamp; x.fillRect(x0 + 13, 8, 1, 2); x.fillRect(x0 + 82, 35, 1, 1); x.fillStyle = '#8a8468'; x.fillRect(x0 - 8, 32, 2, 2);
  };
  crane(84, '#c8463a'); crane(400, '#4a8ad8');
  // the freighter alongside
  x.fillStyle = '#161b24'; x.fillRect(250, 84, 150, 14); for (let k = 0; k < 6; k++) x.fillRect(244 + k, 84, 6 - k, 3 + k * 2); x.fillStyle = '#3a2428'; x.fillRect(250, 95, 150, 3); x.fillStyle = L; x.fillRect(244, 84, 156, 1);
  for (let bx = 256; bx < 356; bx += 13) { const h = 1 + Math.floor(n() * 3); for (let k = 0; k < h; k++) { x.fillStyle = STACK[Math.floor(n() * 5)]; x.fillRect(bx, 79 - k * 5, 12, 5); x.fillStyle = L; x.fillRect(bx, 79 - k * 5, 12, 1); } }
  x.fillStyle = D2; x.fillRect(372, 62, 24, 22); x.fillStyle = L; x.fillRect(372, 62, 24, 1); x.fillRect(370, 70, 28, 1); x.fillStyle = '#8a8468'; for (let i = 374; i < 394; i += 4) { x.fillRect(i, 65, 2, 2); if (i % 8) x.fillRect(i, 74, 2, 2); }
  x.fillStyle = D; x.fillRect(FUNNEL[0] - 3, FUNNEL[1], 7, 32); x.fillStyle = '#6a2a26'; x.fillRect(FUNNEL[0] - 3, FUNNEL[1] + 4, 7, 3); x.fillStyle = L; x.fillRect(FUNNEL[0] - 3, FUNNEL[1], 7, 1); x.fillStyle = D; x.fillRect(384, 48, 1, 14); x.fillRect(380, 52, 9, 1);
  // light masts, with their reflections
  for (const [mx, col] of [[130, '#c8463a'], [262, '#4a8ad8'], [440, '#c8463a'], [612, '#4a8ad8']]) { x.fillStyle = D; x.fillRect(mx, 52, 1, 44); x.fillRect(mx - 3, 52, 7, 2); x.fillStyle = col; x.fillRect(mx - 2, 54, 2, 1); x.fillRect(mx + 1, 54, 2, 1); x.globalAlpha = 0.5; for (let j = 105; j < 128; j += 2) x.fillRect(mx - 1 + (j % 3), j, 2, 1); x.globalAlpha = 1; }
  // where the building was (the building itself un-explodes in backFx): rubble
  for (let i = WRECK - 8; i < WRECK + 80; i += 3) { const h = 1 + Math.floor(n() * 4); x.fillStyle = n() < 0.5 ? '#2c3440' : '#222a36'; x.fillRect(i, QUAY - h, 3 + Math.floor(n() * 3), h); }
  return c;
}
// the wrecked building: built once, then drawn in pieces that fly apart and back
function buildWreck() {
  const W = 72, H = 86, c = cv(W, H), x = c.getContext('2d'), n = noise(41);
  x.fillStyle = '#74787e'; x.fillRect(0, 0, W, H); x.fillStyle = '#54585f'; x.fillRect(W - 12, 0, 12, H); x.fillStyle = '#a0a4a8'; x.fillRect(0, 0, W, 2); x.fillStyle = '#8c9096'; x.fillRect(0, 0, 1, H);
  for (let j = 0; j < 6; j++) { x.fillStyle = '#5a5e66'; x.fillRect(0, 14 + j * 13, W, 1); for (let i = 0; i < 5; i++) { const lit = n() < 0.14; x.fillStyle = lit ? '#d8c890' : n() < 0.3 ? '#2a323e' : '#1a202a'; x.fillRect(5 + i * 12, 4 + j * 13, 7, 8); x.fillStyle = '#9a9ea4'; x.fillRect(5 + i * 12, 12 + j * 13, 7, 1); } }
  for (let k = 0; k < 9; k++) { let cx = Math.floor(n() * W), cy = Math.floor(n() * H); x.fillStyle = '#44484f'; for (let s = 0; s < 14; s++) { x.fillRect(cx, cy, 1, 1); cy++; if (n() < 0.5) cx += n() < 0.5 ? -1 : 1; } }
  const chunks = [], split = 48;
  for (let r = 0; r < 4; r++) for (let q = 0; q < 6; q++) {
    const cx = q * 12, cy = r * 12, dx = cx + 6 - 36, dy = cy + 6 - 60, l = Math.hypot(dx, dy), d = 30 + n() * 54;
    chunks.push({ x: cx, y: cy, w: 12, h: 12, vx: (dx / l) * d + (n() - 0.5) * 26, vy: (dy / l) * d - 6 - n() * 18 });
  }
  const bits = []; for (let k = 0; k < 22; k++) { const a = -Math.PI * n(), d = 40 + n() * 70; bits.push({ x: 8 + n() * 56, y: 6 + n() * 40, vx: Math.cos(a) * d, vy: Math.sin(a) * d * 0.9 - 8, s: 1 + Math.floor(n() * 2) }); }
  return { c, W, H, chunks, bits, split };
}

// ---------- the wall you run along (384 wide, world y 36..204) ----------
const CT = {            // container paint: [rib light, body, rib dark, top rail, bottom rail, stencil]
  rust: ['#74463c', '#633930', '#4c2a24', '#946456', '#2c1816', '#c8b4a0'], blue: ['#3e5872', '#31485e', '#25384a', '#5e7c94', '#141f2a', '#b4c4d0'],
  rustD: ['#553730', '#472c27', '#38221e', '#70504a', '#1e1210', '#8a7a70'], slateD: ['#34465a', '#2a3a4c', '#20303e', '#4c6276', '#111a24', '#7c8c9a'], oliveD: ['#444c40', '#383f35', '#2b3129', '#5e6858', '#161a14', '#8a9080'],
};
function crate(x, x0, y0, w, h, C, label, n, sub) {
  x.fillStyle = '#000'; x.fillRect(x0 - 1, y0 - 1, w + 2, h + 2); x.fillStyle = C[1]; x.fillRect(x0, y0, w, h);
  for (let i = 2; i < w - 14; i += 3) { x.fillStyle = C[0]; x.fillRect(x0 + i, y0 + 2, 1, h - 4); x.fillStyle = C[2]; x.fillRect(x0 + i + 1, y0 + 2, 1, h - 4); }
  x.fillStyle = C[2]; x.fillRect(x0 + w - 14, y0 + 2, 1, h - 4); x.fillStyle = C[3]; x.fillRect(x0 + w - 10, y0 + 3, 1, h - 6); x.fillRect(x0 + w - 5, y0 + 3, 1, h - 6);   // the door end: lock rods
  x.fillStyle = C[4]; x.fillRect(x0 + w - 11, y0 + (h >> 1), 3, 1); x.fillRect(x0 + w - 6, y0 + (h >> 1), 3, 1);
  x.fillStyle = C[3]; x.fillRect(x0, y0, w, 2); x.fillStyle = C[4]; x.fillRect(x0, y0 + h - 2, w, 2);
  for (const [a, b] of [[0, 0], [w - 3, 0], [0, h - 3], [w - 3, h - 3]]) { x.fillStyle = C[4]; x.fillRect(x0 + a, y0 + b, 3, 3); x.fillStyle = C[3]; x.fillRect(x0 + a + 1, y0 + b + 1, 1, 1); }
  x.globalAlpha = 0.55; x.fillStyle = C[4]; for (let k = 0; k < 6; k++) x.fillRect(x0 + 3 + Math.floor(n() * (w - 20)), y0 + 2, 1, 3 + Math.floor(n() * (h * 0.6))); x.globalAlpha = 1;
  if (label) drawText(x, label, x0 + 5, y0 + 5, { fill: C[5], outline: null });
  if (sub) { x.globalAlpha = 0.6; drawText(x, sub, x0 + 5, y0 + 16, { fill: C[5], outline: null }); x.globalAlpha = 1; }
}
const PILX = [2, 98, 194, 290], HOLES = [[130, 147], [167, 139], [175, 161], [124, 163]];
function buildWall() {
  const A = arcadeCanvas(384, 36), x = A.x, Y = A.Y, n = noise(77);
  const R = (c, i, wy, w, h) => { x.fillStyle = c; x.fillRect(i, Y(wy), w, h); };
  // ---- above the gallery (36..110): open to the harbour, with things standing on the deck ----
  crate(x, 4, Y(84), 62, 26, CT.rustD, 'ARKO', n); crate(x, 68, Y(84), 32, 26, CT.oliveD, null, n); crate(x, 18, Y(58), 62, 26, CT.slateD, 'NORDVIK', n);
  // the gantry crane: two legs and a truss across (the hoist is live, see wallFx)
  for (const lx of [140, 292]) {
    R('#000', lx - 1, 46, 8, 64); R('#3e424c', lx, 46, 6, 64); R('#5c606a', lx, 46, 1, 64); R('#262a32', lx + 5, 46, 1, 64);
    for (let y = 56; y < 104; y += 8) { ln(x, lx + 1, Y(y), lx + 4, Y(y + 4), '#262a32'); ln(x, lx + 4, Y(y + 4), lx + 1, Y(y + 8), '#262a32'); }
    R('#000', lx - 4, 105, 14, 5); R('#565a64', lx - 3, 106, 12, 4); R('#7a7e88', lx - 3, 106, 12, 1); stripes(x, lx - 3, Y(107), 12, 3);
  }
  R('#000', 122, 41, 196, 4); R('#7a7e88', 123, 42, 194, 1); R('#4a4e58', 123, 43, 194, 1);
  R('#000', 122, 51, 196, 4); R('#5c606a', 123, 52, 194, 1); R('#34383f', 123, 53, 194, 1);
  for (let i = 124; i < 314; i += 12) { ln(x, i, Y(45), i + 6, Y(50), '#2a2e36'); ln(x, i + 6, Y(50), i + 12, Y(45), '#2a2e36'); R('#2a2e36', i, 45, 1, 6); }
  ln(x, 147, Y(66), 158, Y(55), '#34383f'); ln(x, 291, Y(66), 280, Y(55), '#34383f'); ln(x, 139, Y(66), 128, Y(55), '#34383f'); ln(x, 299, Y(66), 310, Y(55), '#34383f');
  R('#000', 203, 54, 32, 7); R('#565a64', 204, 55, 30, 5); R('#7a7e88', 204, 55, 30, 1); R('#262a32', 208, 57, 4, 3); R('#262a32', 226, 57, 4, 3); stripes(x, 214, Y(57), 10, 2);   // the trolley
  R('#000', 217, 36, 7, 6); R('#3e424c', 218, 37, 5, 5);                                                                                  // beacon housing
  // light masts: one red, one blue
  for (const [mx, col] of [[114, RED], [344, BLUE]]) {
    R('#000', mx - 1, 50, 4, 60); R('#4a4e58', mx, 51, 2, 59); R('#6e727c', mx, 51, 1, 59); R('#000', mx - 1, 49, 13, 5); R('#565a64', mx, 50, 11, 3); R('#7a7e88', mx, 50, 11, 1);
    glow(x, mx + 8, Y(56), 15, col, 0.42); R(col, mx + 6, 53, 5, 2); R('#ffffff', mx + 7, 53, 2, 1);
  }
  // a cable drum, two oil drums and a stack of pallets on the gallery
  R('#000', 248, 94, 20, 16); R('#4e4234', 249, 95, 18, 15); R('#6a5a46', 249, 95, 2, 15); R('#6a5a46', 265, 95, 2, 15); R('#2a2d34', 252, 98, 12, 9); for (let j = 99; j < 106; j += 2) R('#3e424c', 252, j, 12, 1); R('#16181d', 257, 101, 2, 3);
  for (const [dx, c0, c1, c2] of [[356, '#6e2c26', '#96483c', '#3c1614'], [367, '#284672', '#4a6c9c', '#12223c']]) { R('#000', dx - 1, 95, 10, 15); R(c0, dx, 96, 8, 14); R(c1, dx, 96, 8, 1); R(c1, dx + 1, 97, 1, 12); R(c2, dx, 100, 8, 1); R(c2, dx, 105, 8, 1); }
  for (let k = 0; k < 4; k++) { R('#000', 170, 96 + k * 3 + 1, 22, 3); R('#5a4a36', 171, 97 + k * 3, 20, 2); R('#7a6648', 171, 97 + k * 3, 20, 1); }
  // the railing
  R('#6e727c', 0, 99, 384, 1); R('#2a2d34', 0, 100, 384, 1); R('#3e424c', 0, 104, 384, 1);
  for (let i = 10; i < 384; i += 24) { R('#565a64', i, 99, 1, 11); R('#1c1e24', i + 1, 100, 1, 10); }
  // ---- the gallery floor: a steel beam ----
  R('#bcc2cc', 0, 110, 384, 1); R('#70747e', 0, 111, 384, 1); R('#4a4e58', 0, 112, 384, 4); R('#2a2d34', 0, 116, 384, 1); R('#0c0d10', 0, 117, 384, 1);
  rivets(x, 3, Y(113), 380, 8, '#70747e'); rivets(x, 4, Y(114), 380, 8, '#22252b');
  for (const sx of [44, 236]) stripes(x, sx, Y(112), 26, 4);
  // ---- the vault corridor (118..200): board-marked concrete ----
  panels(x, 0, Y(118), 384, 82, { base: '#3a3d45', top: '#464a53', deep: '#25282f', dark: '#33363d' }, 32, 21, n, 3);
  for (let gx = 8; gx < 384; gx += 16) for (let gy = 128; gy < 196; gy += 21) R('#1e2026', gx, gy, 1, 1);
  x.globalAlpha = 0.3; for (let k = 0; k < 22; k++) R('#121418', Math.floor(n() * 384), 124, 1 + (n() > 0.7 ? 1 : 0), 8 + Math.floor(n() * 46)); x.globalAlpha = 1;
  for (let i = 0; i < 384; i++) for (let j = 186; j < 193; j++) if (hash(i, j) > 0.72 - (j - 186) * 0.03) R('#484c55', i, j, 1, 1);                    // salt bloom near the floor
  R('#191b20', 0, 118, 384, 7); R('#7a2e28', 0, 120, 384, 1); R('#3c1614', 0, 121, 384, 1); R('#2a4a78', 0, 123, 384, 1); R('#12223c', 0, 124, 384, 1);   // a red and a blue pipe along the ceiling
  for (let i = 20; i < 384; i += 32) { R('#70747e', i, 119, 2, 6); R('#22252b', i + 2, 119, 1, 6); }
  R('#202329', 0, 193, 384, 7); R('#50545d', 0, 193, 384, 1); for (let i = 0; i < 384; i += 16) R('#8a7430', i, 197, 10, 1);
  // bay A: two containers parked in the corridor
  crate(x, 15, Y(127), 80, 32, CT.blue, 'HALD 7', n, '44 71 208'); crate(x, 15, Y(160), 80, 32, CT.rust, 'OSTMARK', n, '20 55 913');
  px(x, 66, Y(166), ['...#...', '..#o#..', '.#ooo#.', '#ooooo#', '.#ooo#.', '..#o#..', '...#...'], { '#': '#c8b4a0', o: '#8a3a30' });
  R('#000', 20, 192, 12, 2); R('#000', 76, 192, 12, 2);
  // bay B: bullet-holed safety glass looking out over the harbour (the cracks are live)
  R('#000', 112, 126, 78, 50); R('#666a74', 113, 127, 76, 48); R('#8a8e98', 113, 127, 76, 1); R('#3a3e48', 113, 174, 76, 1); rivets(x, 114, Y(128), 74, 6, '#2e3138');
  x.clearRect(116, Y(130), 70, 42); x.fillStyle = 'rgba(140,180,205,0.17)'; x.fillRect(116, Y(130), 70, 42);
  for (const [a, b] of [[128, 118], [136, 124], [170, 158], [182, 172]]) ln(x, a, Y(130), b, Y(171), 'rgba(255,255,255,0.09)');
  R('#2a2d34', 150, 130, 1, 42); R('#70747e', 151, 130, 1, 42); R('#3e424c', 152, 130, 1, 42);
  R('#000', 110, 176, 82, 3); R('#7a7e88', 111, 176, 80, 1); R('#4a4e58', 111, 177, 80, 1);
  x.globalAlpha = 0.5; drawText(x, 'B2', 120, Y(181), { scale: 1, fill: '#70747e', outline: null }); x.globalAlpha = 1;
  box(x, 172, Y(181), 11, 10, '#565a64', '#8a8e98', '#2a2d34'); R(RED, 174, 184, 2, 2); R(BLUE, 179, 184, 2, 2); R('#2a2d34', 174, 188, 7, 1);
  // bay C: the turnstile machine. Two revolving chambers, one red, one blue (the vanes are live)
  R('#000', 206, 125, 82, 72); R('#464a54', 207, 126, 80, 70); R('#5e626c', 207, 126, 80, 10); R('#8a8e98', 207, 126, 80, 1); R('#2e3138', 207, 135, 80, 1);
  stripes(x, 232, Y(128), 30, 6); R('#000', 214, 128, 8, 6); R(RED, 215, 129, 6, 4); R(RED_HI, 216, 129, 2, 1); R('#000', 272, 128, 8, 6); R(BLUE, 273, 129, 6, 4); R(BLUE_HI, 274, 129, 2, 1);
  rivets(x, 209, Y(127), 22, 5, '#2e3138'); rivets(x, 264, Y(127), 6, 5, '#2e3138');
  for (const [c0, pal, col] of [[211, ['#1a0b0d', '#3a1315', '#561a18', '#3a1315', '#1a0b0d'], RED], [249, ['#090f1e', '#11224a', '#183a6c', '#11224a', '#090f1e'], BLUE]]) {
    R('#000', c0 - 1, 137, 36, 55); vgrad(x, c0, Y(138), 34, 53, pal); glow(x, c0 + 17, Y(162), 15, col, 0.4);
    R('#70747e', c0, 138, 34, 2); R('#2e3138', c0, 140, 34, 1); R('#2a2d34', c0, 187, 34, 4); R('#7a7e88', c0, 187, 34, 1); R('#16181d', c0 + 16, 141, 2, 46);
  }
  R('#34383f', 245, 137, 4, 55); R('#565a64', 245, 137, 1, 55); R('#000', 205, 192, 84, 6); R('#565a64', 206, 192, 82, 4); stripes(x, 206, Y(193), 82, 3); R('#8a8e98', 206, 192, 82, 1);
  rivets(x, 208, Y(140), 1, 1, '#8a8e98'); for (let j = 142; j < 188; j += 6) { R('#2e3138', 208, j, 1, 1); R('#2e3138', 285, j, 1, 1); }
  // bay D: the dock door, half open on the harbour; a clock that runs backwards (hands are live)
  R('#000', 303, 125, 58, 69); R('#5a5e68', 304, 126, 56, 67); R('#7a7e88', 304, 126, 56, 1); R('#3a3e48', 304, 127, 1, 66);
  for (let j = 129; j < 153; j++) R(j % 3 === 0 ? '#2a2d34' : j % 3 === 1 ? '#666a74' : '#4c505a', 307, j, 50, 1);
  drawText(x, 'DOCK 7', 314, Y(137), { fill: '#9a9ea8', outline: null }); stripes(x, 307, Y(153), 50, 3);
  x.clearRect(307, Y(156), 50, 37); for (let j = 156; j < 170; j += 2) R('#7a7e88', 312, j, 1, 1); R('#3e424c', 311, 170, 3, 2);
  box(x, 339, Y(172), 16, 9, '#2c3038', '#50545d', '#16181d'); box(x, 335, Y(182), 12, 8, '#30343c', '#565a64', '#16181d'); box(x, 348, Y(182), 8, 8, '#2a2d34', '#4a4e58', '#16181d'); R('#3a3024', 333, 191, 25, 2);
  R('#000', 303, 193, 58, 1);
  disc(x, 373, Y(138), 9, '#000'); disc(x, 373, Y(138), 8, '#8a909a'); disc(x, 373, Y(138), 7, '#b4bac4');
  for (let k = 0; k < 12; k++) { x.fillStyle = '#3a3e48'; x.fillRect(Math.round(373 + Math.sin((k * TAU) / 12) * 6), Math.round(Y(138) - Math.cos((k * TAU) / 12) * 6), 1, 1); }
  box(x, 367, Y(156), 13, 16, '#6a2a26', '#9a4a40', '#3a1614'); R('#c8b4a0', 370, 160, 7, 1); R('#c8b4a0', 373, 158, 1, 5); R('#3a1614', 369, 166, 9, 1);
  x.globalAlpha = 0.5; drawText(x, '7', 370, Y(178), { fill: '#70747e', outline: null }); x.globalAlpha = 1;
  // the pilasters between the bays, each with a strip light: red, blue, red, blue
  PILX.forEach((X, k) => {
    R('#000', X - 1, 118, 12, 82); R('#4a4e58', X, 118, 10, 82); R('#60646e', X, 118, 1, 82); R('#2c2f36', X + 8, 118, 2, 82);
    R('#000', X - 2, 118, 14, 7); R('#5a5e68', X - 1, 118, 12, 6); R('#7a7e88', X - 1, 118, 12, 1);
    R('#000', X - 2, 185, 14, 15); R('#565a64', X - 1, 186, 12, 14); R('#7a7e88', X - 1, 186, 12, 1); stripes(x, X - 1, Y(190), 12, 6);
    R('#000', X + 3, 131, 4, 46); R(k % 2 ? BLUE_LO : RED_LO, X + 4, 132, 2, 44);
  });
  // glass cracks: every bullet hole has a web of cracks that grows, then heals again
  const cracks = HOLES.map(([hx0, hy0]) => { const rays = []; for (let k = 0; k < 7; k++) { let a = (k / 7) * TAU + n() * 0.6, px0 = hx0, py0 = hy0; const pts = [], L = 7 + Math.floor(n() * 9); for (let s = 0; s < L; s++) { px0 += Math.cos(a); py0 += Math.sin(a); if (n() < 0.3) a += (n() - 0.5) * 1.2; const ix = Math.round(px0), iy = Math.round(py0); if (ix < 117 || ix > 184 || iy < 131 || iy > 170 || (ix >= 150 && ix <= 152)) break; pts.push([ix, iy]); } rays.push(pts); } return rays; });
  return { c: A.c, cracks };
}

// ---------- the dock you run on, and the harbour under it ----------
function buildDeck() {
  const c = pix(96, 40, (i, j) => {
    if (j === 0) return '#b2bac6'; if (j === 1) return '#6e7582';
    if (j < 8) {
      if (j === 4 && i % 32 < 20) return '#b89a34'; if (j === 5 && i % 32 < 20) return '#7a6626';
      const wet = hash(i, j * 3) > 0.5;
      if (i >= 16 && i < 28 && wet && (i + j) % 2) return j < 5 ? '#7a3a34' : '#5a2c2a';
      if (i >= 64 && i < 76 && wet && (i + j) % 2) return j < 5 ? '#3a5a86' : '#2c4466';
      if (hash(i >> 2, j) > 0.9) return '#565a64';
      return dith(['#474b54', '#3a3d45', '#2e3138'], (j - 2) / 6, i, j);
    }
    if (j === 8) return '#0c0d10'; if (j < 11) return ((i + j) >> 2) % 2 ? '#8a7430' : '#16181d'; if (j === 11) return '#0c0d10';
    const pile = (i >= 10 && i < 20) || (i >= 58 && i < 68);
    if (pile) { const k = i >= 58 ? i - 58 : i - 10; if (k === 0 || k === 9) return '#07080a'; if (j > 30 && hash(i, j) > 0.4) return '#1c2a26'; return k === 1 ? '#565a64' : k < 4 ? '#3a3e48' : k < 7 ? '#2c2f36' : '#1c1e24'; }
    if (j >= 18 && j < 21) return j === 18 ? '#3e424c' : j === 20 ? '#07080a' : '#24272d';
    return null;
  });
  const x = c.getContext('2d');
  disc(x, 39, 17, 6, '#000'); disc(x, 39, 17, 5, '#1c1e24'); disc(x, 39, 17, 2, '#000'); x.fillStyle = '#3e424c'; x.fillRect(36, 13, 3, 1); x.fillRect(35, 14, 1, 2); x.fillStyle = '#8a7a5a'; x.fillRect(39, 9, 1, 3);   // a tyre fender
  disc(x, 84, 17, 6, '#000'); disc(x, 84, 17, 5, '#1c1e24'); disc(x, 84, 17, 2, '#000'); x.fillStyle = '#3e424c'; x.fillRect(81, 13, 3, 1); x.fillRect(80, 14, 1, 2); x.fillStyle = '#8a7a5a'; x.fillRect(84, 9, 1, 3);
  return c;
}

// ---------- platforms ----------
function platContainer(ctx, p, x, y, w) {               // ledge: the top of a container bracketed to the wall
  const C = ((p.cx >> 14) & 1) ? ['#b0685a', '#8e4c40', '#6c362e', '#f4e0d0', '#3a1c18'] : ['#5e88a8', '#44708e', '#30566e', '#e0f0fc', '#162a38'];
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 13); ctx.fillRect(x + 6, y + 12, 3, 4); ctx.fillRect(x + w - 9, y + 12, 3, 4);
  ctx.fillStyle = C[1]; ctx.fillRect(x, y, w, 11);
  for (let i = 4; i < w - 4; i += 3) { ctx.fillStyle = C[0]; ctx.fillRect(x + i, y + 3, 1, 6); ctx.fillStyle = C[2]; ctx.fillRect(x + i + 1, y + 3, 1, 6); }
  ctx.fillStyle = C[3]; ctx.fillRect(x, y, w, 1); ctx.fillStyle = C[0]; ctx.fillRect(x, y + 1, w, 2); ctx.fillStyle = C[4]; ctx.fillRect(x, y + 9, w, 2);
  ctx.fillStyle = '#16181d'; ctx.fillRect(x, y, 3, 3); ctx.fillRect(x + w - 3, y, 3, 3); ctx.fillRect(x, y + 8, 3, 3); ctx.fillRect(x + w - 3, y + 8, 3, 3); ctx.fillStyle = C[3]; ctx.fillRect(x, y, 3, 1); ctx.fillRect(x + w - 3, y, 3, 1);
  ctx.fillStyle = '#565a64'; ctx.fillRect(x + 7, y + 12, 1, 3); ctx.fillRect(x + w - 8, y + 12, 1, 3);
}
function platSlab(ctx, x, y, w, f) {                    // a steel slab: a red light at one end, a blue at the other
  const a = (f >> 4) % 2;
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 9);
  ctx.fillStyle = '#eef2f8'; ctx.fillRect(x, y, w, 1); ctx.fillStyle = '#aab2c0'; ctx.fillRect(x, y + 1, w, 1); ctx.fillStyle = '#687080'; ctx.fillRect(x, y + 2, w, 4); ctx.fillStyle = '#2a2e38'; ctx.fillRect(x, y + 6, w, 1);
  ctx.fillStyle = '#3e4450'; for (let i = 9; i < w - 8; i += 6) ctx.fillRect(x + i, y + 3, 1, 2);
  ctx.fillStyle = '#000'; ctx.fillRect(x, y + 2, 6, 4); ctx.fillRect(x + w - 6, y + 2, 6, 4);
  ctx.fillStyle = a ? RED_HI : RED; ctx.fillRect(x + 1, y + 2, 4, 3); ctx.fillStyle = a ? BLUE : BLUE_HI; ctx.fillRect(x + w - 5, y + 2, 4, 3);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 1 + a, y + 2, 1, 1); ctx.fillRect(x + w - 4 - a, y + 2, 1, 1);
  ctx.globalAlpha *= 0.35; ctx.fillStyle = RED; ctx.fillRect(x, y + 8, 6, 2); ctx.fillStyle = BLUE; ctx.fillRect(x + w - 6, y + 8, 6, 2); ctx.globalAlpha /= 0.35;
}
function platUnbuild(ctx, p, x, y, w, f) {              // a concrete slab un-building itself: the pieces drift apart
  const hot = p.crumble > 0, n = Math.max(3, Math.round(w / 11)), pw = w / n, ga = ctx.globalAlpha;
  for (let k = 0; k < n; k++) {
    const x0 = Math.round(x + k * pw) + (hot ? Math.round((k - (n - 1) / 2) * 0.8) : 0), x1 = Math.round(x + (k + 1) * pw) - 1 + (hot ? Math.round((k - (n - 1) / 2) * 0.8) : 0);
    const dy = Math.round(Math.sin(f / 13 + k * 2.1) * (hot ? 2 : 1.1)) + (k % 2 && !hot ? 1 : 0), ww = x1 - x0, yy = y + Math.max(0, dy);
    ctx.fillStyle = '#000'; ctx.fillRect(x0 - 1, yy - 1, ww + 2, 9);
    ctx.fillStyle = '#f2ecda'; ctx.fillRect(x0, yy, ww, 1); ctx.fillStyle = '#b8ae98'; ctx.fillRect(x0, yy + 1, ww, 1); ctx.fillStyle = '#8a8270'; ctx.fillRect(x0, yy + 2, ww, 4); ctx.fillStyle = '#4a4438'; ctx.fillRect(x0, yy + 6, ww, 1);
    ctx.fillStyle = '#5c5648'; ctx.fillRect(x0 + 2 + (k % 3), yy + 3, 2, 1); ctx.fillRect(x0 + ww - 3, yy + 4, 1, 1);
    if (k < n - 1) { ctx.fillStyle = '#d87a3a'; ctx.fillRect(x1, yy + 3, 2, 1); }                                   // a stub of rusty rebar in each gap
    const a = ((f + k * 19) % 64) / 64, up = k % 2 === 0;                                                            // chips drifting off, up and down
    ctx.globalAlpha = ga * (1 - a); ctx.fillStyle = '#000'; ctx.fillRect(x0 + (ww >> 1) - 1, (up ? yy - 4 - a * 9 : yy + 9 + a * 9) - 1, 4, 4); ctx.fillStyle = up ? '#f2ecda' : '#8a8270'; ctx.fillRect(x0 + (ww >> 1), up ? yy - 4 - a * 9 : yy + 9 + a * 9, 2, 2); ctx.globalAlpha = ga;
  }
}
function platPallet(ctx, x, y, w, f) {                  // a pallet on the crane hook
  const m = x + (w >> 1);
  ctx.fillStyle = '#0c0d10'; ctx.fillRect(m, -4, 1, Math.max(0, y - 18)); ln(ctx, x + 2, y - 1, m, y - 15, '#0c0d10'); ln(ctx, x + w - 3, y - 1, m, y - 15, '#0c0d10');
  ctx.fillStyle = '#000'; ctx.fillRect(m - 4, y - 23, 9, 9); ctx.fillStyle = '#d8b030'; ctx.fillRect(m - 3, y - 22, 7, 7); ctx.fillStyle = '#fff0a0'; ctx.fillRect(m - 3, y - 22, 7, 1); ctx.fillStyle = '#16181d'; ctx.fillRect(m - 1, y - 20, 3, 3);
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 10);
  ctx.fillStyle = '#f8e8c0'; ctx.fillRect(x, y, w, 1); ctx.fillStyle = '#c8a468'; ctx.fillRect(x, y + 1, w, 2); ctx.fillStyle = '#2a2016'; ctx.fillRect(x, y + 3, w, 3); ctx.fillStyle = '#9a7848'; ctx.fillRect(x, y + 6, w, 1); ctx.fillStyle = '#5a4428'; ctx.fillRect(x, y + 7, w, 1);
  ctx.fillStyle = '#a8844c'; for (const bx of [0, (w >> 1) - 3, w - 6]) ctx.fillRect(x + bx, y + 3, 6, 3);
  ctx.fillStyle = '#8a6a3c'; for (let i = 7; i < w - 3; i += 8) ctx.fillRect(x + i, y + 1, 1, 2);
  for (let i = 0; i < 6; i++) { ctx.fillStyle = (i >> 1) % 2 ? '#16181d' : '#e8c030'; ctx.fillRect(x + i, y + 1, 1, 2); ctx.fillRect(x + w - 1 - i, y + 1, 1, 2); }
  ctx.fillStyle = (f >> 4) % 2 ? RED_HI : RED_LO; ctx.fillRect(m - 1, y - 20, 1, 1); ctx.fillStyle = (f >> 4) % 2 ? BLUE_LO : BLUE_HI; ctx.fillRect(m + 1, y - 20, 1, 1);
}
function drawPlat(ctx, p, x, y, w, f, Y) {
  if (p.kind === 'crumble' && p.crumble > 0) { y += f % 4 < 2 ? 1 : 0; x += (f % 3) - 1; }
  if (p.gone) ctx.globalAlpha = Math.max(0, 1 - (p.fallT || 0) / 40);
  if (p.kind === 'ledge') platContainer(ctx, p, x, y, w);
  else if (p.kind === 'crumble') platUnbuild(ctx, p, x, y, w, f);
  else if (p.kind === 'movev' || p.kind === 'moveh') platPallet(ctx, x, y, w, f);
  else platSlab(ctx, x, y, w, f);
  ctx.globalAlpha = 1;
}
// ---- the drip: a pipe under the gallery. Water falls out of it (forward) and runs back UP into it (inverted) ----
function drawPipe(ctx, x, Y, prog, f) {
  const y0 = Y(117), py = Y(122);
  ctx.fillStyle = '#000'; ctx.fillRect(x - 10, y0, 21, 5); ctx.fillRect(x - 4, y0 + 4, 9, 4);
  ctx.fillStyle = '#5c606a'; ctx.fillRect(x - 9, y0 + 1, 19, 3); ctx.fillStyle = '#9a9ea8'; ctx.fillRect(x - 9, y0 + 1, 19, 1); ctx.fillStyle = '#34383f'; ctx.fillRect(x - 9, y0 + 3, 19, 1);
  ctx.fillStyle = RED; ctx.fillRect(x - 8, y0 + 1, 3, 3); ctx.fillStyle = RED_HI; ctx.fillRect(x - 8, y0 + 1, 3, 1); ctx.fillStyle = BLUE; ctx.fillRect(x + 6, y0 + 1, 3, 3); ctx.fillStyle = BLUE_HI; ctx.fillRect(x + 6, y0 + 1, 3, 1);
  ctx.fillStyle = '#464a54'; ctx.fillRect(x - 3, y0 + 4, 7, 3); ctx.fillStyle = '#9a9ea8'; ctx.fillRect(x - 3, y0 + 4, 1, 3); ctx.fillStyle = '#0c0d10'; ctx.fillRect(x - 1, y0 + 6, 3, 1);
  for (let k = 0; k < 3; k++) {                         // beads of water running up into the nozzle
    const a = ((f + k * 21) % 63) / 63, yy = py + 4 + (1 - a) * (1 - a) * 30;
    ctx.globalAlpha = 0.2 + 0.7 * a; ctx.fillStyle = k === 1 ? '#ffffff' : BLUE_HI; ctx.fillRect(x - 2 + k * 2, Math.round(yy), 1, 2);
  }
  ctx.globalAlpha = 1;
  const r = Math.floor(prog * 3); if (r > 0) { ctx.fillStyle = '#6ab0ff'; ctx.fillRect(x - Math.floor(r / 2), py + 3, r, r + 1); ctx.fillStyle = '#ffffff'; ctx.fillRect(x, py + 3, 1, 1); }
}
// an inverted round: brass, with its smoke trail out in FRONT of it
function drawBullet(ctx, x, y, f) {
  ctx.fillStyle = BLUE_HI; for (let t = 1; t < 7; t++) if ((t + (f >> 1)) % 2) ctx.fillRect(x - 4 - t * 2, y + ((t >> 1) % 2), 1, 1);
  ctx.fillStyle = '#000'; ctx.fillRect(x - 4, y - 2, 9, 5); ctx.fillStyle = '#ffd06a'; ctx.fillRect(x - 3, y - 1, 6, 3); ctx.fillStyle = '#fff4c0'; ctx.fillRect(x - 3, y - 1, 6, 1); ctx.fillStyle = '#e03a2a'; ctx.fillRect(x + 3, y - 1, 1, 3);
}

// ---------- the level's own dangers (contract: ../danger.js). BLUE = inverted: everything in this block runs backwards ----------
const O = '#000';
const rc = (x, col, x0, y0, w, h) => { x.fillStyle = col; x.fillRect(Math.round(x0), Math.round(y0), w, h); };
// black outline round whatever is on a canvas
function outlined(c) {
  const W = c.width, H = c.height, o = cv(W + 2, H + 2), x = o.getContext('2d'), k = tint({ c, ox: 0, oy: 0 }, '#000000', 1).c;
  for (const [i, j] of [[0, 1], [2, 1], [1, 0], [1, 2]]) x.drawImage(k, i, j);
  x.drawImage(c, 1, 1); return o;
}
// an inverted soldier breathes his own air: a lit respirator and a white tank on his back
function airTank(f) {
  const W = f.c.width, H = f.c.height, c = cv(W, H), x = c.getContext('2d'); x.drawImage(f.c, 0, 0);
  const d = x.getImageData(0, 0, W, H).data; let ex = -1, ey = -1;
  const at = (i, j) => { const o = (j * W + i) * 4; return i >= 0 && j >= 0 && i < W && j < H && d[o + 3] ? (d[o] << 16) | (d[o + 1] << 8) | d[o + 2] : -1; };
  for (let j = 0; j < H && ex < 0; j++) for (let i = 0; i < W; i++) if (at(i, j) === 0xff4a3a) { ex = i; ey = j; break; }
  if (ex < 0) return f;
  for (let j = ey + 1; j < ey + 9; j++) for (let i = ex - 8; i < ex + 2; i++) { const v = at(i, j); if (v === 0x60607a) rc(x, '#dff0ff', i, j, 1, 1); else if (v === 0x55556a || v === 0x3b3b4d) rc(x, BLUE, i, j, 1, 1); }
  const edge = (j) => { for (let i = W - 1; i > ex + 5; i--) if (at(i, j) >= 0) return i; return -1; };
  let r = edge(ey + 5); if (r < 0) return { c, ox: f.ox, oy: f.oy };
  for (let k = 0; k < 13; k++) {                       // the tank follows the line of his back
    const j = ey + 4 + k, e = edge(j); if (e >= 0) r = Math.max(r - 1, Math.min(r + 1, e));
    if (k === 0 || k === 12) { rc(x, O, r + 1, j, 4, 1); if (k === 0) { rc(x, O, r + 2, j - 1, 2, 1); } continue; }
    rc(x, O, r, j, 6, 1); rc(x, '#ffffff', r + 1, j, 1, 1); rc(x, '#cfe6ff', r + 2, j, 2, 1); rc(x, '#6aa0d8', r + 4, j, 1, 1);
    if (k === 3 || k === 9) rc(x, BLUE, r + 1, j, 4, 1);
  }
  return { c, ox: f.ox, oy: f.oy };
}
// the inverted marksman: kneeling, rifle low. pose 0 = rifle down (he has caught his round), 1 = levelled, 2 = the catch
function buildGunman(src) {
  const L0 = '#0a0a10', L1 = '#1b1f33', L2 = '#343b5c', L3 = '#10121e';
  return [0, 1, 2].map((pose) => {
    const c = cv(48, 32), x = c.getContext('2d');
    // back leg: knee on the floor, shin lying back
    rc(x, L0, 28, 25, 6, 7); rc(x, L1, 29, 26, 4, 6); rc(x, L0, 31, 28, 11, 4); rc(x, L3, 32, 29, 9, 3); rc(x, L2, 32, 29, 7, 1); rc(x, L0, 38, 25, 5, 7); rc(x, '#3a3f4c', 39, 26, 3, 6); rc(x, '#18181e', 39, 29, 3, 3);
    // the coat tail down his back
    for (let j = 0; j < 7; j++) { rc(x, L0, 29, 23 + j, 6 + (j >> 1), 1); rc(x, '#4a90e8', 29, 23 + j, 4 + (j >> 1), 1); rc(x, '#1e4fa0', 32 + (j >> 1), 23 + j, 1, 1); }
    // front leg: thigh forward, shin down, boot flat
    rc(x, L0, 16, 24, 15, 6); rc(x, L1, 17, 25, 13, 4); rc(x, L2, 17, 25, 12, 1); rc(x, L0, 16, 27, 6, 5); rc(x, L1, 17, 28, 4, 3); rc(x, L2, 17, 28, 1, 3); rc(x, '#5a6690', 17, 25, 4, 2);
    rc(x, L0, 12, 28, 10, 4); rc(x, '#3a3f4c', 13, 29, 8, 2); rc(x, '#18181e', 13, 31, 8, 1);
    // head and trunk of the standing soldier, dropped onto the knee
    x.drawImage(src.c, 8, 5, 26, 23, 12, 3, 26, 23);
    // the rifle. Its muzzle is where the sim ends the round's flight: 9 up, a hand in front of him
    const steel = (i, j, w) => { rc(x, O, i - 1, j - 1, w + 2, 4); rc(x, '#c4ccd8', i, j, w, 1); rc(x, '#5a606c', i, j + 1, w, 1); };
    if (pose) {
      steel(14, 22, 16); rc(x, O, 27, 21, 7, 6); rc(x, '#4a3826', 28, 22, 5, 4); rc(x, '#7a6040', 28, 22, 5, 1);                      // barrel + receiver, the stock under his arm
      rc(x, O, 23, 24, 4, 4); rc(x, '#444a54', 24, 24, 2, 3);                                                                        // magazine
      rc(x, O, 10, 21, 6, 4); rc(x, '#2a2d34', 11, 22, 5, 2); rc(x, '#7a808c', 11, 22, 5, 1);                                         // suppressor
      rc(x, O, 19, 21, 5, 5); rc(x, '#ffd2ad', 20, 22, 3, 1); rc(x, '#eab38a', 20, 23, 3, 2);                                        // his hand
    } else {
      for (let k = 0; k < 11; k++) rc(x, O, 26 - k, 20 + Math.round(k * 0.8) - 1, 4, 4);
      for (let k = 0; k < 11; k++) { rc(x, k > 8 ? '#2a2d34' : '#c4ccd8', 27 - k, 20 + Math.round(k * 0.8), 2, 1); rc(x, k > 8 ? '#2a2d34' : '#5a606c', 27 - k, 21 + Math.round(k * 0.8), 2, 1); }
      rc(x, O, 21, 22, 5, 5); rc(x, '#ffd2ad', 22, 23, 3, 1); rc(x, '#eab38a', 22, 24, 3, 2);
    }
    if (pose === 2) {                                   // the catch: the flash folds INTO the muzzle
      rc(x, O, 3, 21, 8, 4); rc(x, O, 5, 19, 4, 8); rc(x, BLUE, 4, 22, 7, 2); rc(x, BLUE_HI, 6, 20, 2, 6); rc(x, '#ffffff', 5, 22, 6, 2); rc(x, '#ffffff', 6, 21, 2, 4);
      rc(x, BLUE_HI, 2, 18, 1, 1); rc(x, BLUE_HI, 2, 27, 1, 1); rc(x, BLUE_HI, 10, 17, 1, 1); rc(x, BLUE_HI, 10, 28, 1, 1); rc(x, '#ffffff', 0, 22, 2, 1);
    }
    return { c, ox: 24, oy: 32 };
  });
}
// a silver saloon, nose to the LEFT. It only ever drives in reverse: long bonnet behind, headlamps shining back the way it came
const CARW = 46, CARH = 17;
function buildCar() {
  const c = cv(CARW, CARH), x = c.getContext('2d');
  const row = (j, a, b, col) => rc(x, col, a, j, b - a + 1, 1);
  const CAB = [[23, 36], [21, 38], [20, 39], [19, 39], [18, 40], [17, 40]];
  CAB.forEach(([a, b], j) => row(j, a, b, j < 1 ? '#f4f8ff' : j < 2 ? '#c4ccd8' : '#98a2b2'));
  for (let j = 2; j < 6; j++) { row(j, CAB[j][0] + 1, 28, '#1a2a40'); row(j, 31, 38, '#1a2a40'); rc(x, '#8ac8ff', CAB[j][0] + 2, j, 2, 1); rc(x, '#4a78a8', 32, j, 3, 1); }   // glass: raked screen, upright back
  row(6, 3, 43, '#f4f8ff'); row(7, 1, 44, '#c4ccd8'); for (let j = 8; j < 10; j++) row(j, 0, 44, '#98a2b2'); row(10, 0, 44, BLUE_HI); row(11, 0, 44, BLUE); row(12, 0, 44, '#5a6272'); row(13, 1, 44, '#343a46');
  rc(x, '#4a5260', 29, 7, 1, 6); rc(x, '#4a5260', 18, 7, 1, 6); rc(x, '#4a5260', 40, 7, 1, 6); rc(x, '#f4f8ff', 24, 8, 3, 1); rc(x, '#f4f8ff', 35, 8, 3, 1);          // door seams, handles
  rc(x, '#fff4a0', 0, 8, 2, 2); rc(x, '#22262e', 0, 12, 4, 1); rc(x, '#22262e', 41, 12, 4, 1); rc(x, '#ff3a2a', 43, 7, 2, 2);                                   // headlamp, bumpers, tail lamp
  for (const wx of [9, 35]) for (let j = -5; j <= 3; j++) { const w = Math.floor(Math.sqrt(27 - j * j)); rc(x, '#0c0d10', wx - w, 13 + j, w * 2 + 1, 1); }           // wheel arches
  x.clearRect(0, 14, CARW, 3);
  return outlined(c);
}
function wheel(ctx, cx, cy, f, dir) {
  for (let j = -4; j <= 4; j++) { const w = Math.floor(Math.sqrt(18 - j * j)); rc(ctx, O, cx - w, cy + j, w * 2 + 1, 1); }
  for (let j = -2; j <= 2; j++) { const w = Math.floor(Math.sqrt(6 - j * j)); rc(ctx, '#4a4e58', cx - w, cy + j, w * 2 + 1, 1); }
  const a = (dir * f) / 2.2; rc(ctx, '#d8dce4', cx + Math.cos(a) * 1.6, cy + Math.sin(a) * 1.6, 1, 1); rc(ctx, '#d8dce4', cx - Math.cos(a) * 1.6, cy - Math.sin(a) * 1.6, 1, 1); rc(ctx, '#16181d', cx, cy, 1, 1);
}
let CAR = null;
// x = the car's middle, y = the floor line under its wheels. dir 0 = parked
function drawCar(ctx, x, y, f, dir) {
  CAR = CAR || buildCar();
  for (let k = 0; k < 14; k++) { ctx.globalAlpha = 0.5 - k * 0.034; rc(ctx, '#fff4a0', x - 25 - k, y - 9 - (k >> 2), 1, 3 + (k >> 1)); } ctx.globalAlpha = 1;   // headlamps: pointing backwards
  ctx.drawImage(CAR, x - 24, y - CARH - 1);
  wheel(ctx, x - 14, y - 4, f, dir); wheel(ctx, x + 12, y - 4, f, dir);
  if (dir || (f >> 3) % 2) { rc(ctx, O, x + 21, y - 8, 3, 4); rc(ctx, '#ffffff', x + 21, y - 7, 2, 2); ctx.globalAlpha = 0.3; rc(ctx, '#ffffff', x + 23, y - 9, 3, 6); ctx.globalAlpha = 1; }   // the reversing lamp
}
const dsc = (ctx, cx, cy, r, col) => { ctx.fillStyle = col; for (let j = -r; j < r; j++) { const w = Math.round(Math.sqrt(r * r - (j + 0.5) * (j + 0.5))); ctx.fillRect(Math.round(cx) - w, Math.round(cy) + j, w * 2, 1); } };
function rubble(ctx, cx, cy, lit) {                    // (cx, cy) = the middle of its underside
  const R = [[5, 3], [4, 3], [3, 2]]; let j = cy;
  for (const [w, n] of R) { for (let k = 0; k < n; k++) { j--; rc(ctx, lit, cx - w - 2, j, w * 2 + 5, 1); } } rc(ctx, lit, cx - 4, j - 2, 9, 2);
  j = cy; for (const [w, n] of R) { for (let k = 0; k < n; k++) { j--; rc(ctx, O, cx - w - 1, j, w * 2 + 3, 1); } } rc(ctx, O, cx - 3, j - 1, 7, 1); rc(ctx, O, cx - 6, cy, 13, 1);
  j = cy; for (const [w, n] of R) { for (let k = 0; k < n; k++) { j--; rc(ctx, '#a89e88', cx - w, j, w * 2 + 1, 1); rc(ctx, '#6a6252', cx + w - 2, j, 3, 1); } }
  rc(ctx, '#fff8e6', cx - 3, cy - 8, 6, 1); rc(ctx, '#e0d8c2', cx - 4, cy - 6, 5, 1); rc(ctx, '#e0d8c2', cx - 5, cy - 3, 4, 1); rc(ctx, '#4a4438', cx - 4, cy - 1, 9, 1); rc(ctx, '#4a4438', cx - 1, cy - 5, 1, 3); rc(ctx, '#4a4438', cx, cy - 3, 2, 1);
  rc(ctx, O, cx + 2, cy - 12, 4, 5); rc(ctx, '#ff8a3a', cx + 3, cy - 11, 2, 4); rc(ctx, '#ffd0a0', cx + 3, cy - 11, 1, 2);        // a stub of rebar
}
const chevron = (ctx, x, y, col) => { for (let i = -3; i <= 3; i++) { rc(ctx, O, x + i, y + Math.abs(i) - 1, 1, 4); } for (let i = -3; i <= 3; i++) rc(ctx, col, x + i, y + Math.abs(i), 1, 2); };
const FXT = {
  // an explosion running backwards: the scar is there first, the heat is pulled IN, then the blast is cold
  vent(ctx, x, y, st, f) {
    rc(ctx, O, x - 9, y - 2, 18, 3); rc(ctx, '#23262d', x - 8, y - 1, 16, 1); rc(ctx, '#dff0ff', x - 8, y - 2, 3, 1); rc(ctx, BLUE_HI, x + 5, y - 2, 3, 1); rc(ctx, BLUE, x - 3, y - 2, 5, 1); rc(ctx, '#ffffff', x - 6, y - 3, 1, 1); rc(ctx, '#ffffff', x + 6, y - 3, 1, 1);
    rc(ctx, O, x - 8, y - 6, 3, 4); rc(ctx, '#ffffff', x - 7, y - 5, 1, 3); rc(ctx, O, x + 4, y - 5, 3, 3); rc(ctx, BLUE_HI, x + 5, y - 4, 1, 2);       // frost, before anything has happened
    if (st.warn > 0) {
      const k = st.warn, R0 = 30 - k * 10, top = Math.round(34 * Math.min(1, k * 1.6));
      ctx.fillStyle = (f >> 1) % 2 ? BLUE_HI : '#ffffff'; ctx.globalAlpha = 0.25 + 0.6 * k;                                // the blast that will have been here
      for (let j = 2 + (f % 4); j < top; j += 4) { ctx.fillRect(x - 5, y - 2 - j, 1, 2); ctx.fillRect(x + 4, y - 2 - j, 1, 2); } ctx.fillRect(x - 3, y - 3 - top, 6, 1);
      ctx.globalAlpha = 1;
      for (let i = 0; i < 9; i++) {                     // embers falling back in
        const a = 0.2 + (i / 8) * (Math.PI - 0.4), ph = (f * 0.06 + i * 0.37) % 1, r = 5 + (1 - ph) * R0, cx = Math.cos(a), sy = Math.sin(a) * 0.9;
        const hx = x + cx * r, hy = y - 5 - sy * r, tx = x + cx * (r + 3), ty = y - 5 - sy * (r + 3);
        rc(ctx, O, Math.min(hx, tx) - 1, Math.min(hy, ty) - 1, Math.abs(hx - tx) + 3, Math.abs(hy - ty) + 3);
        rc(ctx, RED, tx, ty, 1, 1); rc(ctx, RED_HI, (hx + tx) / 2, (hy + ty) / 2, 1, 1); rc(ctx, i % 2 ? '#ffffff' : '#ffd06a', hx, hy, 1, 1);
      }
      const r = 2 + Math.round(k * 3), hot = k > 0.5 && (f >> 1) % 2;                                                      // and the cold gathering where they meet
      dsc(ctx, x, y - 6, r + 1, O); dsc(ctx, x, y - 6, r, hot ? '#ffffff' : BLUE); dsc(ctx, x, y - 6, Math.max(1, r - 1), hot ? '#ffffff' : BLUE_HI); if (r > 2) dsc(ctx, x, y - 6, r - 2, '#ffffff');
    }
    if (!st.on) return;
    const h = st.h, w = (j) => Math.max(1, Math.min(5, 3 + ((j * 5 + f * 3) % 3) - (j > h - 4 ? (j - (h - 4)) : 0) + (j < 3 ? 1 : 0)));
    for (let j = 0; j < h; j++) rc(ctx, O, x - w(j) - 1, y - 2 - j, w(j) * 2 + 2, 1);
    rc(ctx, O, x - 2, y - 3 - h, 4, 1);
    for (let j = 0; j < h; j++) {
      const ww = w(j); rc(ctx, (j + (f >> 1)) % 5 < 2 ? BLUE : '#5aa8f0', x - ww, y - 2 - j, ww * 2, 1); if (ww > 1) rc(ctx, BLUE_HI, x - ww + 1, y - 2 - j, ww * 2 - 2, 1); rc(ctx, '#ffffff', x - 1 - (j % 2), y - 2 - j, 2 + (j % 3 === 0 ? 1 : 0), 1);
      if (j < 8 && (j + f) % 3) rc(ctx, j < 4 ? RED : RED_HI, x - 1, y - 2 - j, 2, 1);                                   // the heat going back down into the ground
    }
    for (let i = 0; i < 6; i++) {                       // frost needles round the column
      const ph = (f * 0.11 + i * 0.29) % 1, sd = i % 2 ? 1 : -1, nx = x + sd * (7 + (1 - ph) * 8), ny = y - 4 - ((i * 11) % Math.max(4, h - 4));
      rc(ctx, O, nx - 1, ny - 1, 3, 3); rc(ctx, i % 3 ? '#ffffff' : BLUE_HI, nx, ny, 1, 1);
    }
  },
  // inverted rubble: it lies where it WILL have landed, shivers under arrows pointing up, then falls up. (x, y) = its lowest point
  drop(ctx, x, y, f, d) {
    const id = d.id || 0, pulse = (f >> 2) % 2;
    if (d.up && d.wait) {
      const ph = (f + id * 5) % 18, tw = ph < 2 || (ph > 4 && ph < 7) ? 1 : 0;
      ctx.fillStyle = BLUE_HI; for (let k = 0; k < 10; k++) { ctx.globalAlpha = 0.7 * (1 - k / 10); ctx.fillRect(x, y - 34 - k * 8 - ((f >> 1) % 8), 1, 4); } ctx.globalAlpha = 1;   // where it is going
      rc(ctx, O, x - 10, y - 2, 21, 2); rc(ctx, pulse ? '#ffffff' : BLUE_HI, x - 9, y - 1, 19, 1);                           // a line of light under it
      rubble(ctx, x + (tw && ph < 2 ? 1 : 0), y - 1 - tw, pulse ? BLUE_HI : BLUE);
      const o = (f >> 1) % 8; chevron(ctx, x, y - 19 - o, pulse ? '#ffffff' : BLUE_HI); if (o < 6) chevron(ctx, x, y - 27 - o, BLUE_HI);
      return;
    }
    const s = d.up ? 1 : -1;                            // its streak is behind it: below when it falls up
    for (let k = 0; k < 9; k++) { ctx.globalAlpha = 0.9 - k * 0.09; rc(ctx, k < 3 ? '#ffffff' : k < 6 ? BLUE_HI : BLUE, x - 1 - (k < 4 ? 1 : 0), s > 0 ? y + 1 + k * 2 : y - 12 - k * 2, k < 4 ? 4 : 2, 2); } ctx.globalAlpha = 1;
    rubble(ctx, x, y, BLUE_HI);
  },
  // an inverted round: it flies tail first, back along its own smoke, into the gun
  shot(ctx, x, y, f, b) {
    const dir = b.rev ? 1 : -1, x0 = dir > 0 ? x + 5 : x - 21;
    rc(ctx, O, x0, y - 2, 16, 4);                                                                                        // its tracer is AHEAD of it
    for (let t = 0; t < 5; t++) rc(ctx, (t + (f >> 1)) % 2 ? '#ffffff' : BLUE_HI, dir > 0 ? x + 5 + t * 3 : x - 7 - t * 3, y - 1, 2, 2 - (t > 2 ? 1 : 0));
    rc(ctx, O, x - 6, y - 4, 13, 8); rc(ctx, (f >> 1) % 2 ? BLUE_HI : BLUE, x - 5, y - 3, 11, 6);
    rc(ctx, O, x - 4, y - 2, 9, 4); rc(ctx, '#ffd06a', x - 3, y - 1, 7, 2); rc(ctx, '#fff4c0', x - 3, y - 1, 7, 1); rc(ctx, '#ffffff', dir > 0 ? x - 4 : x + 3, y - 1, 2, 2); rc(ctx, RED, dir > 0 ? x + 3 : x - 3, y - 1, 1, 2);
  },
  // the path the round WILL have taken: the dashes crawl towards the gun
  aim(ctx, x0, x1, y, f, k) {
    ctx.fillStyle = k > 0.85 && (f >> 1) % 2 ? '#ffffff' : BLUE_HI; ctx.globalAlpha = 0.35 + 0.65 * k;
    for (let i = x0 + 4 + (f % 8); i < x1; i += 8) ctx.fillRect(i, y, 4, 1);
    ctx.globalAlpha = 1;
  },
  // the bullet hole the round comes back out of. k = 0: far off, or healed
  hole(ctx, x, y, f, k) {
    if (k <= 0) { dsc(ctx, x, y, 2, O); rc(ctx, '#5a606c', x - 1, y - 1, 1, 1); return; }
    const L = 3 + Math.round(k * 5), hot = k > 0.8 && (f >> 1) % 2;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) { const n = dx && dy ? L - 2 : L; for (let s = 4; s < 4 + n; s++) rc(ctx, s % 2 ? '#ffffff' : BLUE_HI, x + dx * s - (dx > 0 ? 1 : 0), y + dy * s - (dy > 0 ? 1 : 0), 1, 1); }
    dsc(ctx, x, y, 5, O); dsc(ctx, x, y, 4, hot ? '#ffffff' : BLUE_HI); dsc(ctx, x, y, 3, hot ? BLUE_HI : BLUE); dsc(ctx, x, y, 2, O); if (hot) rc(ctx, '#ffffff', x - 1, y - 1, 2, 2);
    const r = 8 + (1 - k) * 14;                         // a ring closing on it as the moment comes
    ctx.fillStyle = hot ? '#ffffff' : BLUE_HI; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU - f / 9; ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1 + (k > 0.5 ? 1 : 0), 1); }
  },
  ride(ctx, x, y, f) {
    drawCar(ctx, x, y, f, 0);
    const b = Math.round(Math.sin(f / 7) * 2), ay = y - 30 + b;                 // "get on": an arrow over the roof, hazard lights going
    rc(ctx, O, x - 3, ay - 7, 7, 6); rc(ctx, O, x - 5, ay - 2, 11, 3); rc(ctx, O, x - 3, ay, 7, 3); rc(ctx, O, x - 1, ay + 2, 3, 3);
    rc(ctx, '#ffffff', x - 2, ay - 6, 5, 5); rc(ctx, '#ffffff', x - 4, ay - 1, 9, 1); rc(ctx, BLUE_HI, x - 2, ay, 5, 2); rc(ctx, BLUE_HI, x, ay + 2, 1, 2);
    if ((f >> 3) % 2) { rc(ctx, '#ffb03a', x - 23, y - 10, 2, 2); rc(ctx, '#ffb03a', x + 20, y - 11, 2, 1); }
  },
  // the hero on the roof of the car as it reverses flat out. over a hole, the road it will have driven on is still there
  riding(ctx, x, y, f, s, hero) {
    const px = s.dist + PX0, over = s.fly && s.gaps && s.gaps.some((g) => g.x < px + 20 * 256 && g.x + g.w > px - 20 * 256) && s.onGround;
    if (over) for (let k = -3; k <= 3; k++) { const dy = Math.round(Math.sin(f / 5 + k * 1.9) * 1.5); ctx.globalAlpha = 0.9 - Math.abs(k) * 0.16; rc(ctx, O, x + k * 9 - 5, y + dy - 1, 10, 6); rc(ctx, '#8a8270', x + k * 9 - 4, y + dy, 8, 4); rc(ctx, BLUE_HI, x + k * 9 - 4, y + dy, 8, 1); } ctx.globalAlpha = 1;
    for (let k = 0; k < 5; k++) {                       // its exhaust, coming back to it
      const a = ((f * 2 + k * 13) % 64) / 64, r = 1 + Math.round((1 - a) * 2), cx = x + 27 + (1 - a) * 24, cy = y - 4 - (1 - a) * (3 + (k % 3) * 4);
      dsc(ctx, cx, cy, r + 1, O); dsc(ctx, cx, cy, r, k % 2 ? '#dce8f4' : BLUE_HI);
    }
    drawCar(ctx, x, y, f, -1);
    ctx.drawImage(hero.c, Math.round(x + 5 - hero.ox), Math.round(y - CARH - hero.oy));
  },
  // the one-hit "undo": a red arc turning forwards, a blue arc turning back
  shield(ctx, x, y, f) {
    const P = []; for (let h = 0; h < 2; h++) for (let i = 0; i < 22; i++) { const a = (h ? -1 : 1) * (f / 12 + i * 0.13); P.push([Math.round(x + Math.cos(a) * 14), Math.round(y - 16 + Math.sin(a) * 20), i > 18 ? '#ffffff' : h ? (i > 9 ? BLUE_HI : BLUE) : (i > 9 ? RED_HI : RED)]); }
    for (const [px, py] of P) rc(ctx, O, px - 1, py - 1, 4, 4);
    for (const [px, py, col] of P) rc(ctx, col, px, py, 2, 2);
  },
};

// ---------- THE BOSS: YOUR PAST SELF. Cross the turnstile room six times. The room forces your jumps; every crossing you made comes back at you.
// Rules: tenet-duo.js (pastInit / pastUpdate: no canvas, no imports). This file only draws it.
const GCOL = (k) => (k % 2 ? RED : BLUE);
function buildRoom() {
  const c = cv(BW, BH), x = c.getContext('2d'), n = noise(63);
  panels(x, 0, 0, BW, FL, { base: '#30333a', top: '#3b3e46', deep: '#1f2127', dark: '#2a2d33' }, 40, 23, n, 3);
  // the observation slit: safety glass, the harbour beyond
  x.fillStyle = '#000'; x.fillRect(51, 45, 218, 46); vgrad(x, 53, 47, 214, 42, ['#141c2a', '#243146', '#404f67', '#6c7888', '#4a586c', '#222e42']);
  x.fillStyle = '#1b212b'; for (const cx of [84, 226]) { x.fillRect(cx, 56, 2, 22); x.fillRect(cx + 14, 56, 2, 22); x.fillRect(cx - 14, 54, 52, 3); ln(x, cx + 8, 47, cx - 14, 54, '#1b212b'); ln(x, cx + 8, 47, cx + 37, 54, '#1b212b'); }
  x.fillStyle = '#1b212b'; x.fillRect(53, 78, 214, 2); for (let i = 110; i < 200; i += 11) { const h = 3 + Math.floor(n() * 3) * 4; x.fillStyle = STACK[Math.floor(n() * 5)]; x.fillRect(i, 78 - h, 10, h); }
  x.fillStyle = 'rgba(160,200,225,0.10)'; x.fillRect(53, 47, 214, 42); for (const a of [70, 96, 190, 246]) ln(x, a, 47, a - 12, 88, 'rgba(255,255,255,0.08)');
  x.fillStyle = '#5a5e68'; for (const i of [51, 104, 213, 267]) x.fillRect(i, 45, 2, 46); x.fillStyle = '#70747e'; x.fillRect(51, 45, 218, 1); x.fillStyle = '#16181d'; x.fillRect(51, 90, 218, 1);
  // ceiling: services, a red pipe and a blue pipe, strip lights
  x.fillStyle = '#16181d'; x.fillRect(0, 0, BW, 22); x.fillStyle = '#3e424c'; x.fillRect(0, 21, BW, 1); x.fillStyle = '#7a2e28'; x.fillRect(0, 24, 158, 2); x.fillStyle = '#2a4a78'; x.fillRect(162, 24, 158, 2);
  for (let i = 40; i < BW; i += 60) { const L = i < 160; x.fillStyle = '#000'; x.fillRect(i - 15, 27, 30, 5); x.fillStyle = L ? RED : BLUE; x.fillRect(i - 14, 28, 28, 3); x.fillStyle = L ? RED_HI : BLUE_HI; x.fillRect(i - 14, 28, 28, 1); glow(x, i, 34, 26, L ? RED : BLUE, 0.2); }
  // the two halves: big stencils and a wash of light
  x.globalAlpha = 0.5; drawText(x, 'FORWARD', 56, 100, { scale: 2, fill: '#7a2e28', outline: null }); drawText(x, 'INVERTED', 172, 100, { scale: 2, fill: '#2a4a78', outline: null }); x.globalAlpha = 1;
  x.fillStyle = 'rgba(224,58,42,0.10)'; x.fillRect(0, 0, 160, FL); x.fillStyle = 'rgba(58,138,224,0.11)'; x.fillRect(160, 0, 160, FL);
  stripes(x, 0, 150, BW, 4, '#8a7430', '#16181d'); x.fillStyle = '#1c1e24'; x.fillRect(0, 154, BW, 6); x.fillStyle = '#50545d'; x.fillRect(0, 154, BW, 1);
  // the glass wall between the halves, bullet-holed
  x.fillStyle = '#000'; x.fillRect(154, 22, 12, 5); x.fillStyle = '#5a5e68'; x.fillRect(155, 22, 10, 4);
  x.fillStyle = 'rgba(190,225,245,0.20)'; x.fillRect(157, 27, 6, 133); x.fillStyle = 'rgba(255,255,255,0.55)'; x.fillRect(157, 27, 1, 133); x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(162, 27, 1, 133); x.fillStyle = RED; x.fillRect(156, 27, 1, 133); x.fillStyle = BLUE; x.fillRect(163, 27, 1, 133);
  for (const hy of [52, 96, 128]) { x.fillStyle = '#05070a'; x.fillRect(159, hy, 2, 2); x.fillStyle = 'rgba(255,255,255,0.7)'; x.fillRect(158, hy - 2, 1, 2); x.fillRect(161, hy + 2, 1, 2); x.fillRect(160, hy - 3, 1, 2); x.fillRect(159, hy + 3, 1, 2); }
  // the floor: wet concrete, a lane line, reflections of the lights
  for (let j = FL; j < BH; j++) for (let i = 0; i < BW; i++) { const w = hash(i, j * 5) > 0.55 && (i + j) % 2; x.fillStyle = j === FL ? '#b2bac6' : j === FL + 1 ? '#6e7582' : w ? (i < 160 ? '#5a2c2a' : '#2c4466') : dith(['#474b54', '#3a3d45', '#2a2d34', '#1c1e24'], (j - FL) / 20, i, j); x.fillRect(i, j, 1, 1); }
  x.fillStyle = '#b89a34'; for (let i = 44; i < 280; i += 28) x.fillRect(i, FL + 7, 16, 2);
  // the back halves of the two turnstiles (the cages in front are drawn live, over the hero)
  for (const [mx, col, lo, pal] of [[12, RED, RED_LO, ['#1a0b0d', '#3a1315', '#561a18', '#3a1315']], [308, BLUE, BLUE_LO, ['#090f1e', '#11224a', '#183a6c', '#11224a']]]) {
    x.fillStyle = '#000'; x.fillRect(mx - 23, 88, 46, 72); x.fillStyle = '#464a54'; x.fillRect(mx - 22, 89, 44, 71);
    vgrad(x, mx - 19, 103, 38, 57, pal); glow(x, mx, 132, 20, col, 0.45);
    x.fillStyle = '#5e626c'; x.fillRect(mx - 22, 89, 44, 12); x.fillStyle = '#8a8e98'; x.fillRect(mx - 22, 89, 44, 1); x.fillStyle = '#2e3138'; x.fillRect(mx - 22, 101, 44, 2);
    stripes(x, mx - 20, 96, 40, 4); x.fillStyle = '#000'; x.fillRect(mx - 5, 90, 10, 6); x.fillStyle = lo; x.fillRect(mx - 4, 91, 8, 4);
    x.fillStyle = '#16181d'; x.fillRect(mx - 1, 103, 2, 57);
  }
  return c;
}
function pastSelf(B) {
  const H = B.hero, ROOM = buildRoom(), NX = PS.NX, HOT = '#fff4c0', YEL = '#ffd21a';
  // the ghosts: the hero's own frames in red or blue, both ways round; and flat silhouettes for the tell and the hero's glow
  const set = (col, a) => { const t = (fr) => tint(fr, col, a), R = { run: H.run.map(t), jump: t(H.jump), fall: t(H.fall) }; return [R, { run: R.run.map(flip), jump: flip(R.jump), fall: flip(R.fall) }]; };
  const GH = [set('#3a8aff', 0.6), set('#ff3a2a', 0.6)], SIL = [set(BLUE_HI, 1), set(RED_HI, 1)], WHITE = set('#ffffff', 1), PARA = set('#f08aff', 1);
  const pose = (S, face, air, f) => { const s = S[face > 0 ? 0 : 1]; return air ? (air < 0 ? s.jump : s.fall) : s.run[f & 7]; };
  const at = (g, tau) => g.rec[Math.max(0, Math.min(g.rec.length - 1, g.rev ? g.rec.length - 1 - tau : tau))];
  // one ghost, as it is at ghost-time tau: where, and which frame (it runs BACKWARDS: it faces away from where it is going)
  const ghostAt = (g, tau) => { const p = at(g, tau), q = at(g, tau - 1), dir = Math.sign(at(g, tau + 6)[0] - at(g, Math.max(0, tau - 6))[0]) || 1; return { x: p[0], y: p[1], face: -dir, air: p[1] < FL - 0.5 ? (p[1] > q[1] ? -1 : 1) : 0 }; };
  const cage = (ctx, mx, a, col, front) => {             // the revolving cage of a turnstile: front or back half of its bars
    for (let k = 0; k < 6; k++) { const an = a + (k * TAU) / 6, z = Math.cos(an), bx = Math.round(mx + Math.sin(an) * 18); if ((z > 0) !== front) continue; ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, 103, 3, 57); ctx.fillStyle = front ? '#aab0bc' : '#3e424c'; ctx.fillRect(bx, 103, 1, 57); if (front) { ctx.fillStyle = col; ctx.fillRect(bx, 118, 1, 4); ctx.fillRect(bx, 140, 1, 4); } }
  };
  // ---- what the room throws: all bright, black-edged, with a hot rim on the edge that hurts ----
  const box = (w, h, body, lite, dark) => {             // a cargo case: steel corners, a hazard band, a hot lid
    const c = cv(w, h), x = c.getContext('2d'); rc(x, body, 0, 0, w, h); rc(x, lite, 0, 0, w, 2); rc(x, dark, 0, h - 2, w, 2); rc(x, dark, w - 2, 2, 2, h - 4); rc(x, lite, 0, 2, 1, h - 4);
    stripes(x, 1, (h >> 1) - 2, w - 2, 4, YEL, '#16181d'); for (const [a, b] of [[0, 0], [w - 3, 0], [0, h - 3], [w - 3, h - 3]]) { rc(x, '#3a3e48', a, b, 3, 3); rc(x, '#c8ccd4', a + 1, b + 1, 1, 1); }
    rc(x, HOT, 1, 0, w - 2, 1); return outlined(c);
  };
  const CRATE = box(16, 14, '#c0562a', '#f08a4a', '#7a3018'), CRATE2 = box(16, 16, '#3a6a9a', '#6aa8d8', '#1e3c5c');
  const cart = (() => { const c = cv(7, 9), x = c.getContext('2d'); rc(x, '#5a5e68', 0, 2, 7, 7); rc(x, '#aab0bc', 0, 2, 7, 1); stripes(x, 0, 5, 7, 3, YEL, '#16181d'); rc(x, '#ff3a2a', 2, 0, 3, 3); rc(x, HOT, 3, 0, 1, 1); return outlined(c); })();
  const LY = { pit: 22, crate: 42, cart: 42, sweep: 36, low: 24 };    // every sign says the same thing: JUMP
  const label = (ctx, st, hz, r) => {                     // first time round only: one word over each thing
    if (st.lap || r > hz.re + 2 || r < hz.re - 150 || (hz.fire > -999 && r < hz.fire - PS.TELLR)) return; const x = hz.mv >= 5 ? hz.x : hazX(hz, r); if (x < 20 || x > BW - 20) return;
    drawText(ctx, 'JUMP', Math.max(34, Math.min(BW - 34, Math.round(x))), FL - (LY[hz.k] || 40), { fill: GRAD.gold, outline: '#000', align: 'center' });
  };
  const chev = (ctx, x, y, col, down) => { for (let i = -3; i <= 3; i++) rc(ctx, O, x + i, y + (down ? 3 - Math.abs(i) : Math.abs(i)) - 1, 1, 4); for (let i = -3; i <= 3; i++) rc(ctx, col, x + i, y + (down ? 3 - Math.abs(i) : Math.abs(i)), 1, 2); };
  function pit(ctx, st, hz, r, f) {
    const w = hz.w, l = Math.round(hz.x - w / 2), k = Math.max(0, Math.min(1, (r - (hz.re - 75)) / 8, (hz.re + 40 - r) / 8)), side = hz.x < 160 ? RED : BLUE;
    if (k <= 0) {                                         // shut: the seams of the panel, blinking before it goes
      if (r > hz.re) return; const on = r > hz.re - 110 ? (f >> 2) % 2 : (f >> 4) % 2;
      stripes(ctx, l, FL, w, 2, on ? YEL : '#8a7430', '#16181d'); rc(ctx, O, l - 2, FL - 2, 4, 4); rc(ctx, O, l + w - 2, FL - 2, 4, 4); rc(ctx, on ? '#ff5a3a' : '#5a1a16', l - 1, FL - 1, 2, 2); rc(ctx, on ? '#ff5a3a' : '#5a1a16', l + w - 1, FL - 1, 2, 2);
      return;
    }
    rc(ctx, O, l, FL, w, 20); for (let j = 0; j < 6; j++) { ctx.globalAlpha = 0.12 + j * 0.11; rc(ctx, side, l + 2, FL + 8 + j * 2, w - 4, 2); } ctx.globalAlpha = 1;
    const d = Math.round(k * 13); rc(ctx, '#2a2e36', l, FL, 3, d + 1); rc(ctx, '#6e7582', l, FL, 1, d + 1); rc(ctx, '#2a2e36', l + w - 3, FL, 3, d + 1); rc(ctx, '#6e7582', l + w - 1, FL, 1, d + 1);     // the two flaps hanging down
    for (let i = 0; i < 3; i++) rc(ctx, '#ffffff', l + 5 + ((i * 13 + (f >> 2)) % Math.max(4, w - 10)), FL + 12 + i * 2, 2, 1);
    rc(ctx, O, l - 9, FL - 2, 9, 6); rc(ctx, O, l + w, FL - 2, 9, 6); stripes(ctx, l - 8, FL - 1, 8, 4, YEL, '#16181d'); stripes(ctx, l + w, FL - 1, 8, 4, YEL, '#16181d'); rc(ctx, HOT, l - 2, FL - 1, 2, 9); rc(ctx, HOT, l + w, FL - 1, 2, 9);
  }
  function hazard(ctx, st, hz, r, f) {
    const x = Math.round(hazX(hz, r)), w = hz.w, hit = st.ct - hz.hitT < 10 && (f >> 1) % 2, dirn = hz.dir;
    if (hz.k === 'cart') {                              // two crates on a dolly, sparks off its wheels
      if (x < -20 || x > BW + 20) return;
      for (let i = 0; i < 4; i++) rc(ctx, i % 2 ? HOT : '#ff8a3a', x + dirn * (16 + ((f * 2 + i * 5) % 12)), FL - 1 - (i % 2), 2, 1);
      rc(ctx, O, x - 16, FL - 4, 32, 4); rc(ctx, '#5a5e68', x - 15, FL - 3, 30, 2); rc(ctx, '#aab0bc', x - 15, FL - 3, 30, 1);
      ctx.drawImage(CRATE, x - 17, FL - 18); ctx.drawImage(CRATE, x - 1, FL - 18);
      if (hit) { ctx.globalAlpha = 0.6; rc(ctx, '#ffffff', x - 15, FL - 16, 30, 14); ctx.globalAlpha = 1; }
      if (r < hz.re) chev(ctx, x, FL - 28 - ((f >> 2) % 3), HOT);
    } else if (hz.k === 'crate' || hz.k === 'stack') {
      if (x < -12 || x > BW + 12) return;
      for (let i = 0; i < 4; i++) rc(ctx, i % 2 ? HOT : '#ff8a3a', x + dirn * (10 + ((f * 2 + i * 5) % 12)), FL - 1 - (i % 2), 2, 1);      // sparks: they trail AHEAD of it
      if (hz.k === 'stack') ctx.drawImage(CRATE2, x - 9, FL - 34);
      ctx.drawImage(CRATE, x - 9, FL - 16);
      if (hit) { ctx.globalAlpha = 0.6; rc(ctx, '#ffffff', x - 8, FL - (hz.k === 'stack' ? 32 : 14), 16, hz.k === 'stack' ? 32 : 14); ctx.globalAlpha = 1; }
      if (r < hz.re) { chev(ctx, x, FL - (hz.k === 'stack' ? 44 : 26) - ((f >> 2) % 3), HOT); if (hz.k === 'stack') chev(ctx, x, FL - 50 - ((f >> 2) % 3), HOT); }
    } else if (hz.k === 'sweep') {
      const l = x - (w >> 1); if (l > BW + 8 || l + w < -8) return;
      ctx.globalAlpha = 0.25; rc(ctx, '#ff3a2a', l, FL - 9, w, 9); ctx.globalAlpha = 1;
      rc(ctx, O, l, FL - 6, w, 5); rc(ctx, (f >> 1) % 2 ? '#ff3a2a' : '#ff6a4a', l, FL - 5, w, 3); rc(ctx, HOT, l, FL - 4, w, 1);
      for (let i = 0; i < 5; i++) rc(ctx, '#ffffff', l + ((i * 17 + f * 3) % w), FL - 7 - (i % 2), 1, 1);
      ctx.drawImage(cart, l - 6, FL - 11); ctx.drawImage(cart, l + w - 3, FL - 11);
      if (r < hz.re) { const b = (f >> 2) % 3; chev(ctx, x, FL - 20 - b, HOT); chev(ctx, x, FL - 26 - b, HOT); }
    } else if (hz.k === 'bar') {
      const l = x - (w >> 1); if (l > BW + 8 || l + w < -8) return;
      for (const rx of [l + 6, l + w - 8]) { rc(ctx, O, rx - 1, 22, 4, FL - 44 - 22); rc(ctx, '#70747e', rx, 22, 2, FL - 44 - 22); }
      rc(ctx, O, l + 2, 21, w - 4, 6); rc(ctx, '#5a5e68', l + 3, 22, w - 6, 4); rc(ctx, '#aab0bc', l + 3, 22, w - 6, 1);                     // the trolley on the ceiling rail
      rc(ctx, O, l - 1, FL - 46, w + 2, 11); stripes(ctx, l, FL - 45, w, 8, YEL, '#16181d'); rc(ctx, HOT, l, FL - 37, w, 1); rc(ctx, '#ffffff', l, FL - 45, w, 1);
      ctx.globalAlpha = 0.18; rc(ctx, YEL, l, FL - 36, w, 5); ctx.globalAlpha = 1;
      if (r < hz.re) chev(ctx, x, FL - 30 + ((f >> 2) % 3), '#8ac8ff', true);
    } else {                                              // an inverted round: a sight line, then it comes back up the room
      const y = hz.k === 'low' ? FL - 6 : FL - 38, far = dirn > 0 ? PS.R : PS.L, near = dirn > 0 ? PS.L : PS.R;
      if (r >= hz.fire - PS.TELLR && r < hz.re + 12) {
        const hot = r >= hz.fire - 18; ctx.globalAlpha = r < hz.fire ? 0.9 : 0.35;
        for (let i = 16; i < BW - 16; i += 6) if (((i / 6 + (f >> 1)) & 1) || hot) rc(ctx, hot ? '#ffffff' : YEL, i, y, 3, 1);
        ctx.globalAlpha = 1;
        if (r < hz.fire) { rc(ctx, O, far - 5, y - 4, 10, 9); rc(ctx, (f >> 1) % 2 ? YEL : '#ff5a3a', far - 4, y - 3, 8, 7); rc(ctx, HOT, far - 1, y - 1, 2, 3); }
        if (r < hz.re) chev(ctx, Math.round(hz.x), hz.k === 'low' ? y - 9 - ((f >> 2) % 3) : y + 6 + ((f >> 2) % 3), hz.k === 'low' ? HOT : '#8ac8ff', hz.k !== 'low');
      }
      if (r >= hz.fire && (x - near) * dirn > -4) {
        for (let t = 1; t < 7; t++) if ((t + (f >> 1)) % 2) rc(ctx, '#ffffff', x - dirn * (5 + t * 3), y + ((t >> 1) % 2) - 1, 2, 1);                // its smoke is out in FRONT of it
        rc(ctx, O, x - 6, y - 3, 12, 6); rc(ctx, '#ffd06a', x - 5, y - 2, 10, 4); rc(ctx, HOT, x - 5, y - 2, 10, 1); rc(ctx, '#e03a2a', x + dirn * 4, y - 2, 2, 4);
        ctx.globalAlpha = 0.5; for (let t = 1; t < 5; t++) rc(ctx, YEL, x + dirn * (6 + t * 4), y - 1, 3, 2); ctx.globalAlpha = 1;
      }
      if (r >= hz.fire && r < hz.fire + 5) { ctx.globalAlpha = 0.8; dsc(ctx, far, y, 9 - (r - hz.fire), '#ffffff'); ctx.globalAlpha = 1; }
    }
  }
  const K = { hurt, win, pop };
  return {
    name: 'YOUR PAST SELF', tip: "DON'T TOUCH THE INVERTED YOU", tips: ["DON'T TOUCH THE INVERTED YOU", 'TAP TO JUMP'], hero: 'run', heroX: 12,
    init: pastInit,
    update(st, inp) { pastUpdate(st, inp, K); },
    stage(ctx, st, f) {
      ctx.drawImage(ROOM, 0, 0);
      const dirn = st.n % 2 ? 1 : -1, r = st.ct - st.HT;
      // strip lights breathing, the lamp over each machine, the backwards clock
      const k = 0.5 + 0.5 * Math.sin(f / 19); ctx.globalAlpha = 0.05 + 0.05 * k; ctx.fillStyle = RED; ctx.fillRect(0, 22, 157, 138); ctx.globalAlpha = 0.05 + 0.05 * (1 - k); ctx.fillStyle = BLUE; ctx.fillRect(163, 22, 157, 138); ctx.globalAlpha = 1;
      const tellAt = [false, false]; for (const g of st.ghosts) if (!g.dead && !g.done && st.ct < g.s && st.ct >= g.s - PS.TELLG) tellAt[dirn > 0 ? 1 : 0] = true;
      [[12, RED, RED_HI], [308, BLUE, BLUE_HI]].forEach(([mx, col, hi], i) => {
        const mine = (i === 0) === (dirn > 0) && st.phase === 'hold' && !st.won;
        if (mine) { const left = r < -60 ? 3 : r < -30 ? 2 : 1; ctx.fillStyle = '#000'; ctx.fillRect(mx - 11, 90, 22, 6); for (let q = 0; q < 3; q++) { ctx.fillStyle = q < left ? (q === left - 1 && (f >> 2) % 2 ? '#ffffff' : hi) : '#2a2a2a'; ctx.fillRect(mx - 10 + q * 7, 91, 6, 4); } return; }   // three lamps count him out
        const on = st.lock ? false : tellAt[i] ? (f >> 2) % 2 : (f >> 5) % 2; ctx.fillStyle = on ? hi : col; ctx.fillRect(mx - 4, 91, 8, 4); if (tellAt[i] && on) { ctx.globalAlpha = 0.25; ctx.fillStyle = col; ctx.fillRect(mx - 22, 103, 44, 57); ctx.globalAlpha = 1; }
      });
      disc(ctx, 160, 36, 8, '#000'); disc(ctx, 160, 36, 7, '#b4bac4'); const a1 = (dirn * f) / 40, a2 = (dirn * f) / 480;
      ln(ctx, 160, 36, Math.round(160 + Math.sin(a2) * 3), Math.round(36 - Math.cos(a2) * 3), '#16181d'); ln(ctx, 160, 36, Math.round(160 + Math.sin(a1) * 5), Math.round(36 - Math.cos(a1) * 5), dirn > 0 ? RED : BLUE);
      cage(ctx, 12, st.spin[0], RED, false); cage(ctx, 308, st.spin[1], BLUE, false);
      // dust: it falls when you run forward, and rises when you are inverted
      for (let i = 0; i < 14; i++) { const yy = (((dirn * f * 0.4 + i * 37) % 132) + 132) % 132; ctx.fillStyle = i % 2 ? '#8a8e98' : dirn > 0 ? RED_HI : BLUE_HI; ctx.globalAlpha = 0.5; ctx.fillRect((i * 53 + 31) % 300 + 10, 24 + Math.round(yy), 1, 1); } ctx.globalAlpha = 1;
      if (!st.won) for (const hz of st.haz) if (hz.k === 'pit') pit(ctx, st, hz, r, f);
    },
    draw(ctx, st, f) {
      const h = st.h, me = st.n % 2, dirn = me ? 1 : -1, r = st.ct - st.HT;
      if (!st.won) for (const hz of st.haz) if (hz.k !== 'pit') hazard(ctx, st, hz, r, f);
      // where each past self will be when it reaches you: a still outline at that spot and that height, until it has gone by
      for (const g of st.ghosts) {
        if (g.dead || g.done || g.fizz || r > g.mr) continue;
        const air = g.my < FL - 0.5, col = GCOL(g.k), x = Math.round(g.mx), y = Math.round(g.my), near = g.mr - r < 40;
        ctx.globalAlpha = near ? 0.5 : 0.22 + 0.08 * ((f >> 3) % 2); put(ctx, pose(SIL[g.k % 2], dirn, air ? -1 : 0, 2), x, y); ctx.globalAlpha = 1;
        rc(ctx, O, x - 5, FL + 2, 11, 3); rc(ctx, col, x - 4, FL + 3, 9, 1);
        if (air) for (let j = y + 2; j < FL; j += 3) rc(ctx, col, x, j, 1, 1);
      }
      for (const g of st.ghosts) {
        if (g.dead || g.done) continue;
        const tau = st.ct - g.s, S = g.fizz ? PARA : GH[g.k % 2], col = g.fizz ? '#f08aff' : GCOL(g.k);
        if (tau < 0) {                                  // the tell: a silhouette flickering in the far turnstile
          if (tau < -PS.TELLG) continue;
          const p = at(g, 0), on = (f >> 1) % 2;
          ctx.globalAlpha = 0.25 + 0.75 * (1 + tau / PS.TELLG); put(ctx, pose(on ? WHITE : g.fizz ? PARA : SIL[g.k % 2], dirn, 0, 2), p[0], p[1]); ctx.globalAlpha = 1;
          if ((f >> 3) % 2) drawText(ctx, '!', p[0] + (dirn > 0 ? -14 : 10), p[1] - 46, { fill: GRAD.gold, outline: '#000' });
          continue;
        }
        if (g.fizz) {                                   // a paradox: it cannot hold together
          const q = ghostAt(g, tau), jx = ((f * 7) % 5) - 2; if ((f + tau) % 3 === 0) continue;
          ctx.globalAlpha = 0.85 - tau * 0.02; put(ctx, pose((f >> 1) % 2 ? WHITE : PARA, q.face, q.air, 7 - ((f >> 2) & 7)), q.x + jx, q.y); ctx.globalAlpha = 1;
          for (let j = 0; j < 4; j++) rc(ctx, '#f08aff', q.x - 8 + hash(f, j) * 16, q.y - 34 + hash(j, f) * 32, 5, 1);
          continue;
        }
        for (let k = 3; k > 0; k--) { const q = ghostAt(g, tau - k * 5); ctx.globalAlpha = 0.14 * (4 - k) * 0.6; put(ctx, pose(S, q.face, q.air, 7 - (((f - k * 5) >> 2) & 7)), q.x, q.y); }
        ctx.globalAlpha = 1; const q = ghostAt(g, tau), fr = 7 - ((f >> 2) & 7);
        const OL = pose(SIL[g.k % 2], q.face, q.air, fr); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) put(ctx, OL, q.x + dx, q.y + dy);
        put(ctx, pose(S, q.face, q.air, fr), q.x, q.y);
        if ((f >> 2) % 3 === 0) { ctx.fillStyle = col; ctx.fillRect(Math.round(q.x - 7 + hash(f, g.k) * 14), Math.round(q.y - 30 + hash(g.k, f) * 28), 2, 1); }
      }
      for (const g of st.gone) {                        // ones that have just gone: touched (a burst), a paradox (it flies apart), or left behind (a fade)
        const q = ghostAt(g, g.tau), a = g.fade / 20;
        if (g.hit || g.par) { const n = g.par ? 14 : 8, R = (g.par ? 30 : 22) - g.fade; ctx.fillStyle = (g.fade >> 1) % 2 ? '#ffffff' : g.par ? '#f08aff' : GCOL(g.k); for (let k = 0; k < n; k++) ctx.fillRect(Math.round(q.x + Math.cos(k * (TAU / n)) * R), Math.round(q.y - 15 + Math.sin(k * (TAU / n)) * R), 2, 2); if (g.par && g.fade > 12) { ctx.globalAlpha = 0.6; put(ctx, pose(WHITE, q.face, q.air, 2), q.x, q.y); ctx.globalAlpha = 1; } }
        else { ctx.globalAlpha = a * 0.7; put(ctx, pose(GH[g.k % 2], q.face, q.air, 2), q.x, q.y); ctx.globalAlpha = 1; }
      }
      // at the end the past selves fold back into you
      if (st.won && st.merge && st.mergeT < 36) { const u = st.mergeT / 36; for (const m of st.merge) { ctx.globalAlpha = 0.8 * (1 - u * 0.5); put(ctx, pose(GH[m.k % 2], -1, 0, (f >> 1) & 7), m.x + (h.x - m.x) * u * u, m.y); } ctx.globalAlpha = 1; }
      // you: rimmed in the colour you are running in
      if (!st.won && !(h.inv > 0 && (h.inv >> 2) % 2)) { const air = h.ground ? 0 : h.vy < 0 ? -1 : 1, OL = h.ground && !h.moving ? SIL[me][h.dir > 0 ? 0 : 1].run[2] : pose(SIL[me], h.dir, air, f >> 2); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) put(ctx, OL, h.x + dx, h.y + dy); }
    },
    front(ctx, st, f) {
      cage(ctx, 12, st.spin[0], RED, true); cage(ctx, 308, st.spin[1], BLUE, true);
      if (st.lock) for (const mx of [12, 308]) { ctx.globalAlpha = st.lock; ctx.fillStyle = '#000'; ctx.fillRect(mx - 20, 126, 40, 8); stripes(ctx, mx - 19, 127, 38, 6); ctx.globalAlpha = 1; }
      if (st.phase === 'hold' && st.ct < 40) { const mx = st.wallX, col = st.n % 2 ? RED : BLUE; ctx.globalAlpha = 0.5 * (1 - st.ct / 40); ctx.fillStyle = col; for (let r = 0; r < 3; r++) { const rr = 10 + st.ct * 2 + r * 12; ctx.fillRect(mx - rr, 131 - (rr >> 1), rr * 2, 2); ctx.fillRect(mx - rr, 131 + (rr >> 1), rr * 2, 2); } ctx.globalAlpha = 1; }
      if (st.flash > 0) { ctx.globalAlpha = Math.min(0.8, st.flash / 14); ctx.fillStyle = st.won ? '#ffffff' : st.n % 2 ? '#ffd0c8' : '#c8e0ff'; ctx.fillRect(0, 0, BW, BH); ctx.globalAlpha = 1; }
      if (!st.won) { const r = st.ct - st.HT; for (const hz of st.haz) label(ctx, st, hz, r); }
      pips(ctx, 'CROSSING', st.won ? NX : st.n - 1, NX, st.n % 2 ? RED : BLUE);
    },
  };
}

// ---------- 6. INVERSION ----------
export function skin(B, K, D) {
  const P = { base: '#5a6070', hi: '#a8b0bc', top: '#7a8496', deep: '#1e2028', dark: '#2a2e36', wall: '#3a3e48', lamp: '#ff4a3a', glow: '#4a9aff' };
  const WALL = buildWall(), WRK = buildWreck();
  const HOIST = cv(38, 18); { const n = noise(3); crate(HOIST.getContext('2d'), 1, 1, 36, 16, CT.rust, null, n); }
  // ---- baddies: inverted soldiers (blue, running backwards) and forward ones (red) ----
  const REDMAP = cmap([['#b8e0ff', '#ffc4b0'], ['#4a90e8', '#e0483a'], ['#1e4fa0', '#a0221c'], ['#0c2456', '#560e0c'], ['#2e6ac0', '#c03228'], ['#173a80', '#801814'], ['#081840', '#400806']]);
  const inv = B.soldier.map((f) => visor(f, '#5ac8ff', '#ffffff', '#e8f4ff')), fwd = B.soldier.map((f) => visor(recol(f, REDMAP), '#ff3a2a', '#ffd0c0', '#fff0e0'));
  const back = inv.slice().reverse();                 // the inverted ones come at you running backwards
  const twin = B.twin.map(flip), blue = (o) => tintAll(o, '#4a9aff', 0.3);
  const chr = { grunt: back, puker: fwd, brute: twin.slice(0, 4).map((f) => scaleFr(f, 1.3)), bruteDizzy: tint(scaleFr(twin[0], 1.3), '#ffffff', 0.4), brutePuke: [scaleFr(twin[2], 1.3)], ghoul: { sit: back[0], leap: back[3], land: back[5] },
    slime: drum(1), slimeSmall: drum(0.6), biker: forklift(), batF: GULL, batFlashF: tint(GULL[0], '#ffffff', 0.85), unicornFly: DRONE, flyFlash: tint(DRONE[0], '#ffffff', 0.85),
    unicorn: [fwd[0]], unicornPuke: fwd[4], unicornFlash: tint(fwd[0], '#ffffff', 0.8) };
  // the level's own cast (see the DANGERS block above): the kneeling marksman who catches his bullets, and soldiers on their own air who back away from you
  const GM = buildGunman(inv[0]);
  chr.gunner = { idle: GM[0], aim: GM[1], fire: GM[2] };
  chr.backer = B.soldier.map((f) => visor(airTank(f), '#5ac8ff', '#ffffff', '#e8f4ff')).reverse();
  // THERE AND BACK (danger.film, see sim.js spawnFilm): out through the hangar, the motorway and the battlefield to the turnstile at `mid`, then back through the same places
  const danger = filmDanger(ZONE_PX);              // (tenet-duo.js: sized from the level's length)
  const GR = buildGunman(fwd[0]);                     // the same marksman on the way out: red, and his bullet goes the usual way
  const labels = { ride: 'REVERSE GEAR!', shield: 'UNDO!', bomb: 'TEMPORAL PINCER!' };

  // ---- live details on the wall (tx = position in the 384 tile) ----
  function wallFx(ctx, base, Y, f) {
    const on = (tx) => base + tx > -50 && base + tx < 370;
    PILX.forEach((X, k) => {                            // strip lights: red and blue breathe in turn
      if (!on(X)) return; const b = k % 2, lit = 0.5 + 0.5 * Math.sin(f / 21 + (b ? Math.PI : 0));
      ctx.fillStyle = b ? BLUE : RED; ctx.globalAlpha = 0.35 + 0.65 * lit; ctx.fillRect(base + X + 4, Y(132), 2, 44); ctx.globalAlpha = 0.04 + 0.05 * lit; for (let r = 2; r < 9; r += 2) ctx.fillRect(base + X + 5 - r, Y(131) + r, r * 2, 46 - r * 2); ctx.globalAlpha = 1;
      if (lit > 0.6) { ctx.fillStyle = b ? BLUE_HI : RED_HI; ctx.fillRect(base + X + 4, Y(132), 1, 44); }
    });
    if (on(150)) WALL.cracks.forEach((rays, i) => {    // the glass: cracks spread from each bullet hole, then run back and the hole heals
      const p = ((f + i * 83) % 330) / 330, c = p < 0.12 ? 0 : p < 0.42 ? (p - 0.12) / 0.3 : p < 0.6 ? 1 : p < 0.9 ? 1 - (p - 0.6) / 0.3 : 0; if (c <= 0) return;
      const [hx0, hy0] = HOLES[i]; ctx.fillStyle = '#dce8f4';
      for (const pts of rays) { const m = Math.ceil(pts.length * c); for (let s = 0; s < m; s++) { ctx.globalAlpha = 0.85 - (s / pts.length) * 0.45; ctx.fillRect(base + pts[s][0], Y(pts[s][1]), 1, 1); } }
      ctx.globalAlpha = 1; ctx.fillStyle = '#05070a'; ctx.fillRect(base + hx0, Y(hy0), 2, 2); ctx.fillStyle = '#ffffff'; ctx.fillRect(base + hx0 - 1, Y(hy0) - 1, 1, 1); ctx.fillRect(base + hx0 + 2, Y(hy0) + 2, 1, 1);
      if ((p > 0.12 && p < 0.14) || (p > 0.88 && p < 0.9)) { ctx.fillStyle = '#ffffff'; ctx.fillRect(base + hx0 - 2, Y(hy0), 6, 2); ctx.fillRect(base + hx0, Y(hy0) - 2, 2, 6); }
    });
    if (on(247)) [[228, 1, RED, RED_HI], [266, -1, BLUE, BLUE_HI]].forEach(([cx, d, col, hi]) => {   // the turnstile: its two chambers revolve opposite ways
      for (let k = 0; k < 4; k++) { const a = (d * f) / 46 + (k * TAU) / 4, z = Math.cos(a), bx = base + Math.round(cx + Math.sin(a) * 15); ctx.fillStyle = z > 0 ? '#9aa0ac' : '#34383f'; ctx.fillRect(bx, Y(141), 1, 46); if (z > 0) { ctx.fillStyle = hi; ctx.fillRect(bx, Y(150), 1, 3); ctx.fillRect(bx, Y(172), 1, 3); } }
      const lit = (f >> 4) % 2 === (d > 0 ? 0 : 1); ctx.fillStyle = lit ? hi : col; ctx.fillRect(base + cx - 13, Y(129), 6, 4); if (d < 0) { ctx.fillStyle = '#464a54'; ctx.fillRect(base + cx - 13, Y(129), 6, 4); ctx.fillStyle = lit ? hi : col; ctx.fillRect(base + 273, Y(129), 6, 4); }
    });
    if (on(373)) {                                      // the clock: backwards
      const cx = base + 373, cy = Y(138), a1 = -f / 34, a2 = -f / 400;
      ln(ctx, cx, cy, Math.round(cx + Math.sin(a2) * 4), Math.round(cy - Math.cos(a2) * 4), '#16181d'); ln(ctx, cx, cy, Math.round(cx + Math.sin(a1) * 6), Math.round(cy - Math.cos(a1) * 6), '#c0302a'); ctx.fillStyle = '#16181d'; ctx.fillRect(cx, cy, 1, 1);
    }
    if (on(219)) {                                      // the hoist: the same lift, down and up, down and up
      const sy = Y(74 + Math.round(Math.sin(f / 70) * 8)), bx = base + 201;
      ctx.fillStyle = '#16181d'; ctx.fillRect(bx + 6, Y(61), 1, sy - Y(61)); ctx.fillRect(bx + 31, Y(61), 1, sy - Y(61));
      ctx.fillStyle = '#000'; ctx.fillRect(bx, sy, 38, 4); ctx.fillStyle = '#b0902c'; ctx.fillRect(bx + 1, sy + 1, 36, 2); ctx.fillStyle = '#e8d070'; ctx.fillRect(bx + 1, sy + 1, 36, 1); ctx.drawImage(HOIST, bx, sy + 3);
      const bl = (f >> 5) % 2; ctx.fillStyle = bl ? '#ff5a40' : '#5a1a16'; ctx.fillRect(base + 219, Y(38), 3, 3); if (bl) { ctx.globalAlpha = 0.18; ctx.fillStyle = RED; ctx.fillRect(base + 214, Y(33), 13, 12); ctx.globalAlpha = 1; }
    }
    for (const [mx, col] of [[114, RED], [344, BLUE]]) if (on(mx)) { const lit = 0.5 + 0.5 * Math.sin(f / 21 + (col === BLUE ? Math.PI : 0)); ctx.globalAlpha = 0.06 + 0.08 * lit; ctx.fillStyle = col; for (let r = 4; r < 20; r += 5) ctx.fillRect(base + mx + 8 - r, Y(55) - (r >> 1), r * 2, r); ctx.globalAlpha = 1; }
  }
  // ---- live backdrop: the building on the far quay that un-explodes and re-explodes; smoke going back down the freighter's funnel ----
  function backFx(ctx, f, fdist, cam) {
    const off = Math.round((((fdist * 0.22) % MIDW) + MIDW) % MIDW), top = Math.round(29 - cam * 0.55);
    const sx = (X) => { let v = (((X - off) % MIDW) + MIDW) % MIDW; if (v > 420) v -= MIDW; return v; };
    const fx = sx(FUNNEL[0]), fy = top + FUNNEL[1];
    if (fx > -90 && fx < 340) for (let k = 0; k < 7; k++) {
      const a = ((f * 0.5 + k * 19) % 133) / 133, r = Math.round(1 + (1 - a) * 6);
      ctx.globalAlpha = 0.16 + 0.5 * a; disc(ctx, fx + (1 - a) * 46 + Math.sin(k * 2.3 + a * 5) * 3, fy - 2 - (1 - a) * 24 - Math.sin(a * 3) * 3, r, k % 2 ? '#252d39' : '#1a212b');
    }
    ctx.globalAlpha = 1;
    const bx = sx(WRECK), by = top + QUAY - WRK.H;
    if (bx < -170 || bx > 440) return;
    const p = (f % 780) / 780, u = p < 0.22 ? 0 : p < 0.48 ? (p - 0.22) / 0.26 : p < 0.56 ? 1 : p < 0.82 ? 1 - (p - 0.56) / 0.26 : 0, d = 1 - (1 - u) * (1 - u);   // 0 = standing, 1 = blown apart; the same curve both ways
    ctx.drawImage(WRK.c, 0, WRK.split, WRK.W, WRK.H - WRK.split, bx, by + WRK.split, WRK.W, WRK.H - WRK.split);
    if (d > 0) {
      ctx.fillStyle = '#3c4048'; for (let i = 0; i < WRK.W; i += 6) { const hh = 2 + Math.floor(hash(i, 3) * 9); ctx.fillRect(bx + i, by + WRK.split - hh, 3 + Math.floor(hash(i, 5) * 3), hh); }   // the torn floor left standing
      if (u < 0.5) { const k = u / 0.5, r = 5 + k * 30; ctx.globalAlpha = 0.85 * (1 - k); disc(ctx, bx + 36, by + 34, Math.round(r), '#8c4a30'); disc(ctx, bx + 36, by + 34, Math.round(r * 0.66), '#d08a4c'); if (k < 0.5) disc(ctx, bx + 36, by + 34, Math.round(r * 0.36), '#f0dca8'); ctx.globalAlpha = 1; }
      for (let k = 0; k < 5; k++) { ctx.globalAlpha = 0.5 * d; disc(ctx, bx + 18 + k * 9 + Math.sin(k * 1.7) * 6, by + 30 - d * (22 + k * 7), Math.round(4 + d * (5 + (k % 3) * 2)), '#232b37'); } ctx.globalAlpha = 1;
    }
    for (const c of WRK.chunks) ctx.drawImage(WRK.c, c.x, c.y, c.w, c.h, Math.round(bx + c.x + c.vx * d), Math.round(by + c.y + c.vy * d + 30 * d * d), c.w, c.h);
    if (d > 0) for (const b of WRK.bits) { ctx.fillStyle = b.s > 1 ? '#74787e' : '#a0a4a8'; ctx.fillRect(Math.round(bx + b.x + b.vx * d), Math.round(by + b.y + b.vy * d + 34 * d * d), b.s, b.s); }
  }
  // ---- the rain: sparse, and it falls UP ----
  function frontFx(ctx, f) {
    ctx.fillStyle = '#7a9ae8';
    for (let k = 0; k < 16; k++) { const t = f * (4 + (k % 3)) + k * 61, lap = Math.floor(t / 230), y = 196 - (t % 230), x = Math.floor(hash(k, lap) * 380) - 30 + (t % 230) * 0.24; ctx.globalAlpha = 0.55; ctx.fillRect(Math.round(x), y, 1, 3); ctx.fillRect(Math.round(x) - 1, y + 3, 1, 2); }
    ctx.globalAlpha = 1;
  }
  const z = { name: 'INVERSION', style: 'tenet', P, drip: LOOK.tenet, puddle: LOOK.tenet, drawPipe, sky: buildSky(), far: buildFar(), farY: -9, mid: buildMid(), midY: 29, near: blank(),
    arcade: blank(320, 8), arcadeTop: 36, backFx, deck: buildDeck(), pit: pitCycle(['#0b141f', '#0f1b29', '#13212f', '#182a3b', '#6c8ca6', '#22384c', '#182a3b', '#0f1b29'], 23), pitUp: 4, fg: blank(), particles: 'dockDust',
    extras: ['crumble', 'elevator', 'slider'], drawPlat, drawBlob: drawBullet, titleFill: GRAD.blue, tintCol: '#4a9aff', chr, danger, fx: FXT, labels, boss: pastSelf(B) };
  // the level's own picture (tenet-film.js): the wall, floor and pits drawn scene by scene, the mirror for the way back, the masked hero, the wash, his earlier self
  const FILM = film({ F: danger.film, chr, fwd: fwd.slice(), back: back.slice(), gunBlue: { idle: GM[0], aim: GM[1], fire: GM[2] }, gunRed: { idle: GR[0], aim: GR[1], fire: GR[2] }, WRK, drawCar, deck: z.deck, drawPlat, FXT });
  Object.assign(z, FILM);
  return z;
}
