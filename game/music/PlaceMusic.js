/*
 * PlaceMusic.js
 * Job: decide which tune plays: the place's own tune (by map, and by day or night), or a fight's tune while a battle
 * is on. It knows nothing about the synthesizer; it hands the key of the wanted tune to a "force" function and calls
 * it only when the wanted tune changes. A null key means "the common music of the game".
 *
 * Public API (class PlaceMusic):
 *   new PlaceMusic(force, rows)   force(key | null) plays that song; rows are the PLACES data
 *   enter(mapId, env)             a map was entered (env.time is the hour)
 *   follow(env)                   the hour moved on: day and night tunes change over
 *   useFlags(test)                test(flag) answers whether a story flag is set: rows with `after` count only then
 *                                 (looked at again on every enter and follow, so a flag set in a script shows soon)
 *   battle(kind)                  'duel' or 'wild' while a fight is on, 'phase' when a trainer's hontori flares up
 *                                 into its second phase (the row's `phase` song, else its duel song), null when
 *                                 it is over. Any other text is taken too: the row's field of that name picks the
 *                                 tune, else the text is itself a song key (a tournament round asks for
 *                                 'tournament_2'). A key the synthesizer does not know plays the place's own music
 */

import { isNight } from './places.js';

export class PlaceMusic {
  #force;
  #rows;
  #plain = null;
  #flagged = [];
  #hour = 12;
  #fight = null;
  #sent = null;
  #test = null;

  constructor(force, rows = []) {
    this.#force = typeof force === 'function' ? force : () => {};
    this.#rows = Array.isArray(rows) ? rows : [];
  }

  enter(mapId, env) {
    const has = (row) => Array.isArray(row.maps) && row.maps.includes(mapId);
    this.#plain = this.#rows.find((row) => has(row) && !row.after) || null;
    this.#flagged = this.#rows.filter((row) => has(row) && row.after);
    if (env) this.#hour = env.time;
    this.#apply();
  }

  follow(env) {
    if (!env) return;
    this.#hour = env.time;
    this.#apply();
  }

  useFlags(test) {
    this.#test = typeof test === 'function' ? test : null;
    this.#apply();
  }

  /* a row with `after` first, while its flag is set; then the plain row of the map (both found once per map) */
  #pick() {
    for (const row of this.#flagged) if (this.#flag(row.after)) return row;
    return this.#plain;
  }

  #flag(name) {
    try {
      return !!(this.#test && this.#test(name));
    } catch (error) {
      return false;
    }
  }

  battle(kind) {
    this.#fight = typeof kind === 'string' && kind ? kind : null;
    this.#apply();
  }

  /* the song key to play now, or null for the common music */
  #wanted() {
    const row = this.#pick();
    if (this.#fight === 'phase') return (row && (row.phase || row.duel)) || 'duel';
    if (this.#fight) return (row && typeof row[this.#fight] === 'string' && row[this.#fight]) || this.#fight;
    if (!row) return null;
    return (isNight(this.#hour) ? (row.night !== undefined ? row.night : row.day) : row.day) || null;
  }

  #apply() {
    const key = this.#wanted();
    if (key === this.#sent) return;
    this.#sent = key;
    this.#force(key);
  }
}
