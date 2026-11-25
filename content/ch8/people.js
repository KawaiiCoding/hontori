/*
 * ch8/people.js
 * Job: everyone of chapter 8 (schema section 3): Old Wick in her hollow tree halfway through the Mothwood,
 * Duskmere (tavern, Tallow's favour shop, Pella and her father Cobb in house 1 (and Smudge, Pella's
 * shadepup, lost in the Mothwood until the kid carries him home), Linnet in house 2, Edda and the
 * cellar of hidden hontori in house 3, house 4 empty until Merrit lodges there), the Lantern Room, and Warden
 * Nox Ardley, who comes up to the square once the kid has met her and goes back to Hollow Moon after the
 * captain's attack. The Council captain and the cloak beside him appear only through spawn commands.
 * The grey cloak from Mossgrove is chapter 2's person "greycloak" (also spawned): their name, Merrit, is told in
 * this chapter. Every spot comes from ./places.js; each look is the person's own (key = id).
 */

import P from './places.js';

export default [
  {
    id: 'wick',
    name: 'ch8.name.wick',
    look: 'wick',
    at: P.mwWick,
    lines: ['ch8.p.wick.1', 'ch8.p.wick.2'],
    phases: [{ if: 'c8:tin', lines: ['ch8.p.wick.3', 'ch8.p.wick.4'] }]
  },
  {
    id: 'dm_innkeeper',
    name: 'ch8.name.dm_innkeeper',
    look: 'dm_innkeeper',
    at: P.tavernKeeper,
    lines: ['ch8.p.dm_innkeeper.1', 'ch8.p.dm_innkeeper.2'],
    service: 'ch8.svc.ramen',
    phases: [{ if: 'c8:captain', lines: ['ch8.p.dm_innkeeper.3', 'ch8.p.dm_innkeeper.4'] }]
  },
  {
    id: 'dm_shopkeeper',
    name: 'ch8.name.dm_shopkeeper',
    look: 'dm_shopkeeper',
    at: P.shopKeeper,
    lines: ['ch8.p.dm_shopkeeper.1', 'ch8.p.dm_shopkeeper.2'],
    service: 'ch8.svc.tallow'
  },
  {
    id: 'lantern_keeper',
    name: 'ch8.name.lantern_keeper',
    look: 'lantern_keeper',
    at: P.lanternKeeper,
    lines: ['ch8.p.lantern_keeper.1', 'ch8.p.lantern_keeper.2'],
    phases: [{ if: 'c8:sigil', lines: ['ch8.p.lantern_keeper.3', 'ch8.p.lantern_keeper.4'] }]
  },
  {
    id: 'pella',
    name: 'ch8.name.pella',
    look: 'pella',
    at: P.h1Pella,
    lines: ['ch8.p.pella.1', 'ch8.p.pella.2'],
    phases: [{ if: 'c8:pup:back', lines: ['ch8.p.pella.3', 'ch8.p.pella.4'] }]
  },
  {
    id: 'cobb',
    name: 'ch8.name.cobb',
    look: 'cobb',
    at: P.h1Cobb,
    lines: ['ch8.p.cobb.1', 'ch8.p.cobb.2'],
    phases: [{ if: 'c8:captain', lines: ['ch8.p.cobb.3', 'ch8.p.cobb.4'] }]
  },
  {
    id: 'linnet',
    name: 'ch8.name.linnet',
    look: 'linnet',
    at: P.h2Linnet,
    lines: ['ch8.p.linnet.1', 'ch8.p.linnet.2'],
    phases: [{ if: 'c8:tin', lines: ['ch8.p.linnet.3', 'ch8.p.linnet.4'] }]
  },
  {
    id: 'edda',
    name: 'ch8.name.edda',
    look: 'edda',
    at: P.h3Edda,
    lines: ['ch8.p.edda.1', 'ch8.p.edda.2'],
    phases: [{ if: 'c8:hidden', lines: ['ch8.p.edda.3', 'ch8.p.edda.4'] }]
  },
  {
    id: 'smudge',
    name: 'ch8.name.smudge',
    look: 'shadepup',
    at: P.mwPup,
    lines: ['ch8.p.smudge.1', 'ch8.p.smudge.1'],
    phases: [{ if: 'c8:pup:back', at: P.h1Smudge, lines: ['ch8.p.smudge.2', 'ch8.p.smudge.2'] }],
    goneIf: { all: ['c8:pup', { not: 'c8:pup:back' }] }
  },
  {
    id: 'nox',
    name: 'ch8.name.nox',
    look: 'nox',
    at: P.hmNox,
    lines: ['ch8.p.nox.1', 'ch8.p.nox.2'],
    phases: [
      { if: { all: ['c8:nox', { not: 'c8:captain' }] }, at: P.dmNox, lines: ['ch8.p.nox.3', 'ch8.p.nox.4'] },
      { if: 'c8:ring', lines: ['ch8.p.nox.5', 'ch8.p.nox.6'] },
      /* chapter 10: the Athenaeum hall, Vael's garden, then home or the fair */
      { if: { all: ['c10:vael', { not: 'c10:law' }] }, at: { map: 'athenaeum', x: 10, y: 12, dir: 3 }, schedule: null, lines: ['ch10.p.nox.1', 'ch10.p.nox.2'] },
      { if: 'c10:law', lines: ['ch10.p.nox.3', 'ch10.p.nox.4'] }
    ]
  },
  {
    id: 'captain',
    name: 'ch8.name.captain',
    look: 'captain',
    at: null,
    lines: ['ch8.p.captain.1'],
    spawned: true
  }
];
