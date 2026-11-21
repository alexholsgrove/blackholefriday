// Scenery for the three zones, generated as pixel-art tiles at load.
// World layout (y): gallery top 110, arcade wall 118..186, balustrade ..200,
// main deck 200, ledges 160, pit surface 214, world bottom 240.

const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
function cv(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function noise(seed) { let a = seed | 0; return () => ((a = (Math.imul(a, 1103515245) + 12345) | 0) >>> 8) / 16777216; }
function hex(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }

// vertical dithered gradient through colour stops [[y, '#rrggbb'], ...]
function ditherGradient(x, w, stops) {
  for (let i = 0; i < stops.length - 1; i++) {
    const [y0, c0] = stops[i], [y1, c1] = stops[i + 1];
    for (let y = y0; y < y1; y++) {
      const f = (y - y0) / (y1 - y0);
      for (let xx = 0; xx < w; xx++) {
        x.fillStyle = f * 16 > BAYER[y % 4][xx % 4] + 0.5 ? c1 : c0;
        x.fillRect(xx, y, 1, 1);
      }
    }
  }
}
function ditherRect(x, x0, y0, w, h, col, density) { // density 0..16
  x.fillStyle = col;
  for (let y = y0; y < y0 + h; y++) for (let xx = x0; xx < x0 + w; xx++) if (BAYER[y & 3][xx & 3] < density) x.fillRect(xx, y, 1, 1);
}
function blob(x, cx, cy, rw, rh, col) {
  x.fillStyle = col;
  for (let j = -rh; j <= rh; j++) { const half = Math.floor(rw * Math.sqrt(Math.max(0, 1 - (j * j) / (rh * rh)))); x.fillRect(Math.floor(cx - half), Math.floor(cy + j), half * 2, 1); }
}
function stoneTexture(x, x0, y0, w, h, cols, n, count) {
  for (let k = 0; k < count; k++) {
    const px = x0 + Math.floor(n() * w), py = y0 + Math.floor(n() * h);
    if (x.getImageData(px, py, 1, 1).data[3] === 0) continue;
    x.fillStyle = cols[Math.floor(n() * cols.length)]; x.fillRect(px, py, 1 + Math.floor(n() * 2), 1);
  }
}

// ---- arcade (gallery + wall + arches + balustrade), 96 wide, world y 96..200 --
function buildArcade(P, style) {
  if (style === 'bridge') return arcadeBridge(P);
  if (style === 'dungeon') return arcadeDungeon(P);
  if (style === 'volcano') return arcadeVolcano(P);
  if (style === 'castle') return arcadeCastle(P);
  const w = 96, top = 96, c = cv(w, 200 - top), x = c.getContext('2d'), n = noise(3 + style.length);
  const Y = (y) => y - top;
  // crenellations / railing
  x.fillStyle = P.dark;
  if (style === 'dungeon' || style === 'castle') { for (let i = 0; i < w; i += 12) x.fillRect(i, Y(style === 'castle' ? 98 : 102), 7, style === 'castle' ? 12 : 8); }
  else if (style === 'factory') { x.fillRect(0, Y(104), w, 1); for (let i = 0; i < w; i += 6) x.fillRect(i, Y(104), 1, 6); x.fillRect(0, Y(107), w, 1); }
  else if (style === 'volcano') { for (let i = 0; i < w; i += 7) x.fillRect(i, Y(105 - ((i * 7) % 4)), 4, 6); }
  else { for (let i = 0; i < w; i += 8) x.fillRect(i, Y(104), 3, 6); x.fillRect(0, Y(104), w, 2); }
  // gallery slab
  x.fillStyle = P.base; x.fillRect(0, Y(110), w, 8);
  x.fillStyle = P.hi; x.fillRect(0, Y(110), w, 1);
  x.fillStyle = P.deep; x.fillRect(0, Y(117), w, 1);
  for (let i = 0; i < w; i += 12) { x.fillStyle = P.deep; x.fillRect(i, Y(111), 1, 6); }
  if (style !== 'volcano') for (let i = 6; i < w; i += 16) { x.fillStyle = P.lamp; x.fillRect(i, Y(114), 2, 2); x.fillStyle = '#fff3c0'; x.fillRect(i, Y(114), 1, 1); }
  // wall
  x.fillStyle = P.wall; x.fillRect(0, Y(118), w, 68);
  if (style === 'factory') {          // riveted steel panels + cross-bracing
    for (let i = 0; i < w; i += 24) { x.fillStyle = P.deep; x.fillRect(i, Y(118), 1, 68); for (let yy = 122; yy < 186; yy += 8) { x.fillStyle = P.hi; x.fillRect(i + 3, Y(yy), 1, 1); x.fillRect(i + 20, Y(yy), 1, 1); } }
    x.fillStyle = P.dark; for (let k = 0; k < 68; k++) { x.fillRect(Math.floor((k / 68) * 48), Y(118 + k), 2, 1); x.fillRect(48 + Math.floor((k / 68) * 48), Y(185 - k), 2, 1); }
  }
  if (style === 'dungeon' || style === 'castle') {          // bricks
    for (let y = 118; y < 186; y += 5) for (let i = ((y / 5) % 2) * 6; i < w; i += 12) { x.fillStyle = P.deep; x.fillRect(i, Y(y), 1, 5); x.fillRect(0, Y(y), w, 1); }
  }
  // arches (the factory has square openings instead)
  if (style === 'factory') { for (const ax of [8, 56]) { x.clearRect(ax, Y(132), 32, 50); x.fillStyle = P.hi; x.fillRect(ax - 1, Y(131), 34, 1); x.fillStyle = P.deep; x.fillRect(ax - 1, Y(182), 34, 1); } }
  else for (const ax of [10, 58]) {
    const r = 15, aTop = 130;
    for (let yy = aTop; yy < 186; yy++) {
      let half = r;
      if (yy < aTop + r) { const d = aTop + r - yy; half = Math.floor(Math.sqrt(r * r - d * d)); }
      x.clearRect(ax + r - half, Y(yy), half * 2, 1);
    }
    x.fillStyle = P.hi;
    for (let a = 0; a <= 180; a += 5) { const rad = (a * Math.PI) / 180; x.fillRect(Math.round(ax + r - Math.cos(rad) * (r + 1)), Math.round(Y(aTop + r) - Math.sin(rad) * (r + 1)), 1, 1); }
    x.fillStyle = P.deep; x.fillRect(ax + r - 1, Y(aTop - 3), 3, 3); // keystone
  }
  if (style === 'volcano') { // glowing cracks
    for (let k = 0; k < 6; k++) { let cx = Math.floor(n() * w), cy = 120 + Math.floor(n() * 60); x.fillStyle = k % 2 ? '#ff7a1a' : '#ffb03a'; for (let s = 0; s < 8; s++) { x.fillRect(cx, Y(cy), 1, 1); cx += n() > 0.5 ? 1 : 0; cy += 1; } }
  }
  stoneTexture(x, 0, Y(118), w, 68, [P.deep, P.base], n, 160);
  // balustrade
  x.fillStyle = P.base; x.fillRect(0, Y(186), w, 2);
  x.fillStyle = P.deep; x.fillRect(0, Y(188), w, 1);
  for (let i = 2; i < w; i += 6) { x.fillStyle = P.dark; x.fillRect(i, Y(189), 3, 11); x.fillStyle = P.base; x.fillRect(i, Y(189), 1, 11); }
  return c;
}

function buildDeck(P, style) {
  const w = 96, c = cv(w, 40), x = c.getContext('2d'), n = noise(5);
  x.fillStyle = P.base; x.fillRect(0, 0, w, 10);
  x.fillStyle = P.hi; x.fillRect(0, 0, w, 1);
  x.fillStyle = P.top; x.fillRect(0, 1, w, 1);
  for (let i = 0; i < w; i += 12) { x.fillStyle = P.deep; x.fillRect(i, 2, 1, 7); }
  x.fillStyle = P.deep; x.fillRect(0, 9, w, 1);
  if (style !== 'volcano') for (let i = 10; i < w; i += 24) { x.fillStyle = P.lamp; x.fillRect(i, 5, 2, 2); x.fillStyle = '#fff3c0'; x.fillRect(i, 5, 1, 1); }
  else for (let i = 4; i < w; i += 19) { x.fillStyle = '#ff7a1a'; x.fillRect(i, 3, 3, 1); x.fillRect(i + 1, 4, 1, 3); }
  x.fillStyle = P.dark;
  for (const sx of [0, 48]) { x.fillRect(sx, 10, 12, 30); x.fillRect(sx, 10, 48, 3); }
  x.fillStyle = P.base; for (const sx of [0, 48]) x.fillRect(sx, 10, 2, 30);
  stoneTexture(x, 0, 0, w, 40, [P.deep], n, 40);
  return c;
}

// pit: 8 pre-cycled frames (palette cycling, like the old days)
function buildPit(kind) {
  const pal = kind === 'water'
    ? ['#06101e', '#0a1a30', '#10284a', '#183a66', '#2a5488', '#8ab0d8', '#2a5488', '#10284a']
    : kind === 'acid'
    ? ['#5a0a48', '#8a1070', '#c21fa0', '#ff4fd8', '#ff8ae6', '#ffd0f4', '#ff4fd8', '#c21fa0']
    : ['#5a1008', '#8a1a08', '#c4300a', '#ff5a1a', '#ff8a2a', '#ffc04a', '#ff8a2a', '#e2400e'];
  const w = 128, h = 26, n = noise(kind === 'acid' ? 11 : kind === 'water' ? 23 : 17), idx = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const v = Math.sin(i / 7 + j / 3) + Math.sin(i / 13 - j / 5) + n() * 0.9;
    idx.push(Math.floor(((v + 3) / 6.9) * 8 + j / 6) % 8);
  }
  return pal.map((_, f) => {
    const c = cv(w, h), x = c.getContext('2d');
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const k = idx[j * w + i];
      x.fillStyle = j < 2 ? pal[(k + f) % 8 < 4 ? 4 : 5] : pal[(k + f) % 8];
      if (j > 18) x.fillStyle = pal[Math.max(0, ((k + f) % 8) - 3)];
      x.fillRect(i, j, 1, 1);
    }
    return c;
  });
}

// ---- backdrops -----------------------------------------------------------
function skyBridge() {
  const c = cv(320, 240), x = c.getContext('2d');
  ditherGradient(x, 320, [[0, '#0e0a1a'], [40, '#1a1430'], [90, '#2e2448'], [140, '#47365f'], [175, '#6a2a48'], [210, '#9a2a2a'], [240, '#c0401a']]);
  const n = noise(7);
  for (let k = 0; k < 22; k++) { const cx = n() * 320, cy = 10 + n() * 110, rw = 18 + n() * 50, rh = 3 + n() * 7; blob(x, cx, cy, rw, rh, '#3c3060'); blob(x, cx + 3, cy - 2, rw * 0.8, rh * 0.6, n() > 0.5 ? '#5a4b7e' : '#4a3d6a'); }
  return c;
}
function skyVolcano() {
  const c = cv(320, 240), x = c.getContext('2d');
  ditherGradient(x, 320, [[0, '#1a0806'], [50, '#3a0e08'], [110, '#7a1e0a'], [160, '#c4400e'], [200, '#ff7a1a'], [240, '#ffb03a']]);
  const n = noise(9);
  for (let k = 0; k < 18; k++) { const cx = n() * 320, cy = 10 + n() * 90, rw = 20 + n() * 60, rh = 4 + n() * 8; blob(x, cx, cy, rw, rh, '#2a0c08'); blob(x, cx + 4, cy + 2, rw * 0.7, rh * 0.5, '#4a1a10'); }
  return c;
}
function skyDungeon() {   // back wall of a vast hall: bricks with tall windows
  const c = cv(320, 240), x = c.getContext('2d');
  ditherGradient(x, 320, [[0, '#0c0c18'], [120, '#1a1a2c'], [240, '#262640']]);
  for (let y = 0; y < 240; y += 6) for (let i = ((y / 6) % 2) * 8; i < 320; i += 16) { x.fillStyle = '#10101e'; x.fillRect(i, y, 1, 6); x.fillRect(0, y, 320, 1); }
  for (const wx of [40, 200]) {
    x.fillStyle = '#3a2a5a'; x.fillRect(wx, 30, 40, 90); blob(x, wx + 20, 30, 20, 20, '#3a2a5a');
    ditherGradient2(x, wx + 2, 32, 36, 86, '#5a3a7e', '#2a1a40');
    x.fillStyle = '#10101e'; x.fillRect(wx + 19, 14, 2, 106); x.fillRect(wx, 70, 40, 2);
  }
  return c;
}
function ditherGradient2(x, x0, y0, w, h, c0, c1) { for (let y = 0; y < h; y++) for (let i = 0; i < w; i++) { x.fillStyle = (y / h) * 16 > BAYER[y & 3][i & 3] ? c1 : c0; x.fillRect(x0 + i, y0 + y, 1, 1); } }

function farMountains(col, glow, seed, volcano) {
  const w = 480, h = 140, c = cv(w, h), x = c.getContext('2d'), n = noise(seed);
  let y = 70; const heights = [];
  for (let i = 0; i < w; i++) { y += (n() - 0.5) * 4; y = Math.max(30, Math.min(100, y)); heights.push(y); }
  // wrap seamlessly
  for (let i = 0; i < 40; i++) heights[w - 40 + i] = heights[w - 40 + i] * (1 - i / 40) + heights[i] * (i / 40);
  if (volcano) for (let i = 140; i < 340; i++) { const d = Math.abs(i - 240); heights[i] = Math.min(heights[i], 22 + d * 0.55); }
  for (let i = 0; i < w; i++) { x.fillStyle = col; x.fillRect(i, Math.floor(heights[i]), 1, h); }
  // lava rivers
  for (let k = 0; k < 7; k++) { let cx = Math.floor(n() * w), cy = Math.floor(heights[cx]) + 2; x.fillStyle = glow; for (let s = 0; s < 30; s++) { x.fillRect(cx, cy, 1, 1); cx += Math.floor(n() * 3) - 1; cy += 1; if (cy >= h) break; } }
  if (volcano) { x.fillStyle = glow; x.fillRect(232, 22, 16, 3); for (let s = 0; s < 50; s++) { x.fillRect(236 + Math.round(Math.sin(s / 4) * 3) - Math.floor(s / 3), 24 + s, 2, 1); x.fillRect(244 + Math.round(Math.sin(s / 5) * 2) + Math.floor(s / 3), 24 + s, 2, 1); } }
  return c;
}
function midSpires(col, lit, seed) {
  const w = 384, h = 130, c = cv(w, h), x = c.getContext('2d'), n = noise(seed);
  let px = 0;
  while (px < w - 10) {
    const bw = 6 + Math.floor(n() * 16), top = 20 + Math.floor(n() * 70);
    x.fillStyle = col; x.fillRect(px, top, bw, h - top);
    if (n() > 0.4) for (let j = 0; j < 14; j++) { const hw = Math.floor((14 - j) / 3); x.fillRect(px + Math.floor(bw / 2) - hw, top - 14 + j, hw * 2 + 1, 1); }
    if (n() > 0.5) { x.fillStyle = lit; x.fillRect(px + 2, top + 8, 1, 2); x.fillRect(px + bw - 3, top + 16, 1, 2); }
    px += bw + Math.floor(n() * 6);
  }
  return c;
}
function midRocks(col, glow, seed) {
  const w = 384, h = 130, c = cv(w, h), x = c.getContext('2d'), n = noise(seed);
  let y = 60;
  for (let i = 0; i < w; i++) { y += (n() - 0.5) * 9; y = Math.max(20, Math.min(110, y)); const yy = Math.floor(y); x.fillStyle = col; x.fillRect(i, yy, 1, h - yy); if (n() > 0.97) { x.fillStyle = glow; x.fillRect(i, yy + 3, 1, 6); } }
  return c;
}
function midDungeon(seed) {  // pillars with torches + unicorn statues on plinths
  const w = 384, h = 150, c = cv(w, h), x = c.getContext('2d');
  for (const px of [20, 116, 212, 308]) {
    x.fillStyle = '#2c2c44'; x.fillRect(px, 10, 18, h); x.fillStyle = '#3e3e5c'; x.fillRect(px, 10, 3, h); x.fillStyle = '#1c1c2e'; x.fillRect(px + 15, 10, 3, h);
    x.fillStyle = '#3e3e5c'; x.fillRect(px - 3, 6, 24, 5);
    x.fillStyle = '#6a4a2a'; x.fillRect(px + 7, 40, 4, 6); x.fillRect(px + 5, 38, 8, 2);  // torch holder (flame drawn live)
  }
  for (const sx of [62, 254]) {           // statue
    x.fillStyle = '#4a3a6a'; x.fillRect(sx, 110, 30, 40); x.fillStyle = '#5e4a86'; x.fillRect(sx, 110, 30, 2);
    const S = ['......#.......', '.....##.......', '....####......', '...######.....', '..########....', '.##########...', '###########...', '..#########...', '..##########..', '...##...##.##.', '...##...##..#.', '...##...##....'];
    S.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === '#') { x.fillStyle = i < 5 ? '#8a6ab0' : '#6a4a96'; x.fillRect(sx + 4 + i * 2, 86 + j * 2, 2, 2); } });
  }
  return c;
}
function nearPillars(col, hi, seed, gap) {
  const w = 512, h = 240, c = cv(w, h), x = c.getContext('2d'), n = noise(seed);
  for (let px = 30; px < w; px += gap + Math.floor(n() * 60)) {
    const pw = 14 + Math.floor(n() * 10), top = 60 + Math.floor(n() * 50);
    x.fillStyle = col; x.fillRect(px, top, pw, h - top); x.fillStyle = hi; x.fillRect(px, top, 1, h - top); x.fillRect(px - 2, top, pw + 4, 3);
    ditherRect(x, px + pw - 5, top + 3, 5, h - top - 3, '#000', 6);
  }
  return c;
}
function foreground(kind, seed) {
  const w = 640, h = 240, c = cv(w, h), x = c.getContext('2d'), n = noise(seed);
  if (kind === 'chains') {
    for (let k = 0; k < 5; k++) {
      const cx = Math.floor(30 + n() * (w - 60)), len = 30 + Math.floor(n() * 70);
      for (let j = 0; j < len; j += 4) { x.fillStyle = '#05040a'; x.fillRect(cx - 1, j, 3, 3); x.fillStyle = '#2a2436'; x.fillRect(cx, j + 1, 1, 1); }
      if (n() > 0.5) { x.fillStyle = '#05040a'; x.fillRect(cx - 6, len, 13, 16); x.fillStyle = '#1a1424'; for (let i = -5; i <= 5; i += 3) x.fillRect(cx + i, len + 1, 1, 14); }
    }
  } else {
    for (let k = 0; k < 6; k++) { const cx = Math.floor(n() * w); blob(x, cx, 236, 14 + n() * 20, 8 + n() * 10, '#05040a'); }
  }
  // bottom silhouette rubble
  for (let i = 0; i < w; i += 2) { x.fillStyle = '#05040a'; x.fillRect(i, 234 + Math.floor(Math.sin(i / 9) * 2 + n() * 2), 2, 10); }
  return c;
}

function skyFactory() {
  const c = cv(320, 240), x = c.getContext('2d');
  ditherGradient(x, 320, [[0, '#0a100e'], [60, '#14201c'], [120, '#22342c'], [170, '#3a4a2e'], [210, '#5a5a2a'], [240, '#7a6a2a']]);
  const n = noise(31);
  for (let k = 0; k < 16; k++) { const cx = n() * 320, cy = 20 + n() * 90, rw = 24 + n() * 60, rh = 5 + n() * 8; blob(x, cx, cy, rw, rh, '#1c2a24'); blob(x, cx + 5, cy + 2, rw * 0.7, rh * 0.5, '#2a3a32'); }
  return c;
}
function farFactory() {
  const w = 480, h = 150, c = cv(w, h), x = c.getContext('2d'), n = noise(41);
  let px = 0;
  while (px < w - 10) {
    const bw = 20 + Math.floor(n() * 40), top = 40 + Math.floor(n() * 60);
    x.fillStyle = '#16201c'; x.fillRect(px, top, bw, h - top);
    if (n() > 0.4) { const sx = px + Math.floor(n() * (bw - 6)); x.fillRect(sx, top - 40, 6, 40); x.fillStyle = '#ff5a1a'; x.fillRect(sx, top - 40, 6, 1); }
    x.fillStyle = '#8aff6a';
    for (let wy = top + 6; wy < h - 6; wy += 8) for (let wx = px + 3; wx < px + bw - 3; wx += 6) if (n() > 0.75) x.fillRect(wx, wy, 2, 2);
    px += bw + Math.floor(n() * 10);
  }
  // a big NEUROKINETIC-style skull sign on the tallest block
  x.fillStyle = '#000'; x.fillRect(200, 30, 26, 26); x.fillStyle = '#2a3440'; x.fillRect(201, 31, 24, 24);
  x.fillStyle = '#ffd21a'; for (let j = 0; j < 16; j++) { x.fillRect(213 - (j >> 1), 34 + j, (j >> 1) * 2 + 1, 1); x.fillRect(213 - ((15 - j) >> 1), 37 + j, ((15 - j) >> 1) * 2 + 1, 1); }
  x.fillStyle = '#e8e8f0'; x.fillRect(210, 41, 7, 6); x.fillStyle = '#000'; x.fillRect(211, 43, 2, 2); x.fillRect(214, 43, 2, 2); x.fillRect(212, 46, 3, 1);
  return c;
}
// tiny pixel signs
function bioSign(x, sx, sy) {              // yellow board, black triangle, biohazard blob
  x.fillStyle = '#000'; x.fillRect(sx - 1, sy - 1, 16, 15); x.fillStyle = '#ffd21a'; x.fillRect(sx, sy, 14, 13);
  x.fillStyle = '#000'; for (let j = 0; j < 9; j++) x.fillRect(sx + 7 - (j >> 1) - 1, sy + 2 + j, (j >> 1) * 2 + 2, 1);
  x.fillStyle = '#ffd21a'; for (let j = 2; j < 8; j++) x.fillRect(sx + 7 - (j >> 1), sy + 3 + j, (j >> 1) * 2, 1);
  x.fillStyle = '#000'; x.fillRect(sx + 6, sy + 6, 2, 2); x.fillRect(sx + 5, sy + 8, 1, 1); x.fillRect(sx + 8, sy + 8, 1, 1); x.fillRect(sx + 6, sy + 9, 2, 1);
}
function breachSign(x, sx, sy) {           // red BREACH panel: pixel 'text' lines
  x.fillStyle = '#000'; x.fillRect(sx - 1, sy - 1, 18, 10); x.fillStyle = '#c0102a'; x.fillRect(sx, sy, 16, 8);
  x.fillStyle = '#ffb0c0'; for (let i = 0; i < 13; i += 2) x.fillRect(sx + 2 + i, sy + 2, 1, 1 + ((i * 7) % 3 > 0 ? 1 : 0)); x.fillRect(sx + 2, sy + 5, 12, 1);
}
function hazard(x, x0, y0, w, h) { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) { x.fillStyle = ((i + j) >> 2) % 2 ? '#ffd21a' : '#111'; x.fillRect(x0 + i, y0 + j, 1, 1); } }
function steelPipe(x, x0, y0, len, vertical, t = 6) {
  const cols = ['#a8b4c4', '#7a8898', '#4e5a6a', '#2a3440'];
  x.fillStyle = '#000'; vertical ? x.fillRect(x0 - 1, y0, t + 2, len) : x.fillRect(x0, y0 - 1, len, t + 2);
  for (let i = 0; i < t; i++) { x.fillStyle = cols[Math.min(3, Math.floor((i / t) * 4))]; vertical ? x.fillRect(x0 + i, y0, 1, len) : x.fillRect(x0, y0 + i, len, 1); }
  for (let k = 10; k < len - 4; k += 26) { x.fillStyle = '#000'; vertical ? x.fillRect(x0 - 2, y0 + k, t + 4, 4) : x.fillRect(x0 + k, y0 - 2, 4, t + 4); x.fillStyle = '#8a96a6'; vertical ? x.fillRect(x0 - 1, y0 + k + 1, t + 2, 2) : x.fillRect(x0 + k + 1, y0 - 1, 2, t + 2); }
}
// a giant glass containment tank of pink acid (optionally cracked and leaking)
function glassTank(x, tx, top, tw, bottom, cracked, n) {
  const th = bottom - top;
  // steel cap with railing
  x.fillStyle = '#000'; x.fillRect(tx - 4, top - 10, tw + 8, 12);
  x.fillStyle = '#5a6878'; x.fillRect(tx - 3, top - 9, tw + 6, 10); x.fillStyle = '#9aa8b8'; x.fillRect(tx - 3, top - 9, tw + 6, 1); x.fillStyle = '#2a3440'; x.fillRect(tx - 3, top, tw + 6, 1);
  for (let i = 0; i < tw + 6; i += 5) { x.fillStyle = '#c8d4e0'; x.fillRect(tx - 3 + i, top - 5, 1, 1); }
  x.fillStyle = '#2a3440'; x.fillRect(tx - 2, top - 16, tw + 4, 1); for (let i = 0; i <= tw + 4; i += 6) x.fillRect(tx - 2 + i, top - 16, 1, 6);
  // glass body
  x.fillStyle = '#000'; x.fillRect(tx - 1, top, tw + 2, th);
  const liquid = top + Math.floor(th * 0.28);
  for (let i = 0; i < tw; i++) {
    const shade = i < 3 ? '#a8d0f0' : i < tw * 0.18 ? '#6a9ac8' : i > tw - 4 ? '#1a2a44' : i > tw * 0.7 ? '#2e4a70' : '#3e6290';
    x.fillStyle = shade; x.fillRect(tx + i, top, 1, liquid - top);
    const pink = i < 3 ? '#ffb0e8' : i < tw * 0.18 ? '#ff6ad8' : i > tw - 4 ? '#7a0a5a' : i > tw * 0.7 ? '#a8168a' : '#d82ab4';
    x.fillStyle = pink; x.fillRect(tx + i, liquid, 1, bottom - liquid);
  }
  x.fillStyle = '#ffd0f4'; x.fillRect(tx, liquid, tw, 1);
  for (const sx of [Math.floor(tw * 0.3), Math.floor(tw * 0.55)]) { x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(tx + sx, top + 2, 1, th - 4); }   // glass glints
  for (let k = 0; k < 10; k++) { x.fillStyle = '#ffd0f4'; x.fillRect(tx + 4 + Math.floor(n() * (tw - 8)), liquid + 4 + Math.floor(n() * (bottom - liquid - 8)), 1 + Math.floor(n() * 2), 1 + Math.floor(n() * 2)); }   // bubbles
  // steel bands with bolts
  for (const by of [top + Math.floor(th * 0.5), bottom - 4]) { x.fillStyle = '#000'; x.fillRect(tx - 2, by - 1, tw + 4, 5); x.fillStyle = '#5a6878'; x.fillRect(tx - 1, by, tw + 2, 3); for (let i = 2; i < tw; i += 6) { x.fillStyle = '#c8d4e0'; x.fillRect(tx + i, by + 1, 1, 1); } }
  // base plinth with hazard stripes
  x.fillStyle = '#000'; x.fillRect(tx - 6, bottom, tw + 12, 16); x.fillStyle = '#3a4654'; x.fillRect(tx - 5, bottom + 1, tw + 10, 14);
  hazard(x, tx - 3, bottom + 8, tw + 6, 5);
  if (cracked) {
    const cx = tx + Math.floor(tw * 0.42), cy = top + Math.floor(th * 0.38);
    x.fillStyle = '#000';
    for (let r = 0; r < 8; r++) { const a = (r / 8) * Math.PI * 2 + 0.3, l = 5 + (r % 3) * 3; for (let d = 0; d < l; d++) x.fillRect(Math.round(cx + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d * 0.9), 1, 1); }
    x.fillRect(cx - 1, cy - 1, 3, 3);
    // the leak: a pink stream down the glass and over the plinth into a pool
    for (let y = cy + 2; y < bottom + 16; y++) { const w = 2 + ((y * 7) % 5 === 0 ? 1 : 0); x.fillStyle = '#ff4fd8'; x.fillRect(cx - 1 + ((y >> 3) % 2), y, w, 1); x.fillStyle = '#ffd0f4'; if (y % 6 === 0) x.fillRect(cx, y, 1, 1); }
    for (let k = 0; k < 6; k++) { x.fillStyle = '#ff4fd8'; x.fillRect(cx + 3 + k * 2, cy + 3 + k * 3, 1, 2); }
  }
}
function midTanks() {
  const w = 384, h = 150, c = cv(w, h), x = c.getContext('2d'), n = noise(77);
  // girders + catwalk behind everything
  x.fillStyle = '#141c22'; x.fillRect(0, 22, w, 4); for (let i = 0; i < w; i += 16) x.fillRect(i, 22, 2, 128);
  for (let i = 0; i < w; i += 32) for (let k = 0; k < 28; k++) { x.fillRect(i + k, 26 + k, 1, 1); x.fillRect(i + 31 - k, 26 + k, 1, 1); }
  // pipe runs at two heights, joining the tanks
  steelPipe(x, 0, 48, w, false, 6); steelPipe(x, 0, 112, w, false, 5);
  steelPipe(x, 108, 0, 112, true, 6); steelPipe(x, 352, 30, 90, true, 5);
  // two giant tanks, the first one cracked and leaking
  glassTank(x, 26, 30, 62, 128, true, n);
  glassTank(x, 232, 40, 48, 128, false, n);
  bioSign(x, 94, 60); breachSign(x, 93, 76);
  bioSign(x, 286, 66);
  // control console: STATUS UNSTABLE
  x.fillStyle = '#000'; x.fillRect(150, 92, 34, 40); x.fillStyle = '#4a5664'; x.fillRect(151, 93, 32, 38); x.fillStyle = '#7a8898'; x.fillRect(151, 93, 32, 1);
  x.fillStyle = '#000'; x.fillRect(155, 97, 24, 14); x.fillStyle = '#3a0618'; x.fillRect(156, 98, 22, 12);
  x.fillStyle = '#ff2d7a'; x.fillRect(158, 100, 12, 1); x.fillRect(158, 103, 18, 1); x.fillRect(158, 106, 9, 1);
  for (const [bx, col] of [[156, '#ff2040'], [162, '#ffd21a'], [168, '#5fff6a'], [174, '#ffd21a']]) { x.fillStyle = '#000'; x.fillRect(bx - 1, 115, 5, 5); x.fillStyle = col; x.fillRect(bx, 116, 3, 3); }
  x.fillStyle = '#e8e8f0'; x.fillRect(164, 124, 6, 4); x.fillStyle = '#000'; x.fillRect(165, 125, 1, 1); x.fillRect(168, 125, 1, 1);   // skull plate
  hazard(x, 0, 140, w, 4);
  return c;
}
function nearFactory() {               // canisters, drums and gas bottles, seen through the factory wall openings
  const w = 512, h = 240, c = cv(w, h), x = c.getContext('2d'), n = noise(88);
  for (let px = 10; px < w; px += 60 + Math.floor(n() * 50)) {
    const kind = Math.floor(n() * 3);
    if (kind === 0) {                  // stack of oil drums
      for (const [dx, dy] of [[0, 0], [17, 0], [8, -20]]) {
        const bx = px + dx, by = 182 + dy - 20, yellow = n() < 0.5;
        x.fillStyle = '#000'; x.fillRect(bx - 1, by - 1, 16, 22);
        for (let i = 0; i < 14; i++) { x.fillStyle = yellow ? (i < 3 ? '#ffe86a' : i > 10 ? '#8a6a00' : '#d8a800') : (i < 3 ? '#8ab0e0' : i > 10 ? '#1a2a5a' : '#3a5aa0'); x.fillRect(bx + i, by, 1, 20); }
        x.fillStyle = '#000'; x.fillRect(bx, by + 5, 14, 1); x.fillRect(bx, by + 14, 14, 1);
        if (yellow) { x.fillRect(bx + 5, by + 8, 4, 4); x.fillStyle = '#d8a800'; x.fillRect(bx + 6, by + 9, 2, 2); }
        else hazard(x, bx + 2, by + 7, 10, 5);
      }
    } else if (kind === 1) {           // tall gas cylinders chained together
      for (let k = 0; k < 3; k++) { const bx = px + k * 9; x.fillStyle = '#000'; x.fillRect(bx - 1, 138, 9, 46); x.fillStyle = ['#5fae3a', '#c0c8d8', '#d02a3c'][k]; x.fillRect(bx, 140, 7, 44); x.fillStyle = 'rgba(255,255,255,0.4)'; x.fillRect(bx + 1, 141, 1, 40); x.fillStyle = '#2a3440'; x.fillRect(bx + 2, 134, 3, 6); }
      x.fillStyle = '#05040a'; x.fillRect(px - 2, 158, 30, 1);
    } else {                           // tall pipe tower rising above the gallery with a valve wheel
      steelPipe(x, px, 30, 154, true, 8); steelPipe(x, px + 14, 60, 124, true, 5);
      x.fillStyle = '#000'; x.fillRect(px - 4, 60, 16, 16); x.fillStyle = '#d02a3c'; x.fillRect(px - 3, 61, 14, 14); x.fillStyle = '#000'; x.fillRect(px + 3, 61, 2, 14); x.fillRect(px - 3, 67, 14, 2);
      x.fillStyle = '#ff4fd8'; for (let y = 76; y < 96; y += 4) x.fillRect(px + 9, y, 1, 2);   // weeping joint
    }
  }
  return c;
}
function skyCastle() {
  const c = cv(320, 240), x = c.getContext('2d');
  ditherGradient(x, 320, [[0, '#05060e'], [60, '#0c1022'], [130, '#1a2040'], [190, '#2a2c4e'], [240, '#3a3450']]);
  blob(x, 250, 46, 16, 16, '#e8e4c8'); blob(x, 245, 42, 15, 15, '#fffbe6'); blob(x, 254, 40, 3, 3, '#d8d0b0'); blob(x, 244, 50, 2, 2, '#d8d0b0');
  const n = noise(51);
  for (let k = 0; k < 18; k++) { const cx = n() * 320, cy = 10 + n() * 100, rw = 20 + n() * 60, rh = 4 + n() * 7; blob(x, cx, cy, rw, rh, '#141830'); blob(x, cx + 4, cy - 2, rw * 0.7, rh * 0.5, '#20264a'); }
  return c;
}
function farCastle() {
  const w = 480, h = 150, c = cv(w, h), x = c.getContext('2d'), n = noise(61);
  x.fillStyle = '#0e1022';
  x.fillRect(0, 110, w, 40);
  for (const [tx, tw, th] of [[60, 26, 90], [130, 40, 120], [190, 22, 80], [300, 30, 105], [380, 50, 130], [440, 20, 70]]) {
    x.fillRect(tx, h - th, tw, th);
    for (let i = 0; i < tw; i += 6) x.fillRect(tx + i, h - th - 5, 4, 5);
    x.fillStyle = '#ffd04a'; if (n() > 0.3) x.fillRect(tx + Math.floor(tw / 2) - 1, h - th + 14, 2, 4); x.fillStyle = '#0e1022';
  }
  // a giant blue figure on a throne in the distance
  x.fillStyle = '#1a2a6a'; blob(x, 250, 70, 12, 13, '#1a2a6a'); x.fillRect(238, 80, 24, 40);
  x.fillStyle = '#ff8a1a'; x.fillRect(244, 66, 3, 3); x.fillRect(253, 66, 3, 3);
  return c;
}
function midCastle() {
  const w = 384, h = 130, c = cv(w, h), x = c.getContext('2d');
  x.fillStyle = '#181a30'; x.fillRect(0, 60, w, 70);
  for (let i = 0; i < w; i += 14) x.fillRect(i, 52, 9, 8);
  for (const bx of [40, 140, 240, 330]) {            // goblin army banners
    x.fillStyle = '#3a2a1a'; x.fillRect(bx, 30, 2, 40);
    x.fillStyle = '#a01828'; x.fillRect(bx + 2, 32, 16, 22); x.fillRect(bx + 2, 54, 6, 4); x.fillRect(bx + 12, 54, 6, 4);
    x.fillStyle = '#5fae3a'; x.fillRect(bx + 7, 38, 6, 6); x.fillStyle = '#000'; x.fillRect(bx + 8, 40, 1, 1); x.fillRect(bx + 11, 40, 1, 1);
  }
  return c;
}

export function buildZones() {
  const bridgeP = { base: '#3d3156', hi: '#6e5d93', top: '#54457a', deep: '#1b142b', dark: '#2a2140', wall: '#2a2140', lamp: '#ff9a3a' };
  const dungeonP = { base: '#4a4a62', hi: '#7a7a9a', top: '#5c5c78', deep: '#1e1e2e', dark: '#30304a', wall: '#2c2c42', lamp: '#ffb04a' };
  const factoryP = { base: '#4a5450', hi: '#8a9890', top: '#5e6a64', deep: '#1a201e', dark: '#2a3230', wall: '#252c2a', lamp: '#8aff6a' };
  const castleP = { base: '#4a4e64', hi: '#8a8eaa', top: '#5c6078', deep: '#16182a', dark: '#2a2c42', wall: '#24263a', lamp: '#ffd04a' };
  const volcanoP = { base: '#2a2224', hi: '#5a4440', top: '#3a2c2c', deep: '#0e0a0a', dark: '#1a1414', wall: '#1e1818', lamp: '#ff7a1a' };
  return [
    { name: 'THE HELL BRIDGE', style: 'bridge', P: bridgeP, sky: skyBridge(), far: farMountains('#241a36', '#ff5a1a', 21, false), farY: 70,
      mid: midSpires('#2a1d3a', '#ff8a2a', 99), midY: 90, near: nearPillars('#1a1228', '#2e2244', 5, 170),
      arcade: buildArcade(bridgeP, 'bridge'), deck: deckStyled(bridgeP, 'bridge'), pit: pitFire(), pitUp: 16, haze: true, fg: foreground('chains', 3),
      particles: 'embers', lightning: true, arcadeTop: 36, chain: '#2a2436',
      pitName: 'PIT: HELLFIRE', blurb: 'Pointed gothic arches with skull keystones and hell-glow, and the skyline rises and falls: a tall bell tower, a gatehouse, a stubby turret. Acid pipes drip from the gallery. Flames lick up out of the lava pit.' },
    { name: 'THE DUNGEON', style: 'dungeon', P: dungeonP, sky: skyDungeon(), far: null, farY: 0,
      mid: midDungeon(4), midY: 70, near: nearDungeon(),
      arcade: buildArcade(dungeonP, 'dungeon'), deck: deckStyled(dungeonP, 'dungeon'), pit: pitSpikes(), pitUp: 14, fg: foreground('chains', 8),
      particles: 'dust', torches: true, wallTorches: [[147, 143], [339, 143]], arcadeTop: 36, chain: '#3a3a52',
      pitName: 'PIT: IRON SPIKES', blurb: 'No arches and no acid: a cauldron of burning tar on the gallery pours through a murder-hole and leaves flaming tar slicks. The vaulted ceiling drops low in places. Barred cells, an iron-bound door, a chained skeleton, wall torches. The pits are a bed of spikes over bones.' },
    { name: 'THE VOLCANO WASTES', style: 'volcano', P: volcanoP, sky: skyVolcano(), far: farMountains('#2a0c0a', '#ff7a1a', 33, true), farY: 50, volcano: true,
      mid: midRocks('#160a08', '#ff5a1a', 41), midY: 100, near: nearVolcano(),
      arcade: buildArcade(volcanoP, 'volcano'), deck: deckStyled(volcanoP, 'volcano'), pit: pitMagma(), haze: true, lavaFalls: [[141, 60], [330, 76]], arcadeTop: 36, fg: foreground('rocks', 12),
      particles: 'ash', chain: '#3a2a24',
      pitName: 'PIT: MAGMA', blurb: 'Outdoors, running on bare rock: open sky, free-standing basalt towers of very different heights with lava pouring off the tallest. Unicorns stand on rock pinnacles; lava drips from overhanging spires. Floating basalt slabs. The pit is magma with black crust.' },
    { name: 'THE ACID FACTORY', style: 'factory', P: factoryP, sky: skyFactory(), far: farFactory(), farY: 40,
      mid: midTanks(), midY: 62, near: nearFactory(),
      arcade: buildArcade(factoryP, 'factory'), deck: deckStyled(factoryP, 'factory'), pit: buildPit('acid'), haze: true, fg: foreground('chains', 14),
      particles: 'steam', chain: '#4a5450',
      pitName: 'PIT: ACID', blurb: 'Pipes, tanks and acid as before, with a diamond-plate steel floor on braced girders, steel I-beam platforms, ledges on cables with amber beacons.' },
    { name: 'THE CASTLE', style: 'castle', P: castleP, sky: skyCastle(), far: farCastle(), farY: 30, lightning: true,
      mid: midCastle(), midY: 70, near: nearCastle(),
      arcade: buildArcade(castleP, 'castle'), deck: deckStyled(castleP, 'castle'), pit: pitMoat(), pitUp: 4, fg: foreground('rocks', 16),
      particles: 'rain', arcadeTop: 36, chain: '#3a3e58',
      pitName: 'PIT: THE MOAT', blurb: 'A keep, a half-height curtain wall and a cone-roofed turret break up the battlements. Boiling oil from cauldrons instead of acid. Glowing windows, portcullis, shields (one with a gold V), goblin banners, ivy, wooden platforms. A crocodile surfaces in the moat.' },
  ];
}

// ===========================================================================
// Per-level character: each level gets its own wall, pit, deck and near layer
// (only the Hell Bridge keeps arches, now pointed gothic ones).
// ===========================================================================
const TOP = 36, YY = (y) => y - TOP;   // arcades now reach up to world y 36 so walls can rise in places
const BONE = '#d8d0b8', BONE_D = '#8a8470';
function px(x, cx, cy, rows, cols) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const k = r[i]; if (k !== '.' && cols[k]) { x.fillStyle = cols[k]; x.fillRect(cx + i, cy + j, 1, 1); } } }); }
function skull(x, cx, cy, col = BONE) {
  px(x, cx, cy, ['.###.', '#####', '#o#o#', '##.##', '.#d#.'], { '#': col, o: '#05040a', d: BONE_D });
}
function gallerySlab(x, P, w, lampEvery = 16) {
  x.fillStyle = P.base; x.fillRect(0, YY(110), w, 8);
  x.fillStyle = P.hi; x.fillRect(0, YY(110), w, 1);
  x.fillStyle = P.deep; x.fillRect(0, YY(117), w, 1);
  for (let i = 0; i < w; i += 12) { x.fillStyle = P.deep; x.fillRect(i, YY(111), 1, 6); }
  if (lampEvery) for (let i = 6; i < w; i += lampEvery) { x.fillStyle = P.lamp; x.fillRect(i, YY(114), 2, 2); x.fillStyle = '#fff3c0'; x.fillRect(i, YY(114), 1, 1); }
}
function balustrade(x, P, w) {
  x.fillStyle = P.base; x.fillRect(0, YY(186), w, 2);
  x.fillStyle = P.deep; x.fillRect(0, YY(188), w, 1);
  for (let i = 2; i < w; i += 6) { x.fillStyle = P.dark; x.fillRect(i, YY(189), 3, 11); x.fillStyle = P.base; x.fillRect(i, YY(189), 1, 11); }
}
// coursed stone blocks with a lit top edge, so the wall reads as masonry
function masonry(x, y0, h, w, P, bw, bh, n) {
  for (let y = y0, row = 0; y < y0 + h; y += bh, row++) {
    x.fillStyle = P.deep; x.fillRect(0, y, w, 1);
    let i = row % 2 ? Math.floor(bw / 2) : 0;
    while (i < w) {
      const bwi = bw + Math.floor(n() * 7) - 3;
      x.fillStyle = P.deep; x.fillRect(i, y, 1, Math.min(bh, y0 + h - y));
      x.fillStyle = P.top; x.fillRect(i + 1, y + 1, Math.min(bwi - 2, w - i - 1), 1);
      if (n() < 0.25) { x.fillStyle = P.dark; x.fillRect(i + 2, y + 2, Math.max(1, Math.min(bwi - 4, w - i - 3)), Math.max(1, bh - 3)); }
      i += bwi;
    }
  }
}

// ---- 1. Hell Bridge: pointed gothic arches of mixed widths, skull keystones, hellglow
function bridgeBase(P) {
  const w = 192, c = cv(w, 164), x = c.getContext('2d'), n = noise(101);
  x.fillStyle = P.dark; for (let i = 0; i < w; i += 8) x.fillRect(i, YY(104), 3, 6); x.fillRect(0, YY(104), w, 2);
  for (let i = 20; i < w; i += 48) { x.fillStyle = P.dark; x.fillRect(i - 1, YY(100), 7, 6); skull(x, i, YY(96)); }
  gallerySlab(x, P, w, 16);
  x.fillStyle = P.wall; x.fillRect(0, YY(118), w, 68);
  masonry(x, YY(118), 68, w, P, 14, 6, n);
  // [centre, half width]: the apex of a pointed arch sits sqrt(3) * r above the springing
  for (const [cx, r] of [[22, 12], [72, 19], [122, 9], [165, 15]]) {
    const apex = 125, sy = apex + Math.round(Math.sqrt(3) * r);
    for (let yy = apex; yy < 186; yy++) {
      const d = sy - yy, half = d > 0 ? Math.floor(Math.sqrt(4 * r * r - d * d) - r) : r;
      if (half <= 0) continue;
      x.clearRect(cx - half, YY(yy), half * 2, 1);
      x.fillStyle = P.hi; x.fillRect(cx - half - 1, YY(yy), 1, 1); x.fillStyle = P.deep; x.fillRect(cx + half, YY(yy), 1, 1);
      if (yy > 170) for (let i = -half; i < half; i++) if (BAYER[yy & 3][(cx + i) & 3] < (yy - 170) / 2) { x.fillStyle = yy > 180 ? '#ff7a1a' : '#a8200e'; x.fillRect(cx + i, YY(yy), 1, 1); }  // hell glow
    }
    x.fillStyle = P.hi; x.fillRect(cx - r - 3, YY(sy), 3, 2); x.fillRect(cx + r, YY(sy), 3, 2);   // impost blocks
    x.fillStyle = P.dark; x.fillRect(cx - 3, YY(apex - 6), 7, 7); skull(x, cx - 2, YY(apex - 5));    // skull keystone
  }
  // hanging iron cage between the big arches
  x.fillStyle = '#05040a'; x.fillRect(100, YY(118), 1, 14); x.fillRect(96, YY(132), 9, 1); for (let i = 96; i <= 104; i += 2) x.fillRect(i, YY(132), 1, 10); x.fillRect(96, YY(142), 9, 1);
  skull(x, 98, YY(136));
  stoneTexture(x, 0, YY(118), w, 68, [P.deep, P.base], n, 200);
  balustrade(x, P, w);
  return c;
}

// ---- 2. Dungeon: big blocks, barred cells, an iron-bound door, a chained skeleton, torches
function dungeonBase(P) {
  const w = 192, c = cv(w, 164), x = c.getContext('2d'), n = noise(202);
  // iron spear railing
  x.fillStyle = '#121218'; x.fillRect(0, YY(107), w, 2); x.fillRect(0, YY(103), w, 1);
  for (let i = 1; i < w; i += 4) { x.fillRect(i, YY(100), 1, 8); x.fillRect(i - 1, YY(101), 3, 1); }
  gallerySlab(x, P, w, 0);
  x.fillStyle = '#121218'; for (let i = 8; i < w; i += 32) { x.fillRect(i, YY(116), 3, 5); x.fillRect(i + 1, YY(121), 1, 4); }  // iron hooks
  x.fillStyle = P.wall; x.fillRect(0, YY(118), w, 68);
  masonry(x, YY(118), 68, w, P, 22, 10, n);
  // damp streaks + green slime
  for (const sx of [44, 90, 133, 181]) for (let yy = 118; yy < 118 + 20 + (sx % 30); yy++) if ((yy + sx) % 3) { x.fillStyle = yy < 124 ? '#3e7a3a' : '#22223a'; x.fillRect(sx, YY(yy), 1, 1); }
  // barred cell window (open: the hanging cages behind show through)
  const cell = (cx, cy, cw, ch) => {
    x.fillStyle = P.hi; x.fillRect(cx - 2, cy - 2, cw + 4, ch + 4); x.fillStyle = P.deep; x.fillRect(cx - 1, cy - 1, cw + 2, ch + 2);
    x.clearRect(cx, cy, cw, ch);
    for (let i = 1; i < cw; i += 4) { x.fillStyle = '#0a0a10'; x.fillRect(cx + i, cy, 2, ch); x.fillStyle = '#6a6a80'; x.fillRect(cx + i, cy, 1, ch); }
    x.fillStyle = '#0a0a10'; x.fillRect(cx, cy + 4, cw, 2); x.fillStyle = '#6a6a80'; x.fillRect(cx, cy + 4, cw, 1);
  };
  cell(12, YY(128), 22, 20);
  x.fillStyle = BONE; x.fillRect(17, YY(140), 2, 1); x.fillRect(16, YY(141), 4, 2); x.fillRect(21, YY(139), 2, 1); x.fillRect(21, YY(140), 3, 2);   // bony fingers on the bars
  cell(160, YY(126), 14, 12);
  // heavy iron-bound door with a lintel
  x.fillStyle = P.hi; x.fillRect(48, YY(138), 34, 4); x.fillStyle = P.deep; x.fillRect(48, YY(141), 34, 1);
  for (let i = 0; i < 28; i++) { x.fillStyle = i % 6 === 0 ? '#2a180a' : i % 6 < 2 ? '#7a5030' : '#5a3a1e'; x.fillRect(51 + i, YY(142), 1, 44); }
  for (const by of [148, 162, 178]) { x.fillStyle = '#18181e'; x.fillRect(51, YY(by), 28, 3); x.fillStyle = '#5a5a6a'; for (let i = 53; i < 79; i += 5) x.fillRect(i, YY(by + 1), 1, 1); }
  x.fillStyle = '#0a0a10'; x.fillRect(60, YY(152), 10, 6); x.fillStyle = '#6a6a80'; for (let i = 61; i < 70; i += 3) x.fillRect(i, YY(152), 1, 6);   // spy hatch
  x.fillStyle = '#18181e'; x.fillRect(73, YY(166), 4, 4); x.fillStyle = '#8a8aa0'; x.fillRect(74, YY(167), 2, 2);   // ring
  // skeleton chained to the wall
  for (const cx of [98, 120]) { for (let yy = 124; yy < 134; yy += 2) { x.fillStyle = '#0a0a10'; x.fillRect(cx, YY(yy), 2, 2); x.fillStyle = '#5a5a6a'; x.fillRect(cx, YY(yy), 1, 1); } x.fillStyle = '#18181e'; x.fillRect(cx - 1, YY(134), 4, 3); }
  x.fillStyle = BONE;
  for (let k = 0; k < 9; k++) { x.fillRect(100 + k, YY(136 + Math.floor(k * 0.7)), 1, 1); x.fillRect(120 - k, YY(136 + Math.floor(k * 0.7)), 1, 1); }  // arms
  skull(x, 107, YY(137));
  x.fillRect(109, YY(142), 1, 16);                                   // spine
  for (const ry of [145, 147, 149, 151]) x.fillRect(106, YY(ry), 7, 1);
  x.fillStyle = BONE_D; x.fillRect(109, YY(145), 1, 7);
  x.fillStyle = BONE; x.fillRect(106, YY(158), 7, 2);                // pelvis
  for (let k = 0; k < 14; k++) { x.fillRect(107 - (k > 9 ? 1 : 0), YY(160 + k), 1, 1); x.fillRect(111 + (k > 9 ? 1 : 0), YY(160 + k), 1, 1); }
  x.fillRect(104, YY(174), 3, 1); x.fillRect(112, YY(174), 3, 1);
  // a skull pile in the corner and a torch sconce (flame drawn live)
  for (const [sx, sy] of [[136, 180], [142, 180], [139, 176], [148, 181]]) skull(x, sx, YY(sy));
  x.fillStyle = '#2a1a0e'; x.fillRect(144, YY(150), 6, 2); x.fillRect(146, YY(152), 2, 6); x.fillStyle = '#5a3a1e'; x.fillRect(145, YY(147), 4, 3);
  stoneTexture(x, 0, YY(118), w, 68, [P.deep, P.base], n, 220);
  // low wall with iron bars in place of the balustrade
  x.fillStyle = P.base; x.fillRect(0, YY(186), w, 3); x.fillStyle = P.hi; x.fillRect(0, YY(186), w, 1);
  for (let i = 1; i < w; i += 5) { x.fillStyle = '#0a0a10'; x.fillRect(i, YY(189), 2, 11); x.fillStyle = '#4a4a5c'; x.fillRect(i, YY(189), 1, 11); }
  x.fillStyle = '#0a0a10'; x.fillRect(0, YY(194), w, 1);
  return c;
}

// ---- 5. Castle: tall battlements, lit lancet windows, a portcullis, shields, banners, ivy
function castleBase(P) {
  const w = 192, c = cv(w, 164), x = c.getContext('2d'), n = noise(505);
  for (let i = 0; i < w; i += 12) { x.fillStyle = P.dark; x.fillRect(i, YY(97), 8, 13); x.fillStyle = P.hi; x.fillRect(i, YY(97), 8, 1); x.fillStyle = '#05040a'; x.fillRect(i + 3, YY(101), 2, 6); }
  gallerySlab(x, P, w, 32);
  x.fillStyle = P.wall; x.fillRect(0, YY(118), w, 68);
  masonry(x, YY(118), 68, w, P, 18, 8, n);
  // lancet windows, warm light inside
  for (const wx of [14, 130]) {
    x.fillStyle = P.hi; x.fillRect(wx - 2, YY(126), 12, 34);
    for (let yy = 128; yy < 158; yy++) { const half = yy < 132 ? yy - 128 : 4; x.fillStyle = yy < 140 ? '#ffd04a' : '#ff9a3a'; x.fillRect(wx + 4 - half, YY(yy), half * 2, 1); }
    x.fillStyle = '#05040a'; x.fillRect(wx + 3, YY(130), 2, 28); x.fillRect(wx, YY(142), 8, 1);
    x.fillStyle = P.top; x.fillRect(wx - 3, YY(160), 14, 2);
  }
  // heraldic shields: a gold V, and a goblin-red chevron
  const shield = (sx, sy, field, charge) => {
    for (let j = 0; j < 16; j++) { const half = j < 10 ? 7 : 7 - (j - 9); x.fillStyle = '#05040a'; x.fillRect(sx + 7 - half - 1, YY(sy + j), half * 2 + 2, 1); x.fillStyle = field; x.fillRect(sx + 7 - half, YY(sy + j), half * 2, 1); }
    x.fillStyle = '#ffd04a';
    if (charge === 'V') for (let j = 0; j < 9; j++) { x.fillRect(sx + 2 + (j >> 1), YY(sy + 3 + j), 2, 1); x.fillRect(sx + 10 - (j >> 1), YY(sy + 3 + j), 2, 1); }
    else for (let j = 0; j < 6; j++) { x.fillRect(sx + 7 - j - 1, YY(sy + 5 + j), 2, 1); x.fillRect(sx + 6 + j, YY(sy + 5 + j), 2, 1); }
  };
  shield(36, 130, '#1a2a6a', 'V'); shield(150, 132, '#a01828', 'chev');
  // portcullis gateway (open grille, the towers behind show through)
  x.fillStyle = P.hi; x.fillRect(58, YY(140), 36, 4); x.fillStyle = P.deep; x.fillRect(60, YY(144), 32, 1);
  x.clearRect(62, YY(145), 28, 41);
  for (let i = 62; i < 90; i += 5) { x.fillStyle = '#0a0a10'; x.fillRect(i, YY(145), 2, 34); x.fillStyle = '#5a5e74'; x.fillRect(i, YY(145), 1, 34); x.fillStyle = '#0a0a10'; x.fillRect(i, YY(179), 2, 3); x.fillRect(i, YY(182), 1, 2); }
  for (let yy = 150; yy < 178; yy += 6) { x.fillStyle = '#0a0a10'; x.fillRect(62, YY(yy), 28, 2); x.fillStyle = '#5a5e74'; x.fillRect(62, YY(yy), 28, 1); }
  // long goblin banners hanging from the gallery
  for (const bx of [104, 174]) {
    x.fillStyle = '#3a2a1a'; x.fillRect(bx - 2, YY(118), 16, 2);
    for (let yy = 120; yy < 164; yy++) { const notch = yy > 156 ? yy - 156 : 0; x.fillStyle = '#1a1424'; x.fillRect(bx, YY(yy), 12, 1); x.fillStyle = '#7a1420'; x.fillRect(bx + 1, YY(yy), 10, 1); if (notch) x.clearRect(bx + 6 - notch, YY(yy), notch * 2, 1); }
    x.fillStyle = '#ffd04a'; x.fillRect(bx + 2, YY(122), 8, 1); x.fillRect(bx + 2, YY(152), 8, 1);
    x.fillStyle = '#5fae3a'; x.fillRect(bx + 3, YY(132), 6, 7); x.fillStyle = '#000'; x.fillRect(bx + 4, YY(134), 1, 1); x.fillRect(bx + 7, YY(134), 1, 1); x.fillRect(bx + 4, YY(137), 4, 1);
  }
  // ivy climbing the wall
  for (const [ix, ih] of [[2, 40], [48, 26], [118, 34], [184, 30]]) {
    let vx = ix;
    for (let yy = 186; yy > 186 - ih; yy--) { vx += (n() > 0.5 ? 1 : -1) * (n() > 0.6 ? 1 : 0); x.fillStyle = '#1e3a1e'; x.fillRect(vx, YY(yy), 1, 1); if (n() > 0.55) { x.fillStyle = n() > 0.5 ? '#3e7a3a' : '#2a5a2a'; x.fillRect(vx + (n() > 0.5 ? 1 : -2), YY(yy), 2, 2); } }
  }
  stoneTexture(x, 0, YY(118), w, 68, [P.deep, P.base], n, 160);
  // crenellated parapet instead of a balustrade
  x.fillStyle = P.base; x.fillRect(0, YY(190), w, 10); x.fillStyle = P.hi; x.fillRect(0, YY(190), w, 1);
  for (let i = 0; i < w; i += 16) { x.fillStyle = P.base; x.fillRect(i, YY(185), 10, 5); x.fillStyle = P.hi; x.fillRect(i, YY(185), 10, 1); x.fillStyle = P.deep; x.fillRect(i + 10, YY(185), 1, 15); }
  return c;
}

// ---- walls that rise and fall: towers and raised sections behind the gallery ------
// (the gallery itself stays at y 110 everywhere: unicorns stand on it)
function section(x, P, x0, w, top, cap, n) {
  x.fillStyle = P.wall; x.fillRect(x0, YY(top), w, 112 - top);
  for (let y = top + 4, row = 0; y < 110; y += 6, row++) { x.fillStyle = P.deep; x.fillRect(x0, YY(y), w, 1); for (let i = x0 + (row % 2) * 7; i < x0 + w; i += 14) x.fillRect(i, YY(y), 1, 6); }
  stoneTexture(x, x0, YY(top), w, 110 - top, [P.deep, P.base], n, Math.floor(w * (110 - top) / 40));
  x.fillStyle = P.hi; x.fillRect(x0, YY(top), 1, 110 - top); x.fillStyle = P.deep; x.fillRect(x0 + w - 2, YY(top), 2, 110 - top);
  if (cap === 'crenel') for (let i = x0; i < x0 + w - 3; i += 8) { x.fillStyle = P.dark; x.fillRect(i, YY(top - 6), 5, 6); x.fillStyle = P.hi; x.fillRect(i, YY(top - 6), 5, 1); }
  if (cap === 'roof') for (let j = 0; j < 22; j++) { const half = Math.floor((j / 22) * (w / 2 + 4)); x.fillStyle = j % 3 ? '#1a1424' : '#2a2034'; x.fillRect(x0 + (w >> 1) - half, YY(top - 22 + j), half * 2, 1); }
  if (cap === 'spire') { for (let j = 0; j < 30; j++) { const half = Math.max(1, Math.floor((j / 30) * (w / 2))); x.fillStyle = P.dark; x.fillRect(x0 + (w >> 1) - half, YY(top - 30 + j), half * 2, 1); } x.fillStyle = P.hi; x.fillRect(x0 + (w >> 1), YY(top - 34), 1, 5); }
  if (cap === 'slope') for (let i = 0; i < w; i++) { x.fillStyle = P.dark; x.fillRect(x0 + i, YY(top - Math.floor(i / 3)), 1, Math.floor(i / 3)); }
}
function glowWindow(x, cx, top, h, col1, col2, pointed) {
  for (let yy = top; yy < top + h; yy++) { const half = pointed && yy < top + 4 ? yy - top : 4; x.fillStyle = '#05040a'; x.fillRect(cx - half - 1, YY(yy), half * 2 + 2, 1); x.fillStyle = yy < top + h / 2 ? col1 : col2; x.fillRect(cx - half, YY(yy), half * 2, 1); }
  x.fillStyle = '#05040a'; x.fillRect(cx - 1, YY(top + 2), 1, h - 2); x.fillRect(cx - 4, YY(top + (h >> 1)), 8, 1);
}
function compose(base, P, draw) {         // two copies of the 192 tile, raised sections behind
  const c = cv(384, 164), x = c.getContext('2d');
  draw(x);
  x.drawImage(base, 0, 0); x.drawImage(base, 192, 0);
  return [c, x];
}
function arcadeBridge(P) {
  const n = noise(141);
  const [c, x] = compose(bridgeBase(P), P, (x) => {
    section(x, P, 118, 44, 50, 'spire', n);              // tall bell tower
    glowWindow(x, 140, 64, 18, '#ff7a1a', '#a8200e', true);
    x.fillStyle = '#05040a'; x.fillRect(132, YY(86), 16, 12); x.fillStyle = '#8a6a2a'; blob(x, 140, 92, 5, 4, '#8a6a2a'); x.fillStyle = '#c8a050'; x.fillRect(138, YY(90), 2, 2);   // the bell
    section(x, P, 250, 70, 76, 'crenel', n);             // gatehouse, half height
    glowWindow(x, 270, 84, 12, '#ff7a1a', '#a8200e', true); glowWindow(x, 300, 84, 12, '#ff7a1a', '#a8200e', true);
    section(x, P, 20, 28, 88, 'crenel', n);              // stubby turret
  });
  return c;
}
function arcadeDungeon(P) {
  const n = noise(241);
  const [c, x] = compose(dungeonBase(P), P, (x) => {
    section(x, P, 0, 96, 36, 'flat', n);                  // the vault comes right down here...
    for (let yy = 40; yy < 100; yy += 4) { x.fillStyle = '#05040a'; x.fillRect(46, YY(yy), 3, 3); x.fillStyle = '#4a4a5c'; x.fillRect(47, YY(yy + 1), 1, 1); }
    x.fillStyle = '#05040a'; x.fillRect(42, YY(100), 11, 4);
    x.fillStyle = P.hi; x.fillRect(14, YY(52), 18, 2); x.fillRect(66, YY(52), 18, 2);   // high barred slits with moonlight
    for (const sx of [16, 68]) { x.fillStyle = '#3a2a5a'; x.fillRect(sx, YY(54), 14, 20); x.fillStyle = '#0a0a10'; for (let i = sx + 2; i < sx + 14; i += 4) x.fillRect(i, YY(54), 2, 20); }
    section(x, P, 200, 60, 74, 'slope', n);               // ...a lower buttress...
    section(x, P, 300, 40, 58, 'flat', n);                // ...and a mid pier with a banner of chains
    for (const cx of [306, 318, 330]) for (let yy = 60; yy < 60 + 12 + (cx % 7) * 3; yy += 4) { x.fillStyle = '#05040a'; x.fillRect(cx, YY(yy), 3, 3); x.fillStyle = '#4a4a5c'; x.fillRect(cx + 1, YY(yy + 1), 1, 1); }
  });
  // the second skeleton is someone else's problem now: empty manacles and a rat instead
  x.fillStyle = P.wall; x.fillRect(192 + 99, YY(135), 24, 42); x.fillStyle = P.deep; for (const yy of [138, 148, 158, 168]) x.fillRect(192 + 99, YY(yy), 24, 1); x.fillRect(192 + 110, YY(138), 1, 10); x.fillRect(192 + 104, YY(148), 1, 10); x.fillRect(192 + 115, YY(158), 1, 10);
  for (const cx of [192 + 98, 192 + 120]) { x.fillStyle = '#18181e'; x.fillRect(cx - 1, YY(134), 4, 3); x.fillRect(cx, YY(137), 2, 4); }
  x.fillStyle = BONE; x.fillRect(192 + 104, YY(184), 6, 1); x.fillRect(192 + 113, YY(185), 2, 1);
  x.fillStyle = '#3a3440'; x.fillRect(192 + 108, YY(181), 6, 3); x.fillRect(192 + 113, YY(180), 2, 2); x.fillRect(192 + 102, YY(183), 6, 1); x.fillStyle = '#ff2040'; x.fillRect(192 + 114, YY(180), 1, 1);
  return c;
}
function arcadeCastle(P) {
  const n = noise(541);
  const [c, x] = compose(castleBase(P), P, (x) => {
    section(x, P, 20, 64, 40, 'crenel', n);               // the keep
    glowWindow(x, 40, 52, 16, '#ffd04a', '#ff9a3a', true); glowWindow(x, 64, 52, 16, '#ffd04a', '#ff9a3a', true); glowWindow(x, 52, 76, 12, '#ffd04a', '#ff9a3a', true);
    section(x, P, 210, 90, 78, 'crenel', n);              // curtain wall at half height
    for (const sx of [226, 252, 278]) { x.fillStyle = '#05040a'; x.fillRect(sx, YY(86), 2, 12); x.fillRect(sx - 2, YY(91), 6, 1); }
    section(x, P, 330, 30, 56, 'roof', n);                // a turret with a cone roof
    glowWindow(x, 345, 66, 10, '#ffd04a', '#ff9a3a', false);
  });
  return c;
}

// ---- 3. Volcano Wastes: outdoors. Open sky, free-standing rock towers and outcrops of
// very different heights, lava pouring off the tallest; you run on bare rock.
const VOLCANO_ROCKS = [[0, 34, 158], [26, 24, 92], [62, 64, 172], [128, 30, 58], [176, 86, 180], [214, 26, 128], [262, 46, 152], [318, 26, 74], [352, 40, 166]];
function arcadeVolcano(P) {
  const w = 384, c = cv(w, 164), x = c.getContext('2d'), n = noise(313);
  for (const [rx, rw, top] of VOLCANO_ROCKS) {
    const r = noise(rx + 7);
    for (let yy = top; yy < 200; yy++) {
      const k = (yy - top) / Math.max(1, 200 - top);
      const taper = Math.round((1 - Math.min(1, k * 4)) * rw * 0.3);      // pointed-ish tops
      const l = rx + taper + Math.round(Math.sin(yy / 5 + rx) * 2) - Math.round(k * 4), rr = rx + rw - taper + Math.round(Math.sin(yy / 4 + rw) * 2) + Math.round(k * 4);
      for (let i = l; i < rr; i++) {
        const xi = ((i % w) + w) % w;
        x.fillStyle = i === l ? P.hi : i >= rr - 2 ? P.deep : yy === top ? P.hi : ((i + (yy >> 2)) % 7 === 0 ? P.dark : P.wall);
        x.fillRect(xi, YY(yy), 1, 1);
      }
    }
    for (let k = 0; k < Math.ceil((200 - top) / 30); k++) { let cx = rx + 3 + Math.floor(r() * (rw - 6)), cy = top + 6 + Math.floor(r() * (196 - top - 6)); x.fillStyle = k % 2 ? '#ff7a1a' : '#ffb03a'; for (let s = 0; s < 8; s++) { x.fillRect(((cx % w) + w) % w, YY(cy), 1, 1); cx += r() > 0.5 ? 1 : -1; cy++; } }
  }
  // scattered boulders and smoking vents along the foot of the rocks
  for (let i = 4; i < w; i += 17 + Math.floor(n() * 20)) { blob(x, i, YY(196), 4 + n() * 6, 3 + n() * 3, P.dark); x.fillStyle = P.hi; x.fillRect(i - 2, YY(193), 3, 1); }
  return c;
}
// what stands under a gallery unicorn / a lava drip out here: a pinnacle of rock
export function volcanoPinnacle(ctx, x, Y, P, lip, wTop = 8) {
  const top = Y(110), bot = Y(200);
  for (let yy = top; yy < bot; yy++) {
    const k = (yy - top) / (bot - top), half = Math.round(wTop + k * 8 + Math.sin(yy / 4 + x) * 1.5 - (yy - top < 3 ? 3 - (yy - top) : 0));
    ctx.fillStyle = '#000'; ctx.fillRect(x - half - 1, yy, half * 2 + 2, 1);
    ctx.fillStyle = P.wall; ctx.fillRect(x - half, yy, half * 2, 1); ctx.fillStyle = P.hi; ctx.fillRect(x - half, yy, 1, 1); ctx.fillStyle = P.deep; ctx.fillRect(x + half - 2, yy, 2, 1);
    if ((yy * 7 + x) % 23 === 0) { ctx.fillStyle = '#ff7a1a'; ctx.fillRect(x - 3 + (yy % 5), yy, 1, 3); }
  }
    if (lip) { ctx.fillStyle = '#000'; ctx.fillRect(x, Y(117), 14, 5); ctx.fillStyle = P.base; ctx.fillRect(x, Y(117), 13, 4); ctx.fillStyle = '#ff7a1a'; ctx.fillRect(x + 9, Y(120), 4, 1); }
}

// ---- decks: the floor you run on
// solid masonry under the floor (no see-through supports), so the pit only shows where there's a gap
function foundation(x, w, base, line, shade) {
  x.clearRect(0, 10, w, 30);
  x.fillStyle = base; x.fillRect(0, 10, w, 30);
  x.fillStyle = shade; x.fillRect(0, 10, w, 2);
  for (let yy = 12; yy < 40; yy += 6) { x.fillStyle = line; x.fillRect(0, yy, w, 1); for (let i = (yy / 6) % 2 ? 0 : 8; i < w; i += 16) x.fillRect(i, yy, 1, 6); }
}
function deckStyled(P, style) {
  const c = buildDeck(P, style), x = c.getContext('2d'), w = c.width, n = noise(9 + style.length);
  if (style === 'volcano') {           // bare rock all the way down: no supports, no lamps
    x.clearRect(0, 0, w, 40);
    for (let i = 0; i < w; i++) {
      const bump = (i * 7) % 13 < 2 ? 1 : 0;
      x.fillStyle = P.hi; x.fillRect(i, -bump, 1, 1);
      x.fillStyle = P.top; x.fillRect(i, 1, 1, 2);
      for (let j = 3; j < 40; j++) { x.fillStyle = j > 30 ? '#0a0606' : ((i >> 3) + (j >> 2)) % 5 === 0 ? P.deep : (j + i) % 17 === 0 ? P.dark : P.base; x.fillRect(i, j, 1, 1); }
    }
    for (let k = 0; k < 6; k++) { let cx = Math.floor(n() * w), cy = 4; x.fillStyle = k % 2 ? '#ff5a1a' : '#c4300a'; for (let s = 0; s < 14; s++) { x.fillRect(cx, cy, 1, 1); cx += Math.floor(n() * 3) - 1; cy += n() > 0.4 ? 1 : 0; } }
    for (let k = 0; k < 8; k++) { x.fillStyle = P.dark; const px0 = Math.floor(n() * w); x.fillRect(px0, 0, 2 + Math.floor(n() * 3), 1); }   // pebbles
  } else if (style === 'dungeon') {
    // worn flagstones, lit from the torches: lighter than the wall behind so the floor stands out
    x.fillStyle = '#c8c0d8'; x.fillRect(0, 0, w, 1); x.fillStyle = '#9a92b0'; x.fillRect(0, 1, w, 1);
    x.fillStyle = '#6a6484'; x.fillRect(0, 2, w, 7); for (let i = 0; i < w; i += 16) { x.fillStyle = '#3a3650'; x.fillRect(i, 2, 1, 7); x.fillStyle = '#7e78a0'; x.fillRect(i + 1, 2, 4, 1); }
    x.fillStyle = '#3a3650'; x.fillRect(0, 5, w, 1); x.fillStyle = '#05040a'; x.fillRect(0, 9, w, 1); for (let i = 0; i < w; i += 16) { x.fillStyle = P.deep; x.fillRect(i, 2, 1, 7); } x.fillStyle = P.deep; x.fillRect(0, 5, w, 1);
    x.fillStyle = '#0a0a10'; x.fillRect(38, 3, 10, 5); x.fillStyle = '#5a5a70'; for (let i = 39; i < 48; i += 2) x.fillRect(i, 3, 1, 5);   // drain grate
    x.fillStyle = '#3e7a3a'; for (const sx of [8, 70]) { x.fillRect(sx, 9, 6, 1); x.fillRect(sx + 2, 10, 1, 3); x.fillRect(sx + 4, 10, 1, 2); }  // slime drips
    x.fillStyle = BONE; x.fillRect(60, 0, 5, 1); x.fillRect(59, 0, 1, 1); x.fillRect(65, 0, 1, 1);   // a bone on the floor
    foundation(x, w, '#16141f', '#24202f', '#0a0810');
  } else if (style === 'castle') {
    foundation(x, w, '#141626', '#20243a', '#080a14');
    x.fillStyle = P.base; x.fillRect(0, 2, w, 7);
    for (let yy = 2; yy < 9; yy += 3) for (let i = (yy % 2) * 3; i < w; i += 6) { x.fillStyle = P.deep; x.fillRect(i, yy, 1, 3); x.fillRect(i, yy + 2, 6, 1); x.fillStyle = P.top; x.fillRect(i + 1, yy, 3, 1); }
    for (let i = 0; i < w; i += 7 + Math.floor(n() * 9)) { x.fillStyle = n() > 0.5 ? '#3e7a3a' : '#2a5a2a'; x.fillRect(i, 0, 2 + Math.floor(n() * 3), 1); if (n() > 0.5) x.fillRect(i + 1, -0, 1, 2); }  // moss
  } else if (style === 'factory') {
    x.fillStyle = '#5a6670'; x.fillRect(0, 1, w, 8);
    for (let yy = 2; yy < 6; yy += 2) for (let i = (yy & 2) ? 1 : 3; i < w; i += 4) { x.fillStyle = '#8a98a4'; x.fillRect(i, yy, 2, 1); }  // diamond plate
    hazard(x, 0, 6, w, 3);
    x.fillStyle = '#c8d4e0'; x.fillRect(0, 0, w, 1);
    // girders with X bracing under the walkway
    x.fillStyle = '#05040a'; x.fillRect(0, 10, w, 30);
    for (const sx of [0, 48]) { x.fillStyle = '#3a4650'; x.fillRect(sx + 2, 10, 6, 30); x.fillStyle = '#6a7884'; x.fillRect(sx + 2, 10, 1, 30); for (let k = 0; k < 28; k++) { x.fillStyle = '#2a3440'; x.fillRect(sx + 8 + Math.floor(k * 1.4), 11 + k, 2, 1); x.fillRect(sx + 46 - Math.floor(k * 1.4), 11 + k, 2, 1); } }
  }
  return c;
}

// ---- pits: each level has its own way to die
function pitFire() {        // Hell Bridge: lava with tongues of flame licking up out of the pit
  const base = buildPit('lava'), up = 16, n = noise(71);
  const tongues = Array.from({ length: 14 }, (_, i) => ({ x: i * 9 + Math.floor(n() * 5), ph: n() * 8, h: 6 + n() * 9 }));
  return base.map((b, f) => {
    const c = cv(b.width, b.height + up), x = c.getContext('2d'); x.drawImage(b, 0, up);
    for (const t of tongues) {
      const h = Math.round(t.h * (0.45 + 0.55 * Math.abs(Math.sin(((f + t.ph) / 8) * Math.PI))));
      for (let j = 0; j < h; j++) {
        const wv = Math.max(1, Math.round((1 - j / h) * 3.5)), sway = Math.round(Math.sin((j + f * 2 + t.ph) / 3) * (j / h) * 2);
        x.fillStyle = '#c4300a'; x.fillRect(t.x - wv + sway, up + 1 - j, wv * 2 + 1, 1);
        x.fillStyle = j / h < 0.5 ? '#ffb03a' : '#ff5a1a'; x.fillRect(t.x - wv + 1 + sway, up + 1 - j, Math.max(1, wv * 2 - 1), 1);
        if (j < h * 0.35) { x.fillStyle = '#ffe08a'; x.fillRect(t.x + sway, up + 1 - j, 1, 1); }
      }
    }
    return c;
  });
}
function pitSpikes() {      // Dungeon: a bed of iron spikes over bones, no fire at all
  const w = 128, up = 14, h = 26 + up, n = noise(91);
  const back = Array.from({ length: 22 }, (_, i) => ({ x: i * 6 + Math.floor(n() * 3), h: 16 + Math.floor(n() * 6) }));
  const front = Array.from({ length: 13 }, (_, i) => ({ x: 4 + i * 10 + Math.floor(n() * 3), h: 28 + Math.floor(n() * 6), blood: n() < 0.35 }));
  const bones = Array.from({ length: 9 }, () => ({ x: Math.floor(n() * w), y: h - 4 - Math.floor(n() * 6), skull: n() < 0.4 }));
  return Array.from({ length: 8 }, (_, f) => {
    const c = cv(w, h), x = c.getContext('2d');
    // a black drop with a dull red glow down at the bottom, so the hole reads as a hole
    for (let y = 0; y < h; y++) { x.fillStyle = y < 14 ? '#020104' : y < 22 ? '#0e0408' : y < 30 ? '#2a0a10' : y < 36 ? '#4a1018' : '#6a1820'; x.fillRect(0, y, w, 1); }
    for (const b of bones) b.skull ? skull(x, b.x, b.y, '#a8a090') : (x.fillStyle = '#a8a090', x.fillRect(b.x, b.y, 6, 1), x.fillRect(b.x - 1, b.y - 1, 1, 3), x.fillRect(b.x + 6, b.y - 1, 1, 3));
    const spike = (s, top, cols) => { for (let j = 0; j < s.h; j++) { const half = Math.floor((j / s.h) * (s.h > 14 ? 4.6 : 3.2)); x.fillStyle = cols[0]; x.fillRect(s.x - half, top + j, half * 2 + 1, 1); x.fillStyle = cols[1]; x.fillRect(s.x - half, top + j, 1, 1); } };
    for (const s of back) spike(s, h - 2 - s.h, ['#1a1a26', '#3a3a4e']);
    front.forEach((s, i) => {
      const top = h - s.h - 1;
      spike(s, top, ['#5e5e76', '#c0c0d8']);
      x.fillStyle = s.blood ? '#c0102a' : '#d8d8e8'; x.fillRect(s.x, top, 1, s.blood ? 3 : 1);
      if (s.blood) { x.fillStyle = '#7a0818'; x.fillRect(s.x + 1, top + 3, 1, 2 + ((f + i) % 4 === 0 ? 1 : 0)); }
      if (i % 13 === (f * 2) % 13) { x.fillStyle = '#ffffff'; x.fillRect(s.x - 1, top + 2, 1, 1); x.fillRect(s.x, top + 1, 1, 3); x.fillRect(s.x + 1, top + 2, 1, 1); }  // glint travels along
    });
    return c;
  });
}
function pitMagma() {       // Volcano: deep magma with drifting black crust and popping bubbles
  const pal = ['#3a0804', '#6a1004', '#a8200a', '#e8480e', '#ff8a1a', '#ffd84a', '#ff8a1a', '#c4300a'];
  const w = 128, h = 26, n = noise(61), idx = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) idx.push(Math.floor(((Math.sin(i / 5 + j / 2) + Math.sin(i / 11 - j / 4) + n() * 0.8 + 3) / 6.8) * 8 + j / 5) % 8);
  const crust = Array.from({ length: 6 }, (_, k) => ({ x: k * 22 + Math.floor(n() * 8), w: 8 + Math.floor(n() * 10), y: 1 + Math.floor(n() * 8) }));
  const bubbles = [[18, 6, 0], [70, 10, 3], [108, 4, 5]];
  return pal.map((_, f) => {
    const c = cv(w, h), x = c.getContext('2d');
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = idx[j * w + i]; x.fillStyle = j < 2 ? pal[(k + f) % 8 < 4 ? 5 : 4] : pal[(k + f) % 8]; if (j > 16) x.fillStyle = pal[Math.max(0, ((k + f) % 8) - 4)]; x.fillRect(i, j, 1, 1); }
    for (const p of crust) { for (let i = 0; i < p.w; i++) { const t = Math.round(Math.abs(Math.sin(i / 2.3)) * 2); x.fillStyle = '#1a0c08'; x.fillRect(p.x + i, p.y + t, 1, 4 - t); x.fillStyle = '#3a1a10'; x.fillRect(p.x + i, p.y + t, 1, 1); } x.fillStyle = '#ffd84a'; x.fillRect(p.x + (p.w >> 1), p.y + 2, 1, 1); }
    for (const [bx, by, ph] of bubbles) {
      const t = (f + ph) % 8;
      if (t < 5) { x.fillStyle = '#ffd84a'; x.fillRect(bx - (t >> 1), by - (t >> 1), t + 1, t + 1); x.fillStyle = '#fff3c0'; x.fillRect(bx - (t >> 1), by - (t >> 1), 1, 1); }
      else if (t === 5) { x.fillStyle = '#ffd84a'; for (const [dx, dy] of [[-3, -2], [3, -2], [-2, -4], [2, -4], [0, -5]]) x.fillRect(bx + dx, by + dy, 1, 1); }
    }
    return c;
  });
}
function pitMoat() {        // Castle: a black moat in the rain, with something watching
  const base = buildPit('water'), w = 256, n = noise(83), up = 4;
  return base.map((b, f) => {
    const c = cv(w, b.height + up), x = c.getContext('2d'); x.translate(0, up); x.drawImage(b, 0, 0); x.drawImage(b, 128, 0);
    for (let k = 0; k < 10; k++) { const rx = Math.floor((k * 53 + f * 7) % w), r = (f + k) % 4; x.fillStyle = '#8ab0d8'; x.fillRect(rx - r, 1, 1, 1); x.fillRect(rx + r, 1, 1, 1); }   // raindrop rings
    // a crocodile surfaces, blinks, and sinks again
    const cx = 170, rise = [0, 1, 2, 3, 3, 3, 2, 1][f];
    if (rise) {
      x.fillStyle = '#1a3a22'; x.fillRect(cx, 3 - rise, 22, rise + 1); x.fillRect(cx + 22, 4 - rise, 10, rise);
      x.fillStyle = '#2e5a32'; for (let i = 2; i < 30; i += 4) x.fillRect(cx + i, 3 - rise, 2, 1);
      if (rise >= 2) for (const ex of [cx + 4, cx + 12]) { x.fillStyle = '#1a3a22'; x.fillRect(ex - 1, 1 - rise, 5, 2); x.fillStyle = f === 4 ? '#1a3a22' : '#ffe14a'; x.fillRect(ex, 1 - rise + 1, 3, 1); x.fillStyle = '#000'; if (f !== 4) x.fillRect(ex + 1, 1 - rise + 1, 1, 1); }
      x.fillStyle = '#8ab0d8'; x.fillRect(cx - 2, 3, 2, 1); x.fillRect(cx + 33, 3, 2, 1);
    }
    for (let k = 0; k < 3; k++) { x.fillStyle = '#3a2a1a'; x.fillRect(40 + k * 90 + Math.floor(n() * 10), 2 + k, 8, 2); }   // floating debris
    return c;
  });
}

// ---- near layers (seen above the gallery and through the wall openings)
function nearDungeon() {     // hanging gibbet cages and thick chains
  const w = 512, h = 240, c = cv(w, h), x = c.getContext('2d'), n = noise(111);
  for (let px0 = 30; px0 < w; px0 += 90 + Math.floor(n() * 50)) {
    const len = 30 + Math.floor(n() * 60);
    for (let j = 0; j < len; j += 4) { x.fillStyle = '#06060c'; x.fillRect(px0 - 1, j, 3, 3); x.fillStyle = '#2a2a3c'; x.fillRect(px0, j + 1, 1, 1); }
    if (n() > 0.35) {   // cage with a skeleton slumped inside
      const cy = len; x.fillStyle = '#06060c';
      for (let j = 0; j < 30; j++) { const half = j < 5 ? 4 + j * 2 : 13; for (let i = -half; i <= half; i += 4) x.fillRect(px0 + i, cy + j, 1, 1); }
      x.fillRect(px0 - 13, cy + 10, 27, 1); x.fillRect(px0 - 13, cy + 30, 27, 2);
      x.fillStyle = '#4a4636'; x.fillRect(px0 - 4, cy + 18, 6, 5); x.fillRect(px0 - 2, cy + 23, 2, 6); x.fillRect(px0 + 2, cy + 26, 6, 2);
      x.fillStyle = '#06060c'; x.fillRect(px0 - 3, cy + 20, 1, 1); x.fillRect(px0, cy + 20, 1, 1);
    } else { x.fillStyle = '#06060c'; x.fillRect(px0 - 4, len, 9, 3); x.fillRect(px0 - 1, len + 3, 3, 10); x.fillRect(px0 - 4, len + 10, 3, 3); }   // meat hook
  }
  for (let px0 = 0; px0 < w; px0 += 170) { x.fillStyle = '#10101e'; x.fillRect(px0 + 70, 0, 22, h); x.fillStyle = '#1c1c30'; x.fillRect(px0 + 70, 0, 2, h); }
  return c;
}
function nearVolcano() {     // jagged obsidian spires with glowing seams
  const w = 512, h = 240, c = cv(w, h), x = c.getContext('2d'), n = noise(131);
  for (let px0 = 20; px0 < w; px0 += 60 + Math.floor(n() * 70)) {
    const bw = 14 + Math.floor(n() * 16), top = 40 + Math.floor(n() * 70), lean = (n() - 0.5) * 0.4;
    for (let y = top; y < h; y++) { const t = (y - top) / (h - top), half = Math.max(1, Math.floor(bw * Math.min(1, t * 3) / 2)), cx = px0 + Math.round((h - y) * lean); x.fillStyle = '#0a0606'; x.fillRect(cx - half, y, half * 2, 1); x.fillStyle = '#2a1a14'; x.fillRect(cx - half, y, 1, 1); }
    let sx = px0, sy = top + 10; x.fillStyle = '#ff5a1a'; for (let s = 0; s < 30 && sy < h; s++) { x.fillRect(sx + Math.round((h - sy) * lean), sy, 1, 2); sx += Math.floor(n() * 3) - 1; sy += 2; }
  }
  return c;
}
function nearCastle() {      // round towers with lit windows and pennants
  const w = 512, h = 240, c = cv(w, h), x = c.getContext('2d'), n = noise(151);
  for (let px0 = 40; px0 < w; px0 += 110 + Math.floor(n() * 60)) {
    const tw = 22 + Math.floor(n() * 12), top = 40 + Math.floor(n() * 50);
    x.fillStyle = '#0a0c1a'; x.fillRect(px0, top, tw, h - top);
    for (let j = 0; j < 18; j++) { const half = Math.floor((j / 18) * (tw / 2 + 3)); x.fillRect(px0 + (tw >> 1) - half, top - 18 + j, half * 2 + 1, 1); }   // conical roof
    x.fillStyle = '#1a1e34'; x.fillRect(px0, top, 2, h - top);
    x.fillStyle = '#3a2a1a'; x.fillRect(px0 + (tw >> 1), top - 30, 1, 12); x.fillStyle = '#a01828'; for (let j = 0; j < 4; j++) x.fillRect(px0 + (tw >> 1) + 1, top - 29 + j, 8 - j * 2, 1);
    for (let k = 0; k < 3; k++) if (n() > 0.3) { x.fillStyle = '#ffd04a'; x.fillRect(px0 + 5 + Math.floor(n() * (tw - 10)), top + 14 + k * 30, 2, 4); }
  }
  return c;
}
