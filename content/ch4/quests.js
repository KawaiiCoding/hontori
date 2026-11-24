/*
 * ch4/quests.js
 * Job: the quests of chapter 4. The Tide Ring is the main road (the ferry, the flooded hall, the Dream Veil, the
 * Saltmarsh, the tide wheels, the drowned bell, Isk and Maren); Mira's Mother is the small quest of Tidewell.
 * Targets name spots from ./places.js.
 */

import P from './places.js';

export default [
  {
    id: 'tidering',
    icon: 'water',
    title: 'ch4.quest.tide',
    desc: 'ch4.quest.tide.desc',
    steps: [
      { id: 'ferry', text: 'ch4.quest.tide.ferry', done: 'visited:tidewell', target: [P.kwJetty] },
      { id: 'maren', text: 'ch4.quest.tide.maren', done: 'c4:maren', target: [P.tdMaren] },
      { id: 'lullaby', text: 'ch4.quest.tide.lullaby', done: { ext: 'spell', has: 'sleep' }, target: [P.boatKeeper] },
      {
        id: 'stair',
        text: 'ch4.quest.tide.stair',
        done: 'visited:sunken_stair',
        target: [{ if: { not: 'visited:saltmarsh' }, ...P.tdWest }, P.smStairGate]
      },
      { id: 'wheels', text: 'ch4.quest.tide.wheels', done: 'c4:stair', target: [P.ssIsk] },
      { id: 'bell', text: 'ch4.quest.tide.bell', done: 'c4:bell', target: [P.ssBellFront] },
      { id: 'isk', text: 'ch4.quest.tide.isk', done: 'c4:isk', target: [P.hallIsk] },
      { id: 'duel', text: 'ch4.quest.tide.duel', done: 'c4:ring', target: [P.hallMaren] }
    ]
  },
  {
    id: 'mirahome',
    icon: 'heart',
    title: 'ch4.quest.mira',
    desc: 'ch4.quest.mira.desc',
    steps: [
      { id: 'find', text: 'ch4.quest.mira.find', done: 'c4:mira:met', target: [{ if: { not: 'visited:tidewell_h1' }, ...P.tdHome }, P.h1Mira] },
      { id: 'lisel', text: 'ch4.quest.mira.lisel', done: 'c4:lisel', target: [P.h1Mira] },
      { id: 'duel', text: 'ch4.quest.mira.duel', done: 'c4:mira', target: [P.h1Mira] }
    ]
  }
];
