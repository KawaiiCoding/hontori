/*
 * mana.js  (Hontori)
 * Job: the wand's mana outside battle (world rule 27): +1 for every 45 seconds of free play once
 * the wand is held, full again after a rest ("party:rested", the one event every kind of rest
 * ends in), and the "mana" extension command and condition of the content (schema section 14).
 *
 * Public API:
 *   installMana(game)   call before game.save.load(); returns { get, set, max, add, fill }
 *
 * What it registers:
 *   save section   "mana"   { mana, maxMana }   mana null means full
 *   system         "mana"   (an engine Regen)
 *   service        "mana"   -> the object returned
 *   story.command    "ext:mana"   { ext: 'mana', set: 'full' | n, add: n }
 *   story.condition  "ext:mana"   { ext: 'mana', lte, lt, gte, gt, eq }
 */

import { Regen } from '../../systems/time/index.js';
import { offer, testCondition } from '../../systems/time/links.js';
import { t } from '../text.js';

export const MANA_SAVE = { mana: null, maxMana: 3 };

const SECONDS_PER_MANA = 45;
/* the "+1 mana" note is shown at most this often; "Mana full" always */
const NOTE_EVERY_MS = 240000;
const WORDS = { plus: 'shared.ui.mana.plus', full: 'shared.ui.mana.full' };

export function installMana(game) {
  const { registry } = game;
  const state = () => game.save.state.mana || { ...MANA_SAVE };
  const ask = (cond, otherwise) => (registry.has('service', 'story') ? testCondition(game, cond) : otherwise);

  const max = () => Math.max(0, state().maxMana | 0);
  const get = () => (state().mana == null ? max() : state().mana);
  const set = (n) => {
    state().mana = Math.max(0, Math.round(n));
  };

  let lastNote = -Infinity;
  const regen = new Regen({
    every: SECONDS_PER_MANA,
    get, set, max,
    active: () => ask({ has: 'wand' }, true),
    refillOn: 'party:rested',
    onStep: (value, full) => {
      const now = performance.now();
      if (!full && now - lastNote < NOTE_EVERY_MS) return;
      lastNote = now;
      if (game.ui) game.ui.toast(t(full ? WORDS.full : WORDS.plus));
    },
  });

  game.save.define('mana', MANA_SAVE);
  registry.add('system', 'mana', regen);
  const mana = { get, set, max, add: (n) => regen.add(n), fill: (bonus) => regen.fill(bonus) };
  offer(registry, 'service', 'mana', mana);

  offer(registry, 'story.command', 'ext:mana', (node) => {
    if (node.set === 'full') regen.fill(0);
    else if (typeof node.set === 'number') set(Math.min(node.set, max()));
    if (typeof node.add === 'number') {
      /* a gift over full (the herb) is still capped at full; only rest goes over */
      set(Math.min(max(), get() + node.add));
    }
  });
  offer(registry, 'story.condition', 'ext:mana', (node) => {
    const value = get();
    if (typeof node.lte === 'number' && !(value <= node.lte)) return false;
    if (typeof node.lt === 'number' && !(value < node.lt)) return false;
    if (typeof node.gte === 'number' && !(value >= node.gte)) return false;
    if (typeof node.gt === 'number' && !(value > node.gt)) return false;
    if (typeof node.eq === 'number' && value !== node.eq) return false;
    return true;
  });
  return mana;
}
