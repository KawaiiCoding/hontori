/*
 * ch6/trials.js
 * Job: Bedrock Hall, the School of Stone and the fifth ring school (world rules 49 and 79): entrance through the
 * dark boulder tunnels at the back of the Listening Cave (a push puzzle in the dark: the Lantern widens the
 * light), then Apprentice Dunn, then Warden Harrow wand to wand (ring rule wandDuel). The Stone Ring is the
 * fifth Warden's vote. The duels are run by the events (./events.js), as in chapters 2 to 5.
 */

export default {
  bedrock: {
    venue: 'bedrock_hall',
    element: 'earth',
    passed: 'c6:tunnels',
    teacher: 'drummer',
    teaches: ['boost'],
    warden: 'harrow',
    apprentice: 'dunn_hollow',
    entrance: [{ type: 'push', puzzle: 'tunnels' }],
    award: [{ type: 'ringDuel', trainer: 'harrow', rules: ['wandDuel'], done: 'c6:ring' }],
    ring: { item: 'stone_ring', element: 'earth', purse: 50 }
  }
};
