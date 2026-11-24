/*
 * ch5/people.js
 * Job: everyone of chapter 5 (schema section 3): a pedlar at the road camp halfway up the coast road, Coilhaven
 * (tavern, shop, Master Ashfield's workshop in house 1, the lamplighter's family in house 2, two Storm Works
 * workers in house 3, the clockmaker in house 4), the Tinker's Shed, the linesman at the circuit door on
 * Sparkmoor, and the Storm Works (Apprentice Pim, Foreman Grell, Warden Volta Quill, one per duel floor).
 * The two grey cloaks appear only through spawn commands. Cole is chapter 1's person: his Coilhaven place is a
 * phase there (flag c5:cole, the "cole" spot of coilhaven_h1). Places follow the maps lane's spots; each look is
 * the person's own (key = id), except the grey cloaks, who share the look "greycloak".
 */

export default [
  {
    id: 'suri',
    name: 'ch5.name.suri',
    look: 'suri',
    at: { map: 'coast_road', x: 7, y: 33, dir: 0 },
    lines: ['ch5.p.suri.1', 'ch5.p.suri.2'],
    phases: [{ if: 'c5:suri', lines: ['ch5.p.suri.3', 'ch5.p.suri.4'] }]
  },
  {
    id: 'ch_innkeeper',
    name: 'ch5.name.ch_innkeeper',
    look: 'ch_innkeeper',
    at: { map: 'coilhaven_tavern', x: 13, y: 3, dir: 0 },
    lines: ['ch5.p.ch_innkeeper.1', 'ch5.p.ch_innkeeper.2'],
    service: 'ch5.svc.ramen'
  },
  {
    id: 'ch_shopkeeper',
    name: 'ch5.name.ch_shopkeeper',
    look: 'ch_shopkeeper',
    at: { map: 'coilhaven_shop', x: 7, y: 3, dir: 0 },
    lines: ['ch5.p.ch_shopkeeper.1', 'ch5.p.ch_shopkeeper.2'],
    service: 'shared.svc.shop'
  },
  {
    id: 'tinker',
    name: 'ch5.name.tinker',
    look: 'tinker',
    at: { map: 'tinker_shed', x: 7, y: 3, dir: 0 },
    lines: ['ch5.p.tinker.1', 'ch5.p.tinker.2'],
    phases: [{ if: 'c5:spark', lines: ['ch5.p.tinker.3', 'ch5.p.tinker.4'] }]
  },
  {
    id: 'bram_ashfield',
    name: 'ch5.name.bram_ashfield',
    look: 'bram_ashfield',
    at: { map: 'coilhaven_h1', x: 3, y: 4, dir: 0 },
    lines: ['ch5.p.ashfield.1', 'ch5.p.ashfield.2'],
    phases: [
      { if: 'c5:choice', lines: ['ch5.p.ashfield.3', 'ch5.p.ashfield.4'] },
      { if: 'c5:ashfield', lines: ['ch5.p.ashfield.5', 'ch5.p.ashfield.6'] }
    ]
  },
  {
    id: 'joss',
    name: 'ch5.name.joss',
    look: 'joss',
    at: { map: 'coilhaven', x: 28, y: 23, dir: 1 },
    lines: ['ch5.p.joss.1', 'ch5.p.joss.2'],
    schedule: [
      { from: 6, to: 22 },
      { from: 22, to: 6, map: 'coilhaven_h2', x: 6, y: 4, dir: 0, lines: ['ch5.p.joss.3', 'ch5.p.joss.4'] }
    ],
    phases: [
      { if: 'c5:spoke', lines: ['ch5.p.joss.5', 'ch5.p.joss.6'] },
      { if: 'c5:quiet', lines: ['ch5.p.joss.7', 'ch5.p.joss.8'] },
      /* chapter 9: the workers who remember the square stand up in the crowd at Halo Court */
      { if: { all: ['c9:crowd', 'c5:spoke'] }, at: { map: 'halo_court', x: 28, y: 14, dir: 2 }, schedule: null, lines: ['ch9.p.joss.1', 'ch9.p.joss.2'] }
    ]
  },
  {
    id: 'tib',
    name: 'ch5.name.tib',
    look: 'tib',
    at: { map: 'coilhaven_h2', x: 10, y: 6, dir: 0 },
    lines: ['ch5.p.tib.1', 'ch5.p.tib.2'],
    phases: [{ if: 'c5:spark', lines: ['ch5.p.tib.3', 'ch5.p.tib.4'] }]
  },
  {
    id: 'peg',
    name: 'ch5.name.peg',
    look: 'peg',
    at: { map: 'coilhaven_h3', x: 4, y: 5, dir: 0 },
    lines: ['ch5.p.peg.1', 'ch5.p.peg.2'],
    phases: [{ if: 'c5:ring', lines: ['ch5.p.peg.3', 'ch5.p.peg.4'] }]
  },
  {
    id: 'rudd',
    name: 'ch5.name.rudd',
    look: 'rudd',
    at: { map: 'coilhaven_h3', x: 10, y: 5, dir: 0 },
    lines: ['ch5.p.rudd.1', 'ch5.p.rudd.2'],
    phases: [
      { if: 'c5:spoke', lines: ['ch5.p.rudd.3', 'ch5.p.rudd.4'] },
      { if: 'c5:quiet', lines: ['ch5.p.rudd.5', 'ch5.p.rudd.6'] },
      { if: { all: ['c9:crowd', 'c5:spoke'] }, at: { map: 'halo_court', x: 28, y: 16, dir: 2 }, schedule: null, lines: ['ch9.p.rudd.1', 'ch9.p.rudd.2'] }
    ]
  },
  {
    id: 'hettie',
    name: 'ch5.name.hettie',
    look: 'hettie',
    at: { map: 'coilhaven_h4', x: 4, y: 4, dir: 0 },
    lines: ['ch5.p.hettie.1', 'ch5.p.hettie.2'],
    phases: [{ if: 'c5:clock', lines: ['ch5.p.hettie.3', 'ch5.p.hettie.4'] }]
  },
  {
    id: 'dov',
    name: 'ch5.name.dov',
    look: 'dov',
    /* maps lane spot "tester": at the edge of the yard, clear of every switch tile */
    at: { map: 'sparkmoor', x: 16, y: 17, dir: 1 },
    lines: ['ch5.p.dov.1', 'ch5.p.dov.2'],
    service: 'ch5.svc.circuit'
  },
  {
    id: 'pim',
    name: 'ch5.name.pim',
    look: 'pim',
    at: { map: 'storm_works', x: 15, y: 21, dir: 0 },
    lines: ['ch5.p.pim.1', 'ch5.p.pim.2'],
    phases: [
      { if: { all: ['c5:pim', 'c5:spoke'] }, lines: ['ch5.p.pim.3', 'ch5.p.pim.4'] },
      { if: { all: ['c5:pim', 'c5:quiet'] }, lines: ['ch5.p.pim.5', 'ch5.p.pim.6'] },
      /* chapter 9: Pim comes to Halo Court whatever was chosen in the square */
      { if: 'c9:crowd', at: { map: 'halo_court', x: 28, y: 13, dir: 2 }, schedule: null, lines: ['ch9.p.pim.1', 'ch9.p.pim.2'] }
    ]
  },
  {
    id: 'foreman',
    name: 'ch5.name.foreman',
    look: 'foreman',
    at: { map: 'storm_works', x: 15, y: 15, dir: 0 },
    lines: ['ch5.p.foreman.1', 'ch5.p.foreman.2'],
    phases: [{ if: 'c5:foreman', lines: ['ch5.p.foreman.3', 'ch5.p.foreman.4'] }]
  },
  {
    id: 'volta',
    name: 'ch5.name.volta',
    look: 'volta',
    at: { map: 'storm_works', x: 15, y: 8, dir: 0 },
    lines: ['ch5.p.volta.1', 'ch5.p.volta.2']
  },
  {
    id: 'greycloak_road1',
    name: 'ch5.name.greycloak',
    look: 'greycloak',
    at: null,
    lines: ['ch5.p.greycloak.1'],
    spawned: true
  },
  {
    id: 'greycloak_road2',
    name: 'ch5.name.greycloak',
    look: 'greycloak',
    at: null,
    lines: ['ch5.p.greycloak.2'],
    spawned: true
  }
];
