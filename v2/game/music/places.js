/*
 * places.js
 * Job: the data that says which maps have their own music. One row per group of maps; to give a new place its own
 * tune, add a row here and its songs to songs.js. No code changes.
 *
 * A row:
 *   maps   map ids that share the music
 *   day    the tune while it is day (the song key); leave out to keep the current game's tune for the place
 *   night  the tune at night; leave out to use the day tune at night too
 *   duel   the tune of a duel fought on these maps; leave out to keep the common duel tune
 *   wild   the tune of a wild encounter on these maps; leave out to keep the common one
 *
 * Public API:
 *   PLACES          the rows
 *   NIGHT           { from, to } the hours the night tunes play (the same hours the synthesizer's own night uses)
 *   isNight(hour)   true from NIGHT.from to NIGHT.to
 */

export const NIGHT = { from: 19, to: 6 };

export function isNight(hour) {
  const h = Number(hour);
  return Number.isFinite(h) && (h >= NIGHT.from || h < NIGHT.to);
}

export const PLACES = [
  {
    maps: ['kitewick', 'windrest', 'kite_house', 'whistling_pass', 'kitewick_tavern', 'kitewick_shop', 'kitewick_h1', 'kitewick_h2', 'kitewick_h3', 'kitewick_h4'],
    day: 'kitewick',
    night: 'kitewick_night'
  },
  {
    maps: ['gale_loft', 'gale_bridges'],
    day: 'kitewick',
    duel: 'gale_duel'
  }
];
