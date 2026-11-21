// Draws a sim state with parallax, a vertical camera and old-school effects.
// Cosmetic only: nothing here changes the score.
import { FP, W, H, DECK_Y, LEDGE_Y, GALLERY_Y, PIPE_Y, LAVA_Y, BLOCK, BLOCK_BOTTOM, PLAYER_SX, MAX_HP, ZONE_PX, ZONES, score, zoneOf, SKY_Y, VENT_WARN } from './sim.js';
import { FX, DCHR } from './danger.js';
import { COINS, HOLE_COIN } from './coins.js';
import { drawText, GRAD, drawLogo, measure } from '../../font.js';
import { volcanoPinnacle } from '../../scenery.js';
import { drawBlimp } from '../../decals.js';
const drawDecals = () => {};   // the Vollebak wall decals belong to the FWAHBL zones

export function createView() {
  return { camY: 60, frame: 0, parts: [], popups: [], shake: 0, flash: 0, flashCol: '#fff', lightning: 0, bolt: null,
    trail: [], trailOn: 0, big: null, zoneFx: 0, lastZone: 0, sparks: [], ambient: [] };
}

const zoneAt = (A, worldX) => A.zones[Math.max(0, Math.min(A.zones.length - 1, zoneOf(worldX)))];   // one skin per level
const spr = (ctx, fr, x, y, sy = 1) => { if (sy === 1) ctx.drawImage(fr.c, Math.round(x - fr.ox), Math.round(y - fr.oy)); else ctx.drawImage(fr.c, Math.round(x - fr.ox), Math.round(y - fr.oy * sy), fr.c.width, Math.round(fr.c.height * sy)); };

export function absorbEvents(v, s, A) {
  const px = PLAYER_SX, py = s.y / FP, zs = A ? zoneAt(A, s.dist + PLAYER_SX * FP) : null, LB = (zs && zs.labels) || {};
  for (const e of s.events) {
    const [kind, val] = e.split(':');
    if (kind === 'hit') { v.shake = 10; v.flash = 5; v.flashCol = '#ff2040'; burst(v, px, py - 16, ['#ff4fd8', '#ffffff'], 8, 1.8); pop(v, px, py - 40, 'OUCH!', GRAD.red); }
    if (kind === 'stomp') { v.shake = 4; burst(v, px, py, ['#6cbf3c', '#ffffff'], 6, 1.6); pop(v, px, py - 40, '+' + val, GRAD.green); v.trailOn = 12; }
    if (kind === 'batkill') { burst(v, px, py, ['#6a3a8a', '#7aff4a'], 6, 1.4); pop(v, px, py - 40, '+' + val, GRAD.green); }
    if (kind === 'unikill') { v.shake = 8; v.flash = 3; v.flashCol = '#ffffff'; rainbow(v, px + 14, py - 20); pop(v, px + 10, py - 46, '+' + val, GRAD.pink); v.trailOn = 12; }
    if (kind === 'token') { pop(v, px + 6, py - 40, '+' + val, GRAD.gold); }
    // the black hole coin: taken, counting, banked
    if (kind === 'hole') { v.flash = 4; v.flashCol = '#a05aff'; v.shake = 4; ring(v, px, py - 14, ['#ffffff', '#ffd21a', '#ff2d7a']); pop(v, px + 30, py - 62, "BLACK HOLE COIN!", GRAD.pink); v.chickT = 0; }
    if (kind === 'bank') { v.flash = 5; v.flashCol = '#fff38a'; v.shake = 6; burst(v, px, py - 30, ['#ffd21a', '#ffffff', '#ff2d7a', '#3ae8ff'], 26, 2.4); v.banked = { val: +val, t: 90 }; }
    if (kind === 'patch') { burst(v, px, py - 18, ['#f8d023', '#ffffff'], 8, 1.5); pop(v, px, py - 44, val ? '+25' : 'ENERGY UP!', GRAD.gold); v.flash = 2; v.flashCol = '#fff38a'; }
    if (kind === 'bonk') { v.shake = 3; if (val) {
      const label = LB[val] || { hp: 'ENERGY UP!', triple: 'TRIPLE JUMP!', star: 'INVINCIBLE!', shield: 'SHIELD!', bomb: 'BOOM!' }[val] || '+' + val;
      pop(v, px, py - 52, label, +val >= 150 ? GRAD.pink : val === 'star' ? GRAD.green : val === 'triple' ? GRAD.blue : GRAD.gold);
      burst(v, px, py - 36, val === 'star' || val === 'triple' ? ['#ffffff', '#8ab8f0', '#ffe14a', '#ff4fd8'] : ['#ffd21a', '#ffffff'], val === 'star' || val === 'triple' ? 16 : 6, 1.8);
      if (val === 'star' || val === 'triple') { v.flash = 4; v.flashCol = val === 'star' ? '#fff38a' : '#8ab8f0'; }
      if (val === 'shield') { ring(v, px, py - 14, ['#8ae8ff', '#ffffff']); v.flash = 3; v.flashCol = '#8ae8ff'; }
    } }
    if (kind === 'bomb') { v.shake = 12; v.flash = 9; v.flashCol = '#ffffff'; for (let i = 0; i < 5; i++) ring(v, 60 + i * 55, 120, ['#ffffff', '#ffe14a']); if (+val) pop(v, W / 2, 70, '+' + val, GRAD.green); }
    if (kind === 'ride') { v.shake = 6; v.flash = 5; v.flashCol = '#fff38a'; burst(v, px, py - 16, ['#ffffff', '#ffe14a', '#ff8a1a'], 16, 2.2); pop(v, px + 20, py - 52, LB.ride || 'HOP ON!', GRAD.gold); }
    if (kind === 'shield') { v.shake = 5; v.flash = 3; v.flashCol = '#8ae8ff'; ring(v, px, py - 14, ['#8ae8ff', '#ffffff']); pop(v, px, py - 44, 'SHIELD GONE', GRAD.blue); }
    if (kind === 'land' && s.ride > 0 && !s.fly) v.shake = Math.max(v.shake, 3);
    if (kind === 'thud') v.shake = Math.max(v.shake, 2);
    if (kind === 'tjump') { v.trailOn = 14; ring(v, px, py, ['#8ab8f0', '#ffffff']); }
    if (kind === 'smash' && val) { v.shake = 5; burst(v, px + 10, py - 14, ['#ffffff', '#ffe14a', '#ff4fd8', '#5fff6a'], 10, 2); pop(v, px + 8, py - 44, '+' + val, GRAD.green); }
    if (kind === 'boss') { v.boss = 120; v.shake = 4; }
    if (kind === 'twins') { v.shake = 10; v.flash = 6; v.flashCol = '#ffffff'; rainbow(v, px, py - 20); v.big = { lines: ['TWIN KILL!'], sub: '+' + val + ' BONUS', t: 120, fill: GRAD.green, short: true }; }
    if (kind === 'pwarn') pop(v, px, py - 52, 'ENDING!', GRAD.red);
    if (kind === 'pend') pop(v, px, py - 52, 'POWER DOWN', GRAD.white);
    if (kind === 'djump') v.trailOn = 10;
    if (kind === 'die') { v.shake = 14; v.flash = 8; v.flashCol = '#ffffff'; burst(v, px, py - 16, ['#ff4fd8', '#f8d023', '#ffffff'], 16, 2.4); }
    if (kind === 'target') { v.big = { lines: ['CODE UNLOCKED!'], sub: 'SUBMIT YOUR SCORE FOR 20% OFF', sub2: 'NOW IT GETS HARDER...', t: 210, fill: GRAD.green }; v.flash = 6; v.flashCol = '#5fff6a'; }
    if (kind === 'zone') v.zoneFx = 30;
    if (kind === 'clear') { v.flash = 8; v.flashCol = '#ffffff'; }
  }
  for (const p of s.puddles) if (p.fresh) { p.fresh = false; burst(v, (p.x + p.w / 2 - s.dist) / FP, p.y / FP - 1, ['#ff4fd8', '#c21fa0'], 4, 1.1, true); }
  for (const d of s.drips) if (d.splash && !d.done) { d.done = true; burst(v, (d.x - s.dist) / FP, (d.ly ? d.ly / FP : DECK_Y) - 1, [['#ff4fd8', '#ff5a1a', '#ff7a1a', '#ff4fd8', '#d8a020'][((zoneOf(d.x) % ZONES) + ZONES) % ZONES]], 2, 0.8, true); }
}
function burst(v, x, y, cols, n, sp = 1.8, world = false) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = (0.4 + Math.random()) * sp;
    v.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, t: 20 + Math.random() * 25, c: cols[i % cols.length], world });
  }
}
function rainbow(v, x, y) {
  const cols = ['#ff2040', '#ff8a1a', '#ffe14a', '#5fff6a', '#3d9cf5', '#a05aff', '#ff4fd8'];
  for (let i = 0; i < 21; i++) { const a = (i / 21) * Math.PI * 2; v.parts.push({ x, y, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2, t: 30, c: cols[i % 7] }); }
}
function ring(v, x, y, cols) { for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; v.parts.push({ x, y, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 0.6, t: 22, c: cols[i % cols.length] }); } }
function pop(v, x, y, txt, fill) { v.popups.push({ x, y, t: 50, txt, fill }); }

// ---------------------------------------------------------------------------
// The canvas may be bigger than the 320x180 game (4x in the game): the world is drawn
// whole-pixel-snapped, then slid by the leftover fraction of a pixel, so scrolling is smooth
// instead of stepping 2-2-3-2 pixels. o.sub draws the world a fraction of a step ahead.
export function drawWorld(ctx, s, A, v, o = {}) {
  const real = s.dist, fd = real / FP + (o.sub || 0), id = Math.floor(fd);
  s.dist = id * FP;
  try { drawWorldAt(ctx, s, A, v, o, fd); } finally { s.dist = real; }
}
function drawWorldAt(ctx, s, A, v, o, fdist) {
  const K = ctx.getTransform().a || 1, q = (n) => Math.round(n * K) / K;   // snap to whole screen pixels
  v.frame++;
  const f = v.frame, dist = s.dist / FP, frac = q(fdist - dist);
  // camera: follow jumps up, settle back down
  const ground = s.groundY / FP, feet = s.y / FP;
  let target = 60;
  if (!o.idle && !(s.dead && s.cause === 'fell') && feet <= DECK_Y + 4) target = Math.max(0, Math.min(60, ground - 140 + (feet - ground) * 0.6));
  v.camY += (target - v.camY) * 0.1;
  const cam = Math.round(v.camY);
  const sx = v.shake > 0 ? Math.round((Math.random() - 0.5) * v.shake * 0.7) : 0;
  const sy = v.shake > 0 ? Math.round((Math.random() - 0.5) * v.shake * 0.7) : 0;
  if (v.shake > 0) v.shake--;
  const Y = (wy) => Math.round(wy - cam);
  const camF = q(v.camY - cam);

  ctx.save(); ctx.translate(sx, sy - camF);

  // which zones are on screen, and where the seam is
  const zoneHere = zoneAt(A, s.dist + PLAYER_SX * FP);
  // BHF level 6 only (skin.mirror): the way back is the same world drawn right to left. Drawing only: the sim still runs left to right.
  // Words drawn inside the world are flipped back (wtext) so they still read; the HUD and the titles are outside this and never flip.
  const mir = !!(zoneHere.mirror && zoneHere.mirror(s, fdist));
  if (mir) { ctx.translate(W, 0); ctx.scale(-1, 1); }
  const wtext = mir ? (c, str, x, y, op = {}) => { const w = measure(str, op.scale || 1), ax = op.align === 'center' ? x : op.align === 'right' ? x - w / 2 : x + w / 2; c.save(); c.translate(2 * ax, 0); c.scale(-1, 1); drawText(c, str, x, y, op); c.restore(); } : drawText;
  const zL = mir ? zoneHere : zoneAt(A, s.dist), zR = mir ? zoneHere : zoneAt(A, s.dist + W * FP);
  const bIdx = zoneOf(s.dist + W * FP), seam = zL === zR ? W : Math.round((bIdx * ZONE_PX * FP - s.dist) / FP);
  const zi = zoneOf(s.dist + PLAYER_SX * FP);
  if (zi !== v.lastZone && !o.idle) { v.lastZone = zi; const tt = 150; v.big = { pre: (s.lap ? 'LOOP ' + (s.lap + 1) + '  ' : '') + 'LEVEL ' + (zi + 1), lines: splitName(zoneHere.name), t: tt, total: tt, fill: zoneHere.titleFill || GRAD.gold }; }   // every zone title clears after 80 frames, before the hazards arrive

  const clip = (x0, x1, fn) => { if (x1 <= x0) return; ctx.save(); ctx.beginPath(); ctx.rect(x0, -20, x1 - x0, H + 40); ctx.clip(); fn(); ctx.restore(); };
  const both = (fn) => { clip(-10, seam, () => fn(zL)); if (seam < W) clip(seam, W + 10, () => fn(zR)); };
  const tiled = (img, fx, y, comp = 0) => { const off = q((((fdist * fx) % img.width) + img.width) % img.width); for (let x = -off + comp; x < W + comp + 1; x += img.width) ctx.drawImage(img, x, y); };

  // 1. backdrop layers (parallax in x and y)
  both((z) => {
    ctx.drawImage(z.sky, 0, Math.round(-cam * 0.25));
    if (!z.noBlimp && !mir) drawBlimp(ctx, z, s.tick || 0, cam);   // the VOLLEBAK blimp, far off in the sky now and then (a level with no open sky sets noBlimp)
    if (z.lightning) {
      if (v.lightning > 0) { ctx.fillStyle = `rgba(210,180,255,${v.lightning / 16})`; ctx.fillRect(0, 0, W, H); if (v.bolt) drawBolt(ctx, v.bolt, -cam * 0.25); v.lightning--; }
      else if (Math.random() < 0.0025 && !o.idle) { v.lightning = 12; v.bolt = makeBolt(); }
    }
    if (z.far) { tiled(z.far, 0.06, Math.round(z.farY - cam * 0.35)); if (z.volcano) erupt(ctx, v, z, fdist, cam); }
    tiled(z.mid, 0.22, Math.round(z.midY - cam * 0.55));
    if (z.torches) torches(ctx, f, fdist, z.midY - cam * 0.55);
    tiled(z.near, 0.5, Math.round(-cam * 0.8));
    if (z.backFx) z.backFx(ctx, f, fdist, cam, s);   // BHF: a level's own live backdrop (signs flickering, things flying past), screen space, behind the wall
  });

  // 2. arcade (world speed). From here to the hero everything is world-attached: slide it by the fraction
  ctx.translate(-frac, 0);
  both((z) => { tiled(z.arcade, 1, Y(z.arcadeTop ?? 96), frac); wallFx(ctx, z, dist, Y, f); if (z.sceneFx) z.sceneFx(ctx, s, Y, f); });   // sceneFx: a level that draws its whole wall itself (level 6)
  drawDecals(ctx, s, A, Y, f);   // Vollebak logos on the walls (graffiti, signs, banners)

  // gate at zone boundaries hides the seam
  const gateX = Math.round((zoneOf(s.dist + (W + 40) * FP) * ZONE_PX * FP - s.dist) / FP);
  if (false) drawGate(ctx, gateX, Y, zoneAt(A, (zoneOf(s.dist + (W + 40) * FP)) * ZONE_PX * FP), f);

  // 3. gallery unicorns + pipes (attached to the gallery)
  for (const p of s.pipes) drawPipe(ctx, Math.round((p.x - s.dist) / FP), Y, ((s.tick + p.phase) % p.period) / p.period, zoneAt(A, p.x), f);
  for (const u of s.unicorns) if (u.kind === 'gallery') drawUnicorn(ctx, A, u, s, Y, f);

  // 4. pit (palette-cycled), then deck with holes
  both((z) => { if (z.pitFx) return z.pitFx(ctx, s, Y, f); const pf = z.pit[(f >> 3) % 8]; const off = Math.floor(dist) % pf.width; for (let x = -off; x < W; x += pf.width) ctx.drawImage(pf, x, Y(LAVA_Y) - (z.pitUp || 0)); });
  const holes = s.gaps.map((g) => [Math.round((g.x - s.dist) / FP), Math.round((g.x + g.w - s.dist) / FP)]).filter(([a, b]) => b > -4 && a < W + 4).sort((p, q) => p[0] - q[0]);
  const solids = []; let cur = -20;
  for (const [a, b] of holes) { if (a > cur) solids.push([cur, a]); cur = Math.max(cur, b); }
  if (cur < W + 20) solids.push([cur, W + 20]);
  for (const [a, b] of solids) {
    ctx.save(); ctx.beginPath(); ctx.rect(a, Y(DECK_Y) - 1, b - a, H); ctx.clip();
    both((z) => (z.deckFx ? z.deckFx(ctx, s, Y, f) : tiled(z.deck, 1, Y(DECK_Y), frac)));
    ctx.restore();
  }
  // the edges of every gap: a lit broken face on the floor's end and a shadow falling into the hole,
  // so a gap never reads as more floor
  for (const [a, b] of holes) {
    const zh = zoneAt(A, s.dist + ((a + b) / 2) * FP), P = zh.P || {}, top = Y(DECK_Y), depth = zh.style === 'bridge' ? 10 : 40;
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(a, top, Math.min(3, b - a), 12); ctx.fillRect(Math.max(a, b - 3), top, Math.min(3, b - a), 12);
    for (const [ex, dir] of [[a - 1, -1], [b, 1]]) {
      for (let j = 0; j < depth; j++) {
        const jag = (j * 5 + ex) % 3 === 0 ? dir : 0;
        ctx.fillStyle = j === 0 ? '#ffffff' : j < 3 ? P.hi || '#a0a0b8' : P.dark || '#30304a'; ctx.fillRect(ex + jag, top + j, 1, 1);
        if (j < depth - 2) { ctx.fillStyle = '#05040a'; ctx.fillRect(ex + jag - dir, top + j + 2, 1, 1); }
      }
    }
  }

  both((z) => { if (z.gradeFx) z.gradeFx(ctx, s, Y, f); });   // a level's own colour wash over the scenery, under everything that plays (level 6: warm out, cold back)
  // heat haze over the pit
  const hy0 = zoneHere.haze ? Math.max(0, Y(LAVA_Y) - 24) : H, hy1 = Math.min(H, Y(LAVA_Y) + 4);
  for (let y = hy0; y < hy1; y++) { const d = Math.round(Math.sin(y * 0.5 + f * 0.15) * 1.4); if (d) ctx.drawImage(ctx.canvas, 0, Math.round((y + sy - camF) * K), Math.round(W * K), Math.max(1, Math.round(K)), d - sx + frac, y, W, 1); }

  // 5. platforms: ledges, floating steps, movers, crumbling stones
  for (const p of s.plats) if (!p.gone || (p.fallT || 0) < 40) drawPlat(ctx, p, s, Y, zoneAt(A, p.x), f);

  // BHF: each level's own dangers (danger.js): vents in the floor, squalls overhead
  const fxOf = (wx) => { const z = zoneAt(A, wx); return [z, z.fx || {}]; };
  for (const vt of s.vents) {
    const x = Math.round((vt.x - s.dist) / FP); if (x < -20 || x > W + 20) continue;
    const c = (s.tick + vt.phase) % vt.period, on = c < vt.on, [z, fx] = fxOf(vt.x);
    (fx.vent || FX.vent)(ctx, x, Y(vt.y / FP), { on, c, h: on ? Math.min(vt.h, 8 + c * 9) : 0, warn: !on && c >= vt.period - VENT_WARN ? (c - (vt.period - VENT_WARN) + 1) / VENT_WARN : 0 }, f, z);
  }
  for (const c of s.clouds) {
    const x0 = Math.round((c.x - s.dist) / FP), x1 = Math.round((c.x + c.w - s.dist) / FP); if (x1 < -10 || x0 > W + 10) continue;
    const [z, fx] = fxOf(c.x); (fx.cloud || FX.cloud)(ctx, x0, x1, Y(SKY_Y), f, z);
  }

  // 6. puddles, crates, pickups, enemies, projectiles
  for (const p of s.puddles) { const zp = zoneAt(A, p.x); if (p.shard) { ((zp.fx || {}).shard || FX.shard)(ctx, Math.round((p.x - s.dist) / FP), Y(p.y / FP), Math.round(p.w / FP), f, zp); continue; } drawPuddle(ctx, Math.round((p.x - s.dist) / FP), Math.round(p.w / FP), Y(p.y / FP), f, p.id, zp.puddle || (p.pipe ? DRIP_LOOK[zp.style] : null)); }
  for (const b of s.blocks) {
    const x = Math.round((b.x - s.dist) / FP); if (x < -20 || x > W + 4) continue;
    const y = Y((b.y ?? BLOCK_BOTTOM * FP) / FP - BLOCK) - (b.bump > 0 ? Math.round(Math.sin((b.bump / 8) * Math.PI) * 4) : 0);
    // a chrome Vollebak V spinning in the air (dull and still once it's been bonked)
    const fr = b.used ? A.chr.vboxUsed : A.chr.vbox[((f >> 2) + b.id) % A.chr.vbox.length];
    spr(ctx, fr, x + 8, y + 8 + (b.used ? 0 : Math.round(Math.sin((f + b.id * 7) / 12))));
    if (!b.used && (f + b.id * 11) % 50 < 6) { const k = (f + b.id * 11) % 50, sx = x + 3 + ((b.id * 5) % 10), sy = y + 2; ctx.fillStyle = '#ffffff'; ctx.fillRect(sx - (k >> 1), sy, k + 1, 1); ctx.fillRect(sx, sy - (k >> 1), 1, k + 1); }
  }
  for (const p of s.pickups) {
    const x = Math.round((p.x - s.dist) / FP), y = Y(p.y / FP) + Math.round(Math.sin((f + p.id * 9) / 9) * 1.5);
    if (x < -16 || x > W + 16) continue;
    if (p.kind === 'token') { const sets = COINS[zoneAt(A, p.x).key]; if (sets) ctx.drawImage(sets[p.id % sets.length][((f >> 2) + p.id) % 6], x - 6, y - 6); else ctx.drawImage(A.spr.coin[((f >> 2) + p.id) % 6], x - 5, y - 5); }
    else if (p.kind === 'hole') {                             // the black hole coin: light spiralling into it, so you can't miss it
      if (p.taken) continue;
      for (let r = 14; r > 8; r -= 2) { ctx.globalAlpha = 0.1; ctx.fillStyle = '#ffd21a'; ctx.fillRect(x - r, y - r + 2, r * 2, r * 2 - 4); ctx.fillRect(x - r + 2, y - r, r * 2 - 4, r * 2); } ctx.globalAlpha = 1;
      for (let k = 0; k < 6; k++) { const t = (f * 2 + k * 11) % 44, a = k * 1.05 + t * 0.16, rr = 20 - t * 0.4; ctx.fillStyle = k % 2 ? '#ffffff' : '#ffd21a'; ctx.fillRect(Math.round(x + Math.cos(a) * rr), Math.round(y + Math.sin(a) * rr * 0.8), 1, 1); }
      ctx.drawImage(HOLE_COIN[(f >> 2) % 8], x - 8, y - 8);
    }
    else if (p.kind === 'ride') { const [z, fx] = fxOf(p.x); (fx.ride || FX.ride)(ctx, x, Y(DECK_Y), f, z); }
    else {
      // spinning trench coat with a soft pulsing glow
      const i = ((f >> 2) + p.id) % 12, fr = A.chr.jacketSpin[i];
      if ((f >> 4) % 2) { ctx.globalAlpha = 0.55; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) spr(ctx, A.chr.jacketGlow[i], x + dx, y + 13 + dy); ctx.globalAlpha = 1; }
      spr(ctx, fr, x, y + 13);
    }
  }
  for (const g of s.goblins) {
    const x = Math.round((g.x - s.dist) / FP), y = Y(g.y / FP);
    if (x < -30 || x > W + 30) continue;
    const moving = g.active && !g.stun;
    const squash = g.stomped ? 0.35 : 1;
    if (g.kind === 'gunner') {
      const G = A.chr.gunner || DCHR.gunner, [z, fx] = fxOf(g.x), by = y - 9, rev = g.hole !== undefined;
      if (rev && !g.dead) {
        const hx = Math.round((g.hole - s.dist) / FP), k = Math.max(0, Math.min(1, 1 - (hx - PLAYER_SX) / 160));
        if (!g.fired) (fx.aim || FX.aim)(ctx, Math.max(hx, -4), x - 8, by, f, k, z);
        (fx.hole || FX.hole)(ctx, hx, by, f, g.fired ? 0 : k, z);
      } else if (g.aim > 0 && !g.dead) (fx.aim || FX.aim)(ctx, -4, x - 10, by, f, 1 - g.aim / 24, z);
      spr(ctx, g.dead ? G.idle : g.flash > 0 ? G.fire : g.aim > 0 || (rev && !g.fired) ? G.aim : G.idle, x, y, squash);
    } else if (g.kind === 'dropper') {
      const G = A.chr.dropper || DCHR.dropper, wob = g.hang && g.wob > 0 ? ((f >> 1) % 2) * 2 - 1 : 0;
      spr(ctx, g.hang ? G.hang : g.falling ? G.fall : g.air ? G.leap || G.fall : G.run[(f >> 2) % G.run.length], x + wob, y, g.hang ? 1 : squash);
    } else if (g.kind === 'backer') { const G = A.chr.backer || A.chr.grunt; spr(ctx, G[moving ? (f >> 2) % G.length : 0], x, y, squash); }
    else if (g.kind === 'brute') {
      const puking = moving && g.t % 84 < 16 && g.x - s.dist < (W - 10) * FP;
      const fr = g.stun ? A.chr.bruteDizzy : puking ? A.chr.brutePuke[(f >> 2) % A.chr.brutePuke.length] : A.chr.brute[moving ? (f >> 3) % A.chr.brute.length : 0];
      spr(ctx, fr, x, y, squash);
      if (g.stun) for (let i = 0; i < 3; i++) { const a = f / 6 + i * 2.1; wtext(ctx, '*', x - 3 + Math.round(Math.cos(a) * 8), y - 40 + Math.round(Math.sin(a) * 2), { fill: GRAD.gold, outline: '#000' }); }
    } else if (g.kind === 'ghoul') spr(ctx, g.air ? (g.vy < 0 ? A.chr.ghoul.leap : A.chr.ghoul.land) : A.chr.ghoul.sit, x, y, squash);
    else if (g.kind === 'slime') { const S = g.small ? A.chr.slimeSmall : A.chr.slime; spr(ctx, g.air ? (g.vy < 0 ? S.up : S.down) : (f >> 3) % 2 ? S.sit : S.sit2, x, y, squash); }
    else if (g.kind === 'scientist') { const B = g.shoe === 1; spr(ctx, moving && g.t % 96 >= 22 && g.t % 96 < 38 ? (B ? A.chr.scientistThrowB : A.chr.scientistThrow) : (B ? A.chr.scientistB : A.chr.scientist)[moving ? (f >> 1) % 6 : 0], x, y, squash); }
    else if (g.kind === 'biker') {
      spr(ctx, A.chr.biker[moving ? (f >> 1) % A.chr.biker.length : 0], x, y, squash);
      if (moving && !g.stomped && f % 3 === 0) v.parts.push({ x: x + 22, y: y - 2, vx: 0.8 + Math.random(), vy: -0.3 - Math.random() * 0.4, t: 18, c: Math.random() < 0.5 ? '#8a8aa8' : '#5a5468' });
    }
    else { const G = g.kind === 'puker' ? A.chr.puker : A.chr.gruntAlt && g.id % 2 ? A.chr.gruntAlt : A.chr.grunt; spr(ctx, G[moving ? (f >> 2) % G.length : 0], x, y, squash); }
  }
  for (const fl of s.flyers) {
    const x = Math.round((fl.x - s.dist) / FP), y = Y(fl.y / FP);
    if (x < -40 || x > W + 40 || !fl.active) continue;
    if (zoneHere.drawFlyer && zoneHere.drawFlyer(ctx, fl, x, y, f, s)) continue;   // a level may draw its own flyers (return true if it did). Drawing only: never change fl or s.
    if (fl.kind === 'seeker') { const G = A.chr.seeker || DCHR.seeker; if (fl.dead && fl.t > 10) continue; spr(ctx, G[fl.lock ? G.length - 1 : (f >> 3) % Math.max(1, G.length - 1)], x, y); }
    else if (fl.kind === 'bat') { if (A.chr.batF) spr(ctx, fl.dead ? A.chr.batFlashF : A.chr.batF[(f >> 2) % A.chr.batF.length], x, y); else ctx.drawImage(fl.dead ? A.spr.batFlash : A.spr.bat[(f >> 2) % 2], x - 9, y - 5); }
    else {
      if (fl.dead && fl.t > 8) continue;
      spr(ctx, fl.dead ? (A.chr.flyFlash || A.chr.unicornFlash) : A.chr.unicornFly[(f >> 3) % A.chr.unicornFly.length], x, y + 12);
    }
  }
  for (const u of s.unicorns) if (u.kind === 'ground') drawUnicorn(ctx, A, u, s, Y, f);
  for (const b of s.blobs) {
    const x = Math.round((b.x - s.dist) / FP), y = Y(b.y / FP);
    if (b.flask) { drawFlask(ctx, x, y, ((f >> 2) + b.id) % 4); continue; }
    if (zoneAt(A, b.x).drawBlob) { zoneAt(A, b.x).drawBlob(ctx, x, y, f, b); continue; }
    const zb = zoneAt(A, b.x), [c0, c1, c2] = b.bile ? (zb.bile || ['#3c7a22', '#7aff4a', '#e0ffd0']) : (zb.blob || ['#c21fa0', '#ff4fd8', '#ffd0f4']);
    ctx.fillStyle = '#000'; ctx.fillRect(x - 3, y - 3, 7, 7);
    ctx.fillStyle = c0; ctx.fillRect(x - 3, y - 2, 6, 5); ctx.fillRect(x - 2, y - 3, 4, 7);
    ctx.fillStyle = c1; ctx.fillRect(x - 2, y - 2, 4, 4);
    ctx.fillStyle = c2; ctx.fillRect(x - 1, y - 2, 1, 1);
  }
  for (const b of s.shots) { const [z, fx] = fxOf(b.x); (fx.shot || FX.shot)(ctx, Math.round((b.x - s.dist) / FP), Y(b.y / FP), f, b, z); }
  for (const d of s.drips) {
    const x = Math.round((d.x - s.dist) / FP), y = Y(d.y / FP), look = zoneAt(A, d.x).drip || DRIP_LOOK[zoneAt(A, d.x).style];
    if (d.sky) {
      const [z, fx] = fxOf(d.tx), mx = Math.round((d.tx - s.dist) / FP);
      if (d.hot) (fx.mark || FX.mark)(ctx, mx, Y(DECK_Y), f, Math.max(0, Math.min(1, (d.y / FP - SKY_Y) / (DECK_Y - SKY_Y))), z);
      (fx.drop || FX.drop)(ctx, x, y, f, d, z); continue;
    }
    if (look) {             // tar / boiling oil / lava instead of acid
      ctx.fillStyle = '#000'; ctx.fillRect(x - 2, y - 5, 4, 7);
      ctx.fillStyle = look.drop; ctx.fillRect(x - 1, y - 4, 2, 5);
      ctx.fillStyle = look.glint; ctx.fillRect(x - 1, y - 3, 1, 1);
      if (look.flame) { ctx.fillStyle = (f >> 1) % 2 ? '#ffb03a' : '#ff5a1a'; ctx.fillRect(x - 1, y - 7 - ((f >> 2) % 2), 2, 2); }
      continue;
    }
    ctx.fillStyle = '#000'; ctx.fillRect(x - 2, y - 5, 4, 7);
    ctx.fillStyle = '#ff4fd8'; ctx.fillRect(x - 1, y - 4, 2, 5);
    ctx.fillStyle = '#ffd0f4'; ctx.fillRect(x - 1, y - 3, 1, 1);
  }

  ctx.translate(frac, 0);
  // 7. hero with afterimage trail
  const heroVisible = !(s.dead && s.cause === 'fell' && feet > LAVA_Y + 10);
  const hero = (zoneHere.heroFx && zoneHere.heroFx(A.chr.hero, s)) || A.chr.hero;
  const flash = s.invuln > 0 && (s.invuln >> 2) % 2 === 0;
  const runI = Math.floor(dist / 5) % 8;
  const frame = (fl) => (s.onGround ? (fl ? hero.runFlash : hero.run)[runI] : s.vy < 0 ? (fl ? hero.jumpFlash : hero.jump) : (fl ? hero.fallFlash : hero.fall));
  const hy = Y(feet);
  if (v.trailOn > 0) { v.trailOn--; v.trail.push({ fr: frame(true), y: hy }); } else if (v.trail.length) v.trail.shift();
  if (v.trail.length > 6) v.trail.shift();
  v.trail.forEach((t, i) => { ctx.globalAlpha = 0.1 + i * 0.05; spr(ctx, t.fr, PLAYER_SX - (v.trail.length - i) * 3, t.y); });
  ctx.globalAlpha = 1;
  const zfx = zoneHere.fx || {};
  if (s.star > 0 && !(s.ride > 0)) {               // invincible: strobing hero, rainbow sparkles, constant afterimage
    v.trailOn = Math.max(v.trailOn, 2);
    if (f % 2 === 0) { const cols = ['#ff2040', '#ff8a1a', '#ffe14a', '#5fff6a', '#3d9cf5', '#a05aff']; v.parts.push({ x: PLAYER_SX + (Math.random() - 0.5) * 16, y: hy - Math.random() * 30, vx: -1 - Math.random(), vy: -0.4, t: 16, c: cols[(f >> 1) % 6] }); }
  }
  const strobe = s.star > 0 && !(s.ride > 0) && (s.star > 120 ? (f >> 1) % 2 : (f >> 3) % 2);
  if (heroVisible && !o.noHero) {
    if (s.ride > 0) { if (s.ride > 100 || (f >> 2) % 2) (zfx.riding || FX.riding)(ctx, PLAYER_SX, hy, f, s, frame(false), zoneHere); else spr(ctx, frame(false), PLAYER_SX, hy); }
    else spr(ctx, frame(flash || strobe), PLAYER_SX, hy);
    if (s.shield > 0) (zfx.shield || FX.shield)(ctx, PLAYER_SX, hy, f, zoneHere);
  }
  if (s.triple > 0 && !s.onGround && s.jumps < 3 && (f >> 2) % 2) { ctx.fillStyle = '#8ab8f0'; ctx.fillRect(PLAYER_SX - 8, hy + 1, 3, 1); ctx.fillRect(PLAYER_SX + 5, hy + 1, 3, 1); }

  // 8. particles + popups
  for (const p of v.parts) {
    p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.vx *= 0.98; p.t--;
    ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x), Math.round(p.y - (p.world ? cam - 60 : 0)), p.t > 30 ? 2 : 1, p.t > 30 ? 2 : 1);
  }
  v.parts = v.parts.filter((p) => p.t > 0);
  ambient(ctx, v, zoneHere, f, s.speed);

  // 9. foreground silhouettes (faster than the world)
  both((z) => tiled(z.fg, 1.35, Math.round(-cam * 1.1) + 8));
  if (zoneHere.frontFx) zoneHere.frontFx(ctx, f, fdist, cam, s);   // BHF: a level's own live foreground (mist, light shafts), screen space, over everything but the HUD

  // speed lines when fast

  // BHF: the black hole coin paying out: the count over his head, getting bigger and wilder, until he jumps
  if (s.chick) { const val = s.chick.paid, sc = val < 150 ? 1 : val < 700 ? 2 : 3, hot = val >= 700, jx = hot ? ((f * 7) % 3) - 1 : 0, jy = hot ? ((f * 5) % 3) - 1 : 0, ty = Math.max(30, Math.round(hy) - 44 - sc * 8), cx = Math.max(PLAYER_SX + 6, 10 + (String(val).length + 2) * 3 * sc);
    v.chickT = (v.chickT || 0) + 1;
    for (let k = 0; k < 8; k++) { const t = (f * 3 + k * 9) % 36, a = k * 0.8 + t * 0.2, rr = 26 - t * 0.7; ctx.fillStyle = ['#ffffff', '#ffd21a', '#ff2d7a', '#3ae8ff'][k % 4]; ctx.fillRect(Math.round(PLAYER_SX + Math.cos(a) * rr), Math.round(hy - 14 + Math.sin(a) * rr * 0.7), sc > 1 ? 2 : 1, sc > 1 ? 2 : 1); }
    wtext(ctx, '+' + val.toLocaleString('en-US'), cx + jx, ty + jy, { scale: sc, fill: [GRAD.gold, GRAD.pink, GRAD.white, GRAD.gold][(f >> 2) % 4], outline: '#000', shadow: '#3a1a00', align: 'center' });
    if (s.star > 0) wtext(ctx, 'ON HOLD', cx, ty + sc * 7 + 4, { fill: GRAD.blue, outline: '#000', align: 'center' });
    else if ((f >> 3) % 2 || v.chickT < 50) wtext(ctx, v.chickT < 90 ? "DON'T JUMP!" : 'JUMP TO BANK IT', cx, ty + sc * 7 + 4, { fill: v.chickT < 90 ? GRAD.red : GRAD.white, outline: '#000', align: 'center' });
  }
  if (v.banked && v.banked.t > 0) { const b = v.banked; b.t--; if (b.t > 20 || (f >> 1) % 2) { wtext(ctx, 'BANKED', W / 2, 52, { scale: 2, fill: GRAD.white, outline: '#000', shadow: '#000', align: 'center' }); wtext(ctx, '+' + b.val.toLocaleString('en-US'), W / 2, 70, { scale: 3, fill: GRAD.gold, outline: '#000', shadow: '#3a1a00', align: 'center' }); } }
  for (const p of v.popups) { p.t--; p.y -= 0.5; wtext(ctx, p.txt, Math.round(p.x), Math.round(p.y), { fill: p.fill, outline: '#000', align: 'center' }); }
  v.popups = v.popups.filter((p) => p.t > 0);

  // full-screen flash
  if (v.flash > 0) { ctx.globalAlpha = Math.min(0.6, v.flash / 10); ctx.fillStyle = v.flashCol; ctx.fillRect(-10, -10, W + 20, H + 20); ctx.globalAlpha = 1; v.flash--; }
  ctx.restore();

  // end-of-level boss warning: flashing hazard bars
  if (v.boss > 0) {
    v.boss--;
    if ((v.boss >> 3) % 2) {
      for (const by of [36, 60]) for (let i = -8; i < W + 8; i += 8) { ctx.fillStyle = ((i >> 3) + (f >> 2)) % 2 ? '#ffd21a' : '#111'; ctx.fillRect(i, by, 8, 4); }
      drawText(ctx, 'WARNING: THE TWINS', W / 2, 44, { scale: 2, fill: GRAD.red, outline: '#000', align: 'center' });
    }
  }
  // zone transitions + big moments: huge text, letters drop in
  if (v.zoneFx > 0) { ctx.globalAlpha = v.zoneFx / 40; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; v.zoneFx--; }
  if (v.big && v.big.t > 0) {
    const b = v.big; b.t--;
    const age = (b.total || (b.pre ? 150 : b.short ? 120 : 210)) - b.t, out = b.t < 24;
    ctx.globalAlpha = Math.min(0.6, age / 20, b.t / 24); ctx.fillStyle = '#000'; ctx.fillRect(0, 40, W, 92); ctx.globalAlpha = 1;
    let y = 50;
    if (b.pre) { drawText(ctx, b.pre, W / 2, y, { scale: 2, fill: GRAD.pink, outline: '#000', align: 'center' }); y += 20; }
    for (const line of b.lines) {
      const sc = measure(line, 4) <= W - 16 ? 4 : 3;
      const drop = (i) => { const k = age - i * 3; return out ? (24 - b.t) * 4 : k < 0 ? -200 : k < 10 ? -(10 - k) * 6 : 0; };
      drawText(ctx, line, W / 2, y, { scale: sc, fill: b.fill, outline: '#000', shadow: '#3a1a00', align: 'center', wave: drop });
      y += 7 * sc + 6;
    }
    if (b.sub && age > 30) drawText(ctx, b.sub, W / 2, y, { fill: GRAD.white, outline: '#000', align: 'center' });
    if (b.sub2 && age > 60 && (f >> 3) % 2) drawText(ctx, b.sub2, W / 2, y + 11, { fill: GRAD.red, outline: '#000', align: 'center' });
  }
}

function splitName(n) {
  const words = n.split(' '); const lines = []; let cur = '';
  for (const w of words) { if ((cur + ' ' + w).trim().length > 12) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  lines.push(cur); return lines;
}

// ---- pieces ---------------------------------------------------------------
function drawUnicorn(ctx, A, u, s, Y, f) {
  const x = Math.round((u.x - s.dist) / FP), y = Y(u.y / FP);
  if (x < -50 || x > W + 50) return;
  const z = u.kind === 'gallery' && zoneAt(A, u.x);
  if (z && z.style === 'volcano') volcanoPinnacle(ctx, x - 4, Y, z.P, false, 20);   // out here the unicorn stands on a rock
  if (u.dead) { if (u.t < 10) spr(ctx, A.chr.unicornFlash, x, y); return; }
  const every = u.kind === 'gallery' ? 16 : 40;
  const puking = u.fired && u.t % every < 10 && (u.n > 0 || u.t % every < 10);
  spr(ctx, puking ? A.chr.unicornPuke : A.chr.unicorn[(f >> 3) % A.chr.unicorn.length], x, y);
}

function drawFlask(ctx, x, y, r) {   // a tumbling round-bottomed flask of pink acid
  ctx.save(); ctx.translate(x, y); ctx.rotate(r * Math.PI / 2);
  ctx.fillStyle = '#000'; ctx.fillRect(-4, -2, 8, 7); ctx.fillRect(-2, -6, 4, 5);
  ctx.fillStyle = '#cfe8f4'; ctx.fillRect(-3, -1, 6, 5); ctx.fillRect(-1, -5, 2, 4);
  ctx.fillStyle = '#ff4fd8'; ctx.fillRect(-3, 1, 6, 3); ctx.fillStyle = '#ffd0f4'; ctx.fillRect(-2, 1, 1, 1);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-2, -1, 1, 1);
  ctx.restore();
}

// what drops from above in each level (acid on the Bridge and in the Factory)
const DRIP_LOOK = {
  dungeon: { drop: '#14100c', glint: '#ff8a2a', flame: true, pool: ['#0a0806', '#1a140e', '#2a2018'], top: ['#ff5a1a', '#ffb03a'], name: 'tar' },
  castle: { drop: '#d8a020', glint: '#fff3c0', pool: ['#6a4a0a', '#a8781a', '#d8a020'], top: ['#ffe08a', '#d8a020'], steam: true, name: 'oil' },
  volcano: { drop: '#ff7a1a', glint: '#ffe08a', pool: ['#7a1a08', '#c4400e', '#ff7a1a'], top: ['#ffd84a', '#ff8a2a'], name: 'lava' },
};
function drawPipe(ctx, x, Y, prog, z, f) {
  if (x < -140 || x > W + 60) return;
  const look = DRIP_LOOK[z && z.style];
  if (z && z.drawPipe) return z.drawPipe(ctx, x, Y, prog, f);
  if (look) return drawPour(ctx, x, Y, prog, z, f, look);
  const y0 = Y(116);                               // main run, tucked under the gallery
  const x0 = x - 120, x1 = x + 40;
  const tube = (ax, ay, w, h, vertical) => {        // 3-tone cylinder
    ctx.fillStyle = '#000'; ctx.fillRect(ax - 1, ay - 1, w + 2, h + 2);
    const cols = ['#9ad08a', '#5f9a52', '#3f6a3a', '#26421f'];
    for (let i = 0; i < (vertical ? w : h); i++) {
      ctx.fillStyle = cols[Math.min(3, Math.floor((i / (vertical ? w : h)) * 4))];
      if (vertical) ctx.fillRect(ax + i, ay, 1, h); else ctx.fillRect(ax, ay + i, w, 1);
    }
  };
  tube(x0, y0, x1 - x0, 5, false);
  for (let fx = x0 + 6; fx < x1; fx += 22) {        // flanges + bolts + brackets
    ctx.fillStyle = '#000'; ctx.fillRect(fx - 1, y0 - 2, 4, 9);
    ctx.fillStyle = '#7a8a70'; ctx.fillRect(fx, y0 - 1, 2, 7);
    ctx.fillStyle = '#c8d4c0'; ctx.fillRect(fx, y0 - 1, 1, 1);
    ctx.fillStyle = '#1a1424'; ctx.fillRect(fx, y0 - 5, 2, 4);
  }
  // elbow + drop pipe to the nozzle
  tube(x - 2, y0 + 4, 5, Y(PIPE_Y) - y0 - 2, true);
  ctx.fillStyle = '#000'; ctx.fillRect(x - 4, Y(PIPE_Y) + 1, 9, 3);
  ctx.fillStyle = '#7a8a70'; ctx.fillRect(x - 3, Y(PIPE_Y) + 1, 7, 2);
  // hazard label + valve wheel
  ctx.fillStyle = '#000'; ctx.fillRect(x - 40, y0 - 1, 12, 7);
  for (let i = 0; i < 10; i++) { ctx.fillStyle = (i >> 1) % 2 ? '#ffd21a' : '#111'; ctx.fillRect(x - 39 + i, y0, 1, 5); }
  ctx.fillStyle = '#000'; ctx.fillRect(x - 15, y0 - 6, 7, 7); ctx.fillStyle = '#d02a3c'; ctx.fillRect(x - 14, y0 - 5, 5, 5); ctx.fillStyle = '#000'; ctx.fillRect(x - 12, y0 - 5, 1, 5); ctx.fillRect(x - 14, y0 - 3, 5, 1);
  // a slow leak at a joint + the growing drop at the nozzle
  ctx.fillStyle = 'rgba(255,79,216,0.35)'; ctx.fillRect(x - 64, y0 + 5, 1, 4);
  const r = Math.floor(prog * 3);
  if (r > 0) { ctx.fillStyle = '#ff4fd8'; ctx.fillRect(x - Math.floor(r / 2), Y(PIPE_Y) + 4, r, r + 1); ctx.fillStyle = '#ffd0f4'; ctx.fillRect(x, Y(PIPE_Y) + 4, 1, 1); }
}

function drawPlat(ctx, p, s, Y, z, f) {
  const x = Math.round((p.cx - s.dist) / FP), w = Math.round(p.w / FP);
  if (x > W + 10 || x + w < -10) return;
  if (z.drawPlat) { let y = Y(p.y / FP); if (p.gone) { p.fallT = (p.fallT || 0) + 1; y += p.fallT * p.fallT * 0.08; } return z.drawPlat(ctx, p, x, y, w, f, Y); }
  if (p.kind === 'ledge') return drawLedge(ctx, x, w, Y, z, f, p.y / FP);
  let y = Y(p.y / FP);
  const P = z.P;
  if (p.kind === 'crumble' && p.crumble > 0) { y += (f % 4 < 2 ? 1 : 0); ctx.save(); ctx.translate((f % 3) - 1, 0); }
  if (p.gone) { p.fallT = (p.fallT || 0) + 1; y += p.fallT * p.fallT * 0.08; ctx.globalAlpha = Math.max(0, 1 - p.fallT / 40); }
  if (p.kind === 'movev' || p.kind === 'moveh') {
    // riveted metal platform with hazard edge and a glowing thruster underneath
    ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 8);
    ctx.fillStyle = '#8a92a8'; ctx.fillRect(x, y, w, 6); ctx.fillStyle = '#c8d0e0'; ctx.fillRect(x, y, w, 1); ctx.fillStyle = '#4a5068'; ctx.fillRect(x, y + 5, w, 1);
    for (let i = 0; i < w; i += 4) { ctx.fillStyle = (i >> 2) % 2 ? '#ffd21a' : '#111'; ctx.fillRect(x + i, y + 3, 4, 2); }
    ctx.fillStyle = '#2a2e40'; ctx.fillRect(x + 2, y + 1, 1, 1); ctx.fillRect(x + w - 3, y + 1, 1, 1);
    const fl = (f >> 2) % 2; ctx.fillStyle = fl ? '#ffb03a' : '#ff6a1a'; ctx.fillRect(x + Math.floor(w / 2) - 2, y + 7, 4, 2 + fl); ctx.fillStyle = '#fff3c0'; ctx.fillRect(x + Math.floor(w / 2) - 1, y + 7, 2, 1);
  } else if (z.style === 'castle' || z.style === 'factory') {
    const wood = z.style === 'castle';
    ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 9);
    if (wood) {           // rough planks lashed with rope
      ctx.fillStyle = '#6a4424'; ctx.fillRect(x, y, w, 7); ctx.fillStyle = '#9a6a3a'; ctx.fillRect(x, y, w, 1); ctx.fillStyle = '#3a2410'; ctx.fillRect(x, y + 6, w, 1);
      for (let i = 7; i < w; i += 8) { ctx.fillStyle = '#3a2410'; ctx.fillRect(x + i, y + 1, 1, 5); ctx.fillStyle = '#c8b090'; ctx.fillRect(x + i - 3, y + 2, 1, 1); }
      for (const rx of [x + 3, x + w - 5]) { ctx.fillStyle = '#c8a060'; ctx.fillRect(rx, y - 1, 2, 9); ctx.fillRect(rx - 1, y + 8, 1, 3); }
    } else {              // steel I-beam with hazard ends
      ctx.fillStyle = '#5a6670'; ctx.fillRect(x, y, w, 7); ctx.fillStyle = '#a8b4c4'; ctx.fillRect(x, y, w, 1); ctx.fillStyle = '#2a3440'; ctx.fillRect(x, y + 3, w, 1); ctx.fillRect(x, y + 6, w, 1);
      for (let i = 4; i < w - 2; i += 6) { ctx.fillStyle = '#c8d4e0'; ctx.fillRect(x + i, y + 1, 1, 1); ctx.fillRect(x + i, y + 4, 1, 1); }
      for (const hx of [x, x + w - 6]) for (let i = 0; i < 6; i++) { ctx.fillStyle = ((i >> 1) + (hx === x ? 0 : 1)) % 2 ? '#ffd21a' : '#111'; ctx.fillRect(hx + i, y + 4, 1, 2); }
    }
    if (p.kind === 'crumble') { ctx.fillStyle = '#000'; for (let i = 3; i < w - 2; i += 7) { ctx.fillRect(x + i, y + 2, 1, 3); ctx.fillRect(x + i + 1, y + 4, 1, 3); } }
  } else {
    // floating stone block (cracked if it's going to crumble)
    ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 11);
    ctx.fillStyle = P.base; ctx.fillRect(x, y, w, 9);
    ctx.fillStyle = P.hi; ctx.fillRect(x, y, w, 1); ctx.fillStyle = P.top; ctx.fillRect(x, y + 1, w, 1);
    ctx.fillStyle = P.deep; ctx.fillRect(x, y + 8, w, 1);
    for (let i = 6; i < w; i += 10) { ctx.fillStyle = P.deep; ctx.fillRect(x + i, y + 2, 1, 6); }
    ctx.fillStyle = P.dark; ctx.fillRect(x + 2, y + 9, w - 4, 2); ctx.fillRect(x + 5, y + 11, w - 10, 2);
    if (p.kind === 'crumble') { ctx.fillStyle = '#000'; for (let i = 3; i < w - 2; i += 7) { ctx.fillRect(x + i, y + 2, 1, 3); ctx.fillRect(x + i + 1, y + 4, 1, 3); } }
    if (z.style === 'volcano') {   // basalt with a glowing seam and a lava drip
      ctx.fillStyle = (f >> 3) % 2 ? '#ff7a1a' : '#ffb03a'; for (let i = 2; i < w - 2; i++) if ((i * 7) % 11 < 3) ctx.fillRect(x + i, y + 4 + ((i >> 2) % 2), 1, 1);
      const d = (f + p.id * 9) % 40; if (d < 20) { ctx.fillStyle = '#ff7a1a'; ctx.fillRect(x + (w >> 1), y + 13 + (d >> 2), 1, 2); }
    } else if (z.style === 'dungeon') {   // iron straps
      for (const sx of [x + 3, x + w - 6]) { ctx.fillStyle = '#18181e'; ctx.fillRect(sx, y, 3, 9); ctx.fillStyle = '#6a6a80'; ctx.fillRect(sx + 1, y + 2, 1, 1); ctx.fillRect(sx + 1, y + 6, 1, 1); }
    }
  }
  ctx.globalAlpha = 1;
  if (p.kind === 'crumble' && p.crumble > 0) ctx.restore();
}

function drawLedge(ctx, x, w, Y, z, f, ly = LEDGE_Y) {
  if (x > W + 10 || x + w < -10) return;
  const P = z.P, y = Y(ly), st = z.style;
  // hung from the gallery: chains, ropes (castle) or steel cables (factory)
  for (const cx of [x + 6, x + w - 7]) {
    if (st === 'castle') { ctx.fillStyle = '#05040a'; ctx.fillRect(cx - 1, Y(118), 3, y - Y(118)); ctx.fillStyle = '#a07a40'; for (let yy = Y(118); yy < y; yy++) ctx.fillRect(cx - ((yy >> 1) % 2), yy, 1, 1); }
    else if (st === 'factory') { ctx.fillStyle = '#05040a'; ctx.fillRect(cx, Y(118), 2, y - Y(118)); ctx.fillStyle = '#8a96a6'; ctx.fillRect(cx, Y(118), 1, y - Y(118)); }
    else if (st === 'volcano') continue;      // outdoors: rock shelves just float on the heat
    else for (let yy = Y(118); yy < y; yy += 4) { ctx.fillStyle = '#05040a'; ctx.fillRect(cx - 1, yy, 3, 3); ctx.fillStyle = st === 'volcano' && (yy >> 2) % 3 === 0 ? '#ff5a1a' : z.chain; ctx.fillRect(cx, yy + 1, 1, 1); }
  }
  if (st === 'volcano') {                // a slab of basalt with a ragged underside and glowing seam
    ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 10);
    ctx.fillStyle = P.base; ctx.fillRect(x, y, w, 8); ctx.fillStyle = P.hi; ctx.fillRect(x, y, w, 1);
    for (let i = 0; i < w; i++) { const d = 2 + Math.round(Math.abs(Math.sin((i + x * 0) / 4)) * 5 * Math.sin((i / w) * Math.PI)); ctx.fillStyle = '#000'; ctx.fillRect(x + i, y + 8, 1, d + 1); ctx.fillStyle = P.dark; ctx.fillRect(x + i, y + 8, 1, d); }
    ctx.fillStyle = (f >> 3) % 2 ? '#ff7a1a' : '#ffb03a'; for (let i = 3; i < w - 3; i++) if ((i * 7) % 13 < 3) ctx.fillRect(x + i, y + 4 + ((i >> 3) % 2), 1, 1);
    return;
  }
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, 10);
  ctx.fillStyle = P.base; ctx.fillRect(x, y, w, 8);
  ctx.fillStyle = P.hi; ctx.fillRect(x, y, w, 1);
  ctx.fillStyle = P.top; ctx.fillRect(x, y + 1, w, 1);
  ctx.fillStyle = P.deep; ctx.fillRect(x, y + 7, w, 1);
  for (let i = 8; i < w; i += 12) { ctx.fillStyle = P.deep; ctx.fillRect(x + i, y + 2, 1, 5); }
  // underside brackets + hanging lantern
  ctx.fillStyle = P.dark;
  for (let i = 4; i < w - 6; i += 24) { ctx.fillRect(x + i, y + 8, 6, 2); ctx.fillRect(x + i + 2, y + 10, 2, 2); }
  const lx = x + Math.floor(w / 2);
  if (st === 'dungeon') {          // a little cage with a skull in it
    ctx.fillStyle = '#000'; ctx.fillRect(lx, y + 8, 1, 3); for (let i = -3; i <= 3; i += 2) ctx.fillRect(lx + i, y + 11, 1, 8); ctx.fillRect(lx - 3, y + 11, 7, 1); ctx.fillRect(lx - 3, y + 19, 7, 1);
    ctx.fillStyle = '#d8d0b8'; ctx.fillRect(lx - 1, y + 15, 3, 3); ctx.fillStyle = '#000'; ctx.fillRect(lx - 1, y + 16, 1, 1); ctx.fillRect(lx + 1, y + 16, 1, 1);
  } else if (st === 'factory') {   // rotating amber warning beacon
    ctx.fillStyle = '#000'; ctx.fillRect(lx - 2, y + 8, 5, 5); ctx.fillStyle = (f >> 3) % 2 ? '#ffb03a' : '#7a4a10'; ctx.fillRect(lx - 1, y + 9, 3, 3);
    if ((f >> 3) % 2) { ctx.globalAlpha = 0.25; ctx.fillStyle = '#ffb03a'; ctx.fillRect(lx - 8, y + 6, 17, 9); ctx.globalAlpha = 1; }
  } else if (st === 'volcano') {   // molten drips instead of a lantern
    const d = (f + x) % 36; ctx.fillStyle = '#ff7a1a'; ctx.fillRect(lx, y + 8, 1, 2); if (d < 18) ctx.fillRect(lx, y + 11 + (d >> 1), 1, 2);
  } else {
    ctx.fillStyle = '#000'; ctx.fillRect(lx, y + 8, 1, 4); ctx.fillRect(lx - 2, y + 12, 5, 5);
    ctx.fillStyle = (f >> 2) % 3 ? '#ffb03a' : '#ffe08a'; ctx.fillRect(lx - 1, y + 13, 3, 3);
  }
}

// dungeon/castle: a cauldron on the gallery tips through a murder-hole; volcano: a glowing crack in the shelf
function drawPour(ctx, x, Y, prog, z, f, look) {
  const P = z.P, py = Y(PIPE_Y);
  if (z.style === 'volcano') {
    volcanoPinnacle(ctx, x - 14, Y, P, true);
    ctx.fillStyle = '#ff7a1a'; ctx.fillRect(x - 6, Y(110), 9, 2); ctx.fillStyle = '#ffd84a'; ctx.fillRect(x - 4, Y(110), 4, 1);   // lava welling up on top
    ctx.fillStyle = '#ff7a1a'; ctx.fillRect(x - 1, Y(119), 2, py - Y(119) + 1);
  } else {
    // stone murder-hole jutting from the wall under the gallery
    ctx.fillStyle = '#000'; ctx.fillRect(x - 7, Y(117), 15, py - Y(117) + 3);
    ctx.fillStyle = P.base; ctx.fillRect(x - 6, Y(117), 13, py - Y(117) + 1); ctx.fillStyle = P.hi; ctx.fillRect(x - 6, Y(117), 13, 1);
    ctx.fillStyle = '#05040a'; ctx.fillRect(x - 2, py, 5, 2);
    // the cauldron up on the gallery, tipped towards you, fire or steam
    const cx = x - 4, cy = Y(GALLERY_Y) - 6;            // pot raised on legs over its fire
    ctx.fillStyle = '#000'; ctx.fillRect(cx - 7, cy, 2, 6); ctx.fillRect(cx + 6, cy, 2, 6);
    if (look.flame || look.steam) for (let i = -4; i <= 4; i += 2) { const h = 2 + (((f >> 2) + i * 7) & 3); ctx.fillStyle = '#ff5a1a'; ctx.fillRect(cx + i, cy + 6 - h, 2, h); ctx.fillStyle = '#ffd04a'; ctx.fillRect(cx + i, cy + 5, 1, 1); }
    ctx.fillStyle = '#000'; ctx.fillRect(cx - 9, cy - 11, 19, 12);
    ctx.fillStyle = '#2a2a34'; ctx.fillRect(cx - 8, cy - 10, 17, 10); ctx.fillStyle = '#4a4a5c'; ctx.fillRect(cx - 8, cy - 10, 17, 1); ctx.fillRect(cx - 8, cy - 9, 2, 8);
    ctx.fillStyle = '#000'; ctx.fillRect(cx - 6, cy, 13, 1);
    ctx.fillStyle = look.pool[look.flame ? 1 : 2]; ctx.fillRect(cx - 7, cy - 11, 15, 2);
    ctx.fillStyle = look.top[(f >> 3) % 2]; ctx.fillRect(cx - 4 + ((f >> 4) % 6), cy - 11, 2, 1);
    ctx.fillStyle = '#000'; ctx.fillRect(cx + 9, cy - 10, 4, 3); ctx.fillStyle = look.drop; ctx.fillRect(cx + 10, cy - 9, 2, 1);   // spout
    const smoke = look.steam ? '#c8c8d8' : '#3a3440';
    for (let k = 0; k < 3; k++) { const a = ((f >> 1) + k * 14) % 42; ctx.globalAlpha = 0.5 * (1 - a / 42); ctx.fillStyle = smoke; ctx.fillRect(cx - 3 + k * 3 + Math.round(Math.sin((a + k * 9) / 6) * 2), cy - 13 - a / 2, 3, 3); }
    ctx.globalAlpha = 1;
  }
  const r = Math.floor(prog * 3);
  if (r > 0) { ctx.fillStyle = look.drop; ctx.fillRect(x - Math.floor(r / 2), py + 2, r, r + 1); ctx.fillStyle = look.glint; ctx.fillRect(x, py + 2, 1, 1); }
}

function drawPuddle(ctx, x, w, y, f, id, look) {
  if (x > W || x + w < 0) return;
  if (look) {           // a burning tar slick / a pool of hot oil / a lava pool
    ctx.fillStyle = look.pool[0]; ctx.fillRect(x, y - 1, w, 2);
    ctx.fillStyle = look.pool[1]; ctx.fillRect(x + 1, y - 2, w - 2, 2);
    for (let i = 2; i < w - 2; i += 2) { ctx.fillStyle = look.pool[((i >> 1) + (f >> 3)) % 2 + 1]; ctx.fillRect(x + i, y - 2, 2, 1); }
    if (look.flame) for (let i = 2; i < w - 2; i += 4) { const h = 1 + (((f >> 2) + i + id) % 4); ctx.fillStyle = h > 2 ? '#ffb03a' : '#ff5a1a'; ctx.fillRect(x + i, y - 2 - h, 2, h); }
    else if (look.steam) { const a = (f + id * 7) % 30; ctx.globalAlpha = 0.4 * (1 - a / 30); ctx.fillStyle = '#e0e0f0'; ctx.fillRect(x + (w >> 1) - 1, y - 4 - (a >> 1), 3, 2); ctx.globalAlpha = 1; }
    else { const b = (f + id * 13) % 30; if (b < 8) { ctx.fillStyle = look.top[0]; ctx.fillRect(x + 3 + (id * 7) % Math.max(1, w - 6), y - 3 - (b >> 2), 1, 1); } }
    return;
  }
  const cyc = ['#ff4fd8', '#ff8ae6', '#ff4fd8', '#c21fa0'];
  ctx.fillStyle = '#7a0a5a'; ctx.fillRect(x, y - 1, w, 2);
  ctx.fillStyle = '#c21fa0'; ctx.fillRect(x + 1, y - 2, w - 2, 2);
  for (let i = 2; i < w - 2; i += 2) { ctx.fillStyle = cyc[((i >> 1) + (f >> 3)) % 4]; ctx.fillRect(x + i, y - 2, 2, 1); }
  const b = (f + id * 13) % 40;
  if (b < 8) { ctx.fillStyle = '#ffd0f4'; ctx.fillRect(x + 3 + (id * 7) % Math.max(1, w - 6), y - 3 - (b >> 2), 1, 1); }
}

function drawGate(ctx, x, Y, z, f) {
  const P = z.P, top = Y(52), bot = Y(DECK_Y);
  ctx.fillStyle = '#000'; ctx.fillRect(x - 22, top - 1, 44, bot - top + 1);
  ctx.fillStyle = P.base; ctx.fillRect(x - 21, top, 42, bot - top);
  ctx.fillStyle = P.hi; ctx.fillRect(x - 21, top, 2, bot - top);
  ctx.fillStyle = P.deep; ctx.fillRect(x + 18, top, 3, bot - top);
  for (let yy = top + 4; yy < bot; yy += 7) { ctx.fillStyle = P.deep; ctx.fillRect(x - 21, yy, 42, 1); }
  for (let i = -21; i < 21; i += 6) { ctx.fillStyle = P.base; ctx.fillRect(x + i, top - 6, 4, 6); }
  // the opening the runner passes through, in the style of the level ahead
  const ay = Y(150), st = z.style;
  ctx.fillStyle = '#05040a';
  if (st === 'bridge') for (let yy = ay - 6; yy < bot; yy++) { const d = ay + 15 - yy, half = d > 0 ? Math.floor(Math.sqrt(Math.max(0, 576 - d * d)) - 12) : 12; if (half > 0) ctx.fillRect(x - half, yy, half * 2, 1); }
  else if (st === 'volcano') for (let yy = ay - 2; yy < bot; yy++) { const half = Math.min(12, Math.floor((yy - ay + 4) * 0.8) + ((yy * 7) % 3)); ctx.fillRect(x - half, yy, half * 2, 1); }
  else { ctx.fillRect(x - 12, ay, 24, bot - ay); ctx.fillStyle = P.hi; ctx.fillRect(x - 14, ay - 3, 28, 3); }
  if (st === 'dungeon' || st === 'castle') { for (let i = -11; i < 12; i += 4) { ctx.fillStyle = '#3a3a4c'; ctx.fillRect(x + i, ay, 2, 12); ctx.fillRect(x + i, ay + 12, 1, 3); } ctx.fillRect(x - 12, ay + 4, 24, 1); ctx.fillRect(x - 12, ay + 9, 24, 1); }  // raised portcullis
  if (st === 'factory') for (let i = -12; i < 12; i++) for (let j = 0; j < 3; j++) { ctx.fillStyle = ((i + j) >> 1) % 2 ? '#ffd21a' : '#111'; ctx.fillRect(x + i, ay - 3 + j, 1, 1); }
  if (st === 'volcano') { ctx.fillStyle = '#ff5a1a'; for (let yy = ay + 4; yy < bot; yy += 3) { ctx.fillRect(x - 13, yy, 1, 2); ctx.fillRect(x + 12, yy + 1, 1, 2); } }
  // torches either side
  for (const tx of [x - 17, x + 15]) { ctx.fillStyle = (f >> 2) % 2 ? '#ffb03a' : '#ff6a1a'; ctx.fillRect(tx, Y(140), 3, 4); ctx.fillStyle = '#ffe08a'; ctx.fillRect(tx + 1, Y(141), 1, 2); }
  // banner
  ctx.fillStyle = '#d82a3a'; ctx.fillRect(x - 8, top + 10, 16, 26); ctx.fillStyle = '#8a1420'; ctx.fillRect(x - 8, top + 36, 4, 3); ctx.fillRect(x + 4, top + 36, 4, 3);
  drawText(ctx, 'V', x - 2, top + 18, { fill: GRAD.gold, outline: '#000' });
}

// live details on the level's wall: wall torches (dungeon), lava falls (volcano)
function wallFx(ctx, z, dist, Y, f) {
  const tw = z.arcade.width, off = ((Math.floor(dist) % tw) + tw) % tw;
  for (let base = -off; base < W + tw; base += tw) {
    if (z.wallFx) z.wallFx(ctx, base, Y, f);   // BHF: a level's own live wall details (lights, steam, drips), once per wall tile
    for (const [tx, ty] of z.wallTorches || []) {
      const x = base + tx, y = Y(ty); if (x < -20 || x > W + 20) continue;
      for (let r = 16; r > 0; r -= 4) { ctx.globalAlpha = 0.06; ctx.fillStyle = '#ffb04a'; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
      ctx.globalAlpha = 1; const fl = (f >> 2) % 3;
      ctx.fillStyle = '#ff5a1a'; ctx.fillRect(x - 2, y - 3 - fl, 4, 5 + fl); ctx.fillStyle = '#ffd04a'; ctx.fillRect(x - 1, y - 2 - fl, 2, 4); ctx.fillStyle = '#fff7c0'; ctx.fillRect(x, y, 1, 1);
    }
    for (const [lx, ly] of z.lavaFalls || []) {
      const x = base + lx; if (x < -10 || x > W + 10) continue;
      ctx.fillStyle = '#c4300a'; ctx.fillRect(x - 2, Y(ly), 5, Y(200) - Y(ly)); ctx.fillStyle = '#ff8a2a'; ctx.fillRect(x - 1, Y(ly), 3, Y(200) - Y(ly));
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(x - 3, Y(ly), 7, 1);
      for (let yy = ly + 1; yy < 200; yy += 2) { const k = (yy + f) % 9; if (k < 2) { ctx.fillStyle = k ? '#ffd84a' : '#fff3c0'; ctx.fillRect(x - 1 + ((yy >> 2) % 2), Y(yy), 1, 2); } }
      if ((f >> 2) % 2) { ctx.fillStyle = '#ffd84a'; ctx.fillRect(x - 3, Y(198), 1, 1); ctx.fillRect(x + 3, Y(197), 1, 1); }
    }
  }
}

function torches(ctx, f, dist, y0) {
  const off = (((Math.round(dist * 0.22 * 4) / 4) % 384) + 384) % 384;
  for (let base = -off; base < W + 384; base += 384) for (const px of [20, 116, 212, 308]) {
    const x = base + px + 9, y = Math.round(y0 + 34);
    if (x < -20 || x > W + 20) continue;
    for (let r = 14; r > 0; r -= 3) { ctx.globalAlpha = 0.05; ctx.fillStyle = '#ffb04a'; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
    ctx.globalAlpha = 1;
    const fl = (f >> 2) % 3;
    ctx.fillStyle = '#ff5a1a'; ctx.fillRect(x - 2, y - 2 - fl, 4, 4 + fl);
    ctx.fillStyle = '#ffd04a'; ctx.fillRect(x - 1, y - 1 - fl, 2, 3);
    ctx.fillStyle = '#fff7c0'; ctx.fillRect(x, y, 1, 1);
  }
}

function erupt(ctx, v, z, dist, cam) {
  const off = (((Math.round(dist * 0.06 * 4) / 4) % 480) + 480) % 480;
  for (let base = -off; base < W + 480; base += 480) {
    const cx = base + 240, cy = Math.round(z.farY - cam * 0.35) + 22;
    if (cx < -40 || cx > W + 40) continue;
    if (Math.random() < 0.12) v.sparks.push({ x: cx + (Math.random() - 0.5) * 6, y: cy, vx: (Math.random() - 0.5) * 1.2, vy: -1.5 - Math.random() * 1.8, t: 50 });
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#ff7a1a'; ctx.fillRect(cx - 12, cy - 8, 24, 10); ctx.globalAlpha = 1;
  }
  for (const p of v.sparks) { p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.t--; ctx.fillStyle = p.t > 30 ? '#ffe08a' : '#ff5a1a'; ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1); }
  v.sparks = v.sparks.filter((p) => p.t > 0);
}

function ambient(ctx, v, z, f, speed) {
  const kind = z.particles;
  const dense = kind === 'rain' || kind === 'upRain' || kind === 'snow' || kind === 'code' || kind === 'spice';
  if (v.ambient.length < (dense ? 70 : 10) && Math.random() < (dense ? 0.6 : 0.08)) {
    if (kind === 'embers') v.ambient.push({ x: Math.random() * W, y: H + 2, vx: -0.3 - Math.random() * 0.6, vy: -0.4 - Math.random() * 0.8, t: 200, c: Math.random() < 0.5 ? '#ffb03a' : '#ff5a1a' });
    else if (kind === 'ash') v.ambient.push({ x: Math.random() * (W + 80), y: -2, vx: -0.8 - Math.random(), vy: 0.3 + Math.random() * 0.5, t: 300, c: Math.random() < 0.7 ? '#6a6060' : '#ff7a1a' });
    else if (kind === 'rain') for (let k = 0; k < 6; k++) v.ambient.push({ x: Math.random() * (W + 60), y: -4, vx: -1.6, vy: 5, t: 60, c: '#6a7aa8', rain: true });
    else if (kind === 'steam') v.ambient.push({ x: Math.random() * W, y: H + 2, vx: -0.4, vy: -0.5, t: 160, c: '#5a6a64', puff: true });
    else if (kind === 'snow') for (let k = 0; k < 2; k++) v.ambient.push({ x: Math.random() * (W + 60), y: -3, vx: -0.6 - Math.random() * 0.6, vy: 0.5 + Math.random() * 0.6, t: 400, c: Math.random() < 0.7 ? '#ffffff' : '#c8e4f4' });
    else if (kind === 'code') for (let k = 0; k < 2; k++) v.ambient.push({ x: Math.floor(Math.random() * 64) * 5, y: -4, vx: 0, vy: 1 + Math.random() * 1.5, t: 200, c: Math.random() < 0.2 ? '#e8ffe8' : '#3ae03a', glyph: true });
    else if (kind === 'spice') v.ambient.push({ x: W + 4, y: Math.random() * H, vx: -1 - Math.random() * 1.5, vy: (Math.random() - 0.5) * 0.3, t: 300, c: Math.random() < 0.15 ? '#7ad8ff' : '#ffd890' });
    else if (kind === 'upRain') for (let k = 0; k < 4; k++) v.ambient.push({ x: Math.random() * (W + 60), y: H + 4, vx: 1.2, vy: -5, t: 60, c: '#6a8ae0', rain: true });
    else v.ambient.push({ x: Math.random() * W, y: Math.random() * H, vx: -0.2, vy: (Math.random() - 0.5) * 0.1, t: 120, c: '#8a8aa8' });
  }
  for (const p of v.ambient) {
    p.x += p.vx - speed / 2560; p.y += p.vy + (p.rain ? 0 : Math.sin((f + p.t) / 20) * 0.1); p.t--;
    ctx.fillStyle = p.c;
    if (p.rain) { ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 3); ctx.fillRect(Math.round(p.x) - 1, Math.round(p.y) + 3, 1, 2); }
    else if (p.glyph) { ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 3); ctx.fillRect(Math.round(p.x) + 2, Math.round(p.y) + 1, 1, 2); }
    else if (p.puff) { ctx.globalAlpha = 0.25; ctx.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 5, 4); ctx.globalAlpha = 1; }
    else ctx.fillRect(Math.round(p.x), Math.round(p.y), 1, 1);
  }
  v.ambient = v.ambient.filter((p) => p.t > 0 && p.y > -6 && p.y < H + 6 && p.x > -5);
}

function makeBolt() { const pts = [[60 + Math.random() * 200, 0]]; while (pts[pts.length - 1][1] < 110) { const [x, y] = pts[pts.length - 1]; pts.push([x + (Math.random() - 0.5) * 20, y + 6 + Math.random() * 10]); } return pts; }
function drawBolt(ctx, pts, dy) {
  ctx.fillStyle = '#ffffff';
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], n = Math.max(1, Math.round(Math.abs(y1 - y0)));
    for (let k = 0; k <= n; k++) ctx.fillRect(Math.round(x0 + ((x1 - x0) * k) / n), Math.round(y0 + ((y1 - y0) * k) / n + dy), 2, 1);
  }
}

// ---- HUD ---------------------------------------------------------------------
function panel(ctx, x, y, w, h) {
  ctx.fillStyle = '#000'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#5a4b7e'; ctx.fillRect(x + 1, y + 1, w - 2, 1); ctx.fillRect(x + 1, y + 1, 1, h - 2);
  ctx.fillStyle = '#1a1428'; ctx.fillRect(x + 2, y + 2, w - 3, h - 3);
}
export function drawHud(ctx, s, A, v, target) {
  const f = v.frame;
  // top left: the spinning jacket + energy bar
  panel(ctx, 3, 2, 26, 27);
  spr(ctx, A.chr.jacketIcon[[0, 1, 2, 1, 0, 11, 10, 11][(f >> 3) % 8]], 16, 27);   // sways, never edge-on
  panel(ctx, 30, 6, 6 + MAX_HP * 9, 14);
  for (let i = 0; i < MAX_HP; i++) {
    const on = i < s.hp, low = s.hp <= 1 && (f >> 3) % 2;
    ctx.fillStyle = on ? (low ? '#ffffff' : '#e0102a') : '#3a1018'; ctx.fillRect(33 + i * 9, 9, 7, 8);
    if (on) { ctx.fillStyle = '#ff6a78'; ctx.fillRect(33 + i * 9, 9, 7, 2); ctx.fillStyle = '#8a0010'; ctx.fillRect(33 + i * 9, 16, 7, 1); }
  }
  drawText(ctx, 'ENERGY', 32, 22, { fill: '#ffb3c0', outline: '#000' });
  // top right: the hero's face
  panel(ctx, W - 29, 2, 26, 27);
  { const fc = A.chr.face; ctx.drawImage(fc.c, 10, 1, 22, 23, W - 27, 4, 22, 23); }
  // power-ups: a timer bar each, flashing when about to run out
  let py = 4;
  for (const [t, label, fill, col] of [[s.star, 'INVINCIBLE', GRAD.green, '#5fff6a'], [s.triple, 'TRIPLE JUMP', GRAD.blue, '#8ab8f0']]) {
    if (t <= 0) continue;
    const ending = t < 120, show = !ending || (f >> (t < 60 ? 2 : 3)) % 2;
    const bw = 50, bx = W - 33 - bw;
    if (show) drawText(ctx, label, bx + bw, py, { fill: ending ? GRAD.red : fill, outline: '#000', align: 'right' });
    ctx.fillStyle = '#000'; ctx.fillRect(bx - 1, py + 8, bw + 2, 4);
    ctx.fillStyle = '#1a1428'; ctx.fillRect(bx, py + 9, bw, 2);
    ctx.fillStyle = ending && !show ? '#ffffff' : ending ? '#ff2040' : col; ctx.fillRect(bx, py + 9, Math.ceil((bw * t) / 600), 2);
    py += 15;
  }
  // score
  const sc = score(s);
  drawText(ctx, sc.toLocaleString('en-US'), W / 2, 4, { scale: 2, fill: sc >= target ? GRAD.green : GRAD.gold, outline: '#000', shadow: '#3a1a00', align: 'center' });
  if (sc < target) {
    const w = 70, k = Math.min(1, sc / target);
    ctx.fillStyle = '#000'; ctx.fillRect(W / 2 - w / 2 - 1, 21, w + 2, 5);
    ctx.fillStyle = '#3a1028'; ctx.fillRect(W / 2 - w / 2, 22, w, 3);
    ctx.fillStyle = '#ff2d7a'; ctx.fillRect(W / 2 - w / 2, 22, Math.round(w * k), 3);
    ctx.fillStyle = '#ffb3d0'; ctx.fillRect(W / 2 - w / 2, 22, Math.round(w * k), 1);
    drawText(ctx, 'TARGET ' + target.toLocaleString('en-US'), W / 2, 28, { fill: '#ffb3d0', outline: '#000', align: 'center' });
  } else if ((f >> 4) % 2) drawText(ctx, 'CODE UNLOCKED!', W / 2, 23, { fill: GRAD.green, outline: '#000', align: 'center' });
}

// ---- title + countdown ---------------------------------------------------------
// Title = three screens that slide up into view in turn (like an arcade attract mode):
// 1/3 the logo · 2/3 two ways to win · 3/3 the leaderboard. Tap to advance; the
// LEADERBOARD button slides straight to screen 3.
// screen 4/4 (the high scores) stays up long enough to scroll through the top 50
const T_HOLD = 180, T_MOVE = 24, T_PAGES = 5;
export const BOARD_PAGE = 4;
const holds = (v) => [T_HOLD, T_HOLD, T_HOLD, T_HOLD + 60, v.boardHold || T_HOLD];
function pagePos(v) {
  const H = holds(v), len = H.reduce((a, h) => a + h + T_MOVE, 0);
  let ph = (v.tt || 0) % len, cur = 0;
  while (ph >= H[cur] + T_MOVE) { ph -= H[cur] + T_MOVE; cur++; }
  return { cur, local: ph, hold: H[cur], len, H };
}
export function titleGoTo(v, page) {
  if (titlePage(v) === page) return;
  const { len, H } = pagePos(v), prev = (page + T_PAGES - 1) % T_PAGES;
  let start = 0; for (let i = 0; i < prev; i++) start += H[i] + T_MOVE;
  v.tt = Math.floor((v.tt || 0) / len) * len + start + H[prev];
}
export const titlePage = (v) => { const { cur, local, hold } = pagePos(v); return local < hold + T_MOVE / 2 ? cur : (cur + 1) % T_PAGES; };
// scroll a list: pause at the top, glide down to the bottom, pause, zip back up
export const SCROLL_PAUSE = 120;
export function listScroll(t, max) {
  if (max <= 0) return 0;
  const down = max, up = Math.ceil(max / 3);
  if (t < SCROLL_PAUSE) return 0; t -= SCROLL_PAUSE;
  if (t < down) return t; t -= down;
  if (t < 60) return max; t -= 60;
  if (t < up) return max - t * 3;
  return 0;
}
export const listCycle = (max) => (max <= 0 ? SCROLL_PAUSE : SCROLL_PAUSE + max + 60 + Math.ceil(max / 3) + 40);
export function drawTitle(ctx, A, v, discount = '20%', msg = '', board = null) {
  const f = v.frame;
  v.tt = (v.tt || 0) + 1;
  if (v.flip) { v.flip = false; titleGoTo(v, (titlePage(v) + 1) % T_PAGES); }
  const rows = board && board.top ? board.top.length : 0;
  v.boardHold = Math.max(T_HOLD, listCycle(rows * 11 - 88));
  if (v.holdPage != null) { const H = holds(v); let st = 0; for (let i = 0; i < v.holdPage; i++) st += H[i] + T_MOVE; v.tt = st + 40; }   // screens page
  const { cur, local, hold } = pagePos(v);
  const k = local < hold ? 0 : ease((local - hold) / T_MOVE), next = (cur + 1) % T_PAGES;
  ctx.fillStyle = 'rgba(8,4,16,0.5)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, 144); ctx.clip();
  for (const [page, dy] of [[cur, -k * 150], [next, (1 - k) * 150]]) {
    if (dy >= 150) continue;
    ctx.save(); ctx.translate(0, Math.round(dy));
    if (page === 0) drawGameLogo(ctx, f);
    else if (page === 1) {
      drawText(ctx, 'WIN THE', W / 2, 10, { scale: 2, fill: GRAD.white, outline: '#000', shadow: '#000', align: 'center' });
      const endY = drawLogo(ctx, W / 2, 30, f, A.cjk);
      drawText(ctx, "SINGLES' DAY 11.11", W / 2, endY + 4, { fill: GRAD.gold, outline: '#000', align: 'center' });
    } else if (page === 2) {
      drawText(ctx, '2 WAYS TO WIN', W / 2, 8, { scale: 2, fill: GRAD.gold, outline: '#000', shadow: '#000', align: 'center' });
      prize(ctx, 50, 34, 220, 42, 'PRIZE 1', [['SCORE 1,111', 2, GRAD.white], ['= ' + discount + ' OFF CODE', 1, GRAD.pink]], GRAD.pink, null);
      prize(ctx, 50, 88, 220, 46, 'PRIZE 2', [['TOP SCORE 11.11 - 15.11', 1, GRAD.white], ['WINS THE FWAHBL JACKET', 1, GRAD.gold], ['ONLY 10 EXIST', 1, '#8a8aa8']], GRAD.gold, A.chr.jacketSpin[(f >> 2) % 12]);
    } else if (page === 3) crewPage(ctx, A, f);
    else titleBoard(ctx, board, f, page === cur ? local : 0);
    ctx.restore();
  }
  ctx.restore();
  drawText(ctx, (k < 0.5 ? cur + 1 : next + 1) + '/' + T_PAGES, W - 6, 6, { fill: '#8a8aa8', outline: '#000', align: 'right' });
  if (msg) {
    const text = msg + '      ', tw = measure(text);
    const x0 = W - ((f * 1.1) % (tw + W));
    drawText(ctx, text, Math.round(x0), H - 11, { fill: GRAD.pink, outline: '#000', wave: (i) => -Math.abs(Math.sin(f / 10 + i * 0.35)) * 3 });
  }
}
// title screen 4: how crews work
function crewPage(ctx, A, f) {
  drawText(ctx, 'BOOST YOUR SCORE', W / 2, 6, { scale: 2, fill: GRAD.gold, outline: '#000', shadow: '#000', align: 'center' });
  drawText(ctx, 'GET 5 FRIENDS TO PLAY. THEIR SCORES ADD TO YOURS.', W / 2, 26, { fill: GRAD.white, outline: '#000', align: 'center' });
  // you in the middle, five friends around you, lines lighting up in turn
  const cx = W / 2, cy = 74, hero = A.chr.idle ? A.chr.idle[0] : null;
  const spots = [[-92, -14], [-56, 22], [0, 34], [56, 22], [92, -14]];
  spots.forEach(([dx, dy], i) => {
    const on = ((f >> 4) % 7) > i;
    ctx.fillStyle = on ? '#ff2d7a' : '#3a2e52';
    const n = 12; for (let k = 1; k < n; k++) if (k % 2) ctx.fillRect(Math.round(cx + (dx * k) / n), Math.round(cy - 6 + (dy * k) / n), 2, 2);
    const x = cx + dx, y = cy - 6 + dy;
    ctx.fillStyle = '#000'; ctx.fillRect(x - 9, y - 7, 18, 14); ctx.fillStyle = on ? '#ffe14a' : '#5a4b7e'; ctx.fillRect(x - 8, y - 6, 16, 12);
    drawText(ctx, on ? '+' : '?', x, y - 3, { fill: on ? '#7a0a2a' : '#1a1428', outline: null, align: 'center' });
  });
  ctx.fillStyle = '#000'; ctx.fillRect(cx - 15, cy - 19, 30, 26); ctx.fillStyle = '#ff2d7a'; ctx.fillRect(cx - 14, cy - 18, 28, 24);
  drawText(ctx, 'YOU', cx, cy - 10, { fill: GRAD.white, outline: '#000', align: 'center' });
  const steps = ['1. PLAY AND SUBMIT YOUR SCORE', '2. SEND YOUR LINK TO YOUR FRIENDS', '3. THEY PLAY, AND YOUR SCORE GOES UP'];
  steps.forEach((t, i) => drawText(ctx, t, 62, 112 + i * 10, { fill: i === (f >> 5) % 3 ? GRAD.gold : '#e8e8f0', outline: '#000' }));
}
function titleBoard(ctx, board, f, t) {
  drawText(ctx, 'HIGH SCORES', W / 2, 4, { scale: 2, fill: GRAD.gold, outline: '#000', shadow: '#000', align: 'center', wave: (i) => Math.sin(f / 8 + i * 0.5) * 1.5 });
  const top = board && board.top;
  if (!top) { drawText(ctx, 'LOADING...', W / 2, 70, { fill: GRAD.white, outline: '#000', align: 'center' }); return; }
  if (!top.length) { drawText(ctx, 'NO SCORES YET - BE THE FIRST!', W / 2, 70, { fill: GRAD.white, outline: '#000', align: 'center' }); return; }
  const rainbow = ['#ff2040', '#ff8a1a', '#ffe14a', '#5fff6a', '#3d9cf5', '#a05aff', '#ff4fd8'];
  const row = (r, y, col) => {
    drawText(ctx, String(r.rank).padStart(3, ' ') + '.', 64, y, { fill: col, outline: '#000' });
    drawText(ctx, r.nickname, 94, y, { fill: col, outline: '#000' });
    drawText(ctx, r.country || '', 160, y, { fill: '#8a8aa8', outline: '#000' });
    if (r.level) drawText(ctx, 'L' + r.level, 178, y, { fill: '#5fff6a', outline: '#000' });
    drawText(ctx, r.score.toLocaleString('en-US'), 256, y, { fill: col, outline: '#000', align: 'right' });
  };
  // the top 50, scrolling (pauses at the top first)
  const y0 = 26, h = 88, sc = Math.round(listScroll(t, top.length * 11 - h));
  ctx.save(); ctx.beginPath(); ctx.rect(0, y0, W, h); ctx.clip();
  top.forEach((r, i) => { const y = y0 + 2 + i * 11 - sc; if (y > y0 - 10 && y < y0 + h) row(r, y, i === 0 ? rainbow[(f >> 2) % 7] : board.me && r.rank === board.me.rank ? '#ff4fd8' : i < 3 ? '#ffe14a' : '#e8e8f0'); });
  ctx.restore();
  if (top.length * 11 > h) { const bh = Math.max(8, Math.round((h * h) / (top.length * 11))), by = y0 + Math.round(((h - bh) * sc) / (top.length * 11 - h)); ctx.fillStyle = '#3a2e52'; ctx.fillRect(262, y0, 2, h); ctx.fillStyle = '#ff2d7a'; ctx.fillRect(262, by, 2, bh); }
  if (board.me) { ctx.fillStyle = '#ff2d7a'; ctx.fillRect(58, 118, 204, 11); drawText(ctx, 'YOU', 40, 120, { fill: GRAD.gold, outline: '#000' }); row(board.me, 120, '#ffffff'); }
}
// ---- 'FOR WHEN ALL HELL BREAKS LOOSE: SINGLES' DAY GAME' logo, pixel version (built once) --------------
let LOGO = null;
function buildGameLogo() {
  const c = document.createElement('canvas'); c.width = W; c.height = 140; const x = c.getContext('2d');
  const rnd = (() => { let a = 1234567; return () => ((a = (Math.imul(a, 1103515245) + 12345) | 0) >>> 8) / 16777216; })();
  // 1. acid splatter behind the words: pink and green globs, spatter rays and drops on stalks
  const glob = (cx, cy, r, base, hi, dark) => {
    x.fillStyle = '#000'; for (let j = -r - 1; j <= r + 1; j++) { const h = Math.floor(Math.sqrt(Math.max(0, (r + 1) ** 2 - j * j))); x.fillRect(cx - h, cy + j, h * 2 + 1, 1); }
    x.fillStyle = base; for (let j = -r; j <= r; j++) { const h = Math.floor(Math.sqrt(Math.max(0, r * r - j * j))); x.fillRect(cx - h, cy + j, h * 2 + 1, 1); }
    if (r >= 3) { x.fillStyle = dark; x.fillRect(cx + 1, cy + 1, 1, 1); x.fillRect(cx - r + 2, cy + 1, 1, 1); }
    x.fillStyle = hi; x.fillRect(cx - Math.ceil(r / 2), cy - Math.ceil(r / 2), Math.max(1, r >> 1), 1);
  };
  const PINK = ['#ff2d8a', '#ffb0de', '#7a0a40'], GREEN = ['#8ac83a', '#e0ffa0', '#3a5a10'];
  for (let i = 0; i < 46; i++) {                                    // spatter rays from the centre
    const a = rnd() * Math.PI * 2, r0 = 40 + rnd() * 20, r1 = r0 + 10 + rnd() * 30, col = rnd() < 0.85 ? PINK : GREEN;
    const cx = 160, cy = 64;
    for (let t = r0; t < r1; t += 1.5) { x.fillStyle = col[0]; x.fillRect(Math.round(cx + Math.cos(a) * t * 1.9), Math.round(cy + Math.sin(a) * t * 0.75), 1, 1); }
    glob(Math.round(cx + Math.cos(a) * r1 * 1.9), Math.round(cy + Math.sin(a) * r1 * 0.75), 1 + Math.floor(rnd() * 3), ...col);
  }
  for (let i = 0; i < 44; i++) {                                    // big globs around the edge of the words
    const a = rnd() * Math.PI * 2, d = 0.55 + rnd() * 0.4, col = rnd() < 0.75 ? PINK : GREEN;
    glob(Math.round(160 + Math.cos(a) * 150 * d), Math.round(64 + Math.sin(a) * 56 * d), 2 + Math.floor(rnd() * 6), ...col);
  }
  // 2. the words: chunky, slanted, with a black 3D extrusion and speckled texture
  const T = document.createElement('canvas'); T.width = W; T.height = 140; const t = T.getContext('2d');
  const word = (str, cx, y, sc, fill) => {        // extra-bold: each word drawn twice, 1px apart
    for (let d = 5; d >= 0; d--) for (const b of [0, 1]) drawText(t, str, cx + d + b, y + d, { scale: sc, fill: '#000', outline: '#000', align: 'center' });
    for (const b of [0, 1]) drawText(t, str, cx + b, y, { scale: sc, fill, outline: null, align: 'center' });
  };
  const YEL = ['#fffbb0', '#fff23a', '#ffe81a', '#ffe000', '#f5d000', '#e0b800', '#c09a00'];
  word('FOR WHEN ALL', 160, 14, 3, YEL);
  const l2 = [['HELL', GRAD.pink], ['BREAKS', GRAD.blue], ['LOOSE', GRAD.pink]], sc2 = 3;
  let lx = 160 - Math.round(measure('HELL BREAKS LOOSE', sc2) / 2);
  for (const [w, fill] of l2) { const ww = measure(w, sc2); word(w, lx + ww / 2, 44, sc2, fill); lx += ww + 6 * sc2; }
  word("SINGLES' DAY GAME", 160, 74, 3, YEL);
  const id = t.getImageData(0, 0, W, 140), dd = id.data;
  for (let i = 0; i < dd.length; i += 4) if (dd[i + 3] && (dd[i] > 60 || dd[i + 2] > 60) && rnd() < 0.035) { dd[i] *= 0.8; dd[i + 1] *= 0.8; dd[i + 2] *= 0.8; }
  t.putImageData(id, 0, 0);
  for (let y = 0; y < 140; y++) x.drawImage(T, 0, y, W, 1, Math.round((110 - y) * 0.18) - 6, y, W, 1);   // italic slant, row by row
  return c;
}
export function drawGameLogo(ctx, f) {
  LOGO = LOGO || buildGameLogo();
  const bob = Math.round(Math.sin(f / 20) * 1.5);
  ctx.drawImage(LOGO, 0, 2 + bob);
}

const ease = (t) => t * t * (3 - 2 * t);
function prize(ctx, x, y, w, h, label, lines, fill, icon) {
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#1a1428'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill[3]; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + 6, y - 5, measure(label) + 6, 9);
  drawText(ctx, label, x + 9, y - 4, { fill: '#000', outline: null });
  if (icon) { const c = icon.c || icon; ctx.drawImage(c, x + w - c.width - 6, y + Math.round((h - c.height) / 2) + 1); }
  let ty = y + 9;
  for (const [t, sc, col] of lines) { drawText(ctx, t, x + 10, ty, { scale: sc, fill: col, outline: '#000' }); ty += 7 * sc + 4; }
}

export function drawCountdown(ctx, label, age) {
  if (!label) return;
  const scale = Math.max(6, 10 - Math.floor(age / 3));
  const fill = label === 'GO!' ? GRAD.green : GRAD.gold;
  const y = Math.round(H / 2 - (7 * scale) / 2) - 8;
  for (let d = 4; d >= 1; d--) drawText(ctx, label, W / 2 + d, y + d, { scale, fill: '#3a1a00', outline: null, align: 'center' });
  drawText(ctx, label, W / 2, y, { scale, fill, outline: '#000', align: 'center' });
  if (label !== 'GO!') drawText(ctx, 'TAP TO JUMP', W / 2, y + scale * 7 + 10, { fill: GRAD.white, outline: '#000', align: 'center' });
}

// build 2026-11-09T16:00
