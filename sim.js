// FWAHBL Run: deterministic game simulation (v4).
// Shared by the browser (to play) and the server (to replay and verify).
// RULES: integer maths only (no floats, no Math.random, no Date) so the
// same seed + inputs give the same score on every device and on the server.

export const VERSION = 13;
export const FP = 256;                 // sub-pixels per pixel
export const W = 320, H = 180;         // the camera view
export const WORLD_H = 240;            // world is taller than the view: camera pans
export const DECK_Y = 200;             // main deck (feet line)
export const LEDGE_Y = 160;            // second level ledges
export const GALLERY_Y = 110;          // upper gallery where unicorns stand
export const PIPE_Y = 122;             // acid pipe outlets
export const LAVA_Y = 214;
export const BLOCK = 16, BLOCK_BOTTOM = 134;
export const PLAYER_SX = 72;
export const HERO_H = 30;
export const TPS = 60;
export const MAX_TICKS = TPS * 60 * 20;
export const MAX_HP = 5;
export const PX_PER_METRE = 8;
export const ZONE_PX = 4800;           // a new zone every ~35 s
export const ZONES = 5;                // zones before the loop repeats (harder)
export const SAFE_BEFORE = 120, SAFE_AFTER = 1060;  // no danger around zone gates (px): lasts until the zone title has gone
export const POWER_TICKS = 600;
export const TWIN_BONUS = 500;          // stomp both end-of-level twins        // triple jump / invincibility last 10 s
const CALM_PX = 1000;                  // after the code unlocks: no danger while the message is up
export const TARGET = 1111;            // past this, difficulty ramps up

const G = 80, G_HOLD = 40, JUMP_V = -1100, DJUMP_V = -960, MAX_FALL = 1700;
const HOLD_TICKS = 12, COYOTE = 6, INVULN = 70;
const SPEED0 = 560, SPEED_CAP = 860;   // speed rises a little; difficulty mostly comes from layout
const BLOB_G = 26, DRIP_G = 22;
const BLOCK_TOP = BLOCK_BOTTOM - BLOCK;
const SIN = [0, 6, 12, 19, 24, 30, 36, 41, 45, 49, 53, 56, 59, 61, 63, 64, 64, 64, 63, 61, 59, 56, 53, 49, 45, 41, 36, 30, 24, 19, 12, 6, 0, -6, -12, -19, -24, -30, -36, -41, -45, -49, -53, -56, -59, -61, -63, -64, -64, -64, -63, -61, -59, -56, -53, -49, -45, -41, -36, -30, -24, -19, -12, -6];

// mulberry32, with its state kept inside the sim so a run can be copied exactly
function R(s) {
  s.ra = (s.ra + 0x6D2B79F5) | 0;
  let t = Math.imul(s.ra ^ (s.ra >>> 15), 1 | s.ra);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return (t ^ (t >>> 14)) >>> 0;
}

export function createSim(seed) {
  return {
    seed: seed >>> 0, ra: seed | 0, tick: 0, dist: 0, speed: SPEED0,
    y: DECK_Y * FP, vy: 0, onGround: true, groundY: DECK_Y * FP, plat: -1, coyote: 0, jumps: 0, hold: 0, down: false,
    hp: MAX_HP, invuln: 0, triple: 0, star: 0, calmTo: 0, boss: -1, bonus: 0, dead: false, cause: '',
    gaps: [], plats: [], puddles: [], pipes: [], drips: [], blobs: [], unicorns: [], goblins: [], flyers: [], pickups: [], blocks: [],
    nextX: 460 * FP, lastMulti: 0, solidTo: 0, pend: false, events: [], uid: 0, kills: 0, owed: 0, cleared: -1, hard: false, hardTick: 0, hardDist: 0, chasms: 0,
  };
}

export const score = (s) => Math.floor(s.dist / (PX_PER_METRE * FP)) + s.bonus;
export const playerX = (s) => s.dist + PLAYER_SX * FP;
export const zoneOf = (worldX) => Math.floor(worldX / (ZONE_PX * FP));
export const platX = (p, tick) => (p.kind === 'moveh' ? p.x + Math.floor((SIN[(Math.floor((tick * 64) / p.period) + p.ph) & 63] * p.amp) / 64) : p.x);
export const platY = (p, tick) => (p.kind === 'movev' ? p.baseY + Math.floor((SIN[(Math.floor((tick * 64) / p.period) + p.ph) & 63] * p.amp) / 64) : p.y);

function inGap(s, x) {
  for (const g of s.gaps) if (x >= g.x && x < g.x + g.w) return true;
  return false;
}
const deckUnder = (s, x) => !(inGap(s, x - 3 * FP) && inGap(s, x + 3 * FP));
const onBlock = (s, x) => s.blocks.some((b) => x + 4 * FP > b.x && x - 4 * FP < b.x + BLOCK * FP);
const overPlat = (p, x) => !p.gone && x + 4 * FP > p.cx && x - 4 * FP < p.cx + p.w;
const overlap = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;

// difficulty: zone number + loop, plus a ramp once you pass the target score
const level = (s) => Math.min(14, zoneOf(s.dist) * 2 + (s.hard ? 2 + Math.floor((s.dist - s.hardDist) / (FP * 1500)) : 0));

function die(s, cause) { s.dead = true; s.cause = cause; s.events.push('die'); }
function hit(s, cause) {
  if (s.invuln > 0 || s.star > 0 || s.dead) return;
  s.hp--; s.invuln = INVULN; s.events.push('hit');
  if (s.hp <= 2 && s.owed === 0) s.owed = 1;      // a jacket turns up when you're low
  if (s.hp <= 0) die(s, cause);
}

// ---- world generation -------------------------------------------------
function tokenArc(s, x, baseY, n, high) {
  for (let i = 0; i < n; i++) {
    const mid = Math.abs(i * 2 - (n - 1));
    const lift = high ? 46 - mid * 6 : 20 - mid * 3;
    s.pickups.push({ id: s.uid++, kind: 'token', x: x + i * 18 * FP, y: (baseY - 10 - lift) * FP });
  }
  return n * 18 * FP;
}
function addPlat(s, kind, x, w, y, extra = {}) {
  const p = { id: s.uid++, kind, x, cx: x, w, y, baseY: y, amp: 0, period: 120, ph: 0, crumble: -1, gone: false, ...extra };
  s.plats.push(p); return p;
}
function addGroundUnicorn(s, x, y) {
  s.unicorns.push({ id: s.uid++, kind: 'ground', x, y, fired: false, t: 0, n: 2 + (level(s) >= 6 ? 1 : 0), dead: false });
}
function addGoblin(s, kind, x, y) {
  const r = () => R(s), lvl = level(s);
  const vx = kind === 'grunt' ? -(50 + (r() % 50) + lvl * 5) : kind === 'puker' ? -(30 + (r() % 20)) : kind === 'brute' ? -(26 + lvl * 3)
    : kind === 'scientist' ? -(22 + (r() % 12)) : kind === 'biker' ? -(300 + (r() % 60) + lvl * 10) : -(14 + (r() % 10));
  s.goblins.push({ id: s.uid++, kind, x, y, baseY: y, vx, active: false, falling: false, vy: 0, t: r() % 40, hp: kind === 'brute' ? 2 + (lvl >= 10 ? 1 : 0) : 1, stun: 0, air: false });
}

// what can appear, by zone (introduced gradually); later loops reuse everything
const UNLOCK = {
  gap: 0, pipe: 0, gallery: 0, groundUni: 0, grunt: 0, tokens: 0, blocks: 0, ledge: 0, jacket: 0, bat: 0, tiers: 0, steps: 0,
  puker: 1, brute: 1, pegasus: 1,
  ghoul: 2, highsteps: 2, elevator: 2, slime: 2,
  slider: 3, crumble: 3,
  combo: 4, biker: 4,
};
const WEIGHTS = { tiers: 12, gap: 14, pipe: 10, gallery: 9, groundUni: 7, grunt: 10, tokens: 5, blocks: 24, ledge: 11, jacket: 3, bat: 7,
  steps: 12, puker: 8, brute: 6, pegasus: 4, ghoul: 7, highsteps: 7, elevator: 7, slider: 7, crumble: 7, combo: 10, slime: 5, biker: 4 };

const MULTI = new Set(['ledge', 'tiers', 'steps', 'highsteps', 'elevator', 'slider', 'crumble', 'combo']);
const MULTI_EVERY = 700;
const GAPPY = new Set(  // patterns that can leave a hole in the floor
  ['gap', 'steps', 'highsteps', 'elevator', 'slider', 'crumble', 'ledge', 'tiers', 'combo']);               // px of flat running allowed before a multi-storey section is forced

function spawn(s) {
  const r = () => R(s), x = s.nextX, sp = s.speed, lvl = level(s), z = zoneOf(x);
  // quiet stretch around each zone gate: only coins, no danger
  const gate = (z + 1) * ZONE_PX * FP;
  // code just unlocked: nothing (not even the twins) until its message has gone
  if (x < s.calmTo || s.pend) { tokenArc(s, x + 40 * FP, DECK_Y, 4, 1); s.nextX = Math.max(x + 160 * FP, s.calmTo); return; }
  // end-of-level boss: the evil scientist twins run in, lobbing acid. Spaced so one
  // stomp bounces you straight onto the second twin's head.
  if (s.boss !== z && x > gate - (SAFE_BEFORE + 420 + 400) * FP) {
    s.boss = z;
    if (x > gate - (SAFE_BEFORE + 420 + 60) * FP) { s.nextX = Math.max(x + 40 * FP, gate - (SAFE_BEFORE + 420) * FP + FP); return; }   // no room left: no twins this level
    const run = -(90 + Math.min(40, level(s) * 3));
    const bounceTicks = 22, gapPx = Math.floor((bounceTicks * (s.speed + 40 - run)) / FP);
    const x0 = Math.min(x + 60 * FP, gate - (SAFE_BEFORE + 300) * FP);
    for (let i = 0; i < 2; i++) {
      s.goblins.push({ id: s.uid++, kind: 'scientist', twin: z, shoe: i, x: x0 + i * gapPx * FP, y: DECK_Y * FP, baseY: DECK_Y * FP, vx: run,
        active: false, falling: false, vy: 0, t: 20 + i * 48, hp: 1, stun: 0, air: false });
    }
    s.events.push('bossspawn');
    s.nextX = Math.max(x + (gapPx + 120) * FP, gate - (SAFE_BEFORE + 420) * FP + FP);
    return;
  }
  if (x > gate - (SAFE_BEFORE + 420) * FP) {
    tokenArc(s, gate + 60 * FP, DECK_Y, 5, 1);
    s.nextX = gate + SAFE_AFTER * FP;
    return;
  }
  const table = Object.keys(UNLOCK).filter((k) => UNLOCK[k] <= z);
  const total = table.reduce((a, k) => a + WEIGHTS[k], 0);
  let roll = r() % total, kind = 'gap';
  for (const k of table) { if (roll < WEIGHTS[k]) { kind = k; break; } roll -= WEIGHTS[k]; }
  // every level keeps you jumping between storeys: never a long flat run without one
  if (!MULTI.has(kind) && x - s.lastMulti > MULTI_EVERY * FP) kind = z >= 1 && r() % 3 === 0 ? 'steps' : 'tiers';
  if (s.owed > 0 && !MULTI.has(kind) && kind !== 'gap') { kind = 'jacket'; s.owed = 0; }
  // after a climb the camera is up high and the floor is off screen: no holes until you're back down and can see it
  if (x < s.solidTo && GAPPY.has(kind)) kind = r() % 2 ? 'tokens' : 'grunt';
  if (MULTI.has(kind)) s.lastMulti = x;
  const before = s.plats.length, len = build(s, kind, x, sp, lvl, z);
  if (s.plats.slice(before).some((p) => p.y <= LEDGE_Y * FP)) s.solidTo = x + len + 60 * FP + 40 * sp;
  const spacing = Math.max(46, 130 + (r() % 80) - lvl * 7) * FP + sp * 10;
  s.nextX = x + len + spacing;
}

function build(s, kind, x, sp, lvl, z) {
  const r = () => R(s);
  const full = 37 * sp;                         // one full jump, sub-px
  if (kind === 'gap') {
    let pct = 40 + (r() % 35) + Math.min(20, lvl * 2);
    if (lvl >= 4 && r() % 100 < 6 + lvl * 2) pct = 100 + (r() % 12);
    const w = Math.floor((full * Math.min(112, pct)) / 100);
    s.gaps.push({ id: s.uid++, x, w });
    return w;
  }
  if (kind === 'pipe') {
    const px = x + 12 * FP;
    const period = 70 - Math.min(34, lvl * 3) + (r() % 30);
    s.pipes.push({ id: s.uid++, x: px, period, phase: r() % period });
    s.puddles.push({ id: s.uid++, x: px - 9 * FP, w: 18 * FP, y: DECK_Y * FP, pipe: true });
    return 30 * FP;
  }
  if (kind === 'gallery') {
    const n = 1 + (r() % 2) + (lvl >= 6 ? 1 : 0);
    s.unicorns.push({ id: s.uid++, kind: 'gallery', x: x + 60 * FP, y: GALLERY_Y * FP, fired: false, t: 0, n, dead: false });
    return 70 * FP;
  }
  if (kind === 'groundUni') { addGroundUnicorn(s, x + 30 * FP, DECK_Y * FP); return 50 * FP; }
  if (kind === 'grunt' || kind === 'puker' || kind === 'brute' || kind === 'ghoul' || kind === 'slime' || kind === 'scientist' || kind === 'biker') {
    addGoblin(s, kind, x + 20 * FP, DECK_Y * FP);
    if (lvl >= 8 && kind === 'grunt' && r() % 2) addGoblin(s, 'grunt', x + 50 * FP, DECK_Y * FP);   // pairs later on
    return (kind === 'brute' ? 40 : 30) * FP;
  }
  if (kind === 'bat') {
    const n = 1 + (lvl >= 4 ? r() % 2 : 0) + (lvl >= 10 ? 1 : 0);
    for (let i = 0; i < n; i++) s.flyers.push({ id: s.uid++, kind: 'bat', x: x + (20 + i * 40) * FP, y: 0, baseY: (DECK_Y - 34 - (r() % 40)) * FP, vx: -(110 + (r() % 70)), ph: r() % 64, t: 0, active: false, dead: false });
    return 40 * FP;
  }
  if (kind === 'pegasus') {
    s.flyers.push({ id: s.uid++, kind: 'pegasus', x: x + 120 * FP, y: 70 * FP, vx: -(220 + (r() % 80)), t: 0, active: false, dead: false, dropped: false });
    return 60 * FP;
  }
  if (kind === 'jacket') {
    s.pickups.push({ id: s.uid++, kind: 'jacket', x: x + 16 * FP, y: (DECK_Y - (r() % 2 ? 48 : 22)) * FP });
    return 30 * FP;
  }
  if (kind === 'tokens') return tokenArc(s, x, DECK_Y, 3 + (r() % 3), r() % 2);
  if (kind === 'blocks') {                      // a single V box, never clustered
    if (s.blocks.some((b) => b.x > x - 160 * FP)) return tokenArc(s, x, DECK_Y, 3, 0);
    const roll2 = r() % 100;
    s.blocks.push({ id: s.uid++, x: x + 10 * FP, used: false, reward: roll2 < 44 ? 50 : roll2 < 68 ? 111 : roll2 < 80 ? 'hp' : roll2 < 90 ? 'triple' : 'star', bump: 0 });
    return 40 * FP;
  }
  if (kind === 'ledge') {
    const w = (96 + (r() % 120)) * FP;
    addPlat(s, 'ledge', x, w, LEDGE_Y * FP);
    const extra = r() % 4;
    if (extra === 0) tokenArc(s, x + 16 * FP, LEDGE_Y, Math.min(5, 2 + Math.floor(w / FP / 40)), 0);
    else if (extra === 1) addGoblin(s, z % ZONES === 1 ? 'puker' : 'grunt', x + w - 20 * FP, LEDGE_Y * FP);
    else if (extra === 2) addGroundUnicorn(s, x + w - 24 * FP, LEDGE_Y * FP);
    const under = r() % 3;
    if (under === 0 && w >= 110 * FP) s.gaps.push({ id: s.uid++, x: x + 40 * FP, w: w - 64 * FP });
    else if (under === 1) tokenArc(s, x + 20 * FP, DECK_Y, 3, 0);
    return w;
  }
  // ---- chasms you cross by hopping between floating platforms ----
  if (kind === 'steps' || kind === 'highsteps' || kind === 'elevator' || kind === 'slider' || kind === 'crumble') {
    // warm-up: the first chasms are wide, flat stepping stones with short hops;
    // each chasm you meet (and each loop) makes the next one a little tighter
    const loop = Math.floor(z / ZONES);
    const tight = Math.min(10, s.chasms + loop * 4);
    s.chasms++;
    if (tight < 2) kind = 'steps';                               // movers/crumble/high steps only once warmed up
    if (tight < 4 && kind === 'highsteps') kind = 'steps';
    const hopMax = Math.floor((full * (30 + tight * 3)) / 100);
    let cur = x + 24 * FP, h = 0, n = 0;
    const steps = Math.min(6, 1 + Math.floor(tight / 2) + (r() % 2));
    for (let i = 0; i < steps; i++) {
      const w = (56 - Math.min(30, tight * 3) + (r() % 8)) * FP;
      let dh = Math.floor(((r() % 36) - 14) * Math.min(1, tight / 6));
      if (kind === 'highsteps' && i % 2 === 1) dh = 58 + (r() % 8);    // too high for a single jump (max ~55px): needs a double
      h = Math.max(tight < 3 ? 0 : 8, Math.min(kind === 'highsteps' ? 96 : 12 + tight * 4, h + dh));
      if (kind === 'highsteps' && i % 2 === 0) h = Math.min(h, 30);   // drop back down so the next one is a real climb
      if (i === steps - 1) h = Math.min(h, 30);
      const y = (DECK_Y - h) * FP;
      let k = 'step', extra = {};
      if (kind === 'elevator' && i % 2 === 0) { k = 'movev'; extra = { amp: (14 + (r() % 12)) * FP, period: 110 + (r() % 70), ph: r() % 64 }; }
      if (kind === 'slider' && i % 2 === 1) { k = 'moveh'; extra = { amp: (14 + (r() % 10)) * FP, period: 120 + (r() % 60), ph: r() % 64 }; }
      if (kind === 'crumble' && i > 0) k = 'crumble';
      addPlat(s, k, cur, w, y, extra);
      if (r() % 3 === 0) s.pickups.push({ id: s.uid++, kind: 'token', x: cur + w / 2, y: y - 14 * FP });
      cur += w + Math.floor((hopMax * (70 + (r() % 30))) / 100);
      n++;
    }
    const end = cur - 10 * FP;
    s.gaps.push({ id: s.uid++, x, w: end - x });
    if (lvl >= 6 && r() % 2) s.flyers.push({ id: s.uid++, kind: 'bat', x: x + Math.floor((end - x) / 2), y: 0, baseY: (DECK_Y - 70) * FP, vx: -(90 + (r() % 40)), ph: r() % 64, t: 0, active: false, dead: false });
    return end - x;
  }
  if (kind === 'tiers') {
    // climb: deck -> chained ledge -> floating platform above it -> (later) a higher one again,
    // with the best coins at the top. Each rise is a single jump; the reach test checks it.
    const lw = (130 + (r() % 70)) * FP;
    addPlat(s, 'ledge', x, lw, LEDGE_Y * FP);
    const uw = (48 + (r() % 24)) * FP, ux = x + Math.floor(lw / 2) - 10 * FP + (r() % 20) * FP;
    const uy = LEDGE_Y - 32 - (r() % 6);                       // 122..128: a 32-37px hop up from the ledge
    addPlat(s, 'step', ux, uw, uy * FP);
    let end = Math.max(x + lw, ux + uw), top = uy, tx = ux, tw = uw;
    if (lvl >= 2 && r() % 2) {                                  // third storey, a short hop further on
      const dbl = lvl >= 4 && r() % 2;                           // later on the top storey needs a double jump
      const hx = ux + uw + (24 + (r() % 20)) * FP, hw = (40 + (r() % 16)) * FP, hy = uy - (dbl ? 58 + (r() % 5) : 26 + (r() % 6));
      addPlat(s, lvl >= 6 && r() % 2 ? 'crumble' : 'step', hx, hw, hy * FP);
      end = hx + hw; top = hy; tx = hx; tw = hw;
    }
    tokenArc(s, tx + Math.max(0, Math.floor((tw - 3 * 18 * FP) / 2)), top, 3, 0);
    if (r() % 4 === 0) s.pickups.push({ id: s.uid++, kind: 'jacket', x: tx + Math.floor(tw / 2), y: (top - 22) * FP });
    const under = r() % 3;                                       // sometimes the deck is gone underneath
    if (lvl >= 1 && under === 0) s.gaps.push({ id: s.uid++, x: x + 40 * FP, w: lw - 64 * FP });
    else if (under === 1) addGoblin(s, z % ZONES === 1 ? 'puker' : 'grunt', x + lw - 20 * FP, LEDGE_Y * FP);
    if (lvl >= 4 && r() % 2) s.flyers.push({ id: s.uid++, kind: 'bat', x: x + Math.floor(lw / 2), y: 0, baseY: (LEDGE_Y - 20) * FP, vx: -(80 + (r() % 40)), ph: r() % 64, t: 0, active: false, dead: false });
    return end - x;
  }
  if (kind === 'combo') {                       // a ledge over a gap with a goblin on it and a bat above
    const w = (120 + (r() % 60)) * FP;
    addPlat(s, 'ledge', x, w, LEDGE_Y * FP);
    s.gaps.push({ id: s.uid++, x: x + 30 * FP, w: w - 50 * FP });
    addGoblin(s, r() % 2 ? 'grunt' : 'puker', x + w - 24 * FP, LEDGE_Y * FP);
    s.flyers.push({ id: s.uid++, kind: 'bat', x: x + Math.floor(w / 2), y: 0, baseY: (LEDGE_Y - 44) * FP, vx: -(80 + (r() % 40)), ph: r() % 64, t: 0, active: false, dead: false });
    return w;
  }
  return 30 * FP;
}

const SIZE = { brute: [11, 32], ghoul: [7, 28], scientist: [7, 30], biker: [12, 24], slime: [9, 16], slimelet: [5, 9] };
const VALUE = { brute: 100, ghoul: 75, scientist: 100, biker: 100, slime: 60, slimelet: 30 };

// the code unlocks as soon as you pass 1,111: from then on nothing dangerous is spawned, and the
// message goes up the moment everything already on its way has gone (usually a second or two).
// It waits only while a zone title is up or the zone gate is close, so the two never overlap.
function clearAhead(s) {
  const left = s.dist - 12 * FP, local = Math.floor((playerX(s) - zoneOf(playerX(s)) * ZONE_PX * FP) / FP);
  if (local < 520 || local > ZONE_PX - SAFE_BEFORE - 60) return false;
  return !s.gaps.some((g) => g.x + g.w > left) && !s.goblins.some((g) => !g.dead && g.x > left)
    && !s.unicorns.some((u) => !u.dead && u.x > left - 20 * FP) && !s.flyers.some((f) => !f.dead && f.x > left)
    && !s.blobs.length && !s.drips.length && !s.pipes.some((p) => p.x > left - 20 * FP) && !s.puddles.some((p) => p.x + p.w > left)
    && s.onGround;
}
function calm(s) {
  const px = playerX(s), ahead = px + 16 * FP, low = s.y > DECK_Y * FP;
  s.gaps = s.gaps.filter((g) => g.x + g.w <= px || (low && g.x <= px));
  s.goblins = s.goblins.filter((g) => g.x < px - 20 * FP);
  s.unicorns = s.unicorns.filter((u) => u.x < px - 20 * FP);
  s.flyers = []; s.blobs = []; s.drips = [];
  s.pipes = s.pipes.filter((p) => p.x < px - 20 * FP);
  s.puddles = s.puddles.filter((p) => p.x + p.w < px - 6 * FP);
  s.plats = s.plats.filter((p) => p.kind === 'ledge' || p.x + p.w <= ahead || (s.plat === p.id));
  for (const p of s.plats) if (p.kind === 'crumble') p.kind = 'step';
  s.calmTo = px + CALM_PX * FP;
  s.nextX = Math.max(s.nextX, px + (W - PLAYER_SX) * FP);
}

function twinCheck(s, g) {
  if (g.twin === undefined) return;
  if (s.goblins.filter((o) => o.twin === g.twin && o.dead).length === 2) { s.bonus += TWIN_BONUS; s.events.push('twins:' + TWIN_BONUS); }
}

function stompable(s, prevBottom, top) { return s.vy > 0 && prevBottom <= top + 12 * FP; }

// standing / landing ----------------------------------------------------------------
function supportAt(s, x) {                      // is the thing we're standing on still under us?
  if (s.plat >= 0) { const p = s.plats.find((q) => q.id === s.plat); return p && overPlat(p, x) ? p : null; }
  if (s.groundY === DECK_Y * FP) return deckUnder(s, x);
  if (s.groundY === BLOCK_TOP * FP) return onBlock(s, x);
  return false;
}
function landing(s, x, prevB, newB) {
  let best = -1, plat = -1;
  const consider = (y, ok, id = -1, tol = 0) => { if (ok && prevB <= y + tol && newB >= y && (best < 0 || y < best)) { best = y; plat = id; } };
  consider(BLOCK_TOP * FP, onBlock(s, x));
  // forgiving: if your feet reach within a few pixels of a platform's top at the top of a jump, you step up onto it
  for (const p of s.plats) consider(p.y, !p.gone && x + 6 * FP > p.cx && x - 6 * FP < p.cx + p.w, p.id, 7 * FP);
  consider(DECK_Y * FP, deckUnder(s, x));
  return [best, plat];
}

// ---- one tick ---------------------------------------------------------
export function step(s, down) {
  if (s.dead) return;
  s.events.length = 0;
  const pressed = down && !s.down, released = !down && s.down;
  s.down = down;
  s.tick++;
  if (!s.hard && score(s) >= TARGET) {
    s.pend = true;
    if (clearAhead(s)) { s.hard = true; s.pend = false; s.hardTick = s.tick; s.hardDist = s.dist; s.events.push('target'); calm(s); }
  }
  s.speed = Math.min(SPEED_CAP, SPEED0 + zoneOf(s.dist) * 24 + Math.floor(s.tick / 60) + (s.hard ? Math.floor((s.tick - s.hardTick) / 40) : 0));
  const wasAir = !s.onGround;

  // platforms move / crumble
  for (const p of s.plats) {
    p.cx = platX(p, s.tick); p.y = platY(p, s.tick);
    if (p.crumble > 0) { p.crumble--; if (p.crumble === 0) { p.gone = true; s.events.push('crumble'); } }
  }

  if (pressed) {
    if (s.onGround || s.coyote > 0) {
      s.vy = JUMP_V; s.hold = HOLD_TICKS; s.jumps = 1; s.onGround = false; s.coyote = 0; s.plat = -1; s.events.push('jump');
    } else if (s.jumps < (s.triple > 0 ? 3 : 2)) {
      s.vy = DJUMP_V; s.hold = 8; s.jumps++; s.events.push(s.jumps === 3 ? 'tjump' : 'djump');
    }
  }
  if (released) s.hold = 0;

  const prevZone = zoneOf(playerX(s));
  s.dist += s.speed;
  const px = playerX(s);
  if (zoneOf(px) !== prevZone) s.events.push('zone');
  const gateNext = (zoneOf(px) + 1) * ZONE_PX * FP;
  if (px >= gateNext - SAFE_BEFORE * FP && s.cleared !== zoneOf(px)) {
    s.cleared = zoneOf(px);
    s.blobs = []; s.drips = []; s.flyers = [];
    s.goblins = s.goblins.filter((g) => g.x < px - 30 * FP);
    s.unicorns = s.unicorns.filter((u) => u.x < px - 30 * FP);
    s.events.push('clear');
  }
  const prevBottom = s.y;

  if (!s.onGround) {
    const g = s.down && s.hold > 0 && s.vy < 0 ? G_HOLD : G;
    if (s.hold > 0) s.hold--;
    s.vy = Math.min(MAX_FALL, s.vy + g);
    const prevHead = s.y - HERO_H * FP;
    s.y += s.vy;
    if (s.vy < 0) {                               // V boxes open only when you jump into the underside
      const head = s.y - HERO_H * FP;
      for (const b of s.blocks) {
        if (prevHead >= BLOCK_BOTTOM * FP && head < BLOCK_BOTTOM * FP && overlap(px - 5 * FP, px + 5 * FP, b.x, b.x + BLOCK * FP)) {
          s.y = (BLOCK_BOTTOM + HERO_H) * FP; s.vy = 120; s.hold = 0; b.bump = 8;
          if (!b.used) {
            b.used = true;
            if (b.reward === 'hp' && s.hp < MAX_HP) { s.hp++; s.events.push('bonk:hp'); }
            else if (b.reward === 'triple') { s.triple = POWER_TICKS; s.events.push('bonk:triple'); }
            else if (b.reward === 'star') { s.star = POWER_TICKS; s.events.push('bonk:star'); }
            else { const v = b.reward === 'hp' ? 50 : b.reward; s.bonus += v; s.events.push('bonk:' + v); }
          } else s.events.push('bonk');
          break;
        }
      }
    }
    if (s.vy > 0) {
      const [land, plat] = landing(s, px, prevBottom, s.y);
      if (land >= 0) {
        s.y = land; s.groundY = land; s.plat = plat; s.vy = 0; s.onGround = true; s.jumps = 0; s.events.push('land');
        const p = plat >= 0 && s.plats.find((q) => q.id === plat);
        if (p && p.kind === 'crumble' && p.crumble < 0) { p.crumble = 26; s.events.push('creak'); }
      }
    }
    if (s.coyote > 0) s.coyote--;
    if (s.y > (WORLD_H + 30) * FP) { die(s, 'fell'); return; }
  } else {
    const sup = supportAt(s, px);
    if (!sup) { s.onGround = false; s.plat = -1; s.coyote = COYOTE; s.vy = 0; }
    else if (sup !== true && typeof sup === 'object') { s.y = sup.y; s.groundY = sup.y; }   // ride moving platforms
  }
  if (s.invuln > 0) s.invuln--;
  if (s.triple > 0) { s.triple--; if (s.triple === 120) s.events.push('pwarn'); if (s.triple === 0) s.events.push('pend'); }
  if (s.star > 0) { s.star--; if (s.star === 120) s.events.push('pwarn'); if (s.star === 0) s.events.push('pend'); }
  for (const b of s.blocks) if (b.bump > 0) b.bump--;

  while (s.nextX < s.dist + (W + 60) * FP) spawn(s);

  // unicorns puke when they come on screen
  for (const u of s.unicorns) {
    if (u.dead) { u.t++; continue; }
    if (!u.fired && u.x - s.dist < (W + 10) * FP) { u.fired = true; u.t = 0; }
    if (!u.fired) continue;
    const every = u.kind === 'gallery' ? 16 : 40;
    if (u.n > 0 && u.t % every === 0) {
      if (u.kind === 'gallery') s.blobs.push({ id: s.uid++, x: u.x - 16 * FP, y: (GALLERY_Y - 16) * FP, vx: -(100 + (R(s) % 220)), vy: -(150 + (R(s) % 200)) });
      else s.blobs.push({ id: s.uid++, x: u.x - 20 * FP, y: u.y - 18 * FP, vx: -(260 + (R(s) % 140)), vy: -(80 + (R(s) % 100)) });
      u.n--; s.events.push('puke');
    }
    u.t++;
  }
  for (const b of s.blobs) {
    const prevY = b.y;
    b.vy += BLOB_G; b.x += b.vx; b.y += b.vy;
    if (b.gone) continue;
    let landed = false;
    for (const p of s.plats) {
      if ((p.kind === 'ledge' || p.kind === 'step') && overPlat(p, b.x) && prevY < p.y && b.y >= p.y) {
        if (!b.bile && p.kind === 'ledge') s.puddles.push({ id: s.uid++, x: b.x - 7 * FP, w: 14 * FP, y: p.y, fresh: true });
        landed = true; break;
      }
    }
    if (!landed && !inGap(s, b.x) && prevY < DECK_Y * FP && b.y >= DECK_Y * FP) {
      if (!b.bile) { const pw = b.flask ? 22 : 14; s.puddles.push({ id: s.uid++, x: b.x - (pw >> 1) * FP, w: pw * FP, y: DECK_Y * FP, fresh: true }); }
      if (b.flask) s.events.push('smash');
      landed = true;
    }
    if (landed) { b.gone = true; s.events.push('splat'); }
    if (b.y > (WORLD_H + 20) * FP) b.gone = true;
  }
  for (const p of s.pipes) {
    if (p.x - s.dist < (W + 30) * FP && (s.tick + p.phase) % p.period === 0) s.drips.push({ id: s.uid++, x: p.x, y: PIPE_Y * FP, vy: 0 });
  }
  for (const d of s.drips) { d.vy += DRIP_G; d.y += d.vy; if (d.y >= DECK_Y * FP) { d.gone = true; d.splash = true; } }

  // trolls
  for (const g of s.goblins) {
    if (!g.active && g.x - s.dist < W * FP) { g.active = true; if (g.twin !== undefined && g.shoe === 0) s.events.push('boss'); }
    if (!g.active || g.dead) continue;
    g.t++;
    if (g.falling) {
      const py = g.y; g.vy += G; g.y += g.vy;
      if (py <= DECK_Y * FP && g.y >= DECK_Y * FP && deckUnder(s, g.x)) { g.y = DECK_Y * FP; g.baseY = g.y; g.falling = false; g.vy = 0; }
      if (g.y > (WORLD_H + 20) * FP) g.dead = true;
      continue;
    }
    if (g.stun > 0) { g.stun--; continue; }
    if (g.kind === 'ghoul' || g.kind === 'slime') {   // hoppers: sit, then leap forward
      const every = g.kind === 'ghoul' ? 48 : g.small ? 26 : 40;
      if (!g.air && g.t % every === 0) { g.air = true; g.vy = g.kind === 'ghoul' ? -880 : g.small ? -620 : -980; s.events.push('hop'); }
      if (g.air) { g.vy += 50; g.y += g.vy; if (g.y >= g.baseY) { g.y = g.baseY; g.air = false; g.vy = 0; if (g.kind === 'slime') s.events.push('squelch'); } }
    }
    if (g.kind === 'scientist' && g.t % 96 === 30 && g.x - s.dist < (W - 16) * FP && g.x > px + 80 * FP) {   // lobs a flask of acid
      s.blobs.push({ id: s.uid++, flask: true, x: g.x - 6 * FP, y: g.y - 28 * FP, vx: -(140 + (R(s) % 120)), vy: -(520 + (R(s) % 160)) });
      s.events.push('throw');
    }
    if (g.kind === 'brute' && g.t % 84 < 13 && g.t % 6 === 0 && g.x - s.dist < (W - 10) * FP && g.x > px) {
      s.blobs.push({ id: s.uid++, x: g.x - 16 * FP, y: g.y - 26 * FP, vx: -(230 + (R(s) % 140)) + g.vx, vy: -(40 + (R(s) % 70)) });
      if (g.t % 84 === 0) s.events.push('puke');
    }
    if (g.kind === 'puker' && g.t % 70 === 35 && g.x - s.dist < (W - 20) * FP) {
      s.blobs.push({ id: s.uid++, bile: true, x: g.x - 10 * FP, y: g.y - 14 * FP, vx: -(300 + (R(s) % 100)), vy: -(160 + (R(s) % 80)) });
      s.events.push('spit');
    }
    g.x += g.kind === 'ghoul' ? (g.air ? -(170 + level(s) * 6) : 0) : g.kind === 'slime' ? (g.air ? (g.small ? -90 : -130) : 0) : g.vx;
    const onLedge = s.plats.some((p) => p.kind === 'ledge' && p.y === g.y && overPlat(p, g.x));
    if (!g.air && !(g.y === DECK_Y * FP ? deckUnder(s, g.x) : onLedge)) { g.falling = true; g.vy = 0; }
  }
  for (const f of s.flyers) {
    if (f.dead) { f.t++; f.y += 3 * FP; continue; }
    if (!f.active && f.x - s.dist < (W + 30) * FP) f.active = true;
    if (!f.active) continue;
    f.t++;
    f.x += f.vx;
    if (f.kind === 'bat') f.y = f.baseY + SIN[(f.t * 2 + f.ph) & 63] * 10 * 4;
    else {
      const dx = Math.floor((f.x - px) / FP);
      f.y = (178 - Math.min(110, Math.floor((dx * dx) / 500))) * FP;
      if (!f.dropped && dx < 140 && dx > 100) { f.dropped = true; s.blobs.push({ id: s.uid++, x: f.x, y: f.y, vx: -(200 + (R(s) % 100)), vy: 100 }); s.events.push('puke'); }
    }
  }

  // collisions
  const pl = px - 6 * FP, pr = px + 6 * FP, pt = s.y - HERO_H * FP, pb = s.y;
  for (const b of s.blobs) {
    if (b.gone) continue;
    if (overlap(pl, pr, b.x - 3 * FP, b.x + 3 * FP) && overlap(pt, pb, b.y - 3 * FP, b.y + 3 * FP)) { b.gone = true; s.events.push('splat'); hit(s, 'acid'); }
  }
  for (const d of s.drips) {
    if (d.gone) continue;
    if (overlap(pl, pr, d.x - 2 * FP, d.x + 2 * FP) && overlap(pt, pb, d.y - 4 * FP, d.y)) { d.gone = true; s.events.push('splat'); hit(s, 'acid'); }
  }
  if (s.onGround) {
    for (const p of s.puddles) if (p.y === s.groundY && overlap(px - 4 * FP, px + 4 * FP, p.x, p.x + p.w)) hit(s, 'acid');
  }
  for (const u of s.unicorns) {
    if (u.dead) continue;
    if (overlap(pl, pr, u.x - 14 * FP, u.x + 14 * FP) && overlap(pt, pb, u.y - 26 * FP, u.y)) {
      if (u.kind === 'gallery' || wasAir || !s.onGround || s.star > 0) {
        u.dead = true; u.t = 0; s.kills++;
        const v = u.kind === 'gallery' ? 100 : 50; s.bonus += v; s.events.push('unikill:' + v);
        if (s.vy > 0) { s.vy = -700; s.jumps = 1; }
      } else hit(s, 'unicorn');
    }
  }
  for (const g of s.goblins) {
    if (!g.active || g.dead || g.falling) continue;
    const [half, tall] = SIZE[g.small ? 'slimelet' : g.kind] || [7, 22];
    const gt = g.y - tall * FP;
    if (overlap(pl, pr, g.x - half * FP, g.x + half * FP) && overlap(pt, pb, gt, g.y)) {
      if (s.star > 0) {
        g.dead = true; g.stomped = true; const v = VALUE[g.small ? 'slimelet' : g.kind] || 50; s.bonus += v; s.events.push('smash:' + v); twinCheck(s, g);
      } else if (stompable(s, prevBottom, gt)) {
        g.hp--; s.jumps = 1; s.hold = 0; s.onGround = false; s.plat = -1;
        if (g.hp > 0) { g.stun = 50; s.vy = -1200; s.bonus += 25; s.events.push('stomp:25'); }
        else {
          g.dead = true; g.stomped = true; s.vy = -900;
          const v = VALUE[g.small ? 'slimelet' : g.kind] || 50; s.bonus += v; s.events.push('stomp:' + v); twinCheck(s, g);
          if (g.kind === 'slime' && !g.small) for (const dx of [-16, 18]) {      // a big slime splits in two
            s.goblins.push({ id: s.uid++, kind: 'slime', small: true, x: g.x + dx * FP, y: g.y, baseY: g.y, vx: 0, active: true, falling: false, vy: 0, t: 8 + (dx > 0 ? 9 : 0), hp: 1, stun: 0, air: false });
          }
        }
      } else if (g.stun === 0) hit(s, 'goblin');
    }
  }
  for (const f of s.flyers) {
    if (!f.active || f.dead) continue;
    const hw = f.kind === 'bat' ? 7 : 14, hh = f.kind === 'bat' ? 5 : 9;
    if (overlap(pl, pr, f.x - hw * FP, f.x + hw * FP) && overlap(pt, pb, f.y - hh * FP, f.y + hh * FP)) {
      if (s.star > 0) {
        f.dead = true; f.t = 0; const v = f.kind === 'bat' ? 40 : 150; s.bonus += v; s.events.push('smash:' + v);
      } else if (f.kind === 'bat' ? stompable(s, prevBottom, f.y - hh * FP) : !s.onGround) {
        f.dead = true; f.t = 0; s.vy = -900; s.jumps = 1; s.onGround = false; s.plat = -1;
        const v = f.kind === 'bat' ? 40 : 150; s.bonus += v; s.events.push((f.kind === 'bat' ? 'batkill:' : 'unikill:') + v);
      } else hit(s, f.kind === 'bat' ? 'bat' : 'unicorn');
    }
  }
  for (const p of s.pickups) {
    if (p.taken) continue;
    const rr = p.kind === 'jacket' ? 9 : 5;
    if (overlap(pl, pr, p.x - rr * FP, p.x + rr * FP) && overlap(pt, pb, p.y - rr * FP, p.y + rr * FP)) {
      p.taken = true;
      if (p.kind === 'token') { s.bonus += 11; s.events.push('token'); }
      else if (s.hp < MAX_HP) { s.hp++; s.events.push('patch'); }
      else { s.bonus += 25; s.events.push('patch:25'); }
    }
  }

  const behind = s.dist - 90 * FP;
  s.gaps = s.gaps.filter((g) => g.x + g.w > behind);
  s.plats = s.plats.filter((p) => p.x + p.w + 40 * FP > behind);
  s.puddles = s.puddles.filter((p) => p.x + p.w > behind);
  s.pipes = s.pipes.filter((p) => p.x > behind);
  s.drips = s.drips.filter((d) => !d.gone);
  s.blobs = s.blobs.filter((b) => !b.gone && b.x > behind);
  s.unicorns = s.unicorns.filter((u) => u.x > behind);
  s.goblins = s.goblins.filter((g) => g.x > behind && !(g.dead && !g.stomped));
  s.flyers = s.flyers.filter((f) => f.x > behind && !(f.dead && f.t > 40));
  s.pickups = s.pickups.filter((p) => p.x > behind && !p.taken);
  s.blocks = s.blocks.filter((b) => b.x + BLOCK * FP > behind);

  if (s.tick >= MAX_TICKS) die(s, 'time');
}

// Inputs are the ticks at which the button state flipped (pressed/released).
// replay() is what the server runs: it never trusts a score from the client.
export function replay(seed, toggles, endTick = MAX_TICKS) {
  const s = createSim(seed);
  let i = 0, down = false;
  const end = Math.min(endTick, MAX_TICKS);
  while (!s.dead && s.tick < end) {
    while (i < toggles.length && toggles[i] === s.tick + 1) { down = !down; i++; }
    step(s, down);
  }
  return { score: score(s), ticks: s.tick, dead: s.dead, cause: s.cause, unused: toggles.length - i, zones: zoneOf(playerX(s)) };
}

export const encodeToggles = (t) => t.map((v, i) => (i ? v - t[i - 1] : v));
export function decodeToggles(d) {
  if (!Array.isArray(d) || d.length > 40000) return null;
  const out = []; let acc = 0;
  for (const v of d) {
    if (!Number.isInteger(v) || v < 1 || v > MAX_TICKS) return null;
    acc += v; if (acc > MAX_TICKS) return null; out.push(acc);
  }
  return out;
}
