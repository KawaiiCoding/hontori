/*
 * Person.js
 * Job: someone who lives on a map: stands where the map data puts them, glances around,
 * plays the idle animations of their look, and follows their day schedule.
 *
 * Public API:
 *   new Person(def, index)   def: a person description (INTERFACES.md); index: position in the map's list
 *   def                      the description it was built from (systems read lines, service ... from it)
 *   away                     true while the schedule has them somewhere else; an away person is
 *                            not drawn and does not block
 *   slot                     the schedule slot in force, or null (systems read per-slot data from it)
 *   talking                  set by a dialog system: the person faces their listener and gestures
 *   held                     set by a scripted scene: the schedule and the glances leave them alone
 *   update(dt)               glance around now and then
 *   followSchedule(hour, playerTx, playerTy, indoor, force)
 *        move to the slot for that hour. Nobody appears, vanishes or jumps while the player is
 *        close enough to see it, unless force is true (map entry, waking up).
 */

import { Actor } from './Actor.js';
import { Schedule } from './Schedule.js';

/* closer than this (in tiles, walking distance) the player would see a change happen */
const IN_SIGHT = 7;
const GLANCE_MIN = 3;
const GLANCE_SPREAD = 5;
const GLANCE_CHANCE = 0.6;

export class Person extends Actor {
  slot = null;
  held = false;

  #schedule;
  #glanceIn = Math.random() * 6;

  constructor(def, index) {
    super(def.id, def.look);
    this.def = def;
    /* the seed spreads idle animations apart, so two people never move in step */
    this.pose = { npc: true, seed: (def.x * 13 + def.y * 7 + index * 31) % 97 / 97, idle: def.idle, talking: false };
    this.#schedule = def.schedule ? new Schedule(def.schedule) : null;
    this.placeAt(def.x, def.y, def.dir || 0);
  }

  get talking() {
    return this.pose.talking;
  }

  set talking(value) {
    this.pose.talking = !!value;
  }

  get away() {
    return !this.visible;
  }

  set away(value) {
    this.visible = !value;
  }

  update(dt) {
    if (this.def.fixed || this.held || this.talking) return;
    this.#glanceIn -= dt;
    if (this.#glanceIn > 0) return;
    this.#glanceIn = GLANCE_MIN + Math.random() * GLANCE_SPREAD;
    if (Math.random() < GLANCE_CHANCE) this.dir = Math.floor(Math.random() * 4);
  }

  followSchedule(hour, playerTx, playerTy, indoor, force) {
    if (!this.#schedule || this.held) return;
    const slot = this.#schedule.slotAt(hour);
    if (!slot || slot === this.slot) return;
    const inSight = Math.abs(playerTx - this.tx) + Math.abs(playerTy - this.ty) < IN_SIGHT;
    const comesOrGoes = this.away || !!slot.away;
    /* indoors a person may come and go through a door while watched; outdoors they wait */
    if (!force && inSight && (!comesOrGoes || !indoor)) return;
    this.slot = slot;
    this.away = !!slot.away;
    if (slot.x != null) this.placeAt(slot.x, slot.y, slot.dir != null ? slot.dir : this.dir);
    else if (slot.dir != null) this.dir = slot.dir;
  }
}
