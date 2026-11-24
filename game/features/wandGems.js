/*
 * wandGems.js  (Hontori: features)
 * Job: things that, once carried, make the wand hold more mana for good (item effect "manaPlus": the Sun Crystal
 * of Goldmere). Each such thing counts once per journey: the first time it is in the bag, the wand's mana
 * holds MANA_PLUS more and the new mana is there at once; buying or finding a second does nothing more.
 * Also the held clock of a map whose content says `always: { time, weather }` (a town where it is always evening).
 *
 * Public API:
 *   installWandGems(game)   save section "wandGems" { set: [item ids already counted] }; listens to
 *                           inventory:change; installs the held clock (systems/features/HeldClock.js) over the
 *                           content maps' `always`
 *   MANA_PLUS, GEM_EFFECT
 */

import { installHeldClock } from '../../systems/features/index.js';
import { MAP_FOLDERS } from '../maps/index.js';

export const MANA_PLUS = 2;
export const GEM_EFFECT = 'manaPlus';

function count(game) {
  const items = game.registry.get('service', 'items');
  const mana = game.save.state.mana;
  const gems = game.save.state.wandGems;
  if (!items || !mana || !gems) return;
  if (!Array.isArray(gems.set)) gems.set = [];
  let grew = 0;
  for (const entry of items.inventory.list()) {
    if (!entry || gems.set.includes(entry.id) || items.book.effect(entry.id) !== GEM_EFFECT) continue;
    gems.set.push(entry.id);
    grew += MANA_PLUS;
  }
  if (!grew) return;
  mana.maxMana = (mana.maxMana || 3) + grew;
  mana.mana = Math.min(mana.maxMana, (mana.mana == null ? mana.maxMana : mana.mana) + grew);
  try {
    game.save.commit();
  } catch (error) {
    console.warn('wandGems: saving failed', error);
  }
}

export function installWandGems(game) {
  game.save.define('wandGems', { set: [] });
  game.bus.on('inventory:change', () => {
    try {
      count(game);
    } catch (error) {
      console.warn('wandGems: the mana could not be counted', error);
    }
  });
  /* asked once per map change: the content map's own `always` */
  installHeldClock(game, (id) => {
    for (const folder of MAP_FOLDERS) for (const map of folder.maps || []) if (map && map.id === id) return map.always || null;
    return null;
  });
}
