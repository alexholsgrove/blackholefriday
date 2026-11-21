// Black Hole Friday level art: DEEP DESERT. Crossing the open desert at dusk: a dune sea under a huge sky, a storm wall ahead,
// dragonfly ships (ornithopters) at every depth, a spice harvester working the mid dunes, wormsign far off.
// You run along the foot of a spice pipeline: its catwalk is the gallery, carried on trestles between rock outcrops.
// Also the level's own dangers: spice blows, imperial troopers, hunter-seekers, storm debris, the body shield, the worm you can ride.
import { cv, pix, dith, hash, tint, TAU, noise, fr, scaleFr, sky, arcadeCanvas, glow } from '../kit.js';

const rc = (x) => (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
const seg = (ctx, x0, y0, x1, y1, col, th = 1) => { const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); ctx.fillStyle = col; for (let k = 0; k <= n; k++) ctx.fillRect(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n), th, th); };
const ell = (ctx, cx, cy, rx, ry, col) => { ctx.fillStyle = col; const R = Math.max(0.5, ry); for (let j = -Math.ceil(R); j <= Math.ceil(R); j++) { const t = 1 - (j * j) / (R * R); if (t < 0) continue; const w = rx * Math.sqrt(t); ctx.fillRect(Math.round(cx - w), Math.round(cy + j), Math.max(1, Math.round(w * 2)), 1); } };
// black outline round whatever is on a canvas (sprites must read against any wall)
const outlined = (w, h, draw) => { const a = cv(w, h), ax = a.getContext('2d'); draw(ax); const c = cv(w, h), x = c.getContext('2d'); x.drawImage(a, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.globalCompositeOperation = 'source-over'; const k = cv(w, h), kx = k.getContext('2d'); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) kx.drawImage(c, dx, dy); kx.drawImage(a, 0, 0); return k; };

// rock in shadow (umber, plum in the deep), the last sun on its edges; sand-blasted steel
const R0 = '#3e2a2a', R1 = '#4e342e', R2 = '#6a4636', R3 = '#2e1e22', R4 = '#22161c', R5 = '#140c12', RIM = '#d09454';
const S0 = '#161c22', S1 = '#28343c', S2 = '#44545c', S3 = '#70848a', S4 = '#a8bcc0', RUST = '#8a4a2c';
const SPICE = '#e0762a', SPHI = '#ffb04a', BLUE = '#7ad8ff';

// a row of dunes across w px (it tiles): n dunes, each a long windward slope up to a knife crest and a short slip face in shadow;
// the crest line runs down toward you, the last light along every top, spindrift blowing off the peaks
function dunes(x, w, yBase, amp, n, ph, body, shade, crest, bottom, drift, rip) {
  const top = new Array(w), T = new Array(w), base = new Array(w), dw = w / n, PK = 0.64;
  for (let i = 0; i < w; i++) {
    const a = i / w, p = (((n * (a + 0.03 * Math.sin(TAU * a * 2 + ph)) + ph * 0.37) % n) + n) % n, k = Math.floor(p), t = p - k;
    const hk = 0.5 + 0.5 * hash(k, Math.round(yBase * 3 + amp)), h = t < PK ? Math.pow(Math.sin((Math.PI / 2) * (t / PK)), 1.4) : Math.pow(1 - (t - PK) / (1 - PK), 1.7);
    base[i] = yBase - amp * 0.22 * (0.5 + 0.5 * Math.sin(TAU * a + ph * 3));
    top[i] = Math.round(base[i] - amp * hk * h); T[i] = t;
  }
  for (let i = 0; i < w; i++) {
    const y = top[i], t = T[i], lee = t >= PK, dist = lee ? 0 : (PK - t) * dw, tr = Math.round(base[i]) + 1;
    for (let j = y; j < bottom; j++) {
      const d = j - y; let c;
      const sh = j < tr + 2 && (lee || (d > dist * 1.25 + 1 && dist < amp * 1.3)) && (j < tr - 2 || dith([1, 0], (j - (tr - 2)) / 4, i, j));
      if (d === 0) c = lee ? body : crest;
      else if (sh) c = shade;
      else if (j < tr) c = rip && (d + Math.round(2 * Math.sin(i / 7))) % 5 === 0 && hash(i >> 1, d) > 0.4 ? rip : body;
      else c = dith([body, shade], (j - tr) / 26, i, j);
      x.fillStyle = c; x.fillRect(i, j, 1, 1);
    }
    if (drift && !lee && T[(i + 1) % w] >= PK && tr - y > amp * 0.45) for (let k = 1; k < 12; k++) if (hash(i + k, y) > 0.25 + k * 0.05) { x.fillStyle = k < 5 ? crest : drift; x.fillRect((i + k * 2) % w, y - 1 + (k > 7 ? 1 : 0) - ((k * 3) % 2), 2, 1); }   // sand streaming off a crest, downwind
  }
  return top;
}
// spice lying on a dune face: cinnamon streaks, a glint or two
function spiceOn(x, top, w, x0, len, col, hi) {
  for (let i = 0; i < len; i++) { const xi = (x0 + i) % w, e = Math.min(i, len - i) / len; for (let d = 2; d < 3 + e * 16; d++) if (hash(xi >> 1, d) < e * 1.5 && (xi + d * 2) % 5 < 3) { x.fillStyle = hash(xi, d) > 0.93 ? hi : col; x.fillRect(xi, top[xi] + d, 1, 1); } }
}

// ---------- a dragonfly ship (ornithopter): a blunt glazed head, a long segmented tail, two pairs of long narrow wings beating too fast to follow.
// The wings are the brightest thing on it. (cx, cy) = middle of the body, s = scale (1 = about 42 px head to tail), dir = 1 flying right / -1 left, ph = wing beat 0..1.
// pose 0 = flying, 1 = flying with its legs down, 2 = parked: wings folded back along the tail, standing on splayed legs (feet 7.5 * s under cy).
// Each (scale, facing, beat frame, colours, pose) is drawn once and kept.
const wingBlade = (ctx, x0, y0, x1, y1, wd, col) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0))); ctx.fillStyle = col; for (let k = 0; k <= n; k++) { const t = k / n, h = Math.max(1, Math.round(wd * (0.4 + 0.6 * Math.sin(Math.PI * Math.min(1, t * 1.12))))); ctx.fillRect(Math.round(x0 + (x1 - x0) * t - h / 2), Math.round(y0 + (y1 - y0) * t - h / 2), h, h); } };
const THOP = new Map();
function thopSprite(s, dir, k, C, pose) {
  const key = [s, dir, k, C.id, pose].join('|'); let sp = THOP.get(key); if (sp) return sp;
  const w = Math.ceil(62 * s) + 6, h = Math.ceil(50 * s) + 6, ox = Math.round(31 * s) + 3, oy = Math.round(31 * s) + 3, c = cv(w, h), ctx = c.getContext('2d');
  const X = (u) => ox + dir * u * s, Yv = (v) => oy + v * s, th = Math.max(1, Math.round(s * 0.8));
  const box = (u0, v0, u1, v1, col) => { const xa = Math.round(Math.min(X(u0), X(u1))), xb = Math.round(Math.max(X(u0), X(u1))), ya = Math.round(Yv(v0)), yb = Math.round(Yv(v1)); ctx.fillStyle = col; ctx.fillRect(xa, ya, Math.max(1, xb - xa), Math.max(1, yb - ya)); };
  const wing = (ru, deg, L, al, wd = 2.4) => { const a = (deg * Math.PI) / 180, x0 = X(ru), y0 = Yv(-3), x1 = X(ru + L * Math.cos(a)), y1 = Yv(-3 - L * Math.sin(a)); ctx.globalAlpha = al; wingBlade(ctx, x0, y0, x1, y1, Math.max(1, wd * s), C.wing); if (s >= 0.6) seg(ctx, x0, y0, x1, y1, C.whi, 1); ctx.globalAlpha = 1; };
  const fan = (ru, deg, L, al, sp = 9) => { wing(ru, deg - sp, L * 0.94, al * 0.3); wing(ru, deg + sp, L * 0.94, al * 0.3); wing(ru, deg, L, al); };   // a wing going too fast to see: the blade and its blur either side
  if (pose < 2) { const al = k === 2 ? 1 : 0.18; fan(3.5, -52, 19, al); fan(-0.5, -128, 17, al); }                     // the down stroke, behind the body
  for (let i = 0; i < 6; i++) {                                        // the tail: six segments, tapering, lifting a little toward the tip
    const u0 = -4.5 - i * 3.6, t = 1.75 - i * 0.24, v = -0.3 - i * 0.3;
    box(u0, v - t, u0 - 3.6, v + t, i % 2 ? C.m : C.k); box(u0, v - t, u0 - 3.6, v - t + 0.9, i % 2 ? C.rim : C.m); if (s >= 1.2) box(u0 - 3, v - t, u0 - 3.6, v + t, C.k);
  }
  seg(ctx, X(-26), Yv(-2.1), X(-28.5), Yv(-3.8), C.k, th); seg(ctx, X(-26), Yv(-1.6), X(-28.5), Yv(-0.4), C.k, th);       // the fork at the end of it
  ell(ctx, X(1.5), Yv(0), 6 * s, 3.5 * s, C.k); ell(ctx, X(1), Yv(0.9), 3.4 * s, 1.5 * s, C.m);                         // the body the wings are hung on
  seg(ctx, X(-3), Yv(-3.3), X(5.5), Yv(-3.3), C.rim, 1);
  ell(ctx, X(9.6), Yv(0.2), 4.5 * s, 3.7 * s, C.k); box(10.5, -2.9, 14.3, 2.9, C.k);                                   // the head: blunt, all glass
  ell(ctx, X(10.2), Yv(0), 3.5 * s, 2.8 * s, C.glass); box(10.5, -2.4, 13.5, 2.4, C.glass);
  ell(ctx, X(10.8), Yv(-1.2), 2.3 * s, 1 * s, C.ghi);
  if (s >= 0.9) { box(9.2, -3, 9.2 + 1 / s, 3, C.k); box(9.6, 0.5, 13.5, 0.5 + 1 / s, C.k); }                           // the frames between the panes
  if (pose) for (const [a, b, c2, d, e] of [[4.5, 2.6, 8, 4.4, 9.5], [1.5, 3.2, 1.8, 5, 1], [-1.5, 2.8, -5, 4.4, -6.8]]) { seg(ctx, X(a), Yv(b), X(c2), Yv(d), C.k, th); seg(ctx, X(c2), Yv(d), X(e), Yv(7.5) - th, C.k, th); box(e - 1.2, 7.5 - 0.9, e + 1.2, 7.5, C.m); }   // legs, splayed
  else { seg(ctx, X(4), Yv(3), X(6), Yv(4.6), C.k, 1); seg(ctx, X(0), Yv(3.2), X(-2), Yv(4.6), C.k, 1); }
  if (pose === 2) { wing(1.5, 170.5, 21, 0.95, 1.9); wing(0.5, 176, 18, 0.95, 1.6); }                                 // at rest: all four laid back along the tail
  else if (k === 0) { fan(3.5, 60, 25, 1); fan(-0.5, 122, 23, 1); }                                                 // the up stroke: a long narrow pair leaning forward, a pair leaning back
  else if (k === 2) { wing(3.5, 60, 25, 0.2); wing(-0.5, 122, 23, 0.2); }
  else { wing(3.5, 60, 25, 0.26); wing(-0.5, 122, 23, 0.26); fan(3.5, k === 1 ? 22 : 12, 21, 0.9, 6); fan(-0.5, k === 1 ? 158 : 168, 19, 0.9, 6); }   // between: swept flat
  sp = { c, ox, oy }; THOP.set(key, sp); return sp;
}
export function thopter(ctx, cx, cy, s, dir, ph, C, pose = 0, lamp = null) {
  const sp = thopSprite(s, dir, pose === 2 ? 0 : Math.floor((((ph % 1) + 1) % 1) * 4) & 3, C, pose);
  ctx.drawImage(sp.c, Math.round(cx) - sp.ox, Math.round(cy) - sp.oy);
  if (lamp) { const t = Math.max(1, Math.round(s * 1.3)); ctx.fillStyle = lamp; ctx.fillRect(Math.round(cx + dir * 14.5 * s) - (dir < 0 ? t : 0), Math.round(cy + 1.2 * s), t, t); }
}
// what a low one does to the sand under it
function dustKick(ctx, x, gy, f, w, seed) {
  const ga = ctx.globalAlpha;
  for (let k = 0; k < 12; k++) { const a = ((f * 1.3 + k * 17 + seed) % 30) / 30, d = (k % 2 ? 1 : -1) * (3 + a * w); ctx.globalAlpha = ga * 0.6 * (1 - a); ctx.fillStyle = k % 3 ? '#c89868' : '#ecc890'; ctx.fillRect(Math.round(x + d), Math.round(gy - Math.sin(a * Math.PI) * (3 + (k % 4))), 3, 2); }
  ctx.globalAlpha = ga;
}
export const TFAR = { id: 'f', k: '#2c2030', m: '#40303a', rim: '#c89860', glass: '#484856', ghi: '#8a9aa0', wing: '#cdb890', whi: '#ecdcb4' };
export const TMID = { id: 'm', k: '#1e1622', m: '#34262e', rim: '#d8a468', glass: '#3e5560', ghi: '#9cc4cc', wing: '#e2d0a6', whi: '#fff0cc' };
export const TNEAR = { id: 'n', k: '#120c16', m: '#2a1e26', rim: '#e0aa68', glass: '#34505c', ghi: '#a8d8e0', wing: '#eedcb0', whi: '#fff6d8' };
export const TPAD = { id: 'p', k: '#17111a', m: '#30242c', rim: '#a87c54', glass: '#2c424c', ghi: '#6c8c94', wing: '#a89878', whi: '#bcae8c' };
// scenery ships are never sharp and never warm: THAZ = one working the dunes (seen through the dust), TSIL = one passing close overhead (a shape against the sky)
export const THAZ = { id: 'h', k: '#3a2c38', m: '#4a3a44', rim: '#a08060', glass: '#4a4e5a', ghi: '#76868c', wing: '#b4a486', whi: '#c8baa0' };
export const TSIL = { id: 's', k: '#0e0a12', m: '#17111a', rim: '#3a2a30', glass: '#18222a', ghi: '#2a3a42', wing: '#5a4c44', whi: '#6c5e52' };
// the ones that are after you: hot red hull, canopy lit from inside, burning wings. Always outlined in black, always carrying a red lamp.
const TBAD = { id: 'B', k: '#c62a1c', m: '#ff7a2e', rim: '#ffe08a', glass: '#ffe44a', ghi: '#fffcd8', wing: '#ffb23e', whi: '#fff4c0' };

// ---------- backdrop ----------
export function buildSky(D) {
  return sky(['#081420', '#0e2030', '#183444', '#2c4a52', '#566858', '#8e8458', '#c49650', '#dca456', '#d49a52', '#c48c4e', '#b47e4a', '#a47246', '#946842', '#845c3e', '#74523a', '#684a38'], (x) => {
    const r = rc(x), n = noise(41);
    for (let k = 0; k < 46; k++) { const sx = Math.floor(n() * 320), sy = Math.floor(n() * 48), b = n(); r(b > 0.8 ? '#e8f4ff' : b > 0.4 ? '#8aa8b8' : '#4a6878', sx, sy, 1, 1); }
    for (let k = 0; k < 7; k++) {                                     // long thin dusk clouds, gold underneath
      const cx = Math.floor(n() * 320), cy = 46 + Math.floor(n() * 36), w = 50 + Math.floor(n() * 90);
      for (let i = 0; i < w; i++) { const e = Math.min(i, w - i) / w; if (e * 6 > hash(i >> 1, k) * 1.2) { r('#4a5a5c', (cx + i) % 320, cy, 1, 1); if (e > 0.12) r('#34484e', (cx + i) % 320, cy - 1, 1, 1); if (e > 0.2) r('#e0a858', (cx + i) % 320, cy + 1, 1, 1); } }
    }
    x.drawImage(D.moonA, 150, 20); x.drawImage(D.moonB, 198, 38);
    for (let j = -15; j <= 15; j++) for (let i = -15; i <= 15; i++) {  // the sun going down into the dust: a soft disc, cut by bars of haze
      const d = Math.hypot(i, j), yy = 94 + j; if (d > 15) continue;
      if (d < 10) { if (j > 2 && (j % 4 === 0 || (j > 6 && j % 2 === 0))) continue; r(d < 6 ? '#fff4d0' : '#ffe0a0', 84 + i, yy, 1, 1); }
      else if (dith([1, 0], (d - 10) / 5, i + 16, j + 16)) r('#f4c478', 84 + i, yy, 1, 1);
    }
    // the storm wall: a front of dust a mile high, standing across the way you are running, the sun on its near face
    const topAt = (i) => 100 - Math.max(0, i - 138) * 0.38 - 7 * Math.abs(Math.sin(i / 17 + 0.4)) - 4 * Math.abs(Math.sin(i / 6.3 + 1)) - 2 * Math.abs(Math.sin(i / 2.9));
    const SW = ['#c8a070', '#aa8662', '#8e6e58', '#74584e', '#5e4646', '#4c3840'];
    for (let i = 132; i < 320; i++) {
      const t = topAt(i);
      for (let j = Math.floor(t); j < 132; j++) {
        const d = j - t, bil = Math.sin(i / 8 + Math.sin(j / 6) * 1.6) + Math.sin(j / 5 - i / 13) + Math.sin((i + j) / 3.3) * 0.5;          // rolling cells of dust
        if (d < 2.5 && hash(i, j) > 0.35 + d * 0.2) continue;                                                                          // a torn top edge
        const lit = Math.max(0, topAt(i - 3) - t) * 0.12, cur = j > 104 && (i + (j >> 2)) % 7 < 2 ? 0.1 : 0;                              // curtains of sand at the foot
        r(dith(SW, 0.12 + d / 70 + (i - 132) / 520 + bil * 0.11 - lit + cur, i, j), i, j, 1, 1);
      }
    }
  });
}
export function buildFar() {
  const c = cv(640, 120), x = c.getContext('2d'), r = rc(x);
  for (const [mx, mw, mh] of [[20, 120, 16], [190, 30, 26], [330, 150, 13], [520, 40, 30], [578, 50, 18]]) {       // a shield wall of rock and lone buttes, far out in the haze
    for (let i = 0; i < mw; i++) {
      const e = Math.min(i, mw - 1 - i), flat = 4 + e * 2.2 >= mh, h = Math.round(Math.min(mh, 4 + e * 2.2) - (flat && hash(i >> 2, mx) > 0.6 ? 2 : 0));
      r(i < mw * 0.3 ? '#8a6654' : '#765648', mx + i, 44 - h, 1, h + 12); r(flat ? '#e0aa68' : '#a87a58', mx + i, 44 - h, 1, 1);
      for (let j = 44 - h + 4; j < 44; j += 5) if (hash(i >> 1, j) > 0.4) r('#684a42', mx + i, j, 1, 1);
    }
  }
  const t1 = dunes(x, 640, 46, 10, 8, 0.3, '#946a50', '#785448', '#ecc078', 120, '#c89860');
  spiceOn(x, t1, 640, 250, 60, '#b8683a', '#e89a50');
  const t2 = dunes(x, 640, 62, 14, 6, 1.1, '#785044', '#5a3a3e', '#d49c5a', 120, '#a87850');
  spiceOn(x, t2, 640, 60, 90, '#a85a32', '#e08a44'); spiceOn(x, t2, 640, 430, 70, '#a85a32', '#e08a44');
  const t3 = dunes(x, 640, 86, 19, 5, 2.0, '#603e3c', '#422a34', '#b47e4e', 120, '#8a6048', '#6c4640');
  spiceOn(x, t3, 640, 300, 110, '#904a2e', '#d07a3c');
  return c;
}
export function buildMid() {
  const c = cv(640, 90), x = c.getContext('2d'), r = rc(x);
  const top = dunes(x, 640, 32, 22, 4, 0.7, '#4e3138', '#32202c', '#a8724a', 90, '#7a5444', '#5a3a3c');
  spiceOn(x, top, 640, 120, 120, '#7c3e2c', '#c86e34'); spiceOn(x, top, 640, 520, 80, '#7c3e2c', '#c86e34');
  let hx = 400; for (let i = 380; i < 540; i++) if (top[i] > top[hx]) hx = i;
  const by = top[hx] + 4, D0 = '#161018', D1 = '#30222c', D2 = '#4a3438';
  for (let k = 0; k < 420; k++) {                                     // the harvester's dust, a long plume laid over by the wind
    const a = hash(k, 5), b = hash(k, 6), px = hx + 30 + a * 120, py = by - 6 - a * 40 * b - b * 6;
    if (dith([1, 0], a * 0.9, k, k >> 3)) r(a < 0.3 ? '#8a5e4c' : a < 0.6 ? '#6c4842' : '#54383c', Math.round(px) % 640, Math.round(py), 2, 1);
  }
  // the harvester: a tracked factory crawling the dune, intake at the front, stacks, a tall control tower
  r(D0, hx - 34, by - 7, 68, 8); for (let i = 0; i < 68; i += 5) { r(D1, hx - 34 + i, by - 6, 3, 1); r(D1, hx - 33 + i, by - 1, 2, 1); }      // tracks
  r(D0, hx - 30, by - 19, 60, 13); r(D2, hx - 30, by - 19, 60, 1); r(D1, hx - 30, by - 18, 1, 12);                    // hull
  for (let i = -26; i < 26; i += 7) { r(D1, hx + i, by - 16, 5, 7); r(D2, hx + i, by - 16, 5, 1); }                    // hull panels
  r(D0, hx - 42, by - 13, 12, 8); r(D2, hx - 42, by - 13, 12, 1); r(D0, hx - 46, by - 9, 5, 5); r('#3a1c18', hx - 45, by - 8, 3, 3);   // intake maw
  r(D0, hx - 12, by - 30, 18, 11); r(D2, hx - 12, by - 30, 18, 1); r('#5a4250', hx - 10, by - 27, 5, 3); r('#5a4250', hx - 3, by - 27, 5, 3);   // bridge
  r(D0, hx + 12, by - 31, 4, 12); r(D2, hx + 12, by - 31, 1, 12); r(D0, hx + 19, by - 28, 4, 9); r(D2, hx + 19, by - 28, 1, 9); r(D0, hx + 26, by - 27, 3, 8);   // stacks
  r(D0, hx - 22, by - 27, 1, 8); r(D0, hx - 25, by - 28, 7, 1); r(D0, hx - 4, by - 34, 1, 4);                          // masts
  r(SPHI, hx - 44, by - 12, 1, 1); r(SPHI, hx - 8, by - 26, 2, 1); r(BLUE, hx + 13, by - 32, 1, 1);
  const t2 = dunes(x, 640, 60, 17, 3, 2.4, '#3c2630', '#261826', '#8a5c42', 90, '#5e4038', '#483034');
  for (const [ox, ow, oh] of [[70, 26, 22], [236, 14, 30], [560, 34, 18]]) {                                       // rock breaking through the sand
    for (let i = 0; i < ow; i++) { const e = Math.min(i, ow - 1 - i), h = Math.round(Math.min(oh, 3 + e * 2.6) - hash(i >> 2, ox) * 3), y0 = t2[(ox + i) % 640] + 4 - h; r(i < ow * 0.35 ? '#3a262c' : '#261822', ox + i, y0, 1, h + 6); r(i < ow * 0.5 ? '#b07a4c' : '#5a3a36', ox + i, y0, 1, 1); for (let j = y0 + 4; j < y0 + h; j += 5) if (hash(i >> 1, j) > 0.3) r('#1c1220', ox + i, j, 1, 1); }
  }
  const peaks = []; for (let i = 0; i < 640; i++) { let pk = true; for (let d = -30; d <= 30 && pk; d++) if (top[(i + d + 640) % 640] < top[i] || (d < 0 && top[(i + d + 640) % 640] === top[i])) pk = false; if (pk && top[i] < t2[i] - 3) peaks.push(i); }   // the crests of the back row: where the wind takes the sand off
  return { c, hy: by, hx, top, top2: t2, peaks };
}
export function buildNear() {
  const c = cv(512, 240), x = c.getContext('2d'), r = rc(x);
  for (const [cx, top, k0] of [[52, 108, 1], [330, 126, 2], [344, 150, 3]]) {      // wind-carved spires of rock, close and dark, the light down one edge
    for (let j = top; j < 240; j++) {
      const d = j - top, hw = Math.round(2 + Math.min(d, 9) * 0.5 + d * 0.07 + 2.2 * Math.sin(d / 6.5 + k0) + 1.2 * Math.sin(d / 2.7 + k0 * 2)), lean = Math.round(Math.sin(d / 23 + k0) * 3), x0 = cx - hw + lean, w = hw * 2;
      r('#1e131c', x0, j, w, 1); r('#2e1e26', x0 + 1, j, Math.max(1, Math.round(w * 0.35)), 1); r('#9a6844', x0, j, 1, 1); if (d < 2) r('#b88050', x0, j, w, 1);
      const band = (d + k0 * 3) % 9; if (band === 0 && w > 4) r('#120a14', x0 + 2, j, w - 3, 1); else if (band === 5 && hash(j, k0) > 0.4) r('#3a2830', x0 + 2, j, w >> 1, 1);
    }
  }
  { // the ribs of something very large, half buried
    for (let k = 0; k < 6; k++) { const bx = 176 + k * 15, h = 54 - Math.abs(k - 2.5) * 7; for (let t = 0; t <= 1; t += 0.012) { const px = bx + 20 * t * t - 4 * t, py = 204 - h * Math.sin(t * Math.PI * 0.62) * 1.25; r('#1e1620', Math.round(px), Math.round(py), 3, 2); r('#7a685c', Math.round(px), Math.round(py), 1, 1); } }
  }
  const top = dunes(x, 512, 198, 30, 2, 0.9, '#2e1c28', '#1a101c', '#8a5a40', 240, '#4a2e30', '#3a2630');
  spiceOn(x, top, 512, 96, 70, '#6a3224', '#b85e2c'); spiceOn(x, top, 512, 400, 60, '#6a3224', '#b85e2c');
  for (const px of [140, 276, 452]) { const py = top[px]; r('#120a14', px, py - 26, 1, 27); r('#6a5a50', px, py - 26, 1, 3); for (let i = 0; i < 9; i++) r(i % 4 < 2 ? '#7a3428' : '#5a2620', px - 1 - i, py - 25 + Math.round(Math.sin(i / 2) * 1.2), 1, 4 - (i > 6 ? 1 : 0)); }   // spice-field marker flags, streaming in the wind
  return c;
}
export function buildFg() {
  const c = cv(640, 240), x = c.getContext('2d'), r = rc(x), n = noise(23), K = '#0c0610';
  for (let i = 0; i < 640; i += 2) r(K, i, 233 + Math.floor(Math.sin(i / 17) * 2.5 + Math.sin(i / 5) + n() * 2), 2, 10);   // drifted sand along the bottom
  for (let k = 0; k < 7; k++) { const cx = Math.floor(30 + k * 92 + n() * 40); for (let b = -3; b <= 3; b++) { const h = 5 + Math.floor(n() * 6) - Math.abs(b); for (let j = 0; j < h; j++) r(K, cx + b * 2 + Math.round((j * j * (b < 0 ? -1 : 1) * 0.5 - j * 2.2) / 6), 232 - j, 1, 1); } }   // tufts of dune grass, leaning with the wind
  return c;
}

// ---------- the wall: 1024 px wide, world y 36..204. Mostly open air: the pipeline on slim pylons, the dune sea straight through under it.
// Now and then something to run past: a rock outcrop with a way in, buried machinery, a spice field, a wreck, a wind trap, a stilltent, the ribs of a worm, a landing pad.
const WW = 1024;
const BEACONS = [[471, 55, 0], [862, 199, 2], [880, 199, 3], [898, 199, 4], [916, 199, 5], [934, 199, 6]];
const EYES = [[23, 89], [952, 190], [540, 194]];
const POLES = [[300, 152], [668, 148], [846, 154]];
export function buildWall(D) {
  const A = arcadeCanvas(WW, 36), x = A.x, Y = A.Y, r = rc(x), HH = 168;
  // --- the outcrop: layered sandstone, wall x 988..1023 and 0..62 (it wraps round the tile edge)
  const RW = 98, U = (i) => (i + 36) % WW;
  const tops = [80, 66, 58, 52, 47, 44, 43, 44, 46, 45, 49, 55, 53, 51, 58, 68, 80];
  const topAt = (u) => { const b = Math.min(tops.length - 2, Math.floor(u / 6.2)), t = u / 6.2 - b; return Math.round(tops[b] + (tops[b + 1] - tops[b]) * (t > 0.65 ? (t - 0.65) / 0.35 : 0) + (hash(u >> 1, 3) > 0.7 ? 1 : 0)); };
  const edgeL = (wy) => 6 + 3 * Math.sin(wy / 11) + 2 * Math.sin(wy / 4.3) - Math.max(0, wy - 150) * 0.1 + (wy > 118 && wy < 150 ? 4 : 0);
  const edgeR = (wy) => RW - 7 - 3 * Math.sin(wy / 13 + 2) - 2 * Math.sin(wy / 5 + 1) + Math.max(0, wy - 150) * 0.1 - (wy > 124 && wy < 160 ? 5 : 0);
  const inRock = (i, wy) => { const u = U(i); return u < RW && u >= edgeL(wy) && u <= edgeR(wy) && wy >= topAt(u); };
  const bands = []; { const n = noise(77); while (bands.length < HH + 12) { const t = 3 + Math.floor(n() * 6), tone = Math.floor(n() * 3); for (let k = 0; k < t; k++) bands.push([tone, k === 0]); } }
  x.drawImage(pix(WW, HH, (i, j) => {
    const wy = j + 36; if (!inRock(i, wy)) return null;
    const u = U(i), wv = Math.round(1.8 * Math.sin(TAU * u * 2 / 96) + 1.2 * Math.sin(TAU * u * 5 / 96 + 1)), [tone, seam] = bands[j + wv + 4];
    if (wy === topAt(u) || u - edgeL(wy) < 1) return RIM;                    // the last light catches the top and the sunward edge
    if (wy === topAt(u) + 1 || u - edgeL(wy) < 2.2) return R2;
    if (edgeR(wy) - u < 2) return R5;
    const pal = wy > 122 ? [R4, R3, R3, R0] : [R3, R0, R0, R1];
    if (seam && hash(u >> 3, j + wv) > 0.25) return pal[0];
    const h = hash(u, j); if (h < 0.02) return pal[3]; if (h > 0.975) return pal[0];
    return pal[tone + 1 - (hash(u >> 1, (j + wv) >> 1) > 0.82 ? 1 : 0)];
  }), 0, 0);
  const X0 = WW - 36, RX = (u) => (X0 + u) % WW;                       // wall x of outcrop u
  const rr = (c, u, wy, w, h) => { for (let k = 0; k < w; k++) r(c, RX(u + k), Y(wy), 1, h); };
  // a wind-worn window right through the rock: sky and dunes beyond
  for (let j = 0; j < 26; j++) { const d = (j - 12.5) / 13, hw = Math.round(11 * Math.sqrt(Math.max(0, 1 - d * d))); if (!hw) continue; for (let k = -hw; k <= hw; k++) x.clearRect(RX(64 + k + Math.round(j / 6)), Y(66 + j), 1, 1); rr(R5, 64 - hw + Math.round(j / 6), 66 + j, Math.min(3, hw), 1); rr(RIM, 64 + hw + Math.round(j / 6) + 1, 66 + j, 1, 1); }
  // steps cut into the face, a ledge, and the way in: a sealed door with a glowglobe over it
  for (let k = 0; k < 7; k++) { rr(R4, 26 + k * 4, 100 - k * 4, 5, 4 + k); rr(R2, 26 + k * 4, 100 - k * 4, 5, 1); }
  rr(R2, 14, 102, 34, 1); rr(R1, 14, 103, 34, 1); rr(R4, 14, 104, 34, 2);
  { const u0 = 44, wy = 166, w = 15, h = 34; rr(R1, u0 - 2, wy - 3, w + 4, h + 3); rr(R2, u0 - 3, wy - 4, w + 6, 2); rr(R5, u0, wy, w, h);
    for (let k = 0; k < w; k++) for (let j = 0; j < h; j++) if ((k === 3 || k === w - 4) || j % 8 === 7) r('#241820', RX(u0 + k), Y(wy + j), 1, 1);          // door panels
    rr('#3a2a30', u0 + 6, wy + 14, 3, 5); rr(BLUE, u0 + 7, wy + 15, 1, 2); rr(R1, u0 - 4, wy + h - 2, w + 8, 2); rr(R2, u0 - 4, wy + h - 2, w + 8, 1);
    glow(x, RX(u0 + 7), Y(wy - 9), 13, '#5e3424', 0.75); glow(x, RX(u0 + 7), Y(wy - 9), 7, '#9a5a2c', 0.7); rr('#ffb04a', u0 + 6, wy - 10, 3, 3); rr('#ffe9a8', u0 + 7, wy - 10, 1, 2); }
  // a banner, faded and ragged, and pictographs scratched in the rock
  { const u0 = 24, wy = 126, w = 7, h = 34; rr('#000', u0 - 2, wy - 2, w + 4, 3); rr('#7a5a40', u0 - 2, wy - 2, w + 4, 1);
    for (let j = 0; j < h; j++) for (let k = 0; k < w; k++) { if (j > h - 5 && (k + u0) % 3 < j - (h - 5)) continue; const m = j % 12, dm = Math.abs(k - (w - 1) / 2) + Math.abs(m - 5); r(dm < 1.6 ? '#c88a4a' : m === 0 || m === 10 ? '#3a7a78' : k === w - 1 ? R4 : '#255a5c', RX(u0 + k), Y(wy + 1 + j), 1, 1); } }
  for (const [u, wy] of [[70, 108], [76, 112], [72, 132], [80, 126]]) { rr(R2, u, wy, 3, 1); rr(R2, u + 1, wy - 1, 1, 3); }
  // --- the pipeline (the gallery): catwalk on top, the pipe slung under it. A bright edge you can read
  r('#e0b884', 0, Y(110), WW, 1); r(S3, 0, Y(111), WW, 1); r(S2, 0, Y(112), WW, 1); r(S1, 0, Y(113), WW, 3); r(S0, 0, Y(116), WW, 1);
  for (let i = 0; i < WW; i += 16) { r(S0, i + 3, Y(113), 10, 2); r(S2, i, Y(113), 1, 3); }                             // the deck girder, pierced
  const PIPE = ['#9a765a', '#c09a70', '#a88260', '#7c5c48', '#563e38', '#3a2a2c', '#221820'];
  for (let k = 0; k < 7; k++) r(PIPE[k], 0, Y(117 + k), WW, 1);
  for (let i = 0; i < WW; i += 64) { r('#000', i + 9, Y(116), 6, 9); r('#d8b080', i + 10, Y(116), 4, 1); r('#b08a60', i + 10, Y(117), 4, 3); r('#5e4638', i + 10, Y(120), 4, 4); r('#e0762a', i + 11, Y(118), 2, 1); }   // flanges
  for (let i = 0; i < WW; i += 3) if (hash(i, 9) > 0.55) r(hash(i, 2) > 0.5 ? RUST : '#6a4a3c', i, Y(119 + Math.floor(hash(i, 4) * 3)), 2 + Math.floor(hash(i, 5) * 4), 1);                      // sand-blasted, rusting
  for (let i = 0; i < WW; i++) { const u = U(i); if (u < RW && u > 8 && u < RW - 9) continue; if (i % 16 === 4) { r(S1, i, Y(100), 1, 10); r(S3, i, Y(100), 1, 1); } r((i >> 1) % 2 ? S2 : S3, i, Y(100), 1, 1); if (i % 2) r(S1, i, Y(105), 1, 1); }   // handrail, out over the open spans
  // --- what carries it: a slim pylon every couple of hundred px, nothing else between you and the dunes
  const strut = (x0, y0, x1, y1, th = 2) => { seg(x, x0 - 1, Y(y0), x1 - 1, Y(y1), '#000', th + 2); seg(x, x0, Y(y0), x1, Y(y1), S1, th); seg(x, x0, Y(y0), x1, Y(y1), S3, 1); };
  const pylon = (cx) => {
    const lx = (y) => 3 + (y - 124) * 0.08;
    strut(cx - 3, 124, cx - 3 - 6.4, 203, 2); strut(cx + 2, 124, cx + 2 + 6.4, 203, 2);
    for (const a of [148, 174]) strut(cx - lx(a), a, cx + lx(a), a, 1);
    strut(cx - lx(148), 148, cx + lx(174), 174, 1);
    r('#000', cx - 7, Y(123), 14, 3); r(S2, cx - 6, Y(123), 12, 2); r(S4, cx - 6, Y(123), 12, 1);
    for (const d of [-13, 6]) { r('#000', cx + d - 1, Y(200), 9, 4); r(S2, cx + d, Y(200), 7, 4); r(S4, cx + d, Y(200), 7, 1); }
  };
  for (const cx of [164, 430, 652, 836]) pylon(cx);
  // sand drifted against whatever stands in the wind
  const drift = (x0, x1, hm, ph = 0) => { for (let i = x0; i < x1; i++) { const h = Math.round(hm * Math.sin(((i - x0) / (x1 - x0)) * Math.PI) + 1.5 * Math.sin(i / 5 + ph)); for (let j = 0; j < h + 4; j++) r(j === 0 ? '#b4865c' : dith(['#7a543e', '#5a3c34', '#3e2a2a'], j / 9, i, j), i, Y(204 - h + j), 1, 1); } };
  const rock = (cx, w, h) => { ell(x, cx, Y(204), w + 1, h + 1, '#000'); ell(x, cx, Y(204), w, h, R0); ell(x, cx + 2, Y(205), w - 2, h - 2, R3); for (let i = -w + 1; i < 0; i++) r(RIM, cx + i, Y(204) - Math.round(h * Math.sqrt(Math.max(0, 1 - (i * i) / (w * w)))), 1, 1); };
  rock(76, 9, 7); rock(89, 5, 4); rock(436, 7, 5); rock(818, 8, 6); rock(974, 10, 8);
  // --- buried machinery: the drive wheel of something big, and a spar of it, the rest gone under
  { const cx = 118, cy = 201;
    for (let j = -19; j <= 0; j++) for (let i = -19; i <= 19; i++) {
      const d = Math.hypot(i, j), tooth = Math.floor((Math.atan2(j, i) + Math.PI) / (Math.PI / 9)) % 2 === 0, Rr = tooth ? 16.5 : 14.2; let c = null;
      if (d <= Rr + 1 && d > Rr) c = '#000'; else if (d <= Rr && d > 9.5) c = d > Rr - 1.3 ? (i < 2 ? S3 : S2) : d < 10.6 ? S0 : (i + j) % 7 === 0 ? RUST : S1; else if (d <= 9.5 && d > 8.5) c = '#000';
      else if (d <= 8.5) c = d < 3 ? S2 : Math.abs(i) < 1.5 || Math.abs(i + j) < 1.6 || Math.abs(i - j) < 1.6 ? S1 : null;
      if (c) r(c, cx + i, Y(cy + j), 1, 1);
    }
    strut(138, 203, 147, 176, 2); strut(142, 190, 153, 186, 1); r('#000', 145, Y(174), 5, 3); r(S3, 146, Y(175), 3, 1);
    drift(96, 158, 4, 2);
  }
  // --- a spice field: the sand stained cinnamon where a blow came up, marked for the harvester
  drift(176, 236, 5, 1); drift(226, 296, 7, 2);
  x.globalCompositeOperation = 'source-atop';
  for (let i = 178; i < 294; i++) for (let j = 190; j < 204; j++) { const e = Math.sin(((i - 178) / 116) * Math.PI); if (hash(i >> 1, j) < e * 0.62 && (i + j * 2) % 5 < 3) r(hash(i, j) > 0.9 ? '#e0762a' : hash(i, j) > 0.5 ? '#9a4c28' : '#7c3a24', i, Y(j), 1, 1); }
  x.globalCompositeOperation = 'source-over';
  // --- the wreck: a dragonfly ship, down a long time, the sand halfway up it
  { const k = '#1a141c', m = '#3c3238', hi = '#a89684';
    for (const [x0, y0, x1, y1, th] of [[369, 196, 399, 150, 3], [377, 197, 356, 161, 2]]) { seg(x, x0 - 1, Y(y0), x1 - 1, Y(y1), '#000', th + 2); seg(x, x0, Y(y0), x1, Y(y1), m, th); seg(x, x0, Y(y0), x1, Y(y1), hi, 1); }   // two wing spars still standing
    for (let t = 0; t < 1; t += 0.04) { const wx = 369 + 30 * t, wy = 196 - 46 * t; for (let d = 1; d < 9 * (1 - t) + 2; d++) if ((Math.round(wx + d) + Math.round(wy)) % 3 && hash(Math.round(wx + d), Math.round(wy)) > 0.3) r('#6e5e58', Math.round(wx + d * 0.8), Y(Math.round(wy + d * 0.5)), 1, 1); }   // what is left of the membrane
    const tl = [[367, 193], [358, 189], [351, 183], [347, 175], [346, 167]];                                           // the tail, kinked up out of the sand
    for (let i = 0; i < 4; i++) { const [ax, ay] = tl[i], [bx, by] = tl[i + 1], th = 5 - i; seg(x, ax - 1, Y(ay) - 1, bx - 1, Y(by) - 1, '#000', th + 2); seg(x, ax, Y(ay), bx, Y(by), i % 2 ? m : k, th); seg(x, ax, Y(ay), bx, Y(by), hi, 1); r('#000', bx, Y(by), th, 1); }
    ell(x, 381, Y(193), 17, 8, '#000'); ell(x, 381, Y(193), 16, 7, k); ell(x, 377, Y(191), 10, 4, m);                    // the body, on its side
    ell(x, 396, Y(190), 8, 7, '#000'); ell(x, 396, Y(190), 7, 6, k); ell(x, 397, Y(189), 5, 4, '#2a3a44'); r('#000', 396, Y(185), 1, 9); r(BLUE, 398, Y(187), 2, 1); r('#52626c', 400, Y(188), 2, 1);   // the glazed head, gone dark
    drift(343, 414, 6, 0);
  }
  // --- a wind trap on the catwalk: a mast, a slatted collector turned to the wind, the dew line running down
  r('#000', 470, Y(70), 4, 40); r(S2, 471, Y(70), 2, 40); r(S4, 471, Y(70), 1, 40);
  r('#000', 455, Y(58) - 1, 34, 14); r(S1, 456, Y(58), 32, 12); for (let j = 59; j < 70; j += 2) { r(S3, 457, Y(j), 30, 1); } r(S0, 456, Y(69), 32, 1); r(BLUE, 485, Y(60), 1, 1);
  r('#000', 476, Y(84), 6, 9); r('#1e4a5a', 477, Y(85), 4, 7); r(BLUE, 478, Y(88), 2, 3);
  // --- a stilltent pitched in the open, someone crouched by it, a dew collector, two crates of spice
  { const cx = 560, by = 201; for (let j = 0; j < 17; j++) { const hw = Math.round(22 * Math.sqrt(1 - Math.pow(1 - j / 17, 2))); r('#000', cx - hw - 1, Y(by - 17 + j) - (j ? 0 : 1), hw * 2 + 2, 2); for (let i = -hw; i < hw; i++) r(i < -hw + 2 ? '#c09668' : (i + 40) % 11 === 0 ? '#3e2e2c' : dith(['#7a5c48', '#5c443a', '#463430'], (i + hw) / (hw * 2 + 1) + j / 60, i, j), cx + i, Y(by - 17 + j), 1, 1); }
    r('#120a10', cx + 6, Y(by - 10), 8, 10); r('#3a2218', cx + 8, Y(by - 6), 4, 6); r('#ff9a3a', cx + 9, Y(by - 3), 2, 2); seg(x, cx - 22, Y(by - 2), cx - 31, Y(by + 2), '#8a7460', 1); seg(x, cx + 22, Y(by - 2), cx + 30, Y(by + 2), '#8a7460', 1); }
  figure(x, 540, Y(201), 2);
  tank(x, Y, 596, 176, 9, 25); can(x, Y, 610, 190); can(x, Y, 622, 190);
  // --- the ribs of a worm, long dead, the sand still not done with it
  { const bone = '#6e5e56', lit = '#c4ac90', dk = '#3a2e34';
    for (let pass = 0; pass < 2; pass++) for (let k = 0; k < 6; k++) { const bx = 702 + k * 17, h = 64 - Math.abs(k - 2.2) * 9;
      for (let t = 0; t <= 1; t += 0.006) { const px = Math.round(bx + 26 * t * t - 5 * t), py = Y(Math.round(204 - h * Math.sin(t * Math.PI * 0.6) * 1.2)), th = t < 0.75 ? 3 : 2;
        if (!pass) r('#000', px - 1, py - 1, th + 2, 4); else { r(bone, px, py, th, 2); r(lit, px, py, 1, 1); r(dk, px + th - 1, py + 1, 1, 1); } } }
    for (let k = 0; k < 7; k++) { const vx = 694 + k * 17; r('#000', vx - 1, Y(197), 9, 7); r(bone, vx, Y(198), 7, 6); r(lit, vx, Y(198), 7, 1); r(dk, vx + 5, Y(199), 2, 5); }   // the spine, knuckles of it showing
    drift(688, 814, 4, 3);
  }
  // --- a landing pad set down on the sand (the ship that uses it is in wallFx: it comes and goes), one of her crew waiting
  r('#000', 854, Y(197), 90, 7); r(S1, 855, Y(198), 88, 6); r('#e0b884', 855, Y(198), 88, 1); r(S3, 855, Y(199), 88, 1);
  for (let i = 858; i < 940; i += 8) r((i >> 3) % 2 ? '#e0762a' : S0, i, Y(201), 4, 2);
  figure(x, 952, Y(203), 0); figure(x, RX(59), Y(102), 1);
  for (const [px, py] of POLES) { r('#000', px - 1, Y(py), 3, 204 - py); r('#8a7460', px, Y(py), 1, 204 - py); r('#d8c0a0', px, Y(py), 1, 2); }
  x.globalCompositeOperation = 'source-atop';                         // the foot of everything sinks into shadow
  for (let j = 196; j < 204; j++) for (let i = 0; i < WW; i++) if (dith([0, 1], (j - 196) / 8 * 0.5, i, j)) r(R5, i, Y(j), 1, 1);
  x.globalCompositeOperation = 'source-over';
  return A.c;
}
function can(x, Y, cx, wy) {                                           // a spice crate: the glow of what is inside
  const r = rc(x), cy = Y(wy); r('#000', cx - 1, cy - 1, 12, 14); r('#2e2a34', cx, cy, 10, 12); r('#5a5660', cx, cy, 10, 1); r('#423e4a', cx, cy + 1, 1, 11); r('#1c1a22', cx + 9, cy + 1, 1, 11);
  r('#c8642a', cx + 2, cy + 4, 6, 3); r('#ff9a3a', cx + 3, cy + 4, 4, 3); r('#ffd27a', cx + 3, cy + 5, 3, 1); r(BLUE, cx + 3 + (cx % 3), cy + 4, 1, 1); r(BLUE, cx + 6 - (cx % 2), cy + 6, 1, 1); r('#5a5660', cx + 2, cy + 9, 6, 1);
}
function tank(x, Y, x0, y0, w, h) {                                    // a dew collector
  const r = rc(x), t = Y(y0), cols = ['#1a2228', '#2e3c44', '#4a5c64', '#6e868e', '#4a5c64', '#2a363e', '#1a2228']; r('#000', x0 - 1, t - 2, w + 2, h + 2);
  for (let i = 0; i < w; i++) r(cols[Math.min(6, Math.floor(i / w * 7))], x0 + i, t, 1, h);
  r('#4a5c64', x0 + 1, t - 1, w - 2, 1); for (let j = 7; j < h - 2; j += 10) { r('#10161a', x0, t + j, w, 1); r('#7a9098', x0 + 2, t + j + 1, 4, 1); }
  r('#0a1418', x0 + w - 4, t + 4, 2, h - 9); r(BLUE, x0 + w - 4, t + 4 + Math.floor((h - 9) * 0.4), 2, Math.ceil((h - 9) * 0.6));
}
function figure(x, cx, fy, pose) {                                     // one of the desert people: hood, cloak, a suit that wastes nothing. feet at (cx, fy). pose 2 = crouched
  const r = rc(x), K = '#0e0a10', C0 = '#3a3034', C1 = '#54464a', C2 = '#2a2228', h = pose === 2 ? 9 : 15;
  r(K, cx - 3, fy - h - 1, 7, h + 1); r(K, cx - 4, fy - h + 4, 9, h - 5);
  r(C0, cx - 2, fy - h, 5, 4); r(C1, cx - 2, fy - h, 5, 1); r(K, cx - 1, fy - h + 2, 3, 1);                           // hood, the slit of the face
  r(C0, cx - 3, fy - h + 4, 7, h - 5); r(C1, cx - 3, fy - h + 4, 1, h - 5); r(C2, cx + 2, fy - h + 5, 2, h - 6);       // cloak
  if (pose !== 2) { r(C2, cx - 2, fy - 4, 2, 4); r(C2, cx + 1, fy - 4, 2, 4); } else r(C2, cx - 3, fy - 2, 7, 2);
  if (pose === 1) { r(K, cx + 4, fy - h - 4, 1, h + 4); r('#a89684', cx + 4, fy - h - 4, 1, 2); }                       // a watcher leans on a long hook
}

// ---------- platforms: rock shelf / harvester deck plate on cables / cracked sandstone / ornithopter pallet ----------
export function drawPlat(ctx, p, x, y, w, f, Y) {
  const k = p.kind, r = rc(ctx), shaking = k === 'crumble' && p.crumble > 0;
  if (shaking) { y += f % 4 < 2 ? 1 : 0; x += (f % 3) - 1; }
  if (p.gone) ctx.globalAlpha = Math.max(0, 1 - (p.fallT || 0) / 40);
  if (k === 'ledge') {                                                // a shelf of rock: lit top, strata, a ragged underside
    r('#000', x - 1, y - 1, w + 2, 9);
    for (let i = 0; i < w; i++) { const d = 2 + Math.round(3 * Math.abs(Math.sin((i + (w >> 1)) / 5.3)) + 2 * Math.sin(i / 2.1)); r('#000', x + i, y + 8, 1, d + 1); r('#5a3838', x + i, y + 8, 1, d); if (i % 3 === 0) r('#3a2430', x + i, y + 8 + (d >> 1), 1, d - (d >> 1)); }
    r('#f8dca0', x, y, w, 1); r('#d8a878', x, y + 1, w, 1); r('#a87058', x, y + 2, w, 3); r('#8a5644', x, y + 5, w, 2); r('#4a2c34', x, y + 7, w, 1);
    for (let i = 2; i < w - 4; i += 6) { r('#8a5644', x + i + ((i * 5) % 4), y + 3, 4, 1); r('#c89068', x + i + ((i * 3) % 5), y + 2, 2, 1); }
    r('#e0762a', x + 5, y + 1, 3, 1); r('#e0762a', x + w - 11, y + 1, 4, 1);                                            // spice in the cracks
  } else if (k === 'movev' || k === 'moveh') {
    const fl = (f >> 1) % 2, cx = x + (w >> 1);
    ctx.globalAlpha *= 0.25; r(BLUE, cx - 6, y + 7, 12, 4); r(BLUE, cx - 3, y + 11, 6, 3); ctx.globalAlpha /= 0.25;
    for (const [px, d] of [[x + 2, -1], [x + w - 8, 1]]) {            // a rotor pod at each end, wings beating
      r('#000', px - 1, y + 6, 8, 5); r('#3a464e', px, y + 6, 6, 4); r('#6a7c84', px, y + 6, 6, 1); r(fl ? '#bff0ff' : BLUE, px + 2, y + 8, 2, 1);
      for (let i = 1; i < 13; i++) { const wy = y + 8 + Math.round((fl ? 0.6 : -0.25) * i); r('#000', px + 3 + d * i, wy - 1, 1, 3); r(i > 9 ? '#8ab8c8' : '#e8fbff', px + 3 + d * i, wy, 1, 1); if (i > 3 && i < 11) r(BLUE, px + 3 + d * i, wy + (fl ? -1 : 1), 1, 1); }
    }
    r('#000', x - 1, y - 1, w + 2, 8); r('#c8dce0', x, y, w, 1); r('#6a7c84', x, y + 1, w, 2); r('#c87a3a', x, y + 3, w, 1); r('#3a464e', x, y + 4, w, 2);
    for (let i = 3; i < w - 2; i += 6) r('#3a464e', x + i, y + 1, 1, 1);
    r(BLUE, cx - 3, y + 5, 6, 1);
  } else if (k === 'crumble') {
    r('#000', x - 1, y - 1, w + 2, 9); r('#fff0c8', x, y, w, 1); r('#e0c098', x, y + 1, w, 2); r('#b89878', x, y + 3, w, 3); r('#6a5048', x, y + 6, w, 1);
    for (let i = 4; i < w - 3; i += 8) { r('#000', x + i, y + 1, 1, 2); r('#000', x + i + 1, y + 3, 1, 2); r('#000', x + i, y + 5, 1, 2); r('#000', x + i + 2, y + 3, 2, 1); r('#6a5048', x + i - 1, y + 2, 1, 1); }
    for (let i = 4; i < w - 3; i += shaking || p.gone ? 4 : 16) {     // it sheds sand; when it goes, it pours
      const a = (f * 2 + i * 5) % (shaking || p.gone ? 14 : 26);
      r('#e0c098', x + i, y + 8 + a, 1, shaking || p.gone ? 4 : 2); if (shaking || p.gone) r('#b89878', x + i + 2, y + 8 + (a + 7) % 14, 1, 3);
    }
  } else {
    const top = Y(123), a = ctx.globalAlpha;                          // a harvester deck plate slung on two cables from the pipeline
    for (const rx of [x + 3, x + w - 4]) {
      if (top < y - 2) for (let j = top; j < y; j++) r((j + rx) % 5 ? '#8a9aa0' : '#3a464e', rx, j, 1, 1);
      else for (let j = 1; j < 34; j++) { ctx.globalAlpha = a * (1 - j / 34); r((j + rx) % 5 ? '#8a9aa0' : '#3a464e', rx, y - j, 1, 1); }
      ctx.globalAlpha = a;
    }
    r('#000', x - 1, y - 1, w + 2, 9); r('#f4e4c0', x, y, w, 1); r('#b8c4c4', x, y + 1, w, 1); r('#74868a', x, y + 2, w, 3); r('#465458', x, y + 5, w, 1); r('#283238', x, y + 6, w, 1);
    for (let i = 0; i < w; i++) if (((i + 100) >> 2) % 2) r(i % 4 === 0 ? '#ffb04a' : SPICE, x + i, y + 3, 1, 2);        // hazard band
    for (let i = 4; i < w - 2; i += 7) r('#465458', x + i, y + 1, 1, 1);
    for (const rx of [x + 2, x + w - 5]) { r('#000', rx - 1, y - 3, 5, 4); r('#b8c4c4', rx, y - 2, 3, 2); r('#f4e4c0', rx, y - 2, 3, 1); r('#283238', rx + 1, y - 1, 1, 1); }   // shackles
  }
  ctx.globalAlpha = 1;
}
// drips: a split seam in the pipeline, spice sand pouring out of it
export function drawPipe(ctx, x, Y, prog, f) {
  const r = rc(ctx), y0 = Y(117), py = Y(122);
  r('#000', x - 6, y0 - 1, 13, 8); r('#b08a60', x - 5, y0, 11, 1); r('#7c5c48', x - 5, y0 + 1, 11, 3); r('#3a2a2c', x - 5, y0 + 4, 11, 2);     // a patch plate, sprung
  [[-1, 3], [-2, 5], [-2, 5], [-3, 7], [-3, 6], [-2, 5]].forEach(([a, w], k) => { r('#0a0608', x + a, y0 + 1 + k, w, 1); if (k > 1) r(SPICE, x + a + 1, y0 + 1 + k, w - 2, 1); });
  r('#d8b080', x - 5, y0, 2, 1); r('#d8b080', x + 4, y0, 2, 1); r('#ffb04a', x - 1, y0 + 4, 2, 1); r('#000', x - 4, y0 + 7, 2, 2); r('#7c5c48', x + 2, y0 + 7, 3, 1);
  for (let k = 0; k < 4; k++) { const a = ((f + k * 9) % 36) / 36; ctx.globalAlpha = 1 - a; r(k % 2 ? '#e8c088' : SPHI, x - 2 + ((k * 3) % 5), py + 2 + Math.round(a * a * 22), 1, 1); } ctx.globalAlpha = 1;
  const q = Math.floor(prog * 3); if (q > 0) { r('#000', x - Math.floor(q / 2) - 1, py + 2, q + 2, q + 3); r('#f4d49a', x - Math.floor(q / 2), py + 3, q, q + 1); r('#fff8e0', x, py + 3, 1, 1); }
}

// ---------- live scenery ----------
export function wallFx(ctx, base, Y, f) {
  const on = (lx, m = 30) => { const sx = base + lx; return sx > -m && sx < 320 + m; };
  for (const [lx, ly, k] of BEACONS) {                                // beacons: the wind trap mast, the pad lights running in turn
    if (!on(lx)) continue; const sx = base + lx, lit = k < 2 ? (f >> 4) % 4 === k : (f >> 3) % 7 === k;
    ctx.fillStyle = k < 2 ? (lit ? '#ff4a3a' : '#5a1a1a') : lit ? '#bff0ff' : '#2a5a6a'; ctx.fillRect(sx, Y(ly), 2, 2);
    if (lit) { ctx.globalAlpha = 0.22; ctx.fillRect(sx - 2, Y(ly) - 2, 6, 6); ctx.globalAlpha = 1; }
  }
  EYES.forEach(([lx, ly], k) => { const xx = base + lx; if (xx < -4 || xx > 324 || ((f >> 5) + k) % 7 === 0) return; ctx.fillStyle = BLUE; ctx.fillRect(xx - 1, Y(ly), 1, 1); ctx.fillRect(xx + 1, Y(ly), 1, 1); });   // blue-within-blue eyes, and a blink
  if (on(478) && (f >> 4) % 3 === 0) { ctx.fillStyle = '#e8fbff'; ctx.fillRect(base + 478, Y(88 + ((f >> 2) % 3)), 1, 1); }
  if (on(236, 90)) for (let k = 0; k < 9; k++) { if (((f >> 3) + k * 3) % 7) continue; ctx.fillStyle = k % 3 ? '#ffb04a' : '#bff0ff'; ctx.fillRect(base + 182 + ((k * 37) % 108), Y(194 + ((k * 5) % 9)), 1, 1); }   // spice glitter
  for (const [px, py] of POLES) {                                     // field markers: a pennant cracking in the wind
    if (!on(px)) continue; const sx = base + px;
    for (let i = 0; i < 11; i++) { const wy = Y(py + 1) + Math.round(Math.sin(i / 1.7 - f / 3) * (i / 5)); ctx.fillStyle = '#000'; ctx.fillRect(sx - 1 - i, wy - 1, 1, 6 - (i > 7 ? i - 7 : 0)); ctx.fillStyle = i % 5 < 2 ? '#e08a44' : '#b84a30'; ctx.fillRect(sx - 1 - i, wy, 1, 4 - (i > 7 ? i - 7 : 0)); }
  }
  for (const [lx, ly] of [[346, 196], [410, 198], [22, 44], [992, 60], [176, 198], [690, 198], [100, 199]]) {   // sand lifting off the drifts and the top of the rock
    if (!on(lx)) continue; ctx.fillStyle = '#d8a878';
    for (let k = 0; k < 5; k++) { const a = ((f * 1.5 + k * 13 + lx) % 40) / 40; ctx.globalAlpha = 0.7 * (1 - a); ctx.fillRect(Math.round(base + lx - a * 26), Y(ly) - Math.round(a * 5 + Math.sin(k) * 2), 2, 1); }
    ctx.globalAlpha = 1;
  }
  if (on(898, 240)) {                                                 // the pad's ship: parked, wings folded back, in the shade
    const sx = base + 898, py = Y(198) - 12, S = 1.6;
    thopter(ctx, sx, py, S, 1, 0, TPAD, 2);                           // (she used to take off and land here, full size, at the height you run at: it read as something coming for you)
  }
}
export function makeBackFx(mid) {
  const M = (i) => ((Math.round(i) % 640) + 640) % 640;
  return function backFx(ctx, f, fdist, cam) {
    const sy = Math.round(-cam * 0.25), fy = Math.round(64 - cam * 0.35), my0 = Math.round(119 - cam * 0.55), off = (((fdist * 0.22) % 640) + 640) % 640;
    const crest = (sx) => my0 + mid.top[M(sx + off)], sand = (sx) => { const i = M(sx + off); return my0 + Math.min(mid.top[i], mid.top2[i]); };   // the dune line at a screen x: the back row, and whichever row is in front
    // lightning inside the storm wall
    { const t = f % 230, k = (f / 230) | 0; if (t < 9 && t !== 3 && t !== 4) { const bx = 214 + Math.floor(hash(k, 1) * 90), byy = sy + 74 + Math.floor(hash(k, 2) * 14);
        ctx.globalAlpha = 0.16; ell(ctx, bx, byy + 5, 26, 17, '#ffe8c0'); ell(ctx, bx, byy + 5, 15, 10, '#ffe8c0'); ell(ctx, bx, byy + 5, 7, 6, '#fff4d8'); ctx.globalAlpha = 1; ctx.fillStyle = '#fff8e8';
        let px = bx, py = byy - 8; for (let q = 0; q < 9; q++) { const nx = px + Math.round((hash(k, q + 5) - 0.5) * 7); ctx.fillRect(Math.min(px, nx), py, Math.abs(nx - px) + 1, 1); ctx.fillRect(nx, py, 1, 3); px = nx; py += 3; } } }
    // heat haze on the horizon
    for (let k = 0; k < 9; k++) { const hy = fy + 30 + k * 2 + (k % 2), hx = ((k * 83 + Math.floor(f / (5 + (k % 3)))) % 400) - 40, w = 26 + ((k * 37) % 40); ctx.globalAlpha = 0.14; ctx.fillStyle = k % 3 ? '#f0c880' : '#ffe8b8'; ctx.fillRect(hx, hy, w, 1); } ctx.globalAlpha = 1;
    // far off, wormsign: a ridge of sand on the move, its dust, the static crackling over it
    { const wy = fy + 62, wx = Math.round(390 - ((f * 0.12 + fdist * 0.06) % 560));
      for (let k = 0; k < 22; k++) { const a = k / 22; ctx.globalAlpha = 0.7 * (1 - a); ctx.fillStyle = k % 2 ? '#d8a868' : '#a87850'; ctx.fillRect(wx + 8 + k * 5 + (((f >> 3) + k) % 3), wy - 4 - Math.round(a * 15 + Math.sin(k + f / 30) * 2), 4, 2); }
      ctx.globalAlpha = 1;
      for (let i = -15; i <= 15; i++) { const h = Math.round(7 * Math.cos((i / 15) * Math.PI / 2)); if (h < 1) continue; ctx.fillStyle = i < -2 ? '#7a5044' : '#4a2e36'; ctx.fillRect(wx + i, wy - h, 1, h + 1); ctx.fillStyle = i < 3 ? '#f4cc88' : '#a87850'; ctx.fillRect(wx + i, wy - h, 1, 1); }
      ctx.fillStyle = '#ecc078'; for (let k = 0; k < 9; k++) { ctx.globalAlpha = 1 - k / 9; ctx.fillRect(wx + 16 + k * 8, wy - 1 + (k % 2), 5, 1); ctx.fillRect(wx + 18 + k * 9, wy + 2 + (k >> 1), 4, 1); } ctx.globalAlpha = 1;
      const z = (f >> 2) % 9; if (z < 4) { ctx.fillStyle = z === 1 ? '#ffffff' : '#bff0ff'; let px = wx - 6 + ((f >> 4) % 4) * 5, py = wy - 22; for (let q = 0; q < 5; q++) { const nx = px + ((q + (f >> 4)) % 2 ? 2 : -2); ctx.fillRect(Math.min(px, nx), py, 3, 1); ctx.fillRect(nx, py, 1, 3); px = nx; py += 3; } } }
    // a flight of three, a long way out
    { const bx = 360 - ((f * 0.22) % 620), byy = sy + 86 + Math.sin(f / 60) * 2;
      for (const [dx, dy, k] of [[0, 0, 0], [17, -6, 1], [20, 7, 2]]) thopter(ctx, bx + dx, byy + dy, 0.36, -1, (((f >> 1) + k) % 4) / 4, TFAR); }
    // the harvester working: lamps, the stack flare, and its carryall standing off above it
    { for (const ox of [mid.hx - off, mid.hx + 640 - off]) { const hx = Math.round(ox), my = my0 + mid.hy; if (hx < -70 || hx > 390) continue;
        if ((f >> 4) % 2) { ctx.fillStyle = BLUE; ctx.fillRect(hx + 13, my - 32, 1, 1); } ctx.fillStyle = (f >> 3) % 4 ? SPHI : '#fff0c8'; ctx.fillRect(hx - 44, my - 12, 1, 1); ctx.fillRect(hx - 8, my - 26, 2, 1);
        ctx.fillStyle = '#ff9a3a'; ctx.globalAlpha = 0.5 + 0.4 * Math.sin(f / 5); ctx.fillRect(hx + 19, my - 30 - ((f >> 2) % 3), 3, 2); ctx.globalAlpha = 1;
        const cy = my - 47 + Math.round(Math.sin(f / 33) * 1.5), fl = (f >> 1) % 2;                                    // carryall: a wide lifting body, four wing pods beating
        ctx.fillStyle = '#18101a'; ctx.fillRect(hx - 30, cy, 60, 6); ctx.fillRect(hx - 24, cy - 3, 48, 3); ctx.fillRect(hx - 20, cy + 6, 40, 2); ctx.fillStyle = '#b07a50'; ctx.fillRect(hx - 24, cy - 3, 48, 1); ctx.fillRect(hx - 30, cy, 6, 1); ctx.fillStyle = '#4a3a44'; ctx.fillRect(hx - 26, cy + 2, 8, 2);
        for (const px of [-27, -9, 9, 27]) { ctx.fillStyle = '#18101a'; ctx.fillRect(hx + px - 2, cy - 5, 4, 3); ctx.globalAlpha = 0.75; ctx.fillStyle = '#d8c49c'; for (let i = 1; i < 11; i++) { const wy = cy - 5 + Math.round((fl ? -0.55 : 0.3) * i); ctx.fillRect(hx + px - i, wy, 1, 1); ctx.fillRect(hx + px + i, wy, 1, 1); } ctx.globalAlpha = 1; }
        ctx.fillStyle = '#3a2a36'; for (const px of [-18, 18]) for (let j = 8; j < 17; j += 2) ctx.fillRect(hx + px, cy + j, 1, 1);    // the lifting cables, waiting
        ctx.fillStyle = (f >> 3) % 5 ? '#5a1a1a' : '#ff4a3a'; ctx.fillRect(hx - 31, cy + 1, 1, 1); ctx.fillRect(hx + 30, cy + 1, 1, 1);
      } }
    // spice glittering where it lies on the dunes, and the wind taking the crests off them
    for (let k = 0; k < 12; k++) { if (((f >> 3) + k * 5) % 6) continue; const mx = (k < 8 ? 122 + ((k * 37) % 116) : 522 + ((k * 29) % 76)), sx = Math.round(((mx - off) % 640 + 640) % 640); if (sx > 320) continue; ctx.fillStyle = k % 3 ? '#ffb04a' : '#fff0c8'; ctx.fillRect(sx, my0 + mid.top[mx] + 2 + ((k * 7) % 6), 1, 1); }
    for (const mx of mid.peaks) { const sx = Math.round(((mx - off) % 640 + 640) % 640) - (mx - off > 320 ? 640 : 0), yy = my0 + mid.top[mx]; if (sx < -10 || sx > 360) continue;
      for (let k = 0; k < 7; k++) { const a = ((f * 1.2 + k * 11 + mx) % 44) / 44; ctx.globalAlpha = 0.6 * (1 - a); ctx.fillStyle = k % 2 ? '#f0cc94' : '#c89868'; ctx.fillRect(Math.round(sx - a * 34), yy - 1 - Math.round(a * 4 + Math.sin(k * 2) * 1.5), 3, 1); } }
    ctx.globalAlpha = 1;
    // wormsign close by: a ridge running along the dunes the same way you are, the sand pouring off it, static snapping over it
    { const wx = Math.round(-70 + ((f * 0.55 + 150) % 900));
      if (wx > -50 && wx < 400) {
        for (let k = 0; k < 16; k++) { const xx = wx - 12 - k * 6, a = k / 16, yy = crest(xx); if (mid.top2[M(xx + off)] + my0 < yy) continue; ctx.globalAlpha = 0.85 * (1 - a); ctx.fillStyle = '#f0c480'; ctx.fillRect(xx, yy - 1 + (k % 2), 5, 1); ctx.fillStyle = '#1c1220'; ctx.fillRect(xx, yy + 1 + (k % 2), 4, 1); }   // the furrow it leaves
        for (let k = 0; k < 14; k++) { const a = ((f + k * 5) % 28) / 28; ctx.globalAlpha = 0.75 * (1 - a); ctx.fillStyle = k % 2 ? '#e8c088' : '#b88860'; ctx.fillRect(Math.round(wx - 4 - a * 40), crest(wx) - 4 - Math.round(Math.sin(a * Math.PI) * (7 + (k % 4) * 2)), 3, 2); }   // dust
        ctx.globalAlpha = 1;
        for (let i = -16; i <= 16; i++) { const xx = wx + i, h = Math.round(8 * Math.pow(Math.cos((i / 16) * Math.PI / 2), 0.8)), yy = crest(xx); if (h < 1 || mid.top2[M(xx + off)] + my0 < yy - h) continue; ctx.fillStyle = i > 3 ? '#8a5c48' : '#4a2e36'; ctx.fillRect(xx, yy - h, 1, h + 1); ctx.fillStyle = i > -4 ? '#ffd898' : '#b08058'; ctx.fillRect(xx, yy - h, 1, 1); if (i % 5 === 0 && h > 3) { ctx.fillStyle = '#2a1a22'; ctx.fillRect(xx, yy - h + 1, 1, h - 1); } }   // the mound, ringed: you can see what is under it
        const z = (f >> 2) % 7; if (z < 3) { ctx.fillStyle = z === 1 ? '#ffffff' : '#bff0ff'; let px = wx - 10 + ((f >> 4) % 5) * 5, py = crest(wx) - 26; for (let q = 0; q < 6; q++) { const nx = px + ((q + (f >> 4)) % 2 ? 3 : -2); ctx.fillRect(Math.min(px, nx), py, Math.abs(nx - px) + 1, 1); ctx.fillRect(nx, py, 1, 3); px = nx; py += 3; } }
      } }
    // ---- the dragonfly ships. High up: one crossing the sky
    { const bx = -50 + ((f * 0.6 + fdist * 0.12) % 620), byy = Math.round(50 - cam * 0.4 + Math.sin(f / 41) * 5); thopter(ctx, bx, byy, 0.55, 1, (f % 4) / 4, TFAR); }
    // one hanging over the dunes with its lamp on the sand
    { const bx = Math.round(520 - (((fdist * 0.36) % 900) + 900) % 900 + Math.sin(f / 70) * 14), byy = Math.round(124 - cam * 0.7 + Math.sin(f / 23) * 3);
      if (bx > -60 && bx < 380) { ctx.fillStyle = '#d8e4e0'; for (let j = 3; j < 40; j += 1) { ctx.globalAlpha = 0.08 * (1 - j / 44); ctx.fillRect(bx - 10 - Math.round(j * 0.55), byy + j, Math.round(4 + j * 0.5), 1); } ctx.globalAlpha = 1;
        thopter(ctx, bx, byy, 0.6, -1, (f % 4) / 4, THAZ, 0, (f >> 4) % 2 ? '#9cc4cc' : null); } }
    // where you are looking: two working the dunes at your own height, low enough to lift the sand
    const low = (bx, byy, s, dir, C, seed, lamp) => { const gy = sand(bx); if (gy - byy < 34 * s && gy > byy) { ctx.globalAlpha = Math.min(1, (34 * s - (gy - byy)) / (16 * s)); dustKick(ctx, bx - dir * 6 * s, gy, f, 20 * s, seed); ctx.globalAlpha = 1; } thopter(ctx, bx, byy, s, dir, ((f + seed) % 4) / 4, C, 0, lamp); };
    { const bx = -50 + ((f * 0.75 + 130) % 500), byy = Math.round(159 - cam * 0.85 + Math.sin(f / 37) * 6); low(bx, byy, 0.55, 1, THAZ, 1, null); }
    { const bx = 380 - ((f * 1.05 + fdist * 0.15 + 260) % 640), byy = Math.round(172 - cam * 0.87 + Math.sin(f / 29) * 5); low(bx, byy, 0.6, -1, THAZ, 2, null); }
    // (one used to come up alongside and hold station on you, big and sharp, right where the real threats fly: gone)
    // now and then one comes right over, close and loud: only a black shape against the sky, above where anything can touch you
    { const t = (f + 300) % 700; if (t < 210) { const bx = Math.round(420 - t * 2.4), byy = Math.round(34 - cam * 0.5 + Math.sin(t / 30) * 6); thopter(ctx, bx, byy, 1.8, -1, (f % 4) / 4, TSIL); } }
    // the ones that will come for you, while they are still only ships in the distance (drawFlyer hands them over: see below)
    DUNE = sand; FARDREW = new Set();
    for (const q of FARQ) { if (Math.abs(f - q.f) > 2) continue; FARDREW.add(q.id); drawFar(ctx, q, f); }
    FARQ = [];
  };
}
export function frontFx(ctx, f, fdist) {                               // the wind: sand streaming across close to the lens
  for (let k = 0; k < 9; k++) {
    const sp = 3.2 + hash(k, 1) * 2.6, x = 350 - ((f * sp + fdist * 0.5 + k * 131) % 420), y = 30 + hash(k, 2) * 140 + Math.sin(f / 19 + k) * 5, len = 8 + Math.floor(hash(k, 3) * 14);
    ctx.globalAlpha = 0.16 + 0.1 * Math.sin(f / 11 + k * 2); ctx.fillStyle = k % 4 === 0 ? '#fff0d0' : '#e8c088'; ctx.fillRect(Math.round(x), Math.round(y), len, 1);
  }
  ctx.globalAlpha = 1;
}

// ---------- the level's own dangers ----------
// the imperial trooper: bone-white plate over black, a slit visor, a long beam gun. Stands guard; drops to one knee to fire along the sand
function trooper(pose) {
  const W = '#ece6d6', H = '#ffffff', w = '#a8a294', d = '#262630', v = '#0c0c14', red = '#c8322a', g = '#4a505c', G = '#aab4c2', bt = '#3a3a46';
  const c = outlined(34, 32, (x) => {
    const r = rc(x), o = 9;                                           // o = how far the figure sits from the left edge (room for the gun)
    if (pose === 'idle') {
      r(w, o + 13, 9, 3, 4); r(w, o + 14, 12, 2, 5);                   // far arm
      r(W, o + 5, 1, 8, 7); r(H, o + 6, 1, 6, 1); r(w, o + 12, 2, 1, 6); r(w, o + 5, 7, 7, 1); r(v, o + 5, 4, 5, 2); r(red, o + 6, 4, 1, 1); r(w, o + 8, 0, 3, 1);   // helmet, visor, crest
      r(d, o + 7, 8, 4, 1);
      r(W, o + 4, 9, 10, 8); r(w, o + 13, 9, 1, 8); r(w, o + 5, 12, 8, 1); r(d, o + 5, 15, 8, 2); r(red, o + 4, 14, 10, 1); r(H, o + 5, 9, 4, 1);          // chest plate, sash
      r(W, o + 5, 17, 8, 2); r(W, o + 5, 19, 3, 9); r(w, o + 10, 19, 3, 9); r(d, o + 5, 22, 3, 1); r(d, o + 10, 22, 3, 1); r(H, o + 5, 23, 3, 2); r(bt, o + 4, 28, 4, 3); r(bt, o + 10, 28, 4, 3); r(G, o + 4, 28, 4, 1);   // legs, boots
      seg(x, o + 0, 20, o + 9, 12, g, 2); seg(x, o + 0, 20, o + 8, 12, G, 1); r(g, o + 8, 10, 4, 3);                    // the gun at the port
      r(W, o + 2, 9, 4, 3); r(H, o + 2, 9, 4, 1); r(W, o + 2, 12, 2, 4); r(d, o + 3, 16, 3, 2);                           // pauldron, near arm, glove
    } else {
      r(w, o + 14, 26, 9, 3); r(bt, o + 22, 24, 3, 5);                 // rear leg, down on its knee
      r(W, o + 6, 10, 8, 7); r(H, o + 7, 10, 6, 1); r(w, o + 13, 11, 1, 6); r(w, o + 6, 16, 7, 1); r(v, o + 6, 13, 5, 2); r(red, o + 7, 13, 1, 1); r(w, o + 9, 9, 3, 1);
      r(d, o + 8, 17, 4, 1);
      r(W, o + 6, 18, 10, 7); r(w, o + 15, 18, 1, 7); r(red, o + 6, 23, 10, 1); r(d, o + 7, 24, 9, 2); r(H, o + 7, 18, 4, 1);
      r(W, o + 4, 23, 7, 3); r(H, o + 4, 23, 6, 1); r(W, o + 4, 25, 3, 4); r(d, o + 4, 26, 3, 1); r(bt, o + 3, 28, 5, 3); r(G, o + 3, 28, 5, 1);       // front leg: knee up
      r(w, o + 13, 22, 4, 5);
      const k = pose === 'fire' ? 1 : 0;
      r(g, o - 6 + k, 19, 15, 3); r(G, o - 6 + k, 19, 15, 1); r(g, o + 9 + k, 18, 5, 4); r(G, o + 1 + k, 18, 2, 1); r(red, o - 2 + k, 20, 2, 1);     // the gun, levelled low
      r(W, o + 4, 18, 4, 3); r(H, o + 4, 18, 4, 1); r(W, o + 2, 20, 4, 2); r(d, o + 1, 21, 3, 2);
      if (pose === 'fire') { r('#fff8d0', 0, 19, 4, 3); r('#ffffff', 1, 20, 3, 1); r('#ff9a3a', 2, 17, 1, 2); r('#ff9a3a', 2, 22, 1, 2); }
    }
  });
  return { c, ox: 9 + 9, oy: 31 };
}
// the hunter-seeker: a sliver of metal on a suspensor, a single red eye. it drifts, finds you, and comes
function needle(k) {
  const c = outlined(22, 12, (x) => {
    const r = rc(x);
    r('#dfe6ee', 4, 5, 13, 2); r('#ffffff', 4, 5, 11, 1); r('#8a94a4', 6, 6, 11, 1); r('#dfe6ee', 2, 5, 2, 1); r('#aab4c2', 1, 5, 1, 1);     // the needle, nose left
    r('#5a6474', 16, 3, 3, 6); r('#8a94a4', 16, 3, 3, 1); r('#5a6474', 19, 4, 1, 4);                                 // tail vanes
    r(k === 2 ? '#ffffff' : '#ff3a2a', 5, 5, 2, 2); if (k === 2) { r('#ff3a2a', 4, 4, 4, 1); r('#ff3a2a', 4, 7, 4, 1); r('#ff9a8a', 3, 5, 1, 2); }
    r(k === 1 ? '#bff0ff' : BLUE, 9, 8, 5, 1); if (k !== 1) r('#bff0ff', 11, 9, 2, 1);                                 // the suspensor's glow
  });
  return { c, ox: 11, oy: 6 };
}
let NEEDLES = null; const needles = () => NEEDLES || (NEEDLES = [needle(0), needle(1), needle(2)]);
export function dangerChr() { return { gunner: { idle: trooper('idle'), aim: trooper('aim'), fire: trooper('fire') }, seeker: needles() }; }

// ---------- which ships are baddies (skin.drawFlyer) ----------
// A ship that is going to attack starts as one more ship in the distance: small, hazy, no outline, off its true line (high over the dunes, or coming up
// from behind one). Between screen x 230 and 150 it comes forward: grows, sharpens, swings onto its true line, gets its black outline, its hot colours
// and a flashing red lamp, and a lock-on mark. From x <= 150 it is drawn at exactly its true place and size. Scenery ships never get any of that.
// All of this is drawing only: nothing here is read by the sim. FARQ / FARDREW / DUNE are passed between drawFlyer and backFx, a frame apart, so the
// distant phase can be drawn behind the pipeline with the rest of the scenery.
const FAR_X = 230, NEAR_X = 150, SK_FAR = 260, SK_NEAR = 172;
let FARQ = [], FARDREW = new Set(), DUNE = () => 112;
export const flyAt = new Map();                                       // id -> [x, y] where each was last drawn (for the test sheets only; nothing reads it in play)
const mark = (id, x, y) => { if (flyAt.size > 40) flyAt.clear(); flyAt.set(id, [Math.round(x), Math.round(y)]); };
const hx3 = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const mixHex = (a, b, k) => { const A = hx3(a), B = hx3(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); };
const BADP = new Map();
const badPal = (k, n) => { if (k <= 0) return THAZ; if (k >= n) return TBAD; const id = 'B' + k + '_' + n; let p = BADP.get(id); if (!p) { p = { id }; for (const q of ['k', 'm', 'rim', 'glass', 'ghi', 'wing', 'whi']) p[q] = mixHex(THAZ[q], TBAD[q], k / n); BADP.set(id, p); } return p; };
const EDGE = new Map(), WHITE = new Map();
function edgeOf(sp) {                                                  // a black line round the solid part of a sprite (not round the blur of the wings)
  let e = EDGE.get(sp); if (e) return e;
  const w = sp.c.width, h = sp.c.height, d = sp.c.getContext('2d').getImageData(0, 0, w, h).data, c = cv(w + 2, h + 2), x = c.getContext('2d'); x.fillStyle = '#000';
  const solid = (i, j) => i >= 0 && j >= 0 && i < w && j < h && d[(j * w + i) * 4 + 3] > 150;
  for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) if (!solid(i, j) && (solid(i + 1, j) || solid(i - 1, j) || solid(i, j + 1) || solid(i, j - 1))) x.fillRect(i + 1, j + 1, 1, 1);
  EDGE.set(sp, c); return c;
}
function whiteOf(sp) { let e = WHITE.get(sp); if (e) return e; const c = cv(sp.c.width, sp.c.height), x = c.getContext('2d'); x.drawImage(sp.c, 0, 0); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.85; x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); EDGE.get(sp) || edgeOf(sp); WHITE.set(sp, c); return c; }
const stageS = (S0, S1, k, n) => Math.round((S0 + ((S1 - S0) * k) / n) * 100) / 100;
const sizes = (kind) => (kind === 'bat' ? [0.4, 0.8, 8, 0] : [0.5, 1.3, 8, 2]);     // far scale, true scale, steps between, y offset of the hull in the hit box
const clamp01 = (v) => Math.max(0, Math.min(1, v));
// where it flies while it is still scenery: odd ones high, in the sky over the pipeline (its rail is at world y 95); even ones coming up from behind a dune
const farY = (id, x, y, cam) => (id % 2 ? Math.min(y - 24, 82 - cam - ((id >> 1) % 3) * 6) : DUNE(x) + 7 - 19 * clamp01((350 - x) / 120));
function drawShip(ctx, x, y, s, pal, f, id, oa, lamp) {                 // hull centred on (x, y), nose left
  const sp = thopSprite(s, -1, ((f >> 1) + id) & 3, pal, 0), cx = Math.round(x + 5 * s), cy = Math.round(y), ga = ctx.globalAlpha; mark(id, x, y);
  if (oa > 0) { ctx.globalAlpha = ga * oa; ctx.drawImage(edgeOf(sp), cx - sp.ox - 1, cy - sp.oy - 1); ctx.globalAlpha = ga; }
  ctx.drawImage(sp.c, cx - sp.ox, cy - sp.oy);
  if (lamp > 0) {                                                      // the canopy lit from inside, and the lamp on the nose: red, white, red
    const hxp = Math.round(cx - 10.5 * s), on = (f >> 2) % 2, t = Math.max(2, Math.round(s * 2.2)), lx = Math.round(cx - 15.5 * s) - t, ly = Math.round(cy + 0.6 * s);
    ctx.globalAlpha = ga * lamp * 0.22; ell(ctx, hxp, cy, 6 * s + 2, 4.5 * s + 2, '#ffd84a');
    ctx.globalAlpha = ga * lamp * (on ? 0.4 : 0.2); ell(ctx, lx + t / 2, ly + t / 2, t + 3, t + 2, '#ff3a2a');
    ctx.globalAlpha = ga * lamp; ctx.fillStyle = '#000'; ctx.fillRect(lx - 1, ly - 1, t + 2, t + 2); ctx.fillStyle = on ? '#ff2a1a' : '#fff0c0'; ctx.fillRect(lx, ly, t, t);
    ctx.globalAlpha = ga;
  }
}
function lockMark(ctx, x, y, f, w) {                                   // locked on: two red arrowheads off its nose, pointing at you
  for (let k = 0; k < 2; k++) { const ax = Math.round(x - w - 5 - k * 5 - ((f >> 1) % 3));
    for (const [col, o] of [['#000', 1], [(f >> 1) % 2 ? '#ff2a1a' : '#ffe08a', 0]]) { ctx.fillStyle = col; for (let j = -3; j <= 3; j++) { const a = Math.abs(j); if (o) ctx.fillRect(ax + a - 1, y + j - 1, 4, 3); else ctx.fillRect(ax + a, y + j, 2, 1); } } }
}
function drawFar(ctx, q, f) {                                          // called from backFx: behind the pipeline, with the other ships
  if (q.seeker) { const g = seekFar(); mark(q.id, q.x, q.y); ctx.drawImage(g, Math.round(q.x - 5.5), Math.round(q.y - 3), 11, 6); return; }
  const [S0] = sizes(q.kind), low = !(q.id % 2), yy = farY(q.id, q.x, q.y, q.cam);
  if (low) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 320, DUNE(q.x) + 1); ctx.clip(); }
  drawShip(ctx, q.x, yy, S0, THAZ, f, q.id, 0, 0);
  if (low) ctx.restore();
}
let SEEKFAR = null;
function seekFar() {                                                   // a hunter-seeker a long way off: a grey sliver
  if (SEEKFAR) return SEEKFAR; const src = needles()[0].c, c = cv(src.width, src.height), x = c.getContext('2d');
  x.drawImage(src, 0, 0); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.7; x.fillStyle = '#5a4c58'; x.fillRect(0, 0, c.width, c.height);
  return (SEEKFAR = c);
}
export function drawFlyer(ctx, fl, x, y, f, s) {
  if (fl.kind === 'seeker') {                                          // the dart: the same idea, quicker (it has to be true before it locks on at x 148)
    if (fl.dead || x <= SK_NEAR) { mark(fl.id, x, y); return false; }
    const yf = y - (fl.id % 2 ? 30 : 18);
    if (x >= SK_FAR) { FARQ.push({ seeker: 1, id: fl.id, x, y: yf, f }); return true; }
    if (FARDREW.has(fl.id)) return true;
    const p = (SK_FAR - x) / (SK_FAR - SK_NEAR), e = p * p * (3 - 2 * p), sc = 0.5 + 0.5 * p, yy = yf + (y - yf) * e, G = needles(), g = G[(f >> 3) % 2].c, w = Math.round(22 * sc), h = Math.round(12 * sc), ga = ctx.globalAlpha;
    mark(fl.id, x, yy); ctx.globalAlpha = ga * Math.min(1, (fl.t + 1) / 8); ctx.drawImage(seekFar(), Math.round(x - w / 2), Math.round(yy - h / 2), w, h);
    ctx.globalAlpha = ga * Math.min(1, (fl.t + 1) / 8) * clamp01((p - 0.2) / 0.5); ctx.drawImage(g, Math.round(x - w / 2), Math.round(yy - h / 2), w, h); ctx.globalAlpha = ga;
    return true;
  }
  const [S0, S1, N, dy] = sizes(fl.kind), yt = y + dy, cam = Math.round(fl.y / 256) - y;
  if (fl.dead) {                                                       // stomped: a white flash, then it drops away
    if (fl.t > 30) return true;
    const sp = thopSprite(S1, -1, 0, TBAD, 0), cx = Math.round(x + 5 * S1), cy = Math.round(yt), ga = ctx.globalAlpha;
    if (fl.t < 7) { ctx.drawImage(edgeOf(sp), cx - sp.ox - 1, cy - sp.oy - 1); ctx.drawImage(whiteOf(sp), cx - sp.ox, cy - sp.oy); }
    else { ctx.globalAlpha = ga * (1 - (fl.t - 7) / 24); ctx.drawImage(edgeOf(sp), cx - sp.ox - 1, cy - sp.oy - 1); ctx.drawImage(sp.c, cx - sp.ox, cy - sp.oy); ctx.globalAlpha = ga; }
    return true;
  }
  if (x <= NEAR_X) { drawShip(ctx, x, yt, S1, TBAD, f, fl.id, 1, 1); return true; }   // the real thing: true place, true size
  if (x >= FAR_X) { FARQ.push({ kind: fl.kind, id: fl.id, x, y: yt, f, cam }); return true; }
  if (FARDREW.has(fl.id)) return true;                                 // the frame it changes hands: backFx has just drawn it
  const p = (FAR_X - x) / (FAR_X - NEAR_X), e = p * p * (3 - 2 * p), k = Math.round(p * N), sc = stageS(S0, S1, k, N), yf = farY(fl.id, x, yt, cam), yy = yf + (yt - yf) * e, ga = ctx.globalAlpha;
  ctx.globalAlpha = ga * Math.min(1, (fl.t + 1) / 8);                  // one that wakes up already this close fades in rather than popping
  drawShip(ctx, x, yy, sc, badPal(k, N), f, fl.id, clamp01((p - 0.3) / 0.3), clamp01((p - 0.4) / 0.25));
  if (p > 0.55) lockMark(ctx, x, Math.round(yy), f, 7 * sc);
  ctx.globalAlpha = ga;
  return true;
}

const O = '#000';
const R = (ctx, col, x0, y0, w, h) => { ctx.fillStyle = col; ctx.fillRect(x0, y0, w, h); };
export const fx = {
  // a spice blow: the sand domes and cracks, then a pre-spice mass blows out of the ground
  vent(ctx, x, y, st, f) {
    const sw = st.warn > 0 ? 1 + Math.round(st.warn * 3) : st.on ? 3 : 0;
    for (let i = -9; i <= 9; i++) { const h = Math.round((1 + sw) * Math.cos((i / 9) * Math.PI / 2)) + 1; R(ctx, O, x + i, y - h - 1, 1, h + 3); R(ctx, Math.abs(i) < 3 ? (st.warn > 0.3 || st.on ? SPHI : SPICE) : i % 3 ? '#a85a2c' : '#7a3e22', x + i, y - h, 1, h + 1); }
    R(ctx, '#3a1a10', x - 2, y - sw - 1, 4, 1); R(ctx, BLUE, x - 6 + ((f >> 3) % 3), y - 1, 1, 1); R(ctx, BLUE, x + 5 - ((f >> 4) % 2), y - 2, 1, 1);
    if (st.warn > 0) {                                                // it rattles, spits sparks and grains
      for (let k = 0; k < 5; k++) { const a = ((f * 2 + k * 11) % 20) / 20, px = x + Math.round(Math.sin(k * 2.4) * (2 + a * 7)), py = y - sw - 2 - Math.round(a * (6 + st.warn * 10)); R(ctx, O, px - 1, py - 1, 3, 3); R(ctx, k % 2 ? '#fff0b0' : SPHI, px, py, 1, 1); }
      if ((f >> 1) % 2) { R(ctx, O, x - 2, y - sw - 5, 4, 4); R(ctx, '#fff8e0', x - 1, y - sw - 4, 2, 2); }
      return;
    }
    if (!st.on) return;
    const H = Math.round(st.h), wd = (j) => { const t = j / Math.max(1, H); return Math.round(3 + t * t * 4 + Math.sin(j * 0.9 + f * 0.7) * 1.2); };
    for (let j = 0; j < H; j++) { const w = wd(j); R(ctx, O, x - w - 1, y - 3 - j, w * 2 + 2, 1); }
    R(ctx, O, x - wd(H - 1) - 1, y - 3 - H, wd(H - 1) * 2 + 2, 1);
    for (let j = 0; j < H; j++) { const w = wd(j), t = j / Math.max(1, H); R(ctx, (j + f) % 5 < 2 ? '#c8642a' : SPICE, x - w, y - 3 - j, w * 2, 1); R(ctx, t > 0.75 ? SPHI : '#ffd27a', x - 1 - (w > 4 ? 1 : 0), y - 3 - j, 2 + (w > 4 ? 2 : 0), 1); if ((j + f) % 4 === 0) R(ctx, '#7a3e22', x + (j % 2 ? w - 2 : -w + 1), y - 3 - j, 1, 1); if ((j * 7 + f) % 9 === 0) R(ctx, BLUE, x - w + 1 + ((j * 5) % (w * 2 - 1)), y - 3 - j, 1, 1); }
    for (let k = 0; k < 6; k++) { const a = ((f * 3 + k * 9) % 24) / 24, px = x + Math.round(Math.sin(k * 1.9) * (4 + a * 12)), py = y - 3 - H + Math.round(a * a * 14 - 5 * a); R(ctx, O, px - 1, py - 1, 4, 3); R(ctx, k % 3 ? SPICE : SPHI, px, py, 2, 1); }
  },
  // the squall the debris comes out of: a front of dust tearing across the top of the screen
  cloud(ctx, x0, x1, y, f) {
    const B = []; for (let i = x0 - 4; i <= x1 + 4; i += 7) { const e = Math.min(1, Math.min(i - x0 + 12, x1 - i + 12) / 24); B.push([i, y + 1 + Math.round(3 * Math.sin(i / 9 + f / 9)), 7, Math.max(2, (7 + 2.5 * Math.sin(i / 4.3 - f / 13)) * e)]); }
    for (const [cx, cy, rx, ry] of B) ell(ctx, cx, cy, rx + 1, ry + 1, O);
    R(ctx, O, x0 - 4, y - 14, x1 - x0 + 8, 14);
    for (const [cx, cy, rx, ry] of B) ell(ctx, cx, cy, rx, ry, '#7a5a48');
    R(ctx, '#5a4038', x0 - 3, y - 13, x1 - x0 + 6, 13);
    for (const [cx, cy, rx, ry] of B) { ell(ctx, cx - 1, cy + ry * 0.45, rx * 0.6, ry * 0.4, '#a88660'); R(ctx, '#d8b078', cx - 3, Math.round(cy + ry) - 1, 4, 1); }
    for (let k = 0; k < 9; k++) { const px = x1 - (((f * 5 + k * 47) % (x1 - x0 + 40))); R(ctx, k % 3 ? '#c8a070' : '#f4d49a', px, y - 6 + ((k * 5) % 13), 8, 1); }   // sand tearing through it
  },
  // a piece of something the storm picked up: plate, strut, stone. it comes in flat on the wind
  drop(ctx, x, y, f, d) {
    const back = d.vx < 0 ? 1 : d.vx > 0 ? -1 : 0, tum = ((f >> 1) + (d.id || 0)) % 4;
    for (let k = 1; k < 5; k++) { ctx.globalAlpha = 0.5 - k * 0.1; R(ctx, '#f4d49a', x + back * k * 3, y - 3 - k * 3, 2, 1); } ctx.globalAlpha = 1;
    R(ctx, O, x - 3, y - 6, 6, 7);
    if ((d.id || 0) % 2) { R(ctx, '#aab4c2', x - 2, y - 5, 4, 5); R(ctx, '#ffffff', x - 2 + (tum % 2), y - 5 + (tum >> 1) * 2, 2, 2); R(ctx, RUST, x, y - 3, 2, 2); }
    else { R(ctx, '#c88a52', x - 2, y - 5, 4, 5); R(ctx, '#f8dca0', x - 2 + (tum % 2) * 2, y - 5 + (tum >> 1) * 3, 2, 2); R(ctx, '#6a4636', x - 1, y - 2, 2, 2); }
    if (d.hot) { const c = (f >> 1) % 2 ? '#ff4a3a' : '#ffd24a'; R(ctx, O, x - 5, y - 8, 10, 1); R(ctx, O, x - 5, y + 1, 10, 1); R(ctx, O, x - 5, y - 8, 1, 10); R(ctx, O, x + 4, y - 8, 1, 10); R(ctx, c, x - 4, y - 7, 8, 1); R(ctx, c, x - 4, y, 8, 1); R(ctx, c, x - 4, y - 7, 1, 8); R(ctx, c, x + 3, y - 7, 1, 8); }   // the one that will land on you wears a flashing frame
  },
  mark(ctx, x, y, f, k) {                                              // where the next one hits: a shadow racing in, brackets closing on the spot
    const w = 3 + Math.round((1 - k) * 7);
    R(ctx, O, x - 3, y, 7, 2); if (k > 0.5 || (f >> 2) % 2) { const c = k > 0.7 ? '#ffffff' : '#ff4a3a'; R(ctx, O, x - w - 2, y - 3, 4, 5); R(ctx, O, x + w - 1, y - 3, 4, 5); R(ctx, c, x - w - 1, y - 2, 1, 3); R(ctx, c, x - w - 1, y, 2, 1); R(ctx, c, x + w + 1, y - 2, 1, 3); R(ctx, c, x + w, y, 2, 1); }
  },
  // a beam-gun bolt: white-hot core, red edge
  shot(ctx, x, y, f, b) {
    const s = b.rev ? -1 : 1;
    for (let i = 1; i < 5; i++) { ctx.globalAlpha = 0.6 - i * 0.12; R(ctx, '#ff4a3a', x + s * (2 + i * 4), y, 4, 1); } ctx.globalAlpha = 1;
    R(ctx, O, x - 5, y - 2, 10, 4); R(ctx, '#ff3a2a', x - 4, y - 1, 8, 2); R(ctx, '#ffe0c0', x - 4 + (s > 0 ? 0 : 3), y - 1, 5, 1); R(ctx, '#ffffff', x - 3 + (s > 0 ? 0 : 3), y - 1, 3, 1);
  },
  aim(ctx, x0, x1, y, f, k) {                                          // the ranging beam: thin and red, solid just before the shot
    if (k < 0.45 && (f >> 2) % 2) return;
    ctx.fillStyle = k > 0.8 ? '#ffffff' : '#ff4a3a'; ctx.globalAlpha = 0.5 + k * 0.5;
    for (let i = x1; i > x0; i -= k > 0.8 ? 2 : 5) ctx.fillRect(i, y, k > 0.8 ? 2 : 3, 1);
    ctx.globalAlpha = 1;
  },
  // wormsign right here: the back of a worm breaking the sand, hooks and lines already set. Step on
  ride(ctx, x, y, f) {
    x = Math.round(x); y = Math.round(y);
    const b = Math.round(Math.sin(f / 10) * 1.5), HW = 33, H = 23 + b;
    const top = (i) => y + 3 - Math.round(H * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(i - x) / HW, 2.6)), 0.62));
    for (let k = 0; k < 8; k++) { const a = ((f + k * 6) % 42) / 42, d = HW + 2 + a * 20; ctx.globalAlpha = 0.85 * (1 - a); R(ctx, '#f4d49a', Math.round(x - d - 4), y - 1 - (k % 3), 4, 1); R(ctx, '#f4d49a', Math.round(x + d), y - 1 - (k % 3), 4, 1); } ctx.globalAlpha = 1;   // the sand it shoulders aside
    // the back itself: a long barrel of ringed hide, sliding by under the hooks
    for (let i = x - HW; i <= x + HW; i++) { const t = top(i); if (t < y + 2) R(ctx, O, i, t - 1, 1, y + 3 - t); }
    R(ctx, O, x - HW - 1, y - 6, 1, 8); R(ctx, O, x + HW + 1, y - 6, 1, 8);
    for (let i = x - HW; i <= x + HW; i++) {
      const t = top(i), h = y + 2 - t; if (h <= 0) continue;
      for (let j = 0; j < h; j++) {
        const q = j / h, ring = (((i - x + Math.round(3 * Math.sin(q * Math.PI * 0.9)) + (f >> 2)) % 9) + 9) % 9;                // the rings bow: it is round
        ctx.fillStyle = ring < 2 ? (q < 0.45 ? '#6a1a4e' : '#340a26') : ring === 2 ? (q < 0.3 ? '#d8c8ff' : q < 0.55 ? '#ffd8ee' : '#c8609e') : j === 0 ? '#ffe2f2' : q < 0.22 ? '#ff9ccc' : q < 0.5 ? '#ea6aae' : q < 0.78 ? '#b23a80' : '#6e1e54';   // pink hide, dark rings, a lilac sheen on each lip
        ctx.fillRect(i, t + j, 1, 1);
      }
    }
    for (const sd of [-1, 1]) {                                        // sand heaped where it breaks the surface, and pouring off its flanks
      const ex = x + sd * HW;
      for (let k = 0; k < 9; k++) { const h = 7 - k + ((k + (f >> 3)) % 2), px = sd < 0 ? ex - 5 + k : ex + 5 - k - 1; if (h > 0) { R(ctx, O, px, y + 1 - h, 1, h + 1); R(ctx, k < 3 ? '#d8a070' : '#f4d49a', px, y + 2 - h, 1, h); } }
      for (let k = 0; k < 5; k++) { const a = ((f * 1.4 + k * 9) % 30) / 30, px = Math.round(ex - sd * (9 - a * 5) ), py = Math.round(y - 15 + a * 14); ctx.globalAlpha = 1 - a * 0.5; R(ctx, k % 2 ? '#fff0c8' : '#f4d49a', px, py, 1, 2); } ctx.globalAlpha = 1;
    }
    // two maker hooks planted between the rings, their lines hauled back over its shoulder and trailing to the sand
    const rope = (pts) => { for (let k = 0; k < pts.length - 1; k++) seg(ctx, pts[k][0], pts[k][1] + 1, pts[k + 1][0], pts[k + 1][1] + 1, O, 2); for (let k = 0; k < pts.length - 1; k++) seg(ctx, pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], '#ffe9a8', 1); };
    const ty = y - H + 3;
    rope([[x - 6, ty - 9], [x - 15, ty - 2], [x - 24, ty + 3], [x - 31, ty + 12], [x - 36, y - 3], [x - 42, y]]);
    rope([[x + 9, ty - 9], [x + 1, ty - 4], [x - 13, ty - 1], [x - 22, ty + 5], [x - 29, ty + 14], [x - 33, y - 2]]);
    for (const hx of [x - 6, x + 9]) { R(ctx, O, hx - 1, ty - 10, 4, 14); R(ctx, '#dfe6ee', hx, ty - 9, 2, 12); R(ctx, '#8a98a8', hx + 1, ty - 9, 1, 12); R(ctx, O, hx - 2, ty - 12, 8, 4); R(ctx, '#ffffff', hx - 1, ty - 11, 6, 2); R(ctx, O, hx + 4, ty - 9, 3, 5); R(ctx, '#dfe6ee', hx + 5, ty - 9, 1, 4); R(ctx, O, hx - 2, ty + 2, 6, 2); R(ctx, '#6a1a4e', hx - 1, ty + 2, 4, 1); }
    const ay = y - H - 30 + Math.round(Math.sin(f / 5) * 2);            // it beckons
    R(ctx, O, x - 3, ay - 1, 9, 5); R(ctx, O, x - 1, ay + 4, 5, 2); R(ctx, O, x, ay + 6, 3, 2); R(ctx, (f >> 2) % 2 ? '#ffffff' : SPHI, x - 2, ay, 7, 3); R(ctx, (f >> 2) % 2 ? '#ffffff' : SPHI, x, ay + 3, 3, 2); R(ctx, SPHI, x + 1, ay + 5, 1, 2);
  },
  // riding it: he stands on its back holding the lines; the worm runs the length of the screen behind him and takes everything in front
  riding(ctx, x, y, f, s, hero) {
    const lift = Math.max(0, Math.round((200 * 256 - s.y) / 256)), floor = y + lift, x0 = -8, x1 = x + 30;
    const ease = (i) => { const t = Math.max(0, Math.min(1, (i - (x - 66)) / 66)); return t * t * (3 - 2 * t); };
    const und = (i) => Math.sin((i + f * 2.2) / 11) * 1.6;
    const topY = (i) => Math.round(floor - 21 - lift * ease(i) + und(i) - (i > x + 18 ? -(i - x - 18) * 0.35 : 0));
    const botY = (i) => Math.round(floor + 3 - Math.max(0, lift * ease(i) - 4));
    for (let k = 0; k < 9; k++) { const a = ((f * 2 + k * 9) % 36) / 36, px = x1 + 6 - a * 34 - k * 2; ctx.globalAlpha = 1 - a; R(ctx, k % 2 ? '#f4d49a' : '#d8a070', Math.round(px), floor - 1 - Math.round(Math.sin(a * Math.PI) * (8 + (k % 3) * 4)), 2, 2); }   // the bow wave of sand
    for (let k = 0; k < 7; k++) { const px = ((k * 41 - f * 3) % (x + 40) + (x + 40)) % (x + 40) - 6; ctx.globalAlpha = 0.8; R(ctx, '#f4d49a', px, floor + 1 - (k % 3), 5, 1); } ctx.globalAlpha = 1;
    wormBody(ctx, x0, x1, topY, botY, f, 2.2);
    { const hx = x1, t = topY(x1 - 1), b = botY(x1 - 1), my = (t + b) >> 1, hh = Math.max(4, (b - t) >> 1), open = Math.max(2, hh - 5 + ((f >> 2) % 3));   // the head: the jaws part (it splits three ways), hooked teeth, feelers out of a glowing throat
      for (let i = 0; i < 6; i++) { const hw = hh + (i > 0 && i < 4 ? 1 : 0); R(ctx, O, hx + i, my - hw - 1, 1, hw * 2 + 2); R(ctx, i < 2 ? '#ea6aae' : '#ff9ccc', hx + i, my - hw, 1, hw * 2); R(ctx, '#ffe2f2', hx + i, my - hw, 1, 1); R(ctx, '#6e1e54', hx + i, my + hw - 3, 1, 3); }
      R(ctx, O, hx + 2, my - hh - 1, 1, hh * 2 + 2);                   // the ring the jaws hinge on
      for (const sg of [-1, 1]) {                                         // upper and lower jaw, hinged back and tipping out, the gap between them the split
        for (let i = 0; i < 9; i++) { const y0 = my + sg * (1 + Math.round(open * (i / 9) * 1.2)), th = Math.max(1, Math.round((hh - 1) * (1 - i / 11))), yy = sg < 0 ? y0 - th : y0;
          R(ctx, O, hx + 5 + i, yy - 1, 1, th + 2); R(ctx, i < 3 ? '#ea6aae' : '#ff9ccc', hx + 5 + i, yy, 1, th); R(ctx, sg < 0 ? '#ffe2f2' : '#b23a80', hx + 5 + i, sg < 0 ? yy : yy + th - 1, 1, 1);
          if (i % 3 === 1) { R(ctx, '#fffbe8', hx + 5 + i, y0 - (sg < 0 ? 1 : 0), 1, 1); R(ctx, '#f2dcb0', hx + 4 + i, y0 + (sg < 0 ? 0 : -1) + sg, 1, 1); } }   // hooked teeth on each lip, raked back
      }
      R(ctx, '#143826', hx + 5, my - 1, 4, 2); R(ctx, '#a6ff5a', hx + 6, my - (open > 3 ? 1 : 0), 2, 1);   // the throat, lit
      for (let k = 0; k < 3; k++) { const ln = 4 + k + ((f >> 2) + k) % 3, yy = my - 1 + k; for (let e = 0; e < ln; e++) R(ctx, e === ln - 1 ? '#f6ffd2' : '#a6ff5a', hx + 8 + e, yy + Math.round(Math.sin((e + f / 3 + k * 2) / 2) * (k - 1 || 0.6)), 1, 1); } }   // feelers, reaching
    const hy = topY(x) + 1;
    for (const hx2 of [x + 9, x + 15]) { const ty = topY(hx2); R(ctx, O, hx2 - 1, ty - 4, 3, 6); R(ctx, '#dfe6ee', hx2, ty - 3, 1, 5); seg(ctx, x + 3, hy - 17, hx2, ty - 3, '#e8c088', 1); }   // hooks set between the rings, the lines back to his hands
    ctx.drawImage(hero.c, Math.round(x - hero.ox), Math.round(hy - hero.oy));
  },
  // the body shield: a skin of force a hand's width off him. it shimmers; where the light catches it, it flares
  shield(ctx, x, y, f) {
    const x0 = x - 12, y0 = y - 35, w = 24, h = 37, t = (f >> 1) % 26;
    ctx.globalAlpha = 0.17; R(ctx, BLUE, x0 + 1, y0 + 1, w - 2, h - 2); ctx.globalAlpha = 1;
    for (let k = 0; k < 2 * (w + h); k++) {
      const onTop = k < w, onR = k >= w && k < w + h, onB = k >= w + h && k < 2 * w + h, i = onTop ? k : onR ? w - 1 : onB ? w - 1 - (k - w - h) : 0, j = onTop ? 0 : onR ? k - w : onB ? h - 1 : h - 1 - (k - 2 * w - h);
      if ((i < 2 || i > w - 3) && (j < 2 || j > h - 3)) continue;        // rounded corners
      const ph = (k + f * 2) % 14; if (ph > 11) continue;
      ctx.fillStyle = ph < 2 ? '#ffffff' : ph < 6 ? '#bff0ff' : BLUE; ctx.globalAlpha = ph < 6 ? 1 : 0.75; ctx.fillRect(x0 + i, y0 + j, 1, 1);
    }
    ctx.globalAlpha = 0.5; if (t < h - 4) { R(ctx, '#e8fbff', x0 + 2, y0 + 2 + t, w - 4, 1); } ctx.globalAlpha = 1;
  },
};
// a length of worm between screen x a and b: ringed hide, lit along the top, dark underneath. top(i)/bot(i) give its back and belly; the rings run backwards at speed v
function wormBody(ctx, a, b, top, bot, f, v) {
  a = Math.round(a); b = Math.round(b);
  for (let i = a; i < b; i++) { const t = top(i), bo = bot(i); if (bo <= t) continue; R(ctx, O, i, t - 1, 1, bo - t + 2); }
  R(ctx, O, a - 1, top(a), 1, Math.max(1, bot(a) - top(a))); R(ctx, O, b, top(b - 1), 1, Math.max(1, bot(b - 1) - top(b - 1)));
  for (let i = a; i < b; i++) {
    const t = top(i), bo = bot(i), h = bo - t; if (h <= 0) continue;
    const ring = (((i + Math.round(f * v)) % 7) + 7) % 7;
    for (let j = 0; j < h; j++) { const q = j / h; ctx.fillStyle = ring === 0 ? (q < 0.5 ? '#6a1a4e' : '#340a26') : j === 0 ? '#ffe2f2' : q < 0.2 ? (ring === 1 ? '#d8c8ff' : '#ff9ccc') : q < 0.5 ? (ring === 1 ? '#ff88c2' : '#ea6aae') : q < 0.78 ? '#b23a80' : '#6e1e54'; ctx.fillRect(i, t + j, 1, 1); }
  }
}
export const labels = { ride: 'WORM RIDER!', shield: 'SHIELD!' };
export const danger = {
  spawn: { vent: 12, gunner: 11, seeker: 10, rain: 11 },               // 44% of everything that turns up
  rain: { vx: -440 },                                                  // the storm throws it in flat, from ahead
  ride: { fly: true, chance: 65 },                                     // the worm crosses holes in the floor
  box: { shield: 14 },
};
