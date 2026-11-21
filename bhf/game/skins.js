// Black Hole Friday: the six levels (scenery + baddies + boss in levels/<key>.js) for the FWAHBL engine (sim.js + render.js).
import { tintAll } from './kit.js';

// ---------- the set ----------
export const LEVEL_KEYS = ['neon', 'ice', 'hive', 'code', 'desert', 'tenet'];
// each level loads on its own: if one is broken (mid-edit), the last good copy in levels/base/ stands in so the rest still play
export async function buildSkins(B, K, D) {
  const out = {};
  for (const k of LEVEL_KEYS) {
    try { out[k] = (await import(`./levels/${k}.js`)).skin(B, K, D); }
    catch (e) { console.error('LEVEL ' + k + ' failed: ' + (e && e.stack || e)); out[k] = (await import(`./levels/base/${k}.js`)).skin(B, K, D); out[k].broken = true; }
  }
  for (const k of LEVEL_KEYS) out[k].key = k;                 // render.js looks the level's own coins up by this
  return out;
}
// the baddies for a level: its own where it has them, otherwise the FWAHBL originals tinted to fit
export function chrFor(skin, base, hero) {
  const out = {};
  for (const [k, v] of Object.entries(base)) out[k] = v;
  for (const k of ['grunt', 'puker', 'brute', 'bruteDizzy', 'brutePuke', 'ghoul', 'slime', 'slimeSmall', 'biker', 'unicorn', 'unicornPuke', 'unicornFlash', 'unicornFly', 'scientist']) if (!(k in skin.chr)) out[k] = tintAll(base[k], skin.tintCol, 0.35);
  for (const [k, v] of Object.entries(skin.chr)) if (v !== undefined) out[k] = v;
  if (!skin.chr.batF) { delete out.batF; delete out.batFlashF; }
  out.hero = hero;
  return out;
}
