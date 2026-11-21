// 5x7 arcade pixel font + pixel UI pieces (text images, buttons, logo).
// All UI text in the game is drawn with this, so everything shares one look.

const RAW = {
  A: '.###.|#...#|#...#|#####|#...#|#...#|#...#', B: '####.|#...#|#...#|####.|#...#|#...#|####.',
  C: '.###.|#...#|#....|#....|#....|#...#|.###.', D: '####.|#...#|#...#|#...#|#...#|#...#|####.',
  E: '#####|#....|#....|####.|#....|#....|#####', F: '#####|#....|#....|####.|#....|#....|#....',
  G: '.###.|#...#|#....|#.###|#...#|#...#|.####', H: '#...#|#...#|#...#|#####|#...#|#...#|#...#',
  I: '.###.|..#..|..#..|..#..|..#..|..#..|.###.', J: '..###|...#.|...#.|...#.|...#.|#..#.|.##..',
  K: '#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#', L: '#....|#....|#....|#....|#....|#....|#####',
  M: '#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#', N: '#...#|##..#|#.#.#|#..##|#...#|#...#|#...#',
  O: '.###.|#...#|#...#|#...#|#...#|#...#|.###.', P: '####.|#...#|#...#|####.|#....|#....|#....',
  Q: '.###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#', R: '####.|#...#|#...#|####.|#.#..|#..#.|#...#',
  S: '.####|#....|#....|.###.|....#|....#|####.', T: '#####|..#..|..#..|..#..|..#..|..#..|..#..',
  U: '#...#|#...#|#...#|#...#|#...#|#...#|.###.', V: '#...#|#...#|#...#|#...#|#...#|.#.#.|..#..',
  W: '#...#|#...#|#...#|#.#.#|#.#.#|#.#.#|.#.#.', X: '#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#',
  Y: '#...#|#...#|.#.#.|..#..|..#..|..#..|..#..', Z: '#####|....#|...#.|..#..|.#...|#....|#####',
  0: '.###.|#...#|#..##|#.#.#|##..#|#...#|.###.', 1: '..#..|.##..|..#..|..#..|..#..|..#..|.###.',
  2: '.###.|#...#|....#|...#.|..#..|.#...|#####', 3: '####.|....#|....#|.###.|....#|....#|####.',
  4: '...#.|..##.|.#.#.|#..#.|#####|...#.|...#.', 5: '#####|#....|####.|....#|....#|#...#|.###.',
  6: '.###.|#....|#....|####.|#...#|#...#|.###.', 7: '#####|....#|...#.|..#..|.#...|.#...|.#...',
  8: '.###.|#...#|#...#|.###.|#...#|#...#|.###.', 9: '.###.|#...#|#...#|.####|....#|....#|.###.',
  ' ': '.....|.....|.....|.....|.....|.....|.....', '!': '..#..|..#..|..#..|..#..|..#..|.....|..#..',
  '?': '.###.|#...#|....#|...#.|..#..|.....|..#..', '.': '.....|.....|.....|.....|.....|.....|..#..',
  ',': '.....|.....|.....|.....|.....|..#..|.#...', ':': '.....|..#..|.....|.....|.....|..#..|.....',
  '-': '.....|.....|.....|.###.|.....|.....|.....', '+': '.....|..#..|..#..|#####|..#..|..#..|.....',
  '/': '....#|....#|...#.|..#..|.#...|#....|#....', '#': '.#.#.|.#.#.|#####|.#.#.|#####|.#.#.|.#.#.',
  "'": '..#..|..#..|.....|.....|.....|.....|.....', '%': '##..#|##.#.|...#.|..#..|.#...|.#.##|#..##',
  '(': '...#.|..#..|.#...|.#...|.#...|..#..|...#.', ')': '.#...|..#..|...#.|...#.|...#.|..#..|.#...',
  '@': '.###.|#...#|#.###|#.#.#|#.###|#....|.###.', _: '.....|.....|.....|.....|.....|.....|#####',
  '&': '.##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#', '=': '.....|.....|#####|.....|#####|.....|.....',
  '<': '...#.|..#..|.#...|#....|.#...|..#..|...#.', '>': '.#...|..#..|...#.|....#|...#.|..#..|.#...',
  '*': '.....|....#|...##|#.##.|###..|.#...|.....',   // tick
  '~': '.....|.....|.#.#.|#.#.#|.#.#.|.....|.....',   // infinity
  '$': '.....|.#.#.|#####|#####|.###.|..#..|.....',   // heart
  '^': '..#..|.###.|#####|..#..|..#..|..#..|.....',   // up arrow
  '`': '.....|.....|.....|..#..|.....|.....|.....',   // middle dot
  '\u00a4': '..#..|#####|#.#.#|#####|#...#|#####|.#.#.',   // robot head, written as 🤖 in text
};
const GLYPH = {};
for (const [k, v] of Object.entries(RAW)) GLYPH[k] = v.split('|');

export const GH = 7, GW = 5, ADV = 6;

const BOT = /\u{1F916}/gu;   // 🤖 is two UTF-16 units; draw it as the one-cell robot glyph
export function measure(str, scale = 1) { return Math.max(0, String(str).replace(BOT, '\u00a4').length * ADV * scale - scale); }

// fill: colour, or array of colours = vertical gradient (one per glyph row)
export function drawText(ctx, str, x, y, o = {}) {
  const { scale = 1, fill = '#fff', outline = '#000', shadow = null, align = 'left', wave = null } = o;
  str = String(str).replace(BOT, '\u00a4').toUpperCase();
  const w = measure(str, scale);
  let x0 = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x);
  const rows = Array.isArray(fill) ? fill : null;
  const pass = (dx, dy, col, solid) => {
    let cx = x0;
    for (let i = 0; i < str.length; i++) {
      const g = GLYPH[str[i]] || GLYPH['?'];
      const wy = wave ? Math.round(wave(i)) : 0;
      for (let r = 0; r < GH; r++) {
        ctx.fillStyle = solid ? col : rows ? rows[Math.min(rows.length - 1, Math.floor((r * rows.length) / GH))] : fill;
        const line = g[r];
        for (let c = 0; c < GW; c++) if (line[c] === '#') ctx.fillRect(cx + c * scale + dx, y + wy + r * scale + dy, scale, scale);
      }
      cx += ADV * scale;
    }
  };
  if (shadow) pass(scale, scale + (outline ? 1 : 0), shadow, true);
  if (outline) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) pass(dx, dy, outline, true);
  pass(0, 0, null, false);
  return w;
}

export const GRAD = {
  gold: ['#fff7b0', '#ffe14a', '#ffd21a', '#f5b400', '#e09000', '#c06a00', '#8a4a00'],
  pink: ['#ffd0ec', '#ff8ad0', '#ff4fae', '#ff2d8a', '#e01a6e', '#b01058', '#7a0a40'],
  blue: ['#d0e0ff', '#8aaaff', '#5a7aff', '#3d5cf5', '#2e46d0', '#2234a0', '#16226a'],
  white: ['#ffffff', '#ffffff', '#e8e8f0', '#d0d0e0', '#b8b8cc', '#a0a0b8', '#8888a0'],
  green: ['#e0ffd0', '#a8ff8a', '#6aff5a', '#3ae03a', '#20b020', '#108010', '#065006'],
  red: ['#ffd0d0', '#ff8a8a', '#ff4a4a', '#e01a2a', '#b0101e', '#800a14', '#50060c'],
};

function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// A self-contained image of some text (for HTML overlays). Wraps to maxChars.
export function textImage(str, o = {}) {
  const scale = o.scale || 1, max = o.maxChars || 999, gap = o.lineGap ?? 3;
  const lines = [], paraOf = [];
  String(str).split('\n').forEach((para, pi) => {
    let line = '';
    for (const word of para.split(' ')) {
      if ((line + ' ' + word).trim().length > max) { lines.push(line); paraOf.push(pi); line = word; }
      else line = (line + ' ' + word).trim();
    }
    lines.push(line); paraOf.push(pi);
  });
  const pad = 2 + (o.shadow ? scale : 0);
  const lw = Math.max(1, ...lines.map((l) => measure(l, scale)));
  const lh = GH * scale + gap;
  const c = cv(lw + pad * 2, lines.length * lh - gap + pad * 2 + scale);
  const x = c.getContext('2d');
  const colors = o.paraColors ? paraOf.map((pi) => o.paraColors[pi]) : o.lineColors || [];   // paraColors: one colour per \n paragraph, however it wraps
  lines.forEach((l, i) => drawText(x, l, o.align === 'left' ? pad : c.width / 2, pad + i * lh,
    { ...o, align: o.align === 'left' ? 'left' : 'center', fill: colors[i] || o.fill || '#fff' }));
  return c;
}

// Chunky bevelled pixel button. Returns { up, down } canvases.
export function buttonImages(label, style = 'pink', minW = 0, tall = false) {
  const S = {
    pink: { face: '#ff2d7a', hi: '#ff8ab4', lo: '#a8104a', text: GRAD.white },
    gold: { face: '#ffd21a', hi: '#fff3a0', lo: '#b07800', text: ['#3a2000', '#3a2000', '#2a1600', '#2a1600', '#1a0e00', '#1a0e00', '#1a0e00'] },
    dark: { face: '#2a2140', hi: '#5a4b7e', lo: '#120c1e', text: GRAD.white },
    blue: { face: '#3d5cf5', hi: '#8aaaff', lo: '#1a2a90', text: GRAD.white },
  }[style];
  const tw = measure(label, 1), w = Math.max(tw + 16, minW - 2), h = tall ? 30 : 17;   // tall: the double-height main call to action
  const make = (pressed) => {
    const c = cv(w + 2, h + 2), x = c.getContext('2d'), o = pressed ? 1 : 0;
    x.fillStyle = '#000';
    if (!pressed) x.fillRect(2, 2, w, h);                 // drop shadow
    x.fillRect(o + 1, o, w - 2, h); x.fillRect(o, o + 1, w, h - 2); // outline w/ rounded corners
    x.fillStyle = S.face; x.fillRect(o + 1, o + 1, w - 2, h - 2);
    x.fillStyle = S.hi; x.fillRect(o + 2, o + 1, w - 4, 1); x.fillRect(o + 1, o + 2, 1, h - 4);
    x.fillStyle = S.lo; x.fillRect(o + 2, o + h - 2, w - 4, 1); x.fillRect(o + w - 2, o + 2, 1, h - 4);
    // dither the lower half for an old-school bevel
    for (let yy = Math.floor(h / 2); yy < h - 2; yy++) for (let xx = 2 + (yy % 2); xx < w - 2; xx += 2) x.fillRect(o + xx, o + yy, 1, 1);
    drawText(x, label, o + w / 2, o + Math.floor((h - 7) / 2), { fill: S.text, outline: style === 'gold' ? null : '#000', align: 'center' });
    return c;
  };
  return { up: make(false), down: make(true), w: w + 2, h: h + 2 };
}

// CJK subtitle in pixels: render small with the system font, then threshold to 1-bit
export function pixelCJK(str, size = 12, fill = '#ffe14a') {
  const c = cv(size * str.length + 4, size + 6), x = c.getContext('2d');
  x.font = `900 ${size}px "PingFang SC","Hiragino Sans","Noto Sans CJK SC","Microsoft YaHei",sans-serif`;
  x.textBaseline = 'top'; x.fillStyle = '#fff'; x.fillText(str, 2, 2);
  const d = x.getImageData(0, 0, c.width, c.height);
  const out = cv(c.width + 2, c.height + 2), ox = out.getContext('2d');
  const on = (i, j) => i >= 0 && j >= 0 && i < c.width && j < c.height && d.data[(j * c.width + i) * 4 + 3] > 110;
  for (let j = -1; j <= c.height; j++) for (let i = -1; i <= c.width; i++) {
    if (on(i, j)) continue;
    if (on(i - 1, j) || on(i + 1, j) || on(i, j - 1) || on(i, j + 1)) { ox.fillStyle = '#000'; ox.fillRect(i + 1, j + 1, 1, 1); }
  }
  for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) if (on(i, j)) { ox.fillStyle = j < c.height / 2 ? '#fff7b0' : fill; ox.fillRect(i + 1, j + 1, 1, 1); }
  return out;
}

// The FWAHBL logo block, with chunky 3D extrusion. Drawn per frame (letters wobble).
export function drawLogo(ctx, cx, y, t, cjk) {
  const lines = [
    { s: 'VOLLEBAK', scale: 2, fill: GRAD.gold, ext: '#7a4a00' },
    { s: 'FWAHBL', scale: 3, fill: GRAD.pink, ext: '#4a0626' },
    { s: 'JACKET', scale: 3, fill: GRAD.blue, ext: '#0c1450' },
  ];
  let yy = y;
  for (const [li, L] of lines.entries()) {
    const wave = (i) => Math.sin(t / 14 + i * 0.7 + li) * (L.scale > 2 ? 2 : 1);
    for (let d = 4; d >= 1; d--) drawText(ctx, L.s, cx + d, yy + d, { scale: L.scale, fill: L.ext, outline: null, align: 'center', wave });
    drawText(ctx, L.s, cx, yy, { scale: L.scale, fill: L.fill, outline: '#000', align: 'center', wave });
    yy += GH * L.scale + (L.scale > 2 ? 3 : 2);
  }
  if (cjk) ctx.drawImage(cjk, Math.round(cx - cjk.width / 2), yy);
  return yy + (cjk ? cjk.height : 0);
}
