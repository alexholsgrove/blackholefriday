// Black Hole Friday level: DEEP DESERT. Crossing the open desert at dusk, along a spice pipeline; the boss is the great worm. The look and the dangers are in desert-art.js.
import { cv, pix, dith, hash, tint, frames, TAU, drawText, GRAD, noise, fr, scaleFr, tintAll, sky, pitCycle, LOOK, arcadeCanvas, glow } from '../kit.js';
import { BW, BH, FL, hurt, win, bar } from '../bosskit.js';
import { desertMouse, sandSkiff } from '../critters.js';
import * as ART from './desert-art.js';
import { makeWormBoss } from './desert-worm.js';

// the rock the city is cut into (in shadow: plum and umber), and the dusk light that rims it
const W0 = '#3a2230', W1 = '#4a2c38', W2 = '#643c42', W3 = '#2c1826', W4 = '#1e101c', W5 = '#120812', RIM = '#8a4a3a';
const rc = (x) => (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };

// a row of dunes across w px (it tiles): lit crests, the lee side in shadow
function dunes(x, w, yBase, amp, k1, k2, ph, body, shade, crest, bottom) {
  const top = [];
  for (let i = 0; i < w; i++) {
    const a = i / w, s1 = 1 - Math.abs(Math.sin(Math.PI * k1 * a + ph)), s2 = 0.5 + 0.5 * Math.sin(TAU * k2 * a + ph * 3);
    top.push(Math.round(yBase - amp * (Math.pow(s1, 1.5) * 0.75 + s2 * 0.25)));
  }
  for (let i = 0; i < w; i++) {
    const y = top[i], lee = top[(i + w - 3) % w] < y;
    for (let j = y; j < bottom; j++) {
      const d = j - y;
      x.fillStyle = d === 0 ? (lee ? body : crest) : lee && dith([1, 0], d / 12, i, j) ? shade : dith([body, shade], (d - 6) / 30, i, j);
      x.fillRect(i, j, 1, 1);
    }
  }
  return top;
}

// the boss (THE GREAT WORM: hold to walk to the rock, dodge the wormsign, beat the storm) lives in desert-worm.js

export function skin(B, K, D) {
  const P = { base: '#8a5644', hi: '#f4d49a', top: '#d8a070', deep: '#2c1826', dark: '#4a2c36', wall: W0, lamp: '#ffb04a', glow: '#7ad8ff' };
  const mid = ART.buildMid();
  const raiderBig = D.raider.slice(0, 4).map((f) => scaleFr(f, 1.35)); const thopF = D.thop.map((f) => f);
  const chr = { grunt: D.raider, puker: tintAll(D.raider, '#7ad8ff', 0.2), brute: raiderBig, bruteDizzy: tint(raiderBig[0], '#ffffff', 0.4), brutePuke: [raiderBig[1]], ghoul: { sit: D.raider[0], leap: D.raider[3], land: D.raider[5] },
    slime: desertMouse(1), slimeSmall: desertMouse(0.6), biker: sandSkiff(D.raider[0]),
    batF: thopF.map((f) => scaleFr(f, 0.6)), batFlashF: tint(scaleFr(thopF[0], 0.6), '#ffffff', 0.8), unicornFly: thopF, flyFlash: tint(thopF[0], '#ffffff', 0.8),
    unicorn: [fr(D.thumper(0), 7, 34)], unicornPuke: fr(D.thumper(0.25), 7, 34), unicornFlash: tint(fr(D.thumper(0), 7, 34), '#ffffff', 0.8),
    ...ART.dangerChr() };
  const deck = pix(96, 40, (i, j) => {                                // wind-rippled sand over rock
    if (j === 0) return '#f4d49a';
    if (j === 1) return (i * 5) % 7 < 2 ? '#f4d49a' : '#d8a070';
    if (j < 7) { const rip = Math.sin((i + j * 2.5) * TAU / 24) + Math.sin(i * TAU / 32) * 0.5; return rip > 0.9 ? '#d8a070' : rip < -0.9 ? '#7c4c3c' : dith(['#b47a54', '#8c5a44'], (j - 2) / 5, i, j); }
    if (j < 10) return dith(['#7c4c3c', '#4a2c36'], (j - 7) / 3, i, j);
    const jj = j + Math.round(Math.sin(i * TAU / 48) * 1.5);
    if (jj % 7 === 0) return '#24141e'; if (jj % 7 === 1 && hash(i >> 2, jj) > 0.5) return '#5a3640'; if (jj % 7 > 1 && (i + Math.floor(jj / 7) * 9) % 19 === 0) return '#24141e';
    return dith(['#44283a', '#341e2e', '#26141e', '#1a0e16'], (j - 10) / 30, i, j);
  });
  return {
    name: 'DEEP DESERT', style: 'desert', P, drip: LOOK.desert, puddle: LOOK.desert, drawPipe: ART.drawPipe, drawPlat: ART.drawPlat,
    sky: ART.buildSky(D), far: ART.buildFar(), farY: 64, mid: mid.c, midY: 119, near: ART.buildNear(), arcade: ART.buildWall(D), arcadeTop: 36, deck,
    pit: pitCycle(['#4a2a2c', '#5c3632', '#70423a', '#865244', '#a06650', '#dca46c', '#a06650', '#70423a'], 19), pitUp: 4, fg: ART.buildFg(), particles: 'spice',
    blob: ['#8a5a32', '#e8c088', '#f8dca0'], titleFill: GRAD.gold, tintCol: '#e8c088', chr,
    wallFx: ART.wallFx, backFx: ART.makeBackFx(mid), frontFx: ART.frontFx, drawFlyer: ART.drawFlyer,
    danger: ART.danger, fx: ART.fx, labels: ART.labels,
    boss: makeWormBoss(D, B.hero),
  };
}
