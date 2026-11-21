// THE CODE: the level's own dangers, ride and power-ups (see ../danger.js for the contract).
// In this level green is the world and RED is whatever the system is using to kill you: firewalls, laser sights, corrupt packets, the bug's eye.
//
//   gunner  lobby guard: helmet, visor, body armour. stands easy, drops to a crouch to aim (visor goes red), fires along the floor; each bullet leaves ripples hanging in the air
//   seeker  tracer bug: a chrome prawn of a machine with a red eye and trailing cables. it finds your height, the eye flares, it comes straight
//   rain    packets: runs of code dropping out of a tear in the ceiling. the red one is addressed to you
//   vent    firewall: a slot in the floor that throws up a wall of red code
//   backer  phantom: a white-suited programme with pale dreadlocks who phases along ahead of you
//   ride    a ringing phone booth. answer it and for seven seconds you are THE ONE: you fly, wrapped in code, and everything you touch bursts
import { cv, hash, tint } from '../kit.js';
import { MATS, cap, ell, poly, heroShapes, bikerShapes } from '../../../rig.js';
import { recolor, R, flip, frames, P, add, dir } from '../../chars.js';

Object.assign(MATS, {
  codeArmor: ['#b8cad6', '#62768a', '#3a4856', '#141c22'],
  codeArmorFar: ['#70808e', '#44525e', '#28323c', '#0e1418'],
  codeHelm: ['#f0f6fa', '#a4b4c2', '#5a6a78', '#1c242c'],
  codeGun: ['#eef2f6', '#98a2ae', '#4e5662', '#16181e'],
  codeWhite: ['#ffffff', '#e9f7ea', '#a6caaf', '#587a64'],
  codeWhiteFar: ['#d6eeda', '#b2d2ba', '#86aa92', '#486a54'],
  codeDread: ['#f0fff2', '#b4d4bc', '#789e84', '#3a5a44'],
  codeTank: ['#c8ffd0', '#3ad04e', '#168c2a', '#064a14'],
});

const O = '#000';
const B = (x, col, x0, y0, w, h) => { x.fillStyle = col; x.fillRect(x0, y0, w, h); };
const copy = (f, pad = 0) => { const c = cv(f.c.width + pad * 2, f.c.height + pad * 2), x = c.getContext('2d'); x.drawImage(f.c, pad, pad); return { c, ox: f.ox + pad, oy: f.oy + pad, x }; };
// a hard black outline round a sprite
function outline(f, col = O) {
  const o = copy(f, 1), t = tint(f, col, 1).c; o.x.clearRect(0, 0, o.c.width, o.c.height);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) o.x.drawImage(t, 1 + dx, 1 + dy);
  o.x.drawImage(f.c, 1, 1); return { c: o.c, ox: o.ox, oy: o.oy };
}

// ---------- the lobby guard (gunner). faces right here, flipped when rendered ----------
function guardShapes(pose) {
  const up = pose === 'idle', rc = pose === 'fire' ? -1 : 0;
  const H = P(up ? -2 : -3, up ? -15 : -12), lean = up ? 0.1 : 0.34;
  const Sh = add(H, P(10 * Math.sin(lean), -10 * Math.cos(lean))), C = add(Sh, P(2.2, -6.2));
  const leg = (th, kn) => { const K = add(H, dir(7.2, th)); return [K, add(K, dir(7.4, th - kn))]; };
  const [KN, FN] = up ? leg(0.22, 0.2) : leg(0.98, 0.98), [KF, FF] = up ? leg(-0.2, 0.1) : leg(-0.5, 0.32);
  // the gun: grip point G, angle a (0 = level)
  const G = up ? add(Sh, P(3.2, 10.6)) : P(Sh.x + 1.6 + rc, -10.3), a = up ? 0.75 : 0, u = P(Math.cos(a), Math.sin(a)), n = P(-Math.sin(a), Math.cos(a));
  const at = (i, j) => P(G.x + u.x * i + n.x * j, G.y + u.y * i + n.y * j);
  const ShF = add(Sh, P(-1.4, 0.3)), EF = add(ShF, up ? P(2.6, 5) : P(3.4, 5.2)), E = add(Sh, up ? P(-1.2, 5.4) : P(-0.8, 5.6));
  const sh = [];
  sh.push(cap('codeArmorFar', ShF, EF, 1.9, 1, { g: 'armF' }), cap('codeArmorFar', EF, at(5.5, 0.4), 1.6, 1.1, { g: 'armF' }));
  sh.push(cap('codeArmorFar', H, KF, 2.3, 2, { g: 'legF' }), cap('codeArmorFar', KF, FF, 2.1, 2, { g: 'legF' }), cap('boot', add(FF, P(-1, 0)), add(FF, P(2.6, 0.4)), 1.7, 2.2));
  sh.push(cap('codeArmor', H, KN, 2.4, 3, { g: 'legN' }), cap('codeArmor', KN, FN, 2.2, 3, { g: 'legN' }), cap('boot', add(FN, P(-1, 0)), add(FN, P(2.8, 0.4)), 1.8, 3.2), ell('codeHelm', add(KN, P(0.6, 0)), 2, 2.1, 3.3));
  sh.push(poly('codeArmor', [add(Sh, P(-3.8, -0.6)), add(Sh, P(2.8, -0.6)), add(H, P(3.6, 0)), add(H, P(3.2, 3.2)), add(H, P(-4, 3.2)), add(H, P(-4.4, 0))], 5, { g: 'vest' }));
  sh.push(poly('codeHelm', [add(Sh, P(-1.4, 1.6)), add(Sh, P(2.7, 1.2)), add(H, P(3.5, -3)), add(H, P(-0.4, -2.8))], 5.5, { noSeam: true }));
  sh.push(cap('dark', add(H, P(-3.8, 0.4)), add(H, P(3.2, 0.4)), 0.9, 5.6));
  sh.push(ell('skinPale', add(C, P(0.4, 0.4)), 4.4, 4.8, 7, { g: 'head' }), poly('skinPale', [add(C, P(-1.5, 2.4)), add(C, P(4.6, 1.4)), add(C, P(4, 4.4)), add(C, P(0.8, 5.4))], 7.1, { g: 'head' }));
  sh.push(ell('codeHelm', add(C, P(-0.5, -2.4)), 5.7, 4.3, 8, { g: 'helm' }), poly('codeHelm', [add(C, P(-5.8, -2.6)), add(C, P(-1.6, -2.6)), add(C, P(-2.2, 3.4)), add(C, P(-5.4, 2.8))], 8.05, { g: 'helm' }));
  sh.push(poly('dark', [add(C, P(0, -2.4)), add(C, P(5.6, -2.6)), add(C, P(5.6, 0.4)), add(C, P(3.2, 1)), add(C, P(0, 0.2))], 9, { noSeam: true }));
  sh.push(cap('codeGun', at(-1, 0), at(-4.6, -0.9), 0.9, 9.5), cap('codeGun', at(3.2, 1), at(2.8, 4.2), 1, 10.4), cap('codeGun', at(-1, -0.2), at(6.6, -0.2), 1.5, 10.5), cap('codeGun', at(6.6, -0.5), at(9, -0.5), 0.8, 10.45));
  sh.push(cap('codeArmor', Sh, E, 2.2, 10, { g: 'sleeve' }), cap('codeArmor', E, at(0.2, 0.2), 2, 10.1, { g: 'sleeve' }), ell('skinPale', at(0.6, 0.6), 1.8, 1.7, 10.6), ell('codeHelm', add(Sh, P(-0.4, 0.4)), 2.8, 2.4, 10.7));
  const post = (ctx, px) => {
    const v = px(add(C, P(2.2, -1.4))); ctx.fillStyle = up ? '#8aff9a' : '#ff4a2a'; ctx.fillRect(v.x, v.y, 3, 1); ctx.fillStyle = up ? '#e8ffe8' : '#ffd0b0'; ctx.fillRect(v.x + 2, v.y, 1, 1);
    const b = px(add(Sh, P(1.2, 3))); ctx.fillStyle = '#e8ffe8'; ctx.fillRect(b.x, b.y, 2, 1);                                  // badge
    if (pose === 'fire') { const m = px(at(10.6, -0.5)); ctx.fillStyle = '#ffe14a'; ctx.fillRect(m.x - 1, m.y - 2, 4, 5); ctx.fillRect(m.x + 3, m.y - 1, 2, 3); ctx.fillStyle = '#ffffff'; ctx.fillRect(m.x - 1, m.y - 1, 3, 3); ctx.fillRect(m.x + 2, m.y, 3, 1); ctx.fillRect(m.x, m.y - 3, 1, 7); }
  };
  return { shapes: sh, post };
}

// ---------- an agent running with his pistol out (the one who shoots: 'puker') ----------
function pistolAgent(phase) {
  const g = recolor(heroShapes(phase), { coat: 'suit', coatFar: 'suitFar', trousers: 'suit', trousersFar: 'suitFar', tee: 'shirt' }, ['hair']);
  const head = g.shapes.find((s) => s.m === 'skin' && s.kind === 'ell' && s.z === 7), C = P(head.c.x - 0.4, head.c.y - 0.4);
  g.shapes.push(poly('slick', [add(C, P(-4.6, 1.8)), add(C, P(-5, -2.4)), add(C, P(-3, -4.9)), add(C, P(1, -5.5)), add(C, P(4.6, -4.2)), add(C, P(4.6, -2.6)), add(C, P(0.8, -3.1)), add(C, P(-2, -1.6)), add(C, P(-2.6, 1.8))], 8));
  const shirt = g.shapes.find((s) => s.m === 'shirt' && s.kind === 'poly');
  g.shapes = g.shapes.filter((s) => !(s.z >= 10 && s.z < 10.4));
  const Sh = shirt.pts[0], E = add(Sh, dir(5.4, 1.5)), hand = add(E, dir(4.8, 1.6));
  g.shapes.push(cap('suit', Sh, E, 2.1, 10, { g: 'sleeve' }), cap('suit', E, add(E, dir(3.4, 1.6)), 2, 10.1, { g: 'sleeve' }), cap('shirt', add(E, dir(3.4, 1.6)), add(E, dir(4, 1.6)), 1.7, 10.2), ell('skin', hand, 1.8, 1.7, 10.3));
  g.shapes.push(cap('chrome', add(hand, P(0, -1.1)), add(hand, P(5.4, -1.1)), 1.1, 10.4), cap('dark', hand, add(hand, P(-0.3, 2)), 0.8, 10.35));
  const post0 = g.post;
  const post = (ctx, px) => {
    post0 && post0(ctx, px);
    const a = shirt.pts, top = px(P((a[0].x + a[1].x) / 2 + 0.3, (a[0].y + a[1].y) / 2)), bot = px(P((a[2].x + a[3].x) / 2, (a[2].y + a[3].y) / 2 - 1.5));
    ctx.fillStyle = '#0a0a0e'; const n = Math.max(1, Math.abs(bot.y - top.y)); for (let k = 0; k <= n; k++) ctx.fillRect(Math.round(top.x + (bot.x - top.x) * k / n), top.y + Math.sign(bot.y - top.y) * k, 1, 1);
    const e = px(add(C, P(-1.4, 1))); ctx.fillStyle = '#d8dce4'; ctx.fillRect(e.x, e.y, 1, 1); ctx.fillRect(e.x - 1, e.y + 2, 1, 2);                // earpiece
    const m = px(add(hand, P(6.8, -1.1))); ctx.fillStyle = '#7aff8a'; ctx.fillRect(m.x, m.y - 1, 2, 3); ctx.fillStyle = '#ffffff'; ctx.fillRect(m.x, m.y, 1, 1);
  };
  return { shapes: g.shapes, post };
}

// ---------- an agent on a black motorbike (the fast one: 'biker'). faces left as built ----------
function bikeAgent(phase) {
  const g = bikerShapes(phase), T = phase * Math.PI * 2, bob = Math.sin(T * 2) * 0.4, C = P(-5, -32.5 + bob), Sh = P(-2, -27 + bob);
  const sh = g.shapes.map((s) => {
    if (s.m === 'bone') return { ...s, m: s.g === 'skull' ? 'skinPale' : s.z > 7 ? 'skinPale' : 'suit' };
    if (s.m === 'leather' && (s.z === 4 || s.z === 5 || s.z === 7)) return { ...s, m: 'suit' };
    if (s.m === 'tank') return { ...s, m: 'codeTank' };
    return s;
  });
  sh.push(poly('slick', [add(C, P(-3.8, -1.4)), add(C, P(-2.6, -4.4)), add(C, P(1.4, -4.8)), add(C, P(4.4, -2.6)), add(C, P(4.2, 1.6)), add(C, P(2.2, 1.4)), add(C, P(1.6, -1.4))], 6.5));
  sh.push(poly('shirt', [add(Sh, P(-3, -0.6)), add(Sh, P(-0.6, -1)), add(Sh, P(-1.6, 2.2)), add(Sh, P(-3.2, 2))], 5.5, { noSeam: true }));
  sh.push(poly('codeTank', [P(-17, -12), P(-11, -13.5), P(-11, -12), P(-16, -10.5)], 3.2));                    // front mudguard
  const RW = P(11, -6), FW = P(-15, -6);
  const post = (ctx, px) => {
    const e = px(add(C, P(-3.4, -0.6))); ctx.fillStyle = '#000'; ctx.fillRect(e.x, e.y, 5, 2); ctx.fillStyle = '#8aff9a'; ctx.fillRect(e.x + 1, e.y, 1, 1);   // shades
    const t = px(add(Sh, P(-2.4, 0.4))); ctx.fillStyle = '#0a0a0e'; ctx.fillRect(t.x, t.y, 1, 3);                                                                // tie
    const ex = px(P(17.5, -9)); ctx.fillStyle = Math.round(phase * 8) % 2 ? '#8aff9a' : '#3ae03a'; ctx.fillRect(ex.x, ex.y - 1, 3, 2); ctx.fillStyle = '#e8ffe8'; ctx.fillRect(ex.x, ex.y, 1, 1);
    for (const w of [RW, FW]) for (let k = 0; k < 2; k++) { const a = T + k * Math.PI / 2; for (const r of [3.5, 4.6]) for (const d of [1, -1]) { const sp = px(add(w, P(Math.cos(a) * r * d, Math.sin(a) * r * d))); ctx.fillStyle = '#8aff9a'; ctx.fillRect(sp.x, sp.y, 1, 1); } }
    const hl = px(P(-11, -19)); ctx.fillStyle = '#e8ffe8'; ctx.fillRect(hl.x - 2, hl.y, 3, 2); ctx.fillStyle = '#8aff9a'; ctx.fillRect(hl.x - 4, hl.y, 2, 1);        // headlight
  };
  return { shapes: sh, post };
}

// ---------- the phantom (backer): white suit, pale dreadlocks. faces RIGHT, the way he is going ----------
function phantomShapes(phase) {
  const g = recolor(heroShapes(phase), { coat: 'codeWhite', coatFar: 'codeWhiteFar', trousers: 'codeWhite', trousersFar: 'codeWhiteFar', tee: 'codeWhiteFar', boot: 'codeWhiteFar', skin: 'skinPale' }, ['hair']);
  const head = g.shapes.find((s) => s.m === 'skinPale' && s.kind === 'ell' && s.z === 7), C = P(head.c.x - 0.4, head.c.y - 0.4), sw = Math.sin(phase * Math.PI * 4);
  g.shapes.push(ell('codeDread', add(C, P(-1.4, -3.3)), 4.3, 2.7, 8, { g: 'dread' }));
  for (let i = 0; i < 4; i++) g.shapes.push(cap('codeDread', add(C, P(-2.6 - i * 0.8, -3 + i * 0.7)), add(C, P(-5.2 - i * 1.7 - sw * (0.4 + i * 0.3), 2.6 + i * 1.2 - Math.abs(sw) * i * 0.3)), 0.9, 8.1 + i * 0.01, { g: 'dr' + i }));
  return g;
}
function ghost(f) {            // two after-images trailing behind him
  const c = cv(f.c.width + 8, f.c.height), x = c.getContext('2d'), t = tint(f, '#8aff9a', 1).c;
  x.globalAlpha = 0.22; x.drawImage(t, 0, 0); x.globalAlpha = 0.42; x.drawImage(t, 4, 0); x.globalAlpha = 1; x.drawImage(f.c, 8, 0);
  return { c, ox: f.ox + 8, oy: f.oy };
}

// ---------- an agent caught half way through overwriting somebody ('gruntAlt'): his back half is still raw code ----------
function glitch(f, seed) {
  const o = copy(f), w = o.c.width, h = o.c.height, d = o.x.getImageData(0, 0, w, h), a = d.data, src = a.slice();
  const G = [[232, 255, 232], [138, 255, 154], [58, 224, 58], [31, 160, 46]];
  for (let y = 0; y < h; y++) {
    const tear = hash(y >> 2, seed + 7) < 0.22 ? 2 : 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4, sx = x - tear, si = (y * w + sx) * 4, on = sx >= 0 && src[si + 3] > 0;
      const k = (x - f.ox + 6) / 12;                        // 0 at his front, 1 at his back
      const code = on && hash(x >> 1, seed) < k * 1.15 - 0.1 + (hash(x >> 1, (y / 6 | 0) + seed) < 0.3 ? 0.3 : 0);
      if (!on) { a[i + 3] = 0; continue; }
      if (code) { if (y % 6 === 5 || hash(x, y + seed * 3) < 0.25) { a[i] = 2; a[i + 1] = 20; a[i + 2] = 8; a[i + 3] = 255; } else { const c = G[Math.min(3, (hash(x >> 1, (y / 6 | 0) + seed * 5) * 4.6) | 0)]; a[i] = c[0]; a[i + 1] = c[1]; a[i + 2] = c[2]; a[i + 3] = 255; } }
      else { a[i] = src[si]; a[i + 1] = src[si + 1]; a[i + 2] = src[si + 2]; a[i + 3] = src[si + 3]; }
    }
  }
  o.x.putImageData(d, 0, 0);
  return { c: o.c, ox: o.ox, oy: o.oy };
}

// ---------- the tracer bug (seeker). 22 x 12, origin its middle, faces left ----------
function bug(ph, lock) {
  const c = cv(27, 15), x = c.getContext('2d'), cy = 7;
  for (let k = 0; k < 4; k++) for (let i = 0; i < 14; i++) {            // trailing cables, a claw on the end of each
    const fan = (k - 1.5) * (lock ? 0.9 : 1.5), yy = Math.round(cy + fan * (0.5 + i / (lock ? 30 : 9)) + (lock ? 0 : Math.sin(i * 0.7 + ph * 2.1 + k * 1.9) * (i / 13) * 1.8));
    B(x, i > 11 ? '#ff4a2a' : i % 3 === 2 ? '#5a6672' : '#b4c0cc', 11 + i, yy, 1, 1);
  }
  for (let i = 1; i <= 11; i++) {                                       // plated head
    const t = (i - 6) / 5.6, hh = Math.round(Math.sqrt(Math.max(0, 1 - t * t)) * 4.3), seam = i === 8 || i === 10;
    for (let j = -hh; j <= hh; j++) B(x, seam ? '#4a5560' : j === -hh ? '#f4f8ff' : j < -1 ? '#c2ccd8' : j === hh ? '#56626e' : '#8a96a4', i, cy + j, 1, 1);
  }
  B(x, '#b4c0cc', 0, cy - (lock ? 4 : 2), 2, 1); B(x, '#b4c0cc', 0, cy + (lock ? 4 : 2), 2, 1);                             // pincers, wide open when it comes for you
  const eye = lock ? '#ffffff' : '#ff3020', rimc = lock ? '#ff3020' : '#a01410';
  B(x, '#200404', 2, cy - 2, 4, 5); B(x, rimc, 2, cy - 1, 4, 3); B(x, eye, 3, cy - 1, 2, 2); if (!lock) B(x, '#ffc0b0', 3, cy - 1, 1, 1);
  for (const [ex, ey] of [[6, -3], [8, 1], [7, 3]]) { B(x, '#200404', ex, cy + ey - 1, 3, 3); B(x, eye === '#ffffff' ? '#ff8a6a' : '#ff3020', ex + 1, cy + ey, 1, 1); }
  const f = outline({ c, ox: 9, oy: 7 });
  if (lock) { const g = f.c.getContext('2d'); g.globalCompositeOperation = 'destination-over'; g.fillStyle = 'rgba(255,48,32,0.6)'; g.fillRect(0, cy - 3, 9, 9); g.fillRect(1, cy - 5, 11, 13); }
  return f;
}

// ---------- the phone booth (the ride, parked) ----------
function booth() {
  const c = cv(22, 38), x = c.getContext('2d');
  B(x, O, 0, 0, 22, 38); B(x, '#1fa02e', 1, 1, 20, 36); B(x, '#8aff9a', 1, 1, 20, 1); B(x, '#8aff9a', 1, 1, 1, 36); B(x, '#0f6a1c', 20, 2, 1, 35);
  B(x, O, 2, 2, 18, 9); B(x, '#e8ffe8', 3, 3, 16, 7);                                                                    // the sign
  [['111', '010', '010', '010', '010'], ['111', '100', '110', '100', '111'], ['100', '100', '100', '100', '111']].forEach((L, n) => L.forEach((r, j) => { for (let i = 0; i < 3; i++) if (r[i] === '1') B(x, '#073a10', 5 + n * 4 + i, 4 + j, 1, 1); }));   // T E L
  B(x, O, 2, 12, 18, 21); B(x, '#c8ffd0', 3, 13, 16, 19); B(x, '#e8ffe8', 3, 13, 16, 2); B(x, '#8aff9a', 3, 27, 16, 5); B(x, '#1fa02e', 3, 23, 16, 1);
  B(x, O, 11, 14, 7, 9); B(x, '#16211c', 12, 15, 5, 7); for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) B(x, '#8aff9a', 13 + i * 2, 16 + j * 2, 1, 1);     // the phone on the back wall
  for (let j = 0; j < 6; j++) B(x, '#16211c', 7 + (j % 2), 24 + j, 1, 1);                                                // its cord
  B(x, '#073a10', 1, 34, 20, 3); B(x, '#0f6a1c', 1, 34, 20, 1);
  return c;
}

export function codeDangers(Bk, { suit, gl }) {
  // ---- sprites ----
  const guard = (pose) => suit(flip(R(guardShapes(pose), 48, 52, 22, 48)));
  const chr = {
    gunner: { idle: guard('idle'), aim: guard('aim'), fire: guard('fire') },
    seeker: [bug(0, false), bug(1, false), bug(2, false), bug(0, true)],
    backer: frames(8, (p) => ghost(outline(R(phantomShapes(p), 40, 50, 18, 46)))),
    puker: frames(8, (p) => suit(flip(R(pistolAgent(p), 46, 50, 18, 46)))),
    biker: frames(4, (p) => suit(R(bikeAgent(p), 48, 44, 24, 42))),
  };
  chr.gruntAlt = Bk.agent.map((f, i) => glitch(suit(f), 3 + (i >> 1)));

  // red glyphs: the same marks as the green code, in four heats
  const RC = ['#fff4e0', '#ffb03a', '#ff4a2a', '#b01a14', '#5a0c0a'];
  const RAT = cv(14 * 4, RC.length * 6);
  { const x = RAT.getContext('2d'); RC.forEach((col, s) => { for (let k = 0; k < 14; k++) gl(x, k * 4, s * 6, k, 0); }); x.globalCompositeOperation = 'source-atop'; RC.forEach((col, s) => { x.fillStyle = col; x.fillRect(0, s * 6, RAT.width, 6); }); }
  const rg = (ctx, x, y, k, s) => ctx.drawImage(RAT, ((((k | 0) % 14) + 14) % 14) * 4, s * 6, 3, 5, x, y, 3, 5);
  const BOOTH = booth();
  const SIL = new WeakMap();
  const sil = (c, col) => { let m = SIL.get(c); if (!m) SIL.set(c, (m = {})); return m[col] || (m[col] = tint({ c, ox: 0, oy: 0 }, col, 1).c); };

  const fx = {
    // FIREWALL: a slot in the floor; red marks spit out of it, then a wall of red code stands up
    vent(ctx, x, y, st, f) {
      const live = st.on || st.warn > 0;
      B(ctx, O, x - 8, y - 2, 16, 4); B(ctx, live ? '#5a0c0a' : '#2a0806', x - 7, y - 1, 14, 2);
      for (let i = -6; i <= 4; i += 3) B(ctx, live ? ((i + (f >> 1)) % 2 ? '#ff4a2a' : '#ffb03a') : '#801810', x + i, y - 1, 2, 1);
      if (st.warn > 0) {
        const n = 2 + Math.round(st.warn * 3);
        for (let k = 0; k < n; k++) { const up = 2 + ((hash(k, f >> 1) * (5 + st.warn * 24)) | 0); if ((f + k) % 3) { B(ctx, O, x - 6 + ((k * 4) % 11), y - 9 - up, 5, 7); rg(ctx, x - 5 + ((k * 4) % 11), y - 8 - up, hash(k, f) * 14, k % 2 ? 1 : 2); } }
        if ((f >> 1) % 2) { ctx.fillStyle = st.warn > 0.6 ? '#ffb03a' : '#ff4a2a'; for (let j = 3; j < 34; j += 5) { ctx.fillRect(x - 6, y - 2 - j, 1, 2); ctx.fillRect(x + 5, y - 2 - j, 1, 2); } ctx.fillRect(x - 6, y - 36, 3, 1); ctx.fillRect(x + 3, y - 36, 3, 1); }
        return;
      }
      if (!st.on) return;
      const h = Math.round(st.h), top = y - 2 - h;
      B(ctx, O, x - 7, top - 1, 14, h + 1); B(ctx, '#3a0806', x - 6, top, 12, h);
      ctx.save(); ctx.beginPath(); ctx.rect(x - 6, top, 12, h); ctx.clip();
      const sc = (f * 2) % 6;
      for (let c = 0; c < 3; c++) for (let j = -1; j * 6 < h + 6; j++) { const row = j + ((f * 2 / 6) | 0), heat = hash(c * 7 + row, 5) < 0.3 ? 0 : (row + c) % 3 === 0 ? 1 : 2; rg(ctx, x - 5 + c * 4, y - 8 - j * 6 + sc - 6, hash(c, row) * 14, heat); }
      ctx.restore();
      B(ctx, (f >> 1) % 2 ? '#ffb03a' : '#fff4e0', x - 6, top, 1, h); B(ctx, (f >> 1) % 2 ? '#fff4e0' : '#ffb03a', x + 5, top, 1, h); B(ctx, '#fff4e0', x - 6, top, 12, 1);
    },
    // the ceiling has torn open: raw code hangs out of the hole and packets drop from it
    cloud(ctx, x0, x1, y, f) {
      for (let i = x0; i < x1; i += 4) {
        const k = (i - x0) >> 2, d = 3 + ((hash(k, 3) * 5) | 0), run = 1 + ((hash(k, 9) * 3) | 0);
        B(ctx, O, i, y - 4, 4, 4 + d); B(ctx, '#020a05', i, y - 4, 4, 3 + d);
        if (hash(k, 4) < 0.7) for (let j = 0; j < run; j++) gl(ctx, i, y + d - 2 + j * 6 - (((f >> 2) + k) % 2), hash(k, j + (f >> 3)) * 14, j === run - 1 ? ((f >> 2) + k) % 5 === 0 ? 0 : 1 : 3);
        B(ctx, hash(k, 6) < 0.5 ? '#5c7566' : '#33483d', i, y + d - 1, 4, 1);
      }
      B(ctx, O, x0 - 2, y - 4, 2, 9); B(ctx, O, x1, y - 4, 2, 9);
    },
    // a packet: a short run of code. the red one is aimed at you
    drop(ctx, x, y, f, d) {
      const n = d.hot ? 3 : 2, h = n * 6 + 2, rail = d.hot ? ((f >> 1) % 2 ? '#ff4a2a' : '#ffb03a') : '#3ae03a';
      B(ctx, O, x - 4, y - h, 9, h + 2); B(ctx, rail, x - 3, y - h + 1, 1, h - 1); B(ctx, rail, x + 3, y - h + 1, 1, h - 1);
      if (d.hot) { rg(ctx, x - 1, y - 5, (f >> 1) + d.id, 0); rg(ctx, x - 1, y - 11, (f >> 2) + d.id * 3, (f >> 1) % 2 ? 1 : 2); rg(ctx, x - 1, y - 17, d.id * 5, 2); B(ctx, '#fff4e0', x - 3, y, 7, 1); }
      else { gl(ctx, x - 1, y - 5, (f >> 2) + d.id, 0); gl(ctx, x - 1, y - 11, d.id * 3, 2); B(ctx, '#8aff9a', x - 3, y, 7, 1); }
    },
    // where the red packet lands: brackets closing on the spot
    mark(ctx, x, y, f, k) {
      const w = 9 - Math.round(k * 6), col = k > 0.7 ? ((f >> 1) % 2 ? '#fff4e0' : '#ff4a2a') : (f >> 2) % 2 ? '#ff4a2a' : '#ffb03a';
      for (const s of [-1, 1]) { const bx = x + s * w - (s > 0 ? 1 : 0); B(ctx, O, bx - 1 - (s < 0 ? 0 : 2), y - 5, 5, 7); B(ctx, col, bx, y - 4, 1, 5); B(ctx, col, bx - (s > 0 ? 2 : 0) , y - 4, 3, 1); B(ctx, col, bx - (s > 0 ? 2 : 0), y, 3, 1); }
      if ((f >> 1) % 2) { ctx.fillStyle = 'rgba(255,74,42,0.6)'; for (let j = 8; j < 40; j += 5) ctx.fillRect(x, y - j, 1, 2); }
    },
    // a bullet, and the ripples it leaves hanging in the air behind it
    shot(ctx, x, y, f, b) {
      const d = b.rev ? -1 : 1;
      for (let i = 1; i <= 5; i++) {
        const rx = x + d * (1 + i * 6 + ((f >> 1) % 2)), hh = 2 + i; ctx.fillStyle = `rgba(220,255,228,${1 - i * 0.15})`;
        for (let j = -hh; j <= hh; j++) { const xo = Math.round(Math.sqrt(1 - (j / (hh + 0.5)) ** 2) * (1 + i * 0.4)); ctx.fillRect(rx + xo, y + j, 1, 1); if (xo) ctx.fillRect(rx - xo, y + j, 1, 1); }
      }
      B(ctx, O, x - 4, y - 2, 9, 5); B(ctx, '#ffe14a', x - 3, y - 1, 7, 3); B(ctx, '#ffffff', x + (b.rev ? 0 : -3), y - 1, 4, 2); B(ctx, '#c8801a', x + (b.rev ? -3 : 2), y + 1, 2, 1);
    },
    // the guard's laser sight
    aim(ctx, x0, x1, y, f, k) {
      const hot = k > 0.7;
      if (!hot && k < 0.35 && (f >> 2) % 2) return;
      ctx.fillStyle = hot ? ((f >> 1) % 2 ? '#ffffff' : '#ff4a2a') : '#ff3020';
      for (let i = x1 - 3 - ((f * 2) % 6); i > x0; i -= 6) ctx.fillRect(i, y, hot ? 5 : 3, 1);
      B(ctx, hot ? '#ffffff' : '#ff3020', x1 - 2, y - 1, 2, 3);
    },
    // a phone booth, ringing
    ride(ctx, x, y, f) {
      const ring = (f >> 2) % 2, t = (f >> 1) % 8, b = Math.round(Math.sin(f / 8) * 1.5), X = x - 11, Y0 = y - 38;
      ctx.drawImage(BOOTH, X, Y0);
      if (ring) { ctx.fillStyle = 'rgba(232,255,232,0.45)'; ctx.fillRect(X + 3, Y0 + 13, 8, 19); }
      B(ctx, O, X + 5 + ring, Y0 + 14 - ring, 4, 10); B(ctx, '#ffffff', X + 6 + ring, Y0 + 15 - ring, 2, 8); B(ctx, '#16211c', X + 7 + ring, Y0 + 17 - ring, 1, 4);         // the handset, jumping on its hook
      // a big handset rattling over the roof, ring marks flying off it: answer me
      const hx = x - 6 + (ring ? 1 : -1), hy = Y0 - 12 + b;
      B(ctx, O, hx - 1, hy - 1, 14, 5); B(ctx, O, hx - 1, hy + 3, 5, 4); B(ctx, O, hx + 8, hy + 3, 5, 4);
      B(ctx, '#ffffff', hx, hy, 12, 3); B(ctx, '#ffffff', hx, hy + 3, 3, 3); B(ctx, '#ffffff', hx + 9, hy + 3, 3, 3); B(ctx, '#8aff9a', hx + 1, hy + 2, 10, 1);
      for (const s of [-1, 1]) for (let r = 0; r < 2; r++) {
        const rr = 10 + r * 4 + (t >> 1), col = r ? '#ffe14a' : '#ffffff', pts = [];
        for (let j = -3 - r; j <= 3 + r; j++) pts.push([x + s * Math.round(rr - Math.abs(j) * 0.5 - (Math.abs(j) > 2 ? 1 : 0)), hy + 2 + j]);
        for (const [a, c] of pts) B(ctx, O, a - 1, c - 1, 3, 3); for (const [a, c] of pts) B(ctx, col, a, c, 1, 1);
      }
    },
    // THE ONE: he flies, wrapped in code that climbs past him, with after-images behind
    riding(ctx, x, y, f, s, hero) {
      const lift = 6 + Math.round(Math.sin(f / 6) * 2), hx = Math.round(x - hero.ox), hy = Math.round(y - lift - hero.oy), g = sil(hero.c, '#3ae03a'), w = sil(hero.c, '#e8ffe8');
      for (let i = 0; i < 6; i++) { const yy = y - 1 - ((f * 2 + i * 9) % 12); B(ctx, i % 2 ? '#3ae03a' : '#8aff9a', x - 12 + i * 5 - ((f >> 1) % 3), y - 1, 3, 1); if (s.onGround && i % 2) B(ctx, '#e8ffe8', x - 10 + i * 4, yy, 1, 2); }
      for (let k = 0; k < 8; k++) {
        const cx = x - 19 + k * 5 + (k % 2), sp = 1.4 + (k % 3) * 0.7, t = (f * sp + k * 17) % 52, near = k > 1 && k < 6;
        for (let j = 0; j < 3; j++) { const gy = Math.round(y - 2 - t + j * 6); if (gy > y - 50) gl(ctx, cx, gy, hash(k, ((f * sp / 6) | 0) + j) * 14, j === 0 ? (near ? 1 : 0) : j === 1 ? 2 : 3); }
      }
      ctx.globalAlpha = 0.2; ctx.drawImage(g, hx - 18, hy + 2); ctx.globalAlpha = 0.34; ctx.drawImage(g, hx - 12, hy + 1); ctx.globalAlpha = 0.55; ctx.drawImage(g, hx - 6, hy); ctx.globalAlpha = 1;
      for (const [dx, dy] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) ctx.drawImage(g, hx + dx, hy + dy);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) ctx.drawImage(w, hx + dx, hy + dy);
      ctx.drawImage(hero.c, hx, hy);
      for (let k = 0; k < 3; k++) { const a = f / 5 + k * 2.1; gl(ctx, Math.round(x - 1 + Math.cos(a) * 15), Math.round(y - lift - 18 + Math.sin(a) * 20), (f >> 2) + k, 0); }
    },
    // the shield: a shell of code turning round him
    shield(ctx, x, y, f) {
      for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2 + f / 24; if ((i + (f >> 2)) % 6 < 4) B(ctx, i % 2 ? '#8aff9a' : '#e8ffe8', Math.round(x + Math.cos(a) * 14), Math.round(y - 16 + Math.sin(a) * 21), 1, 1); }
      for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI * 2 - f / 14; gl(ctx, Math.round(x - 1 + Math.cos(a) * 14), Math.round(y - 18 + Math.sin(a) * 21), i * 3 + (f >> 3), i % 2 ? 1 : 0); }
    },
  };

  const danger = {
    spawn: { vent: 10, rain: 9, gunner: 10, seeker: 9, backer: 7 },
    rain: { vx: 0, every: 16 },
    gunner: { rev: false },
    ride: { fly: true, chance: 65, ticks: 420 },
    box: { shield: 10, bomb: 9 },
    acidBlood: false,
  };
  const labels = { ride: 'THE ONE!', shield: 'CODE SHELL!', bomb: 'EMP!', star: 'RED PILL!', triple: 'KUNG FU!' };
  return { chr, fx, danger, labels };
}
