/*
 * ch3/trials.js
 * Job: Gale Loft, the School of Wind and the second ring school (world rules 49 and 79): entrance across the Gale
 * Bridges (turn the wind vanes so the gusts carry you over), then a wand trial (still three wind bells with the
 * Ward Sigil while the page drifts), the apprentice, and a ring duel in which the wind chooses.
 */

export default {
  gale: {
    venue: 'gale_loft',
    element: 'wind',
    passed: 'c3:vanes',
    warden: 'zephra',
    apprentice: 'tolle',
    entrance: [{ type: 'vanes', puzzle: 'vanes' }],
    award: [
      { type: 'wandTrial', sigil: 'shield', count: 3, twist: 'drift', script: 'ch3.bells', done: 'c3:wand' },
      { type: 'ringDuel', trainer: 'zephra', rules: ['windSwap'], done: 'c3:ring' }
    ],
    ring: { item: 'gale_ring', element: 'wind', purse: 50 }
  }
};
