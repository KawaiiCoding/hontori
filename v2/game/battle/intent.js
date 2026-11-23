/*
 * intent.js  (Hontori game layer)
 * Job: what a foe plans each round, and who moves first (old src/battle.js pickIntent and quickFoe).
 *
 * Public API:
 *   intentWeights(foe, me, lastIntent, round)   { strike, charge, guard, heal, hex }
 *   pickIntent(foe, me, lastIntent, round, random)   'unleash' when charged (no draw), else one weighted draw
 *   quickFoe(foe, me)        a wind or electric foe moves first, unless yours has tailwind or is wind
 * Weights: strike 5, charge 1.6, guard 1.3, heal 0, hex 1.1. Heal 1.6 below 60% hp, 3 below 35%, then 0 right
 * after a heal or above 85%. By element: fire and electric charge +1.6; earth guard +2; grass and light heal
 * +1.5 below 70% (after the reset, so they may heal twice in a row); dark and water hex +1.6; wind strike +2.
 * No hex while yours sleeps or is veiled; no guard twice in a row; hex x0.3 right after a hex;
 * round 1: no charge and hex x0.5.
 */

import { weightedPick } from '../../systems/battle/intent.js';

export function intentWeights(foe, me, lastIntent, round) {
  const hp = foe.hp / foe.max;
  const w = { strike: 5, charge: 1.6, guard: 1.3, heal: 0, hex: 1.1 };
  if (hp < 0.6) w.heal = 1.6;
  if (hp < 0.35) w.heal = 3;
  if (lastIntent === 'heal' || hp > 0.85) w.heal = 0;
  const e = foe.el;
  if (e === 'fire' || e === 'electric') w.charge += 1.6;
  if (e === 'earth') w.guard += 2;
  if ((e === 'grass' || e === 'light') && hp < 0.7) w.heal += 1.5;
  if (e === 'dark' || e === 'water') w.hex += 1.6;
  if (e === 'wind') w.strike += 2;
  if (me.has('asleep') || me.has('veil')) w.hex = 0;
  if (lastIntent === 'guard') w.guard = 0;
  if (lastIntent === 'hex') w.hex *= 0.3;
  if (round <= 1) {
    w.charge = 0;
    w.hex *= 0.5;
  }
  return w;
}

export function pickIntent(foe, me, lastIntent, round, random) {
  if (foe.has('charged')) return 'unleash';
  return weightedPick(intentWeights(foe, me, lastIntent, round), random, 'strike');
}

export function quickFoe(foe, me) {
  return (foe.el === 'wind' || foe.el === 'electric') && !me.has('tail') && me.el !== 'wind';
}
