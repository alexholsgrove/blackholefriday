// THE CODE, the boss: THE AGENT. First a shootout across the lobby (tap: shoot his gold rounds out of the air; hold: lean back under
// the red spray; tap while he reloads: hit him). Three hits and the guns go: a fist fight in the middle of the lobby (tap as the ring
// closes on his fist: block and counter; hold: bend under the red kick). Six counters, then he reels: FINISH HIM, one tap to knock him out (wait too long and he recovers for one more counter).
// Rules of the house (BRIEF-f.md): init / update use only st.rnd(), counters and + - * /; everything on a canvas is built in draw.
import { cv, hash, put, tint, TAU, drawText, GRAD, noise } from '../kit.js';
import { BW, FL, hurt, win, pips } from '../bosskit.js';
import { POSE, STYLE, mix, buildSprite } from './code-rig.js';

export function agentBoss(B, T) {
  const { rim, pale, pillar, chip, gl, R, tiny } = T;
  const HX = 56, AX = 266, CH = 148, CA = 172;        // where they stand for the shootout; where they meet
  const MZX = AX - 16, HITX = HX + 6, ZX0 = HITX, ZX1 = HX + 48;      // his muzzle; where a round hits you; your reach
  const BT = 9, SAFE = 6, RELOAD = 55, SPV = 11.75, SF = 16, MAXB = 100, MAXB2 = 60, PORTX = 242;
  const gy = (x) => FL - 13 - Math.max(0, x - 130) / 12;               // a gold round is aimed low: it drops to thigh height
  const SPY = FL - 25;                                                  // the spray goes through at chest height

  // ---------- the lobby, drawn once: pale marble, four pillars, the lifts at the back ----------
  const M2 = { base: '#b4cab9', hi: '#e2f2e5', lo: '#93ac9b', vein: '#a2baa9', dk: '#7b9686', out: '#33483d' };
  const stage = cv(BW, 180), scr = cv(BW, 180);
  { const x = stage.getContext('2d'), n = noise(7);
    R(x, '#7f9c89', 0, 0, BW, FL);
    for (let j = 0; j < 4; j++) for (let i = -1; i < 8; i++) { const a = i * 46 + (j % 2 ? 23 : 0), b = 26 + j * 34; R(x, '#86a390', a, b, 46, 34); R(x, '#93b09d', a + 1, b + 1, 44, 1); R(x, '#6f8c79', a, b, 1, 34); R(x, '#6f8c79', a, b + 33, 46, 1); if (n() < 0.3) R(x, '#7b9885', a + 3, b + 4, 40, 26); }
    R(x, '#33483d', 0, 0, BW, 24); R(x, '#4a6052', 0, 22, BW, 2); R(x, '#253329', 0, 24, BW, 1); for (let i = 0; i < BW; i += 32) R(x, '#2a3a32', i, 0, 1, 22);
    for (const c of [64, 160, 254]) { for (let j = 0; j < 110; j++) { x.fillStyle = `rgba(235,255,240,${[0.22, 0.16, 0.11, 0.07, 0.04, 0.02][(j / 19) | 0]})`; const hw = 20 + j * 0.34; x.fillRect(Math.round(c - hw), 25 + j, Math.round(hw * 2), 1); } R(x, '#16211c', c - 19, 18, 38, 5); R(x, '#f4fff6', c - 18, 19, 36, 3); }
    for (const a of [133, 163]) {                      // lifts
      R(x, '#33483d', a - 1, 79, 28, 81); R(x, '#a2baa9', a, 80, 26, 80); R(x, '#d0e4d5', a, 80, 26, 1); R(x, '#33483d', a + 2, 83, 22, 77); R(x, '#6f8c79', a + 3, 84, 20, 76); R(x, '#86a390', a + 3, 84, 1, 76); R(x, '#86a390', a + 14, 84, 1, 76); R(x, '#33483d', a + 12, 84, 1, 76);
      R(x, '#33483d', a + 5, 70, 16, 7); R(x, '#16211c', a + 6, 71, 14, 5); for (let i = 0; i < 5; i++) R(x, i === (a === 133 ? 1 : 3) ? '#8aff9a' : '#33483d', a + 7 + i * 3, 73, 2, 1);
    }
    R(x, '#33483d', 159, 118, 4, 8); R(x, '#8aff9a', 160, 120, 1, 1);
    R(x, '#33483d', 153, 40, 15, 15); R(x, '#e2f2e5', 154, 41, 13, 13); R(x, '#f4fff6', 155, 42, 11, 11); for (const [a, b] of [[160, 42], [160, 52], [155, 47], [165, 47]]) R(x, '#33483d', a, b, 1, 1);
    R(x, '#33483d', 230, 96, 23, 11); R(x, '#0f6a1c', 231, 97, 21, 9); tiny(x, 'EXIT', 234, 99, '#e8ffe8');
    R(x, '#587062', 0, 150, BW, 10); R(x, '#93b09d', 0, 150, BW, 1); R(x, '#33483d', 0, 159, BW, 1);
    for (const p of [14, 104, 196, 288]) pillar(x, p, 25, FL, 22, n, M2);
    // the floor: polished checkerboard, pillars and lights mirrored in it
    for (let j = 0; j < 20; j++) for (let i = 0; i < BW; i++) { const row = j < 5 ? 0 : j < 12 ? 1 : 2, t = Math.floor((i + 6) / 20) + row, top = j === [0, 5, 12][row]; x.fillStyle = t % 2 ? (top ? '#e8f6ea' : row ? '#c9dccd' : '#b4cab9') : (top ? '#4a6052' : row ? '#2a3a32' : '#33483d'); x.fillRect(i, FL + j, 1, 1); }
    for (const p of [14, 104, 196, 288]) { x.fillStyle = 'rgba(230,250,235,0.16)'; x.fillRect(p + 2, FL + 1, 18, 19); }
    for (const c of [64, 160, 254]) { x.fillStyle = 'rgba(240,255,245,0.3)'; x.fillRect(c - 12, FL + 2, 24, 2); x.fillRect(c - 8, FL + 8, 16, 2); }
    R(x, '#f4fff6', 0, FL, BW, 1);
  }
  // bullet chips: the play keeps a list, the picture of them belongs to draw
  const CHIPS = new WeakMap();
  const chipsCv = (st) => {
    let o = CHIPS.get(st); if (!o) { o = { c: cv(BW, 180), n: 0 }; o.c.getContext('2d').drawImage(stage, 0, 0); CHIPS.set(st, o); }
    const x = o.c.getContext('2d');
    while (o.n < st.chips.length) { const c = st.chips[o.n++], n = o.n; chip(x, c.side ? 291 + ((hash(n, 3) * 15) | 0) : 27 + ((hash(n, 3) * 7) | 0), Math.round(c.y - 3 + hash(n, 5) * 7), 3 + ((hash(n, 9) * 3) | 0), n * 7, '#f4fff6', '#6f8c79'); }
    return o.c;
  };

  // ---------- sprites: posed from the jointed figure, built the first time they are drawn ----------
  const cache = new Map(), greens = new WeakMap();
  const poseOf = (key) => { const m = /^(\w+)>(\w+):(\d+)\/(\d+)$/.exec(key); return m ? mix(POSE[m[1]], POSE[m[2]], m[3] / m[4]) : POSE[key]; };
  const spr = (role, key, k) => { const id = role + k + key; let s = cache.get(id); if (!s) { s = buildSprite(poseOf(key), role === 'h' ? STYLE.hero : STYLE.agent, k, role === 'h' ? { copper: true } : { left: true, finish: (f) => rim(pale(f)) }); cache.set(id, s); } return s; };
  const green = (s) => { let g = greens.get(s); if (!g) { g = tint(s, '#3ae03a', 0.8); greens.set(s, g); } return g; };
  const tw = (a, b, i, n) => (i <= 0 ? a : i >= n ? b : `${a}>${b}:${i}/${n}`);
  const agentWalk = B.agent.map((f) => rim(pale(f))), heroRun = B.hero.run;
  const QUEUE = [];
  { const steps = (r, k, a, b, n) => { for (let i = 1; i < n; i++) QUEUE.push([r, tw(a, b, i, n), k]); };
    for (const n of ['aim', 'aimLow', 'fire', 'fireLow', 'reload', 'ouchG', 'bendG', 'holster']) QUEUE.push(['h', n, 1]); steps('h', 1, 'aimLow', 'bendG', 6);
    for (const n of ['aAim', 'aFire', 'aTwo', 'aTwoF', 'aReload', 'aFlinch', 'aSway', 'aDisarm', 'aTie']) QUEUE.push(['a', n, 1]); steps('a', 1, 'aAim', 'aSway', 3);
    for (const n of ['guard', 'guard2', 'block', 'punch', 'whiff', 'ouch', 'bend', 'crouch', 'fly']) QUEUE.push(['h', n, 2]); steps('h', 2, 'guard', 'bend', 6);
    for (const n of ['aGuard', 'aGuard2', 'aWind', 'aPunch', 'aCoil', 'aKick', 'aBent', 'aSlip', 'aJab', 'aTie', 'aStagger', 'aFly', 'aFold']) QUEUE.push(['a', n, 2]);
    steps('a', 2, 'aGuard', 'aWind', 3); steps('a', 2, 'aWind', 'aPunch', 3); steps('a', 2, 'aGuard', 'aCoil', 3); steps('a', 2, 'aCoil', 'aKick', 2); steps('a', 2, 'aGuard', 'aBent', 4); QUEUE.push(['a', 'aHit', 2]); steps('a', 2, 'aHit', 'aGuard', 4); steps('a', 2, 'aGuard', 'aSlip', 3);
    for (const n of ['aFold', 'aSplat']) QUEUE.push(['a', n, 1]); for (const n of ['fly', 'crouch']) QUEUE.push(['h', n, 1]); }
  let qi = 0;

  // ---------- the camera: 1x for the shootout, a 2x close-up for the fist fight ----------
  const zz = (st) => 1 + st.z / 10;
  const SX = (st, x) => Math.round(160 + (x - 160) * zz(st)), SY = (st, y) => Math.round(160 + (y - 160) * zz(st));
  const blit = (ctx, st, s, k, wx, wy, al = 1) => {
    const q = zz(st) / k, X = SX(st, wx), Y = SY(st, wy); if (al < 1) ctx.globalAlpha = al;
    if (q === 1) ctx.drawImage(s.c, X - s.ox, Y - s.oy); else ctx.drawImage(s.c, Math.round(X - s.ox * q), Math.round(Y - s.oy * q), Math.round(s.c.width * q), Math.round(s.c.height * q));
    if (al < 1) ctx.globalAlpha = 1;
  };
  const fig = (ctx, st, role, key, wx, wy, al = 1, gr = false) => { const k = st.z > 0 ? 2 : 1, s = spr(role, key, k); blit(ctx, st, gr ? green(s) : s, k, wx, wy, al); return s; };
  const ring = (ctx, cx, cy, rx, ry, col, w = 1) => { ctx.fillStyle = col; const m = Math.max(8, Math.round(Math.max(rx, ry) * 4)); for (let k = 0; k < m; k++) { const a = k / m * TAU; ctx.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), w, w); } };
  // the timing ring: thick, dark-edged, so it reads on a dark suit and on pale marble alike
  const tring = (ctx, cx, cy, r, core, inw, f) => { ring(ctx, cx - 1, cy - 1, r + 1, r + 1, '#000', 4); ring(ctx, cx, cy, r + 1, r + 1, inw ? '#ffd23a' : '#e8ffe8', 2); ring(ctx, cx, cy, r, r, inw ? ((f >> 1) % 2 ? '#fff' : '#ffd23a') : '#fff', 2); ring(ctx, cx - 1, cy - 1, core, core, '#000', 3); ring(ctx, cx, cy, core, core, inw ? '#fff' : '#8aff9a', 1); };
  const line = (ctx, x0, y0, x1, y1, col, w = 1) => { ctx.fillStyle = col; const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (let s = 0; s <= n; s++) ctx.fillRect(Math.round(x0 + (x1 - x0) * s / n), Math.round(y0 + (y1 - y0) * s / n), w, w); };
  const say = (ctx, s, x, y, fill) => drawText(ctx, s, x, y, { fill, outline: '#000', align: 'center' });

  // ---------- the play ----------
  const chipAt = (st, side, y) => { if (st.chips.length < 40) st.chips.push({ side, y }); st.fx.push({ t: 'dust', x: side ? 292 : 36, y, k: st.k, s: st.chips.length, dir: side ? -1 : 1 }); st.events.push('thump'); st.shake = Math.max(st.shake, 2); };
  // one volley: when he does what (S: a gold round, T: the two-handed tell, then the spray), and when it has all arrived
  const volley = (st) => {
    const cf = st.cf, F = cf.F, TL = cf.TL, n = st.vol, L = st.lap >= 1, late = n > 2, j = n > 0 ? Math.floor(st.rnd() * 9) : 0, pick = late ? Math.floor(st.rnd() * 3) % 3 : n;
    let ev;
    if (!L) {
      if (pick === 0) ev = late ? [[0, 'S'], [34 + j, 'S'], [68 + 2 * j, 'S']] : [[0, 'S'], [46, 'S']];
      else if (pick === 1) ev = late ? [[0, 'S'], [2, 'T'], [60 + j, 'S'], [96 + 2 * j, 'S']] : j % 2 ? [[0, 'T'], [TL + 28 + j, 'S']] : [[0, 'S'], [2, 'T']];       // the spray overtakes his slow round
      else { const a = late ? 30 + j : 36 + j; ev = [[0, 'S'], [a, 'S'], [a + 83, 'S'], [a + 85, 'T']]; }
    } else {
      if (pick === 0) ev = [[0, 'S'], [32 + j, 'S'], [64 + 2 * j, 'S']].concat(late ? [[100 + 2 * j, 'S']] : []);
      else if (pick === 1) ev = [[0, 'T'], [TL + 28, 'S'], [TL + 62 + j, 'S']];
      else { const a = 30 + j; ev = [[0, 'S'], [a, 'S'], [a + 66, 'T'], [a + 66 + TL + 28, 'S']]; }
    }
    let end = 0; for (const e of ev) { e[0] += 14; end = Math.max(end, e[1] === 'S' ? e[0] + F : e[0] + TL + 20 + SF); }
    return { ev, end: end + 8 };
  };
  const target = (st) => { let b = null; for (const r of st.bul) if (r.kind === 0 && r.x > ZX0 && r.x <= ZX1 && (!b || r.x < b.x)) b = r; return b ? { r: b } : st.as === 'open' ? { a: 1 } : null; };
  const shoot = (st, tg) => {
    if (st.mag <= 0) { st.events.push('bonk'); return; }
    st.mag--; st.fire = 7; st.events.push('shot'); if (st.mag === 0) st.rl = RELOAD;
    const mx = HX + 16, my = FL - 23;
    if (tg && tg.r) {                                 // knocked out of the air
      const r = tg.r, y = gy(r.x); st.bul.splice(st.bul.indexOf(r), 1); st.flow = 1;
      st.fx.push({ t: 'tr', x: mx, y: my + 2, x2: r.x, y2: y, k: st.k }, { t: 'ric', x: r.x, y, k: st.k, s: st.k });
      st.bonus += 10; st.events.push('good'); st.stop = 4;
    } else if (tg && tg.a) {                          // he was reloading
      st.flow = 0; st.fx.push({ t: 'tr', x: mx, y: my, x2: AX - 6, y2: FL - 25, k: st.k }, { t: 'pow', x: AX - 5, y: FL - 25, k: st.k });
      st.ahp--; st.bonus += 50; st.events.push('bosshit'); st.stop = 6; st.shake = Math.max(st.shake, 5);
      if (st.ahp <= 0) { st.ph = 'x'; st.as = 'disarm'; st.ak = 0; st.bul = []; st.d = 0; st.hs = 'up'; st.fx.push({ t: 'gun', x: AX - 15, y: FL - 24, k: st.k }); }
      else { st.as = 'flinch'; st.ak = 34; }
    } else {                                          // wasted: he leans out of its way and it takes a bite out of the pillar behind him
      st.flow = 0; st.fx.push({ t: 'tr', x: mx, y: my, x2: 292, y2: my - 3, k: st.k }); chipAt(st, 1, my - 6 + (st.k % 5) * 3);
      if ((st.as === 'volley' || st.as === 'wait') && st.afire <= 0) st.sway = 18;
    }
  };
  const lean = (st, press, down, maxb) => {          // the bend, shared by both halves. true = a short tap has just been let go
    if (st.hs === 'lean') { st.hk++; st.d = Math.max(0, Math.min(12, st.hk - 2)); if (!down) { st.hs = 'rise'; return st.hk <= BT; } if (st.hk >= BT) { st.hs = 'bend'; st.events.push('whoosh'); } }
    else if (st.hs === 'bend') { st.hk++; st.d = Math.min(12, st.d + 1); if (!down || st.hk >= maxb) st.hs = 'rise'; }
    else if (st.hs === 'rise') { st.d = Math.max(0, st.d - 1); if (press && st.d <= 6) st.pb = 1; if (st.d === 0) { st.hs = 'up'; if (st.pb) { st.pb = 0; st.buf = 1; } } }
    return false;
  };
  const phase1 = (st, press, down) => {
    const cf = st.cf;
    if (st.rl > 0 && --st.rl === 0) { st.mag = 6; st.events.push('lock'); }
    // you
    if (st.hs === 'up') { if (press) { const tg = target(st); st.shot = 0; if (tg && st.mag > 0) { shoot(st, tg); st.shot = 1; } if (st.ph === 1) { st.hs = 'lean'; st.hk = 0; } } }
    else if (lean(st, press, down, MAXB) && !st.shot) shoot(st, target(st));
    if (st.ph !== 1) return;
    // him
    if (st.as === 'wait') { if (--st.ak <= 0) { const v = volley(st); st.ev = v.ev; st.vend = v.end; st.vk = 0; st.as = 'volley'; st.dodged = 0; if (st.mag < 6 || st.rl > 0) { st.mag = 6; st.rl = 0; st.events.push('lock'); } } }
    else if (st.as === 'volley') {
      st.vk++;
      for (const [t, ty] of st.ev) {
        if (ty === 'S') { if (t === st.vk) { st.bul.push({ x: MZX, v: cf.sv, kind: 0 }); st.afire = 7; st.sway = 0; st.events.push('shot'); } }
        else { if (t === st.vk) { st.dodged = 0; st.sway = 0; st.events.push('warn'); } const q = st.vk - t - cf.TL; if (q >= 0 && q <= 20 && q % 4 === 0) { st.bul.push({ x: MZX, v: SPV, kind: 1, i: q / 4 }); st.events.push('shot'); } }
      }
      if (st.vk >= st.vend) { st.as = 'open'; st.ak = cf.open; st.events.push('drop'); }
    }
    else if (st.as === 'open') { if (--st.ak <= 0) { st.as = 'wait'; st.ak = 22; st.vol++; } }
    else if (st.as === 'flinch') { if (--st.ak <= 0) { st.as = 'wait'; st.ak = 8; st.vol++; } }
    // his rounds
    for (const r of st.bul) {
      r.x -= r.v;
      if (r.kind === 0) { if (r.x <= HITX) { r.dead = 1; if (hurt(st, 'gold round: shoot it down')) { st.reel = 20; st.fx.push({ t: 'hit', x: HX + 3, y: FL - 14, k: st.k }); } else chipAt(st, 0, FL - 13); } }
      else {
        if (!r.past && r.x <= HITX + 6) { r.past = 1; if (st.d < SAFE) { if (hurt(st, 'machine gun: hold the button to duck')) { st.reel = 20; st.fx.push({ t: 'hit', x: HX + 3, y: SPY, k: st.k }); } } else if (!st.dodged) { st.dodged = 1; st.bonus += 25; st.events.push('good'); } }
        if (r.x <= 36) { r.dead = 1; chipAt(st, 0, SPY + (r.i % 3) * 3 - 3); }
      }
    }
    st.bul = st.bul.filter((r) => !r.dead);
  };
  // the guns go: he straightens his tie, and they walk in to meet each other
  const between = (st) => {
    const k = ++st.ak, h = st.h;
    if (k === 26) st.events.push('lock');
    if (k === 24) { st.msg = 'ROUND 2'; st.tip = 'PUNCH: TAP ON THE RING.   KICK: HOLD TO DUCK.'; st.tips = ['PUNCH: TAP ON THE RING.   KICK: HOLD TO DUCK.']; st.msgT = 170; }      // said while the camera is still wide, so it never sits on their heads
    if (k > 56) { const u = Math.min(60, k - 56); h.x = HX + (CH - HX) * u / 60; st.ax = AX + (CA - AX) * u / 60; }
    st.z = Math.max(0, Math.min(10, (k - 96) / 2));
    if (k >= 116) { st.ph = 2; st.z = 10; h.x = CH; st.ax = CA; st.hs = 'up'; st.d = 0; ready(st, 44); }
  };
  const combo = (st) => {
    const L = st.lap >= 1, n = st.ci++;
    const first = L ? [[['P', 'P']], [['K', 'P'], ['P', 'K']], [['P', 'K', 'P', 'P'], ['K', 'P', 'K', 'P']]] : [[['P']], [['P', 'P']], [['K'], ['K', 'P']], [['P', 'K', 'P'], ['K', 'P', 'P']]];
    const pool = L ? [['P', 'P', 'K'], ['K', 'P', 'P'], ['P', 'K', 'P'], ['K', 'P', 'K']] : [['K', 'P'], ['P', 'P'], ['P', 'K', 'P'], ['P']];
    const set = n < first.length ? first[n] : pool;                       // the first ones teach, in an order the seed picks
    return set[Math.floor(st.rnd() * set.length) % set.length].slice();
  };
  // the wait before his next move. before a punch it is long enough that nobody tapping on a clock can be quiet through it and then land the counter
  const ready = (st, extra = 0) => { if (!st.q.length) { st.q = combo(st); extra += 14; } const W = Math.max(st.cf.wm, st.cf.w0 - 2 * st.cn); st.as = 'ready'; st.ak = (st.q[0] === 'P' ? Math.max(18, 44 - W) : 18) + extra; };
  const inWin = (st) => st.as === 'wind' && !st.blown && st.ak >= st.W - 6 && st.ak <= st.W + 6;
  const ouch = (st, n = 50) => { st.hs = 'ouch'; st.hk = 0; st.d = 0; st.pb = 0; st.h.inv = 50; st.as = 'taunt'; st.ak = n; st.fx.push({ t: 'hit', x: st.h.x + 3, y: FL - 24 - st.hy, k: st.k }); };
  const counter = (st) => { st.hp2--; st.cn++; st.stop = 6; st.shake = Math.max(st.shake, 4); st.bonus += 50; st.events.push('bosshit'); st.hs = 'counter'; st.hk = 0; st.d = 0; st.as = 'bent'; st.ak = 0; st.fx.push({ t: 'pow', x: (CH + CA) / 2 + 1, y: FL - 26, k: st.k }); };
  const DAZE0 = 6;                                   // ticks after he starts reeling before a tap counts as the finish (so the last counter's tap can't double up)
  const finish = (st) => { st.as = 'struck'; st.ak = 0; st.hs = 'fin'; st.d = 0; st.jab = 0; st.stop = 8; st.shake = 8; st.bonus += 100; st.events.push('bosshit'); st.fx.push({ t: 'pow', x: st.ax - 6, y: FL - 26, k: st.k }); };
  const whiff = (st) => { st.hs = 'whiff'; st.hk = 0; st.d = 0; st.events.push('whoosh'); if (st.as === 'wind') st.blown = 1; else if (st.as === 'ready' && st.h.inv <= 0) { st.as = 'slip'; st.ak = 0; } };
  const phase2 = (st, press, down) => {
    const cf = st.cf, h = st.h, a = st.as;
    // the finish: both in the air, one tap, on the ring
    if (a === 'freeze') {
      st.ak++;
      if (press && st.ak >= cf.fz - cf.fw) { st.as = 'struck'; st.ak = 0; st.stop = 8; st.shake = 8; st.bonus += 100; st.events.push('bosshit'); st.fx.push({ t: 'pow', x: st.ax - 6, y: FL - 24 - st.ay, k: st.k }); }
      else if (press || st.ak > cf.fz) { st.as = 'fkick'; st.ak = 0; st.early = press ? 1 : 0; st.events.push('whoosh'); }
      return;
    }
    // you
    const s = st.hs;
    if (s === 'up') { if (press) { if (inWin(st)) counter(st); else if (st.as === 'stagger' && st.ak >= DAZE0) finish(st); else if (st.as === 'bent' || st.as === 'stagger') st.jab = 8; else if (st.as !== 'leap' && st.as !== 'struck' && st.as !== 'fkick') { st.hs = 'lean'; st.hk = 0; } } }
    else if (s === 'whiff') { if (++st.hk >= 18) st.hs = 'up'; }
    else if (s === 'counter') { if (++st.hk >= 14) st.hs = 'up'; }
    else if (s === 'ouch') { if (++st.hk >= 30) st.hs = 'up'; }
    else if (s !== 'fin' && lean(st, press, down, MAXB2)) { if (inWin(st)) counter(st); else whiff(st); }
    // him
    const b = st.as;
    if (b === 'ready') { if (--st.ak <= 0) { const m = st.q.shift(); st.ak = 0; st.events.push('warn'); if (m === 'P') { st.as = 'wind'; st.blown = 0; st.W = Math.max(cf.wm, cf.w0 - 2 * st.cn); } else { st.as = 'ktell'; st.kh = 0; } } }
    else if (b === 'wind') { st.ak++; if (st.ak === st.W) st.events.push('whoosh'); if (st.ak >= st.W + 7) { if (hurt(st, st.blown ? 'swung too early: wait for the ring' : 'punch: tap as the ring closes on his fist')) { ouch(st); st.q.unshift('P'); } else ready(st); } }
    else if (b === 'ktell') { if (++st.ak >= cf.kt) { st.as = 'kick'; st.ak = 0; st.events.push('whoosh'); } }
    else if (b === 'kick') {
      st.ak++;
      if (st.ak >= 2 && st.ak <= 10 && st.d < SAFE && !st.kh) { st.kh = 1; if (hurt(st, 'red kick: hold the button to duck')) ouch(st, 44); }
      else if (st.ak === 10 && !st.kh) { st.bonus += 25; st.events.push('good'); }
      if (st.as === 'kick' && st.ak >= 18) ready(st);
    }
    else if (b === 'bent') { if (++st.ak >= 34) { if (st.hp2 <= 0) { st.as = 'stagger'; st.ak = 0; } else ready(st); } }
    else if (b === 'slip') { st.ak++; if (st.ak === 14) { st.events.push('whoosh'); if (hurt(st, 'swung at nothing: wait for his punch')) ouch(st); } if (st.as === 'slip' && st.ak >= 24) ready(st); }
    else if (b === 'taunt') { if (--st.ak <= 0) ready(st); if (h.x < CH) h.x = Math.min(CH, h.x + 1); if (h.x > CH) h.x = Math.max(CH, h.x - 1); if (st.ax > CA) st.ax = Math.max(CA, st.ax - 1); if (st.ax < CA) st.ax = Math.min(CA, st.ax + 1); }
    else if (b === 'stagger') { if (++st.ak >= cf.daze) { st.hp2 = 1; st.events.push('warn'); ready(st, 20); } }   // dazed: FINISH HIM, one tap. Wait too long and he shakes it off (one more counter)
    else if (b === 'leap') { st.ak++; st.hy = st.ay = Math.round(26 * (1 - (12 - st.ak) * (12 - st.ak) / 144)); h.x = CH - st.ak / 2; st.ax = CA + st.ak / 2; if (st.ak >= 12) { st.as = 'freeze'; st.ak = 0; st.events.push('warn'); } }
    else if (b === 'struck') {                        // your kick lands: he goes the length of the lobby into the pillar
      st.ak++; st.z = Math.max(0, 10 - st.ak / 2); st.ax = Math.min(283, st.ax + 5.5); st.ay = Math.min(8, st.ay + 1);
      if (st.ak <= 8) h.x += 1.5; st.hy = Math.max(0, st.hy - 2.5);
      if (st.ax >= 283 && st.z <= 0) { st.as = 'derez'; st.ak = 0; st.ay = 6; st.shake = 12; st.events.push('smash'); for (let i = 0; i < 5; i++) chipAt(st, 1, FL - 46 + i * 9); win(st, 'DELETED  +500', PORTX); }
    }
    else if (b === 'fkick') {                         // too soon or too late: his lands instead
      st.ak++; if (st.ak <= 6) { st.ax -= 2.5; }
      if (st.ak === 6) { h.inv = 0; st.hp2 = Math.min(6, st.hp2 + 1); st.q = ['P']; if (hurt(st, st.early ? 'the finish: too soon, wait for the ring' : 'the finish: too late, tap on the ring')) { st.hs = 'ouch'; st.hk = 0; h.inv = 50; st.fx.push({ t: 'hit', x: h.x + 3, y: FL - 24 - st.hy, k: st.k }); } }
      if (st.ak > 6) { st.hy = Math.max(0, st.hy - 3); st.ay = Math.max(0, st.ay - 3); h.x = Math.max(CH - 12, h.x - 1); }
      if (st.ak >= 26) { st.as = 'taunt'; st.ak = 40; if (st.hs === 'fin') st.hs = 'up'; }
    }
  };

  // ---------- which sprite for which moment ----------
  const swayKey = (u) => tw('aAim', 'aSway', Math.ceil((u > 12 ? 18 - u : u > 6 ? 6 : u) / 2), 3);
  const hitKey = (k) => (k <= 12 ? 'aHit' : k <= 20 ? tw('aHit', 'aGuard', Math.ceil((k - 12) / 2), 4) : 'aGuard');   // your counter lands: he takes it
  const knock = (k) => (k <= 1 ? 2 : k < 5 ? 2 + (k - 1) * 2.5 : k < 14 ? 11 : Math.max(0, 11 - (k - 14) * 0.6));   // into the fist on impact, then thrown back                      // ...and is knocked back a step (drawing only)
  const bentKey = (k, stop) => (stop && k <= 1 ? 'aPunch' : k <= 0 ? 'aGuard' : k <= 8 ? tw('aGuard', 'aBent', Math.ceil(k / 2), 4) : k <= 24 ? 'aBent' : tw('aGuard', 'aBent', 4 - Math.ceil((k - 24) / 2.5), 4));
  const slipKey = (k) => (k < 7 ? tw('aGuard', 'aSlip', Math.ceil(k / 2), 3) : k < 12 ? 'aSlip' : 'aJab');
  const spraying = (st) => { if (st.as !== 'volley') return -1; for (const [t, ty] of st.ev) if (ty === 'T' && st.vk >= t && st.vk <= t + st.cf.TL + 24) return st.vk - t; return -1; };
  const aKey = (st) => {
    const a = st.as, k = st.ak;
    if (st.ph === 1) { const q = spraying(st); return a === 'flinch' ? (k > 8 ? 'aFlinch' : 'aAim') : a === 'open' ? 'aReload' : q >= 0 ? (q >= st.cf.TL && (q >> 1) & 1 ? 'aTwoF' : 'aTwo') : st.afire > 0 ? 'aFire' : st.sway > 0 ? swayKey(st.sway) : 'aAim'; }
    if (st.ph === 'x') return k < 26 ? 'aDisarm' : 'aTie';
    const W = st.W;
    return a === 'wind' ? (k < 6 ? tw('aGuard', 'aWind', Math.ceil(k / 2), 3) : k < W ? 'aWind' : tw('aWind', 'aPunch', Math.ceil((k - W + 1) / 2), 3))
      : a === 'ktell' ? (k < 6 ? tw('aGuard', 'aCoil', Math.ceil(k / 2), 3) : 'aCoil') : a === 'kick' ? (k < 2 ? tw('aCoil', 'aKick', 1, 2) : k <= 11 ? 'aKick' : k <= 14 ? tw('aCoil', 'aKick', 1, 2) : 'aCoil')
      : a === 'bent' ? hitKey(k) : a === 'slip' ? slipKey(k) : a === 'taunt' ? (k > 8 ? 'aTie' : 'aGuard') : a === 'stagger' ? 'aStagger'
      : a === 'leap' ? (k < 5 ? 'aCoil' : 'aFly') : a === 'freeze' ? 'aFly' : a === 'fkick' ? (k < 14 ? 'aFly' : 'aGuard') : a === 'struck' ? 'aFold' : a === 'derez' ? 'aSplat' : (st.k >> 4) & 1 ? 'aGuard2' : 'aGuard';
  };
  const hKey = (st) => {
    if (st.ph === 1) return st.reel > 0 ? 'ouchG' : st.d > 0 && !(st.fire > 0 && st.d < 6) ? tw('aimLow', 'bendG', Math.ceil(st.d / 2), 6) : st.fire > 0 ? (st.flow ? 'fireLow' : 'fire') : st.rl > 0 ? 'reload' : st.as === 'open' || st.as === 'flinch' ? 'aim' : 'aimLow';
    if (st.ph === 'x') return st.ak < 26 ? 'aim' : 'holster';
    const s = st.hs, a = st.as;
    return s === 'ouch' ? 'ouch' : a === 'leap' ? (st.ak < 5 ? 'crouch' : 'fly') : a === 'freeze' || (a === 'fkick' && st.ak < 6) ? 'fly' : a === 'struck' ? (st.ak < 12 ? 'punch' : 'guard')
      : st.d > 0 ? tw('guard', 'bend', Math.ceil(st.d / 2), 6) : s === 'whiff' ? (st.hk < 3 ? 'punch' : st.hk < 14 ? 'whiff' : 'guard') : s === 'counter' ? (st.hk < 12 ? 'punch' : 'guard')
      : st.jab > 0 ? 'punch' : (st.k >> 4) & 1 ? 'guard2' : 'guard';
  };
  const sweep = (st) => (st.ph === 2 && st.as === 'freeze' ? Math.round(640 * (1 - (1 - st.ak / st.cf.fz) ** 2)) % 320 : 0);

  // one gold round, with the air it has torn behind it
  const COL = [['#ffd23a', '#fff6b0', '#5a4200'], ['#ff4a3a', '#ffd0c4', '#5a0a00']];
  const round = (ctx, r, hot, f) => {
    const X = Math.round(r.x), c = COL[r.kind];
    if (r.kind === 0) {
      const Y = Math.round(gy(r.x));
      for (let j = 5; j >= 1; j--) { const rx = X + 4 + j * 9; if (rx > MZX) continue; ctx.globalAlpha = 0.75 - j * 0.12; ring(ctx, rx + 1, Math.round(gy(rx)), 1 + j * 0.4, 2 + j * 1.3, '#16211c'); ring(ctx, rx, Math.round(gy(rx)), 1 + j * 0.4, 2 + j * 1.3, j < 3 ? c[1] : c[0]); }
      ctx.globalAlpha = 0.5; ctx.fillStyle = c[0]; ctx.fillRect(X + 5, Y, Math.min(34, MZX - X), 1); ctx.globalAlpha = 1;
      ctx.fillStyle = hot ? '#fff' : c[2]; ctx.fillRect(X - 6, Y - 3, 12, 7); ctx.fillStyle = hot && (f >> 1) % 2 ? '#fff6b0' : c[0]; ctx.fillRect(X - 5, Y - 2, 10, 5); ctx.fillStyle = '#000'; ctx.fillRect(X - 4, Y - 1, 8, 3);
      ctx.fillStyle = hot ? '#fff' : '#e8d090'; ctx.fillRect(X - 4, Y - 1, 7, 3); ctx.fillStyle = '#fff'; ctx.fillRect(X - 4, Y - 1, 2, 2); ctx.fillStyle = '#8a6a2a'; ctx.fillRect(X + 2, Y - 1, 2, 3);
      if (hot) { ctx.fillStyle = '#fff'; for (const [a, b] of [[-9, -6], [7, -6], [-9, 5], [7, 5]]) { ctx.fillRect(X + a, Y + b, 3, 1); ctx.fillRect(X + (a < 0 ? a : a + 2), Y + (b < 0 ? b : b - 2), 1, 3); } }
    } else {
      const Y = SPY + (r.i % 3) * 2 - 2;
      for (let j = 4; j >= 1; j--) { const rx = X + 6 + j * 13; if (rx > MZX) continue; ctx.globalAlpha = 0.8 - j * 0.15; ring(ctx, rx, Y, 1 + j * 0.4, 2 + j * 1.2, j < 2 ? c[1] : c[0]); }
      ctx.globalAlpha = 0.55; ctx.fillStyle = c[0]; ctx.fillRect(X + 6, Y, Math.min(46, Math.max(0, MZX - X - 6)), 1); ctx.globalAlpha = 1;
      ctx.fillStyle = '#000'; ctx.fillRect(X - 5, Y - 2, 12, 5); ctx.fillStyle = c[0]; ctx.fillRect(X - 4, Y - 1, 10, 3); ctx.fillStyle = '#fff'; ctx.fillRect(X - 4, Y, 6, 1);
    }
  };
  const drawFx = (ctx, st, f) => {
    for (const e of st.fx) {
      const a = st.k - e.k, X = SX(st, e.x), Y = SY(st, e.y);
      if (e.t === 'tr') { if (a < 4) { line(ctx, e.x, e.y, e.x2, e.y2, a < 2 ? '#fff' : '#ffd23a'); ctx.fillStyle = '#fff'; ctx.fillRect(e.x - 1, e.y - 2, 5 - a, 5); ctx.fillStyle = '#ffd23a'; ctx.fillRect(e.x + 3, e.y - 1, 6 - a, 3); } }
      else if (e.t === 'ric') {
        if (a < 16) { const r = 2 + a * 1.1; ctx.globalAlpha = Math.max(0, 1 - a / 16); ring(ctx, X, Y, r * 0.6, r, '#fff'); ring(ctx, X, Y, r * 0.6 + 1, r + 1, '#ffd23a'); ctx.globalAlpha = 1; }
        if (a < 7) { ctx.fillStyle = a < 3 ? '#fff' : '#ffd23a'; const l = 3 + a * 2; ctx.fillRect(X - l, Y, l * 2 + 1, 1); ctx.fillRect(X, Y - l, 1, l * 2 + 1); for (const [p, q] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) ctx.fillRect(X + p * (2 + a), Y + q * (2 + a), 2, 2); if (a < 3) ctx.fillRect(X - 3, Y - 3, 7, 7); }
        if (a < 34) { const bx = Math.round(e.x + 6 + a * 1.3), by = Math.round(e.y - a * 3.2 + a * a * 0.11); if (by < FL) { ctx.fillStyle = '#000'; ctx.fillRect(bx - 2, by - 2, 5, 5); ctx.fillStyle = (a >> 1) % 2 ? '#e8d090' : '#8a6a2a'; ctx.fillRect(bx - 1, by - 1, 3, 3); } }
      }
      else if (e.t === 'dust') { if (a < 34) for (let i = 0; i < 9; i++) { const vx = (0.3 + hash(e.s, i) * 1.5) * e.dir, vy = -1.8 + hash(e.s + 9, i) * 2.4, px = Math.round(e.x + vx * a), py = Math.min(FL - 1, Math.round(e.y + vy * a + 0.07 * a * a)); ctx.fillStyle = i < 6 ? (i % 2 ? '#e2f2e5' : '#93ac9b') : '#3ae03a'; const w = a < 18 ? 2 : 1; ctx.fillRect(SX(st, px), SY(st, py), w, w); } }
      else if (e.t === 'pow') { if (a < 12) { const r = (3 + a * 1.6) * zz(st) / 2 + 2; ctx.globalAlpha = Math.max(0, 1 - a / 12); ring(ctx, X, Y, r, r, '#fff'); ring(ctx, X, Y, r + 1, r + 1, '#8aff9a'); ctx.globalAlpha = 1; if (a < 5) { ctx.fillStyle = '#fff'; const l = 6 + a * 3; ctx.fillRect(X - l, Y - 1, l * 2, 2); ctx.fillRect(X - 1, Y - l, 2, l * 2); for (const [p, q] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) for (let s = 2; s < l * 0.7; s += 2) ctx.fillRect(X + p * s, Y + q * s, 2, 2); } } }
      else if (e.t === 'hit') { if (a < 8) { ctx.fillStyle = a < 3 ? '#fff' : '#ff4a3a'; const l = 4 + a * 2; ctx.fillRect(X - l, Y, l * 2 + 1, 1); ctx.fillRect(X, Y - l, 1, l * 2 + 1); for (const [p, q] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) ctx.fillRect(X + p * (2 + a), Y + q * (2 + a), 2, 2); } }
      else if (e.t === 'gun') { if (a < 60) { const u = Math.min(a, 34), gx = Math.round(e.x + u * 0.9), gyy = Math.min(FL - 3, Math.round(e.y - u * 3.4 + u * u * 0.125)), sp = a < 34 ? (a >> 2) % 2 : 0; ctx.fillStyle = '#000'; if (sp) { ctx.fillRect(gx - 2, gyy - 5, 5, 11); ctx.fillStyle = '#4a505c'; ctx.fillRect(gx - 1, gyy - 4, 3, 9); } else { ctx.fillRect(gx - 5, gyy - 2, 11, 5); ctx.fillStyle = '#4a505c'; ctx.fillRect(gx - 4, gyy - 1, 9, 3); ctx.fillStyle = '#8a90a0'; ctx.fillRect(gx - 4, gyy - 1, 9, 1); } } }
    }
  };

  return {
    name: 'THE AGENT', tip: 'TAP: SHOOT   HOLD: DUCK', tips: ['GOLD BULLETS: TAP WHEN INSIDE THE BRACKETS', 'MACHINE GUN: HOLD TO DUCK', 'HE RELOADS: TAP TO SHOOT HIM. 3 HITS'], hero: 'still', heroX: HX,
    init(st) {
      const L = st.lap >= 1;
      st.cf = L ? { sv: 2.2, TL: 24, open: 30, w0: 22, wm: 13, kt: 22, fz: 50, fw: 10, daze: 180 } : { sv: 1.7, TL: 30, open: 40, w0: 26, wm: 16, kt: 30, fz: 56, fw: 12, daze: 240 };
      st.cf.F = Math.ceil((MZX - HITX) / st.cf.sv);
      st.ph = 1; st.k = 0; st.stop = 0; st.was = false; st.buf = 0; st.pb = 0;
      st.mag = 6; st.rl = 0; st.d = 0; st.hs = 'up'; st.hk = 0; st.shot = 0; st.fire = 0; st.flow = 0; st.reel = 0; st.jab = 0; st.hy = 0;
      st.ahp = 3; st.hp2 = 6; st.cn = 0; st.ci = 0; st.q = []; st.W = 0; st.blown = 0; st.kh = 0; st.early = 0;
      st.as = 'wait'; st.ak = 24; st.vol = 0; st.ev = []; st.vk = 0; st.vend = 0; st.afire = 0; st.sway = 0; st.dodged = 0; st.ax = AX; st.ay = 0;
      st.bul = []; st.fx = []; st.chips = []; st.z = 0; st.dz = 0;
    },
    update(st, inp) {
      const down = !!inp.down; let press = !!inp.pressed;
      if (st.won) { if (st.as === 'derez') { st.ak++; st.dz = Math.min(1, st.ak / 70); } st.k++; st.hy = 0; return; }
      if (st.stop > 0) { st.stop--; if (press) st.buf = 1; st.was = down; return; }         // bullet time: the world holds its breath (a tap in it is kept)
      if (st.buf) { press = true; st.buf = 0; }
      st.k++;
      if (st.fire > 0) st.fire--; if (st.afire > 0) st.afire--; if (st.sway > 0) st.sway--; if (st.reel > 0) st.reel--; if (st.jab > 0) st.jab--;
      while (st.fx.length && st.k - st.fx[0].k > 64) st.fx.shift();
      if (st.ph === 1) phase1(st, press, down); else if (st.ph === 'x') between(st); else phase2(st, press, down);
      st.was = down;
    },
    stage(ctx, st, f) {
      if (qi < QUEUE.length) { const q = QUEUE[qi++]; spr(q[0], q[1], q[2]); }                // one sprite a frame, ahead of when it is wanted
      const base = chipsCv(st);
      const live = (x) => {
        if (hash(f >> 1, 3) < 0.04) { x.globalAlpha = 0.5; x.fillStyle = '#93ac9b'; x.fillRect(142, 19, 36, 3); x.globalAlpha = 1; }        // a tube flickers
        const a = -Math.floor(f / 30) * TAU / 12 - TAU / 4; x.fillStyle = '#16211c'; x.fillRect(160, 44, 1, 4); x.fillRect(160, 47, 4, 1); x.fillStyle = '#c03a2a'; for (let q = 1; q <= 4; q++) x.fillRect(Math.round(160 + Math.cos(a) * q), Math.round(47 + Math.sin(a) * q), 1, 1);
        const pos = Math.floor(f / 40) % 5; x.fillStyle = '#16211c'; x.fillRect(139, 71, 14, 5); for (let i = 0; i < 5; i++) { x.fillStyle = i === pos ? '#8aff9a' : '#33483d'; x.fillRect(140 + i * 3, 73, 2, 1); }
      };
      if (st.z <= 0) { ctx.drawImage(base, 0, 0); live(ctx); return; }
      const s = scr.getContext('2d'); s.drawImage(base, 0, 0); live(s);
      const z = zz(st), o = sweep(st), fr = st.as === 'freeze';
      ctx.fillStyle = '#0a120e'; ctx.fillRect(0, 0, BW, 180);
      for (const sh of o ? [0, 320] : [0]) ctx.drawImage(scr, Math.round(160 - 160 * z + (sh - o) * z), Math.round(160 - 160 * z), Math.round(320 * z), Math.round(180 * z));
      if (fr) {                                       // everything stops but the camera, which goes round them
        ctx.fillStyle = 'rgba(2,14,8,0.5)'; ctx.fillRect(0, 0, BW, 180);
        for (let i = 0; i < 16; i++) { const y = Math.round(6 + hash(i, 7) * 168), sp = (6 + hash(i, 3) * 12) * (1 - st.ak / st.cf.fz * 0.8), x0 = ((hash(i, 9) * 400 - st.ak * sp) % 380 + 380) % 380 - 40; ctx.fillStyle = i % 3 ? 'rgba(138,255,154,0.35)' : 'rgba(240,255,244,0.5)'; ctx.fillRect(Math.round(x0), y, Math.round(18 + hash(i, 5) * 40), 1); }
      }
    },
    draw(ctx, st, f) {
      const a = st.as, k = st.ak;
      if (st.ph === 1) {
        // your reach: a round can be shot once it is inside the brackets
        const hot = st.bul.some((r) => r.kind === 0 && r.x > ZX0 && r.x <= ZX1), y0 = FL - 24, y1 = FL - 4;
        ctx.fillStyle = hot ? 'rgba(255,240,150,0.22)' : 'rgba(240,255,244,0.09)'; ctx.fillRect(ZX0 + 2, y0, ZX1 - ZX0 - 2, y1 - y0);
        ctx.fillStyle = '#16211c'; for (const [bx, d] of [[ZX1, -1], [ZX0 + 2, 1]]) { ctx.fillRect(bx, y0 - 1, 2, y1 - y0 + 2); ctx.fillRect(bx + (d < 0 ? -3 : 0), y0 - 1, 5, 2); ctx.fillRect(bx + (d < 0 ? -3 : 0), y1 - 1, 5, 2); }
        ctx.fillStyle = hot ? '#ffd23a' : '#e8ffe8'; for (const [bx, d] of [[ZX1, -1], [ZX0 + 2, 1]]) { ctx.fillRect(bx, y0, 1, y1 - y0); ctx.fillRect(bx + (d < 0 ? -3 : 0), y0, 4, 1); ctx.fillRect(bx + (d < 0 ? -3 : 0), y1 - 1, 4, 1); }
        // the red line: where the spray will go
        const q = spraying(st);
        if (q >= 0 && q < st.cf.TL + 22) {
          const on = q < st.cf.TL - 10 ? (f >> 2) % 2 === 0 : true, len = Math.min(MZX, q * 14);
          for (let X = MZX - 8 - (f % 8); X > MZX - len; X -= 8) { ctx.fillStyle = '#000'; ctx.fillRect(X - 1, SPY - 1, 6, 3); ctx.fillStyle = on ? '#ff4a3a' : '#5a0a00'; ctx.fillRect(X, SPY, 4, 1); }
          if (len >= MZX - HX - 14) { ctx.fillStyle = '#000'; ctx.fillRect(HX - 11, SPY - 3, 23, 7); ctx.fillStyle = on ? '#ff4a3a' : '#5a0a00'; ctx.fillRect(HX - 10, SPY - 2, 21, 5); ctx.fillStyle = '#000'; ctx.fillRect(HX - 9, SPY - 1, 19, 3); }
        }
      }
      if (st.ph === 2 && (a === 'ktell' || (a === 'kick' && k < 3))) {                          // the red arc: where his leg will go
        const u = a === 'kick' ? 1 : Math.min(1, k / (st.cf.kt * 0.6)), cx = SX(st, st.ax) - 6, cy = SY(st, FL) - 30, on = a === 'kick' || k > st.cf.kt - 10 || (f >> 2) % 2 === 0;
        for (let i = 0; i <= 26 * u; i++) { const an = i / 26 * 2.2, X = Math.round(cx - Math.sin(an) * 34), Y = Math.round(cy + Math.cos(an) * 34); ctx.fillStyle = '#000'; ctx.fillRect(X - 1, Y - 1, 4, 4); ctx.fillStyle = on ? '#ff4a3a' : '#5a0a00'; ctx.fillRect(X, Y, 2, 2); }
        if (u >= 1) { const hx = SX(st, st.h.x), Y = cy - 20; ctx.fillStyle = '#000'; ctx.fillRect(hx - 14, Y - 2, 40, 5); ctx.fillStyle = on ? '#ff4a3a' : '#5a0a00'; for (let X = hx - 13; X < hx + 25; X += 6) ctx.fillRect(X, Y - 1, 4, 3); }
      }
      // the agent, and where he has just been
      const ax = st.ax + (st.ph === 2 && a === 'bent' ? knock(k) : 0), ay = FL - st.ay;
      if (a === 'derez') {
        if (st.dz < 1) { const s = spr('a', 'aSplat', 1), g = green(s).c, L = Math.round(ax) - s.ox, T0 = ay - s.oy, H0 = g.height;
          if (st.dz <= 0.02 && k < 3) { ctx.fillStyle = '#fff'; ctx.fillRect(L - 2, T0 - 2, g.width + 4, H0 + 4); }
          for (let i = 0; i < g.width; i += 3) { const q = Math.max(0, Math.min(1, (st.dz - hash(i, 5) * 0.5) / 0.5)), off = Math.round(q * q * (H0 + 8)), vis = Math.min(H0, FL + 2 - T0 - off);
            if (vis > 0) ctx.drawImage(q > 0 ? g : s.c, i, 0, 3, vis, L + i + (q > 0 && hash(i, f >> 1) < 0.25 ? 1 : 0), T0 + off, 3, vis);
            if (q > 0 && i > 5 && i < g.width - 6) for (let n = 0; n * 6 < off + 4; n++) { const yy = T0 + off - 6 - n * 6; if (yy < T0 - 2 || hash(i + n, 3) < st.dz * st.dz) continue; gl(ctx, L + i, yy, hash(i + n, f >> 2) * 14, n === 0 ? 0 : Math.min(5, n + 1)); } }
        }
      } else if (st.ph === 'x' && k > 56) blit(ctx, st, agentWalk[(k >> 2) % 8], 1, ax, ay);
      else {
        const key = aKey(st);
        if (st.ph === 1 && st.sway > 0) for (let n = 3; n >= 1; n--) { const u = st.sway + n * 3; if (u <= 18) { const g = swayKey(u); if (g !== key) fig(ctx, st, 'a', g, ax, ay, 0.5 - n * 0.1, true); } }
        if (st.ph === 2 && a === 'bent' && k < 30) {                                        // the hit knocks code out of him: green glyphs burst from where the fist landed
          const cx = (CH + CA) / 2 + 3, cy = FL - 32;
          const t = k + (st.stop > 0 ? 6 - st.stop : 0) + 1;
          for (let i = 0; i < 22; i++) { const vx = 0.6 + hash(i, 11) * 2.8, vy = -2.0 + hash(i, 13) * 2.6, x = cx + vx * t, y = cy + vy * t + 0.08 * t * t; if (y > FL + 4) continue;
            gl(ctx, SX(st, x), SY(st, y), Math.floor(hash(i, (f >> 2) + 7) * 14), Math.min(5, Math.floor(t / 9))); }
          if (t < 8) { ctx.fillStyle = '#d8ffd8'; for (let i = 0; i < 6; i++) { const an = i * 1.05 + 0.3, r = 3 + t * 1.6; ctx.fillRect(SX(st, cx + Math.cos(an) * r), SY(st, cy + Math.sin(an) * r), 2, 2); } }
        }
        if (st.ph === 2 && a === 'slip' && k < 14) for (let n = 3; n >= 1; n--) { const u = k - n * 3; if (u >= 0) { const g = slipKey(u); if (g !== key) fig(ctx, st, 'a', g, ax, ay, 0.5 - n * 0.1, true); } }
        if (st.ph === 2 && (a === 'freeze' || a === 'struck')) for (let n = 3; n >= 1; n--) fig(ctx, st, 'a', key, ax + n * (a === 'struck' ? -7 : 3), ay - (a === 'struck' ? 0 : n), 0.4 - n * 0.1, true);
        const s = fig(ctx, st, 'a', key, ax, ay), X = SX(st, ax), Y = SY(st, ay);
        if (st.ph === 1) {
          const m = s.pts.muzzle;
          if (st.afire > 3 || (spraying(st) >= st.cf.TL && (f >> 1) % 2)) { const c = spraying(st) >= 0 ? COL[1] : COL[0], r = 5; ctx.fillStyle = c[0]; ctx.fillRect(X + m.x - r * 2, Y + m.y - 1, r * 2 + 2, 3); ctx.fillRect(X + m.x - r, Y + m.y - r, r, r * 2 + 1); ctx.fillStyle = '#fff'; ctx.fillRect(X + m.x - r, Y + m.y - 1, r + 2, 3); ctx.fillRect(X + m.x - 3, Y + m.y - 2, 2, 5); }
          if (a === 'open') { const u = st.cf.open - k, my = Math.min(FL - 2, FL - 20 + u * u * 0.09); ctx.fillStyle = '#000'; ctx.fillRect(AX - 11, Math.round(my) - 1, 4, 7); ctx.fillStyle = '#6a7280'; ctx.fillRect(AX - 10, Math.round(my), 2, 5); if (st.vol < 2 && st.lap < 1) say(ctx, 'SHOOT HIM!', AX - 6, FL - 58 - ((f >> 3) % 2), GRAD.gold); }
        }
        if (st.ph === 2 && a === 'wind' && !st.blown) {                                         // the ring closes on his fist: tap as it lands
          const p = s.pts.fistN, cx = X + p.x, cy = Y + p.y, left = st.W - k, inw = inWin(st), r = Math.max(4, 4 + left * 1.1);
          tring(ctx, cx, cy, r, 4, inw, f);
        }
        if (st.ph === 2 && a === 'stagger' && k >= DAZE0) { drawText(ctx, 'FINISH HIM!', 160, 27, { scale: 2, fill: (f >> 3) % 2 ? GRAD.gold : GRAD.red, outline: '#000', align: 'center' }); say(ctx, 'TAP TO PUNCH', 160, 44, GRAD.white); }
        if (st.ph === 2 && a === 'stagger') for (let i = 0; i < 3; i++) { const an = f / 6 + i * 2.1; say(ctx, '*', X - 6 + Math.round(Math.cos(an) * 12), Y - 78 + Math.round(Math.sin(an) * 3), GRAD.gold); }
        if (st.ph === 2 && a === 'freeze') {                                                    // the ring closes on him: tap as it lands
          const left = st.cf.fz - st.cf.fw / 2 - k, inw = k >= st.cf.fz - st.cf.fw, r = Math.max(7, 7 + left * 1.2), cx = X - 4, cy = Y - 34;
          tring(ctx, cx, cy, r, 7, inw, f);
          drawText(ctx, inw ? 'TAP NOW!' : 'FINISH HIM', 160, 126, { scale: 2, fill: inw ? GRAD.gold : GRAD.white, outline: '#000', align: 'center' }); if (!inw) say(ctx, 'TAP WHEN THE RING CLOSES ON HIM', 160, 144, GRAD.gold);
        }
      }
      if (st.ph === 2) {                                  // the fist fight, spelt out: what he is doing, what to press, and why you got hit
        const why = st.why || [];
        if (why.length !== st._wn) { if (st._wn !== undefined && why.length > st._wn) st._whyT = 110; st._wn = why.length; }
        if (st._whyT > 0) { st._whyT--; if (st._whyT > 20 || (f >> 2) % 2) { ctx.globalAlpha = 0.7; ctx.fillStyle = '#000'; ctx.fillRect(0, 24, BW, 30); ctx.globalAlpha = 1;
          drawText(ctx, 'OUCH!', 160, 27, { scale: 2, fill: GRAD.red, outline: '#000', align: 'center' }); say(ctx, String(why[why.length - 1] || '').toUpperCase(), 160, 44, GRAD.white); } }
        else if (a !== 'stagger' && (st.lap < 1 || st.cn < 2)) {
          const big = (t, fill) => drawText(ctx, t, 160, 27, { scale: 2, fill, outline: '#000', align: 'center' });
          if (a === 'wind' && !st.blown) { if (inWin(st)) big('TAP NOW!', GRAD.gold); else { big('PUNCH COMING', GRAD.white); say(ctx, 'TAP WHEN THE RING CLOSES ON HIS FIST', 160, 44, GRAD.gold); } }
          else if (a === 'ktell' || (a === 'kick' && st.ak <= 10 && !st.kh)) { if (st.d < SAFE) { big('KICK! DUCK!', GRAD.red); say(ctx, 'HOLD THE BUTTON DOWN TO DUCK', 160, 44, GRAD.white); } else big('KEEP HOLDING...', GRAD.white); }
          else if (a === 'kick' && !st.kh && st.ak < 18) big('DODGED!', GRAD.gold);
          else if (a === 'bent' && st.ak < 30) big('COUNTER! ' + Math.max(0, st.hp2) + ' TO GO', GRAD.gold);
          else if (a === 'ready' || a === 'taunt') say(ctx, "DON'T TAP YET: WAIT FOR HIS MOVE", 160, 30, '#b8c8bc');
        }
      }
      if (st.ph === 2 && a === 'fkick' && k < 26) say(ctx, st.early ? 'TOO SOON' : 'TOO LATE', 160, 30, GRAD.red);
    },
    heroDraw(ctx, st, f) {
      const h = st.h, x = h.x, y = FL - st.hy;
      if (h.inv > 0 && (h.inv >> 2) % 2 && !st.won) return;
      if (st.won) { if (st.as === 'struck' || st.z > 0) fig(ctx, st, 'h', hKey(st), x, y); else put(ctx, heroRun[2], Math.round(x), y); return; }
      if (st.ph === 'x' && st.ak > 56) { blit(ctx, st, heroRun[(st.ak >> 2) % 8], 1, x, y); return; }
      if (st.ph === 2 && st.as === 'struck' && st.ak >= 16) { blit(ctx, st, heroRun[2], 1, x, y); return; }
      const key = hKey(st);
      if (st.d > 0 && st.d < 12 && st.reel <= 0 && st.hs !== 'ouch') { const dn = st.hs === 'rise' ? 1 : -1; for (let n = 2; n >= 1; n--) { const d = st.d + dn * n * 2; if (d >= 0 && d <= 12) fig(ctx, st, 'h', st.ph === 1 ? tw('aimLow', 'bendG', Math.ceil(d / 2), 6) : tw('guard', 'bend', Math.ceil(d / 2), 6), x, y, 0.45 - n * 0.12, true); } }
      if (st.ph === 2 && (st.as === 'freeze' || (st.as === 'struck' && st.ak < 9))) for (let n = 3; n >= 1; n--) fig(ctx, st, 'h', key, x - n * (st.as === 'struck' ? 6 : 3), y - (st.as === 'struck' ? 0 : n), 0.4 - n * 0.1, true);
      fig(ctx, st, 'h', key, x, y);
    },
    front(ctx, st, f) {
      if (st.ph === 1) {
        for (const r of st.bul) round(ctx, r, r.kind === 0 && r.x > ZX0 && r.x <= ZX1, f);
        // the rounds in your pistol
        if (!st.won) { const X = HX - 9, Y = FL - 56; ctx.fillStyle = '#000'; ctx.fillRect(X - 1, Y - 1, 20, 7);
          for (let i = 0; i < 6; i++) { ctx.fillStyle = i < st.mag ? '#ffd23a' : '#2a2a2a'; ctx.fillRect(X + i * 3, Y, 2, 5); if (i < st.mag) { ctx.fillStyle = '#fff6b0'; ctx.fillRect(X + i * 3, Y, 2, 1); } }
          if (st.rl > 0) { ctx.fillStyle = '#ff4a3a'; ctx.fillRect(X, Y + 4, Math.round(18 * (1 - st.rl / RELOAD)), 1); if ((f >> 3) % 2) say(ctx, 'RELOAD', HX, Y - 10, GRAD.red); } }
        if (st.lap < 1 && st.vol < 3) {
          const q = spraying(st);
          if (q >= 0 && q < st.cf.TL + 20 && st.d < SAFE) say(ctx, 'HOLD!', HX + 2, FL - 76, GRAD.red);
          else if (st.vol < 1 && st.bul.some((r) => r.kind === 0 && r.x > ZX0 && r.x <= ZX1)) say(ctx, 'TAP!', HX + 28, FL - 40, GRAD.gold);
        }
      }
      drawFx(ctx, st, f);
      if (!st.won) pips(ctx, 'THE AGENT', st.ahp + st.hp2, 9, st.ph === 2 ? '#8aff9a' : '#3ae03a');
    },
  };
}
