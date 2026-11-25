/*
 * ringRules.js  (Hontori game layer)
 * Job: the ring rules of the great schools: a named rule a trainer's `rules` list (content) turns on for one
 * battle, with hooks the round cycle calls. A new school's rule is one defineRingRule call here; the battle
 * engine and the scene stay as they are. The rules that only refuse something (noSwitch, noCapture) are setup
 * flags instead (setup.js).
 *
 * Public API:
 *   defineRingRule(id, hooks)   hooks: { setup(b), begin(b), roundStart(b), phase(b), spell(b, kind, grade),
 *                               power(b, fighter), refill(b) }
 *                               setup runs once at the end of the battle's setup (it may shape the loadout);
 *                               begin runs once after the opening lines, before the first round; phase runs when a
 *                               trainer's hontori enters a later phase (phases.js); spell after a spell took effect;
 *                               roundStart runs at the start of every round after the first, before the foe
 *                               picks its intent; both may emit events. power answers a multiplier for the
 *                               damage that fighter deals (1: no change); refill answers false when the
 *                               wand gets no mana back from the rounds
 *   ringRulesOf(ids)            the ids among them that name a ring rule (unknown names are left out)
 *   runRingRules(b, hook, ...args)   call that hook of every ring rule of this battle (b.state.rules); a rule
 *                               that throws is reported in b.errors through the engine and skipped
 *   ringPower(b, fighter)       the product of every ring rule's power for that fighter (1 when none), times
 *                               the power of a foe that has flared up in a later phase (phases.js)
 *   ringRefills(b)              false when a ring rule stops the mana of the rounds
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
 *   heat       THE HEAT (Ember Crucible): the wand gets no mana back from the rounds; only what it holds at the
 *              start (and herbs carried in) can be spent. The Warden's lead may flare up in a second phase
 *              (a team member's `phases`, phases.js), which the screen answers with the place's phase music.
 *   blind      BLIND (Hollow Moon): the foe's plan is hidden (turn.js shownIntent answers 'hidden') unless the
 *              Lantern Sigil shows it, and one spell slot is sealed for the duel (the last of the loadout that is
 *              not the Lantern Sigil); emits sealedSlot { kind }
 *   pure       PURE (Halo Court): no binding and no items (cast.js, rules.js)
 *   seal       THE SEAL (the Vael Athenaeum, the Grand Archmage): the V (the first spell, `veil`) joins the loadout
 *              and can never be sealed. At the start of each of the foe's turns after the first, one spell of the
 *              loadout is sealed (the last one not yet sealed), until only the V is left; emits sealedSlot { kind }.
 *              The fight has two phases (a team member's `phases`, phases.js): when phase two begins a veil of
 *              VEIL_LAYERS layers closes around the foe, and every layer makes the blows of yours (and an ally's)
 *              VEIL_STEP weaker. Each V drawn in phase two breaks one layer (a Flawless V two); emits
 *              veilShield { layers, max, change: 'up' | 'crack', by }. In phase one the V shines but the veil holds.
 *   wandDuel   WAND TO WAND (Bedrock Hall): named here so it is a known ring rule; a battle under it is not a
 *              hontori battle at all but a WandDuel (wandDuel.js), which the battle screen starts instead.
 */

import { me, say } from './common.js';
import { bringIn } from './swap.js';
import { aliveOthers } from './turn.js';
import { phasePower } from './phases.js';
import { SPELLS } from './spells.js';

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
  return m * phasePower(b, fighter);
}

export function ringRefills(b) {
  for (const id of b.state.rules || []) {
    const rule = RULES.get(id);
    if (!rule || typeof rule.refill !== 'function') continue;
    try {
      if (rule.refill(b) === false) return false;
    } catch (error) {
      b.emit('error', { message: `ring rule ${id}: ${error && error.message}` });
    }
  }
  return true;
}

export function runRingRules(b, hook, ...args) {
  for (const id of b.state.rules || []) {
    const rule = RULES.get(id);
    if (!rule || typeof rule[hook] !== 'function') continue;
    try {
      rule[hook](b, ...args);
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

defineRingRule('heat', {
  begin(b) {
    say(b, 'heatBegin');
  },
  refill() {
    return false;
  },
});

defineRingRule('wandDuel', {});

/* the last slot of the loadout that is not the Lantern Sigil (so the plan can always be lit), if there is one */
function slotToSeal(b) {
  const loadout = b.state.loadout || [];
  for (let i = loadout.length - 1; i >= 0; i--) if (loadout[i] !== 'lantern') return loadout[i];
  return null;
}

defineRingRule('blind', {
  begin(b) {
    b.state.sealedSpell = slotToSeal(b);
    if (b.state.sealedSpell) b.emit('sealedSlot', { kind: b.state.sealedSpell });
    say(b, 'blindBegin');
  },
});

export const VEIL_LAYERS = 3;
export const VEIL_STEP = 0.2;

/* the last spell of the loadout that is neither the V nor sealed yet */
function nextToSeal(S) {
  for (let i = S.loadout.length - 1; i >= 0; i--) {
    const k = S.loadout[i];
    if (k !== 'veil' && !S.sealed.includes(k)) return k;
  }
  return null;
}

defineRingRule('seal', {
  setup(b) {
    const S = b.state;
    if (!S.extraSpells.includes('veil')) S.extraSpells.push('veil');
    if (!S.known.includes('veil')) S.known.push('veil');
    S.loadout = ['veil', ...S.loadout.filter((k) => k !== 'veil')];
    S.spellTargets = Object.assign({}, S.spellTargets, { veil: 'foe' });
    S.sealPhase = 1;
    S.veil = 0;
  },
  begin(b) {
    say(b, 'sealBegin');
  },
  roundStart(b) {
    const S = b.state;
    const kind = nextToSeal(S);
    if (!kind) return;
    S.sealed.push(kind);
    b.emit('sealedSlot', { kind });
    say(b, nextToSeal(S) ? 'sealOne' : 'sealLast', { spell: SPELLS[kind] ? SPELLS[kind].name : kind });
  },
  phase(b) {
    const S = b.state;
    if (S.sealPhase === 2) return;
    S.sealPhase = 2;
    S.veil = VEIL_LAYERS;
    b.emit('veilShield', { layers: S.veil, max: VEIL_LAYERS, change: 'up', by: 0 });
    say(b, 'veilUp');
  },
  spell(b, kind, grade) {
    const S = b.state;
    if (kind !== 'veil') return;
    if (S.sealPhase !== 2) return say(b, 'veilHolds');
    if (!(S.veil > 0)) return say(b, 'veilOpen');
    const by = Math.min(S.veil, grade === 'flawless' ? 2 : 1);
    S.veil -= by;
    b.emit('veilShield', { layers: S.veil, max: VEIL_LAYERS, change: 'crack', by });
    say(b, S.veil > 0 ? 'veilCracks' : 'veilBroken', { n: S.veil });
  },
  power(b, fighter) {
    const layers = b.state.veil || 0;
    if (!layers || !fighter || fighter.side === 'foe') return 1;
    return Math.max(0.2, 1 - VEIL_STEP * layers);
  },
});

defineRingRule('pure', {
  begin(b) {
    say(b, 'pureBegin');
  },
});
