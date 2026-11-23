/*
 * ch1/quests.js
 * Job: the quests of chapter 1 (src/chapter1.js). target: the spot the map and compass point to.
 */

export default [
  {
    id: 'night',
    icon: 'night',
    title: 'ch1.quest.night',
    desc: 'ch1.quest.night.desc',
    steps: [{ id: 'bed', text: 'ch1.quest.night.bed', done: 'c1:morning', target: [{ map: 'home', x: 28, y: 3 }] }]
  },
  {
    id: 'academy',
    icon: 'book',
    title: 'ch1.quest.academy',
    desc: 'ch1.quest.academy.desc',
    after: [{ quest: 'woods', start: true }, { quest: 'pawprints', start: true }],
    steps: [
      {
        id: 'go',
        text: 'ch1.quest.academy.go',
        done: { any: ['c1:academy', 'visited:school'] },
        target: [{ map: 'village', x: 30, y: 9 }]
      },
      {
        id: 'trial',
        text: 'ch1.quest.academy.trial',
        done: 'c1:academy',
        target: [{ map: 'village', x: 30, y: 9 }]
      },
      {
        id: 'duel',
        text: 'ch1.quest.academy.duel',
        done: { any: ['c1:duel:cole', 'c1:duel:mira'] },
        target: [{ map: 'school', x: 5, y: 7 }]
      },
      {
        id: 'bind',
        text: 'ch1.quest.academy.bind',
        done: { ext: 'spell', has: 'bind' },
        target: [{ map: 'school', x: 8, y: 3 }]
      }
    ]
  },
  {
    id: 'pawprints',
    icon: 'paw',
    title: 'ch1.quest.paw',
    desc: 'ch1.quest.paw.desc',
    after: [{ quest: 'elder', start: true }],
    steps: [
      { id: 'pip', text: 'ch1.quest.paw.pip', done: 'c1:pip', target: [{ map: 'house_a2', x: 9, y: 8 }] },
      {
        id: 'pond',
        text: { pick: [[{ hour: [18, 5] }, 'ch1.quest.paw.pond.night']], else: 'ch1.quest.paw.pond.day' },
        done: 'c1:pond',
        target: [{ if: { hour: [18, 5] }, map: 'village', x: 9, y: 10 }, { map: 'home', x: 28, y: 2 }]
      },
      { id: 'bind', text: 'ch1.quest.paw.bind', done: 'c1:brook', target: [{ map: 'village', x: 9, y: 10 }] }
    ]
  },
  {
    id: 'elder',
    icon: 'light',
    title: 'ch1.quest.elder',
    desc: 'ch1.quest.elder.desc',
    steps: [
      {
        id: 'family',
        text: 'ch1.quest.elder.family',
        done: 'c1:fenn',
        target: [{ map: 'house_a3', x: 7, y: 4 }]
      },
      {
        id: 'elder',
        text: 'ch1.quest.elder.elder',
        done: 'c1:well',
        target: [{ map: 'village', x: 33, y: 12 }]
      }
    ]
  },
  {
    id: 'woods',
    icon: 'sprout',
    title: 'ch1.quest.woods',
    desc: 'ch1.quest.woods.desc',
    steps: [
      {
        id: 'gate',
        text: 'ch1.quest.woods.gate',
        done: { quest: 'academy', is: 'done' },
        target: [{ map: 'village', x: 32, y: 37 }]
      },
      {
        id: 'wood',
        text: 'ch1.quest.woods.wood',
        done: { all: [{ quest: 'academy', is: 'done' }, 'visited:whisperwood'] },
        target: [{ map: 'whisperwood', x: 24, y: 1 }]
      }
    ]
  }
];
