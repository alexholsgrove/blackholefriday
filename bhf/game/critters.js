// Black Hole Friday: the small hand-drawn baddies that replace FWAHBL leftovers (slimes, bikers, bats, pegasus) in levels where those made no sense.
// Everything faces LEFT (baddies come at the hero from the right) and gets a 1px black outline so it reads on a busy wall.
import { cv, fr, px } from './kit.js';

// draw onto a w x h canvas (1px margin all round is added), then outline whatever was drawn
function sprite(w, h, draw, ox = w >> 1, oy = h, line = '#07060a') {
  const c = cv(w + 2, h + 2), x = c.getContext('2d'); x.translate(1, 1); draw(x); x.setTransform(1, 0, 0, 1, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height), a = d.data, W = c.width, H = c.height, on = (i, j) => i >= 0 && j >= 0 && i < W && j < H && a[(j * W + i) * 4 + 3] > 40, edge = [];
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (!on(i, j) && (on(i - 1, j) || on(i + 1, j) || on(i, j - 1) || on(i, j + 1))) edge.push([i, j]);
  x.fillStyle = line; for (const [i, j] of edge) x.fillRect(i, j, 1, 1);
  return fr(c, ox + 1, oy + 1);
}
const R = (x, col, x0, y0, w, h) => { x.fillStyle = col; x.fillRect(Math.round(x0), Math.round(y0), Math.round(w), Math.round(h)); };
function E(x, col, cx, cy, rx, ry) { x.fillStyle = col; for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) { const u = (i + 0.5 - cx) / rx, v = (j + 0.5 - cy) / ry; if (u * u + v * v <= 1) x.fillRect(i, j, 1, 1); } }

// ---------- DEEP DESERT: the desert mouse (hops like a slime; stomp a big one and two little ones bolt) ----------
function mouse(k, pose) {                       // k = size, pose: 0 sit, 1 sit (ears down, crouched), 2 leaping up, 3 coming down
  const B = '#d9b27a', H = '#f6e0b4', D = '#a67a4c', P = '#f09a86', K = '#1a0e12', w = Math.round(22 * k), h = Math.round(18 * k), s = (v) => v * k;
  const air = pose >= 2, cr = pose === 1 ? 1 : 0;
  return sprite(w, h, (x) => {
    const by = air ? 9 : 11 + cr * 0.6;                                                            // body centre
    R(x, D, s(15), s(by + (air ? -1 : 0.5)), s(5), Math.max(1, s(1))); R(x, D, s(19), s(by - (air ? 3 : 2)), Math.max(1, s(1)), s(air ? 2.5 : 3)); R(x, H, s(19), s(by - (air ? 4 : 3)), Math.max(1, s(1.4)), Math.max(1, s(1.4)));   // tail with a tuft
    if (air) { R(x, D, s(12), s(by + 3), s(pose === 2 ? 6 : 3), Math.max(1, s(1.4))); R(x, H, s(pose === 2 ? 17 : 13), s(by + (pose === 2 ? 3 : 4.4)), s(2.4), Math.max(1, s(1.2))); R(x, D, s(5), s(by + 3.4), s(2.4), Math.max(1, s(1))); }   // legs trailing / reaching
    E(x, D, s(13.4), s(by + 0.6), s(4.2), s(4.2 - cr * 0.5));                                      // haunch
    E(x, B, s(10.5), s(by), s(6), s(4.4 - cr * 0.6));                                              // body
    E(x, H, s(9.5), s(by + 2.6), s(4), s(1.5));                                                    // pale belly
    E(x, B, s(5.2), s(by - 2.2), s(3.6), s(3.1));                                                  // head
    E(x, D, s(9), s(by - 6.6 + cr * 1.5 + (air ? 1.4 : 0)), s(1.5), s(2.7 - cr));                  // far ear
    E(x, B, s(6.4), s(by - 7.2 + cr * 1.8 + (air ? 1.8 : 0)), s(1.7), s(3.2 - cr));                // near ear
    E(x, P, s(6.4), s(by - 6.8 + cr * 1.8 + (air ? 1.8 : 0)), s(0.7), s(2 - cr * 0.8));
    R(x, K, s(3.6), s(by - 3.4), Math.max(1, s(1.3)), Math.max(1, s(1.9))); if (k > 0.8) R(x, '#ffffff', s(3.6), s(by - 3.4), 1, 1);   // eye
    R(x, P, s(1.4), s(by - 1.9), Math.max(1, s(1.1)), Math.max(1, s(1)));                          // nose
    if (!air) { R(x, H, s(6.6), s(15.6), s(3), Math.max(1, s(1.3))); R(x, H, s(11.6), s(15.6), s(5), Math.max(1, s(1.3))); }   // feet
  }, Math.round(w / 2), h - Math.round(1.2 * k));
}
export const desertMouse = (k = 1) => ({ sit: mouse(k, 0), sit2: mouse(k, 1), up: mouse(k, 2), down: mouse(k, 3) });

// ---------- DEEP DESERT: a raider on a sand skiff (the fast one along the ground) ----------
export function sandSkiff(raider) {             // raider = one of the level's raider frames; he rides crouched in the hull
  return [0, 1].map((n) => sprite(40, 32, (x) => {
    x.save(); x.beginPath(); x.rect(0, 0, 40, 22); x.clip(); x.drawImage(raider.c, 19 - raider.ox, 31 - raider.oy); x.restore();   // head and shoulders above the gunwale
    R(x, '#3a2630', 6, 22, 30, 5); R(x, '#8a5a40', 6, 21, 30, 2); R(x, '#f0c890', 6, 21, 30, 1);      // hull + lit gunwale
    R(x, '#3a2630', 3, 20, 4, 5); R(x, '#8a5a40', 2, 19, 3, 3); R(x, '#f0c890', 1, 18, 2, 2);         // upturned prow
    R(x, '#5a3a40', 9, 24, 24, 1); for (let i = 10; i < 34; i += 5) R(x, '#1e1218', i, 25, 1, 2);   // plank line + ribs
    R(x, '#2a1c26', 30, 14, 2, 8); R(x, '#c86a3a', 32, 14 + n, 6, 3); R(x, '#f0a050', 32, 14 + n, 5, 1);   // stern post + pennant
    R(x, '#20404a', 10, 27, 6, 2); R(x, '#20404a', 25, 27, 6, 2);                                    // repulsor pods
    R(x, n ? '#bff4ff' : '#7ad8ff', 11, 29, 4, 1); R(x, n ? '#7ad8ff' : '#bff4ff', 26, 29, 4, 1);
    R(x, '#7ad8ff', 12, 30, 2, 1 + n); R(x, '#7ad8ff', 27, 30, 2, 2 - n);
    R(x, '#e8c090', 36 + n, 26, 2, 1); R(x, '#c89868', 38, 24 + n * 2, 2, 1);                         // sand kicked up behind
  }, 20, 31));
}

// ---------- INVERSION: an oil drum bouncing along on its own (slime), a forklift driven flat out (biker), a camera drone (pegasus), gulls (bats) ----------
function drumAt(k, pose) {
  const w = Math.round(15 * k), h0 = Math.round(18 * k), h = h0 + (pose === 2 ? 1 : pose === 1 ? -1 : 0), s = (v) => Math.max(1, Math.round(v * k));
  return sprite(w, h, (x) => {
    R(x, '#6a7482', 0, 0, w, h); R(x, '#9aa6b6', s(1.4), 0, s(2), h); R(x, '#3e4652', w - s(3), 0, s(3), h);            // steel, lit left, dark right
    R(x, '#c8d2e0', 0, 0, w, s(1)); R(x, '#2a3038', 0, h - s(1), w, s(1));                                              // rims
    R(x, '#e03a2a', 0, s(3), w, s(2.4)); R(x, '#ff8a6a', s(1.4), s(3), s(2), s(2.4));                                  // red band (forward)
    R(x, '#3a8ae0', 0, h - s(5.4), w, s(2.4)); R(x, '#8ac8ff', s(1.4), h - s(5.4), s(2), s(2.4));                      // blue band (inverted)
    if (k > 0.8) { R(x, '#e8c030', 5, 8, 6, 4); R(x, '#16181d', 7, 9, 2, 2); R(x, '#16181d', 6, 11, 4, 1); }            // hazard label
  }, w >> 1, h);
}
export const drum = (k = 1) => ({ sit: drumAt(k, 0), sit2: drumAt(k, 1), up: drumAt(k, 2), down: drumAt(k, 0) });

export function forklift() {
  return [0, 1, 2, 3].map((n) => sprite(36, 28, (x) => {
    const Y = '#e8b020', YH = '#ffd860', YD = '#a87410', K = '#16181d', S = '#5a6070';
    R(x, S, 9, 1, 2, 23); R(x, '#8a94a4', 9, 1, 1, 23); R(x, S, 12, 3, 1, 21);                        // mast
    R(x, K, 0, 22, 12, 2); R(x, '#8a94a4', 0, 22, 12, 1);                                             // forks
    R(x, '#a0221c', 0, 12, 9, 10); R(x, '#e0483a', 0, 12, 9, 1); R(x, '#560e0c', 2, 13, 1, 9); R(x, '#560e0c', 5, 13, 1, 9); R(x, '#560e0c', 8, 13, 1, 9);   // a crate on the forks
    R(x, Y, 13, 14, 20, 9); R(x, YH, 13, 14, 20, 1); R(x, YD, 13, 21, 20, 2); R(x, YD, 29, 11, 5, 4); R(x, Y, 29, 11, 4, 3);   // body + counterweight
    for (let i = 0; i < 20; i++) for (let j = 0; j < 3; j++) if (((i + j) >> 1) % 2) R(x, K, 13 + i, 17 + j, 1, 1);          // hazard stripe
    R(x, K, 14, 3, 1, 11); R(x, K, 27, 3, 1, 11); R(x, K, 13, 2, 16, 2); R(x, YD, 13, 2, 16, 1);       // cab posts + roof
    R(x, n % 2 ? '#ffb030' : '#7a4a10', 20, 0, 3, 2);                                                 // beacon
    R(x, '#2a3040', 18, 6, 6, 5); R(x, '#5ac8ff', 18, 8, 3, 2); R(x, '#1e4fa0', 19, 11, 6, 3); R(x, K, 16, 12, 3, 1);   // driver: helmet, blue visor, shoulders, wheel
    for (const cx of [17, 29]) { R(x, K, cx - 3, 21, 7, 5); R(x, K, cx - 2, 20, 5, 7); R(x, S, cx - 1, 22, 3, 3); R(x, '#c8d2e0', cx + [0, 1, 0, -1][n], 23 + [-1, 0, 1, 0][n], 1, 1); }   // wheels turning
    R(x, '#8a94a4', 34, 20 - (n % 2), 2, 1);                                                          // exhaust puff
  }, 18, 27));
}

export function camDrone() {
  const rows = (n) => [
    n ? '.rrRRRRrr........rrRRRRrr.' : '...rRRr............rRRr...',
    '.....S..............S.....',
    '..DDDDDDDDDDDDDDDDDDDDDD..',
    '.......DMMMMMMMMMMD.......',
    '......DMHMMMMMMMMMMD......',
    '......DMbMMMMMMMMrMD......',
    '.......DMMMCCCCMMMD.......',
    '.........DDCLCCDD.........',
    '..........DCCCCD..........',
    '.........F......F.........',
  ];
  const cols = { r: '#8a94a4', R: '#dfe6f0', S: '#8a94a4', D: '#22262e', M: '#5a6070', H: '#9aa6b6', b: '#4a9aff', C: '#0c0e12', L: '#8ac8ff', F: '#3a3e48' };
  return [0, 1].map((n) => sprite(26, 10, (x) => { px(x, 0, 0, rows(n), { ...cols, r: n ? '#ff4a3a' && '#8a94a4' : '#8a94a4' }); R(x, n ? '#ff4a3a' : '#7a1a14', 17, 5, 1, 1); }, 13, 10));
}

export function gulls() {
  const cols = { W: '#eef2f6', G: '#98a4b4', D: '#3a4252', Y: '#f0b030', K: '#101216' };
  const up = ['........DG.....', '........GGG....', '.......GGGG....', '.YYWKWWGGGWWW..', '...WWWWWWWWWWGD', '....WWWWWWWW...'];
  const dn = ['.YYWKWWWWWWWW..', '...WWWGGGWWWWGD', '....WWGGGGWW...', '......GGGG.....', '.......GGD.....', '........D......'];
  return [sprite(15, 6, (x) => px(x, 0, 0, up, cols), 8, 5), sprite(15, 6, (x) => px(x, 0, 0, dn, cols), 8, 2)];
}

// ---------- NEON RAIN: a street-sweeper bot on a spring (slime). Stomp a big one and it breaks into two small ones ----------
function botAt(k, pose) {                       // pose: 0 sit, 1 sit (visor blink), 2 up (spring stretched), 3 down
  const w = Math.round(16 * k), h = Math.round(16 * k), s = (v) => Math.max(1, Math.round(v * k)), air = pose >= 2, lift = pose === 2 ? s(3) : pose === 3 ? s(1.5) : 0;
  return sprite(w, h + 3, (x) => {
    const top = 3 - (air ? 0 : 0) + (air ? 0 : s(1)), bh = s(9), by = top + (air ? 0 : 0);
    R(x, '#8a94a4', (w >> 1) - 1, 0, 1, top + 1); R(x, pose === 1 ? '#ff3ad0' : '#3af0ff', (w >> 1) - 1, 0, 2, 1);          // aerial + lamp
    E(x, '#3a2a5a', w / 2, by + bh * 0.55, w / 2 - 0.5, bh * 0.6);                                                   // dome, dark
    E(x, '#6a4aa0', w / 2 - s(1), by + bh * 0.45, w / 2 - s(2), bh * 0.42);                                          // lit plate
    R(x, '#1a1024', 1, by + bh - s(2), w - 2, s(2)); R(x, '#ff3ad0', 1, by + bh - s(2), w - 2, 1);                     // skirt with a pink strip
    R(x, '#0a0a12', s(1.4), by + s(3), s(8), s(2.6)); R(x, pose === 1 ? '#0a6a78' : '#3af0ff', s(2), by + s(3.6), s(6), Math.max(1, s(1)));   // visor
    R(x, '#ffffff', s(2), by + s(3.6), 1, 1);
    const sy = by + bh, sl = h + 3 - sy - 1 - (air ? 0 : 0);                                                           // spring
    for (let j = 0; j < Math.max(1, sl - (air ? 0 : lift)); j++) R(x, j % 2 ? '#c8d2e0' : '#5a6070', (w >> 1) - 2 + (j % 2), sy + j, 3, 1);
    R(x, '#16181d', (w >> 1) - 3, h + 1, 6, 2); R(x, '#8a94a4', (w >> 1) - 3, h + 1, 6, 1);                           // foot
  }, w >> 1, h + 3);
}
export const hopBot = (k = 1) => ({ sit: botAt(k, 0), sit2: botAt(k, 1), up: botAt(k, 2), down: botAt(k, 3) });
