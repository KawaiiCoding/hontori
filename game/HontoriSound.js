/*
 * HontoriSound.js
 * Job: Hontori's sound provider (the interface is specified in INTERFACES.md): the single door to the music, ambience and sound effects of the current game
 * (src/audio.js, fully synthesized, on window.H.audio). Nothing else touches it.
 * The legacy module unlocks itself on the first touch or key and goes quiet while the page
 * is hidden; this adapter adds nothing to that.
 *
 * The music of a place comes from game/music/: the common tunes of the current game everywhere, and the places listed in
 * game/music/places.js (Kitewick, Gale Loft) with their own. They are played through the synthesizer's battle(key) door, which
 * can force any song of its book; game/music/PlaceMusic.js decides the key, so a fight's tune and a place's tune never clash.
 *
 * Public API (class HontoriSound):
 *   new HontoriSound()
 *   unlock()                call inside a tap, so an iPhone lets the music start
 *   enterPlace(mapId, env)  pick the music and ambience for a map
 *   follow(env)             let music and ambience follow the hour and the weather
 *   play(name)              a sound effect: 'step', 'bump', 'door', 'confirm', 'sparkle' ...
 *   note(midi)              one soft note (a chime, a music box)
 *   battle(kind)            the battle music: 'wild' or 'duel'; null goes back to the music of the place
 *   setMuted(on)
 *
 * Without the legacy module every call does nothing: the game runs silent.
 */

import { createPlaceMusic } from './music/index.js';

export class HontoriSound {
  #audio;
  #music = null;

  constructor(legacy = window.H) {
    this.#audio = (legacy && legacy.audio) || null;
    if (!this.#audio) return;
    this.#audio.init();
    try {
      this.#music = createPlaceMusic(this.#audio);
    } catch (e) {
      this.#music = null;
    }
  }

  setMuted(on) {
    if (this.#audio) this.#audio.setMuted(on);
  }

  unlock() {
    if (this.#audio) this.#audio.unlock();
  }

  enterPlace(mapId, env) {
    if (!this.#audio) return;
    this.#audio.setScene(mapId, env);
    this.#guard(() => this.#music && this.#music.enter(mapId, env));
  }

  follow(env) {
    if (!this.#audio) return;
    this.#audio.update(env);
    this.#guard(() => this.#music && this.#music.follow(env));
  }

  play(name) {
    if (this.#audio) this.#audio.sfx(name);
  }

  battle(kind) {
    if (!this.#audio) return;
    if (this.#music) this.#guard(() => this.#music.battle(kind));
    else if (typeof this.#audio.battle === 'function') this.#audio.battle(kind || null);
  }

  note(midi) {
    if (this.#audio && typeof this.#audio.note === 'function') this.#audio.note(midi);
  }

  /* the music choice can never break a frame or a map change */
  #guard(fn) {
    try {
      fn();
    } catch (e) {
      /* the common music keeps playing */
    }
  }
}
