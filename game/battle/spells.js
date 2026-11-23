/*
 * spells.js  (Hontori game layer)
 * Job: the wand spells as data and their pure rules: cost, mastery, recognition tolerance, drawing grades and
 * the Dawn Star material (old src/battle.js, lines 48 to 59, 812 to 828 and 1182 to 1184).
 *
 * Public API:
 *   SPELLS                  id -> { name, cost, on: 'me' | 'foe', desc, how, world? }
 *   BATTLE_SPELLS           the seven spells that can be cast in battle, in sheet order
 *   MASTERY_XP              [0, 6, 16, 32, 56]: spell EXP for mastery 1 .. 5
 *   GRADES                  flawless / strong / weak: { name, mul, exp }
 *   gradeOf(accuracy)       'flawless' (>= 0.55), 'strong' (>= 0.25) or 'weak'; null counts as 0.5
 *   masteryOf(xp, stored)   1 .. 5 from spell EXP, never below the stored mastery
 *   spellCost(kind, mastery, perks)   base cost - wand costCut - 1 at mastery 4+, never below 1 (0 stays 0)
 *   tolerance(mastery, perks)         recognition slack: min(0.07, perks.tolerance / 2 + 0.01 * (mastery - 1))
 *   reviveMaterial(element)           'ember_dust' (fire), 'tide_pearl' (water), else 'spirit_snack'
 *   MATERIAL_NAMES                    material id -> shown name
 *   normalizeSpellId(id)              the old name 'absorb' -> 'bind'
 */

import { gradeFor, levelFromXp } from '../../systems/battle/spells.js';

export const SPELLS = Object.freeze({
  mend: { name: 'Mending Sigil', cost: 1, on: 'me', desc: 'Heal and wake', how: 'circle' },
  shield: { name: 'Aegis Ward', cost: 1, on: 'me', desc: 'Blocks most of the next hit', how: 'U' },
  boost: { name: 'Rally Rune', cost: 1, on: 'me', desc: 'Next move +60%', how: 'peak' },
  stun: { name: 'Thunder Seal', cost: 2, on: 'foe', desc: 'Foe may lose its turn', how: 'zigzag' },
  sleep: { name: 'Dream Veil', cost: 2, on: 'foe', desc: 'Foe may fall asleep', how: 'wave' },
  bind: { name: 'Binding Spiral', cost: 2, on: 'foe', desc: 'Bind a weak foe', how: 'spiral' },
  revive: { name: 'Dawn Star', cost: 3, on: 'me', desc: 'Revive with a material', how: 'star' },
  veil: { name: 'Velum Aperi', cost: 0, on: 'me', desc: 'Lift the veil', how: 'V', world: true },
  fish: { name: 'Fishing Sigil', cost: 1, on: 'me', desc: 'Casts a line of light into water', how: 'hook', world: true }
});

export const BATTLE_SPELLS = Object.freeze(['mend', 'shield', 'boost', 'stun', 'sleep', 'bind', 'revive']);

export const MASTERY_XP = Object.freeze([0, 6, 16, 32, 56]);

/* the old table said flawless 1.25 and then overwrote it with 1.3; 1.3 is what played */
export const GRADES = Object.freeze({
  flawless: { name: 'Flawless', mul: 1.3, exp: 3 },
  strong: { name: 'Strong', mul: 1, exp: 2 },
  weak: { name: 'Weak', mul: 0.7, exp: 1 }
});
const GRADE_STEPS = [{ id: 'flawless', min: 0.55 }, { id: 'strong', min: 0.25 }, { id: 'weak', min: -Infinity }];

export function gradeOf(accuracy) {
  return gradeFor(accuracy == null ? 0.5 : accuracy, GRADE_STEPS);
}

export function masteryOf(xp, stored) {
  return Math.max(levelFromXp(xp, MASTERY_XP), Math.min(5, stored || 1));
}

export function spellCost(kind, mastery, perks) {
  const c = SPELLS[kind] ? SPELLS[kind].cost : 0;
  if (!c) return c;
  return Math.max(1, c - ((perks && perks.costCut) || 0) - (mastery >= 4 ? 1 : 0));
}

export function tolerance(mastery, perks) {
  return Math.min(0.07, ((perks && perks.tolerance) || 0) * 0.5 + 0.01 * (mastery - 1));
}

export function reviveMaterial(element) {
  return { fire: 'ember_dust', water: 'tide_pearl' }[element] || 'spirit_snack';
}

export const MATERIAL_NAMES = Object.freeze({ ember_dust: 'Ember Dust', tide_pearl: 'Tide Pearl', spirit_snack: 'Spirit Snack' });

export function normalizeSpellId(id) {
  return id === 'absorb' ? 'bind' : id;
}
