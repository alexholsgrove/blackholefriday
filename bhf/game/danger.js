// Black Hole Friday: each level's own dangers and power-ups. The rules live in sim.js; this file is the contract
// for a level file (levels/<key>.js) and the plain stand-in art used wherever a level has not drawn its own.
//
// A level switches things on with skin.danger, and draws them with skin.fx (live drawing) and skin.chr (sprites):
//
//   danger: {
//     spawn: { vent: 7, rain: 6, gunner: 6, seeker: 5, dropper: 6, backer: 5 },   // % of everything that turns up in the level
//     rain: { vx: 0, every: 20 },        // sky drops: sideways drift (sub-px per tick, 256 = 1 px), ticks between drops
//     gunner: { rev: false },            // rev: the bullet comes out of a hole in the wall BEHIND you and flies back to his gun
//     dropper: { to: 'leaper' },         // what the thing on the ceiling does when it lands: 'leaper' springs at you, 'puddle' smashes into a patch you must jump
//     ride: { fly: false, chance: 65, ticks: 420 },   // the level's ride, parked on the floor: 7 s invincible; fly = it also crosses holes in the floor
//     box: { shield: 10, bomb: 8 },      // % of V boxes that hold a one-hit shield / a smart bomb
//     acidBlood: false,                  // a stomped baddie leaves a puddle
//     (spawn may also hold `floe`: a chasm crossed on platforms that ALL crumble 26 ticks after you land on them. Drawn by the level's drawPlat, kind 'crumble')
//   }
//
//   what each one does (all are fair in a runner where you can only jump):
//     vent    a jet out of the floor, on and off like clockwork; sputters for 24 ticks first. 34 px tall: run through when it's off, or jump it
//     rain    a squall over a stretch of floor: drops fall from the top of the screen for a second, a mark shows where each lands; ledges shelter you
//     gunner  stands still; raises his gun (24 ticks) then fires along the floor, 9 px up: jump it. stomp him
//     seeker  flies at you matching your height, then locks (76 px out) and flies straight: jump as it locks, or stomp it
//     dropper hangs under the gallery, lets go so it lands just ahead of you
//     backer  runs the same way as you, only slower: you catch him up slowly. stomp him
//
//   fx: {                                 // every one optional; x, y are screen pixels
//     vent(ctx, x, y, st, f, z)           x = centre, y = the floor line. st = { on, c (ticks into the burst), h (jet height now, px: draw exactly this tall), warn (0..1 just before it blows, else 0) }
//     cloud(ctx, x0, x1, y, f, z)         what the rain falls out of: spans x0..x1, drops leave from y
//     drop(ctx, x, y, f, d, z)            a falling sky drop (its tip at x, y). it hurts over a 4 x 4 px box: keep it slim
//     mark(ctx, x, y, f, k, z)            where a drop will land (x, floor line y); k 0..1 as it gets close
//     shot(ctx, x, y, f, b, z)            a bullet: 6 x 4 px. b.rev = it is flying backwards (to the right) into the gun
//     aim(ctx, x0, x1, y, f, k, z)        the gunner's sight line from x0 (left) to x1 (the gun) at bullet height; k 0..1 as the shot nears
//     hole(ctx, x, y, f, k, z)            (rev gunners) the bullet hole the shot comes out of; k 0..1 as you get close
//     ride(ctx, x, y, f, z)               the ride parked on the floor (x centre, y floor line), waiting. make it glow / beckon
//     riding(ctx, x, y, f, s, hero, z)    the hero on his ride: draw BOTH (hero = his current frame { c, ox, oy }, feet at x, y). s.ride = ticks left
//     shield(ctx, x, y, f, z)             the bubble round the hero (feet at x, y) while he holds a shield
//   }
//   chr: { gunner: { idle, aim, fire }, seeker: [frames], dropper: { hang, fall, leap, run: [frames] }, backer: [frames], gruntAlt: [frames] }
//        all sprites are { c, ox, oy } frames (kit.fr), facing LEFT, feet at the origin (seeker: its middle; dropper.hang: the point it hangs from is the TOP middle... see below)
//        dropper: all four are drawn with the origin at its feet / lowest point; hanging, that point is 78 px above the floor
//        gruntAlt: a second look for the level's ordinary walker (every other one uses it)
//   labels: { ride: 'POWER LOADER!', shield: 'SHIELD!', bomb: 'EMP!', star: 'INVINCIBLE!', triple: 'TRIPLE JUMP!', hp: 'ENERGY UP!' }   // what pops up when you get one
//
//   LEVEL 6 ONLY (INVERSION, "there and back"). Every one of these is off unless the level asks for it, so the other levels play tick for tick as before:
//   danger.film: { mid: 2720, pre: 120, post: 220, scenes: [1100, 1800] }   // px from the start of the level. sim.js lays the level out itself (spawnFilm):
//        three places out (hangar | a hole crossed on van roofs at scenes[0] | a hole crossed on slabs that blow at scenes[1]), a clear run of `pre` px up to
//        the turnstile at `mid` and `post` px after it, then the SAME ground again in the other order. Slabs blow 18 ticks after you land (26 elsewhere).
//        The rules still run left to right all the way; s.film = { z, back, edge: [the two holes' starts, sub-px], ... }
//   skin hooks render.js calls if the level has them (drawing only: none may write anything the rules read):
//     mirror(s, fdist)                    true = draw the whole picture turned left to right (the hud and all words stay the right way round)
//     sceneFx(ctx, s, Y, f)               the level's own backdrop, over the far backdrop and under the floor
//     deckFx / pitFx(ctx, s, Y, f)        the floor / what is down in the holes, drawn by the level in place of the tiled ones
//     gradeFx(ctx, s, Y, f)               a wash over the finished scene, under the hero
//     heroFx(hero, s)                     another set of hero frames to use (or null)
//     drawPlat(ctx, p, x, y, w, f, Y)     the level's own platforms; frontFx / backFx also get (…, cam, s)
import { cv } from './kit.js';

const O = '#000';
const sprite = (w, h, draw, ox = w >> 1, oy = h) => { const c = cv(w, h), x = c.getContext('2d'); draw(x); return { c, ox, oy }; };
const R = (x, col, x0, y0, w, h) => { x.fillStyle = col; x.fillRect(x0, y0, w, h); };
const look = (z) => (z && z.drip) || { drop: '#ff8a1a', glint: '#ffe14a' };

// ---------- stand-in sprites ----------
function turret(k) {            // a tripod gun
  return sprite(22, 30, (x) => {
    R(x, O, 6, 12, 12, 9); R(x, '#5a6270', 7, 13, 10, 7); R(x, '#8a94a4', 7, 13, 10, 1);
    R(x, O, 0 - (k === 2 ? 1 : 0), 14, 8, 4); R(x, '#3a4048', 1 - (k === 2 ? 1 : 0), 15, 7, 2);
    R(x, k ? '#ff3030' : '#802020', 14, 15, 2, 2);
    for (const [a, b] of [[8, 4], [11, 11], [14, 18]]) { for (let j = 0; j < 9; j++) { const i = Math.round(a + ((b - a) * j) / 8); R(x, O, i - 1, 21 + j, 3, 1); R(x, '#6a7280', i, 21 + j, 1, 1); } }
    if (k === 2) { R(x, '#fff38a', 0, 14, 2, 4); }
  }, 11, 30);
}
function drone(k) {             // a little hunting dart
  return sprite(18, 10, (x) => {
    R(x, O, 2, 2, 14, 6); R(x, O, 0, 4, 18, 2); R(x, '#6a7280', 3, 3, 12, 4); R(x, '#a8b2c0', 3, 3, 12, 1);
    R(x, k ? '#ff3030' : '#ffb03a', 1, 4, 2, 2); R(x, '#3a4048', 12, 4 + k, 5, 1);
  }, 9, 5);
}
function bug(pose) {            // something with legs
  return sprite(16, 12, (x) => {
    const up = pose === 'hang';
    R(x, O, 3, up ? 0 : 3, 10, 7); R(x, '#8a7a5a', 4, up ? 1 : 4, 8, 5); R(x, '#c8b890', 4, up ? 1 : 4, 8, 1);
    for (const i of [2, 5, 9, 12]) { const s = pose === 'run1' ? (i % 2) : 0; R(x, O, i, up ? 6 : 9 - s, 2, up ? 5 : 3 + s); R(x, '#c8b890', i, up ? 7 : 10 - s, 1, up ? 3 : 2); }
  }, 8, pose === 'hang' ? 0 : 12);
}
export const DCHR = { gunner: { idle: turret(0), aim: turret(1), fire: turret(2) }, seeker: [drone(0), drone(1)], dropper: { hang: bug('hang'), fall: bug('fall'), leap: bug('fall'), run: [bug('run0'), bug('run1')] } };

// ---------- stand-in live drawing ----------
export const FX = {
  vent(ctx, x, y, st, f, z) {
    const L = look(z);
    R(ctx, O, x - 7, y - 2, 14, 4); R(ctx, '#4a4e58', x - 6, y - 1, 12, 2); for (let i = -4; i <= 4; i += 3) R(ctx, O, x + i, y - 1, 1, 2);
    if (st.warn > 0 && (f >> 1) % 2) { R(ctx, L.glint, x - 2 + (f % 5), y - 4 - (f % 3), 1, 2); R(ctx, L.drop, x + 1 - (f % 4), y - 3, 1, 1); }
    if (!st.on) return;
    const w = (j) => 3 + ((j * 7 + f * 3) % 3) - (j > st.h - 6 ? 1 : 0);
    for (let j = 0; j < st.h; j++) R(ctx, O, x - w(j) - 1, y - 2 - j, w(j) * 2 + 2, 1);
    for (let j = 0; j < st.h; j++) { R(ctx, (j + f) % 4 < 2 ? L.drop : L.glint, x - w(j), y - 2 - j, w(j) * 2, 1); R(ctx, '#ffffff', x - 1, y - 2 - j, 1 + (j % 2), 1); }
  },
  cloud(ctx, x0, x1, y, f) {
    for (let i = x0; i < x1; i += 9) { const h = 5 + ((i * 7 + (f >> 4)) % 5); R(ctx, O, i - 1, y - h - 1, 11, h + 2); R(ctx, '#2a2a3a', i, y - h, 9, h); R(ctx, '#4a4a60', i, y - h, 9, 1); }
  },
  drop(ctx, x, y, f, d, z) { const L = look(z); R(ctx, O, x - 2, y - 9, 4, 11); R(ctx, L.drop, x - 1, y - 8, 2, 9); R(ctx, L.glint, x - 1, y - 2, 1, 2); },
  mark(ctx, x, y, f, k, z) { if ((f >> 2) % 2 || k > 0.7) { const L = look(z), w = 2 + Math.round(k * 4); R(ctx, O, x - w - 1, y - 1, w * 2 + 2, 3); R(ctx, L.glint, x - w, y, w * 2, 1); } },
  shot(ctx, x, y, f, b) { R(ctx, O, x - 4, y - 2, 8, 4); R(ctx, '#ffe14a', x - 3, y - 1, 6, 2); R(ctx, '#ffffff', x + (b.rev ? 1 : -3), y - 1, 2, 1); for (let i = 1; i < 4; i++) R(ctx, 'rgba(255,225,74,0.4)', x + (b.rev ? -1 : 1) * (4 + i * 4), y, 3, 1); },
  aim(ctx, x0, x1, y, f, k) { if (k < 0.5 && (f >> 2) % 2) return; ctx.fillStyle = k > 0.8 ? '#ffffff' : '#ff3030'; for (let i = x0; i < x1; i += 4) ctx.fillRect(i, y, 2, 1); },
  hole(ctx, x, y, f, k) { R(ctx, O, x - 3, y - 3, 6, 6); R(ctx, k > 0.6 && (f >> 1) % 2 ? '#ffffff' : '#ff3030', x - 1, y - 1, 2, 2); for (const [dx, dy] of [[-5, -4], [4, -5], [5, 3], [-4, 4]]) R(ctx, O, x + dx, y + dy, 1, 1); },
  ride(ctx, x, y, f) {
    const b = Math.round(Math.sin(f / 8) * 1.5);
    R(ctx, O, x - 11, y - 25, 22, 25); R(ctx, '#d8a020', x - 10, y - 24, 20, 23); R(ctx, '#ffe14a', x - 10, y - 24, 20, 1); R(ctx, O, x - 6, y - 20, 12, 12); R(ctx, '#3a3020', x - 5, y - 19, 10, 10);
    R(ctx, O, x - 4, y - 36 + b, 8, 7); R(ctx, '#ffffff', x - 3, y - 35 + b, 6, 3); R(ctx, '#ffffff', x - 1, y - 32 + b, 2, 2);
  },
  riding(ctx, x, y, f, s, hero) {
    const st = s.onGround ? (f >> 2) % 2 : 0;
    R(ctx, O, x - 13, y - 34, 26, 30); R(ctx, '#d8a020', x - 12, y - 33, 24, 28); R(ctx, '#ffe14a', x - 12, y - 33, 24, 1); R(ctx, O, x - 8, y - 30, 16, 22);
    ctx.drawImage(hero.c, Math.round(x - hero.ox), Math.round(y - 6 - hero.oy));
    R(ctx, O, x - 13, y - 6, 9, 6 - st); R(ctx, '#8a6a10', x - 12, y - 5, 7, 4 - st); R(ctx, O, x + 4, y - 6, 9, 5 + st); R(ctx, '#8a6a10', x + 5, y - 5, 7, 3 + st);
    R(ctx, O, x + 12, y - 26, 8, 5); R(ctx, '#d8a020', x + 12, y - 25, 7, 3);
  },
  shard(ctx, x, y, w, f) { for (let i = 0; i < w; i += 3) { const h = 3 + ((i * 7) % 5); R(ctx, O, x + i - 1, y - h - 1, 4, h + 1); R(ctx, i % 2 ? '#ffffff' : '#bfe8ff', x + i, y - h, 2, h); } },
  shield(ctx, x, y, f) {
    ctx.fillStyle = (f >> 2) % 2 ? '#8ae8ff' : '#ffffff';
    for (let i = 0; i < 20; i++) { const a = (i / 20) * Math.PI * 2 + f / 20; if ((i + (f >> 3)) % 3) ctx.fillRect(Math.round(x + Math.cos(a) * 12), Math.round(y - 15 + Math.sin(a) * 19), 1, 1); }
  },
};
