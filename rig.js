// Jointed pixel characters.
// Each character is built from body parts (capsules, ellipses, polygons) placed by a
// pose (joint angles). Parts are drawn at 4x size, sampled down to pixels, then given
// pixel-art lighting (top-left highlight, bottom-right shade), dark seams where one part
// overlaps another (so a sleeve reads against the coat) and a 1px outline.

const S = 4;
export const MATS = {
  coat: ['#ffe56a', '#f2c31b', '#c4920c', '#7a5806'],
  coatFar: ['#d8a414', '#b8880c', '#8c6608', '#5a4005'],
  tee: ['#3b3b4d', '#1d1d26', '#121218', '#08080c'],
  trousers: ['#4a5278', '#2a2f4a', '#1b1f33', '#10121e'],
  trousersFar: ['#2a2f4a', '#1d2136', '#12152a', '#0a0b14'],
  boot: ['#55556a', '#18181e', '#0c0c10', '#000000'],
  skin: ['#ffd2ad', '#eab38a', '#c0835c', '#8a5236'],
  skinFar: ['#d9a07a', '#c0835c', '#9a6444', '#6a3a22'],
  hair: ['#4a4a5e', '#18181f', '#0c0c12', '#000000'],
  glasses: ['#203040', '#050507', '#050507', '#000000'],
  white: ['#ffffff', '#ece6f2', '#bdb0d0', '#857399'],
  whiteFar: ['#d6cce2', '#bdb0d0', '#9a8cb2', '#6a5a84'],
  mane: ['#ffa6d6', '#ff4fa8', '#c42a7e', '#7a1450'],
  horn: ['#fff3b8', '#f0c85a', '#b8902a', '#7a5a10'],
  hoof: ['#6a5a7a', '#3a2e44', '#241c2c', '#120e16'],
  wing: ['#ffe0f2', '#f6b8de', '#d080b4', '#8a4a7a'],
  acid: ['#ffd0f4', '#ff4fd8', '#c21fa0', '#7a0a5a'],
  troll: ['#a8b490', '#7d8a68', '#58634a', '#363d2e'],
  trollFar: ['#7d8a68', '#626e52', '#4a543c', '#2c3224'],
  gob: ['#9ae06a', '#5fae3a', '#3c7a22', '#24501a'],
  gobFar: ['#6fae48', '#4a8a2c', '#33641c', '#1e3e12'],
  cap: ['#ff6a7a', '#d02a3c', '#901a28', '#5a0e18'],
  hood: ['#a87ad0', '#6a3a8a', '#4a2464', '#2c143c'],
  rag: ['#8a6a44', '#6a4a2a', '#4a3218', '#2a1c0c'],
  club: ['#9a7448', '#6a4a26', '#4a3218', '#2a1a0a'],
  metal: ['#e0e4ee', '#a8b0c0', '#707888', '#404858'],
  ghoul: ['#8aaaff', '#4a7aff', '#2a4ac0', '#16226a'],
  ghoulFar: ['#4a7aff', '#3a5ad8', '#22389a', '#101a50'],
  tusk: ['#ffffff', '#f4ecd0', '#c8b890', '#8a7a5a'],
  pale: ['#fff6c4', '#f2d676', '#d4ad4c', '#8a6a2a'],
  paleSide: ['#e8c862', '#d4ad4c', '#b08a34', '#6a4e1a'],
  lining: ['#4a3418', '#2a1c0c', '#1a1006', '#000000'],
  bile: ['#e6dc8a', '#b4ac52', '#827c34', '#4e4a1a'],
  bileFar: ['#b4ac52', '#949040', '#6a6428', '#3e3a12'],
  belly: ['#f2eaa8', '#d4cc78', '#a8a050', '#6a6428'],
  denim: ['#8ab0f0', '#4a74c8', '#2e5296', '#16284e'],
  blond: ['#fff2a8', '#e8c458', '#b8902e', '#6a4a10'],
  beard: ['#e8b070', '#c08848', '#8a5a26', '#4a2e10'],
  goggle: ['#d8fff4', '#5ad8b8', '#2a8a74', '#0a4a3a'],
  glass: ['#ffffff', '#cfe8f4', '#8ab0c8', '#4a6a80'],
  bone: ['#ffffff', '#ece4cc', '#b8ae8e', '#6a6450'],
  leather: ['#5a5a6c', '#2a2a36', '#18181e', '#050508'],
  tyre: ['#4a4a54', '#202026', '#121216', '#000000'],
  chrome: ['#ffffff', '#c8d0e0', '#808aa0', '#40465a'],
  tank: ['#ff6a5a', '#d0202a', '#8a1018', '#4a0810'],
  slime: ['#d8ffa8', '#8aff4a', '#46c02a', '#1e6a14'],
  shoeRed: ['#ff8a8a', '#e0202e', '#a0101c', '#5a0810'],
  slimeDeep: ['#8aff4a', '#46c02a', '#2e8a1c', '#14480c'],
};

// ---- geometry helpers ------------------------------------------------------
const P = (x, y) => ({ x, y });
const add = (a, b) => P(a.x + b.x, a.y + b.y);
const dir = (len, ang) => P(Math.sin(ang) * len, Math.cos(ang) * len);   // ang 0 = straight down, + = forward
const rot = (p, c, a) => { const s = Math.sin(a), k = Math.cos(a), dx = p.x - c.x, dy = p.y - c.y; return P(c.x + dx * k - dy * s, c.y + dx * s + dy * k); };

// shapes: { m: material, z, kind: 'cap'|'ell'|'poly', ... , sep: true to draw a seam on what's under it }
export const cap = (m, a, b, r, z, o = {}) => ({ m, z, kind: 'cap', a, b, r, ...o });
export const ell = (m, c, rx, ry, z, o = {}) => ({ m, z, kind: 'ell', c, rx, ry, ...o });
export const poly = (m, pts, z, o = {}) => ({ m, z, kind: 'poly', pts, ...o });

function trace(ctx, sh, ox, oy) {
  const X = (p) => (p.x + ox) * S, Y = (p) => (p.y + oy) * S;
  ctx.beginPath();
  if (sh.kind === 'cap') {
    ctx.lineCap = 'round'; ctx.lineWidth = sh.r * 2 * S;
    ctx.moveTo(X(sh.a), Y(sh.a)); ctx.lineTo(X(sh.b), Y(sh.b)); ctx.stroke(); return;
  }
  if (sh.kind === 'ell') ctx.ellipse(X(sh.c), Y(sh.c), sh.rx * S, sh.ry * S, sh.rot || 0, 0, Math.PI * 2);
  else { sh.pts.forEach((p, i) => (i ? ctx.lineTo(X(p), Y(p)) : ctx.moveTo(X(p), Y(p)))); ctx.closePath(); }
  ctx.fill();
}

// unique id colours (exact-match sampling ignores anti-aliased edge blends)
const idColour = (i) => `rgb(${(i * 53 + 17) % 256},${(i * 97 + 101) % 256},${(i * 29 + 61) % 256})`;
const idKey = (i) => ((((i * 53 + 17) % 256) << 16) | (((i * 97 + 101) % 256) << 8) | ((i * 29 + 61) % 256));

export function renderShapes(shapes, w, h, ox, oy, { post = null, tint = null } = {}) {
  shapes = shapes.slice().sort((a, b) => a.z - b.z);
  const big = document.createElement('canvas'); big.width = w * S; big.height = h * S;
  const bx = big.getContext('2d');
  const keyToIdx = new Map();
  shapes.forEach((sh, i) => { bx.fillStyle = bx.strokeStyle = idColour(i + 1); keyToIdx.set(idKey(i + 1), i); trace(bx, sh, ox, oy); });
  const d = bx.getImageData(0, 0, big.width, big.height).data;
  // sample: majority of exact-colour sub-pixels in each 4x4 block
  const grid = new Int16Array(w * h).fill(-1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const counts = new Map(); let opaque = 0;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const o = ((y * S + j) * big.width + (x * S + i)) * 4;
      if (d[o + 3] < 250) continue; opaque++;
      const idx = keyToIdx.get((d[o] << 16) | (d[o + 1] << 8) | d[o + 2]);
      if (idx !== undefined) counts.set(idx, (counts.get(idx) || 0) + 1);
    }
    if (opaque < 7) continue;
    let best = -1, bc = 0; for (const [k, c] of counts) if (c > bc || (c === bc && k > best)) { best = k; bc = c; }
    grid[y * w + x] = best;
  }
  // colour: lighting + seams
  const grp = (k) => shapes[k].g ?? 'k' + k;
  const out = document.createElement('canvas'); out.width = w; out.height = h;
  const x = out.getContext('2d');
  const at = (i, j) => (i < 0 || j < 0 || i >= w || j >= h ? -1 : grid[j * w + i]);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = at(i, j); if (k < 0) continue;
    const sh = shapes[k], pal = MATS[sh.m] || MATS.white, gk = grp(k);
    const up = at(i, j - 1), lf = at(i - 1, j), dn = at(i, j + 1), rt = at(i + 1, j);
    const same = (n) => n >= 0 && grp(n) === gk;
    let c = pal[1];
    // seam: neighbour belongs to a different part drawn on top of this one
    const over = [up, lf, dn, rt].some((n) => n >= 0 && !same(n) && shapes[n].z > sh.z && !shapes[n].noSeam);
    if (over) c = pal[3];
    else if (!same(up) || !same(lf)) c = pal[0];
    else if (!same(dn) || !same(rt)) c = pal[2];
    else if (sh.shadeLow && j > (sh.lowY ?? h) ) c = pal[2];
    x.fillStyle = tint || c; x.fillRect(i, j, 1, 1);
  }
  // outline
  const img = x.getImageData(0, 0, w, h), od = img.data;
  const solid = (i, j) => i >= 0 && j >= 0 && i < w && j < h && grid[j * w + i] >= 0;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (solid(i, j)) continue;
    if (solid(i - 1, j) || solid(i + 1, j) || solid(i, j - 1) || solid(i, j + 1)) { const o = (j * w + i) * 4; od[o] = 10; od[o + 1] = 10; od[o + 2] = 16; od[o + 3] = 255; }
  }
  x.putImageData(img, 0, 0);
  if (post && !tint) post(x, (p) => P(Math.round(p.x + ox - 0.5), Math.round(p.y + oy - 0.5)));
  return { c: out, ox, oy };
}

// ---- HERO (faces right) --------------------------------------------------------
// Matches the video sprite: big spiky swept-back hair, wraparound shades, short yellow
// coat that flares behind at the hem, near fist forward at chest height, far fist swung
// back, wide stride with dark trousers and black shoes below the coat.
// phase: 0..1 through the run cycle. mode: 'run' | 'jump' | 'fall'
export function heroShapes(phase, mode = 'run') {
  const T = phase * Math.PI * 2;
  const sw = Math.sin(T);
  let thighN = 0.2 + 0.85 * sw, thighF = 0.2 - 0.85 * sw;
  let kneeN = 0.25 + 1.3 * Math.max(0, Math.cos(T)), kneeF = 0.25 + 1.3 * Math.max(0, -Math.cos(T));
  let armN = 0.15 - 1.15 * sw, armF = 0.15 + 1.15 * sw;          // full swing: front all the way to back
  let bob = -Math.abs(Math.cos(T)) * 1.2, lean = 0.3, flap = 1.2 + Math.sin(T * 2) * 0.9;
  if (mode === 'jump') { thighN = 1.1; kneeN = 1.7; thighF = -0.4; kneeF = 1.2; armN = 2.4; armF = -0.9; bob = -1; flap = 3.5; }
  if (mode === 'fall') { thighN = 0.5; kneeN = 0.6; thighF = -0.3; kneeF = 0.9; armN = 1.2; armF = -0.7; bob = 0; flap = 0.5; }
  const H = P(0, -15 + bob);                                   // hip
  const Sh = add(H, P(10 * Math.sin(lean), -10 * Math.cos(lean)));   // shoulder
  const C = add(Sh, P(2.6, -6.4));                             // head centre
  const leg = (th, kn) => { const K = add(H, dir(7.2, th)); const F = add(K, dir(7.4, th - kn)); return [K, F]; };
  const [KN, FN] = leg(thighN, kneeN), [KF, FF] = leg(thighF, kneeF);
  const arm = (root, a) => { const E = add(root, dir(5.2, a)); return [E, add(E, dir(4.4, a + 1.55))]; };
  const ShF = add(Sh, P(-1.4, 0.3));
  const [EN, HN] = arm(Sh, armN);
  const EF = add(ShF, dir(5.4, armF)), HF = add(EF, dir(4.2, armF + 1.45));
  const sh = [];
  // far arm (behind the body): darker sleeve, cuff, fist
  sh.push(cap('coatFar', ShF, EF, 1.9, 1, { g: 'armF' }), cap('coatFar', EF, add(EF, dir(3, armF + 1.45)), 1.7, 1.1, { g: 'armF' }),
    cap('tee', add(EF, dir(3, armF + 1.45)), add(EF, dir(3.6, armF + 1.45)), 1.5, 1.2), ell('skinFar', HF, 1.6, 1.6, 1.3));
  // legs: trousers + shoes (the coat covers the thighs)
  sh.push(cap('trousersFar', H, KF, 2.3, 2, { g: 'legF' }), cap('trousersFar', KF, FF, 2.1, 2, { g: 'legF' }), cap('boot', add(FF, P(-1, 0)), add(FF, P(2.6, 0.4)), 1.7, 2.2));
  sh.push(cap('trousers', H, KN, 2.4, 3, { g: 'legN' }), cap('trousers', KN, FN, 2.2, 3, { g: 'legN' }), cap('boot', add(FN, P(-1, 0)), add(FN, P(2.8, 0.4)), 1.8, 3.2));
  // coat: body + short skirt flaring behind, over the tops of both legs
  const hemF = add(H, P(3.8 + Math.max(0, thighN) * 1.5, 4.6)), hemB = add(H, P(-6.4 - flap, 4.2 + flap * 0.4));
  sh.push(poly('coat', [add(Sh, P(-3.6, -0.6)), add(Sh, P(2.6, -0.6)), add(H, P(3.4, 0)), hemF, add(H, P(-0.5, 5.4)), hemB, add(H, P(-4.2, 0))], 5, { g: 'coat' }));
  sh.push(poly('tee', [add(Sh, P(0.8, 0.4)), add(Sh, P(2.7, 0)), add(H, P(3.6, -0.6)), add(H, P(1.8, -0.6))], 5.5, { noSeam: true }));
  // popped collar
  sh.push(poly('coat', [add(Sh, P(-3, 0.2)), add(Sh, P(-2.4, -3.6)), add(Sh, P(0.4, -2.4)), add(Sh, P(1.6, 0.6))], 6, { g: 'coat' }));
  // head: face, jaw, ear, big swept-back spiky hair, wraparound shades
  sh.push(ell('skin', add(C, P(0.4, 0.4)), 4.4, 4.8, 7, { g: 'head' }));
  sh.push(poly('skin', [add(C, P(-1.5, 2.4)), add(C, P(4.6, 1.4)), add(C, P(4, 4.4)), add(C, P(0.8, 5.4))], 7.1, { g: 'head' }));
  sh.push(poly('hair', [add(C, P(-4.8, 3)), add(C, P(-7.2, 0)), add(C, P(-11, -2.6)), add(C, P(-7, -4)), add(C, P(-10.4, -7.8)), add(C, P(-4.8, -6.6)),
    add(C, P(-5.6, -11.4)), add(C, P(-1.6, -7.6)), add(C, P(0.4, -11.8)), add(C, P(2, -7.4)), add(C, P(5.4, -9.4)), add(C, P(4.6, -5.6)), add(C, P(6.4, -4.6)),
    add(C, P(3.4, -3.2)), add(C, P(0.6, -3.4)), add(C, P(-2.4, -1.2)), add(C, P(-2.8, 2.4))], 8));
  sh.push(poly('glasses', [add(C, P(0.2, -2.4)), add(C, P(5.6, -2.6)), add(C, P(5.4, -0.2)), add(C, P(3.4, 0.4)), add(C, P(0.4, -0.2))], 9, { noSeam: true }));
  // near arm on top: sleeve, cuff, fist
  const cuffN = add(EN, dir(3.2, armN + 1.55));
  sh.push(cap('coat', Sh, EN, 2.2, 10, { g: 'sleeve' }), cap('coat', EN, cuffN, 2, 10.1, { g: 'sleeve' }), cap('tee', cuffN, add(EN, dir(3.9, armN + 1.55)), 1.7, 10.2), ell('skin', HN, 1.9, 1.8, 10.3));
  const post = (ctx, px) => {
    const g = px(add(C, P(4.2, -1.6))); ctx.fillStyle = '#9cc8f0'; ctx.fillRect(g.x, g.y, 1, 1);      // lens glint
    const m = px(add(C, P(3.4, 3))); ctx.fillStyle = '#8a4a3a'; ctx.fillRect(m.x, m.y, 1, 1);        // mouth
    const e = px(add(C, P(-1.4, 0.8))); ctx.fillStyle = '#c0835c'; ctx.fillRect(e.x, e.y, 1, 2);     // ear
  };
  return { shapes: sh, post };
}

// ---- UNICORN (faces left). gallop phase 0..1; pose: 'run' | 'puke' | 'fly'
export function unicornShapes(phase, pose = 'run', far = false) {
  const T = phase * Math.PI * 2;
  const W = far ? 'whiteFar' : 'white';
  const pitch = Math.sin(T) * 0.07;                            // rocking-horse gallop
  const B = P(3, -20 + Math.cos(T * 2) * 0.7);
  const r = (p) => rot(add(B, p), B, pitch);
  const sh = [];
  const flyK = pose === 'fly' ? 0.35 : 1;
  // legs: thick upper (part of the body silhouette), tapered lower leg, dark hoof.
  // facing left, so 'forward' is negative angle
  const leg = (root, a1, bend, front, m, z, g) => {
    const K = add(root, dir(front ? 6.2 : 6.6, a1));
    const a2 = front ? a1 + bend : a1 - bend * 0.7;
    const F = add(K, dir(front ? 6.8 : 6.4, a2));
    sh.push(cap(m, root, K, 2.9, z, { g }), cap(m, K, F, 1.3, z + 0.05, { g: g + 'l' }), poly('hoof', [add(F, P(-1.6, -0.6)), add(F, P(1.4, -0.6)), add(F, P(1.8, 1.4)), add(F, P(-1.8, 1.4))], z + 0.1));
  };
  const fA = (ph) => (-0.25 - 0.6 * Math.cos(ph)) * flyK, fB = (ph) => (0.15 + 1.4 * Math.max(0, Math.sin(ph))) * flyK + (pose === 'fly' ? 0.9 : 0);
  const hA = (ph) => (0.2 + 0.55 * Math.cos(ph + 1)) * flyK, hB = (ph) => (0.2 + 1.0 * Math.max(0, -Math.sin(ph + 1))) * flyK + (pose === 'fly' ? 0.8 : 0);
  leg(r(P(-8, 3)), fA(T + 0.5), fB(T + 0.5), true, 'whiteFar', 1, 'fF');
  leg(r(P(10, 2)), hA(T + 0.5), hB(T + 0.5), false, 'whiteFar', 1, 'hF');
  // tail
  const tw = Math.sin(T * 2) * 2.2;
  sh.push(poly('mane', [r(P(13, -6)), r(P(19, -7 + tw)), r(P(25, -3 + tw)), r(P(27, 4 + tw)), r(P(23, 2 + tw * 0.5)), r(P(21, 7)), r(P(17, 1)), r(P(14, -1))], 2));
  // one smooth silhouette: barrel, chest, croup, neck and head (shared group = no seams)
  const drop = pose === 'puke' ? 0.5 : pose === 'fly' ? -0.1 : 0;
  const pivot = r(P(-12, -12));
  const hd = (p) => rot(r(p), pivot, -drop);
  sh.push(poly(W, [r(P(-9, -7)), r(P(0, -6)), r(P(9, -7.5)), r(P(14, -4)), r(P(14.5, 2)), r(P(10, 5)), r(P(2, 5.5)), r(P(-6, 5.5)), r(P(-11, 4)), r(P(-13.5, 0)), r(P(-12.5, -4))], 3, { g: 'body' }));
  sh.push(poly(W, [r(P(-9, -7)), hd(P(-12.5, -15)), hd(P(-15.5, -19.5)), hd(P(-19.5, -16)), r(P(-15.5, -6)), r(P(-13.5, 0))], 3.1, { g: 'body' }));
  const head = [hd(P(-15.5, -20)), hd(P(-18.5, -21.5)), hd(P(-26.5, -14.5)), hd(P(-27, -11.5)), hd(P(-23, -10.2)), hd(P(-19.5, -12.8)), hd(P(-17, -15))];
  sh.push(poly(W, head, 3.2, { g: 'body' }));
  // ear, forelock, horn, mane along the crest
  sh.push(poly(W, [hd(P(-16, -20.5)), hd(P(-14.6, -24.5)), hd(P(-14, -20))], 3.3, { g: 'body' }));
  sh.push(poly('horn', [hd(P(-18.2, -21.6)), hd(P(-23.5, -32)), hd(P(-16.8, -21))], 6));
  sh.push(poly('mane', [hd(P(-14.5, -21)), hd(P(-11.5, -19)), r(P(-6, -8.5)), r(P(-2.5, -6.5)), r(P(-7, -5)), hd(P(-11.5, -11)), hd(P(-13.5, -14)), hd(P(-16, -17))], 7));
  sh.push(poly('mane', [hd(P(-18, -21.8)), hd(P(-21, -19.5)), hd(P(-17.5, -19))], 7.1));
  if (pose === 'puke') sh.push(poly('acid', [hd(P(-26.5, -11.5)), hd(P(-31, -9)), hd(P(-34, -4)), hd(P(-30, -5)), hd(P(-26, -9.5))], 8));
  // near legs
  leg(r(P(-10, 3)), fA(T), fB(T), true, W, 9, 'fN');
  leg(r(P(12, 2)), hA(T), hB(T), false, W, 9, 'hN');
  // feathered wings for the flying unicorn
  if (pose === 'fly') {
    const up = Math.sin(T) > 0, root = r(P(-2, -6));
    const tip = up ? add(root, P(9, -18)) : add(root, P(13, 4));
    sh.push(poly('wing', [root, add(root, P(4, up ? -10 : 3)), tip, add(root, P(15, up ? -5 : 1)), add(root, P(12, up ? -2 : 4)), add(root, P(8, 1))], 10));
  }
  const post = (ctx, px) => {
    const e = px(hd(P(-20.2, -17.6)));
    ctx.fillStyle = '#ff1a3a'; ctx.fillRect(e.x, e.y, 2, 1); ctx.fillStyle = '#7a0a1a'; ctx.fillRect(e.x - 1, e.y - 1, 3, 1);   // angry red eye + brow
    const n = px(hd(P(-25.6, -12.4))); ctx.fillStyle = '#6a3a4a'; ctx.fillRect(n.x, n.y, 1, 1);                                  // nostril
  };
  return { shapes: sh, post };
}

// ---- BRUTE TROLL (faces left): hulking, tusks, club. phase 0..1
export function bruteShapes(phase, dizzy = false, puke = false) {
  const T = phase * Math.PI * 2;
  const H = P(0, -15 + Math.abs(Math.sin(T)) * -1);
  const sh = [];
  const leg = (root, a, z, m) => { const K = add(root, dir(6, a)); const F = add(K, dir(6.5, -a * 0.4)); sh.push(cap(m, root, K, 3.6, z), cap(m, K, F, 3.2, z), ell(m, add(F, P(-1.5, 0.6)), 3.4, 1.8, z + 0.1)); };
  leg(add(H, P(3, 0)), 0.45 * Math.sin(T + Math.PI), 1, 'trollFar');
  // far arm with club
  const Sf = add(H, P(4, -15));
  const Ef = add(Sf, dir(8, -0.3 + 0.3 * Math.sin(T)));
  const Hf = add(Ef, dir(7, -0.9));
  sh.push(cap('trollFar', Sf, Ef, 3.4, 1.5), cap('trollFar', Ef, Hf, 3, 1.5));
  sh.push(poly('club', [add(Hf, P(0, 1)), add(Hf, P(-6, -12)), add(Hf, P(-11, -14)), add(Hf, P(-9, -8)), add(Hf, P(-2, 3))], 1.6));
  // body: hunched barrel + belly
  sh.push(ell('troll', add(H, P(-1, -11)), 11, 12, 3, { g: 'body' }), ell('troll', add(H, P(-4, -6)), 8, 7, 3.2, { g: 'body' }));
  sh.push(poly('rag', [add(H, P(-9, -2)), add(H, P(7, -2)), add(H, P(6, 4)), add(H, P(2, 2)), add(H, P(-2, 5)), add(H, P(-6, 2)), add(H, P(-10, 4))], 4));
  leg(add(H, P(-4, 0)), 0.45 * Math.sin(T), 5, 'troll');
  // head: low, forward, heavy brow
  const C = add(H, P(-10, -20));
  sh.push(ell('troll', C, 6, 5.4, 6, { g: 'head' }), poly('troll', [add(C, P(-6, 1)), add(C, P(-7, 5)), add(C, P(2, 5.5)), add(C, P(4, 1))], 6.1, { g: 'head' }));
  sh.push(poly('tusk', [add(C, P(-5.5, 3.4)), add(C, P(-6.4, -0.6)), add(C, P(-4.4, 3))], 7), poly('tusk', [add(C, P(-1.5, 3.8)), add(C, P(-2.2, 0.2)), add(C, P(-0.4, 3.6))], 7));
  // near arm hanging, knuckles low
  const Sn = add(H, P(-6, -16));
  const En = add(Sn, dir(8, 0.25 - 0.35 * Math.sin(T)));
  const Hn = add(En, dir(7.5, -0.15));
  sh.push(cap('troll', Sn, En, 3.6, 8, { g: 'arm' }), cap('troll', En, Hn, 3.2, 8.1, { g: 'arm' }), ell('troll', Hn, 3, 2.8, 8.2, { g: 'arm' }));
  if (puke) sh.push(poly('acid', [add(C, P(-6.5, 3.5)), add(C, P(-12, 5)), add(C, P(-17, 10)), add(C, P(-14, 11)), add(C, P(-10, 8)), add(C, P(-5, 6))], 9));
  const post = (ctx, px) => {
    for (const ex of [-3.6, 0.2]) { const e = px(add(C, P(ex, -1.2))); ctx.fillStyle = dizzy ? '#ffffff' : '#ffd21a'; ctx.fillRect(e.x, e.y, 1, 1); }
    const m = px(add(C, P(-3, 2.4))); ctx.fillStyle = '#2a0a0a'; ctx.fillRect(m.x - 1, m.y, 3, 1);
  };
  return { shapes: sh, post };
}

// ---- GOBLIN (faces left): wiry, big ears, red cap, dagger. Facing left, 'forward' = -x,
// so a knee points forward (left) and the shin goes back (right) from it.
export function goblinShapes(phase, kind = 'grunt') {
  if (kind === 'puker') return bloaterShapes(phase);
  const T = phase * Math.PI * 2;
  const H = P(0, -11 - Math.abs(Math.sin(T)) * 1);
  const sh = [];
  const leg = (a, kn, z, m, g) => { const K = add(H, dir(5.2, a)); const F = add(K, dir(5.2, a + kn)); sh.push(cap(m, H, K, 1.5, z, { g }), cap(m, K, F, 1.3, z, { g }), cap(m, F, add(F, P(-2.6, 0.3)), 1.2, z + 0.1)); };
  // thigh angle: negative = forward. knee folds while that leg swings forward
  leg(-0.65 * Math.sin(T + Math.PI), 0.2 + 1.0 * Math.max(0, Math.cos(T + Math.PI)), 1, 'gobFar', 'lf');
  const Sh = add(H, P(-2.5, -8));
  const armF = add(Sh, dir(4.5, 0.7 * Math.sin(T)));
  sh.push(cap('gobFar', add(Sh, P(1, 0)), armF, 1.3, 1.5), cap('gobFar', armF, add(armF, dir(4, 0.7 * Math.sin(T) - 0.9)), 1.2, 1.5));
  sh.push(poly('rag', [add(Sh, P(-2.4, -0.5)), add(Sh, P(3, -0.2)), add(H, P(3, 1)), add(H, P(1, 3)), add(H, P(-1, 1.2)), add(H, P(-3.2, 3)), add(H, P(-3, 0))], 3));
  leg(-0.65 * Math.sin(T), 0.2 + 1.0 * Math.max(0, Math.cos(T)), 4, 'gob', 'ln');
  const C = add(Sh, P(-2.5, -4.6));
  sh.push(poly('gob', [add(C, P(1.5, -1)), add(C, P(8, -4.6)), add(C, P(2.6, 1.4))], 5), ell('gob', C, 3.6, 3.4, 5.5, { g: 'head' }), poly('gob', [add(C, P(-2, 0)), add(C, P(-5.8, 1.6)), add(C, P(-2.6, 2.8))], 5.6, { g: 'head' }));
  sh.push(poly('gob', [add(C, P(-0.5, -1)), add(C, P(-3.5, -5.5)), add(C, P(0.8, -1.6))], 5.4));
  sh.push(poly('cap', [add(C, P(-3.6, -1.6)), add(C, P(-1.6, -5.2)), add(C, P(3.4, -4.4)), add(C, P(4.4, -1.2))], 6));
  const armN = add(Sh, dir(4.5, -0.7 * Math.sin(T)));
  const hand = add(armN, dir(4, -0.7 * Math.sin(T) - 1.2));
  sh.push(cap('gob', Sh, armN, 1.4, 7, { g: 'arm' }), cap('gob', armN, hand, 1.3, 7.1, { g: 'arm' }));
  sh.push(poly('metal', [add(hand, P(0, -0.5)), add(hand, P(-6, -1.6)), add(hand, P(0, 0.8))], 7.2));
  const post = (ctx, px) => {
    const e = px(add(C, P(-1.8, -0.6))); ctx.fillStyle = '#ffe14a'; ctx.fillRect(e.x, e.y, 1, 1);
    const m = px(add(C, P(-3.2, 1.8))); ctx.fillStyle = '#2a0a0a'; ctx.fillRect(m.x, m.y, 2, 1); ctx.fillStyle = '#fffbe0'; ctx.fillRect(m.x + 1, m.y, 1, 1);
  };
  return { shapes: sh, post };
}

// ---- BLOATER (the bile spitter): fat, bald, sickly yellow-olive, huge belly, warts,
// stubby legs, wide drooling mouth. Waddles side to side.
function bloaterShapes(phase) {
  const T = phase * Math.PI * 2;
  const sway = Math.sin(T) * 0.8;
  const H = P(sway * 0.4, -7 - Math.abs(Math.sin(T)) * 0.8);
  const sh = [];
  const leg = (a, z, m) => { const K = add(H, dir(3.2, a)); const F = add(K, dir(3.4, a + 0.5)); sh.push(cap(m, H, K, 2, z), cap(m, K, F, 1.8, z), cap(m, F, add(F, P(-2.4, 0.2)), 1.5, z + 0.1)); };
  leg(-0.45 * Math.sin(T + Math.PI), 1, 'bileFar');
  const B = add(H, P(-0.5, -6));
  sh.push(ell('bile', B, 7.4, 7, 3, { g: 'body' }), ell('belly', add(B, P(-2, 1.5)), 5, 5, 3.1, { g: 'body' }));
  sh.push(poly('rag', [add(H, P(-5, -1.5)), add(H, P(5, -1.5)), add(H, P(4, 2.5)), add(H, P(0, 1.5)), add(H, P(-4, 2.5))], 3.2));
  leg(-0.45 * Math.sin(T), 4, 'bile');
  const C = add(B, P(-3.5 + sway, -8.5));
  sh.push(ell('bile', C, 5, 4.4, 5, { g: 'head' }), poly('bile', [add(C, P(-3, 0)), add(C, P(-6.4, 2)), add(C, P(-5.6, 4.2)), add(C, P(-1, 4))], 5.1, { g: 'head' }));
  // stubby arms clutching the belly
  const S1 = add(B, P(-3, -4));
  sh.push(cap('bile', S1, add(S1, P(-3, 3.5)), 1.7, 6, { g: 'arm' }), cap('bile', add(S1, P(-3, 3.5)), add(S1, P(-0.5, 6)), 1.5, 6.1, { g: 'arm' }));
  const post = (ctx, px) => {
    for (const [wx, wy] of [[1.5, -2.5], [-1, -3.4], [2.6, 0.6], [4, -6], [-3, -7]]) { const w = px(wx > 3 ? add(B, P(wx, wy)) : add(C, P(wx, wy))); ctx.fillStyle = '#7a7430'; ctx.fillRect(w.x, w.y, 1, 1); }   // warts
    const e = px(add(C, P(-2.2, -1))); ctx.fillStyle = '#ff6a1a'; ctx.fillRect(e.x, e.y, 2, 1); ctx.fillStyle = '#2a0a0a'; ctx.fillRect(e.x, e.y, 1, 1);
    const m = px(add(C, P(-5.2, 2.6))); ctx.fillStyle = '#2a0a0a'; ctx.fillRect(m.x, m.y, 4, 1); ctx.fillStyle = '#fffbe0'; ctx.fillRect(m.x + 1, m.y, 1, 1);
    const d = px(add(C, P(-4.6, 3.6))); ctx.fillStyle = '#7aff4a'; ctx.fillRect(d.x, d.y, 1, 2 + Math.round(phase * 3));                                                        // drool
  };
  return { shapes: sh, post };
}

// ---- GHOUL (faces left): blue, huge orange eyes, hops like a frog. pose 'sit' | 'leap' | 'land'
export function ghoulShapes(pose = 'sit') {
  const sh = [];
  let H, Sh, legs, hands;
  if (pose === 'leap') {          // stretched out, diving forward, legs kicked back
    H = P(2, -15); Sh = add(H, P(-8, -5));
    legs = [[add(H, P(5, 3)), add(H, P(10, 8))], [add(H, P(4, 4.5)), add(H, P(9, 10))]];
    hands = [add(Sh, P(-9, -3)), add(Sh, P(-8, -0.5))];
  } else if (pose === 'land') {   // arms out in front, legs swinging under
    H = P(1, -11); Sh = add(H, P(-7, -5));
    legs = [[add(H, P(-2, 4)), add(H, P(2, 9))], [add(H, P(-1, 5)), add(H, P(3, 10.5))]];
    hands = [add(Sh, P(-6, 7)), add(Sh, P(-4.5, 8))];
  } else {                        // sitting: knees up and forward, feet tucked under, hands on the ground
    H = P(2, -6); Sh = add(H, P(-5.5, -7));
    legs = [[add(H, P(-5, -2.5)), add(H, P(-1, 5.5))], [add(H, P(-4, -1)), add(H, P(0.5, 6))]];
    hands = [add(Sh, P(-4.5, 13)), add(Sh, P(-2.5, 13))];
  }
  const leg = (K, F, z, m) => { sh.push(cap(m, H, K, 1.9, z, { g: 'leg' + z }), cap(m, K, F, 1.6, z, { g: 'leg' + z }), cap(m, F, add(F, P(-2.6, 0.3)), 1.3, z)); };
  leg(...legs[1], 1, 'ghoulFar');
  sh.push(cap('ghoulFar', add(Sh, P(1, 0)), hands[1], 1.4, 1.5));
  sh.push(cap('ghoul', H, Sh, 3.2, 3, { g: 'body' }), ell('ghoul', add(H, P(-1, -1)), 3.6, 3, 3.1, { g: 'body' }));
  leg(...legs[0], 4, 'ghoul');
  const C = add(Sh, P(-2.5, -4.5));
  sh.push(ell('ghoul', C, 5, 5, 5, { g: 'head' }), ell('ghoul', add(C, P(-1.5, 3.4)), 4, 2.4, 5.1, { g: 'head' }));
  sh.push(cap('ghoul', Sh, hands[0], 1.5, 7, { g: 'arm' }));
  const post = (ctx, px) => {
    for (const ex of [-3, 0.6]) {
      const e = px(add(C, P(ex, -1.4)));
      ctx.fillStyle = '#ffffff'; ctx.fillRect(e.x - 1, e.y - 1, 3, 3); ctx.fillStyle = '#ff8a1a'; ctx.fillRect(e.x - 1, e.y, 2, 2); ctx.fillStyle = '#d0102a'; ctx.fillRect(e.x - 1, e.y + 1, 1, 1);
    }
    const m = px(add(C, P(-3.4, 3))); ctx.fillStyle = '#16061a'; ctx.fillRect(m.x - 1, m.y, 5, 1); ctx.fillStyle = '#fffbe0'; ctx.fillRect(m.x, m.y, 1, 1); ctx.fillRect(m.x + 2, m.y, 1, 1);
  };
  return { shapes: sh, post };
}

// ---- JACKET PICKUP: pale yellow trench coat, front view, spinning on its vertical axis ----
export function jacketShapes(theta) {
  const c = Math.cos(theta), back = c < 0, k = Math.max(0.14, Math.abs(c));
  const X = (x, y) => P(x * k * (back ? -1 : 1), y);
  const lit = k < 0.45 ? 'coatFar' : 'coat';
  const sh = [];
  for (const s of [-1, 1]) sh.push(poly(s > 0 ? 'coatFar' : lit, [X(6 * s, -22.4), X(10.6 * s, -19.6), X(12.2 * s, -7.2), X(9 * s, -6.4), X(7.6 * s, -16.8)], 1, { g: 'sl' + s }));
  sh.push(poly(lit, [X(-6.2, -22.6), X(6.2, -22.6), X(9.6, 0), X(-9.6, 0)], 2, { g: 'body' }));
  if (k >= 0.45) sh.push(poly('coatFar', [X(2.6, -22), X(6.2, -22.6), X(9.6, 0), X(4, 0)], 2.1, { g: 'body' }));
  // hood: a rounded peak standing up behind the neck
  sh.push(poly(lit, [X(-5, -21.6), X(-5.8, -26), X(-4, -30), X(0, -31.2), X(4, -30), X(5.8, -26), X(5, -21.6)], 3, { g: 'hood' }));
  if (!back) {
    sh.push(ell('lining', X(0, -26.2), Math.max(0.7, 3 * k), 3, 4));                                                    // hood opening
    if (k >= 0.3) sh.push(poly('lining', [X(-0.6, -23), X(0.6, -23), X(0.6, 0), X(-0.6, 0)], 4.1, { noSeam: true }));  // zip
  }
  const post = (ctx, px) => {
    if (k < 0.5 || back) return;
    ctx.fillStyle = '#7a5806';
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) { const p = px(X((5 + i * 0.6) * sx, -10 + i * 1.4)); ctx.fillRect(p.x, p.y, 1, 1); }   // slanted pockets
    const z = px(X(0, -22)); ctx.fillStyle = '#e0e0e8'; ctx.fillRect(z.x, z.y, 1, 1);                                                     // zip pull
  };
  return { shapes: sh, post };
}

// ---- EVIL SCIENTIST (faces left): wild sandy hair, beard, white lab coat over a denim
// shirt, goggles pushed up, a flask of pink acid in his hand. pose 'walk' | 'throw'
export function scientistShapes(phase, pose = 'walk', shoe = 'boot') {
  const T = phase * Math.PI * 2;
  const H = P(0, -16 - Math.abs(Math.sin(T)) * 0.8);
  const sh = [];
  const leg = (a, kn, z, m, g) => { const K = add(H, dir(7, a)); const F = add(K, dir(7.4, a + kn)); sh.push(cap(m, H, K, 2.2, z, { g }), cap(m, K, F, 2, z, { g }), cap(shoe, add(F, P(1, 0)), add(F, P(-2.8, 0.4)), 1.8, z + 0.1)); };
  leg(-0.6 * Math.sin(T + Math.PI), 0.2 + 1.1 * Math.max(0, Math.cos(T + Math.PI)), 1, 'trousersFar', 'lf');
  leg(-0.6 * Math.sin(T), 0.2 + 1.1 * Math.max(0, Math.cos(T)), 2, 'trousers', 'ln');
  const Sh = add(H, P(-2, -11.5)), C = add(Sh, P(-2.6, -6.6));
  // far arm (behind): swings, or winds up over the head to throw
  const aF = pose === 'throw' ? 2.6 : 0.5 * Math.sin(T);
  const EF = add(Sh, dir(5.4, aF)), HF = add(EF, dir(4.6, aF + (pose === 'throw' ? 0.4 : -0.6)));
  sh.push(cap('whiteFar', add(Sh, P(1.4, 0)), EF, 2, 0.5, { g: 'armF' }), cap('whiteFar', EF, HF, 1.8, 0.6, { g: 'armF' }), ell('skinFar', HF, 1.6, 1.6, 0.7));
  if (pose === 'throw') sh.push(ell('acid', add(HF, P(0.5, -2.6)), 2.4, 2.4, 0.8), cap('glass', add(HF, P(0.5, -4.6)), add(HF, P(0.5, -6.6)), 0.9, 0.85));
  // lab coat: long, open at the front, tails flapping behind
  const flap = 1 + Math.sin(T * 2) * 0.8;
  sh.push(poly('white', [add(Sh, P(-3.4, -0.6)), add(Sh, P(3.6, -0.6)), add(H, P(4.2, 0)), add(H, P(6 + flap, 9)), add(H, P(1, 9.6)), add(H, P(-3.6, 9)), add(H, P(-4.4, 0))], 3, { g: 'coat' }));
  sh.push(poly('denim', [add(Sh, P(-3, -0.2)), add(Sh, P(-0.6, -0.4)), add(H, P(-1.6, 0)), add(H, P(-3.6, 0))], 3.5, { noSeam: true }));
  sh.push(poly('white', [add(Sh, P(-3.2, 0.4)), add(Sh, P(-1.6, -2)), add(Sh, P(0.4, 0.6)), add(Sh, P(-1.4, 3.6))], 3.6, { g: 'coat' }));   // lapel
  // head: face, short full beard, messy swept-back sandy hair (no hat, no goggles)
  sh.push(ell('skin', C, 4.4, 4.8, 5, { g: 'head' }), poly('skin', [add(C, P(-4, -1.4)), add(C, P(-5.8, 0.8)), add(C, P(-4.2, 1.4))], 5.05, { g: 'head' }));
  sh.push(poly('beard', [add(C, P(-4.4, 1.4)), add(C, P(-3.4, 1.2)), add(C, P(-1.6, 2.2)), add(C, P(0.8, 0.4)), add(C, P(2.6, -0.4)), add(C, P(3.8, 1.4)), add(C, P(2.4, 4.8)), add(C, P(-0.6, 6.4)), add(C, P(-3.4, 5.6)), add(C, P(-4.8, 3.4))], 5.5));
  sh.push(poly('blond', [add(C, P(-4.6, -2.2)), add(C, P(-5.4, -4.6)), add(C, P(-3.6, -6.8)), add(C, P(-2.6, -8.6)), add(C, P(0, -7.8)), add(C, P(1.6, -9.4)), add(C, P(3.4, -7.4)), add(C, P(6.2, -8)),
    add(C, P(5.6, -5.4)), add(C, P(8, -4.4)), add(C, P(6, -2.6)), add(C, P(7, 0.4)), add(C, P(4.4, 0.4)), add(C, P(3.2, -1.2)), add(C, P(1, -3.2)), add(C, P(-2, -3.4))], 6));
  sh.push(ell('skin', add(C, P(2, 0.4)), 1.1, 1.5, 6.2, { g: 'ear' }));
  // near arm: holds the flask out in front (or follows through after a throw)
  const aN = pose === 'throw' ? -1.6 : -0.55 - 0.2 * Math.sin(T);
  const EN = add(Sh, dir(5.4, aN)), HN = add(EN, dir(4.6, aN - 0.9));
  sh.push(cap('white', Sh, EN, 2.1, 8, { g: 'sleeve' }), cap('white', EN, HN, 1.9, 8.1, { g: 'sleeve' }), ell('skin', HN, 1.7, 1.7, 8.2));
  if (pose !== 'throw') sh.push(ell('acid', add(HN, P(-0.4, -2.4)), 2.4, 2.4, 8.3), cap('glass', add(HN, P(-0.4, -4.4)), add(HN, P(-0.4, -6.6)), 0.9, 8.35));
  const post = (ctx, px) => {
    const e = px(add(C, P(-2.4, -0.8))); ctx.fillStyle = '#ffffff'; ctx.fillRect(e.x - 1, e.y, 2, 1); ctx.fillStyle = '#3a2a10'; ctx.fillRect(e.x - 1, e.y, 1, 1);   // narrowed eye
    const b = px(add(C, P(-2.4, -2))); ctx.fillStyle = '#a8743a'; ctx.fillRect(b.x - 1, b.y, 3, 1);                                                          // furrowed brow
    const m = px(add(C, P(-3, 3))); ctx.fillStyle = '#5a1a10'; ctx.fillRect(m.x, m.y, 2, 1); ctx.fillStyle = '#ffffff'; ctx.fillRect(m.x + 1, m.y, 1, 1);    // evil grin in the beard
  };
  return { shapes: sh, post };
}

// ---- SKELETON BIKER (faces left): a flaming skull in a black leather jacket on a red chopper
export function bikerShapes(phase) {
  const T = phase * Math.PI * 2, bob = Math.sin(T * 2) * 0.4;
  const sh = [];
  const RW = P(11, -6), FW = P(-15, -6);
  sh.push(ell('tyre', RW, 6, 6, 1, { g: 'rw' }), ell('tyre', FW, 6, 6, 1, { g: 'fw' }));
  sh.push(ell('chrome', RW, 2.6, 2.6, 1.2), ell('chrome', FW, 2.6, 2.6, 1.2));
  sh.push(cap('chrome', FW, P(-10, -21), 1.2, 2), cap('chrome', P(-10, -21), P(-7.5, -25.5), 0.9, 2.1));     // raked forks + bars
  sh.push(poly('leather', [P(-8, -12), P(9, -12), P(12, -8), P(4, -5), P(-6, -6)], 2.2));                    // frame
  sh.push(poly('chrome', [P(-4, -11), P(4, -11), P(5, -5), P(-3, -5)], 2.4, { g: 'eng' }));                 // engine
  sh.push(cap('chrome', P(2, -6), P(17, -9), 1.2, 2.5));                                                       // exhaust
  sh.push(poly('tank', [P(-9, -16), P(-2, -18), P(3, -15), P(-1, -12), P(-8, -12)], 3, { g: 'tank' }));     // fuel tank
  sh.push(poly('leather', [P(1, -15.5), P(10, -15.5), P(11, -13), P(1, -13)], 3.1));                         // seat
  // rider: leans forward to the bars
  const Hp = P(5, -16 + bob), Sh = P(-2, -27 + bob), C = P(-5, -32.5 + bob);
  sh.push(cap('leather', Hp, P(-3, -13), 2.1, 4), cap('bone', P(-3, -13), P(-4, -7.5), 1.1, 4.1), cap('leather', P(-6, -7), P(-2.5, -7), 1.1, 4.2));   // leg to the footpeg
  sh.push(poly('leather', [add(Sh, P(-3, -0.5)), add(Sh, P(3.4, -1)), add(Hp, P(3, 0)), add(Hp, P(-3, 0.6))], 5, { g: 'jkt' }));
  sh.push(ell('bone', C, 4, 4.2, 6, { g: 'skull' }), poly('bone', [add(C, P(-3.6, 0.6)), add(C, P(1.4, 1.4)), add(C, P(0.6, 4.6)), add(C, P(-3, 4.4))], 6.1, { g: 'skull' }));
  const E = add(Sh, P(-4.2, 3.2));
  sh.push(cap('leather', Sh, E, 1.8, 7, { g: 'arm' }), cap('bone', E, P(-7.5, -24.5 + bob * 0.3), 1, 7.1));
  const post = (ctx, px) => {
    for (const ex of [-2.6, 0.2]) { const e = px(add(C, P(ex, -0.4))); ctx.fillStyle = '#000'; ctx.fillRect(e.x - 1, e.y - 1, 2, 2); ctx.fillStyle = '#ff2a1a'; ctx.fillRect(e.x - 1, e.y, 1, 1); }
    const t = px(add(C, P(-1.8, 3.2))); ctx.fillStyle = '#000'; for (let i = 0; i < 4; i++) ctx.fillRect(t.x - 1 + i, t.y, 1, 1 + (i % 2));  // teeth
    // flaming hair streaming back
    const cols = ['#fff3a0', '#ffb03a', '#ff5a1a', '#c0201a'];
    for (let i = 0; i < 9; i++) { const k = i / 8, f = px(add(C, P(-1 + k * 9, -4.4 + Math.sin(T * 4 + i) * 0.8 + k * 1.5))); ctx.fillStyle = cols[Math.min(3, Math.floor(k * 4 + (i % 2)))]; ctx.fillRect(f.x, f.y - 1, 1 + (i % 2), 2 + ((i + Math.round(phase * 8)) % 2)); }
    // exhaust flame + spokes that spin
    const ex = px(P(17.5, -9)); ctx.fillStyle = Math.round(phase * 8) % 2 ? '#ffb03a' : '#ff5a1a'; ctx.fillRect(ex.x, ex.y - 1, 3, 2); ctx.fillStyle = '#fff3a0'; ctx.fillRect(ex.x, ex.y, 1, 1);
    for (const w of [RW, FW]) for (let k = 0; k < 2; k++) { const a = T + k * Math.PI / 2; for (const r of [3.5, 4.6]) { const sp = px(add(w, P(Math.cos(a) * r, Math.sin(a) * r))); ctx.fillStyle = '#c8d0e0'; ctx.fillRect(sp.x, sp.y, 1, 1); const sq = px(add(w, P(-Math.cos(a) * r, -Math.sin(a) * r))); ctx.fillRect(sq.x, sq.y, 1, 1); } }
    const hl = px(P(-11, -19)); ctx.fillStyle = '#fff7c0'; ctx.fillRect(hl.x - 1, hl.y, 2, 2);   // headlight
  };
  return { shapes: sh, post };
}

// ---- ACID SLIME (faces left): a wobbling green blob with a swallowed skull inside. pose 'sit' | 'up' | 'down'
export function slimeShapes(pose = 'sit', wob = 0) {
  const [rx, ry, lift] = pose === 'up' ? [7.4, 10.4, 2] : pose === 'down' ? [9, 8.6, 1] : [11 + wob, 7.4 - wob * 0.6, 0];
  const B = P(0, -ry - lift);
  const sh = [];
  sh.push(ell('slime', B, rx, ry, 1, { g: 'body', shadeLow: true, lowY: 0 }));
  sh.push(poly('slime', [add(B, P(-rx * 0.6, -ry * 0.7)), add(B, P(-rx * 0.15, -ry - 3)), add(B, P(rx * 0.2, -ry * 0.8))], 1.1, { g: 'body' }));   // drippy peak
  if (pose === 'sit') for (const dx of [-rx + 2, rx - 2.5]) sh.push(ell('slime', add(B, P(dx, ry - 0.6)), 2.2, 1.4, 1.2, { g: 'body' }));
  const post = (ctx, px) => {
    // swallowed skull floating inside
    const k = px(add(B, P(2.6, 1.6))); ctx.fillStyle = '#2e8a1c'; ctx.fillRect(k.x - 2, k.y - 2, 5, 4); ctx.fillStyle = '#d8ffa8'; ctx.fillRect(k.x - 1, k.y - 2, 3, 3); ctx.fillStyle = '#1e6a14'; ctx.fillRect(k.x - 1, k.y - 1, 1, 1); ctx.fillRect(k.x + 1, k.y - 1, 1, 1);
    // bubbles
    for (const [bx, by] of [[4, -3.5], [-1, 3], [5.5, 4]]) { const b = px(add(B, P(bx, by))); ctx.fillStyle = '#d8ffa8'; ctx.fillRect(b.x, b.y, 1, 1); }
    // big goofy eyes + grin
    for (const ex of [-5, -1.6]) { const e = px(add(B, P(ex * (rx / 10), -ry * 0.35))); ctx.fillStyle = '#0a1a08'; ctx.fillRect(e.x - 1, e.y - 1, 4, 4); ctx.fillStyle = '#ffffff'; ctx.fillRect(e.x, e.y, 2, 2); ctx.fillStyle = '#000'; ctx.fillRect(e.x, e.y + 1, 1, 1); }
    const m = px(add(B, P(-3.8 * (rx / 10), ry * 0.15))); ctx.fillStyle = '#0a1a08'; ctx.fillRect(m.x - 1, m.y, 5, 1); ctx.fillRect(m.x, m.y + 1, 3, 1);
  };
  return { shapes: sh, post };
}

// scale a character (shapes + its post-drawn details)
export function scaleShapes(g, k) {
  const sp = (p) => P(p.x * k, p.y * k);
  const shapes = g.shapes.map((sh) => sh.kind === 'cap' ? { ...sh, a: sp(sh.a), b: sp(sh.b), r: sh.r * k } : sh.kind === 'ell' ? { ...sh, c: sp(sh.c), rx: sh.rx * k, ry: sh.ry * k } : { ...sh, pts: sh.pts.map(sp) });
  return { shapes, post: g.post && ((ctx, px) => g.post(ctx, (p) => px(sp(p)))) };
}

// ---- BONUS BOX: a chrome Vollebak 'V' (like the V drone) spinning on its vertical axis ----
// A V-shaped prism, rotated and projected, drawn big then sampled down to crisp pixels,
// with mirror-chrome shading: hard light/dark bands and a sky-blue reflection.
export function vBoxFrame(theta, used = false) {
  const w = 24, h = 22, ox = 12, oy = 11;
  const front = [[-10.5, -9], [-4.2, -9], [0, 1.6], [4.2, -9], [10.5, -9], [0, 10]];
  const d = 4, ct = Math.cos(theta), st = Math.sin(theta);
  const proj = ([x, y, z]) => ({ x: x * ct + z * st, y, z: -x * st + z * ct });
  const faces = [];
  const F = front.map(([x, y]) => proj([x, y, d])), B = front.map(([x, y]) => proj([x, y, -d]));
  faces.push({ pts: F, n: proj([0, 0, 1]), kind: 'face' }, { pts: B.slice().reverse(), n: proj([0, 0, -1]), kind: 'face' });
  for (let i = 0; i < front.length; i++) {
    const j = (i + 1) % front.length, [x0, y0] = front[i], [x1, y1] = front[j];
    let nx = y1 - y0, ny = -(x1 - x0); const l = Math.hypot(nx, ny); nx /= l; ny /= l;
    faces.push({ pts: [F[i], F[j], B[j], B[i]], n: proj([nx, ny, 0]), kind: ny < -0.5 ? 'top' : 'side' });
  }
  const vis = faces.filter((f) => f.n.z > 0.02).sort((a, b) => a.pts.reduce((s, p) => s + p.z, 0) / a.pts.length - b.pts.reduce((s, p) => s + p.z, 0) / b.pts.length);
  const big = document.createElement('canvas'); big.width = w * S; big.height = h * S;
  const bx = big.getContext('2d');
  vis.forEach((f, i) => { bx.fillStyle = idColour(i + 1); bx.beginPath(); f.pts.forEach((p, k) => (k ? bx.lineTo((p.x + ox) * S, (p.y + oy) * S) : bx.moveTo((p.x + ox) * S, (p.y + oy) * S))); bx.closePath(); bx.fill(); });
  const dd = bx.getImageData(0, 0, big.width, big.height).data;
  const key = new Map(vis.map((f, i) => [idKey(i + 1), i]));
  const grid = new Int16Array(w * h).fill(-1);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const cnt = new Map(); let op = 0;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const o = ((y * S + j) * big.width + x * S + i) * 4; if (dd[o + 3] < 250) continue; op++; const k = key.get((dd[o] << 16) | (dd[o + 1] << 8) | dd[o + 2]); if (k !== undefined) cnt.set(k, (cnt.get(k) || 0) + 1); }
    if (op < 7) continue; let best = -1, bc = 0; for (const [k, c] of cnt) if (c > bc || (c === bc && k > best)) { best = k; bc = c; } grid[y * w + x] = best;
  }
  const pal = used ? ['#8a8496', '#5e5870', '#423c52', '#2a2436', '#1a1424'] : ['#ffffff', '#dfe4ee', '#aab2c4', '#6e7890', '#3a4058'];
  const sky = used ? '#4a4460' : '#8ab8f0';
  const out = document.createElement('canvas'); out.width = w; out.height = h; const x = out.getContext('2d');
  const at = (i, j) => (i < 0 || j < 0 || i >= w || j >= h ? -1 : grid[j * w + i]);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const k = at(i, j); if (k < 0) continue;
    const f = vis[k];
    // light from the upper left; chrome = strong contrast + a moving diagonal reflection streak
    let lv = 0.55 + f.n.x * -0.45 + f.n.z * 0.25 + (f.kind === 'top' ? 0.35 : 0);
    const streak = ((i - j * 0.6 + theta * 9) % 9 + 9) % 9;
    if (f.kind === 'face' && streak < 1.6) lv += 0.45;
    if (f.kind === 'face' && j > h * 0.62) lv -= 0.25;                  // darker ground reflection low down
    let c = pal[Math.max(0, Math.min(4, Math.round((1 - lv) * 4)))];
    if (f.kind === 'side' && !used && (i + j) % 7 === 0) c = sky;
    if (f.kind === 'face' && !used && streak > 4.4 && streak < 5.6) c = sky;
    if (at(i, j - 1) !== k && at(i, j - 1) >= 0) c = pal[0];          // bright crease where faces meet
    x.fillStyle = c; x.fillRect(i, j, 1, 1);
  }
  const img = x.getImageData(0, 0, w, h), od = img.data;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    if (at(i, j) >= 0) continue;
    if (at(i - 1, j) >= 0 || at(i + 1, j) >= 0 || at(i, j - 1) >= 0 || at(i, j + 1) >= 0) { const o = (j * w + i) * 4; od[o] = 10; od[o + 1] = 10; od[o + 2] = 16; od[o + 3] = 255; }
  }
  x.putImageData(img, 0, 0);
  return { c: out, ox, oy };
}

// ---- build every frame --------------------------------------------------------------
function frames(n, fn) { return Array.from({ length: n }, (_, i) => fn(i / n)); }
export function buildCharacters() {
  const R = (g, w, h, ox, oy, tint) => renderShapes(g.shapes, w, h, ox, oy, { post: g.post, tint });
  const heroRun = frames(8, (p) => R(heroShapes(p), 40, 50, 18, 46));
  const heroRunFlash = frames(8, (p) => R(heroShapes(p), 40, 50, 18, 46, '#ffffff'));
  const hero = { run: heroRun, runFlash: heroRunFlash, jump: R(heroShapes(0, 'jump'), 40, 50, 18, 46), fall: R(heroShapes(0, 'fall'), 40, 50, 18, 46) };
  hero.jumpFlash = R(heroShapes(0, 'jump'), 40, 50, 18, 46, '#ffffff'); hero.fallFlash = R(heroShapes(0, 'fall'), 40, 50, 18, 46, '#ffffff');
  const uni = frames(6, (p) => R(unicornShapes(1 - p), 64, 52, 34, 46));
  return {
    hero,
    face: R(heroShapes(0.25), 40, 50, 18, 46),
    unicorn: uni, unicornPuke: R(unicornShapes(0.1, 'puke'), 64, 52, 34, 46), unicornFlash: R(unicornShapes(0), 64, 52, 34, 46, '#ffffff'),
    unicornFly: frames(4, (p) => R(unicornShapes(1 - p, 'fly'), 64, 60, 34, 50)),
    brute: frames(4, (p) => R(bruteShapes(p), 48, 50, 24, 46)), bruteDizzy: R(bruteShapes(0, true), 48, 50, 24, 46),
    brutePuke: frames(2, (p) => R(bruteShapes(p * 0.5, false, true), 48, 50, 24, 46)),
    grunt: frames(6, (p) => R(goblinShapes(p, 'grunt'), 32, 34, 16, 31)),
    puker: frames(4, (p) => R(goblinShapes(p, 'puker'), 32, 34, 16, 31)),
    ghoul: { sit: R(ghoulShapes('sit'), 40, 40, 20, 36), leap: R(ghoulShapes('leap'), 40, 40, 20, 36), land: R(ghoulShapes('land'), 40, 40, 20, 36) },
    jacketSpin: frames(12, (p) => R(jacketShapes(p * Math.PI * 2), 30, 34, 15, 31)),
    jacketGlow: frames(12, (p) => R(jacketShapes(p * Math.PI * 2), 30, 34, 15, 31, '#fff7c0')),
    jacketIcon: frames(12, (p) => R(scaleShapes(jacketShapes(p * Math.PI * 2), 0.66), 22, 24, 11, 22)),
    // the twins: identical except one wears red shoes
    scientist: frames(6, (p) => R(scientistShapes(p), 36, 48, 18, 45)), scientistThrow: R(scientistShapes(0, 'throw'), 36, 48, 18, 45),
    scientistB: frames(6, (p) => R(scientistShapes(p, 'walk', 'shoeRed'), 36, 48, 18, 45)), scientistThrowB: R(scientistShapes(0, 'throw', 'shoeRed'), 36, 48, 18, 45),
    biker: frames(4, (p) => R(bikerShapes(p), 48, 44, 24, 42)),
    slime: { sit: R(slimeShapes('sit'), 32, 28, 16, 26), sit2: R(slimeShapes('sit', 1.2), 32, 28, 16, 26), up: R(slimeShapes('up'), 32, 28, 16, 26), down: R(slimeShapes('down'), 32, 28, 16, 26) },
    slimeSmall: { sit: R(scaleShapes(slimeShapes('sit'), 0.55), 20, 18, 10, 16), sit2: R(scaleShapes(slimeShapes('sit', 1.2), 0.55), 20, 18, 10, 16), up: R(scaleShapes(slimeShapes('up'), 0.55), 20, 18, 10, 16), down: R(scaleShapes(slimeShapes('down'), 0.55), 20, 18, 10, 16) },
    vbox: frames(16, (p) => vBoxFrame(p * Math.PI * 2)), vboxUsed: vBoxFrame(0.5, true),
  };
}
