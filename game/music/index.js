/*
 * index.js
 * Job: the music of chapters 3 to 7 on top of the current game's synthesizer: puts the new songs in its
 * song book and chooses the tune of each place. Only game/HontoriSound.js uses it.
 *
 * Public API:
 *   installSongs(audio)          add the songs to audio._songs (never replaces one that is there); false if it cannot
 *   createPlaceMusic(audio)      a PlaceMusic wired to audio.battle(key), or one with no rows when the songs could not
 *                                be added (then the common music plays everywhere, as before)
 *   PlaceMusic, PLACES, SONGS    the parts, for tools
 */

import { SONGS } from './songs.js';
import { PLACES } from './places.js';
import { PlaceMusic } from './PlaceMusic.js';

export function installSongs(audio, songs = SONGS) {
  const book = audio && audio._songs;
  if (!book || typeof book !== 'object') return false;
  for (const key of Object.keys(songs)) {
    if (!book[key]) book[key] = songs[key];
  }
  return true;
}

/* the synthesizer's battle(key) forces any song of its book; battle(null) hands the choice back to the place */
export function createPlaceMusic(audio) {
  const canForce = !!audio && typeof audio.battle === 'function';
  const ready = canForce && installSongs(audio);
  return new PlaceMusic((key) => { if (canForce) audio.battle(key); }, ready ? PLACES : []);
}

export { PlaceMusic, PLACES, SONGS };
