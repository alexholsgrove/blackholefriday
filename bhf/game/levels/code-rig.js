// THE CODE, the boss's two fighters: a jointed figure (the hero rig's proportions) that can be put in any pose, so both men can
// shoot, block, punch, kick and bend right back. Sprites are built the first time they are drawn (never in init / update).
import { renderShapes, cap, ell, poly, scaleShapes } from '../../../rig.js';
import { crinkle, flip } from '../../chars.js';

const P = (x, y) => ({ x, y }), add = (a, b) => P(a.x + b.x, a.y + b.y);
const dirv = (l, a) => P(Math.sin(a) * l, Math.cos(a) * l);            // 0 = straight down, + = forward (he faces right)
const rotp = (p, a) => { const s = Math.sin(a), k = Math.cos(a); return P(p.x * k - p.y * s, p.x * s + p.y * k); };

export const STYLE = {
  hero: { coat: 'copper', coatFar: 'copperFar', tee: 'tee', tr: 'trousers', trF: 'trousersFar', hair: 'spiky' },
  agent: { coat: 'suit', coatFar: 'suitFar', tee: 'shirt', tr: 'suit', trF: 'suitFar', hair: 'slick', tie: true },
};
const HAIR = [[-4.8, 3], [-7.2, 0], [-11, -2.6], [-7, -4], [-10.4, -7.8], [-4.8, -6.6], [-5.6, -11.4], [-1.6, -7.6], [0.4, -11.8], [2, -7.4], [5.4, -9.4], [4.6, -5.6], [6.4, -4.6], [3.4, -3.2], [0.6, -3.4], [-2.4, -1.2], [-2.8, 2.4]];
const SLICK = [[-4.6, 1.8], [-5, -2.4], [-3, -4.9], [1, -5.5], [4.6, -4.2], [4.6, -2.6], [0.8, -3.1], [-2, -1.6], [-2.6, 1.8]];

// pose: lean (torso from upright, + forward), hd (extra head turn), tN kN tF kF (thigh / knee, near and far leg), aN eN aF eF (upper arm /
// elbow), fN fF (boot turn), hip (hip height for a man in the air; otherwise the lower foot is put on the floor), anc ('N' | 'F' | undefined:
// which foot stays at x 0), dx, gun, flap, farFront. Returns { shapes, post, pts } in 1x units, origin = the floor under him.
export function figure(p, S) {
  const legv = (th, k) => { const K = dirv(7.2, th), F = add(K, dirv(7.4, th - k)); return [K, F]; };
  const [kN0, fN0] = legv(p.tN, p.kN), [kF0, fF0] = legv(p.tF, p.kF);
  const ty = p.hip != null ? p.hip : -0.7 - Math.max(fN0.y, fF0.y);
  const tx = (p.anc === 'N' ? -fN0.x : p.anc === 'F' ? -fF0.x : -(fN0.x + fF0.x) / 2) + (p.dx || 0);
  const H = P(tx, ty), KN = add(H, kN0), FN = add(H, fN0), KF = add(H, kF0), FF = add(H, fF0);
  const r = p.lean - 0.3, o = (x, y) => rotp(P(x, y), r);
  const Sh = add(H, P(10 * Math.sin(p.lean), -10 * Math.cos(p.lean)));
  const rh = (p.lean < -0.2 ? (p.lean + 0.2) * 0.95 : p.lean > 0.5 ? (p.lean - 0.5) * 0.8 : 0) + (p.hd || 0);
  const C = add(Sh, rotp(P(2.6, -6.4), r * 0.85 + (p.hd || 0) * 0.4)), oh = (x, y) => add(C, rotp(P(x, y), rh));
  const ShF = add(Sh, o(-1.4, 0.3));
  const fa = p.aN + p.eN, EN = add(Sh, dirv(5.2, p.aN)), HN = add(EN, dirv(4.4, fa)), cuffN = add(EN, dirv(3.2, fa));
  const fb = p.aF + p.eF, EF = add(ShF, dirv(5.4, p.aF)), HF = add(EF, dirv(4.2, fb));
  const sh = [], zF = p.farFront ? 9.5 : 1;
  sh.push(cap(S.coatFar, ShF, EF, 1.9, zF, { g: 'armF' }), cap(S.coatFar, EF, add(EF, dirv(3, fb)), 1.7, zF + 0.1, { g: 'armF' }), cap(S.tee, add(EF, dirv(3, fb)), add(EF, dirv(3.6, fb)), 1.5, zF + 0.2), ell('skinFar', HF, 1.6, 1.6, zF + 0.3));
  const boot = (F, a, far) => cap('boot', add(F, rotp(P(-1, 0), a)), add(F, rotp(P(far ? 2.6 : 2.8, 0.4), a)), far ? 1.7 : 1.8, far ? 2.2 : 3.2);
  sh.push(cap(S.trF, H, KF, 2.3, 2, { g: 'legF' }), cap(S.trF, KF, FF, 2.1, 2, { g: 'legF' }), boot(FF, p.fF || 0, true));
  sh.push(cap(S.tr, H, KN, 2.4, 3, { g: 'legN' }), cap(S.tr, KN, FN, 2.2, 3, { g: 'legN' }), boot(FN, p.fN || 0, false));
  // the jacket: body, and a hem that hangs (it only half follows the body round, so the tails drop when he bends back)
  const flap = p.flap ?? 1.2, hg = r * 0.45, oo = (x, y) => rotp(P(x, y), hg);
  const hemF = add(H, oo(3.8 + Math.max(0, Math.min(1.2, p.tN)) * 1.5, 4.6)), hemM = add(H, oo(-0.5, 5.4)), hemB = add(H, oo(-6.4 - flap, 4.2 + flap * 0.4));
  sh.push(poly(S.coat, [add(Sh, o(-3.6, -0.6)), add(Sh, o(2.6, -0.6)), add(H, o(3.4, 0)), hemF, hemM, hemB, add(H, o(-4.2, 0))], 5, { g: 'coat' }));
  sh.push(poly(S.tee, [add(Sh, o(0.8, 0.4)), add(Sh, o(2.7, 0)), add(H, o(3.6, -0.6)), add(H, o(1.8, -0.6))], 5.5, { noSeam: true }));
  if (S.tie) {                                      // the tie lies down his shirt until he is past flat on his back, then it hangs from his collar
    const knot = add(Sh, o(1.9, 0.9)), tip = Math.cos(p.lean) > -0.05 ? add(H, o(2.9, -2.4)) : add(knot, P(-1.2 + (p.tieX || 0), 6.2));
    sh.push(cap('slick', knot, tip, 0.55, 5.6, { noSeam: true }));
  }
  sh.push(poly(S.coat, [add(Sh, o(-3, 0.2)), add(Sh, o(-2.4, -3.6)), add(Sh, o(0.4, -2.4)), add(Sh, o(1.6, 0.6))], 6, { g: 'coat' }));
  sh.push(ell('skin', oh(0.4, 0.4), 4.4, 4.8, 7, { g: 'head', rot: rh }));
  sh.push(poly('skin', [oh(-1.5, 2.4), oh(4.6, 1.4), oh(4, 4.4), oh(0.8, 5.4)], 7.1, { g: 'head' }));
  sh.push(poly(S.hair === 'slick' ? 'slick' : 'hair', (S.hair === 'slick' ? SLICK : HAIR).map(([x, y]) => oh(x, y)), 8));
  sh.push(poly('glasses', [oh(0.2, -2.4), oh(5.6, -2.6), oh(5.4, -0.2), oh(3.4, 0.4), oh(0.4, -0.2)], 9, { noSeam: true }));
  sh.push(cap(S.coat, Sh, EN, 2.2, 10, { g: 'sleeve' }), cap(S.coat, EN, cuffN, 2, 10.1, { g: 'sleeve' }), cap(S.tee, cuffN, add(EN, dirv(3.9, fa)), 1.7, 10.2), ell('skin', HN, 1.9, 1.8, 10.3));
  const g = (x, y) => add(HN, rotp(P(x, y), Math.PI / 2 - fa));        // along the forearm
  if (p.gun) sh.push(cap('dark', g(0.2, -1), g(4.6, -1), 0.95, 10.4), cap('dark', g(0, 0), g(-0.3, 1.9), 0.75, 10.35));
  const slick = S.hair === 'slick';
  const post = (ctx, px, s = 1) => {
    const dot = (pt, col, w = 1, h = 1) => { const q = px(pt); ctx.fillStyle = col; ctx.fillRect(q.x, q.y, Math.max(1, Math.round(w * s)), Math.max(1, Math.round(h * s))); };
    dot(oh(4.2, -1.6), '#9cc8f0'); dot(oh(3.4, 3), '#8a4a3a'); dot(oh(-1.4, 0.8), slick ? '#d8dce4' : '#c0835c', 1, slick ? 1 : 2);
    if (slick) { dot(oh(-2.2, 2.6), '#d8dce4'); dot(oh(-2.4, 4.2), '#d8dce4'); }
    if (p.gun) dot(g(1.2, -1.6), '#8a90a0', 2.4, 0.5);
  };
  return { shapes: sh, post, pts: { muzzle: g(5.8, -1), fistN: HN, fistF: HF, footN: FN, footF: FF, head: C, chest: P((Sh.x + H.x) / 2, (Sh.y + H.y) / 2), hip: H, sh: Sh } };
}

export const mix = (a, b, t) => { const o = { ...b }; for (const k in a) if (typeof a[k] === 'number') o[k] = a[k] + ((b[k] ?? 0) - a[k]) * t; for (const k in b) if (typeof b[k] === 'number' && !(k in a)) o[k] = b[k] * t; return o; };

// build one sprite: { c, ox, oy, k, pts } with pts in sprite-scale pixels from the origin (x already mirrored for a man who faces left)
export function buildSprite(pose, S, k, { copper = false, left = false, finish = null } = {}) {
  let g = figure(pose, S); const pts0 = g.pts, post0 = g.post;
  if (k !== 1) g = scaleShapes({ shapes: g.shapes }, k);
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const ext = (q, e) => { x0 = Math.min(x0, q.x - e); x1 = Math.max(x1, q.x + e); y0 = Math.min(y0, q.y - e); y1 = Math.max(y1, q.y + e); };
  for (const s of g.shapes) { if (s.kind === 'cap') { ext(s.a, s.r); ext(s.b, s.r); } else if (s.kind === 'ell') ext(s.c, Math.max(s.rx, s.ry)); else s.pts.forEach((q) => ext(q, 0)); }
  const ox = Math.ceil(-x0) + 3, oy = Math.ceil(-y0) + 3, w = ox + Math.ceil(x1) + 3, h = oy + Math.ceil(y1) + 3;
  let fr = renderShapes(g.shapes, w, h, ox, oy, { post: (ctx, px) => post0(ctx, (q) => px(P(q.x * k, q.y * k)), k) });
  if (copper) crinkle(fr, 1.3);
  if (left) fr = flip(fr);
  if (finish) fr = finish(fr);
  const pts = {}; for (const n in pts0) pts[n] = { x: pts0[n].x * k * (left ? -1 : 1), y: pts0[n].y * k };
  return { c: fr.c, ox: fr.ox, oy: fr.oy, k, pts };
}

// ---------- the poses ----------
const B0 = { lean: 0.1, hd: 0, tN: 0.3, kN: 0.3, tF: -0.3, kF: 0.25, aN: 0.2, eN: 0.5, aF: -0.1, eF: 0.4, fN: 0, fF: 0 };
const mk = (o) => ({ ...B0, ...o });
export const POSE = {
  // the hero
  aim: mk({ lean: 0.12, tN: 0.38, kN: 0.3, tF: -0.34, kF: 0.25, aN: 1.5, eN: 0.05, aF: -0.25, eF: 0.5, gun: 1 }),
  aimLow: mk({ lean: 0.16, tN: 0.38, kN: 0.3, tF: -0.34, kF: 0.25, aN: 1.2, eN: 0.08, aF: -0.25, eF: 0.5, gun: 1 }),
  fire: mk({ lean: 0.04, tN: 0.38, kN: 0.3, tF: -0.34, kF: 0.25, aN: 1.72, eN: 0.12, aF: -0.4, eF: 0.5, gun: 1 }),
  fireLow: mk({ lean: 0.08, tN: 0.38, kN: 0.3, tF: -0.34, kF: 0.25, aN: 1.42, eN: 0.14, aF: -0.4, eF: 0.5, gun: 1 }),
  reload: mk({ lean: 0.2, hd: 0.25, tN: 0.38, kN: 0.3, tF: -0.34, kF: 0.25, aN: 0.75, eN: 1.75, aF: 0.9, eF: 1.3, gun: 1 }),
  holster: mk({ lean: 0.1, tN: 0.3, kN: 0.25, tF: -0.3, kF: 0.25, aN: 0.1, eN: 0.35, aF: -0.2, eF: 0.4 }),
  bendG: mk({ lean: -1.32, tN: 1.0, kN: 1.72, tF: 0.86, kF: 1.58, aN: 1.8, eN: 0.1, aF: 2.9, eF: -0.3, gun: 1, flap: 2.5 }),
  bend: mk({ lean: -1.32, tN: 1.0, kN: 1.72, tF: 0.86, kF: 1.58, aN: 2.75, eN: -0.4, aF: 1.9, eF: -0.2, flap: 2.5 }),
  ouch: mk({ lean: -0.38, hd: -0.2, tN: 0.1, kN: 0.5, tF: -0.5, kF: 0.2, aN: 2.3, eN: 0.5, aF: -1.3, eF: 0.4, dx: -1.5 }),
  ouchG: mk({ lean: -0.38, hd: -0.2, tN: 0.1, kN: 0.5, tF: -0.5, kF: 0.2, aN: 2.3, eN: 0.5, aF: -1.3, eF: 0.4, dx: -1.5, gun: 1 }),
  guard: mk({ lean: 0.16, tN: 0.52, kN: 0.6, tF: -0.42, kF: 0.4, aN: 0.5, eN: 1.95, aF: 1.0, eF: 1.25 }),
  guard2: mk({ lean: 0.2, tN: 0.58, kN: 0.72, tF: -0.46, kF: 0.5, aN: 0.56, eN: 1.85, aF: 1.06, eF: 1.15 }),
  block: mk({ lean: 0.02, tN: 0.5, kN: 0.6, tF: -0.46, kF: 0.42, aN: 0.2, eN: 2.0, aF: 1.45, eF: 1.55, farFront: 1 }),
  punch: mk({ lean: 0.5, tN: 0.86, kN: 0.8, tF: -0.62, kF: 0.25, aN: 1.56, eN: 0.02, aF: -0.7, eF: 2.0, dx: 4 }),
  whiff: mk({ lean: 0.72, hd: 0.15, tN: 0.95, kN: 0.9, tF: -0.7, kF: 0.2, aN: 1.85, eN: 0.05, aF: -1.0, eF: 1.6, dx: 5 }),
  crouch: mk({ lean: 0.55, tN: 1.0, kN: 1.6, tF: 0.5, kF: 1.35, aN: -0.5, eN: 0.6, aF: -0.9, eF: 0.5 }),
  fly: mk({ lean: -0.45, tN: 1.56, kN: 0.04, tF: 0.5, kF: 2.1, aN: -0.9, eN: 0.7, aF: 2.1, eF: 0.5, fN: -1.2, hip: -15, flap: 4 }),
  // the agent (posed facing right like the hero; his sprites are mirrored)
  aAim: mk({ lean: 0.04, tN: 0.2, kN: 0.18, tF: -0.2, kF: 0.14, aN: 1.28, eN: 0.06, aF: 0.05, eF: 0.25, gun: 1 }),
  aFire: mk({ lean: -0.02, tN: 0.2, kN: 0.18, tF: -0.2, kF: 0.14, aN: 1.5, eN: 0.12, aF: 0.0, eF: 0.25, gun: 1 }),
  aTwo: mk({ lean: 0.28, tN: 0.62, kN: 0.62, tF: -0.5, kF: 0.3, aN: 1.52, eN: 0.04, aF: 1.46, eF: 0.1, gun: 1 }),
  aTwoF: mk({ lean: 0.2, tN: 0.62, kN: 0.62, tF: -0.5, kF: 0.3, aN: 1.62, eN: 0.08, aF: 1.56, eF: 0.14, gun: 1 }),
  aReload: mk({ lean: 0.16, hd: 0.42, tN: 0.2, kN: 0.18, tF: -0.2, kF: 0.14, aN: 0.7, eN: 1.7, aF: 0.9, eF: 1.1, gun: 1 }),
  aFlinch: mk({ lean: -0.42, hd: -0.25, tN: 0.05, kN: 0.45, tF: -0.5, kF: 0.15, aN: 2.4, eN: 0.4, aF: -1.2, eF: 0.4, gun: 1, dx: -1.5 }),
  aSway: mk({ lean: -1.05, tN: 0.8, kN: 1.3, tF: 0.55, kF: 1.05, aN: -1.9, eN: 0.5, aF: -0.8, eF: 0.4, gun: 1 }),
  aDisarm: mk({ lean: -0.3, hd: -0.2, tN: 0.1, kN: 0.4, tF: -0.45, kF: 0.15, aN: 2.7, eN: 0.25, aF: -0.6, eF: 0.4 }),
  aTie: mk({ lean: 0.02, tN: 0.14, kN: 0.12, tF: -0.14, kF: 0.1, aN: 0.55, eN: 2.25, aF: 0.0, eF: 0.2 }),
  aGuard: mk({ lean: 0.06, tN: 0.42, kN: 0.45, tF: -0.36, kF: 0.3, aN: 0.45, eN: 1.7, aF: 1.15, eF: 0.9 }),
  aGuard2: mk({ lean: 0.1, tN: 0.48, kN: 0.56, tF: -0.4, kF: 0.4, aN: 0.5, eN: 1.6, aF: 1.2, eF: 0.8 }),
  aWind: mk({ lean: -0.22, tN: 0.3, kN: 0.55, tF: -0.55, kF: 0.25, aN: -0.95, eN: 2.3, aF: 1.25, eF: 0.8, dx: -2 }),
  aPunch: mk({ lean: 0.52, tN: 0.9, kN: 0.8, tF: -0.66, kF: 0.22, aN: 1.56, eN: 0.02, aF: -0.6, eF: 1.9, dx: 7 }),
  aJab: mk({ lean: 0.4, tN: 0.8, kN: 0.75, tF: -0.6, kF: 0.25, aN: 0.3, eN: 2.0, aF: 1.55, eF: 0.05, dx: 6, farFront: 1 }),
  aCoil: mk({ lean: 0.34, tN: 0.75, kN: 1.25, tF: 0.1, kF: 0.9, aN: 0.6, eN: 1.8, aF: 0.9, eF: 1.4 }),
  aKick: mk({ lean: -0.72, hd: 0.5, tN: 2.12, kN: 0.02, tF: -0.06, kF: 0.06, aN: -0.7, eN: 0.6, aF: 0.4, eF: 0.8, fN: -1.9, anc: 'F', dx: 6 }),
  aBent: mk({ lean: -1.68, tN: 1.12, kN: 1.9, tF: 0.96, kF: 1.74, aN: 3.0, eN: -0.3, aF: 2.0, eF: -0.2, flap: 2.5 }),
  aHit: mk({ lean: -0.62, hd: -0.7, tN: 0.05, kN: 0.55, tF: -0.6, kF: 0.25, aN: 2.3, eN: 0.7, aF: -1.5, eF: 0.6, dx: -3, flap: 2 }),   // a punch lands: head snapped back, arms flung
  aSlip: mk({ lean: -0.85, tN: 0.7, kN: 1.15, tF: 0.45, kF: 0.95, aN: -1.6, eN: 0.6, aF: -0.5, eF: 0.6 }),
  aStagger: mk({ lean: 0.62, hd: 0.5, tN: 0.6, kN: 1.0, tF: -0.1, kF: 0.7, aN: 0.25, eN: 0.25, aF: 0.1, eF: 0.2 }),
  aFly: mk({ lean: -0.45, tN: 1.56, kN: 0.04, tF: 0.5, kF: 2.1, aN: -0.9, eN: 0.7, aF: 2.1, eF: 0.5, fN: -1.2, hip: -15, flap: 4 }),
  aFold: mk({ lean: 1.15, hd: 0.3, tN: 1.5, kN: 0.3, tF: 1.25, kF: 0.4, aN: 1.3, eN: 0.3, aF: 1.1, eF: 0.3, hip: -14, flap: 3 }),
  aSplat: mk({ lean: -0.12, hd: -0.3, tN: 0.5, kN: 0.3, tF: -0.55, kF: 0.2, aN: 2.5, eN: 0.3, aF: -2.4, eF: -0.3, hip: -17 }),
};
