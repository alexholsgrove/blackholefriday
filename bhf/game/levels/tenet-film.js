// Black Hole Friday, level 6: INVERSION. THERE AND BACK.
// The way out (red): a freeport hangar, a motorway, a battlefield in a dead city, to the turnstile.
// The way back (blue): the same places in reverse order, the picture drawn right to left, everything rewinding.
// This file only DRAWS. The rules are the ordinary runner's (sim.js; the layout is spawnFilm there) and never read anything written here.
// Everything in the scenery is placed by "place": how far along the route it stands (0 at the start, danger.film.mid at the turnstile).
// On the way back the hero's place counts down again, so whatever is drawn as a function of his place rewinds by itself.
import { cv, hash, noise, tint, drawText, GRAD } from '../kit.js';
import { ZONE_PX } from '../sim.js';
import { drawVehicle, motorway, roadBed, battleBack, craneRig, lightShafts } from './tenet-road.js';

const W = 320, FPX = 256, DECK = 200, LAVA = 214, ZONE = ZONE_PX, TOP = 36, HX = 72, TAU = Math.PI * 2;
const O = '#000', RED = '#e03a2a', BLUE = '#3a8ae0', RED_HI = '#ff8a6a', BLUE_HI = '#8ac8ff';
const R = (x, col, x0, y0, w, h) => { x.fillStyle = col; x.fillRect(Math.round(x0), Math.round(y0), w, h); };
const cl = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mod = (a, n) => ((a % n) + n) % n;
const disc = (x, cx, cy, r, col) => { x.fillStyle = col; for (let j = -r; j <= r; j++) { const w = Math.floor(Math.sqrt(r * r - j * j + r * 0.8)); x.fillRect(Math.round(cx - w), Math.round(cy + j), w * 2 + 1, 1); } };

// ---------- still pictures (built the first time they are drawn) ----------
function buildHangar() {                                // 192 x 164: world y 36..200
  const c = cv(192, 164), x = c.getContext('2d'), n = noise(7);
  R(x, '#1d2129', 0, 0, 192, 164);
  for (let i = 0; i < 192; i += 4) { R(x, '#242932', i, 0, 1, 164); R(x, '#181b22', i + 2, 0, 1, 164); }
  for (let k = 0; k < 2; k++) for (let i = 0; i < 4; i++) {   // a high row of panes, grey dawn behind
    const wx = 18 + k * 96 + i * 18, lit = n() > 0.3; R(x, '#0e1014', wx - 1, 29, 16, 28); R(x, lit ? '#313c4a' : '#15191f', wx, 30, 14, 26);
    if (lit) R(x, '#43536a', wx, 30, 14, 3); R(x, '#0e1014', wx + 6, 30, 1, 26); R(x, '#0e1014', wx, 42, 14, 1);
  }
  for (const gy of [18, 66, 118]) { R(x, '#111318', 0, gy, 192, 5); R(x, '#343a46', 0, gy, 192, 1); for (let i = 6; i < 192; i += 12) R(x, '#2a2f39', i, gy + 2, 1, 1); }
  for (const gx of [0, 96]) { R(x, '#111318', gx, 0, 9, 164); R(x, '#343a46', gx, 0, 1, 164); R(x, '#262b34', gx + 5, 0, 1, 164); }
  R(x, '#14161b', 0, 152, 192, 12); for (let i = 0; i < 192; i++) for (let j = 0; j < 4; j++) if (((i + j) >> 2) % 2) R(x, '#4a4122', i, 154 + j, 1, 1);
  // gold bars on a pallet, and crates
  R(x, O, 29, 141, 34, 23); R(x, '#3a2c1c', 30, 160, 32, 4);
  [[4, 156], [3, 152], [2, 148], [1, 144]].forEach(([nb, y], r) => { for (let b = 0; b < nb; b++) { const bx = 31 + r * 4 + b * 8; R(x, '#6e5618', bx, y, 7, 4); R(x, '#a8862c', bx, y, 7, 2); R(x, '#e0c468', bx + 1, y, 3, 1); } });
  for (const [cx, cy, w, h] of [[122, 142, 24, 22], [148, 148, 18, 16], [128, 126, 18, 16]]) { R(x, O, cx - 1, cy - 1, w + 2, h + 2); R(x, '#33291f', cx, cy, w, h); R(x, '#4a3b2b', cx, cy, w, 2); R(x, '#4a3b2b', cx, cy, 2, h); R(x, '#241c15', cx + w - 2, cy, 2, h); for (let i = 3; i < Math.min(w, h) - 3; i++) R(x, '#3e3124', cx + i, cy + i, 1, 1); }
  return c;
}
function buildPlane() {                                 // 184 x 120, nose to the left, wheels on the bottom row
  const w = 184, c = cv(w, 120), x = c.getContext('2d');
  R(x, O, 86, 66, 7, 44); R(x, '#8a94a4', 88, 66, 3, 44); R(x, '#c8d0dc', 88, 66, 1, 44); R(x, O, 80, 84, 19, 4); R(x, '#5a6474', 81, 85, 17, 2);
  for (const wx of [80, 99]) { disc(x, wx, 110, 9, O); disc(x, wx, 110, 8, '#1c1e24'); disc(x, wx, 110, 4, '#6a7280'); disc(x, wx, 110, 1, '#c8d0dc'); }
  const top = (i) => Math.round(46 - 42 * Math.sqrt(1 - Math.pow(1 - cl(i / 80), 2))), bot = (i) => Math.round(46 + 26 * Math.sqrt(1 - Math.pow(1 - cl(i / 46), 2)));
  for (let i = 0; i < w; i++) {
    const t = top(i), b = bot(i); R(x, O, i, t - 1, 1, b - t + 3);
    for (let j = t; j <= b; j++) { const v = (j - t) / Math.max(1, b - t); R(x, v < 0.07 ? '#eef2f8' : v < 0.42 ? '#c2cad6' : v < 0.6 ? '#9ca6b6' : v < 0.84 ? '#727c8e' : '#4c5564', i, j, 1, 1); }
    if (i > 16) R(x, '#3c4a62', i, 45, 1, 3);
    if (i > 20 && i % 26 === 0) R(x, '#aab2c0', i, t + 3, 1, 40 - t);
  }
  R(x, O, 0, 44, 1, 5); R(x, '#6a7484', 12, top(12), 1, bot(12) - top(12));
  for (let k = 0; k < 4; k++) { const i = 30 + k * 8, t = top(i + 3) + 7; R(x, O, i - 1, t - 1, 8, 8); R(x, '#0c1420', i, t, 6, 6); R(x, '#7ab0e0', i, t, 2, 1); }
  R(x, '#8a94a4', 124, 22, 16, 1); R(x, '#8a94a4', 124, 22, 1, 26); R(x, '#8a94a4', 139, 22, 1, 26);
  return c;
}
function buildRuins() {                                 // 256 x 164: the fronts of a dead street, sky through the gaps
  const c = cv(256, 164), x = c.getContext('2d'), n = noise(19), BX = [0, 44, 96, 132, 188, 226], BW = [40, 48, 30, 52, 34, 30];
  for (let b = 0; b < 6; b++) {
    const bx = BX[b], bw = BW[b], top = 44 + Math.floor(n() * 54), col = ['#27282c', '#2d2e33', '#222327'][b % 3], lite = ['#383a40', '#3e4046', '#33343a'][b % 3];
    for (let i = 0; i < bw; i++) { const jag = top + Math.floor(hash((bx + i) >> 2, b) * 24); R(x, col, bx + i, jag, 1, 164 - jag); R(x, lite, bx + i, jag, 1, 1); }
    R(x, lite, bx, top + 24, 1, 140 - top);
    for (let wy = top + 32; wy < 146; wy += 19) for (let wx = bx + 5; wx < bx + bw - 9; wx += 13) { if (n() < 0.15) continue; R(x, '#0d0e10', wx, wy, 8, 11); if (n() < 0.35) R(x, col, wx, wy, 2 + Math.floor(n() * 5), 2 + Math.floor(n() * 4)); R(x, lite, wx, wy + 11, 8, 1); }
    for (let k = 0; k < 3; k++) { const rx = bx + 3 + Math.floor(n() * (bw - 6)); R(x, '#4a3a30', rx, top + 2, 1, 14); R(x, '#4a3a30', rx, top + 2, 3, 1); }
  }
  for (let i = 0; i < 256; i += 3) { const h = 3 + Math.floor(hash(i, 9) * 9); R(x, '#1a1b1e', i, 164 - h, 3, h); R(x, '#2c2d31', i, 164 - h, 2, 1); }
  return c;
}
function buildBunker() {                                // 128 x 164: the turnstile hall
  const c = cv(128, 164), x = c.getContext('2d');
  R(x, '#26282e', 0, 0, 128, 164);
  for (let j = 0; j < 164; j += 41) { R(x, '#1b1d22', 0, j, 128, 1); R(x, '#30333a', 0, j + 1, 128, 1); }
  for (const i of [0, 64]) { R(x, '#1b1d22', i, 0, 1, 164); R(x, '#30333a', i + 1, 0, 1, 164); for (let j = 10; j < 164; j += 41) { R(x, '#15171b', i + 12, j, 2, 2); R(x, '#15171b', i + 50, j, 2, 2); R(x, '#15171b', i + 12, j + 20, 2, 2); R(x, '#15171b', i + 50, j + 20, 2, 2); } }
  R(x, '#121317', 0, 8, 128, 4); R(x, '#3a3e48', 0, 8, 128, 1); R(x, '#121317', 0, 16, 128, 2); R(x, '#16181c', 0, 150, 128, 14);
  return c;
}
function buildLorry() {                                 // 160 x 44: the flatbed of a low-loader you run along (its wheels on the road, 22 px down)
  const c = cv(160, 44), x = c.getContext('2d');
  R(x, O, 0, 0, 160, 11); R(x, '#d8dde4', 0, 0, 160, 1); R(x, '#8a919c', 0, 1, 160, 1); R(x, '#5a606a', 0, 2, 160, 2);
  for (let i = 0; i < 160; i += 4) R(x, '#6e7480', i + ((i >> 2) % 2) * 2, 2, 1, 1);
  R(x, '#3a1e1a', 0, 4, 160, 5); R(x, '#5a2a24', 0, 4, 160, 1); for (let i = 0; i < 160; i += 20) { R(x, '#16181d', i + 2, 5, 2, 3); R(x, '#ffa020', i + 12, 6, 2, 1); }
  R(x, '#121317', 0, 9, 160, 2); R(x, '#2a2d33', 6, 11, 148, 3); R(x, '#121317', 6, 14, 148, 1);
  for (const wx of [18, 30, 128, 140]) { disc(x, wx, 13, 5, O); disc(x, wx, 13, 4, '#1c1e24'); disc(x, wx, 13, 2, '#5a6270'); R(x, '#9aa0aa', wx - 1, 9, 2, 1); }
  R(x, '#3a3e48', 70, 11, 2, 7); R(x, '#3a3e48', 88, 11, 2, 7);
  return c;
}
function buildStreet() {                                // 96 x 44: the broken street of the dead city
  const c = cv(96, 44), x = c.getContext('2d'), n = noise(23);
  R(x, '#2f3033', 0, 0, 96, 44); R(x, '#a9a9a4', 0, 0, 96, 1); R(x, '#5c5d5f', 0, 1, 96, 2); R(x, '#1b1c1e', 0, 3, 96, 1);
  for (let k = 0; k < 26; k++) { const i = Math.floor(n() * 92), j = 5 + Math.floor(n() * 36), w = 2 + Math.floor(n() * 5); R(x, n() < 0.5 ? '#242528' : '#3a3b3f', i, j, w, 1 + Math.floor(n() * 2)); }
  for (let k = 0; k < 3; k++) { let i = 10 + k * 30, j = 4; for (let s = 0; s < 16; s++) { R(x, '#151618', i, j, 1, 2); j += 2; i += n() < 0.5 ? 1 : -1; } }
  return c;
}
let ART = null;
const art = () => ART || (ART = { hangar: buildHangar(), plane: buildPlane(), ruins: buildRuins(), bunker: buildBunker(), lorry: buildLorry(), street: buildStreet() });

function flame(ctx, x, y, h, f, k) {                    // fire for the scenery: no outline, so it never reads as something to jump
  for (let j = 0; j < h; j++) { const w = Math.round((1 - j / h) * 3 + 0.5), sw = Math.round(Math.sin((f + j * 3 + k * 7) / 4)); R(ctx, j < h * 0.35 ? '#ffd24a' : j < h * 0.7 ? '#ff8a1a' : '#c8401a', x - w + (j > 2 ? sw : 0), y - j, w * 2, 1); }
  R(ctx, '#fff4c0', x - 1, y - 2, 2, 2);
}
function frost(ctx, x, y, h, f, k) {                    // the same fire, inverted: ice
  for (let j = 0; j < h; j++) { const w = Math.round((1 - j / h) * 2 + 0.5); R(ctx, j < h * 0.5 ? '#e8f4ff' : BLUE_HI, x - w, y - j, w * 2, 1); }
  if ((f + k * 9) % 40 < 4) { R(ctx, '#ffffff', x - 3, y - h, 7, 1); R(ctx, '#ffffff', x, y - h - 3, 1, 7); }
}

export function film(env) {
  const F = env.F, S = { blue: false, ph: 0, cam: 0, z0: 0, zp: 0, mid: F.mid, E0: F.scenes[0], E1: F.scenes[1], lap: 0, fy: DECK, hx: HX, key: null, last: -1, live: false, half: -1 };
  const yrec = new Float32Array(ZONE).fill(DECK);       // the way out as he really ran it: his height at each place. Looked at, never played
  let HS = null, CARC = null, VIG = null;
  const X = (p) => Math.round(p - S.cam);
  function sync(s) {
    const fm = s.film || null, zi = fm ? fm.z : Math.floor((s.dist + W * FPX) / (ZONE * FPX));
    const camX = Math.floor(s.dist / FPX) - zi * ZONE, zp = camX + HX;
    S.z0 = zi * ZONE; S.zp = zp; S.live = !!fm; S.blue = !!fm && zp >= F.mid; S.lap = s.lap || 0; S.fy = s.y / FPX;
    S.E0 = fm ? Math.round(fm.edge[0] / FPX) - S.z0 : F.scenes[0]; S.E1 = fm ? Math.round(fm.edge[1] / FPX) - S.z0 : F.scenes[1];
    S.cam = S.blue ? 2 * F.mid - camX - W : camX; S.ph = S.blue ? 2 * F.mid - zp : zp; S.hx = S.blue ? W - HX : HX;
    if (fm !== S.key) { S.key = fm; yrec.fill(DECK); S.last = -1; }
    if (fm && !S.blue) { const p = cl(Math.floor(S.ph), 0, ZONE - 1); for (let i = S.last < 0 || S.last > p ? p : S.last; i <= p; i++) yrec[i] = S.fy; S.last = p; }
    const half = S.blue ? 1 : 0;
    if (half !== S.half) {                              // the cast changes sides with the light: red armbands out, inverted troops back
      S.half = half; const C = env.chr;
      C.grunt.splice(0, C.grunt.length, ...(half ? env.back : env.fwd));
      Object.assign(C.gunner, half ? env.gunBlue : env.gunRed);
    }
    return S.blue;
  }
  const unflip = (ctx, fn) => { if (!S.blue) return fn(); ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1); fn(); ctx.restore(); };
  function tile(ctx, img, a, b, y) {
    a = Math.max(a, S.cam - 4); b = Math.min(b, S.cam + W + 4); if (b <= a) return;
    ctx.save(); ctx.beginPath(); ctx.rect(X(a), -60, Math.round(b - a), 360); ctx.clip();
    for (let p = Math.floor(a / img.width) * img.width; p < b; p += img.width) ctx.drawImage(img, X(p), y);
    ctx.restore();
  }
  const streak = (span, par, ph, fn) => { for (let x = mod(ph - S.cam * par, span) - span; x < W + span; x += span) fn(Math.round(x)); };
  const lite = () => (S.blue ? BLUE : RED), liteHi = () => (S.blue ? BLUE_HI : RED_HI);

  // the saloon in the far lane: it overtakes, clips the barrier, rolls and lands on its roof ahead of you. All of it is a function of the hero's place
  function carShow(ctx, Y, f) {
    if (!CARC) { const c = cv(64, 26), x = c.getContext('2d'); x.translate(64, 0); x.scale(-1, 1); env.drawCar(x, 32, 24, 0, 0); CARC = tint({ c, ox: 0, oy: 0 }, '#0c1016', 0.12).c; }
    const E1 = S.E1, p = S.ph, a0 = E1 - 420, a1 = E1 - 280, a2 = E1 - 190; if (p < a0 - 20 || p > E1 + 260) return;
    let c, h = 0, ang = 0, u = 0;
    if (p < a1) c = p - 150 + (p - a0) * 2; else { u = cl((p - a1) / (a2 - a1)); c = a1 + 130 + 80 * (1 - (1 - u) * (1 - u)); h = 22 * Math.abs(Math.sin(u * Math.PI * 1.5)) * (1 - u * 0.6); ang = u * Math.PI * (S.blue ? -3 : 3); }
    const x = X(c), y = Y(158);
    ctx.save(); ctx.translate(x, y - 11 - h); ctx.rotate(ang); ctx.drawImage(CARC, -32, -15); ctx.restore();
    if (u > 0 && u < 1 && h < 4) for (let k = 0; k < 5; k++) R(ctx, k % 2 ? '#ffffff' : S.blue ? BLUE_HI : '#ffd24a', x - 14 + hash(k, f) * 28, y - 2 - hash(f, k) * 8, 2, 1);
    if (u >= 1) { for (let k = 0; k < 3; k++) (S.blue ? frost : flame)(ctx, x - 12 + k * 11, y - 19, 7 + ((f >> 2) + k) % 4, f, k); if (!S.blue) for (let k = 0; k < 4; k++) { const a = ((f + k * 23) % 90) / 90; ctx.globalAlpha = 0.5 * (1 - a); disc(ctx, x + 4 + a * 10, y - 28 - a * 40, 3 + Math.round(a * 5), '#14161b'); } ctx.globalAlpha = 1; }
  }
  // ---- the wall plane, scene by scene ----
  function sceneFx(ctx, s, Y, f) {
    sync(s); const A = art();
    unflip(ctx, () => {
      const c0 = S.cam - 4, c1 = S.cam + W + 4, E0 = S.E0, E1 = S.E1, M = S.mid, HALL = M - F.pre - 40, col = lite(), hi = liteHi(), p = S.ph;
      if (c0 < E0 - 12) {                               // 1. THE FREEPORT HANGAR
        tile(ctx, A.hangar, c0, E0 - 12, Y(TOP));
        ctx.save(); ctx.beginPath(); ctx.rect(X(c0), -60, Math.round(Math.min(c1, E0 - 12) - c0), 360); ctx.clip(); lightShafts(ctx, X(c0), X(Math.min(c1, E0 - 12)), S.cam, Y, f, S.blue);
        craneRig(ctx, s.plats.filter((q) => q.veh === 'pallet').map((q) => { const zp = q.x / FPX - S.z0, pc = S.blue ? 2 * S.mid - zp - q.w / FPX : zp; return { x: X(pc), w: q.w / FPX }; }), Y, f); ctx.restore();
        for (let q = Math.floor(c0 / 96) * 96; q < Math.min(c1, E0 - 20); q += 96) {   // strip lights in this half's colour
          const lit = 0.6 + 0.4 * Math.sin(f / 19 + q); ctx.globalAlpha = 0.5 + 0.5 * lit; R(ctx, col, X(q) + 3, Y(92), 3, 56); R(ctx, hi, X(q) + 4, Y(92), 1, 56);
          ctx.globalAlpha = 0.07; for (let r = 4; r < 20; r += 4) R(ctx, col, X(q) + 4 - r, Y(88), r * 2 + 1, 64); ctx.globalAlpha = 1;
        }
        const BX = E0 - 90, sl = cl((p - (BX - 230)) / 200), ez = sl * sl * (3 - 2 * sl), bx = X(BX);   // the cargo plane through the wall
        if (bx > -200 && bx < W + 40) {
          for (let j = 76; j < 200; j += 4) { const jg = Math.floor(hash(j, 3) * 9); R(ctx, '#07080b', bx - 6 - jg, Y(j), 30 + jg, 4); }
          if (ez > 0) { ctx.save(); ctx.beginPath(); ctx.rect(bx - 200, Y(60), 208, 160); ctx.clip(); ctx.drawImage(A.plane, bx + 8 - Math.round(ez * 158), Y(80)); ctx.restore(); }
          for (let k = 0; k < 12; k++) {                // the torn sheeting round it, bent your way
            const j = 80 + k * 10, L = 5 + Math.floor(hash(k, 5) * 9) + Math.round(ez * 4); R(ctx, '#0c0d10', bx - 4 - L, Y(j) - 1, L + 4, 5); R(ctx, '#3a4150', bx - 3 - L, Y(j), L + 2, 3); R(ctx, '#6a7484', bx - 3 - L, Y(j), L + 2, 1);
          }
          if (ez <= 0 && (f >> 2) % 3) for (let k = 0; k < 5; k++) R(ctx, hi, bx - 2 + Math.floor(hash(k, 1) * 8), Y(90 + k * 22), 1, 9);   // before it comes: the wall splits
          if (ez > 0.15) for (let k = 0; k < 5; k++) (S.blue ? frost : flame)(ctx, bx - 8 + Math.floor(hash(k, 8) * 14), Y(96 + k * 14), 8 + ((f >> 2) + k * 3) % 5, f, k);
          if (ez > 0.15 && !S.blue) { for (let k = 0; k < 5; k++) { const a = ((f + k * 19) % 100) / 100; ctx.globalAlpha = 0.55 * (1 - a); disc(ctx, bx - 4 + a * 14, Y(86) - a * 46, 3 + Math.round(a * 6), '#101216'); } ctx.globalAlpha = 1; }
        }
      }
      const ma = Math.max(c0, E0 - 12), mb = Math.min(c1, E1 + 8);
      if (mb > ma) {                                    // 2. THE MOTORWAY: the far lanes over the lorry's roof, everything streaking by
        ctx.save(); ctx.beginPath(); ctx.rect(X(ma), -60, Math.round(mb - ma), 360); ctx.clip();
        motorway(ctx, X(ma), X(mb), S.cam, Y, f, S.blue);
        carShow(ctx, Y, f);
        ctx.restore();
      }
      if (X(E0) > -20 && X(E0) < W + 20) {              // the hangar's door
        const dx = X(E0 - 14); R(ctx, '#0b0c0f', dx, Y(TOP), 14, 164); R(ctx, '#2c313a', dx, Y(TOP), 1, 164);
        for (let j = 0; j < 164; j++) for (let i = 4; i < 11; i++) if (((i + j) >> 2) % 2) R(ctx, '#4a4122', dx + i, Y(TOP) + j, 1, 1);
      }
      if (c1 > E1 + 8 && c0 < HALL) {                   // 3. THE BATTLEFIELD: a dead city
        { const a = Math.max(c0, E1 + 8), b = Math.min(c1, HALL); if (b > a) { ctx.save(); ctx.beginPath(); ctx.rect(X(a), -60, Math.round(b - a), 360); ctx.clip(); battleBack(ctx, X(a), X(b), S.cam, Y, f, S.blue); ctx.restore(); } }
        tile(ctx, A.ruins, Math.max(c0, E1 + 8), HALL, Y(TOP));
        const T0 = E1 + 440, tx = X(T0), WR = env.WRK;  // the block that comes down as you reach it (and stands up again on the way back)
        if (tx > -260 && tx < W + 120) {
          const u = cl((p - (T0 - 170)) / 150), d = 1 - (1 - u) * (1 - u), by = Y(DECK) - WR.H * 2;
          ctx.drawImage(WR.c, 0, WR.split, WR.W, WR.H - WR.split, tx, by + WR.split * 2, WR.W * 2, (WR.H - WR.split) * 2);
          if (d > 0 && u < 0.5) { const k = u / 0.5, r = 8 + k * 46; ctx.globalAlpha = 0.8 * (1 - k); disc(ctx, tx + 72, by + 66, Math.round(r), S.blue ? '#3a6aa0' : '#8c4a30'); disc(ctx, tx + 72, by + 66, Math.round(r * 0.6), S.blue ? '#9ad0ff' : '#d08a4c'); ctx.globalAlpha = 1; }
          for (const c of WR.chunks) ctx.drawImage(WR.c, c.x, c.y, c.w, c.h, Math.round(tx + (c.x + c.vx * d) * 2), Math.round(by + (c.y + c.vy * d + 34 * d * d) * 2), c.w * 2, c.h * 2);
          ctx.globalAlpha = 0.45; R(ctx, '#0e0f12', tx - 140, by - 80, 430, 0); ctx.globalAlpha = 1;
        }
        const secs = Math.max(0, Math.round((M - p) / 20)), txt = '00:' + (secs < 10 ? '0' : '') + Math.min(59, secs);
        for (let q = E1 + 170; q < HALL - 60; q += 300) {   // the clock: it runs down on the way out, and up again on the way back
          const x = X(q); if (x < -50 || x > W + 50) continue;
          R(ctx, '#15171b', x - 2, Y(116), 4, 84); R(ctx, O, x - 36, Y(92), 72, 24); R(ctx, '#0f1114', x - 34, Y(94), 68, 20); R(ctx, col, x - 34, Y(94), 68, 1);
          drawText(ctx, txt, x, Y(98), { scale: 2, fill: (f >> 4) % 2 || secs > 9 ? hi : '#ffffff', outline: null, align: 'center' });
        }
      }
      if (c1 > HALL) {                                  // THE TURNSTILE HALL
        tile(ctx, A.bunker, Math.max(c0, HALL), c1, Y(TOP));
        const hx0 = X(HALL); R(ctx, '#0b0c0f', hx0, Y(TOP), 12, 164); R(ctx, '#3a3e48', hx0, Y(TOP), 1, 164);
        for (let q = Math.ceil((HALL + 30) / 64) * 64; q < c1; q += 64) { if (Math.abs(q - M) < 60) continue; const lc = q > M ? BLUE : RED; R(ctx, O, X(q) - 4, Y(100), 9, 6); R(ctx, lc, X(q) - 3, Y(101), 7, 4); ctx.globalAlpha = 0.08; for (let r = 4; r < 18; r += 4) R(ctx, lc, X(q) - r, Y(101), r * 2 + 1, r * 3); ctx.globalAlpha = 1; }
        drum(ctx, Y, f, false);
      }
    });
  }
  // the turnstile: a steel drum taller than the hero, turning. He runs in on the red side and comes out on the blue
  function drum(ctx, Y, f, front) {
    const cx = X(S.mid); if (cx < -60 || cx > W + 60) return;
    const top = Y(94), bot = Y(DECK), a0 = ((S.blue ? -1 : 1) * f) / 13, col = lite(), hi = liteHi();
    if (!front) {
      R(ctx, O, cx - 50, top - 20, 100, 20); R(ctx, '#3a3f4a', cx - 49, top - 19, 98, 18); R(ctx, '#6a7282', cx - 49, top - 19, 98, 1);
      R(ctx, O, cx - 42, top - 14, 24, 9); R(ctx, S.blue ? '#4a1612' : (f >> 3) % 2 ? '#ffffff' : RED_HI, cx - 41, top - 13, 22, 7);
      R(ctx, O, cx + 18, top - 14, 24, 9); R(ctx, !S.blue ? '#12233c' : (f >> 3) % 2 ? '#ffffff' : BLUE_HI, cx + 19, top - 13, 22, 7);
      R(ctx, '#08090c', cx - 44, top, 88, bot - top); ctx.globalAlpha = 0.3; R(ctx, col, cx - 44, top, 88, bot - top); ctx.globalAlpha = 0.25; R(ctx, hi, cx - 20, top, 40, bot - top); ctx.globalAlpha = 1;
      for (let k = 0; k < 8; k++) { const a = a0 + (k * TAU) / 8; if (Math.cos(a) < 0) R(ctx, '#2a2e38', cx + Math.sin(a) * 42 - 1, top, 2, bot - top); }
      return;
    }
    for (let k = 0; k < 8; k++) { const a = a0 + (k * TAU) / 8; if (Math.cos(a) < 0) continue; const bx = Math.round(cx + Math.sin(a) * 42); R(ctx, O, bx - 2, top, 5, bot - top); R(ctx, '#9aa2b0', bx - 1, top, 3, bot - top); R(ctx, '#eef2f8', bx - 1, top, 1, bot - top); R(ctx, hi, bx - 1, top + 12, 3, 5); R(ctx, hi, bx - 1, bot - 22, 3, 5); }
    R(ctx, O, cx - 47, top - 2, 94, 7); R(ctx, '#7a8292', cx - 46, top - 1, 92, 5); R(ctx, '#dfe6ee', cx - 46, top - 1, 92, 1);
    R(ctx, O, cx - 47, bot - 3, 94, 4); R(ctx, '#7a8292', cx - 46, bot - 2, 92, 2);
  }
  function deckFx(ctx, s, Y, f) {
    sync(s); const A = art(), y = Y(DECK), c0 = S.cam - 30, c1 = S.cam + W + 30, HALL = S.mid - F.pre - 40;
    unflip(ctx, () => { tile(ctx, env.deck, c0, S.E0, y);
      { const a = Math.max(c0, S.E0), b = Math.min(c1, S.E1); if (b > a) { ctx.save(); ctx.beginPath(); ctx.rect(X(a), y, b - a, 90); ctx.clip(); roadBed(ctx, X(a), X(b), S.cam, Y, f, S.blue); ctx.restore(); } }
      tile(ctx, A.lorry, Math.max(c0, S.E0), S.E1, y); tile(ctx, A.street, Math.max(c0, S.E1), HALL, y); tile(ctx, env.deck, Math.max(c0, HALL), c1, y); });
  }
  function pitFx(ctx, s, Y, f) {
    sync(s); const y = Y(DECK);
    unflip(ctx, () => {
      R(ctx, '#0a0c11', -20, y, W + 40, 90);
      const a = X(S.E0 - 14), b = X(S.E1 + 8);          // the road going by under the convoy
      if (b > -10 && a < W + 10) { ctx.save(); ctx.beginPath(); ctx.rect(a, y, b - a, 90); ctx.clip(); R(ctx, '#07080b', a, y, b - a, 90); roadBed(ctx, a, b, S.cam, Y, f, S.blue); ctx.restore(); }
      const c = X(S.E1 + 8), d = X(S.mid - F.pre - 40);  // the crater under the battlefield
      if (d > -10 && c < W + 10) for (let q = Math.floor((S.cam - 10) / 9) * 9; q < S.cam + W + 10; q += 9) {
        if (q < S.E1 + 8) continue; const h = 6 + Math.floor(hash(q, 4) * 14), x = X(q);
        R(ctx, '#1c1a19', x, y + 34 - h, 9, 60); R(ctx, '#2e2b29', x, y + 34 - h, 6, 1);
        if (hash(q, 7) > 0.6 && (f + q) % 50 < 34) R(ctx, S.blue ? BLUE_HI : (f >> 2) % 2 ? '#ffb03a' : '#ff5a1a', x + 3, y + 30 - h - (S.blue ? 0 : ((f + q) % 50) >> 2), 1, 1);
      }
    });
  }
  // ---- what you stand on ----
  function crateBlock(ctx, x, y, w, h) {
    R(ctx, O, x - 1, y - 1, w + 2, h + 1); R(ctx, '#9a7848', x, y, w, h); R(ctx, '#f8e8c0', x, y, w, 1); R(ctx, '#c8a468', x, y + 1, w, 2); R(ctx, '#6a5030', x, y + h - 2, w, 2);
    for (let i = 0; i < w; i += Math.max(8, Math.round(w / 4))) R(ctx, '#6a5030', x + i, y + 3, 1, h - 3); R(ctx, '#6a5030', x + w - 1, y + 3, 1, h - 3);
    for (let i = 3; i < Math.min(w, h) - 3; i += 1) R(ctx, '#7c6038', x + i, y + i, 2, 1);
    for (let b = 0; b + 9 < w - 6; b += 9) { R(ctx, O, x + 4 + b, y - 5, 9, 5); R(ctx, '#d8a820', x + 5 + b, y - 4, 7, 4); R(ctx, '#fff0a0', x + 5 + b, y - 4, 7, 1); }   // gold on top
  }
  function vehicle(ctx, p, x, y, w, f, Y) {
    const fire = p.kind === 'moveh', bot = Y(LAVA) + 9, h = bot - y, v = p.id % 3, cab = x + w - 14;
    const C = fire ? ['#e8372a', '#a81c18', '#ff9a80'] : v === 0 ? ['#d6dce4', '#9aa4b2', '#ffffff'] : v === 1 ? ['#e0a030', '#a87418', '#ffe090'] : ['#5a9ad0', '#3a6a9a', '#b8dcff'];
    R(ctx, O, x - 1, y - 1, w + 2, h + 1); R(ctx, C[0], x, y, w, h); R(ctx, C[1], x, y + Math.max(8, h - 12), w, 12);
    for (let i = 7; i < w - 18; i += 9) R(ctx, C[1], x + i, y + 4, 1, h - 4);
    R(ctx, '#ffffff', x, y, w, 1); R(ctx, C[2], x, y + 1, w, 2);
    R(ctx, O, cab - 1, y + 3, 1, h - 3); R(ctx, O, cab + 2, y + 5, 11, 9); R(ctx, '#12233a', cab + 3, y + 6, 9, 7); R(ctx, '#8ac8ff', cab + 4, y + 6, 3, 1); R(ctx, '#8ac8ff', cab + 9, y + 8, 2, 1);
    R(ctx, O, x + w - 3, y + 17, 3, 5); R(ctx, '#fff4a0', x + w - 2, y + 18, 2, 3);
    if (fire) {
      R(ctx, '#f4f4f4', x, y + 15, w - 15, 3); R(ctx, '#ffd21a', x, y + 18, w - 15, 1);
      R(ctx, O, x + 2, y - 4, w - 20, 3); for (let i = 3; i < w - 19; i += 3) R(ctx, '#d8dee6', x + i, y - 3, 2, 1);
      const on = (f >> 2) % 2; R(ctx, O, cab + 3, y - 6, 8, 6); R(ctx, on ? '#ffffff' : '#2a6ad0', cab + 4, y - 5, 3, 4); R(ctx, on ? '#2a6ad0' : '#ffffff', cab + 7, y - 5, 3, 4);
      if (on) { ctx.globalAlpha = 0.22; R(ctx, '#8ac8ff', cab - 2, y - 11, 18, 10); ctx.globalAlpha = 1; }
    }
    for (const wx of [x + 9, x + w - 10]) { disc(ctx, wx, bot - 4, 6, O); disc(ctx, wx, bot - 4, 4, '#3a3e48'); const a = (S.blue ? -f : f) / 2; R(ctx, '#d8dce4', wx + Math.cos(a) * 2, bot - 4 + Math.sin(a) * 2, 1, 1); }
  }
  const piece = (ctx, x, y, w) => { R(ctx, O, x - 1, y - 1, w + 2, 14); R(ctx, '#fff8e6', x, y, w, 1); R(ctx, '#ddd3bd', x, y + 1, w, 2); R(ctx, '#a39a84', x, y + 3, w, 7); R(ctx, '#5a5446', x, y + 10, w, 2); R(ctx, '#7c7462', x + 3, y + 5, 3, 1); if (w > 14) R(ctx, '#7c7462', x + w - 8, y + 8, 4, 1); };
  function slab(ctx, p, x, y, w, f, Y) {
    const y0 = Y(p.y / FPX), cx = x + (w >> 1), hi = liteHi(), hot = S.blue ? '#ffffff' : '#ffd24a';
    if (p.gone) {                                       // it has gone: out (red) it blows; back (blue) it flies apart cold
      const t = p.fallT || 0; if (t > 30) return;
      if (t < 9) { disc(ctx, cx, y0 + 3, 7 + t * 3, O); disc(ctx, cx, y0 + 3, 6 + t * 3, S.blue ? BLUE_HI : '#ff7a1a'); disc(ctx, cx, y0 + 3, 3 + t * 2, hot); if (t < 4) disc(ctx, cx, y0 + 3, 2 + t * 2, '#ffffff'); }
      for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU + 0.5, d = t * 2.6, px = cx + Math.cos(a) * d, py = y0 + Math.sin(a) * d * 0.7 + t * t * 0.06; R(ctx, O, px - 3, py - 3, 7, 6); R(ctx, k % 2 ? '#9a917c' : '#d8ceb8', px - 2, py - 2, 5, 4); }
      return;
    }
    R(ctx, O, cx - 9, y0 + 16, 18, 70); R(ctx, '#6c6556', cx - 8, y0 + 16, 16, 70); R(ctx, '#9a917c', cx - 8, y0 + 16, 4, 70); R(ctx, '#4a4438', cx + 4, y0 + 16, 4, 70);   // the pier
    R(ctx, O, cx - 13, y0 + 11, 26, 7); R(ctx, '#8a8270', cx - 12, y0 + 12, 24, 5); R(ctx, '#b8ae98', cx - 12, y0 + 12, 24, 1);
    const k = S.blue && p.crumble < 0 ? cl((x - HX - 80) / 70) : 0;   // on the way back it lies in bits below until you are close, then puts itself together
    if (k > 0) {
      const n = 4, pw = Math.floor(w / n);
      for (let i = 0; i < n; i++) { const ki = cl(k * 1.25 - i * 0.08), fx = x + i * pw, hx = cx - 16 + i * 8, hy = Y(LAVA) + 2 - (i % 2) * 9; piece(ctx, fx + (hx - fx) * ki, y0 + (hy - y0) * ki - Math.sin(ki * Math.PI) * 16, i === n - 1 ? w - pw * (n - 1) : pw); }
      ctx.fillStyle = (f >> 2) % 2 ? '#ffffff' : hi; for (let i = (f >> 1) % 4; i < w; i += 4) ctx.fillRect(x + i, y0, 2, 1);   // where it WILL be: land here
      R(ctx, hi, x - 1, y0, 1, 5); R(ctx, hi, x + w, y0, 1, 5);
      return;
    }
    const sh = p.crumble > 0, jx = sh ? (f % 3) - 1 : 0, jy = sh && f % 4 < 2 ? 1 : 0;
    piece(ctx, x + jx, y0 + jy, w); R(ctx, '#d87a3a', x + jx - 4, y0 + jy + 5, 4, 1); R(ctx, '#d87a3a', x + jx + w, y0 + jy + 7, 5, 1); R(ctx, '#d87a3a', x + jx + w, y0 + jy + 4, 3, 1);
    const left = p.crumble < 0 ? 3 : Math.ceil(p.crumble / 6);   // three lamps: they go out one by one once you are on it, then it blows
    for (let i = 0; i < 3; i++) { const lx = cx - 12 + i * 9 + jx; R(ctx, O, lx - 1, y0 + jy + 3, 7, 7); R(ctx, i < left ? (sh && (f >> 1) % 2 ? '#ffffff' : sh ? '#ff3a2a' : S.blue ? BLUE_HI : '#ffb03a') : '#1a1a1a', lx, y0 + jy + 4, 5, 5); if (i < left) R(ctx, '#ffffff', lx, y0 + jy + 4, 2, 1); }
  }
  function drawPlat(ctx, p, x, y, w, f, Y) {
    const zp = p.x / FPX - S.z0 + w / 2, pc = S.blue ? 2 * S.mid - zp : zp;
    if (p.kind === 'crumble') return slab(ctx, p, x, y, w, f, Y);
    if (p.veh && p.veh !== 'pallet') return drawVehicle(ctx, p, x, y, w, f, Y, S.blue);
    if (p.kind === 'step') return crateBlock(ctx, x, y, w, 33);
    return env.drawPlat(ctx, p, x, y, w, f, Y);
  }
  // ---- the wash: warm on the way out, cold on the way back; and your earlier self ----
  const PASS = () => [S.E1 + 430, S.E1 + 150, S.E1 - 170, S.E0 + 170, S.E0 - 120];
  function ghostAt() { if (!S.blue || !HS) return null; for (const c of PASS()) { const p = S.ph; if (p >= c - 44 && p <= c + 136) return { q: Math.round(2 * c - p), a: cl(Math.min(p - (c - 44), c + 136 - p) / 24), first: c === PASS()[0] }; } return null; }
  function gradeFx(ctx, s, Y, f) {
    sync(s);
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = S.blue ? '#6a98f4' : '#ffa080'; ctx.fillRect(-20, -40, W + 40, 300); ctx.restore();
    if (!VIG) {                                         // the edges of the picture burn in the half's colour: red going out, blue coming back
      VIG = [RED, BLUE].map((col) => { const c = cv(W, 180), x = c.getContext('2d'); for (let j = 0; j < 180; j++) for (let i = 0; i < W; i += 2) { const dx = Math.abs(i - W / 2) / (W / 2), dy = Math.abs(j - 90) / 90, d = Math.max(0, Math.max(dx, dy * 0.8) - 0.74) / 0.26; if (d > 0) { x.globalAlpha = Math.min(0.32, d * d * 0.34); x.fillStyle = col; x.fillRect(i, j, 2, 1); } } return c; });
    }
    ctx.drawImage(VIG[S.blue ? 1 : 0], 0, 0);           // (screen space: the wash is drawn before the world is shifted by the camera's fraction; it is symmetric, so the mirror does not matter)
    const g = ghostAt(); if (!g || g.q < 4 || g.q > ZONE - 10) return;
    unflip(ctx, () => {                                 // YOU, on the way out: the same jumps in the same places, going the other way
      const y = yrec[g.q], y1 = yrec[g.q + 4], fr = y1 < y - 0.4 ? HS.red.jump : y1 > y + 0.4 ? HS.red.fall : HS.red.run[Math.floor(g.q / 5) % HS.red.run.length], x = X(g.q);
      for (let k = 2; k > 0; k--) { const q2 = g.q - k * 7; ctx.globalAlpha = g.a * 0.16 * (3 - k); ctx.drawImage(fr.c, Math.round(x - k * 7 - fr.ox), Math.round(Y(yrec[Math.max(0, q2)]) - fr.oy)); }
      ctx.globalAlpha = g.a * ((f >> 1) % 2 ? 0.95 : 0.75); ctx.drawImage(fr.c, Math.round(x - fr.ox), Math.round(Y(y) - fr.oy)); ctx.globalAlpha = 1;
    });
  }
  function maskOn(fr) {                                 // breathing his own air: a respirator under the shades, a hose to the chest. His jacket stays copper
    const c = cv(fr.c.width, fr.c.height), x = c.getContext('2d'); x.drawImage(fr.c, 0, 0);
    const d = fr.c.getContext('2d').getImageData(0, 0, fr.c.width, fr.c.height).data; let ex = -1, ey = -1;
    for (let j = 0; j < Math.min(26, fr.c.height) && ex < 0; j++) for (let i = fr.c.width - 1; i >= 0; i--) { const o = (j * fr.c.width + i) * 4; if (d[o + 3] && d[o] === 0x9c && d[o + 1] === 0xc8 && d[o + 2] === 0xf0) { ex = i; ey = j; break; } }
    if (ex < 0) return fr;
    R(x, '#0a1a30', ex - 3, ey + 2, 6, 5); R(x, '#dff0ff', ex - 2, ey + 3, 4, 3); R(x, '#5ac8ff', ex - 1, ey + 4, 2, 1); R(x, '#ffffff', ex - 2, ey + 3, 1, 1);
    R(x, '#0a1a30', ex - 6, ey + 5, 3, 1); R(x, '#dff0ff', ex - 5, ey + 6, 1, 3); R(x, '#0a1a30', ex - 6, ey + 6, 1, 3); R(x, '#0a1a30', ex - 4, ey + 6, 1, 3);
    return { c, ox: fr.ox, oy: fr.oy };
  }
  function heroFx(hero, s) {
    if (!HS || HS.of !== hero) {
      const each = (fn) => { const o = {}; for (const k of Object.keys(hero)) { const v = hero[k]; o[k] = Array.isArray(v) ? v.map((q) => (q && q.c ? fn(q) : q)) : v && v.c ? fn(v) : v; } return o; };
      try { HS = { of: hero, mask: each(maskOn), red: each((q) => tint(q, '#ff2a1a', 0.72)) }; } catch (e) { HS = { of: hero, mask: hero, red: hero }; }
    }
    return S.blue ? HS.mask : null;
  }
  // ---- over everything: the drum's near bars, the cut at the turnstile, the first-time calls ----
  function frontFx(ctx, f, fdist, cam, s) {
    sync(s); const Y = (wy) => Math.round(wy - cam);
    unflip(ctx, () => {
      drum(ctx, Y, f, true);
      for (let k = 0; k < 14; k++) {                    // embers drifting down on the way out; on the way back the rain falls UP
        const t = f * (2 + (k % 3)) + k * 61, lp = Math.floor(t / 230), yy = t % 230, x = Math.floor(hash(k, lp) * 380) - 30;
        if (S.blue) { ctx.globalAlpha = 0.55; R(ctx, '#8ab4ff', x + yy * 0.24, 196 - yy, 1, 3); } else { ctx.globalAlpha = 0.7; R(ctx, k % 2 ? '#ffb03a' : '#ff6a2a', x - yy * 0.2 + Math.sin((f + k * 9) / 11) * 3, yy - 20, 1, 1); }
      }
      ctx.globalAlpha = 1;
      const d = S.zp - S.mid;
      if (S.live && d > -96 && d < 96) {                // the cut: the picture closes on him in red, and opens again in blue
        const r = Math.round((Math.abs(d) / 96) * 215), cx = S.hx, cy = Y(S.fy) - 16, col = (f >> 1) % 2 ? '#ffffff' : liteHi();
        for (let y = -8; y < 190; y++) { const dy = y - cy, hw = dy * dy < r * r ? Math.round(Math.sqrt(r * r - dy * dy)) : -1; if (hw < 0) { R(ctx, O, -20, y, W + 40, 1); continue; } R(ctx, O, -20, y, cx - hw + 20, 1); R(ctx, O, cx + hw, y, W + 40, 1); R(ctx, col, cx - hw - 2, y, 2, 1); R(ctx, col, cx + hw, y, 2, 1); }
      }
      if (S.blue && d > 14 && d < (S.lap ? 150 : 96) && (d > 60 || (f >> 2) % 2)) drawText(ctx, 'INVERTED', W / 2, 26, { scale: 2, fill: GRAD.blue, outline: O, shadow: O, align: 'center' });
      if (S.lap || !S.live) return;
      { const g = ghostAt(); if (g && g.first && g.a > 0.5 && g.q >= 4 && g.q <= ZONE - 10) drawText(ctx, 'YOU, EARLIER', cl(X(g.q), 44, W - 44), Y(yrec[g.q]) - 48, { fill: '#ff8a6a', outline: O, align: 'center' }); }
      const say = (t, y, fill) => { ctx.globalAlpha = 0.78; R(ctx, O, W / 2 - t.length * 3 - 6, y - 4, t.length * 6 + 12, 14); ctx.globalAlpha = 1; drawText(ctx, t, W / 2, y, { fill: (f >> 3) % 4 ? fill || GRAD.gold : GRAD.white, outline: O, align: 'center' }); };   // on a dark plate: nothing behind it can muddle it
      if (!S.blue && S.ph > S.E1 - 170 && S.ph < S.E1 + 40) say('THEY BLOW ONCE YOU LAND: KEEP MOVING', 34);
      if (S.blue && S.ph < S.E1 + 470 && S.ph > S.E1 + 290) say('THEY PUT THEMSELVES BACK: LAND ON THEM', 34);
      if (S.blue) for (const g of s.goblins) {          // the first shot that comes from behind
        if (g.kind !== 'gunner' || g.hole === undefined || g.fired || g.dead) continue;
        const hx = W - Math.round((g.hole - s.dist) / FPX) - 22; if (d < 96 || hx < 20 || hx > W + 40 || S.zp > S.mid + 900) break;
        const b = Math.round(Math.sin(f / 5) * 2); drawText(ctx, 'JUMP HERE', cl(hx, 34, W - 34), Y(DECK) - 62 + b, { fill: (f >> 2) % 2 ? GRAD.white : GRAD.gold, outline: O, align: 'center' });
        for (let i = 0; i < 4; i++) { R(ctx, O, hx - 4 + i, Y(DECK) - 50 + b + i * 2 - 1, 9 - i * 2, 4); R(ctx, '#ffd21a', hx - 3 + i, Y(DECK) - 50 + b + i * 2, 7 - i * 2, 2); }
        say('HIS BULLET COMES FROM BEHIND YOU', 34); break;
      }
    });
  }
  // the red half has its own fire and its own bullets; the blue half keeps the level's inverted ones
  const T = env.FXT, fx = Object.assign({}, T, {
    vent(ctx, x, y, st, f, z) {
      if (S.blue) return T.vent(ctx, x, y, st, f, z);
      R(ctx, O, x - 9, y - 2, 18, 3); R(ctx, '#3a2a22', x - 8, y - 1, 16, 1); R(ctx, (f >> 2) % 2 ? '#ff8a1a' : '#c8401a', x - 5, y - 2, 10, 1);
      if (st.warn > 0) { for (let i = 0; i < 6; i++) { const a = (f * 0.09 + i * 0.31) % 1, sx = x - 6 + i * 2.4 + Math.sin(i * 2.2) * 3, sy = y - 3 - a * (10 + st.warn * 22); R(ctx, O, sx - 1, sy - 1, 3, 3); R(ctx, i % 2 ? '#ffffff' : '#ffd24a', sx, sy, 1, 1); } disc(ctx, x, y - 4, 2 + Math.round(st.warn * 3), O); disc(ctx, x, y - 4, 1 + Math.round(st.warn * 3), (f >> 1) % 2 ? '#ffffff' : '#ff8a1a'); }
      if (!st.on) return;
      const h = st.h, w = (j) => Math.max(1, Math.min(5, 3 + ((j * 5 + f * 3) % 3) - (j > h - 5 ? j - (h - 5) : 0) + (j < 3 ? 1 : 0)));
      for (let j = 0; j < h; j++) R(ctx, O, x - w(j) - 1, y - 2 - j, w(j) * 2 + 2, 1); R(ctx, O, x - 2, y - 3 - h, 4, 1);
      for (let j = 0; j < h; j++) { const ww = w(j); R(ctx, (j + (f >> 1)) % 5 < 2 ? '#ff5a1a' : '#ff8a1a', x - ww, y - 2 - j, ww * 2, 1); if (ww > 1) R(ctx, '#ffd24a', x - ww + 1, y - 2 - j, ww * 2 - 2, 1); if (j < h * 0.6) R(ctx, '#ffffff', x - 1, y - 2 - j, 2, 1); }
    },
    shot(ctx, x, y, f, b, z) {
      if (S.blue || b.rev) return T.shot(ctx, x, y, f, b, z);
      R(ctx, O, x - 6, y - 3, 26, 6); for (let t = 0; t < 6; t++) R(ctx, t < 2 ? '#ffd24a' : t < 4 ? '#ff8a1a' : RED, x + 4 + t * 3, y - 1, 3, 2);
      R(ctx, O, x - 6, y - 4, 11, 8); R(ctx, (f >> 1) % 2 ? '#ffffff' : '#ffd24a', x - 5, y - 3, 9, 6); R(ctx, '#ffffff', x - 5, y - 2, 4, 4);
    },
    aim(ctx, x0, x1, y, f, k, z) {
      if (S.blue) return T.aim(ctx, x0, x1, y, f, k, z);
      if (k < 0.5 && (f >> 2) % 2) return; ctx.fillStyle = k > 0.8 ? '#ffffff' : '#ff3030'; for (let i = x0 + (f % 6); i < x1; i += 6) ctx.fillRect(i, y, 3, 1);
    },
  });
  return { mirror: (s) => sync(s), sceneFx, deckFx, pitFx, gradeFx, heroFx, frontFx, drawPlat, fx };
}

// the one card of the level: shown the first time he comes out of the turnstile (loop 1 only; main.js)
export function invCard(ctx, t) {
  ctx.save();
  ctx.globalAlpha = 0.86; R(ctx, '#02040a', 0, 0, W, 180); ctx.globalAlpha = 1;
  R(ctx, O, 22, 14, W - 44, 152); for (const [x, y, w, h] of [[23, 15, W - 46, 1], [23, 164, W - 46, 1], [23, 15, 1, 150], [W - 24, 15, 1, 150]]) R(ctx, BLUE, x, y, w, h);
  drawText(ctx, 'INVERTED', W / 2, 26, { scale: 4, fill: GRAD.blue, outline: O, shadow: O, align: 'center' });
  const o = (t >> 2) % 6;
  for (let k = 0; k < 5; k++) { const x = 200 - k * 20 - o * 3, a = k === 0 ? 1 - o / 6 : 1; ctx.globalAlpha = a; for (let i = 0; i < 6; i++) { R(ctx, BLUE_HI, x + i, 64 + i - 5 + 5 - 2 * i + i, 3, 1); R(ctx, BLUE_HI, x + i, 64 + 5 - (5 - i), 3, 1); R(ctx, BLUE_HI, x + i, 74 - i, 3, 1); } }
  ctx.globalAlpha = 1;
  drawText(ctx, 'YOU ARE RUNNING BACK', W / 2, 86, { scale: 2, fill: GRAD.gold, outline: O, align: 'center' });
  drawText(ctx, 'EVERYTHING REWINDS', W / 2, 106, { scale: 2, fill: GRAD.white, outline: O, align: 'center' });
  drawText(ctx, 'WATCH BEHIND YOU', W / 2, 126, { scale: 2, fill: GRAD.white, outline: O, align: 'center' });
  if (t > 45 && (t >> 4) % 3) drawText(ctx, 'SAME BUTTON. TAP TO GO ON', W / 2, 150, { fill: '#b8c8e0', outline: O, align: 'center' });
  ctx.restore();
}
