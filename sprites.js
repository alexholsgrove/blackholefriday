// Character sprites, hand-drawn as character maps (one letter = one colour).
// '.' is transparent. Built into canvases at load.

export const PAL = {
  K: '#0a0a10',
  // hero
  H: '#1c1c26', h: '#3d3d52', j: '#6e6e8c',
  S: '#f2bb8e', s: '#cf8c62', t: '#94573a', M: '#7a2e2e',
  G: '#060608', g: '#a8d0f0', n: '#3a3a48',
  Y: '#f8d023', L: '#fff38a', y: '#cf9e12', u: '#8c6a0a',
  T: '#1e1e28', z: '#3c3c50',
  P: '#252a44', p: '#3e4570', q: '#151829',
  B: '#0e0e14', b: '#50505f',
  // unicorn
  W: '#f6f2f8', w: '#d2c8de', v: '#9b8db2', E: '#ff1a3a', e: '#ffd0d8', N: '#4a1a2a',
  R: '#ff5fb8', r: '#c8379a', o: '#ffb6e4', m: '#7a1f6a', I: '#fff1b0', i: '#d4b45a', k: '#3a2e44',
  A: '#ff4fd8', a: '#c21fa0', c: '#ffd0f4',
  // goblin
  Q: '#6cbf3c', O: '#3f8a22', x: '#24561a', F: '#d82a3a', f: '#ff6a7a', d: '#8a1420',
  Z: '#ffe14a', D: '#6a4a2a', l: '#3e2a16', X: '#fffbe0',
  // bats, trolls, ghoul
  V: '#6a3a8a', J: '#ffd0f4', U: '#7aff4a',
  1: '#8a7aa0', 2: '#5e4e78', 3: '#3a2e52', 4: '#7a5a32', 5: '#3e2a16',
  6: '#4a7aff', 7: '#2a4ac0', 8: '#1a2a7a', 9: '#ff8a1a',
};

// ---- hero (24 wide, faces right) ------------------------------------------
const HEAD = [
  '..........K..K.K........',
  '.......K..KK.KKK.K......',
  '........KKjKKhHKK.K.....',
  '.....K.KhHHHjHHHHKK.....',
  '......KHHhHHHHhHHHHK....',
  '....KKHHHHHjHHHHHHHHK...',
  '.....KHHhHHHHHHHhHHHHK..',
  '....KHHHHHHHHHHSSSSHHK..',
  '.....KHHHhHHHSSSSSSSHK..',
  '......KHHHHHSnGGGGGGGGK.',
  '......KHHHHSSGgGGGGgGGK.',
  '.......KHHtSSSGGGSSGGSK.',
  '.......KHHtsSSSSSSSSSK..',
  '........KttsSSSSSMMSK...',
  '.........KtssSSSSSSK....',
  '..........KKssssKKK.....',
];
const BODY = [
  '........KYYKTTTTKYK.....',
  '.......KYLYYKTTzTKYYK...',
  '......KYLYYYKTTTTKYYYK..',
  '......KYLYYYKTzTTKYYYK..',
  '.....KYYLYYYKTTTTKYYYK..',
  '.....KyYLYYYKTTTTKYYyK..',
  '.....KyYLYYYKTTTTKYYyK..',
  '....KyyYLYYYKKKKKKYYyK..',
  '....KyyYYYYYKPPPPKYYyK..',
  '...KuyyYYYYKPPpPPKYYyK..',
  '...KuyyYYYYKPPpPPKyyyK..',
  '..KuuyyYYYKPPPpPPKyyK...',
  '..KuuyyyYYKPPPKPPPKyK...',
  '..KKKKKKKKKPPK.KPPKK....',
];
// arms: front arm sits in front of the coat with its own outline; hands are skin
// arms as in the video: bent at the elbow, fists (with black cuffs) pumping in front of the chest
const ARM = {
  a: ['.................KYYK.......',  '.................KYLYK......',  '.................KYLYK......',  '.................KYLYYYYTKK.',  '.................KYYYYYYTSSK',  '..................KyyyyyTSsK',  '...................KKKKKKKK.'],
  b: ['.................KYYK.......',  '.................KYLYK......',  '.................KYLYK......',  '.................KYLYK......',  '.................KYLYYYTKK..',  '.................KYYYYYTSSK.',  '..................KyyyyTSsK.',  '...................KKKKKKK..'],
};
// far arm (his other arm): drawn in shade and placed so it sticks out beyond the body,
// in front of the chest or behind the back, swinging opposite the near arm
// the other fist peeks out just ahead of the chest (behind the body, darker)
const FAR = {
  a: { at: 19, rows: ['......................KKKK..',  '.....................KuTssK.',  '.....................KuTstK.',  '......................KKKK..'] },
};
const TAIL_FLAP = [
  '..........................',
  '....Ku....................',
  '...Kuu....................',
  '...Kuuy...................',
  '...KKKK...................',
];
const LEGS = {
  run0: ['..........KPPK.KPPPK....', '.........KPPK...KPPPK...', '........KPPK.....KPPPK..', '.......KqPK.......KPPK..', '......KBBK........KBBBK.', '.....KBBbK........KBBbBK', '.....KKKK.........KKKKK.', '........................'],
  run1: ['...........KPPPPK.......', '...........KPPKPPK......', '..........KPPK.KPPK.....', '..........KqPK..KPPK....', '..........KBBK..KBBBK...', '.........KBBbK..KBBbBK..', '.........KKKK...KKKKK...', '........................'],
  run2: ['..........KPPPK.KPPK....', '.........KPPPK...KPPK...', '........KPPPK.....KPPK..', '.......KPPK.......KqPK..', '......KBBBK.......KBBK..', '.....KBBbBK.......KBbBK.', '.....KKKKK........KKKK..', '........................'],
  run3: ['...........KPPPPK.......', '..........KPPKKPPK......', '.........KPPK..KPPK.....', '........KPPK...KqPK.....', '........KBBK...KBBBK....', '.......KBBbK...KBBbBK...', '.......KKKK....KKKKK....', '........................'],
  jump: ['..........KPPPPPK.......', '.........KPPKKPPPK......', '........KPPK..KPPK......', '........KBBBK.KBBBK.....', '.......KBBbBK.KBbBBK....', '........KKKK...KKKK.....', '........................', '........................'],
  fall: ['..........KPPKKPPK......', '..........KPPK.KPPK.....', '..........KPPK..KPPK....', '..........KqPK..KPqK....', '..........KBBK..KBBBK...', '.........KBBbK..KBBbBK..', '.........KKKK...KKKKK...', '........................'],
};

// ---- unicorn (44 wide, faces left) ---------------------------------------
const UNI = [
  '......Ii....................................',
  '.......Ii...................................',
  '.......iIi..................................',
  '........iIi..oRR............................',
  '........KIiKRRrRR...........................',
  '.......KWWWWKRRrRRo.........................',
  '......KWWWWWWKrRRrRR........................',
  '.....KWWeEWWWWKrRRrRR.......................',
  '....KWWWEEWWWWWKmrRRrR......................',
  '...KWWWWWWWWWWWWKmrRRrR.....................',
  '..KWWWWWWWWWWWWWWKmrRRR.....................',
  '.KWWWWWWWWWwWWWWWWKmrRR.....................',
  'KNWWWWWWWWwwWWWWWWWKmrR.....................',
  'KNNWWWWWWwwKWWWWWWWWKmR.....................',
  '.KKwwwwwwKK.KWWWWWWWWKKKKKKKKKKKKKKK........',
  '..KKKKKKK....KWWWWWWWWWWWWWWWWWWWWWWKK......',
  '.............KWWWWWWWWWWWWWWWWWWWWWWWWK.....',
  '.............KwWWWWWWWWWWWWWWWWWWWWWWWWKrR..',
  '..............KwWWWWWWWWWWWWWWWWWWWWWWWKRRr.',
  '..............KwwWWWWWWWWWWWWWWWWWWWWWwKrRRr',
  '..............KvwwWWWWWWWWWWWWWWWWWWWwwKmrRR',
  '...............KvwwwwwwwwwwwwwwwwwwwwwK.mrRR',
  '................KvvwKKKvvvvvvvvvvKKvvwK..mrR',
  '................KWwK..KWWKKKKKKKWwK.KWwK..mR',
  '................KWwK..KWwK......KWwK.KWwK...',
  '................KWwK..KWwK......KWwK.KWwK...',
  '................KWwK..KWwK......KWwK.KWwK...',
  '................KwvK..KWwK......KWvK.KWvK...',
  '................KwvK..KwvK......KwvK.KwvK...',
  '................KkkK..KkkK......KkkK.KkkK...',
  '...............KkkkK.KkkkK.....KkkkK.KkkkK..',
];
// head lowered, mouth open, acid coming out
const UNI_PUKE_HEAD = {
  12: 'KNWWWWWWWWwwWWWWWWWKmrR.....................',
  13: 'AaNNWWWWWwwKWWWWWWWWKmR.....................',
  14: 'AAaKwwwwwwKK.KWWWWWWWWKKKKKKKKKKKKKKK.......',
  15: 'cAAaKKKKKK....KWWWWWWWWWWWWWWWWWWWWWWKK.....',
};

// ---- goblin (20 wide, faces left) --------------------------------------
const GOB = [
  '......KKKKKK........',
  '.....KFFfFFFK.......',
  '....KFFFFfFFFK......',
  '...KFFFFFFFFFFK.....',
  '..KKdFFFFFFFFdKK....',
  'KKQQKKKKKKKKKKQQKK..',
  'KQQOQQQQQQQQQQQOQQK.',
  '.KQQKQZKQQQZKQQKQK..',
  '..KKQQKKQQQQKKQQK...',
  '...KQQQQQQOQQQQQK...',
  '...KQNXNXNXNXNQQK...',
  '....KQNNNNNNNNQK....',
  '.....KOQQQQQQOK.....',
  '....KDDKOOOOKDDK....',
  '...KDDDDDDDDDDDDK...',
  '..KQDDlDDDDDlDDDQK..',
  '..KQKDDDDDDDDDDKQK..',
  '...K.KDDlDDlDDK.K...',
  '.....KDDDDDDDDK.....',
];
const GOB_LEGS = [
  ['.....KQQK..KQQK.....', '....KQQK....KQQK....', '...KQQK......KQQK...', '..KQQQK......KQQQK..', '..KKKK........KKKK..'],
  ['......KQQKKQQK......', '......KQQKKQQK......', '.....KQQK..KQQK.....', '....KQQQK..KQQQK....', '....KKKK....KKKK....'],
];

// ---- pickups / props ------------------------------------------------------
const JACKET = [
  '.......KKKKKK.......',
  '.....KKYYKKYYKK.....',
  '....KYYLYKTKYYYK....',
  '...KYLLYYKTKYYYYK...',
  '..KYLYYYYKTKYYYYyK..',
  '.KYLYYYYYKTKYYYYYyK.',
  'KYLYYKYYYKTKYYYKYyyK',
  'KYLYYKYYYKTKYYYKYyyK',
  'KYLYYKYYKTTTKYYKYyyK',
  'KYLYYKYYKTTTKYYKyyyK',
  'KYYYKKYYKTTTKYYKKyyK',
  'KSSKKYYYKTTTKYYyKKSK',
  '.KK.KYYYKTTTKYyyK.K.',
  '....KKKKKKKKKKKKK...',
  '....KYYYYKTKYYyyK...',
  '....KYLYYKTKYYyyK...',
  '....KYLYYKTKYYyyK...',
  '....KYLYYYKYYYyyK...',
  '....KYYYYYKYYyyyK...',
  '....KyYYYYKYYyyuK...',
  '....KyyyyyKyyyuuK...',
  '....KKKKKKKKKKKKK...',
];

function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

export function fromMap(rows, { flip = false, tint = null, w = null } = {}) {
  const width = w || Math.max(...rows.map((r) => r.length)), h = rows.length;
  const c = cv(width, h), x = c.getContext('2d');
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '.' || !PAL[ch]) continue;
      x.fillStyle = tint && ch !== 'K' ? tint : PAL[ch];
      x.fillRect(flip ? width - 1 - i : i, j, 1, 1);
    }
  });
  return c;
}

function overlay(base, top, at) {
  const out = base.map((r) => r.split(''));
  top.forEach((row, j) => {
    const y = at + j; if (!out[y]) out[y] = [];
    for (let i = 0; i < row.length; i++) if (row[i] !== '.') out[y][i] = row[i];
  });
  return out.map((r) => Array.from(r, (ch) => ch || '.').join(''));
}

function heroFrame(legsKey, near, far, flap) {
  const sh = (rows) => rows.map((r) => '..' + r);
  let rows = Array.from({ length: 38 }, () => '.'.repeat(28));
  if (far) rows = overlay(rows, FAR[far].rows, FAR[far].at);          // far arm first: the body covers its shoulder
  rows = overlay(rows, sh([...HEAD, ...BODY, ...LEGS[legsKey]]), 0);
  if (flap) rows = overlay(rows, TAIL_FLAP, 25);
  rows = overlay(rows, ARM[near], 17);
  return rows;
}

export function buildSprites() {
  const hero = {}, heroFlash = {};
  const frames = {
    run0: heroFrame('run0', 'a', null, false), run1: heroFrame('run1', 'a', null, true),
    run2: heroFrame('run2', 'b', 'a', false), run3: heroFrame('run3', 'b', 'a', true),
    jump: heroFrame('jump', 'a', null, true), fall: heroFrame('fall', 'b', 'a', true),
  };
  for (const [k, rows] of Object.entries(frames)) {
    hero[k] = fromMap(rows, { w: 28 });
    heroFlash[k] = fromMap(rows, { w: 28, tint: '#ffffff' });
  }
  const uniPuke = UNI.map((r, i) => UNI_PUKE_HEAD[i] || r);
  const uniIdle2 = UNI.map((r, i) => (i >= 17 && i <= 23 ? r.replace(/R(?=r?R*\.*$)/, 'r') : r));
  return {
    hero, heroFlash,
    face: fromMap(HEAD.slice(0, 15), { w: 24 }),
    ...buildBaddies(),
    unicorn: [fromMap(UNI), fromMap(uniIdle2)], unicornPuke: fromMap(uniPuke), unicornFlash: fromMap(UNI, { tint: '#ffffff' }),
    goblin: [fromMap([...GOB, ...GOB_LEGS[0]]), fromMap([...GOB, ...GOB_LEGS[1]])],
    goblinSquash: fromMap(['......KKKKKK........', '..KKKFFFfFFFKKK.....', 'KKQQQZKQQQZQQQKK....', 'KQQNXNXNXNXNQQQK....', '.KDDDDDDDDDDDDK.....', 'KQQK........KQQK....']),
    jacket: fromMap(JACKET), jacketGlow: fromMap(JACKET, { tint: '#fff7b0' }),
    crate: buildCrate(false), crateUsed: buildCrate(true),
    coin: [11, 9, 5, 2, 5, 9].map((w) => buildCoin(w)),
  };
}

// Bonus crate: a riveted chemical-hazard crate with a flashing "!" (16x16)
function buildCrate(used) {
  const c = cv(16, 16), x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, 16, 16);
  if (used) {
    x.fillStyle = '#5a5468'; x.fillRect(1, 1, 14, 14);
    x.fillStyle = '#7a7490'; x.fillRect(1, 1, 14, 1); x.fillRect(1, 1, 1, 14);
    x.fillStyle = '#3a3448'; x.fillRect(1, 14, 14, 1); x.fillRect(14, 1, 1, 14);
    x.fillStyle = '#2a2436'; x.fillRect(5, 6, 6, 1); x.fillRect(7, 4, 2, 7);
    return c;
  }
  for (let j = 1; j < 15; j++) for (let i = 1; i < 15; i++) {
    const edge = i < 3 || j < 3 || i > 12 || j > 12;
    if (edge) { x.fillStyle = ((i + j) >> 1) % 2 ? '#ffd21a' : '#111'; x.fillRect(i, j, 1, 1); }
  }
  x.fillStyle = '#2a1040'; x.fillRect(3, 3, 10, 10);
  x.fillStyle = '#3e1a5a'; x.fillRect(3, 3, 10, 1);
  for (const [i, j] of [[1, 1], [14, 1], [1, 14], [14, 14]]) { x.fillStyle = '#d0d0e0'; x.fillRect(i, j, 1, 1); }
  return c;
}
function buildCoin(w) {
  const c = cv(11, 11), x = c.getContext('2d'), o = Math.floor((11 - w) / 2);
  x.fillStyle = '#000'; x.fillRect(o, 1, w, 9); x.fillRect(o + 1, 0, Math.max(1, w - 2), 11);
  if (w > 2) {
    x.fillStyle = '#c88a00'; x.fillRect(o + 1, 1, w - 2, 9);
    x.fillStyle = '#ffd21a'; x.fillRect(o + 1, 1, w - 3, 8);
    x.fillStyle = '#fff3a0'; x.fillRect(o + 1, 1, w - 3, 1); x.fillRect(o + 1, 1, 1, 7);
    if (w >= 9) { x.fillStyle = '#8a4a00'; x.fillRect(o + 3, 3, 1, 5); x.fillRect(o + 6, 3, 1, 5); x.fillRect(o + 2, 4, 1, 1); x.fillRect(o + 5, 4, 1, 1); }
  }
  return c;
}

// ---- baddies by zone -------------------------------------------------------
const BAT = [
  ['K................K', 'KK..............KK', 'KVK....K..K....KVK', 'KVVK...KKKK...KVVK', '.KVVK.KVVVVK.KVVK.', '..KVVKVUVVUVKVVK..', '...KKKVVVVVVKKK...', '......KVJJVK......', '.......KVVK.......', '........KK........'],
  ['......K....K......', '......KKKKKK......', '.....KVVVVVVK.....', '....KVUVVVVUVK....', '..KKKVVVVVVVVKKK..', '.KVVVKVJJVVKVVVVK.', 'KVVVKK.KVVK.KKVVVK', 'KVVK....KK....KVVK', 'KVK............KVK', 'KK..............KK'],
];
const WING = [
  ['..........KK......', '........KKoRK.....', '......KKoRRRK.....', '....KKoRRRRK......', '...KoRRRRRK.......', '..KoRRRRrK........', '.KoRRRrrK.........', 'KoRRrrKK..........', 'KKKKKK............'],
  ['KKKKKK............', '.KoRRrKK..........', '..KoRRrrKK........', '...KoRRRrrKK......', '....KKoRRRrrK.....', '......KKoRRRrK....', '........KKKoRK....', '...........KKK....'],
];
const BRUTE = [
  '.........KKKKKKK............',
  '.......KK1111111KK..........',
  '......K11111111111K.........',
  '.....K1112111112111K........',
  '....K11KEK1111KEK111K.......',
  '....K11KKK1111KKK111K.......',
  '...K11111112211111111K......',
  '...K1KXK11111111KXK11K......',
  '...K1KXKKKKKKKKKKXK11K......',
  '....K11KNNNNNNNNK1111K......',
  '.....KK1111111111111K.......',
  '...KK2K11111111111112KK.....',
  '..K112K111111111111112KK....',
  '.K1122K1111111111111122K....',
  'K11K22K11111111111111222K...',
  'K11K2K1111111111111112K22K..',
  'K11KKK111111111111112K.K2K..',
  'K11K..K11111111111122K.K2K..',
  '.KK...KDDDDDDDDDDDDDDK..K2K.',
  '45....KDlDDDDDlDDDDDDK...K1K',
  '445...KDDDDDDDDDDDDDDK...K1K',
  '4445...KDDDlDDDDDlDDK.....KK',
  '.4445...KKKKKKKKKKKK........',
];
const BRUTE_LEGS = [
  ['..4445..K112K..K211K........', '...44K.K1122K..K2211K.......', '....KK.K112K....K211K.......', '......K1122K....K2211K......', '......K111K......K111K......', '.....K1111K......K1111K.....', '.....KKKKKK......KKKKKK.....'],
  ['..4445...K112KK211K.........', '...44K...K1122211K..........', '....KK...K112K211K..........', '........K1122K2211K.........', '........K111KK111K..........', '.......K1111KK1111K.........', '.......KKKKKKKKKKKK.........'],
];
const GHOUL = [
  '......KKKKKKKK......',
  '....KK66666666KK....',
  '...K666666666666K...',
  '..K66KKKK66KKKK66K..',
  '..K6KXXXXKKXXXXK6K..',
  '..K6KX99XKKX99XK6K..',
  '..K6KX9EXKKXE9XK6K..',
  '..K6KXXXXKKXXXXK6K..',
  '..K66KKKK66KKKK66K..',
  '..K666666776666666K.',
  '..K66KKKKKKKKKK66K..',
  '..K66KNXNNNNXNK66K..',
  '..K66KNNNNNNNNK66K..',
  '...K66KKKKKKKK66K...',
  '....KK66666666KK....',
  '...K7K66666666K7K...',
  '..K77K66666666K77K..',
  '.K667K66766766K766K.',
  '.K66KK66666666KK66K.',
  '.K66K.K666666K.K66K.',
  '..KK..KTTTTTTK..KK..',
  '......KTTTTTTK......',
  '......K66KK66K......',
  '......K66KK66K......',
  '.....K766KK667K.....',
  '.....KKKKKKKKKK.....',
];
function buildBaddies() {
  const puker = GOB.map((r) => r.replace(/F/g, 'V').replace(/f/g, 'v').replace(/d/g, '3').replace('QNXNXNXNXNQQ', 'QNUNUNUNUNQQ'));
  return {
    bat: BAT.map((m) => fromMap(m)), batFlash: fromMap(BAT[0], { tint: '#ffffff' }),
    wing: WING.map((m) => fromMap(m)),
    puker: [fromMap([...puker, ...GOB_LEGS[0]]), fromMap([...puker, ...GOB_LEGS[1]])],
    brute: [fromMap([...BRUTE, ...BRUTE_LEGS[0]]), fromMap([...BRUTE, ...BRUTE_LEGS[1]])],
    bruteDizzy: fromMap([...BRUTE, ...BRUTE_LEGS[0]], { tint: '#b8a8d8' }),
    ghoul: fromMap(GHOUL), ghoulSquash: fromMap(GHOUL.slice(0, 13).concat(['..KKKKKKKKKKKKKKK...'])),
  };
}
