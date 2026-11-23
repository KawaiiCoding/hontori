/*
 * ch3/events.js
 * Job: the story events of chapter 3: the road east opens with the full journey, the Whistling Pass, the first
 * letter from home by kite, Kitewick, the broken bridge to Gale Loft and Orlen Vael, the Gale Bridges and Gale Loft, Cole's
 * warning, the second letter, and the saddle hint after the second evolution.
 */

export default [
  {
    id: 'c3_open',
    on: { auto: true },
    if: { all: [{ map: 'mossgrove' }, { ext: 'full' }, 'c2:ring', { not: 'ch3:open' }] },
    then: [
      { wait: 400 },
      { say: 'ch3.ev.open.1', who: 'dunn' },
      { say: 'ch3.ev.open.2', who: 'dunn' },
      { say: 'ch3.ev.open.3', who: 'kid' },
      { flag: 'ch3:open' },
      { quest: 'galering', start: true },
      { say: 'ch3.ev.open.4', who: 'companion' }
    ]
  },
  {
    id: 'c3_slide_door',
    on: { door: { map: 'mossgrove', to: 'whistling_pass' }, block: true },
    if: { not: 'ch3:open' },
    once: false,
    then: [{ run: 'ch3.slide' }]
  },
  {
    id: 'c3_pass',
    on: { enter: 'whistling_pass' },
    delay: 500,
    then: [
      { say: 'ch3.ev.pass.1', who: 'kid' },
      { say: 'ch3.ev.pass.2', who: 'companion' }
    ]
  },
  {
    id: 'c3_lookout',
    on: { area: { map: 'whistling_pass', x: [44, 45], y: [18, 19] } },
    then: [
      { wait: 300 },
      { say: 'ch3.ev.lookout.1', who: 'kid' },
      { say: 'ch3.ev.lookout.2', who: 'companion' },
      { give: 'shiny_pebble' }
    ]
  },
  {
    id: 'c3_letter1',
    on: { enter: 'windrest' },
    delay: 700,
    then: [
      { ext: 'kiteFlight', mode: 'mail', bring: 'letter_home_1' },
      { sound: 'page' },
      { say: 'ch3.ev.letter1.1', who: 'kid' },
      { say: 'ch3.ev.letter1.2', who: 'letter' },
      { run: 'ch3.letter1' },
      { give: 'letter_home_1' },
      { say: 'ch3.ev.letter1.3', who: 'companion' }
    ]
  },
  {
    id: 'c3_keeper',
    on: { talk: 'kite_keeper' },
    if: { not: { ext: 'spell', has: 'shield' } },
    once: false,
    then: [
      { say: 'ch3.ev.keeper.1', who: 'kite_keeper' },
      { say: 'ch3.ev.keeper.2', who: 'kite_keeper' },
      { say: 'ch3.ev.keeper.3', who: 'kite_keeper' },
      { ext: 'draw', sigil: 'shield', text: 'ch3.ev.keeper.draw' },
      { flag: 'c3:ward' },
      { ext: 'learn', spell: 'shield' },
      { sound: 'wand' },
      { say: 'ch3.ev.keeper.4', who: 'kite_keeper' },
      { say: 'ch3.ev.keeper.5', who: 'companion' }
    ]
  },
  {
    id: 'c3_kitewick',
    on: { enter: 'kitewick' },
    delay: 500,
    then: [
      { say: 'ch3.ev.kitewick.1', who: 'kid' },
      { say: 'ch3.ev.kitewick.2', who: 'companion' },
      { say: 'ch3.ev.kitewick.3', who: 'kid' }
    ]
  },
  {
    id: 'c3_bridge',
    on: { area: { map: 'kitewick', x: [47, 49], y: [18, 21] }, rearm: true },
    if: { not: 'c3:bridge' },
    once: false,
    then: [{ run: 'ch3.bridge' }]
  },
  {
    id: 'c3_wila',
    on: { talk: 'wila' },
    if: { not: 'c3:kite:note' },
    once: false,
    then: [
      {
        if: { not: 'c3:kite:asked' },
        then: [
          { say: 'ch3.ev.wila.1', who: 'wila' },
          { say: 'ch3.ev.wila.2', who: 'wila' },
          { say: 'ch3.ev.wila.3', who: 'wila' },
          { say: 'ch3.ev.wila.4', who: 'wila' },
          { flag: 'c3:kite:asked' },
          { quest: 'lostkite', start: true },
          { stop: true }
        ]
      },
      { run: 'ch3.kiteflight' }
    ]
  },
  {
    id: 'c3_cole',
    on: { talk: 'cole' },
    if: { all: [{ map: 'kitewick' }, { not: 'c3:cole:met' }] },
    thenService: false,
    then: [
      { say: 'ch3.ev.cole.1', who: 'cole' },
      { say: 'ch3.ev.cole.2', who: 'cole' },
      { say: 'ch3.ev.cole.3', who: 'cole' },
      { say: 'ch3.ev.cole.4', who: 'cole' },
      { flag: 'c3:cole:met' },
      { run: 'ch3.svc.cole' }
    ]
  },
  {
    id: 'c3_oda',
    on: { talk: 'oda' },
    if: { not: 'c3:bell' },
    once: false,
    then: [
      {
        if: { not: 'c3:bell:asked' },
        then: [
          { say: 'ch3.ev.oda.1', who: 'oda' },
          { say: 'ch3.ev.oda.2', who: 'oda' },
          { say: 'ch3.ev.oda.3', who: 'oda' },
          { flag: 'c3:bell:asked' },
          { quest: 'bell', start: true }
        ]
      },
      { run: 'ch3.bell' }
    ]
  },
  {
    id: 'c3_ama',
    on: { talk: 'ama' },
    if: { all: ['c3:bridge', { not: 'c3:family' }] },
    then: [{ run: 'ch3.family' }]
  },
  {
    id: 'c3_bridges',
    on: { enter: 'gale_bridges' },
    if: { not: 'c3:vanes' },
    delay: 500,
    then: [
      { say: 'ch3.ev.bridges.1', who: 'lio' },
      { say: 'ch3.ev.bridges.2', who: 'lio' },
      { say: 'ch3.ev.bridges.3', who: 'lio' }
    ]
  },
  {
    id: 'c3_loft_door',
    on: { door: { map: 'gale_bridges', to: 'gale_loft' }, block: true },
    if: { not: 'c3:vanes' },
    once: false,
    then: [{ say: 'ch3.ev.bridges.4', who: 'kid' }]
  },
  {
    id: 'c3_zephra',
    on: { talk: 'zephra' },
    if: { not: 'c3:ring' },
    once: false,
    then: [
      {
        branch: [
          {
            if: { not: 'c3:zephra' },
            then: [
              { say: 'ch3.ev.zephra.1', who: 'zephra' },
              { say: 'ch3.ev.zephra.2', who: 'zephra' },
              { say: 'ch3.ev.zephra.3', who: 'zephra' },
              { say: 'ch3.ev.zephra.4', who: 'zephra' },
              { flag: 'c3:zephra' },
              { run: 'ch3.bells.try' }
            ]
          },
          { if: { not: 'c3:wand' }, then: [{ run: 'ch3.bells.try' }] },
          { if: { not: 'c3:tolle' }, then: [{ say: 'ch3.ev.zephra.5', who: 'zephra' }] }
        ],
        else: [{ run: 'ch3.ringduel' }]
      }
    ]
  },
  {
    id: 'c3_sef',
    on: { talk: 'sef' },
    if: { not: { ext: 'spell', has: 'shield' } },
    once: false,
    then: [
      { say: 'ch3.ev.sef.1', who: 'sef' },
      { say: 'ch3.ev.sef.2', who: 'sef' },
      { ext: 'draw', sigil: 'shield', text: 'ch3.ev.keeper.draw' },
      { flag: 'c3:ward' },
      { ext: 'learn', spell: 'shield' },
      { sound: 'wand' },
      { say: 'ch3.ev.sef.3', who: 'sef' },
      { say: 'ch3.ev.keeper.5', who: 'companion' }
    ]
  },
  {
    id: 'c3_loft_enter',
    on: { enter: 'gale_loft' },
    once: false,
    then: [{ unflag: 'c3:loft:rested' }]
  },
  {
    id: 'c3_tolle',
    on: { talk: 'tolle' },
    if: { not: 'c3:tolle' },
    once: false,
    then: [
      { if: { not: { ext: 'spell', has: 'shield' } }, then: [{ say: 'ch3.ev.tolle.1b', who: 'tolle' }, { stop: true }] },
      { if: { not: 'c3:wand' }, then: [{ say: 'ch3.ev.tolle.1', who: 'tolle' }, { stop: true }] },
      { say: 'ch3.ev.tolle.2', who: 'tolle' },
      { say: 'ch3.ev.tolle.3', who: 'tolle' },
      {
        choose: [
          { text: 'ch3.ev.tolle.opt', then: [] },
          { text: 'ch2.ev.notyet', then: [{ say: 'ch3.ev.tolle.4', who: 'tolle' }, { stop: true }] }
        ],
        cancel: 1
      },
      {
        battle: { opponent: 'tolle' },
        after: 'wake',
        won: [
          { flag: 'c3:tolle' },
          { say: 'ch3.ev.tolle.5', who: 'tolle' },
          { say: 'ch3.ev.tolle.6', who: 'tolle' },
          { say: 'ch3.ev.tolle.7', who: 'companion' }
        ],
        else: [{ say: 'ch3.ev.tolle.8', who: 'tolle' }]
      }
    ]
  },
  {
    id: 'c3_letter2',
    on: { auto: true },
    if: { all: ['c3:ring', { map: 'kitewick' }] },
    then: [
      { wait: 600 },
      { ext: 'kiteFlight', mode: 'mail', bring: 'letter_home_2' },
      { sound: 'page' },
      { say: 'ch3.ev.letter2.1', who: 'kid' },
      { run: 'ch3.letter2' },
      { give: 'letter_home_2' },
      { flag: 'c3:complete' },
      { say: 'ch3.ev.letter2.2', who: 'companion' }
    ]
  },
  {
    id: 'c3_saddle',
    on: { auto: true },
    if: { all: ['visited:kitewick', { indoor: false }, { ext: 'lead', stage: { gte: 3 } }, { not: { has: 'saddle' } }] },
    then: [{ wait: 400 }, { say: 'ch3.ev.saddle.1', who: 'companion' }, { say: 'ch3.ev.saddle.2', who: 'kid' }]
  }
];
