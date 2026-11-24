/*
 * HontoriFighter.js  (Hontori game layer)
 * Job: a hontori on the field: the engine Fighter plus elements, attack, stamina and stage.
 *
 * Public API:
 *   STATUS_NAMES          asleep, stun, shield, boost, root, glow, harden, tail, veil, mist, guard, charged, mirror
 *                         (mirror: a Mirror Sigil waiting to send the next status aimed at it back)
 *   foeMaxHp(level)       15 + 3 * level
 *   new HontoriFighter({ side, key, element, element2, name, level, hp, maxHp, atk, stage, sta, staMax })
 *   el, el2, atk, stage, sta, staMax   plus everything a Fighter has
 * Status values: asleep (turns: yours 1, a foe 2), stun 1, shield (ward grade; divides the next hit), boost
 * (rune grade; +60% per point on the next attack), root (turns; +3 hp at each round end), glow (turns; x1.5),
 * harden (turns; x0.5 taken), tail (turns; moves first, crit 40%), veil 1 (dodges the next hit or hex),
 * mist (turns; the bearer misses 40%), guard (this round; x0.5 taken), charged (next intent is unleash).
 */

import { Fighter } from '../../systems/battle/fighter.js';

export const STATUS_NAMES = Object.freeze(['asleep', 'stun', 'shield', 'boost', 'root', 'glow', 'harden', 'tail', 'veil', 'mist', 'guard', 'charged', 'mirror']);

export function foeMaxHp(level) {
  return 15 + level * 3;
}

export class HontoriFighter extends Fighter {
  constructor(o) {
    super({ side: o.side, key: o.key, name: o.name, level: o.level, hp: o.hp, maxHp: o.maxHp, statuses: STATUS_NAMES });
    this.el = o.element;
    this.el2 = o.element2 || null;
    this.atk = o.atk || 0;
    this.stage = o.stage;
    this.staMax = o.staMax || 0;
    this.sta = o.sta || 0;
  }
}
