// Black Hole Friday: the portals that start and end each level. Each one is original pixel art,
// built per frame; buildPortals returns card painters (ctx, f) for a 120 x 90 stage.
import { frames, put, tint, flip, hash, TAU } from './chars.js';
import { pix, dith, blackHole } from './scenes.js';

const PW = 120, PH = 90, GND = 82;
const sky = (ctx, top, bot) => { const g = ctx.createLinearGradient(0, 0, 0, PH); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(0, 0, PW, PH); };
const floor = (ctx, c, hi) => { ctx.fillStyle = c; ctx.fillRect(0, GND, PW, PH - GND); ctx.fillStyle = hi; ctx.fillRect(0, GND, PW, 1); };
const at = (ctx, c, x, y) => ctx.drawImage(c, Math.round(x - c.width / 2), Math.round(y - c.height / 2));
// the hero runs in from the left and disappears into the portal at px
const runIn = (ctx, A, f, px, period = 60) => { const t = f % period, x = -12 + t * ((px + 12) / (period * 0.75)); if (x < px) put(ctx, A.hero.run[f % 8], x, GND); };

// 1. THE WORMHOLE: a sphere with another galaxy bent around inside it
const WH = ['#ffffff', '#ffe8b0', '#b8c8ff', '#6a7ad8', '#2a3080', '#0a0c30'];
const wormhole = frames(12, (t) => pix(64, 64, (i, j) => {
  const x = i - 32, y = j - 32, d = Math.hypot(x, y), rr = d / 26;
  if (rr > 1.12) return null;
  if (rr > 0.95) return rr > 1.03 ? (hash(i, j) > 0.55 ? '#6a7ad8' : null) : '#e8f0ff';
  const a = Math.atan2(y, x), w = a + (1 - rr) * 4 + t * TAU * 0.5, lens = 1 / (0.15 + rr);
  if (hash(Math.floor(w * 12) & 1023, Math.floor(lens * 6)) > 0.94) return '#ffffff';
  const band = Math.exp(-Math.pow(Math.sin(w) * rr * 3, 2));
  return dith(WH, 1 - (band * 0.75 + (1 - rr) * 0.15), i, j);
}));

// 2. THE BREACH: a glowing rift torn open in the sea floor
const breach = frames(12, (t) => pix(56, 80, (i, j) => {
  const cx = 28 + Math.sin(j * 0.18) * 3, prof = Math.max(0, 1 - Math.abs(j - 42) / 40);
  const w = Math.pow(prof, 0.7) * 10 * (0.82 + 0.18 * Math.sin(j * 0.5 - t * TAU));
  const q = Math.abs(i - cx) / Math.max(0.5, w);
  if (w < 0.6) return null;
  if (q < 0.25) return '#fff4d0'; if (q < 0.5) return dith(['#ffd070', '#ff8a2a'], (q - 0.25) * 4, i, j);
  if (q < 0.9) return dith(['#ff6a1a', '#3ad8ff'], (q - 0.5) * 2.5, i, j); if (q < 1.25) return dith(['#3ad8ff', '#0a5a8a'], (q - 0.9) * 3, i, j);
  if (q < 1.7) return hash(i, j + Math.floor(t * 12)) > 0.6 ? '#0a5a8a' : '#14222e';
  return null;
}));

// 3. THE GOO PORTAL: a wobbling green swirl that splats open on the wall
const GOO = ['#f4ffc0', '#c8ff4a', '#8ae020', '#4aa810', '#1e6a08'];
const goo = frames(12, (t) => pix(60, 78, (i, j) => {
  const x = i - 30, y = j - 39, d = Math.hypot(x / 25, y / 35), a = Math.atan2(y, x);
  const Rm = 1 + 0.07 * Math.sin(a * 7 + t * TAU) + 0.04 * Math.sin(a * 13 - t * TAU * 2);
  if (d > Rm) return null; if (d > Rm - 0.1) return '#e8ffa0';
  const v = 0.5 + 0.5 * Math.sin(a * 2 + Math.log(d + 0.05) * 5 - t * TAU);
  return dith(GOO, 1 - (v * 0.7 + (1 - d) * 0.3), i, j);
}));

// 4. THE RING GATE: a copper ring; seven lights lock one by one, then the middle turns to water
const CU = ['#ffd2a0', '#e2823e', '#a04c1c', '#5c2410'];
const ring = frames(24, (t) => { const lit = Math.min(7, Math.floor(t * 11)), open = t > 0.66;
  return pix(80, 80, (i, j) => {
    const x = i - 40, y = j - 40, d = Math.hypot(x, y), a = Math.atan2(y, x);
    for (let k = 0; k < 7; k++) { const ca = -Math.PI / 2 + (k - 3) * 0.75 + (k > 3 ? 0 : 0), da = Math.abs(((a - ca + Math.PI * 3) % TAU) - Math.PI); if (d > 33 && d < 40 && da < 0.11 - (d - 33) * 0.008) return k < lit ? (d < 36 ? '#fff0b0' : '#ff8a2a') : '#3a2418'; }
    if (d > 28 && d < 37) { const seg = Math.abs(Math.sin(a * 12)) < 0.08; return seg ? CU[3] : dith(CU, (d - 28) / 9 * 0.8 + (y > 0 ? 0.2 : 0), i, j); }
    if (d <= 28 && open) { const v = 0.5 + 0.5 * Math.sin(d * 0.7 - t * TAU * 4); return dith(['#e8f8ff', '#8ad0ff', '#3a8ae0', '#1a4aa0', '#0a2460'], 1 - (v * 0.6 + (1 - d / 28) * 0.4), i, j); }
    return null;
  }); });

// 5. THE LIQUID MIRROR: chrome that ripples when you touch it
const SILVER = ['#ffffff', '#dfe4ea', '#aab2bc', '#6e7682', '#3a4048'];
const mirror = frames(12, (t) => pix(46, 70, (i, j) => {
  if (i < 3 || i > 42 || j < 3 || j > 66) return (i + j) % 7 ? '#1a1a22' : '#3a3a48';
  const d = Math.hypot(i - 23, j - 34);
  const v = 0.55 + 0.35 * Math.sin(d * 0.9 - t * TAU * 2) * Math.exp(-d / 26) - j * 0.004;
  return dith(SILVER, 1 - v, i, j);
}));

// THE PHONE LINE: a ringing phone box; pick up and you stream down the wire as green code
const phoneBox = (f, ring) => pix(30, 64, (i, j) => {
  if (j < 4) return i > 1 && i < 28 ? '#8aff9a' : null;
  if (i < 2 || i > 27) return '#1fa02e'; if (j > 60) return '#0f6a1c';
  if (j < 12) return (i > 5 && i < 24 && j > 5 && j < 10) ? '#e8ffe8' : '#0f6a1c';
  if (i > 4 && i < 25 && j > 14 && j < 58) { if (i > 10 && i < 19 && j > 22 && j < 34) return j === 23 || j === 33 || i === 11 || i === 18 ? '#3ae03a' : '#03140a'; if (i > 12 && i < 17 && j > 18 && j < 22) return ring && (f >> 1) % 2 ? '#ffffff' : '#8aff9a'; return (i + j) % 7 ? '#03140a' : '#0a3a12'; }
  return '#1fa02e';
});
// THE TURNSTILE
// the turnstile: a slatted drum turning in a concrete housing, red on the way in, blue on the way out
const TS_R = ['#2a0608', '#6a1014', '#b8201c', '#ff5a3a', '#ffd0b0'], TS_B = ['#060a2a', '#10206a', '#1c48b8', '#3a8aff', '#b0dcff'];
const turnstile = frames(12, (t) => pix(54, 74, (i, j) => {
  if (j < 8 || j > 67) {                                                             // lintel and plinth
    if (j === 0 || j === 73 || i === 0 || i === 53) return '#0c0c10';
    if ((j === 3 || j === 4 || j === 70 || j === 71) && i > 3 && i < 50) return ((i + j) >> 2) % 2 ? '#d8b020' : '#1a1a20';   // hazard stripe
    return (i * 7 + j * 3) % 11 ? '#3a3c44' : '#4c4e58';
  }
  if (i < 5 || i > 48) return i === 0 || i === 53 ? '#0c0c10' : i === 4 || i === 49 ? '#1a1a20' : '#2e3038';
  const u = (i - 26.5) / 22, ph = Math.asin(Math.max(-1, Math.min(1, u))), slat = Math.sin(ph * 6 + t * TAU), shade = Math.cos(ph);
  if (Math.abs(i - 26.5) < 1) return '#f4f4ff';                                      // the seam between the two sides
  if (j === 26 || j === 27 || j === 48 || j === 49) return '#0a0a10';                // the drum's hoops
  if (slat > 0.7) return '#06060a';                                                  // dark between the slats
  return dith(i < 27 ? TS_R : TS_B, 0.12 + 0.8 * shade * (0.55 + 0.45 * slat), i, j);
}));
// 6. THE BLACK HOLE: the last portal, into the leaderboard
const finale = frames(8, (t) => blackHole(13, t, { tilt: 0.22 }));

// the same frames are used by the game (bhf/game/portals.js)
export const ART = { wormhole, breach, goo, ring, mirror, phoneBox, finale, turnstile, TS_R, TS_B };

export function buildPortals(A) {
  const reflect = A.hero.run.map((r) => flip(tint(r, '#dfe4ea', 0.55)));
  return [
    { n: 'THE WORMHOLE', where: 'START → FIRST LEVEL', nod: 'A sphere hanging in space with a different galaxy bent around inside it. Press play and you fall through it, then run out of its far end onto the first level.', d: 'A sphere hanging in space with a different galaxy bent around inside it. Press play and you fall through it, then run out of its far end onto the first level.',
      draw: (c, f) => { sky(c, '#02020a', '#0a0c26'); for (let k = 0; k < 40; k++) { c.fillStyle = k % 3 ? '#8a8aa8' : '#ffffff'; c.fillRect(Math.floor(hash(k, 5) * PW), Math.floor(hash(k, 6) * PH), 1, 1); } runIn(c, A, f, 80); at(c, wormhole[Math.floor(f / 2) % 12], 80, 44); } },
    { n: 'THE LIQUID MIRROR', where: 'OUT OF NEON RAIN', nod: 'A mirror in a neon frame rises out of the wet rooftop when The Nexus goes down. Your reflection walks up to meet you and you wade in through liquid chrome.', d: 'A mirror in a neon frame rises out of the wet rooftop when The Nexus goes down. Your reflection walks up to meet you and you wade in through liquid chrome.',
      draw: (c, f) => { sky(c, '#0a0618', '#1e1a28'); floor(c, '#141018', '#3a3448'); const t = f % 60, x = Math.min(52, -12 + t * 1.4); put(c, A.hero.run[f % 8], x, GND); at(c, mirror[f % 12], 82, 46);
        c.save(); c.beginPath(); c.rect(62, 14, 40, 64); c.clip(); c.globalAlpha = 0.7; put(c, reflect[f % 8], 112 - (x + 12) * 0.5, GND - 4); c.restore(); } },
    { n: 'THE BREACH', where: 'OUT OF THE ICE PLANET', nod: 'Outlast The Singularity and a rift glowing orange and blue tears open in the air over the ice. Run into it and fall through fire.', d: 'Outlast The Singularity and a rift glowing orange and blue tears open in the air over the ice. Run into it and fall through fire.',
      draw: (c, f) => { sky(c, '#06243a', '#020a12'); for (let k = 0; k < 14; k++) { c.fillStyle = '#3ad8ff'; c.fillRect(66 + Math.floor(hash(k, 1) * 28), PH - ((f * (1 + hash(k, 2)) + k * 9) % PH), 1, 1); } floor(c, '#0a1420', '#1e3448'); runIn(c, A, f, 80); at(c, breach[f % 12], 80, 44); } },
    { n: 'THE GOO PORTAL', where: 'OUT OF THE HIVE', nod: 'A wobbling green swirl splats open in the Hive once The Queen is beaten. You spin away down it.', d: 'A wobbling green swirl splats open in the Hive once The Queen is beaten. You spin away down it.',
      draw: (c, f) => { sky(c, '#08130f', '#14201a'); floor(c, '#2e363c', '#46c02a'); runIn(c, A, f, 80); at(c, goo[f % 12], 80, 44); } },
    { n: 'THE PHONE LINE', where: 'OUT OF THE CODE', nod: 'A ringing phone box prints itself in, line by line, when The Agent is beaten. Pick up and you break into green code and stream down the line.', d: 'A ringing phone box prints itself in, line by line, when The Agent is beaten. Pick up and you break into green code and stream down the line.',
      draw: (c, f) => { c.fillStyle = '#000'; c.fillRect(0, 0, PW, PH); floor(c, '#03140a', '#8aff9a'); const t = f % 72; c.drawImage(phoneBox(f, t < 40), 70, GND - 64);
        if (t < 40) put(c, A.hero.run[f % 8], -12 + t * 2, GND); else { const k = (t - 40) / 32; for (let i = 0; i < 30; i++) { c.fillStyle = i % 3 ? '#3ae03a' : '#e8ffe8'; c.fillRect(Math.round(68 + hash(i, 3) * 10 + (85 - 68) * k * hash(i, 4)), Math.round(GND - 40 + hash(i, 5) * 36 - k * 30 * hash(i, 6)), 1, 2); } c.globalAlpha = Math.max(0, 1 - k * 2); put(c, tint(A.hero.run[0], '#3ae03a', 0.7), 68, GND); c.globalAlpha = 1; } } },
    { n: 'THE RING GATE', where: 'OUT OF THE DEEP DESERT', nod: 'A copper ring rises out of the sand at the rock. Seven lights lock one by one, the middle turns to rippling water and you wade through.', d: 'A copper ring rises out of the sand at the rock. Seven lights lock one by one, the middle turns to rippling water and you wade through.',
      draw: (c, f) => { sky(c, '#e8a060', '#a85a2a'); floor(c, '#c89058', '#f0c890'); const t = f % 48; if (t > 32) runIn(c, A, f - 32, 80, 16); at(c, ring[Math.floor(t / 2)], 80, 42); } },
    { n: 'THE TURNSTILE', where: 'OUT OF INVERSION', nod: 'Tenet', d: 'A slatted drum turning in a concrete housing, red on the way in and blue on the way out. Used when Inversion is not the last level; when it is, the black hole takes its place.',
      draw: (c, f) => { sky(c, '#1a2230', '#0a0e16'); floor(c, '#20242c', '#4c4e58'); runIn(c, A, f, 80); c.drawImage(turnstile[(f >> 2) % 12], 80 - 27, GND - 74); } },
    { n: 'THE BLACK HOLE', where: 'LAST LEVEL → PRIZE', nod: 'Whichever level is last ends in the black hole itself. You are pulled thin, fall in and land on the leaderboard. The top three scores win the jacket.', d: 'Whichever level is last ends in the black hole itself. You are pulled thin, fall in and land on the leaderboard. The top three scores win the jacket.',
      draw: (c, f) => { sky(c, '#000000', '#06081c'); for (let k = 0; k < 40; k++) { c.fillStyle = k % 3 ? '#8a8aa8' : '#ffffff'; c.fillRect(Math.floor(hash(k, 7) * PW), Math.floor(hash(k, 8) * PH), 1, 1); }
        at(c, finale[Math.floor(f / 2) % 8], 78, 44); const t = (f % 40) / 40, r = A.hero.jump, sx = 1 - t * 0.85, sy = 1 + t * 1.6, x = 20 + t * 56, y = 60 - t * 16;
        c.save(); c.globalAlpha = 1 - t * 0.6; c.translate(x, y); c.scale(sx, sy); c.drawImage(r.c, -r.ox, -r.oy * 0.6); c.restore(); } },
  ];
}
