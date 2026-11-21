// Black Hole Friday: shared art kit for the level files (bhf/game/levels/*.js).
// World is 320 wide x 240 tall: gallery (upper walkway) at y 110, ledges at y 160, the deck (floor) at y 200, the pit at y 214.
import { cv, frames, put, flip, tint, hash, TAU } from '../chars.js';
import { pix, dith, blackHole, codeRain, CODEPAL } from '../scenes.js';
import { drawText, GRAD, pixelCJK } from '../../font.js';
export { cv, frames, put, flip, tint, hash, TAU, pix, dith, blackHole, codeRain, CODEPAL, drawText, GRAD, pixelCJK };

export const fr = (c, ox = c.width >> 1, oy = c.height) => ({ c, ox, oy });
export const scaleFr = (f, k) => { const c = cv(Math.ceil(f.c.width * k), Math.ceil(f.c.height * k)), x = c.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(f.c, 0, 0, c.width, c.height); return { c, ox: Math.round(f.ox * k), oy: Math.round(f.oy * k) }; };
export const mapFr = (o, fn) => (Array.isArray(o) ? o.map(fn) : o && o.c ? fn(o) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, mapFr(v, fn)])) : o);
export const tintAll = (o, col, a) => mapFr(o, (f) => tint(f, col, a));
export const sky = (stops, draw) => { const c = pix(320, 240, (i, j) => dith(stops, j / 240, i, j)); if (draw) draw(c.getContext('2d')); return c; };
export const blank = (w = 64, h = 8) => cv(w, h);
// the pit: 8 palette-cycled frames, like the FWAHBL pits
export function pitCycle(pal, seed = 11) {
  const w = 128, h = 26, idx = []; let a = seed;
  const n = () => ((a = (Math.imul(a, 1103515245) + 12345) | 0) >>> 8) / 16777216;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const v = Math.sin(i / 7 + j / 3) + Math.sin(i / 13 - j / 5) + n() * 0.9; idx.push(Math.floor(((v + 3) / 6.9) * 8 + j / 6) % 8); }
  return pal.map((_, f) => { const c = cv(w, h), x = c.getContext('2d'); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const k = idx[j * w + i]; x.fillStyle = j < 2 ? pal[(k + f) % 8 < 4 ? 4 : 5] : j > 18 ? pal[Math.max(0, ((k + f) % 8) - 3)] : pal[(k + f) % 8]; x.fillRect(i, j, 1, 1); } return c; });
}
// a slab platform: top light, body, underside; cracks if it will crumble; a thruster if it moves
export function slabDrawer(P, extra) {
  return (ctx, p, x, y, w, f) => {
    if (p.kind === 'crumble' && p.crumble > 0) { y += f % 4 < 2 ? 1 : 0; x += (f % 3) - 1; }
    if (p.gone) ctx.globalAlpha = Math.max(0, 1 - (p.fallT || 0) / 40);
    const h = p.kind === 'ledge' ? 8 : 7;
    ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = P.base; ctx.fillRect(x, y, w, h); ctx.fillStyle = P.hi; ctx.fillRect(x, y, w, 1); ctx.fillStyle = P.deep; ctx.fillRect(x, y + h - 1, w, 1);
    if (p.kind === 'crumble') { ctx.fillStyle = '#000'; for (let i = 3; i < w - 2; i += 7) { ctx.fillRect(x + i, y + 2, 1, 3); ctx.fillRect(x + i + 1, y + 4, 1, 3); } }
    if (p.kind === 'movev' || p.kind === 'moveh') { const fl = (f >> 2) % 2; ctx.fillStyle = fl ? P.glow : P.hi; ctx.fillRect(x + (w >> 1) - 2, y + h + 1, 4, 2 + fl); }
    if (extra) extra(ctx, p, x, y, w, h, f);
    ctx.globalAlpha = 1;
  };
}
// the wall right behind you: gallery slab at world y 110, the wall, a railing down at the deck. world y 96..200 = 104 px
export function arcade(w, { wall, slab, rail, holes = [], detail }) {
  const c = pix(w, 104, (i, j) => {
    const y = 96 + j;
    if (y < 110) return rail && y >= 104 ? rail(i, y) : null;
    if (y < 118) return slab(i, y);
    for (const [a, b, top, bot] of holes) if (i >= a && i < b && y >= top && y < bot) return null;
    if (y >= 186) return rail ? rail(i, y) : wall(i, y);
    return wall(i, y);
  });
  if (detail) detail(c.getContext('2d'));
  return c;
}
export const deck = (fn) => pix(96, 40, fn);
// what drips from the gallery in each level, and the puddle it leaves: { drop, glint, pool[3], top[2] }
export const LOOK = {
  neon: { drop: '#4af0ff', glint: '#ffffff', pool: ['#0a2030', '#1a6a8a', '#4af0ff'], top: ['#ffffff', '#4af0ff'] },
  ice: { drop: '#e0f4ff', glint: '#ffffff', pool: ['#6aa0c8', '#a8d4f0', '#e0f4ff'], top: ['#ffffff', '#c8ecff'] },
  hive: { drop: '#46c02a', glint: '#e0ffb0', pool: ['#14500e', '#2a8a1a', '#8aff4a'], top: ['#e0ffb0', '#8aff4a'] },
  code: { drop: '#3ae03a', glint: '#e8ffe8', pool: ['#073a10', '#1fa02e', '#8aff9a'], top: ['#e8ffe8', '#3ae03a'] },
  desert: { drop: '#e8c088', glint: '#fff8e0', pool: ['#8a5a32', '#c8945a', '#f8dca0'], top: ['#f8dca0', '#e8c088'] },
  tenet: { drop: '#4a9aff', glint: '#ffffff', pool: ['#14305a', '#3a8ae0', '#a8d0ff'], top: ['#ffffff', '#ff4a3a'] },
};
// the thing it drips from: a bracket under the gallery with a nozzle in the level's colours
export const pipeFor = (look, kind) => (ctx, x, Y, prog, f) => {
  const y0 = Y(117), py = Y(122);
  if (kind === 'ice') { for (const [dx, h] of [[-6, 4], [-3, 7], [0, 9], [3, 6], [6, 3]]) { ctx.fillStyle = '#000'; ctx.fillRect(x + dx - 1, y0, 3, h + 1); ctx.fillStyle = '#e0f4ff'; ctx.fillRect(x + dx, y0, 1, h); } }
  else { ctx.fillStyle = '#000'; ctx.fillRect(x - 6, y0 - 1, 13, py - y0 + 4); ctx.fillStyle = kind === 'neon' ? '#3a3448' : kind === 'hive' ? '#3a4448' : kind === 'code' ? '#03140a' : kind === 'desert' ? '#8a5a32' : '#4a4e58'; ctx.fillRect(x - 5, y0, 11, py - y0 + 2);
    ctx.fillStyle = look.drop; ctx.fillRect(x - 5, y0, 11, 1); if ((f >> 3) % 2) { ctx.fillStyle = look.glint; ctx.fillRect(x - 1, py + 1, 3, 1); } }
  const r = Math.floor(prog * 3); if (r > 0) { ctx.fillStyle = look.drop; ctx.fillRect(x - Math.floor(r / 2), py + 3, r, r + 1); ctx.fillStyle = look.glint; ctx.fillRect(x, py + 3, 1, 1); }
};


// ---------- drawn (not per-pixel) scenery: the way the FWAHBL walls were made ----------
export function noise(seed) { let a = seed | 0; return () => ((a = (Math.imul(a, 1103515245) + 12345) | 0) >>> 8) / 16777216; }
// the wall you run along. World y `top` .. 204; draw on it with x.fillRect(i, Y(worldY), w, h). Use as skin.arcade + skin.arcadeTop = top.
// Leave parts of it transparent (x.clearRect) to see the far / mid / near layers through it. Width tiles: keep it 384.
export function arcadeCanvas(w = 384, top = 36) { const c = cv(w, 204 - top), x = c.getContext('2d'); return { c, x, w, top, Y: (y) => y - top }; }
// the floor tile: row 0 is the floor line (world y 200), 40 rows down to the pit
export function deckCanvas(w = 96) { const c = cv(w, 40), x = c.getContext('2d'); return { c, x, w }; }
// stamp a little pixel drawing from strings: px(x, 10, 20, ['.##.', '#oo#'], { '#': '#fff', o: '#000' })
export function px(x, cx, cy, rows, cols) { rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const k = r[i]; if (k !== '.' && k !== ' ' && cols[k]) { x.fillStyle = cols[k]; x.fillRect(cx + i, cy + j, 1, 1); } } }); }
// dithered vertical gradient in a rectangle, pal top -> bottom
export function vgrad(x, x0, y0, w, h, pal) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { x.fillStyle = dith(pal, j / h, x0 + i, y0 + j); x.fillRect(x0 + i, y0 + j, 1, 1); } }
// coursed blocks / wall panels: dark joints, a lit top edge on each, some blocks a shade darker. P = { base, top, deep, dark }
export function panels(x, x0, y0, w, h, P, bw, bh, n, vary = 3) {
  x.fillStyle = P.base; x.fillRect(x0, y0, w, h);
  for (let y = y0, row = 0; y < y0 + h; y += bh, row++) {
    x.fillStyle = P.deep; x.fillRect(x0, y, w, 1);
    let i = x0 + (row % 2 ? Math.floor(bw / 2) : 0);
    while (i < x0 + w) {
      const bwi = bw + Math.floor(n() * (vary * 2 + 1)) - vary, hh = Math.min(bh, y0 + h - y);
      x.fillStyle = P.deep; x.fillRect(i, y, 1, hh);
      x.fillStyle = P.top; x.fillRect(i + 1, y + 1, Math.max(0, Math.min(bwi - 2, x0 + w - i - 1)), 1);
      if (n() < 0.25) { x.fillStyle = P.dark; x.fillRect(i + 2, y + 2, Math.max(1, Math.min(bwi - 4, x0 + w - i - 3)), Math.max(1, hh - 3)); }
      i += bwi;
    }
  }
}
// a soft dithered glow around a light (draw it on scenery at build time, or live)
export function glow(x, cx, cy, r, col, a = 0.6) { x.fillStyle = col; for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const d = Math.hypot(i, j) / r; if (d < 1 && dith([0, 1], (1 - d) * (1 - d) * a, cx + i, cy + j)) x.fillRect(cx + i, cy + j, 1, 1); } }
export function rivets(x, x0, y, w, step, col) { x.fillStyle = col; for (let i = x0; i < x0 + w; i += step) x.fillRect(i, y, 1, 1); }
// black-outlined box with a lit top and a shaded bottom: the basic prop
export function box(x, x0, y0, w, h, base, hi, deep) { x.fillStyle = '#000'; x.fillRect(x0 - 1, y0 - 1, w + 2, h + 2); x.fillStyle = base; x.fillRect(x0, y0, w, h); x.fillStyle = hi; x.fillRect(x0, y0, w, 1); x.fillStyle = deep; x.fillRect(x0, y0 + h - 1, w, 1); }
