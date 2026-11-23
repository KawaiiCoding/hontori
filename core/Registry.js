/*
 * Registry.js
 * Job: the one place where features and content announce themselves, by kind and id.
 * One id means one thing: registering the same kind and id twice is an error.
 *
 * Public API:
 *   add(kind, id, value)   register; returns the value
 *   get(kind, id)          the value, or undefined
 *   has(kind, id)
 *   all(kind)              an iterable of the values of that kind, in the order they were added
 *   ids(kind)              an array of the ids of that kind
 */

const NOTHING = new Map();

export class Registry {
  #kinds = new Map();

  add(kind, id, value) {
    if (!this.#kinds.has(kind)) this.#kinds.set(kind, new Map());
    const entries = this.#kinds.get(kind);
    if (entries.has(id)) throw new Error(`Registry: ${kind} "${id}" is registered twice`);
    entries.set(id, value);
    return value;
  }

  get(kind, id) {
    return this.#entries(kind).get(id);
  }

  has(kind, id) {
    return this.#entries(kind).has(id);
  }

  all(kind) {
    return this.#entries(kind).values();
  }

  ids(kind) {
    return [...this.#entries(kind).keys()];
  }

  #entries(kind) {
    return this.#kinds.get(kind) || NOTHING;
  }
}
