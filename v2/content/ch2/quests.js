/*
 * ch2/quests.js
 * Job: the quests of chapter 2. The Rockslide waits for the next chapter: its step is never done here.
 */

export default [
  {
    id: 'leafring',
    icon: 'leaf',
    title: 'ch2.quest.leaf',
    desc: 'ch2.quest.leaf.desc',
    after: [{ quest: 'tidewell', start: true }],
    steps: [
      {
        id: 'road',
        text: 'ch2.quest.leaf.road',
        done: 'visited:mossgrove',
        target: [{ map: 'mossgrove', x: 26, y: 2 }]
      },
      {
        id: 'maze',
        text: 'ch2.quest.leaf.maze',
        done: 'c2:maze',
        target: [{ map: 'rootwood_gate', x: 8, y: 5 }]
      },
      {
        id: 'fern',
        text: 'ch2.quest.leaf.fern',
        done: 'c2:fern',
        target: [{ map: 'rootwood_hall', x: 13, y: 12 }]
      },
      {
        id: 'sprouts',
        text: 'ch2.quest.leaf.sprouts',
        done: 'c2:sprouts',
        target: [{ map: 'rootwood_hall', x: 13, y: 12 }]
      },
      {
        id: 'bryn',
        text: 'ch2.quest.leaf.bryn',
        done: 'c2:bryn',
        target: [{ map: 'rootwood_hall', x: 13, y: 15 }]
      },
      {
        id: 'duel',
        text: 'ch2.quest.leaf.duel',
        done: 'c2:ring',
        target: [{ map: 'rootwood_hall', x: 13, y: 12 }]
      }
    ]
  },
  {
    id: 'tidewell',
    icon: 'wind',
    title: 'ch2.quest.slide',
    desc: 'ch2.quest.slide.desc',
    steps: [
      {
        id: 'wait',
        text: { pick: [[{ ext: 'full' }, 'ch2.quest.slide.full']], else: 'ch2.quest.slide.wait' },
        done: 'ch3:open',
        target: [{ map: 'mossgrove', x: 32, y: 17 }]
      }
    ]
  },
  {
    id: 'wellight',
    icon: 'light',
    title: 'ch2.quest.well',
    desc: 'ch2.quest.well.desc',
    steps: [
      { id: 'hum', text: 'ch2.quest.well.hum', done: 'wl:hum', target: [{ map: 'village', x: 29, y: 19 }] },
      { id: 'ring', text: 'ch2.quest.well.ring', done: 'c2:ring' },
      {
        id: 'free',
        text: 'ch2.quest.well.free',
        done: 'wl:free',
        target: [{ map: 'village', x: 29, y: 19 }]
      },
      { id: 'cup', text: 'ch2.quest.well.cup', done: 'wl:cup', target: [{ map: 'village', x: 33, y: 12 }] }
    ]
  }
];
