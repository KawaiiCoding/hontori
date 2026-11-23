/*
 * chances.js  (Hontori game layer)
 * Job: the odds of binding and of escaping (old src/battle.js bind() and escChance()).
 *
 * Public API:
 *   BIND_TRIES = 3, CHARM_LUCK = 0.05, BREAD_CALM = 0.15
 *   bindChance({ foe, me, accuracy, gradeMul, wandPower, captureBonus, calm, charm })
 *     0.05 + 0.45 * (1 - foe hp share) + 0.18 asleep + 0.12 stunned + 0.15 * accuracy
 *     - 0.07 * (foe level - your level) - 0.08 if the foe's element beats yours + 0.05 if yours beats the foe;
 *     then x wandPower x gradeMul + captureBonus + calm + (charm ? 0.05 : 0), clamped to 0.05 .. 0.85
 *   escapeChance({ me, foe, tries, quick })
 *     0.4 + 0.08 * (your level - foe level) + 0.2 per failed try + 0.3 if the foe sleeps or is stunned
 *     - 0.1 if the foe moves first, clamped to 0.1 .. 0.95
 *   escapeBars(chance)     1 (< 0.4), 2 (< 0.7) or 3
 */

import { matrix } from './elements.js';
import { clamp } from '../../systems/battle/chances.js';

export const BIND_TRIES = 3;
export const CHARM_LUCK = 0.05;
export const BREAD_CALM = 0.15;

export function bindChance(o) {
  const { foe, me } = o;
  const acc = o.accuracy == null ? 0.5 : o.accuracy;
  const c = 0.05 + 0.45 * (1 - foe.hp / foe.max)
    + (foe.has('asleep') ? 0.18 : 0) + (foe.has('stun') ? 0.12 : 0)
    + 0.15 * acc
    - 0.07 * (foe.level - me.level)
    - (matrix(foe.el, me.el, me.el2) > 1 ? 0.08 : 0)
    + (matrix(me.el, foe.el, foe.el2) > 1 ? 0.05 : 0);
  return clamp(c * (o.wandPower || 1) * (o.gradeMul || 1) + (o.captureBonus || 0) + (o.calm || 0) + (o.charm ? CHARM_LUCK : 0), 0.05, 0.85);
}

export function escapeChance(o) {
  const c = 0.4 + 0.08 * (o.me.level - o.foe.level) + 0.2 * (o.tries || 0)
    + (o.foe.has('asleep') || o.foe.has('stun') ? 0.3 : 0) - (o.quick ? 0.1 : 0);
  return clamp(c, 0.1, 0.95);
}

export function escapeBars(chance) {
  return chance < 0.4 ? 1 : chance < 0.7 ? 2 : 3;
}
