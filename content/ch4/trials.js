/*
 * ch4/trials.js
 * Job: Deepbell Hall, the School of Water and the third ring school (world rules 49 and 79). The shape breaks
 * here: the hall is flooded and Maren will not duel until the spirit bell is raised. The entrance is the Sunken
 * Stair (three tide wheels drain the pools down to the drowned bell); then the apprentice, and a ring duel in
 * which the tide rises every round.
 */

export default {
  deepbell: {
    venue: 'deepbell_hall',
    element: 'water',
    passed: 'c4:stair',
    warden: 'maren',
    apprentice: 'isk',
    entrance: [{ type: 'tide', puzzle: 'tide' }],
    award: [{ type: 'ringDuel', trainer: 'maren', rules: ['tideRise'], done: 'c4:ring' }],
    ring: { item: 'tide_ring', element: 'water', purse: 50 }
  }
};
