// Black Hole Friday: what you pick up. Every level has its own "coin", something from its own world, and all of them are plainly friendly:
// small, bright, turning on the spot like a coin, with a glint. Nothing that hurts you in this game spins like that.
// COINS[levelKey] = [set, set...] (a pickup uses set id % sets.length); a set is six frames, each a 13x13 canvas, drawn centred.
import { cv, px } from './kit.js';

const WIDTHS = [11, 9, 5, 3, 5, 9];                       // the turn: full face, narrowing to edge-on, and back
function spin(rows, pal) {
  const base = cv(11, 11); px(base.getContext('2d'), 0, 0, rows, pal);
  return WIDTHS.map((w, i) => {
    const t = cv(13, 13), tx = t.getContext('2d'); tx.imageSmoothingEnabled = false; tx.drawImage(base, 0, 0, 11, 11, 1 + ((11 - w) >> 1), 1, w, 11);
    const k = cv(13, 13), kx = k.getContext('2d'); kx.drawImage(t, 0, 0); kx.globalCompositeOperation = 'source-in'; kx.fillStyle = '#000'; kx.fillRect(0, 0, 13, 13);   // its shape in black...
    const c = cv(13, 13), x = c.getContext('2d'); for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) x.drawImage(k, dx, dy); x.drawImage(t, 0, 0);            // ...as an outline behind it
    if (i === 0 || i === 5) { x.fillStyle = '#ffffff'; x.fillRect(i ? 3 : 9, i ? 9 : 2, 1, 1); }                                                                      // the glint
    return c;
  });
}

export const COINS = {
  // NEON RAIN: a neon credit chip
  neon: [spin([
    '...ggggg...', '..gPPPPPg..', '.gPPpppPPg.', 'gPPpCCCpPPg', 'gPpCCwCCpPg', 'gPpCwwwCpPg', 'gPpCCwCCpPg', 'gPPpCCCpPPg', '.gPPpppPPg.', '..gPPPPPg..', '...ggggg...',
  ], { g: '#ffe14a', P: '#ff2d9a', p: '#7a0a5a', C: '#3ae8ff', w: '#ffffff' })],
  // ICE PLANET: the watch (its second hand is how the message got home)
  ice: [spin([
    '....ttt....', '...gtttg...', '..ggggggg..', '.ggwwwwwgg.', '.gwwwkwwwg.', '.gwwwkwwwg.', '.gwwwkkwwg.', '.gwwwwwwwg.', '.ggwwwwwgg.', '..ggggggg..', '...gtttg...',
  ], { g: '#ffd21a', t: '#b8792a', w: '#ffffff', k: '#1a1428' })],
  // THE HIVE: a marine's dog tags
  hive: [spin([
    '....ccc....', '...c...c...', '..ggggggg..', '.gGGGkGGGg.', '.gGGGGGGGg.', '.gGdddddGg.', '.gGGGGGGGg.', '.gGddddGGg.', '.gGGGGGGGg.', '.gGGGGGGGg.', '..ggggggg..',
  ], { c: '#e8f0f4', g: '#b8862a', G: '#ffe14a', d: '#b8862a', k: '#1a1428' })],
  // THE CODE: the red pill and the blue pill, turn about
  code: [['#ff2a3a', '#a80a1a', '#ffb0b8'], ['#3a9cff', '#0a4aa8', '#b8dcff']].map(([m, d, h]) => spin([
    '...........', '......ddd..', '.....dmmmd.', '....dmhhmd.', '...dmhmmmd.', '..dmmmmmd..', '.dmmmmmd...', '.dmmmmd....', '.dmmmd.....', '..ddd......', '...........',
  ], { m, d, h })),
  // DEEP DESERT: water. Out here it is worth more than anything
  desert: [spin([
    '.....b.....', '.....b.....', '....bBb....', '....bBb....', '...bBBBb...', '..bBwBBBb..', '..bBwBBBb..', '..bBBBBBb..', '..bBBBBBb..', '...bBBBb...', '....bbb....',
  ], { b: '#1a6ad8', B: '#4ac8ff', w: '#ffffff' })],
  // INVERSION: a gold bar
  tenet: [spin([
    '...........', '...........', '..ggggggg..', '.gGGGGGGGg.', '.gGwwGGGGg.', 'gGGGGGGGGGg', 'gDDDDDDDDDg', 'gDDDDDDDDDg', '.ggggggggg.', '...........', '...........',
  ], { g: '#8a5a0a', G: '#ffe14a', D: '#d8a01a', w: '#ffffff' })],
};

// The black hole coin (the special one): a black disc with a ring of light turning round it. Eight frames, 17x17, drawn centred.
export const HOLE_COIN = Array.from({ length: 8 }, (_, fi) => {
  const c = cv(17, 17), x = c.getContext('2d'), RING = ['#ffffff', '#fff38a', '#ffd21a', '#ff8a1a', '#ff2d7a', '#a05aff', '#3ae8ff', '#ffffff'];
  for (let j = 0; j < 17; j++) for (let i = 0; i < 17; i++) {
    const dx = i - 8, dy = j - 8, d = Math.sqrt(dx * dx + dy * dy); let col = null;
    if (d < 3.7) col = '#000000';
    else if (d < 6.3) { const a = Math.atan2(dy, dx) / (Math.PI * 2) + 0.5, k = Math.floor((a + d * 0.06) * 8 + fi) % 8; col = RING[(k + 8) % 8]; }
    else if (d < 7.4) col = '#000000';
    if (Math.abs(dy) < 1 && Math.abs(dx) <= 8 && d >= 3.7) col = Math.abs(dx) > 7 ? '#000000' : (fi + Math.abs(dx)) % 2 ? '#ffffff' : '#fff38a';        // the disc of light across it, edge-on
    if (col) { x.fillStyle = col; x.fillRect(i, j, 1, 1); }
  }
  x.fillStyle = '#000'; x.fillRect(4, 8, 9, 1); x.fillStyle = '#ffffff'; x.fillRect(5 + (fi % 4), 5, 1, 1);
  return c;
});
