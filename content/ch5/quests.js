/*
 * ch5/quests.js
 * Job: the quests of chapter 5. The Spark Ring is the main road; The Ring-smith (Cole and his father) and The
 * Stopped Clock are the small quests of Coilhaven. Targets name spots on the chapter 5 maps.
 */

export default [
  {
    id: 'sparkring',
    icon: 'electric',
    title: 'ch5.quest.spark',
    desc: 'ch5.quest.spark.desc',
    steps: [
      { id: 'road', text: 'ch5.quest.spark.road', done: 'visited:coast_road', target: [{ map: 'tidewell', x: 28, y: 1 }] },
      { id: 'city', text: 'ch5.quest.spark.city', done: 'visited:coilhaven', target: [{ map: 'coast_road', x: 14, y: 1 }] },
      { id: 'seal', text: 'ch5.quest.spark.seal', done: { ext: 'spell', has: 'stun' }, target: [{ map: 'tinker_shed', x: 7, y: 3 }] },
      { id: 'lamp', text: 'ch5.quest.spark.lamp', done: 'c5:choice', target: [{ map: 'coilhaven', x: 29, y: 21 }] },
      { id: 'circuit', text: 'ch5.quest.spark.circuit', done: 'c5:circuit', target: [{ map: 'sparkmoor', x: 16, y: 14 }] },
      { id: 'volta', text: 'ch5.quest.spark.volta', done: 'c5:volta', target: [{ map: 'storm_works', x: 15, y: 8 }] },
      { id: 'sparks', text: 'ch5.quest.spark.sparks', done: 'c5:wand', target: [{ map: 'storm_works', x: 15, y: 8 }] },
      {
        id: 'gauntlet',
        text: {
          pick: [
            [{ ext: 'gauntlet', gauntlet: 'storm', stage: 2 }, 'ch5.quest.spark.gauntlet.3'],
            [{ ext: 'gauntlet', gauntlet: 'storm', stage: 1 }, 'ch5.quest.spark.gauntlet.2']
          ],
          else: 'ch5.quest.spark.gauntlet.1'
        },
        done: 'c5:ring',
        target: [{ map: 'storm_works', x: 15, y: 8 }]
      }
    ]
  },
  {
    id: 'ringsmith',
    icon: 'paw',
    title: 'ch5.quest.smith',
    desc: 'ch5.quest.smith.desc',
    steps: [{ id: 'tag', text: 'ch5.quest.smith.tag', done: 'c5:ashfield', target: [{ map: 'coilhaven_h1', x: 3, y: 4 }] }]
  },
  {
    id: 'clock',
    icon: 'electric',
    title: 'ch5.quest.clock',
    desc: 'ch5.quest.clock.desc',
    steps: [
      {
        id: 'seal',
        text: { pick: [[{ not: { ext: 'spell', has: 'stun' } }, 'ch5.quest.clock.learn']], else: 'ch5.quest.clock.seal' },
        done: 'c5:clock',
        target: [{ if: { not: { ext: 'spell', has: 'stun' } }, map: 'tinker_shed', x: 7, y: 3 }, { map: 'coilhaven_h4', x: 4, y: 4 }]
      }
    ]
  }
];
