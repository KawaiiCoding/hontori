/*
 * ch10/trials.js
 * Job: the Athenaeum, the archmage's school and the last ring (world rule 9). Its entrance is the climb: the
 * locked Council gate is passed by the door marked Maps (c10:landing, Merrit's sketch). The trial is the
 * Council (three chambers, ./gauntlets.js) and then Grand Archmage Orlen Vael himself; the Archmage's Ring is
 * given after mercy is decided (./scripts.js), whichever way it goes.
 */

export default {
  athenaeum: {
    venue: 'athenaeum',
    element: 'light',
    passed: 'c10:landing',
    warden: 'orlen',
    entrance: [],
    award: [{ type: 'ringDuel', trainer: 'vael_duel' }]
  }
};
