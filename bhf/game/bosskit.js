// Black Hole Friday: what every end-of-level boss shares. A boss is one static screen and one button.
// The boss itself (rules + art) lives in its level file: levels/<key>.js exports boss(A, z) -> def:
//   { name, tip, hero: 'stand' | 'run' | 'hold', heroX, init(st), update(st, inp), draw(ctx, st, f), stage?(ctx, st, f), front?(ctx, st, f) }
//   hero 'stand': he stays put facing the boss; tap = jump (again = double jump, hold = higher)
//   hero 'run'  : he runs on his own and turns at the walls; tap = jump
//   hero 'hold' : he walks right only while the button is held (no jump)
//   hero 'still': he does nothing by himself (no walk, no jump): the boss decides what a tap does, and can draw him with def.heroDraw(ctx, st, f)
// DETERMINISM (the server replays every game from its inputs to check the score, without ever drawing):
//   - anything that changes how the fight goes must come from st.rnd() (seeded, 0..1), never Math.random / Date / the draw frame f
//   - update() must not depend on anything draw() changes, and draw() must not change anything update() reads
//   - in update() use only + - * / Math.floor/round/abs/min/max/sqrt/sign; for sines use dsin/dcos below (Math.sin differs between browsers)
//   Math.random is fine for pure decoration (sparks, dust) that nothing else reads.
//   st.lap = 0 on the first time round, 1, 2... on later laps of the game: make the boss harder with it.
// Beat it with win(st): the level's own portal opens (portals.js) and he runs into it by himself.
import { put, flip, hash, TAU, frames, pix, dith, drawText, GRAD } from './kit.js';
import { PORTALS, drawPortalAt, drawEntering, drawReflection } from './portals.js';

export const BW = 320, BH = 180, FL = 160;       // the arena: 320 x 180, floor at y 160
export const G = 0.31, G_HOLD = 0.16, JUMP = -4.3, JUMP2 = -3.75, HOLD = 12, RUN = 1.3;
export { put, flip, hash, TAU, frames, pix, dith, drawText, GRAD };

// sines that are the same on every machine: a = angle in 1/256ths of a turn (any number; fractions are floored)
const SIN = Array.from({ length: 256 }, (_, i) => Math.round(Math.sin((i / 256) * Math.PI * 2) * 4096) / 4096);
export const dsin = (a) => SIN[((Math.floor(a) % 256) + 256) % 256], dcos = (a) => dsin(a + 64);
// seeded random numbers: rng(seed)() -> 0..1
export const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

// ---- the hero ----
export function arenaHero(mode = 'run', x = 40) { return { mode, x, y: FL, vy: 0, dir: 1, ground: true, jumps: 0, hold: 0, inv: 0, on: null, left: 12, right: BW - 12, moving: mode === 'run' }; }
export function heroStep(st, inp) {
  const h = st.h, plats = st.plats;
  if (h.inv > 0) h.inv--;
  if (st.portal) {                                  // beaten: he heads for the portal on his own
    const d = st.portal.x - h.x; h.moving = Math.abs(d) > 2; if (h.moving) { h.dir = Math.sign(d); h.x += h.dir * 1.6; }
  } else if (st.won) h.moving = false;            // beaten, portal about to open: he stops and waits
  else if (h.mode === 'run') { h.moving = true; h.x += h.dir * RUN; if (h.x > h.right) { h.x = h.right; h.dir = -1; } if (h.x < h.left) { h.x = h.left; h.dir = 1; } }
  else if (h.mode === 'hold') { h.moving = inp.down && !h.frozen; if (h.moving) h.x = Math.min(h.right, h.x + 0.75); }
  else h.moving = false;
  if (inp.pressed && h.mode !== 'hold' && h.mode !== 'still' && !st.portal) {
    if (h.ground) { h.vy = JUMP; h.ground = false; h.jumps = 1; h.hold = HOLD; h.on = null; st.events.push('jump'); }
    else if (h.jumps < 2) { h.vy = JUMP2; h.jumps = 2; h.hold = 8; st.events.push('djump'); }
  }
  if (!inp.down) h.hold = 0;
  const py = h.y;
  if (!h.ground) { h.vy = Math.min(6.5, h.vy + (inp.down && h.hold > 0 && h.vy < 0 ? G_HOLD : G)); if (h.hold > 0) h.hold--; h.y += h.vy; }
  if (h.ground && h.on) { const q = h.on; if (h.x < q.x - q.w / 2 || h.x > q.x + q.w / 2 || q.gone) { h.ground = false; h.on = null; } else h.y = q.y; }
  if (!h.ground && h.vy > 0) {
    for (const q of plats || []) if (!q.gone && h.x > q.x - q.w / 2 && h.x < q.x + q.w / 2 && py <= q.y + 3 && h.y >= q.y) { h.y = q.y; h.vy = 0; h.ground = true; h.jumps = 0; h.on = q; break; }
    if (!h.ground && h.y >= FL) { h.y = FL; h.vy = 0; h.ground = true; h.jumps = 0; h.on = null; }
  }
}
// the hero's body for collisions: 12 wide, 30 tall, feet at h.y
export const box = (h) => ({ l: h.x - 6, r: h.x + 6, t: h.y - 30, b: h.y });
export const hitR = (a, l, t, r, b) => a.l < r && a.r > l && a.t < b && a.b > t;
const fc = new Map(); export const flipCache = (fr) => { if (!fc.has(fr)) fc.set(fr, flip(fr)); return fc.get(fr); };
export function drawHero(ctx, A, st, f) {
  const h = st.h; if (h.inv > 0 && (h.inv >> 2) % 2) return;
  const H = A.chr.hero, fr = !h.ground ? (h.vy < 0 ? H.jump : H.fall) : h.moving ? H.run[(f >> 2) % 8] : H.run[2];
  const p = st.portal; let k = 1; if (p && p.in > 0) k = Math.max(0, 1 - p.in / 24);
  if (k <= 0) return;
  const im = h.dir < 0 ? flipCache(fr) : fr;
  if (p && st.kind === 'mirror' && p.t > 24) drawReflection(ctx, im, h.x, h.y, p.x, FL, 0.65 * k);
  if (k < 1) drawEntering(ctx, st.kind, im, h.x, h.y, k, p.x, FL);
  else put(ctx, im, h.x, h.y);
}

// ---- the portal: each level has its own (portals.js) ----
export function drawPortal(ctx, st, f) { const p = st.portal; if (p) drawPortalAt(ctx, st.kind, p.x, FL, Math.min(1, p.t / 24), f, p.t); }

// ---- shared rules + HUD bits ----
export function hurt(st, why = '') { const h = st.h; if (h.inv > 0 || st.won) return false; st.hp--; h.inv = 90; st.shake = 10; st.events.push('hit'); (st.why = st.why || []).push(why); return true; }
export function win(st, msg, portalX) {
  if (st.won) return; st.won = true; st.bonus += 500; st.msg = msg || 'BOSS DOWN  +500'; st.msgT = 110; st.events.push('win');
  st.portalAt = portalX ?? null; st.portalIn = 50;
}
export const pop = (st, txt, x, y) => { st.pop = [txt, x, y]; };
export const bar = (ctx, label, k, col) => { ctx.fillStyle = '#000'; ctx.fillRect(100, 13, 120, 6); ctx.fillStyle = '#2a1010'; ctx.fillRect(101, 14, 118, 4); ctx.fillStyle = col; ctx.fillRect(101, 14, Math.round(118 * Math.max(0, Math.min(1, k))), 4); drawText(ctx, label, BW / 2, 4, { fill: GRAD.white, outline: '#000', align: 'center' }); };
// pips: n of total done (e.g. 3 stomps)
export const pips = (ctx, label, n, total, col) => { drawText(ctx, label, BW / 2, 4, { fill: GRAD.white, outline: '#000', align: 'center' }); const w = total * 10 - 2; for (let i = 0; i < total; i++) { ctx.fillStyle = '#000'; ctx.fillRect(BW / 2 - w / 2 + i * 10 - 1, 13, 10, 7); ctx.fillStyle = i < n ? col : '#2a2a2a'; ctx.fillRect(BW / 2 - w / 2 + i * 10, 14, 8, 5); } };
export const dizzy = (ctx, x, y, f) => { for (let i = 0; i < 3; i++) { const a = f / 6 + i * 2.1; drawText(ctx, '*', x - 3 + Math.round(Math.cos(a) * 9), y + Math.round(Math.sin(a) * 2), { fill: GRAD.gold, outline: '#000' }); } };
// the level's own scenery, frozen, as a default backdrop (a boss can draw its own with def.stage)
export function drawStage(ctx, z, f) {
  ctx.drawImage(z.sky, 0, -12);
  if (z.far) for (let x = -40; x < BW; x += z.far.width) ctx.drawImage(z.far, x, z.farY - 20);
  if (z.mid) for (let x = -100; x < BW; x += z.mid.width) ctx.drawImage(z.mid, x, z.midY - 34);
  for (let x = -20; x < BW; x += z.deck.width) ctx.drawImage(z.deck, x, FL);
}

// ---- run a boss fight: returns a controller the game ticks and draws ----
export function startBoss(def, A, z, hp, kind = 'goo', o = {}) {
  const seed = (o.seed ?? Math.floor(Math.random() * 4294967296)) >>> 0;
  const st = { h: arenaHero(def.hero || 'run', def.heroX ?? 40), hp, bonus: 0, events: [], won: false, portal: null, plats: [], msg: def.name, msgT: 170, tip: def.tip, tips: def.tips || null, shake: 0, t: 0, kind, seed, rnd: rng(seed), lap: o.lap || 0 };
  def.init(st);
  return {
    st, def, kind,
    update(inp) {
      st.t++; st.events.length = 0; if (st.msgT > 0) st.msgT--;
      if (st.t < 70) return;                       // a moment to read the boss name
      heroStep(st, inp);
      def.update(st, inp);
      if (st.won && !st.portal && --st.portalIn <= 0) { const h = st.h; st.portal = { x: st.portalAt ?? (h.x < BW - 110 ? h.x + 70 : h.x - 70), t: 0, in: 0 }; st.events.push('portal'); }
      const p = st.portal; if (p) { p.t++; if (p.in > 0) { if (++p.in > 30) st.done = true; } else if (p.t > (PORTALS[kind]?.openT || 24) && Math.abs(st.h.x - p.x) < 3 && st.h.ground) { p.in = 1; st.events.push('warp'); } }
    },
    draw(ctx, f) {
      ctx.save(); if (st.shake > 0) { ctx.translate(((f >> 1) % 2) * 2 - 1, 0); st.shake--; }
      if (def.stage) def.stage(ctx, st, f); else drawStage(ctx, z, f);
      def.draw(ctx, st, f);
      drawPortal(ctx, st, f);
      if (def.heroDraw && !st.portal) def.heroDraw(ctx, st, f); else drawHero(ctx, A, st, f);
      if (def.front) def.front(ctx, st, f);
      if (st.pop) { st.pop[2] -= 0.5; drawText(ctx, st.pop[0], st.pop[1], st.pop[2], { fill: GRAD.gold, outline: '#000', align: 'center' }); if (st.pop[2] < 10) st.pop = null; }
      ctx.restore();
      if (st.msgT > 0 && (st.msgT > 30 || (f >> 2) % 2)) {
        ctx.globalAlpha = 0.6; ctx.fillStyle = '#000'; ctx.fillRect(0, 54, BW, 48); ctx.globalAlpha = 1;
        drawText(ctx, st.msg, BW / 2, 60, { scale: st.msg.length > 16 ? 1 : 2, fill: st.won ? GRAD.gold : GRAD.red, outline: '#000', align: 'center' });
        if (!st.won) drawText(ctx, st.tip, BW / 2, 86, { fill: GRAD.white, outline: '#000', align: 'center' });
      }
      // the how-to strip along the bottom: stays up for the whole fight on the first loop (8 s after any change on later loops), one line at a time
      // (draw-only bookkeeping: update never reads _tipsSeen / _tipAt)
      const lines = st.tips || (st.tip ? [st.tip] : null);
      if (lines !== st._tipsSeen) { st._tipsSeen = lines; st._tipAt = st.t; }
      const age = st.t - st._tipAt;
      if (lines && !st.won && st.msgT <= 30 && (st.lap < 1 || age < 480)) {
        const i = Math.floor(age / 170) % lines.length, k = age % 170;
        ctx.globalAlpha = 0.72; ctx.fillStyle = '#000'; ctx.fillRect(0, BH - 13, BW, 13); ctx.globalAlpha = 1;
        if (lines.length > 1) drawText(ctx, (i + 1) + '/' + lines.length, 4, BH - 10, { fill: '#8a8aa8', outline: null });
        drawText(ctx, lines[i], BW / 2 + (lines.length > 1 ? 8 : 0), BH - 10, { fill: GRAD.gold, outline: '#000', align: 'center' });   // steady: no blinking, no gap between lines
      }
    },
  };
}

// ---- a level that is not an FWAHBL run: one screen of its own rules (the Inversion). The game ticks and draws it like a boss. ----
// def = { name, init(st), update(st, inp), draw(ctx, st, f, A) }; inp = { down, pressed }. A = the game's art (A.chr.hero etc, as drawHero uses).
// st = { hp (jackets left: take one off with hurt-like code of your own and push 'hit'), bonus (points won here), events (sound names, cleared every tick),
//        done (set true when the level is finished: the boss follows), t, seed, rnd(), lap, level (0-based place in the running order) }
// The same determinism rules as a boss apply. The level name is drawn over the top for the first 150 ticks: keep the first 190 ticks free of danger.
export function startStage(def, A, z, hp, o = {}) {
  const seed = (o.seed ?? Math.floor(Math.random() * 4294967296)) >>> 0;
  const st = { hp, bonus: 0, events: [], done: false, shake: 0, t: 0, seed, rnd: rng(seed), lap: o.lap || 0, level: o.level || 0 };
  def.init(st);
  return {
    st, def,
    update(inp) { st.t++; st.events.length = 0; if (!st.done) def.update(st, inp); },
    draw(ctx, f) {
      def.draw(ctx, st, f, A);
      if (st.t < 150) {
        const name = String(def.name || z.name || ''), a = st.t > 130 ? (150 - st.t) / 20 : 1; ctx.globalAlpha = a;
        drawText(ctx, (st.lap ? 'LOOP ' + (st.lap + 1) + '  ' : '') + 'LEVEL ' + (st.level + 1), BW / 2, 52, { fill: GRAD.white, outline: '#000', align: 'center' });
        drawText(ctx, name, BW / 2, 66, { scale: name.length > 12 ? 2 : 3, fill: z.titleFill || GRAD.gold, outline: '#000', align: 'center' });
        ctx.globalAlpha = 1;
      }
    },
  };
}
