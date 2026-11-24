/*
 * ch5/events.js
 * Job: the story events of chapter 5: the coast road north from Tidewell (opened by the Tide Ring: flag ch5:open
 * lifts the fence of chapter 4's map state), the pedlar's fire and the lookout halfway, Coilhaven and its humming
 * lamps, a kite letter with the Elder's advice, the Tinker's Shed, the lamp that cries in the square (the freed
 * spark, then THE CHOICE: c5:spoke or c5:quiet, and the Token's secret: c5:token 'kept' or 'dropped'), Master
 * Ashfield and Cole, the grey cloaks at the north gate (only after speaking out), the circuit door on Sparkmoor,
 * Volta's three loose sparks, and the Storm Works gauntlet (content `gauntlets`, game layer Gauntlet.js).
 */

/* the lamp by the statue in the square of Coilhaven (maps lane spot "lamp") */
const NEAR_LAMP = { area: { map: 'coilhaven', x: [28, 30], y: [20, 22] } };

export default [
  {
    id: 'c5_road_sign',
    on: { door: { map: 'tidewell', to: 'coast_road' }, block: true },
    if: { not: 'ch5:open' },
    once: false,
    then: [{ run: 'ch5.roadshut' }]
  },
  {
    id: 'c5_open',
    on: { auto: true },
    if: { all: [{ map: 'tidewell' }, { indoor: false }, { ext: 'ring', has: 'water' }, { not: 'ch5:open' }] },
    then: [
      { wait: 500 },
      { say: 'ch5.ev.open.1', who: 'kid' },
      { flag: 'ch5:open' },
      { toast: 'ch5.ev.open.toast' },
      { say: 'ch5.ev.open.2', who: 'companion' },
      { quest: 'sparkring', start: true }
    ]
  },
  {
    id: 'c5_road',
    on: { enter: 'coast_road' },
    delay: 500,
    then: [
      { if: { quest: 'sparkring', is: 'none' }, then: [{ quest: 'sparkring', start: true, quiet: true }] },
      { say: 'ch5.ev.road.1', who: 'kid' },
      { say: 'ch5.ev.road.2', who: 'companion' }
    ]
  },
  {
    id: 'c5_lookout',
    on: { area: { map: 'coast_road', x: [29, 31], y: [22, 24] } },
    then: [
      { wait: 300 },
      { say: 'ch5.ev.lookout.1', who: 'kid' },
      { say: 'ch5.ev.lookout.2', who: 'companion' },
      { give: 'shiny_pebble' }
    ]
  },
  {
    id: 'c5_suri',
    on: { talk: 'suri' },
    if: { not: 'c5:suri' },
    then: [{ run: 'ch5.suri' }]
  },
  {
    id: 'c5_city',
    on: { enter: 'coilhaven' },
    delay: 600,
    then: [
      { say: 'ch5.ev.city.1', who: 'kid' },
      { say: 'ch5.ev.city.2', who: 'kid' },
      { say: 'ch5.ev.city.3', who: 'companion' },
      { wait: 400 },
      { ext: 'kiteFlight', mode: 'mail' },
      { sound: 'page' },
      { say: 'ch5.ev.letter.1', who: 'kid' },
      { run: 'ch5.letter' },
      { say: 'ch5.ev.letter.2', who: 'companion' }
    ]
  },
  {
    id: 'c5_tinker',
    on: { talk: 'tinker' },
    if: { not: { ext: 'spell', has: 'stun' } },
    once: false,
    then: [{ run: 'ch5.teach' }]
  },
  {
    id: 'c5_tinker_lamp',
    on: { talk: 'tinker' },
    if: { not: 'c5:spark' },
    then: [{ say: 'ch5.ev.tinker.lamp.1', who: 'tinker' }, { say: 'ch5.ev.tinker.lamp.2', who: 'tinker' }]
  },
  {
    id: 'c5_tib',
    on: { talk: 'tib' },
    if: { not: 'c5:spark' },
    then: [
      { say: 'ch5.ev.tib.1', who: 'tib' },
      { say: 'ch5.ev.tib.2', who: 'tib' },
      { say: 'ch5.ev.tib.3', who: 'tib' }
    ]
  },
  {
    id: 'c5_lamp',
    on: { interact: ['lamp_jar', 'lamp_jar_open'], map: 'coilhaven' },
    if: { all: [NEAR_LAMP, { not: 'c5:choice' }] },
    once: false,
    then: [{ run: 'ch5.spark' }]
  },
  {
    id: 'c5_ashfield',
    on: { talk: 'bram_ashfield' },
    if: { all: ['c5:choice', { not: 'c5:ashfield' }] },
    once: false,
    thenService: false,
    then: [{ run: 'ch5.ashfield' }]
  },
  {
    id: 'c5_joss_gift',
    on: { talk: 'joss' },
    if: 'c5:spoke',
    then: [
      { say: 'ch5.ev.joss.1', who: 'joss' },
      { say: 'ch5.ev.joss.2', who: 'joss' },
      { give: 'herb', n: 2 },
      { give: 'spirit_snack' },
      { say: 'ch5.ev.joss.3', who: 'companion' }
    ]
  },
  {
    id: 'c5_peg',
    on: { talk: 'peg' },
    if: { not: 'c5:ring' },
    then: [
      { say: 'ch5.ev.peg.1', who: 'peg' },
      { say: 'ch5.ev.peg.2', who: 'peg' },
      { say: 'ch5.ev.peg.3', who: 'peg' },
      { give: 'herb', n: 2 },
      { say: 'ch5.ev.peg.4', who: 'peg' }
    ]
  },
  {
    id: 'c5_hettie',
    on: { talk: 'hettie' },
    if: { not: 'c5:clock' },
    once: false,
    then: [{ run: 'ch5.clock' }]
  },
  {
    id: 'c5_cloaks',
    on: { area: { map: 'coilhaven', x: [28, 35], y: [4, 9] }, rearm: true },
    if: { all: ['c5:spoke', { not: 'c5:cloaks' }] },
    once: false,
    then: [{ run: 'ch5.cloaks' }]
  },
  {
    id: 'c5_cloaks_talk',
    on: { talk: ['greycloak_road1', 'greycloak_road2'] },
    if: { all: ['c5:spoke', { not: 'c5:cloaks' }] },
    once: false,
    thenService: false,
    then: [{ run: 'ch5.cloaks' }]
  },
  {
    id: 'c5_moor',
    on: { enter: 'sparkmoor' },
    if: { not: 'c5:circuit' },
    delay: 500,
    then: [
      { say: 'ch5.ev.moor.1', who: 'kid' },
      { say: 'ch5.ev.moor.2', who: 'companion' }
    ]
  },
  {
    id: 'c5_dov',
    on: { talk: 'dov' },
    if: { not: { ext: 'spell', has: 'stun' } },
    once: false,
    then: [{ run: 'ch5.teach.dov' }]
  },
  {
    id: 'c5_dov_first',
    on: { talk: 'dov' },
    if: { not: 'c5:circuit' },
    then: [
      { say: 'ch5.ev.dov.1', who: 'dov' },
      { say: 'ch5.ev.dov.2', who: 'dov' },
      { say: 'ch5.ev.dov.3', who: 'dov' }
    ]
  },
  {
    id: 'c5_works_door',
    on: { door: { map: 'sparkmoor', to: 'storm_works' }, block: true },
    if: { not: 'c5:circuit' },
    once: false,
    then: [{ say: 'ch5.ev.door.1', who: 'kid' }]
  },
  {
    id: 'c5_works_enter',
    on: { enter: 'storm_works' },
    once: false,
    then: [{ unflag: 'c5:works:rested' }]
  },
  {
    id: 'c5_volta',
    on: { talk: 'volta' },
    if: { not: 'c5:ring' },
    once: false,
    then: [
      {
        branch: [
          { if: { not: 'c5:choice' }, then: [{ run: 'ch5.volta.first' }] },
          {
            if: { not: 'c5:volta' },
            then: [
              { say: 'ch5.ev.volta.1', who: 'volta' },
              {
                if: 'c5:spoke',
                then: [{ say: 'ch5.ev.volta.spoke', who: 'volta' }],
                else: [{ say: 'ch5.ev.volta.quiet', who: 'volta' }]
              },
              { say: 'ch5.ev.volta.2', who: 'volta' },
              { flag: 'c5:volta' },
              { run: 'ch5.sparks.try' }
            ]
          },
          { if: { not: 'c5:wand' }, then: [{ run: 'ch5.sparks.try' }] }
        ],
        else: [{ run: 'ch5.gauntlet' }]
      }
    ]
  },
  {
    id: 'c5_gauntlet',
    on: { talk: ['pim', 'foreman'] },
    if: { all: ['c5:wand', { not: 'c5:ring' }] },
    once: false,
    then: [{ run: 'ch5.gauntlet' }]
  },
  {
    id: 'c5_pim_early',
    on: { talk: ['pim', 'foreman'] },
    if: { not: 'c5:wand' },
    once: false,
    then: [{ say: 'ch5.ev.pim.early', who: 'self' }]
  },
  {
    id: 'c5_letter2',
    on: { auto: true },
    if: { all: ['c5:ring', { map: 'coilhaven' }, { indoor: false }] },
    then: [
      { wait: 600 },
      { ext: 'kiteFlight', mode: 'mail' },
      { sound: 'page' },
      { say: 'ch5.ev.letter2.1', who: 'kid' },
      { run: 'ch5.letter2' },
      { flag: 'c5:complete' },
      { say: 'ch5.ev.letter2.2', who: 'companion' }
    ]
  }
];
