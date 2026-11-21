// Black Hole Friday: concept art. Characters for the five sci-fi levels, built with the game's
// jointed-pixel rig (rig.js). Everything is original; each level nods to a classic film.
import { MATS, renderShapes, cap, ell, poly, heroShapes, jacketShapes, scientistShapes, scaleShapes } from '../rig.js';

export const TAU = Math.PI * 2;
export const P = (x, y) => ({ x, y });
export const add = (a, b) => P(a.x + b.x, a.y + b.y);
export const dir = (l, a) => P(Math.sin(a) * l, Math.cos(a) * l);
export const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
export const frames = (n, fn) => Array.from({ length: n }, (_, i) => fn(i / n));
export const R = (g, w, h, ox, oy) => renderShapes(g.shapes, w, h, ox, oy, { post: g.post });

Object.assign(MATS, {
  copper: ['#ffd2a0', '#e2823e', '#a04c1c', '#5c2410'],
  copperFar: ['#c86a30', '#a0521f', '#783512', '#461c08'],
  trooper: ['#ffffff', '#e4e7ee', '#aab0c2', '#646a80'],
  trooperFar: ['#d4d8e2', '#b8bdcc', '#8a90a4', '#50566a'],
  dark: ['#60607a', '#26262f', '#141418', '#000000'],
  cape: ['#34343e', '#141418', '#0a0a0e', '#000000'],
  xeno: ['#8aa2b2', '#34404c', '#1c242c', '#0a0e12'],
  xenoFar: ['#4a5a68', '#26303a', '#161c22', '#06080a'],
  flesh: ['#fbe6c8', '#dcb48a', '#a87c58', '#5e4030'],
  egg: ['#d8c89a', '#9a8a62', '#665a3c', '#30281a'],
  invBlue: ['#b8e0ff', '#4a90e8', '#1e4fa0', '#0c2456'],
  invBlueFar: ['#4a90e8', '#2e6ac0', '#173a80', '#081840'],
  gasmask: ['#9a9ea8', '#50545e', '#2c2e36', '#121318'],
  ice: ['#ffffff', '#d6f2ff', '#8ec4e0', '#4a7a9a'],
  synthCoat: ['#6a6058', '#2e2824', '#1c1814', '#0a0806'],
  platinum: ['#ffffff', '#ecece4', '#bcbcb0', '#74746a'],
  skinPale: ['#fff4ea', '#f0d6c4', '#c8a08a', '#7a5a4a'],
  police: ['#f4f8ff', '#9aa6ba', '#525c74', '#20263a'],
  owl: ['#efe0c0', '#b89868', '#7a5a34', '#3e2c14'],
  queen: ['#6a7c8e', '#28323e', '#141a22', '#05070a'],
  loader: ['#ffe56a', '#f2c31b', '#c4920c', '#7a5806'],
  suit: ['#4a4e58', '#22242c', '#16181e', '#0a0a0e'],
  suitFar: ['#2e3038', '#1a1c22', '#101216', '#060608'],
  shirt: ['#ffffff', '#e4e8ee', '#b0b6c2', '#6a7080'],
  slick: ['#3a3a44', '#16161c', '#0c0c10', '#000000'],
  sentinel: ['#8a9a90', '#3e4842', '#222a28', '#0a0e0e'],
  cat: ['#7a7a8c', '#34343e', '#1c1c24', '#08080a'],
});

// ---- helpers -----------------------------------------------------------------
export const recolor = (g, map, drop = []) => ({ shapes: g.shapes.filter((s) => !drop.includes(s.m)).map((s) => (map[s.m] ? { ...s, m: map[s.m] } : s)), post: g.post });
export function flip(r) { const c = cv(r.c.width, r.c.height), x = c.getContext('2d'); x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(r.c, 0, 0); return { c, ox: r.c.width - r.ox, oy: r.oy }; }
export function flipV(r) { const c = cv(r.c.width, r.c.height), x = c.getContext('2d'); x.translate(0, c.height); x.scale(1, -1); x.drawImage(r.c, 0, 0); return { c, ox: r.ox, oy: r.c.height - r.oy }; }
export const put = (ctx, r, X, Y) => ctx.drawImage(r.c, Math.round(X - r.ox), Math.round(Y - r.oy));
export function tint(r, col, alpha = 1) { const c = cv(r.c.width, r.c.height), x = c.getContext('2d'); x.drawImage(r.c, 0, 0); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = alpha; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); return { c, ox: r.ox, oy: r.oy }; }
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export const hash = (i, j) => { let h = Math.imul(i * 374761393 + j * 668265263, 1274126177); h ^= h >>> 13; h = Math.imul(h, 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// crumpled-metal look for the copper: streaks of highlight and shadow across the coat pixels
const CU = new Map();
for (const m of ['copper', 'copperFar']) MATS[m].forEach((h, k) => { const [r, g, b] = hex(h); CU.set((r << 16) | (g << 8) | b, [m, k]); });
export function crinkle(r, seed = 0) {
  const x = r.c.getContext('2d'), im = x.getImageData(0, 0, r.c.width, r.c.height), d = im.data;
  for (let j = 0; j < r.c.height; j++) for (let i = 0; i < r.c.width; i++) {
    const o = (j * r.c.width + i) * 4; if (!d[o + 3]) continue;
    const hit = CU.get((d[o] << 16) | (d[o + 1] << 8) | d[o + 2]); if (!hit) continue;
    const [m, k] = hit;
    const n = Math.sin(i * 0.8 + j * 0.45 + seed) + Math.sin(i * 0.3 - j * 0.75 + seed * 2) * 0.7 + (hash(i, j) - 0.5) * 0.25;
    let kk = k; if (n > 1.2) kk = Math.max(0, k - 1); else if (n < -1.15) kk = Math.min(3, k + 1);
    const [rr, gg, bb] = hex(MATS[m][kk]); d[o] = rr; d[o + 1] = gg; d[o + 2] = bb;
  }
  x.putImageData(im, 0, 0); return r;
}

// ---- HERO in the Full Metal Jacket, Copper -------------------------------------
const COP = { coat: 'copper', coatFar: 'copperFar' };
export function buildHero(scale = 1) {   // scale > 1: the same drawing made bigger (the home screen's prize page), not the small one stretched
  const H = (g) => crinkle(scale === 1 ? R(recolor(g, COP), 40, 50, 18, 46) : R(scaleShapes(recolor(g, COP), scale), Math.ceil(40 * scale), Math.ceil(50 * scale), Math.round(18 * scale), Math.round(46 * scale)), 1.3);
  return { run: frames(8, (p) => H(heroShapes(p))), jump: H(heroShapes(0, 'jump')), fall: H(heroShapes(0, 'fall')) };
}
export function buildJacket(scale = 1) {
  const g = (t) => recolor(jacketShapes(t), COP);
  return frames(12, (p) => crinkle(scale === 1 ? R(g(p * TAU), 30, 34, 15, 31) : R(scaleShapes(g(p * TAU), scale), Math.ceil(30 * scale), Math.ceil(34 * scale), Math.round(15 * scale), Math.round(31 * scale)), 0.7));
}

// a hero-shaped soldier: same rig, gas mask + helmet instead of hair and shades (faces right)
export function soldierShapes(phase, map) {
  const g = recolor(heroShapes(phase), map, ['hair', 'glasses']);
  const head = g.shapes.find((s) => s.m === 'skin' && s.kind === 'ell' && s.z === 7);
  const C = P(head.c.x - 0.4, head.c.y - 0.4);
  g.shapes.push(ell('gasmask', add(C, P(-0.4, -2.6)), 5.4, 3.8, 8, { g: 'helm' }), poly('gasmask', [add(C, P(-4.6, -2.6)), add(C, P(4.8, -2.6)), add(C, P(4, -1)), add(C, P(-4.8, -0.6))], 8.1, { g: 'helm' }));
  g.shapes.push(poly('dark', [add(C, P(0.6, -1.2)), add(C, P(5.2, -1.4)), add(C, P(5.8, 2.4)), add(C, P(3.8, 4.8)), add(C, P(1, 4)), add(C, P(0.2, 1))], 8.5, { g: 'mask' }));
  g.shapes.push(ell('gasmask', add(C, P(5.4, 3.4)), 1.8, 1.8, 8.6));                       // filter canister
  const post = (ctx, px) => { const e = px(add(C, P(3.4, 0))); ctx.fillStyle = '#ff4a3a'; ctx.fillRect(e.x, e.y, 2, 1); };
  return { shapes: g.shapes, post };
}

// ---- LEVEL 2: THE HIVE ---------------------------------------------------------
// face grabber (faces left): a pale armoured hive tick: a ribbed abdomen, a small head shield with two red eye stalks,
// three pairs of high-kneed crab legs and a pair of grabbing pincers in front. No tail.
function grabberShapes(phase, pose = 'run') {
  const T = phase * TAU, sh = [];
  const leap = pose === 'leap';
  const B = leap ? P(0, -6) : P(0, -5 - Math.abs(Math.sin(T * 2)) * 0.6);
  const tilt = leap ? -0.8 : 0;                                      // nose up when it springs
  const at = (x, y) => add(B, P(x, y + x * tilt * 0.25));
  // legs: three pairs splayed out like a crab's, knees up high. far side first (behind the body), near side on top
  for (const far of [1, 0]) for (let k = 0; k < 3; k++) {
    const sx = (k - 1) * 2.6, base = at(-1.4 + k * 2.4 + far * 0.6, 0.8), w = Math.sin(T * 2 + k * 2.1 + far * Math.PI);
    const knee = leap ? add(base, P(sx * 1.2 - 1.6, -3.0 + Math.abs(sx) * 0.3)) : add(base, P(sx + w * 0.7, -3.4 - Math.abs(sx) * 0.15));
    const foot = leap ? add(knee, P(sx * 0.9 - 0.8, 4.6)) : P(knee.x + sx * 0.7 - w * 0.9, -0.5 - Math.max(0, w) * 1.3);
    const m = far ? 'egg' : 'flesh';
    sh.push(cap(m, base, knee, 0.75, far ? 1 : 5, { g: 'l' + far + k }), cap(m, knee, foot, 0.6, far ? 1 : 5, { g: 'l' + far + k }));
  }
  // the abdomen (ribbed, in post) and the head shield in front of it
  sh.push(ell('flesh', at(1.8, -0.4), 4.8, 3.0, 3, { g: 'abd', rot: tilt * 0.25 }));
  sh.push(ell('flesh', at(-3.4, 0.4), 2.6, 2.2, 3.5, { g: 'head', rot: tilt * 0.25 }));
  // pincers: two short arms reaching forward with a split claw (wide open when it springs)
  for (const s of [0, 1]) { const r = at(-4.8, 1.2 - s * 0.8), e = add(r, leap ? P(-2.6, -1.6 + s * 1.4) : P(-2.0, 0.8 - s * 0.4)); const o = leap ? 1.4 : 0.7;
    sh.push(cap(s ? 'egg' : 'flesh', r, e, 0.55, s ? 2 : 6, { g: 'p' + s }), cap(s ? 'egg' : 'flesh', e, add(e, P(-1.6, -o)), 0.4, s ? 2 : 6, { g: 'p' + s }), cap(s ? 'egg' : 'flesh', e, add(e, P(-1.6, o)), 0.4, s ? 2 : 6, { g: 'p' + s })); }
  for (const ex of [-4.4, -2.6]) sh.push(cap('egg', at(ex + 0.6, -1.0), at(ex, -3.2 - (leap ? 0.6 : Math.abs(Math.sin(T * 2 + ex)) * 0.4)), 0.4, 4, { g: 'st' + ex }));   // two eye stalks
  const post = (ctx, px) => {
    ctx.fillStyle = '#a87c58'; for (let k = 0; k < 3; k++) { const r = px(at(0.4 + k * 1.6, -2.4)); ctx.fillRect(r.x, r.y, 1, 4); }      // the ribs on its back
    for (const ex of [-4.4, -2.6]) { const e = px(at(ex, -3.4 - (leap ? 0.6 : 0))); ctx.fillStyle = '#000'; ctx.fillRect(e.x - 1, e.y - 1, 3, 3); ctx.fillStyle = '#ff2a1a'; ctx.fillRect(e.x, e.y, 1, 1); }   // two red eyes up on the shield
  };
  return { shapes: sh, post };
}
// hive drone (faces left): glossy black biomech crawler with a long swept-back head and a bladed tail
function droneShapes(phase) {
  const T = phase * TAU, sh = [];
  const bob = Math.sin(T * 2) * 0.5;
  const Hp = P(6, -13 + bob), Sh = P(-6, -15 + bob);
  const C = add(Sh, P(-3, -4));
  // tail
  let p = Hp;
  for (let k = 0; k < 8; k++) { const q = add(p, P(3, -1.6 + k * 0.5 + Math.sin(T + k * 0.7) * 0.8)); sh.push(cap('xenoFar', p, q, Math.max(0.7, 1.8 - k * 0.15), 0.5, { g: 'tail' })); p = q; }
  sh.push(poly('xeno', [p, add(p, P(4, -2.4)), add(p, P(2.6, 1.2))], 0.6));
  // limbs: far pair darker, near pair on top
  const limb = (root, a, b, len1, len2, m, z, g) => { const K = add(root, dir(len1, a)); const F = add(K, dir(len2, b)); sh.push(cap(m, root, K, 1.4, z, { g }), cap(m, K, F, 1.1, z, { g })); return F; };
  limb(Hp, -0.6 + Math.sin(T) * 0.5, 0.6, 6, 7.6, 'xenoFar', 1, 'lf');
  limb(Sh, -0.2 - Math.sin(T) * 0.5, -0.9, 6, 6.4, 'xenoFar', 1, 'af');
  // body: ribbed torso
  sh.push(poly('xeno', [add(Sh, P(-2.4, -2.6)), add(Sh, P(1, -3.4)), add(Hp, P(1.4, -2.4)), add(Hp, P(2, 1.6)), add(Sh, P(0, 2.6)), add(Sh, P(-2.4, 1.6))], 3, { g: 'body' }));
  // dorsal tubes
  for (let k = 0; k < 3; k++) sh.push(cap('xenoFar', add(Sh, P(1 + k * 2.4, -2.6)), add(Sh, P(3.8 + k * 2.4, -7.4 + k * 0.6)), 0.9, 2.5));
  // head: long dome sweeping back, jaw under the front
  sh.push(ell('xeno', add(C, P(2.6, -1.6)), 8.6, 3.4, 5, { g: 'head', rot: -0.35 }));
  sh.push(poly('xeno', [add(C, P(-6.4, 0.6)), add(C, P(-1, -0.4)), add(C, P(1.6, 2.4)), add(C, P(-4.4, 2.8))], 5.1, { g: 'head' }));
  limb(Hp, -0.3 - Math.sin(T) * 0.5, 0.7, 6, 7.6, 'xeno', 6, 'ln');
  limb(Sh, 0.1 + Math.sin(T) * 0.5, -0.8, 6, 6.4, 'xeno', 6, 'an');
  const post = (ctx, px) => {
    ctx.fillStyle = '#e8eef4';
    for (let i = 0; i < 4; i++) { const t = px(add(C, P(-5.8 + i * 1.3, 1.2))); ctx.fillRect(t.x, t.y, 1, 1 + (i % 2)); }   // teeth
    ctx.fillStyle = '#8aff4a'; const d = px(add(C, P(-6.4, 3.6))); ctx.fillRect(d.x, d.y, 1, 2);                           // acid drool
    ctx.fillStyle = '#5a7080'; for (let k = 0; k < 4; k++) { const r = px(add(Sh, P(1 + k * 2, 0))); ctx.fillRect(r.x, r.y - 1, 1, 3); }   // ribs
  };
  return { shapes: sh, post };
}
function eggShapes(open = 0) {
  const sh = [ell('egg', P(0, -8), 6, 8, 1, { g: 'egg', shadeLow: true, lowY: 0 }), ell('egg', P(0, -1.5), 6.6, 1.8, 0.9)];
  if (open) for (const s of [-1, 1]) sh.push(poly('egg', [P(-1.4 * s, -14.6), P(-4.4 * s, -19.6), P(-6.6 * s, -18), P(-4.6 * s, -13.6)], 2, { g: 'p' + s }));
  const post = (ctx, px) => {
    if (open) { const c = px(P(0, -14.8)); ctx.fillStyle = '#8aff4a'; ctx.fillRect(c.x - 2, c.y - 1, 5, 2); ctx.fillStyle = '#e0ffb0'; ctx.fillRect(c.x, c.y - 1, 1, 1); }
    else { const c = px(P(0, -15.6)); ctx.fillStyle = '#30281a'; ctx.fillRect(c.x, c.y, 1, 4); ctx.fillRect(c.x - 2, c.y + 1, 5, 1); }
    ctx.fillStyle = '#665a3c'; for (const [vx, vy] of [[-3, -6], [2, -10], [3, -4]]) { const v = px(P(vx, vy)); ctx.fillRect(v.x, v.y, 1, 3); }
  };
  return { shapes: sh, post };
}
// the hive queen (faces left): towering, with a huge fanned crest and two pairs of arms
function queenShapes(phase) {
  const T = phase * TAU, sh = [], b = Math.sin(T) * 0.6;
  const Hp = P(8, -26), Sh = P(-2, -46 + b), C = add(Sh, P(-6, -6));
  // tail coiling behind
  let p = Hp; for (let k = 0; k < 9; k++) { const q = add(p, P(3.2, 1.6 - k * 0.1 + Math.sin(T + k) * 0.6)); sh.push(cap('xenoFar', p, q, Math.max(1, 3.2 - k * 0.25), 0.2, { g: 'tail' })); p = q; }
  // legs (digitigrade)
  const leg = (dx, m, z, g) => { const r = add(Hp, P(dx, 0)); const K = add(r, P(-6, 10)); const A = add(K, P(5, 9)); const F = add(A, P(-4, 7)); sh.push(cap(m, r, K, 3.4, z, { g }), cap(m, K, A, 2.4, z, { g }), cap(m, A, F, 1.8, z, { g }), cap(m, F, add(F, P(-4, 0)), 1.4, z, { g })); };
  leg(4, 'xenoFar', 1, 'lf'); leg(0, 'queen', 4, 'ln');
  // torso
  sh.push(poly('queen', [add(Sh, P(-5, -1)), add(Sh, P(5, -2)), add(Hp, P(5, 0)), add(Hp, P(-2, 3)), add(Sh, P(-3, 10))], 3, { g: 'body' }));
  for (let k = 0; k < 3; k++) sh.push(cap('xenoFar', add(Sh, P(2 + k * 3, -1)), add(Sh, P(7 + k * 3, -8 + k)), 1.2, 2.6));
  // crest: a huge fan sweeping up and back
  sh.push(poly('queen', [add(C, P(-2, -1)), add(C, P(2, -9)), add(C, P(10, -15)), add(C, P(20, -14)), add(C, P(24, -8)), add(C, P(18, -2)), add(C, P(8, 2))], 5, { g: 'crest' }));
  sh.push(ell('queen', add(C, P(-2, 0.6)), 7, 3.2, 5.2, { g: 'head', rot: -0.2 }));
  sh.push(poly('queen', [add(C, P(-9, 1.6)), add(C, P(-3, 1)), add(C, P(0, 4.4)), add(C, P(-7, 4.6))], 5.3, { g: 'head' }));
  // arms: big pair and small chest pair
  const arm = (root, a, b, l1, l2, r, m, z, g) => { const E = add(root, dir(l1, a)); const Hd = add(E, dir(l2, b)); sh.push(cap(m, root, E, r, z, { g }), cap(m, E, Hd, r * 0.8, z, { g })); for (const f of [-0.5, 0, 0.5]) sh.push(cap(m, Hd, add(Hd, dir(3, b + f)), 0.6, z, { g })); };
  arm(add(Sh, P(1, 1)), -0.2 + b * 0.1, -1.9, 9, 9, 2, 'xenoFar', 2, 'af');
  arm(add(Sh, P(-2, 0)), -0.5 - b * 0.1, -2.2, 10, 10, 2.2, 'queen', 7, 'an');
  arm(add(Sh, P(-2, 6)), -0.9, -2.3, 4, 4, 1, 'queen', 7.5, 'sm');
  const post = (ctx, px) => {
    ctx.fillStyle = '#e8eef4'; for (let i = 0; i < 6; i++) { const t = px(add(C, P(-9 + i * 1.3, 2.2))); ctx.fillRect(t.x, t.y, 1, 1 + (i % 2)); }
    ctx.fillStyle = '#8aff4a'; for (const dy of [4, 7]) { const d = px(add(C, P(-8, dy))); ctx.fillRect(d.x, d.y, 1, 2); }
    ctx.fillStyle = '#4a5a6c'; for (let k = 0; k < 5; k++) { const r = px(add(C, P(4 + k * 3.4, -4 - k * 1.6))); ctx.fillRect(r.x, r.y, 1, 4); }   // crest ridges
  };
  return { shapes: sh, post };
}
// the power loader suit: a yellow industrial exo-frame (pickup) – the old FWAHBL yellow
function loaderShapes() {
  const sh = [];
  sh.push(cap('dark', P(-5, -4), P(-5, -18), 1.6, 1), cap('dark', P(5, -4), P(5, -18), 1.6, 1));
  sh.push(poly('loader', [P(-8, -26), P(8, -26), P(8, -16), P(-8, -16)], 2, { g: 'cage' }), poly('dark', [P(-5, -24), P(5, -24), P(5, -18), P(-5, -18)], 2.5, { noSeam: true }));
  sh.push(cap('loader', P(-7, -4), P(-7, -12), 2.4, 3, { g: 'lg' }), cap('loader', P(7, -4), P(7, -12), 2.4, 3, { g: 'rg' }));
  sh.push(poly('loader', [P(-10, -3), P(-3, -3), P(-3, 0), P(-10, 0)], 3.2), poly('loader', [P(3, -3), P(10, -3), P(10, 0), P(3, 0)], 3.2));
  for (const s of [-1, 1]) { sh.push(cap('loader', P(9 * s, -24), P(13 * s, -16), 2, 4, { g: 'arm' + s }), cap('loader', P(13 * s, -16), P(12 * s, -9), 1.8, 4, { g: 'arm' + s })); sh.push(poly('dark', [P(10.4 * s, -9), P(14 * s, -9), P(14.6 * s, -5), P(12.6 * s, -7), P(11.4 * s, -5)], 4.5)); }
  const post = (ctx, px) => { ctx.fillStyle = '#000'; for (let i = 0; i < 6; i++) { const h = px(P(-7 + i * 2.6, -26)); ctx.fillRect(h.x, h.y + 1, 1, 1); } };
  return { shapes: sh, post };
}

// ---- LEVEL 3: INVERSION --------------------------------------------------------
// (soldier + inverted twin use the hero rig; see buildAll)

// ---- LEVEL 4: NEON RAIN --------------------------------------------------------
function spinnerShapes() {
  const sh = [];
  sh.push(poly('police', [P(-19, -3), P(-16, -6), P(-6, -7), P(8, -8), P(16, -10), P(19, -9), P(18, -3), P(15, 0), P(-16, 0)], 2, { g: 'b' }));
  sh.push(poly('police', [P(12, -8), P(17, -14), P(19, -14), P(18, -8)], 1.8, { g: 'fin' }));
  sh.push(poly('glass', [P(-7, -7), P(-3, -11), P(5, -11), P(9, -8)], 2.5, { g: 'canopy' }));
  sh.push(poly('dark', [P(-14, 0), P(15, 0), P(12, 2.6), P(-11, 2.6)], 2.8));
  sh.push(poly('dark', [P(-1, -10.6), P(3, -10.6), P(3, -12.2), P(-1, -12.2)], 3));
  const post = (ctx, px) => {
    const l = px(P(-1, -12.2)); ctx.fillStyle = '#ff2a2a'; ctx.fillRect(l.x, l.y, 2, 1); ctx.fillStyle = '#3a8aff'; ctx.fillRect(l.x + 2, l.y, 2, 1);
    ctx.fillStyle = '#fff7c0'; const h = px(P(-18, -3)); ctx.fillRect(h.x, h.y, 2, 1);
    ctx.fillStyle = '#20263a'; for (let i = 0; i < 5; i++) { const s = px(P(-9 + i * 4, -4)); ctx.fillRect(s.x, s.y, 2, 1); }
    ctx.fillStyle = '#ffb03a'; for (const x of [-8, 9]) { const j = px(P(x, 3.4)); ctx.fillRect(j.x - 1, j.y, 3, 1); }
  };
  return { shapes: sh, post };
}
function owlShapes(open = 1) {
  const sh = [];
  if (open) for (const s of [-1, 1]) sh.push(poly('owl', [P(4 * s, -12), P(15 * s, -16), P(17 * s, -10), P(12 * s, -6), P(5 * s, -6)], 1, { g: 'w' + s }));
  sh.push(ell('owl', P(0, -8), 5, 6.6, 2, { g: 'b' }), ell('owl', P(0, -16), 5, 4.4, 3, { g: 'h' }));
  sh.push(poly('owl', [P(-4.6, -18), P(-5, -23), P(-2, -19.4)], 3.1, { g: 'h' }), poly('owl', [P(4.6, -18), P(5, -23), P(2, -19.4)], 3.1, { g: 'h' }));
  sh.push(cap('chrome', P(-2, -1.6), P(-2, 0), 0.6, 1.5), cap('chrome', P(2, -1.6), P(2, 0), 0.6, 1.5));
  const post = (ctx, px) => {
    for (const s of [-1, 1]) { const e = px(P(2.2 * s, -16.4)); ctx.fillStyle = '#3e2c14'; ctx.fillRect(e.x - 1, e.y - 1, 3, 3); ctx.fillStyle = '#ff9a1a'; ctx.fillRect(e.x - 1, e.y - 1, 2, 2); ctx.fillStyle = '#fff3a0'; ctx.fillRect(e.x - 1, e.y - 1, 1, 1); }
    const b = px(P(0, -14.2)); ctx.fillStyle = '#3e2c14'; ctx.fillRect(b.x, b.y, 1, 2);
    ctx.fillStyle = '#7a5a34'; for (let i = 0; i < 4; i++) { const f = px(P(-2 + (i % 2) * 3, -9 + i * 1.6)); ctx.fillRect(f.x, f.y, 2, 1); }
  };
  return { shapes: sh, post };
}
const SYN = { white: 'synthCoat', whiteFar: 'synthCoat', denim: 'skinPale', blond: 'platinum', skin: 'skinPale', skinFar: 'skinPale', trousers: 'dark', trousersFar: 'cape' };

// ---- LEVEL 5: THE CODE ----------------------------------------------------------
// the agent: hero rig in a black suit, white shirt, thin tie, slicked hair, shades, earpiece (faces right)
function agentShapes(phase, pose = 'run') {
  const g = recolor(heroShapes(phase, pose === 'shoot' ? 'fall' : pose), { coat: 'suit', coatFar: 'suitFar', trousers: 'suit', trousersFar: 'suitFar', tee: 'shirt' }, ['hair']);
  const head = g.shapes.find((s) => s.m === 'skin' && s.kind === 'ell' && s.z === 7);
  const C = P(head.c.x - 0.4, head.c.y - 0.4);
  g.shapes.push(poly('slick', [add(C, P(-4.6, 1.8)), add(C, P(-5, -2.4)), add(C, P(-3, -4.9)), add(C, P(1, -5.5)), add(C, P(4.6, -4.2)), add(C, P(4.6, -2.6)), add(C, P(0.8, -3.1)), add(C, P(-2, -1.6)), add(C, P(-2.6, 1.8))], 8));
  const shirt = g.shapes.find((s) => s.m === 'shirt' && s.kind === 'poly');
  let hand = null;
  if (pose === 'shoot') {            // near arm held straight out with a pistol
    g.shapes = g.shapes.filter((s) => !(s.z >= 10 && s.z < 10.4));
    const Sh = shirt.pts[0], E = add(Sh, dir(5.4, 1.45)); hand = add(E, dir(4.6, 1.55));
    g.shapes.push(cap('suit', Sh, E, 2.1, 10, { g: 'sleeve' }), cap('suit', E, add(E, dir(3.4, 1.55)), 2, 10.1, { g: 'sleeve' }), ell('skin', hand, 1.8, 1.7, 10.3));
    g.shapes.push(cap('dark', add(hand, P(0, -1)), add(hand, P(4.4, -1)), 0.9, 10.4), cap('dark', hand, add(hand, P(0, 1.8)), 0.7, 10.35));
  }
  const post0 = g.post;
  const post = (ctx, px) => {
    post0 && post0(ctx, px);
    const a = shirt.pts, top = px(P((a[0].x + a[1].x) / 2 + 0.3, (a[0].y + a[1].y) / 2)), bot = px(P((a[2].x + a[3].x) / 2, (a[2].y + a[3].y) / 2 - 1.5));
    ctx.fillStyle = '#0a0a0e'; const n = Math.max(1, Math.abs(bot.y - top.y)); for (let k = 0; k <= n; k++) ctx.fillRect(Math.round(top.x + (bot.x - top.x) * k / n), top.y + Math.sign(bot.y - top.y) * k, 1, 1);
    const e = px(add(C, P(-1.4, 1))); ctx.fillStyle = '#d8dce4'; ctx.fillRect(e.x, e.y, 1, 1); ctx.fillRect(e.x - 1, e.y + 2, 1, 2); ctx.fillRect(e.x - 1, e.y + 4, 1, 1);
    if (hand) { const m = px(add(hand, P(5.6, -1))); ctx.fillStyle = '#7aff8a'; ctx.fillRect(m.x, m.y - 1, 3, 3); ctx.fillStyle = '#ffffff'; ctx.fillRect(m.x + 1, m.y, 1, 1); }
  };
  return { shapes: g.shapes, post };
}
// sentinel (faces left): a hunter-killer machine, a cluster of red eyes and a long trail of tentacles
function sentinelShapes(phase) {
  const T = phase * TAU, sh = [];
  sh.push(ell('sentinel', P(0, 0), 6, 5.4, 4, { g: 'h' }), ell('sentinel', P(3.6, 0), 4, 4.4, 3.9, { g: 'h' }));
  for (const s of [-1, 1]) sh.push(cap('sentinel', P(-4, 3.6 * s), P(-8, 5.6 * s), 0.9, 5));          // claws at the front
  for (let k = 0; k < 7; k++) {
    let p = P(5, -3.6 + k * 1.2); const base = (k - 3) * 0.16;
    for (let i = 0; i < 7; i++) { const q = add(p, P(2.6, (base + Math.sin(T + k * 0.9 + i * 0.7) * 0.42) * 2.6)); sh.push(cap('sentinel', p, q, Math.max(0.45, 1.1 - i * 0.1), k % 2 ? 2 : 3, { g: 't' + k })); p = q; }
  }
  const post = (ctx, px) => {
    for (const [ex, ey] of [[-3.6, -1.6], [-4.2, 0.6], [-2.4, 2.4], [-1.6, -0.4], [-2.2, -3.2], [-0.4, 1.4]]) { const e = px(P(ex, ey)); ctx.fillStyle = '#000'; ctx.fillRect(e.x - 1, e.y - 1, 3, 3); ctx.fillStyle = '#ff2a1a'; ctx.fillRect(e.x, e.y, 2, 2); ctx.fillStyle = '#ffd0b0'; ctx.fillRect(e.x, e.y, 1, 1); }
  };
  return { shapes: sh, post };
}
// a black cat walking (faces right)
function catShapes(phase) {
  const T = phase * TAU, sh = [];
  sh.push(ell('cat', P(0, -6), 5.4, 2.6, 3, { g: 'b' }), ell('cat', P(5.8, -9), 2.4, 2.2, 4, { g: 'b' }));
  sh.push(poly('cat', [P(4.2, -10.4), P(4.4, -13), P(5.8, -11)], 4.1, { g: 'b' }), poly('cat', [P(6.4, -11), P(7.6, -13.2), P(7.8, -10.2)], 4.1, { g: 'b' }));
  for (const [x, ph, z] of [[3.4, 0, 2], [-3.6, Math.PI, 2], [2.4, Math.PI, 3.5], [-2.6, 0, 3.5]]) { const a = Math.sin(T + ph) * 0.45; sh.push(cap('cat', P(x, -5), add(P(x, -5), dir(5, a)), 0.8, z, { g: 'l' + x })); }
  let p = P(-5, -7); for (let i = 0; i < 4; i++) { const q = add(p, P(-1.6, -2.2 + i * 0.3 + Math.sin(T + i) * 0.4)); sh.push(cap('cat', p, q, 0.7, 2.5, { g: 'tail' })); p = q; }
  const post = (ctx, px) => { const e = px(P(6.6, -9.6)); ctx.fillStyle = '#7aff5a'; ctx.fillRect(e.x, e.y, 1, 1); };
  return { shapes: sh, post };
}

// ---- LEVEL 1: EVENT HORIZON ----------------------------------------------------
function iceShapes() {
  const sh = [poly('ice', [P(-8, -4), P(-5, -11), P(0, -9), P(3, -14), P(8, -6), P(6, 2), P(-2, 4), P(-7, 1)], 2, { g: 'a' }), poly('ice', [P(3, -14), P(6, -18), P(8, -6)], 2.1, { g: 'a' })];
  const post = (ctx, px) => { const s = px(P(-2, -6)); ctx.fillStyle = '#ffffff'; ctx.fillRect(s.x, s.y - 1, 1, 3); ctx.fillRect(s.x - 1, s.y, 3, 1); };
  return { shapes: sh, post };
}
function floeShapes(w) {
  const pts = [P(-w, 0), P(-w + 3, -4), P(-w * 0.4, -5), P(0, -4), P(w * 0.5, -5), P(w - 2, -4), P(w, 0), P(w * 0.6, 5), P(w * 0.1, 9), P(-w * 0.5, 6)];
  return { shapes: [poly('ice', pts, 1, { g: 'f' })], post: null };
}

// ---- build everything once ---------------------------------------------------------
export function buildAll() {
  const A = {};
  A.hero = buildHero();
  A.jacket = buildJacket(1);
  A.jacketBig = buildJacket(2);
  A.jacketIcon = buildJacket(0.66);
  // L1
  A.ice = R(iceShapes(), 22, 26, 11, 20);
  A.floe = R(floeShapes(22), 50, 18, 25, 7);
  A.floeS = R(floeShapes(14), 34, 18, 17, 7);
  // L2
  A.grabber = frames(4, (p) => R(scaleShapes(grabberShapes(p), 1.5), 56, 28, 20, 26));
  A.grabberLeap = R(scaleShapes(grabberShapes(0, 'leap'), 1.5), 56, 28, 20, 23);
  A.drone = frames(6, (p) => R(droneShapes(p), 64, 34, 20, 31));
  A.egg = R(eggShapes(0), 18, 24, 9, 22); A.eggOpen = R(eggShapes(1), 18, 24, 9, 22);
  A.queen = frames(4, (p) => R(queenShapes(p), 76, 76, 32, 72));
  A.queenBody = frames(4, (p) => { const g = queenShapes(p); return R({ shapes: g.shapes.filter((q) => q.g !== 'tail'), post: g.post }, 76, 76, 32, 72); });   // no tail: the game's boss draws a big live one
  A.loader = R(loaderShapes(), 34, 32, 17, 29);
  // L3: soldiers in blue running backwards (faces left, moves right); your inverted twin
  A.soldier = frames(8, (p) => flip(R(soldierShapes(p, { coat: 'invBlue', coatFar: 'invBlueFar' }), 40, 50, 18, 46)));
  A.twin = frames(8, (p) => crinkle(R(recolor(heroShapes(p), { coat: 'invBlue', coatFar: 'invBlueFar' }), 40, 50, 18, 46), 1.3));
  // L5
  A.spinner = R(spinnerShapes(), 44, 22, 22, 16);
  A.owl = R(owlShapes(1), 40, 28, 20, 26); A.owlSit = R(owlShapes(0), 40, 28, 20, 26);
  A.synth = frames(6, (p) => R(recolor(scientistShapes(p), SYN, ['acid', 'glass', 'beard']), 36, 48, 18, 45));
  A.nexus = frames(6, (p) => R(scaleShapes(recolor(scientistShapes(p), SYN, ['acid', 'glass', 'beard']), 1.35), 50, 66, 25, 62));
  // L6
  A.agent = frames(8, (p) => flip(R(agentShapes(p), 40, 50, 18, 46)));
  A.agentShoot = flip(R(agentShapes(0, 'shoot'), 44, 50, 18, 46));
  A.agentBig = frames(8, (p) => flip(R(scaleShapes(agentShapes(p), 1.35), 54, 66, 24, 62)));
  A.sentinel = frames(8, (p) => R(sentinelShapes(p), 40, 30, 10, 15));
  A.cat = frames(8, (p) => R(catShapes(p), 26, 18, 12, 16));
  return A;
}
