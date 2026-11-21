// Black Hole Friday: the game in the browser. The rules are in core.js (the server runs the same file to check scores);
// this file is everything you see and hear around them: the arcade home screen, the warps, the HUD, the sound, the button,
// and the conversation with the server (start a run, send the button log back, register the score).
import { W, H, MAX_HP, RIDE_TICKS, POWER_TICKS, FP, PLAYER_SX, DECK_Y, zoneProgress } from './sim.js';
import { createView, absorbEvents, drawWorld } from './render.js';
import { buildSkins, chrFor, LEVEL_KEYS } from './skins.js';
import * as PORT from './portals.js';
import { createAudio, LEVEL_SONG } from './audio.js';
import { createGame, tick, advance, retry, skipToBoss, skipLevel, total as gameTotal, hpOf, IRIS, encodeToggles, replayGame, CORE_VERSION } from './core.js';
import { createHome, drawHome, homeFlip, homeGoTo } from './home.js';
import { HOLE_COIN } from './coins.js';
import { buildAll, put, tint } from '../chars.js';
import { build as buildGravity } from '../lv-gravity.js';
import { build as buildDune } from '../lv-dune.js';
import { buildCharacters } from '../../rig.js';
import { buildSprites } from '../../sprites.js';
import { drawText, GRAD, buttonImages, textImage } from '../../font.js';

// ====================================================================================================================
// TODO BEFORE GO-LIVE (Andy, 19 Nov). The list of things that are in for TESTING ONLY:
//  1. RETRY: 'TAP TO TRY THIS LEVEL AGAIN' / 'TAP TO FIGHT THE BOSS AGAIN'. In the real game a death ends the run and the
//     score is registered. Set RETRY = false here AND leave BHF_ALLOW_RETRY unset on the server (it then refuses any run that used one).
//  2. DEV: the LEVELS menu (level select, boss select, re-ordering), SKIP TO BOSS, NEXT LEVEL and the B key. Set DEV = false.
//     (Runs that use any of them are never sent to the server, and it could not be fooled by one anyway.)
// ====================================================================================================================
// Both now come from the server (GET /api/bhf/config: retry = BHF_ALLOW_RETRY, dev = BHF_DEV), so the test copy keeps its tools and
// the real game (blackholefriday.vollebak.com) has none. Until the config arrives: the real game.
let RETRY = false;
let DEV = false;

const canvas = document.getElementById('game'), ctx = canvas.getContext('2d', { willReadFrequently: true });
ctx.imageSmoothingEnabled = false;
const $ = (id) => document.getElementById(id);

// ---------- art ----------
const B = buildAll();
B.chr = buildCharacters(); B.spr = buildSprites();
const K = buildGravity(B, 1).kit, D = buildDune(B, 5).kit;
const SKINS = await buildSkins(B, K, D);
const audio = createAudio();
const flash = (f) => tint(f, '#ffffff', 0.85);
const HERO = { run: B.hero.run, runFlash: B.hero.run.map(flash), jump: B.hero.jump, jumpFlash: flash(B.hero.jump), fall: B.hero.fall, fallFlash: flash(B.hero.fall) };
const baseChr = { ...B.chr, jacketSpin: B.jacket, jacketGlow: B.jacket.map((f) => tint(f, '#fff7c0', 1)) };

// ---------- the running order (a test tool: saved in this browser; only the real order can be registered) ----------
let ORDER = (() => { try { const o = JSON.parse(localStorage.getItem('bhf_order')); if (DEV && Array.isArray(o) && o.length === LEVEL_KEYS.length && LEVEL_KEYS.every((k) => o.includes(k))) return o; } catch {} return LEVEL_KEYS.slice(); })();
const saveOrder = () => localStorage.setItem('bhf_order', JSON.stringify(ORDER));
const official = () => ORDER.every((k, i) => k === LEVEL_KEYS[i]);

// ---------- state ----------
// mode: 'home' (the arcade screens) | 'menu' (test level select) | 'run' | 'boss' | 'warp' | 'over' | 'claim' (registering the score)
let mode = 'home', g = null, view = null, A = null, endT = 0, best = +localStorage.getItem('bhf_best') || 0, f = 0;
let rec = null;                                 // this run's button log: { id (server session, or null = practice), toggles, last, presses }
const home = createHome({ hero: B.hero.run, jacket: B.jacket });
function zonesNow() { return ORDER.map((k) => SKINS[k]); }
// a level is the whole world while you are in it: the next level's scenery never shows at its edges
function setLevel(i) { A.chr = chrFor(SKINS[ORDER[i]], baseChr, HERO); A.zones = ORDER.map(() => SKINS[ORDER[i]]); }
function onLevel(gg, i) { setLevel(i); view = createView(); view.lastZone = gg.LV[i].stage ? i : i - 1; }

// ---------- transitions ----------
// run -> boss: an iris closes on him and opens on the arena. boss -> next level: he goes into that level's own portal,
// falls down its tunnel (mode 'warp') and runs out of the far end. The game starts with the wormhole; after the last boss
// the black hole takes him back to level 1, one lap harder.
const WARP_T = 104, INTRO_T = 84;
let warp = null, arrive = null, irisIn = 0, flashT = 0;
// the first black hole coin anyone takes (on this device) stops the game and explains it. No ticks pass while it is up, so the replay is untouched,
// and the tap that closes it is not passed on to the game (it would jump, and bank the coin at once).
let paused = null;                               // the page was hidden mid-run (phone call, app switch, other tab): no ticks pass until a tap
let holeHelp = null, bossCard = null, fistFor = null, invFor = null, invCardFn = null;
// the split-screen level draws its own how-to card (with its own sprites): fetched lazily so a broken level file cannot stop the game loading
import('./levels/tenet-film.js').then((m) => { invCardFn = m.invCard || null; }).catch(() => {});
const HOLE_SEEN = 'bhf_seen_hole';
// test browsers (navigator.webdriver) skip both cards unless a test asks for them with window.__cards = true
const cardsOn = () => (window.__cards ?? !navigator.webdriver);
// before each boss on the first loop: what to do, on a card, with the game stopped (no ticks pass: the replay is untouched)
const HOWTO = {
  neon: [['HE RUNS AT YOU ALONG THE ROOF.', 0], ['JUMP AS HE COMES, AND LAND', 1], ['ON HIS HEAD. THREE STOMPS.', 1], ['', 0], ['TAP = JUMP.  TAP AGAIN IN THE AIR', 0], ['= DOUBLE JUMP.', 0]],
  ice: [['A SINGULARITY: DON\'T TOUCH IT.', 1], ['IT BOUNCES ROUND, GROWS, AND', 0], ['COMES FOR YOU. JUMP OVER IT.', 1], ['', 0], ['LAST UNTIL THE BAR AT THE TOP', 0], ['FILLS AND IT COLLAPSES.', 0]],
  hive: [['TAIL ATTACK: JUMP.', 1], ['ACID ATTACK: DOUBLE JUMP.', 1]],
  code: [['ROUND 1: A SHOOTOUT.', 1]],   // drawn by drawCodeCard (pictures); this entry just switches the card on
  desert: [['GET TO THE ROCK BEFORE THE STORM.', 1], ['HOLD = WALK.  LET GO = STAND STILL.', 1], ['', 0], ['SHAKING SAND = THE WORM IS ABOUT', 0], ['TO BURST UP THERE. DON\'T BE ON IT:', 0], ['WAIT FOR IT TO SINK, OR WALK OFF IT.', 0]],
  tenet: [['CROSS THE ROOM SIX TIMES.', 1], ['EACH RUN COMES BACK AS YOU, INVERTED IN TIME.', 0], ['DON\'T TOUCH THEM. TAP TO JUMP.', 1]],
};
function startWarp(kind, then, n = WARP_T, text = null) { warp = { kind, t: 0, n, then, text }; mode = 'warp'; audio.stop(); audio.sfx('tunnel'); }
function arrived(kind) { arrive = { kind, d0: g.sim.dist, t: 0 }; flashT = 12; audio.sfx('arrive'); }
function startRun() { mode = 'run'; audio.song(LEVEL_SONG[ORDER[g.idx]]); }
function bossOn() { mode = 'boss'; arrive = null; irisIn = 1; audio.sfx('boss'); audio.song('bhf_boss'); if (g && !g.lap && cardsOn() && HOWTO[ORDER[g.idx]]) bossCard = { t: 0, key: ORDER[g.idx] }; }
// o = { seed, id (server session), lap }
function play(i = 0, bossOnly = false, intro = false, o = {}) {
  A = { spr: B.spr, chr: null, zones: zonesNow() };
  rec = { id: o.id || null, toggles: [], last: false, presses: [], sent: false };
  warp = arrive = null; irisIn = 0; flashT = 0; down = false; latch = false;
  g = createGame(o.seed ?? ((Math.random() * 4294967296) >>> 0), zonesNow(), { A, start: i, bossOnly, lap: o.lap || 0, onLevel });
  menu(false); panel(null); audio.unlock();
  if (g.mode === 'boss') { bossOn(); irisIn = 0; }
  else if (intro) startWarp('wormhole', () => { startRun(); arrived('wormhole'); }, INTRO_T); else startRun();
}
const total = () => (g ? gameTotal(g) : 0);
function saveBest() { if (total() > best) { best = total(); localStorage.setItem('bhf_best', best); } }
const registrable = () => !!(g && rec && rec.id && g.clean && !rec.sent && (RETRY ? cfg.retry : g.retries === 0));
function gameOver() {
  mode = 'over'; arrive = null; irisIn = 0; endT = f; saveBest(); audio.sfx('die'); audio.stop(); audio.jingle('over', false);
  if (!RETRY) setTimeout(() => (registrable() ? finish() : null), 1400);     // the real game: a death is the end, and the score goes in
  $('reg').hidden = !(RETRY && registrable());
}
function goHome(page = null) { mode = 'home'; g = null; warp = arrive = null; menu(false); panel(null); $('reg').hidden = true; audio.song('bhf_menu'); if (page !== null) homeGoTo(home, page); loadBoard(); }

// ---------- the button: hold for a higher jump, tap again in the air for a double jump ----------
// What the game is given each tick is just "is the button down". A tap shorter than a tick still counts as one tick of down (latch).
let down = false, latch = false, pressMeta = null;
const isUI = (e) => e.target.closest && e.target.closest('#menu, #dev, #panel, #rotate, button, input, label, a, form');
function press(e, kind) {
  if (cover) return dismissCover();
  if (audio.gated) audio.open();          // no sound at all until the first tap; that tap also plays as normal
  audio.unlock();
  if (paused) { if (paused.t > 20) paused = null; return; }             // the tap that lifts the pause is not passed on (as the cards)
  if (bossCard) { if (bossCard.t > 45) bossCard = null; return; }
  if (holeHelp) { if (holeHelp.t > 45) { holeHelp = null; try { localStorage.setItem(HOLE_SEEN, '1'); } catch {} } return; }
  if (mode === 'home') {                                                   // top right corner = next screen; anywhere else = play
    if (e && e.clientX !== undefined) { const r = canvas.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H; if (x > 250 && y < 30) return homeFlip(home); }
    return startGame();
  }
  if (mode === 'over' && f - endT > 30) { if (RETRY) doRetry(); else if (!registrable() && !rec.sent) goHome(); return; }
  if (down) return;
  down = true; latch = true;
  if (g && (mode === 'run' || mode === 'boss' || mode === 'warp') && rec.presses.length < 5000) pressMeta = { tick: g.t + 1, at: performance.now(), kind, trusted: e ? e.isTrusted : true,
    r: e && e.width ? Math.round(e.width * 10) / 10 : 0, p: e && e.pressure ? Math.round(e.pressure * 100) / 100 : 0 };
}
function release() {
  if (!down) return; down = false;
  if (pressMeta && rec) { pressMeta.ms = Math.round(performance.now() - pressMeta.at); delete pressMeta.at; rec.presses.push(pressMeta); }
  pressMeta = null;
}
function doRetry() { $('reg').hidden = true; retry(g); if (g.mode === 'boss') { bossOn(); irisIn = 0; bossCard = null; } else startRun(); }
// preventDefault below stops a click from moving keyboard focus into this frame, so on the vollebak.com page SPACE went on scrolling the page: take focus here
addEventListener('pointerdown', (e) => { try { window.focus(); } catch {} if (isUI(e)) return; e.preventDefault(); press(e, e.pointerType || 'mouse'); }, { passive: false });
const START = matchMedia('(pointer: coarse)').matches ? 'TAP TO START' : 'SPACEBAR OR CLICK TO START';
addEventListener('pointerup', release); addEventListener('pointercancel', release);
addEventListener('keydown', (e) => {
  if (e.target.closest && e.target.closest('input, textarea')) return;
  if (cover) { if (!e.repeat && !e.metaKey && !e.ctrlKey && !e.altKey && !['Tab', 'Escape', 'Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) { e.preventDefault(); dismissCover(); } return; }
  if (['Space', 'ArrowUp', 'KeyW', 'Enter'].includes(e.code)) { e.preventDefault(); if (!e.repeat) press(e, 'key'); }
  if (mode === 'home' && ['ArrowRight', 'ArrowDown', 'ArrowLeft'].includes(e.code)) homeFlip(home);
  if (e.code === 'Escape' && mode !== 'claim') goHome();
  if (DEV && e.code === 'KeyB' && mode === 'run') { skipToBoss(g); if (g.mode === 'boss') bossOn(); }
  if (e.code === 'KeyR' && mode === 'over' && registrable()) finish();
});
addEventListener('keyup', (e) => { if (['Space', 'ArrowUp', 'KeyW', 'Enter'].includes(e.code)) release(); });
addEventListener('blur', release);
document.addEventListener('touchmove', (e) => { if (!isUI(e)) e.preventDefault(); }, { passive: false });
// phones (as FWAHBL): a quick double tap (a double jump, on the game or a JUMP button) must never zoom the page, nor a pinch.
// Form fields, links and buttons still get their clicks. None of this touches press()/release(): pointer events come first.
const tappable = (t) => t.closest && t.closest('input, label, a, select, textarea, button');
document.addEventListener('touchend', (e) => { if (!tappable(e.target)) e.preventDefault(); }, { passive: false });
document.addEventListener('dblclick', (e) => e.preventDefault(), { passive: false });
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
// a long press (holding JUMP) must not open the browser's menu (Android: 'save image' / text selection)
document.addEventListener('contextmenu', (e) => { if (!(e.target.closest && e.target.closest('input, textarea, a, #panel'))) e.preventDefault(); });
document.addEventListener('selectstart', (e) => { if (!(e.target.closest && e.target.closest('input, textarea, #panel'))) e.preventDefault(); });
// page hidden mid-run (phone call, app switch, another tab): let go of the button, stop the music, and hold the game on a PAUSED card.
// No ticks pass while it is up (like the boss cards), so the replay is untouched. Back again: no catch-up burst of ticks.
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    release(); latch = false; audio.pause();
    if (g && !cover && (mode === 'run' || mode === 'boss' || mode === 'warp') && !paused) paused = { t: 0 };
  } else { last = performance.now(); acc = 0; audio.resume(); }
});
addEventListener('pageshow', (e) => { if (e.persisted) { last = performance.now(); acc = 0; audio.resume(); } });

// ---------- the server: start a run, send it back, register ----------
let cfg = { online: false, open: false, retry: false, turnstileSiteKey: '' }, board = null, pid = localStorage.getItem('bhf_pid') || '', starting = false, homeNote = '';
const BID = (() => { let b = localStorage.getItem('bhf_bid'); if (!b) { b = crypto.randomUUID(); localStorage.setItem('bhf_bid', b); } return b; })();
async function api(route, body) {
  const r = await fetch('/api/bhf/' + route, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {});
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || 'HTTP ' + r.status), { code: j.error, status: r.status });
  return j;
}
async function loadBoard() { try { board = await api('leaderboard' + (pid ? '?pid=' + encodeURIComponent(pid) : '')); } catch { board = { off: true }; } }
// Cloudflare's invisible browser check (as FWAHBL). If it can't run, the run still starts with no token: the server marks it and a high score goes under review.
let tsReady = null, tsWhy = '', tsNext = null;
function fetchTurnstile() {
  if (!cfg.turnstileSiteKey) return Promise.resolve('');
  const fail = (why) => { tsWhy = why; return ''; };
  tsReady = tsReady || new Promise((res) => { const s = document.createElement('script'); s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'; s.onload = () => res(true); s.onerror = () => res(false); setTimeout(() => res(false), 8000); document.head.appendChild(s); });
  const token = tsReady.then((ok) => (!ok || !window.turnstile ? fail('noscript') : new Promise((res) => {
    try { const id = window.turnstile.render('#turnstile', { sitekey: cfg.turnstileSiteKey, size: 'invisible',
      callback: (t) => { tsWhy = ''; res(t); setTimeout(() => { try { window.turnstile.remove(id); } catch {} }, 0); },
      'error-callback': (code) => { res(fail('error' + String(code || '').replace(/\D/g, '').slice(0, 6))); return true; }, 'timeout-callback': () => res(fail('expired')) }); }
    catch { res(fail('render')); }
  })));
  return Promise.race([token, new Promise((res) => setTimeout(() => res(fail('slow')), 8000))]);
}
function prefetchTurnstile() { if (cfg.turnstileSiteKey && !tsNext) tsNext = { at: Date.now(), p: fetchTurnstile() }; }
async function turnstileToken() {
  if (!cfg.turnstileSiteKey) return '';
  if (tsNext && Date.now() - tsNext.at > 270000) tsNext = null;
  prefetchTurnstile(); const t = await tsNext.p; tsNext = null; setTimeout(prefetchTurnstile, 1500); return t;
}
const WHY = { rate: 'TOO MANY GAMES THIS HOUR: PRACTICE ONLY', closed: 'THE COMPETITION IS CLOSED: PRACTICE ONLY', version: 'NEW VERSION: PLEASE RELOAD THE PAGE' };
async function startGame() {
  if (starting) return; starting = true; homeNote = '';
  let id = null, seed;
  if (!official()) homeNote = 'TEST ORDER: PRACTICE ONLY';
  else if (!cfg.online) homeNote = 'OFFLINE: PRACTICE ONLY';
  else try { const st = await api('start', { turnstile: await turnstileToken(), tsWhy, bid: BID, v: CORE_VERSION }); id = st.id; seed = st.seed; }
  catch (e) { homeNote = WHY[e.code] || 'OFFLINE: PRACTICE ONLY'; }
  starting = false;
  if (mode === 'home') play(0, false, true, { seed, id });
}
// the run is over (or, while testing, the player chose to stop here): the server replays the button log and tells us what it really scored
async function finish() {
  if (!registrable()) return;
  rec.sent = true; mode = 'claim'; $('reg').hidden = true;
  panel(`<h2>CHECKING YOUR SCORE</h2><p class="sub">The server is replaying your game…</p>`);
  let r;
  try { r = await api('end', { id: rec.id, endTick: g.t, toggles: encodeToggles(rec.toggles), score: total(), presses: rec.presses, retries: g.retries, pid, v: CORE_VERSION,
    ua: { touch: navigator.maxTouchPoints || 0, w: screen.width, h: screen.height } }); }
  catch (e) {
    const msg = e.code === 'bot' ? 'NO BOTS. This game is for people.' : e.code === 'retry' ? 'This run used TRY AGAIN, which is for testing only, so it cannot be registered.' : e.code === 'mismatch' ? 'This score could not be verified. Reload the page and play again.' : 'Could not reach the scoreboard (' + (e.code || e.message) + ').';
    return panel(`<h2>SCORE NOT REGISTERED</h2><p class="sub">${msg}</p><div class="row"><button data-p="home" class="big">OK</button></div>`);
  }
  const nick = localStorage.getItem('bhf_nick') || '', mail = localStorage.getItem('bhf_mail') || '';
  panel(`<h2>SCORE ${r.score.toLocaleString('en-US')}</h2><p class="sub">That would put you <b>#${r.rank}</b> on the board. The top 3 win. One entry per player: your best score counts.</p>
    <form id="claim" autocomplete="on">
      <label>NAME ON THE BOARD <input name="nickname" maxlength="6" pattern="[A-Za-z0-9_]{3,6}" required value="${nick}" placeholder="3 TO 6 LETTERS" autocapitalize="characters" autocomplete="nickname"></label>
      <label>EMAIL (so we can tell you if you win) <input name="email" type="email" required value="${mail}" autocomplete="email"></label>
      <label class="ck"><input type="checkbox" name="terms" required> I agree to the <a href="/bhf-terms" target="_blank" rel="noopener" style="color:inherit">competition terms</a></label>
      <label class="ck"><input type="checkbox" name="consent" checked> Send me Vollebak news</label>
      <p class="err" id="claimErr"></p>
      <div class="row"><button class="big" type="submit">REGISTER MY SCORE</button><button type="button" data-p="home" class="ghost">NO THANKS</button></div>
    </form>`);
  $('claim').addEventListener('submit', async (ev) => {
    ev.preventDefault(); const fd = new FormData(ev.target), nickname = String(fd.get('nickname') || '').toUpperCase().trim(), email = String(fd.get('email') || '').trim();
    const ERR = { nickname: 'Names are 3 to 6 letters or numbers.', name_taken: 'Someone already has that name. Pick another.', email: 'That email address does not look right.', email_throwaway: 'Please use your real email address.', terms: 'Please tick the terms box.', used: 'This score is already registered.', expired: 'This run is too old to register.', closed: 'The competition is closed.' };
    try {
      const c = await api('claim', { id: rec.id, nickname, email, terms: fd.get('terms') === 'on', consent: fd.get('consent') === 'on' });
      pid = c.pid; localStorage.setItem('bhf_pid', pid); localStorage.setItem('bhf_nick', nickname); localStorage.setItem('bhf_mail', email);
      const line = c.review ? 'Your score is in and is being checked. It will show on the board once it has been cleared.'
        : c.improved ? `You are <b>#${c.rank}</b> with ${c.best.toLocaleString('en-US')}.` + (c.rank <= 3 ? ' That is a prize place. Hold on to it.' : '') : `Your best is still ${c.best.toLocaleString('en-US')} (#${c.rank}).`;
      panel(`<h2>${c.review ? 'SCORE RECEIVED' : c.improved ? 'YOU ARE ON THE BOARD' : 'NOT YOUR BEST'}</h2><p class="sub">${line}</p><div class="row"><button data-p="board" class="big">HIGH SCORES</button></div>`);
    } catch (e) { $('claimErr').textContent = ERR[e.code] || 'Something went wrong (' + (e.code || e.message) + '). Try again.'; }
  });
}
const $panel = $('panel');
function panel(html) { if (!html) { $panel.hidden = true; $panel.innerHTML = ''; return; } $panel.hidden = false; $panel.innerHTML = '<div class="card">' + html + '</div>'; const i = $panel.querySelector('input:not([value]), input[value=""]'); if (i) i.focus(); }
$panel.addEventListener('click', (e) => { const b = e.target.closest('button[data-p]'); if (!b) return; goHome(b.dataset.p === 'board' ? 2 : null); });
$('reg').addEventListener('click', (e) => { e.currentTarget.blur(); finish(); });

// ---------- the cover: the home screen greyed out under a flashing TAP TO PLAY ----------
// Nothing plays until the first tap/click/key, which only lifts the cover and starts the music (it does not start a game).
// Test browsers (navigator.webdriver) skip it unless a test asks for it with window.__cover = true.
let cover = window.__cover ?? false;   // the cover is switched off (owner, 20 Nov): the home screen is ready straight away; sound starts on the first tap
function dismissCover() {
  if (!cover) return; cover = false; down = false; latch = false;
  audio.open(); audio.unlock(); home.tt = 0;
}
const COVER_BLINK = 60;                          // FWAHBL's splash: blink 1s steps(2): half a second on, half off
const COVER_LINES = ['WIN A FULL METAL JACKET!', 'TAP TO PLAY'];
function drawCover(fr, text = true) {
  home.tt = 0;                                   // hold the title page (drawHome steps it on by one each frame)
  drawHome(ctx, home, fr, { board, prompt: null, ticker: 'VOLLEBAK' });
  ctx.fillStyle = 'rgba(8,4,16,0.82)'; ctx.fillRect(0, 0, W, H);   // FWAHBL #splash background
  if (text) drawCoverText(fr);
}
function drawCoverText(fr) {
  if (fr % COVER_BLINK >= COVER_BLINK / 2) return;
  const lh = 7 * 2 + 3, y0 = Math.round(H / 2 - (lh * 2 - 3) / 2);
  COVER_LINES.forEach((s, i) => drawText(ctx, s, W / 2, y0 + i * lh, { scale: 2, fill: GRAD.gold, outline: '#000', shadow: '#000', align: 'center' }));
}

// ---------- FULL SCREEN + SOUND: FWAHBL's dark pixel buttons (font.js buttonImages), stacked bottom right inside the game ----------
function pxButton(b) {
  const k = canvas.getBoundingClientRect().width / W || 3, im = buttonImages(b.dataset.label, 'dark');
  for (const c of [im.up, im.down]) { c.style.width = c.width * k + 'px'; c.style.height = c.height * k + 'px'; }
  im.up.className = 'up'; im.down.className = 'dn';
  b.replaceChildren(im.up, im.down); b.setAttribute('aria-label', b.dataset.label);
}
const $mute = document.querySelector('#hud [data-a=mute]'), $full = document.querySelector('#hud [data-a=full]');
function layoutButtons() { for (const b of [$mute, $full]) if (b.dataset.label) pxButton(b); }
for (const b of [$mute, $full]) {
  b.addEventListener('mousedown', (e) => e.preventDefault());          // never takes focus, so SPACE always means jump
  b.addEventListener('pointerdown', () => b.classList.add('pressed'));
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => b.classList.remove('pressed'));
}
addEventListener('resize', () => layoutButtons()); window.bhfAfterFit = () => layoutButtons();   // and again once bhf-play.html has refitted the game
$mute.addEventListener('click', (e) => { e.stopPropagation(); audio.toggle(); muteLabel(); });
$full.addEventListener('click', (e) => { e.stopPropagation(); toggleFull(); });
function muteLabel() { $mute.dataset.label = audio.muted ? 'SOUND OFF' : 'SOUND ON'; pxButton($mute); }
// FULL SCREEN: the whole page (inside the vollebak.com frame too: it has allow="fullscreen"). Hidden where a page can't go full screen
// (iPhone Safari, a frame without permission) and when already running as an installed app.
const isPhoneUA = /iPhone|iPod/.test(navigator.userAgent), coarse = matchMedia('(pointer: coarse)').matches;
const fsOK = !!(document.fullscreenEnabled || document.webkitFullscreenEnabled) && !isPhoneUA && !(navigator.standalone === true || matchMedia('(display-mode: standalone)').matches);
const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
function fullLabel() { $full.hidden = !fsOK; $full.dataset.label = isFull() ? (coarse ? 'EXIT' : 'EXIT FULL SCREEN') : 'FULL SCREEN'; pxButton($full); }
function toggleFull() {
  if (!fsOK) return;
  try {
    if (isFull()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    const de = document.documentElement, r = (de.requestFullscreen || de.webkitRequestFullscreen).call(de, { navigationUI: 'hide' });
    Promise.resolve(r).then(() => { if (coarse && screen.orientation && screen.orientation.lock) return screen.orientation.lock('landscape'); }).catch(() => {});
  } catch {}
}
document.addEventListener('fullscreenchange', () => { fullLabel(); setTimeout(layoutButtons, 100); }); document.addEventListener('webkitfullscreenchange', () => { fullLabel(); setTimeout(layoutButtons, 100); });
// ---------- phones: FWAHBL's arcade JUMP buttons either side of the game (CSS shows them on touch screens only) ----------
// They are only pictures: a touch on one is an ordinary pointerdown on the page, so it goes through exactly the same
// press()/release() and press log (kind 'touch', isTrusted, contact size) as a tap on the game itself.
function arcadeButton(pressed) {
  const c = document.createElement('canvas'); c.width = 48; c.height = 48; const x = c.getContext('2d');
  const ring = (r, col) => { x.fillStyle = col; x.beginPath(); x.arc(24, 24, r, 0, Math.PI * 2); x.fill(); };
  ring(23, '#000'); ring(22, '#3a3448'); ring(20, '#1a1424'); ring(18, '#000');            // housing (FWAHBL's)
  const dy = pressed ? 2 : 0;
  x.fillStyle = '#7a5a00'; x.beginPath(); x.arc(24, 25 + dy, 16, 0, Math.PI * 2); x.fill();     // dome side: FWAHBL's pink, in BHF yellow
  x.fillStyle = pressed ? '#c99c00' : '#ffd21a'; x.beginPath(); x.arc(24, 22 + dy, 15, 0, Math.PI * 2); x.fill();
  if (!pressed) { x.fillStyle = '#fff3a8'; x.beginPath(); x.ellipse(18, 15, 6, 3, -0.5, 0, Math.PI * 2); x.fill(); }
  drawText(x, 'JUMP', 24, 19 + dy, { fill: '#ffffff', outline: '#000000', align: 'center' });
  const d = x.getImageData(0, 0, 48, 48);                                                    // hard pixel edges
  for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] < 128 ? 0 : 255;
  x.putImageData(d, 0, 0);
  return 'url(' + c.toDataURL() + ')';
}
const PADS = [$('jumpL'), $('jumpR')].filter(Boolean), PAD = { up: arcadeButton(false), down: arcadeButton(true) };
for (const p of PADS) p.style.backgroundImage = PAD.up;
let padShown = false;
function syncPads() { if (padShown === down) return; padShown = down; for (const p of PADS) p.style.backgroundImage = down ? PAD.down : PAD.up; }
// the 'turn your phone' prompt (as FWAHBL): pixel text, and PLAY UPRIGHT for anyone who'd rather not turn it (remembered)
if (localStorage.getItem('bhf_upright') === '1') document.body.classList.add('upright');
function rotateUI() {
  const t = $('rotateText'), b = $('btnUpright'); if (!t || !b) return;
  const im = textImage('TURN YOUR PHONE\nSIDEWAYS', { scale: 2, fill: GRAD.gold, shadow: '#000', align: 'center' }), k = Math.max(2, Math.min(4, Math.floor(innerWidth * 0.8 / im.width)));
  im.style.width = im.width * k + 'px'; im.style.height = im.height * k + 'px'; t.replaceChildren(im);
  const bi = buttonImages('PLAY UPRIGHT', 'dark'), kb = Math.max(2, Math.min(3, k - 1));
  for (const cv of [bi.up, bi.down]) { cv.style.width = cv.width * kb + 'px'; cv.style.height = cv.height * kb + 'px'; }
  bi.up.className = 'up'; bi.down.className = 'dn'; b.replaceChildren(bi.up, bi.down); b.setAttribute('aria-label', 'PLAY UPRIGHT');
}
if ($('btnUpright')) {
  rotateUI(); addEventListener('resize', rotateUI);
  const b = $('btnUpright');
  b.addEventListener('pointerdown', () => b.classList.add('pressed'));
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) b.addEventListener(ev, () => b.classList.remove('pressed'));
  b.addEventListener('click', (e) => { e.stopPropagation(); document.body.classList.add('upright'); try { localStorage.setItem('bhf_upright', '1'); } catch {} if (window.bhfFit) window.bhfFit(); layoutButtons(); });
}
// Android phones (as FWAHBL): the first tap also goes full screen and locks the game sideways (no browser bars). iPhone can't.
// On the finger's lift: for a touch, browsers only count pointerup (not pointerdown) as the tap that may open full screen.
let autoFull = coarse && fsOK && !isFull();
addEventListener('pointerup', (e) => {
  if (!autoFull || !e.isTrusted || (e.target.closest && e.target.closest('#panel, #menu, #dev, input, a, button'))) return;
  autoFull = false; toggleFull();
}, { capture: true });
// iPhone only lets sound start on a touch that ends: open it again there too
addEventListener('touchend', () => { if (!cover) audio.unlock(); }, { passive: true });

// ---------- the test menu: re-order the levels, play from any level, or jump straight to its boss ----------
const $menu = $('menu');
function menu(show) {
  if (!show || !DEV) { $menu.hidden = true; return; }
  mode = 'menu'; g = null; warp = arrive = null; panel(null); $('reg').hidden = true; $menu.hidden = false; audio.song('bhf_menu');
  $menu.innerHTML = `<h1>BLACK HOLE FRIDAY · TEST MENU</h1><p class="sub">Change the order with ▲▼ (saved in this browser). PLAY starts that level; BOSS jumps straight to its boss. Nothing played from here is registered.</p>` +
    ORDER.map((k, i) => `<div class="row"><span class="n">${i + 1}</span><span class="nm">${SKINS[k].name}</span>
      <button data-mv="${i},-1" ${i ? '' : 'disabled'}>▲</button><button data-mv="${i},1" ${i < ORDER.length - 1 ? '' : 'disabled'}>▼</button>
      <button data-play="${i}">PLAY</button><button data-boss="${i}">BOSS</button><button data-lap="${i}">LOOP 2</button></div>`).join('') +
    `<div class="row"><button data-home class="big">BACK TO THE HOME SCREEN</button><button data-reset class="ghost">RESET ORDER</button></div><p class="sub">Best ${best}. Tap / space to jump, again for a double jump, hold for higher. B = skip to the boss. Esc = home screen.</p>`;
}
$menu.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.mv) { const [i, d] = b.dataset.mv.split(',').map(Number); [ORDER[i], ORDER[i + d]] = [ORDER[i + d], ORDER[i]]; saveOrder(); menu(true); }
  else if (b.dataset.play) play(+b.dataset.play, false, true);
  else if (b.dataset.boss) play(+b.dataset.boss, true);
  else if (b.dataset.lap) play(+b.dataset.lap, false, false, { lap: 1 });
  else if ('home' in b.dataset) goHome();
  else if ('reset' in b.dataset) { ORDER = LEVEL_KEYS.slice(); saveOrder(); menu(true); }
});
$('dev').addEventListener('click', (e) => {
  const b = e.target.closest('button'); if (!b) return; b.blur(); const a = b.dataset.a;
  if (a === 'menu') menu(true);
  if (!DEV || !g) return;
  if (a === 'boss' && mode === 'run') { skipToBoss(g); if (g.mode === 'boss') bossOn(); }
  if (a === 'next' && (mode === 'run' || mode === 'boss')) { skipLevel(g); audio.stop(); advance(g); arrive = null; irisIn = 0; startRun(); }
});
function devTools() {          // the test tools (LEVELS, SKIP TO BOSS, NEXT LEVEL, the PROTOTYPE label): only when the server says this is the test copy
  $('dev').hidden = !DEV; if (window.bhfFit) window.bhfFit(); layoutButtons();
  if (DEV) { try { const o = JSON.parse(localStorage.getItem('bhf_order')); if (Array.isArray(o) && o.length === LEVEL_KEYS.length && LEVEL_KEYS.every((k) => o.includes(k))) ORDER = o; } catch {} }
}
devTools();

// ---------- HUD ----------
function hud() {
  drawText(ctx, 'SCORE ' + String(total()).padStart(6, '0'), 4, 4, { fill: GRAD.gold, outline: '#000' });
  drawText(ctx, (g.lap ? 'LOOP ' + (g.lap + 1) + '  ' : '') + 'LEVEL ' + (g.idx + 1), W - 4, 4, { fill: GRAD.white, outline: '#000', align: 'right' });
  const hp = hpOf(g), sim = g.sim;
  for (let k = 0; k < MAX_HP; k++) { ctx.globalAlpha = k < hp ? 1 : 0.2; put(ctx, B.jacketIcon[0], 10 + k * 13, 32); } ctx.globalAlpha = 1;
  if (mode === 'run' && !g.stage && (sim.star > 0 || sim.triple > 0)) {                 // how long the power-up has left
    const ride = sim.ride > 0, t = ride ? sim.ride : Math.max(sim.star, sim.triple), full = ride ? (SKINS[ORDER[g.idx]].danger?.ride?.ticks || RIDE_TICKS) : POWER_TICKS;
    if (t > 120 || (f >> 3) % 2) { ctx.fillStyle = '#000'; ctx.fillRect(4, 36, 62, 5); ctx.fillStyle = ride ? '#ffd21a' : sim.star > 0 ? '#5fff6a' : '#8ab8f0'; ctx.fillRect(5, 37, Math.round(60 * Math.min(1, t / full)), 3); }
  }
}

// ---------- loop ----------
function update() {
  f++;
  if (paused || holeHelp || bossCard) { (paused || holeHelp || bossCard).t++; latch = false; return; }
  if (mode === 'run' || mode === 'boss') {
    const d = down || latch; latch = false;
    if (d !== rec.last) { rec.toggles.push(g.t + 1); rec.last = d; }
    const running = g.mode === 'run' && !g.stage;
    tick(g, d);
    if (running) absorbEvents(view, g.sim, A);
    if (g.mode === 'boss' && g.boss && g.boss.st.ph === 2 && fistFor !== g.boss && ORDER[g.idx] === 'code' && !g.lap && cardsOn()) { fistFor = g.boss; bossCard = { t: 0, key: 'fist' }; }   // round 2: stop and explain the fist fight
    if (g.mode === 'run' && !g.stage && invFor !== g && ORDER[g.idx] === 'tenet' && !g.lap && g.sim.film && zoneProgress(g.sim) >= g.sim.danger.film.mid + 22 && cardsOn()) { invFor = g; bossCard = { t: 0, key: 'inv' }; }   // level 6: he has just come out of the turnstile, running back. Stop once and say so
    if (running && g.ev.includes('hole') && cardsOn() && !localStorage.getItem(HOLE_SEEN)) holeHelp = { t: 0 };
    audio.events(g.ev);
    if (arrive && ++arrive.t > 90) arrive = null;
    if (irisIn && ++irisIn > IRIS) irisIn = 0;
    if (g.note === 'over') return gameOver();
    if (g.note === 'boss') bossOn();
    if (g.note === 'warp') { const kind = g.warpKind, loop = g.warpLast; if (loop) saveBest(); startWarp(kind, () => { advance(g); startRun(); arrived(kind); }, loop ? WARP_T + 60 : WARP_T, loop ? ['LOOP ' + (g.lap + 2), 'EVERYTHING GETS HARDER'] : null); }
  } else if (mode === 'warp') {
    if (++warp.t >= warp.n) { const w = warp; warp = null; w.then(); }
  }
  latch = false;
  if (flashT > 0) flashT--;
}
function draw() {
  if (cover) return drawCover(f);
  if (mode === 'home') return drawHome(ctx, home, f, { board, prompt: starting ? 'STARTING...' : START, busy: starting, note: homeNote,
    ticker: 'VOLLEBAK' });
  if (mode === 'menu' || !g) { ctx.fillStyle = '#050409'; ctx.fillRect(0, 0, W, H); return; }
  if (mode === 'warp') {
    PORT.drawTunnel(ctx, warp.kind, warp.t / warp.n, f, A.chr.hero);
    if (warp.text && warp.t > 30) { drawText(ctx, warp.text[0], W / 2, 58, { scale: 3, fill: GRAD.gold, outline: '#000', shadow: '#000', align: 'center' }); if ((f >> 3) % 2) drawText(ctx, warp.text[1], W / 2, 88, { fill: GRAD.white, outline: '#000', align: 'center' }); }
    return;
  }
  if (g.stage) g.stage.draw(ctx, f);
  else if (g.boss) g.boss.draw(ctx, f);
  else drawWorld(ctx, g.sim, A, view);
  if (arrive && mode === 'run' && !g.stage) {                                          // the far end of the portal he came through, closing behind him
    const x = PLAYER_SX - (g.sim.dist - arrive.d0) / FP, k = arrive.t < 22 ? 1 : 1 - (arrive.t - 22) / 26;
    if (x > -50 && k > 0) PORT.drawPortalAt(ctx, arrive.kind, x, DECK_Y - Math.round(view.camY), k, f);
  }
  const out = mode === 'run' && g.cutOn;
  if (out || irisIn) {                                                     // a round hole in black, centred on him
    const e = (out ? g.cut : irisIn) / IRIS, bh = !out && g.boss ? g.boss.st.h : null, cx = bh ? bh.x : g.stage ? W / 2 : PLAYER_SX, cy = bh ? bh.y - 15 : g.stage ? H / 2 : Math.round(g.sim.y / FP - view.camY) - 15;
    const R = out ? 270 * (1 - e) * (1 - e) : 300 * e * e; ctx.fillStyle = '#000';
    for (let y = 0; y < H; y++) { const dy = y - cy, hw = Math.abs(dy) < R ? Math.sqrt(R * R - dy * dy) : 0; if (hw <= 0) ctx.fillRect(0, y, W, 1); else { const l = Math.round(cx - hw), r = Math.round(cx + hw); if (l > 0) ctx.fillRect(0, y, l, 1); if (r < W) ctx.fillRect(r, y, W - r, 1); } }
  }
  if (flashT > 0) { ctx.globalAlpha = flashT / 12; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  hud();
  if (holeHelp) drawHoleHelp(holeHelp.t);
  if (bossCard) drawBossCard(bossCard);
  if (paused) drawPaused(paused.t);
  if (mode === 'over' || mode === 'claim') {
    ctx.globalAlpha = 0.6; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
    drawText(ctx, 'GAME OVER', W / 2, 52, { scale: 3, fill: GRAD.red, outline: '#000', align: 'center' });
    drawText(ctx, 'SCORE ' + total().toLocaleString('en-US'), W / 2, 84, { scale: 2, fill: GRAD.gold, outline: '#000', align: 'center' });
    if (mode === 'over') {
      if (RETRY) { if ((f >> 4) % 2) drawText(ctx, g.cause === 'boss' ? 'TAP TO FIGHT THE BOSS AGAIN' : 'TAP TO TRY THIS LEVEL AGAIN', W / 2, 110, { fill: GRAD.white, outline: '#000', align: 'center' }); drawText(ctx, registrable() ? 'OR PRESS R TO REGISTER THIS SCORE' : rec.sent ? '' : 'PRACTICE RUN: NOT REGISTERED', W / 2, 124, { fill: '#8a8aa8', outline: '#000', align: 'center' }); drawText(ctx, '(TRY AGAIN IS FOR TESTING ONLY)', W / 2, 136, { fill: '#5a4b7e', outline: '#000', align: 'center' }); }
      else if (!registrable() && !rec.sent) { drawText(ctx, 'PRACTICE RUN: NOT REGISTERED', W / 2, 110, { fill: '#8a8aa8', outline: '#000', align: 'center' }); if ((f >> 4) % 2) drawText(ctx, 'TAP TO GO ON', W / 2, 124, { fill: GRAD.white, outline: '#000', align: 'center' }); }
    }
  }
}
function drawFistCard(t) {
  ctx.globalAlpha = 0.8; ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  ctx.fillStyle = '#000'; ctx.fillRect(6, 4, W - 12, H - 8); ctx.fillStyle = '#ff8a1a'; ctx.fillRect(7, 5, W - 14, 1); ctx.fillRect(7, H - 5, W - 14, 1); ctx.fillRect(7, 5, 1, H - 10); ctx.fillRect(W - 8, 5, 1, H - 10);
  drawText(ctx, 'ROUND 2: THE FIST FIGHT', W / 2, 12, { scale: 2, fill: GRAD.red, outline: '#000', shadow: '#000', align: 'center' });
  const ring = (cx, cy, r, col) => { ctx.fillStyle = col; for (let a = 0; a < 64; a++) { const x = Math.round(cx + r * Math.cos(a * Math.PI / 32)), y = Math.round(cy + r * Math.sin(a * Math.PI / 32)); ctx.fillRect(x, y, 2, 2); } };
  // 1. PUNCH: one picture, a ring shrinking onto his fist, gold + TAP! as it closes
  const k = t % 70, r = Math.max(4, 24 - k * 0.4), on = r <= 6 && k < 64;
  ctx.fillStyle = '#e8d0b0'; ctx.fillRect(46, 58, 9, 8); ctx.fillStyle = '#1a1a22'; ctx.fillRect(55, 59, 16, 6);
  ring(50, 62, r, on ? '#ffd23a' : '#ffffff');
  if (on) drawText(ctx, 'TAP!', 50, 90, { fill: GRAD.gold, outline: '#000', align: 'center' });
  drawText(ctx, '1. PUNCH', 98, 44, { scale: 2, fill: GRAD.gold, outline: '#000' });
  drawText(ctx, 'A RING CLOSES ON HIS FIST.', 98, 64, { fill: GRAD.white, outline: '#000' });
  drawText(ctx, 'TAP JUST AS IT CLOSES.', 98, 74, { fill: GRAD.gold, outline: '#000' });
  // 2. DUCK: one picture, his red kick coming in, and you holding the button
  const q = t % 90, hold = q > 15 && q < 70;
  ctx.fillStyle = (t >> 2) % 2 ? '#ff2a2a' : '#a01010'; ctx.fillRect(30, 118, 30, 5); ctx.fillRect(54, 114, 8, 13);
  if (hold) drawText(ctx, 'HOLD', 50, 136, { fill: GRAD.white, outline: '#000', align: 'center' });
  drawText(ctx, '2. DUCK', 98, 108, { scale: 2, fill: GRAD.red, outline: '#000' });
  drawText(ctx, 'HE FLASHES RED: HIS KICK IS COMING.', 98, 128, { fill: GRAD.white, outline: '#000' });
  drawText(ctx, 'HOLD THE BUTTON DOWN TO DUCK.', 98, 138, { fill: GRAD.gold, outline: '#000' });
  if (t > 45 && (f >> 4) % 3) drawText(ctx, 'TAP TO FIGHT', W / 2, H - 18, { fill: '#ff8ab4', outline: '#000', align: 'center' });
}
function drawInvCard(t) {
  if (invCardFn) { try { invCardFn(ctx, t); return; } catch (e) { console.warn('inv card', e); invCardFn = null; } }
  ctx.globalAlpha = 0.78; ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(22, 14, W - 44, H - 28);
  drawText(ctx, 'INVERTED', W / 2, 26, { scale: 2, fill: GRAD.blue, outline: '#000', align: 'center' });
  ['YOU ARE RUNNING BACK', 'EVERYTHING REWINDS', 'WATCH BEHIND YOU'].forEach((s, i) => drawText(ctx, s, W / 2, 64 + i * 16, { fill: i ? GRAD.white : GRAD.gold, outline: '#000', align: 'center' }));
  if (t > 45 && (f >> 4) % 3) drawText(ctx, 'TAP TO GO ON', W / 2, H - 28, { fill: GRAD.white, outline: '#000', align: 'center' });
}
function drawBossCard(c) {
  if (c.key === 'fist') return drawFistCard(c.t);
  if (c.key === 'inv') return drawInvCard(c.t);
  if (c.key === 'code') return drawCodeCard(c.t);
  const def = g.boss && g.boss.def; if (!def) return;
  ctx.globalAlpha = 0.72; ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  ctx.fillStyle = '#000'; ctx.fillRect(22, 14, W - 44, H - 28); ctx.fillStyle = '#ff8a1a'; ctx.fillRect(23, 15, W - 46, 1); ctx.fillRect(23, H - 16, W - 46, 1); ctx.fillRect(23, 15, 1, H - 30); ctx.fillRect(W - 24, 15, 1, H - 30);
  drawText(ctx, 'BOSS', W / 2, 20, { fill: '#8a8aa8', outline: null, align: 'center' });
  drawText(ctx, def.name, W / 2, 31, { scale: 2, fill: GRAD.red, outline: '#000', shadow: '#000', align: 'center' });
  HOWTO[c.key].forEach(([s, hi], i) => drawText(ctx, s, W / 2, 56 + i * 12, { fill: hi ? GRAD.gold : GRAD.white, outline: '#000', align: 'center' }));
  if (c.t > 45 && (f >> 4) % 3) drawText(ctx, 'TAP TO FIGHT', W / 2, H - 28, { fill: GRAD.white, outline: '#000', align: 'center' });
}
// THE AGENT, round 1 only (round 2 gets its own card when it starts): two moving pictures and one line
function drawCodeCard(t) {
  ctx.globalAlpha = 0.72; ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  ctx.fillStyle = '#000'; ctx.fillRect(22, 14, W - 44, H - 28); ctx.fillStyle = '#ff8a1a'; ctx.fillRect(23, 15, W - 46, 1); ctx.fillRect(23, H - 16, W - 46, 1); ctx.fillRect(23, 15, 1, H - 30); ctx.fillRect(W - 24, 15, 1, H - 30);
  drawText(ctx, 'BOSS', W / 2, 20, { fill: '#8a8aa8', outline: null, align: 'center' });
  drawText(ctx, 'THE AGENT', W / 2, 31, { scale: 2, fill: GRAD.red, outline: '#000', shadow: '#000', align: 'center' });
  drawText(ctx, 'ROUND 1: A SHOOTOUT', W / 2, 50, { fill: GRAD.gold, outline: '#000', align: 'center' });
  // 1. gold bullets: one flies in from the right; when it is inside the brackets they turn gold, TAP!, and it is shot
  const B0 = 40, B1 = 66, BY = 68, L = 80, k = t % L, bx = 112 - k * 1.1, inb = bx > B0 && bx <= B1, shot = bx <= B1 - 8;
  const bc = inb && !shot ? '#ffd23a' : '#e8ffe8';
  for (const [x, d] of [[B0, 1], [B1, -1]]) { ctx.fillStyle = bc; ctx.fillRect(x, BY - 8, 1, 16); ctx.fillRect(x + (d < 0 ? -3 : 0), BY - 8, 4, 1); ctx.fillRect(x + (d < 0 ? -3 : 0), BY + 7, 4, 1); }
  if (!shot) { ctx.fillStyle = '#000'; ctx.fillRect(Math.round(bx) - 1, BY - 2, 8, 5); ctx.fillStyle = '#ffd23a'; ctx.fillRect(Math.round(bx), BY - 1, 6, 3); ctx.fillStyle = '#fff7c0'; ctx.fillRect(Math.round(bx), BY - 1, 2, 1); }
  else if (k < 64) { ctx.fillStyle = (k >> 1) % 2 ? '#ffffff' : '#ffd23a'; const c = B0 + 13; ctx.fillRect(c - 4, BY, 9, 1); ctx.fillRect(c, BY - 4, 1, 9); ctx.fillRect(c - 2, BY - 2, 1, 1); ctx.fillRect(c + 2, BY + 2, 1, 1); ctx.fillRect(c + 2, BY - 2, 1, 1); ctx.fillRect(c - 2, BY + 2, 1, 1); }
  if (inb || (shot && k < 64)) drawText(ctx, 'TAP!', B0 + 13, BY + 12, { fill: GRAD.gold, outline: '#000', align: 'center' });
  drawText(ctx, 'GOLD BULLETS: TAP WHEN', 126, 62, { fill: GRAD.white, outline: '#000' });
  drawText(ctx, 'ONE IS INSIDE THE BRACKETS.', 126, 72, { fill: GRAD.gold, outline: '#000' });
  // 2. machine gun: a burst of red rounds along the line; HOLD while it goes over
  const q = t % 90, fire = q > 20 && q < 66, MY = 104;
  for (let x = 112 - ((t * 3) % 10); x > 40; x -= 10) { ctx.fillStyle = '#000'; ctx.fillRect(x - 1, MY - 1, 6, 3); ctx.fillStyle = fire ? '#ff4a3a' : '#5a0a00'; ctx.fillRect(x, MY, 4, 1); }
  if (fire) drawText(ctx, 'HOLD', 76, MY + 8, { fill: GRAD.white, outline: '#000', align: 'center' });
  drawText(ctx, 'MACHINE GUN (RED LINE):', 126, 98, { fill: GRAD.white, outline: '#000' });
  drawText(ctx, 'HOLD THE BUTTON TO DUCK.', 126, 108, { fill: GRAD.gold, outline: '#000' });
  // 3. the reload
  drawText(ctx, 'WHEN HE RELOADS: TAP TO SHOOT HIM. 3 HITS.', W / 2, 128, { fill: GRAD.white, outline: '#000', align: 'center' });
  if (t > 45 && (f >> 4) % 3) drawText(ctx, 'TAP TO FIGHT', W / 2, H - 28, { fill: '#ff8ab4', outline: '#000', align: 'center' });
}
function drawPaused(t) {
  ctx.globalAlpha = 0.72; ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  drawText(ctx, 'PAUSED', W / 2, 62, { scale: 3, fill: GRAD.gold, outline: '#000', shadow: '#000', align: 'center' });
  if (t > 20 && (f >> 4) % 3) drawText(ctx, 'TAP TO GO ON', W / 2, 100, { fill: GRAD.white, outline: '#000', align: 'center' });
}
function drawHoleHelp(t) {
  ctx.globalAlpha = 0.78; ctx.fillStyle = '#05040a'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  ctx.fillStyle = '#000'; ctx.fillRect(14, 12, W - 28, H - 24); ctx.fillStyle = '#ffd21a'; ctx.fillRect(15, 13, W - 30, 1); ctx.fillRect(15, H - 14, W - 30, 1); ctx.fillRect(15, 13, 1, H - 26); ctx.fillRect(W - 16, 13, 1, H - 26);
  drawText(ctx, 'BLACK HOLE COIN!', W / 2, 20, { scale: 2, fill: GRAD.gold, outline: '#000', shadow: '#000', align: 'center' });
  const c = HOLE_COIN[(f >> 2) % 8]; ctx.imageSmoothingEnabled = false; ctx.drawImage(c, 34, 46, c.width * 4, c.height * 4);
  const L = [['POINTS POUR IN', GRAD.white], ['UNTIL YOU JUMP.', GRAD.white], ['', GRAD.white], ['DON\'T JUMP = MORE POINTS.', GRAD.gold]];
  L.forEach(([s, fill], i) => drawText(ctx, s, 112, 58 + i * 14, { fill, outline: '#000' }));
  const n = Math.min(99999, Math.floor(3 * Math.pow(1.045, (t % 160))));             // a little counter running up, to show the curve
  drawText(ctx, '+' + n, 60, 134, { scale: 2, fill: GRAD.gold, outline: '#000', align: 'center' });
  if (t > 45 && (f >> 4) % 3) drawText(ctx, 'TAP TO GO ON', W / 2, H - 26, { fill: GRAD.white, outline: '#000', align: 'center' });
}
let acc = 0, last = performance.now(), playingCls = false;
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  if (mode === 'home' && acc > 2000 / 60) acc = 1000 / 60;   // the home screen: after a hiccup carry on smoothly instead of leaping ahead (play keeps real time)
  while (acc >= 1000 / 60) { update(); acc -= 1000 / 60; }
  draw(); syncPads(); const pl = !cover && (mode === 'run' || mode === 'boss' || mode === 'warp'); if (pl !== playingCls) { playingCls = pl; document.body.classList.toggle('playing', pl); }
  requestAnimationFrame(frame);
}
muteLabel(); fullLabel();
// (sound is opened by the first tap/key: see press())
goHome(); requestAnimationFrame(frame);
// on vollebak.com the game sits in an iframe: tell the page it loaded (no word within 8 s = a network filter is blocking the game)
document.getElementById('loading')?.remove();
if (window.parent !== window) try { window.parent.postMessage({ bhf: 'ready' }, '*'); } catch {}
api('config').then((c) => { cfg = { ...c, online: true }; RETRY = !!c.retry; DEV = !!c.dev; devTools(); prefetchTurnstile(); }).catch(() => {});

// ---------- hooks for the test scripts ----------
window.__bhf = () => ({ mode, idx: g ? g.idx : 0, sim: g ? g.sim : null, boss: g ? g.boss : null, stage: g ? g.stage : null, lap: g ? g.lap : 0, ORDER, warp, arrive,
  iris: g && g.cutOn && mode === 'run' ? { t: g.cut, out: true } : irisIn ? { t: irisIn, out: false } : null, g, rec, total: total() });
window.__bhfPlay = play;
window.__bhfCover = (on) => { if (on === undefined) return cover; if (on) cover = true; else dismissCover(); return cover; };
window.__bhfDbg = { homeFrame: (fr) => { home.tt = 0; drawHome(ctx, home, fr, { board, prompt: 'TAP OR PRESS SPACE TO PLAY', ticker: 'VOLLEBAK' }); }, holeCard: (t) => drawHoleHelp(t), coverFrame: (fr, text) => drawCover(fr, text), coverText: (fr) => drawCoverText(fr), fistCard: (t) => drawFistCard(t), codeCard: (t) => drawCodeCard(t), SKINS, baseChr, B, HERO, audio, K, D, PORT, arrived, exitKind: (i) => (i + 1 >= ORDER.length ? 'blackhole' : PORT.EXIT[ORDER[i]] || 'goo'), home, homeGoTo, goHome, startGame, finish, replayGame, encodeToggles, cfg: () => cfg, setBoard: (b) => { board = b; }, LEVELS: () => LEVEL_KEYS.map((k) => SKINS[k]) };
