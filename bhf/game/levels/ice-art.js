// THE ICE PLANET's own dangers (see ../danger.js for the contract). Everything here is the cold doing the work:
//   vent    = an ammonia geyser bursting through a crack in the ice (mint green, so it never reads as something to stand on)
//   rain    = hail: lumps breaking off a bank of frozen cloud, slanted by the wind
//   dropper = a great icicle under the gallery that lets go and smashes into a patch of shards ('puddle')
//   ride    = the expedition's slab robot: four steel slabs that fold into a wheel and cartwheel you through everything
//   shield  = a heat shield (the only warm thing down here)
//   gruntAlt= a rigged slab robot, red eye, waddling at you
import { cv, pix, hash, fr } from '../kit.js';

const O = '#000000';
const R = (x, c, a, b, w = 1, h = 1) => { x.fillStyle = c; x.fillRect(Math.round(a), Math.round(b), w, h); };
const outlined = (w, h, inside, col) => pix(w, h, (i, j) => (inside(i, j) ? col(i, j) : inside(i - 1, j) || inside(i + 1, j) || inside(i, j - 1) || inside(i, j + 1) ? O : null));
const MINT = ['#ffffff', '#d8fff0', '#8cf8d0', '#3fd8a8', '#1c8f78'];

// ---------- the icicle (dropper). hang: origin where it joins the gallery beam; fall: origin at its point ----------
const ROOT = 5, BODY = 14;                       // rows of frost that bed it into the ice above, rows of icicle below the beam
const icicle = (root) => { const H = root + BODY, hwAt = (b) => (b < root ? 6 - (root - 1 - b) * 0.4 + (hash(b, 61) > 0.5 ? 0.5 : 0) : Math.max(0.4, 5.6 * Math.pow(1 - (b - root) / BODY, 0.85)));
  const ins = (i, j) => j >= 1 && j <= H && Math.abs(i - 8) <= hwAt(j - 1);
  return outlined(17, H + 2, ins, (i, j) => { const b = j - 1, d = i - 8, hw = hwAt(b);
    if (b < root) return b === 0 ? '#ffffff' : d < -hw + 2 ? '#f0faff' : hash(i, b) > 0.6 ? '#d4f2ff' : '#a9d8f4';
    if (d <= -hw + 1.2) return '#ffffff';                                   // the lit edge
    if (d >= hw - 1.2) return '#2f6fb4';                                    // the shaded edge
    if (d === 0 && b % 5 === 2) return '#ffffff';                            // a glint down the middle
    return d < 0 ? '#c9f1ff' : '#7fcdf4'; }); };
const hangC = icicle(ROOT), fallC = icicle(0);
const dropper = { hang: { c: hangC, ox: 8, oy: 1 + ROOT }, fall: { c: fallC, ox: 8, oy: fallC.height - 1 }, leap: { c: fallC, ox: 8, oy: fallC.height - 1 }, run: [{ c: fallC, ox: 8, oy: fallC.height - 1 }] };

// ---------- what is left of it: a patch of shards on the floor ----------
const shardCache = new Map();
const shardArt = (w) => { let c = shardCache.get(w); if (c) return c;
  const sp = []; for (let i = 1, k = 0; i < w - 1; k++) { const bw = 3 + (k % 2), h = [6, 9, 5, 8, 4, 7][k % 6], lean = [-1, 1, 0, 2, -2, 1][k % 6]; sp.push([i, bw, h, lean]); i += bw - 1 + (k % 2); }
  const at = (i, j) => { const up = 11 - j; if (up < 0) return 0; for (const [x0, bw, h, lean] of sp) { if (up >= h) continue; const t = up / h, cx = x0 + bw / 2 + lean * t, hw = (bw / 2) * (1 - t) + 0.35; if (Math.abs(i - 1 + 0.5 - cx) <= hw) return i - 1 + 0.5 < cx ? 1 : 2; } return 0; };
  c = outlined(w + 2, 13, (i, j) => j <= 11 && at(i, j) > 0, (i, j) => (11 - j === 0 ? '#9ad8f8' : at(i, j) === 1 ? '#ffffff' : '#7fcdf4'));
  shardCache.set(w, c); return c; };

// ---------- the hail cloud: a churning bank of grey puffs, round on every side so it can never read as a ledge ----------
const CLOUD = ['#f2f6ff', '#c2cade', '#8e98b4', '#5d6786'];
const disc = (ctx, c, cx, cy, r) => { for (let j = -r; j <= r; j++) { const w = Math.round(Math.sqrt(r * r - j * j + r * 0.8)); R(ctx, c, cx - w, cy + j, w * 2 + 1, 1); } };
const puffs = (x0, x1, y, f) => { const out = []; for (let i = x0 + 4, k = 0; i < x1 - 3; k++) { const e = Math.min(i - x0, x1 - i), r = Math.max(3, (e < 9 ? 3 : 5) + Math.floor(hash(k, 73) * 3) - (k % 3 === 1 ? 1 : 0));
    out.push([i, y - r - 1 - Math.floor(hash(k, 74) * 4) + Math.round(Math.sin(f / 11 + k * 1.7)), r, k]); i += 5 + Math.floor(hash(k, 75) * 4); } return out; };

// ---------- the slab robot. parked: a monolith of four slabs. riding: folded into a wheel of two crossed bars ----------
const SLAB = ['#f4f8ff', '#c4cede', '#98a4ba', '#6a7690', '#434d64'];
const parked = (() => { const c = cv(21, 30), x = c.getContext('2d');
  for (let k = 0; k < 4; k++) { const x0 = 1 + k * 5; R(x, O, x0 - 1, 0, 6, 30); R(x, SLAB[2], x0, 1, 4, 28); R(x, SLAB[1], x0, 1, 1, 28); R(x, SLAB[0], x0, 1, 4, 1); R(x, SLAB[4], x0 + 3, 2, 1, 27); R(x, SLAB[3], x0, 14, 4, 1); R(x, SLAB[3], x0, 22, 4, 1); }
  return c; })();
const WR = 20, WN = 16, WC = WR + 2;
const wheel = Array.from({ length: WN }, (_, k) => { const a = (k / WN) * Math.PI, ca = Math.cos(a), sa = Math.sin(a), n = WR * 2 + 5;
  const part = (i, j) => { const dx = i - WC, dy = j - WC, u = dx * ca + dy * sa, v = -dx * sa + dy * ca; return Math.abs(u) <= WR && Math.abs(v) <= 3.2 ? [0, u] : Math.abs(v) <= WR && Math.abs(u) <= 3.2 ? [1, v] : null; };
  const ins = (i, j) => !!part(i, j);
  return outlined(n, n, ins, (i, j) => { const [bar, l] = part(i, j), al = Math.abs(l);
    if (al < 3.5) return al < 1.6 ? '#ffb43a' : '#434d64';                                    // the hub, its lamp
    if (al > WR - 3) return bar ? '#8ae8ff' : '#ffb43a';                                       // the tips: amber on one bar, ice blue on the other, so you can see it turn
    if (Math.abs(al - 11) < 0.7) return SLAB[4];                                               // where two slabs join
    return !ins(i, j - 1) ? SLAB[0] : !ins(i, j + 1) ? SLAB[3] : !ins(i - 1, j) ? SLAB[1] : SLAB[2]; }); });

// ---------- a rigged slab robot (every other walker): two dark slabs scissoring along, a red eye ----------
const walker = (k) => { const c = cv(18, 28), x = c.getContext('2d');
  const slab = (x0, lift, eye) => { const y0 = 2 - lift; R(x, O, x0 - 1, y0 - 1, 8, 27); R(x, '#74829e', x0, y0, 6, 25); R(x, '#d4deee', x0, y0, 6, 1); R(x, '#aab6ca', x0, y0 + 1, 1, 24); R(x, '#2c3448', x0 + 5, y0 + 1, 1, 24); R(x, '#2c3448', x0 + 1, y0 + 12, 4, 1);
    if (eye) { R(x, O, x0, y0 + 4, 5, 4); R(x, '#ff3a2a', x0, y0 + 5, 4, 2); R(x, '#ffd0a0', x0, y0 + 5, 1, 1); R(x, '#c8922a', x0 + 1, y0 + 16, 4, 1); R(x, '#c8922a', x0 + 1, y0 + 18, 3, 1); } };
  if (k === 0) { slab(9, 0, false); slab(2, 0, true); } else if (k === 1) { slab(6, 0, false); slab(5, 2, true); } else if (k === 2) { slab(2, 0, false); slab(9, 0, true); } else { slab(5, 2, false); slab(6, 0, true); }
  return fr(c, 9, 28); };

export function iceDangers() {
  const fx = {
    // an ammonia geyser. x = centre, y = the floor line. st = { on, c, h, warn }
    vent(ctx, x, y, st, f) {
      // the crack it comes out of, always there so you can see it coming: frost heaped either side of a dark slit
      R(ctx, O, x - 9, y - 3, 6, 4); R(ctx, '#ffffff', x - 8, y - 2, 4, 2); R(ctx, O, x + 4, y - 4, 6, 5); R(ctx, '#ffffff', x + 5, y - 3, 4, 3); R(ctx, '#a9d8f4', x + 5, y - 1, 4, 1);
      R(ctx, O, x - 5, y - 1, 10, 4); R(ctx, '#0c2a30', x - 4, y, 8, 2); R(ctx, st.warn > 0 && (f >> 1) % 2 ? MINT[0] : st.on ? MINT[1] : MINT[4], x - 3, y, 6, 1);
      R(ctx, O, x - 7, y + 1, 2, 1); R(ctx, O, x + 5, y + 2, 3, 1);
      if (st.warn > 0) {                                                                     // it spits before it blows: a spurt and puffs climbing higher as it gets close
        const top = 4 + Math.round(st.warn * 12), sp = 2 + Math.round(st.warn * 5) + ((f >> 1) % 2);
        R(ctx, O, x - 2, y - sp - 1, 4, sp + 1); R(ctx, (f >> 1) % 2 ? MINT[0] : MINT[2], x - 1, y - sp, 2, sp);
        for (let k = 0; k < 5; k++) { const t = (f * 2 + k * 5) % (top + 4), px0 = x - 4 + ((k * 3 + (f >> 2)) % 8); if (t > top) continue; R(ctx, O, px0 - 1, y - 4 - t - 1, 5, 5); R(ctx, k % 2 ? MINT[1] : MINT[2], px0, y - 4 - t, 3, 3); R(ctx, MINT[0], px0, y - 4 - t, 2, 1); }
        if ((f >> 1) % 2) { R(ctx, O, x - 8, y - 2, 3, 3); R(ctx, MINT[1], x - 7, y - 1, 1, 1); R(ctx, O, x + 6, y - 2, 3, 3); R(ctx, MINT[1], x + 7, y - 1, 1, 1); }
        return;
      }
      if (!st.on) return;
      // the jet: thin where it leaves the crack, fattening and tearing as it climbs, a head of froth that falls away either side. never a straight edge
      const h = Math.round(st.h), sway = (j) => Math.round(Math.sin((j + f * 1.6) / 3.2) * Math.min(1.4, j / 9));
      const hw = (j) => (j >= h - 2 ? 2 + (h - 1 - j) : Math.min(5, 2 + Math.round((j / Math.max(8, h)) * 2.4) + ((j * 7 + f * 5) % 11 < 4 ? 1 : 0)));
      for (let j = 0; j < h; j++) R(ctx, O, x + sway(j) - hw(j) - 1, y - 1 - j - 1, hw(j) * 2 + 2, 3);
      for (let j = 0; j < h; j++) { const w = hw(j), c = x + sway(j); R(ctx, (j + f * 2) % 6 < 3 ? MINT[2] : MINT[3], c - w, y - 1 - j, w * 2, 1); R(ctx, MINT[1], c - w + 1, y - 1 - j, Math.max(1, w - 1), 1); R(ctx, MINT[0], c - 1, y - 1 - j, 1 + ((j + f) % 3 ? 1 : 0), 1);
        if ((j * 5 + f * 3) % 9 === 0 && j > 3) R(ctx, O, c + ((j + f) % 2 ? -1 : 0), y - 1 - j, 1, 1); }                                                                    // tears in the column
      for (let k = 0; k < 10; k++) { const t = (f * 2 + k * 5) % 18, dir = k % 2 ? 1 : -1, sp = 0.55 + (k % 3) * 0.3, sx = x + sway(h - 1) + dir * (2 + t * sp), sy = y - h - 3 - (k % 4) + (t * t) / 9 - t * 0.9; if (sy > y - 2) continue;
        const big = k % 3 === 0 && t < 12; R(ctx, O, sx - 1, sy - 1, big ? 4 : 3, big ? 4 : 3); R(ctx, k % 3 === 1 ? MINT[2] : MINT[1], sx, sy, big ? 2 : 1, big ? 2 : 1); if (big) R(ctx, MINT[0], sx, sy, 1, 1); }   // the head breaking up and raining back down
      for (let k = 0; k < 4; k++) { const t = (f + k * 3) % 12, dir = k % 2 ? 1 : -1; R(ctx, O, x + dir * (6 + t) - 1, y - 3 - (t >> 2), 4, 3); R(ctx, k < 2 ? MINT[1] : MINT[2], x + dir * (6 + t), y - 2 - (t >> 2), 2, 1); }                 // mist rolling out along the floor
    },
    // the bank of frozen cloud the hail breaks off: spans x0..x1, drops leave from y
    cloud(ctx, x0, x1, y, f) {
      const P = puffs(x0, x1, y, f);
      for (const [cx, cy, r] of P) disc(ctx, O, cx, cy, r + 1);
      for (const [cx, cy, r] of P) disc(ctx, CLOUD[2], cx, cy, r);
      for (const [cx, cy, r, k] of P) { disc(ctx, CLOUD[1], cx - 1, cy - 1, r - 1); if (r > 3) disc(ctx, CLOUD[0], cx - 1, cy - 2, r - 3); if (k % 2) R(ctx, CLOUD[3], cx - r + 2, cy + r - 1, r * 2 - 3, 1); }
      for (const [cx, cy, r, k] of P) { if (k % 4 !== (f >> 4) % 4) continue; R(ctx, O, cx - 1, cy + r, 4, 4); R(ctx, '#ffffff', cx, cy + r + 1, 2, 2); }                                             // hailstones forming along its belly
      for (let k = 0; k < 6; k++) { const t = (f + k * 7) % 22, gx = x1 + 6 - ((f * 3 + k * 41) % Math.max(1, x1 - x0 + 30)); R(ctx, k % 2 ? CLOUD[1] : CLOUD[2], gx, y - 14 + (k * 5) % 13, 4 + (t % 3), 1); }       // the wind tearing streaks off it
    },
    // a lump of hail, its point at x, y. it hurts over 4 x 4 px
    drop(ctx, x, y, f, d) {
      const t = (f >> 2) % 2, lean = d.vx < 0 ? 1 : d.vx > 0 ? -1 : 0;
      for (let k = 1; k <= 3; k++) R(ctx, k === 1 ? '#bfe8ff' : '#5a94c4', x + lean * k * 2, y - 7 - k * 4, 1, 3);      // the streak it leaves
      const rim = d.hot && (f >> 1) % 2 ? '#ff3a2a' : O;
      R(ctx, rim, x - 3, y - 7, 6, 7); R(ctx, rim, x - 2, y - 8 + t, 4, 9 - t); R(ctx, rim, x - 1, y - 1, 2, 2);
      R(ctx, '#7fcdf4', x - 2, y - 6, 4, 5); R(ctx, '#ffffff', x - 2, y - 6, 2, 3); R(ctx, '#c9f1ff', x - 1, y - 7 + t, 2, 1); R(ctx, '#2f6fb4', x + 1, y - 3, 1, 2); R(ctx, '#c9f1ff', x - 1, y - 1, 1, 1);
    },
    // where the one aimed at you will land: a red target on the snow, closing in
    mark(ctx, x, y, f, k) {
      const w = 10 - Math.round(k * 6), on = (f >> 2) % 2 || k > 0.7, c = on ? '#ff3a2a' : '#a02418';
      R(ctx, O, x - w - 3, y - 3, 6, 5); R(ctx, O, x + w - 2, y - 3, 6, 5);                                                   // two red corner brackets closing on the spot
      R(ctx, c, x - w - 2, y - 2, 4, 3); R(ctx, O, x - w, y - 2, 2, 2); R(ctx, c, x + w - 1, y - 2, 4, 3); R(ctx, O, x + w - 1, y - 2, 2, 2);
      if (on) { R(ctx, O, x - 2, y - 2, 5, 4); R(ctx, '#ff3a2a', x - 1, y - 1, 3, 2); R(ctx, '#ffd0a0', x, y - 1, 1, 1); }
    },
    // the patch of shards an icicle leaves: x = its left edge, y = the floor line, w px wide
    shard(ctx, x, y, w, f) { const c = shardArt(w); ctx.drawImage(c, x - 1, y - 12); const g = (f >> 3) % (w - 2); if ((f >> 1) % 4 === 0) R(ctx, '#ffffff', x + 1 + g, y - 5 - (g % 4), 1, 2); },
    // the slab robot, parked and waiting: a monolith with a lit panel, one slab swung out and waving you over
    ride(ctx, x, y, f) {
      const b = Math.round(Math.sin(f / 7) * 2), wv = (f >> 3) % 4;
      for (let k = 0; k < 8; k++) { const a = f / 14 + k * 0.785; R(ctx, k % 2 ? '#ffb43a' : '#fff0b0', x + Math.cos(a) * 17, y - 15 + Math.sin(a) * 19, 1, 1); }       // it beckons
      ctx.drawImage(parked, x - 10, y - 30);
      R(ctx, O, x - 5, y - 26, 5, 7); R(ctx, '#0c1220', x - 4, y - 25, 3, 5); for (let j = 0; j < 3; j++) R(ctx, (j + (f >> 3)) % 3 ? '#ffb43a' : '#fff0b0', x - 4, y - 25 + j * 2, 1 + ((j + (f >> 4)) % 3), 1);   // its read-out
      const ax = x + 11, ay = y - 22;                                                                                                                              // the arm: the outer slab's top section, hinged out
      const tip = [[4, -7], [6, -5], [7, -2], [6, -5]][wv];
      for (let s = 0; s <= 6; s++) { const px0 = ax + (tip[0] * s) / 6, py0 = ay + (tip[1] * s) / 6; R(ctx, O, px0 - 1, py0 - 1, 4, 4); }
      for (let s = 0; s <= 6; s++) { const px0 = ax + (tip[0] * s) / 6, py0 = ay + (tip[1] * s) / 6; R(ctx, s === 6 ? '#ffb43a' : SLAB[1], px0, py0, 2, 2); }
      R(ctx, O, x - 4, y - 43 + b, 9, 4); R(ctx, O, x - 2, y - 39 + b, 5, 2); R(ctx, O, x - 1, y - 37 + b, 3, 2);                                                   // an arrow over it
      R(ctx, '#ffb43a', x - 3, y - 42 + b, 7, 2); R(ctx, '#fff0b0', x - 3, y - 42 + b, 7, 1); R(ctx, '#ffb43a', x - 1, y - 40 + b, 3, 2); R(ctx, '#ffb43a', x, y - 38 + b, 1, 2);
    },
    // the hero on it: the slabs fold into a wheel and it cartwheels along, him in the hub
    riding(ctx, x, y, f, s, hero) {
      const k = Math.floor(f * 0.75) % WN, c = wheel[k], bounce = s.onGround && (f >> 1) % 4 === 0 ? 1 : 0;
      ctx.drawImage(c, x + 1 - WC, y - WR - 1 - WC + bounce);
      ctx.drawImage(hero.c, Math.round(x - hero.ox), Math.round(y - 11 - hero.oy + bounce));
      R(ctx, O, x - 2, y - WR - 4 + bounce, 6, 6); R(ctx, '#434d64', x - 1, y - WR - 3 + bounce, 4, 4); R(ctx, (f >> 2) % 2 ? '#ffb43a' : '#fff0b0', x, y - WR - 2 + bounce, 2, 2);     // the hub clamps over his belt
      if (s.onGround) for (let j = 0; j < 5; j++) { const t = (f * 2 + j * 5) % 12; R(ctx, O, x - 6 - t * 2 - 1, y - 2 - ((t * (11 - t)) >> 3), 3, 3); R(ctx, j % 2 ? '#ffffff' : '#bfe8ff', x - 6 - t * 2, y - 1 - ((t * (11 - t)) >> 3), 1, 1); }   // ice flying off behind
      const a0 = (k / WN) * Math.PI; for (let q = 0; q < 4; q++) for (let j = 1; j <= 4; j++) { const a = a0 + q * Math.PI / 2 - j * 0.16; R(ctx, j < 3 ? (q % 2 ? '#8ae8ff' : '#ffb43a') : '#6a7690', x + 1 + Math.cos(a) * (WR + 1), y - WR - 1 + bounce + Math.sin(a) * (WR + 1), 1, 1); }                                                    // a blur round the rim
    },
    // the heat shield: a warm bubble round the hero
    shield(ctx, x, y, f) {
      const cy = y - 21, rx = 14, ry = 22, N = 112;
      ctx.globalCompositeOperation = 'lighter'; for (let j = -ry + 1; j < ry; j++) { const w = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry))); R(ctx, '#3a1c04', x - w, cy + j, w * 2, 1); } ctx.globalCompositeOperation = 'source-over';      // warm air inside
      for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2; R(ctx, O, Math.round(x + Math.cos(a) * (rx + 1)), Math.round(cy + Math.sin(a) * (ry + 1)), 1, 1); }
      for (let i = 0; i < N; i++) { const a = (i / N) * Math.PI * 2, t = (i + (f >> 1)) % N; R(ctx, t < 10 ? '#ffffff' : t < 26 ? '#fff0b0' : (i + (f >> 3)) % 3 ? '#ffb43a' : '#e07a1c', Math.round(x + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1); }
      R(ctx, '#fff0b0', x - 8, cy - 9, 1, 4); R(ctx, '#fff0b0', x - 7, cy - 11, 1, 2);                                                                                                       // the shine on the glass
      for (let k = 0; k < 3; k++) { const t = (f + k * 9) % 27; R(ctx, k ? '#ffb43a' : '#fff0b0', x - 6 + k * 6 + ((t >> 3) % 2), cy - ry - 2 - (t >> 1), 1, 1); }                              // heat coming off the top
    },
  };
  return {
    fx,
    chr: { dropper, gruntAlt: [0, 1, 2, 3].map(walker) },
    labels: { ride: 'CARTWHEEL!', shield: 'HEAT SHIELD!' },
    // 42% of what turns up is the planet's own: geysers, hail, icicles. the robot is parked somewhere in 2 plays out of 3
    danger: { spawn: { vent: 11, rain: 11, dropper: 13, floe: 13 }, rain: { vx: -260, every: 5, gap: 66 }, dropper: { to: 'puddle', h: BODY }, ride: { fly: false, chance: 65 }, box: { shield: 10 } },
  };
}
