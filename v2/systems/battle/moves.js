/*
 * moves.js  (engine: battle framework)
 * Job: a book of moves grouped by family (a type, a class, a species), learnt by level.
 *
 * Public API:
 *   new MoveBook(families, fallbackFamily)   families: name -> [move]; a move needs { id, learnLevel }.
 *                                            Each family list is kept sorted by learnLevel (stable).
 *   byId(id)                     the move, or null
 *   pool(family)                 a copy of that family's list (the fallback family when unknown)
 *   learned(level, family)       moves with learnLevel <= level
 *   loadout(chosenIds, level, family, max, empty)   what a fighter brings: its chosen ids that it has learnt,
 *                                then other learnt moves up to max; when that is empty, empty() is returned
 */

export class MoveBook {
  #families = {};
  #byId = {};
  #fallback;

  constructor(families, fallbackFamily) {
    for (const name of Object.keys(families || {})) {
      const list = families[name].slice().sort((a, b) => (a.learnLevel || 1) - (b.learnLevel || 1));
      this.#families[name] = Object.freeze(list);
      for (const m of list) this.#byId[m.id] = m;
    }
    this.#fallback = fallbackFamily;
  }

  byId(id) {
    return this.#byId[id] || null;
  }

  pool(family) {
    return (this.#families[family] || this.#families[this.#fallback] || []).slice();
  }

  learned(level, family) {
    const lv = level || 1;
    return this.pool(family).filter((m) => (m.learnLevel || 1) <= lv);
  }

  loadout(chosenIds, level, family, max, empty) {
    const known = this.learned(level, family);
    const out = [];
    for (const id of Array.isArray(chosenIds) ? chosenIds : []) {
      const m = this.byId(id);
      if (m && !out.includes(m) && known.includes(m)) out.push(m);
    }
    for (const m of known) if (out.length < max && !out.includes(m)) out.push(m);
    if (!out.length) return typeof empty === 'function' ? empty() : [];
    return out.slice(0, max);
  }
}
