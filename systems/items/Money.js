/*
 * Money.js  (engine: items)
 * Job: the purse. Money is one whole number in the smallest unit; the units (for example
 * 100 = 1 gold, 10 = 1 silver, 1 = 1 copper) come from the content's money table. A larger
 * unit is shown in the purse only once the player has held that much.
 *
 * Public API:
 *   SAVE                     the save section defaults: { copper: 0, best: 0 }
 *   new Money(book, read, emit, text)   text(id, params): the text lookup
 *   get(), can(n), add(n), spend(n), lose(n)   add returns the new total; spend true if paid; lose: what was lost
 *   parts(n)                 [{ unit, n }] for every unit, largest first
 *   shownUnits()             the units the purse shows (smallest always; larger once held)
 *   format(n)                '1 gold 2 silver' (zero parts left out; at least the smallest unit)
 *   short(n)                 '1g 2s'
 *
 * Events it emits: "money:change" { copper, change }
 */

export const SAVE = { copper: 0, best: 0 };

export class Money {
  #book;
  #read;
  #emit;
  #text;

  constructor(book, read, emit, text) {
    this.#book = book;
    this.#read = read;
    this.#emit = emit;
    this.#text = text;
  }

  #units() {
    return this.#book.money.units;
  }

  #set(value, change) {
    const section = this.#read();
    section.copper = Math.max(0, Math.floor(value));
    section.best = Math.max(section.best | 0, section.copper);
    this.#emit('money:change', { copper: section.copper, change });
    return section.copper;
  }

  get() {
    return Math.max(0, this.#read().copper | 0);
  }

  can(n) {
    return this.get() >= Math.max(0, Math.floor(n) || 0);
  }

  add(n) {
    const amount = Math.max(0, Math.floor(n) || 0);
    return amount ? this.#set(this.get() + amount, amount) : this.get();
  }

  spend(n) {
    const amount = Math.max(0, Math.floor(n) || 0);
    if (!this.can(amount)) return false;
    if (amount) this.#set(this.get() - amount, -amount);
    return true;
  }

  lose(n) {
    const amount = Math.min(this.get(), Math.max(0, Math.floor(n) || 0));
    if (amount) this.#set(this.get() - amount, -amount);
    return amount;
  }

  parts(n) {
    let rest = Math.max(0, Math.floor(n) || 0);
    return this.#units().map((unit) => {
      const count = Math.floor(rest / unit.per);
      rest -= count * unit.per;
      return { unit, n: count };
    });
  }

  shownUnits() {
    const best = Math.max(this.#read().best | 0, this.get());
    const units = this.#units();
    const smallest = units[units.length - 1];
    return units.filter((unit) => unit === smallest || best >= unit.per);
  }

  format(n) {
    const parts = this.parts(n);
    const shown = parts.filter((part) => part.n > 0);
    const list = shown.length ? shown : [parts[parts.length - 1]];
    return list.map((part) => this.#text(part.unit.name, { n: part.n })).join(' ');
  }

  short(n) {
    const parts = this.parts(n);
    const shown = parts.filter((part) => part.n > 0);
    const list = shown.length ? shown : [parts[parts.length - 1]];
    return list.map((part) => `${part.n}${this.letter(part.unit)}`).join(' ');
  }

  /* the first letter of the unit's word: '{n} gold' gives 'g' */
  letter(unit) {
    const word = this.#text(unit.name, { n: '' }).trim();
    return word ? word[0] : '';
  }

  word(unit) {
    const word = this.#text(unit.name, { n: '' }).trim();
    return word ? word[0].toUpperCase() + word.slice(1) : '';
  }
}
