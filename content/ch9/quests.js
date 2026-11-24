/*
 * ch9/quests.js
 * Job: the quests of chapter 9. The Halo Ring is the main road (it starts when the road to the Golden Gate opens,
 * c8:complete); Tobbe's Friend is the small quest of Goldmere. Targets come from ./places.js.
 */

import P from './places.js';

export default [
  {
    id: 'haloring',
    icon: 'light',
    title: 'ch9.quest.halo',
    desc: 'ch9.quest.halo.desc',
    steps: [
      { id: 'gate', text: 'ch9.quest.halo.gate', done: 'c9:gate', target: [P.ggGate] },
      { id: 'plaza', text: 'ch9.quest.halo.plaza', done: 'c9:offer', target: [P.gmPlaza] },
      { id: 'mirror', text: 'ch9.quest.halo.mirror', done: { ext: 'spell', has: 'mirror' }, target: [P.glassKeeper] },
      { id: 'gardens', text: 'ch9.quest.halo.gardens', done: 'c9:gardens', target: [P.gmGardensGate] },
      { id: 'family', text: 'ch9.quest.halo.family', done: 'c9:family', target: [P.gmPlaza] },
      {
        id: 'tourney',
        text: {
          pick: [
            [{ ext: 'tournament', tournament: 'halo', round: 4 }, 'ch9.quest.halo.tourney.4'],
            [{ ext: 'tournament', tournament: 'halo', round: 3 }, 'ch9.quest.halo.tourney.3'],
            [{ ext: 'tournament', tournament: 'halo', round: 2 }, 'ch9.quest.halo.tourney.2']
          ],
          else: 'ch9.quest.halo.tourney.1'
        },
        done: 'c9:ring',
        target: [P.hcAurel]
      }
    ]
  },
  {
    id: 'tobbe',
    icon: 'paw',
    title: 'ch9.quest.tobbe',
    desc: 'ch9.quest.tobbe.desc',
    steps: [{ id: 'see', text: 'ch9.quest.tobbe.see', done: 'c9:hester', target: [P.h2Hester] }]
  }
];
