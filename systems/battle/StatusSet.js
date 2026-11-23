/*
 * StatusSet.js  (engine: battle framework)
 * Job: the named status effects one fighter carries, each with a number (turns left, or a strength).
 *
 * Public API:
 *   new StatusSet(names, onChange)   names: every status this game knows; onChange(name, value, before)
 *   get(name)            the value, 0 when off
 *   has(name)            value is truthy
 *   set(name, value)     set it (false, null and 0 mean off); onChange is called only when the value changes
 *   tick(name, by = 1)   count it down by one round, never below 0; returns the new value
 *   clear(name)          off
 *   clearAll()           every status off
 *   list()               [{ name, value }] of the statuses that are on, in the order of names
 * Unknown names are refused (a typo must not create a silent status).
 */

export class StatusSet {
  #values = new Map();
  #names;
  #onChange;

  constructor(names, onChange) {
    this.#names = Object.freeze([...(names || [])]);
    this.#onChange = typeof onChange === 'function' ? onChange : null;
    for (const n of this.#names) this.#values.set(n, 0);
  }

  get names() {
    return this.#names;
  }

  /* lets the owner wire change reports after it was built */
  listen(onChange) {
    this.#onChange = typeof onChange === 'function' ? onChange : null;
  }

  #check(name) {
    if (!this.#values.has(name)) throw new Error('Unknown status: ' + name);
  }

  get(name) {
    this.#check(name);
    return this.#values.get(name);
  }

  has(name) {
    return !!this.get(name);
  }

  set(name, value) {
    this.#check(name);
    const v = value === true ? 1 : value ? value : 0;
    const before = this.#values.get(name);
    if (before === v) return;
    this.#values.set(name, v);
    if (this.#onChange) this.#onChange(name, v, before);
  }

  tick(name, by = 1) {
    const v = this.get(name);
    if (v > 0) this.set(name, Math.max(0, v - by));
    return this.get(name);
  }

  clear(name) {
    this.set(name, 0);
  }

  clearAll() {
    for (const n of this.#names) this.set(n, 0);
  }

  list() {
    return this.#names.filter((n) => this.#values.get(n)).map((n) => ({ name: n, value: this.#values.get(n) }));
  }
}
