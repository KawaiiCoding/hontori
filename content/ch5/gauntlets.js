/*
 * ch5/gauntlets.js
 * Job: the Storm Works gauntlet (content `gauntlets`, run by systems/features/Gauntlet.js): Apprentice Pim on
 * the first floor, Foreman Grell on the second, Warden Volta Quill in the ring at the top, one after another
 * with no rest between (ring rule noRest on every duel). Before each duel the run keeps a save point, so a
 * lost duel is tried again from that duel, in the same shape. Leaving the Works ends the run.
 * The one who duels next walks over to the player; what each says depends on the choice in the square.
 */

export default {
  storm: {
    venue: 'storm_works',
    rules: ['noRest'],
    done: 'c5:gauntlet',
    left: 'ch5.gauntlet.left',
    stages: [
      {
        battle: { opponent: 'pim' },
        before: [
          { face: 'pim', dir: 'player' },
          {
            branch: [
              { if: 'c5:spoke', then: [{ say: 'ch5.ev.pim.spoke', who: 'pim' }] },
              { if: 'c5:quiet', then: [{ say: 'ch5.ev.pim.quiet', who: 'pim' }] }
            ]
          },
          { say: 'ch5.ev.pim.1', who: 'pim' }
        ],
        won: [{ flag: 'c5:pim' }, { say: 'ch5.ev.pim.2', who: 'pim' }]
      },
      {
        battle: { opponent: 'foreman' },
        before: [
          { move: 'foreman', to: 'player' },
          { face: 'foreman', dir: 'player' },
          { say: 'ch5.ev.foreman.1', who: 'foreman' }
        ],
        won: [{ flag: 'c5:foreman' }, { say: 'ch5.ev.foreman.2', who: 'foreman' }]
      },
      {
        battle: { opponent: 'volta' },
        before: [
          { move: 'volta', to: 'player' },
          { face: 'volta', dir: 'player' },
          { say: 'ch5.ev.ring.1', who: 'volta' }
        ]
      }
    ]
  }
};
