// THE HIVE: its own dangers and its ride. Everything here is drawn for the hive level only (see danger.js for the contract).
//   the power loader (ride)   a yellow cargo exosuit parked on the deck: climb in and stomp through everything for 7 seconds
//   sentry gun (gunner)       a squat tripod gun with a scanner head: a red sight line, then tracer along the deck
//   hatchling (dropper)       a small pale hive tick clinging under the gallery: lets go, lands, springs at you
//   larva (backer)            a pale eyeless grub rearing up and squirming away down the corridor: catch it up and stomp it
//   coolant jet (vent)        a split coolant pipe in the deck that vents freezing steam on a cycle
//   motion tracker            the little scope bottom right: a blip for everything alive ahead of you
import { cv } from '../kit.js';

const O = '#000';
const Y1 = '#f5b81c', YH = '#ffe566', YS = '#c4860e', YD = '#8a5a0a', YK = '#17130b';      // loader yellow: main, lit, shade, far side, stripe black
const S1 = '#6b7684', SH = '#b4c0cc', SD = '#39414b', SK = '#1c2228';                      // steel

// draw on a canvas, then put a 1 px black outline round whatever was drawn
function outlined(w, h, draw, ox, oy) {
  const a = cv(w + 2, h + 2), ax = a.getContext('2d'); ax.translate(1, 1); draw(ax); ax.translate(-1, -1);
  const s = cv(w + 2, h + 2), sx = s.getContext('2d'); sx.drawImage(a, 0, 0); sx.globalCompositeOperation = 'source-in'; sx.fillStyle = O; sx.fillRect(0, 0, w + 2, h + 2);
  const c = cv(w + 2, h + 2), x = c.getContext('2d'); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) x.drawImage(s, dx, dy); x.drawImage(a, 0, 0);
  return { c, ox: ox + 1, oy: oy + 1 };
}
const R = (x, col, x0, y0, w, h) => { x.fillStyle = col; x.fillRect(Math.round(x0), Math.round(y0), w, h); };
function line(x, col, x0, y0, x1, y1, t = 1) {                 // a pixel line, t px thick
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); x.fillStyle = col;
  for (let i = 0; i <= n; i++) x.fillRect(Math.round(x0 + ((x1 - x0) * i) / n - (t - 1) / 2), Math.round(y0 + ((y1 - y0) * i) / n - (t - 1) / 2), t, t);
}
const stripes = (x, x0, y0, w, h, a = Y1, b = YK) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) { x.fillStyle = ((i + j) >> 1) % 2 ? b : a; x.fillRect(x0 + i, y0 + j, 1, 1); } };

// ---------------------------------------------------------------- the power loader
// a 54 x 56 cell, the hero's feet centre at column 22 (he faces right), the floor under row 55. He rides 11 px up (RISE), on long two-part legs.
const LW = 54, LH = 56, LX = 22, RISE = 11;
function leg(x, hipX, footX, lift, far) {                       // hip -> knee (forward) -> ankle -> a big flat foot
  const a = far ? YS : Y1, b = far ? YD : YS, hi = far ? YS : YH, fy = LH - 4 - lift, kx = Math.round((hipX + footX) / 2) + 4, ky = 45 - (lift >> 1);
  for (let y = 39; y <= ky; y++) { const t = (y - 39) / (ky - 39), cx = Math.round(hipX + (kx - hipX) * t); R(x, a, cx - 4, y, 8, 1); R(x, b, cx + 2, y, 2, 1); R(x, hi, cx - 4, y, 1, 1); }          // thigh
  for (let y = ky; y < fy; y++) { const t = (y - ky) / Math.max(1, fy - ky), cx = Math.round(kx + (footX - kx) * t); R(x, a, cx - 3, y, 7, 1); R(x, b, cx + 2, y, 2, 1); R(x, SH, cx - 1, y, 1, 1); }   // shin, with its piston rod
  R(x, SD, kx - 3, ky - 2, 6, 5); R(x, S1, kx - 2, ky - 1, 4, 3); R(x, SH, kx - 2, ky - 1, 2, 1);                                                                   // knee joint
  R(x, a, footX - 7, fy, 17, 3); R(x, hi, footX - 7, fy, 17, 1); R(x, SK, footX - 8, fy + 3, 19, 1); stripes(x, footX + 6, fy, 4, 3, a, YK);                        // foot plate, sole, striped toe
}
function arm(x, bob, open, far, low = 0) {                      // the boom arm and its claw
  const a = far ? YS : Y1, b = far ? YD : YS, hi = far ? YS : YH, y = (far ? 27 : 29) + bob, x0 = far ? 26 : 22;
  if (low) {                                                    // parked: the arm hangs to the deck, claw open on the floor
    line(x, a, x0 + 3, y + 2, 39, 46, 4); line(x, hi, x0 + 3, y, 39, 44, 1); R(x, S1, 39, 44, 4, 6); R(x, SH, 39, 44, 4, 1);
    R(x, a, 42, 42, 8, 2); R(x, YK, 49, 42, 2, 3); R(x, a, 42, 50, 8, 2); R(x, YK, 49, 49, 2, 3);
  } else {
    R(x, a, x0 + 3, y, 16, 4); R(x, hi, x0 + 3, y, 16, 1); R(x, b, x0 + 3, y + 3, 16, 1); R(x, SH, x0 + 8, y - 1, 9, 1); stripes(x, x0 + 12, y + 1, 5, 2, a, YK);   // forearm, its piston, a hazard band
    const wx = x0 + 19; R(x, S1, wx, y - 1, 3, 6); R(x, SH, wx, y - 1, 3, 1);                                                                                      // wrist block
    const o = open ? 3 : 0;                                                                                                                                         // two jaws: shut, or sprung apart
    line(x, a, wx + 3, y - o, wx + 9, y - (open ? 5 : 0), 2); R(x, YK, wx + 9, y - (open ? 5 : 0), 2, 2);
    line(x, a, wx + 3, y + 3 + o, wx + 9, y + 3 + (open ? 5 : 0), 2); R(x, YK, wx + 9, y + 3 + (open ? 4 : 0), 2, 2);
  }
  if (!far) { R(x, S1, x0 - 1, y - 2, 7, 8); R(x, SD, x0, y - 3, 5, 10); R(x, S1, x0, y - 2, 5, 8); R(x, SH, x0 + 1, y - 2, 3, 1); R(x, YK, x0 + 2, y + 1, 1, 2); }   // the elbow joint on the side of the cab
}
function loaderBack(ph, open, parked) {                          // everything behind the pilot
  const P = [[4, 0, -4, 0], [0, 0, 0, 2]], far = (ph + 2) % 4;
  return outlined(LW, LH, (x) => {
    leg(x, LX + 2, LX + 2 + (parked ? 3 : P[0][far]), parked ? 0 : P[1][far], true);
    arm(x, parked ? 0 : (ph % 2 ? -1 : 0), open, true, parked);
    R(x, SD, 3, 16, 11, 23); R(x, S1, 3, 16, 1, 23); R(x, Y1, 3, 14, 11, 3); R(x, YH, 3, 14, 11, 1);                                   // the power pack
    for (let j = 20; j < 32; j += 3) R(x, SK, 5, j, 7, 1); stripes(x, 4, 34, 9, 3); R(x, S1, 5, 8, 3, 6); R(x, SH, 5, 8, 1, 6); R(x, SK, 4, 7, 5, 1);   // vents, hazard plate, exhaust stack
    R(x, YS, 14, 14, 3, 26); R(x, YD, 16, 14, 1, 26);                                                                                 // the spine the pilot leans on
    if (parked) { R(x, SK, 17, 22, 6, 16); R(x, SD, 17, 22, 6, 1); line(x, S1, 18, 23, 22, 34); line(x, S1, 22, 23, 18, 34); R(x, YS, 17, 38, 8, 2); }   // empty seat: back pad, harness, seat pan
  }, LX, LH);
}
function loaderFront(ph, open, parked) {                         // everything in front of the pilot
  const P = [[4, 0, -4, 0], [0, 0, 0, 2]];
  return outlined(LW, LH, (x) => {
    R(x, Y1, 11, 8, 22, 3); R(x, YH, 11, 8, 22, 1); R(x, YS, 11, 10, 22, 1); R(x, Y1, 11, 11, 3, 4); R(x, Y1, 30, 11, 3, 5); R(x, YS, 32, 11, 1, 5);   // roll cage: top bar, rear post, short front strut
    R(x, SD, 31, 12, 4, 3); R(x, '#ffffff', 34, 12, 2, 3); stripes(x, 17, 8, 8, 2);                                                   // lamp on the front strut, hazard band on the bar
    leg(x, LX, LX + (parked ? -2 : P[0][ph]), parked ? 0 : P[1][ph], false);
    R(x, Y1, 12, 35, 22, 5); R(x, YH, 12, 35, 22, 1); R(x, YS, 12, 39, 22, 1); stripes(x, 14, 36, 18, 3); R(x, S1, 19, 34, 7, 7); R(x, SH, 20, 34, 5, 1); R(x, SK, 21, 36, 3, 3);   // hip ring + pivot
    arm(x, parked ? 0 : (ph % 2 ? 1 : 0), open, false, parked);
  }, LX, LH);
}
const LOADER = { back: [], front: [] };
for (let ph = 0; ph < 4; ph++) for (let o = 0; o < 2; o++) { LOADER.back.push(loaderBack(ph, o, false)); LOADER.front.push(loaderFront(ph, o, false)); }
const PARKED = outlined(LW + 2, LH + 2, (x) => { const b = loaderBack(0, 1, true), f = loaderFront(0, 1, true); x.drawImage(b.c, 0, 0); x.drawImage(f.c, 0, 0); }, LX + 1, LH + 1);
const PARKED_LIT = (() => { const c = cv(PARKED.c.width, PARKED.c.height), x = c.getContext('2d'); x.drawImage(PARKED.c, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff6b0'; x.fillRect(0, 0, c.width, c.height); return c; })();
const beacon = (ctx, x, y, f) => { const on = (f >> 3) % 2; R(ctx, O, x - 2, y - 4, 5, 5); R(ctx, on ? '#fff38a' : '#a8500a', x - 1, y - 3, 3, 3); if (on) { R(ctx, '#ff8a1a', x - 4, y - 2, 2, 1); R(ctx, '#ff8a1a', x + 3, y - 2, 2, 1); R(ctx, '#ff8a1a', x, y - 6, 1, 2); } };

// ---------------------------------------------------------------- the sentry gun (faces left; the muzzle is 10 px left of centre, 9 px up: where the shot starts)
function sentry(k) {
  const lens = ['#3fd65a', '#ff3030', '#ffffff'][k], rc = k === 2 ? 1 : 0;
  return outlined(34, 30, (x) => {
    for (const [fx, c] of [[9, S1], [25, SH], [17, SH]]) line(x, c, 17, 23, fx, 29);                                             // tripod
    R(x, SK, 7, 29, 4, 1); R(x, SK, 23, 29, 4, 1); R(x, SK, 15, 29, 4, 1);
    R(x, SD, 15, 21, 5, 3); R(x, SH, 15, 21, 5, 1);                                                                              // swivel
    R(x, '#d6cf9c', 11 + rc, 15, 13, 7); R(x, '#fffbd6', 11 + rc, 15, 13, 1); R(x, '#8f8a5e', 11 + rc, 21, 13, 1);                // receiver (olive)
    R(x, '#7f8f62', 19 + rc, 12, 7, 9); R(x, '#b9c98e', 19 + rc, 12, 7, 1); R(x, '#4a563a', 20 + rc, 15, 5, 1); R(x, '#4a563a', 20 + rc, 18, 5, 1);   // ammo drum
    R(x, SH, 2 + rc, 19, 9, 3); R(x, '#eef4fa', 2 + rc, 19, 9, 1); R(x, S1, 2 + rc, 21, 9, 1); R(x, SD, 0 + rc, 18, 3, 5); R(x, SH, 1 + rc, 19, 1, 3);               // barrel and muzzle brake: 9 px up, where the shot leaves
    R(x, SH, 15, 9, 2, 6); R(x, S1, 16, 9, 1, 6);                                                                                // scanner mast
    R(x, '#d6cf9c', 10, 3, 11, 6); R(x, '#fffbd6', 10, 3, 11, 1); R(x, '#8f8a5e', 10, 8, 11, 1); R(x, SK, 9, 4, 2, 4); R(x, lens, 9, 5, 2, 2); R(x, k ? '#ff3030' : '#1e6a2c', 17, 5, 2, 2);   // scanner head: lens, status light
    line(x, S1, 20, 3, 23, 0);                                                                                                   // aerial
    R(x, '#ff5a2a', 12 + rc, 17, 6, 2);                                                             // a stencil stripe on the receiver
    if (k === 2) { R(x, '#fff38a', 0, 19, 2, 4); R(x, '#ffffff', 0, 20, 2, 2); }
  }, 17, 30);
}
function sentryFire() {                                           // the firing frame with its muzzle flash (not outlined: it should glow)
  const b = sentry(2), c = cv(b.c.width + 8, b.c.height), x = c.getContext('2d'); x.drawImage(b.c, 8, 0);
  R(x, '#ff8a1a', 1, 19, 9, 5); R(x, '#ffe14a', 3, 20, 7, 3); R(x, '#ffffff', 6, 21, 4, 1); R(x, '#ffe14a', 5, 16, 2, 2); R(x, '#ffe14a', 5, 25, 2, 2); R(x, '#ff8a1a', 3, 15, 1, 1); R(x, '#ff8a1a', 3, 27, 1, 1);
  return { c, ox: b.ox + 8, oy: b.oy };
}

// ---------------------------------------------------------------- the hatchling: a small pale hive tick (faces left)
// a round ribbed back, a little head shield with two red eyes up on stalks, three pairs of high-kneed crab legs, two pincers. No tail.
const F1 = '#f2d2a8', FH = '#fff6e4', FS = '#c0906a', FD = '#7c5a44', FP_ = '#ff7a66', FE = '#ff2a1a';
function tickBody(x, cx, cy, up = 0) {                            // body centre (cx, cy); up: nose-up tilt in px across the body
  const tl = (i) => Math.round((i / 10) * up);
  for (let j = -3; j <= 3; j++) { const w = Math.round(5.4 * Math.sqrt(1 - (j / 3.6) ** 2)); for (let i = -w; i <= w; i++) R(x, j === -3 ? FH : j >= 2 ? FS : F1, cx + 2 + i, cy + j - tl(i), 1, 1); }   // the ribbed back
  for (let k = 0; k < 3; k++) R(x, FD, cx + 1 + k * 2, cy - 2 - tl(k * 2 - 1), 1, 4);
  for (let j = -2; j <= 2; j++) { const w = Math.round(3 * Math.sqrt(1 - (j / 2.6) ** 2)); R(x, j === -2 ? FH : j === 2 ? FS : F1, cx - 4 - w, cy + 1 + j + tl(4), w * 2 + 1, 1); }      // the head shield
  for (const ex of [-6, -3]) { const ey = cy - 2 + tl(-ex); line(x, FS, cx + ex + 1, ey + 1, cx + ex, ey - 1); R(x, '#000', cx + ex - 1, ey - 3, 3, 3); R(x, FE, cx + ex, ey - 2, 1, 1); }   // eyes on stalks
}
function hatch(pose, ph = 0) {
  const W = 28, H = 16;
  if (pose === 'hang') return outlined(W, 15, (x) => {            // clinging under the beam: upside down, all six legs hooked over it, pincers twitching
    for (let k = 0; k < 3; k++) { const bx = 9 + k * 3, sx = (k - 1) * 3; line(x, FS, bx, 7, bx + sx, 3); line(x, FS, bx + sx, 3, bx + sx * 1.6, 0); line(x, F1, bx + 1, 7, bx + 1 + sx, 4); line(x, F1, bx + 1 + sx, 4, bx + 1 + sx * 1.6, 0); }
    for (let j = 0; j < 5; j++) { const w = [3, 5, 5, 4, 2][j]; R(x, j === 4 ? FS : F1, 13 - w, 6 + j, w * 2 + 1, 1); } for (let k = 0; k < 3; k++) R(x, FD, 10 + k * 2, 7, 1, 3);   // its belly, ribbed
    R(x, F1, 6, 7, 4, 3); R(x, FS, 6, 9, 4, 1); R(x, '#000', 4, 10, 3, 3); R(x, FE, 5, 11, 1, 1); R(x, '#000', 7, 11, 3, 3); R(x, FE, 8, 12, 1, 1);                                       // head hanging down, eyes underneath
    line(x, F1, 6, 9, 3, 12); line(x, F1, 3, 12, 2, 10); line(x, F1, 3, 12, 4, 14);
  }, 12, 0);
  return outlined(W, H, (x) => {
    const leap = pose === 'leap', fall = pose === 'fall', by = leap ? 6 : fall ? 6 : 9 - (ph ? 1 : 0), cx = 11;
    const legs = (fn) => { for (const far of [1, 0]) for (let k = 0; k < 3; k++) { const [kx, ky, fx, fy] = fn(k, far, cx - 3 + k * 3 + far); const c = far ? FS : F1; line(x, c, cx - 3 + k * 3 + far, by + 2, kx, ky); line(x, c, kx, ky, fx, fy); } };
    if (fall) {                                                   // dropping: legs flung out wide below it, reaching
      legs((k, far, bx) => { const sx = (k - 1) * 4; return [bx + sx, by + 4, bx + sx * 1.5 + (far ? 1 : 0), 15]; });
      tickBody(x, cx, by); line(x, F1, cx - 6, by + 2, cx - 9, by + 5); line(x, F1, cx - 9, by + 5, cx - 10, by + 3); line(x, F1, cx - 9, by + 5, cx - 8, by + 7);
    } else if (leap) {                                            // springing: nose up, pincers thrown open at you, legs trailing
      legs((k, far, bx) => { const sx = (k - 1) * 3; return [bx + sx + 2, by - 1, bx + sx + 5 + far, by + 6 + k]; });
      tickBody(x, cx, by + 1, 3);
      for (const s of [-1, 1]) { line(x, F1, cx - 6, by + 2, cx - 10, by + 1 + s * 2); line(x, F1, cx - 10, by + 1 + s * 2, cx - 13, by + s * 3); line(x, FS, cx - 10, by + 1 + s * 2, cx - 12, by + 3 + s); }
    } else {                                                      // scuttling sideways on its crab legs
      legs((k, far, bx) => { const sx = (k - 1) * 3, w = ((k + ph + far) % 2) ? 1 : -1; return [bx + sx + w, by - 3, bx + sx * 1.6 - w, 15 - (w > 0 && !far ? 1 : 0)]; });
      tickBody(x, cx, by);
      line(x, F1, cx - 6, by + 2, cx - 9, by + 2 + (ph ? 1 : 0)); line(x, F1, cx - 9, by + 2 + (ph ? 1 : 0), cx - 11, by + 1); line(x, FS, cx - 9, by + 2 + (ph ? 1 : 0), cx - 11, by + 4);   // a pincer, snapping
    }
  }, 9, H);
}

// ---------------------------------------------------------------- the larva: a pale eyeless grub rearing up as it squirms away (faces RIGHT: it is running from you)
function larva(ph) {
  return outlined(22, 26, (x) => {
    const s = ph % 2 ? 1 : -1, w = ph > 1 ? 1 : 0;
    const P = [[2, 24], [7, 25], [11, 22 - w], [10 + s, 17], [13 - s, 12], [12 + s, 7], [15, 3 + w]];                           // tail on the deck, body up in an S, head forward
    for (let i = 0; i < P.length - 1; i++) line(x, F1, P[i][0], P[i][1], P[i + 1][0], P[i + 1][1], i < 1 ? 2 : i < 2 ? 3 : 4);
    for (let i = 1; i < P.length - 1; i++) line(x, FS, P[i][0] - 2, P[i][1] + 1, P[i + 1][0] - 2, P[i + 1][1] + 1, 1);
    for (let i = 2; i < P.length - 1; i++) { const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2; R(x, FD, mx - 1, my, 3, 1); }   // ribbing
    const hx = P[6][0], hy = P[6][1]; R(x, F1, hx - 2, hy - 2, 7, 5); R(x, FH, hx - 1, hy - 2, 5, 1); R(x, FS, hx - 2, hy + 2, 6, 1);                 // blunt head, no eyes
    R(x, '#3a1410', hx + 2, hy + 1, 3, 1); R(x, '#dfe8f0', hx + 3, hy + (w ? 2 : 1), 2, 1);                                      // the mouth and its little steel teeth
    line(x, FS, P[4][0] + 2, P[4][1], P[4][0] + 5, P[4][1] + 2 - w);                                                             // a stub of an arm
  }, 10, 26);
}

// ---------------------------------------------------------------- sprites for skin.chr, live drawing for skin.fx
export function hiveChr() {
  return { gunner: { idle: sentry(0), aim: sentry(1), fire: sentryFire() }, dropper: { hang: hatch('hang'), fall: hatch('fall'), leap: hatch('leap'), run: [hatch('run', 0), hatch('run', 1)] }, backer: [0, 1, 2, 3].map(larva) };
}
export const HANG_H = 13;                                           // how far the hatchling's lowest point hangs below the beam

const STEAM = ['#ffffff', '#dff6ff', '#9fd8ea', '#5aa0b8'];
export const hiveFx = {
  // a coolant pipe that has split where it crosses the deck: frost round it, a jet of freezing steam on a cycle
  vent(ctx, x, y, st, f) {
    R(ctx, O, x - 9, y - 2, 18, 4); R(ctx, S1, x - 8, y - 1, 16, 2); R(ctx, SH, x - 8, y - 1, 16, 1); stripes(ctx, x - 8, y, 4, 1); stripes(ctx, x + 4, y, 4, 1);   // a collar plate bolted to the deck
    R(ctx, O, x - 4, y - 6, 8, 5); R(ctx, S1, x - 3, y - 5, 6, 4); R(ctx, SH, x - 3, y - 5, 1, 4); R(ctx, SD, x + 1, y - 5, 2, 4);                                    // the pipe stub
    R(ctx, O, x - 2, y - 6, 1, 2); R(ctx, O, x + 1, y - 6, 2, 1); R(ctx, '#bfe8f4', x - 3, y - 5, 1, 1); R(ctx, '#bfe8f4', x + 2, y - 4, 1, 1);                        // its torn lip, rimed with frost
    for (const dx of [-12, -10, 10, 12]) R(ctx, '#bfe8f4', x + dx, y, 1, 1);
    if (st.warn > 0) {                                                                                                                     // it spits before it blows, harder as it gets close
      const n = 1 + Math.round(st.warn * 3);
      for (let i = 0; i < n; i++) { const a = (f * 3 + i * 7) % 9, dx = ((f + i * 5) % 7) - 3; R(ctx, O, x + dx - 1, y - 7 - a, 3, 3); R(ctx, STEAM[i % 2], x + dx, y - 6 - a, 1, 1); }
      if ((f >> 1) % 2) { R(ctx, '#ff3030', x - 7, y - 1, 2, 1); R(ctx, '#ff3030', x + 6, y - 1, 2, 1); }
      return;
    }
    if (!st.on) return;
    const h = Math.round(st.h), wd = (j) => { const t = j / Math.max(1, h); return Math.max(2, Math.round(2 + t * 4 + Math.sin(j * 0.9 + f * 0.7) * 1.2 - (j > h - 3 ? 2 : 0))); };
    for (let j = 0; j < h; j++) { const w = wd(j), o = Math.round(Math.sin(j * 0.45 + f * 0.5) * (j / h) * 1.5); R(ctx, O, x - w - 1 + o, y - 5 - j, w * 2 + 2, 1); }
    R(ctx, O, x - 4, y - 5 - h, 8, 1);
    for (let j = 0; j < h; j++) {
      const w = wd(j), o = Math.round(Math.sin(j * 0.45 + f * 0.5) * (j / h) * 1.5);
      R(ctx, STEAM[2], x - w + o, y - 5 - j, w * 2, 1); R(ctx, STEAM[1], x - w + 1 + o, y - 5 - j, Math.max(1, w * 2 - 3), 1); R(ctx, STEAM[0], x - 1 + o, y - 5 - j, 2, 1);
      if ((j * 5 + f * 2) % 11 === 0) R(ctx, STEAM[3], x - w + o + 1, y - 5 - j, 2, 1);
    }
    for (let i = 0; i < 4; i++) { const a = (f * 2 + i * 9) % 14, dx = (i - 1.5) * 5 + Math.sin(f / 5 + i) * 2; ctx.globalAlpha = 1 - a / 14; R(ctx, STEAM[1], x + dx, y - 6 - h - a, 2, 2); } ctx.globalAlpha = 1;   // it rolls off the top
  },
  // tracer: a hot white slug with a yellow tail
  shot(ctx, x, y, f, b) {
    const d = b.rev ? -1 : 1;
    for (let i = 1; i <= 5; i++) { ctx.globalAlpha = 0.7 - i * 0.12; R(ctx, i < 3 ? '#ffe14a' : '#ff8a1a', x + d * (2 + i * 4), y, 4, 1); } ctx.globalAlpha = 1;
    R(ctx, O, x - 4, y - 2, 8, 4); R(ctx, '#ffe14a', x - 3, y - 1, 6, 2); R(ctx, '#ffffff', x - (d > 0 ? 3 : -1), y - 1, 3, 1);
  },
  // the sentry's laser: a thin red line that hardens and goes white just before it fires
  aim(ctx, x0, x1, y, f, k) {
    if (k > 0.75) { R(ctx, (f >> 1) % 2 ? '#ffffff' : '#ff6a6a', x0, y, x1 - x0, 1); }
    else { ctx.globalAlpha = 0.45 + k * 0.5; ctx.fillStyle = '#ff3030'; for (let i = x1 - 2 - (f % 6); i > x0; i -= 6) ctx.fillRect(i, y, 3, 1); ctx.globalAlpha = 1; }
    const dx = 72; if (dx > x0 && dx < x1) { R(ctx, O, dx - 2, y - 2, 5, 5); R(ctx, k > 0.75 ? '#ffffff' : '#ff3030', dx - 1, y - 1, 3, 3); }                   // the dot on the hero's shins
  },
  // the loader parked on the deck: beacon turning, lamp on, a pulse of light and an arrow so you can't miss it
  ride(ctx, x, y, f) {
    const p = f % 48;
    if (p < 6) { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(PARKED_LIT, Math.round(x - PARKED.ox + dx), Math.round(y - PARKED.oy + dy)); }
    ctx.drawImage(PARKED.c, Math.round(x - PARKED.ox), Math.round(y - PARKED.oy));
    beacon(ctx, x - 14, y - 49, f);
    const b = Math.round(Math.abs(Math.sin(f / 7)) * 4), ay = y - 60 - b;                                                                   // the arrow
    R(ctx, O, x - 3, ay - 6, 7, 6); R(ctx, O, x - 6, ay, 13, 3); R(ctx, O, x - 4, ay + 2, 9, 2); R(ctx, O, x - 2, ay + 4, 5, 2); R(ctx, O, x - 1, ay + 5, 3, 2);
    R(ctx, YH, x - 2, ay - 5, 5, 6); R(ctx, YH, x - 5, ay + 1, 11, 1); R(ctx, Y1, x - 3, ay + 2, 7, 1); R(ctx, Y1, x - 2, ay + 3, 5, 1); R(ctx, Y1, x - 1, ay + 4, 3, 1); R(ctx, YS, x, ay + 5, 1, 1);
  },
  // the hero strapped in and stomping: legs striding, claws snapping, exhaust puffing. In the air the legs tuck
  riding(ctx, x, y, f, s, hero) {
    const ph = s.onGround ? (f >> 2) % 4 : 3, open = (f >> 3) % 2, i = ph * 2 + open, dip = s.onGround && ph % 2 === 0 ? 1 : 0, B = LOADER.back[i], F = LOADER.front[i], yy = y + dip;
    ctx.drawImage(B.c, Math.round(x - B.ox), Math.round(yy - B.oy));
    ctx.save(); ctx.beginPath(); ctx.rect(x - 14, yy - 54, 34, 39); ctx.clip(); ctx.drawImage(hero.c, Math.round(x - hero.ox), Math.round(yy - RISE - hero.oy)); ctx.restore();   // only his top half shows: the hip ring hides the rest
    ctx.drawImage(F.c, Math.round(x - F.ox), Math.round(yy - F.oy));
    beacon(ctx, x - 14, yy - 49, f);
    for (let k = 0; k < 3; k++) { const a = (f + k * 6) % 18; ctx.globalAlpha = 0.8 - a / 22; R(ctx, k % 2 ? '#8a94a0' : '#c8d0d8', x - 17 - a * 0.9, yy - 50 - a * 0.5, 2 + (a >> 3), 2 + (a >> 3)); } ctx.globalAlpha = 1;   // exhaust
    if (s.onGround && ph % 2 === 0 && f % 4 < 2) { R(ctx, '#c8d0d8', x + (ph ? -12 : 14), y - 2, 2, 1); R(ctx, '#8a94a0', x + (ph ? -14 : 17), y - 3, 1, 1); }                      // a puff of dust under each footfall
    
  },
  // flak armour: a hard hex shell that flickers round him
  shield(ctx, x, y, f) {
    const on = (f >> 2) % 2;
    for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2, px = Math.round(x + Math.cos(a) * 12), py = Math.round(y - 15 + Math.sin(a) * 19); if ((i + (f >> 3)) % 3 === 0) continue; R(ctx, O, px - 1, py - 1, 3, 3); R(ctx, on ? '#b8e060' : '#f2ffd0', px, py, 1, 1); }
  },
};

// ---------------------------------------------------------------- the motion tracker, bottom right
const DIG = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001', '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
const digit = (ctx, d, x, y, col) => { ctx.fillStyle = col; const g = DIG[d]; for (let i = 0; i < 15; i++) if (g[i] === '1') ctx.fillRect(x + (i % 3), y + ((i / 3) | 0), 1, 1); };
export function tracker(ctx, f, s) {
  if (!s || s.dead) return;
  const X0 = 286, Y0 = 160, W = 33, H = 19, cx = X0 + 16, cy = Y0 + H - 3, RAD = 13, FPX = 256, px = s.dist + 72 * FPX;
  R(ctx, O, X0, Y0, W, H); R(ctx, '#39414b', X0 + 1, Y0 + 1, W - 2, H - 2); R(ctx, '#6b7684', X0 + 1, Y0 + 1, W - 2, 1); R(ctx, '#03100a', X0 + 2, Y0 + 2, W - 4, H - 4);
  ctx.save(); ctx.beginPath(); ctx.rect(X0 + 2, Y0 + 2, W - 4, H - 4); ctx.clip();
  const arc = (r, col) => { ctx.fillStyle = col; for (let a = 0; a <= 40; a++) { const t = Math.PI * (a / 40); ctx.fillRect(Math.round(cx - Math.cos(t) * r), Math.round(cy - Math.sin(t) * r * 0.95), 1, 1); } };
  arc(5, '#0e3a22'); arc(9, '#0e3a22'); arc(RAD + 1, '#0e3a22'); R(ctx, '#0e3a22', cx, Y0 + 2, 1, H);
  const sweep = (f % 44) / 44; arc(sweep * (RAD + 2), sweep < 0.85 ? '#2fae62' : '#16603a');
  let near = 1e9; const things = [];
  for (const g of s.goblins) if (!g.dead && !g.stomped) things.push(g); for (const g of s.flyers) if (!g.dead) things.push(g); for (const g of s.unicorns) if (!g.dead) things.push(g);
  for (const g of things) {
    const d = (g.x - px) / FPX; if (d < 4 || d > 380) continue; near = Math.min(near, d);
    const r = (d / 380) * RAD, t = Math.PI * (0.5 - Math.max(-0.38, Math.min(0.38, ((g.id * 37) % 21 - 10) / 26))), bx = Math.round(cx - Math.cos(t) * r * 0.9), by = Math.round(cy - Math.sin(t) * r * 0.95);
    const age = ((sweep - d / 380) % 1 + 1) % 1, hot = age < 0.3;
    R(ctx, hot ? '#eaffea' : '#3fd67a', bx - 1, by, 3, 1); R(ctx, hot ? '#eaffea' : '#3fd67a', bx, by - 1, 1, 3); if (hot) R(ctx, '#6affa0', bx - 1, by - 1, 3, 3), R(ctx, '#ffffff', bx, by, 1, 1);
  }
  R(ctx, '#eaffea', cx - 1, cy - 1, 3, 2);                                                                                              // you
  ctx.restore();
  if (near < 1e9) { const m = Math.min(99, Math.round(near / 8)), col = near < 110 && (f >> 2) % 2 ? '#ff5a4a' : '#6affa0'; digit(ctx, (m / 10) | 0, X0 + 3, Y0 + 3, col); digit(ctx, m % 10, X0 + 7, Y0 + 3, col); }
  R(ctx, things.length && near < 110 && (f >> 2) % 2 ? '#ff3030' : '#5a1616', X0 + W - 5, Y0 + 3, 2, 2);
}
