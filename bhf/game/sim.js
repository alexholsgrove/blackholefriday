// Black Hole Friday: a copy of the FWAHBL Run sim (same level design + difficulty), with the twins and
// the 1,111 code unlock taken out. Each zone is one level; each level's boss lives in levels/<key>.js (framework: bosskit.js).
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
export const ZONE_PX = 6400;           // a new zone (level) every ~45 s (was 4800: +1/3, about +30% in seconds as the speed creeps up)
// the last stretch of each level (from RAMP.from % of the way in, up to the quiet run-out) gets a touch trickier, smoothly: the layout is
// built up to RAMP.lvl levels harder and the breathing space between things shrinks by up to RAMP.space px (never below the usual minimum)
export const RAMP = { from: 70, lvl: 2, space: 60 };
export const ZONES = 6;                // zones before the loop repeats (harder)
export const SAFE_BEFORE = 120, SAFE_AFTER = 1060;  // no danger around zone gates (px): lasts until the zone title has gone
export const POWER_TICKS = 600;
export const TWIN_BONUS = 500;          // stomp both end-of-level twins        // triple jump / invincibility last 10 s
const CALM_PX = 1000;                  // after the code unlocks: no danger while the message is up
// BHF scoring. Coins: a fixed value that rises level by level (and by 10 more each time round the game). Prize boxes: a lucky dip inside a range.
export const COIN = [10, 15, 20, 25, 30, 40];
export const coinValue = (s, x) => COIN[Math.min(COIN.length - 1, Math.max(0, zoneOf(x)))] + (s.lap || 0) * 10;
// The black hole coin: take it and points pour in, slowly at first and then faster and faster (doubling about every second and a half),
// and they only stop when you next press jump. Whole numbers only, so the server counts exactly what the player's screen did.
export const HOLE = { chance: 25, rate0: 24576, grow: 7, cap: 1000, capLevel: 400, capLap: 1000, capMax: 5000, chasmAt: 600 };   // % of coin rows that are one (once a level at most) | start rate, 1/65536 pt a tick | rate += rate >> grow | most it can pay on level 1, + capLevel a level, + capLap a loop | ticks of counting before a chasm is forced
// each time round the game (lap) everything is this much harder: layout level (0-14 scale), chasm tightness (0-10), top speed
export const LAP = { diff: 4, chasm: 3, speed: 30 };
export const TARGET = Infinity;   // no code unlock in Black Hole Friday            // past this, difficulty ramps up

const G = 80, G_HOLD = 40, JUMP_V = -1100, DJUMP_V = -960, MAX_FALL = 1700;
const HOLD_TICKS = 12, COYOTE = 6, INVULN = 70;
const SPEED0 = 560, SPEED_CAP = 860;   // speed rises a little; difficulty mostly comes from layout
const BLOB_G = 26, DRIP_G = 22;
const BLOCK_TOP = BLOCK_BOTTOM - BLOCK;
// BHF: each level's own dangers (see danger.js for the contract)
export const RIDE_TICKS = 420;          // a ride lasts 7 s
export const SKY_Y = 62, RAIN_V = 600;  // sky drops start at the top of the view and fall at a steady speed
const RAIN_T = Math.ceil(((DECK_Y - SKY_Y) * FP) / RAIN_V);
export const VENT_WARN = 24;            // ticks of sputter before a vent blows
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
    vents: [], clouds: [], shots: [], ride: 0, fly: 0, shield: 0, danger: null, seen: {}, rideAt: 0,
    lap: 0, chick: null, holeZ: -1,
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
// BHF: one zone = one level. FWAHBL went 0, 2, 4, 6... a zone; here it turns steep at level 3
export const TUNE = { diff: [0, 2, 6, 8, 10, 12], chasm: [0, 3, 6, 8, 9, 10] };   // per level: how hard the layout is (FWAHBL's 0-14 scale), how tight its first chasm is (0-10)
const level = (s) => Math.min(14, TUNE.diff[Math.min(TUNE.diff.length - 1, Math.max(0, zoneOf(s.dist)))] + (s.lap || 0) * LAP.diff);
const speedCap = (s) => SPEED_CAP + Math.min(3, s.lap || 0) * LAP.speed;

function die(s, cause) { s.dead = true; s.cause = cause; s.events.push('die'); }
function hit(s, cause) {
  if (s.invuln > 0 || s.star > 0 || s.dead) return;
  if (s.shield > 0) { s.shield = 0; s.invuln = INVULN; s.events.push('shield'); return; }
  s.hurt = cause;
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
  const vx = kind === 'gunner' || kind === 'dropper' ? 0 : kind === 'backer' ? 200 + (r() % 40) : kind === 'grunt' ? -(50 + (r() % 50) + lvl * 5) : kind === 'puker' ? -(30 + (r() % 20)) : kind === 'brute' ? -(26 + lvl * 3)
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

const MULTI = new Set(['ledge', 'tiers', 'steps', 'highsteps', 'elevator', 'slider', 'crumble', 'combo', 'floe']);
const MULTI_EVERY = 700;
const GAPPY = new Set(  // patterns that can leave a hole in the floor
  ['gap', 'steps', 'highsteps', 'elevator', 'slider', 'crumble', 'ledge', 'tiers', 'combo', 'floe']);               // px of flat running allowed before a multi-storey section is forced

function spawn(s) {
  if (s.film) return spawnFilm(s);              // BHF level 6 only (danger.film): there and back. Every other level has s.film === null and never comes here.
  const r = () => R(s), x = s.nextX, sp = s.speed, z = zoneOf(x);
  // quiet stretch around each zone gate: only coins, no danger
  const gate = (z + 1) * ZONE_PX * FP;
  // BHF: the run-in to the boss (RAMP): 0 before RAMP.from % of the level, rising to 16 two thirds of the way from there to the quiet run-out
  const rf = (z * ZONE_PX + Math.floor((ZONE_PX * RAMP.from) / 100)) * FP, rq = gate - (SAFE_BEFORE + 420) * FP;
  const ramp = x <= rf ? 0 : Math.min(16, Math.floor(((x - rf) / FP) * 24 / Math.max(1, (rq - rf) / FP)));
  const lvl = Math.min(14, level(s) + ((ramp * RAMP.lvl) >> 4));
  // code just unlocked: nothing (not even the twins) until its message has gone
  if (x < s.calmTo || s.pend) { tokenArc(s, x + 40 * FP, DECK_Y, 4, 1); s.nextX = Math.max(x + 160 * FP, s.calmTo); return; }
  if (x > gate - (SAFE_BEFORE + 420) * FP) {
    tokenArc(s, gate + 60 * FP, DECK_Y, 5, 1);
    s.nextX = gate + SAFE_AFTER * FP;
    return;
  }
  const table = Object.keys(UNLOCK).filter((k) => UNLOCK[k] <= z || (s.extras && s.extras.includes(k)));   // BHF: a level can bring in its own features early (extras)
  const wt = (k) => WEIGHTS[k] * (s.extras && s.extras.includes(k) ? 2 : 1);                                 // BHF: ...and its own features turn up twice as often
  const total = table.reduce((a, k) => a + wt(k), 0);
  let roll = r() % total, kind = 'gap';
  for (const k of table) { if (roll < wt(k)) { kind = k; break; } roll -= wt(k); }
  // BHF: the level's own dangers: danger.spawn = { kind: % of everything that turns up }
  const D = s.danger, own = D && D.spawn ? Object.keys(D.spawn).filter((k) => D.spawn[k] > 0) : [];
  if (own.length) {
    const ownTotal = own.reduce((a, k) => a + D.spawn[k], 0);
    if (r() % 100 < ownTotal + lvl) { let q = r() % ownTotal; for (const k of own) { if (q < D.spawn[k]) { kind = k; break; } q -= D.spawn[k]; } }
    // every one of them turns up at least once a level: anything not seen by 40% of the way goes in next
    if (x - z * ZONE_PX * FP > ZONE_PX * FP * 2 / 5) { const miss = own.find((k) => !s.seen[k]); if (miss) kind = miss; }
  }
  // every level keeps you jumping between storeys: never a long flat run without one
  if (!MULTI.has(kind) && x - s.lastMulti > MULTI_EVERY * FP) kind = z >= 1 && r() % 3 === 0 ? 'steps' : 'tiers';
  if (s.owed > 0 && !MULTI.has(kind) && kind !== 'gap') { kind = 'jacket'; s.owed = 0; }
  // after a climb the camera is up high and the floor is off screen: no holes until you're back down and can see it
  if (x < s.solidTo && GAPPY.has(kind)) kind = r() % 2 ? 'tokens' : 'grunt';
  if (s.rideAt && x >= s.rideAt && !MULTI.has(kind)) { kind = 'ride'; s.rideAt = 0; }   // BHF: the level's ride, parked on a clear stretch
  // BHF: the black hole coin can't be milked along a flat stretch: once it has been counting for HOLE.chasmAt ticks the next thing to turn up is a chasm (jump, and bank it, or fall)
  if (s.chick && s.chick.t >= HOLE.chasmAt && !s.chick.forced && x >= s.solidTo && !s.rideAt) { kind = 'steps'; s.chick.forced = 1; }
  if ((kind === 'gunner' || kind === 'seeker') && x < s.farTo) kind = 'tokens';        // BHF: no shots while the level name is still up
  if (MULTI.has(kind)) s.lastMulti = x;
  if (own.includes(kind)) s.seen[kind] = 1;
  const before = s.plats.length, len = build(s, kind, x, sp, lvl, z);
  if (s.plats.slice(before).some((p) => p.y <= LEDGE_Y * FP)) s.solidTo = x + len + 60 * FP + 40 * sp;
  const spacing = Math.max(46, 130 + (r() % 80) - lvl * 7 - ((ramp * RAMP.space) >> 4)) * FP + sp * 10;
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
  // BHF: the black hole coin. A third of the way into each level the dice decide (once) whether this level has one: level 1 of the first loop
  // always does (so everyone meets it), other levels HOLE.chance % of the time. If so, whatever was coming next becomes the coin.
  if (s.holeZ !== z && !s.chick && x - z * ZONE_PX * FP > (ZONE_PX * FP) / 3 && !GAPPY.has(kind) && x >= s.solidTo) {
    s.holeZ = z; if ((z === 0 && !s.lap) || r() % 100 < HOLE.chance) { s.pickups.push({ id: s.uid++, kind: 'hole', x: x + 30 * FP, y: (DECK_Y - 15) * FP }); return 70 * FP; }
  }
  if (kind === 'tokens') {
    return tokenArc(s, x, DECK_Y, 3 + (r() % 3), r() % 2);
  }
  if (kind === 'blocks') {                      // a single V box, never clustered
    if (s.blocks.some((b) => b.x > x - 160 * FP)) return tokenArc(s, x, DECK_Y, 3, 0);
    const roll2 = r() % 100;
    let reward = roll2 < 44 ? 50 + 10 * (r() % 6) : roll2 < 68 ? 150 + 10 * (r() % 11) : roll2 < 80 ? 'hp' : roll2 < 90 ? 'triple' : 'star';      // points: 50-100, or the big one, 150-250
    const box = s.danger && s.danger.box;                                  // BHF: a level's own V-box prizes: { shield: %, bomb: % }
    if (box) { let q = r() % 100; for (const k of Object.keys(box)) { if (q < box[k]) { reward = k; break; } q -= box[k]; } }
    s.blocks.push({ id: s.uid++, x: x + 10 * FP, used: false, reward, bump: 0 });
    return 40 * FP;
  }
  // ---- BHF: each level's own dangers ----
  const D = s.danger || {};
  if (kind === 'ride') { s.pickups.push({ id: s.uid++, kind: 'ride', x: x + 44 * FP, y: (DECK_Y - 14) * FP }); return 90 * FP; }
  if (kind === 'vent') {                        // a jet out of the floor, on and off: run through while it's off, or jump it
    const n = lvl >= 5 && r() % 2 ? 2 : 1, period = 118 - Math.min(24, lvl * 2) + (r() % 24);
    const on = Math.min(42 + Math.min(14, lvl), n > 1 ? (period >> 1) - 10 : 99), ph = r() % period;
    for (let i = 0; i < n; i++) s.vents.push({ id: s.uid++, x: x + (18 + i * 112) * FP, y: DECK_Y * FP, period, on, phase: (ph + i * (period >> 1)) % period, h: 34 });
    return (36 + (n - 1) * 112) * FP;
  }
  if (kind === 'rain') {                        // a squall: drops fall out of the sky over this stretch; a ledge is shelter
    const w = (130 + (r() % 70)) * FP, cfg = D.rain || {};
    if (cfg.rise) {                             // inverted: it lies on the floor and falls UP as you reach it. stay on the ground and it clears your head
      const n = 2 + (lvl >= 9 ? 1 : 0), gap = 84 + (r() % 20);
      for (let i = 0; i < n; i++) s.drips.push({ id: s.uid++, sky: true, up: true, wait: true, hot: false, x: x + (20 + i * gap) * FP, tx: x + (20 + i * gap) * FP, y: DECK_Y * FP, vx: 0, vy: 0 });
      return (40 + (n - 1) * gap) * FP;
    }
    s.clouds.push({ id: s.uid++, x, w, every: cfg.every || 5, t: 0, next: 0, gap: Math.max(44, (cfg.gap || 66) - lvl * 2), vx: cfg.vx || 0 });
    if (r() % 3 === 0) { const lw = (70 + (r() % 30)) * FP, lx = x + 40 * FP; addPlat(s, 'ledge', lx, lw, LEDGE_Y * FP); tokenArc(s, lx + 12 * FP, DECK_Y, 3, 0); }
    return w;
  }
  if (kind === 'gunner') {                      // stands his ground and shoots along the floor
    const rev = !!(D.gunner && D.gunner.rev) && !(s.film && !s.film.back), gx = x + (rev ? 160 : 50) * FP;   // (level 6: he only shoots backwards once you are running back)
    addGoblin(s, 'gunner', gx, DECK_Y * FP);
    const g = s.goblins[s.goblins.length - 1];
    g.shots = lvl >= 12 ? 3 : lvl >= 5 ? 2 : 1; g.aim = 0; g.flash = 0;
    if (rev) g.hole = gx - 116 * FP;            // inverted: the bullet is already in the wall behind you, and flies back to his gun
    return (rev ? 190 : 80) * FP;
  }
  if (kind === 'seeker') {                      // hunts your height, then commits
    const n = lvl >= 9 && r() % 2 ? 2 : 1;
    for (let i = 0; i < n; i++) s.flyers.push({ id: s.uid++, kind: 'seeker', x: x + (40 + i * 150) * FP, y: (DECK_Y - 64 - (r() % 20)) * FP, vx: -(140 + (r() % 40)), t: 0, active: false, dead: false, lock: false });
    return (60 + (n - 1) * 150) * FP;
  }
  if (kind === 'dropper') {                     // hangs under the gallery, drops just ahead of you
    const n = lvl >= 9 && r() % 2 ? 2 : 1;      // its y is the point it hangs from (the underside of the gallery) until it lets go
    for (let i = 0; i < n; i++) { addGoblin(s, 'dropper', x + (60 + i * 90) * FP, (PIPE_Y + 1) * FP); const g = s.goblins[s.goblins.length - 1]; g.hang = true; g.wob = 0; }
    return (100 + (n - 1) * 90) * FP;
  }
  if (kind === 'backer') { const n = lvl >= 9 && r() % 2 ? 2 : 1; for (let i = 0; i < n; i++) addGoblin(s, 'backer', x + (40 + i * 46) * FP, DECK_Y * FP); return (70 + (n - 1) * 46) * FP; }   // runs the same way as you, slower
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
  if (kind === 'steps' || kind === 'highsteps' || kind === 'elevator' || kind === 'slider' || kind === 'crumble' || kind === 'floe') {
    const floe = kind === 'floe'; if (floe) kind = 'crumble';       // BHF: a level's own run of crumbling platforms (danger.spawn.floe): every one gives way, the first included
    // warm-up: the first chasms are wide, flat stepping stones with short hops;
    // each chasm you meet (and each loop) makes the next one a little tighter
    const loop = Math.floor(z / ZONES);
    const tight = Math.min(10, s.chasms + loop * 4);
    s.chasms++;
    if (tight < 2 && !floe) kind = 'steps';                               // movers/crumble/high steps only once warmed up
    if (tight < 4 && kind === 'highsteps') kind = 'steps';
    const hopMax = Math.floor((full * (30 + tight * 3)) / 100);
    let cur = x + 24 * FP, h = 0, n = 0;
    const steps = floe ? Math.min(5, 3 + Math.floor(tight / 4) + (r() % 2)) : Math.min(6, 1 + Math.floor(tight / 2) + (r() % 2));
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
      if (kind === 'crumble' && (i > 0 || floe)) k = 'crumble';
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

// ---- BHF level 6, INVERSION (danger.film = { mid, pre, post, scenes: [a, b] }, all px from the start of the level) --------------------------
// THERE AND BACK. The level is three places in a row (0: the freeport hangar, 1: the motorway, 2: the battlefield), then a turnstile at `mid`, then the
// SAME places again in the other order. Each place has its SET PIECES (FILM_SET), spread along it with the place's own trouble in between (FILM_RED):
//   hangar:      a crate stack to climb | a loading pit crossed on pallets bobbing on the crane hooks
//   motorway:    two convoys: a hole crossed on the roofs of the traffic (vans, a security van, police cars, a bus, articulated lorries, a tanker, a car
//                transporter, and in the second convoy a fuel truck jack-knifed across the lanes); some of them drift back and forth (they are faster or slower than you)
//   battlefield: two craters crossed on slabs that blow once you are on them | a marksman
// Every set piece is written down and laid out again, the other way round, on the way back, so the run back is over the very ground you came by,
// and in between it the things that only happen backwards (FILM_BLUE). Only the picture is turned round (render.js mirrors it): the rules run
// left to right the whole way, with the same button. Each set piece is a little tighter than the one before (f.p counts them), on the way back too.
const FILM_RED = [{ tiers: 4, grunt: 2, blocks: 2, vent: 3, biker: 2 }, { bat: 2, grunt: 3, biker: 2, blocks: 2, tokens: 1 }, { gunner: 4, grunt: 3, vent: 3, bat: 2, blocks: 1 }];
const FILM_BLUE = [{ backer: 4, bat: 2, vent: 2, blocks: 1 }, { ride: 3, backer: 4, bat: 3, blocks: 1 }, { revgun: 5, backer: 4, bat: 1, vent: 2, blocks: 1 }];
const FILM_LEN = { tiers: 220, gunner: 80, revgun: 190, vent: 150, backer: 120, ride: 90, tokens: 90, blocks: 40, grunt: 50, bat: 60, biker: 40 };   // the most room each can take (px)
const FILM_SET = [['hooks'], ['convoy', 'convoy'], ['slabs']], FILM_MIN = { stack: 190, hooks: 340, convoy: 420, slabs: 340 };   // the least room each needs (px)
// the traffic: [length px, roof height over the deck px] (lorries: trailer and cab together; the cab's roof spoiler is level with the trailer)
export const FILM_VEH = { van: [60, 11], armour: [66, 14], police: [48, 2], bus: [124, 21], box: [168, 28], curtain: [134, 27], tanker: [150, 22], carrier: [176, 26], jack: [104, 17] };
const filmPick = (s, tab) => { const ks = Object.keys(tab), tot = ks.reduce((a, k) => a + tab[k], 0); let q = R(s) % tot; for (const k of ks) { if (q < tab[k]) return k; q -= tab[k]; } return ks[0]; };
function filmBuild(s, kind, x, sp, room, last) {
  const r = () => R(s), full = 37 * sp, lap = Math.min(2, s.lap || 0), f = s.film, tight = Math.min(8, f.p + lap * 3);   // tight: 0 at the first set piece, up by one each piece (and a loop)
  if (kind === 'stack') {                        // a stack of crates: along the top of the first, up onto the second, gold on top. Later: a pit under it
    const lw = (132 + (r() % 50)) * FP, uw = (50 + (r() % 16) - tight * 2) * FP, ux = x + Math.floor((lw - uw) / 2), uy = LEDGE_Y - 33;
    addPlat(s, 'ledge', x, lw, LEDGE_Y * FP); addPlat(s, 'step', ux, uw, uy * FP);
    tokenArc(s, ux + Math.max(0, Math.floor((uw - 3 * 18 * FP) / 2)) + 9 * FP, uy, 3, 0);
    if (f.p > 0) s.gaps.push({ id: s.uid++, x: x + 30 * FP, w: lw - 50 * FP });
    else if (r() % 2) addGoblin(s, 'grunt', x + lw + 34 * FP, DECK_Y * FP);
    return lw;
  }
  let cur = x + 24 * FP, h = 0, prev = 0;
  if (kind === 'hooks') {                        // the loading pit: pallets on the crane hooks, bobbing up and down
    const n = Math.max(3, Math.min(3 + (tight >= 3 ? 1 : 0) + (lap ? 1 : 0), Math.floor((room - 24 * FP) / (44 * FP + Math.floor(full * 0.56)))));
    for (let i = 0; i < n; i++) {
      const w = (44 - Math.min(10, tight * 2) + (r() % 8)) * FP;
      h = i === n - 1 ? 10 + (r() % 10) : 14 + (r() % 26);
      const p = addPlat(s, 'movev', cur, w, (DECK_Y - h) * FP, { amp: (6 + (r() % 6) + tight) * FP, period: 110 + (r() % 60), ph: r() % 64, veh: 'pallet' });
      if (r() % 2) s.pickups.push({ id: s.uid++, kind: 'token', x: cur + (w >> 1), y: p.y - 22 * FP });
      cur += w + Math.floor((full * (44 + (r() % 12) + tight * 2)) / 100);
    }
  } else if (kind === 'convoy') {                // the traffic, roof to roof
    const tail = last ? ['police', 'police', 'jack'] : [], kinds = ['van', 'armour', 'bus', 'box', 'curtain', 'tanker', 'carrier'];
    for (let i = 0; i < 9; i++) {
      const left = room - (cur - x); let v = kinds[r() % kinds.length];
      if (v === prev) v = 'van'; if (i === 0 && FILM_VEH[v][1] > 22) v = 'bus';
      if (last && (left - (FILM_VEH[v][0] + 70) * FP < 400 * FP || i >= 4 || !tail.length)) { if (!tail.length) break; v = tail.shift(); }   // the second convoy ends in police cars and a fuel truck jack-knifed across the road
      else if (!last && i >= 2 && (left < 210 * FP || i >= 6)) break;
      const [vw, vh] = FILM_VEH[v], w = vw * FP, up = vh - h, hop = i ? Math.floor((full * (up > 10 ? 40 + (r() % 10) + tight : 44 + (r() % 14) + tight * 2)) / 100) : 0;
      if (!last && i >= 2 && cur + hop + w - x > room) break;
      cur += hop;
      const moves = v === 'police' || (i > 0 && v !== 'jack' && r() % 3 === 0);   // some go faster or slower than you: they drift back and forth
      const big = !moves && vw >= 120;           // the long ones are roofs a man can stand on (a 'ledge': soldiers keep to it)
      addPlat(s, moves ? 'moveh' : big ? 'ledge' : 'step', cur, w, (DECK_Y - vh) * FP, moves ? { amp: (v === 'police' ? 14 + (r() % 8) : 6 + (r() % 8)) * FP, period: v === 'police' ? 90 + (r() % 30) : 150 + (r() % 80), ph: r() % 64, veh: v, vi: r() % 4 } : { veh: v, vi: r() % 4 });
      if (r() % 2) for (let k = 0; k < 2 + (vw > 100 ? 1 : 0); k++) s.pickups.push({ id: s.uid++, kind: 'token', x: cur + (w >> 1) + (k - 1) * 18 * FP, y: (DECK_Y - vh - 14) * FP });
      if (big && r() % 4 < 1 + (tight >= 3 ? 1 : 0)) addGoblin(s, 'grunt', cur + w - 24 * FP, (DECK_Y - vh) * FP);
      cur += w; h = vh; prev = v;
    }
    cur += Math.floor((full * (40 + (r() % 8))) / 100);
    if (r() % 2 || tight >= 3) s.flyers.push({ id: s.uid++, kind: 'bat', x: x + Math.floor((cur - x) / 3), y: 0, baseY: (DECK_Y - 70) * FP, vx: -(90 + (r() % 40)), ph: r() % 64, t: 0, active: false, dead: false });
    if (tight >= 4) s.flyers.push({ id: s.uid++, kind: 'bat', x: x + Math.floor(((cur - x) * 2) / 3), y: 0, baseY: (DECK_Y - 78) * FP, vx: -(100 + (r() % 40)), ph: r() % 64, t: 0, active: false, dead: false });
  } else {                                       // 'slabs': a crater crossed on slabs that blow once you are on them
    const n = Math.max(2, Math.min(3 + (tight >= 4 ? 1 : 0) + (lap && r() % 2 ? 1 : 0), Math.floor((room - 24 * FP) / (40 * FP + Math.floor(full * 0.6)))));
    h = 8 + (r() % 12);
    for (let i = 0; i < n; i++) {
      const w = (38 + (r() % 8) - lap * 3 - Math.min(6, tight)) * FP;
      if (i) h = Math.max(8, Math.min(32, h + (r() % 29) - 14));
      if (i === n - 1) h = Math.min(h, 22);
      const p = addPlat(s, 'crumble', cur, w, (DECK_Y - h) * FP);
      if (r() % 2) s.pickups.push({ id: s.uid++, kind: 'token', x: cur + (w >> 1), y: p.y - 14 * FP });
      cur += w + Math.floor((full * (42 + (r() % 12) + lap * 4 + tight)) / 100);
    }
    if (room - (cur - x) > 120 * FP) {           // and on the far side of the crater, a marksman
      addGoblin(s, 'gunner', cur + 40 * FP, DECK_Y * FP); const g = s.goblins[s.goblins.length - 1]; g.shots = lap ? 3 : 2; g.aim = 0; g.flash = 0;
      cur += 60 * FP;
    }
  }
  const end = cur - 10 * FP;
  s.gaps.push({ id: s.uid++, x, w: end - x });
  return end - x;
}
function spawnFilm(s) {
  const r = () => R(s), F = s.danger.film, f = s.film, x = s.nextX, sp = s.speed, lvl = level(s), z = zoneOf(x);
  const z0 = z * ZONE_PX * FP, gate = z0 + ZONE_PX * FP, M = z0 + F.mid * FP, quiet = gate - (SAFE_BEFORE + 420) * FP;
  if (f.p === undefined) { f.p = 0; f.k = 0; }      // f.p = set pieces so far (each one a little tighter); f.k = the place's own things since the last one
  const space = () => Math.max(40, 120 + (r() % 70) - lvl * 7) * FP + sp * 9;
  if (z !== f.z || x > quiet) {                    // the quiet run-out, as on every level (here: back through the hangar, gold all the way)
    if (z === f.z && !f.out) { f.out = 1; tokenArc(s, quiet + 150 * FP, DECK_Y, 5, 0); tokenArc(s, quiet + 330 * FP, DECK_Y, 5, 0); }
    tokenArc(s, gate + 60 * FP, DECK_Y, 5, 1); s.nextX = gate + SAFE_AFTER * FP; return;
  }
  const put = (kind) => {                          // one thing from the engine's own box, with the engine's own rules about when
    if (s.owed > 0) { kind = 'jacket'; s.owed = 0; }
    if (kind === 'gunner' && x < s.farTo) kind = 'tokens';
    return build(s, kind === 'revgun' ? 'gunner' : kind, x, sp, lvl, z);
  };
  if (x < M - F.pre * FP) {                        // ---- THE WAY OUT ----
    const sc = f.cut, b = sc < 2 ? z0 + F.scenes[sc] * FP : M - F.pre * FP, list = FILM_SET[sc], k = f.n[sc], left = list.length - k;
    const fill = filmPick(s, FILM_RED[sc]), fits = x + (FILM_LEN[fill] + 40) * FP <= b;
    // a set piece is due: the place has just begun, or there have been enough of the place's own things since the last one (and it still fits)
    let room = (sc < 2 ? b : M - (F.post + 190) * FP) - x - 20 * FP; for (let j = k + 1; j < list.length; j++) room -= (FILM_MIN[list[j]] + 170) * FP;   // keep enough room for the ones still to come
    if (k === 0 && sc) room = Math.max(room, FILM_MIN[list[0]] * FP);                   // (the first one of the motorway and the battlefield always goes in: it starts the place)
    const due = f.k >= (k === 0 ? (sc ? 0 : 2) : 1 + (f.p >= 3 ? 1 : 0)) || !fits || room - (FILM_LEN[fill] + 130) * FP < FILM_MIN[list[k]] * FP;
    if (left && room >= FILM_MIN[list[k]] * FP && due) {   // ---- a set piece (written down for the way back) ----
      const g0 = s.gaps.length, p0 = s.plats.length, k0 = s.pickups.length;
      const px = Math.max(x, s.solidTo), len = filmBuild(s, list[k], px, sp, room - (px - x), sc === 1 && left === 1);
      const e = { x0: 2 * M - (px + len), x1: 2 * M - px, gaps: [], plats: [], toks: [] };
      for (const g of s.gaps.slice(g0)) e.gaps.push({ x: 2 * M - (g.x + g.w), w: g.w });
      for (const p of s.plats.slice(p0)) e.plats.push({ kind: p.kind, x: 2 * M - (p.x + p.w), w: p.w, y: p.baseY, amp: p.amp, period: p.period, ph: p.ph, veh: p.veh || '', vi: p.vi || 0 });
      for (const t of s.pickups.slice(k0)) if (t.kind === 'token') e.toks.push({ x: 2 * M - t.x, y: t.y });
      if (s.plats.slice(p0).some((p) => p.y <= LEDGE_Y * FP)) s.solidTo = px + len + 60 * FP + 40 * sp;
      f.log.push(e); f.n[sc]++; f.p++; f.k = 0; s.nextX = px + len + space(); return;
    }
    if (!fits) {                                   // no room for anything more in this place: on to the next (its first set piece starts it)
      if (sc >= 2) { s.nextX = M - F.pre * FP; return; }     // (the last set piece ends at least post + 190 px short of the turnstile: on the way back that is room for the marksman whose bullet flies back to his gun)
      f.n[sc] = list.length; f.cut++; f.k = 0; f.edge[sc] = Math.max(x, b, s.solidTo); s.nextX = f.edge[sc]; return;
    }
    const p0 = s.plats.length, len = put(fill);
    if (s.plats.slice(p0).some((p) => p.y <= LEDGE_Y * FP)) s.solidTo = x + len + 60 * FP + 40 * sp;
    f.k++; s.nextX = x + len + space(); return;
  }
  if (!f.back) {                                   // ---- THE TURNSTILE: gold in, gold out, nothing to do ----
    tokenArc(s, M - (F.pre - 16) * FP, DECK_Y, 4, 0); tokenArc(s, M + 70 * FP, DECK_Y, 4, 0);
    f.back = 1; f.bi = f.log.length - 1; s.nextX = M + F.post * FP; return;
  }
  // ---- THE WAY BACK: the ground you came by, the other way round, and in between it the things that only happen backwards ----
  const T = f.bi >= 0 && f.log[f.bi].x1 <= quiet + 90 * FP ? f.log[f.bi] : null, lim = T ? T.x0 : quiet;
  if (T && x >= T.x0 - 20 * FP) {
    for (const g of T.gaps) s.gaps.push({ id: s.uid++, x: g.x, w: g.w });
    const bk = f.log.length - 1 - f.bi;            // 0 for the first piece laid again, 1, 2... nearer the boss: it gets livelier (more of the traffic drifts, and further)
    for (const p of T.plats) {
      const mv = p.kind === 'moveh' || p.kind === 'movev', drift = !mv && p.veh && p.veh !== 'jack' && p.kind === 'step' && bk >= 1 && r() % 2;
      if (mv) addPlat(s, p.kind, p.x, p.w, p.y, { amp: p.amp + bk * 2 * FP, period: Math.max(80, p.period - bk * 8), ph: p.ph, veh: p.veh, vi: p.vi });
      else if (drift) addPlat(s, 'moveh', p.x, p.w, p.y, { amp: (6 + bk * 2) * FP, period: 140 + (r() % 40), ph: r() % 64, veh: p.veh, vi: p.vi });
      else addPlat(s, p.kind, p.x, p.w, p.y, { veh: p.veh, vi: p.vi });
      if (p.veh && p.kind === 'ledge' && r() % 3 === 0) addGoblin(s, 'backer', p.x + 16 * FP, p.y);   // on the way back a man backs along the lorry roof ahead of you
    }
    for (const t of T.toks) s.pickups.push({ id: s.uid++, kind: 'token', x: t.x, y: t.y });
    if (T.plats.some((p) => p.y <= LEDGE_Y * FP)) s.solidTo = T.x1 + 60 * FP + 40 * sp;
    f.bi--; const nx = f.bi >= 0 ? f.log[f.bi].x0 - 20 * FP : gate;
    s.nextX = Math.max(T.x1 + 40 * FP, Math.min(T.x1 + space(), nx)); return;
  }
  const place = 2 * M - x, sc = place < f.edge[0] ? 0 : place < f.edge[1] ? 1 : 2;
  let kind = f.bn === 0 ? 'revgun' : filmPick(s, FILM_BLUE[sc]);
  if (kind === 'ride' && (f.ride || !s.danger.ride)) kind = 'backer';
  if (x < s.solidTo && kind === 'vent') kind = 'backer';
  if (x + (FILM_LEN[kind] + (kind === 'revgun' ? 20 : 70)) * FP > lim) kind = 'bat';
  if (x + (FILM_LEN.bat + 50) * FP > lim) { s.nextX = Math.max(x + FP, lim - 20 * FP); return; }   // nothing fits before the next piece of ground: straight on to it
  if (kind === 'ride') f.ride = 1;
  f.bn++;
  const len = put(kind);
  s.nextX = Math.min(x + len + space(), Math.max(x + len + 40 * FP, lim - 20 * FP));
}

const SIZE = { gunner: [7, 28], dropper: [6, 10], backer: [7, 26], brute: [11, 32], ghoul: [7, 28], scientist: [7, 30], biker: [12, 24], slime: [9, 16], slimelet: [5, 9] };
const VALUE = { gunner: 80, dropper: 60, backer: 60, brute: 100, ghoul: 75, scientist: 100, biker: 100, slime: 60, slimelet: 30 };

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

// BHF: a smart bomb (a V-box prize): everything alive on screen goes
function bomb(s) {
  const edge = s.dist + (W + 10) * FP; let n = 0, v = 0;
  for (const g of s.goblins) if (!g.dead && g.x < edge && g.x > s.dist - 20 * FP) { g.dead = true; g.stomped = !g.hang && !g.falling; v += VALUE[g.small ? 'slimelet' : g.kind] || 50; n++; }
  for (const f of s.flyers) if (!f.dead && f.active) { f.dead = true; f.t = 0; v += 40; n++; }
  for (const u of s.unicorns) if (!u.dead && u.x < edge) { u.dead = true; u.t = 0; v += 50; n++; }
  s.blobs = []; s.shots = []; s.drips = s.drips.filter((d) => !d.sky);
  s.kills += n; s.bonus += v; s.events.push('bomb:' + v);
}

function stompable(s, prevBottom, top) { return s.vy > 0 && prevBottom <= top + 12 * FP; }

// standing / landing ----------------------------------------------------------------
function supportAt(s, x) {                      // is the thing we're standing on still under us?
  if (s.plat >= 0) { const p = s.plats.find((q) => q.id === s.plat); return p && overPlat(p, x) ? p : null; }
  if (s.groundY === DECK_Y * FP) return (s.fly > 0 && s.ride > 0) || deckUnder(s, x);
  if (s.groundY === BLOCK_TOP * FP) return onBlock(s, x);
  return false;
}
function landing(s, x, prevB, newB) {
  let best = -1, plat = -1;
  const consider = (y, ok, id = -1, tol = 0) => { if (ok && prevB <= y + tol && newB >= y && (best < 0 || y < best)) { best = y; plat = id; } };
  consider(BLOCK_TOP * FP, onBlock(s, x));
  // forgiving: if your feet reach within a few pixels of a platform's top at the top of a jump, you step up onto it
  for (const p of s.plats) consider(p.y, !p.gone && x + 6 * FP > p.cx && x - 6 * FP < p.cx + p.w, p.id, 7 * FP);
  consider(DECK_Y * FP, (s.fly > 0 && s.ride > 0) || deckUnder(s, x));
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
  s.speed = Math.min(speedCap(s), SPEED0 + zoneOf(s.dist) * 24 + Math.floor(s.tick / 60) + (s.hard ? Math.floor((s.tick - s.hardTick) / 40) : 0));
  const wasAir = !s.onGround;

  // platforms move / crumble
  for (const p of s.plats) {
    p.cx = platX(p, s.tick); p.y = platY(p, s.tick);
    if (p.crumble > 0) { p.crumble--; if (p.crumble === 0) { p.gone = true; s.events.push('crumble'); } }
  }

  // BHF: the black hole coin is paying out. It stops the moment you press jump (or it hits its cap). It holds still while you can't be hurt.
  if (s.chick) { const c = s.chick;
    if (pressed) { s.events.push('bank:' + c.paid); s.chick = null; }
    else if (!(s.star > 0)) {
      c.t++; c.acc += c.r; c.r += c.r >> HOLE.grow;
      const tot = Math.min(c.cap, Math.floor(c.acc / 65536)); if (tot > c.paid) { s.bonus += tot - c.paid; c.paid = tot; }
      if (c.t % 5 === 0) s.events.push('chick:' + c.paid);
      if (c.paid >= c.cap) { s.events.push('bank:' + c.paid); s.chick = null; }
    }
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
    s.blobs = []; s.drips = []; s.flyers = []; s.shots = []; s.clouds = [];
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
            else if (b.reward === 'shield') { s.shield = 1; s.events.push('bonk:shield'); }
            else if (b.reward === 'bomb') { s.events.push('bonk:bomb'); bomb(s); }
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
        if (p && p.kind === 'crumble' && p.crumble < 0) { p.crumble = s.film ? 18 : 26; s.events.push('creak'); }   // level 6: its slabs blow while still in the picture
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
  if (s.ride > 0) {                                // a ride: invincible while it lasts; one that flies never drops you in a hole
    const over = s.fly > 0 && (!s.onGround || s.groundY === DECK_Y * FP && (inGap(s, px - 10 * FP) || inGap(s, px + 40 * FP)));
    if (s.ride > 1 || !over) s.ride--;
    if (s.star < s.ride + 1) s.star = s.ride + 1;
  }
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
  for (const c of s.clouds) {                      // BHF: a downpour. most of it lands where you are not; now and then one has your name on it
    if (c.x - s.dist > (W + 10) * FP || c.x + c.w < px - 70 * FP) continue;
    if (c.t++ === 0) s.events.push('rain');
    const land = px + s.speed * RAIN_T;            // where you will be standing when a drop that lets go now reaches the floor
    const drop = (tx, hot) => s.drips.push({ id: s.uid++, sky: true, hot, x: tx - c.vx * RAIN_T, tx, y: SKY_Y * FP, vx: c.vx, vy: 0 });
    if (c.t >= c.next && land - 8 * FP > c.x && land < c.x + c.w && !inGap(s, land - 6 * FP)) { c.next = c.t + c.gap; drop(land - 6 * FP, true); continue; }
    if (c.t % c.every) continue;
    if (R(s) % 4 === 0) { const lo = Math.max(c.x, px - 64 * FP), hi = Math.min(c.x + c.w, px - 14 * FP) + c.vx * RAIN_T; if (hi > lo) drop(lo + (R(s) % Math.ceil((hi - lo) / FP)) * FP, false); continue; }
    const lo = Math.max(c.x, land + 18 * FP), hi = Math.min(c.x + c.w, s.dist + (W + 40) * FP);
    if (hi > lo) drop(lo + (R(s) % Math.ceil((hi - lo) / FP)) * FP, false);
  }
  for (const d of s.drips) {
    if (d.up) {
      if (d.wait) { if (d.x - px < s.speed * 20 + 4 * FP) { d.wait = false; s.events.push('drop'); } continue; }
      d.y -= RAIN_V; if (d.y < (SKY_Y - 12) * FP) d.gone = true; continue;
    }
    if (d.sky) {
      const prevY = d.y; d.y += RAIN_V; d.x += d.vx;
      for (const p of s.plats) if (overPlat(p, d.x) && prevY < p.y && d.y >= p.y) { d.gone = true; d.splash = true; d.ly = p.y; break; }
      if (!d.gone && d.y >= DECK_Y * FP && !inGap(s, d.x)) { d.gone = true; d.splash = true; d.ly = DECK_Y * FP; }
      if (d.y > (WORLD_H + 10) * FP) d.gone = true;
      continue;
    }
    d.vy += DRIP_G; d.y += d.vy; if (d.y >= DECK_Y * FP) { d.gone = true; d.splash = true; }
  }
  for (const v of s.vents) if ((s.tick + v.phase) % v.period === 0 && v.x > s.dist && v.x - s.dist < W * FP) s.events.push('vent');
  for (const b of s.shots) { b.x += b.vx; if (b.rev && b.x >= b.to) b.gone = true; }

  // trolls
  for (const g of s.goblins) {
    if (!g.active && g.x - s.dist < W * FP) { g.active = true; if (g.twin !== undefined && g.shoe === 0) s.events.push('boss'); }
    if (!g.active || g.dead) continue;
    g.t++;
    if (g.hang) {                                 // BHF: it lets go so as to land just ahead of you
      const cfg = (s.danger && s.danger.dropper) || {}, lead = cfg.lead || (cfg.to === 'puddle' ? 64 : 120);
      if (!g.wob && g.x - px < lead * FP + 36 * s.speed) { g.wob = 14; s.events.push('creak'); }
      if (g.wob > 0 && --g.wob === 0) { g.hang = false; g.falling = true; g.vy = 0; g.y += (cfg.h || 12) * FP; s.events.push('drop'); }
      continue;
    }
    if (g.falling) {
      const py = g.y; g.vy += G; g.y += g.vy;
      if (py <= DECK_Y * FP && g.y >= DECK_Y * FP && deckUnder(s, g.x)) {
        g.y = DECK_Y * FP; g.baseY = g.y; g.falling = false; g.vy = 0;
        if (g.kind === 'dropper') {
          s.events.push('thud');
          if (((s.danger && s.danger.dropper) || {}).to === 'puddle') { g.dead = true; s.puddles.push({ id: s.uid++, x: g.x - 8 * FP, w: 16 * FP, y: g.y, fresh: true, shard: true }); }
          else { g.air = true; g.vy = -700; g.vx = -(150 + level(s) * 6); }      // ...and springs at your face
        }
      }
      if (g.y > (WORLD_H + 20) * FP) g.dead = true;
      continue;
    }
    if (g.stun > 0) { g.stun--; continue; }
    if (g.kind === 'ghoul' || g.kind === 'slime') {   // hoppers: sit, then leap forward
      const every = g.kind === 'ghoul' ? 48 : g.small ? 26 : 40;
      if (!g.air && g.t % every === 0) { g.air = true; g.vy = g.kind === 'ghoul' ? -880 : g.small ? -620 : -980; s.events.push('hop'); }
      if (g.air) { g.vy += 50; g.y += g.vy; if (g.y >= g.baseY) { g.y = g.baseY; g.air = false; g.vy = 0; if (g.kind === 'slime') s.events.push('squelch'); } }
    }
    if (g.kind === 'dropper' && g.air) { g.vy += 50; g.y += g.vy; if (g.y >= g.baseY) { g.y = g.baseY; g.air = false; g.vy = 0; } }
    if (g.kind === 'gunner') {
      if (g.flash > 0) g.flash--;
      if (g.hole !== undefined) {                 // inverted: once you are between the hole and the gun, the bullet leaps back to him
        if (!g.fired && px > g.hole + 34 * FP && g.x > px + 30 * FP) { g.fired = true; g.flash = 30; s.shots.push({ id: s.uid++, rev: true, x: g.hole, y: g.y - 9 * FP, vx: s.speed + 700, to: g.x - 8 * FP }); s.events.push('shot'); }
      } else {
        if (!g.fired && g.x - px < 200 * FP && g.x > px + 60 * FP) { g.fired = true; g.aim = 24; }
        if (g.aim > 0 && --g.aim === 0) {
          s.shots.push({ id: s.uid++, x: g.x - 10 * FP, y: g.y - 9 * FP, vx: -520 }); s.events.push('shot'); g.flash = 6;
          if (--g.shots > 0) g.aim = 16;
        }
      }
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
    g.x += g.kind === 'dropper' && g.air ? -200 : g.kind === 'ghoul' ? (g.air ? -(170 + level(s) * 6) : 0) : g.kind === 'slime' ? (g.air ? (g.small ? -90 : -130) : 0) : g.vx;
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
    else if (f.kind === 'seeker') {               // BHF: follows your height until it is close, then flies dead straight
      if (!f.lock && f.x - px < 76 * FP) { f.lock = true; f.vx -= 120; s.events.push('lock'); }
      if (!f.lock) { const d = s.y - 14 * FP - f.y, m = 190 + level(s) * 8; f.y += Math.max(-m, Math.min(m, d)); }
    } else {
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
    if (!d.wait && overlap(pl, pr, d.x - 2 * FP, d.x + 2 * FP) && overlap(pt, pb, d.y - 4 * FP, d.y)) { d.gone = true; s.events.push('splat'); hit(s, d.sky ? 'rain' : 'acid'); }
  }
  for (const b of s.shots) {
    if (b.gone) continue;
    if (overlap(pl, pr, b.x - 3 * FP, b.x + 3 * FP) && overlap(pt, pb, b.y - 2 * FP, b.y + 2 * FP)) { b.gone = true; hit(s, 'shot'); }
  }
  for (const v of s.vents) {
    const c = (s.tick + v.phase) % v.period;
    if (c < v.on && overlap(px - 5 * FP, px + 5 * FP, v.x - 4 * FP, v.x + 4 * FP) && pb > v.y - Math.min(v.h, 8 + c * 9) * FP && pt < v.y) hit(s, 'vent');
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
    if (!g.active || g.dead || g.falling || g.hang) continue;
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
          if (s.danger && s.danger.acidBlood && !g.small && !g.air) s.puddles.push({ id: s.uid++, x: g.x - 7 * FP, w: 14 * FP, y: g.y, fresh: true });   // BHF: acid for blood
          if (g.kind === 'slime' && !g.small) for (const dx of [-16, 18]) {      // a big slime splits in two
            s.goblins.push({ id: s.uid++, kind: 'slime', small: true, x: g.x + dx * FP, y: g.y, baseY: g.y, vx: 0, active: true, falling: false, vy: 0, t: 8 + (dx > 0 ? 9 : 0), hp: 1, stun: 0, air: false });
          }
        }
      } else if (g.stun === 0) hit(s, 'goblin');
    }
  }
  for (const f of s.flyers) {
    if (!f.active || f.dead) continue;
    const small = f.kind !== 'pegasus', hw = small ? 7 : 14, hh = f.kind === 'seeker' ? 4 : small ? 5 : 9;
    if (overlap(pl, pr, f.x - hw * FP, f.x + hw * FP) && overlap(pt, pb, f.y - hh * FP, f.y + hh * FP)) {
      if (s.star > 0) {
        f.dead = true; f.t = 0; const v = f.kind === 'bat' ? 40 : f.kind === 'seeker' ? 60 : 150; s.bonus += v; s.events.push('smash:' + v);
      } else if (small ? stompable(s, prevBottom, f.y - hh * FP) : !s.onGround) {
        f.dead = true; f.t = 0; s.vy = -900; s.jumps = 1; s.onGround = false; s.plat = -1;
        const v = f.kind === 'bat' ? 40 : f.kind === 'seeker' ? 60 : 150; s.bonus += v; s.events.push((small ? 'batkill:' : 'unikill:') + v);
      } else hit(s, small ? 'bat' : 'unicorn');
    }
  }
  for (const p of s.pickups) {
    if (p.taken) continue;
    const rr = p.kind === 'jacket' ? 9 : p.kind === 'ride' ? 14 : p.kind === 'hole' ? 8 : 5;
    if (overlap(pl, pr, p.x - rr * FP, p.x + rr * FP) && overlap(pt, pb, p.y - rr * FP, p.y + rr * FP)) {
      p.taken = true;
      if (p.kind === 'ride') { const c = (s.danger && s.danger.ride) || {}; s.ride = c.ticks || RIDE_TICKS; s.fly = c.fly ? 1 : 0; s.star = Math.max(s.star, s.ride); s.events.push('ride'); }
      else if (p.kind === 'token') { const v = coinValue(s, p.x); s.bonus += v; s.events.push('token:' + v); }
      else if (p.kind === 'hole') { if (!s.chick) { s.chick = { acc: 0, r: HOLE.rate0, paid: 0, t: 0, cap: Math.min(HOLE.capMax, HOLE.cap + HOLE.capLevel * Math.min(5, zoneOf(p.x) % ZONES) + HOLE.capLap * s.lap) };   /* the harder the level, the more it can pay */ s.events.push('hole'); } }
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
  s.vents = s.vents.filter((v) => v.x > behind);
  s.clouds = s.clouds.filter((c) => c.x + c.w > behind);
  s.shots = s.shots.filter((b) => !b.gone && b.x > behind && b.x < s.dist + (W + 60) * FP);

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

// Black Hole Friday: drop the runner at the start of zone z (a level), with a clean world
export function startZone(s, z, extras = null, danger = null, lap = 0) {
  s.extras = extras; s.danger = danger; s.seen = {}; s.ride = 0; s.fly = 0; s.lap = lap; s.chick = null; s.holeZ = -1;
  s.dist = z * ZONE_PX * FP; s.y = DECK_Y * FP; s.vy = 0; s.onGround = true; s.groundY = DECK_Y * FP; s.plat = -1; s.jumps = 0; s.hold = 0;
  s.invuln = 0; s.triple = 0; s.star = 0; s.cleared = -1; s.dead = false; s.cause = '';
  for (const k of ['gaps', 'plats', 'puddles', 'pipes', 'drips', 'blobs', 'unicorns', 'goblins', 'flyers', 'pickups', 'blocks', 'vents', 'clouds', 'shots']) s[k] = [];
  // the level's ride (if it has one) is parked somewhere in the middle third, most runs
  const rc = danger && danger.ride; s.rideAt = rc && R(s) % 100 < (rc.chance ?? 65) ? s.dist + (ZONE_PX * (28 + (R(s) % 34)) / 100 | 0) * FP : 0;
  // the first thing to dodge arrives 190 ticks in, whatever the speed: the level name (150 ticks, centre screen) has gone by then
  s.tick = Math.max(s.tick, z * Math.floor((ZONE_PX * 7) / 16));   // BHF (2800 ticks a level; was 2100 when a level was 4800 px): a level is as fast started cold (level select, a retry) as it is when you have run the whole game to reach it
  const sp0 = Math.min(speedCap(s), SPEED0 + z * 24 + Math.floor(s.tick / 60));
  s.nextX = s.dist + PLAYER_SX * FP + sp0 * 190; s.lastMulti = s.dist; s.solidTo = 0; s.calmTo = 0; s.chasms = Math.min(10, TUNE.chasm[Math.min(TUNE.chasm.length - 1, z)] + lap * LAP.chasm);
  s.farTo = s.nextX + sp0 * 100;                // ...and nothing that reaches out ahead of itself (a gunner's shot, a seeker) until a little later still
  s.film = danger && danger.film ? { z, back: 0, n: [0, 0, 0], cut: 0, log: [], bi: -1, bn: 0, ride: 0, out: 0, edge: [(z * ZONE_PX + danger.film.scenes[0]) * FP, (z * ZONE_PX + danger.film.scenes[1]) * FP] } : null;   // level 6: its own layout (spawnFilm). Plain data, so a run can still be copied.
}
// how far through its zone the runner is (px), and the zone's length
export const zoneProgress = (s) => Math.floor((playerX(s) - zoneOf(playerX(s)) * ZONE_PX * FP) / FP);
