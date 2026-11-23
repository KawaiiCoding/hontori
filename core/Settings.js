/*
 * Settings.js
 * Job: the few choices that belong to the device and not to a journey: how the player moves,
 * whether sound is on, and which journey was played last.
 *
 * Public API:
 *   new Settings(storage, key)   key: the storage key
 *   get(name)           'controls' ('stick' | 'tap' | null before the first choice), 'muted', 'slot'
 *   set(name, value)    change one and store it
 *
 * Storage that is missing or refuses never throws; the choice then lasts for this visit.
 */

const DEFAULTS = { controls: null, muted: false, rainMuted: false, slot: 1 };

export class Settings {
  #storage;
  #key;
  #values;

  constructor(storage, key) {
    this.#storage = storage;
    this.#key = key;
    this.#values = { ...DEFAULTS, ...this.#read() };
  }

  get(name) {
    return this.#values[name];
  }

  set(name, value) {
    this.#values[name] = value;
    try {
      this.#storage.setItem(this.#key, JSON.stringify(this.#values));
    } catch (error) {
      /* the choice still holds for this visit */
    }
  }

  #read() {
    try {
      return JSON.parse(this.#storage.getItem(this.#key) || '{}') || {};
    } catch (error) {
      return {};
    }
  }
}
