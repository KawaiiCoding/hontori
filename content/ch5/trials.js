/*
 * ch5/trials.js
 * Job: the Storm Works, the School of Lightning and the fourth ring school (world rules 49 and 79): entrance by
 * the circuit door on Sparkmoor (turn the switch tiles until the power line runs from the coil to the door),
 * then a wand trial (seal three loose sparks with the Thunder Seal before each spark runs down its wire), and
 * the gauntlet: Pim, Foreman Grell and Volta one after another with no rest between (ring rule noRest).
 */

export default {
  storm: {
    venue: 'storm_works',
    element: 'electric',
    passed: 'c5:circuit',
    warden: 'volta',
    apprentice: 'pim',
    entrance: [{ type: 'circuit', puzzle: 'circuit' }],
    award: [
      { type: 'wandTrial', sigil: 'stun', count: 3, twist: 'quick', script: 'ch5.sparks', done: 'c5:wand' },
      { type: 'ringDuel', trainer: 'volta', rules: ['noRest'], done: 'c5:ring' }
    ],
    ring: { item: 'spark_ring', element: 'electric', purse: 50 }
  }
};
