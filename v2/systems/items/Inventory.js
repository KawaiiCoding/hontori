/*
 * Inventory.js  (engine: items)
 * Job: the bag. What is carried, how many, and the pocket rule: only items marked pocket: true
 * take one of the limited pockets; items whose effect adds a pocket raise the limit. Pocket and
 * key items are carried once; everything else stacks. The trade pouch is every trade item.
 *
 * Public API:
 *   SAVE                       the save section defaults: { items: [] }   (entries { id, n })
 *   new Inventory(book, read, emit, { bonusEffect })
 *        read(): the live save section; emit(type, payload): the bus; bonusEffect: the effect
 *        name of items that add a pocket (default 'pocketPlus')
 *   list()                     the entries, in the order they were found
 *   has(id), count(id)
 *   find(what)                 what: an id or { tag }; the first matching entry or null
 *   add(id, n = 1)             how many were added (0 for an unknown id or a full one-of)
 *   remove(what, n = 1)        { id, n } removed, or null; key items are removed only with force
 *   pocketsUsed(), pocketCap(), canPocket(id)
 *   holdsBack(id)              true when taking it out would leave more things than pockets
 *   pouch(), pouchValue(), sellPouch()   trade items, what they are worth, sell them all (returns the value)
 *   tidy()                     heal an old or damaged list (unknown ids, doubles, bad counts); true if changed
 *
 * Events it emits: "inventory:change" { id, n }   (n is signed; id is null after tidy or a sale)
 */

export const SAVE = { items: [] };

export class Inventory {
  #book;
  #read;
  #emit;
  #bonus;

  constructor(book, read, emit, { bonusEffect = 'pocketPlus' } = {}) {
    this.#book = book;
    this.#read = read;
    this.#emit = emit;
    this.#bonus = bonusEffect;
  }

  #items() {
    const section = this.#read();
    if (!Array.isArray(section.items)) section.items = [];
    return section.items;
  }

  #oneOf(id) {
    return this.#book.fillsPocket(id) || this.#book.isKey(id) || this.#book.kindOf(id) === 'pocket';
  }

  #matches(entry, what) {
    if (typeof what === 'string') return entry.id === what;
    if (what && typeof what.tag === 'string') return this.#book.hasTag(entry.id, what.tag);
    return false;
  }

  list() {
    return this.#items();
  }

  has(id) {
    return this.count(id) > 0;
  }

  count(id) {
    const entry = this.#items().find((item) => item.id === id);
    return entry ? Math.max(0, entry.n | 0) : 0;
  }

  find(what) {
    return this.#items().find((entry) => this.#matches(entry, what)) || null;
  }

  add(id, n = 1) {
    if (!this.#book.get(id)) {
      console.warn(`Inventory: no item "${id}"`);
      return 0;
    }
    const amount = Math.max(0, Math.floor(n));
    if (!amount) return 0;
    const items = this.#items();
    const entry = items.find((item) => item.id === id);
    let added = amount;
    if (this.#oneOf(id)) {
      if (entry) return 0;
      added = 1;
      items.push({ id, n: 1 });
    } else if (entry) {
      entry.n = (entry.n | 0) + amount;
    } else {
      items.push({ id, n: amount });
    }
    this.#emit('inventory:change', { id, n: added });
    return added;
  }

  remove(what, n = 1, force = false) {
    const items = this.#items();
    const entry = items.find((item) => this.#matches(item, what));
    if (!entry || (this.#book.isKey(entry.id) && !force)) return null;
    const taken = Math.min(entry.n | 0, Math.max(1, Math.floor(n)));
    entry.n = (entry.n | 0) - taken;
    if (entry.n <= 0) items.splice(items.indexOf(entry), 1);
    this.#emit('inventory:change', { id: entry.id, n: -taken });
    return { id: entry.id, n: taken };
  }

  pocketsUsed() {
    return this.#items().filter((entry) => this.#book.fillsPocket(entry.id)).length;
  }

  pocketCap() {
    const base = Math.max(0, Number(this.#book.pickup.pockets0) || 0);
    return base + this.#items().filter((entry) => this.#book.effect(entry.id) === this.#bonus).length;
  }

  canPocket(id) {
    return !this.#book.fillsPocket(id) || this.pocketsUsed() < this.pocketCap();
  }

  holdsBack(id) {
    return this.has(id) && this.#book.effect(id) === this.#bonus && this.pocketsUsed() > this.pocketCap() - 1;
  }

  pouch() {
    return this.#items().filter((entry) => this.#book.kindOf(entry.id) === 'trade');
  }

  pouchValue() {
    return this.pouch().reduce((sum, entry) => sum + this.#book.sellValue(entry.id) * (entry.n | 0), 0);
  }

  sellPouch() {
    const value = this.pouchValue();
    if (!value) return 0;
    const items = this.#items();
    const keep = items.filter((entry) => this.#book.kindOf(entry.id) !== 'trade');
    items.length = 0;
    items.push(...keep);
    this.#emit('inventory:change', { id: null, n: 0 });
    return value;
  }

  tidy() {
    const items = this.#items();
    const seen = new Map();
    let changed = false;
    for (const entry of items) {
      const n = entry && Math.floor(Number(entry.n == null ? 1 : entry.n));
      if (!entry || !this.#book.get(entry.id) || !(n > 0)) {
        changed = true;
        continue;
      }
      const count = this.#oneOf(entry.id) ? 1 : n;
      const before = seen.get(entry.id);
      if (before) {
        if (!this.#oneOf(entry.id)) before.n += count;
        changed = true;
        continue;
      }
      if (count !== entry.n || Object.keys(entry).length !== 2) changed = true;
      seen.set(entry.id, { id: entry.id, n: count });
    }
    if (changed) {
      items.length = 0;
      items.push(...seen.values());
      this.#emit('inventory:change', { id: null, n: 0 });
    }
    return changed;
  }
}
