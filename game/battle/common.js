/*
 * common.js  (Hontori game layer)
 * Job: the small helpers every Hontori battle rule file shares.
 *
 * Public API:
 *   me(b), foe(b)            the fighters on the field
 *   say(b, id, vars)         emit { type: 'say', id, text }
 *   speciesOf(lookup, key)   { element, element2, name } from the injected species lookup, with the old fallback
 *                            (unknown keys: their own name as element if it is one, else fire)
 *   cap(s)                   first letter upper case
 *   itemCount(b, id)         how many of an item the battle may still use
 *   useItem(b, id)           take one; emits { type: 'item', id, left }
 *   spellMastery(b, kind), costOf(b, kind), can(b, kind)   (can: the spell is in the battle loadout)
 *   hasRule(b, id)           that ring rule is on in this battle (blind, pure ...)
 *   isBattleSpell(b, kind)   a spell that can be cast in this battle: BATTLE_SPELLS, plus the spells a ring rule
 *                            brings in (state.extraSpells: the V under seal)
 *   castable(b)              the loadout's spells that can be cast in this battle, in sheet order (extra ones first)
 *   isSealed(b, kind)        that spell's slot is sealed (rule blind: sealedSpell; rule seal: the list sealed)
 */

import { ELEMENTS } from './elements.js';
import { line } from './text.js';
import { masteryOf, spellCost, BATTLE_SPELLS } from './spells.js';

export const me = (b) => b.fighter('me');
export const foe = (b) => b.fighter('foe');

export function say(b, id, vars) {
  b.emit('say', { id, text: line(id, vars) });
}

export function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export function speciesOf(lookup, key) {
  let s = null;
  try {
    s = typeof lookup === 'function' ? lookup(key) : null;
  } catch (e) {
    s = null;
  }
  if (s && s.element) return { element: s.element, element2: s.element2 || null, name: s.name || key };
  return { element: key === 'hontori' ? 'fire' : ELEMENTS.includes(key) ? key : 'fire', element2: null, name: key };
}

export function itemCount(b, id) {
  const it = b.state.items.find((i) => i.id === id);
  if (!it) return 0;
  return it.n == null ? 1 : Math.max(0, it.n);
}

export function useItem(b, id) {
  const S = b.state;
  const it = S.items.find((i) => i.id === id);
  if (!it) return;
  it.n = (it.n == null ? 1 : it.n) - 1;
  if (it.n <= 0) S.items.splice(S.items.indexOf(it), 1);
  S.used[id] = (S.used[id] || 0) + 1;
  b.emit('item', { id, left: Math.max(0, it.n) });
}

export function spellMastery(b, kind) {
  return masteryOf(b.state.spellXp[kind], b.state.spellMastery[kind]);
}

export function costOf(b, kind) {
  return spellCost(kind, spellMastery(b, kind), b.state.perks);
}

export function hasRule(b, id) {
  return Array.isArray(b.state.rules) && b.state.rules.includes(id);
}

export function can(b, kind) {
  return b.state.loadout.includes(kind);
}

export function isBattleSpell(b, kind) {
  const extra = b.state.extraSpells;
  return BATTLE_SPELLS.includes(kind) || (Array.isArray(extra) && extra.includes(kind));
}

export function castable(b) {
  const S = b.state;
  const extra = Array.isArray(S.extraSpells) ? S.extraSpells : [];
  return [...extra, ...BATTLE_SPELLS.filter((k) => !extra.includes(k))].filter((k) => S.loadout.includes(k));
}

export function isSealed(b, kind) {
  const S = b.state;
  return (!!S.sealedSpell && S.sealedSpell === kind) || (Array.isArray(S.sealed) && S.sealed.includes(kind));
}
