// Black Hole Friday, level 6: INVERSION. The motorway: the traffic you run across, and the road it is on. DRAWING ONLY (tenet-film.js calls it).
// Every vehicle is a platform from sim.js (spawnFilm: p.veh = its kind, p.vi = which paint): its roof is p.y, its length p.w, its wheels on the road.
// Scale: lengths ~10 px a metre, heights ~12 px a metre (the hero is 30 px). Cab at the right: on the way out the traffic goes your way.
// Original designs only: no makes, no badges, no lettering.
import { cv } from '../kit.js';

const O = '#000';
export const ROAD = 218;                               // world y of the road surface (the deck, the flatbed you run along, is at 200)
const R = (x, col, x0, y0, w, h) => { x.fillStyle = col; x.fillRect(Math.round(x0), Math.round(y0), Math.max(0, Math.round(w)), Math.max(0, Math.round(h))); };
const disc = (x, cx, cy, r, col) => { x.fillStyle = col; for (let j = -r; j <= r; j++) { const w = Math.floor(Math.sqrt(r * r - j * j + r * 0.8)); x.fillRect(Math.round(cx - w), Math.round(cy + j), w * 2 + 1, 1); } };
const shade = (h, k) => { const n = parseInt(h.slice(1), 16), f = (v) => Math.max(0, Math.min(255, Math.round(v * k))); return '#' + ((1 << 24) | (f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1); };

// paints (by p.vi)
const PAINT = {
  van: ['#d8dde4', '#c4302a', '#2e5a8a', '#e0b030'],
  armour: ['#4a5560', '#3c4a42', '#5a5650', '#3a4252'],
  bus: ['#e8e2d0', '#2a6a9a', '#b83a2a', '#3a7a5a'],
  box: ['#e6e8ec', '#2a3a5a', '#7a2a2a', '#c8a030'],
  curtain: ['#2a6a4a', '#3a4a7a', '#8a3a2a', '#5a5a62'],
  tanker: ['#c8ccd2', '#d8d0b8', '#b8bec8', '#c0c4c8'],
  carrier: ['#3a3e46', '#4a3a3a', '#2e3a46', '#3e3e3e'],
  cab: ['#c42a22', '#e8e8ea', '#2a4a8a', '#2a6a4a'],
  car: ['#b8bcc4', '#2a2e36', '#8a1a1a', '#2a4a7a', '#e0e0e0', '#4a6a3a', '#7a6a50'],
};

// ---- parts ----
function wheel(x, cx, cy, r) { disc(x, cx, cy, r + 1, O); disc(x, cx, cy, r, '#1a1b1f'); disc(x, cx, cy, Math.max(1, r - 2), '#5a5e68'); disc(x, cx, cy, Math.max(0, r - 4), '#2a2d33'); R(x, '#9aa0aa', cx - 1, cy - r + 2, 2, 1); }
function arch(x, cx, top, r, body) { for (let j = 0; j <= r + 1; j++) { const w = Math.round(Math.sqrt(Math.max(0, (r + 2) * (r + 2) - (r + 2 - j) * (r + 2 - j)))); R(x, '#07080a', cx - w, top + j, w * 2 + 1, 1); } }
// a box body with a lit roof edge and a dark sill: the roof line is the landing surface, so it is always the brightest line on the vehicle
function body(x, x0, y0, w, h, col, round = 2) {
  R(x, O, x0 - 1, y0 - 1, w + 2, h + 2);
  R(x, col, x0, y0, w, h);
  R(x, shade(col, 1.18), x0, y0 + 1, w, 2); R(x, shade(col, 0.7), x0, y0 + h - 3, w, 3); R(x, shade(col, 0.85), x0, y0 + h - 5, w, 2);
  R(x, '#ffffff', x0 + round, y0, w - round * 2, 1); R(x, shade(col, 1.35), x0, y0 + 1, w, 1);
  if (round) { R(x, O, x0, y0, round, 1); R(x, O, x0 + w - round, y0, round, 1); }
}
// a truck cab, w wide (about 28), its roof spoiler level with the trailer roof at y0; front at the right
function cab(x, x0, y0, w, H, col) {
  const ct = y0 + 7;                                    // the cab's own roof, under the spoiler
  // spoiler: a wedge from the trailer roof down to the cab roof
  for (let i = 0; i < w - 4; i++) { const t = Math.round((i / (w - 4)) * 6); R(x, O, x0 + i, y0 + t - 1, 1, ct - y0 - t + 2); R(x, shade(col, 0.9), x0 + i, y0 + t, 1, ct - y0 - t); R(x, '#ffffff', x0 + i, y0 + t, 1, 1); }
  R(x, O, x0 - 1, ct - 1, w + 2, H - (ct - y0) + 1); R(x, col, x0, ct, w, H - (ct - y0) - 8);
  R(x, shade(col, 1.2), x0, ct, w, 2);
  // windscreen at the front, a side window, the door line, steps, a grille and a lamp
  R(x, O, x0 + w - 9, ct + 3, 9, 10); R(x, '#14202e', x0 + w - 8, ct + 4, 7, 8); R(x, '#5a86b0', x0 + w - 8, ct + 4, 2, 1); R(x, '#3a5a7a', x0 + w - 6, ct + 5, 1, 4);
  R(x, O, x0 + 6, ct + 3, 10, 8); R(x, '#1a2634', x0 + 7, ct + 4, 8, 6); R(x, '#4a6a8a', x0 + 7, ct + 4, 3, 1);
  R(x, shade(col, 0.6), x0 + 5, ct + 2, 1, H - (ct - y0) - 12); R(x, shade(col, 0.6), x0 + 18, ct + 2, 1, H - (ct - y0) - 12);
  R(x, '#2a2d33', x0 + 7, ct + 16, 9, 2); R(x, '#5a5e68', x0 + 7, ct + 16, 9, 1); R(x, '#2a2d33', x0 + 8, ct + 21, 8, 2);
  R(x, O, x0 + w - 2, ct + 14, 3, 9); for (let j = 0; j < 8; j += 2) R(x, '#8a909a', x0 + w - 1, ct + 15 + j, 2, 1);
  R(x, '#fff2b0', x0 + w - 1, y0 + H - 13, 2, 3); R(x, '#ff9a2a', x0 + w - 1, y0 + H - 9, 2, 1);
  R(x, O, x0 + w - 4, ct + 1, 6, 1); R(x, O, x0 + w + 1, ct + 1, 1, 6); R(x, '#5a5e68', x0 + w + 1, ct + 2, 1, 4);   // mirror
  R(x, '#2a2d33', x0, y0 + H - 8, w, 3); R(x, O, x0, y0 + H - 5, w, 1);
  R(x, '#3a3e48', x0 - 3, ct + 2, 3, 20); R(x, '#6a707a', x0 - 2, ct + 2, 1, 20);   // exhaust stack behind the cab
}
const RIB = (x, x0, y0, w, h, col, step) => { for (let i = x0 + 3; i < x0 + w - 2; i += step) { R(x, shade(col, 0.82), i, y0 + 3, 1, h - 6); R(x, shade(col, 1.1), i + 1, y0 + 3, 1, h - 6); } };
// a small car, side on, front at the right (w ~ 40): for the transporter's decks and the far lanes
export function car(x, x0, yb, w, col, lit) {
  const h = 13, y0 = yb - h;
  R(x, O, x0 - 1, y0 + 4, w + 2, h - 3); R(x, col, x0, y0 + 5, w, h - 6); R(x, shade(col, 1.25), x0, y0 + 5, w, 1); R(x, shade(col, 0.7), x0, yb - 3, w, 2);
  for (let i = 0; i < w - 14; i++) { const t = i < 5 ? 5 - i : i > w - 20 ? i - (w - 20) : 0; R(x, O, x0 + 7 + i, y0 + t - 1, 1, 6 - t + 1); R(x, i % 9 === 0 ? col : '#1e2a36', x0 + 7 + i, y0 + t, 1, 5 - t); if (!t) R(x, shade(col, 1.2), x0 + 7 + i, y0, 1, 1); }
  R(x, '#6a8aa8', x0 + 10, y0 + 2, 3, 1);
  R(x, '#fff2b0', x0 + w - 2, y0 + 6, 2, 2); R(x, lit ? '#ff2a1a' : '#8a1a1a', x0, y0 + 6, 2, 2);
  arch(x, x0 + 8, yb - 4, 3); arch(x, x0 + w - 9, yb - 4, 3); wheel(x, x0 + 8, yb - 1, 3); wheel(x, x0 + w - 9, yb - 1, 3);
}

// ---- one vehicle, built once into a canvas: [canvas, offset x, offset y (from the roof line), wheel list] ----
const CACHE = new Map();
function build(veh, vi, w, H) {
  const key = veh + vi + ':' + w + ':' + H; if (CACHE.has(key)) return CACHE.get(key);
  const PAD = 14, c = cv(w + PAD * 2, H + 26), x = c.getContext('2d'), x0 = PAD, y0 = 12, yb = y0 + H, wheels = [];
  const P = (k) => PAINT[k][vi % PAINT[k].length];
  const wh = (cx, r) => { arch(x, cx, yb - r - 3, r); wheels.push([cx - PAD, r]); };
  if (veh === 'van') {
    const col = P('van'); body(x, x0, y0, w, H - 6, col, 3);
    R(x, O, x0 + w - 12, y0 + 3, 12, 11); R(x, '#14202e', x0 + w - 11, y0 + 4, 10, 9); R(x, '#5a86b0', x0 + w - 10, y0 + 4, 3, 1);   // windscreen + door glass
    R(x, shade(col, 0.7), x0 + w - 14, y0 + 2, 1, H - 10); R(x, shade(col, 0.7), x0 + 24, y0 + 2, 1, H - 10); R(x, shade(col, 0.82), x0 + 25, y0 + 12, 22, 1);
    R(x, shade(col, 0.55), x0, y0 + H - 15, w, 3);                                             // a stripe along the side
    R(x, '#ff2a1a', x0, y0 + 4, 2, 5); R(x, '#fff2b0', x0 + w - 2, y0 + H - 13, 2, 3);
    wh(x0 + 11, 5); wh(x0 + w - 12, 5);
  } else if (veh === 'armour') {                         // a security van: plated, rivets, slit windows, a rotating beacon
    const col = P('armour'); body(x, x0, y0, w, H - 6, col, 2);
    for (let i = x0 + 4; i < x0 + w - 4; i += 6) for (const j of [y0 + 4, y0 + H - 12]) R(x, shade(col, 1.45), i, j, 1, 1);
    for (const px of [x0 + 18, x0 + 38]) R(x, shade(col, 0.6), px, y0 + 2, 1, H - 10);
    R(x, O, x0 + w - 13, y0 + 4, 12, 7); R(x, '#14202e', x0 + w - 12, y0 + 5, 10, 5); R(x, '#5a86b0', x0 + w - 11, y0 + 5, 3, 1);
    R(x, O, x0 + 24, y0 + 6, 10, 3); R(x, '#14202e', x0 + 25, y0 + 7, 8, 1);
    for (let i = 0; i < w; i++) if (((i >> 2) & 1) === 0) R(x, '#d8b030', x0 + i, y0 + H - 11, 1, 2);
    R(x, '#3a3e48', x0 + w - 6, y0 + H - 8, 6, 2);
    wh(x0 + 12, 5); wh(x0 + w - 13, 5);
  } else if (veh === 'police') {                         // a patrol car: roof light bar (the platform), battenburg sides
    const col = '#e8ecf0', cb = y0 + 4;
    R(x, O, x0 + 14, y0 - 1, 20, 5); R(x, '#3a3e48', x0 + 15, y0, 18, 3); R(x, '#ffffff', x0 + 15, y0, 18, 1);
    for (let i = 0; i < w - 18; i++) { const t = i < 5 ? 5 - i : i > w - 24 ? i - (w - 24) : 0; R(x, O, x0 + 9 + i, cb + t - 1, 1, 8 - t); R(x, i % 11 === 0 ? col : '#1e2a36', x0 + 9 + i, cb + t, 1, 7 - t); if (!t) R(x, '#ffffff', x0 + 9 + i, cb, 1, 1); }
    R(x, O, x0 - 1, cb + 7, w + 2, H - 11); R(x, col, x0, cb + 8, w, H - 13); R(x, '#ffffff', x0, cb + 8, w, 1);
    for (let i = 0; i < w; i += 6) { R(x, (i / 6) % 2 ? '#2a5ac8' : '#e8d020', x0 + i, cb + 12, 6, 3); R(x, (i / 6) % 2 ? '#e8d020' : '#2a5ac8', x0 + i, cb + 15, 6, 2); }
    R(x, '#fff2b0', x0 + w - 2, cb + 9, 2, 2); R(x, '#ff2a1a', x0, cb + 9, 2, 2);
    wh(x0 + 9, 4); wh(x0 + w - 10, 4);
  } else if (veh === 'bus') {                            // a coach: a long row of tinted windows, the door at the front, a livery stripe
    const col = P('bus'); body(x, x0, y0, w, H - 6, col, 4);
    R(x, O, x0 + 6, y0 + 5, w - 18, 12); R(x, '#16222e', x0 + 7, y0 + 6, w - 20, 10);
    for (let i = x0 + 7; i < x0 + w - 13; i += 13) { R(x, O, i + 11, y0 + 6, 2, 10); R(x, '#3a5a7a', i + 1, y0 + 6, 4, 1); if ((i * 7) % 5 < 2) R(x, '#3a3428', i + 3, y0 + 11, 4, 5); }
    R(x, O, x0 + w - 11, y0 + 4, 10, 16); R(x, '#14202e', x0 + w - 10, y0 + 5, 8, 14); R(x, '#5a86b0', x0 + w - 9, y0 + 5, 3, 1);
    R(x, O, x0 + w - 22, y0 + 18, 8, H - 25); R(x, '#14202e', x0 + w - 21, y0 + 19, 6, H - 27);
    R(x, shade(col, 0.55), x0, y0 + 20, w - 24, 3); R(x, '#ffd060', x0 + 8, y0 + 2, 20, 2);
    R(x, '#fff2b0', x0 + w - 2, y0 + H - 13, 2, 3); R(x, '#ff2a1a', x0, y0 + 6, 2, 8);
    wh(x0 + 18, 6); wh(x0 + w - 22, 6);
  } else if (veh === 'box' || veh === 'curtain' || veh === 'tanker' || veh === 'carrier') {   // articulated: a trailer and a cab
    const cw = 28, tw = w - cw - 4, cc = P('cab');
    if (veh === 'box') {
      const col = P('box'); body(x, x0, y0, tw, H - 12, col, 1); RIB(x, x0, y0, tw, H - 12, col, 8);
      R(x, O, x0, y0 + 2, 1, H - 15); R(x, shade(col, 0.6), x0 + 2, y0 + 3, 1, H - 17); R(x, '#8a909a', x0 + 3, y0 + 8, 2, 1); R(x, '#8a909a', x0 + 3, y0 + H - 22, 2, 1);
      R(x, '#ff2a1a', x0 + 1, y0 + H - 16, 2, 2); R(x, '#ffa020', x0 + 1, y0 + H - 13, 2, 1);
    } else if (veh === 'curtain') {
      const col = P('curtain'); body(x, x0, y0, tw, H - 12, col, 1);
      for (let i = x0 + 2; i < x0 + tw - 2; i += 7) { R(x, shade(col, 0.75), i, y0 + 4, 1, H - 18); R(x, shade(col, 1.15), i + 2, y0 + 4, 2, H - 18); }   // folds of the curtain
      for (let i = x0 + 6; i < x0 + tw - 4; i += 14) { R(x, '#1a1b1f', i, y0 + 3, 1, H - 16); R(x, '#c8a030', i, y0 + H - 15, 1, 2); }                   // straps and buckles
      R(x, '#5a5e68', x0, y0 + 2, tw, 2);
    } else if (veh === 'tanker') {
      const col = P('tanker'), th = H - 14;                // the tank: a cylinder (lit along its top), a walkway with a rail along the top, a ladder at the back
      R(x, O, x0 - 1, y0 + 3, tw + 2, th - 1);
      for (let j = 0; j < th - 3; j++) { const k = j / (th - 3), c = k < 0.12 ? shade(col, 1.25) : k < 0.4 ? col : k < 0.7 ? shade(col, 0.85) : shade(col, 0.6); R(x, c, x0, y0 + 4 + j, tw, 1); }
      for (let i = x0 + 2; i < x0 + tw - 2; i += 3) { R(x, O, i, y0 - 1, 1, 5); } R(x, O, x0, y0 - 1, tw, 2); R(x, '#ffffff', x0, y0, tw, 1); R(x, '#9aa0aa', x0, y0 + 1, tw, 1);   // the walkway rail: what you land on
      for (const i of [x0 + 24, x0 + 60, x0 + 96]) if (i < x0 + tw - 6) { R(x, shade(col, 0.6), i, y0 + 5, 1, th - 6); R(x, shade(col, 1.2), i + 1, y0 + 5, 1, th - 6); }
      R(x, O, x0 + tw - 30, y0 + 10, 9, 9); R(x, '#e88a1a', x0 + tw - 29, y0 + 11, 7, 7); R(x, '#16181d', x0 + tw - 27, y0 + 14, 3, 1);       // a hazard plate (blank)
      for (let j = y0 + 3; j < y0 + th; j += 3) R(x, '#3a3e48', x0 + 1, j, 4, 1); R(x, '#3a3e48', x0 + 1, y0 + 3, 1, th - 3); R(x, '#3a3e48', x0 + 4, y0 + 3, 1, th - 3);
      R(x, '#ff2a1a', x0, y0 + th - 3, 2, 2);
    } else {                                             // the car transporter: a lattice of two decks, cars nose to tail, the top row's roofs make the platform
      const col = P('carrier');
      R(x, O, x0 - 1, y0 + 12, tw + 2, 3); R(x, col, x0, y0 + 13, tw, 1); R(x, O, x0 - 1, y0 + H - 15, tw + 2, 4); R(x, col, x0, y0 + H - 14, tw, 2);
      for (let i = x0; i < x0 + tw; i += 12) { R(x, O, i, y0 + 13, 2, H - 27); R(x, shade(col, 1.4), i, y0 + 13, 1, H - 27); }
      for (let i = 0; i < tw - 8; i += 3) R(x, shade(col, 1.2), x0 + i + ((i / 3) % 2 ? 1 : 0), y0 + 15 + ((i / 3) % 4), 1, 1);
      const cars = Math.floor(tw / 44); for (let k = 0; k < cars; k++) { const cx0 = x0 + 2 + k * Math.floor(tw / cars); car(x, cx0, y0 + 13, 40, PAINT.car[(vi + k) % 7], false); car(x, cx0 + 3, y0 + H - 14, 38, PAINT.car[(vi + k + 3) % 7], false); }
      R(x, '#ffffff', x0, y0, tw, 1); R(x, '#9aa0aa', x0, y0 + 1, tw, 1); R(x, O, x0, y0 + 2, tw, 1);   // the top rail along the roofs
    }
    // the trailer's chassis, underrun guard, landing legs and three axles; the coupling; the cab
    R(x, O, x0, yb - 12, tw, 4); R(x, '#2a2d33', x0, yb - 11, tw, 2); R(x, '#5a5e68', x0 + 30, yb - 9, tw - 70, 1);
    R(x, '#3a3e48', x0 + tw - 34, yb - 9, 2, 6); R(x, '#3a3e48', x0 + tw - 30, yb - 9, 2, 6);
    R(x, '#e8e8ea', x0 + 30, yb - 12, 2, 1); R(x, '#ffa020', x0 + 60, yb - 12, 2, 1); R(x, '#ffa020', x0 + 90, yb - 12, 2, 1);
    for (const ax of [x0 + 10, x0 + 21, x0 + 32]) wh(ax, 5);
    R(x, O, x0 + tw - 2, yb - 10, 8, 3); R(x, '#5a5e68', x0 + tw - 1, yb - 9, 6, 1);
    cab(x, x0 + tw + 4, y0, cw, H, cc); wh(x0 + tw + 10, 6); wh(x0 + tw + 4 + cw - 6, 6);
  } else if (veh === 'jack') {                           // a fuel truck jack-knifed across the lanes: its tank turned side-on (the round end towards you), the cab skewed nose-on
    const col = '#c8ccd2', tw = w - 30, th = H - 10;
    R(x, O, x0 - 1, y0 - 1, tw + 2, th + 2);
    for (let j = 0; j < th; j++) { const k = j / th, c = k < 0.1 ? shade(col, 1.25) : k < 0.45 ? col : k < 0.75 ? shade(col, 0.82) : shade(col, 0.6); R(x, c, x0, y0 + j, tw, 1); }
    R(x, '#ffffff', x0 + 2, y0, tw - 4, 1);
    const ex = x0 + tw - 14; for (let j = 0; j < th; j++) { const half = Math.round(Math.sqrt(Math.max(0, (th / 2) ** 2 - (j - th / 2) ** 2)) * 0.45); R(x, O, ex - half - 1, y0 + j, half * 2 + 2, 1); R(x, j < th * 0.3 ? '#e4e8ee' : j < th * 0.7 ? '#aab0ba' : '#7a808a', ex - half, y0 + j, half * 2, 1); }   // the round end of the tank
    R(x, '#3a3e48', ex - 2, y0 + th / 2 - 2, 4, 4); R(x, '#16181d', x0 + 30, y0 + 3, 1, th - 6); R(x, '#16181d', x0 + 62, y0 + 3, 1, th - 6);
    R(x, O, x0 + 10, y0 + 8, 9, 9); R(x, '#e88a1a', x0 + 11, y0 + 9, 7, 7);
    for (let j = y0 + th; j < yb - 2; j++) R(x, '#1a1b1f', x0 + 6, j, tw - 20, 1);
    wh(x0 + 14, 5); wh(x0 + 34, 5);
    // the cab, nose on, slewed: a face with a windscreen, a grille and two lamps, leaning
    const cx0 = x0 + tw - 2, cy0 = y0 + 6;
    for (let j = 0; j < H - 8; j++) { const lean = Math.round(j * 0.18); R(x, O, cx0 + lean - 1, cy0 + j, 31, 1); R(x, j < 2 ? '#ff8a7a' : '#c42a22', cx0 + lean, cy0 + j, 29, 1); }
    R(x, O, cx0 + 3, cy0 + 4, 24, 9); R(x, '#14202e', cx0 + 4, cy0 + 5, 22, 7); R(x, '#5a86b0', cx0 + 5, cy0 + 5, 6, 1); R(x, '#dfe8f0', cx0 + 9, cy0 + 6, 1, 4); R(x, '#dfe8f0', cx0 + 10, cy0 + 8, 3, 1);   // a crazed windscreen
    for (let j = 0; j < 7; j += 2) R(x, '#3a3e48', cx0 + 8 + Math.round((14 + j) * 0.18), cy0 + 16 + j, 14, 1);
    R(x, '#fff2b0', cx0 + 3 + 4, cy0 + 18, 3, 2); R(x, '#fff2b0', cx0 + 24 + 4, cy0 + 18, 3, 2);
    wh(cx0 + 6 + 5, 5); wh(cx0 + 24 + 5, 5);
  }
  const out = { c, ox: PAD, oy: y0, wheels }; CACHE.set(key, out); return out;
}

// draw a vehicle whose roof is at screen (x, y), w wide; Y = world y -> screen y. f = frame, back = on the way back (wheels turn the other way)
export function drawVehicle(ctx, p, x, y, w, f, Y, back) {
  const veh = p.veh, H = Math.max(12, Y(ROAD) - y), b = build(veh, p.vi || 0, w, H);
  ctx.drawImage(b.c, Math.round(x - b.ox), Math.round(y - b.oy));
  const yb = Y(ROAD), turn = (back ? -f : f) * 0.7;
  for (const [cx, r] of b.wheels) { const a = turn / r, wx = Math.round(x + cx), wy = yb - r - 1; R(ctx, '#c8ccd4', wx + Math.round(Math.cos(a) * (r - 2)), wy + Math.round(Math.sin(a) * (r - 2)), 1, 1); R(ctx, '#6a707a', wx - Math.round(Math.cos(a) * (r - 2)), wy - Math.round(Math.sin(a) * (r - 2)), 1, 1); }
  if (veh === 'police') {                                // the lights: red and blue, turn about
    const on = (f >> 3) % 2, l = Math.round(x + 15), t = Math.round(y);
    R(ctx, on ? '#ff3a2a' : '#5a1210', l, t, 8, 2); R(ctx, on ? '#122a5a' : '#3a8aff', l + 10, t, 8, 2);
    ctx.globalAlpha = 0.22; R(ctx, on ? '#ff3a2a' : '#3a8aff', l + (on ? -10 : 0), t - 8, 28, 12); ctx.globalAlpha = 1;
  }
  if (veh === 'armour' && (f >> 4) % 2) { R(ctx, '#ffb020', Math.round(x + w - 20), Math.round(y) - 2, 3, 2); ctx.globalAlpha = 0.25; R(ctx, '#ffb020', Math.round(x + w - 26), Math.round(y) - 7, 15, 8); ctx.globalAlpha = 1; }
  if (veh !== 'jack' && veh !== 'police' && (f + (p.vi || 0) * 7) % 24 < 12) R(ctx, '#ff3a1a', Math.round(x), Math.round(y + H - 18), 2, 2);   // a brake light
  if (veh === 'jack') jackFire(ctx, x, y, w, H, f, back);
}
// the jack-knife burns: fuel alight on the road under it, flames up its side (no outline: scenery, not something to jump)
function jackFire(ctx, x, y, w, H, f, back) {
  const yb = y + H, cool = back;
  for (let k = 0; k < 9; k++) {
    const fx = x + 6 + k * ((w - 10) / 8), hh = 6 + ((f >> 2) + k * 5) % 7 + (k % 3) * 3;
    for (let j = 0; j < hh; j++) { const ww = Math.round((1 - j / hh) * 3 + 0.5), sw = Math.round(Math.sin((f + j * 3 + k * 7) / 4)); R(ctx, cool ? (j < hh * 0.5 ? '#e8f4ff' : '#8ac8ff') : j < hh * 0.35 ? '#ffd24a' : j < hh * 0.7 ? '#ff8a1a' : '#c8401a', fx - ww + sw, yb - 1 - j, ww * 2, 1); }
  }
  ctx.globalAlpha = 0.18; R(ctx, cool ? '#3a8aff' : '#ff7a1a', x - 20, yb - 30, w + 40, 30); ctx.globalAlpha = 1;
}

// ---- the motorway behind and under the traffic (all of it scenery). c0/c1 = the stretch to fill (screen x), sp = how far the camera has come (px), Y = world y -> screen y ----
// FAR: a city at night (towers, lit windows, aircraft lamps), two smoke columns. MID: the far carriageway on its viaduct, headlights the other way.
// NEAR: sign gantries and lamp posts going by. Everything at its own speed (the convoy is moving: the road streaks).
let SKY = null;
function skyline() {
  if (SKY) return SKY;
  const c = cv(480, 90), x = c.getContext('2d'); let a = 7; const n = () => ((a = (Math.imul(a, 1103515245) + 12345) | 0) >>> 8) / 16777216;
  for (let i = 0; i < 480;) {
    const bw = 10 + Math.floor(n() * 22), bh = 20 + Math.floor(n() * 60) + (n() < 0.12 ? 18 : 0), col = n() < 0.5 ? '#14171d' : '#181b22';
    R(x, col, i, 90 - bh, bw, bh); R(x, '#232731', i, 90 - bh, 1, bh);
    if (n() < 0.3) { R(x, col, i + (bw >> 1) - 1, 90 - bh - 8, 2, 8); }
    for (let wy = 90 - bh + 4; wy < 86; wy += 4) for (let wx = i + 2; wx < i + bw - 2; wx += 3) if (n() < 0.22) R(x, n() < 0.5 ? '#5a4a2a' : '#3a3a40', wx, wy, 1, 2);
    i += bw + (n() < 0.3 ? 2 : 0);
  }
  return (SKY = c);
}
export function motorway(ctx, c0, c1, cam, Y, f, blue, H) {
  const sl = skyline(), mod = (a, n) => ((a % n) + n) % n;
  // far city: the slowest layer
  const off = mod(cam * 0.12, sl.width), ty = Y(150) - 90;
  for (let px = -off; px < c1 + 10; px += sl.width) if (px + sl.width > c0) ctx.drawImage(sl, Math.round(px), ty);
  for (let k = 0; k < 6; k++) { const px = mod(k * 83 - cam * 0.12, sl.width) - 20; if ((f >> 5) % 2 === k % 2) R(ctx, blue ? '#3a8aff' : '#ff3a2a', px, ty + 20 + (k * 13) % 30, 1, 1); }
  // smoke columns over the city (they run back DOWN into the fires on the way back)
  for (let s = 0; s < 2; s++) {
    const bx = mod(160 + s * 260 - cam * 0.16, 520) - 100;
    for (let k = 0; k < 9; k++) { const t = mod((blue ? -f : f) * 0.25 + k * 22, 200) / 200, r = 4 + Math.round(t * 12); ctx.globalAlpha = 0.5 * (1 - t); disc(ctx, bx + t * 40 + Math.sin(k + t * 4) * 4, ty + 70 - t * 90, r, k % 2 ? '#1b1d22' : '#23252b'); }
    ctx.globalAlpha = 0.5; disc(ctx, bx, ty + 78, 4, blue ? '#3a6aa0' : '#c8601a'); ctx.globalAlpha = 1;
  }
  // haze over the far city
  ctx.globalAlpha = 0.35; R(ctx, blue ? '#16243a' : '#3a2018', c0, Y(140), c1 - c0, 16); ctx.globalAlpha = 1;
  // the far carriageway on its viaduct, traffic the other way: pairs of headlights, rear lamps
  const vy = Y(158); R(ctx, '#121419', c0, vy, c1 - c0, 6); R(ctx, '#2a2e36', c0, vy, c1 - c0, 1);
  for (let px = mod(-cam * 0.5, 60) - 60; px < c1 + 60; px += 60) { R(ctx, '#0d0f13', px, vy + 6, 5, 34); R(ctx, '#1b1e24', px, vy + 6, 1, 34); }
  for (let k = 0; k < 7; k++) { const px = mod(k * 71 - cam * 0.5 - f * (blue ? -2.2 : 2.2), 520) - 100; R(ctx, '#fff2c8', px, vy - 2, 2, 1); R(ctx, '#fff2c8', px + 5, vy - 2, 2, 1); ctx.globalAlpha = 0.2; R(ctx, '#fff2c8', px - 14, vy - 3, 14, 3); ctx.globalAlpha = 1; }
  for (let k = 0; k < 5; k++) { const px = mod(k * 97 - cam * 0.5 + f * 0.6, 520) - 100; R(ctx, '#ff2a1a', px, vy - 2, 2, 1); R(ctx, '#ff2a1a', px + 6, vy - 2, 2, 1); }
  // sign gantries: a lattice girder across the carriageway with blank boards and arrows
  for (let px = mod(-cam * 1.35, 560) - 160; px < c1 + 160; px += 560) {
    const gx = Math.round(px), gy = Y(96);
    R(ctx, O, gx - 2, gy, 5, Y(ROAD) - gy); R(ctx, '#3a3e48', gx - 1, gy, 3, Y(ROAD) - gy); R(ctx, '#5a5e68', gx - 1, gy, 1, Y(ROAD) - gy);
    R(ctx, O, gx, gy - 1, 170, 8); R(ctx, '#3a3e48', gx, gy, 170, 6); for (let i = 0; i < 170; i += 6) { R(ctx, '#1b1d22', gx + i, gy + 1, 1, 4); R(ctx, '#1b1d22', gx + i + 3, gy + 1, 1, 4); }
    for (const [sx, sw] of [[26, 58], [96, 64]]) {
      R(ctx, O, gx + sx - 1, gy + 6, sw + 2, 28); R(ctx, blue ? '#142a4a' : '#143624', gx + sx, gy + 7, sw, 26); R(ctx, '#8a929a', gx + sx + 1, gy + 8, sw - 2, 1); R(ctx, '#8a929a', gx + sx + 1, gy + 31, sw - 2, 1);
      const ax = gx + sx + (sw >> 1);                     // an arrow down to the lane, and two blank lines (no words)
      R(ctx, '#9aa2aa', ax - 1, gy + 12, 3, 10); for (let i = 0; i < 4; i++) R(ctx, '#9aa2aa', ax - 3 + i, gy + 20 + i, 7 - i * 2, 1);
      R(ctx, '#7a828a', gx + sx + 5, gy + 13, (sw >> 1) - 10, 2); R(ctx, '#7a828a', gx + sx + 5, gy + 18, (sw >> 1) - 14, 2);
      R(ctx, '#9aa2aa', gx + sx + 5, gy + 26, 10, 2); R(ctx, '#9aa2aa', gx + sx + sw - 15, gy + 26, 10, 2);
    }
    for (const lx of [40, 110]) { R(ctx, (f >> 3) % 2 ? '#ffb020' : '#5a3a10', gx + lx, gy + 36, 3, 2); }
  }
  // lamp posts: sodium on the way out, a cold white on the way back; their pools of light on the road
  for (let px = mod(-cam * 1.7, 150) - 30; px < c1 + 40; px += 150) {
    const lx = Math.round(px), ly = Y(112);
    R(ctx, '#0d0f13', lx, ly, 2, Y(ROAD) - ly); R(ctx, '#0d0f13', lx - 12, ly, 14, 2); R(ctx, blue ? '#d8ecff' : '#ffc070', lx - 13, ly + 2, 6, 2);
    ctx.globalAlpha = 0.05; for (let j = ly + 4; j < Y(ROAD); j += 4) { const r = 2 + Math.round((j - ly) * 0.22); R(ctx, blue ? '#9ad0ff' : '#ffa040', lx - 10 - r, j, r * 2 + 2, 4); } ctx.globalAlpha = 1;
  }
}
// the road itself, under the convoy and below the flatbed: lanes streaking past (fast: you are on the traffic), a crash barrier
export function roadBed(ctx, a, b, cam, Y, f, blue) {
  const y = Y(ROAD), mod = (q, n) => ((q % n) + n) % n;
  R(ctx, '#1a1c21', a, y - 8, b - a, 120); R(ctx, '#23262d', a, y - 8, b - a, 1);
  for (let px = mod(-cam * 2.6, 13) - 13; px < b; px += 13) R(ctx, '#202329', px, y - 3 + ((Math.round(px) * 7) & 7), 9, 1);
  for (let px = mod(-cam * 2.6, 64) - 64; px < b; px += 64) R(ctx, '#b8bcc4', px, y + 6, 26, 2);
  ctx.globalAlpha = 0.25; for (let px = mod(-cam * 2.6, 64) - 64; px < b; px += 64) R(ctx, blue ? '#9ad0ff' : '#ffc070', px - 20, y + 6, 20, 2); ctx.globalAlpha = 1;
  R(ctx, '#121419', a, y + 16, b - a, 40);
  // the crash barrier along the near edge: posts and a steel beam
  R(ctx, '#2a2e36', a, y + 12, b - a, 3); R(ctx, '#7a808a', a, y + 12, b - a, 1); for (let px = mod(-cam * 2.6, 22) - 22; px < b; px += 22) R(ctx, '#2a2e36', px, y + 15, 2, 8);
}

// ---- the battlefield behind the dead street: far ruins, fires, smoke going up (down again on the way back), searchlights; tracer in the sky ----
let FAR = null;
function farRuins() {
  if (FAR) return FAR;
  const c = cv(400, 80), x = c.getContext('2d'); let a = 19; const n = () => ((a = (Math.imul(a, 1103515245) + 12345) | 0) >>> 8) / 16777216;
  for (let i = 0; i < 400;) { const bw = 14 + Math.floor(n() * 26), bh = 16 + Math.floor(n() * 50), col = n() < 0.5 ? '#16171a' : '#1b1c20';
    for (let k = 0; k < bw; k++) { const jag = Math.floor(n() * 7) + (n() < 0.15 ? 10 : 0); R(x, col, i + k, 80 - bh + jag, 1, bh - jag); }
    for (let wy = 80 - bh + 10; wy < 76; wy += 6) for (let wx = i + 3; wx < i + bw - 3; wx += 5) if (n() < 0.5) R(x, '#0a0a0c', wx, wy, 2, 3);
    if (n() < 0.25) { R(x, '#3a1e12', i + 4, 74, bw - 8, 6); }
    i += bw + Math.floor(n() * 6); }
  return (FAR = c);
}
export function battleBack(ctx, c0, c1, cam, Y, f, blue) {
  const fr = farRuins(), mod = (q, n) => ((q % n) + n) % n, ty = Y(150) - 80;
  // searchlights sweeping the clouds (they swing back the way they came on the way back)
  for (let k = 0; k < 2; k++) { const bx = mod(120 + k * 210 - cam * 0.1, 420) - 50, a = Math.sin(((blue ? -f : f) + k * 140) / 90) * 0.5 - (k ? 0.3 : -0.2);
    ctx.globalAlpha = 0.07; for (let j = 0; j < 110; j += 2) { const w = 2 + j * 0.16; R(ctx, blue ? '#bcdcff' : '#ffe0b0', bx + Math.sin(a) * j * 1.4 - w / 2, ty + 70 - j, w, 2); } ctx.globalAlpha = 1; }
  // tracer: short dashes across the sky, now and then
  for (let k = 0; k < 3; k++) { const t = mod(f + k * 97, 260); if (t > 40) continue; const sx = mod(k * 131 - cam * 0.1, 360) - 20 + (blue ? -t : t) * 4; R(ctx, blue ? '#9ad0ff' : '#ffb03a', sx, ty - 10 - k * 9 + t * 0.6, 3, 1); }
  for (let px = -mod(cam * 0.3, fr.width); px < c1 + 10; px += fr.width) if (px + fr.width > c0) ctx.drawImage(fr, Math.round(px), ty);
  // fires along the far rubble, and the smoke from them
  for (let k = 0; k < 4; k++) {
    const bx = mod(70 + k * 113 - cam * 0.3, 452) - 60, by = ty + 76;
    for (let j = 0; j < 12; j++) { const t = mod((blue ? -f : f) * 0.35 + j * 17, 204) / 204, r = 3 + Math.round(t * 11); ctx.globalAlpha = 0.55 * (1 - t); disc(ctx, bx + t * 26 + Math.sin(j * 1.3 + t * 5) * 3, by - 6 - t * 100, r, j % 2 ? '#141517' : '#1d1e22'); }
    ctx.globalAlpha = 1;
    for (let j = 0; j < 7; j++) { const hh = 3 + ((f >> 2) + j * 3 + k) % 5; R(ctx, blue ? (j % 2 ? '#8ac8ff' : '#e8f4ff') : j % 2 ? '#ff8a1a' : '#ffd24a', bx - 6 + j * 2, by - hh, 1, hh); }
    ctx.globalAlpha = 0.16; R(ctx, blue ? '#3a8aff' : '#ff6a1a', bx - 18, by - 22, 36, 22); ctx.globalAlpha = 1;
  }
  ctx.globalAlpha = 0.3; R(ctx, blue ? '#101c30' : '#2a140e', c0, ty + 50, c1 - c0, 30); ctx.globalAlpha = 1;
}
// ---- the hangar: the travelling crane over the loading pit (its trolleys over each pallet), shafts of grey light from the high windows ----
export function craneRig(ctx, pals, Y, f) {
  if (!pals.length) return;
  const a = Math.min(...pals.map((p) => p.x)) - 30, b = Math.max(...pals.map((p) => p.x + p.w)) + 30, gy = Y(84);
  R(ctx, O, a, gy - 1, b - a, 9); R(ctx, '#3e3a30', a, gy, b - a, 7); R(ctx, '#6a6250', a, gy, b - a, 1);
  for (let i = a; i < b; i += 8) { R(ctx, '#16181d', i, gy + 1, 4, 5); R(ctx, '#5a4a20', i + 4, gy + 6, 4, 1); }
  for (const cx of [a, b]) { R(ctx, O, cx - 4, gy - 70, 8, 70); R(ctx, '#3a3e48', cx - 3, gy - 70, 6, 70); R(ctx, '#5a5e68', cx - 3, gy - 70, 1, 70); }
  for (const p of pals) { const m = Math.round(p.x + p.w / 2); R(ctx, O, m - 6, gy + 7, 13, 5); R(ctx, '#5a5e68', m - 5, gy + 8, 11, 3); R(ctx, (f >> 4) % 2 ? '#ff3a2a' : '#5a1a16', m - 1, gy + 9, 2, 1); }
}
export function lightShafts(ctx, c0, c1, cam, Y, f, blue) {
  const mod = (q, n) => ((q % n) + n) % n;
  for (let px = mod(30 - cam, 96) - 96; px < c1 + 96; px += 96) {
    if (px + 120 < c0) continue;
    ctx.globalAlpha = 0.05; for (let j = 0; j < 120; j += 2) R(ctx, blue ? '#a8c8ff' : '#d8c8b0', px + 18 + j * 0.45, Y(66) + j, 14, 2); ctx.globalAlpha = 1;
    for (let k = 0; k < 4; k++) { const t = mod(f * 0.2 + k * 31 + px, 120); R(ctx, '#8a8a80', px + 22 + t * 0.45 + Math.sin((f + k * 20) / 30) * 2, Y(66) + t, 1, 1); }
  }
}
