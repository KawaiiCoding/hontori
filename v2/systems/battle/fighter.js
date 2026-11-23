/*
 * fighter.js  (engine: battle framework)
 * Job: one combatant on the field: health, level, cooldowns and status effects. A game extends it with its own
 * numbers (types, attack, stamina, ...).
 *
 * Public API:
 *   new Fighter({ side, key, name, level, hp, maxHp, statuses })   statuses: the status names this game knows
 *   side, key, name, level, hp, max
 *   fainted                      hp <= 0
 *   damage(amount)               lose health, never below 0; returns what was lost
 *   heal(amount)                 gain health, never above max; returns what was gained
 *   get(name), has(name), set(name, value), tick(name, by)   the status effects (a StatusSet)
 *   statuses                     the StatusSet itself (list(), clearAll(), ...)
 *   cooldown(id)                 rounds of rest left for an action id
 *   setCooldown(id, rounds)
 *   tickCooldowns()              every cooldown one round lower, never below 0
 * Status changes are reported through onStatus(fighter, name, value, before), which the Battle sets.
 */

import { StatusSet } from './StatusSet.js';

export class Fighter {
  constructor(o) {
    this.side = o.side;
    this.key = o.key;
    this.name = o.name;
    this.level = o.level || 1;
    this.max = o.maxHp;
    this.hp = Math.max(0, Math.min(o.maxHp, o.hp == null ? o.maxHp : o.hp));
    this.onStatus = null;
    this.statuses = new StatusSet(o.statuses || [], (name, value, before) => {
      if (this.onStatus) this.onStatus(this, name, value, before);
    });
    this.cd = {};
  }

  get fainted() {
    return this.hp <= 0;
  }

  damage(amount) {
    const lost = Math.min(this.hp, Math.max(0, amount));
    this.hp = Math.max(0, this.hp - amount);
    return lost;
  }

  heal(amount) {
    const gained = Math.max(0, Math.min(this.max - this.hp, amount));
    this.hp += gained;
    return gained;
  }

  get(name) {
    return this.statuses.get(name);
  }

  has(name) {
    return this.statuses.has(name);
  }

  set(name, value) {
    this.statuses.set(name, value);
  }

  tick(name, by) {
    return this.statuses.tick(name, by);
  }

  cooldown(id) {
    return this.cd[id] || 0;
  }

  setCooldown(id, rounds) {
    this.cd[id] = rounds;
  }

  tickCooldowns() {
    for (const k of Object.keys(this.cd)) if (this.cd[k] > 0) this.cd[k]--;
  }
}
