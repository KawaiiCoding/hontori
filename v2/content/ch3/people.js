/*
 * ch3/people.js
 * Job: everyone of chapter 3 (schema section 3): the rockslide crew in Mossgrove, Windrest and the Kite House,
 * Kitewick (tavern, shop, four houses, the kite post, the bell tower), the Gale Bridges and Gale Loft.
 * Hask mends the rope bridge from Kitewick to the Gale Bridges. Orlen Vael appears only through a spawn command. Cole is chapter 1's person: his Kitewick place is a phase there.
 * Places on the new maps follow the maps lane's spots; each look is the person's own (key = id).
 */

export default [
  {
    id: 'dunn',
    name: 'ch3.name.dunn',
    look: 'dunn',
    at: { map: 'mossgrove', x: 36, y: 17, dir: 2 },
    lines: ['ch3.p.dunn.1', 'ch3.p.dunn.2'],
    phases: [{ if: 'ch3:open', lines: ['ch3.p.dunn.3', 'ch3.p.dunn.4'] }]
  },
  {
    id: 'kite_keeper',
    name: 'ch3.name.kite_keeper',
    look: 'kite_keeper',
    at: { map: 'kite_house', x: 7, y: 3, dir: 0 },
    lines: ['ch3.p.kite_keeper.1', 'ch3.p.kite_keeper.2'],
    service: 'ch3.svc.keeper',
    phases: [{ if: 'c3:bridge', lines: ['ch3.p.kite_keeper.3', 'ch3.p.kite_keeper.4'] }]
  },
  {
    id: 'hask',
    name: 'ch3.name.hask',
    look: 'hask',
    at: { map: 'kitewick', x: 48, y: 20, dir: 3 },
    lines: ['ch3.p.hask.1', 'ch3.p.hask.2'],
    service: 'ch3.svc.hask',
    phases: [
      { if: 'c3:bridge', lines: ['ch3.p.hask.3', 'ch3.p.hask.3b'] },
      {
        if: 'c3:family',
        lines: ['ch3.p.hask.4', 'ch3.p.hask.5'],
        schedule: [
          { from: 7, to: 18 },
          { from: 18, to: 7, map: 'kitewick_h2', x: 5, y: 5, dir: 0, lines: ['ch3.p.hask.6', 'ch3.p.hask.7'] }
        ]
      }
    ]
  },
  {
    id: 'ola',
    name: 'ch3.name.ola',
    look: 'ola',
    at: { map: 'windrest', x: 16, y: 9, dir: 0 },
    lines: ['ch3.p.ola.1', 'ch3.p.ola.2']
  },
  {
    id: 'orlen',
    name: 'ch3.name.orlen',
    look: 'orlen',
    at: null,
    lines: ['ch3.p.orlen.1'],
    spawned: true
  },
  {
    id: 'kw_innkeeper',
    name: 'ch3.name.kw_innkeeper',
    look: 'kw_innkeeper',
    at: { map: 'kitewick_tavern', x: 12, y: 3, dir: 0 },
    lines: ['ch3.p.kw_innkeeper.1', 'ch3.p.kw_innkeeper.2'],
    service: 'ch3.svc.ramen'
  },
  {
    id: 'kw_shopkeeper',
    name: 'ch3.name.kw_shopkeeper',
    look: 'kw_shopkeeper',
    at: { map: 'kitewick_shop', x: 7, y: 3, dir: 0 },
    lines: ['ch3.p.kw_shopkeeper.1', 'ch3.p.kw_shopkeeper.2'],
    service: 'shared.svc.shop'
  },
  {
    id: 'wila',
    name: 'ch3.name.wila',
    look: 'wila',
    at: { map: 'kitewick', x: 26, y: 21, dir: 0 },
    lines: ['ch3.p.wila.1', 'ch3.p.wila.2'],
    schedule: [
      { from: 7, to: 21 },
      { from: 21, to: 7, map: 'kitewick_h1', x: 5, y: 4, dir: 0, lines: ['ch3.p.wila.3', 'ch3.p.wila.4'] }
    ]
  },
  {
    id: 'ama',
    name: 'ch3.name.ama',
    look: 'ama',
    at: { map: 'kitewick_h2', x: 3, y: 3, dir: 0 },
    lines: ['ch3.p.ama.1', 'ch3.p.ama.2'],
    phases: [{ if: 'c3:family', lines: ['ch3.p.ama.3', 'ch3.p.ama.4'] }]
  },
  {
    id: 'rue',
    name: 'ch3.name.rue',
    look: 'rue',
    at: { map: 'kitewick_h2', x: 9, y: 5, dir: 0 },
    lines: ['ch3.p.rue.1', 'ch3.p.rue.2'],
    phases: [{ if: 'c3:family', lines: ['ch3.p.rue.3', 'ch3.p.rue.4'] }]
  },
  {
    id: 'oda',
    name: 'ch3.name.oda',
    look: 'oda',
    at: { map: 'kitewick', x: 50, y: 9, dir: 3 },
    lines: ['ch3.p.oda.1', 'ch3.p.oda.2'],
    schedule: [
      { from: 7, to: 19 },
      { from: 19, to: 7, map: 'kitewick_h3', x: 3, y: 5, dir: 0, lines: ['ch3.p.oda.3', 'ch3.p.oda.4'] }
    ],
    phases: [{ if: 'c3:bell', lines: ['ch3.p.oda.5', 'ch3.p.oda.6'] }]
  },
  {
    id: 'brisk',
    name: 'ch3.name.brisk',
    look: 'brisk',
    at: { map: 'kitewick_h4', x: 4, y: 4, dir: 0 },
    lines: ['ch3.p.brisk.1', 'ch3.p.brisk.2'],
    phases: [{ if: { has: 'token' }, lines: ['ch3.p.brisk.3', 'ch3.p.brisk.4'] }]
  },
  {
    id: 'nim',
    name: 'ch3.name.nim',
    look: 'nim',
    at: { map: 'kitewick', x: 29, y: 33, dir: 1 },
    lines: ['ch3.p.nim.1', 'ch3.p.nim.2'],
    schedule: [{ from: 7, to: 19 }, { from: 19, to: 7, away: true }]
  },
  {
    id: 'lio',
    name: 'ch3.name.lio',
    look: 'lio',
    at: { map: 'gale_bridges', x: 10, y: 38, dir: 2 },
    lines: ['ch3.p.lio.1', 'ch3.p.lio.2'],
    service: 'ch3.svc.vanes'
  },
  {
    id: 'zephra',
    name: 'ch3.name.zephra',
    look: 'zephra',
    at: { map: 'gale_loft', x: 13, y: 8, dir: 0 },
    lines: ['ch3.p.zephra.1', 'ch3.p.zephra.2']
  },
  {
    id: 'sef',
    name: 'ch3.name.sef',
    look: 'sef',
    at: { map: 'gale_loft', x: 4, y: 13, dir: 0 },
    lines: ['ch3.p.sef.1', 'ch3.p.sef.2']
  },
  {
    id: 'tolle',
    name: 'ch3.name.tolle',
    look: 'tolle',
    at: { map: 'gale_loft', x: 13, y: 16, dir: 0 },
    lines: ['ch3.p.tolle.1', 'ch3.p.tolle.2']
  }
];
