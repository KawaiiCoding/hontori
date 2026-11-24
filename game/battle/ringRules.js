/*
 * ringRules.js  (Hontori game layer)
 * Job: the ring rules of the great schools: a named rule a trainer's `rules` list (content) turns on for one
 * battle, with hooks the round cycle calls. A new school's rule is one defineRingRule call here; the battle
 * engine and the scene stay as they are. The rules that only refuse something (noSwitch, noCapture) are setup
 * flags instead (setup.js).
 *
 * Public API:
 *   defineRingRule(id, hooks)   hooks: { begin(b), roundStart(b), power(b, fighter) }
 *                               begin runs once after the opening lines, before the first round;
 *                               roundStart runs at the start of every round after the first, before the foe
 *                               picks its intent; both may emit events. power answers a multiplier for the
 *                               damage that fighter deals (1: no change)
 *   ringRulesOf(ids)            the ids among them that name a ring rule (unknown names are left out)
 *   runRingRules(b, hook)       call that hook of every ring rule of this battle (b.state.rules); a rule
 *                               that throws is reported in b.errors through the engine and skipped
 *   ringPower(b, fighter)       the product of every ring rule's power for that fighter (1 when none)
 *   RING_RULES                  the ids defined so far
 *
 * Defined here:
 *   windSwap   THE WIND CHOOSES (Gale Loft): every 3 rounds the wind swaps your hontori on the field for
 *              another one of the party that can still fight, at random. No turn is lost. Nothing happens
 *              with nobody to swap in, or while yours has fainted (the forced choice comes first).
 *   tideRise   THE TIDE RISES (Deepbell Hall): the ring floods a little more every round, up to a height of
 *              TIDE_MAX. Each step makes water attacks TIDE_STEP stronger and fire attacks TIDE_STEP weaker, for
 *              both sides (a hontori with both elements gets both). Emits tide { level, max } at the start
 *              and on every rise, so the scene can show the water.
 *   noRest     NO REST (the Storm Works): duels in a row with only what you carry. In the battle it only says so
 *              at the start; the run itself (save points, no rest between) is the gauntlet of the story
 *              (systems/features/Gauntlet.js). A duel never heals anyone, so nothing else is needed here.
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

export function ringPower(b, fighter) {
  let m = 1;
  for (const id of b.state.rules || []) {
    const rule = RULES.get(id);
    if (!rule || typeof rule.power !== 'function') continue;
    try {
      const n = Number(rule.power(b, fighter));
      if (Number.isFinite(n) && n > 0) m *= n;
    } catch (error) {
      b.emit('error', { message: `ring rule ${id}: ${error && error.message}` });
    }
  }
  return m;
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

export const TIDE_MAX = 5;
export const TIDE_STEP = 0.08;

function tide(b) {
  b.emit('tide', { level: b.state.tide, max: TIDE_MAX });
}

defineRingRule('tideRise', {
  begin(b) {
    b.state.tide = 0;
    tide(b);
    say(b, 'tideBegin');
  },
  roundStart(b) {
    const level = b.state.tide || 0;
    if (level >= TIDE_MAX) return;
    b.state.tide = level + 1;
    tide(b);
    say(b, b.state.tide >= TIDE_MAX ? 'tideFull' : 'tideRises');
  },
  power(b, fighter) {
    const level = b.state.tide || 0;
    if (!level || !fighter) return 1;
    const els = [fighter.el, fighter.el2];
    let m = 1;
    if (els.includes('water')) m *= 1 + TIDE_STEP * level;
    if (els.includes('fire')) m *= 1 - TIDE_STEP * level;
    return m;
  },
});

defineRingRule('noRest', {
  begin(b) {
    say(b, 'noRest');
  },
});
