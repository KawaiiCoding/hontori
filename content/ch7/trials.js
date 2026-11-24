/*
 * ch7/trials.js
 * Job: the Ember Crucible, the School of Fire and the sixth ring school (world rules 49 and 79). Its door opens
 * once Warden Brasa has met the kid in the Hearth Below (c7:brasa). The entrance is the brazier court: water
 * cools the lava into a path and fire lights the three braziers in the order the carvings show (puzzle type
 * braziers, ./puzzles.js). Then Apprentice Kell, one sure stroke drawn with the burn twist, and the ring duel
 * under the ring rule heat (mana does not refill during the fight).
 */

export default {
  crucible: {
    venue: 'ember_crucible',
    element: 'fire',
    passed: 'c7:braziers',
    warden: 'brasa',
    apprentice: 'kell',
    entrance: [{ type: 'braziers', puzzle: 'braziers' }],
    award: [{ type: 'ringDuel', trainer: 'brasa', rules: ['heat'], done: 'c7:ring' }],
    ring: { item: 'flame_ring', element: 'fire', purse: 50 }
  }
};
