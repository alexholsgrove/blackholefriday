// Black Hole Friday: the five level scenes, the title screen and the prize screen (320 x 160 pixels).
import { drawText, GRAD, pixelCJK } from '../font.js';
import { cv, frames, put, flip, flipV, tint, hash, TAU } from './chars.js';

export const W = 320, H = 160, GY = 136;
export const COPPER = ['#fff0d8', '#ffd0a0', '#f5a560', '#e07a34', '#b8521c', '#8a3410', '#521c06'];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
// dithered palette ramp: t in 0..1 across pal
export function dith(pal, t, i, j) { t = Math.max(0, Math.min(0.9999, t)); const p = t * (pal.length - 1), k = Math.floor(p); return pal[Math.min(pal.length - 1, k + (p - k > BAYER[(j & 3) * 4 + (i & 3)] ? 1 : 0))]; }
export function pix(w, h, fn) {
  const c = cv(w, h), x = c.getContext('2d'), im = x.createImageData(w, h), d = im.data, cache = new Map();
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const col = fn(i, j); if (!col) continue;
    let v = cache.get(col); if (!v) { v = hex(col); cache.set(col, v); }
    const o = (j * w + i) * 4; d[o] = v[0]; d[o + 1] = v[1]; d[o + 2] = v[2]; d[o + 3] = 255;
  }
  x.putImageData(im, 0, 0); return c;
}
function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function tile(ctx, layer, off, y = 0) { const w = layer.width; let x = -(((off % w) + w) % w); for (; x < W; x += w) ctx.drawImage(layer, Math.round(x), y); }
const rect = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };

// ---- black holes: shadow, lensed photon ring, a tilted accretion disk passing in front ----
const DISK = ['#fffbe8', '#ffe2a0', '#ffb35a', '#f07a2a', '#b8441a', '#6a1e0c'];
export function blackHole(Rr, t, { tilt = 0.2, pal = DISK, glow = true } = {}) {
  const ext = Math.ceil(Rr * 3.1), size = ext * 2 + 1;
  return pix(size, size, (ii, jj) => {
    const i = ii - ext, j = jj - ext, d = Math.hypot(i, j);
    const shadow = d < Rr;
    const e = Math.hypot(i, j / tilt), ang = Math.atan2(j / tilt, i);
    const inDisk = e > Rr * 1.3 && e < Rr * 3;
    let b = 0;
    if (inDisk && (j > 0 || !shadow)) b = (1 - (e - Rr * 1.3) / (Rr * 1.7)) * (0.72 + 0.32 * Math.sin(ang * 3 + t * TAU + e * 0.45)) * (i < 0 ? 1.18 : 0.82);
    const rw = Math.max(1.6, Rr * 0.32), ring = Math.abs(d - Rr * 1.15) < rw ? 1 - Math.abs(d - Rr * 1.15) / rw : 0;
    if (!shadow) b = Math.max(b, ring * (j < 0 ? 1.05 : 0.8) * (i < 0 ? 1.1 : 0.9));
    if (glow && !shadow && d < Rr * 2.1) b = Math.max(b, 0.16 * (1 - (d - Rr) / (Rr * 1.1)) + (hash(ii, jj) - 0.5) * 0.06);
    if (b > 0.1) return pal[Math.max(0, Math.min(pal.length - 1, Math.floor((1 - Math.min(1, b)) * pal.length + (BAYER[(jj & 3) * 4 + (ii & 3)] - 0.5))))];
    if (shadow) return '#000000';
    return null;
  });
}
const putC = (ctx, c, x, y) => ctx.drawImage(c, Math.round(x - c.width / 2), Math.round(y - c.height / 2));
// small swirling black hole with in-spiralling sparks
const MINI = ['#ffffff', '#d8b0ff', '#a060ff', '#6a2ae0', '#3a1290', '#1a0848'];
function miniFrames(r) { return frames(8, (p) => blackHole(r, p, { tilt: 0.38, pal: MINI })); }
function sparks(ctx, x, y, f, r) { for (let k = 0; k < 6; k++) { const a = k * 1.05 - f * 0.35, d = r * (2.6 - ((f * 0.12 + k * 0.37) % 1) * 1.6); rect(ctx, k % 2 ? '#d8b0ff' : '#ffffff', x + Math.cos(a) * d, y + Math.sin(a) * d * 0.6, 1, 1); } }

function stars(seed, n, h = H, cols = ['#ffffff', '#c8d0ff', '#ffe8c0', '#8a8aa8']) { const r = rng(seed); return Array.from({ length: n }, () => ({ x: Math.floor(r() * W), y: Math.floor(r() * h), c: cols[Math.floor(r() * cols.length)], tw: r() })); }
function drawStars(ctx, S, f) { for (const s of S) { if ((f * 0.07 + s.tw * 7) % 7 < 0.6) continue; rect(ctx, s.c, s.x, s.y, 1, 1); } }

export function hud(ctx, A, f, num, name, col = GRAD.gold) {
  drawText(ctx, 'SCORE ' + String(1250 + (num || 3) * 3170 + Math.floor(f / 3) * 10).padStart(6, '0'), 4, 4, { fill: col, outline: '#000' });
  if (num != null) drawText(ctx, 'LEVEL ' + num, W - 4, 4, { fill: GRAD.white, outline: '#000', align: 'right' });   // levels have numbers, not names
  for (let k = 0; k < 3; k++) put(ctx, A.jacketIcon[0], 12 + k * 15, 32);
}

// ======================================================================================
// LEVEL 1: EVENT HORIZON (nod to Interstellar): a water planet beside a giant black hole
// ======================================================================================
function level1(A) {
  const sky = pix(W, H, (i, j) => dith(['#000000', '#03030c', '#070a1c', '#0e1230', '#1a1a40'], j / 120, i, j));
  const S = stars(11, 140), bh = frames(10, (p) => blackHole(22, p));
  const mini = miniFrames(6);
  // far horizon: mountain-sized waves
  const waves = pix(640, 40, (i, j) => {
    const h = 6 + 4 * Math.sin(i * 0.05) + 3 * Math.sin(i * 0.013 + 1) + (Math.abs(((i + 40) % 320) - 160) < 40 ? 22 * Math.cos((((i + 40) % 320) - 160) / 40 * Math.PI / 2) : 0);
    if (39 - j > h) return null;
    const top = 39 - j > h - 2;
    return top ? '#4a7aa8' : dith(['#2a4a72', '#16304e', '#0c2038'], (j - (39 - h)) / 22, i, j);
  });
  const sea = pix(640, H - 118, (i, j) => { const r = Math.sin(i * 0.11 + j * 1.7) + Math.sin(i * 0.031 - j * 0.9); return r > 1.3 ? '#3a6a98' : dith(['#163452', '#0e2640', '#081a30'], j / 40, i, j); });
  // the black hole's light spilling down the water
  const refl = pix(70, H - 118, (i, j) => { const d = Math.abs(i - 35) / (12 + j * 0.6); const n = Math.sin(j * 1.9 + i * 0.4) > 0.2; return d < 1 && n ? dith(['#fff0c0', '#ffb35a', '#c05a1a'], d * 0.7 + j / 80, i, j) : null; });
  const tidal = waveArt(110, 90);
  return (ctx, f) => {
    ctx.drawImage(sky, 0, 0); drawStars(ctx, S, f);
    putC(ctx, bh[Math.floor(f / 2) % 10], 214, 58);
    tile(ctx, waves, f * 0.25, 92);
    ctx.drawImage(tidal, W - 110 + ((f * 0.4) % 30), GY - 88);
    tile(ctx, sea, f * 2, 118); ctx.drawImage(refl, 214 - 35, 118);
    // floating ice floes (platforms)
    for (const [x0, y, big] of [[60, 96, 1], [230, 78, 0], [400, 104, 1]]) { const x = ((x0 - f * 2) % 480 + 480) % 480 - 60; put(ctx, big ? A.floe : A.floeS, x, y); }
    for (const [x, y, ph] of [[150, 84, 0], [276, 100, 3]]) { const yy = y + Math.sin(f * 0.15 + ph) * 3; putC(ctx, mini[(Math.floor(f / 2) + ph) % 8], x, yy); sparks(ctx, x, yy, f + ph * 5, 6); }
    put(ctx, A.ice, 196 + Math.sin(f * 0.2) * 2, ((f * 3) % 140) - 20);
    put(ctx, A.hero.run[f % 8], 70, GY);
    hud(ctx, A, f, 1, 'EVENT HORIZON');
  };
}

// ======================================================================================
// LEVEL 2: THE HIVE (nod to Aliens): a biomechanical colony corridor
// ======================================================================================
function level2(A) {
  const wall = pix(320, H, (i, j) => {
    const rib = Math.pow(Math.abs(Math.sin(i * Math.PI / 32)), 6);
    const vert = rib > 0.25 ? Math.pow(Math.abs(Math.sin(j * Math.PI / 6 + Math.sin(i * Math.PI / 32) * 1.2)), 8) : 0;
    const tube = Math.max(0, 1 - Math.abs(j - 46 - 6 * Math.sin(i * Math.PI / 80)) / 4) + Math.max(0, 1 - Math.abs(j - 92 - 4 * Math.sin(i * Math.PI / 40 + 1)) / 3);
    const org = Math.sin(i * 0.37 + j * 0.11) * Math.sin(j * 0.23 - i * 0.07);
    const v = 0.12 + rib * 0.45 + vert * 0.3 + tube * 0.4 + org * 0.1 - Math.abs(j - 80) / 400;
    return dith(['#020605', '#08130f', '#11221c', '#1c362c', '#2e5446', '#4f8270', '#9ad0bc'], v, i, j);
  });
  const ceil = pix(320, 22, (i, j) => {
    if (j >= 18) return ((i + j) >> 2) % 2 ? '#f2c31b' : '#111111';
    const duct = Math.abs(j - 8) < 6, bolt = i % 40 < 2 && j % 6 === 3;
    return bolt ? '#8a96a0' : duct ? dith(['#5a646c', '#3a4248', '#22282c'], j / 14, i, j) : '#0a0c0e';
  });
  const floor = pix(320, H - GY, (i, j) => {
    if (j < 3) return ((i + j) >> 2) % 2 ? '#f2c31b' : '#111111';
    return (i % 8 < 2 || j % 6 < 1) ? '#0e1214' : dith(['#4a545c', '#2e363c', '#1c2226'], j / 24, i, j);
  });
  // a raised catwalk to jump up onto: grated deck, hazard edge, struts down to the floor
  const catwalk = pix(70, 30, (i, j) => { if (j < 2) return ((i + j) >> 2) % 2 ? '#f2c31b' : '#111111'; if (j < 6) return i % 4 === 0 ? '#0e1214' : dith(['#6a747c', '#3a4248'], (j - 2) / 4, i, j); if ((i === 6 || i === 63) || ((i - 6 - (j - 6) * 2) % 57 === 0 && i > 6 && i < 63)) return '#2e363c'; return null; });
  const at = (x0, span) => ((x0 - 0) % span + span) % span;   // position of a repeating prop
  return (ctx, f) => {
    const sc = f * 2;
    tile(ctx, wall, f * 0.6);
    // one red emergency strobe, slow
    if (Math.floor(f / 10) % 2) { const x = ((200 - f * 0.6) % 360 + 360) % 360 - 20; ctx.globalAlpha = 0.18; ctx.fillStyle = '#ff2a1a'; ctx.beginPath(); ctx.ellipse(x, 30, 30, 36, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; rect(ctx, '#ff6a5a', x - 2, 22, 5, 3); }
    tile(ctx, ceil, sc); tile(ctx, floor, sc, GY);
    // catwalks to jump up onto
    for (const [x0, y] of [[150, GY - 30], [330, GY - 30]]) ctx.drawImage(catwalk, Math.round(((x0 - sc) % 400 + 400) % 400 - 70), y);
    // a single steam vent in the floor
    { const x = ((260 - sc) % 400 + 400) % 400 - 30; rect(ctx, '#0e1214', x - 6, GY, 12, 2); for (let k = 0; k < 6; k++) { const t = ((f * 0.06 + k / 6) % 1); ctx.globalAlpha = 0.45 * (1 - t); ctx.fillStyle = '#c8d8d0'; ctx.beginPath(); ctx.arc(x + Math.sin(t * 6 + k) * 3, GY - t * 46, 3 + t * 7, 0, TAU); ctx.fill(); } ctx.globalAlpha = 1; }
    // eggs spaced along the floor, one opening
    { const x = ((360 - sc) % 400 + 400) % 400 - 30; put(ctx, A.egg, x, GY); put(ctx, (f >> 4) % 2 ? A.eggOpen : A.egg, x + 26, GY); }
    // a drone crawling along the ceiling, and a face grabber scuttling at you
    put(ctx, flipV(A.drone[Math.floor(f / 2) % 6]), ((300 - f * 2.4) % 420 + 420) % 420 - 40, 22);
    put(ctx, A.grabber[f % 4], ((420 - f * 3.2) % 460 + 460) % 460 - 40, GY);
    put(ctx, A.hero.run[f % 8], 70, GY);
    // motion tracker
    const cx = 296, cy = 34; ctx.fillStyle = 'rgba(0,30,10,0.75)'; ctx.beginPath(); ctx.arc(cx, cy, 15, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2a8a3a'; ctx.lineWidth = 1; for (const r of [5, 10, 15]) { ctx.beginPath(); ctx.arc(cx + 0.5, cy + 0.5, r, 0, TAU); ctx.stroke(); }
    const pr = (f % 20) / 20 * 15; ctx.strokeStyle = '#7aff8a'; ctx.beginPath(); ctx.arc(cx + 0.5, cy + 0.5, pr, 0, TAU); ctx.stroke();
    for (const [bx, by] of [[-6, -4], [4, -9], [9, 2]]) if ((f >> 2) % 3) rect(ctx, '#d0ffd0', cx + bx, cy + by, 2, 2);
    hud(ctx, A, f, 2, null, GRAD.green);
  };
}

// ======================================================================================
// LEVEL 5 (final): INVERSION (nod to Tenet): everything runs backwards. Red = forwards, blue = inverted.
// ======================================================================================
function level3(A, n = 5) {
  const sky = pix(W, H, (i, j) => dith(['#1a2030', '#2a3448', '#4a5468', '#7a8496', '#a8b0bc'], j / 130, i, j));
  const city = (seed, h0, cols) => { const r = rng(seed); const bs = []; for (let x = 0; x < 640;) { const w = 14 + Math.floor(r() * 26); bs.push([x, w, h0 + Math.floor(r() * 40)]); x += w + Math.floor(r() * 4); } return pix(640, 90, (i, j) => { const b = bs.find((q) => i >= q[0] && i < q[0] + q[1]); if (!b || 90 - j > b[2]) return null; const win = (i - b[0]) % 5 > 1 && j % 6 > 2 && hash(i >> 2, j >> 2) > 0.55; return win ? (i < 320 ? '#e03a2a' : '#3a8ae0') : dith(cols, j / 90, i, j); }); };
  const far = city(5, 20, ['#3a4252', '#2e3442']), near = city(9, 10, ['#232836', '#181c26']);
  const road = pix(640, H - GY, (i, j) => (j === 6 && (i % 24) < 12 ? '#e8e8e0' : j < 1 ? '#5a6070' : dith(['#3a3e48', '#2a2e36', '#1e2028'], j / 24, i, j)));
  // the turnstile: a revolving glass drum, red half and blue half
  const drum = (f) => {
    const c = cv(80, 96), x = c.getContext('2d'), cx = 40;
    rect(x, '#2a2e36', 4, 84, 72, 12); rect(x, '#4a4e58', 4, 84, 72, 2);
    rect(x, '#3a3e48', 6, 4, 68, 10); rect(x, '#6a6e78', 6, 4, 68, 2);
    for (let i = 0; i < 64; i++) for (let j = 0; j < 70; j++) { const red = i < 32; x.fillStyle = (i + j) % 3 ? (red ? '#5a1a1a' : '#14305a') : (red ? '#8a2a22' : '#22508a'); x.fillRect(8 + i, 14 + j, 1, 1); }
    for (let k = 0; k < 4; k++) { const a = f * 0.06 + k * Math.PI / 2, px = Math.round(cx + Math.sin(a) * 30); if (Math.cos(a) < -0.2) continue; rect(x, '#d8dce4', px, 14, 1, 70); rect(x, '#9aa0ac', px + 1, 14, 1, 70); }
    rect(x, '#ff4a3a', 14, 8, 6, 2); rect(x, '#4a9aff', 60, 8, 6, 2);
    return c;
  };
  return (ctx, f) => {
    const o = -f;                                                  // the world scrolls the "wrong" way
    ctx.drawImage(sky, 0, 0);
    tile(ctx, far, o * 0.3, 40); tile(ctx, near, o * 0.6, 50);
    ctx.drawImage(drum(-f), Math.round(((120 + f * 0.3) % 440) - 80), GY - 96);
    tile(ctx, road, o * 2, GY);
    // un-explosion: rubble flying back together into a wall
    const k = (Math.sin(f * 0.08) + 1) / 2, wx = 110, r = rng(3);
    for (let i = 0; i < 18; i++) { const tx = wx + (i % 3) * 6, ty = GY - 6 - Math.floor(i / 3) * 6; const sx = tx + (r() - 0.5) * 80, sy = ty - r() * 70; const x = sx + (tx - sx) * k, y = sy + (ty - sy) * k; rect(ctx, '#0e1014', x - 1, y - 1, 7, 7); rect(ctx, i % 2 ? '#8a8e98' : '#6a6e78', x, y, 5, 5); }
    // bullets un-firing: their trails run ahead of them, back towards the gun
    for (let i = 0; i < 3; i++) { const x = W - ((f * 7 + i * 110) % (W + 40)), y = GY - 22 - i * 9; for (let t = 1; t < 14; t++) rect(ctx, t % 2 ? '#4a9aff' : '#a8d0ff', x - t * 2, y, 2, 1 + (t < 5)); rect(ctx, '#000', x - 1, y - 2, 8, 4); rect(ctx, '#ffd06a', x, y - 1, 6, 2); rect(ctx, '#8a5a1a', x + 4, y - 1, 2, 2); }
    // soldier running backwards at you, and you: running backwards too, with afterimages
    put(ctx, A.soldier[7 - (f % 8)], 40 + (f % 40) * 0.6, GY);
    for (const [dx, a] of [[14, 0.18], [7, 0.35]]) { ctx.globalAlpha = a; put(ctx, tint(A.hero.run[(16 - f % 8 + 2) % 8], '#4a9aff', 0.6), 230 + dx, GY); }
    ctx.globalAlpha = 1; put(ctx, A.hero.run[7 - (f % 8)], 230, GY);
    // red/blue grade, VHS scanlines, REW counter
    ctx.globalAlpha = 0.14; rect(ctx, '#ff2a1a', 0, 0, W / 2, H); rect(ctx, '#1a6aff', W / 2, 0, W / 2, H); ctx.globalAlpha = 0.12; for (let y = 0; y < H; y += 2) rect(ctx, '#000', 0, y, W, 1); ctx.globalAlpha = 1;
    if ((f >> 3) % 2) drawText(ctx, '<< REW', W / 2, 18, { fill: GRAD.white, outline: '#000', align: 'center' });
    const s = 900 - f; drawText(ctx, `-00:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`, W / 2, 28, { fill: GRAD.blue, outline: '#000', align: 'center' });
    hud(ctx, A, f, n, 'INVERSION', GRAD.red);
  };
}

// ======================================================================================
// LEVEL 3: NEON RAIN (nod to Blade Runner): rooftops, rain, neon and flying police cars
// ======================================================================================
// o: { sky, hud, rain, spinner, synth } can be switched off, and cam fixes the scroll (for the square email shot)
function level5(A, o = {}) {
  const on = (k) => o[k] !== false;
  const sky = pix(W, H, (i, j) => dith(['#03020a', '#0a0618', '#180a28', '#2a1030', '#4a1a2a', '#7a3020'], j / 125, i, j));
  const pyr = pix(110, 92, (i, j) => { const half = (j / 92) * 55; if (Math.abs(i - 55) > half) return null; const win = j > 8 && (i % 4 === 1) && (j % 5 === 2) && hash(i, j >> 1) > 0.35; return win ? (hash(i, j) > 0.6 ? '#ffd06a' : '#ff9a3a') : dith(['#2a1a20', '#1a1018', '#0e0a10'], Math.abs(i - 55) / 55, i, j); });
  const towers = (seed, cols, wc, hmin, hgt) => { const r = rng(seed), bs = []; for (let x = 0; x < 640;) { const w = 12 + Math.floor(r() * 22); bs.push([x, w, hmin + Math.floor(r() * 50)]); x += w + 2 + Math.floor(r() * 6); } return pix(640, hgt, (i, j) => { const b = bs.find((q) => i >= q[0] && i < q[0] + q[1]); if (!b || hgt - j > b[2]) return null; const win = (i - b[0]) % 3 === 1 && j % 4 === 1 && hash(i, j) > 0.62; return win ? wc[Math.floor(hash(j, i) * wc.length)] : dith(cols, j / hgt, i, j); }); };
  const far = towers(21, ['#1a1428', '#120e1e'], ['#ffd06a', '#4af0ff', '#6a4a7a'], 30, 110), near = towers(33, ['#0e0a16', '#08060e'], ['#ffd06a', '#ff4fae', '#4af0ff'], 20, 90);
  const roof = pix(640, H - GY, (i, j) => { const pud = Math.sin(i * 0.05) > 0.75 - j * 0.004 && j > 4 && j < 18; if (pud) { const c = (i % 250) < 125; const on = Math.sin(i * 0.9 + j * 3) > 0.3 && hash(i, j) > 0.3; return on ? (c ? '#ff4fae' : '#4af0ff') : (c ? '#2a0c22' : '#0a2030'); } return j < 1 ? '#3a3448' : dith(['#1e1a28', '#141018', '#0a080e'], j / 24, i, j); });
  const signs = cv(640, 80); { const x = signs.getContext('2d');
    const neon = (sx, sy, w, h, col) => { x.fillStyle = '#0a0610'; x.fillRect(sx - 2, sy - 2, w + 4, h + 4); x.fillStyle = col; x.fillRect(sx - 2, sy - 2, w + 4, 1); x.fillRect(sx - 2, sy + h + 1, w + 4, 1); x.fillRect(sx - 2, sy - 2, 1, h + 4); x.fillRect(sx + w + 1, sy - 2, 1, h + 4); };
    neon(30, 10, 52, 11, '#ff4fae'); drawText(x, 'VOLLEBAK', 56, 12, { fill: GRAD.pink, outline: null, align: 'center' });
    neon(150, 4, 14, 58, '#4af0ff'); [...'未来の服'].forEach((ch, k) => x.drawImage(pixelCJK(ch, 12, '#4af0ff'), 148, 1 + k * 14));
    neon(250, 20, 34, 9, '#ffd06a'); drawText(x, 'HOTEL', 267, 21, { fill: GRAD.gold, outline: null, align: 'center' });
    neon(420, 14, 40, 9, '#4af0ff'); drawText(x, 'NOODLE', 440, 15, { fill: GRAD.blue, outline: null, align: 'center' });
    const jp2 = pixelCJK('強化', 12, '#ff4fae'); neon(560, 6, jp2.width - 4, 14, '#ff4fae'); x.drawImage(jp2, 559, 3); }
  const drops = Array.from({ length: 140 }, (_, k) => [hash(k, 1) * (W + 60), hash(k, 2) * H, 3 + Math.floor(hash(k, 3) * 4)]);
  return (ctx, f) => {
    const c = o.cam ?? f;
    if (on('sky')) ctx.drawImage(sky, 0, 0);
    ctx.drawImage(pyr, 196, GY - 112);
    for (const [fx, ph] of [[26, 0], [64, 2]]) { rect(ctx, '#1a1018', fx, 30, 4, 80); const ff = (f + ph) % 6; for (let k = 0; k < 5; k++) rect(ctx, ['#fff3a0', '#ffb03a', '#ff5a1a', '#c0201a', '#5a1010'][k], fx - 1 + ((k + ff) % 3) - 1, 30 - k * 3 - (ff % 3), 6 - k, 3); }
    // the hologram: a giant copper jacket ad flickering on a tower
    if (f % 23) { ctx.globalAlpha = 0.45 + 0.1 * Math.sin(f * 0.5); const jc = tint(A.jacketBig[Math.floor(f / 3) % 12], '#4af0ff', 0.55); ctx.drawImage(jc.c, 112, 6, jc.c.width * 1.7, jc.c.height * 1.7); ctx.globalAlpha = 1; }
    tile(ctx, far, c * 0.25, GY - 110 + 20); for (let k = 0; k < 5; k++) rect(ctx, k % 2 ? '#ff2a2a' : '#fff7c0', ((k * 77 + f * (k % 2 ? 2 : -1.5)) % W + W) % W, 34 + k * 7, 2, 1);
    tile(ctx, signs, c * 0.6, 40); tile(ctx, near, c * 0.7, GY - 90);
    tile(ctx, roof, c * 2, GY);
    // spinner swooping with its searchlight
    if (on('spinner')) { const sx = 260 - ((f * 2) % 400) + 100, sy = 40 + Math.sin(f * 0.07) * 8;
    ctx.globalAlpha = 0.16; ctx.fillStyle = '#e8f4ff'; ctx.beginPath(); ctx.moveTo(sx - 4, sy); ctx.lineTo(sx - 34, GY); ctx.lineTo(sx + 14, GY); ctx.fill(); ctx.globalAlpha = 1;
    put(ctx, A.spinner, sx, sy); }
    put(ctx, (f >> 4) % 2 ? A.owl : A.owlSit, 168, 64 - ((f >> 4) % 2) * 4);
    if (on('synth')) { const t = (f % 30) / 30; put(ctx, A.synth[Math.floor(f / 2) % 6], 240 - t * 30, GY - Math.sin(t * Math.PI) * 30); }
    put(ctx, A.hero.run[f % 8], 70, GY);
    if (on('rain')) { ctx.globalAlpha = 0.55; for (const [x0, y0, l] of drops) { const y = (y0 + f * 9) % H, x = ((((x0 - f * 2.5 - y * 0.25) % (W + 60)) + W + 60) % (W + 60)) - 30; rect(ctx, '#a8c8ff', x, y, 1, l); } ctx.globalAlpha = 1; }
    if (on('hud')) hud(ctx, A, f, 3, null, GRAD.pink);
  };
}

// ======================================================================================
// LEVEL 4: THE CODE (nod to The Matrix): a rooftop inside the simulation, code raining down
// ======================================================================================
export const CODEPAL = ['#e8ffe8', '#8aff9a', '#3ae03a', '#1fa02e', '#0f6a1c', '#073a10'];
// original 3x5 glyphs, seeded, in every shade of the rain
const GLYPHS = (() => { const r = rng(61), out = []; for (let g = 0; g < 28; g++) { const bits = []; for (let k = 0; k < 15; k++) bits.push(r() > 0.5); bits[1] = true; bits[7] = true; out.push(bits); } return CODEPAL.map((c) => out.map((b) => pix(3, 5, (i, j) => (b[j * 3 + i] ? c : null)))); })();
export function codeRain(ctx, f, w, h, { gap = 5, seed = 0, alpha = 1, speed = 1 } = {}) {
  const rows = Math.ceil(h / 6) + 1; ctx.globalAlpha = alpha;
  for (let c = 0; c * gap < w; c++) {
    const sp = (0.25 + hash(c, seed) * 0.5) * speed, len = 5 + Math.floor(hash(c, seed + 1) * 12), cyc = rows + len + Math.floor(hash(c, seed + 2) * 20);
    const head = Math.floor(f * sp + hash(c, seed + 3) * cyc) % cyc;
    for (let k = 0; k < len; k++) { const row = head - k; if (row < 0 || row >= rows) continue; const shade = k === 0 ? 0 : Math.min(5, 1 + Math.floor((k / len) * 5)); const gi = Math.floor(hash(c * 31 + row, (f >> 3) + (hash(c, row) > 0.7 ? 0 : 99)) * 28); ctx.drawImage(GLYPHS[shade][gi], c * gap, row * 6); }
  }
  ctx.globalAlpha = 1;
}
function level6(A) {
  const hole = frames(8, (p) => blackHole(15, p, { tilt: 0.24, pal: CODEPAL }));
  const city = (seed, hmin, edge, win, fill, hgt) => { const r = rng(seed), bs = []; for (let x = 0; x < 640;) { const w = 16 + Math.floor(r() * 26); bs.push([x, w, hmin + Math.floor(r() * 46)]); x += w + 3 + Math.floor(r() * 8); }
    return pix(640, hgt, (i, j) => { const b = bs.find((q) => i >= q[0] && i < q[0] + q[1]); if (!b) return null; const top = hgt - b[2]; if (j < top) return null; if (j === top || i === b[0] || i === b[0] + b[1] - 1) return edge; if ((i - b[0]) % 4 === 2 && (j - top) % 5 === 3) return hash(i >> 2, j) > 0.8 ? win[0] : win[1]; return fill; }); };
  const far = city(71, 40, '#0f6a1c', ['#1fa02e', '#062a0c'], '#020c04', 110), near = city(73, 22, '#3ae03a', ['#8aff9a', '#0a3a12'], '#010602', 80);
  const roof = pix(640, H - GY, (i, j) => { if (j === 0) return '#8aff9a'; if (j === 1) return '#1fa02e'; if (i % 32 === 0 || j === 9 || j === 17) return '#0a3a12'; return dith(['#03140a', '#020c06', '#010402'], j / 24, i, j); });
  // rooftop props in green wireframe: vents, a water tower and the ringing phone box (the exit)
  const props = cv(640, 60); { const x = props.getContext('2d'), ln = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
    const box = (bx, by, w, h, e = '#3ae03a', fill = '#020c04') => { ln(fill, bx, by, w, h); ln(e, bx, by, w, 1); ln(e, bx, by, 1, h); ln(e, bx + w - 1, by, 1, h); };
    box(60, 46, 22, 14); box(64, 40, 14, 6); for (let k = 0; k < 4; k++) ln('#1fa02e', 63 + k * 4, 49, 2, 8);
    for (const lx of [214, 222, 238, 246]) ln('#1fa02e', lx, 34, 1, 26); ln('#1fa02e', 214, 44, 33, 1); box(208, 10, 44, 24); ln('#3ae03a', 206, 8, 48, 2); for (let k = 0; k < 5; k++) ln('#0f6a1c', 212 + k * 9, 12, 1, 21);
    box(360, 50, 30, 10); box(400, 52, 12, 8);
    box(540, 16, 18, 44, '#8aff9a', '#03140a'); ln('#8aff9a', 538, 14, 22, 2); ln('#0a3a12', 543, 22, 12, 30); ln('#8aff9a', 546, 30, 5, 2); ln('#8aff9a', 547, 32, 3, 6); drawText(x, 'EXIT', 549, 4, { fill: GRAD.green, outline: '#000', align: 'center' }); }
  const ripple = (ctx, x, y, r, a) => { ctx.globalAlpha = a; ctx.fillStyle = '#c8ffd0'; for (let t = 0; t < TAU; t += 0.35) rect(ctx, '#c8ffd0', x + Math.cos(t) * r * 0.35, y + Math.sin(t) * r, 1, 1); ctx.globalAlpha = 1; };
  return (ctx, f) => {
    rect(ctx, '#000', 0, 0, W, H);
    codeRain(ctx, f, W, H, { seed: 3, alpha: 0.55 });
    putC(ctx, hole[Math.floor(f / 2) % 8], 236, 44);
    // bullet time: every few seconds the world nearly stops and you bend back under the bullets
    const cyc = 84, p = f % cyc, bt = p >= 34 && p < 78, k = bt ? Math.sin(((p - 34) / 44) * Math.PI) : 0;
    const wt = Math.floor(f / cyc) * (34 * 2 + 44 * 0.25) + (p < 34 ? p * 2 : p < 78 ? 68 + (p - 34) * 0.25 : 79 + (p - 78) * 2);   // warped world time
    tile(ctx, far, wt * 0.3, GY - 110); tile(ctx, near, wt * 0.7, GY - 80);
    tile(ctx, props, wt * 2, GY - 60); tile(ctx, roof, wt * 2, GY);
    put(ctx, A.sentinel[Math.floor(wt / 2) % 8], 128 + Math.sin(wt * 0.05) * 20, 34 + Math.sin(wt * 0.11) * 6);
    // the déjà vu cat: walks past, then the same cat walks past again
    const cx = 300 - ((wt * 1.2) % 360); put(ctx, A.cat[Math.floor(wt / 2) % 8], cx, GY); ctx.globalAlpha = 0.45; put(ctx, A.cat[Math.floor(wt / 2) % 8], cx - 30, GY); ctx.globalAlpha = 1;
    put(ctx, A.agent[Math.floor(wt / 2) % 8], 300 - ((wt * 1.5) % 120), GY);
    put(ctx, A.agentShoot, 258, GY);
    // bullets from the agent's gun; in bullet time they crawl and leave ripples in the air
    for (let i = 0; i < 3; i++) { const bx = 234 - ((wt * 6 + i * 52) % 210), by = GY - 30 - i * 4; if (bx < -10) continue;
      if (bt) for (let r = 1; r <= 3; r++) ripple(ctx, bx + 4 + r * 6, by, 1 + r * 1.6, 0.5 - r * 0.12); else for (let t = 1; t < 6; t++) rect(ctx, '#3ae03a', bx + 3 + t * 2, by, 1, 1);
      rect(ctx, '#000', bx - 1, by - 2, 6, 3); rect(ctx, '#e8e4c8', bx, by - 1, 4, 1); rect(ctx, '#b89a4a', bx + 2, by - 1, 2, 1); }
    // everything in the simulation reads green; only you are in colour
    ctx.globalCompositeOperation = 'multiply'; rect(ctx, '#7affa0', 0, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 2; i++) { const t = (wt * 0.05 + i * 1.7); const px = 196 + i * 18, py = GY - 46 + Math.sin(t * 3) * 3; rect(ctx, '#000', px - 1, py - 1, 9, 5); rect(ctx, i ? '#2a6aff' : '#ff2a2a', px, py, 7, 3); rect(ctx, i ? '#8ab8ff' : '#ff9a8a', px + 1, py, 3, 1); }
    // you: in bullet time you bend over backwards, with green afterimages
    const hx = 76, hero = bt ? A.hero.fall : A.hero.run[f % 8];
    const lean = (c, ang, a) => { ctx.save(); ctx.globalAlpha = a; ctx.translate(hx - 5, GY - 2); ctx.rotate(-ang); put(ctx, c, 5, 0); ctx.restore(); };
    if (bt) { lean(tint(hero, '#3ae03a', 0.8), k * 0.45, 0.25); lean(tint(hero, '#3ae03a', 0.8), k * 0.8, 0.4); }
    lean(hero, k * 1.0, 1);
    if (bt && (f >> 2) % 2) drawText(ctx, 'BULLET TIME', W / 2, 22, { fill: GRAD.green, outline: '#000', align: 'center' });
    hud(ctx, A, f, 4, null, GRAD.green);
  };
}

// a towering wave whose crest curls over towards you (it rolls in from the right)
export function waveArt(w, h) {
  const m = cv(w, h), x = m.getContext('2d'), x0 = w * 0.42, cT = h * 0.08, r = h * 0.26;
  x.fillStyle = '#fff'; x.beginPath();
  x.moveTo(w, h); x.lineTo(w, h * 0.72);
  x.quadraticCurveTo(w * 0.7, h * 0.3, x0, cT);                        // back of the wave up to the crest
  x.quadraticCurveTo(x0 - r * 1.1, cT - r * 0.1, x0 - r * 1.2, cT + r * 0.9);   // lip curling over
  x.quadraticCurveTo(x0 - r * 0.9, cT + r * 0.5, x0 - r * 0.35, cT + r * 0.75); // underside of the lip
  x.quadraticCurveTo(x0 - r * 0.2, h * 0.7, x0 - r * 1.3, h);           // concave face down to the base
  x.closePath(); x.fill();
  const d = x.getImageData(0, 0, w, h).data, on = (i, j) => i >= 0 && j >= 0 && i < w && j < h && d[(j * w + i) * 4 + 3] > 128;
  return pix(w, h, (i, j) => {
    if (!on(i, j)) return null;
    const top = !on(i, j - 1) || !on(i, j - 2), side = !on(i - 1, j);
    if (top && j < h * 0.8) return '#ffffff';
    if ((side || !on(i, j - 3)) && hash(i, j) > 0.35) return '#d8f4ff';
    const barrel = i < x0 && j < cT + r * 1.6 && i > x0 - r * 1.3;
    return dith(['#9ee6ff', '#5ab4e0', '#2a7ab0', '#14548a', '#0c3a68'], (j / h) * 0.85 + (barrel ? 0.15 : 0) + (i > x0 ? 0.08 : 0), i, j);
  });
}

export const buildNeon = (A, o) => level5(A, o);
export const buildHive = (A) => level2(A), buildCode = (A) => level6(A);
// shared helpers for the level files in bhf/lv-*.js
export { rng, tile, rect, putC, stars, drawStars, sparks };
export function buildLevels(A, invN = 5) { return [level1(A), level2(A), level5(A), level6(A), level3(A, invN)]; }

// ---- title screen --------------------------------------------------------------------
export function buildTitle(A) {
  const S = stars(7, 220, 200), bh = frames(10, (p) => blackHole(26, p, { tilt: 0.18 }));
  const T = cv(320, 200);
  return (ctx, f) => {
    rect(ctx, '#000', 0, 0, 320, 200); drawStars(ctx, S, f);
    putC(ctx, bh[Math.floor(f / 2) % 10], 160, 62);
    const wave = (k) => (i) => Math.sin(f / 5 + i * 0.6 + k) * 1.5;
    for (let d = 4; d >= 1; d--) drawText(ctx, 'BLACK HOLE', 160 + d, 108 + d, { scale: 4, fill: '#3a1204', outline: null, align: 'center', wave: wave(0) });
    drawText(ctx, 'BLACK HOLE', 160, 108, { scale: 4, fill: COPPER, outline: '#000', align: 'center', wave: wave(0) });
    for (let d = 4; d >= 1; d--) drawText(ctx, 'FRIDAY', 160 + d, 142 + d, { scale: 4, fill: '#1a1a2a', outline: null, align: 'center', wave: wave(1) });
    drawText(ctx, 'FRIDAY', 160, 142, { scale: 4, fill: GRAD.white, outline: '#000', align: 'center', wave: wave(1) });
    drawText(ctx, 'TOP SCORE WINS THE FULL METAL JACKET COPPER', 160, 182, { fill: (f >> 3) % 2 ? COPPER : GRAD.gold, outline: '#000', align: 'center' });
    put(ctx, A.hero.run[f % 8], 30 + ((f * 2) % 300), 100);
  };
}

// ---- prize screen --------------------------------------------------------------------
export function buildPrize(A) {
  const S = stars(13, 160, 200), bh = frames(10, (p) => blackHole(30, p, { tilt: 0.16 }));
  return (ctx, f) => {
    rect(ctx, '#000', 0, 0, 320, 200); drawStars(ctx, S, f);
    putC(ctx, bh[Math.floor(f / 2) % 10], 160, 96);
    drawText(ctx, 'TOP 3 SCORES WIN', 160, 10, { scale: 2, fill: GRAD.gold, outline: '#000', align: 'center' });
    const j = A.jacketBig[Math.floor(f / 2) % 12]; const bob = Math.sin(f * 0.15) * 2;
    ctx.drawImage(j.c, Math.round(160 - j.ox * 1.5), Math.round(124 + bob - j.oy * 1.5), j.c.width * 1.5, j.c.height * 1.5);
    drawText(ctx, 'THE FULL METAL JACKET', 160, 152, { scale: 2, fill: GRAD.white, outline: '#000', align: 'center' });
    for (let d = 3; d >= 1; d--) drawText(ctx, 'COPPER', 160 + d, 172 + d, { scale: 3, fill: '#3a1204', outline: null, align: 'center' });
    drawText(ctx, 'COPPER', 160, 172, { scale: 3, fill: COPPER, outline: '#000', align: 'center', wave: (i) => Math.sin(f / 5 + i * 0.7) * 1.2 });
  };
}
