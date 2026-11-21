// LEVEL: DEEP DESERT (nod to Dune). A desert planet under two moons, spice in the air, and something huge under the sand.
import { MATS, cap, ell, poly, heroShapes, R, P, add, frames, put, flip, tint, hash, TAU, recolor, W, H, GY, dith, pix, hud, tile, rect, GRAD, disc, ridge, skyGrad } from './lvkit.js';

Object.assign(MATS, {
  stillsuit: ['#9a8a74', '#6a5a48', '#4a3e30', '#2a221a'],
  stillsuitFar: ['#6a5a48', '#544636', '#3a3026', '#201a12'],
  thopter: ['#d8d0c0', '#9a9284', '#6a6458', '#3a3630'],
  wing: ['#f0ecdc', '#c8c2b0', '#9a9484', '#5a564c'],
  robe: ['#e8d0a8', '#c0a478', '#8a7450', '#4e402a'],
  robeFar: ['#c0a478', '#a08860', '#6e5a3c', '#3a2e1c'],
  wrap: ['#7a5a48', '#5a4034', '#3a2820', '#1e140e'],
});
// the desert raider (faces right before flipping): the hero rig in long sand robes, a deep hood, a face wrap, glowing blue eyes
function raiderShapes(phase) {
  const g = recolor(heroShapes(phase), { coat: 'robe', coatFar: 'robeFar', trousers: 'robeFar', trousersFar: 'robeFar', tee: 'wrap' }, ['hair', 'glasses']);
  const head = g.shapes.find((s) => s.m === 'skin' && s.kind === 'ell' && s.z === 7), C = P(head.c.x - 0.4, head.c.y - 0.4);
  const hip = g.shapes.find((s) => s.m === 'robe' && s.kind === 'poly' && s.z === 5);
  g.shapes.push(poly('robe', [add(C, P(-6.4, 4)), add(C, P(-6, -3)), add(C, P(-2, -6.4)), add(C, P(3.4, -6)), add(C, P(5.8, -2.6)), add(C, P(3.4, -2.4)), add(C, P(-1.6, -1)), add(C, P(-2.6, 5))], 8, { g: 'hood' }));   // hood
  g.shapes.push(poly('wrap', [add(C, P(0.4, 0.6)), add(C, P(5.6, 0.2)), add(C, P(5, 4.6)), add(C, P(1.4, 5.6))], 8.2, { g: 'wrap' }));                                                   // face wrap
  if (hip) { const [a, b] = [hip.pts[3], hip.pts[5]]; g.shapes.push(poly('robeFar', [a, b, P(b.x - 1, b.y + 7), P(a.x + 1, a.y + 7)], 1.5, { g: 'skirt' })); }                         // robe down to the knees
  return { shapes: g.shapes, post: (c, px) => { const e = px(add(C, P(3.4, -0.8))); c.fillStyle = '#7ad8ff'; c.fillRect(e.x - 1, e.y, 3, 1); c.fillStyle = '#e8f8ff'; c.fillRect(e.x, e.y, 1, 1); } };
}

// the great worm's mouth, face on: rings of crystal teeth that turn, a dark throat
const maw = (r, t) => pix(r * 2 + 1, r * 2 + 1, (i, j) => {
  const x = i - r, y = j - r, d = Math.hypot(x, y), a = Math.atan2(y, x); if (d > r) return null;
  if (d > r - 3) return dith(['#d8a870', '#a8784a', '#6a4a2a'], (d - r + 3) / 3 + (Math.sin(a * 9) > 0.7 ? 0.4 : 0), i, j);   // ridged lip
  const ring = Math.floor((r - d) / 3.2);
  if (d > r * 0.32) { const tooth = Math.sin(a * (14 + ring * 2) + t * TAU * (ring % 2 ? 1 : -1) + ring) > 0.45 && ((r - d) % 3.2) < 2.2; if (tooth) return ring % 2 ? '#f4f0e0' : '#d8e4f0'; return dith(['#c8786a', '#8a3a3a', '#4a1418'], (r - d) / r, i, j); }
  return d < r * 0.18 ? '#000000' : dith(['#3a0a0a', '#120202'], (r * 0.32 - d) / (r * 0.14), i, j);
});
const seg = (r) => disc(r, ['#e8c088', '#c8945a', '#9a6a3a', '#6a4422', '#3a2412']);
function drawWorm(ctx, x, y, rise, t, s = 1) {           // body arcs up out of the sand, head turned to face you
  const N = 9;
  for (let k = N; k >= 0; k--) {
    const u = k / N, px = x + Math.sin(u * 2.2) * 34 * s + u * 30 * s, py = y + (1 - Math.sin((1 - u) * 1.4)) * 120 * s * (1 - rise * 0.5) - rise * 30 * s * (1 - u);
    const r = Math.round((14 + (1 - u) * 6) * s); ctx.drawImage(seg(r), Math.round(px - r), Math.round(py - r));
    ctx.fillStyle = '#5a3a1c'; ctx.fillRect(Math.round(px - r + 2), Math.round(py), r * 2 - 4, 1);      // ring ridge
  }
  const m = maw(Math.round(22 * s), t); ctx.drawImage(m, Math.round(x - m.width / 2), Math.round(y - m.height / 2) - Math.round(rise * 30 * s));
}
// ornithopter (faces left): long body, four beating wings
function thopterShapes(phase) {
  const T = phase * TAU, sh = [], flap = Math.sin(T * 2);
  sh.push(ell('thopter', P(0, 0), 14, 4, 3, { g: 'b' }), ell('glass', P(-10, -1), 4.4, 3.2, 3.2), cap('thopter', P(12, 0), P(20, -1), 1.6, 3));
  for (const [x, z] of [[-3, 2], [4, 4]]) sh.push(poly('wing', [P(x - 1, -2), P(x + 12, -9 - flap * 6), P(x + 15, -7 - flap * 6), P(x + 2, -1)], z, { g: 'w' + x }), poly('wing', [P(x - 1, 1), P(x + 10, 6 + flap * 4), P(x + 13, 5 + flap * 4), P(x + 2, 1)], z - 0.5, { g: 'v' + x }));
  return { shapes: sh, post: (c, px) => { const e = px(P(-12, 3)); c.fillStyle = '#ffd06a'; c.fillRect(e.x, e.y, 2, 1); } };
}
// thumper: a stake with a piston that hammers the sand
const thumper = (t) => { const c = pix(14, 34, (i, j) => { const up = Math.abs(Math.sin(t * TAU)) * 6; if (i >= 5 && i <= 8 && j >= 4 + up && j < 16 + up) return i === 5 ? '#c8c0a8' : '#7a7260'; if (i >= 6 && i <= 7 && j >= 14 && j < 34) return i === 6 ? '#a89a7a' : '#5a4e3a'; if (j >= 30 && i >= 3 && i <= 10) return '#3a3226'; return null; }); return c; };

export function build(A, n) {
  const sky = skyGrad(['#3a1a14', '#6a2e1a', '#a8502a', '#d8823a', '#f0b060', '#f8d898'], 128);
  const far = ridge(2, 26, ['#e8b878', '#d09858', '#b87a44'], 60), mid = ridge(5, 22, ['#f0c080', '#d8a060', '#b88048'], 46);
  const mesa = pix(640, 60, (i, j) => { const b = [[40, 90, 28], [300, 60, 40], [470, 110, 22]].find(([x, w]) => i >= x && i < x + w); if (!b) return null; const [x, w, top] = b, edge = Math.min(i - x, x + w - i); const tt = top + Math.max(0, 8 - edge) * 2; if (j < tt) return null; return dith(['#8a4a2a', '#6a3420', '#4a2216'], (j - tt) / 40 + (i - x) / w * 0.3, i, j); });
  const sand = pix(640, H - GY, (i, j) => (Math.sin(i * 0.22 + j * 0.9) > 0.8 ? '#f8dca0' : dith(['#f0c888', '#d8a868', '#b8884a'], j / 24, i, j)));
  const moonA = disc(16, ['#fff8e8', '#f0e0c0', '#c8b490', '#8a7a60']), moonB = disc(7, ['#f8f0e0', '#d8c8a8', '#a89878']);
  const raider = frames(8, (p) => flip(R(raiderShapes(p), 40, 50, 18, 46)));
  const thop = frames(6, (p) => R(thopterShapes(p), 44, 30, 22, 15));
  const spice = Array.from({ length: 40 }, (_, k) => [hash(k, 31) * W, hash(k, 32) * GY, hash(k, 33)]);
  const level = (ctx, f) => {
    ctx.drawImage(sky, 0, 0);
    ctx.drawImage(moonA, 230, 14); ctx.drawImage(moonB, 268, 34);
    tile(ctx, mesa, f * 0.2, GY - 76); tile(ctx, far, f * 0.35, GY - 60); tile(ctx, mid, f * 0.7, GY - 40);
    // the worm erupts, sand pouring off it
    const rise = (Math.sin(f * 0.06) + 1) / 2;
    drawWorm(ctx, 240, 70 + (1 - rise) * 26, rise, (f % 24) / 24);
    for (let k = 0; k < 24; k++) { const a = hash(k, 7) * Math.PI, d = ((f * 2 + k * 9) % 40); rect(ctx, k % 3 ? '#e8c088' : '#f8dca0', 262 + Math.cos(a) * d * 1.4, GY - 6 - Math.sin(a) * d * (0.6 + rise), 2, 2); }
    tile(ctx, sand, f * 2, GY);
    put(ctx, { c: thumper((f % 12) / 12), ox: 7, oy: 34 }, 150 - ((f * 2) % 400) + 300, GY + 2);
    put(ctx, thop[f % 6], 110 + Math.sin(f * 0.05) * 30, 30 + Math.sin(f * 0.11) * 5);
    put(ctx, raider[f % 8], 200 - (f % 60) * 0.8, GY);
    put(ctx, A.hero.run[f % 8], 70, GY);
    // spice drifting in the air: gold with the odd blue glint
    for (const [x0, y0, s] of spice) { const x = ((x0 - f * (0.6 + s)) % W + W) % W, y = y0 + Math.sin(f * 0.05 + s * 9) * 3; rect(ctx, s > 0.85 ? '#7ad8ff' : '#ffd890', x, y, 1, 1); }
    hud(ctx, A, f, n, null, GRAD.gold);
  };
  const W2 = (c) => c.canvas.width, H2 = (c) => c.canvas.height;
  const kit = { sky, far, mid, mesa, sand, moonA, moonB, raider, thop, thumper, drawWorm };   // raw art for the playable game
  return {
    kit,
    meta: { name: 'DEEP DESERT', nod: 'Nod to: Dune', c: '#f0a050', stage: ['#d8823a', '#d8a868'], d: 'A desert planet under two moons, with spice glittering in the air and table-top mesas on the horizon. Don’t run in rhythm: something the size of a train is listening under the sand. Dusty orange and gold.' },
    level,
    cards: [
      { n: 'DESERT RAIDER', t: 'BADDIE', d: 'Long sand robes, a deep hood, a face wrap and glowing blue eyes. Comes at you out of the dune haze with a crystal knife. Stomp: 70 pts.', draw: (c, f) => put(c, raider[f % 8], W2(c) / 2, H2(c) - 8) },
      { n: 'ORNITHOPTER', t: 'BADDIE', d: 'A flying machine with beating dragonfly wings. Swoops low and drops sand mines. Hit it from below: 90 pts.', draw: (c, f) => put(c, thop[f % 6], W2(c) / 2, 26 + Math.sin(f * 0.15) * 4) },
      { n: 'THUMPER', t: 'OBSTACLE', d: 'A stake that hammers the sand. Run past one and it calls the worm. Jump it, or kick it over to send the worm somewhere else.', draw: (c, f) => put(c, { c: thumper((f % 12) / 12), ox: 7, oy: 34 }, W2(c) / 2, H2(c) - 6) },
      { n: 'SPICE', t: 'POWER-UP', d: 'Breathe in the glittering spice and your eyes go blue: for 10 seconds you can see where the worm will rise.', good: 1, draw: (c, f) => { for (let k = 0; k < 30; k++) { const a = k * 0.7 + f * 0.05, d = 4 + (k % 7) * 3; rect(c, k % 5 ? '#ffd890' : '#7ad8ff', W2(c) / 2 + Math.cos(a) * d, 26 + Math.sin(a) * d * 0.7, 1 + (k % 2), 1 + (k % 2)); } } },
      { sz: [92, 72], n: 'THE GREAT WORM', t: 'BOSS', d: 'A worm as long as a train erupts out of the sand, its mouth a ring of turning crystal teeth. Outrun it to the rocks, then ride it: +500.', draw: (c, f) => { c.save(); c.beginPath(); c.rect(0, 0, W2(c), H2(c) - 8); c.clip(); drawWorm(c, 46, 30 + (1 - (Math.sin(f * 0.08) + 1) / 2) * 12, (Math.sin(f * 0.08) + 1) / 2, (f % 24) / 24, 0.55); c.restore(); } },
    ],
  };
}
