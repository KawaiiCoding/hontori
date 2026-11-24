/*
 * ch8/quests.js
 * Job: the quests of chapter 8. The Moon Ring is the main road; chapter 6's The Sleeping Sanctum finishes here
 * on its own when Merrit lifts the seal (c8:unseal). Wick's Tea and Smudge are the favours of the Mothwood and
 * Duskmere (each pays a Favour Token).
 */

import P from './places.js';

export default [
  {
    id: 'moonring',
    icon: 'dark',
    title: 'ch8.quest.moon',
    desc: 'ch8.quest.moon.desc',
    steps: [
      { id: 'flame', text: 'ch8.quest.moon.flame', done: 'c8:flame', target: [P.ecBrasa] },
      { id: 'wood', text: 'ch8.quest.moon.wood', done: 'visited:mothwood', target: [P.crMothGate] },
      { id: 'town', text: 'ch8.quest.moon.town', done: 'visited:duskmere', target: [P.mwSouth] },
      { id: 'crater', text: 'ch8.quest.moon.crater', done: 'c8:watchers', target: [P.dmCraterGate] },
      { id: 'nox', text: 'ch8.quest.moon.nox', done: 'c8:nox', target: [P.hmNox] },
      { id: 'hidden', text: 'ch8.quest.moon.hidden', done: 'c8:hidden', target: [P.dmNox] },
      { id: 'captain', text: 'ch8.quest.moon.captain', done: 'c8:captain', target: [P.dmSquare] },
      { id: 'sigil', text: 'ch8.quest.moon.sigil', done: { ext: 'spell', has: 'lantern' }, target: [P.lanternKeeper] },
      { id: 'lamps', text: 'ch8.quest.moon.lamps', done: 'c8:lamps', target: [P.hmNox] },
      { id: 'ring', text: 'ch8.quest.moon.ring', done: 'c8:ring', target: [P.hmNox] }
    ]
  },
  {
    id: 'wicktea',
    icon: 'heart',
    title: 'ch8.quest.tin',
    desc: 'ch8.quest.tin.desc',
    steps: [{ id: 'give', text: 'ch8.quest.tin.give', done: 'c8:tin', target: [P.h2Linnet] }]
  },
  {
    id: 'smudge',
    icon: 'paw',
    title: 'ch8.quest.pup',
    desc: 'ch8.quest.pup.desc',
    steps: [
      { id: 'find', text: 'ch8.quest.pup.find', done: 'c8:pup', target: [P.mwPup] },
      { id: 'home', text: 'ch8.quest.pup.home', done: 'c8:pup:back', target: [P.h1Pella] }
    ]
  }
];
