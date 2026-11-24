/*
 * ch4/people.js
 * Job: everyone of chapter 4 (schema section 3): the ferryman, Tidewell (tavern, shop, four houses, the harbour),
 * the Lullaby Boat, the Saltmarsh rest spot, the Sunken Stair and Deepbell Hall.
 * The ferryman stays on the deck of the ferry, the crossing between Kitewick's jetty and Tidewell's pier.
 * Maren waits by the flooded causeway until the bell is raised; Isk keeps the tide wheels until then.
 * Mira (chapter 1's person) is home in Tidewell through a phase in chapter 1. Every spot comes from ./places.js.
 */

import P from './places.js';

export default [
  {
    id: 'ferryman',
    name: 'ch4.name.ferryman',
    look: 'ferryman',
    at: P.ferryman,
    lines: ['ch4.p.ferryman.1', 'ch4.p.ferryman.2']
  },
  {
    id: 'td_innkeeper',
    name: 'ch4.name.td_innkeeper',
    look: 'td_innkeeper',
    at: P.tavernKeeper,
    lines: ['ch4.p.td_innkeeper.1', 'ch4.p.td_innkeeper.2'],
    service: 'ch4.svc.ramen'
  },
  {
    id: 'td_shopkeeper',
    name: 'ch4.name.td_shopkeeper',
    look: 'td_shopkeeper',
    at: P.shopKeeper,
    lines: ['ch4.p.td_shopkeeper.1', 'ch4.p.td_shopkeeper.2'],
    service: 'shared.svc.shop'
  },
  {
    id: 'lullaby_keeper',
    name: 'ch4.name.lullaby_keeper',
    look: 'lullaby_keeper',
    at: P.boatKeeper,
    lines: ['ch4.p.lullaby_keeper.1', 'ch4.p.lullaby_keeper.2'],
    phases: [{ if: 'c4:bell', lines: ['ch4.p.lullaby_keeper.3', 'ch4.p.lullaby_keeper.4'] }]
  },
  {
    id: 'lisel',
    name: 'ch4.name.lisel',
    look: 'lisel',
    at: P.h1Lisel,
    lines: ['ch4.p.lisel.1', 'ch4.p.lisel.2'],
    phases: [
      { if: 'c4:lisel', lines: ['ch4.p.lisel.3', 'ch4.p.lisel.4'] },
      /* chapter 9: she comes to Goldmere, ready to see */
      { if: 'c9:family', at: { map: 'goldmere', x: 41, y: 26, dir: 2 }, schedule: null, lines: ['ch9.p.lisel.1', 'ch9.p.lisel.2'] },
      { if: 'c9:tourney', at: { map: 'halo_court', x: 6, y: 14, dir: 3 }, schedule: null, lines: ['ch9.p.lisel.3', 'ch9.p.lisel.4'] }
    ]
  },
  {
    id: 'sava',
    name: 'ch4.name.sava',
    look: 'sava',
    at: P.h3Sava,
    lines: ['ch4.p.sava.1', 'ch4.p.sava.2'],
    phases: [{ if: 'c4:bell', lines: ['ch4.p.sava.3', 'ch4.p.sava.4'] }]
  },
  {
    id: 'nell',
    name: 'ch4.name.nell',
    look: 'nell',
    at: P.tdNell,
    lines: ['ch4.p.nell.1', 'ch4.p.nell.2'],
    schedule: [
      { from: 7, to: 19 },
      { from: 19, to: 7, ...P.h4Nell, lines: ['ch4.p.nell.3', 'ch4.p.nell.4'] }
    ]
  },
  {
    id: 'jory',
    name: 'ch4.name.jory',
    look: 'jory',
    at: P.tdJory,
    lines: ['ch4.p.jory.1', 'ch4.p.jory.2'],
    schedule: [
      { from: 7, to: 19 },
      { from: 19, to: 7, ...P.h2Jory, lines: ['ch4.p.jory.3', 'ch4.p.jory.4'] }
    ],
    phases: [{ if: 'c4:bell', lines: ['ch4.p.jory.5', 'ch4.p.jory.6'] }]
  },
  {
    id: 'doran',
    name: 'ch4.name.doran',
    look: 'doran',
    at: P.tdDoran,
    lines: ['ch4.p.doran.1', 'ch4.p.doran.2'],
    schedule: [
      { from: 7, to: 18 },
      { from: 18, to: 7, ...P.h2Doran, lines: ['ch4.p.doran.3', 'ch4.p.doran.4'] }
    ]
  },
  {
    id: 'hollis',
    name: 'ch4.name.hollis',
    look: 'hollis',
    at: P.smHollis,
    lines: ['ch4.p.hollis.1', 'ch4.p.hollis.2'],
    service: 'ch4.svc.hollis'
  },
  {
    id: 'isk',
    name: 'ch4.name.isk',
    look: 'isk',
    at: P.ssIsk,
    lines: ['ch4.p.isk.1', 'ch4.p.isk.2'],
    service: 'ch4.svc.wheels',
    phases: [{ if: 'c4:bell', at: P.hallIsk, lines: ['ch4.p.isk.3', 'ch4.p.isk.4'] }]
  },
  {
    id: 'maren',
    name: 'ch4.name.maren',
    look: 'maren',
    at: P.tdMaren,
    lines: ['ch4.p.maren.1', 'ch4.p.maren.2'],
    phases: [{ if: 'c4:bell', at: P.hallMaren, lines: ['ch4.p.maren.3', 'ch4.p.maren.4'] }]
  }
];
