/*
 * Capsules.js  (engine: capsules)
 * Job: the rules of capsule machines: series of prizes, one turn (it only ever draws a prize not owned yet,
 * so a finished series gives nothing and costs nothing), what is owned, one free turn a day, and what is worn
 * in each slot (one thing at a time, or several at once for a `many` slot). It knows no art and no coins: the
 * caller pays before it asks for a paid turn.
 *
 * Public API:
 *   SAVE                      the save section defaults: { owned: [], worn: {}, shown: [], freeDay: 0, turns: 0 }
 *   new Capsules(book, read, emit, random)
 *        book: { series: { id: { price, prizes: [{ id, slot, rare }] } }, slots: { slot: { many } } }
 *        read(): the save section; emit(type, payload); random(): 0..1 (default Math.random)
 *   seriesIds(), series(id), prize(id), seriesOf(prizeId)
 *   owns(id), ownedCount()     ownedCount: every prize owned, in all series
 *   count(seriesId)           { owned, total }
 *   done(seriesId)            every prize of the series is owned
 *   price(seriesId)           the price of a paid turn (0 when done: a finished series takes nothing)
 *   freeToday(day)            the free turn of that day is still there
 *   turn(seriesId, { free, day })   -> the prize drawn, or null (the series is done, or the free turn is
 *                             gone). A new prize is put on at once when its slot is empty.
 *   slotOf(id), many(slot)
 *   worn(slot)                a `many` slot: the ids shown; else the id worn or null
 *   isWorn(id), wear(id), takeOff(id), toggle(id)   only owned prizes; true when something changed
 *
 * Events it emits: "capsules:change" { why: 'turn' | 'wear' | 'off', id }
 */

export const SAVE = { owned: [], worn: {}, shown: [], freeDays: {}, turns: 0 };

const RARE_WEIGHT = 0.25;

export class Capsules {
  #book;
  #read;
  #emit;
  #random;

  constructor(book, read, emit, random = Math.random) {
    this.#book = { series: {}, slots: {}, ...book };
    this.#read = read;
    this.#emit = emit;
    this.#random = random;
    /* which prizes can be won right now (the game may hold some back, for example until they can be used) */
    this.allow = () => true;
  }

  /* prizes of the series that are not owned and can be won now */
  available(seriesId) {
    return this.#prizes(seriesId).filter((p) => !this.owns(p.id) && this.#allowed(p)).length;
  }

  #allowed(prize) {
    try {
      return this.allow(prize) !== false;
    } catch (error) {
      return true;
    }
  }

  #state() {
    const s = this.#read() || {};
    if (!Array.isArray(s.owned)) s.owned = [];
    if (!Array.isArray(s.shown)) s.shown = [];
    if (!s.worn || typeof s.worn !== 'object') s.worn = {};
    return s;
  }

  seriesIds() {
    return Object.keys(this.#book.series);
  }

  series(id) {
    return this.#book.series[id] || null;
  }

  #prizes(seriesId) {
    const s = this.series(seriesId);
    return s && Array.isArray(s.prizes) ? s.prizes : [];
  }

  prize(id) {
    for (const seriesId of this.seriesIds()) {
      const found = this.#prizes(seriesId).find((p) => p.id === id);
      if (found) return found;
    }
    return null;
  }

  seriesOf(prizeId) {
    return this.seriesIds().find((seriesId) => this.#prizes(seriesId).some((p) => p.id === prizeId)) || null;
  }

  owns(id) {
    return this.#state().owned.includes(id);
  }

  ownedCount() {
    return this.#state().owned.filter((id) => this.prize(id)).length;
  }

  count(seriesId) {
    const prizes = this.#prizes(seriesId);
    return { owned: prizes.filter((p) => this.owns(p.id)).length, total: prizes.length };
  }

  done(seriesId) {
    const { owned, total } = this.count(seriesId);
    return owned >= total;
  }

  price(seriesId) {
    const s = this.series(seriesId);
    return !s || this.done(seriesId) ? 0 : Math.max(0, Math.floor(Number(s.price) || 0));
  }

  /* each machine (series) gives one free turn per day; there are no paid turns */
  freeToday(day, seriesId = '') {
    const state = this.#state();
    if (!state.freeDays || typeof state.freeDays !== 'object') state.freeDays = {};
    return (Number(state.freeDays[seriesId]) || 0) !== day;
  }

  turn(seriesId, { free = false, day = 0 } = {}) {
    const left = this.#prizes(seriesId).filter((p) => !this.owns(p.id) && this.#allowed(p));
    if (!left.length) return null;
    const state = this.#state();
    if (!this.freeToday(day, seriesId)) return null;
    state.freeDays[seriesId] = day;
    /* a series may name its first prize: the first turn of that machine always gives it */
    const series = this.series(seriesId) || {};
    const opening = series.first && !this.#prizes(seriesId).some((p) => this.owns(p.id)) ? left.find((p) => p.id === series.first) : null;
    const prize = opening || this.#pick(left);
    state.owned.push(prize.id);
    state.turns = (Number(state.turns) || 0) + 1;
    const slot = prize.slot;
    if (this.many(slot)) state.shown.push(prize.id);
    else if (slot && !state.worn[slot]) state.worn[slot] = prize.id;
    this.#emit('capsules:change', { why: 'turn', id: prize.id });
    return prize;
  }

  /* every prize left has the same chance, a rare one a quarter of it */
  #pick(left) {
    const weight = (p) => (p.rare ? RARE_WEIGHT : 1);
    let roll = this.#random() * left.reduce((sum, p) => sum + weight(p), 0);
    for (const p of left) {
      roll -= weight(p);
      if (roll < 0) return p;
    }
    return left[left.length - 1];
  }

  slotOf(id) {
    const p = this.prize(id);
    return p ? p.slot || null : null;
  }

  many(slot) {
    const def = this.#book.slots[slot];
    return !!(def && def.many);
  }

  worn(slot) {
    const state = this.#state();
    if (this.many(slot)) return state.shown.filter((id) => this.slotOf(id) === slot && this.owns(id));
    const id = state.worn[slot];
    return id && this.owns(id) ? id : null;
  }

  isWorn(id) {
    const slot = this.slotOf(id);
    if (!slot || !this.owns(id)) return false;
    return this.many(slot) ? this.#state().shown.includes(id) : this.#state().worn[slot] === id;
  }

  wear(id) {
    const slot = this.slotOf(id);
    if (!slot || !this.owns(id) || this.isWorn(id)) return false;
    const state = this.#state();
    if (this.many(slot)) state.shown.push(id);
    else state.worn[slot] = id;
    this.#emit('capsules:change', { why: 'wear', id });
    return true;
  }

  takeOff(id) {
    if (!this.isWorn(id)) return false;
    const state = this.#state();
    const slot = this.slotOf(id);
    if (this.many(slot)) state.shown = state.shown.filter((x) => x !== id);
    else delete state.worn[slot];
    this.#emit('capsules:change', { why: 'off', id });
    return true;
  }

  toggle(id) {
    return this.isWorn(id) ? this.takeOff(id) : this.wear(id);
  }
}
