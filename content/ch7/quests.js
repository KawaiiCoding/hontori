/*
 * ch7/quests.js
 * Job: the quests of chapter 7. The Flame Ring is the main road (it starts when Harrow lays the bridge, c6:bridge);
 * The Cold Kiln is the small quest of Cinderreach. Targets come from ./places.js.
 */

import P from './places.js';

export default [
  {
    id: 'flamering',
    icon: 'fire',
    title: 'ch7.quest.flame',
    desc: 'ch7.quest.flame.desc',
    steps: [
      { id: 'road', text: 'ch7.quest.flame.road', done: 'visited:ash_road', target: [P.shEastRoad] },
      { id: 'city', text: 'ch7.quest.flame.city', done: 'visited:cinderreach', target: [P.arEast] },
      { id: 'step', text: 'ch7.quest.flame.step', done: { ext: 'spell', has: 'step' }, target: [P.smokeKeeper] },
      {
        id: 'hearth',
        text: { pick: [[{ not: { has: 'heat_cloak' } }, 'ch7.quest.flame.cloak']], else: 'ch7.quest.flame.hearth' },
        done: 'c7:nest',
        target: [{ if: { not: { has: 'heat_cloak' } }, ...P.shopKeeper }, P.hbNest]
      },
      { id: 'braziers', text: { pick: [[{ not: 'c7:cooled' }, 'ch7.quest.flame.cool']], else: 'ch7.quest.flame.braziers' }, done: 'c7:braziers', target: [P.crCarving] },
      { id: 'kell', text: 'ch7.quest.flame.kell', done: 'c7:kell', target: [P.ecKell] },
      { id: 'ring', text: 'ch7.quest.flame.ring', done: 'c7:ring', target: [P.ecBrasa] }
    ]
  },
  {
    id: 'kiln',
    icon: 'fire',
    title: 'ch7.quest.kiln',
    desc: 'ch7.quest.kiln.desc',
    steps: [{ id: 'light', text: 'ch7.quest.kiln.light', done: 'c7:kiln', target: [P.h1Sefa] }]
  }
];
