/*
 * ch6/quests.js
 * Job: the quests of chapter 6. The Stone Ring is the main road (it ends when Harrow lays the bridge to the Ash
 * Road). The Sleeping Sanctum starts when the Council seals the kid's Sanctum and stays in the log until
 * chapter 8 breaks the seal (flag c8:unseal, a later chapter's flag), so the loss always reads as for now, not
 * for good. The Carver's Chisel and The Talking Cave are the small quests of Stonehollow.
 */

import P from './places.js';

export default [
  {
    id: 'stonering',
    icon: 'earth',
    title: 'ch6.quest.stone',
    desc: 'ch6.quest.stone.desc',
    steps: [
      { id: 'road', text: 'ch6.quest.stone.road', done: 'visited:mountain_road', target: [P.chGate] },
      { id: 'town', text: 'ch6.quest.stone.town', done: 'visited:stonehollow', target: [P.mrTop] },
      { id: 'cave', text: 'ch6.quest.stone.cave', done: 'visited:listening_cave', target: [P.shWestGate, P.oqCaveMouth] },
      { id: 'tunnels', text: 'ch6.quest.stone.tunnels', done: 'c6:tunnels', target: [P.lcTunnels] },
      { id: 'carvings', text: 'ch6.quest.stone.carvings', done: 'c6:carvings', target: [P.lcTunnels] },
      { id: 'dunn', text: 'ch6.quest.stone.dunn', done: 'c6:dunn', target: [P.hallDunn] },
      {
        id: 'rune',
        text: 'ch6.quest.stone.rune',
        done: { ext: 'spell', has: 'boost' },
        target: [P.drummer]
      },
      { id: 'harrow', text: 'ch6.quest.stone.harrow', done: 'c6:ring', target: [P.hallHarrow] },
      { id: 'seal', text: 'ch6.quest.stone.seal', done: 'c6:sealed', target: [P.hallEnvoy] },
      { id: 'bridge', text: 'ch6.quest.stone.bridge', done: 'c6:bridge', target: [P.hallHarrow] }
    ]
  },
  {
    id: 'sanctum',
    icon: 'wand',
    title: 'ch6.quest.sanctum',
    desc: 'ch6.quest.sanctum.desc',
    steps: [{ id: 'wake', text: 'ch6.quest.sanctum.wake', done: 'c8:unseal' }]
  },
  {
    id: 'chisel',
    icon: 'earth',
    title: 'ch6.quest.chisel',
    desc: 'ch6.quest.chisel.desc',
    steps: [
      {
        id: 'find',
        text: { pick: [[{ not: { has: 'miner_rope' } }, 'ch6.quest.chisel.rope']], else: 'ch6.quest.chisel.find' },
        done: 'c6:chisel',
        target: [{ if: { not: { has: 'miner_rope' } }, ...P.shopKeeper }, P.lcDrift]
      },
      { id: 'back', text: 'ch6.quest.chisel.back', done: 'c6:chisel:back', target: [P.h3Gorse] }
    ]
  },
  {
    id: 'ottie',
    icon: 'paw',
    title: 'ch6.quest.ottie',
    desc: 'ch6.quest.ottie.desc',
    steps: [
      {
        id: 'listen',
        text: { pick: [['c6:carvings', 'ch6.quest.ottie.tell']], else: 'ch6.quest.ottie.listen' },
        done: 'c6:ottie',
        target: [{ if: { not: 'c6:carvings' }, ...P.oqCaveMouth }, P.h4Ottie]
      }
    ]
  }
];
