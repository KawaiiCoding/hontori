/*
 * SaveStore.js
 * Job: the saved game. It holds the one state object every system keeps its saved data in,
 * and reads and writes it to versioned slots on this device. Saved data is additive: a
 * section's new fields get their defaults, so an old save always loads.
 *
 * Public API:
 *   new SaveStore({ storage, bus, key, slots })   key: the storage key of a slot, without its number
 *   VERSION                      the current save format number
 *   define(section, defaults)    declare a section of the state and its default fields (before load)
 *   upgrade(version, fn)         fn(data) rewrites data saved at version - 1 into that version, in place
 *   load(slot)                   fill `state` from that slot (or from defaults); true if a save existed
 *   state                        { [section]: { ...fields } }, complete after load()
 *   slot                         the slot in use (1..slots)
 *   slots                        how many slots there are
 *   commit()                     emit "save:before" (holders copy live values into state), then write
 *   peek(slot)                   the complete state saved in a slot without switching to it, or null
 *   erase(slot)
 *
 * Storage that is missing or refuses (private mode, full) never throws: the game then runs unsaved.
 */

export const VERSION = 1;

export class SaveStore {
  state = {};
  slot = 1;

  #storage;
  #bus;
  #key;
  #defaults = new Map();
  #upgrades = new Map();

  constructor({ storage, bus, key, slots = 3 }) {
    this.#key = key;
    this.#storage = storage;
    this.#bus = bus;
    this.slots = slots;
  }

  define(section, defaults) {
    if (this.#defaults.has(section)) throw new Error(`SaveStore: section "${section}" is defined twice`);
    this.#defaults.set(section, defaults);
  }

  upgrade(version, fn) {
    this.#upgrades.set(version, fn);
  }

  load(slot = 1) {
    this.slot = Math.max(1, Math.min(this.slots, slot | 0 || 1));
    const saved = this.#read(this.slot);
    this.state = this.#complete(saved ? this.#upgraded(saved) : {});
    return !!saved;
  }

  peek(slot) {
    const saved = this.#read(slot);
    return saved ? this.#complete(this.#upgraded(saved)) : null;
  }

  commit() {
    this.#bus.emit('save:before', this.state);
    try {
      this.#storage.setItem(this.#key + this.slot, JSON.stringify({ version: VERSION, data: this.state }));
      return true;
    } catch (error) {
      return false;
    }
  }

  erase(slot) {
    try {
      this.#storage.removeItem(this.#key + slot);
    } catch (error) {
      /* nothing to erase where nothing can be stored */
    }
  }

  #complete(data) {
    const state = {};
    for (const [section, defaults] of this.#defaults) {
      state[section] = { ...structuredClone(defaults), ...data[section] };
    }
    return state;
  }

  #read(slot) {
    try {
      const saved = JSON.parse(this.#storage.getItem(this.#key + slot) || 'null');
      return saved && saved.data && saved.version <= VERSION ? saved : null;
    } catch (error) {
      return null;
    }
  }

  #upgraded(saved) {
    const data = saved.data;
    for (let version = saved.version + 1; version <= VERSION; version++) {
      const fn = this.#upgrades.get(version);
      if (fn) fn(data);
    }
    return data;
  }
}
