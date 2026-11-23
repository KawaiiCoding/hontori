/*
 * ch2/trials.js
 * Job: Rootwood Hall, the School of Grass and the first ring school (world rule 49): entrance through the Root Maze,
 * then a wand trial (wake three sprouts with the Mending Sigil), the apprentice, and a ring duel with no switching.
 */

export default {
  rootwood: {
    venue: 'rootwood_hall',
    element: 'grass',
    passed: 'c2:maze',
    warden: 'fern',
    apprentice: 'bryn',
    entrance: [{ type: 'push', puzzle: 'root_maze' }],
    award: [
      { type: 'wandTrial', sigil: 'mend', count: 3, script: 'ch2.sprouts', done: 'c2:sprouts' },
      { type: 'ringDuel', trainer: 'fern', rules: ['noSwitch'], done: 'c2:ring' }
    ],
    ring: { item: 'ring_leaf', element: 'grass', purse: 50 }
  }
};
