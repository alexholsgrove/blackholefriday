// ---------- NEON RAIN art: the city behind the street. An original take on the rain-soaked megacity of the replicant-hunter films:
// smog sky, flame stacks, a stepped-pyramid megastructure, flying police cars, an ad blimp, a face on a building, a giant hologram. ----------
import { cv, hash, dith, noise, sky, vgrad, drawText, px } from '../kit.js';
import { LOGO } from '../../../logo-masks.js';

const W = 320;
const mk = (w, h) => { const c = cv(w, h); return [c, c.getContext('2d')]; };
const RR = (x) => (col, x0, y0, w, h) => { x.fillStyle = col; x.fillRect(x0, y0, w, h); };
const disc = (ctx, cx, cy, r, col) => { ctx.fillStyle = col; for (let j = -r; j <= r; j++) { const w = Math.floor(Math.sqrt(r * r - j * j + 0.6)); ctx.fillRect(Math.round(cx - w), Math.round(cy + j), w * 2 + 1, 1); } };
const flipC = (c) => { const [o, x] = mk(c.width, c.height); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); return o; };
const mix = (a, b, t) => { const p = (s, i) => parseInt(s.slice(1 + i * 2, 3 + i * 2), 16); return '#' + [0, 1, 2].map((i) => Math.round(p(a, i) + (p(b, i) - p(a, i)) * t).toString(16).padStart(2, '0')).join(''); };

// ================= the giant hologram: a translucent woman as tall as the towers, built from scanlines =================
// sway -1..1: the walk. pt 0..1: she raises an arm to point down and to screen-left, and turns her head that way. s: scale (built at size, so the scanlines stay crisp)
const HW = 72, HH = 156;
function holoFigure(sway, pt = 0, s = 1) {
  const w = Math.ceil(HW * s), h = Math.ceil(HH * s), [c, x] = mk(w, h), cx = 36 + sway * 2.2, sx = 36 - sway * 1.2, hx = sx - pt * 1.8, hy = 12 + pt * 0.8;
  const seg = (ax, ay, bx, by, r0, r1 = r0) => (u, v) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((u - ax) * dx + (v - ay) * dy) / (dx * dx + dy * dy))); return Math.hypot(u - ax - dx * t, v - ay - dy * t) - (r0 + (r1 - r0) * t); };
  const ell = (ex, ey, rx, ry) => (u, v) => (Math.hypot((u - ex) / rx, (v - ey) / ry) - 1) * Math.min(rx, ry);
  const kl = cx - 5.5 - sway * 1.6, kr = cx + 5.5 - sway * 1.6, L = (a, b) => a + (b - a) * pt;
  const ex = L(sx - 14, sx - 21), ey = L(48, 38.5), hdx = L(sx - 12 + sway * 2, sx - 31), hdy = L(67, 46.5);
  const skin = [ell(hx, hy, 6.2, 8.2), seg((hx + sx) / 2, 19, sx, 26, 2.6),
    seg(sx - 10, 30, ex, ey, 3.1, 2.7), seg(ex, ey, hdx, hdy, 2.7, 2.1),                                  // the arm that hangs, or points
    seg(sx + 10, 30, sx + 18, 45, 3.1, 2.7), seg(sx + 18, 45, cx + 9, 56, 2.7, 2.2),                      // hand on her hip
    seg(cx - 5, 78, kl, 113, 5.6, 4.2), seg(kl, 113, cx - 6.5, 147, 4.2, 2.7), seg(cx - 6.5, 149, cx - 10, 152, 2.2),
    seg(cx + 5, 78, kr, 113, 5.6, 4.2), seg(kr, 113, cx + 5, 147, 4.2, 2.7), seg(cx + 5, 149, cx + 2, 152, 2.2)];
  if (pt > 0.9) skin.push(seg(hdx, hdy, hdx - 3.6, hdy + 2.2, 1.1));                                      // a finger
  const dress = [seg(sx - 8.5, 29.5, sx + 8.5, 29.5, 4.4), seg(sx, 31, cx, 52, 9.6, 7), seg(cx, 53, cx, 84, 8.2, 15.5)];
  const hairO = ell(hx + 0.4 + pt, hy - 1.5, 9, 10.5), faceO = ell(hx - 0.6 - pt * 1.8, hy + 2, 5, 7.4);
  const top = '#ff72cc', bot = '#8f70ff', eyeX = hx - pt * 1.4;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = (i + 0.5) / s, v = (j + 0.5) / s, dS = Math.min(...skin.map((f) => f(u, v))), dD = Math.min(...dress.map((f) => f(u, v))), hair = hairO(u, v) < 0 && faceO(u, v) > 0 && v < hy + 10;
    const d = Math.min(dS, dD, hair ? hairO(u, v) : 9);
    if (d >= 0) continue;
    if (v > 84 && dD < 0 && dS >= 0) continue;                                           // the hem is a clean line
    const base = mix(top, bot, j / h), rim = d > -1.1;
    let col, a;
    if (hair) { col = mix(base, '#4a2ad0', 0.6); a = 0.95; } else if (dD < 0) { col = mix(base, '#ffffff', 0.28); a = 0.95; } else { col = base; a = 0.62; }
    if (rim) { col = mix(base, '#ffffff', 0.72); a = 1; }
    if (!hair && Math.abs(v - hy - 0.5) < 1 && (Math.abs(u - (eyeX - 2.6)) < 1.1 || Math.abs(u - (eyeX + 2.4)) < 1.1)) continue;   // eyes: two gaps in the light
    if (j % 2) a *= 0.34;                                                                // scanlines
    x.globalAlpha = a; x.fillStyle = col; x.fillRect(i, j, 1, 1);
  }
  x.globalAlpha = 1; x.fillStyle = '#ffe6f6'; x.fillRect(Math.round((eyeX - 2) * s), Math.round((hy + 4) * s), Math.round(3 * s), 1);   // mouth
  return c;
}

// a small one for a street ad: the same figure shrunk, cyan
function holoSmall(src) {
  const [c, x] = mk(20, 42); x.imageSmoothingEnabled = false; x.drawImage(src, 0, 0, src.width, src.height, 0, 0, 20, 42);
  x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(74,240,255,0.75)'; x.fillRect(0, 0, 20, 42); x.globalCompositeOperation = 'destination-out';
  for (let j = 1; j < 42; j += 2) { x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(0, j, 20, 1); }
  return c;
}

// ================= a face on a building: a video billboard (original face: a woman with a fringe, eyes that open and close) =================
function billboard(w, h, closed) {
  const [c, x] = mk(w, h), T = ['#1c0a1e', '#3c1634', '#642852', '#8e3c70', '#b0548a'];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = (i + 0.5 - w * 0.5) / (w * 0.5), v = (j + 0.5 - h * 0.46) / (h * 0.5);
    let t = 0;                                                                            // 0 = backdrop
    const face = (u * u) / 0.5 + (v * v) / 0.74 < 1, neck = Math.abs(u + 0.02) < 0.3 && v > 0.5, shoulders = v > 0.86 + Math.abs(u) * 0.12;
    if (shoulders) t = 1; if (neck) t = 2;
    if (face) { t = 3 - (u > 0.28 ? 1 : 0) + (u < -0.3 && v < 0.4 ? 1 : 0); if (v > 0.62) t = Math.max(2, t - 1); }
    const fringe = v < -0.42 + 0.07 * Math.cos(u * 9) && (u * u) / 0.62 + ((v + 0.1) * (v + 0.1)) / 0.86 < 1, sides = Math.abs(u) > 0.6 - Math.max(0, -v) * 0.1 && (u * u) / 0.74 + ((v + 0.05) * (v + 0.05)) / 0.9 < 1 && v < 0.52;
    if (fringe || sides) t = (i + j * 3) % 7 === 0 ? 1 : 0.5;
    if (face && !fringe && !sides) {
      const ex = Math.abs(u) - 0.36, eyeY = v + 0.1;
      if (!closed && (ex * ex) / 0.036 + (eyeY * eyeY) / 0.0042 < 1) t = Math.abs(ex + 0.02) < 0.07 ? 0 : 5;        // eye: dark iris, lit white
      else if ((ex * ex) / 0.045 + ((eyeY + (closed ? -0.03 : 0.045)) * (eyeY + (closed ? -0.03 : 0.045))) / 0.0016 < 1) t = 0.5;   // lash line
      if (Math.abs(ex) < 0.2 && Math.abs(v + 0.27 - ex * 0.12) < 0.022) t = 1;                                        // brow
      if (u > 0.02 && u < 0.09 && v > 0.02 && v < 0.3) t = 2; if (Math.abs(u - 0.02) < 0.1 && Math.abs(v - 0.33) < 0.02) t = 1.5;   // nose
      const lw = 0.26 - Math.abs(v - 0.52) * 2.4; if (Math.abs(u) < lw && Math.abs(v - 0.52) < 0.075) t = v < 0.52 ? 6 : 7;        // lips
    }
    let col = t === 0 ? T[0] : t === 0.5 ? '#12061a' : t === 1 ? T[1] : t === 1.5 ? '#522044' : t === 5 ? '#d8a8cc' : t === 6 ? '#7a1c4a' : t === 7 ? '#b8306a' : T[Math.min(4, t)];
    if (t === 0 && hash(i >> 1, j >> 2) > 0.82) col = '#2a1030';
    x.fillStyle = col; x.fillRect(i, j, 1, 1);
    if (j % 2) { x.fillStyle = 'rgba(8,2,12,0.34)'; x.fillRect(i, j, 1, 1); }
  }
  return c;
}

// ================= the vehicles =================
const SPAL = { k: '#020408', b: '#2c4058', B: '#5a7896', d: '#121c26', c: '#123a44', w: '#5fb0be', s: '#8a9ab4', t: '#080c14', g: '#28323e' };
const outline = (c, col) => { const x = c.getContext('2d'), w = c.width, h = c.height, d = x.getImageData(0, 0, w, h).data, on = (i, j) => i >= 0 && j >= 0 && i < w && j < h && d[(j * w + i) * 4 + 3] > 0; x.fillStyle = col;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (!on(i, j) && (on(i - 1, j) || on(i + 1, j) || on(i, j - 1) || on(i, j + 1))) x.fillRect(i, j, 1, 1); return c; };
// faces left, 52 long. A wedge-nosed police flyer: bubble canopy well forward, a light bar on the roof, a tail fin, twin lift pods underneath.
// (the bar, the head and tail lights, the pod glow and the headlight cone are drawn live: see flyer() below)
function spinnerBig() {
  const [c, x] = mk(54, 16), P = SPAL, H = (col, x0, y, x1) => { x.fillStyle = col; x.fillRect(x0 + 1, y + 1, x1 - x0 + 1, 1); };
  H(P.g, 22, 0, 31); H(P.g, 19, 1, 33);
  H(P.c, 15, 2, 34); H(P.d, 30, 2, 34); H(P.c, 11, 3, 36); H(P.w, 13, 3, 16); H(P.d, 31, 3, 36); H(P.c, 8, 4, 38); H(P.w, 9, 4, 13); H(P.d, 32, 4, 38);
  for (let j = 2; j < 5; j++) H(P.k, 23, j, 23);
  H(P.B, 4, 5, 50); H(P.b, 2, 6, 51); H(P.B, 2, 6, 9); H(P.b, 0, 7, 51); H(P.s, 12, 7, 38); H(P.b, 0, 8, 51); H(P.d, 17, 8, 17); H(P.d, 33, 8, 33); H(P.b, 1, 9, 50); H(P.d, 3, 10, 48);
  for (let j = 1; j < 5; j++) { H(P.b, 49 - j, j, 50); H(P.B, 49 - j, j, 49 - j); }
  for (const p0 of [8, 35]) { H(P.t, p0, 11, p0 + 7); H(P.g, p0, 11, p0 + 7); H(P.t, p0, 12, p0 + 7); H(P.t, p0 + 1, 13, p0 + 6); }
  return outline(c, P.k);
}
function spinnerMid() {
  const [c, x] = mk(19, 7);
  px(x, 0, 0, [
    '.......kkkkkk......',
    '.....kkcccddkkk....',
    '..kkkBBBBBBBBBBkkk.',
    'kkbbbbsssssssbbbbbk',
    'kbbbbbbbbbbbbbbbbbk',
    '.kkttkkkkkkkkkttkk.'], SPAL);
  return c;
}
function blimpArt(glyph) {    // faces left: a fat dark hull, a strip of screen along its flank, fins, a gondola
  const [c, x] = mk(92, 30), R = RR(x);
  for (let j = 0; j < 20; j++) for (let i = 0; i < 86; i++) { const u = (i - 43) / 43, v = (j - 10) / 10, k = u < 0 ? 1 : 1.15 - u * 0.15; if (u * u + v * v * k < 1) { x.fillStyle = v < -0.55 ? '#2a3d44' : v < 0.2 ? '#162328' : '#0b1317'; x.fillRect(i, j + 2, 1, 1); } }
  for (let i = 8; i < 80; i += 9) for (let j = 0; j < 20; j++) { const u = (i - 43) / 43, v = (j - 10) / 10; if (u * u + v * v < 0.96) { x.fillStyle = 'rgba(4,8,10,0.5)'; x.fillRect(i, j + 2, 1, 1); } }   // gores
  for (let k = 0; k < 9; k++) { R('#0b1317', 78 + k, 3 - Math.min(k, 3), 2, 5 + Math.min(k, 3)); R('#0b1317', 78 + k, 16, 2, 4 + Math.min(k, 4)); } R('#2a3d44', 80, 0, 8, 1); R('#162328', 83, 10, 9, 4);   // fins
  R('#04080a', 22, 7, 44, 11); R('#1c0a1e', 23, 8, 42, 9);                                                                     // the screen (the ticker is drawn live)
  R('#04080a', 34, 22, 20, 6); R('#162328', 35, 23, 18, 4); R('#2a3d44', 35, 23, 18, 1); for (let i = 37; i < 52; i += 4) R('#c8a040', i, 25, 2, 1); R('#04080a', 38, 21, 1, 2); R('#04080a', 49, 21, 1, 2);
  const [t, tx] = mk(160, 9); for (let k = 0; k < 22; k++) glyph(tx, 2 + k * 7, 1, 300 + k, k % 5 === 0 ? '#ffd06a' : '#e860b0');
  return { c, ticker: t };
}

// ================= the VOLLEBAK ads: the real wordmark and V (logo-masks.js), and three real jackets drawn as empty hooded shells =================
// All of it is backdrop: drawn dim, behind scanlines, on screens and signs of the city. Nothing here is read by the sim.
const mask = (x, rows, x0, y0, col) => { x.fillStyle = col; rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '#') { let n = 1; while (row[i + n] === '#') n++; x.fillRect(x0 + i, y0 + j, n, 1); i += n - 1; } }); };
// the same mark as neon tube: only the edge of the shape is lit, the inside barely
const tube = (x, rows, x0, y0, col, dim) => { const on = (i, j) => rows[j] !== undefined && rows[j][i] === '#'; rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (on(i, j)) { x.fillStyle = on(i - 1, j) && on(i + 1, j) && on(i, j - 1) && on(i, j + 1) ? dim : col; x.fillRect(x0 + i, y0 + j, 1, 1); } }); };
const JW = 34, JH = 40;
const FMJ = ['#2a1006', '#55200e', '#863a14', '#b4561e', '#d8782c', '#f0a252', '#ffd6a2'], SOLD = ['#070b0a', '#0f1815', '#18251f', '#22352c'], SOLG = ['#1a6a38', '#34ac5c', '#5ee888', '#a4ffbc', '#e6ffec'];
const SQB = ['#030408', '#080a10', '#0e1018'], SQH = ['#3ae8ff', '#6a7aff', '#e04ae0', '#ff5a8a', '#ffc04a', '#6aff8a'];
const ramp = (pal, t) => { const k = Math.max(0, Math.min(0.9999, t)) * (pal.length - 1), i = Math.floor(k); return mix(pal[i], pal[i + 1], k - i); };
const wheel = (pal, t) => { const k = (((t % 1) + 1) % 1) * pal.length, i = Math.floor(k) % pal.length; return mix(pal[i], pal[(i + 1) % pal.length], k - Math.floor(k)); };
// kind 'fmj': the Full Metal Jacket, crinkled copper, a sheen crossing it (ph 0..1; -1 = no sheen). 'solar': the Solar Charged Jacket, a dark shell that glows green (ph = how charged).
// 'squid': the Black Squid Jacket, black with oil-slick colours sliding over the creases (ph 0..1, loops). s: scale (built at size, so it stays crisp).
// The shape: hood up and empty, shoulders, a zip down the front, the sleeves hanging clear of the body.
export function jacket(kind, ph, s = 1) {
  const w = Math.ceil(JW * s), h = Math.ceil(JH * s), [c, x] = mk(w, h), cx = 17;
  const seg = (ax, ay, bx, by, r0, r1) => (u, v) => { const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((u - ax) * dx + (v - ay) * dy) / (dx * dx + dy * dy))); return Math.hypot(u - ax - dx * t, v - ay - dy * t) - (r0 + (r1 - r0) * t); };
  const arms = [-1, 1].map((d) => seg(cx + d * 9.6, 14.8, cx + d * 13.9, 33.2, 3.2, 2.6));
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = (i + 0.5) / s, v = (j + 0.5) / s, au = Math.abs(u - cx);
    const hood = (Math.hypot((u - cx) / 5.2, (v - 6.2) / 6) - 1) * 5.2, hwB = Math.min(8.2 + Math.max(0, v - 16) * 0.02, 5.2 + (v - 11.4) * 2.1);
    const body = Math.max(au - hwB, 11.4 - v, v - 38.8), arm = Math.min(arms[0](u, v), arms[1](u, v)), sh = Math.max(au - 12.4, 11.4 + au * 0.14 - v, v - 16.5), d = Math.min(hood, body, arm, sh);
    if (d >= 0) continue;
    const open = Math.hypot((u - cx) / 2.9, (v - 6.6) / 3.6) < 1 && v < 9.4;                 // nobody in it: the hood is empty
    const zip = au < 0.62 && v > 9.4 && v < 38.8, cuff = arm < 0 && v > 33.6 && body >= 0;
    const crease = (body < 0 && body > -1 && v > 16.5 && arm < 1.2) || (arm < 0 && body >= 0 && au - hwB < 1 && v > 16.5) || (v > 36.6 && v < 37.5 && body < 0) || (hood < 0 && hood > -0.9 && v > 11.6 && au < 5) || cuff;
    const fa = hash(Math.floor((u + v * 0.55) / 2.3) + 40, Math.floor((v - u * 0.35) / 2.7) + 40), fb = hash(Math.floor(u * 1.1) + 7, Math.floor(v * 1.3) + 3), dd = u + v * 0.6;
    let t = 0.16 + 0.4 * fa + 0.14 * fb + 0.24 * (0.5 - (u - cx) / 22) + (d > -1 ? 0.1 : 0);
    let col;
    if (kind === 'fmj') { if (ph >= 0) t += Math.max(0, 1 - Math.abs(dd - (-8 + ph * 66)) / 6) * 0.5; col = open ? '#0c0503' : zip ? '#080404' : ramp(FMJ, crease ? t * 0.22 : t); }
    else if (kind === 'solar') { col = open ? mix('#030504', '#0c3018', ph) : zip ? mix('#020303', '#0e3a1c', ph) : mix(ramp(SOLD, crease ? t * 0.3 : t), ramp(SOLG, (crease ? t * 0.45 : t) * 0.8 + 0.2), ph); }
    else { const band = Math.max(0, 1 - Math.abs(((dd * 0.03 - ph) % 1 + 1.5) % 1 - 0.5) / 0.3), k = Math.max((fa - 0.6) / 0.4 * 0.75, band * (0.5 + 0.5 * fa), 0);   // highlights on the crinkles, and bands of colour that slide across
      const oil = wheel(SQH, dd * 0.05 + fa * 0.1 + ph * 2), lip = !open && v < 10.4 && Math.hypot((u - cx) / 3.9, (v - 6.6) / 4.6) < 1;                              // lip: the edge of the hood's opening
      col = open ? '#020208' : d > -1 || lip ? mix(oil, '#dfe8ff', lip ? 0.2 : 0.45) : zip || crease ? '#000000' : mix(ramp(SQB, t), oil, Math.min(1, k) * 0.9); }   // a thin light rim all round, so the black shape reads as a jacket
    x.fillStyle = col; x.fillRect(i, j, 1, 1);
  }
  return c;
}
// a line of ticker: the wordmark, then a product's name, round and round. Returned twice over so a window can be cut from anywhere in it
function adTicker(names, colW, colN) {
  let w = 0; for (const n of names) w += 65 + 10 + n.length * 6 + 12;
  const [c, x] = mk(w * 2, 9);
  for (let r = 0; r < 2; r++) { let X = r * w; for (const n of names) { mask(x, LOGO.W7, X, 1, colW); X += 75; drawText(x, n, X, 1, { fill: colN, outline: null }); X += n.length * 6 + 12; } }
  return { c, w };
}

// ================= build the lot =================
// Composed for the camera you get standing on the deck (cam 60): the open band between deck and gallery is then screen rows 58..140,
// which shows far rows 79..161 (0.35x), mid rows 91..173 (0.55x) and near rows 106..188 (0.8x). The strip over the gallery is rows 21..61 / 33..73 / 48..88.
export function city(N, glyph) {
  // ---- sky: teal-black smog up top, a dirty orange burn along the horizon ----
  const skyC = sky(['#050a12', '#0b1c24', '#1c2e2a', '#463419', '#6a3d12', '#7e450f', '#844812', '#6a3810'], (x) => {
    for (let k = 0; k < 26; k++) { const cx = hash(k, 1) * 320, cy = 6 + hash(k, 2) * 190, rx = 34 + hash(k, 3) * 64, ry = 2 + hash(k, 4) * 5; x.fillStyle = cy < 50 ? '#0e222a' : cy < 90 ? '#2c2e22' : cy < 150 ? '#6c4018' : '#4a2a10';
      for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) { const dd = (i * i) / (rx * rx) + (j * j) / (ry * ry); if (dd < 1 && dith([0, 1], (1 - dd) * 0.7, i + 400, j + 400)) x.fillRect(Math.round(cx + i), Math.round(cy + j), 1, 1); } }
  });

  // ---- far (640 x 180, 0.06x): the sprawl to the horizon (row 132), two stepped pyramids standing on it, the refinery's flare stacks ----
  const [far, fx] = mk(640, 180), stacks = [], crowns = [];
  { const R = RR(fx), n = noise(91), S = { a: '#0e1c20', b: '#0a1418', k: '#060c10', rim: '#203438' };
    // slender far towers, hazed out
    for (const [tx, tw, tt] of [[18, 9, 30], [36, 6, 46], [84, 8, 38], [312, 7, 44], [336, 10, 26], [432, 8, 34], [444, 12, 20], [626, 8, 36]]) { R('#0c1a20', tx, tt, tw, 180 - tt); R('#15282e', tx, tt, 1, 180 - tt); R('#0c1a20', tx + (tw >> 1), tt - 9, 1, 9); for (let j = tt + 4; j < 128; j += 3) if (hash(tx, j) > 0.5) R('#5a4a26', tx + 2 + Math.floor(hash(j, tx) * (tw - 3)), j, 1, 1); }
    // the sprawl: low roofs out to the horizon, then a carpet of lights
    for (let i = 0; i < 640;) { const w = 3 + Math.floor(n() * 9), h = 1 + Math.floor(n() * n() * 13); R(S.b, i, 132 - h, w, h + 50); if (n() < 0.35) R(S.rim, i, 132 - h, w, 1); i += w; }
    for (let j = 128; j < 180; j++) for (let i = 0; i < 640; i++) { const h1 = hash(i, j * 3 + 1); if (h1 > 0.93 - (j - 128) * 0.0016) R(h1 > 0.992 ? '#d8b060' : h1 > 0.975 ? '#8a6a2c' : h1 > 0.955 ? '#2e6a74' : '#4a3a1e', i, j, 1, 1); }
    for (let k = 0; k < 14; k++) { const y = 137 + k * 3, x0 = Math.floor(hash(k, 70) * 600); for (let i = 0; i < 30 + k * 3; i += 2) R('#7a5a26', (x0 + i) % 640, y, 1, 1); }   // avenues
    // a stepped pyramid, a city in itself
    const pyramid = (cx, top, base, tw, bw, steps) => {
      const sh = (base - top) / steps;
      for (let s = 0; s < steps; s++) { const y0 = Math.round(top + s * sh), y1 = Math.round(top + (s + 1) * sh), a = tw + ((bw - tw) * s) / steps, b = tw + ((bw - tw) * (s + 0.62)) / steps;
        for (let j = y0; j < y1; j++) { const hw = Math.round(a + ((b - a) * (j - y0)) / (y1 - y0)); R(S.b, cx - hw, j, hw * 2, 1); R(S.a, cx - hw, j, Math.round(hw * 0.62), 1); R(S.rim, cx - hw, j, 1, 1); R(S.k, cx + hw - 2, j, 2, 1);
          if ((j - y0) % 2 === 1 && j > y0 + 1) for (let i = cx - hw + 3; i < cx + hw - 3; i += 2) { const h1 = hash(i * 3 + cx, j); if (h1 > 0.62) R(h1 > 0.93 ? '#f0c060' : h1 > 0.8 ? '#a07a30' : '#4e3e1e', i, j, 1, 1); } }
        R(S.rim, cx - Math.round(a), y0, Math.round(a) * 2, 1); R('#2c4448', cx - Math.round(a), y0, Math.round(a * 0.6), 1); }
      R(S.k, cx - 5, top + 3, 10, base - top - 3); for (let j = top + 5; j < base; j += 3) { R('#f0c060', cx - 1, j, 2, 1); if (j % 2) { R('#2e7a86', cx - 4, j, 1, 1); R('#2e7a86', cx + 3, j, 1, 1); } }   // the bright spine
      for (const dx of [-tw + 3, tw - 6]) { R(S.b, cx + dx, top - 9, 3, 9); R(S.rim, cx + dx, top - 9, 1, 9); } R(S.b, cx - 1, top - 15, 2, 15); R(S.b, cx - 4, top - 5, 8, 5); R(S.rim, cx - 4, top - 5, 8, 1);
      crowns.push({ x: cx, y: top - 15, tw });
    };
    pyramid(200, 78, 132, 13, 96, 6); pyramid(530, 92, 132, 10, 60, 4);
    // the refinery: flare stacks and tanks. The stack tops sit in the play band, so the fireballs go off where you are looking
    for (const [sx, top] of [[24, 104], [52, 96], [76, 110], [318, 100], [346, 110], [372, 96], [404, 106], [436, 100], [606, 104], [628, 98]]) { R(S.k, sx - 1, top, 4, 134 - top); R('#12242a', sx, top, 2, 134 - top); R(S.rim, sx - 2, top, 6, 2); for (let j = top + 8; j < 128; j += 9) { R(S.rim, sx - 2, j, 6, 1); if ((j >> 1) % 2) R('#8a2a20', sx - 2, j - 1, 1, 1); }
      for (let j = top + 10; j < 130; j += 2) R(S.k, sx - 3 - ((j >> 1) % 2), j, 1, 1); stacks.push({ x: sx + 1, y: top }); }
    for (const [tx, r] of [[40, 5], [64, 4], [330, 5], [388, 6], [420, 4], [616, 5]]) { disc(fx, tx, 132 - r, r, '#0c181c'); fx.fillStyle = S.rim; fx.fillRect(tx - 2, 132 - r * 2, 3, 1); }
  }

  // ---- mid (640 x 200, 0.22x): six megatowers with wide gaps between them (half the tile is gap), signs, the face and the eye at play height ----
  const [mid, mx] = mk(640, 200), BILL = { x: 74, y: 96, w: 54, h: 70 }, EYE = { x: 443, y: 100, w: 56, h: 30 }, SOL = { x: 305, y: 96, w: 44, h: 64 }, SQD = { x: 442, y: 136, w: 58, h: 31 }, lamps = [], msigns = [];
  const M = { a: '#101c22', b: '#0a1217', k: '#04080b', rim: '#1e3238', w: ['#8a6a2a', '#8a6a2a', '#2a7480', '#7a2e5a', '#c8a860'] };
  { const x = mx, R = RR(x);
    const tower = (x0, w, top, o = {}) => {
      vgrad(x, x0, top, w, 200 - top, [M.a, M.b, M.b, M.k]); R(M.rim, x0, top, 1, 200 - top); R(M.rim, x0, top, w, 1); R(M.k, x0 + w - 2, top + 1, 2, 199 - top);
      if (o.bands) for (let j = top + o.bands; j < 200; j += o.bands) R(M.k, x0 + 1, j, w - 3, 1);
      if (o.ribs) for (let i = x0 + o.ribs; i < x0 + w - 2; i += o.ribs) R('#0d171c', i, top + 1, 1, 199 - top);
      for (let j = top + 6; j < 198; j += 4) { const fl = hash(x0 + 3, j) < 0.045; for (let i = x0 + 3; i < x0 + w - 3; i += fl ? 2 : 3) if (hash(i * 7 + x0, j) < (fl ? 0.7 : (o.winP ?? 0.11))) R(fl ? '#5a4620' : M.w[Math.floor(hash(i, j + 5) * M.w.length)], i, j, 1, !fl && hash(i, j + 1) < 0.3 ? 2 : 1); }
      if (o.mast) { const m = x0 + (w >> 1); R(M.b, m - 3, top - 5, 6, 5); R(M.rim, m - 3, top - 5, 6, 1); R(M.b, m, top - 5 - o.mast, 1, o.mast); lamps.push({ x: m, y: top - 6 - o.mast }); }
    };
    const sign = (sx, sy, w, h, col, dim) => { R(M.k, sx - 2, sy - 2, w + 4, h + 4); R('#0a0612', sx - 1, sy - 1, w + 2, h + 2); R(dim, sx - 2, sy - 2, w + 4, 1); R(dim, sx - 2, sy + h + 1, w + 4, 1); R(dim, sx - 2, sy - 2, 1, h + 4); R(dim, sx + w + 1, sy - 2, 1, h + 4); msigns.push({ x: sx - 2, y: sy - 2, w: w + 4, h: h + 4 }); };
    const blade = (sx, sy, n, col, dim, seed) => { sign(sx, sy, 7, n * 9 + 1, col, dim); for (let k = 0; k < n; k++) glyph(x, sx + 1, sy + 1 + k * 9, seed + k, col); };
    const word = (s, sx, sy, col, dim) => { const w = s.length * 6 + 3; sign(sx, sy, w, 9, col, dim); drawText(x, s, sx + (w >> 1) + 1, sy + 1, { fill: col, outline: null, align: 'center' }); };
    const big = (sx, sy, n, col, dim, seed) => { sign(sx, sy, 13, n * 17 + 1, col, dim); for (let k = 0; k < n; k++) glyph(x, sx + 2, sy + 2 + k * 17, seed + k, col, 2); };
    // low blocks at the foot of everything: a dark band behind the last few rows over the deck
    { const n = noise(57); for (let i = 0; i < 640;) { const w = 14 + Math.floor(n() * 26), top = 158 + Math.floor(n() * 26); vgrad(x, i, top, w, 200 - top, [M.b, M.k]); R(M.rim, i, top, w, 1); for (let j = top + 4; j < 198; j += 3) for (let k = i + 2; k < i + w - 2; k += 2) if (hash(k, j + 9) < 0.16) R(M.w[Math.floor(hash(k, j) * M.w.length)], k, j, 1, 1); i += w + (n() < 0.4 ? 6 : 0); } }
    tower(0, 44, 30, { bands: 9, mast: 10 }); tower(70, 62, 8, { ribs: 12, winP: 0.07 }); tower(196, 48, 122, { ribs: 8 });   // the third and the sixth stop inside the play band: over their roofs you see right out to the pyramids
    tower(300, 54, 40, { bands: 11 }); tower(440, 62, 24, { bands: 8, winP: 0.08 }); tower(566, 54, 114, { bands: 7, mast: 9 });
    for (const [bx, bw, by] of [[132, 64, 132], [354, 86, 134], [502, 64, 128]]) { R(M.k, bx, by, bw, 7); R(M.rim, bx, by, bw, 1); for (let i = bx + 2; i < bx + bw - 1; i += 3) R(hash(i, by) > 0.4 ? '#8a6a2a' : '#2a7480', i, by + 3, 2, 1); }   // skybridges
    // the face: a building-sized screen, at the height you play at
    R(M.k, BILL.x - 3, BILL.y - 3, BILL.w + 6, BILL.h + 16); R('#2a1630', BILL.x - 2, BILL.y - 2, BILL.w + 4, 1); x.drawImage(billboard(BILL.w, BILL.h, false), BILL.x, BILL.y); R('#12061a', BILL.x, BILL.y + BILL.h + 2, BILL.w, 9);
    // the eye (the iris is drawn live: it follows you)
    R(M.k, EYE.x - 3, EYE.y - 3, EYE.w + 6, EYE.h + 6); R('#06181e', EYE.x, EYE.y, EYE.w, EYE.h); R('#143840', EYE.x - 2, EYE.y - 2, EYE.w + 4, 1);
    for (let j = 0; j < EYE.h; j++) for (let i = 0; i < EYE.w; i++) { const u = (i + 0.5 - EYE.w / 2) / (EYE.w / 2), v = (j + 0.5 - EYE.h / 2) / (EYE.h / 2); const lid = 0.78 * (1 - u * u * 1.05); if (lid > 0 && Math.abs(v) < lid) R(j % 2 ? '#1a5560' : '#267582', EYE.x + i, EYE.y + j, 1, 1); else if (lid > -0.1 && Math.abs(v) < lid + 0.16) R('#0d3038', EYE.x + i, EYE.y + j, 1, 1); }
    // signs in a made-up script, dimmer than the walkway's. Up top (what shows over the gallery):
    word('NOVA', 8, 40, N.c2, N.c3); blade(4, 54, 3, N.p2, N.p3, 400); word('YUME', 88, 44, N.p2, N.p3); blade(76, 38, 5, N.a2, N.a3, 410); blade(120, 36, 6, N.c2, N.c3, 420);
    word('KOSMO', 304, 52, N.a2, N.a3); blade(342, 48, 4, N.c2, N.c3, 440); word('ORBIT', 452, 40, N.p2, N.p3); blade(444, 54, 4, N.c2, N.c3, 450); blade(490, 54, 4, N.a2, N.a3, 456);
    // ...and at play height only a few, so the towers stay towers: one run of big characters, a blade, the names on the roofs and the bridge
    big(14, 100, 4, N.c2, N.c3, 510);
    for (const [s, sx, sy, col, dim] of [['YUME', 578, 102, N.c2, N.c3]]) { R(M.k, sx + 3, sy + 9, 1, 3); R(M.k, sx + 22, sy + 9, 1, 3); word(s, sx, sy, col, dim); }
    // VOLLEBAK is one of the big advertisers here. Its signs (the real wordmark and V): a V on the third tower's roof, the name along the skybridge...
    R(M.k, 211, 119, 1, 3); R(M.k, 227, 119, 1, 3); sign(207, 93, 25, 24, N.c2, N.c3); tube(x, LOGO.V22, 209, 94, N.c2, '#0c2a34');
    R(M.k, 368, 131, 1, 3); R(M.k, 424, 131, 1, 3); sign(362, 121, 69, 9, N.a2, N.a3); mask(x, LOGO.W7, 364, 122, N.a2);
    // ...and two screens (their pictures are live, see ADS below): the Solar Charged Jacket on the fourth tower, the Black Squid Jacket under the eye
    sign(SOL.x, SOL.y, SOL.w, SOL.h, '#34ac5c', '#1c4a30'); drawText(x, 'SOLAR', SOL.x + (SOL.w >> 1), SOL.y + 47, { fill: '#3c9a5c', outline: null, align: 'center' }); drawText(x, 'CHARGED', SOL.x + (SOL.w >> 1), SOL.y + 55, { fill: '#3c9a5c', outline: null, align: 'center' });
    sign(SQD.x, SQD.y, SQD.w, SQD.h, '#8a9ab8', '#34305a'); vgrad(x, SQD.x, SQD.y, 26, SQD.h, ['#3c3a6c', '#4e4680', '#302c5c']); drawText(x, 'BLACK', SQD.x + 42, SQD.y + 7, { fill: '#8f9cc0', outline: null, align: 'center' }); drawText(x, 'SQUID', SQD.x + 42, SQD.y + 17, { fill: '#8f9cc0', outline: null, align: 'center' });
    // haze: everything this far off is greyed towards the smog (teal up top, amber low down), so the walkway's own signs and anything you can touch stay the brightest things
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(30,54,60,0.24)'; x.fillRect(0, 0, 640, 200);
    { const g = x.createLinearGradient(0, 84, 0, 176); g.addColorStop(0, 'rgba(96,60,22,0)'); g.addColorStop(1, 'rgba(96,60,22,0.3)'); x.fillStyle = g; x.fillRect(0, 84, 640, 116); }
    x.globalCompositeOperation = 'source-over';
  }
  const billShut = billboard(BILL.w, BILL.h, true);

  // ---- near (480 x 240, 0.5x): black rooftops just below the walkway, aerials, cables, and the dark edge of one tower close by ----
  const [near, nx] = mk(480, 240), masts = [];
  { const R = RR(nx), kk = '#03060a', rim = '#12222a';
    const block = (x0, top, w) => { R(kk, x0, top, w, 240 - top); R(rim, x0, top, 1, 240 - top); R(rim, x0, top, w, 1); for (let j = top + 8; j < 200; j += 7) for (let i = x0 + 4; i < x0 + w - 3; i += 5) if (hash(i, j + top) > 0.88) R(hash(j, i) > 0.6 ? N.p3 : hash(j, i) > 0.3 ? N.c3 : N.a3, i, j, 2, 1); };
    const mast = (mx0, top, base) => { R(kk, mx0, top, 1, base - top); R(kk, mx0 - 3, top + 6, 7, 1); R(kk, mx0 - 2, top + 11, 5, 1); masts.push({ x: mx0, y: top - 1 }); };
    { const n = noise(23); for (let i = 0; i < 480;) { const w = 16 + Math.floor(n() * 34), top = 176 + Math.floor(n() * 14); block(i, top, w); if (n() < 0.5) { const tx = i + 3 + Math.floor(n() * (w - 12)); R(kk, tx, top - 7, 8, 7); R(rim, tx, top - 7, 8, 1); R(kk, tx + 1, top - 9, 6, 2); } i += w; } }
    mast(72, 132, 182); mast(232, 124, 180); mast(430, 138, 184);
    const cable = (x0, y0, x1, y1, sag) => { for (let i = x0; i <= x1; i++) { const t = (i - x0) / (x1 - x0); R(kk, i, Math.round(y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag), 1, 1); } };
    cable(72, 138, 232, 130, 16); cable(232, 130, 430, 144, 14); cable(430, 144, 552, 138, 12); cable(-50, 144, 72, 138, 12);
    // the tower edge: a slab from top to bottom, a rim of light, a few windows, a dim blade sign
    { const x0 = 318, w = 30; R(kk, x0, 0, w, 240); R(rim, x0, 0, 1, 240); R('#1c3038', x0 + 1, 0, 1, 240); R('#070c10', x0 + w - 1, 0, 1, 240);
      for (let j = 6; j < 236; j += 6) for (let i = x0 + 5; i < x0 + w - 4; i += 4) if (hash(i, j + 77) > 0.86) R(hash(j, i) > 0.5 ? '#3a3016' : '#123038', i, j, 2, 1);
      R(N.p3, x0 + 18, 96, 9, 1); R(N.p3, x0 + 18, 134, 9, 1); R(N.p3, x0 + 18, 96, 1, 38); R(N.p3, x0 + 26, 96, 1, 38); for (let k = 0; k < 4; k++) glyph(nx, x0 + 20, 99 + k * 9, 700 + k, N.p2);
      for (let j = 20; j < 240; j += 44) { R(rim, x0 - 3, j, 3, 2); R(kk, x0 - 3, j + 2, 3, 3); } }
  }

  // ---- the live part ----
  const HS = 1.2, hw = Math.ceil(HW * HS), hh = Math.ceil(HH * HS), HY = 112;
  const holo = [-1, -0.5, 0, 0.5, 1].map((sw) => holoFigure(sw, 0, HS)), holoSeq = [0, 1, 2, 3, 4, 3, 2, 1], holoPt = [holoFigure(0, 0.5, HS), holoFigure(0, 1, HS)], holoPtR = holoPt.map(flipC), small = holoSmall(holo[2]);
  const SH = new Map(), shade = (c) => { let o = SH.get(c); if (!o) { const [d, dx] = mk(c.width, c.height); dx.drawImage(c, 0, 0); dx.globalCompositeOperation = 'source-in'; dx.fillStyle = '#1c0a30'; dx.fillRect(0, 0, c.width, c.height); SH.set(c, o = d); } return o; };
  const mkS = (L, o) => ({ L, R: flipC(L), w: L.width, h: L.height, ...o });
  const SB = mkS(spinnerBig(), { bar: [24, 1, 4], nose: 8, pods: [[11, 4], [38, 4]], podY: 15, cone: 58, spread: 15 });
  const SM = mkS(spinnerMid(), { bar: [7, 0, 3], nose: 3, pods: [[3, 2], [14, 2]], podY: 6, cone: 26, spread: 7 });
  const BL = blimpArt(glyph);
  // the ads' live parts. fmj[0] has no sheen, fmj[1..10] carry it across; solar[0..4] is how charged; squid[0..11] loops. kiosk: the same three, smaller, for the ad stand on the walkway (neon.js)
  const ADS = (() => {
    const set = (s) => ({ fmj: [-1, 0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95].map((ph) => jacket('fmj', ph, s)), solar: [0, 0.25, 0.5, 0.75, 1].map((ph) => jacket('solar', ph, s)), squid: Array.from({ length: 12 }, (_, k) => jacket('squid', k / 12, s)) });
    const [bg, bx] = mk(BILL.w, BILL.h); vgrad(bx, 0, 0, BILL.w, BILL.h, ['#1c0d08', '#140906', '#0a0504']); drawText(bx, 'VOLLEBAK', BILL.w >> 1, 3, { fill: '#c08440', outline: null, align: 'center' });
    const [scan, sx] = mk(64, 72); sx.fillStyle = 'rgba(8,2,12,0.34)'; for (let j = 1; j < 72; j += 2) sx.fillRect(0, j, 64, 1);
    return { bill: set(1.3).fmj, fmjBg: bg, sol: set(1.1).solar, sqd: set(0.7).squid, kiosk: set(0.8), scan,
      tickFmj: adTicker(['FULL METAL JACKET'], '#c8a050', '#d05a9c'), tickAll: adTicker(['FULL METAL JACKET', 'SOLAR CHARGED JACKET', 'BLACK SQUID JACKET'], '#ffd06a', '#e860b0') };
  })();
  const HAZE = 'rgba(30,54,60,0.22)';
  const wrap = (v, span) => ((v % span) + span) % span;
  const tile = (ctx, img, off, y) => { for (let X = -Math.round(wrap(off, img.width)); X < W + 1; X += img.width) ctx.drawImage(img, X, y); };
  const beam = (ctx, x0, y0, x1, y1, x2, y2, col, a) => { ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1; };
  const R = (ctx, col, x0, y0, w, h) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x0), Math.round(y0), w, h); };
  // everything that lights up on a police flyer whose sprite S is at X, Y: the headlight cone (and the rain caught in it), the red/blue roof bar, nose and tail lights, the lift pods' glow
  const flyer = (ctx, S, X, Y, dir, f, i) => {
    const mx0 = (x0, len) => (dir < 0 ? X + x0 : X + S.w - x0 - len), on = ((f + i * 5) >> 3) % 2, [bx, by, bh] = S.bar, nose = dir < 0 ? X : X + S.w - 1, ny = Y + S.nose, L = S.cone, bigS = S.w > 30;
    beam(ctx, nose, ny, nose + dir * L, ny - 2, nose + dir * L, ny + S.spread, '#fff0c0', bigS ? 0.13 : 0.1);
    if (bigS) { beam(ctx, nose, ny, nose + dir * L * 0.55, ny, nose + dir * L * 0.55, ny + S.spread * 0.4, '#fff0c0', 0.12);
      ctx.fillStyle = '#fff8e0'; for (let k = 0; k < 7; k++) { const dd = 5 + hash(k + i * 7, f >> 1) * (L - 8), yy = ny + (hash(k + 3, (f >> 1) + i) * 1.05 - 0.1) * S.spread * (dd / L); ctx.globalAlpha = 0.55 * (1 - dd / L) + 0.1; ctx.fillRect(Math.round(nose + dir * dd), Math.round(yy), 1, 2); } ctx.globalAlpha = 1; }
    R(ctx, on ? '#ff3040' : '#3070ff', mx0(bx, bh), Y + by, bh, 1); R(ctx, on ? '#3070ff' : '#ff3040', mx0(bx + bh, bh), Y + by, bh, 1);
    ctx.globalAlpha = 0.22; R(ctx, on ? '#ff3040' : '#3070ff', mx0(bx - 2, bh * 2 + 4), Y + by - 2, bh * 2 + 4, 4); ctx.globalAlpha = 1;
    R(ctx, '#fff4c8', mx0(0, bigS ? 2 : 1), ny, bigS ? 2 : 1, 1); R(ctx, '#ff3040', mx0(S.w - 1, 1), ny, 1, 1);
    S.pods.forEach(([p0, len], k) => { const c = ((f >> 1) + k) % 2 ? '#9aeaff' : '#4ab8d8'; R(ctx, c, mx0(p0, len), Y + S.podY - (bigS ? 1 : 0), len, 1);
      if (bigS) { ctx.globalAlpha = 0.16; R(ctx, '#7ad8f0', mx0(p0 - 1, len + 2), Y + S.podY, len + 2, 2); ctx.globalAlpha = 0.07; R(ctx, '#7ad8f0', mx0(p0 - 3, len + 6), Y + S.podY + 2, len + 6, 4); ctx.globalAlpha = 1; } });
  };
  // a flare stack: the pilot flame always, and every few seconds a fireball that rolls up and lights the smog. Returns how bright it is (0..1)
  const fireball = (ctx, X, Y, f, i) => {
    const T = 250 + i * 43, t = (f + i * 97) % T;
    R(ctx, (f >> 2) % 2 ? '#ffb040' : '#ff7a20', X - 1, Y - 2 - ((f >> 3) % 2), 2, 2);                         // the pilot flame
    if (t > 70) return 0; const k = t / 70, r = Math.round(2 + Math.sin(Math.min(1, k * 1.6) * Math.PI / 2) * 6), cy = Y - 4 - k * 24;
    ctx.globalAlpha = 0.09 * (1 - k); disc(ctx, X, cy, r + 26, '#ff7a20'); ctx.globalAlpha = 0.14 * (1 - k); disc(ctx, X, cy, r + 13, '#ff7a20'); disc(ctx, X, cy, r + 6, '#ffb040'); ctx.globalAlpha = 1;
    if (k < 0.45) { R(ctx, '#ff7a20', X - 1, cy, 3, Y - cy); R(ctx, '#ffe08a', X, cy, 1, Y - cy); }
    if (k < 0.62) { disc(ctx, X, cy, r, '#a83210'); disc(ctx, X - 1, cy - 1, r - 1, '#ff7a20'); if (r > 3) disc(ctx, X - 1, cy - 1, r - 3, '#ffd060'); if (r > 5 && k < 0.4) disc(ctx, X - 1, cy - 2, r - 5, '#fff8d8'); }
    else { ctx.globalAlpha = 1 - (k - 0.62) / 0.38; disc(ctx, X, cy, r, '#3a1c14'); disc(ctx, X - 1, cy - 1, r - 2, '#8a3414'); if ((f >> 1) % 2) disc(ctx, X - 2, cy - 2, Math.max(1, r - 5), '#ff7a20'); ctx.globalAlpha = 1; }
    return 1 - k;
  };
  // a sheet of slanting rain: one tile of streaks, scrolled down and to the left
  const [RS, rsx] = mk(128, 128); { rsx.fillStyle = '#93a6d6'; for (let k = 0; k < 64; k++) { const x0 = Math.floor(hash(k, 201) * 128), y0 = Math.floor(hash(k, 202) * 128), len = 5 + Math.floor(hash(k, 203) * 6); rsx.globalAlpha = 0.4 + hash(k, 204) * 0.6; for (let t = 0; t < len; t++) rsx.fillRect((x0 - Math.floor(t / 3) + 128) % 128, (y0 + t) % 128, 1, 1); } }
  const sheet = (ctx, ox, oy, a) => { ctx.globalAlpha = a; const X0 = -Math.round(wrap(ox, 128)), Y0 = -Math.round(wrap(oy, 128)); for (let Y = Y0; Y < 180; Y += 128) for (let X = X0; X < W; X += 128) ctx.drawImage(RS, X, Y); ctx.globalAlpha = 1; };
  const MURK = Array.from({ length: 12 }, (_, k) => `rgba(3,6,10,${(0.034 * (k + 1)).toFixed(3)})`);
  // what frontFx needs to know about this frame's backdrop, to smear it down the wet deck
  const live = { holo: null, lights: [], fire: 0, fireX: 0 };

  const backFx = (ctx, f, fdist, cam) => {
    live.holo = null; live.lights.length = 0; live.fire = 0;
    // --- far: fire off the stacks, light shafts off the pyramids, a lane of traffic along the horizon ---
    const fo = Math.round(wrap(fdist * 0.06, 640)), fy = Math.round(-cam * 0.35);
    tile(ctx, far, fdist * 0.06, fy);
    for (let X0 = -fo; X0 < W + 40; X0 += 640) {
      stacks.forEach((s, i) => { const X = X0 + s.x; if (X > -30 && X < W + 30) { const b = fireball(ctx, X, fy + s.y, f, i); if (b > live.fire) { live.fire = b; live.fireX = X; } } });
      crowns.forEach((c, i) => { const X = X0 + c.x; if (X < -120 || X > W + 120) return; const a = 0.07 + 0.03 * Math.sin(f / 31 + i), sw = Math.sin(f / 170 + i * 2) * 26;
        beam(ctx, X - c.tw + 4, fy + c.y + 6, X - c.tw - 6 - sw, -4, X - c.tw + 8 - sw, -4, '#bfe8ff', a); beam(ctx, X + c.tw - 4, fy + c.y + 6, X + c.tw - 8 + sw, -4, X + c.tw + 6 + sw, -4, '#bfe8ff', a);
        if ((f >> 4) % 3 === 0) { R(ctx, '#ff3040', X - 1, fy + c.y - 1, 2, 1); R(ctx, '#ff3040', X - c.tw + 4, fy + c.y + 5, 1, 1); R(ctx, '#ff3040', X + c.tw - 5, fy + c.y + 5, 1, 1); } });
    }
    for (let i = 0; i < 16; i++) { const lane = i >= 6, sp = (0.18 + hash(i, 3) * 0.3) * (i % 2 ? 1 : -1), X = wrap(f * sp + i * 97 - fdist * 0.08, 420) - 50, y = Math.round((lane ? 108 + (i % 2) * 5 + hash(i, 5) * 3 : 22 + hash(i, 5) * 80) - cam * 0.35 + Math.sin(f / 60 + i * 2) * 1.5);
      R(ctx, '#0a1216', X, y, 3, 1); R(ctx, sp < 0 ? '#fff0c0' : '#ff3040', X, y, 1, 1); R(ctx, sp < 0 ? '#ff3040' : '#fff0c0', X + 2, y, 1, 1); if (((f + i * 9) >> 3) % 4 === 0) R(ctx, '#4a8aff', X + 1, y - 1, 1, 1); }
    for (let k = 0; k < 6; k++) { ctx.globalAlpha = 0.05; R(ctx, '#c06414', 0, fy + 84 + k * 8, W, 62 - k * 8); } ctx.globalAlpha = 1;   // the burn along the horizon, thickest low down
    if (live.fire > 0) { ctx.globalAlpha = 0.07 * live.fire; R(ctx, '#ff8a30', 0, fy + 56, W, 84); ctx.globalAlpha = 1; }                   // a fireball lights the whole bank of smog
    // --- mid: the towers; the face blinks, the eye follows you, signs stutter ---
    const mo = Math.round(wrap(fdist * 0.22, 640)), my = Math.round(-cam * 0.55);
    tile(ctx, mid, fdist * 0.22, my);
    for (let X0 = -mo; X0 < W + 40; X0 += 640) {
      { const X = X0 + BILL.x, Y = my + BILL.y; if (X > -70 && X < W + 10) {
        const prog = (f + 380) % 1000, ad = prog >= 470, cut = prog < 6 || (ad && prog < 476);      // the screen's programme: her face, then the FULL METAL JACKET ad, round and round
        if (ad) { const t = (prog - 470) % 132; ctx.drawImage(ADS.fmjBg, X, Y); ctx.drawImage(ADS.bill[t < 40 ? 1 + (t >> 2) : 0], X + 5, Y + 13 + Math.round(Math.sin(f / 45)));
          ctx.drawImage(ADS.scan, 0, 0, BILL.w, BILL.h, X, Y, BILL.w, BILL.h); R(ctx, HAZE, X, Y, BILL.w, BILL.h); R(ctx, 'rgba(14,10,24,0.24)', X, Y, BILL.w, BILL.h); }
        else { const b = (f + 30) % 190; if (b < 7 || (b > 14 && b < 19)) ctx.drawImage(billShut, X, Y); }
        ctx.globalAlpha = 0.12; R(ctx, '#ffc0e8', X, Y + ((f >> 1) % (BILL.h + 30)) - 6, BILL.w, 5); ctx.globalAlpha = 1; ctx.fillStyle = M.k; ctx.fillRect(X, Y - 3, BILL.w, 3); R(ctx, '#12061a', X, Y + BILL.h, BILL.w, 2);
        const g = (f + 200) % 530; if (!ad && g < 10 && (g >> 1) % 2) { ctx.drawImage(mid, BILL.x, BILL.y + 26, BILL.w, 9, X + 4, Y + 26, BILL.w - 4, 9); ctx.globalAlpha = 0.3; R(ctx, '#ffffff', X, Y, BILL.w, BILL.h); ctx.globalAlpha = 1; }
        if (cut && (prog >> 1) % 2) { ctx.globalAlpha = 0.3; R(ctx, '#ffffff', X, Y, BILL.w, BILL.h); ctx.globalAlpha = 1; }
        ctx.save(); ctx.globalAlpha = 0.75; if (ad) ctx.drawImage(ADS.tickFmj.c, Math.floor(f / 4) % ADS.tickFmj.w, 0, BILL.w - 2, 9, X + 1, Y + BILL.h + 2, BILL.w - 2, 9); else ctx.drawImage(BL.ticker, Math.floor(f / 4) % 106, 0, BILL.w - 2, 9, X + 1, Y + BILL.h + 2, BILL.w - 2, 9); ctx.restore(); } }
      // the Solar Charged Jacket: the light comes up on it, goes out, and it glows green in the dark, fading slowly
      { const X = X0 + SOL.x, Y = my + SOL.y; if (X > -60 && X < W + 10) {
        const t = (f + 140) % 540, g = t < 80 ? 0 : Math.max(0, 1 - (t - 80) / 400), day = t < 80 ? Math.sin((t / 80) * Math.PI) : 0;
        if (day > 0) { ctx.globalAlpha = 0.16 * day; R(ctx, '#e8fff0', X, Y, SOL.w, 45); ctx.globalAlpha = 1; }
        if (g > 0) { ctx.globalAlpha = 0.09 * g; disc(ctx, X + 22, Y + 23, 19, '#5ee888'); disc(ctx, X + 22, Y + 23, 14, '#5ee888'); ctx.globalAlpha = 1; }
        ctx.drawImage(ADS.sol[Math.round(Math.pow(g, 0.7) * 4)], X + 3, Y + 1);
        if (day > 0) { ctx.globalAlpha = 0.22 * day; R(ctx, '#e8fff0', X + 3, Y + 1, 38, 44); ctx.globalAlpha = 1; }
        ctx.drawImage(ADS.scan, 0, 0, SOL.w, 45, X, Y, SOL.w, 45); R(ctx, HAZE, X, Y, SOL.w, 45); } }
      // the Black Squid Jacket: black, and every colour sliding over it
      { const X = X0 + SQD.x, Y = my + SQD.y; if (X > -60 && X < W + 10) { ctx.drawImage(ADS.sqd[(f >> 3) % 12], X + 1, Y + 2); ctx.drawImage(ADS.scan, 0, 0, 26, SQD.h, X, Y, 26, SQD.h); R(ctx, HAZE, X, Y, 26, SQD.h); } }
      { const X = X0 + EYE.x, Y = my + EYE.y; if (X > -70 && X < W + 10) {
        const b = (f + 90) % 260, ir = Math.round(EYE.h * 0.27), look = Math.round(Math.max(-10, Math.min(10, (72 - X - EYE.w / 2) / 11)) + Math.sin(f / 23) * 1.5), cx = X + (EYE.w >> 1) + look, cy = Y + (EYE.h >> 1) + 1;
        if (b < 8) { R(ctx, '#0d3038', X + 3, Y + 4, EYE.w - 6, EYE.h - 8); R(ctx, '#267582', X + 5, cy, EYE.w - 10, 1); }
        else { disc(ctx, cx, cy, ir, '#0a2a32'); disc(ctx, cx, cy, ir - 1, '#3aa0b0'); disc(ctx, cx, cy, Math.max(2, ir - 5), '#04080b'); R(ctx, '#d8fbff', cx - 3, cy - 4, 2, 2); }
        ctx.globalAlpha = 0.14; R(ctx, '#bff4ff', X, Y + ((f >> 2) % EYE.h), EYE.w, 2); ctx.globalAlpha = 1; } }
      msigns.forEach((s, i) => { const k = (f + i * 83) % 370; if (i % 3 === 0 && ((k > 300 && k < 306) || (k > 312 && k < 316) || (k > 330 && k < 350 && (k >> 1) % 3 === 0))) { const X = X0 + s.x; if (X > -40 && X < W) { ctx.fillStyle = 'rgba(4,8,11,0.8)'; ctx.fillRect(X + 1, my + s.y + 1, s.w - 2, s.h - 2); } } });
      lamps.forEach((l, i) => { if (((f + i * 11) >> 4) % 3 === 0) { const X = X0 + l.x; R(ctx, '#ff3040', X, my + l.y, 1, 1); ctx.globalAlpha = 0.25; R(ctx, '#ff3040', X - 1, my + l.y - 1, 3, 3); ctx.globalAlpha = 1; } });
    }
    // --- the ad blimp, crossing at play height, searchlights sweeping down through the rain ---
    { const span = 1100, ph = wrap(f * 0.16 + fdist * 0.1 + 250, span), X = Math.round(W + 96 - ph), Y = Math.round(86 + Math.sin(f / 80) * 2 - cam * 0.4);
      if (X > -100 && X < W + 4) {
        for (const [gx, sp, ph0] of [[38, 47, 0], [50, 61, 2]]) { const a = Math.sin(f / sp + ph0) * 0.6, bx = X + gx + Math.sin(a) * 120, by = Y + 26 + Math.cos(a) * 120; beam(ctx, X + gx, Y + 27, bx - 13, by, bx + 13, by, '#d8f0ff', 0.1); }
        ctx.drawImage(BL.c, X, Y);
        ctx.drawImage(ADS.tickAll.c, Math.floor(f / 3) % ADS.tickAll.w, 0, 42, 9, X + 23, Y + 8, 42, 9);                     // its screen: VOLLEBAK, and the three jackets by name
        if ((f >> 3) % 7 === 0) { ctx.globalAlpha = 0.25; R(ctx, '#ffffff', X + 23, Y + 8, 42, 9); ctx.globalAlpha = 1; }
        for (let j = 9; j < 17; j += 2) R(ctx, 'rgba(6,2,10,0.4)', X + 23, Y + j, 42, 1);
        if ((f >> 4) % 2) { R(ctx, '#ff3040', X + 1, Y + 12, 1, 1); R(ctx, '#ff3040', X + 88, Y + 1, 1, 1); } if ((f >> 4) % 4 === 1) R(ctx, '#ffffff', X + 44, Y + 28, 1, 1);
      } }
    // --- the giant hologram, full height behind the walkway: head under the gallery, hem below the deck. She steps slowly through the towers
    // (in front of them: she is light, not a thing) and every ten seconds or so stops, turns her head and points at you ---
    { const span = 520, X = Math.round(wrap(300 - fdist * 0.15 - f * 0.04, span) - 110);
      if (X > -hw - 4 && X < W + 8) {
        const k = (f + 60) % 420, out = k < 3 || (k > 9 && k < 12), fl = 0.88 + 0.12 * Math.sin(f / 5) - (hash(f >> 1, 7) > 0.93 ? 0.25 : 0);
        const p = ((f + 200) % 640) - 460, left = X + hw / 2 < 66; let img, bob = 0;
        if (p < 0) { const q = holoSeq[(f >> 5) % 8]; img = holo[q]; bob = q === 2 ? 0 : 1; } else img = (left ? holoPtR : holoPt)[p < 8 || p > 171 ? 0 : 1];
        const Y = Math.round(HY - cam * 0.85) + bob;
        if (!out) {
          ctx.globalAlpha = 0.06; R(ctx, '#ff72cc', X + 8, Y + 10, hw - 16, 94); R(ctx, '#ff72cc', X + 20, Y - 2, hw - 40, 28); ctx.globalAlpha = 1;      // her light on the smog
          ctx.globalAlpha = 0.3; ctx.drawImage(shade(img), X, Y); ctx.globalAlpha = 0.72 * fl; ctx.drawImage(img, X, Y);
          const sb = (f * 0.7) % 230; if (sb < hh - 6) { ctx.globalAlpha = 0.45; ctx.drawImage(img, 0, Math.floor(sb), hw, 5, X, Y + Math.floor(sb), hw, 5); }   // a brighter band rolls down her
          if ((k > 20 && k < 34) || (p >= 0 && p < 5)) { const gy = 20 + Math.floor(hash(f >> 1, 3) * 110); ctx.globalAlpha = 0.6; ctx.drawImage(img, 0, gy, hw, 7, X + (hash(f, 5) > 0.5 ? 5 : -5), Y + gy, hw, 7); }   // a glitch tears a slice sideways
          ctx.globalAlpha = 1;
        }
        live.holo = { x: X + hw / 2, a: out ? 0 : fl };
      } }
    // --- police flyers, three depths. Far ones thread the towers... ---
    for (let i = 0; i < 6; i++) { const sp = [0.55, -0.8, 0.7, -0.6, 0.9, -0.7][i], X = Math.round(wrap(f * sp + i * 171 - fdist * 0.22, 520) - 90), Y = Math.round([44, 104, 60, 126, 148, 136][i] - cam * 0.55 + Math.sin(f / 37 + i * 2) * 2);
      if (X > -70 && X < W + 50) { ctx.drawImage(sp < 0 ? SM.L : SM.R, X, Y); flyer(ctx, SM, X, Y, sp < 0 ? -1 : 1, f, i); } }
    sheet(ctx, f * 1.4 + fdist * 0.3, -f * 4.2, 0.14);                                    // rain between the towers and the rooftops
    // --- near: the rooftops and the tower edge ---
    const no = Math.round(wrap(fdist * 0.5, 480)), ny = Math.round(-cam * 0.8);
    tile(ctx, near, fdist * 0.5, ny);
    for (let X0 = -no; X0 < W + 40; X0 += 480) masts.forEach((m, i) => { if (((f + i * 13) >> 4) % 2) { R(ctx, '#ff3040', X0 + m.x, ny + m.y, 1, 2); ctx.globalAlpha = 0.22; R(ctx, '#ff3040', X0 + m.x - 2, ny + m.y - 2, 5, 5); ctx.globalAlpha = 1; } });
    // ...near ones cross between the deck and the gallery every few seconds, headlights cutting the rain...
    [[-1.3, 200, 760, 116, 6], [2.2, 520, 900, 134, 7], [-1.0, 700, 840, 150, 8], [1.5, 60, 1200, 58, 9]].forEach(([sp, off, span, base, i]) => {
      const X = Math.round(wrap(f * sp + off - fdist * 0.4, span) - 124), Y = Math.round(base - cam * 0.8 + Math.sin(f / (25 + i) + i * 2) * 3), dir = sp < 0 ? -1 : 1;
      if (X > -116 && X < W + 62) { ctx.drawImage(dir < 0 ? SB.L : SB.R, X, Y); flyer(ctx, SB, X, Y, dir, f, i); live.lights.push(X + 27 + dir * 62); } });
    // ...and now and then one banks past close, climbing and dropping away
    { const T = 540, q = f + 330, t = q % T; if (t < 104) { const p = t / 104, dir = Math.floor(q / T) % 2 ? 1 : -1, X = dir < 0 ? W + 50 - p * (W + 130) : -80 + p * (W + 130), Y = 140 - cam * 0.8 - Math.sin(p * Math.PI) * 26;
      ctx.save(); ctx.translate(Math.round(X), Math.round(Y)); ctx.rotate(-dir * Math.cos(p * Math.PI) * 0.24); ctx.scale(1.3, 1.3); ctx.drawImage(dir < 0 ? SB.L : SB.R, -27, -8); flyer(ctx, SB, -27, -8, dir, f, 11); ctx.restore(); live.lights.push(X + dir * 80); } }
    // --- the weather in front of all that: a nearer sheet of rain, two slow shafts of light through the murk, and the dark closing in just above the deck ---
    sheet(ctx, f * 2 + fdist * 0.6 + 40, -f * 6 + 30, 0.2);
    for (let k = 0; k < 2; k++) { const X = wrap(k * 250 + f * 0.05 - fdist * 0.3, 520) - 60; ctx.globalAlpha = 0.04 + 0.015 * Math.sin(f / 90 + k * 2); ctx.fillStyle = '#a8e0f0'; ctx.beginPath(); ctx.moveTo(X, 0); ctx.lineTo(X + 26, 0); ctx.lineTo(X - 50, 180); ctx.lineTo(X - 96, 180); ctx.closePath(); ctx.fill(); } ctx.globalAlpha = 1;
    { const y0 = Math.round(152 - cam); for (let k = 0; k < 12; k++) { ctx.fillStyle = MURK[k]; ctx.fillRect(0, y0 + k * 4, W, 4); } }
  };

  // the deck is wet: whatever is bright behind it smears down the slab (the hologram's pink, a flyer's headlights, a fireball's orange). Skips the gaps.
  // Then one last thin sheet of rain in front of everything, gusting.
  const smearC = (w, col) => { const [c, x] = mk(w, 11); x.fillStyle = col; for (let i = 0; i < w; i++) { const hgt = Math.floor((0.3 + hash(i, 141) * 0.7) * 11 * Math.max(0, 1 - Math.abs(i / w - 0.5) * 1.7)); for (let j = 0; j < hgt; j++) if ((i + j) % 2 === 0) x.fillRect(i, j, 1, 1); if (hgt > 2) x.fillRect(i, 0, 1, 1); } return c; };
  const SMH = smearC(50, '#ff72cc'), SML = smearC(34, '#fff0c0'), SMF = smearC(150, '#ff8a30');
  const frontFx = (ctx, f, fdist, cam, s) => {
    const y = Math.round(200 - cam) + 1;
    if (y < 180) {
      const holes = s && s.gaps ? s.gaps.map((g) => [Math.round((g.x - s.dist) / 256), Math.round((g.x + g.w - s.dist) / 256)]).filter(([a, b]) => b > 0 && a < W).sort((p, q) => p[0] - q[0]) : [];
      ctx.save(); ctx.beginPath(); let x0 = 0; for (const [a, b] of holes) { if (a > x0) ctx.rect(x0, y, a - x0, 11); x0 = Math.max(x0, b); } if (x0 < W) ctx.rect(x0, y, W - x0, 11); ctx.clip();
      if (live.holo && live.holo.a > 0) { ctx.globalAlpha = 0.36 * live.holo.a; ctx.drawImage(SMH, Math.round(live.holo.x - 25), y); }
      ctx.globalAlpha = 0.42; for (const lx of live.lights) ctx.drawImage(SML, Math.round(lx - 17), y);
      if (live.fire > 0) { ctx.globalAlpha = 0.34 * live.fire; ctx.drawImage(SMF, Math.round(live.fireX - 75), y); }
      ctx.restore();
    }
    sheet(ctx, f * 2.6 + fdist * 1.2, -f * 7.5, 0.06 + 0.04 * Math.sin(f / 67));
  };

  const empty = cv(320, 1);
  return { sky: skyC, mid: empty, near: empty, backFx, frontFx, small, ads: ADS, parts: { far, mid, near, holo, holoPt, spinL: SB.L, spmL: SM.L, blimp: BL.c, bill: billShut } };
}

// ================= the dangers (see danger.js for the contract; every drawing here is on the play layer: bright, black outline) =================
const O = '#05040a';
const Q = (ctx, col, x0, y0, w, h) => { ctx.fillStyle = col; ctx.fillRect(Math.round(x0), Math.round(y0), w, h); };
const RIDE = { k: O, b: '#3e5a8c', B: '#8fb0e6', d: '#22355c', c: '#1c6a80', w: '#9aeaff', s: '#f0f4ff', t: '#1a1e2a', g: '#c8d0e0' };

function gunman(k) {      // 0 idle, 1 aim, 2 fire. Faces left, feet at (13, 30). A hunter in a long coat, his blaster held low at the hip
  const [c, x] = mk(26, 30), R = RR(x);
  R(O, 9, 20, 5, 10); R(O, 14, 20, 5, 10); R('#3c4258', 10, 20, 3, 8); R('#2a2e40', 15, 20, 3, 8); R(O, 7, 27, 7, 3); R(O, 14, 27, 6, 3); R('#1c1c26', 8, 28, 5, 1); R('#1c1c26', 15, 28, 4, 1);   // legs, boots
  R(O, 8, 8, 12, 15); R(O, 7, 16, 14, 9); R('#c89a5a', 9, 9, 10, 13); R('#c89a5a', 8, 17, 12, 7); R('#ecc888', 9, 9, 2, 14); R('#8e6634', 16, 9, 3, 15); R('#6a4a26', 13, 13, 1, 11); R('#6a4a26', 8, 23, 12, 1);   // the coat
  R(O, 9, 0, 9, 10); R('#ecc09a', 10, 3, 6, 5); R('#b88462', 14, 4, 2, 4); R('#30201a', 10, 1, 7, 2); R('#30201a', 15, 3, 2, 4); R(O, 11, 5, 1, 1); R('#ecc888', 9, 8, 3, 2); R('#8e6634', 14, 8, 4, 2);   // head, collar up
  if (k === 0) { R(O, 9, 11, 5, 11); R('#b08448', 10, 12, 3, 8); R('#ecc09a', 10, 20, 2, 1); R(O, 8, 20, 4, 7); R('#9aa6ba', 9, 21, 2, 5); R('#e0e8f4', 9, 21, 1, 2); }   // gun arm down
  else { const kick = k === 2 ? 1 : 0;
    R(O, 8 + kick, 11, 6, 6); R('#b08448', 9 + kick, 12, 4, 4); R(O, 6 + kick, 15, 6, 6); R('#b08448', 7 + kick, 16, 4, 3); R('#ecc09a', 6 + kick, 19, 3, 2);                       // arm bent to the hip
    R(O, 1 + kick, 18, 9, 5); R('#9aa6ba', 2 + kick, 19, 7, 3); R('#e0e8f4', 2 + kick, 19, 7, 1); R('#4c5668', 6 + kick, 21, 3, 1); R(O, 6 + kick, 22, 3, 3); R('#4c5668', 7 + kick, 22, 1, 2);   // the blaster, muzzle at (3, 21)
    R(k === 2 ? '#ffffff' : '#ff4040', 1 + kick, 20, 1, 1);
    if (k === 2) { R('#fff6c0', 0, 19, 2, 3); R('#ffb040', 0, 18, 1, 1); R('#ffb040', 0, 22, 1, 1); } }
  return { c, ox: 13, oy: 30 };
}
function drone(k) {       // 0, 1 searching (the lamp sweeps); 2 locked on. Faces left, middle of the body at (21, 5)
  const [c, x] = mk(30, 22), R = RR(x), X = 12, lock = k === 2;
  x.globalAlpha = lock ? 0.5 : 0.24; x.fillStyle = lock ? '#ff4040' : '#fff4c0'; x.beginPath();
  if (lock) { x.moveTo(X + 1, 4); x.lineTo(0, 4); x.lineTo(0, 6); x.lineTo(X + 1, 6); } else { x.moveTo(X + 2, 5); x.lineTo(k ? 4 : 0, 22); x.lineTo(k ? 14 : 9, 22); x.lineTo(X + 4, 6); }
  x.fill(); x.globalAlpha = 1;
  R(O, X + 2, 1, 14, 8); R(O, X, 3, 18, 5); R('#8a9ab8', X + 3, 2, 12, 6); R('#d4e0f4', X + 3, 2, 12, 1); R('#2a3a5c', X + 3, 5, 12, 1); R('#5a6a8a', X + 3, 7, 12, 1); R('#8a9ab8', X + 1, 4, 16, 3); R('#2a3a5c', X + 4, 5, 12, 1);
  R(O, X, 3, 4, 5); R(lock ? '#ff3040' : '#7af0ff', X + 1, 4, 2, 3); R('#ffffff', X + 1, 4, 1, 1);                                     // the lamp
  R(lock || k ? '#ff3040' : '#3070ff', X + 7, 1, 2, 1); R(lock || !k ? '#ff3040' : '#3070ff', X + 10, 1, 2, 1);                         // police lights
  R(O, X + 3, 0, 5, 1); R(O, X + 10, 0, 5, 1); R(k % 2 ? '#c8d0e0' : '#5a6474', X + 3 + (k % 2), 0, 3, 1); R(k % 2 ? '#5a6474' : '#c8d0e0', X + 11 - (k % 2), 0, 3, 1);   // rotors
  R(O, X + 5, 8, 3, 2); R(O, X + 11, 8, 3, 2); R('#5a6474', X + 6, 8, 1, 1); R('#5a6474', X + 12, 8, 1, 1);                                     // skids
  return { c, ox: 21, oy: 5 };
}
function rideSprite() {   // the parked spinner, play-layer bright, facing right (the way you are going)
  const [c, x] = mk(38, 14);
  px(x, 0, 0, [
    '................kkkkkkkk..............', '.............kkkggggggggkk............', '..........kkkcccccccccccddkk..........', '........kkcwwcccccccccccdddkkkkk......',
    '.....kkkBBBBBBBBBBBBBBBBBBBBBBBBkkkk..', '...kkBBBbbbbbbbbbbbbbbbbbbbbbbbbbbBBkk', '.kkbbbbbbsssssssssssssssssbbbbbbbbbbbk', 'kbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbk',
    'kkddddddddddddddddddddddddddddddddddkk', '..kkkkttttkkkkkkkkkkkkkkkkkttttkkkkk..', '.....kttttk...............kttttk......', '......kkkk.................kkkk.......'], RIDE);
  return flipC(c);
}
function paperUnicorn() { // 11 x 10, faces right: folded white paper, one horn
  const [c, x] = mk(11, 10);
  px(x, 0, 0, [
    '........k..', '.......kwk.', '.....kkwwk.', '.kk.kwwwwwk', 'kwwkwwwsskk', 'kswwwwwsk..', '.kwwwwwwk..', '.kwskkwsk..', '.kwk..kwk..', '.kkk..kkk..'], { k: O, w: '#ffffff', s: '#b8c4dc' });
  return c;
}

export function dangers() {
  const car = rideSprite(), uni = paperUnicorn(), uniL = flipC(uni);
  const lights = (ctx, X, Y, f) => { const on = (f >> 3) % 2; Q(ctx, on ? '#ff3040' : '#3070ff', X + 13, Y + 1, 4, 1); Q(ctx, on ? '#3070ff' : '#ff3040', X + 17, Y + 1, 4, 1); ctx.globalAlpha = 0.3; Q(ctx, on ? '#ff3040' : '#3070ff', X + 11, Y - 2, 12, 3); ctx.globalAlpha = 1; Q(ctx, '#fff4c8', X + 36, Y + 6, 2, 1); Q(ctx, '#ff3040', X, Y + 7, 1, 1); };
  const lift = (ctx, X, Y, f, hard) => { for (const dx of [7, 28]) { Q(ctx, (f >> 1) % 2 ? '#9aeaff' : '#ffffff', X + dx, Y + 12, 4, 1); ctx.globalAlpha = 0.35; Q(ctx, '#7af0ff', X + dx, Y + 13, 4, hard ? 4 + (f % 3) : 2); ctx.globalAlpha = 1; if (hard) Q(ctx, '#ffffff', X + dx + 1, Y + 13, 2, 2 + (f % 2)); } };
  const fx = {
    // a flame stack let into the pavement: the pilot spits first, then the column goes up
    vent(ctx, x, y, st, f) {
      Q(ctx, O, x - 8, y - 3, 16, 5); Q(ctx, '#5a5e6c', x - 7, y - 2, 14, 3); Q(ctx, '#9aa2b4', x - 7, y - 2, 14, 1); for (let i = -6; i <= 4; i += 4) { Q(ctx, '#e8c020', x + i, y - 1, 2, 2); Q(ctx, O, x + i + 2, y - 1, 2, 2); } Q(ctx, O, x - 3, y - 4, 6, 2); Q(ctx, '#2a2c36', x - 2, y - 4, 4, 1);
      if (st.warn > 0) { const p = (f >> 1) % 2; Q(ctx, O, x - 2, y - 8 - p, 4, 5 + p); Q(ctx, '#ff7a20', x - 1, y - 7 - p, 2, 4 + p); Q(ctx, '#fff0a0', x - 1 + p, y - 5, 1, 2); Q(ctx, '#ffd060', x - 5 + (f * 3) % 10, y - 9 - (f % 5), 1, 1); Q(ctx, '#ffffff', x + 3 - (f * 2) % 7, y - 7 - ((f + 2) % 4), 1, 1); }
      if (!st.on) return;
      const w = (j) => (j < 3 ? 2 : j > st.h - 5 ? Math.max(1, st.h - j - (f >> 1) % 2) : 3 + ((j * 5 + f * 3) % 3) - ((j + (f >> 1)) % 7 === 0 ? 1 : 0));
      for (let j = 0; j < st.h; j++) Q(ctx, O, x - w(j) - 1, y - 4 - j, w(j) * 2 + 2, 1); Q(ctx, O, x - 2, y - 5 - st.h, 4, 1);
      for (let j = 0; j < st.h; j++) { const k = j / st.h, ww = w(j); Q(ctx, k > 0.8 ? '#d83a18' : k > 0.5 ? '#ff7a20' : '#ffa830', x - ww, y - 4 - j, ww * 2, 1); if (ww > 1) Q(ctx, k > 0.6 ? '#ffb040' : '#ffe880', x - ww + 1, y - 4 - j, ww * 2 - 2, 1); if (k < 0.55 && ww > 2) Q(ctx, '#ffffff', x - 1, y - 4 - j, 2, 1); }
      ctx.globalAlpha = 0.12; Q(ctx, '#ff7a20', x - 12, y - 4 - st.h, 24, st.h + 2); ctx.globalAlpha = 1;
    },
    // the acid squall: a bank of yellow smog with a lit underside
    cloud(ctx, x0, x1, y, f) {
      const lump = (i) => 3 + Math.floor(hash(Math.floor(i / 6), 3) * 4), cy = (i) => y - 3 - Math.floor(hash(Math.floor(i / 6), 9) * 3);
      for (let i = x0; i < x1; i += 6) disc(ctx, i + 3, cy(i), lump(i) + 1, O); Q(ctx, O, x0 - 1, y - 3, x1 - x0 + 2, 5);
      for (let i = x0; i < x1; i += 6) disc(ctx, i + 3, cy(i), lump(i), '#565a1e'); Q(ctx, '#3e4016', x0, y - 2, x1 - x0, 3);
      for (let i = x0; i < x1; i += 6) { const r = lump(i); Q(ctx, '#8c9230', i + 3 - (r >> 1), cy(i) - r + 1, r, 1); Q(ctx, (i + (f >> 2)) % 5 < 2 ? '#e8ff5a' : '#a8b838', i + 1, y, 4, 1); }
    },
    // one drop: a slanted yellow-green streak. The one that is meant for you is fatter and has a white core
    drop(ctx, x, y, f, d) {
      if (d && d.hot) { Q(ctx, O, x - 2, y - 4, 5, 6); Q(ctx, O, x - 1, y - 8, 5, 5); Q(ctx, O, x, y - 12, 5, 5); Q(ctx, '#d8f040', x - 1, y - 3, 3, 4); Q(ctx, '#d8f040', x, y - 7, 3, 4); Q(ctx, '#a8c020', x + 1, y - 11, 3, 4); Q(ctx, '#ffffff', x, y - 3, 1, 3); Q(ctx, '#ffffff', x + 1, y - 6, 1, 3); }
      else { Q(ctx, O, x - 1, y - 3, 3, 5); Q(ctx, O, x, y - 7, 3, 5); Q(ctx, O, x + 1, y - 10, 3, 4); Q(ctx, '#b8d030', x, y - 2, 1, 3); Q(ctx, '#b8d030', x + 1, y - 6, 1, 4); Q(ctx, '#7a8c1c', x + 2, y - 9, 1, 3); }
    },
    // where it will land: the pavement fizzes
    mark(ctx, x, y, f, k) {
      const w = 3 + Math.round(k * 5), on = (f >> 2) % 2 || k > 0.7;
      if (on) { Q(ctx, O, x - w - 1, y - 2, w * 2 + 2, 4); Q(ctx, '#e8ff5a', x - w, y - 1, w * 2, 2); Q(ctx, '#ffffff', x - w + 1 + ((f >> 1) % 3), y - 1, 2, 1); }
      Q(ctx, '#e8ff5a', x - w + (f * 5) % (w * 2), y - 4 - (f % 4), 1, 1); Q(ctx, '#ffffff', x + w - (f * 3) % (w * 2), y - 3 - ((f + 2) % 5), 1, 1);
    },
    shot(ctx, x, y, f, b) { const r = b && b.rev ? -1 : 1; Q(ctx, O, x - 5, y - 2, 10, 4); Q(ctx, '#ff5a30', x - 4, y - 1, 8, 2); Q(ctx, '#ffe880', x - 4 + (r > 0 ? 0 : 3), y - 1, 5, 2); Q(ctx, '#ffffff', x + (r > 0 ? -4 : 2), y - 1, 2, 1); for (let i = 1; i < 5; i++) { ctx.globalAlpha = 0.5 - i * 0.1; Q(ctx, '#ff7a40', x + r * (2 + i * 4), y - 1, 3, 1 + (i < 3 ? 1 : 0)); } ctx.globalAlpha = 1; },
    // his sight: a red thread along the pavement, white the moment before he fires
    aim(ctx, x0, x1, y, f, k) { if (k < 0.5 && (f >> 2) % 2) return; const hot = k > 0.8; ctx.fillStyle = hot ? '#ffffff' : '#ff3040'; for (let i = x0 + ((f >> 1) % 4); i < x1; i += hot ? 3 : 4) ctx.fillRect(i, y, 2, 1); if (hot) { ctx.globalAlpha = 0.35; Q(ctx, '#ff3040', x0, y - 1, Math.max(0, x1 - x0), 3); ctx.globalAlpha = 1; } Q(ctx, O, x1 - 1, y - 1, 3, 3); Q(ctx, '#ff3040', x1, y, 1, 1); },
    // the spinner, parked on its lift jets with the lights going
    ride(ctx, x, y, f) {
      const b = Math.round(Math.sin(f / 9) * 1.2), X = x - 19, Y = y - 17 + b, a = Math.round(Math.sin(f / 6) * 2);
      ctx.globalAlpha = 0.25; Q(ctx, '#000000', x - 15, y - 1, 30, 2); ctx.globalAlpha = 0.14; Q(ctx, '#7af0ff', x - 17, y - 3, 34, 3); ctx.globalAlpha = 1;
      ctx.drawImage(car, X, Y); lights(ctx, X, Y, f); lift(ctx, X, Y, f, false);
      Q(ctx, O, x - 4, y - 31 + a, 9, 5); Q(ctx, O, x - 2, y - 27 + a, 5, 3); Q(ctx, O, x - 1, y - 25 + a, 3, 2); Q(ctx, '#ffffff', x - 3, y - 30 + a, 7, 3); Q(ctx, '#ffffff', x - 1, y - 27 + a, 3, 2); Q(ctx, '#ffffff', x, y - 25 + a, 1, 1);
    },
    // flying it: head and shoulders out of the canopy, lift jets burning
    riding(ctx, x, y, f, s, hero) {
      const X = x - 19, Y = y - 16 + ((f >> 2) % 2);
      ctx.save(); ctx.beginPath(); ctx.rect(x - 20, y - 60, 40, 60 - 12); ctx.clip(); ctx.drawImage(hero.c, Math.round(x - hero.ox - 1), Math.round(y - 2 - hero.oy)); ctx.restore();
      ctx.drawImage(car, X, Y); lights(ctx, X, Y, f); lift(ctx, X, Y, f, true);
      ctx.globalAlpha = 0.16; ctx.fillStyle = '#fff0c0'; ctx.beginPath(); ctx.moveTo(X + 37, Y + 6); ctx.lineTo(X + 78, Y + 1); ctx.lineTo(X + 78, Y + 17); ctx.fill(); ctx.globalAlpha = 1;
      for (let i = 0; i < 3; i++) { ctx.globalAlpha = 0.4 - i * 0.12; Q(ctx, '#9aeaff', X - 5 - i * 6 - (f % 3), Y + 7 + (i % 2), 5, 1); } ctx.globalAlpha = 1;
    },
    // the paper unicorn keeps station by your shoulder; a ring of folds turns round you
    shield(ctx, x, y, f) {
      const a0 = f / 22;
      for (let i = 0; i < 6; i++) { const a = a0 + (i / 6) * Math.PI * 2, px0 = Math.round(x + Math.cos(a) * 13), py0 = Math.round(y - 15 + Math.sin(a) * 19), back = Math.sin(a + 0.6) < -0.2; ctx.globalAlpha = back ? 0.45 : 1; Q(ctx, '#ffffff', px0, py0 - 1, 1, 3); Q(ctx, i % 2 ? '#9aeaff' : '#ffe880', px0 - 1, py0, 3, 1); } ctx.globalAlpha = 1;
      const ux = Math.round(x - 17 + Math.sin(f / 17) * 2), uy = Math.round(y - 37 + Math.sin(f / 11) * 2);
      ctx.drawImage((f >> 6) % 4 === 3 ? uniL : uni, ux, uy); if ((f >> 3) % 5 === 0) Q(ctx, '#ffe880', ux + 9, uy - 1, 1, 1);
    },
  };
  return { fx, gunner: { idle: gunman(0), aim: gunman(1), fire: gunman(2) }, seeker: [drone(0), drone(1), drone(2)] };
}
