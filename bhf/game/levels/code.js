import { cv, hash, put, tint, TAU, drawText, GRAD, noise, scaleFr, tintAll, sky, blank, pitCycle, LOOK, codeRain, arcadeCanvas, deckCanvas, px, panels } from '../kit.js';
import { BW, FL, box, hitR, hurt, win, pips } from '../bosskit.js';
import { codeDangers } from './code-art.js';
import { LOGO } from '../../../logo-masks.js';
import { agentBoss } from './code-boss.js';     // the boss: THE AGENT (a shootout, then a fist fight)

// ---------- 4. THE CODE: a simulated office lobby that is slightly wrong ----------
// glyphs: 3 x 5 marks, pre-drawn once in six greens (0 = white-green head ... 5 = nearly black)
const GC = ['#e8ffe8', '#8aff9a', '#3ae03a', '#1fa02e', '#0f6a1c', '#073a10'];
const GLY = ['111001111100111', '010111010010110', '111101001001010', '101101111001001', '111100110100111', '010010111010010', '110010010010111', '101010101010101',
  '111001010100100', '100111100100111', '011100010001110', '111101111100100', '001011101001001', '111010010010010'];
const ATLAS = (() => { const c = cv(GLY.length * 4, GC.length * 6), x = c.getContext('2d'); GC.forEach((col, s) => GLY.forEach((g, k) => { x.fillStyle = col; for (let b = 0; b < 15; b++) if (g[b] === '1') x.fillRect(k * 4 + (b % 3), s * 6 + ((b / 3) | 0), 1, 1); })); return c; })();
const gl = (ctx, x, y, k, shade) => ctx.drawImage(ATLAS, (((k | 0) % GLY.length) + GLY.length) % GLY.length * 4, shade * 6, 3, 5, x, y, 3, 5);
// a still sheet of falling code: columns of glyphs, each run brightest at its foot
function codeTex(w, h, seed, skip = 0.15, lift = 0) {
  const c = cv(w, h), x = c.getContext('2d'), rows = Math.ceil(h / 6);
  for (let i = 0; i * 4 < w; i++) {
    if (hash(i, seed + 2) < skip) continue;
    const len = 4 + ((hash(i, seed) * 9) | 0), off = (hash(i, seed + 1) * 40) | 0;
    for (let j = 0; j < rows; j++) { const k = (j + off) % (len + 3); if (k >= len) continue; const back = len - 1 - k; gl(x, i * 4, j * 6, hash(i, j + seed) * 14, Math.max(0, (back === 0 ? 1 : Math.min(5, 3 + ((back * 3 / len) | 0))) - lift)); }
  }
  return c;
}
// a one-pixel rim so black suits read on a dark wall: green all round, pale on the lit side (top left)
function rim(f, c1 = '#2fb84a', c2 = '#c8ffd0') {
  const c = cv(f.c.width + 2, f.c.height + 2), x = c.getContext('2d'), a = tint(f, c1, 1).c, b = tint(f, c2, 1).c;
  for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) x.drawImage(a, 1 + dx, 1 + dy);
  x.drawImage(b, 0, 1); x.drawImage(b, 1, 0); x.drawImage(f.c, 1, 1);
  return { c, ox: f.ox + 1, oy: f.oy + 1 };
}
// agents are pale: pull skin tones toward a cold white-green
function pale(f) {
  const c = cv(f.c.width, f.c.height), x = c.getContext('2d'); x.drawImage(f.c, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height), a = d.data;
  for (let i = 0; i < a.length; i += 4) { const r = a[i], g = a[i + 1], b = a[i + 2]; if (a[i + 3] && r > 140 && r > g + 14 && g > b + 8) { a[i] = (r * 0.4 + 236 * 0.6) | 0; a[i + 1] = (g * 0.4 + 244 * 0.6) | 0; a[i + 2] = (b * 0.4 + 226 * 0.6) | 0; } }
  x.putImageData(d, 0, 0); return { c, ox: f.ox, oy: f.oy };
}
const suit = (f) => rim(pale(f));
// marble: a flat tone with veins running down it
function marble(x, x0, y0, w, h, n, M) {
  x.fillStyle = M.base; x.fillRect(x0, y0, w, h);
  for (let k = 0; k < (w * h) / 70; k++) {
    let i = x0 + n() * w, j = y0 + n() * h; x.fillStyle = n() < 0.5 ? M.vein : M.lo; const len = 4 + n() * 12, d = n() < 0.5 ? 1 : -1;
    for (let s = 0; s < len; s++) { if (i >= x0 && i < x0 + w && j >= y0 && j < y0 + h) x.fillRect(i | 0, j | 0, 1, 1); if (n() < 0.6) i += d; j += 1; if (n() < 0.15) i -= d * 2; }
  }
}
// a pillar: capital, shaft, base. lit from the left
function pillar(x, x0, y0, y1, w, n, M) {
  marble(x, x0, y0, w, y1 - y0, n, M);
  x.fillStyle = M.hi; x.fillRect(x0 + 1, y0, 2, y1 - y0); x.fillStyle = M.lo; x.fillRect(x0 + w - 4, y0, 3, y1 - y0); x.fillStyle = M.dk; x.fillRect(x0 + w - 1, y0, 1, y1 - y0);
  x.fillStyle = M.out; x.fillRect(x0 - 1, y0, 1, y1 - y0); x.fillRect(x0 + w, y0, 1, y1 - y0);
  for (const [yy, hh] of [[y0, 6], [y1 - 7, 7]]) { x.fillStyle = M.out; x.fillRect(x0 - 3, yy, w + 6, hh); x.fillStyle = M.base; x.fillRect(x0 - 2, yy + 1, w + 4, hh - 2); x.fillStyle = M.hi; x.fillRect(x0 - 2, yy + 1, w + 4, 1); x.fillStyle = M.lo; x.fillRect(x0 - 2, yy + hh - 2, w + 4, 1); }
}
// a bullet chip: the stone is knocked away and the code shows through
function chip(x, cx, cy, r, sd, hi = '#7b9686', lo = '#131c18') {
  const inside = (i, j) => Math.hypot(i, j * 1.15) < r * (0.6 + 0.4 * hash(Math.round(Math.atan2(j, i) * 2.2) + 9, sd));
  for (let j = -r - 1; j <= r + 1; j++) for (let i = -r - 1; i <= r + 1; i++) {
    if (inside(i, j)) x.fillStyle = hash(i + 40, j + sd) < 0.36 ? (hash(i, j + sd * 3) < 0.3 ? '#8aff9a' : '#1fa02e') : '#020a05';
    else if (inside(i + 1, j + 1)) x.fillStyle = hi; else if (inside(i - 1, j - 1)) x.fillStyle = lo; else continue;
    x.fillRect(cx + i, cy + j, 1, 1);
  }
  x.fillStyle = lo; for (let k = 0; k < 3; k++) { const a = hash(k, sd + 5) * TAU; for (let s = r; s < r + 3 + hash(k, sd) * 4; s++) x.fillRect(Math.round(cx + Math.cos(a) * s), Math.round(cy + Math.sin(a) * s * 0.9), 1, 1); }
}
const R = (x, col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
const TINY = { E: ['111', '100', '110', '100', '111'], X: ['101', '101', '010', '101', '101'], I: ['111', '010', '010', '010', '111'], T: ['111', '010', '010', '010', '010'] };
const tiny = (x, s, x0, y0, col) => [...s].forEach((ch, k) => px(x, x0 + k * 4, y0, TINY[ch], { 1: col }));

export function skin(B, K, D) {
  const P = { base: '#1d2b25', hi: '#8aff9a', top: '#263830', deep: '#101a16', dark: '#18241f', wall: '#0c1411', lamp: '#d8ffe0', glow: '#3ae03a' };
  const M = { base: '#3b5045', hi: '#5c7566', lo: '#2a3a32', vein: '#496154', dk: '#1e2b25', out: '#0a100d' };
  const TEX = codeTex(256, 240, 9);

  // ---- sky + the city of code-rain towers beyond the glass ----
  const rainSky = sky(['#000000', '#010805', '#03140a', '#082614'], (x) => { codeRain(x, 40, 320, 240, { seed: 3, alpha: 0.16, gap: 7 }); });
  const city = (seed, lo, hi, body, edge, texA, lamp) => {
    const w = 640, h = 220, c = cv(w, h), x = c.getContext('2d'); let i = 0, k = 0;
    while (i < w) {
      const bw = 18 + ((hash(k, seed) * 30) | 0), top = lo + ((hash(k, seed + 1) * (hi - lo)) | 0), ww = Math.min(bw, w - i), kind = hash(k, seed + 2);
      const block = (a, t, bwid) => { R(x, body, a, t, bwid, h - t); x.globalAlpha = texA; x.drawImage(TEX, (k * 37) % 180, (k * 53) % 60, bwid - 2, Math.min(170, h - t - 2), a + 1, t + 2, bwid - 2, Math.min(170, h - t - 2)); x.globalAlpha = 1; R(x, edge, a, t, bwid, 1); R(x, edge, a, t, 1, h - t); };
      block(i, top, ww);
      if (kind < 0.35 && ww > 14) { block(i + 4, top - 10, ww - 8); if (kind < 0.18) { R(x, edge, i + (ww >> 1), top - 22, 1, 12); R(x, lamp, i + (ww >> 1), top - 23, 1, 1); } }
      else if (kind < 0.55) { R(x, edge, i + 3, top - 7, 1, 7); R(x, lamp, i + 3, top - 8, 1, 1); }
      i += bw + (hash(k, seed + 3) < 0.3 ? 3 + ((hash(k, seed + 4) * 8) | 0) : 0); k++;
    }
    return c;
  };
  const far = city(71, 16, 70, '#030c07', '#0b2616', 0.3, '#3ae03a'), mid = city(73, 44, 120, '#010503', '#17662a', 0.62, '#e8ffe8');

  // ---- the wall: two storeys of lobby, world y 36..204 ----
  const A = arcadeCanvas(384, 36), x = A.x, Y = A.Y, n = noise(41);
  const PIL = [4, 100, 196, 292];                  // pillars 20 wide; the bays between them are 76 wide
  const GLITCH = [[180, 141, 14, 30], [296, 60, 12, 34], [348, 150, 10, 16]];   // patches where the surface breaks into falling glyphs
  {
    // upper storey: ceiling, wall, a long band of glass
    R(x, P.wall, 0, Y(36), 384, 8); for (let i = 0; i < 384; i += 24) R(x, '#131f1a', i, Y(36), 1, 8); R(x, '#2c3f35', 0, Y(44), 384, 1);
    panels(x, 0, Y(45), 384, 65, P, 48, 22, n, 0);
    for (const p of PIL) {
      const a = p + 24, w = 68, t = Y(54), h = 40;
      R(x, M.out, a - 3, t - 3, w + 6, h + 6); R(x, '#33483d', a - 2, t - 2, w + 4, h + 4); R(x, '#4a6052', a - 2, t - 2, w + 4, 1); R(x, M.out, a - 1, t - 1, w + 2, h + 2);
      x.clearRect(a, t, w, h); x.fillStyle = 'rgba(16,52,34,0.3)'; x.fillRect(a, t, w, h);
      x.fillStyle = 'rgba(200,255,220,0.07)'; for (let j = 0; j < h; j++) { x.fillRect(a + 10 + (h - j) / 2, t + j, 5, 1); x.fillRect(a + 40 + (h - j) / 2, t + j, 2, 1); }
      x.fillStyle = 'rgba(190,255,215,0.22)'; for (let k = 0; k < 14; k++) x.fillRect(a + ((n() * w) | 0), t + ((n() * (h - 5)) | 0), 1, 2 + ((n() * 3) | 0));
      for (let i = 17; i < w; i += 17) { R(x, '#33483d', a + i - 1, t, 2, h); R(x, M.out, a + i + 1, t, 1, h); }
      R(x, '#33483d', a, t + 12, w, 1); R(x, '#4a6052', a - 3, t + h + 3, w + 6, 1); R(x, M.out, a - 3, t + h + 4, w + 6, 1);
      R(x, '#000', p + 43, Y(40), 30, 4); R(x, P.lamp, p + 44, Y(41), 28, 2);                    // strip light in the ceiling
    }
    R(x, '#141f1a', 0, Y(104), 384, 6); R(x, '#33483d', 0, Y(104), 384, 1);
    for (const p of PIL) pillar(x, p, Y(44), Y(110), 20, n, M);
    // the mezzanine slab (the gallery floor)
    R(x, M.out, 0, Y(109), 384, 1); R(x, '#8fae9a', 0, Y(110), 384, 1); marble(x, 0, Y(111), 384, 5, n, { base: '#465c50', vein: '#587062', lo: '#33483d' }); R(x, '#2a3a32', 0, Y(116), 384, 1); R(x, M.out, 0, Y(117), 384, 1);
    for (let i = 6; i < 384; i += 12) R(x, '#7b9686', i, Y(113), 1, 1);
    // lower lobby
    R(x, P.wall, 0, Y(118), 384, 4);
    panels(x, 0, Y(122), 384, 64, P, 38, 32, n, 2);
    R(x, '#141f1a', 0, Y(186), 384, 18); R(x, '#33483d', 0, Y(186), 384, 1); R(x, '#1e2b25', 0, Y(187), 384, 1); R(x, M.out, 0, Y(199), 384, 5);
    for (const p of PIL) {                           // strip lights under the mezzanine, each throwing a pale pool down the wall
      const c = p + 58;
      for (let j = 0; j < 62; j++) { x.fillStyle = `rgba(150,255,185,${[0.2, 0.15, 0.1, 0.06, 0.03][(j / 13) | 0]})`; const hw = 16 + j * 0.42; x.fillRect(Math.round(c - hw), Y(122) + j, Math.round(hw * 2), 1); }
      R(x, '#000', c - 16, Y(118), 32, 4); R(x, P.lamp, c - 15, Y(119), 30, 2); R(x, '#8fae9a', c - 15, Y(121), 30, 1);
    }

    // bay A: the lifts
    for (const a of [30, 66]) {
      R(x, M.out, a - 1, Y(139), 30, 61); R(x, '#4a6052', a, Y(140), 28, 60); R(x, '#6a8272', a, Y(140), 28, 1); R(x, M.out, a + 2, Y(143), 24, 57);
      R(x, '#2c3d34', a + 3, Y(144), 22, 56); R(x, '#3b5045', a + 3, Y(144), 1, 56); R(x, '#3b5045', a + 15, Y(144), 1, 56); R(x, M.out, a + 13, Y(144), 1, 56);
      for (const d of [5, 16]) { R(x, '#253329', a + d, Y(150), 7, 18); R(x, '#253329', a + d, Y(174), 7, 20); }
      R(x, M.out, a + 6, Y(131), 16, 7); R(x, '#16211c', a + 7, Y(132), 14, 5);                    // the floor indicator (lit live)
    }
    R(x, M.out, 60, Y(164), 5, 9); R(x, '#4a6052', 61, Y(165), 3, 7); R(x, '#8aff9a', 62, Y(166), 1, 1); R(x, '#16211c', 62, Y(169), 1, 1);
    // bay B: a wall of payphones (the fourth has come apart) under an exit sign
    for (const a of [126, 144, 162]) {
      R(x, M.out, a - 1, Y(143), 16, 30); R(x, '#33483d', a, Y(144), 14, 28); R(x, '#4a6052', a, Y(144), 14, 1); R(x, '#253329', a + 13, Y(145), 1, 27);
      R(x, M.out, a + 3, Y(148), 9, 15); R(x, '#16211c', a + 4, Y(149), 7, 13); R(x, '#5c7566', a + 4, Y(149), 7, 1);
      R(x, M.out, a + 1, Y(148), 3, 13); R(x, '#5c7566', a + 2, Y(149), 1, 11); R(x, '#7b9686', a + 2, Y(149), 1, 2); R(x, '#7b9686', a + 2, Y(158), 1, 2);   // handset
      for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) R(x, '#7b9686', a + 5 + i * 2, Y(154) + j * 2, 1, 1);
      R(x, '#8aff9a', a + 9, Y(151), 1, 1); R(x, '#0a100d', a + 5, Y(151), 3, 1);
      R(x, '#5c7566', a + 2, Y(160), 1, 6); R(x, '#5c7566', a + 3, Y(166), 2, 1); R(x, '#5c7566', a + 5, Y(163), 1, 3);                                           // cord
      R(x, M.out, a - 1, Y(172), 16, 3); R(x, '#4a6052', a, Y(172), 14, 1);
    }
    R(x, M.out, 142, Y(127), 21, 11); R(x, '#0f6a1c', 143, Y(128), 19, 9); R(x, '#1fa02e', 143, Y(128), 19, 1); tiny(x, 'EXIT', 145, Y(130), '#d8ffe0');
    // bay C: a desk with a terminal, a filing cabinet, a clock that runs the wrong way
    R(x, M.out, 219, Y(177), 40, 23); R(x, '#33483d', 220, Y(178), 38, 22); R(x, '#5c7566', 220, Y(178), 38, 1); R(x, '#253329', 220, Y(180), 38, 1); R(x, '#253329', 244, Y(181), 1, 19); R(x, '#253329', 245, Y(189), 13, 1); R(x, '#7b9686', 250, Y(184), 3, 1); R(x, '#7b9686', 250, Y(193), 3, 1); R(x, '#16211c', 222, Y(183), 20, 17);
    R(x, M.out, 224, Y(160), 19, 16); R(x, '#6f8676', 225, Y(161), 17, 14); R(x, '#8fae9a', 225, Y(161), 17, 1); R(x, '#4a6052', 225, Y(174), 17, 1); R(x, M.out, 227, Y(163), 13, 9); R(x, '#04160a', 228, Y(164), 11, 7); R(x, '#8aff9a', 239, Y(173), 1, 1);
    R(x, M.out, 230, Y(176), 7, 2); R(x, '#4a6052', 245, Y(176), 11, 2); R(x, '#6f8676', 245, Y(176), 11, 1);
    R(x, M.out, 265, Y(153), 22, 47); R(x, '#3b5045', 266, Y(154), 20, 46); R(x, '#5c7566', 266, Y(154), 20, 1); R(x, '#2a3a32', 285, Y(155), 1, 45);
    for (let d = 0; d < 3; d++) { const t = Y(156) + d * 15; R(x, '#2a3a32', 267, t + 13, 18, 1); R(x, '#465c50', 268, t, 16, 1); R(x, '#8fae9a', 273, t + 6, 6, 1); R(x, '#16211c', 273, t + 7, 6, 1); R(x, '#16211c', 274, t + 2, 4, 3); R(x, '#7b9686', 275, t + 3, 2, 1); }
    px(x, 268, Y(143), ['..g...g..', '.gGg.gG..', '..gGgGg.g', '.g.gGg.gG', '..ggGgg..', '...ppp...', '...pPp...', '...ppp...', '...ppp...', '..ppppp..'].slice(0, 10), { g: '#2a7a40', G: '#44a85a', p: '#4a6052', P: '#6f8676' });
    R(x, M.out, 231, Y(128), 13, 13); R(x, '#8fae9a', 232, Y(129), 11, 11); R(x, '#b9d2c0', 233, Y(130), 9, 9); for (const [a, b] of [[237, 130], [237, 138], [233, 134], [241, 134]]) R(x, '#16211c', a, Y(b), 1, 1);
    R(x, M.out, 252, Y(130), 10, 13); R(x, '#253329', 253, Y(131), 8, 11); for (let j = 0; j < 4; j++) R(x, '#4a6052', 254, Y(133) + j * 2, 3 + ((n() * 4) | 0), 1);
    // bay D: a tall window on the city, blinds half down, a water cooler
    { const a = 318, w = 42, t = Y(128), h = 56;
      R(x, M.out, a - 3, t - 3, w + 6, h + 6); R(x, '#33483d', a - 2, t - 2, w + 4, h + 4); R(x, '#4a6052', a - 2, t - 2, w + 4, 1); R(x, M.out, a - 1, t - 1, w + 2, h + 2);
      x.clearRect(a, t, w, h); x.fillStyle = 'rgba(16,52,34,0.3)'; x.fillRect(a, t, w, h);
      x.fillStyle = 'rgba(200,255,220,0.07)'; for (let j = 0; j < h; j++) x.fillRect(a + 6 + (h - j) / 2, t + j, 5, 1);
      x.fillStyle = 'rgba(190,255,215,0.22)'; for (let k = 0; k < 14; k++) x.fillRect(a + ((n() * w) | 0), t + 18 + ((n() * (h - 23)) | 0), 1, 2 + ((n() * 3) | 0));
      for (let j = 0; j < 18; j += 3) { R(x, '#465c50', a, t + j, w, 2); R(x, '#5c7566', a, t + j, w, 1); } R(x, '#2a3a32', a + 37, t + 18, 1, 14); R(x, '#7b9686', a + 36, t + 32, 3, 2);
      R(x, '#33483d', a + 20, t + 18, 2, h - 18); R(x, M.out, a + 22, t + 18, 1, h - 18); R(x, '#4a6052', a - 4, t + h + 3, w + 8, 2); R(x, M.out, a - 4, t + h + 5, w + 8, 1); }
    R(x, M.out, 367, Y(159), 12, 41); R(x, '#6f8676', 368, Y(172), 10, 28); R(x, '#8fae9a', 368, Y(172), 10, 1); R(x, '#4a6052', 377, Y(173), 1, 27); R(x, '#2a3a32', 370, Y(178), 6, 5); R(x, '#8aff9a', 371, Y(180), 1, 1); R(x, '#d8ffe0', 374, Y(180), 1, 1);
    R(x, '#4f8a78', 369, Y(160), 8, 12); R(x, '#7fc0a8', 370, Y(161), 2, 9); R(x, '#3b6a5c', 369, Y(167), 8, 1); R(x, M.out, 368, Y(159), 1, 1); R(x, M.out, 378, Y(159), 1, 1);
    // pillars last so they stand in front; two have taken gunfire
    for (const p of PIL) pillar(x, p, Y(122), Y(200), 20, n, M);
    chip(x, 110, Y(150), 5, 3); chip(x, 105, Y(169), 3, 8); chip(x, 114, Y(138), 2, 5); chip(x, 302, Y(146), 4, 11); chip(x, 298, Y(174), 5, 14); chip(x, 16, Y(84), 4, 21); chip(x, 203, Y(160), 2, 2);
    for (const [gx, gy, gw, gh] of GLITCH) { R(x, '#020a05', gx, Y(gy), gw, gh); x.drawImage(TEX, gx, gy, gw - 1, gh - 1, gx + 1, Y(gy) + 1, gw - 1, gh - 1); }
  }
  const wallFx = (ctx, base, Yw, f) => {
    if (base > 330 || base < -400) return;
    for (let g = 0; g < GLITCH.length; g++) {        // the wall coming apart: glyphs fall through the hole, the edge crawls
      const [gx, gy, gw, gh] = GLITCH[g], X = base + gx, T = Yw(gy); if (X > 322 || X + gw < -2) continue;
      ctx.fillStyle = '#020a05'; ctx.fillRect(X, T, gw, gh);
      const rows = Math.floor(gh / 6);
      for (let c = 0; c * 4 + 3 < gw; c++) { const len = 3 + ((hash(c, g) * 3) | 0), cyc = rows + len + 2, head = Math.floor(f * (0.1 + hash(c, g + 7) * 0.12) + hash(c, g + 3) * cyc) % cyc;
        for (let k = 0; k < len; k++) { const r = head - k; if (r < 0 || r >= rows) continue; gl(ctx, X + 1 + c * 4, T + 1 + r * 6, hash(c + (f >> 3), r + g) * 14, k === 0 ? 0 : Math.min(4, 1 + k)); } }
      for (let k = 0; k < 5; k++) { const h1 = hash(k + g * 9, f >> 2), h2 = hash(k + g * 9, (f >> 2) + 50); ctx.fillStyle = h1 < 0.5 ? '#020a05' : '#1fa02e'; const side = k % 2 ? X - 2 + h2 * 3 : X + gw - 1 + h2 * 3; ctx.fillRect(Math.round(side), T + Math.floor(h1 * 2 * (gh - 2)) % (gh - 1), 2, 2); }
      if ((f + g * 40) % 150 < 6) { ctx.fillStyle = '#8aff9a'; ctx.fillRect(X - 3, T + ((f * 7) % gh), gw + 6, 1); }
    }
    const lit = (c) => base + c > -40 && base + c < 360;
    // one strip light is on its way out
    if (lit(254) && (hash(f >> 1, 7) < 0.07 || (f % 260 > 236 && (f >> 2) % 2))) { ctx.fillStyle = '#16211c'; ctx.fillRect(base + 239, Yw(119), 30, 2); ctx.globalAlpha = 0.16; ctx.fillStyle = '#000'; ctx.fillRect(base + 216, Yw(122), 76, 64); ctx.globalAlpha = 1; }
    if (lit(62)) for (let k = 0; k < 2; k++) { const a = base + (k ? 73 : 37), pos = k ? 4 - (Math.floor(f / 50) % 5) : Math.floor(f / 34) % 5; for (let i = 0; i < 5; i++) { ctx.fillStyle = i === pos ? '#8aff9a' : '#253329'; ctx.fillRect(a + 1 + i * 3 - (i === pos ? 0 : 0), Yw(134), 2, 1); } }   // lifts on the move
    if (lit(232)) {                                     // the terminal types to itself; the clock ticks backwards
      for (let j = 0; j < 3; j++) { const w = 2 + ((hash(j + (f >> 5), 3) * 8) | 0); ctx.fillStyle = j === 2 ? '#8aff9a' : '#1fa02e'; ctx.fillRect(base + 229, Yw(165) + j * 2, j === 2 ? Math.min(w, ((f >> 2) % 10)) : w, 1); }
      if ((f >> 4) % 2) { ctx.fillStyle = '#e8ffe8'; ctx.fillRect(base + 229 + Math.min(8, (f >> 2) % 10), Yw(169), 1, 1); }
      const cx = base + 237, cy = Yw(134), a = -Math.floor(f / 30) * TAU / 12 - TAU / 4; ctx.fillStyle = '#16211c'; ctx.fillRect(cx, cy - 2, 1, 3); ctx.fillRect(cx, cy, 3, 1);
      ctx.fillStyle = '#c03a2a'; for (let s = 1; s <= 3; s++) ctx.fillRect(Math.round(cx + Math.cos(a) * s), Math.round(cy + Math.sin(a) * s), 1, 1);
    }
    if (lit(152) && hash(f >> 2, 31) < 0.05) { ctx.globalAlpha = 0.6; ctx.fillStyle = '#020a05'; ctx.fillRect(base + 143, Yw(128), 19, 9); ctx.globalAlpha = 1; }
  };
  // the tenant's name, etched on the glass of the gallery (one bay in six), and now and then the rain outside
  // another window falls into the shape of their mark for a few seconds. Both sit BEHIND the wall: frames and mullions cross them.
  const ETCH = (() => { const c = cv(67, 9), k = c.getContext('2d');
    LOGO.W7.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') { k.fillStyle = 'rgba(4,22,12,0.5)'; k.fillRect(i + 1, j + 1, 1, 1); } });
    LOGO.W7.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') { k.clearRect(i, j, 1, 1); k.fillStyle = j < 2 ? 'rgba(200,255,220,0.5)' : 'rgba(150,225,180,0.36)'; k.fillRect(i, j, 1, 1); } });
    return c; })();
  const VRAIN = [0, 1, 2, 3].map((q) => { const c = cv(36, 38), k = c.getContext('2d'), m = cv(36, 38), mk = m.getContext('2d');
    mk.fillStyle = '#fff'; LOGO.V38.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') mk.fillRect(i, j, 1, 1); });
    k.fillStyle = '#0d4a1c'; k.fillRect(0, 0, 36, 38); for (let i = 0; i < 9; i++) for (let j = -1; j < 7; j++) { const h = hash(i * 3 + 1, j - q + 40); if (h < 0.18) continue; gl(k, i * 4 + 1, j * 6 + ((i * 2) % 3), hash(i, j - q + 9) * 14, h > 0.9 ? 1 : h > 0.5 ? 2 : 3); }
    k.globalCompositeOperation = 'destination-in'; k.drawImage(m, 0, 0); k.globalCompositeOperation = 'source-over'; return c; });
  // rain on the far side of the glass
  const backFx = (ctx, f, fdist = 0, cam = 60) => {
    codeRain(ctx, f, 320, 180, { gap: 13, seed: 5, alpha: 0.4, speed: 0.55 });
    { const sc = Math.floor(fdist), t0 = Math.floor(sc / 384);
      for (let t = t0; t <= t0 + 1; t++) { const base = t * 384 - sc, v = ((t % 6) + 6) % 6;
        if (v === 2 && base < 200 && base > -196) ctx.drawImage(ETCH, base + 125, Math.round(72 - cam));
        if (v === 5 && base < 90 && base > -276) { const a = (f + t * 97) % 520; if (a < 170) { ctx.globalAlpha = 0.7 * Math.min(1, a / 30, (170 - a) / 40); ctx.drawImage(VRAIN[(f >> 4) & 3], base + 236, Math.round(56 - cam)); ctx.globalAlpha = 1; } } } }
    ctx.fillStyle = 'rgba(140,220,170,0.22)'; for (let k = 0; k < 34; k++) { const t = (f * (3 + hash(k, 2) * 2) + hash(k, 3) * 220) % 220; ctx.fillRect(Math.round(hash(k, 1) * 360 - t * 0.2), Math.round(t - 20), 1, 5); }
  };
  // a few stray glyphs falling through the room
  const frontFx = (ctx, f, fdist) => {
    for (let k = 0; k < 6; k++) {
      const X = Math.round((((hash(k, 11) * 372 - fdist * 0.35) % 372) + 372) % 372) - 26, yy = Math.round(((f * (0.7 + hash(k, 12) * 0.9) + hash(k, 13) * 250) % 250) - 30);
      ctx.globalAlpha = 0.85; gl(ctx, X, yy, hash(k, f >> 3) * 14, 0); ctx.globalAlpha = 0.55; gl(ctx, X, yy - 6, hash(k + 1, f >> 3) * 14, 2); ctx.globalAlpha = 0.3; gl(ctx, X, yy - 12, hash(k + 2, f >> 4) * 14, 3);
    }
    ctx.globalAlpha = 1;
  };

  // ---- the deck: polished checkerboard tiles on a foundation of raw code ----
  const dk = deckCanvas(96);
  { const d = dk.x; R(d, '#010503', 0, 0, 96, 40); d.drawImage(codeTex(96, 36, 23, 0.1), 0, 10);
    for (let j = 0; j < 30; j += 2) { d.fillStyle = `rgba(0,0,0,${Math.min(0.9, 0.4 + j / 40)})`; d.fillRect(0, 10 + j, 96, 2); }
    for (let j = 1; j < 8; j++) for (let i = 0; i < 96; i++) { const t = Math.floor(i / 12) + (j > 3 ? 1 : 0); d.fillStyle = t % 2 ? (j === 1 || j === 4 ? '#86a892' : j < 4 ? '#4d6558' : '#3d5348') : (j === 1 ? '#2a3a32' : j < 4 ? '#131c18' : '#0c1411'); d.fillRect(i, j, 1, 1); }
    R(d, '#a8c8b4', 0, 0, 96, 1); for (const [a, w] of [[5, 9], [30, 4], [52, 12], [80, 6]]) R(d, '#e8ffe8', a, 0, w, 1);
    R(d, '#000', 0, 8, 96, 1); R(d, '#1fa02e', 0, 9, 96, 1); for (let i = 0; i < 96; i += 2) if (hash(i, 77) < 0.5) R(d, '#0f6a1c', i, 9, 2, 1); }
  const pit = pitCycle(['#000000', '#073a10', '#0f6a1c', '#1fa02e', '#3ae03a', '#e8ffe8', '#0f6a1c', '#073a10'], 17);

  // ---- platforms ----
  const drawPlat = (ctx, p, x, y, w, f) => {
    const id = p.id || 0;
    if (p.crumble > 0) { y += f % 4 < 2 ? 1 : 0; x += (f % 3) - 1; }
    if (p.gone) ctx.globalAlpha = Math.max(0, 1 - (p.fallT || 0) / 40);
    const R2 = (col, a, b, ww, hh) => { ctx.fillStyle = col; ctx.fillRect(a, b, ww, hh); };
    if (p.kind === 'ledge') {                         // a mezzanine balcony: marble slab, glass rail behind you, brackets below
      ctx.globalAlpha *= 0.14; R2('#8aff9a', x + 1, y - 8, w - 2, 8); ctx.globalAlpha = p.gone ? Math.max(0, 1 - (p.fallT || 0) / 40) : 1;
      R2('#33483d', x, y - 9, w, 1); for (let i = 0; i < w; i += 16) R2('#2a3a32', x + Math.min(i, w - 1), y - 8, 1, 8); R2('#2a3a32', x + w - 1, y - 8, 1, 8);
      R2('#000', x - 1, y - 1, w + 2, 10); R2('#465c50', x, y, w, 8); R2('#c4e2cf', x, y, w, 1); R2('#7b9686', x, y + 1, w, 1); R2('#2a3a32', x, y + 6, w, 1); R2('#16211b', x, y + 7, w, 1);
      for (let i = 3; i < w - 3; i += 5) if (hash(i, id) < 0.5) R2(hash(i, id + 1) < 0.5 ? '#587062' : '#33483d', x + i, y + 2 + ((hash(i, id + 2) * 3) | 0), 2, 1);
      for (const a of [x + 2, x + w - 8]) { R2('#000', a - 1, y + 9, 8, 1); R2('#000', a, y + 10, 6, 2); R2('#000', a + 1, y + 12, 4, 2); R2('#33483d', a, y + 9, 6, 1); R2('#33483d', a + 1, y + 10, 4, 2); R2('#2a3a32', a + 2, y + 12, 2, 1); }
    } else if (p.kind === 'movev' || p.kind === 'moveh') {   // a lift car on its cables / a window-cleaner's cradle on its ropes
      const lift = p.kind === 'movev';
      for (const a of [x + 3, x + w - 4]) { R2('#0a100d', a, y - 150, 1, 150); for (let j = (f >> 1) % 6 * (lift ? 1 : 0); j < 150; j += 6) R2('#4a6052', a, y - 150 + j, 1, 2); }
      if (!lift) { for (const a of [x, x + w - 2]) { R2('#000', a - 1, y - 9, 4, 9); R2('#7b9686', a, y - 8, 2, 8); } R2('#33483d', x + 2, y - 6, w - 4, 1); }
      R2('#000', x - 1, y - 1, w + 2, 10); R2('#4a6052', x, y, w, 8); R2('#e6f0c0', x, y, w, 1); R2('#8fae9a', x, y + 1, w, 1); R2('#1e2b25', x, y + 7, w, 1);
      for (let i = 0; i < w; i++) R2(((i + 100) >> 2) % 2 ? '#c8c04a' : '#16211b', x + i, y + 3, 1, 3);
      if (lift) { R2('#000', x + 3, y + 9, w - 6, 6); R2('#2a3a32', x + 4, y + 9, w - 8, 5); R2('#3b5045', x + 4, y + 9, w - 8, 1); R2((f >> 3) % 2 ? '#8aff9a' : '#1fa02e', x + (w >> 1) - 1, y + 11, 2, 2); R2('#16211c', x + (w >> 1) - 6, y + 11, 3, 1); R2('#16211c', x + (w >> 1) + 3, y + 11, 3, 1); }
      else { const a = x + w - 10; R2('#7b9686', a + 2, y + 9, 1, 3); R2('#000', a - 1, y + 11, 7, 6); R2('#6f8676', a, y + 12, 5, 4); R2('#8fae9a', a, y + 12, 5, 1); R2('#7b9686', x + 5, y + 9, 1, 5); R2('#c8c04a', x + 3, y + 14, 5, 1); }
    } else {                                           // a slab of solid code; the crumbling kind is already de-rezzing
      const cr = p.kind === 'crumble', bad = cr ? (p.crumble > 0 || p.gone ? 0.55 : 0.24) : 0, cols = Math.max(1, Math.floor(w / 4)), cw = w / cols;
      for (let c = 0; c < cols; c++) {
        const a = Math.round(x + c * cw), ww = Math.round(x + (c + 1) * cw) - a, miss = cr && hash(c + ((f >> (p.crumble > 0 ? 1 : 3)) & 7) * 31, id) < bad;
        if (miss) { const t = (f * 0.6 + hash(c, id + 4) * 20) % 20; gl(ctx, a, Math.round(y + 1 + t), hash(c, f >> 2) * 14, t < 6 ? 1 : t < 13 ? 3 : 4); continue; }
        R2('#000', a - 1, y - 1, ww + 2, 9); R2(cr ? '#03120a' : '#052410', a, y, ww, 7); R2(cr ? '#8aff9a' : '#d8ffe0', a, y, ww, 1); R2(cr ? '#1fa02e' : '#3ae03a', a, y + 1, ww, 1);
        gl(ctx, a, y + 2, hash(c + (hash(c, id) < 0.3 ? f >> 3 : 0), id + 3) * 14, hash(c, id + 9 + ((f >> 4) & 3)) < 0.18 ? 1 : cr ? 4 : 3);
        if (!cr && hash(c, id + 6) < 0.25) { const t = (f * 0.25 + hash(c, id + 8) * 12) % 12; ctx.fillStyle = t < 5 ? '#3ae03a' : '#0f6a1c'; ctx.fillRect(a + 1, Math.round(y + 8 + t), 1, 2); }
      }
      if (cr) for (let k = 0; k < 3; k++) { const a = x + 2 + ((hash(k, id + 12) * (w - 6)) | 0), t = (f * 0.5 + hash(k, id + 13) * 26) % 26; gl(ctx, a, Math.round(y + 9 + t), hash(k, f >> 2) * 14, t < 8 ? 2 : t < 16 ? 3 : 4); }
    }
    ctx.globalAlpha = 1;
  };
  // drips: a ceiling tile has broken under the mezzanine and code is leaking through
  const drawPipe = (ctx, x, Yw, prog, f) => {
    const t = Yw(118);
    ctx.fillStyle = '#000'; ctx.fillRect(x - 9, t - 1, 19, 6); ctx.fillStyle = '#020a05'; ctx.fillRect(x - 8, t, 17, 4);
    gl(ctx, x - 6, t, hash(x, f >> 3) * 14, 3); gl(ctx, x + 3, t - 1, hash(x + 1, f >> 4) * 14, 4); gl(ctx, x - 1, t - 1, hash(x + 2, f >> 2) * 14, (f >> 3) % 2 ? 1 : 2);
    ctx.fillStyle = '#000'; ctx.fillRect(x - 10, t + 3, 6, 4); ctx.fillRect(x + 5, t + 2, 5, 3); ctx.fillStyle = '#33483d'; ctx.fillRect(x - 9, t + 4, 4, 2); ctx.fillRect(x - 8, t + 3, 2, 1); ctx.fillRect(x + 6, t + 3, 3, 1); ctx.fillStyle = '#5c7566'; ctx.fillRect(x - 9, t + 4, 3, 1);
    ctx.fillStyle = '#16211c'; ctx.fillRect(x + 3, t + 4, 1, 4); ctx.fillStyle = '#c8c04a'; ctx.fillRect(x + 3, t + 8, 1, 1);
    ctx.fillStyle = '#3ae03a'; ctx.fillRect(x - 1, t + 3, 3, 2); if ((f >> 3) % 2) { ctx.fillStyle = '#e8ffe8'; ctx.fillRect(x, t + 4, 1, 1); }
    const r = Math.floor(prog * 3); if (r > 0) { ctx.fillStyle = '#000'; ctx.fillRect(x - 1 - (r >> 1), t + 4, r + 2, r + 3); ctx.fillStyle = '#3ae03a'; ctx.fillRect(x - (r >> 1), t + 5, r, r + 1); ctx.fillStyle = '#e8ffe8'; ctx.fillRect(x, t + 5, 1, 1); }
  };
  // what the agents throw: a slug of bright code with a tail
  const bullet = (ctx, x, y, f, b) => {
    const dx = b && b.vx > 0 ? -1 : 1;
    ctx.fillStyle = '#3ae03a'; for (let t = 1; t < 5; t++) if ((t + (f >> 1)) % 2) ctx.fillRect(x + dx * (3 + t * 2), y - 1 + (t % 2), 2, 1);
    ctx.fillStyle = '#000'; ctx.fillRect(x - 4, y - 3, 8, 6); ctx.fillStyle = '#8aff9a'; ctx.fillRect(x - 3, y - 2, 6, 4); ctx.fillStyle = '#e8ffe8'; ctx.fillRect(x - 3, y - 1, 3, 2); ctx.fillStyle = '#1fa02e'; ctx.fillRect(x + 1, y + 1, 2, 1);
  };

  // ---- the cast: black suits, pale faces, a green rim so they read on the dark ----
  const agent = B.agent.map(suit), big = B.agentBig.map(suit), shoot = suit(B.agentShoot), sent = B.sentinel.map((f) => rim(f, '#2fb84a', '#e8ffe8')), cat = B.cat.map((f) => rim(f, '#3ae03a', '#e8ffe8'));
  const chr = { grunt: agent, puker: agent, brute: big.slice(0, 4), bruteDizzy: tint(big[0], '#3ae03a', 0.4), brutePuke: [big[1]], ghoul: { sit: cat[0], leap: cat[2], land: cat[5] },
    slime: tintAll(B.chr.slime, '#3ae03a', 0.5), slimeSmall: tintAll(B.chr.slimeSmall, '#3ae03a', 0.5), biker: agent,
    batF: sent, batFlashF: tint(sent[0], '#ffffff', 0.8), unicornFly: sent.map((f) => scaleFr(f, 1.3)), flyFlash: tint(sent[0], '#ffffff', 0.8),
    unicorn: [shoot], unicornPuke: shoot, unicornFlash: tint(shoot, '#ffffff', 0.8) };
  // the level's own dangers (code-art.js): guard, tracer bug, phantom, packets, firewall, and the phone that makes you THE ONE
  const DG = codeDangers(B, { suit, gl });
  Object.assign(chr, DG.chr);

  return { name: 'THE CODE', style: 'code', P, drip: LOOK.code, puddle: LOOK.code, drawPipe, sky: rainSky, far, farY: 0, mid, midY: 0, near: blank(), arcade: A.c, arcadeTop: 36, deck: dk.c, pit, pitUp: 4, fg: blank(), particles: 'dust',
    drawPlat, drawBlob: bullet, wallFx, backFx, frontFx, noBlimp: true, titleFill: GRAD.green, tintCol: '#3ae03a', chr, danger: DG.danger, fx: DG.fx, labels: DG.labels, extras: ['crumble', 'slider', 'elevator'], boss: agentBoss(B, { rim, pale, marble, pillar, chip, gl, TEX, R, tiny }) };
}
