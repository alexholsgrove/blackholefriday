// Black Hole Friday / INVERSION: the split-screen level. RULES ONLY: no canvas, no DOM, no imports (so the solver can run it in node too).
// The screen is cut by the TURNSTILE at x 160. LEFT hero (x 56) runs right, RIGHT hero (x 264) runs backwards; both worlds pour OUT of the seam towards them.
// One button: both jump. There are TWO rules and they are the same in both worlds:
//   1. anything on the FLOOR: jump it      (a barricade, the burning rubble of a blown wall, a shin-high round, the car)
//   2. a round OVERHEAD: stay on the ground while it passes (being in the air as it goes by is a hit)
// The inversion is the spectacle and a time offset, never a different rule: a wall blows up in red on the tick it puts itself back together in blue;
// a round fired in red is un-fired in blue; the car that drives through red goes on tail first in blue.
// Everything that can hurt is an "item" on a timeline: T = the tick its middle reaches its hero.
//   low     a floor thing that comes with the world: art 'trap' (barricade), 'wall' (red: blows at .boom, its rubble is what arrives), 'heap' (blue: rubble; rebuilds at .boom)
//   bullet  a round from the red gun: passes the red hero at T, goes through the glass, passes the blue hero at T2. y = 'low' (jump) | 'high' (stay down)
//   car     the same, on the floor: jump it, twice
// Determinism: only st.rnd() (once, to pick the course), st.t and + - * / floor/round/ceil/abs/min/max. Draw reads st, never writes.
export const FL = 160, SEAM = 160, HX = [56, 264], NCOURSE = 32;
const G = 0.31, G_HOLD = 0.16, JUMP = -4.3, JUMP2 = -3.75;
export const SPEED = [1.3, 1.5, 1.65];
export const MIDY = FL - 38, LOWY = FL - 5;
const rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
export const SIZE = { trap: { w: 14, h: 14 }, rubble: { w: 16, h: 10 }, car: { w: 26, h: 13 }, low: { w: 8, h: 7 }, high: { w: 20, h: 12 } };   // what the rules measure (the drawings are bigger)
export const BOOMT = [40, 36, 32];                            // a wall blows this many ticks before its rubble reaches the red hero
export const WHY = { trap: 'BARRICADE: JUMP IT', rubble: 'RUBBLE: JUMP IT', low: 'LOW ROUND: JUMP IT', high: 'HIGH ROUND: STAY DOWN', car: 'CAR: JUMP IT' };

// a short tap (5 ticks): how high the feet are i ticks after the press (0 = the tick of the press). For the on-screen calls and the test bots.
export const TAP = (() => { const a = []; let y = 0, vy = JUMP, hold = 12; for (let i = 0; i < 80; i++) { vy = Math.min(6.5, vy + (i < 5 && hold > 0 && vy < 0 ? G_HOLD : G)); if (hold > 0) hold--; y -= vy; if (vy > 0 && y <= 0) break; a.push(y); } return a; })();
// [first, last] tick, relative to T, at which a tap clears a floor thing (hw = half its width + 3, hh = its height, rv = how fast it closes, px a tick)
export function tapWindow(hw, hh, rv) {
  let lo = 0, hi = -99;
  for (let off = -50; off <= 0; off++) { let ok = true; for (let d = -40; d <= 40 && ok; d++) { if (Math.abs(d * rv) >= hw) continue; const i = d - off; if (!(i >= 0 && i < TAP.length && TAP[i] >= hh)) ok = false; } if (ok) { if (hi < -50) lo = off; hi = off; } }
  return [lo, hi];
}

// ---------- the course: a list of "moments", one new thing at a time, with breathing space between ----------
export function buildCourse(cs, lap, only) {
  const L = Math.max(0, Math.min(2, lap | 0)), v = SPEED[L], r = rng((cs + 1) * 7919 + L * 104729), ri = (a, b) => a + Math.floor(r() * (b - a + 1)), pick = (a) => a[Math.floor(r() * a.length)];
  const items = [], moments = [], swaps = [];
  let nid = 1, sw = 0;
  const REST = [40, 34, 30][L], BV = [5, 5.6, 6.2][L], CV = [2.6, 2.8, 3][L], BT = BOOMT[L], GAP = BT + 10;
  const DT = Math.round(208 / BV), CT = Math.round(208 / CV);  // how long a round / the car takes from one hero to the other
  const red = () => sw, blue = () => 1 - sw;                   // which SIDE is the red (forward) world right now
  const add = (k, s, T, o) => { const it = { k, s, T: Math.round(T), id: nid++, ...o }; items.push(it); return it; };
  const trap = (s, T) => add('low', s, T, { art: 'trap', ...SIZE.trap });
  // a round from the red gun at the red world's outer edge: one height all the way through both worlds
  const round = (T, y) => { const p = red(); return add('bullet', p, T, { art: y, y, dir: p ? -1 : 1, b: BV, ...SIZE[y] }); };
  const car = (T) => { const p = red(); return add('car', p, T, { art: 'car', dir: p ? -1 : 1, b: CV, ...SIZE.car }); };
  // the blast. RED: a wall blows up BT ticks before it gets to the red hero and its burning rubble arrives at m (jump it).
  // BLUE: the same thing backwards: the rubble arrives 10 ticks BEFORE the bang (jump it), then, on the tick red's wall blows, it leaps up and is a wall again behind him.
  const blast = (m) => { const R = red(), B = m - BT, a = add('low', R, m, { art: 'wall', ...SIZE.rubble, boom: B }), b = add('low', 1 - R, B - 10, { art: 'heap', ...SIZE.rubble, boom: B }); a.pair = b.id; b.pair = a.id; return a; };
  const M = {
    // barricades: red, then blue, then one in each at the same moment
    one(m, p, o) { trap(p, m); trap(o, m + 58 + ri(0, 6)); const d = 112 + ri(0, 6); trap(p, m + d); trap(o, m + d + ri(0, 3)); return d + 12; },
    // the wall: blue jumps the rubble, BANG (red bursts, blue rebuilds), red jumps the rubble
    boom1(m) { blast(m); if (L) trap(blue(), m + 40 + ri(0, 6)); return L ? 52 : 12; },
    // a shin-high round: jump it in red, then again in blue
    low1(m) { if (L) trap(blue(), m - 40 - ri(0, 4)); round(m, 'low'); if (L) trap(red(), m + DT + 40 + ri(0, 6)); return DT + (L ? 52 : 12); },
    // rounds overhead: stay down in both worlds, twice over, then a barricade soon after on one side
    // (lap 0: on the red side, where the round is gone first, and not out of the glass until that half's line is off)
    high1(m, p) { const n = m + DT + 20 + ri(0, 6), e = n + (L ? DT + 24 : 96) + ri(0, 6); if (L) trap(1 - p, m - 36 - ri(0, 4)); round(m, 'high'); round(n, 'high'); trap(L ? p : red(), e); return e - m + 14; },
    // two blasts: four jumps on lap 0; later the first wall's rubble and the second blast's heap come together
    boom2(m) { const e = L && r() < 0.5 ? GAP + ri(0, 2) : GAP + 46 + ri(0, 6); blast(m); blast(m + e); return e + 12; },
    // the car: through red, through the turnstile, on through blue tail first
    car1(m, p) { car(m); if (L) trap(p, m + 38 + ri(0, 6)); return CT + 12; },
    // finale: a round, a blast, a round (lap 0: low, the wall, then, once the rubble is behind both of them, two overhead)
    storm(m) { const y = L ? pick(['low', 'high']) : 'low', w = m + DT + GAP + (L ? 38 : 50) + ri(0, 4), n = w + (L ? 34 + ri(0, 6) : 96 + ri(0, 4)), e = L ? n : n + DT + 26 + ri(0, 4); round(m, y); blast(w); round(n, y === 'low' ? 'high' : 'low'); if (!L) round(e, 'high'); return e - m + DT + 10; },
  };
  const PRE = { boom1: GAP + 40, boom2: GAP + 40, low1: 46, high1: 46, car1: 46, storm: 46 };
  const order = ['one', 'boom1', 'low1', 'high1', 'swap', 'boom2', 'car1', 'storm'];
  let t = 215;
  for (const name of only || order) {
    if (name === 'swap') { swaps.push(t - 10); sw = 1 - sw; t += 60; continue; }      // the cage spins, the colours change sides, then a calm second
    const p = r() < 0.5 ? 0 : 1, m0 = t + (PRE[name] || 0), n0 = items.length, len = M[name](m0, p, 1 - p);
    for (let i = n0; i < items.length; i++) items[i].m = moments.length;
    moments.push({ name, a: t - 20, z: m0 + len + 10, p });
    t = m0 + len + REST + ri(0, 10);
  }
  // a = first tick it can be seen (for a round / the car: its tell), z = last tick it matters, T2 = when it passes the hero in the OTHER world, tx = the tick it goes through the glass
  const asks = [], nth = {};
  const ask = (it, T, s, type, need) => { const w = need === 'jump' ? tapWindow(it.w / 2 + 3, it.h, it.b || v) : [-Math.ceil((it.w / 2 + 3) / it.b), Math.ceil((it.w / 2 + 3) / it.b)]; asks.push({ T, s, type, need, id: it.id, lo: w[0], hi: w[1] }); };
  for (const it of items) {
    if (it.k === 'bullet') { it.go = Math.floor(it.T - 66 / it.b); it.a = it.go - 70; it.z = Math.ceil(it.T + 274 / it.b) + 36; }
    else if (it.k === 'car') { it.go = Math.floor(it.T - 80 / it.b); it.a = it.go - 60; it.z = Math.ceil(it.T + 290 / it.b); }
    else { it.a = Math.floor(it.T - (110 + it.w / 2) / v); it.z = Math.ceil(it.T + (64 + it.w / 2) / v); }
    if (it.k === 'low') ask(it, it.T, it.s, it.art === 'trap' ? 'trap' : 'rubble', 'jump');
    else { it.T2 = Math.round(it.T + 208 / it.b); it.tx = Math.ceil(it.T + 104 / it.b); const type = it.k === 'car' ? 'car' : it.y, need = it.y === 'high' ? 'stay' : 'jump'; ask(it, it.T, it.s, type, need); ask(it, it.T2, 1 - it.s, type, need); }
  }
  asks.sort((a, b) => a.T - b.T || a.s - b.s);
  // lap 0: one thing at a time. An overhead round's sight line does not come up until the last floor jump before it (either hero's) has landed.
  if (!L) for (const it of items) if (it.y === 'high') { let f = -999; for (const a of asks) if (a.need === 'jump' && a.T < it.T - 40) f = Math.max(f, a.T); it.a = Math.max(it.a, f + 22); }
  items.sort((a, b) => a.a - b.a || a.id - b.id);
  for (const a of asks) { const key = a.type === 'rubble' ? 'blast' : a.type, seen = nth[key] || (nth[key] = { n: 0, ids: {} }), id = a.type === 'rubble' ? Math.min(a.id, items.find((i) => i.id === a.id).pair) : a.type === 'trap' ? a.T + ':' + a.s : a.id; if (!seen.ids[id]) seen.ids[id] = ++seen.n; a.n = seen.ids[id]; }   // n = the how-manyth of its kind this is (for the lap-0 calls)
  return { cs, lap: L, v, items, asks, moments, swaps, end: t - REST + 40, nflag: nid };
}

// where an item is on screen at tick t
export const itemX = (C, it, t) => (it.k === 'bullet' || it.k === 'car' ? HX[it.s] + it.dir * (t - it.T) * it.b : HX[it.s] + (it.s ? -1 : 1) * (it.T - t) * C.v);

const newHero = () => ({ y: FL, vy: 0, ground: true, jumps: 0, hold: 0 });
export function setup(st, cs, only) {
  const C = buildCourse(cs, st.lap || 0, only);
  st.C = C; st.H = [newHero(), newHero()]; st.fl = new Array(C.nflag).fill(0); st.inv = 0; st.shake = 0; st.lo = 0; st.mi = 0; st.mhit = 0; st.sw = 0; st.si = 0; st.swT = -999;
  st.fx = []; st.fin = -1; st.hits = 0; st.clean = 0; st.hx = [HX[0], HX[1]]; st.last = ''; st.hitT = -999; st.hitS = 0;
}
export function init(st) { setup(st, Math.floor(st.rnd() * NCOURSE) % NCOURSE); }

// why = a key of WHY, s = the half it happened in (draw says so on that half)
function hurt(st, why, s) { if (st.inv > 0) return; st.hp--; st.inv = 90; st.shake = 10; st.mhit = 1; st.hits++; st.last = why; st.hitT = st.t; st.hitS = s; st.events.push('hit'); st.fx.push({ k: 'hit', t: st.t }); }

export function update(st, inp) {
  const C = st.C, t = st.t, H = st.H;
  if (st.inv > 0) st.inv--; if (st.shake > 0) st.shake--;
  while (st.fx.length && st.fx[0].t < t - 70) st.fx.shift();
  if (st.si < C.swaps.length && t >= C.swaps[st.si]) { st.si++; st.sw = 1 - st.sw; st.swT = t; st.events.push('warp'); }
  if (t >= C.end) {                                             // both run into the turnstile and merge
    if (st.fin < 0) { st.fin = 0; st.events.push('whoosh'); }
    st.fin++;
    const k = Math.min(96, st.fin * 1.6); st.hx[0] = HX[0] + k; st.hx[1] = HX[1] - k;
    for (const h of H) if (!h.ground) { h.vy = Math.min(6.5, h.vy + G); h.y += h.vy; if (h.y >= FL) { h.y = FL; h.vy = 0; h.ground = true; h.jumps = 0; } }
    if (st.fin === 60) { st.events.push('portal'); st.bonus += 30; }
    if (st.fin >= 100) st.done = true;
    return;
  }
  const its = C.items; while (st.lo < its.length && its[st.lo].z < t) st.lo++;
  let jumped = 0;
  for (let s = 0; s < 2; s++) {
    const h = H[s];
    if (inp.pressed) {
      if (h.ground) { h.vy = JUMP; h.ground = false; h.jumps = 1; h.hold = 12; jumped |= 1; }
      else if (h.jumps < 2) { h.vy = JUMP2; h.jumps = 2; h.hold = 8; jumped |= 2; }
    }
    if (!inp.down) h.hold = 0;
    if (!h.ground) {
      h.vy = Math.min(6.5, h.vy + (inp.down && h.hold > 0 && h.vy < 0 ? G_HOLD : G)); if (h.hold > 0) h.hold--; h.y += h.vy;
      if (h.vy > 0 && h.y >= FL) { h.y = FL; h.vy = 0; h.ground = true; h.jumps = 0; }
    }
  }
  if (jumped & 1) st.events.push('jump'); else if (jumped & 2) st.events.push('djump');
  // the items
  for (let i = st.lo; i < its.length && its[i].a <= t; i++) {
    const it = its[i]; if (it.z < t) continue;
    const k = it.k, x = itemX(C, it, t);
    if (k === 'bullet' || k === 'car') {                         // crosses both worlds at one height
      const s = x < SEAM ? 0 : 1, h = H[s];
      if (t === it.a + 2 || (k === 'car' && t === it.a + 30)) st.events.push('warn');
      if (k === 'bullet' && t === it.go) st.events.push('shot');
      if (t === it.tx) st.events.push(k === 'bullet' ? 'zap' : 'whoosh');
      if (Math.abs(x - SEAM) < 14 + (k === 'car' ? it.w / 2 : 0)) continue;      // inside the turnstile it touches nobody
      if (Math.abs(x - HX[s]) >= it.w / 2 + 3) continue;
      if (k === 'car') { if (h.y > FL - it.h) hurt(st, 'car', s); }
      else if (it.y === 'high') { if (h.y < FL - it.h) hurt(st, 'high', s); }      // overhead: only someone in the air is in its way
      else if (h.y > FL - it.h) hurt(st, 'low', s);
      continue;
    }
    if (it.art === 'wall') { if (it.boom === t) { st.events.push('bomb'); st.shake = Math.max(st.shake, 5); } else if (it.boom === t + 40) st.events.push('warn'); }
    if (Math.abs(x - HX[it.s]) < it.w / 2 + 3 && H[it.s].y > FL - it.h) hurt(st, it.art === 'trap' ? 'trap' : 'rubble', it.s);
  }
  // score: staying alive, and every moment come through clean
  if (t % 10 === 0) st.bonus++;
  const ms = C.moments;
  if (st.mi < ms.length && t > ms[st.mi].z) { if (!st.mhit) { st.bonus += 20; st.clean++; st.events.push('good'); st.fx.push({ k: 'clean', t }); } st.mi++; st.mhit = 0; }
}

// ---------- for the tests: a small copy of everything update() changes ----------
export function snap(st) { return { t: st.t, hp: st.hp, bonus: st.bonus, done: st.done, inv: st.inv, shake: st.shake, lo: st.lo, mi: st.mi, mhit: st.mhit, sw: st.sw, si: st.si, swT: st.swT, fin: st.fin, hits: st.hits, clean: st.clean, last: st.last, hitT: st.hitT, hitS: st.hitS, fl: st.fl.slice(), H: st.H.map((h) => ({ ...h })), hx: st.hx.slice() }; }
export function restore(st, s) { Object.assign(st, s, { fl: s.fl.slice(), H: s.H.map((h) => ({ ...h })), hx: s.hx.slice() }); st.fx.length = 0; st.events.length = 0; }
export function fresh(cs, lap = 0, hp = 5, only) { const st = { hp, bonus: 0, events: [], done: false, t: 0, seed: cs, lap, level: 5, rnd: () => 0 }; setup(st, cs, only); return st; }
export function tick(st, pressed, down) { st.t++; st.events.length = 0; if (!st.done) update(st, { pressed, down }); }

// ---------- THE BOSS: YOUR PAST SELF (rules only; the drawing is in tenet.js) ----------
// The turnstile room, crossed NX times, there and back. On every crossing:
//   1. the room throws things on the FLOOR (a hatch that drops open, a crate, two crates on a dolly, a floor laser, a shin-high round): ANY jump clears each one,
//      a tap or a held jump alike, if it is roughly on time. Nothing in the room asks for a particular kind of jump, and nothing asks you to stay down;
//   2. every crossing made so far comes back at you as YOU, INVERTED IN TIME (running backwards), in the air exactly where you jumped.
// The crossing is planned the moment you step into the turnstile (plan below): each past self is slotted in, its start moved in steps of 6 ticks,
// so that an unhurt way through still exists with +-S ticks to spare on every press, whatever was recorded. One that cannot be slotted is a
// PARADOX: it flickers out as it leaves its machine and cannot hurt. Everything that can hurt is a row in st.bad[r] (r = ticks since he set off):
// [lo, hi, source] = his feet must not be between lo and hi on that tick. update() and the planner read the same table.
export const PS = { L: 12, R: 308, RUN: 1.3, LEN: 228, NX: 6, TELLG: 30, TELLR: 54 };
// a hazard meets the hero at run tick re, at x = start + dir * RUN * re. mv = how fast it comes at him (0 = it is part of the floor)
export const HZ = {                                             // every one of them: JUMP (a tap clears it, so does a held jump)
  pit: { w: 22, mv: 0, lo: FL - 0.5, hi: 999, pad: 0 },         // a floor hatch drops open
  crate: { w: 16, mv: 1, lo: FL - 13, hi: 999, pad: 4 },        // a crate sliding at you
  cart: { w: 28, mv: 1.6, lo: FL - 13, hi: 999, pad: 4 },       // two crates on a dolly
  sweep: { w: 26, mv: 1.5, lo: FL - 5, hi: 999, pad: 4 },       // a laser cart along the floor
  low: { w: 8, mv: 5, lo: FL - 8, hi: 999, pad: 4 },            // a round at shin height
};
// what each crossing throws (two layouts each; the number = how far into the crossing it meets him, in px)
const PSETS = [
  [[['crate', 84], ['pit', 168], ['low', 246]], [['pit', 80], ['crate', 164], ['low', 244]]],
  [[['sweep', 76], ['cart', 156], ['low', 238]], [['low', 70], ['crate', 152], ['sweep', 236]]],
  [[['cart', 84], ['pit', 222]], [['pit', 70], ['cart', 212]]],
  [[['low', 66], ['pit', 240]], [['crate', 58], ['sweep', 244]]],
  [[['sweep', 64], ['crate', 252]], [['pit', 60], ['low', 240]]],
  [[['crate', 56], ['cart', 256]], [['low', 54], ['pit', 258]]],
];
export const hazX = (hz, r) => hz.x + hz.dir * hz.mv * (hz.re - r);
// the hero's own jumps, tick by tick from the press to the landing: [ticks held, tick of the second press (-1 = none), ticks that one is held]
// (the planner only uses the first three, the single jumps, and only as one move: every one of them, short tap to full hold, must work from the same press)
export const ARC_DEF = [[3, -1, 0], [7, -1, 0], [13, -1, 0], [4, 12, 4], [4, 18, 8], [4, 23, 8], [13, 14, 8], [13, 20, 8], [13, 26, 8], [13, 32, 8], [1, -1, 0]];
function arcY(h1, d, h2) {
  const ys = []; let y = FL, vy = JUMP, hold = 12;
  for (let i = 0; i < 120; i++) {
    const down = i < h1 || (d >= 0 && i >= d && i < d + h2);
    if (i === d) { vy = JUMP2; hold = 8; }
    if (!down) hold = 0;
    vy = Math.min(6.5, vy + (down && hold > 0 && vy < 0 ? G_HOLD : G)); if (hold > 0) hold--; y += vy;
    if (vy > 0 && y >= FL) { ys.push(FL); break; } ys.push(y);
  }
  return ys;
}
export const ARCS = ARC_DEF.map((a) => arcY(a[0], a[1], a[2]));
const clearAt = (row, y) => { if (row) for (let i = 0; i < row.length; i++) { const b = row[i]; if (y > b[0] && y < b[1]) return false; } return true; };
// is there an unhurt way across? Every press may be S ticks early or late, and may be a tap or a held jump (no double jumps needed, ever).
// Returns the presses [[run tick, ARC_DEF entry (a tap)]...] or null.
export const ANY = [10, 0, 2];          // the shortest blip of a tap, a tap, a full hold (everything between lies between them)
export function pastPlan(bad, S) {
  const N = PS.LEN - 1, ok = new Uint8Array(N + 1), from = new Array(N + 1).fill(null); ok[0] = 1;
  const g = (q) => q > N || clearAt(bad[q], FL);
  for (let r = 0; r < N; r++) {
    if (!ok[r]) continue;
    if (!ok[r + 1] && g(r + 1)) { ok[r + 1] = 1; from[r + 1] = [r, -1, 0]; }
    const p = r + 1 + S;
    { const end = p + S + ARCS[2].length - 1, e = Math.min(end, N);
      if (ok[e]) continue;
      let good = true;
      for (const a of ANY) { const Y = ARCS[a], n = Y.length;
        for (let sh = -S; sh <= S && good; sh++) {
          for (let q = r + 1; q < p + sh && good; q++) good = g(q);
          for (let i = 0; i < n && good; i++) { const q = p + sh + i; if (q <= N) good = clearAt(bad[q], Y[i]); }
          for (let q = p + sh + n; q <= end && good; q++) good = g(q);
        } }
      if (good) { ok[e] = 1; from[e] = [r, p, 0]; }
    }
  }
  if (!ok[N]) return null;
  const out = []; for (let e = N; e > 0;) { const f = from[e]; if (f[1] >= 0) out.push([f[1], ARC_DEF[f[2]]]); e = f[0]; }
  return out.reverse();
}
const addRows = (bad, rows, src) => { for (const w of rows) (bad[w[0]] = bad[w[0]] || []).push([w[1], w[2], src]); };
const popRows = (bad, rows) => { for (const w of rows) bad[w[0]].pop(); };
function hazRows(hz, x0, dir) {
  const T = HZ[hz.k], rows = [], half = hz.w / 2 + T.pad;
  for (let r = 1; r < PS.LEN; r++) if (Math.abs(x0 + dir * PS.RUN * r - hazX(hz, r)) < half) rows.push([r, T.lo, T.hi]);
  return rows;
}
// a past self set off d ticks after you: the ticks on which it is level with you, and how high its feet are then
function ghostRows(g, d, x0, dir) {
  const rows = [], len = g.rec.length;
  for (let r = Math.max(1, d); r < PS.LEN && r - d < len; r++) { const p = g.rec[g.rev ? len - 1 - (r - d) : r - d]; if (Math.abs(x0 + dir * PS.RUN * r - p[0]) < 7) rows.push([r, p[1] - 20, p[1] + 27, p[1]]); }
  return rows;
}
function planCrossing(st) {
  const n = st.n, dir = n % 2 ? 1 : -1, x0 = dir > 0 ? PS.L : PS.R, lap = st.lap || 0, rnd = st.rnd, bad = [];
  for (let r = 0; r < PS.LEN; r++) bad.push(null);
  st.haz = PSETS[n - 1][rnd() < 0.5 ? 0 : 1].map(([k, xe]) => {
    const T = HZ[k], re = Math.round((xe + Math.floor(rnd() * 13) - 6) / PS.RUN), mv = T.mv + (lap && T.mv >= 5 ? 1 : 0) + (lap && T.mv > 0 && T.mv < 5 ? 0.25 : 0), w = T.w + (lap ? (k === 'pit' ? 2 : 0) : 0);
    return { k, re, x: x0 + dir * PS.RUN * re, dir, mv, w, why: k, hitT: -99, fire: mv >= 5 ? Math.round(re - (296 - PS.RUN * re) / mv) : -999 };
  });
  for (const hz of st.haz) addRows(bad, hz.rows = hazRows(hz, x0, dir), hz);
  while (st.haz.length && !pastPlan(bad, st.S)) { const hz = st.haz.pop(); popRows(bad, hz.rows); st.dropped++; }   // never happens in the tests: a room that cannot be crossed loses a hazard
  for (const hz of st.haz) delete hz.rows;
  // the past selves: one per crossing made, spread over the crossing, each nudged until the whole thing can still be done
  const m = n - 1, dmin = PS.TELLG - st.HT, dmax = 180, placed = [], order = [];
  for (let k = m; k >= 1; k--) order.splice(Math.floor(rnd() * (order.length + 1)), 0, k);
  st.ghosts = order.map((k, j) => {
    const src = st.recs[k], g = { k, s: 0, rec: src, rev: k % 2 === n % 2, dead: false, done: false, warned: false, out: false, fizz: false, ghost: true, why: 'inverted you ' + k, mr: 0, mx: 0, my: FL };
    const d0 = Math.round(dmin + ((dmax - dmin) * (j + 0.5)) / m + rnd() * 16 - 8);
    for (let c = 0; c <= 60; c++) {
      const d = d0 + (c % 2 ? 1 : -1) * Math.ceil(c / 2) * 3; if (d < dmin || d > dmax || placed.some((q) => Math.abs(q - d) < 20)) continue;
      const rows = ghostRows(g, d, x0, dir); if (!rows.length) continue;
      addRows(bad, rows, g);
      if (pastPlan(bad, st.S)) { const mid = rows[rows.length >> 1]; g.s = st.HT + d; g.mr = mid[0]; g.mx = x0 + dir * PS.RUN * mid[0]; g.my = mid[3]; placed.push(d); return g; }
      popRows(bad, rows);
    }
    g.fizz = true; g.s = st.HT + Math.max(dmin, Math.min(dmax, d0)); st.paradox++; return g;
  });
  st.bad = bad;
}
function enter(st, wallX) { st.n++; st.phase = 'hold'; st.ct = 0; st.wallX = wallX; st.h.mode = 'stand'; planCrossing(st); }
export function pastInit(st) {
  const lap = st.lap || 0;
  st.HT = lap >= 2 ? 96 : lap ? 110 : 130; st.S = lap ? 2 : 3; st.INV = lap ? 45 : 60;
  st.n = 0; st.recs = {}; st.rec = []; st.ghosts = []; st.gone = []; st.haz = []; st.bad = []; st.flash = 0; st.spin = [0, 0]; st.mergeT = 0; st.lock = 0; st.paradox = 0; st.dropped = 0; st.hitsN = 0; st.merge = null;
  st.h.x = PS.L; st.h.dir = 1; enter(st, PS.L); st.ct = st.HT - 60;
}
// K = { hurt, win, pop } from bosskit (passed in so this file needs no imports)
export function pastUpdate(st, inp, K) {
  const h = st.h; if (st.flash > 0) st.flash--;
  for (const g of st.gone) g.fade--; st.gone = st.gone.filter((g) => g.fade > 0);
  if (st.won) { st.mergeT++; st.lock = Math.min(1, st.lock + 0.05); return; }
  st.ct++;
  const dir = st.n % 2 ? 1 : -1, r = st.ct - st.HT, holdL = st.phase === 'hold' && dir > 0, holdR = st.phase === 'hold' && dir < 0;
  st.spin[0] += holdL ? 0.16 : 0.012; st.spin[1] -= holdR ? 0.16 : 0.012;
  if (st.phase === 'hold') {
    h.x = st.wallX;
    if (r >= -90 && r < 0 && r % 30 === 0) st.events.push('warn');
    if (r >= 0) { st.phase = 'run'; h.mode = 'run'; st.rec = []; st.flash = 6; st.events.push('whoosh'); K.pop(st, dir > 0 ? 'FORWARD' : 'INVERTED', 160, 58); }
  } else {
    st.rec.push([h.x, h.y]);
    if (h.dir !== dir) {                                 // he has reached the far wall: through the turnstile
      st.recs[st.n] = st.rec;
      for (const g of st.ghosts) if (!g.dead && !g.done && st.ct >= g.s) st.gone.push({ ...g, tau: st.ct - g.s, fade: 20 });
      st.ghosts = []; st.haz = []; st.bad = [];
      if (st.n === PS.NX) { st.flash = 16; st.merge = []; for (let k = 1; k < PS.NX; k++) st.merge.push({ k, x: h.x + 40 + k * 26, y: FL }); st.events.push('good'); K.win(st, 'TIME RESTORED  +500'); return; }
      st.flash = 12; st.events.push('good'); enter(st, h.x);
      return;
    }
    const row = st.bad[r];
    if (row) for (const b of row) {
      const src = b[2]; if (src.dead || !(h.y > b[0] && h.y < b[1])) continue;
      if (K.hurt(st, src.why)) { h.inv = st.INV; st.hitsN++; if (src.ghost) { src.dead = true; st.gone.push({ ...src, tau: st.ct - src.s, fade: 20, hit: true }); } else src.hitT = st.ct; }
    }
  }
  for (const hz of st.haz) {
    if (hz.k === 'pit' && r === hz.re - 75) st.events.push('crumble');
    if (hz.fire > -999) { if (r === hz.fire - PS.TELLR) st.events.push('warn'); if (r === hz.fire) st.events.push('shot'); }
    if (hz.k === 'sweep' && r === hz.re - 60) st.events.push('zap');
  }
  for (const g of st.ghosts) {
    if (g.dead || g.done) continue;
    const tau = st.ct - g.s;
    if (!g.warned && tau >= -PS.TELLG) g.warned = true;
    if (tau < 0) continue;
    if (!g.out) { g.out = true; st.events.push('whoosh'); }
    if (g.fizz && tau >= 26) { g.done = true; st.gone.push({ ...g, tau, fade: 24, par: true }); st.events.push('zap'); K.pop(st, 'PARADOX', g.rec[g.rev ? g.rec.length - 1 - tau : tau][0], 110); continue; }
    if (tau >= g.rec.length) g.done = true;
  }
}

// ---------- the run level's layout (sim.js spawnFilm reads danger.film): sized from the level's length Z (sim.js ZONE_PX) ----------
// The first thing turns up ~710 px in (sim.js startZone) and the quiet run-out starts 540 px before the end: the turnstile goes halfway between,
// so the way back (the same ground, mirrored about the turnstile) fills the rest of the level exactly. Places: hangar 23%, motorway 50%, battlefield 27% of the way out.
export function filmDanger(Z) {
  const pre = 100, post = 160, s0 = 710, mid = Math.round((Z + s0 - 540 - post + pre) / 2), out = mid - pre - s0;
  return { film: { mid, pre, post, scenes: [s0 + Math.round(out * 0.23), s0 + Math.round(out * 0.73)] }, gunner: { rev: true }, ride: { fly: true, chance: 0, ticks: 150 }, box: { shield: 10, bomb: 8 } };
}
