/*
 * ch8/trials.js
 * Job: Hollow Moon, the School of Dark and the seventh ring school (world rules 49 and 79): entrance past the
 * Council's grey watchers on the crater rim above it (puzzle type watchers, on the Duskmere map), then the three moon lamps lit with the
 * Lantern Sigil while no line shows (twist unseen), then Warden Nox Ardley under the ring rule blind. There is no
 * apprentice: the Council captain's attack on Duskmere, fought beside Nox, stands in its place.
 */

export default {
  hollowmoon: {
    venue: 'hollow_moon',
    element: 'dark',
    passed: 'c8:watchers',
    teacher: 'lantern_keeper',
    teaches: ['lantern'],
    warden: 'nox',
    entrance: [{ type: 'watchers', puzzle: 'watchers' }],
    award: [
      { type: 'wandTrial', sigil: 'lantern', count: 3, twist: 'unseen', script: 'ch8.lamps', done: 'c8:lamps' },
      { type: 'ringDuel', trainer: 'nox', rules: ['blind'], done: 'c8:ring' }
    ],
    ring: { item: 'moon_ring', element: 'dark', purse: 50 }
  }
};
