/*
 * systems/lore/Lore.js  (engine: lore)
 * Job: the rules of readable books: which books exist (in content order), which ones the player has found and
 * which ones they have read to the last page. It knows no art, no words and no map.
 *
 * Public API:
 *   SAVE                    the save section defaults: { found: [], read: [] }
 *   new Lore(book, state, emit)
 *        book: { books: { id: { title, pages, kind } }, shelves: [...] }; state(): the save section;
 *        emit(type, payload): the game's bus (optional)
 *   ids()                   every book id, in content order
 *   get(id)                 the book, or null
 *   total(), foundCount()
 *   found(id), read(id), isNew(id)     isNew: found but never read to the end
 *   foundIds()              the found books, in content order
 *   markFound(id), markRead(id)        true when something changed (events "lore:found", "lore:read")
 */

export const SAVE = { found: [], read: [] };

function list(value) {
  return Array.isArray(value) ? value : [];
}

export class Lore {
  #book;
  #state;
  #emit;

  constructor(book, state, emit) {
    this.#book = book || { books: {}, shelves: [] };
    this.#state = typeof state === 'function' ? state : () => ({});
    this.#emit = typeof emit === 'function' ? emit : () => {};
  }

  #save() {
    const s = this.#state() || {};
    if (!Array.isArray(s.found)) s.found = [];
    if (!Array.isArray(s.read)) s.read = [];
    return s;
  }

  ids() {
    return Object.keys(this.#book.books || {});
  }

  get(id) {
    return (this.#book.books && this.#book.books[id]) || null;
  }

  total() {
    return this.ids().length;
  }

  found(id) {
    return list(this.#save().found).includes(id);
  }

  read(id) {
    return list(this.#save().read).includes(id);
  }

  isNew(id) {
    return this.found(id) && !this.read(id);
  }

  foundIds() {
    return this.ids().filter((id) => this.found(id));
  }

  foundCount() {
    return this.foundIds().length;
  }

  markFound(id) {
    if (!this.get(id) || this.found(id)) return false;
    this.#save().found.push(id);
    this.#tell('lore:found', id);
    return true;
  }

  markRead(id) {
    if (!this.get(id)) return false;
    this.markFound(id);
    if (this.read(id)) return false;
    this.#save().read.push(id);
    this.#tell('lore:read', id);
    return true;
  }

  #tell(type, id) {
    try {
      this.#emit(type, { id });
    } catch (error) {
      /* a listener's problem is not the rules' */
    }
  }
}
