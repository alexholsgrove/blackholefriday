// Black Hole Friday: the arcade home screen. Three screens that slide up in turn, like an arcade machine waiting for a coin
// (the same idea as the FWAHBL title): 1/3 the title, 2/3 the prizes, 3/3 the high scores. Any press starts the game.
import { W, H } from './sim.js';
import { drawText, GRAD, measure } from '../../font.js';
import { drawTunnel } from './portals.js';
import { blackHole } from '../scenes.js';

const T_HOLD = 240, T_MOVE = 24, PAGES = 3, PAGE_H = 144;
const COPPER = ['#ffe6c4', '#ffc08a', '#f59a4e', '#e07a34', '#c25f22', '#9a4414', '#6e2c0a'];
const ease = (t) => t * t * (3 - 2 * t);
const cvs = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

export function createHome(o = {}) {
  const v = { tt: 0, hero: o.hero || null, jacket: o.jacket || null };
  return v;
}
function pos(v) { const len = PAGES * (T_HOLD + T_MOVE), ph = v.tt % len, cur = Math.floor(ph / (T_HOLD + T_MOVE)); return { cur, local: ph - cur * (T_HOLD + T_MOVE), len }; }
export const homePage = (v) => { const { cur, local } = pos(v); return local < T_HOLD + T_MOVE / 2 ? cur : (cur + 1) % PAGES; };
export function homeGoTo(v, page) { if (homePage(v) === page) return; const { len } = pos(v), prev = (page + PAGES - 1) % PAGES; v.tt = Math.floor(v.tt / len) * len + prev * (T_HOLD + T_MOVE) + T_HOLD; }
export const homeFlip = (v) => homeGoTo(v, (homePage(v) + 1) % PAGES);

// ---- 1/3: the title: the original concept title (bhf/scenes.js buildTitle, as on /blackhole), fitted to the page ----------------
const TCOPPER = ['#fff0d8', '#ffd0a0', '#f5a560', '#e07a34', '#b8521c', '#8a3410', '#521c06'];
let TITLE = null;
function buildTitle() {
  let a = 7; const r = () => ((a = (Math.imul(a, 1103515245) + 12345) | 0) >>> 8) / 16777216;
  const stars = Array.from({ length: 170 }, () => ({ x: Math.floor(r() * W), y: Math.floor(r() * PAGE_H), c: ['#ffffff', '#c8d0ff', '#ffe8c0', '#8a8aa8'][Math.floor(r() * 4)], tw: r() }));
  return { stars, bh: Array.from({ length: 10 }, (_, i) => blackHole(20, i / 10, { tilt: 0.18 })) };
}
function titlePage(ctx, v, f) {
  TITLE = TITLE || buildTitle();
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, PAGE_H);
  for (const s of TITLE.stars) { if ((f * 0.07 + s.tw * 7) % 7 < 0.6) continue; ctx.fillStyle = s.c; ctx.fillRect(s.x, s.y, 1, 1); }
  const c = TITLE.bh[Math.floor(f / 2) % 10]; ctx.drawImage(c, Math.round(W / 2 - c.width / 2), Math.round(36 - c.height / 2));
  const wave = (k) => (i) => Math.sin(f / 5 + i * 0.6 + k) * 1.5;
  for (let d = 4; d >= 1; d--) drawText(ctx, 'BLACK HOLE', W / 2 + d, 72 + d, { scale: 4, fill: '#3a1204', outline: null, align: 'center', wave: wave(0) });
  drawText(ctx, 'BLACK HOLE', W / 2, 72, { scale: 4, fill: TCOPPER, outline: '#000', align: 'center', wave: wave(0) });
  for (let d = 4; d >= 1; d--) drawText(ctx, 'FRIDAY', W / 2 + d, 106 + d, { scale: 4, fill: '#1a1a2a', outline: null, align: 'center', wave: wave(1) });
  drawText(ctx, 'FRIDAY', W / 2, 106, { scale: 4, fill: GRAD.white, outline: '#000', align: 'center', wave: wave(1) });
  // him, running across in front of the hole
  if (v.hero) { const fr = v.hero[f % v.hero.length], hc = fr.c || fr; ctx.drawImage(hc, 30 + ((f * 2) % 300) - (fr.ox ?? (hc.width >> 1)), 64 - (fr.oy ?? hc.height)); }
}

// ---- 2/3: the prizes ------------------------------------------------------------------------------------------------
function box(ctx, x, y, w, h, label, fill) {
  ctx.fillStyle = '#000'; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = '#140d1f'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill[3]; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y, 1, h);
  ctx.fillRect(x + 6, y - 5, measure(label) + 6, 9);
  drawText(ctx, label, x + 9, y - 4, { fill: '#000', outline: null });
}
function prizePage(ctx, v, f) {
  drawText(ctx, 'TOP 3 SCORES WIN', W / 2, 5, { scale: 2, fill: GRAD.gold, outline: '#000', shadow: '#000', align: 'center' });
  const x = 16, y = 31, w = 288, h = 110;
  box(ctx, x, y, w, h, 'THE PRIZE', COPPER);
  drawText(ctx, 'FULL METAL JACKET', x + 8, y + 10, { scale: 2, fill: GRAD.white, outline: '#000', shadow: '#000' });
  drawText(ctx, 'COPPER EDITION', x + 8, y + 28, { scale: 2, fill: COPPER, outline: '#000', shadow: '#000' });
  // the three prize places: the same jacket each
  const cols = [GRAD.gold, GRAD.pink, GRAD.blue];
  ['1ST', '2ND', '3RD'].forEach((lab, i) => {
    const bx = x + 8 + i * 70, by = y + 50, bw = 64, bh = 26;
    ctx.fillStyle = '#000'; ctx.fillRect(bx, by, bw, bh); ctx.fillStyle = ['#ffe14a', '#ff2a8a', '#4a8cff'][i]; ctx.fillRect(bx, by, bw, 1); ctx.fillRect(bx, by + bh - 1, bw, 1); ctx.fillRect(bx, by, 1, bh); ctx.fillRect(bx + bw - 1, by, 1, bh);
    drawText(ctx, lab, bx + bw / 2, by + 6, { scale: 2, fill: cols[i], outline: '#000', align: 'center' });
  });
  drawText(ctx, 'ALL THREE WIN THE JACKET.', x + 8, y + 90, { fill: GRAD.white, outline: '#000' });
  // him, wearing it: the game's own hero drawn big, running on the spot in a copper spotlight
  const fw = 60, fx = x + w - fw - 4, fy = y + 4, fh = h - 8, hx = fx + fw / 2, hy = fy + fh - 5;
  ctx.fillStyle = '#000'; ctx.fillRect(fx, fy, fw, fh);
  for (let k = 0; k < 6; k++) { ctx.fillStyle = ['#1c0f0a', '#2a160c', '#3a1e0e', '#4c2810', '#5e3212', '#6e3a14'][k]; const r = fw / 2 - 1 - k * 4; ctx.fillRect(hx - r, fy + 1 + k * 7, r * 2, fh - 2 - k * 7); }
  ctx.fillStyle = '#120a08'; ctx.fillRect(fx + 1, hy, fw - 2, fy + fh - 1 - hy);                                                    // the floor
  for (let k = 0; k < 4; k++) { ctx.fillStyle = '#6e3a14'; ctx.fillRect(fx + 2 + ((k * 15 + 600 - (f % 60)) % (fw - 10)), hy + 1 + (k % 2) * 2, 6, 1); }   // ... going by
  for (let k = 0; k < 4; k++) { const t = (f + k * 19) % 64; if (t < 10) { ctx.fillStyle = '#fff7c0'; const sx = fx + 6 + ((k * 37) % (fw - 12)), sy = fy + 8 + ((k * 23) % 40); ctx.fillRect(sx, sy - 1, 1, 3); ctx.fillRect(sx - 1, sy, 3, 1); } }
  ctx.fillStyle = COPPER[3]; ctx.fillRect(fx, fy, fw, 1); ctx.fillRect(fx, fy + fh - 1, fw, 1); ctx.fillRect(fx, fy, 1, fh); ctx.fillRect(fx + fw - 1, fy, 1, fh);
  // the same hero, same size, as the one running across screen 1/3 (Andy, 20 Nov: the 2.3x one was too big)
  ctx.save(); ctx.beginPath(); ctx.rect(fx + 1, fy + 1, fw - 2, fh - 2); ctx.clip();
  if (v.hero) { const fr = v.hero[(f >> 2) % v.hero.length], hc = fr.c || fr; ctx.drawImage(hc, Math.round(hx - hc.width / 2), Math.round(hy - hc.height)); }
  ctx.restore();
}

// ---- 3/3: the high scores -------------------------------------------------------------------------------------------
function boardPage(ctx, board, f) {
  drawText(ctx, 'HIGH SCORES', W / 2, 4, { scale: 2, fill: GRAD.gold, outline: '#000', shadow: '#000', align: 'center', wave: (i) => Math.sin(f / 8 + i * 0.5) * 1.5 });
  const top = board && board.top;
  if (!top) { drawText(ctx, board && board.off ? 'SCOREBOARD OFFLINE' : 'LOADING...', W / 2, 70, { fill: GRAD.white, outline: '#000', align: 'center' }); return; }
  if (!top.length) { drawText(ctx, 'NO SCORES YET', W / 2, 58, { scale: 2, fill: GRAD.white, outline: '#000', align: 'center' }); drawText(ctx, 'BE THE FIRST. TOP 3 WIN.', W / 2, 82, { fill: GRAD.gold, outline: '#000', align: 'center' }); return; }
  const rainbow = ['#ff2040', '#ff8a1a', '#ffe14a', '#5fff6a', '#3d9cf5', '#a05aff', '#ff4fd8'];
  const row = (r, y, col) => {
    drawText(ctx, String(r.rank).padStart(3, ' ') + '.', 50, y, { fill: col, outline: '#000' });
    drawText(ctx, r.nickname, 80, y, { fill: col, outline: '#000' });
    drawText(ctx, r.country || '', 146, y, { fill: '#8a8aa8', outline: '#000' });
    if (r.level) drawText(ctx, 'L' + r.level, 166, y, { fill: '#5fff6a', outline: '#000' });
    drawText(ctx, Number(r.score).toLocaleString('en-US'), 250, y, { fill: col, outline: '#000', align: 'right' });
  };
  const me = board.me, pinned = me && me.rank > 10, rows = top.slice(0, pinned ? 9 : 10), y0 = 25;
  rows.forEach((r, i) => {
    const y = y0 + i * 11, mine = me && r.rank === me.rank && r.nickname === me.nickname;
    if (mine) { ctx.fillStyle = '#7a0a40'; ctx.fillRect(44, y - 2, 212, 11); }
    row(r, y, i === 0 ? rainbow[(f >> 2) % 7] : mine ? '#ffffff' : i < 3 ? '#ffe14a' : '#b8b8cc');
  });
  // the prize places
  const n3 = Math.min(3, rows.length), by = y0 - 2, bh = n3 * 11 - 1;
  ctx.fillStyle = '#000'; ctx.fillRect(257, by - 1, 5, bh + 2); ctx.fillStyle = '#ffd21a'; ctx.fillRect(258, by, 1, bh); ctx.fillRect(258, by, 3, 1); ctx.fillRect(258, by + bh - 1, 3, 1);
  drawText(ctx, 'WIN', 266, by + Math.round(bh / 2) - 8, { fill: GRAD.gold, outline: '#000' }); drawText(ctx, 'A', 266, by + Math.round(bh / 2), { fill: GRAD.gold, outline: '#000' }); drawText(ctx, 'PRIZE', 266, by + Math.round(bh / 2) + 8, { fill: GRAD.gold, outline: '#000' });
  if (rows.length > 3) { ctx.fillStyle = '#5a4b7e'; for (let xx = 46; xx < 256; xx += 4) ctx.fillRect(xx, y0 + 3 * 11 - 3, 2, 1); }
  if (pinned) { const y = y0 + 9 * 11 + 2; ctx.fillStyle = '#ff2d7a'; ctx.fillRect(44, y - 2, 212, 11); drawText(ctx, 'YOU', 22, y, { fill: GRAD.gold, outline: '#000' }); row(me, y, '#ffffff'); }
}

// o = { board: { top: [{ rank, nickname, country, level, score }], me }, prompt: 'TAP OR PRESS SPACE TO PLAY', ticker: '...', note: '' }
export function drawHome(ctx, v, f, o = {}) {
  v.tt++;
  const { cur, local } = pos(v), k = local < T_HOLD ? 0 : ease((local - T_HOLD) / T_MOVE), next = (cur + 1) % PAGES;
  drawTunnel(ctx, 'blackhole', 0.3, f, null);
  ctx.fillStyle = 'rgba(5,4,9,0.62)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, PAGE_H); ctx.clip();
  for (const [page, dy] of [[cur, -k * 150], [next, (1 - k) * 150]]) {
    if (dy >= 150) continue;
    ctx.save(); ctx.translate(0, Math.round(dy));
    if (page === 0) titlePage(ctx, v, f); else if (page === 1) prizePage(ctx, v, f); else boardPage(ctx, o.board, f);
    ctx.restore();
  }
  ctx.restore();
  drawText(ctx, (k < 0.5 ? cur + 1 : next + 1) + '/' + PAGES, W - 5, 5, { fill: '#8a8aa8', outline: '#000', align: 'right' });
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, PAGE_H + 2, W, H - PAGE_H - 2);
  if (o.prompt && ((f >> 4) % 4 || o.busy)) drawText(ctx, o.prompt, W / 2, PAGE_H + 7, { fill: o.busy ? GRAD.white : GRAD.gold, outline: '#000', align: 'center' });
  if (o.note) drawText(ctx, o.note, W / 2, PAGE_H + 17, { fill: '#ff8ab4', outline: '#000', align: 'center' });
  if (o.ticker) { const text = o.ticker + '      ', tw = measure(text); for (let x0 = -(f % tw); x0 < W; x0 += tw) drawText(ctx, text, x0, H - 10, { fill: GRAD.pink, outline: '#000' }); }   // one word, round and round, level (no bounce)
}
