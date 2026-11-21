// Black Hole Friday: the way out of each level. Every level ends in a different portal. Beat the boss and it opens;
// he goes in, falls down that portal's own tunnel, and comes out of its far end at the start of the next level.
// The portal belongs to the level being LEFT (so it still makes sense when the running order is changed);
// whichever level is last ends in the black hole, and the game starts with the wormhole.
import { cv, put, flip, tint, hash, TAU, frames, pix, dith, blackHole } from './kit.js';
import { ART } from '../portals.js';

export const EXIT = { neon: 'mirror', ice: 'breach', hive: 'goo', code: 'phone', desert: 'ring', tenet: 'turnstile' };

// ---------- art that only the game has ----------
// the green swirl (Rick and Morty style)
const PCOL = ['#0a3a0c', '#157a14', '#2fc01e', '#7af02a', '#c8ff5a', '#f4ffc0'];
const SWIRL = frames(12, (p) => pix(46, 62, (i, j) => {
  const u = (i - 23) / 21, v = (j - 31) / 29, r = Math.hypot(u, v), a = Math.atan2(v, u);
  const edge = 1 + 0.07 * Math.sin(a * 5 + p * TAU) + 0.04 * Math.sin(a * 9 - p * TAU * 2);
  if (r > edge) return null;
  if (r > edge - 0.09) return '#0a3a0c';
  if (r > edge - 0.2) return dith(['#c8ff5a', '#7af02a'], (edge - r - 0.09) / 0.11, i, j);
  const s = Math.sin(a * 2 + r * 9 - p * TAU), blob = hash(Math.floor(a * 3 + r * 8 - p * 12), Math.floor(r * 5));
  if (s > 0.55 && blob > 0.35) return r < 0.3 ? '#157a14' : '#0a3a0c';             // the dark spiral arms
  if (blob > 0.9 && r > 0.25) return '#f4ffc0';                                     // bright flecks
  return dith(PCOL.slice(1, 5), 0.35 + s * 0.25 + (1 - r) * 0.3, i, j);
}));
const TURN = ART.turnstile, TS_R = ART.TS_R, TS_B = ART.TS_B;
const PHONE = [ART.phoneBox(0, false), ART.phoneBox(2, true)];
// the liquid mirror in a neon frame (it stands on a rooftop in the rain)
const MIRROR = ART.mirror.map((m, n) => { const c = cv(54, 78), x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 54, 78); x.fillStyle = n % 6 === 5 ? '#ff9ac8' : '#ff3a8a'; x.fillRect(1, 1, 52, 76); x.fillStyle = '#12060e'; x.fillRect(2, 2, 50, 74);
  x.fillStyle = '#3ad8ff'; x.fillRect(3, 3, 48, 72); x.drawImage(m, 4, 4); x.fillStyle = '#000'; x.fillRect(0, 76, 54, 2); return c; });
// the breach, big enough to fall into: a white-hot tear, orange then blue at its edges
const BREACH = frames(12, (t) => pix(74, 108, (i, j) => {
  const cx = 37 + Math.sin(j * 0.13) * 4 + Math.sin(j * 0.31 + t * TAU) * 1.5, prof = Math.max(0, 1 - Math.abs(j - 55) / 53);
  const w = Math.pow(prof, 0.7) * 13 * (0.82 + 0.18 * Math.sin(j * 0.37 - t * TAU));
  if (w < 0.6) return null;
  const q = Math.abs(i - cx) / w;
  if (q < 0.25) return '#fff4d0'; if (q < 0.5) return dith(['#ffd070', '#ff8a2a'], (q - 0.25) * 4, i, j);
  if (q < 0.9) return dith(['#ff6a1a', '#3ad8ff'], (q - 0.5) * 2.5, i, j); if (q < 1.25) return dith(['#3ad8ff', '#0a5a8a'], (q - 0.9) * 3, i, j);
  if (q < 1.7) return hash(i, j + Math.floor(t * 12)) > 0.6 ? '#0a5a8a' : '#14222e';
  return null;
}));
const HOLE = frames(8, (t) => blackHole(19, t, { tilt: 0.22 }));

// ---------- drawing a portal standing on the floor: (ctx, x, floor y, k = how open 0..1, frame, ticks since it appeared) ----------
const centre = (ctx, c, x, y, w = c.width, h = c.height) => { w = Math.round(w); h = Math.round(h); if (w > 0 && h > 0) ctx.drawImage(c, Math.round(x - w / 2), Math.round(y - h / 2), w, h); };
const rise = (ctx, c, x, gy, k) => { const h = Math.round(c.height * Math.min(1, k)); if (h > 0) ctx.drawImage(c, 0, 0, c.width, h, Math.round(x - c.width / 2), gy - h, c.width, h); };
export const PORTALS = {
  goo: { name: 'THE GOO PORTAL', enter: 'spin',
    draw(ctx, x, gy, k, f) {
      const ov = k < 1 ? k * (1.25 - 0.25 * k) : 1 + Math.sin(f / 9) * 0.03, a = SWIRL[(f >> 1) % 12];
      centre(ctx, a, x, gy - 31, a.width * ov, a.height * (0.3 + 0.7 * ov) * Math.min(1, k));
      for (let i = 0; i < 6; i++) {                 // drops spinning off it
        const t = (f * 0.06 + i * 1.05) % TAU, d = 26 + ((f + i * 17) % 20) * 0.5 * k;
        ctx.fillStyle = i % 2 ? '#7af02a' : '#c8ff5a'; ctx.fillRect(Math.round(x + Math.cos(t) * d * 0.8 * k), Math.round(gy - 31 + Math.sin(t) * d * k), 2 - (i % 2), 2 - (i % 2));
      } } },
  mirror: { name: 'THE LIQUID MIRROR', enter: 'fade', col: '#dfe4ea',
    draw(ctx, x, gy, k, f) {
      rise(ctx, MIRROR[(f >> 2) % 12], x, gy, k);
      if (k >= 1) for (let i = 0; i < 4; i++) { const t = (f + i * 23) % 60; if (t < 8) { const sx = Math.round(x - 20 + hash(i, (f / 60) | 0) * 40), sy = Math.round(gy - 70 + hash(i + 9, (f / 60) | 0) * 60); ctx.fillStyle = '#ffffff'; ctx.fillRect(sx - 1, sy, 3, 1); ctx.fillRect(sx, sy - 1, 1, 3); } }
    } },
  breach: { name: 'THE BREACH', enter: 'spin',
    draw(ctx, x, gy, k, f) {
      const a = BREACH[(f >> 1) % 12]; centre(ctx, a, x, gy - 51, a.width * (0.4 + 0.6 * k), a.height * k);
      if (k > 0.5) for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#3ad8ff' : '#ffd070'; ctx.fillRect(Math.round(x + (hash(i, 1) - 0.5) * 40), Math.round(gy - ((f * (0.5 + hash(i, 2)) + i * 13) % 104)), 1, 1 + (i % 2)); }
    } },
  phone: { name: 'THE PHONE LINE', enter: 'code', col: '#3ae03a',
    draw(ctx, x, gy, k, f, t = 999) {
      const ringing = t < 900 && (f >> 4) % 2 === 0, c = PHONE[ringing && (f >> 1) % 2 ? 1 : 0], X = Math.round(x - 15), Y = gy - 64;
      if (k >= 1) ctx.drawImage(c, X, Y);
      else for (let j = 0; j < 64; j++) if (hash(j, 11) < k) ctx.drawImage(c, 0, j, 30, 1, X + (hash(j, f >> 2) < 0.25 ? (hash(j, f) < 0.5 ? -1 : 1) : 0), Y + j, 30, 1);   // it prints itself in, line by line
      if (ringing && k >= 1) { ctx.fillStyle = '#8aff9a'; for (const s of [-1, 1]) for (let n = 0; n < 3; n++) ctx.fillRect(Math.round(x + s * (19 + n * 3)), gy - 60 - n * 2, 1, 4 + n * 3); }
    } },
  ring: { name: 'THE RING GATE', enter: 'fade', col: '#8ad0ff', openT: 54,
    draw(ctx, x, gy, k, f, t = 999) {                // rises out of the sand, seven lights lock one by one, then the middle turns to water
      const a = t < 48 ? ART.ring[Math.floor(t / 3)] : ART.ring[16 + ((f >> 2) % 8)], top = Math.round(gy - 75 + (1 - Math.min(1, k)) * 64), vis = Math.min(80, gy + 5 - top);
      if (vis > 0) ctx.drawImage(a, 0, 0, 80, vis, Math.round(x - 40), top, 80, vis);
    } },
  turnstile: { name: 'THE TURNSTILE', enter: 'fade', col: '#3a8aff',
    draw(ctx, x, gy, k, f) { rise(ctx, TURN[(f >> 2) % 12], x, gy, k); } },
  blackhole: { name: 'THE BLACK HOLE', enter: 'stretch', cy: 58, openT: 34,
    draw(ctx, x, gy, k, f) {
      const a = HOLE[(f >> 2) % 8]; centre(ctx, a, x, gy - 58, a.width * k, a.height * k);
      for (let i = 0; i < 9; i++) {                 // everything nearby is being pulled in
        const d = (62 - ((f * 0.5 + i * 7) % 44)) * k, t = f * 0.05 + i * 0.7 + (62 - d) * 0.06;
        ctx.fillStyle = i % 3 ? '#ffb35a' : '#fffbe8'; ctx.fillRect(Math.round(x + Math.cos(t) * d), Math.round(gy - 58 + Math.sin(t) * d * 0.7), 1, 1);
      } } },
  wormhole: { name: 'THE WORMHOLE', enter: 'spin',
    draw(ctx, x, gy, k, f) { const a = ART.wormhole[(f >> 1) % 12]; centre(ctx, a, x, gy - 34, a.width * k, a.height * k); } },
};
export function drawPortalAt(ctx, kind, x, gy, k, f, t = 999) { if (k > 0) (PORTALS[kind] || PORTALS.goo).draw(ctx, x, gy, k, f, t); }

// ---------- the hero going in: k runs 1 -> 0 ----------
const tc = new Map(), fcache = new Map();
const tinted = (im, col) => { let m = tc.get(im); if (!m) tc.set(im, (m = new Map())); if (!m.has(col)) m.set(col, tint(im, col, 0.8)); return m.get(col); };
const flipped = (im) => { if (!fcache.has(im)) fcache.set(im, flip(im)); return fcache.get(im); };
export function drawEntering(ctx, kind, im, hx, hy, k, px, gy) {
  const P = PORTALS[kind] || PORTALS.goo, e = P.enter;
  if (e === 'fade') {                               // wades in and takes its colour
    ctx.globalAlpha = k; put(ctx, im, hx, hy); ctx.globalAlpha = k * Math.min(1, (1 - k) * 2); put(ctx, tinted(im, P.col), hx, hy); ctx.globalAlpha = 1;
  } else if (e === 'code') {                        // breaks up into green code and streams into the receiver
    ctx.globalAlpha = k; put(ctx, tinted(im, P.col), hx, hy); ctx.globalAlpha = 1;
    for (let i = 0; i < 30; i++) { const u = (1 - k) * (0.7 + hash(i, 4) * 0.9); if (u > 1) continue; const sx = hx - 6 + hash(i, 1) * 12, sy = hy - hash(i, 2) * 30; ctx.fillStyle = i % 3 ? '#3ae03a' : '#e8ffe8'; ctx.fillRect(Math.round(sx + (px - sx) * u), Math.round(sy + (gy - 44 - sy) * u), 1, 2); }
  } else if (e === 'stretch') {                     // pulled thin, up into the hole
    const u = 1 - k, x = hx + (px - hx) * u, y = hy - 16 + (gy - (P.cy || 31) - (hy - 16)) * u * u;
    ctx.save(); ctx.globalAlpha = Math.sqrt(k); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(u * 0.9); ctx.scale(Math.max(0.12, k), 1 + u * 1.8); ctx.drawImage(im.c, -im.ox, -im.oy + 16); ctx.restore();
  } else {                                          // spins away down it
    ctx.save(); ctx.translate(Math.round(hx), Math.round(hy - 16)); ctx.rotate((1 - k) * 5); ctx.scale(k, k); ctx.drawImage(im.c, -im.ox, -im.oy + 16); ctx.restore();
  }
}
// the mirror shows him walking up to meet himself
export function drawReflection(ctx, im, hx, hy, px, gy, a = 0.6) {
  const d = px - hx; if (Math.abs(d) > 70) return;
  ctx.save(); ctx.beginPath(); ctx.rect(Math.round(px - 23), gy - 74, 46, 70); ctx.clip(); ctx.globalAlpha = a;
  put(ctx, flipped(tinted(im, '#dfe4ea')), px + d * 0.45, hy - 2); ctx.restore();
}

// ---------- the tunnel between two levels: a full screen, drawn live, one look per portal ----------
const TW = 320, TH = 180, TN = TW * TH;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const abgr = (h) => { const n = parseInt(h.slice(1), 16); return ((255 << 24) | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; };
const ramp = (cols) => Uint32Array.from(cols.map(abgr));
const fract = (x) => x - Math.floor(x), sw = (x) => 0.5 + 0.5 * Math.sin(x), col = (a, n) => Math.floor((a / TAU + 0.5) * n);
let TB = null;
function tun() {
  if (TB) return TB;
  const c = cv(TW, TH), x = c.getContext('2d'), im = x.createImageData(TW, TH), u32 = new Uint32Array(im.data.buffer);
  const A = new Float32Array(TN), L = new Float32Array(TN), R = new Float32Array(TN), BY = new Float32Array(TN);
  for (let j = 0, o = 0; j < TH; j++) for (let i = 0; i < TW; i++, o++) { const dx = i - 159.5, dy = j - 89.5, r = Math.hypot(dx, dy); A[o] = Math.atan2(dy, dx); R[o] = r; L[o] = Math.log(r + 3); BY[o] = BAYER[(j & 3) * 4 + (i & 3)]; }
  return (TB = { c, x, im, u32, A, L, R, BY });
}
// shade(a = angle, l = log distance from the middle, r = distance, t = seconds, p = progress 0..1, i, j) -> 0..1 along the ramp (+2 = the second ramp)
const TUN = {
  goo: { pals: [ramp(PCOL)], shade(a, l, r, t) {
    if (r < 9) return 0.99;
    const s = Math.sin(a * 3 + l * 7 - t * 9), fl = hash((a * 9 + l * 4) | 0, (l * 9 - t * 14) | 0);
    if (s > 0.55 && fl > 0.3) return 0.06;
    if (fl > 0.95) return 0.99;
    return 0.45 + s * 0.3 + (r < 46 ? (46 - r) / 90 : 0); } },
  breach: { pals: [ramp(['#fff4d0', '#ffd070', '#ff8a2a', '#ff6a1a', '#3ad8ff', '#0a5a8a', '#14222e', '#060c14'])], shade(a, l, r, t) {
    return r / 165 + 0.1 * Math.sin(a * 7 + l * 6 - t * 11) + 0.06 * Math.sin(a * 13 - l * 9 + t * 7) + 0.07 * Math.sin(l * 14 - t * 16) - 0.04; } },
  mirror: { pals: [ramp(['#22262c', '#3a4048', '#6e7682', '#aab2bc', '#dfe4ea', '#ffffff'])], shade(a, l, r, t) {
    if (r < 7) return 0.99;
    const v = Math.sin(l * 11 - t * 9 + 0.9 * Math.sin(a * 3 + t * 2));
    return 0.48 + 0.34 * v + 0.16 * Math.sin(a * 2 + 1 + l) + (v > 0.93 ? 0.3 : 0); } },
  phone: { flash: '#e8ffe8', pals: [ramp(['#000000', '#03140a', '#0a3a12', '#0f6a1c', '#1fa02e', '#3ae03a', '#8aff9a', '#e8ffe8'])], shade(a, l, r, t) {
    if (r < 12) return 0.75 + (12 - r) / 48;
    const n = r < 40 ? 28 : 56, e = (a / TAU + 0.5) * n, c = Math.floor(e), hs = hash(c, 7 + n);
    if (e - c > 0.7) return 0;
    const y = l * 5 - t * 5 * (0.7 + hs * 0.9) + hs * 9, g = hash(c, Math.floor(y * 2.4)), tail = fract(y / 3);
    if (g < 0.3) return 0.03;
    return tail > 0.93 ? 0.99 : 0.08 + tail * tail * 0.7 * (0.55 + g * 0.45); } },
  ring: { flash: '#e8f8ff', pals: [ramp(['#061440', '#0a2460', '#1a4aa0', '#3a8ae0', '#8ad0ff', '#e8f8ff'])], shade(a, l, r, t) {
    const hs = hash(col(a, 90), 3), streak = hs > 0.8 ? 0.28 * sw(l * 9 - t * 20 + hs * 40) : 0;
    return 0.1 + 0.5 * sw(l * 10 - t * 12 + 0.9 * Math.sin(a * 4 + t * 3)) * (0.5 + r / 300) + streak + (r < 28 ? (28 - r) / 28 : 0); } },
  turnstile: { pals: [ramp(TS_R), ramp(TS_B)], shade(a, l, r, t, p, i) {
    const left = i < 160, d = left ? -1 : 1;
    if (i === 159 || i === 160) return 0.99;
    if (Math.sin(a * 9 + d * t * 2.5) > 0.82) return left ? 0 : 2;
    return 0.5 + 0.4 * Math.sin(l * 10 + d * t * 11) + (r < 30 ? (30 - r) / 60 : 0) + (left ? 0 : 2); } },
  blackhole: { noOut: true, pals: [ramp(['#000000', '#1a0804', '#6a1e0c', '#b8441a', '#f07a2a', '#ffb35a', '#ffe2a0', '#fffbe8'])], shade(a, l, r, t, p) {
    const R0 = 14 + p * p * 250; if (r < R0) return 0; if (r < R0 + 2.5) return 0.99;
    const d = r - R0, glow = Math.exp(-d / (26 + p * 60)), hs = hash(col(a, 150), 9);
    const star = hs > 0.9 && fract(l * 1.4 + t * 2.4 + hs * 30) < 0.22 ? 0.45 : 0;
    return Math.min(0.97, 0.03 + glow * (0.3 + 0.62 * sw(a * 2 - l * 6 - t * 7)) + star); } },
  wormhole: { pals: [ramp(['#04051a', '#0a0c30', '#2a3080', '#6a7ad8', '#b8c8ff', '#ffe8b0', '#ffffff'])], shade(a, l, r, t) {
    if (r < 8) return 0.99;
    const hs = hash(col(a, 130), 5); if (hs > 0.88 && fract(l * 1.3 - t * 3 + hs * 20) > 0.72) return 0.99;
    const band = Math.exp(-Math.pow(Math.sin(a + l * 1.6 - t * 1.6) * 1.7, 2));
    return 0.06 + band * 0.55 + 0.12 * Math.sin(l * 9 - t * 10) + (r < 40 ? (40 - r) / 70 : 0); } },
};
// p = how far through (0..1); H = the hero's frames (so he can be seen falling down it)
export function drawTunnel(ctx, kind, p, f, H) {
  const T = tun(), K = TUN[kind] || TUN.goo, t = f / 60, { A, L, R, BY, u32 } = T, pals = K.pals, sh = K.shade;
  for (let o = 0; o < TN; o++) {
    let v = sh(A[o], L[o], R[o], t, p, o % TW, (o / TW) | 0), pal = pals[0]; if (v >= 2) { v -= 2; pal = pals[1]; }
    const q = (v < 0 ? 0 : v > 0.999 ? 0.999 : v) * (pal.length - 1), k = q | 0; u32[o] = pal[k + (q - k > BY[o] ? 1 : 0)];
  }
  T.x.putImageData(T.im, 0, 0); ctx.drawImage(T.c, 0, 0);
  if (H) {
    const im = H.fall, s = 1.7 - 1.35 * p, d = (1 - p) * 30, an = t * 4, x = 160 + Math.cos(an) * d, y = 90 + Math.sin(an) * d * 0.6;
    const one = (img, X, Y, rot, sx, sy, al = 1) => { ctx.save(); ctx.globalAlpha = al; ctx.translate(Math.round(X), Math.round(Y)); ctx.rotate(rot); ctx.scale(sx, sy); ctx.drawImage(img.c, -img.ox, -img.oy + 16); ctx.restore(); };
    if (kind === 'mirror') { one(im, x, y, t * 6, s, s); one(flipped(tinted(im, '#dfe4ea')), 320 - x, 180 - y, -t * 6, s, s, 0.8); }
    else if (kind === 'turnstile') { one(tinted(im, '#ff5a3a'), 160 - 16 - d, 90, t * 5, s, s); one(flipped(tinted(im, '#3a8aff')), 160 + 16 + d, 90, -t * 5, s, s); }
    else if (kind === 'phone') one(tinted(im, '#3ae03a'), x, y, t * 6, s, s, 0.4 + 0.6 * ((f >> 1) % 2));
    else if (kind === 'blackhole') one(im, 160 + (1 - p) * 90 * Math.cos(an * 0.5), 90 + (1 - p) * 50 * Math.sin(an * 0.5), an * 0.5 + 1.6, Math.max(0.1, 1.3 - p * 2.2), 1.3 + p * 3, Math.max(0, 1 - p * 1.6));
    else one(im, x, y, t * 7, s, s);
  }
  const fl = p < 0.12 ? 1 - p / 0.12 : p > 0.88 && !K.noOut ? (p - 0.88) / 0.12 : 0;
  if (fl > 0) { ctx.globalAlpha = fl; ctx.fillStyle = K.flash || '#ffffff'; ctx.fillRect(0, 0, TW, TH); ctx.globalAlpha = 1; }
}
