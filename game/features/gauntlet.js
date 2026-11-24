/*
 * gauntlet.js  (Hontori: features)
 * Job: Hontori's duels in a row (the three duels of the Storm Works under the ring rule noRest) on the engine's
 * gauntlets (systems/features/Gauntlet.js): what a save point keeps (each hontori's health and stamina, the
 * wand's mana, and how many of each thing the bag holds) and how a lost duel puts it all back, so the next try
 * starts at the same duel in the same shape.
 *
 * Public API:
 *   installGauntlet(game)   registers:
 *     story.command   "ext:gauntlet"        { ext: 'gauntlet', gauntlet: id, won: [commands], lost: [commands] }
 *     story.command   "ext:gauntletLeave"   { ext: 'gauntletLeave', gauntlet: id }
 *     story.condition "ext:gauntlet"        { ext: 'gauntlet', gauntlet: id, stage: n }
 *     and what installGauntlets registers: system "features:gauntlet", service "gauntlets", save section
 *     "gauntlet"
 *   snapshot(game), restore(game, data)   the save point itself
 *
 * Content: `gauntlets` in a content folder (systems/features/Gauntlet.js). Nothing here heals: a duel already
 * leaves every hontori with at least 1 health, and the venue is a map where resting is not allowed.
 */

import { installGauntlets } from '../../systems/features/index.js';

function bag(game) {
  return game.registry.get('service', 'items') || null;
}

export function snapshot(game) {
  const items = bag(game);
  const mana = game.save.state.mana;
  const party = items ? items.party.members().map((m) => ({ key: m.key, hp: m.hp, sta: m.sta })) : [];
  const counts = {};
  if (items) for (const entry of items.inventory.list()) if (entry && entry.id) counts[entry.id] = (counts[entry.id] || 0) + (entry.n == null ? 1 : entry.n);
  return { party, mana: mana ? mana.mana : null, counts };
}

export function restore(game, data) {
  if (!data || typeof data !== 'object') return;
  const items = bag(game);
  if (items) {
    const members = items.party.members();
    (Array.isArray(data.party) ? data.party : []).forEach((kept, index) => {
      const member = members[index];
      /* only the same hontori in the same place gets its health back */
      if (!member || !kept || member.key !== kept.key) return;
      if (kept.hp != null) member.hp = Math.max(0, Math.min(member.maxHp || kept.hp, kept.hp));
      if (kept.sta != null) member.sta = kept.sta;
    });
    for (const [id, want] of Object.entries(data.counts || {})) {
      const have = items.inventory.count(id);
      if (have > want) items.inventory.remove(id, have - want);
      else if (have < want) items.inventory.add(id, want - have);
    }
    items.party.changed();
  }
  const mana = game.save.state.mana;
  if (mana && Number.isFinite(data.mana)) mana.mana = Math.max(0, Math.min(mana.maxMana || data.mana, data.mana));
}

export function installGauntlet(game) {
  return installGauntlets(game, {
    snapshot: () => snapshot(game),
    restore: (data) => restore(game, data),
    command: 'ext:gauntlet',
    leave: 'ext:gauntletLeave',
    condition: 'ext:gauntlet',
  });
}
