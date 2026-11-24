/*
 * ch9/tournaments.js
 * Job: the Ring Tournament of Halo Court (content `tournaments`, run by the library's tournament mode): four
 * rounds in a row against ring holders under the ring rule pure (no binding, no items). Between rounds the
 * bracket screen shows who is left (`bracket`: every entrant and the round they fell in; th3 falls to Mira and
 * th4 to Cole on the other side) and the attendants tend the party by half (`between`). Before each round the
 * run keeps a save point, so a lost round is fought again from that round, in the same shape. Leaving Halo Court
 * ends the run. The final round takes the twist flawless: only Flawless sigils take effect.
 * The final is Cole's choice: before it he answers Vael's offer in front of the whole arena (./scripts.js).
 */

export default {
  halo: {
    venue: 'halo_court',
    rules: ['pure'],
    done: 'c9:tourney:won',
    left: 'ch9.tourney.left',
    title: 'ch9.tourney.title',
    bracket: [
      { who: 'player' },
      { who: 'th1', out: 1 },
      { who: 'th2', out: 2 },
      { who: 'mira_halo', out: 3 },
      { who: 'th3', out: 2 },
      { who: 'th4', out: 1 },
      { who: 'cole_halo', out: 4 }
    ],
    between: [{ heal: { hp: 'half' } }, { toast: 'ch9.tourney.tend' }],
    rounds: [
      {
        name: 'ch9.tourney.round.1',
        battle: { opponent: 'th1' },
        before: [{ say: 'ch9.ev.herald.1', who: 'lys' }, { say: 'ch9.ev.th1.1', who: 'th1' }],
        won: [{ flag: 'c9:r1' }, { say: 'ch9.ev.th1.2', who: 'th1' }]
      },
      {
        name: 'ch9.tourney.round.2',
        battle: { opponent: 'th2' },
        before: [{ say: 'ch9.ev.herald.2', who: 'lys' }, { say: 'ch9.ev.th2.1', who: 'th2' }],
        won: [{ flag: 'c9:r2' }, { say: 'ch9.ev.th2.2', who: 'th2' }]
      },
      {
        name: 'ch9.tourney.round.3',
        battle: { opponent: 'mira_halo' },
        before: [{ run: 'ch9.round.mira' }],
        won: [{ flag: 'c9:r3' }, { say: 'ch9.ev.mira.r.3', who: 'mira' }, { say: 'ch9.ev.mira.r.4', who: 'lisel' }]
      },
      {
        name: 'ch9.tourney.round.4',
        battle: { opponent: 'cole_halo' },
        twist: 'flawless',
        before: [{ run: 'ch9.round.final' }]
      }
    ]
  }
};
