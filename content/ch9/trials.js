/*
 * ch9/trials.js
 * Job: Halo Court, the School of Light and the eighth ring school (world rules 49 and 79). Entrance by the Mirror
 * Gardens (turn the mirrors until the beam of light reaches the gate; puzzle type mirrors, ./puzzles.js). The
 * trial is the Ring Tournament: four rounds in a row under the ring rule pure (./tournaments.js). Warden Aurel
 * gives the Halo Ring to the winner: the eighth vote.
 */

export default {
  halo: {
    venue: 'halo_court',
    element: 'light',
    passed: 'c9:gardens',
    warden: 'aurel',
    apprentice: 'lys',
    entrance: [{ type: 'mirrors', puzzle: 'mirrors' }],
    award: [{ type: 'tournament', tournament: 'halo', done: 'c9:ring' }],
    ring: { item: 'halo_ring', element: 'light', purse: 50 }
  }
};
