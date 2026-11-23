/*
 * ch3/quests.js
 * Job: the quests of chapter 3. The Gale Ring is the main road; The Lost Kite, Cole in Kitewick, The Silent Bell and
 * Supper in Kitewick are the small quests of the town. Targets name spots on the chapter 3 maps.
 */

export default [
  {
    id: 'galering',
    icon: 'wind',
    title: 'ch3.quest.gale',
    desc: 'ch3.quest.gale.desc',
    steps: [
      {
        id: 'pass',
        text: 'ch3.quest.gale.pass',
        done: 'visited:whistling_pass',
        target: [{ map: 'mossgrove', x: 39, y: 15 }]
      },
      {
        id: 'windrest',
        text: 'ch3.quest.gale.windrest',
        done: 'visited:windrest',
        target: [{ map: 'whistling_pass', x: 59, y: 9 }]
      },
      {
        id: 'ward',
        text: 'ch3.quest.gale.ward',
        done: { ext: 'spell', has: 'shield' },
        target: [{ map: 'kite_house', x: 7, y: 3 }]
      },
      {
        id: 'bridge',
        text: 'ch3.quest.gale.bridge',
        done: 'c3:bridge',
        target: [{ map: 'kitewick', x: 48, y: 20 }]
      },
      {
        id: 'vanes',
        text: 'ch3.quest.gale.vanes',
        done: 'c3:vanes',
        target: [{ map: 'gale_bridges', x: 10, y: 38 }]
      },
      {
        id: 'zephra',
        text: 'ch3.quest.gale.zephra',
        done: 'c3:zephra',
        target: [{ map: 'gale_loft', x: 13, y: 8 }]
      },
      {
        id: 'bells',
        text: 'ch3.quest.gale.bells',
        done: 'c3:wand',
        target: [{ map: 'gale_loft', x: 13, y: 8 }]
      },
      {
        id: 'tolle',
        text: 'ch3.quest.gale.tolle',
        done: 'c3:tolle',
        target: [{ map: 'gale_loft', x: 13, y: 16 }]
      },
      {
        id: 'duel',
        text: 'ch3.quest.gale.duel',
        done: 'c3:ring',
        target: [{ map: 'gale_loft', x: 13, y: 8 }]
      }
    ]
  },
  {
    id: 'lostkite',
    icon: 'scroll',
    title: 'ch3.quest.kite',
    desc: 'ch3.quest.kite.desc',
    steps: [
      {
        id: 'fly',
        text: {
          pick: [[{ not: { has: 'kite' } }, 'ch3.quest.kite.nokite']],
          else: 'ch3.quest.kite.now'
        },
        done: 'c3:kite:note',
        target: [{ if: { not: { has: 'kite' } }, map: 'kite_house', x: 7, y: 3 }, { map: 'kitewick', x: 26, y: 21 }]
      }
    ]
  },
  {
    id: 'colerematch',
    icon: 'paw',
    title: 'ch3.quest.cole',
    desc: 'ch3.quest.cole.desc',
    steps: [{ id: 'duel', text: 'ch3.quest.cole.duel', done: 'c3:cole', target: [{ map: 'kitewick', x: 25, y: 20 }] }]
  },
  {
    id: 'bell',
    icon: 'wind',
    title: 'ch3.quest.bell',
    desc: 'ch3.quest.bell.desc',
    steps: [
      {
        id: 'ward',
        text: {
          pick: [[{ not: { ext: 'spell', has: 'shield' } }, 'ch3.quest.bell.learn']],
          else: 'ch3.quest.bell.ward'
        },
        done: 'c3:bell',
        target: [
          { if: { not: { ext: 'spell', has: 'shield' } }, map: 'kite_house', x: 7, y: 3 },
          { map: 'kitewick', x: 50, y: 9 }
        ]
      }
    ]
  },
  {
    id: 'family',
    icon: 'heart',
    title: 'ch3.quest.family',
    desc: 'ch3.quest.family.desc',
    steps: [{ id: 'ama', text: 'ch3.quest.family.ama', done: 'c3:family', target: [{ map: 'kitewick_h2', x: 3, y: 3 }] }]
  }
];
