// Black Hole Friday boss: THE GREAT WORM (Deep Desert). One screen, one button: hold to walk across open sand to the rock.
// Two things press on you: a storm on a countdown, and the worm. Wormsign (a shaking mound, static, a flashing strip) marks where it
// will come up, a second or more before it does. The one rule: do not be on a strip when it goes off.
//   AHEAD   a strip just in front of him           -> let go at once, wait for it to sink
//   UNDER   a strip under his feet                  -> keep walking, get off it
//   TRAVEL  a ridge races in to a strip under him   -> keep walking (standing still is wrong)
//   FEINT   a strip ahead that slumps and dies; the real one is then under him   -> wait, then walk
//   CHASE   AHEAD, and as that sinks a strip under him                            -> wait, then walk the moment it has sunk
//   ARC     a strip under him and one further on: it leaps out of the far one, over him, into the near one -> walk into the gap, stop
// Soft sand (pale hollows) halves his walk. Every warning is timed from how long the walk really takes, plus a reaction budget.
// When the clock reaches zero the storm arrives once, for good: a jacket every 150 ticks until he is on the rock.
// Deterministic: every random number is drawn from st.rnd() in init; update uses only st counters and + - * / (dsin for the far ridge).
import { pix, dith, hash, tint, frames, TAU, drawText, GRAD, noise, fr } from '../kit.js';
import { BW, BH, FL, hurt, win, bar, dsin } from '../bosskit.js';

const rc = (x) => (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
// a row of dunes across w px (it tiles): lit crests, the lee side in shadow
function dunes(x, w, yBase, amp, k1, k2, ph, body, shade, crest, bottom) {
  const top = [];
  for (let i = 0; i < w; i++) {
    const a = i / w, s1 = 1 - Math.abs(Math.sin(Math.PI * k1 * a + ph)), s2 = 0.5 + 0.5 * Math.sin(TAU * k2 * a + ph * 3);
    top.push(Math.round(yBase - amp * (Math.pow(s1, 1.5) * 0.75 + s2 * 0.25)));
  }
  for (let i = 0; i < w; i++) {
    const y = top[i], lee = top[(i + w - 3) % w] < y;
    for (let j = y; j < bottom; j++) {
      const d = j - y;
      x.fillStyle = d === 0 ? (lee ? body : crest) : lee && dith([1, 0], d / 12, i, j) ? shade : dith([body, shade], (d - 6) / 30, i, j);
      x.fillRect(i, j, 1, 1);
    }
  }
  return top;
}


export function makeWormBoss(D, HF = null) {                           // HF = the hero's frames ({ run[8], jump, fall }): with them he sinks in soft sand and leans in the storm
  const X0 = 16, ROCK = 280, ZONE = 24;                                 // ZONE = half the width of what comes up
  const REACH = ZONE + 8;                                               // closer to its middle than this when it comes up (or while it stands) and it has him
  const EDGE = ROCK - REACH - 4;                                        // nothing comes up nearer the rock than this
  const V = 0.3, VSOFT = 0.15;                                        // his walk, px a tick: on firm sand, in soft sand
  const THROW = 1.6, SINK = 4, HOT = 20;                                // HOT: ticks after it starts to sink that it can still catch him
  const FLY = 24, GAPW = 26, TRV = 0.8;                                 // the arc: ticks from one end to the other, the safe gap between its two strips; the travelling ridge's speed
  const BUD = [[17, 26], [16, 24], [16, 22], [15, 21]];                 // reaction budget in ticks (by lap): what is left over once the walk itself is paid for
  const CLOCK = [37, 35, 34, 33];                                       // seconds before the storm arrives (by lap)
  const SJ = 150;                                                       // in the storm: ticks between jackets
  // a pink worm: fleshy magenta hide, darker rings, a lilac-to-mint sheen where the light catches it
  const WP = ['#1e0816', '#4a1238', '#7a1e5a', '#b2367e', '#e05aa2', '#ff8ac4', '#ffc4e2'];
  const SHEEN = ['#ffc4e2', '#e6c2ff', '#c6f0ff'];
  // one ring of the body (the rings overlap, so each shows a lit lip, ridges, a shadowed underside)
  const SEG = pix(48, 9, (i, j) => {
    const u = (i - 23.5) / 24, edge = j > 5 ? 0.95 : 1; if (Math.abs(u) > edge) return null;
    if (Math.abs(u) > edge - 0.06 || j === 8) return WP[0];
    let l = Math.cos((u + 0.3) * 1.35) * 0.82 + (j === 3 ? 0.24 : j < 3 ? 0.05 : j > 5 ? -0.3 : 0) + (hash(i, j) - 0.5) * 0.14;
    if (j >= 4 && j <= 5 && i % 6 === 2) l -= 0.32;
    if (j >= 6) l -= 0.12;                                                 // the dark band between rings
    if (j <= 3 && l > 0.86) return dith(SHEEN, (u + 0.6) * 0.9 + (j === 3 ? 0.2 : 0), i, j);   // the sheen shifts colour across the ring
    return dith(WP.slice(1), l, i, j);
  });
  // the mouth, face on: it splits three ways. Three fleshy jaws, hooked teeth along every split, glowing feelers reaching out of a lit throat
  const MAW = frames(6, (p) => pix(58, 58, (i, j) => {
    const u = (i - 28.5) / 28, v = (j - 28.5) / 28, d = Math.hypot(u, v), a = Math.atan2(v, u); if (d > 1) return null;
    const open = 0.5 + 0.5 * Math.sin((p / 6) * TAU), gw = 0.1 + 0.08 * open, core = 0.15 + 0.05 * open;
    let da = 9, ak = 0; for (let k = 0; k < 3; k++) { const c = -Math.PI / 2 + Math.PI / 3 + k * (TAU / 3), w = Math.abs(((a - c) % TAU + TAU * 1.5) % TAU - Math.PI); if (w < da) { da = w; ak = k; } }   // nearest split
    const sd = Math.sin(da) * d, along = Math.cos(da) * d;               // distance from the split's centre line, and how far out along it
    const gwd = gw * (0.45 + 0.9 * d), inSplit = sd < gwd && along > 0;
    if (inSplit && d > 0.9) return null;                                  // the splits notch the rim
    if (inSplit || d < core) {                                            // the throat, and what reaches out of it
      const wig = 0.035 * Math.sin(along * 13 - p * 1.05 + ak * 2), fl = 0.62 + 0.12 * Math.sin(p * 1.05 + ak * 1.7);
      const sgn = Math.sin(a - (-Math.PI / 2 + Math.PI / 3 + ak * (TAU / 3)));
      const e2 = gwd - sd;                                                // hooked teeth on both lips, sticking out into the split and raked back toward the throat
      if (inSplit && e2 < 0.1 && along > core + 0.04 && along < 0.86) { const ph = (along * 6 + e2 * 8 + 100) % 1; if (ph < 0.5 * (1 - e2 / 0.1)) return e2 < 0.03 ? '#f2dcb0' : '#fffbe8'; }
      const fd = Math.abs(sd * Math.sign(sgn || 1) - wig), fw = 0.045 + 0.03 * (1 - along / fl);
      if (inSplit && along < fl && fd < fw + 0.035) return fd < fw ? (along > fl - 0.1 ? '#ffffff' : along > fl - 0.2 ? '#e8ffb0' : '#a6ff5a') : '#05140a';   // a feeler, outlined
      if (d < core * 0.6) return dith(['#f6ffd2', '#a6ff5a'], d / (core * 0.6), i, j);
      return dith(['#3a9a3a', '#143826', '#0a1a10', '#06080a'], (d - core * 0.5) / 0.35, i, j);
    }
    const edge = sd - gw * (0.55 + 0.6 * d);                              // flesh: how far from the split's lip
    if (d > 0.93 || edge < 0.03) return WP[0];
    const ring = d > 0.74 && d < 0.8;                                     // a darker ring round the jaws
    if (ring) return dith([WP[1], WP[2]], 0.5 - 0.4 * v, i, j);
    let l = 0.62 - 0.36 * (u * 0.45 + v * 0.8) + (d > 0.84 ? 0.1 : 0) - (edge < 0.16 ? 0.2 : 0) + (hash(i, j) - 0.5) * 0.1;
    if (d > 0.84 && l > 0.85) return dith(SHEEN, 0.3 + u * 0.6, i, j);
    return dith(WP.slice(1), l, i, j);
  }));
  const far = (c) => tint(fr(c), '#4a2840', 0.42).c, SEGF = far(SEG), MAWF = MAW.map(far);
  const PUFF = frames(3, (p) => pix(34, 22, (i, j) => {
    const u = (i - 17) / 17, v = (j - 13) / 10; let d = 0;
    for (const [bx, by, br] of [[-0.45, 0.2, 0.5], [0, -0.15, 0.62], [0.45, 0.15, 0.5], [0.1, 0.35, 0.6]]) d = Math.max(d, 1 - Math.hypot(u - bx, v - by) / br);
    if (d <= 0 || !dith([0, 1], d * 1.5 + 0.1, i + Math.floor(p * 9), j)) return null;
    return dith(['#7a5248', '#a87860', '#d0a080'], 0.5 - v * 0.5 + d * 0.3, i, j);
  }));

  // the stage: open dunes at dusk, the rock on the right
  const SK = ['#0b0920', '#130d2e', '#22123e', '#3c164a', '#6a2249', '#a83e3c', '#e07a36', '#f4ac54', '#f8c870'];
  const BS = pix(BW, BH, (i, j) => (j < 108 ? dith(SK, j / 108, i, j) : '#3e2438'));
  {
    const b = BS.getContext('2d'), r = rc(b), n = noise(9);
    for (let k = 0; k < 50; k++) { const sx = Math.floor(n() * 320), sy = Math.floor(n() * 46), v = n(); r(v > 0.8 ? '#f0e8ff' : v > 0.4 ? '#a89ad0' : '#6a5c98', sx, sy, 1, 1); }
    for (let k = 0; k < 4; k++) { const cx = Math.floor(n() * 240), cy = 50 + k * 9, w = 60 + Math.floor(n() * 70); for (let i = 0; i < w; i++) { const e = Math.min(i, w - i) / w; if (e * 6 > hash(i >> 1, k) * 1.2) { r('#5a2050', cx + i, cy, 1, 1); if (e > 0.2) r('#d0603a', cx + i, cy + 1, 1, 1); } } }
    b.drawImage(D.moonA, 190, 22); b.drawImage(D.moonB, 234, 44);
    for (const [mx, mw, mh] of [[14, 56, 13], [92, 24, 19], [146, 74, 9], [232, 26, 15]]) for (let i = 0; i < mw; i++) { const e = Math.min(i, mw - 1 - i), h = Math.round(Math.min(mh, 3 + e * 2)); r(i < mw * 0.3 ? '#52284a' : '#3e2040', mx + i, 104 - h, 1, h + 6); r(3 + e * 2 >= mh ? '#c8603e' : '#7a3448', mx + i, 104 - h, 1, 1); }
    dunes(b, 320, 107, 7, 4, 3, 0.4, '#8a4a50', '#6a3848', '#f0a060', 180);
    dunes(b, 320, 117, 9, 3, 2, 1.3, '#703c4a', '#562e44', '#d88456', 180);
    dunes(b, 320, 131, 11, 2, 3, 2.2, '#5a3044', '#44263c', '#b86a4c', 180);
    dunes(b, 320, 149, 10, 2, 1, 0.9, '#4a2840', '#381e34', '#985646', 180);
    for (let j = FL; j < BH; j++) for (let i = 0; i < BW; i++) {       // the sand he walks on: a bright crest, wind ripples
      const rip = Math.sin((i + (j - FL) * 2.5) * TAU / 26) + Math.sin(i * TAU / 107) * 0.5;
      r(j === FL ? '#f4d49a' : j === FL + 1 ? ((i * 5) % 7 < 2 ? '#f4d49a' : '#d8a070') : rip > 0.95 ? '#d8a070' : rip < -0.95 ? '#6a4038' : dith(['#b47a54', '#8c5a44', '#6a4038'], (j - FL - 2) / 18, i, j), i, j, 1, 1);
    }
    const prof = [[250, 158], [258, 150], [264, 134], [270, 126], [275, 96], [281, 88], [286, 68], [294, 72], [300, 54], [308, 60], [314, 46], [320, 50]];
    const rt = (i) => { let k = 0; while (k < prof.length - 2 && prof[k + 1][0] <= i) k++; const [x0, y0] = prof[k], [x1, y1] = prof[k + 1]; return Math.round(y0 + (y1 - y0) * Math.max(0, Math.min(1, (i - x0) / (x1 - x0))) + hash(i >> 1, 5) * 3); };
    for (let i = 250; i < 320; i++) {                                 // the outcrop, rim-lit on the side that faces the last light
      const t = rt(i), lit = rt(i + 2) < t - 1;
      for (let j = t; j < FL; j++) r((j + Math.round(Math.sin(i / 9) * 2)) % 8 === 0 ? '#1c0e1e' : j - t < 2 && lit ? (j === t ? '#c8684a' : '#7a3c40') : hash(i >> 1, j >> 1) > 0.85 ? '#34192e' : '#2a1628', i, j, 1, 1);
      if (!lit) r('#4a2838', i, t, 1, 1);
    }
    for (let i = 244; i < 264; i++) { const h = Math.round((i - 244) * 0.45); r('#b47a54', i, FL - h, 1, h); r('#f4d49a', i, FL - h, 1, 1); }                // sand drifted against it
    for (let j = FL; j < BH; j++) { const x0 = 262 - Math.round((j - FL) * 0.4); for (let i = x0; i < BW; i++) r(j === FL ? '#e4d4ec' : j === FL + 1 ? '#a894b8' : (j - FL) % 6 === 2 ? '#1c1226' : i === x0 ? '#8a76a0' : dith(['#5e4a6c', '#463652', '#2e2238'], (j - FL - 2) / 18, i, j), i, j, 1, 1); }
    for (let i = 270; i < 318; i += 11) r('#1c1226', i + ((i * 3) % 5), FL + 3, 1, 5);
    r('#120812', 308, 124, 1, 36); r('#120812', 304, 124, 5, 1); r('#120812', 304, 125, 1, 3); r('#000', 302, 128, 5, 7); r('#ffd27a', 303, 129, 3, 5); r('#fff6d0', 304, 130, 1, 2);   // a lantern marks the way
  }

  const ease = (u) => Math.sin(Math.max(0, Math.min(1, u)) * Math.PI / 2);
  // the worm, risen: a ringed column out of the sand, leaning, the mouth open on top
  function wormUp(ctx, cx, rise, lean, w, f, SG = SEG, MW = MAW) {
    if (rise < 3) return;
    ctx.save(); ctx.beginPath(); ctx.rect(0, -40, BW, FL + 42); ctx.clip();
    const k = w / 48, step = 6 * k, n = Math.ceil(rise / step), pts = [];
    for (let q = 0; q <= n; q++) { const s = Math.min(rise, q * step), u = s / Math.max(70, rise); pts.push([cx + lean * u * u + Math.sin(f / 11 + s / 26) * 2.5 * u, FL + 5 - s]); }
    let hx = cx, hy = FL, ha = 0;
    for (let q = 0; q < pts.length; q++) {
      const [x, y] = pts[q], [x1, y1] = pts[Math.max(0, q - 1)], [x2, y2] = pts[Math.min(pts.length - 1, q + 1)];
      const a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2, sw = Math.round(w * (1 + 0.05 * Math.max(0, 3 - (pts.length - 1 - q)))), sh = Math.round(9 * k);
      ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(a); ctx.drawImage(SG, -(sw >> 1), -(sh >> 1), sw, sh); ctx.restore();
      hx = x; hy = y; ha = a;
    }
    const mw = Math.round(w * 1.26), mh = Math.round(mw * 0.82);
    ctx.save(); ctx.translate(Math.round(hx), Math.round(hy)); ctx.rotate(ha * 0.85); ctx.drawImage(MW[(f >> 2) % MW.length], -(mw >> 1), -Math.round(mh * 0.66), mw, mh); ctx.restore();
    for (let q = 0; q < 14; q++) {                                    // sand pouring off it
      const side = hash(q, 9) - 0.5, s = (f * (2 + hash(q, 3) * 2) + q * 31) % Math.max(24, rise), y = FL - rise + s, u = (rise - s) / Math.max(70, rise), x = cx + lean * u * u + side * w * 1.05, len = 5 + hash(q, 4) * 9;
      ctx.fillStyle = q % 3 ? '#ecc890' : '#c89a68';
      for (let e = 0; e < len; e++) if ((e + f + q) % 3 && y + e < FL + 2) ctx.fillRect(Math.round(x), Math.round(y + e), 1 + (q % 4 === 0 ? 1 : 0), 1);
    }
    ctx.restore();
  }
  // sand heaped up where something comes through it (drawn in front, it hides the join)
  function mound(ctx, cx, w, hgt) {
    cx = Math.round(cx);
    for (let i = -w; i <= w; i++) {
      const hh = Math.round(hgt * Math.pow(1 - (i / w) * (i / w), 1.4) + hash(i, 7) * 1.6); if (hh <= 0) continue;
      ctx.fillStyle = i < 0 ? '#c08a5e' : '#8c5a44'; ctx.fillRect(cx + i, FL - hh + 1, 1, hh + 2); ctx.fillStyle = '#f4d49a'; ctx.fillRect(cx + i, FL - hh, 1, 1); ctx.fillStyle = '#1a0e14'; ctx.fillRect(cx + i, FL - hh - 1, 1, 1);
    }
  }
  function dust(ctx, cx, y, spread, t, f, a = 0.8) {
    for (let q = 0; q < 6; q++) {
      const d = (q - 2.5) / 2.5, x = cx + d * spread * (0.5 + t * 0.7), yy = y - 10 - t * 16 * (1 - Math.abs(d) * 0.5) + Math.sin(f / 9 + q) * 2, pf = PUFF[(q + (f >> 3)) % 3];
      ctx.globalAlpha = Math.max(0, a * (1 - t * 0.8)); ctx.drawImage(pf, Math.round(x - 17), Math.round(yy - 11));
    }
    ctx.globalAlpha = 1;
  }
  // the worm under the sand: a travelling ridge, a wake of furrows behind it, sand kicked off the bow
  function ridge(ctx, x, y, w, hgt, dir, f, near) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w);
    for (let k = 1; k < 10; k++) { ctx.globalAlpha = 1 - k / 10; ctx.fillStyle = near ? '#f4d49a' : '#d88456'; ctx.fillRect(x - dir * (w + k * 7) - 2, y - 1 + (k % 2), 5, 1); ctx.fillStyle = '#2e1828'; ctx.fillRect(x - dir * (w + k * 7) - 2, y + (k % 2), 5, 1); }
    ctx.globalAlpha = 1;
    for (let i = -w; i <= w; i++) {
      const hh = Math.round(hgt * Math.pow(1 - (i / w) * (i / w), 1.3) + ((i + (f >> 2)) % 5 === 0 ? 1 : 0)); if (hh <= 0) continue;
      ctx.fillStyle = near ? (i < 0 ? '#c08a5e' : '#8c5a44') : (i < 0 ? '#9a5a52' : '#5a3044'); ctx.fillRect(x + i, y - hh, 1, hh + 1);
      ctx.fillStyle = near ? '#f4d49a' : '#e89860'; ctx.fillRect(x + i, y - hh, 1, 1);
      if (near) { ctx.fillStyle = '#1a0e14'; ctx.fillRect(x + i, y - hh - 1, 1, 1); }
    }
    ctx.fillStyle = '#f4d49a';
    for (let k = 0; k < 5; k++) { const a = ((f * 3 + k * 7) % 18) / 18; ctx.fillRect(Math.round(x + dir * (w - 5 + a * 9)), Math.round(y - hgt * (0.4 + a) + a * a * 9 - 2), 1, 1); }
  }
  // the scripted fly-by: it arcs out of the far dunes and dives back in
  function flyby(ctx, t, f) {
    const s = (t - 8) / 88; if (s < -0.02 || s > 1.62) return;
    const path = (u) => [262 - 112 * u, 146 - 84 * Math.sin(Math.PI * u)];
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, BW, 141); ctx.clip();
    for (let q = 36; q >= 0; q--) {
      const u = s - q * 0.016; if (u < -0.03 || u > 1.03) continue;
      const [x, y] = path(u), [x2, y2] = path(u + 0.01), a = Math.atan2(y2 - y, x2 - x) + Math.PI / 2, w = Math.round(28 * Math.min(1, (40 - q) / 12));
      ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(a);
      if (q === 0) ctx.drawImage(MAWF[(f >> 2) % 6], -17, -9, 34, 15); else ctx.drawImage(SEGF, -(w >> 1), -3, w, 6);
      ctx.restore();
    }
    ctx.restore();
    if (s > 0 && s < 0.9) { dust(ctx, 260, 144, 22, Math.min(1, s * 1.1), f, 0.7); mound(ctx, 260, 16, 3); }
    if (s > 0.8 && s < 1.62) { dust(ctx, 150, 144, 22, Math.min(1, (s - 0.8) * 1.2), f, 0.7); }
  }

  // the worm in a long leap: out of the sand at ax, over him, into the sand at bx. s = how far the head has got (0..1), tail = the same for its tail
  const arcAt = (ax, bx, u) => { const cx = (ax + bx) / 2, hw = (ax - bx) / 2, th = Math.PI * u; return [cx + hw * Math.cos(th), FL + 8 - 96 * Math.sin(th)]; };
  function arcWorm(ctx, ax, bx, s, tail, f) {
    ctx.save(); ctx.beginPath(); ctx.rect(0, -40, BW, FL + 42); ctx.clip();
    const u0 = Math.max(0, tail), u1 = Math.min(1, s), du = 0.03;
    for (let u = u0; u <= u1 + 0.0001; u += du) {
      const [x, y] = arcAt(ax, bx, u), [x2, y2] = arcAt(ax, bx, u + 0.01), a = Math.atan2(y2 - y, x2 - x) + Math.PI / 2;
      const wob = Math.sin(f / 9 + u * 9) * 1.2, wd = Math.round(42 * Math.min(1, 0.55 + (u - tail) * 3));
      ctx.save(); ctx.translate(Math.round(x + wob), Math.round(y)); ctx.rotate(a); ctx.drawImage(SEG, -(wd >> 1), -4, wd, 9); ctx.restore();
    }
    if (s <= 1.04 && s > 0.02) {
      const [x, y] = arcAt(ax, bx, u1), [x2, y2] = arcAt(ax, bx, u1 + 0.01), a = Math.atan2(y2 - y, x2 - x) + Math.PI / 2;
      ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(a); ctx.drawImage(MAW[(f >> 2) % MAW.length], -27, -15, 54, 28); ctx.restore();
    }
    for (let q = 0; q < 16; q++) {                                    // sand pouring off its back
      const u = u0 + (u1 - u0) * hash(q, 21); if (u1 - u0 < 0.05) break;
      const [x, y] = arcAt(ax, bx, u), s2 = (f * (2 + hash(q, 3) * 2) + q * 17) % 60, len = 4 + hash(q, 4) * 7;
      ctx.fillStyle = q % 3 ? '#ecc890' : '#c89a68';
      for (let e = 0; e < len; e++) if ((e + f + q) % 3 && y + 12 + s2 + e < FL + 2) ctx.fillRect(Math.round(x + (hash(q, 9) - 0.5) * 34), Math.round(y + 12 + s2 + e), 1, 1);
    }
    ctx.restore();
  }
  // the warning on the sand: a flashing strip (stand clear of it), posts at its ends, rings, static. hollow = it is not there yet (the ridge is still running in)
  function strip(ctx, x, u, f, hollow) {
    const r = rc(ctx), fast = u > 0.66 ? 1 : u > 0.33 ? 2 : 3, on = (f >> fast) % 2, SW = REACH - 5, col = on ? '#ff3a2a' : '#ffd21a';
    r('#000', x - SW - 1, FL + 1, SW * 2 + 2, 5);
    if (hollow) { for (let i = -SW; i < SW; i += 6) { const k = ((i + SW) / 6 + (f >> 2)) % 3; r(k < 1 ? col : '#5a1a14', x + i + 1, FL + 2, 4, 3); r('#000', x + i + 3, FL + 3, 2, 1); } }
    else for (let i = -SW; i < SW; i += 4) { r(col, x + i, FL + 2, 4, 3); r((i / 4) % 2 ? '#000' : col, x + i + 1, FL + 3, 2, 1); }
    for (const d of [-1, 1]) { r('#000', x + d * SW - 1, FL - 7, 3, 9); r(col, x + d * SW, FL - 6, 1, 7); }
    if (hollow) return;
    for (let q = 0; q < 3; q++) { const rr = 10 + q * 7 + ((f >> 1) % 4); ctx.globalAlpha = 1 - q / 3.5; ctx.fillStyle = u > 0.5 ? '#ff5a3a' : '#ffb04a'; for (let a = -2.6; a < -0.5; a += 0.14) ctx.fillRect(Math.round(x + Math.cos(a) * rr * 1.5), Math.round(FL + Math.sin(a) * rr), 1, 1); }
    ctx.globalAlpha = 1;
    if (hash(f >> 1, 4) > 0.5) { const lx = x + Math.round((hash(f >> 1, 5) - 0.5) * ZONE * 1.6); ctx.fillStyle = '#c8f0ff'; for (let q = 0; q < 6; q++) ctx.fillRect(lx + ((q * 5) % 3) - 1, FL - 4 - q * 2 - Math.round(u * 8), 1, 2); }   // static off the sand
  }
  // soft sand: a pale, pitted hollow in the floor (it halves his walk). Built once per patch, the first time it is drawn.
  const softCache = new Map();
  function softSand(ctx, x0, x1, f) {
    const key = x0 + ':' + x1; let c = softCache.get(key);
    if (!c) {
      const w = x1 - x0, dipAt = (i) => Math.round(3.2 * Math.sin(Math.PI * (i + 0.5) / w));
      c = pix(w, BH - FL, (i, j) => {                                 // a bowl of fine pale sand, seen in section: sagging top, ripples that follow the sag, sides that close in
        const e = Math.min(i, w - 1 - i), dip = dipAt(i), d = j - dip, side = Math.max(0, (j - 5) * 0.55);
        if (j < dip) return '#4a2a3a';                                // the hollow where the crest has sunk
        if (e < side - 1) return null;                                // outside the bowl: the ordinary floor shows
        if (e < side || j === BH - FL - 1) return '#3a2030';           // its dark rim
        if (d === 0) return '#fff6dc';
        if (d === 1) return (i % 3) ? '#fff0c8' : '#e8c698';
        if (d % 4 === 3 && (i + (d >> 2) * 3) % 7 < 5) return '#b08058';   // ripples
        const v = hash(x0 + i, j);
        return v > 0.86 ? '#fff6dc' : v < 0.1 ? '#c8a070' : (i + j) % 2 ? '#f0d8a8' : '#e4c690';
      });
      softCache.set(key, c);
    }
    ctx.drawImage(c, x0, FL);
    ctx.fillStyle = '#fff6dc';                                        // grains trickling down into it
    for (let q = 0; q < 5; q++) { const gx = x0 + 3 + Math.floor(hash(q, x0) * (x1 - x0 - 6)), gy = ((f >> 2) + q * 5) % 14; ctx.fillRect(gx, FL + 4 + gy, 1, 2); }
  }
  // the storm, once it has arrived: a wall of sand rolls in from the left (2 s), then the whole screen is in it. Returns how far across it has got.
  const stormEdge = (st) => { const k = Math.min(1, st.storm / 120); return Math.round(-40 + 420 * k * (2 - k)); };
  function stormFront(ctx, st, f) {
    const s = st.storm, wd = st.wind, E = stormEdge(st), r = rc(ctx), calm = st.won ? Math.max(0.4, 1 - st.wt / 70) : 1, full = s >= 120;
    const bil = (j) => (full ? 400 : E + Math.sin(j / 13 + wd / 9) * 9 + Math.sin(j / 5 - wd / 6) * 4 + (j / BH) * 26);
    for (let j = 0; j < BH; j += 3) {                                  // the murk
      const ex = Math.min(BW, Math.round(bil(j))); if (ex <= 0) continue;
      ctx.globalAlpha = (0.6 + 0.1 * Math.sin(j / 17 + wd / 31)) * calm; r(dith(['#5e3e40', '#6e4a44', '#7c5648'], j / BH + Math.sin(wd / 40 + j / 30) * 0.15, j, wd >> 4), 0, j, ex, 3);
    }
    ctx.globalAlpha = 1;
    if (!full) for (let j = -8; j < BH + 8; j += 11) {                 // its rolling face: boiling cloud heads, dark underneath, lit on top
      const ex = Math.round(bil(j)), pf = PUFF[((j / 11 + (wd >> 3)) % 3 + 3) % 3 | 0];
      ctx.globalAlpha = 0.95; ctx.drawImage(pf, ex - 44, j - 16, 68, 44); ctx.drawImage(pf, ex - 70, j - 6, 68, 44);
    }
    ctx.globalAlpha = 1;
    if (full) for (let q = 0; q < 7; q++) {                            // great rolls of dust tearing across
      const x = ((wd * (2.4 + q * 0.4) + q * 97) % (BW + 150)) - 120, y = -10 + ((q * 47) % 150);
      ctx.globalAlpha = 0.3 * calm; ctx.drawImage(PUFF[q % 3], Math.round(x), y, 112, 72);
    }
    ctx.globalAlpha = 1;
    const gust = !st.won && st.sj > 0 && st.sj < 40 ? 1 - st.sj / 40 : 0, n = Math.round((96 + gust * 60) * calm);
    for (let q = 0; q < n; q++) {                                     // sand driven flat across the screen
      const sp = 6 + (q % 5) * 1.7, len = 8 + (q % 4) * 6, span = Math.max(60, Math.min(BW + 40, E + 40)), x = ((q * 53 + wd * sp) % span) - 20, y = (q * 37 + Math.round(Math.sin(wd / 23 + q) * 3) + 180) % BH;
      if (!full && x > bil(y) - 6) continue;
      ctx.globalAlpha = (q % 3 ? 0.5 : 0.85) * calm; ctx.fillStyle = q % 7 === 0 ? '#fff0c8' : q % 2 ? '#e8b878' : '#c89060'; ctx.fillRect(Math.round(x), y, len, 1); if (q % 4 === 0) ctx.fillRect(Math.round(x) + 3, y + 1, len - 4, 1);
    }
    if (gust > 0) { ctx.globalAlpha = gust * 0.22; r('#f4d49a', 0, 0, BW, BH); }      // a gust builds before each jacket goes
    ctx.globalAlpha = 1;
  }
  // him: sunk to the ankles in soft sand, bent forward once the storm has him
  function heroW(ctx, st, f) {
    const h = st.h; if (!HF || (h.inv > 0 && (h.inv >> 2) % 2)) return;
    const soft = h.ground && softAt(st, h.x), im = !h.ground ? (h.vy < 0 ? HF.jump : HF.fall) : h.moving ? HF.run[(f >> (soft ? 3 : 2)) % 8] : HF.run[2];
    const inStorm = st.storm > 0 && !st.won && stormEdge(st) > h.x + 10, X = Math.round(h.x), Y = Math.round(h.y) + (soft ? 4 : 0);
    ctx.save();
    if (soft) { ctx.beginPath(); ctx.rect(0, -40, BW, FL + 43); ctx.clip(); }
    if (inStorm) { ctx.translate(X, Y); ctx.transform(1, 0, -0.26, 1, 0, 0); ctx.drawImage(im.c, -im.ox, -im.oy); }
    else ctx.drawImage(im.c, X - im.ox, Y - im.oy);
    ctx.restore();
    if (soft && h.moving) { ctx.fillStyle = '#fff0c8'; for (let q = 0; q < 4; q++) { const a = ((f * 2 + q * 5) % 14) / 14; ctx.fillRect(X - 6 - Math.round(a * 7) + q, FL + 1 - Math.round(a * (4 + q)), 1, 1); } }
    if (inStorm) { ctx.fillStyle = '#f4d49a'; for (let q = 0; q < 5; q++) { const a = ((f * 3 + q * 9) % 20) / 20; ctx.fillRect(X + 4 + Math.round(a * 22), Y - 28 + q * 6 + Math.round(a * 2), 4, 1); } }   // sand tearing off him
  }

  // ---- the rules (nothing below this line until `stage` may touch a canvas, Math.random, Math.sin or the draw frame) ----
  const lapOf = (st) => Math.max(0, Math.min(3, st.lap || 0));
  const softAt = (st, x) => { for (const s of st.soft) if (x >= s[0] && x < s[1]) return true; return false; };
  const speedAt = (st, x) => (softAt(st, x) ? VSOFT : V);
  const walkTicks = (st, x, d) => { let n = 0, m = 0; while (m < d && n < 900) { m += speedAt(st, x + m); n++; } return n; };   // ticks to walk d px from x
  const walkDist = (st, x, n) => { let m = 0; for (let k = 0; k < n; k++) m += speedAt(st, x + m); return m; };                 // px walked in n ticks from x
  const R = (st) => st.rs[st.ri++ % st.rs.length];                    // the next of the numbers drawn in init
  const bud = (st) => { const b = BUD[lapOf(st)]; return Math.round(b[0] + R(st) * (b[1] - b[0])); };
  const prog = (st) => Math.max(0, Math.min(1, (st.h.x - X0) / (ROCK - X0)));
  const burst = (st, x, n) => { st.bursts.push({ x, n, t: st.t, id: st.bid++ }); };   // a spray of sand (drawn from its age: nothing in play reads it)
  const aheadX = (st, b) => Math.ceil(st.h.x + REACH + walkDist(st, st.h.x, b) + 2);  // a strip he would walk into b ticks from now
  // one thing coming up: sign while t < warn, deadly from a to e (ticks of its own life), gone at end
  const haz = (st, mv, o) => { const z = Object.assign({ id: st.hid++, kind: 'col', word: '', t: 0, x: 0, vx: 0, dest: 0, bx: 0, r: REACH, warn: 60, a: 60, e: 60, end: 68, up: 0, la: 0, fake: 0, lean: 0, m: mv.id }, o); st.hz.push(z); return z; };
  const col = (st, mv, x, warn, up, fake) => haz(st, mv, { kind: 'col', word: 'WAIT', x, warn, a: warn, e: warn + up + HOT, end: fake ? warn + 16 : warn + up + HOT + 8, up, fake: fake ? 1 : 0 });
  const under = (st, mv, extra) => {                                  // under his feet: the warning is the walk off it plus a budget
    const x = st.h.x, tx = Math.max(10, Math.round(x - 8)), warn = extra + walkTicks(st, x, tx + REACH + 1.5 - x) + mv.b2, up = 24;
    return haz(st, mv, { kind: 'col', word: 'MOVE', x: tx, warn, a: warn, e: warn + up + HOT, end: warn + up + HOT + 8, up });
  };
  const travelPlan = (st, mv) => { const x = st.h.x, dest = Math.max(10, Math.round(x - 8)), T = walkTicks(st, x, dest + REACH + 1.5 - x) + mv.b, start = Math.min(ROCK - 14, dest + TRV * T); return { dest, T, start, vs: (start - dest) / T }; };
  const arcPlan = (st) => { const bx = Math.max(10, Math.round(st.h.x - 8)); return { bx, ax: bx + 2 * REACH + GAPW }; };
  // where the ridge runs to before the sign shows. It also settles what the move is, for where he is now (no room before the rock: it comes up under him instead)
  const aim = (st) => {
    const mv = st.mv, x = st.h.x;
    if (mv.kind === 'arc' && arcPlan(st).ax > EDGE) mv.kind = 'ahead';
    if ((mv.kind === 'ahead' || mv.kind === 'chase' || mv.kind === 'feint') && aheadX(st, mv.b) > EDGE) mv.kind = 'under';
    if (mv.kind === 'travel' && travelPlan(st, mv).vs < 0.45) mv.kind = 'under';
    return mv.kind === 'under' ? x - 8 : mv.kind === 'arc' ? arcPlan(st).ax : mv.kind === 'travel' ? travelPlan(st, mv).start : aheadX(st, mv.b);
  };
  const choose = (st) => {                                            // the next move
    const p = prog(st), L = lapOf(st), n = st.n++; let k;
    if (L === 0 && n < 4) k = ['ahead', 'under', 'ahead', 'ahead'][n];               // the first few teach the two answers
    else {
      // threats (T: a plain walk is caught) and dodges (S: a plain walk survives) in threes, never two S together
      if (!st.bag.length) st.bag = (R(st) < 0.5 ? 'TST' : 'TTS').split('');
      const c = st.bag.shift(), r = R(st);
      if (c === 'S') {                                                // of the three that punish standing still, whichever he has met least: every fight shows the travelling sign and the false one
        const opts = ['travel', 'feint', 'under']; let low = 99; for (const o of opts) low = Math.min(low, st.seen0[o] || 0);
        const few = opts.filter((o) => (st.seen0[o] || 0) === low); k = few[Math.min(few.length - 1, Math.floor(r * few.length))];
      } else k = (p < 0.1 && L === 0) || r < 0.4 ? 'ahead' : r < 0.72 ? 'chase' : 'arc';   // (the first stretch of the first lap keeps to the plain one)
    }
    st.seen0[k] = (st.seen0[k] || 0) + 1;
    const easy = L === 0 && n < 2 ? 12 : 0;                                          // the first two signs of the first lap give him longer
    st.mv = { id: st.mid++, kind: k, t: 0, hit: 0, free: 1 << 30, at: -1, b: bud(st) + easy, b2: bud(st) + easy };
  };
  const spawn = (st) => {                                             // the sign shows
    aim(st);
    const mv = st.mv, k = mv.kind, L = lapOf(st), WA = 64 - 5 * L, UP = 34 - 3 * L; mv.t = 0;
    if (k === 'ahead' || k === 'chase') { col(st, mv, aheadX(st, mv.b), WA, UP, 0); mv.free = WA + UP + HOT + 8; if (k === 'chase') mv.at = WA + UP; }
    else if (k === 'feint') { const WF = 40 - 3 * L; col(st, mv, aheadX(st, mv.b), WF, UP, 1); mv.at = WF; }
    else if (k === 'under') { const z = under(st, mv, 0); mv.free = z.warn + 10; }
    else if (k === 'travel') { const q = travelPlan(st, mv), up = 24; haz(st, mv, { kind: 'trav', word: 'MOVE', x: q.start, vx: -q.vs, dest: q.dest, warn: q.T, a: q.T, e: q.T + up + HOT, end: q.T + up + HOT + 8, up }); mv.free = q.T + 10; }
    else {                                                            // the arc: out of the far strip at T, into the near one FLY ticks later, and it takes LA ticks for all of it to pass
      const x = st.h.x, q = arcPlan(st), T = Math.max(60 - 4 * L, walkTicks(st, x, q.bx + REACH + 1.5 - x) + mv.b - FLY), LA = Math.max(78, Math.min(190, walkTicks(st, x, q.ax - REACH - x) + 14 - T));
      haz(st, mv, { kind: 'arcA', word: 'BETWEEN', x: q.ax, bx: q.bx, warn: T, a: T, e: T + LA, end: T + LA + 8, la: LA });
      haz(st, mv, { kind: 'arcB', x: q.bx, warn: T + FLY, a: T + FLY, e: T + LA, end: T + LA + 8 });
      mv.free = T + LA + 8;
    }
    st.seen[k] = (st.seen[k] || 0) + 1; st.last = k; st.events.push('warn');
  };
  const strike = (st, z) => {                                         // it has him: one jacket, and he is flung back the way he came
    const h = st.h; if (!hurt(st, 'worm')) return;
    if (st.mv && st.mv.id === z.m) st.mv.hit = 1; st.hitM = z.m;
    h.frozen = true; h.ground = false; h.on = null; h.vy = -4.4; st.thrown = 1; st.shake = 18; burst(st, h.x, 24);
  };

  return {
    name: 'THE GREAT WORM', tip: 'HOLD TO WALK. DODGE WORMSIGN.', tips: ['HOLD TO WALK. LET GO TO STAND STILL', 'SHAKING SAND: THE WORM COMES UP THERE', 'DON\'T BE ON THE STRIP WHEN IT BURSTS', 'REACH THE ROCK BEFORE THE STORM'], hero: 'hold', heroX: X0, X0, ROCK, ZONE, REACH, V, VSOFT,
    clock: (st) => CLOCK[lapOf(st)] * 60,
    speedAt,
    // for the test bots: what is marked on the sand right now. x = where it will come up, a..e = ticks from now that it is deadly
    hazards: (st) => st.hz.filter((z) => !(z.fake && z.t >= z.warn)).map((z) => ({ x: z.kind === 'trav' ? z.dest : z.x, r: z.r, a: z.a - z.t, e: z.e - z.t, kind: z.kind })),
    init(st) {
      const h = st.h, L = lapOf(st); h.right = ROCK;
      const rs = []; for (let k = 0; k < 256; k++) rs.push(st.rnd());
      Object.assign(st, { rs, ri: 0, tm: CLOCK[L] * 60, storm: 0, sj: 0, wt: 0, last: '', n: 0, thrown: 0, wind: 0, fin: null, bursts: [], bid: 0, hz: [], hid: 0, mid: 0, mv: null, hitM: -1, bag: [], seen: {}, seen0: {}, gap: 30, hx: h.x, soft: [],
        w: { ph: 'roam', x: 150, dir: -1, t: 0 } });
      // soft sand: three bowls (wider on later laps), never in the first stretch or at the foot of the rock
      const spots = [[56, 76], [118, 140], [184, 204]];
      for (const [a, b] of spots) { const x0 = Math.round(a + R(st) * (b - a)), wd = Math.round(24 + R(st) * 8 + 4 * Math.min(L, 2)); st.soft.push([x0, x0 + wd]); }
    },
    update(st, inp) {
      const h = st.h, w = st.w, L = lapOf(st); st.wind++;
      if (st.bursts.length && st.t - st.bursts[0].t > 80) st.bursts.shift();
      if (st.fin) { st.fin.t++; if (st.fin.t === 18 || st.fin.t === 40) burst(st, st.fin.x, 16); }
      if (st.storm > 0) st.storm++;
      if (st.won) { st.wt++; for (const z of st.hz) z.t++; st.hz = st.hz.filter((z) => z.t < z.end); return; }
      if (h.moving) h.x = Math.min(ROCK, st.hx + speedAt(st, st.hx));  // deep sand: slow going (the kit's own step is replaced)
      if (st.thrown) {                                                // flung back the way he came
        if (!h.ground) h.x = Math.max(X0, h.x - THROW); else if (++st.thrown > 22) { st.thrown = 0; h.frozen = false; }
      }
      st.hx = h.x;
      if (h.x >= ROCK - 0.01 && h.ground && !st.thrown) {             // made it: the worm breaches behind him, too late
        win(st, 'SAFE ON THE ROCK  +500', ROCK + 16); st.fin = { t: 0, x: ROCK - 66 }; st.shake = 18; st.events.push('roar'); burst(st, st.fin.x, 36); w.ph = 'won';
        st.hz = st.hz.filter((z) => z.t >= z.warn && !z.fake && z.kind !== 'arcB'); return;
      }
      // the storm: a countdown, then it is here for good
      if (st.tm > 0) {
        st.tm--;
        if (st.tm > 0 && st.tm <= 300 && st.tm % 60 === 0) st.events.push('warn');
        if (st.tm === 0) { st.storm = 1; st.sj = SJ; st.shake = 16; st.events.push('roar'); st.events.push('whoosh'); }
      } else {
        if (st.sj === 40) st.events.push('warn');
        if (--st.sj <= 0 && hurt(st, 'storm')) { st.sj = SJ; st.shake = 12; st.events.push('whoosh'); }
      }
      // what is marked on the sand
      for (const z of st.hz) {
        z.t++;
        if (z.t < z.warn) { z.x += z.vx; if (z.t % 14 === 1 && z.kind !== 'arcB') st.events.push('thump'); continue; }
        if (z.t === z.warn) {
          if (z.kind === 'trav') { z.x = z.dest; z.vx = 0; }
          if (z.fake) { st.events.push('whoosh'); burst(st, z.x, 8); continue; }
          z.lean = z.x > h.x ? 14 : -14; st.shake = z.kind === 'arcB' ? 10 : 16; st.events.push(z.kind === 'arcB' ? 'thump' : 'roar'); burst(st, z.x, z.kind === 'arcB' ? 20 : 30);
        }
        if (!z.fake && z.t >= z.a && z.t < z.e && st.hitM !== z.m && h.ground && !st.thrown && Math.abs(h.x - z.x) < z.r) strike(st, z);
      }
      if (st.hz.length && st.hz[0].t >= st.hz[0].end) st.hz = st.hz.filter((z) => z.t < z.end);
      // the worm: far off in the dunes, then running in under the sand, then its move
      w.t++;
      if (w.ph === 'roam') {
        const tx = 156 + dsin(st.t * 0.7) * 84, dx = Math.max(-2.4, Math.min(2.4, tx - w.x)); w.x += dx; if (Math.abs(dx) > 0.3) w.dir = Math.sign(dx);
        if (--st.gap <= 0 && h.x < ROCK - 40 && !st.thrown) { choose(st); w.ph = 'go'; w.t = 0; }
      } else if (w.ph === 'go') {
        const tx = aim(st), sp = 3.2 + 0.6 * L, dx = Math.max(-sp, Math.min(sp, tx - w.x)); w.x += dx; if (Math.abs(dx) > 0.3) w.dir = Math.sign(dx);
        if (Math.abs(tx - w.x) < 1.5 || w.t > 100) { spawn(st); w.ph = 'act'; w.t = 0; }
      } else if (w.ph === 'act') {
        const mv = st.mv; mv.t++;
        if (mv.t === mv.at) {                                         // the second half of a feint or a chase: now it is under him
          mv.at = -1;
          if (mv.hit || st.thrown) mv.free = Math.min(mv.free, mv.t + HOT + 8);
          else { const z = under(st, mv, mv.kind === 'chase' ? HOT + 2 : 8); mv.free = mv.t + z.warn + 10; st.seen.follow = (st.seen.follow || 0) + 1; st.events.push('warn'); }
        }
        if (mv.t >= mv.free) { w.ph = 'roam'; w.t = 0; if (st.hz.length) w.x = st.hz[st.hz.length - 1].x; st.gap = Math.round((6 + R(st) * 24) * (1 - 0.3 * prog(st)) * (1 - 0.2 * L)); }
      }
    },
    heroDraw: HF ? heroW : undefined,
    stage(ctx, st, f) {
      ctx.drawImage(BS, 0, 0);
      for (const s of st.soft) softSand(ctx, s[0], s[1], f);
      const fl = hash(f >> 2, 3); ctx.fillStyle = '#ffb04a'; ctx.globalAlpha = 0.08 + fl * 0.05; ctx.fillRect(292, 118, 25, 25); ctx.fillRect(297, 123, 15, 15); ctx.globalAlpha = 1;
      // the storm on its way: a wall of sand that climbs the sky from the left as the clock runs down
      const left = Math.max(0, st.tm) / (CLOCK[lapOf(st)] * 60), k = Math.min(1, (1 - left) * 1.15), wd = st.wind || 0;
      if (k > 0.02 && st.storm < 120) {
        const reach = Math.round(40 + k * 270), SC = ['#e8b070', '#c08a5a', '#9a6448', '#74463e', '#553040'];
        for (let i = 0; i < reach; i += 2) {
          const u = i / reach, env = Math.pow(1 - u, 0.55) * (26 + k * 86), bil = Math.abs(Math.sin(i / 19 + wd / 46)) * 10 + Math.abs(Math.sin(i / 8 - wd / 27)) * 5 + Math.abs(Math.sin(i / 3.3 + wd / 13)) * 2;
          const top = Math.round(108 - env - bil * (0.35 + 0.65 * (1 - u)));
          ctx.fillStyle = '#1a0e14'; ctx.fillRect(i, top - 1, 2, 1);
          for (let j = top; j < 108; j += 2) {
            const d = (j - top) / 46 + Math.sin(j / 7 + i / 23 - wd / 21) * 0.12 + Math.sin(j / 3 - i / 9 + wd / 11) * 0.06;
            ctx.fillStyle = dith(SC, Math.max(0, Math.min(0.99, d + 0.08)), i >> 1, j >> 1); ctx.fillRect(i, j, 2, 2);
          }
        }
        if (k > 0.35 && hash(f >> 3, 7) > 0.8) { const lx = Math.round(hash(f >> 3, 1) * reach * 0.6), ly = 108 - Math.round((26 + k * 86) * 0.6); ctx.fillStyle = '#e8f8ff'; for (let q = 0; q < 14; q++) ctx.fillRect(lx + Math.round(Math.sin(q * 1.7 + (f >> 3)) * 3), ly + q * 2, 1, 2); }   // static in the wall
      }
      ctx.fillStyle = '#f0a060';                                      // sand blowing off the crests: harder as the storm nears
      const n = 9 + Math.round(k * 22), sp = 0.8 + k * 2.2;
      for (let q = 0; q < n; q++) { const x = ((wd * (sp + (q % 3) * 0.3) + q * 67) % 360) - 20, y = 96 + ((q * 13) % 60) + Math.round(Math.sin(wd / 20 + q) * 1.5); ctx.globalAlpha = 0.3 + k * 0.2; ctx.fillRect(Math.round(x), y, 7, 1); ctx.fillRect(Math.round(x) - 3, y + 1, 6, 1); }
      ctx.globalAlpha = 1;
    },
    draw(ctx, st, f) {
      const w = st.w;
      flyby(ctx, st.t, f);
      if (w.ph === 'roam' && st.t > 150) ridge(ctx, w.x, 148, 13, 4, w.dir, f, false);
      if (w.ph === 'go') { const u = Math.min(1, w.t / 14); ridge(ctx, w.x, 148 + 15 * u, 13 + 17 * u, 4 + 7 * u, w.dir, f, true); }
      for (const z of st.hz) if (z.t < z.warn) {                      // the strips
        const u = z.t / z.warn;
        if (z.kind === 'trav') strip(ctx, z.dest, u, f, u < 0.7); else strip(ctx, Math.round(z.x), u, f, false);
        if (z.kind === 'arcA') {                                      // static jumping from one strip to the other: where it will fly
          ctx.fillStyle = u > 0.5 ? '#ff5a3a' : '#ffd21a';
          for (let q = 1; q < 24; q++) if ((q + (f >> 1)) % 3 === 0) { const [x, y] = arcAt(z.x, z.bx, q / 24); ctx.fillRect(Math.round(x), Math.round(y) + 14, 2, 2); }
        }
      }
      for (const z of st.hz) if (z.t >= z.warn && !z.fake) {          // the worm itself
        const t = z.t - z.warn;
        if (z.kind === 'arcA') arcWorm(ctx, z.x, z.bx, t / FLY, (t - (z.la - FLY)) / FLY, f);
        else if (z.kind !== 'arcB') { const rise = t < 10 ? ease(t / 10) * 106 : t < z.up ? 106 + Math.sin(t / 5) * 2 : Math.max(0, 106 - (t - z.up) * SINK); wormUp(ctx, z.x, rise, z.lean, 48, f); }
      }
      if (st.fin) { const t = st.fin.t, rise = t < 16 ? ease(t / 16) * 126 : t < 130 ? 126 + Math.sin(t / 7) * 3 : Math.max(0, 126 - (t - 130) * 3); wormUp(ctx, st.fin.x, rise, 30, 56, f); }
    },
    front(ctx, st, f) {
      const h = st.h, r = rc(ctx);
      for (const z of st.hz) {
        const u = z.t / z.warn, t = z.t - z.warn, shake = ((f >> 1) % 2 ? 1 : -1) * (u > 0.5 ? 1 : 0);
        if (z.t < z.warn) {
          if (z.kind === 'trav') { ridge(ctx, z.x, FL + 3, 24, 9, -1, f, true); dust(ctx, z.x + 14, FL + 6, 20, 0.3, f, 0.5); if (u > 0.7) mound(ctx, z.dest + shake, ZONE + 4, 2 + (u - 0.7) * 20); }
          else { mound(ctx, z.x + shake, ZONE + 4, 2 + Math.min(1, u) * 7); dust(ctx, z.x, FL + 6, 26, 0.2 + u * 0.4, f, 0.5); }
        } else if (z.fake) { mound(ctx, z.x, ZONE + 4, Math.max(0, 9 - t * 0.7)); dust(ctx, z.x, FL + 2, 30, Math.min(1, t / 16), f, 0.7); }   // it slumps: nothing there
        else { const left = z.end - z.t; mound(ctx, z.x, 34, Math.min(9, t) * (left < 14 ? left / 14 : 1)); dust(ctx, z.x, FL + 2, 44, Math.min(1, t / 70), f); }
      }
      if (st.fin) { const t = st.fin.t; mound(ctx, st.fin.x, 40, Math.min(10, t)); dust(ctx, st.fin.x, FL + 2, 52, (t % 60) / 60, f, 0.7); }
      for (const b of st.bursts) {                                    // sand thrown up
        const a = st.t - b.t; if (a > 70) continue;
        for (let k = 0; k < b.n; k++) {
          const x = b.x + (hash(k, b.id * 3 + 1) - 0.5) * 34 + (hash(k, b.id * 3 + 2) - 0.5) * 5 * a, y = FL - 2 - (1.5 + hash(k, b.id * 3 + 3) * 4.5) * a + 0.085 * a * a;
          if (y < FL + 8) { ctx.fillStyle = k % 3 ? '#f4d49a' : '#c08a5e'; ctx.fillRect(Math.round(x), Math.round(y), 2, 2); }
        }
      }
      if (st.storm > 0) { stormFront(ctx, st, f); if (!st.portal) heroW(ctx, st, f); }      // he stays readable in it; the wormsign does not
      if (st.won || st.t < 70) return;
      const said = new Set();
      for (const z of st.hz) if (z.word && z.t < z.warn && !said.has(z.word) && st.lap === 0 && (st.seen[z.word] || 0) <= 2) {      // one word, the first couple of times
        said.add(z.word);
        const mv = z.word === 'MOVE', bt = z.word === 'BETWEEN', x = mv ? Math.round(h.x) : bt ? Math.round((z.x + z.bx) / 2) : z.x, y = mv ? h.y - 46 : bt ? FL - 62 : FL - 30;
        if ((f >> 2) % 3) drawText(ctx, bt ? 'STAND HERE' : z.word + '!', x, y, { fill: z.word === 'WAIT' ? GRAD.red : GRAD.gold, outline: '#000', align: 'center' });
        if (bt) { r('#000', x - 2, FL - 51, 5, 9); r('#ffd21a', x - 1, FL - 50, 3, 7); r('#000', x - 4, FL - 44, 9, 3); r('#ffd21a', x - 3, FL - 43, 7, 1); r('#ffd21a', x - 1, FL - 42, 3, 1); }
      }
      const secs = Math.ceil(Math.max(0, st.tm) / 60), low = secs <= 5;
      bar(ctx, 'REACH THE ROCK', (h.x - X0) / (ROCK - X0), low ? '#ff4a3a' : '#6aff5a');
      if (st.storm > 0) {                                             // the storm is here: no more clock
        if ((f >> (st.sj < 40 ? 1 : 3)) % 2) drawText(ctx, 'STORM', BW / 2, 24, { scale: 2, fill: GRAD.red, outline: '#000', align: 'center' });
        r('#000', BW / 2 - 31, 42, 62, 4); r('#ff4a3a', BW / 2 - 30, 43, Math.round(60 * Math.max(0, Math.min(1, st.sj / SJ))), 2);   // how long his jacket will last
      } else if (!low || (f >> 2) % 2) drawText(ctx, 'STORM ' + secs, BW / 2, 24, { scale: low ? 2 : 1, fill: low ? GRAD.red : secs <= 10 ? GRAD.gold : GRAD.white, outline: '#000', align: 'center' });
    },
  };
}
