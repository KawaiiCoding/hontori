/*
 * damage.js  (Hontori game layer)
 * Job: Hontori's hit and miss rules (old src/battle.js hitCalc and the start of attack()).
 *
 * Public API:
 *   FOE_SCALE = 0.75, CRIT_CHANCE = 0.08, TAIL_CRIT_CHANCE = 0.4
 *   rollMiss(att, def, random)   { missed, dodged }: the bearer of mist misses 40%, everyone misses 4%; a veiled
 *                                defender always dodges (the caller uses the veil up)
 *   hit(att, def, pow, { env, mult, wandPower, foe, random })
 *     -> { amount, crit, matchup, weather, shielded, guarded }
 *     amount = max(1, round(pow * level * atk * matchup * weather * m * scale * crit * spread))
 *       level 1 + 0.12 * (level - 1); atk 1 + atk * 0.05 (foes have none); m = mult (2 for unleash)
 *       x1.5 glow, x(1 + 0.6 * boost), x0.5 guard, x0.5 harden, x0.25 / wandPower / shield;
 *       scale 0.75 when the foe attacks; crit x1.5; spread 0.88 .. 1.12
 * Random draws in order: miss [mist 0.4 when misted], 0.04 (only if not yet missed); hit: crit, spread.
 */

import { matrix, weatherMul } from './elements.js';
import { scaleDamage } from '../../systems/battle/damage.js';

export const FOE_SCALE = 0.75;
export const CRIT_CHANCE = 0.08;
export const TAIL_CRIT_CHANCE = 0.4;

export function rollMiss(att, def, random) {
  const missed = (att.has('mist') && random() < 0.4) || random() < 0.04;
  return { missed: !!missed, dodged: def.has('veil') };
}

export function hit(att, def, pow, opts) {
  const matchup = matrix(att.el, def.el, def.el2);
  const weather = weatherMul(att.el, opts.env);
  const crit = opts.random() < (att.has('tail') ? TAIL_CRIT_CHANCE : CRIT_CHANCE);
  let m = opts.mult || 1;
  if (att.has('glow')) m *= 1.5;
  if (att.has('boost')) m *= 1 + 0.6 * att.get('boost');
  if (def.has('guard')) m *= 0.5;
  if (def.has('harden')) m *= 0.5;
  const shielded = def.has('shield');
  if (shielded) m *= 0.25 / (opts.wandPower || 1) / def.get('shield');
  const amount = scaleDamage({
    base: pow,
    factors: [1 + 0.12 * (att.level - 1), 1 + (att.atk || 0) * 0.05, matchup, weather, m, opts.foe ? FOE_SCALE : 1, crit ? 1.5 : 1],
    random: opts.random, spreadLow: 0.88, spreadWidth: 0.24, min: 1
  });
  return { amount, crit, matchup, weather, shielded, guarded: def.has('guard') };
}
