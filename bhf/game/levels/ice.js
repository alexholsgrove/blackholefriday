// Black Hole Friday, level: THE ICE PLANET. Deep blue twilight, a glacier wall with a crashed ship frozen into it,
// a huge black hole setting behind frozen cloud mountains (the only warm thing in the sky), mini black holes bending the light.
// Boss: THE SINGULARITY. You can't fight it. Outlast it.
import { cv, pix, dith, hash, tint, frames, TAU, drawText, GRAD, noise, fr, scaleFr, tintAll, blank, pitCycle, blackHole, arcadeCanvas, px, panels, glow, rivets, box } from '../kit.js';
import { LOGO } from '../../../logo-masks.js';
import { BW, BH, FL, hurt, win, bar, heroStep } from '../bosskit.js';
import { iceDangers } from './ice-art.js';

const R = (x, c, a, b, w = 1, h = 1) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), w, h); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// a shape with a black outline: inside(i, j) says where it is, col(i, j) what colour
const outlined = (w, h, inside, col) => pix(w, h, (i, j) => (inside(i, j) ? col(i, j) : inside(i - 1, j) || inside(i + 1, j) || inside(i, j - 1) || inside(i, j + 1) ? '#000000' : null));
const SKY = ['#03061a', '#050a24', '#081230', '#0c1c40', '#122c52', '#1a4064', '#245674', '#2e6a7c'];
const METAL = ['#9aa6be', '#6a7690', '#4a566e', '#343e54', '#222a3c', '#141a28'];
const stars = (x, w, h, seed, count) => { const n = noise(seed); for (let k = 0; k < count; k++) { const sx = (n() * w) | 0, sy = (n() * n() * h) | 0, b = n(); R(x, b > 0.9 ? '#ffffff' : b > 0.55 ? '#9ab8e0' : '#4a6490', sx, sy); if (b > 0.96) { R(x, '#6a88b8', sx - 1, sy); R(x, '#6a88b8', sx + 1, sy); R(x, '#6a88b8', sx, sy - 1); R(x, '#6a88b8', sx, sy + 1); } } };

// ---- light bending round a black hole: what is behind it shows upside down and squeezed inside the ring ----
const lensBuf = new Map();
function lens(ctx, cx, cy, Rl, S = 1.8) {
  cx = Math.round(cx); cy = Math.round(cy);
  let b = lensBuf.get(Rl);
  if (!b) { const n = Rl * 2 + 1, c = cv(n, n); b = { c, x: c.getContext('2d'), m: pix(n, n, (i, j) => (Math.hypot(i - Rl, j - Rl) <= Rl ? '#ffffff' : null)) }; b.x.imageSmoothingEnabled = false; lensBuf.set(Rl, b); }
  const x = b.x, n = Rl * 2 + 1, K = ctx.getTransform().a || 1, src = Math.round(Rl * S);
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, n, n);
  x.setTransform(-1, 0, 0, -1, n, n);
  x.drawImage(ctx.canvas, (cx - src) * K, (cy - src) * K, (src * 2 + 1) * K, (src * 2 + 1) * K, 0, 0, n, n);
  x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'destination-in'; x.drawImage(b.m, 0, 0); x.globalCompositeOperation = 'source-over';
  ctx.drawImage(b.c, cx - Rl, cy - Rl);
}

// ---- gravity: every pixel on the screen is dragged toward the hole (cx, cy). The nearer, the harder; rings of pull run inward; a slight swirl.
// rh = the hole's radius, amt = strength (1 = normal), f = frame. Drawing only: reads the canvas as it stands and writes it back bent.
let warpBuf = null;
const WSIN = Array.from({ length: 64 }, (_, i) => Math.sin((i / 64) * Math.PI * 2));
function gravWarp(ctx, cx, cy, rh, f, amt = 1, reach = 250) {
  const src = ctx.canvas;
  if (!warpBuf) { const c = cv(BW, BH), x = c.getContext('2d', { willReadFrequently: true }); x.imageSmoothingEnabled = false; warpBuf = { c, x, out: x.createImageData(BW, BH) }; }
  const b = warpBuf; b.x.drawImage(src, 0, 0, src.width, src.height, 0, 0, BW, BH);
  let im; try { im = b.x.getImageData(0, 0, BW, BH); } catch (e) { return; }
  const S = new Uint32Array(im.data.buffer), D = new Uint32Array(b.out.data.buffer);
  const M = 34 * rh * amt, SW = 3.2 * amt, core = rh * 0.8, ph = f * 5, R2 = reach * reach;
  const x0 = Math.max(0, Math.floor(cx - reach)), x1 = Math.min(BW, Math.ceil(cx + reach) + 1), y0 = Math.max(0, Math.floor(cy - reach)), y1 = Math.min(BH, Math.ceil(cy + reach) + 1);
  if (x1 <= x0 || y1 <= y0) return;
  D.set(S);
  for (let j = y0; j < y1; j++) {
    const dy = j - cy, row = j * BW;
    for (let i = x0; i < x1; i++) {
      const dx = i - cx, r2 = dx * dx + dy * dy;
      if (r2 >= R2) continue;                                                // out of reach
      const r = Math.sqrt(r2);
      if (r < core) { D[row + i] = 0xff000000; continue; }
      const wave = 1 + 0.4 * WSIN[(Math.floor(r * 3.2) + ph) & 63];         // rings of pull that travel inward
      const pull = (M / (r + 5)) * wave * (1 - r2 / R2); if (pull < 0.5) continue;
      const a = SW / (r + 8), k = 1 + pull / r, ca = 1 - a * a / 2;
      const ux = dx * ca - dy * a, uy = dy * ca + dx * a;
      let sx = Math.round(cx + ux * k), sy = Math.round(cy + uy * k);
      sx = sx < 0 ? 0 : sx >= BW ? BW - 1 : sx; sy = sy < 0 ? 0 : sy >= BH ? BH - 1 : sy;
      let px = S[sy * BW + sx];
      if (pull > 3) {                                                        // close in, the light splits: red is dragged a little further than blue
        const k2 = 1 + (pull * 1.3) / r; let tx = Math.round(cx + ux * k2), ty = Math.round(cy + uy * k2);
        tx = tx < 0 ? 0 : tx >= BW ? BW - 1 : tx; ty = ty < 0 ? 0 : ty >= BH ? BH - 1 : ty;
        px = (px & 0xffffff00) | (S[ty * BW + tx] & 0xff);
      }
      D[row + i] = px;
    }
  }
  b.x.putImageData(b.out, 0, 0);
  ctx.save(); ctx.setTransform(src.width / BW, 0, 0, src.height / BH, 0, 0); ctx.drawImage(b.c, 0, 0); ctx.restore();
}

// ---- platforms (also used in the boss arena). Canvas row 0 / column 0 is the outline: draw at (x - 1, y - 1) ----
const ledgeArt = (w, s) => {             // an ice shelf hung with icicles
  const dep = Array.from({ length: w }, (_, i) => { const e = Math.min(i, w - 1 - i), k = Math.floor(i / 3), m = i % 3, ic = hash(k, s + 20) > 0.4 ? 3 + Math.floor(hash(k, s + 21) * 8) : 0; return 8 - Math.max(0, 3 - e) + (ic ? (m === 1 ? ic : Math.max(0, ic - 3)) : 0); });
  const ins = (i, j) => i >= 1 && i <= w && j >= 1 && j <= dep[i - 1];
  return outlined(w + 2, 22, ins, (i, j) => { const a = i - 1, b = j - 1; if (b === 0) return '#ffffff'; if (b === 1) return hash(a, 2) > 0.3 ? '#d4f2ff' : '#ffffff'; if (b < 8) return dith(['#93d2f4', '#5aa2dc', '#3a78b8', '#2a5c9c'], (b - 2) / 6, i, j); return a % 3 === 1 ? '#e4f6ff' : '#8cc8ee'; });
};
const bergArt = (w, s) => {              // a floating slab of ice: bright top, dark blue body
  const dep = Array.from({ length: w }, (_, i) => Math.round(4 + 8 * Math.pow(Math.sin(Math.PI * (i + 0.5) / w), 0.6) + (hash(Math.floor(i / 4), s + 30) - 0.5) * 3));
  const ins = (i, j) => i >= 1 && i <= w && j >= 1 && j <= dep[i - 1];
  return outlined(w + 2, 20, ins, (i, j) => { const a = i - 1, b = j - 1, d = dep[a]; if (b === 0) return '#ffffff'; if (b === 1) return '#bff0ff'; if (b === 2) return hash(a, 3) > 0.4 ? '#6ad0f4' : '#bff0ff'; if (b >= d - 2) return '#102650';
    const fc = hash(Math.floor((a + b * 0.8) / 7), s + 31); return dith(fc > 0.6 ? ['#3a78bc', '#2a5a9c'] : fc > 0.3 ? ['#2a5a9c', '#1e4484'] : ['#1e4484', '#16346a'], (b - 3) / 8, i, j); });
};
// an ice cloud: a puffy bank of frozen vapour, white right through, hanging in the air. It does not hold: 26 ticks and it is gone.
// It is drawn CL_TOP rows above the line you stand on, so the tops of the puffs come up round the boots.
const CL_TOP = 4;
const cloudShape = (w, s) => { const n = Math.max(2, Math.round(w / 13)), lw = w / n, top = [], dep = [];
  for (let a = 0; a < w; a++) { const e = Math.min(a, w - 1 - a), u = ((a % lw) / lw) * 2 - 1, k = Math.floor(a / lw), v = (((a + lw / 2) % lw) / lw) * 2 - 1, k2 = Math.floor((a + lw / 2) / lw);
    top.push(CL_TOP - Math.round(Math.sqrt(1 - u * u) * (2 + hash(k, s + 40) * 2.4)) + Math.max(0, 4 - e));
    dep.push(CL_TOP + 5 + Math.round(Math.sqrt(1 - v * v) * (2 + hash(k2, s + 41) * 3)) - Math.max(0, 5 - e)); }
  return { top, dep }; };
const crumbArt = (w, s) => {
  const { top, dep } = cloudShape(w, s), ins = (i, j) => i >= 1 && i <= w && j - 1 >= top[i - 1] && j - 1 <= dep[i - 1];
  return outlined(w + 2, CL_TOP + 15, ins, (i, j) => { const a = i - 1, b = j - 1, t = b - top[a], d = dep[a] - b;
    if (t === 0) return '#ffffff'; if (d === 0) return '#5f8fc8'; if (d === 1) return (a + b) % 2 ? '#86b4e0' : '#5f8fc8';
    if (hash(a, b + s * 7) > 0.95) return '#ffffff';                                                            // frost glitter
    if (t === 1 || (t === 2 && hash(a >> 1, s + 44) > 0.5)) return '#f2fbff';
    return dith(['#f2fbff', '#d6eeff', '#b4d8f6', '#96c2ea'], (t - 2) / Math.max(1, dep[a] - top[a] - 3), i, j); });
};
// the cracks that run through it once you are on it: zig-zags from the top down, more of them as it goes
const cloudCracks = (ctx, xx, yy, w, id, k) => { const n = 2 + (w > 44 ? 1 : 0);
  for (let c = 0; c < n; c++) { let x = xx + Math.round((c + 0.5 + (hash(c, id) - 0.5) * 0.5) * w / n); const len = Math.round((8 + hash(c, id + 3) * 5) * Math.min(1, 0.35 + k * (1.6 - c * 0.2)));
    for (let j = 0; j < len; j++) { R(ctx, '#0c2040', x, yy - 2 + j, 2, 1); if (hash(j + c * 9, id) > 0.45) x += hash(j, id + c) > 0.5 ? 1 : -1; } } };
const hullArt = (w) => {                 // a panel of the ship's hull riding a thruster
  const ins = (i, j) => (i >= 1 && i <= w && j >= 1 && j <= 7) || (j >= 8 && j <= 10 && Math.abs(i - 1 - (w >> 1)) < 6 - (j - 8));
  return outlined(w + 2, 13, ins, (i, j) => { const a = i - 1, b = j - 1; if (b >= 7) return b === 7 ? '#4a5468' : '#262e40'; const end = Math.min(a, w - 1 - a);
    if (b === 0) return '#f4f7fc'; if (end < 7 && b < 6) return (a + b) % 4 < 2 ? '#f0a820' : '#16181e'; if (b === 1) return '#c0cada'; if (b === 6) return '#2c3448'; if (b === 3 && a % 6 === 3) return '#2c3448'; return b < 4 ? '#8a96ac' : '#66728a'; });
};
const artCache = new Map();
const platArt = (kind, w, s) => { const k = kind + ':' + w + ':' + s; let c = artCache.get(k); if (!c) artCache.set(k, c = (kind === 'ledge' ? ledgeArt : kind === 'crumble' ? crumbArt : kind === 'mov' ? hullArt : bergArt)(w, s)); return c; };

export function skin(B, K, D) {
  const P = { base: '#3a78b8', hi: '#d4f2ff', top: '#93d2f4', deep: '#1e4484', dark: '#16346a', wall: '#223a68', lamp: '#ffb43a', glow: '#8ae8ff' };

  // ---------- sky: night-blue down to a teal horizon, the black hole low in it ----------
  const skyC = pix(320, 240, (i, j) => dith(SKY, Math.min(1, j / 100), i, j));
  { const x = skyC.getContext('2d'); stars(x, 320, 90, 7, 120);
    glow(x, 212, 58, 60, '#b8441a', 0.28); glow(x, 212, 52, 36, '#f07a2a', 0.3);
    const g = blackHole(17, 0.15, { tilt: 0.22 }); x.drawImage(g, 212 - (g.width >> 1), 50 - (g.height >> 1)); }

  // ---------- far: frozen cloud mountains ----------
  const u6 = TAU / 640;
  const crestF = (i) => 54 - 24 * Math.abs(Math.sin(i * u6 * 1.5 + 0.6)) - 9 * Math.abs(Math.sin(i * u6 * 5.5 + 2)) - 4 * Math.abs(Math.sin(i * u6 * 14.5 + 1));
  const far = pix(640, 140, (i, j) => { const t = crestF(i); if (j < t) return null; if (j - t < 1) return '#86a8c4';
    const puff = Math.abs(Math.sin(i * u6 * 14.5 + 1)); return dith(['#50728f', '#3a587c', '#2b4268', '#203356', '#182848'], (j - t) / 44 + (1 - puff) * 0.22, i, j); });

  // ---------- mid: the nearer ice ridge, a tail fin of the ship sticking out of it ----------
  const tri = (v) => Math.abs((((v % 1) + 1) % 1) - 0.5) * 2;
  const crestM = (i) => 70 - 34 * tri(i / 640 * 3 + 0.2) - 16 * tri(i / 640 * 8 + 0.5) - 6 * tri(i / 640 * 20 + 0.1);
  const mid = pix(640, 150, (i, j) => { const t = crestM(i); if (j < t) return null; const up = crestM(i + 1) < t;
    if (j - t < 1) return up ? '#7ea6cc' : '#3e6292';
    if (Math.abs(((i * 0.4 + j) % 17) - 8) < 0.6 && hash(Math.floor((i * 0.4 + j) / 17), 4) > 0.5) return '#2c4c7c';
    return dith(up ? ['#2e4e7e', '#243f6a', '#1a3058', '#132446', '#0d1a36'] : ['#1c3258', '#162848', '#111f3c', '#0c1830', '#0a142a'], (j - t) / 70, i, j); });
  { const x = mid.getContext('2d');
    for (let i = 0; i < 40; i++) { const top = i < 26 ? 46 - i * 1.25 : i < 34 ? 14 : 14 + (i - 34) * 6, bot = Math.round(crestM(432 + i)) + 2; if (bot <= top) continue;
      R(x, '#070b16', 432 + i, top - 1, 1, bot - top + 1); R(x, i % 9 === 4 ? '#1c2434' : '#343e54', 432 + i, top, 1, bot - top); R(x, '#6a7690', 432 + i, top, 1, 1); }
    R(x, '#8c4a2a', 452, 22, 12, 3); }

  // ---------- near: only ever seen through the caves in the wall: a twilight icefield, haze on its horizon, dark spires ----------
  const near = pix(400, 240, (i, j) => { if (j < 112) return null;
    const k = Math.floor(i / 50), c = k * 50 + 14 + Math.floor(hash(k, 3) * 22), h = 18 + hash(k, 9) * 42, hw = 6 + hash(k, 5) * 9, d = Math.abs(i - c);
    const gnd = Math.round(174 - 3 * Math.sin(i * TAU / 100) - 2 * Math.sin(i * TAU / 40 + 1)), top = Math.round(gnd + 8 - h * Math.max(0, 1 - Math.pow(d / hw, 0.8)));
    if (d < hw && j >= top && j < gnd + 8) return j === top || (i < c && d > hw - 2) ? '#5a94b8' : i <= c ? dith(['#1c3a66', '#12264c'], (j - top) / 40, i, j) : '#0a1630';
    if (j < gnd) return dith(['#163a5e', '#1e4c6e', '#286080', '#34768e', '#44909e'], (j - 112) / (gnd - 112), i, j);
    if (j === gnd) return '#8cc8d4';
    return dith(['#3c7c9c', '#2c5e88', '#204874', '#17345c', '#0f2246'], (j - gnd) / 34, i, j); });

  // ---------- the wall: a glacier face with the wreck frozen into it. 384 x 168, world y 36..204 ----------
  const WW = 384, u = TAU / WW;
  const A = arcadeCanvas(WW, 36), x = A.x, Y = A.Y;
  const PEAKS = [[370, 15, 60], [6, 22, 46], [32, 14, 70], [52, 12, 88], [344, 12, 92]];   // seracs over the gallery: [centre, half width, top]
  const topY = [], lit = [];
  for (let i = 0; i < WW; i++) { let t = 110, l = false;
    for (const [cx, hw, top] of PEAKS) for (const o of [-WW, 0, WW]) { const d = i - cx - o; if (Math.abs(d) < hw) { const yy = top + (110 - top) * Math.pow(Math.abs(d) / hw, 1.3) + Math.floor(hash(Math.floor(i / 3), 7) * 3); if (yy < t) { t = yy; l = d < 0; } } }
    if (i > 92 && i < 160) { const yy = 110 - 12 * Math.pow(Math.sin(Math.PI * (i - 92) / 68), 0.7); if (yy < t) { t = yy; l = i < 122; } }
    if (i > 190 && i < 320) { const yy = 110 - 15 * Math.pow(Math.sin(Math.PI * (i - 190) / 130), 0.6); if (yy < t) { t = yy; l = i < 236; } }
    topY[i] = Math.round(t); lit[i] = l; }
  const strata = (i, y) => (y + 5 * Math.sin(i * u * 2) + 2.5 * Math.sin(i * u * 7 + 1)) / 10;
  const ICE = ['#2c4a7e', '#243e6e', '#1d335e', '#182a50', '#132242', '#0f1b36'];
  const iceCol = (i, y, lift = 0) => { const s = strata(i, y), b = Math.floor(s), fl = s - b;
    if (fl < 0.11) return hash(i, b) > 0.3 ? '#42689e' : '#2c4a7e';
    if (fl > 0.89) return '#0c1630';
    if (hash(i * 7 + 3, y * 13 + 1) > 0.988) return '#5a84b4';
    return dith(ICE, clamp(0.12 + hash(b, 3) * 0.3 + (y - 100) / 104 * 0.5 - lift, 0, 1), i, y); };
  const ARCH = [[56, 30, 158, 28], [292, 27, 160, 26]];          // caves through to the sky: [centre, half width, spring line, rise]
  const inArch = (i, y, g = 0) => ARCH.some(([cx, hw, ys, r]) => { const d = Math.abs(i - cx); if (d >= hw + g) return false; return y >= ys || (d / (hw + g)) ** 2 + ((ys - y) / (r + g)) ** 2 < 1; });
  const icl = new Array(WW).fill(0); { const n = noise(5); let i = 2; while (i < WW - 3) { const len = 3 + Math.floor(n() * 8); icl[i] = Math.max(icl[i], len - 3); icl[i + 1] = len; icl[i + 2] = Math.max(icl[i + 2], len - 4); i += 4 + Math.floor(n() * 7); } }
  const drift = Array.from({ length: WW }, (_, i) => Math.round(195 - 4 * Math.abs(Math.sin(i * u * 3 + 1)) - 2 * Math.abs(Math.sin(i * u * 8.5))));
  x.drawImage(pix(WW, 168, (i, j) => { const y = 36 + j;
    if (y < 110) { const t = topY[i]; if (y < t) return null; if (y === t) return lit[i] ? '#b4d8f0' : '#5e8cbc'; if (y === t + 1 && lit[i]) return '#6a9ccc'; return iceCol(i, y, lit[i] ? 0.2 : -0.12); }
    if (y < 118) { if (y === 110) return hash(i, 1) > 0.2 ? '#8fbfe2' : '#c2e2f6'; if (y === 111) return '#5e94c4'; if (y === 117) return '#0c1630'; return dith(['#3f6ea4', '#2c5288'], (y - 112) / 5, i, y); }
    if (inArch(i, y)) return inArch(i + 5, y - 4) ? null : dith(['#0d1834', '#080f24'], (y - 126) / 70, i, y);        // the thickness of the ice, seen through the cave mouth
    if (inArch(i, y, 2)) return inArch(i + 2, y + 2) ? '#86b6dc' : '#3a6494';
    if (y - 118 < icl[i]) return y - 118 === icl[i] - 1 ? '#c2e2f6' : icl[i - 1] < icl[i] && icl[i + 1] < icl[i] ? '#8fbfe2' : '#5e94c4';
    if (y >= drift[i]) return y === drift[i] ? '#7aaad0' : dith(['#4a78a8', '#2e5484'], (y - drift[i]) / 8, i, y);
    return iceCol(i, y); }), 0, 0);
  // cracks: a dark line with a pale edge
  const crack = (pts) => { for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let s = 0; s <= n; s++) { const cx = Math.round(x0 + (x1 - x0) * s / n), cy = Math.round(y0 + (y1 - y0) * s / n); R(x, '#070d20', cx, Y(cy)); R(x, '#5a84b4', cx + 1, Y(cy)); } } };
  crack([[96, 120], [101, 136], [95, 152], [103, 170], [99, 190]]); crack([[101, 136], [108, 144]]); crack([[95, 152], [90, 160]]);
  crack([[252, 119], [247, 132], [256, 150], [250, 172], [255, 188]]); crack([[256, 150], [262, 156]]);
  crack([[330, 122], [337, 146], [331, 166], [339, 196]]); crack([[14, 122], [9, 140], [16, 158], [10, 182]]); crack([[372, 124], [378, 150], [370, 176]]);
  crack([[150, 122], [158, 140], [151, 158], [160, 176], [154, 196]]); crack([[158, 140], [168, 146]]); crack([[204, 120], [198, 138], [206, 160], [200, 184]]); crack([[206, 160], [214, 166]]);
  // a lamp the expedition left in the first cave
  R(x, '#05070c', 56, Y(131), 1, 9); box(x, 54, Y(140), 5, 6, '#3a4458', '#8a96b0', '#161c2c');
  for (let s = 0; s <= 50; s++) { const t = s / 50; R(x, '#05070c', 150 + 50 * t, Y(118 + 7 * Math.sin(t * Math.PI))); }       // a cable slung under the gallery

  // The wreck lies along the glacier in pieces, so the wall changes as you run: each 384 px of wall gets one of four overlays.
  const layer = (fn) => { const c = cv(WW, 168); fn(c.getContext('2d')); return c; };
  const PORT = ['...#####...', '..#rrrrr#..', '.#rAAAAAr#.', '#rAAhhAAAr#', '#rAhhAAAAr#', '#rAAAAAAar#', '#rAAAAAaar#', '#rAAAAaaar#', '.#rAaaaar#.', '..#rrrrr#..', '...#####...'];
  const LIT = { '#': '#05070c', r: '#6a7690', A: '#ffb43a', h: '#fff0b0', a: '#d8781a' }, DEAD = { '#': '#05070c', r: '#56627c', A: '#141c2c', h: '#2a3850', a: '#0c1220' };
  // a section of hull frozen into the face. kind 0: the name, three ports, the crew hatch. kind 1: the cargo bay
  const hull = (x, kind) => { const hc = cv(132, 76), hx = hc.getContext('2d');
    panels(hx, 0, 0, 132, 76, { base: '#39435a', top: '#56627c', deep: '#161c2c', dark: '#2e384c' }, 24, 12, noise(31 + kind * 7), 3);
    R(hx, '#8a96b0', 0, 0, 132, 1);
    for (let i = 0; i < 132; i++) if (hash(i >> 1, 5 + kind) > 0.22) R(hx, '#8c4a2a', i, 7, 1, 3);
    R(hx, '#161c2c', 0, 24, 132, 2); rivets(hx, 3, 27, 126, 6, '#7a86a0'); R(hx, '#161c2c', 0, 55, 132, 2); rivets(hx, 3, 58, 126, 6, '#7a86a0');
    if (kind === 0) {
      drawText(hx, 'HALCYON 7', 12, 13, { fill: '#aab4c8', outline: '#161c2c' });
      R(hx, '#161c2c', 0, 64, 96, 3); R(hx, '#6a7690', 0, 64, 96, 1); box(hx, 40, 62, 6, 6, '#56627c', '#8a96b0', '#222a3c');   // a conduit and its valve
      for (const [k, cx] of [26, 52, 78].entries()) { if (k < 2) glow(hx, cx, 40, 13, '#ffa030', 0.5); px(hx, cx - 5, 35, PORT, k < 2 ? LIT : DEAD); }
      for (let k = 0; k < 6; k++) R(hx, '#56627c', 75 + k, 37 + k);                                                         // the dead one is cracked
      for (let i = 0; i < 30; i++) for (let j = 0; j < 4; j++) R(hx, (i + j) % 6 < 3 ? '#c8922a' : '#16181e', 95 + i, 29 + j);
      box(hx, 98, 35, 24, 41, '#2a3246', '#6a7690', '#161c2c'); R(hx, '#161c2c', 110, 36, 1, 40); box(hx, 101, 39, 7, 5, '#0c1220', '#8a6a2a', '#05070c'); box(hx, 113, 39, 7, 5, '#0c1220', '#8a6a2a', '#05070c'); R(hx, '#8a96b0', 107, 54, 2, 5); R(hx, '#8a96b0', 112, 54, 2, 5);
      box(hx, 125, 44, 4, 6, '#161c2c', '#56627c', '#05070c');                                                             // the keypad (its light is live)
    } else {
      drawText(hx, 'BAY 02', 82, 13, { fill: '#aab4c8', outline: '#161c2c' });
      // the outfitter's name, stencilled beside the bay number years ago: thinner paint, scoured by the wind (the only mark on this level)
      LOGO.W7.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') { const w = hash(i, j + 61), patch = hash(i >> 2, (j >> 2) + 62); if (w < 0.05 || (patch < 0.12 && w < 0.4)) continue; R(hx, patch < 0.4 ? '#66728c' : j < 2 ? '#8e9ab2' : '#7e8aa4', 10 + i, 13 + j); } });
      for (let i = 0; i < 62; i++) for (let j = 0; j < 4; j++) R(hx, (i + j) % 6 < 3 ? '#c8922a' : '#16181e', 13 + i, 29 + j);    // the big door, jammed a hand's width open, light still on inside
      box(hx, 16, 35, 56, 41, '#2a3246', '#6a7690', '#161c2c'); R(hx, '#05070c', 42, 36, 4, 40); glow(hx, 44, 58, 10, '#ffa030', 0.4); R(hx, '#ffb43a', 43, 38, 2, 38); R(hx, '#fff0b0', 43, 44, 1, 20);
      for (const dx of [20, 50]) { for (let j = 0; j < 5; j++) R(hx, '#1c2434', dx, 42 + j * 6, 18, 2); box(hx, dx + 5, 68, 8, 4, '#56627c', '#8a96b0', '#161c2c'); }
      glow(hx, 90, 40, 13, '#ffa030', 0.5); px(hx, 85, 35, PORT, LIT); px(hx, 107, 35, PORT, DEAD);
      box(hx, 82, 60, 36, 12, '#161c2c', '#56627c', '#05070c'); for (let j = 0; j < 4; j++) R(hx, '#6a7690', 84, 62 + j * 3, 32, 1);   // a vent
    }
    hx.globalAlpha = 0.3; R(hx, '#060a16', 0, 58, 132, 18); hx.globalAlpha = 1;
    for (let j = 0; j < 76; j++) { const a = 2 + Math.floor(hash(j >> 1, 9 + kind) * 6) + (j % 14 < 3 ? 4 : 0); hx.clearRect(0, j, a, 1); const b = Math.floor(j * 0.1 + hash(j >> 2, 11 + kind) * 4); hx.clearRect(132 - b, j, b, 1); }
    for (let i = 106; i < 248; i++) for (let y = 124; y < 204; y++) if (!inArch(i, y, 2)) R(x, iceCol(i, y), i, Y(y));      // sound ice round it (no cracks showing through)
    x.drawImage(hc, 110, Y(128));
    for (let i = 112; i < 240; i++) { if (hash(i, 12) > 0.45) R(x, '#9cc8e8', i, Y(128)); if (hash(i, 13) > 0.8) R(x, '#c2e2f6', i, Y(127)); if (hash(i, 14) > 0.86) R(x, '#7aaad0', i, Y(129), 1, 1 + Math.floor(hash(i, 15) * 4)); }
    x.globalAlpha = 0.35; for (let k = 0; k < 26; k++) { const fx = 116 + Math.floor(hash(k, 16) * 118), fy = 132 + Math.floor(hash(k, 17) * 60); for (let s = 0; s < 4; s++) R(x, '#9cc8e8', fx + s, Y(fy - s)); } x.globalAlpha = 1;   // frost on the plates
    for (const ry of [140, 157, 173]) { R(x, '#070b16', 103, Y(ry), 12, 3); R(x, '#56627c', 103, Y(ry), 12, 1); }       // torn ribs
    for (let s = 0; s <= 26; s++) { const t = s / 26; R(x, '#05070c', 112 - 9 * Math.sin(t * Math.PI * 0.5), Y(146 + 30 * t)); }  // a cable hanging out of the tear
    for (let i = 108; i < 246; i++) { const d = Math.round(194 - 3 * Math.abs(Math.sin(i * 0.11)) + Math.max(0, 12 - (i - 108) * 0.8, 12 - (245 - i) * 0.8)); if (d >= 204) continue; R(x, '#7aaad0', i, Y(d)); R(x, '#4a78a8', i, Y(d + 1), 1, 204 - d); }   // snow drifted against it
  };
  // an engine nacelle torn off and half buried on top of the glacier
  const nacelle = (x) => {
    for (let i = 206; i <= 300; i++) {
      const cy = 86 - (i - 206) * 0.09, rad = i < 212 ? 9 + (i - 206) * 0.5 : 12; let top = Math.round(cy - rad), bot = Math.round(cy + rad);
      if (i > 286) { top += Math.floor(hash(i, 77) * (i - 286) * 0.9); bot -= Math.floor(hash(i, 78) * (i - 286) * 0.8); if (bot - top < 2) continue; }
      R(x, '#04060c', i, Y(top - 1), 1, bot - top + 2);
      for (let y = top; y < bot; y++) R(x, dith(METAL, (y - top) / (bot - top) * 1.05 - 0.03, i, y), i, Y(y));
      if ((i - 206) % 20 === 14) R(x, '#141a28', i, Y(top + 1), 1, bot - top - 1);
      if (i >= 218 && i < 224) for (let y = top + 2; y < bot - 1; y++) if ((i + y) % 4 < 2) R(x, y - top < 10 ? '#c8922a' : '#7a5a1e', i, Y(y));
      if (i > 232 && i < 280 && (i - 232) % 3 === 0) R(x, '#222a3c', i, Y(top + 9), 1, 6);                                       // cooling slots
      if (hash(i, 79) > 0.4) R(x, '#b4d8f0', i, Y(top - 1)); }
    R(x, '#04060c', 203, Y(75), 5, 23); R(x, '#8a96b0', 204, Y(76), 3, 21); R(x, '#0a0e18', 205, Y(79), 1, 15);                    // the intake lip
    for (const [ry, len] of [[78, 12], [85, 16], [92, 9]]) { R(x, '#04060c', 296, Y(ry), len, 3); R(x, '#6a7690', 296, Y(ry), len, 1); }  // ribs sticking out of the torn end
    for (let s = 0; s <= 30; s++) { const t = s / 30; R(x, '#04060c', 300 + 12 * t, Y(88 + 17 * Math.pow(t, 1.7))); }               // a cable hanging off it (it sparks: wallFx)
    for (let i = 196; i < 314; i++) { const d = Math.round(110 - 12 * Math.pow(Math.sin(Math.PI * (i - 196) / 118), 0.7)); R(x, '#b4d8f0', i, Y(d)); for (let y = d + 1; y < 110; y++) R(x, iceCol(i, y, 0.2), i, Y(y)); }
  };
  const mast = (x) => { R(x, '#04060c', 175, Y(76), 3, 34); R(x, '#6a7690', 176, Y(76), 1, 34); R(x, '#04060c', 170, Y(83), 13, 3); R(x, '#6a7690', 171, Y(84), 11, 1); box(x, 174, Y(71), 5, 5, '#222a3c', '#6a7690', '#141a28');
    R(x, '#04060c', 169, Y(79), 3, 5); R(x, '#8a96b0', 170, Y(80), 1, 3); R(x, '#04060c', 182, Y(80), 3, 4); R(x, '#8a96b0', 183, Y(81), 1, 2);
    for (let s = 0; s <= 12; s++) { R(x, '#141a28', 175 - s * 1.1, Y(86 + s * 2)); R(x, '#141a28', 178 + s * 1.1, Y(86 + s * 2)); } };
  const pole = (x) => { R(x, '#04060c', 127, Y(68), 3, 32); R(x, '#8a96b0', 128, Y(68), 1, 32); };
  // things frozen into the ice: an explorer who didn't make it, a slab of wing, a strut
  const frozen = (x, cx, cy, stamp, pal, rx, ry) => { for (let i = -rx; i <= rx; i++) for (let j = -ry; j <= ry; j++) { const e = (i / rx) ** 2 + (j / ry) ** 2 + (hash((cx + i) >> 1, (cy + j) >> 1) - 0.5) * 0.5; if (e < 1 && !inArch(cx + i, cy + j, 2)) R(x, iceCol(cx + i, cy + j, 0.36 - e * 0.22), cx + i, Y(cy + j)); }
    px(x, cx - (stamp[0].length >> 1), Y(cy - (stamp.length >> 1)), stamp, pal);
    for (let k = 0; k < ry; k++) { R(x, '#7aa6d4', cx - rx * 0.45 + k * 0.5, Y(cy - ry * 0.7 + k)); if (k < ry * 0.6) R(x, '#7aa6d4', cx + rx * 0.2 + k * 0.5, Y(cy - ry * 0.2 + k)); } };
  const EXPLORER = ['......####......', '.....#oooo#.....', '....#ovvvvo#....', '....#ovvvvo#....', '....#oooooo#....', '.....#oooo#.....', '...##oooooo##...', '..#oooooooooo#..', '.#oo#oooooo#oo#.', '.#o#.#oooo#.#o#.', '#oo#.#oooo#.#oo#', '#o#..#oooo#..#o#', '.#...#oooo#...#.', '.....#o##o#.....', '.....#o##o#.....', '....#oo##oo#....', '....#o#..#o#....', '....#o#..#o#....', '...#oo#..#oo#...', '...####..####...'];
  const WING = ['..............................####......', '..........................####mmmm#.....', '......................####mmmmmmmmm#....', '.................#####mmmmmmmmmmmmmm#...', '.............####mmmmmmssssssssmmmmmm#..', '.........####mmmmmmmmmmssssssssmmmmmmm#.', '.....####mmmmmmmmmmmmmmmmmmmmmmmmmmmmmm#', '.####mmmmmmmmmdmmmmmmmmmdmmmmmmmmmdmmmm#', '#mmmmmmmmmmmmmdmmmmmmmmmdmmmmmmmmmdmmm#.', '.###mmmmmmmmmmdmmmmmmmmmdmmmmmmmmmdm##..', '....####mmmmmmmmmmmmmmmmmmmmmmmm###.....', '........#####mmmmmmmmmmmmmm#####........', '.............##############.............'];
  const FROZ = { '#': '#070d20', o: '#5a7eae', v: '#d8a03c', m: '#566a8c', d: '#2c3c58', s: '#b0623a' };
  const TILES = [
    layer((x) => { hull(x, 0); mast(x); }),
    layer((x) => { frozen(x, 172, 158, EXPLORER, FROZ, 17, 22); pole(x); px(x, 4, Y(162), ['..####....', '.#mmmm##..', '#mmmmmmm#.', '.##mmmmmm#', '...####mm#', '.......##.'], FROZ); }),
    layer((x) => { hull(x, 1); nacelle(x); }),
    layer((x) => { frozen(x, 176, 160, WING, FROZ, 30, 18); pole(x); for (let k = 0; k < 12; k++) { R(x, '#0b1430', 366 + k, Y(186 - k)); R(x, '#35486c', 366 + k, Y(185 - k)); } }),
  ];

  // ---------- the floor: packed blue ice under a bright cap of snow ----------
  const dk = pix(96, 40, (i, j) => { if (j === 0) return '#f0faff'; if (j === 1) return hash(i, 4) > 0.25 ? '#bfe6fa' : '#f0faff'; if (j === 2) return hash(i, 6) > 0.5 ? '#7fb8e0' : '#4f8cc4';
    const d = i * 0.5 + j * 1.2; if (j < 17 && Math.abs((d % 24) - 12) < 0.55 && Math.floor(d / 24) % 2 === 0) return '#8cc4ec';
    if (hash(i * 3 + 1, j * 5 + 2) > 0.985) return '#6aa6d8';
    if ((j === 14 || j === 26) && hash(i, j) > 0.35) return '#2e5a94';
    return dith(['#3c72aa', '#2c5890', '#1e4274', '#143058', '#0c2040'], (j - 3) / 34, i, j); });
  const pit = pitCycle(['#050a1c', '#0a1630', '#102448', '#1a3a66', '#3a7ab0', '#8ad0f0', '#1a3a66', '#0a1630'], 7);

  // ---------- platforms ----------
  const plat = (ctx, p, px0, py0, w0, f) => {
    let xx = Math.round(px0), yy = Math.round(py0); const w = Math.round(w0), mov = p.kind === 'movev' || p.kind === 'moveh';
    const kind = mov ? 'mov' : p.kind === 'ledge' || p.kind === 'crumble' ? p.kind : 'berg', c = platArt(kind, w, kind === 'mov' ? 0 : p.id % 5);
    if (kind === 'crumble') {
      if (p.gone) {                                              // it bursts: five lumps thrown apart and down, and a puff of frost where it was
        const t = p.fallT || 0, n = 5, cw = Math.ceil(c.width / n), y0 = yy - t * t * 0.08;          // (render has already dropped yy: put the lumps back and let each fall its own way)
        ctx.globalAlpha = Math.max(0, 1 - t / 34);
        for (let i = 0; i < n; i++) { const u = (i - (n - 1) / 2) / n, hx = hash(i, p.id) - 0.5; ctx.drawImage(c, i * cw, 0, Math.min(cw, c.width - i * cw), c.height, Math.round(xx - 1 + i * cw + u * t * 1.6 + hx * t * 0.5), Math.round(y0 - 1 - CL_TOP + t * t * (0.05 + hash(i, p.id + 1) * 0.05) - t * (0.6 + hx)), Math.min(cw, c.width - i * cw), c.height); }
        ctx.globalAlpha = Math.max(0, 0.8 - t / 22);
        for (let k = 0; k < 12; k++) { const a = hash(k, p.id + 5) * TAU, d = 2 + t * (0.5 + hash(k, p.id + 6)); R(ctx, k % 3 ? '#ffffff' : '#bfe8ff', xx + w / 2 + Math.cos(a) * (w / 3 + d), y0 + 3 + Math.sin(a) * (3 + d * 0.5), k % 4 ? 1 : 2, k % 4 ? 1 : 2); }
      } else {
        const k = p.crumble > 0 ? 1 - p.crumble / 26 : 0, bob = p.crumble > 0 ? 0 : Math.round(Math.sin((f + p.id * 37) / 22) * 1.2);
        if (k > 0) { yy += 1 + (f % 4 < 2 ? 1 : 0) + Math.round(k * 2); xx += (f % 3) - 1; }
        ctx.drawImage(c, xx - 1, yy - 1 - CL_TOP + bob);
        if (k > 0) { cloudCracks(ctx, xx, yy - CL_TOP + 2, w, p.id, k); for (let j = 0; j < 6; j++) R(ctx, j % 2 ? '#ffffff' : '#bfe8ff', xx + 2 + Math.floor(hash(j, p.id) * (w - 4)), yy + 8 + ((f * 2 + j * 5) % 18), 1, j % 3 ? 1 : 2); }
        else for (let j = 0; j < 3; j++) { const t = (f + j * 31 + p.id * 13) % 90; if (t < 12) R(ctx, '#ffffff', xx + 3 + Math.floor(hash(j, p.id + Math.floor((f + j * 31) / 90)) * (w - 6)), yy - 2 - (t >> 2), 1, 1); }      // it glitters while it waits
      }
      ctx.globalAlpha = 1; return;
    }
    if (p.gone) ctx.globalAlpha = Math.max(0, 1 - (p.fallT || 0) / 40);
    ctx.drawImage(c, xx - 1, yy - 1);
    if (mov) { const m = xx + (w >> 1), fl = (f >> 1) % 3; R(ctx, '#3a8aff', m - 2, yy + 11, 4, 2 + fl); R(ctx, '#bfe8ff', m - 1, yy + 11, 2, 1 + fl); R(ctx, '#ffffff', m - 1, yy + 11, 2, 1); if ((f >> 4) % 2) R(ctx, '#ffb43a', xx + 8, yy + 3, 2, 2); }
    ctx.globalAlpha = 1;
  };
  // where the drips come from: a cluster of icicles under the gallery, the big one growing until it lets go
  const pipe = (ctx, cx, Yw, prog, f) => { const y0 = Yw(118);
    R(ctx, '#000000', cx - 9, y0 - 1, 19, 3); R(ctx, '#d4f2ff', cx - 8, y0 - 1, 17, 1); R(ctx, '#3a78b8', cx - 8, y0, 17, 1);
    for (const [dx, h] of [[-7, 3], [-4, 5], [4, 6], [7, 3]]) { R(ctx, '#000000', cx + dx - 1, y0 + 1, 3, h + 1); R(ctx, '#8cc8ee', cx + dx, y0 + 1, 1, h); R(ctx, '#ffffff', cx + dx, y0 + 1, 1, 1); }
    const L = 4 + Math.floor(prog * 7);
    R(ctx, '#000000', cx - 2, y0 + 1, 5, L - 1); R(ctx, '#000000', cx - 1, y0 + L, 3, 2); R(ctx, '#000000', cx, y0 + L + 2, 1, 1);
    R(ctx, '#6ad0f4', cx - 1, y0 + 1, 3, L - 2); R(ctx, '#ffffff', cx - 1, y0 + 1, 1, L - 2); R(ctx, '#6ad0f4', cx, y0 + L - 1, 1, 2);
    if (prog > 0.72 && (f >> 2) % 2) R(ctx, '#ffffff', cx, y0 + L, 1, 2);
  };
  const DRIP = { drop: '#bff4ff', glint: '#ffffff', pool: ['#1a6a9a', '#4ac8f0', '#c8f8ff'], top: ['#ffffff', '#8ae8ff'] };

  // ---------- live: the beacon, the flag, the lights (wall); mini black holes (backdrop); a little snow (front) ----------
  let scroll = 0;                                    // how far the wall has scrolled (backFx is told, wallFx is not)
  const wallFx = (ctx, base, Yw, f) => {
    if (base > 330 || base + WW < -10) return;
    const v = ((Math.round((scroll + base) / WW) % 4) + 4) % 4;
    ctx.drawImage(TILES[v], base, Yw(36));
    const lf = (f >> 2) % 5; glow(ctx, base + 56, Yw(143), 9, '#ffa030', 0.45 + (lf === 0 ? 0.12 : 0)); R(ctx, '#ffe2a0', base + 55, Yw(142), 3, 3);   // the cave lamp
    if (v === 0) {                                   // the mast's beacon, a porthole on the blink, the hatch keypad
      const bx = base + 176, by = Yw(73), t = f % 100, on = t < 9 || (t > 15 && t < 24);
      if (on) glow(ctx, bx, by, 9, '#ff4a2a', 0.7); R(ctx, on ? '#ffd0a0' : '#5a1a14', bx - 1, by - 1, 3, 3); if (on) R(ctx, '#ff4a2a', bx - 2, by, 5, 1);
      if (hash(f >> 3, 3) > 0.9) { ctx.globalAlpha = 0.45; R(ctx, '#05070c', base + 110 + 48, Yw(164), 9, 9); ctx.globalAlpha = 1; }
      R(ctx, (f >> 5) % 2 ? '#ff3a2a' : '#5a1a14', base + 110 + 126, Yw(128 + 45), 2, 2);
    } else if (v === 2) {                            // sparks off the torn cable, the light in the cargo bay guttering
      const st = f % 140; if (st < 22) for (let k = 0; k < 4; k++) { const a = hash(k, (f / 140) | 0); R(ctx, st < 8 ? '#ffffff' : '#ffb43a', base + 312 + (a - 0.5) * st * 1.2, Yw(105) + st * (0.4 + a) + st * st * 0.03, 1, 1); }
      if (hash(f >> 2, 8) > 0.85) { ctx.globalAlpha = 0.5; R(ctx, '#05070c', base + 110 + 42, Yw(128 + 36), 4, 40); ctx.globalAlpha = 1; }
    } else {                                         // the expedition's flag
      for (let c = 0; c < 15; c++) { const fy = Yw(70) + Math.round(Math.sin(f / 7 - c / 2.2) * (c / 7)); R(ctx, '#000000', base + 130 + c, fy - 1, 1, 10); R(ctx, v === 1 ? '#e07a34' : '#d8d0c0', base + 130 + c, fy, 1, 8); R(ctx, v === 1 ? '#ffb070' : '#ffffff', base + 130 + c, fy, 1, 1); if (c > 4 && c < 10) R(ctx, '#16181e', base + 130 + c, fy + 2 + (c === 5 || c === 9 ? 1 : 0), 1, c === 5 || c === 9 ? 2 : 4); }
    }
  };
  const miniBg = frames(8, (p) => blackHole(4, p, { tilt: 0.32, pal: ['#e8f0ff', '#aab8f0', '#7078d0', '#4848a8', '#2c2c78', '#18184a'] }));
  const backFx = (ctx, f, fdist, cam) => {
    scroll = Math.floor(fdist);
    for (let k = 0; k < 2; k++) { const span = 620, mx = 350 - ((((fdist * 0.1 + f * 0.1 + k * 330) % span) + span) % span), my = 18 + k * 13 + Math.sin(f / 80 + k * 2) * 5 + (60 - cam) * 0.3;
      if (mx < -30 || mx > 350) continue;
      gravWarp(ctx, mx, my, 4, f, 1, 40); const c = miniBg[(f >> 2) % 8]; ctx.drawImage(c, Math.round(mx) - (c.width >> 1), Math.round(my) - (c.height >> 1));
      for (let s = 0; s < 4; s++) { const a = f * 0.05 + s * 1.57 + k; R(ctx, s % 2 ? '#aab8f0' : '#ffffff', mx + Math.cos(a) * 10, my + Math.sin(a) * 10); } }
  };
  const snow = (ctx, f, drift0 = 0, n = 16) => { for (let k = 0; k < n; k++) { const sp = 0.4 + hash(k, 2) * 0.7, sx = ((((hash(k, 1) * 360 - f * sp * 0.9 - drift0 * 0.35) % 360) + 360) % 360) - 20 + Math.sin(f / 30 + k) * 3, sy = ((hash(k, 3) * 200 + f * sp * 0.6) % 200) - 10; R(ctx, sp > 0.9 ? '#ffffff' : '#a8c8e4', sx, sy, sp > 1 ? 2 : 1, 1); } };
  const frontFx = (ctx, f, fdist) => snow(ctx, f, fdist, 16);

  // ---------- the baddies: white suits on a dark wall, outlined so they never melt into the snow ----------
  const ol = (g) => { const c = cv(g.c.width + 2, g.c.height + 2), cx = c.getContext('2d'), k = tint(g, '#04060c', 1).c; cx.drawImage(k, 0, 1); cx.drawImage(k, 2, 1); cx.drawImage(k, 1, 0); cx.drawImage(k, 1, 2); cx.drawImage(g.c, 1, 1); return { c, ox: g.ox + 1, oy: g.oy + 1 }; };
  const liar = K.liar.map(ol), pukerF = tintAll(K.liar, '#ffb43a', 0.22).map(ol), big = K.liar.map((g) => ol(scaleFr(g, 1.35)));
  const iceF = ol(B.ice), iceS = ol(scaleFr(B.ice, 0.6)), drone = ol(fr(K.droneArt, 28, 18)), pod0 = ol(fr(K.pod(0), 22, 20)), pod1 = ol(fr(K.pod(1), 22, 20));
  const miniF = K.mini.map((c) => fr(c, c.width >> 1, c.height >> 1));
  const chr = { grunt: liar, puker: pukerF, brute: big.slice(0, 4), bruteDizzy: tint(big[0], '#8ae8ff', 0.4), brutePuke: [big[2]],
    ghoul: { sit: liar[0], leap: liar[3], land: liar[5] }, slime: { sit: iceF, sit2: iceF, up: iceF, down: iceF }, slimeSmall: { sit: iceS, sit2: iceS, up: iceS, down: iceS },
    biker: K.debris.map((c) => fr(c, 15, 24)), batF: miniF, batFlashF: tint(miniF[0], '#ffffff', 0.8), unicornFly: [drone], flyFlash: tint(drone, '#ffffff', 0.8),
    unicorn: [pod0], unicornPuke: pod1, unicornFlash: tint(pod0, '#ffffff', 0.8) };
  // the planet's own dangers (ice-art.js): ammonia geysers, hail off the frozen cloud, icicles that smash into shards, the slab robot to ride
  const DG = iceDangers(); Object.assign(chr, DG.chr);

  return { name: 'THE ICE PLANET', style: 'ice', P, drip: DRIP, puddle: DRIP, drawPipe: pipe, sky: skyC, far, farY: 30, mid, midY: 63, near, arcade: A.c, arcadeTop: 36, deck: dk, pit, pitUp: 4, fg: blank(), particles: 'drift',
    wallFx, backFx, frontFx, drawPlat: plat, extras: ['crumble'], blob: ['#1a6a9a', '#8ae8ff', '#ffffff'], titleFill: GRAD.blue, tintCol: '#bfe8ff', chr,
    danger: DG.danger, fx: DG.fx, labels: DG.labels,
    boss: singularity({ far, mid, dk, snow }) };
}

// =====================================================================================================================
// THE BOSS: THE SINGULARITY. One idea: don't touch it. It bounces round the arena, growing, until it collapses.
// =====================================================================================================================
const SURVIVE = 1500, FORM = 100, COLLAPSE = 56, TOP = 26;
const HP = ['#ffffff', '#ece2ff', '#c4a6ff', '#9060ff', '#5c2cd8', '#36168e', '#1c0c52'];
const holeArt = (r, t) => { const ext = Math.ceil(r * 2.5) + 1, size = ext * 2 + 1, tilt = 0.32;
  return pix(size, size, (ii, jj) => { const i = ii - ext, j = jj - ext, d = Math.hypot(i, j), e = Math.hypot(i, j / tilt), ang = Math.atan2(j / tilt, i), shadow = d < r;
    let b = 0;
    if (e > r * 1.3 && e < r * 2.45 && (j > 0 || !shadow)) b = (1 - (e - r * 1.3) / (r * 1.15)) * (0.72 + 0.36 * Math.sin(ang * 2 + t * TAU + e * 0.5));
    const rw = Math.max(1.1, r * 0.13), dr = Math.abs(d - r * 1.12);
    if (!shadow && dr < rw) b = Math.max(b, 1.1 - (dr / rw) * 0.35);                 // the thin bright ring
    if (!shadow && d < r * 1.8) b = Math.max(b, 0.26 * (1 - (d - r) / (r * 0.8)));   // and a faint halo
    if (b > 0.13) return HP[clamp(Math.floor((1 - Math.min(1, b)) * HP.length + hash(ii, jj) - 0.5), 0, HP.length - 1)];
    if (shadow) return d > r - 1.3 ? '#12062c' : '#000000';
    return null; }); };
const holeCache = new Map();
const holeFrame = (r, ph) => { const k = r * 8 + ph; let c = holeCache.get(k); if (!c) holeCache.set(k, c = holeArt(r, ph / 8)); return c; };

// ---- the rules. Kept pure (no sound, no hurting, no randomness) so the hole can look ahead with them, and so can a test ----
// He runs on his own, so all he chooses is when to jump. That makes fairness something the hole has to guarantee:
// every time it comes off a wall it picks its next line by trying each one out against him first, and only takes a line
// he can get clear of by doing nothing, or by one jump with a wide margin of timing and time to see it coming.
const radius = (T) => 6 + 5 * Math.min(1, T / SURVIVE), speed = (T, k = 1) => (1.3 + 0.5 * Math.min(1, T / SURVIVE)) * k;
// (play logic: no Math.hypot / sin / cos here. They are not guaranteed to give the same last digit in every browser, and the server replays this fight.)
const hyp = (x, y) => Math.sqrt(x * x + y * y), qcos = (a) => Math.round(Math.cos(a) * 4096) / 4096, qsin = (a) => Math.round(Math.sin(a) * 4096) / 4096;
const gapTo = (o, h, r) => { const cx = clamp(o.x, h.x - 5, h.x + 5), cy = clamp(o.y, h.y - 28, h.y - 2); return hyp(o.x - cx, o.y - cy) - r; };
const touching = (st) => !st.o.calm && gapTo(st.o, st.h, st.o.r * 0.82) < 0;
// one tick in a straight line; returns the walls it came off (1 = a side, 2 = floor or ceiling)
function advance(st) {
  const o = st.o; o.T++; o.r = radius(o.T);
  const sp = speed(o.T, o.k), m = hyp(o.vx, o.vy) || 1; o.vx *= sp / m; o.vy *= sp / m;
  o.x += o.vx; o.y += o.vy;
  let side = 0;
  if (o.x < o.r + 2) { o.x = o.r + 2; o.vx = Math.abs(o.vx); side |= 1; }
  if (o.x > BW - o.r - 2) { o.x = BW - o.r - 2; o.vx = -Math.abs(o.vx); side |= 1; }
  if (o.y < TOP + o.r) { o.y = TOP + o.r; o.vy = Math.abs(o.vy); side |= 2; }
  if (o.y > FL - o.r) { o.y = FL - o.r; o.vy = -Math.abs(o.vy); side |= 2; }
  for (const q of st.plats) {                       // ice it touches shatters, and freezes back a few seconds later
    if (q.gone) { if (++q.t > 270 && hyp(o.x - q.x, o.y - q.y) > o.r + 44) { q.gone = false; q.born = 24; } continue; }
    if (q.born > 0) q.born--;
    const cx = clamp(o.x, q.x - q.w / 2, q.x + q.w / 2), cy = clamp(o.y, q.y, q.y + 9);
    if (hyp(o.x - cx, o.y - cy) < o.r * 0.9) { q.gone = true; q.t = 0; st.broke = q; }
  }
  return side;
}
// try a line out against a list of button presses [from, to] (ticks from now). Runs to the hole's next bounce and a little past it
// (the hole waiting there). Returns the tightest gap between them by a stricter test than the real one, when that first failed,
// and the tightest gap by the real test.
function tryLine(st, vx, vy, presses, full) {
  const plats = st.plats.map((q) => ({ ...q })), c = { peek: true, h: { ...st.h, on: st.h.on ? plats[st.plats.indexOf(st.h.on)] : null }, o: { ...st.o, vx, vy, calm: false }, plats, events: [], portal: null, won: false };
  let min = 1e9, real = 1e9, at = -1, down = false, stop = 0;
  for (let t = 1; t < 330; t++) {
    let d = false; for (const [a, b] of presses) if (t > a && t <= b) d = true;
    heroStep(c, { pressed: d && !down, down: d }); down = d;
    if (stop) { if (++stop > 26) break; } else if (advance(c)) stop = 1;
    const g = gapTo(c.o, c.h, c.o.r + 1.5); if (g < min) min = g;
    if (g < 0) { if (at < 0) at = t; if (!full) break; real = Math.min(real, gapTo(c.o, c.h, c.o.r * 0.82)); }
  }
  return { min, t: at, real };
}
const REACT = 26, WINDOW = 12;                      // ticks he gets to see a line before he must act on it, and the least slack on the timing of the jump
// lines that would meet him low on the body if he just kept running: the ones a jump can clear
function aimed(st, sp, ok, add) {
  const o = st.o, plats = st.plats.map((q) => ({ ...q })), c = { peek: true, h: { ...st.h, on: st.h.on ? plats[st.plats.indexOf(st.h.on)] : null }, plats, events: [], portal: null, won: false };
  let prev = null, n = 0;
  for (let t = 1; t <= 230 && n < 4; t++) {
    heroStep(c, { pressed: false, down: false }); if (t < REACT + 18 || t % 2) continue;
    const r = radius(o.T + t), dx = c.h.x - o.x, dy = Math.min(FL - r - 3, c.h.y - 5) - o.y, d = hyp(dx, dy) || 1, v = d / t - sp;
    if (prev !== null && (v > 0) !== (prev > 0) && ok(dx, dy)) { add(dx / d, dy / d); n++; }
    prev = v;
  }
}
function steer(st, side) {
  const o = st.o, sp = speed(o.T, o.k), cands = [];
  const add = (ux, uy) => cands.push([ux * sp, uy * sp]);
  const sx = Math.sign(o.vx) || 1, sy = Math.sign(o.vy) || 1;
  const ok = (dx, dy) => (!(side & 1) || Math.sign(dx) === sx) && (!(side & 2) || Math.sign(dy) === sy);       // it has to leave the wall it just hit
  if (!side) for (let a = 0; a < 12; a++) add(qcos(a / 12 * TAU + 0.26), qsin(a / 12 * TAU + 0.26));
  else if (side === 3) for (const a of [0.3, 0.5, 0.7, 0.9, 1.1, 1.3]) add(sx * qcos(a), sy * qsin(a));
  else for (const a of [0.24, 0.5, 0.8, 1.1, 1.35]) for (const k of [-1, 1]) { if (side === 1) add(sx * qcos(a), k * qsin(a)); else add(k * qcos(a), sy * qsin(a)); }
  const hunt = o.T >= o.nextThreat && o.T < SURVIVE - 120;                 // is it time to come for him again?
  if (hunt) aimed(st, sp, ok, add);
  let best = null, bs = -1e9;
  // the longest run of jump timings (from when he has had time to see it, up to when it arrives) that get him clear
  const windowOf = (vx, vy, until, mk) => { let run = 0, w = 0; for (let d = Math.max(REACT, until - 66); d < until; d += 3) { run = tryLine(st, vx, vy, mk(d)).min >= 1 ? run + 3 : 0; if (run > w) w = run; } return w; };
  cands.forEach(([vx, vy], n) => {
    const idle = tryLine(st, vx, vy, [], true), rnd = hash(o.T + n * 13, 91) * 6; let sc, hit = 0, fair = true;
    if (idle.t < 0 && idle.min >= 4) sc = (hunt ? 0 : 100) + rnd - Math.abs(idle.min - 16) * 0.15;        // it misses him if he does nothing
    else if (idle.real > -2) { sc = -400 + idle.min; fair = idle.real > 0.5; }                                // a graze: no good to anyone
    else {                                          // it would get him. Fair only if a held jump clears it with slack on the timing, and so does a quick tap or a double tap
      let wH = 0, wT = 0, wD = 0;
      if (idle.t >= REACT + 16) { wH = windowOf(vx, vy, idle.t, (d) => [[d, d + 14]]); if (wH >= WINDOW) { wT = windowOf(vx, vy, idle.t, (d) => [[d, d + 5]]); if (wT < 9) wD = windowOf(vx, vy, idle.t, (d) => [[d, d + 5], [d + 16, d + 21]]); } }
      if (wH >= WINDOW && (wT >= 9 || wD >= 15)) { sc = (hunt ? 100 : 0) + rnd + Math.min(wH + wT, 40) * 0.3; hit = idle.t; } else { sc = -1000 + idle.t + wH; fair = false; }
    }
    if (sc > bs) { bs = sc; best = { vx, vy, hit, fair }; }
  });
  o.vx = best.vx; o.vy = best.vy; o.calm = !best.fair;                    // no fair line at all (he is in mid-air on top of it): it goes dim and harmless until its next bounce
  if (!best.fair) o.unfair = (o.unfair || 0) + 1;
  if (best.hit) { o.threat = o.T + best.hit; o.nextThreat = o.threat + 90 - 40 * Math.min(1, o.T / SURVIVE); } else o.threat = 0;
}
function stepHole(st) { const side = advance(st); if (side) { st.bounced = true; if (!st.peek) steer(st, side); } }

function singularity(art) {
  let stageC = null;
  const buildStage = () => { const c = cv(BW, BH), x = c.getContext('2d');
    x.drawImage(pix(BW, BH, (i, j) => dith(SKY, Math.min(1, j / 140), i, j)), 0, 0); stars(x, BW, 110, 23, 130);
    glow(x, 236, 70, 74, '#b8441a', 0.3); glow(x, 236, 62, 46, '#f07a2a', 0.32);
    const g = blackHole(24, 0.4, { tilt: 0.2 }); x.drawImage(g, 236 - (g.width >> 1), 60 - (g.height >> 1));
    x.drawImage(art.far, -90, 50); x.drawImage(art.far, 550, 50);
    x.drawImage(art.mid, -250, 84); x.drawImage(art.mid, 390, 84);
    x.globalAlpha = 0.3; R(x, '#03061a', 0, 60, BW, 100); x.globalAlpha = 1;
    // the wreck, nose down in the snow: fuselage, a row of ports still lit, the fin
    const cyAt = (i) => 135 - (i - 18) * 0.06;
    for (let i = 120; i <= 156; i++) { const base = Math.round(cyAt(i) - 14), top = i < 142 ? Math.round(base + (90 - base) * (i - 120) / 22) : i <= 152 ? 90 : Math.round(90 + (base - 90) * (i - 152) / 4); R(x, '#04060c', i, top - 1, 1, base - top + 2); R(x, i < 124 ? '#6a7690' : (i + top) % 11 === 0 ? '#1a2132' : '#2c3548', i, top, 1, base - top + 1); R(x, '#6a7690', i, top, 1, 1); }
    R(x, '#8c4a2a', 138, 98, 14, 3);
    for (let i = 18; i <= 182; i++) { const cy = cyAt(i), rad = i < 44 ? 15 * Math.sqrt((i - 17) / 27) : 15; let top = Math.round(cy - rad), bot = Math.round(cy + rad);
      if (i > 170) { top += Math.floor(hash(i, 61) * (i - 170)); bot -= Math.floor(hash(i, 62) * (i - 170) * 0.6); if (bot - top < 2) continue; }
      R(x, '#04060c', i, top - 1, 1, bot - top + 2);
      for (let y = top; y < bot; y++) R(x, dith(['#6a7690', '#4a566e', '#343e54', '#262e42', '#1a2132', '#10141f'], (y - top) / (bot - top), i, y), i, y);
      if (i % 22 === 9) R(x, '#10141f', i, top + 1, 1, bot - top - 1);
      if (hash(i, 63) > 0.5) R(x, '#9cc8e8', i, top - 1); }
    for (let k = 0; k < 6; k++) { const i = 56 + k * 19, y = Math.round(cyAt(i) - 6), dead = k === 3; if (!dead) glow(x, i + 1, y + 1, 7, '#ffa030', 0.5); R(x, '#04060c', i - 1, y - 1, 5, 5); R(x, dead ? '#141c2c' : '#ffb43a', i, y, 3, 3); if (!dead) R(x, '#fff0b0', i, y, 1, 1); }
    R(x, '#04060c', 27, 126, 14, 5); R(x, '#d8a04a', 28, 127, 12, 3); R(x, '#fff0b0', 28, 127, 5, 1);
    for (const [ry, len] of [[124, 10], [131, 14]]) { R(x, '#04060c', 180, ry, len, 3); R(x, '#4a566e', 180, ry, len, 1); }
    // the snow field it lies in, then the floor
    for (let i = 0; i < BW; i++) { const t = Math.round(142 - 3 * Math.sin(i / 23) - 2 * Math.sin(i / 9 + 1)); R(x, '#6a9ac8', i, t); for (let j = t + 1; j < FL; j++) R(x, dith(['#2c4e80', '#1e3862', '#16284c'], (j - t) / 16, i, j), i, j); }
    for (let i = -16; i < BW; i += art.dk.width) x.drawImage(art.dk, i, FL);
    return c; };

  const def = {
    name: 'THE SINGULARITY', tip: "DON'T TOUCH IT", tips: ["DON'T TOUCH IT: JUMP OVER IT", 'IT GROWS AND HUNTS YOU: WATCH IT', 'LAST TILL THE BAR FILLS AND IT COLLAPSES'], hero: 'run', heroX: 40,
    sim: { stepHole, touching, SURVIVE },                 // for tests: clone the state with peek: true to look ahead without the hole re-planning
    init(st) {
      st.plats = [[58, 136, 52], [132, 112, 50], [206, 130, 50], [274, 106, 48]].map(([x, y, w], k) => ({ x, y, w, gone: false, t: 0, born: 0, k }));
      st.o = { phase: 'form', ft: 0, ct: 0, T: 0, x: 262, y: 54, vx: 0, vy: 0, r: 6, threat: 0, nextThreat: 90, unfair: 0, calm: false, k: 1 + 0.1 * Math.min(3, st.lap || 0) };   // k: every loop of the game it moves faster
      st.fx = []; st.flash = 0;
    },
    update(st) {
      const o = st.o, h = st.h;
      for (const p of st.fx) { p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.t--; } st.fx = st.fx.filter((p) => p.t > 0 && p.y < FL);
      if (st.flash > 0) st.flash--;
      if (o.phase === 'form') {                       // three pulses while it tears open, well away from him: nothing hurts yet
        o.ft++; if (o.ft === 1 || o.ft === 34 || o.ft === 67) st.events.push('warn');
        if (o.ft >= FORM && (hyp(h.x - o.x, h.y - 15 - o.y) > 90 || o.ft > FORM + 150)) { o.phase = 'live'; steer(st, 0); st.events.push('whoosh'); }
      } else if (o.phase === 'live') {
        stepHole(st);
        if (st.bounced) { st.bounced = false; st.events.push(o.threat ? 'warn' : 'thump'); }
        if (st.broke) { const q = st.broke; st.broke = null; st.events.push('bosshit'); for (let k = 0; k < 12; k++) st.fx.push({ x: q.x - q.w / 2 + hash(k, o.T) * q.w, y: q.y + hash(k, o.T + 1) * 8, vx: (hash(k, o.T + 2) - 0.5) * 2.4, vy: -hash(k, o.T + 3) * 2.2, t: 40, c: k % 3 ? '#bff0ff' : '#3a78bc' }); }
        if (touching(st)) hurt(st, 'touched the singularity');
        if (o.T >= SURVIVE) { o.phase = 'collapse'; o.ct = 0; st.events.push('roar'); }
      } else if (o.phase === 'collapse') {            // it eats itself: harmless now
        o.ct++; if (o.ct === COLLAPSE - 14) st.events.push('whoosh');
        if (o.ct >= COLLAPSE) { o.phase = 'gone'; st.flash = 26; st.events.push('good'); for (const q of st.plats) { q.gone = false; q.born = 0; } win(st, 'SINGULARITY COLLAPSED  +500'); }
      }
    },
    stage(ctx, st, f) {
      if (!stageC) stageC = buildStage();
      ctx.drawImage(stageC, 0, 0);
      const t = f % 100, on = t < 9 || (t > 15 && t < 24); if (on) glow(ctx, 147, 88, 8, '#ff4a2a', 0.7); R(ctx, on ? '#ffd0a0' : '#5a1a14', 146, 87, 3, 3);
      if (hash(f >> 3, 5) > 0.9) { ctx.globalAlpha = 0.5; R(ctx, '#05070c', 94, 125, 3, 3); ctx.globalAlpha = 1; }
    },
    draw(ctx, st, f) {
      const o = st.o;
      for (const q of st.plats) { if (q.gone || (q.born > 0 && (q.born >> 1) % 2)) continue; ctx.drawImage(platArt('berg', q.w, q.k), Math.round(q.x - q.w / 2) - 1, q.y - 1); }
      for (const p of st.fx) { R(ctx, '#000000', p.x - 1, p.y - 1, 4, 4); R(ctx, p.c, p.x, p.y, 2, 2); }
      if (o.phase === 'live') {
        const r = o.r;
        {                     // where it is going next: a dotted line as far as its next bounce
          const hot = o.threat > o.T; let qx = o.x, qy = o.y; for (let s = 1; s <= (hot ? 120 : 76); s++) { qx += o.vx; qy += o.vy; if (qx < o.r + 2 || qx > BW - o.r - 2 || qy < TOP + o.r || qy > FL - o.r) { R(ctx, '#ffffff', qx - 2, qy, 5, 1); R(ctx, '#ffffff', qx, qy - 2, 1, 5); break; } if (s % 6 === ((f >> 2) % 6) && s > o.r) { ctx.globalAlpha = hot ? 1 : 1 - s / 90; R(ctx, hot ? '#d81e4a' : '#000000', qx - 2, qy - 2, 4, 4); R(ctx, hot ? '#ffffff' : '#c4a6ff', qx - 1, qy - 1, 2, 2); ctx.globalAlpha = 1; } }
        }
      }
    },
    // the hole itself goes on last (in front()), after the whole picture, hero included, has been dragged toward it
    hole(ctx, st, f) {
      const o = st.o;
      if (o.phase === 'form') {
        const k = o.ft / FORM, r = Math.max(1, Math.round(k * 7)), pulse = (o.ft % 33) / 33;
        gravWarp(ctx, o.x, o.y, Math.max(2, r), f, 0.35 + 0.65 * k);
        for (let a = 0; a < 20; a++) { const an = a / 20 * TAU + f * 0.04, d = 44 - 36 * pulse; R(ctx, a % 2 ? '#c4a6ff' : '#ffffff', o.x + Math.cos(an) * d, o.y + Math.sin(an) * d, pulse > 0.6 ? 2 : 1, pulse > 0.6 ? 2 : 1); }
        if (r >= 3) { const c = holeFrame(r, (f >> 2) % 8); ctx.drawImage(c, Math.round(o.x) - (c.width >> 1), Math.round(o.y) - (c.height >> 1)); }
        else { R(ctx, '#ffffff', o.x - r - 1, o.y - r - 1, r * 2 + 3, r * 2 + 3); R(ctx, '#000000', o.x - r, o.y - r, r * 2 + 1, r * 2 + 1); }
      } else if (o.phase === 'live' || o.phase === 'collapse') {
        const kc = o.phase === 'collapse' ? o.ct / COLLAPSE : 0, r = Math.max(1, Math.round(o.r * (1 - kc * kc))), jx = kc ? Math.round((hash(f, 1) - 0.5) * 6 * kc) : 0, jy = kc ? Math.round((hash(f, 2) - 0.5) * 6 * kc) : 0, hx = o.x + jx, hy = o.y + jy;
        gravWarp(ctx, hx, hy, Math.max(2, r), f, o.phase === 'collapse' ? 1 + 2.4 * kc : o.calm ? 0.6 : 1);
        for (let s = 0; s < 5; s++) { const a = -f * 0.02 + s * 1.257, d = r * 2.75; for (let e = -3; e <= 3; e++) { const an = a + e / d; R(ctx, e === 0 ? '#aab8f0' : '#5a68b0', hx + Math.cos(an) * d, hy + Math.sin(an) * d * 0.9); } }   // starlight smeared round it
        const c = holeFrame(Math.max(2, r), (f >> 2) % 8); if (o.calm && o.phase === 'live') ctx.globalAlpha = 0.4 + 0.15 * ((f >> 2) % 2); ctx.drawImage(c, Math.round(hx) - (c.width >> 1), Math.round(hy) - (c.height >> 1)); ctx.globalAlpha = 1;   // dim = spent, harmless until its next bounce
        for (let s = 0; s < 14; s++) { const uu = (f * (0.011 + kc * 0.03) + s / 14) % 1, a = s * 2.4 + f * 0.06 + uu * 5, d = r * (3.5 - 2.5 * uu), sy = Math.sin(a); if (sy < 0 && d < r * 1.1) continue; R(ctx, uu > 0.7 ? '#ffffff' : s % 3 ? '#9cd4f4' : '#c4a6ff', hx + Math.cos(a) * d, hy + sy * d * 0.55, uu < 0.3 ? 2 : 1, 1); }   // chips of ice spiralling in
        if (kc > 0.5) { const rr = (kc - 0.5) * 2 * 60; for (let a = 0; a < 40; a++) R(ctx, '#ffffff', hx + Math.cos(a / 40 * TAU) * rr, hy + Math.sin(a / 40 * TAU) * rr, 2, 2); }
      }
      if (st.flash > 0) { const rr = (26 - st.flash) * 9; for (let a = 0; a < 60; a++) R(ctx, a % 2 ? '#c4a6ff' : '#ffffff', o.x + Math.cos(a / 60 * TAU) * rr, o.y + Math.sin(a / 60 * TAU) * rr, 2, 2); }
      if (!st.won) bar(ctx, 'OUTLAST THE SINGULARITY', o.T / SURVIVE, (f >> 3) % 2 && o.T > SURVIVE - 240 ? '#ffffff' : '#9060ff');
    },
    front(ctx, st, f) {
      def.hole(ctx, st, f);
      art.snow(ctx, f, 0, 14);
      const o = st.o, h = st.h; if (o.phase === 'live' && o.threat > o.T && (f >> 2) % 2) drawText(ctx, '!', Math.round(h.x), Math.round(h.y) - 46, { scale: 2, fill: GRAD.gold, outline: '#000', align: 'center' });   // it is coming for him
      if (st.flash > 0) { ctx.globalAlpha = Math.min(1, st.flash / 16); R(ctx, '#ffffff', 0, 0, BW, BH); ctx.globalAlpha = 1; }
    },
  };
  return def;
}
