/*
 * ringRules.js  (Hontori game layer)
 * Job: the ring rules of the great schools: a named rule a trainer's `rules` list (content) turns on for one
 * battle, with hooks the round cycle calls. A new school's rule is one defineRingRule call here; the battle
 * engine and the scene stay as they are. The rules that only refuse something (noSwitch, noCapture) are setup
 * flags instead (setup.js).
 *
 * Public API:
 *   defineRingRule(id, hooks)   hooks: { roundStart(b) }   roundStart runs at the start of every round
 *                               after the first, before the foe picks its intent; it may emit events
 *   ringRulesOf(ids)            the ids among them that name a ring rule (unknown names are left out)
 *   runRingRules(b, hook)       call that hook of every ring rule of this battle (b.state.rules); a rule
 *                               that throws is reported in b.errors through the engine and skipped
 *   RING_RULES                  the ids defined so far
 *
 * Defined here:
 *   windSwap   THE WIND CHOOSES (Gale Loft): every 3 rounds the wind swaps your hontori on the field for
 *              another one of the party that can still fight, at random. No turn is lost. Nothing happens
 *              with nobody to swap in, or while yours has fainted (the forced choice comes first).
 */

import { me, say } from './common.js';
import { bringIn } from './swap.js';
import { aliveOthers } from './turn.js';

const RULES = new Map();
export const RING_RULES = [];

export function defineRingRule(id, hooks) {
  if (!id || RULES.has(id)) throw new Error(`ring rule "${id}" is already defined`);
  RULES.set(id, Object.freeze({ ...hooks }));
  RING_RULES.push(id);
}

export function ringRulesOf(ids) {
  return (Array.isArray(ids) ? ids : []).filter((id, i, list) => RULES.has(id) && list.indexOf(id) === i);
}

export function runRingRules(b, hook) {
  for (const id of b.state.rules || []) {
    const rule = RULES.get(id);
    if (!rule || typeof rule[hook] !== 'function') continue;
    try {
      rule[hook](b);
    } catch (error) {
      b.emit('error', { message: `ring rule ${id}: ${error && error.message}` });
    }
  }
}

const WIND_EVERY = 3;

defineRingRule('windSwap', {
  roundStart(b) {
    if (b.round <= 1 || (b.round - 1) % WIND_EVERY !== 0) return;
    if (me(b).fainted) return;
    const options = aliveOthers(b);
    if (!options.length) return;
    const index = options[Math.floor(b.random() * options.length)];
    const next = bringIn(b, index, { free: true, by: 'windSwap' });
    say(b, 'windSwap', { name: next.name });
  },
});
