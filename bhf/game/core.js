// Black Hole Friday: the whole game as rules only (no drawing, no sound, no clock, no dice of its own).
// One call to tick(g, down) is one sixtieth of a second of play with the button up or down. The browser runs this to play;
// the server runs the very same file over the player's recorded button to find out what they really scored (worker/bhf.js).
// So: nothing in here (or in sim.js, or in a boss's / stage's init + update) may use Math.random, the time, or anything that is drawn.
//
// A game: level 1 run -> its boss -> (warp) -> level 2 ... -> level 6 boss -> (warp) -> level 1 again, a lap harder, for ever.
// The warp tunnels and the game-over screen are not play: no ticks pass in them. The player's button is recorded tick by tick.
import { createSim, step, score, startZone, zoneProgress, ZONE_PX, TPS } from './sim.js';
import { startBoss, startStage, win } from './bosskit.js';
import { EXIT } from './portals.js';

export const IRIS = 20;                       // ticks the run goes on for while the screen irises out to the boss
export const CORE_MAX = TPS * 60 * 60;        // an hour of play: nobody gets this far (the run clock in sim.js stops a game after 20 minutes of running)
export const CORE_VERSION = 4;                // bump when any rule changes: the server refuses runs played on other rules

const mix = (a, b) => { let h = Math.imul((a ^ 0x9e3779b9) >>> 0, 0x85ebca6b) ^ b; h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d); h = Math.imul(h ^ (h >>> 12), 0x297a2d39); return (h ^ (h >>> 15)) >>> 0; };
const sub = (g, salt) => mix(mix(mix(mix(g.seed, g.lap), g.idx), g.retries), salt);
// a stand-in for a level whose boss isn't built: last five seconds
const NOBOSS = { name: 'BOSS', tip: 'HANG ON', hero: 'run', init(st) { st.k = 0; }, update(st) { if (!st.won && ++st.k > 300) win(st); }, draw() {} };
export const exitKind = (g, i = g.idx) => (i + 1 >= g.LV.length ? 'blackhole' : EXIT[g.LV[i].key] || 'goo');

// LV = the levels in running order: [{ key, extras, danger, boss, stage }] (the skins). o.A = the art, for drawing (the server has none).
// o.start / o.bossOnly / o.lap = test shortcuts: a game begun with one is marked not clean and can never be registered.
export function createGame(seed, LV, o = {}) {
  const g = { seed: seed >>> 0, LV, A: o.A || null, sim: createSim(seed >>> 0), mode: 'run', idx: 0, lap: o.lap || 0, bonus: 0, boss: null, stage: null,
    cutOn: false, cut: 0, bossHp: 0, t: 0, prev: false, ev: [], hits: 0, retries: 0, cause: '', note: '', warpKind: '', warpLast: false,
    clean: !(o.start || o.bossOnly || o.lap), onLevel: o.onLevel || null };
  enterLevel(g, o.start || 0);
  if (o.bossOnly) toBoss(g);
  return g;
}
function enterLevel(g, i) {
  g.idx = i; g.cutOn = false; g.cut = 0; g.mode = 'run'; g.boss = null;
  const sk = g.LV[i]; if (g.onLevel) g.onLevel(g, i);              // (the browser points its art at this level before anything is built with it)
  if (sk.stage) g.stage = startStage(sk.stage, g.A, sk, g.sim.hp, { level: i, lap: g.lap, seed: sub(g, 1) });
  else { g.stage = null; startZone(g.sim, i, sk.extras, sk.danger, g.lap); }
}
function toBoss(g) {
  if (g.stage) { g.sim.hp = Math.max(1, g.stage.st.hp); g.bonus += g.stage.st.bonus; g.stage = null; }
  g.mode = 'boss'; g.cutOn = false; g.cut = 0; g.bossHp = g.sim.hp;
  g.boss = startBoss(g.LV[g.idx].boss || NOBOSS, g.A, g.LV[g.idx], g.sim.hp, exitKind(g), { lap: g.lap, seed: sub(g, 2) });
  g.note = 'boss';
}
function over(g, cause) { g.mode = 'over'; g.cause = cause; g.note = 'over'; }

export const total = (g) => score(g.sim) + g.bonus + (g.boss ? g.boss.st.bonus : 0) + (g.stage ? g.stage.st.bonus : 0);
export const hpOf = (g) => (g.mode === 'boss' && g.boss ? g.boss.st.hp : g.stage ? g.stage.st.hp : g.sim.hp);
// g.ev = the sounds / effects of the tick just played

export function tick(g, down) {
  g.note = '';
  if (g.mode !== 'run' && g.mode !== 'boss') return;
  down = !!down; const pressed = down && !g.prev; g.prev = down; g.t++;
  if (g.t >= CORE_MAX) return over(g, 'time');
  if (g.mode === 'run') {
    if (g.stage) {
      const st = g.stage.st; g.stage.update({ pressed, down }); g.ev = st.events; if (st.events.includes('hit')) g.hits++;
      if (st.hp <= 0) return over(g, 'stage');
      if (!g.cutOn && st.done) g.cutOn = true;
    } else {
      const s = g.sim; step(s, down); g.ev = s.events; if (s.events.includes('hit')) g.hits++;
      if (s.dead) return over(g, s.cause || 'dead');
      const zp = zoneProgress(s);
      if (!g.cutOn && zp >= ZONE_PX - 160 && (s.onGround || zp >= ZONE_PX - 110)) g.cutOn = true;   // still flying on a ride at the very end: cut anyway, never run on into the next zone
    }
    if (g.cutOn && ++g.cut >= IRIS) toBoss(g);
  } else {
    const b = g.boss, st = b.st; b.update({ pressed, down }); g.ev = st.events; if (st.events.includes('hit')) g.hits++;
    if (st.hp <= 0) return over(g, 'boss');
    if (st.done) {                                   // through the portal: the warp is next (advance)
      g.warpKind = b.kind; g.warpLast = g.idx + 1 >= g.LV.length;
      g.sim.hp = st.hp; g.bonus += st.bonus; g.boss = null; g.mode = 'warp'; g.note = 'warp';
    }
  }
}
// out of the far end of the tunnel: the next level, or (after the last one) level 1 again, one lap harder
export function advance(g) {
  if (g.mode !== 'warp') return;
  if (g.warpLast) { g.bonus += score(g.sim) - g.sim.bonus; g.sim.dist = 0; g.lap++; enterLevel(g, 0); }   // the distance run so far is banked: the world starts again from nought
  else enterLevel(g, g.idx + 1);
}
// TESTING ONLY (see RETRY in main.js): have another go from where you died. A game that used this is refused by the live server.
export function retry(g) {
  if (g.mode !== 'over') return;
  g.retries++; g.prev = false;
  if (g.cause === 'boss') { g.sim.hp = Math.max(2, g.bossHp); g.sim.dead = false; g.boss = null; toBoss(g); }
  else { g.sim = createSim(sub(g, 7)); g.bonus = 0; g.boss = null; g.stage = null; enterLevel(g, g.idx); }
}
// test shortcuts (mark the game as not clean)
export function skipToBoss(g) { if (g.mode === 'run') { g.clean = false; toBoss(g); } }
export function skipLevel(g) { if (g.mode === 'run') { g.clean = false; toBoss(g); } if (g.mode === 'boss') { g.clean = false; const b = g.boss; g.warpKind = b.kind; g.warpLast = g.idx + 1 >= g.LV.length; g.sim.hp = b.st.hp; g.bonus += b.st.bonus; g.boss = null; g.mode = 'warp'; g.note = 'warp'; } }

// ---- the button, as a list: the ticks at which it changed (it starts up) ----
export const encodeToggles = (t) => t.map((v, i) => (i ? v - t[i - 1] : v));
export function decodeToggles(d) {
  if (!Array.isArray(d) || d.length > 60000) return null;
  const out = []; let acc = 0;
  for (const v of d) { if (!Number.isInteger(v) || v < 1 || v > CORE_MAX) return null; acc += v; if (acc > CORE_MAX) return null; out.push(acc); }
  return out;
}
// Play a whole game back from its seed and its button list. `watch(g, down, pressed)` is called before every tick (the server measures reactions with it).
// retries = how many times the player was allowed to carry on after dying (testing only; 0 in the real game).
export function replayGame(seed, LV, toggles, endTick, retries = 0, watch = null) {
  const g = createGame(seed, LV), end = Math.min(endTick, CORE_MAX); let i = 0, down = false, used = 0;
  for (;;) {
    if (g.mode === 'warp') { advance(g); continue; }
    if (g.mode === 'over') { if (used < retries && g.t < end) { used++; retry(g); continue; } break; }
    if (g.t >= end) break;
    const before = down;
    while (i < toggles.length && toggles[i] === g.t + 1) { down = !down; i++; }
    if (watch) watch(g, down, down && !before);
    tick(g, down);
  }
  return { score: total(g), ticks: g.t, over: g.mode === 'over', cause: g.cause, lap: g.lap, level: g.idx + 1, hits: g.hits, retries: used, unused: toggles.length - i, simTicks: g.sim.tick };
}
