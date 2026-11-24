/*
 * ch9/people.js
 * Job: everyone of chapter 9 (schema section 3): Goldmere (the Gilded Spoon tavern, Fennick's shop, Archivist
 * Benedek in house 1, Hester and her son Tobbe and his "imaginary" friend in house 2, Guard Rowe in house 3, old
 * Perrin who remembers the world before the law in house 4), the Glasshouse, Wendel who tends Vael's garden (the lawn of covered jars),
 * Apprentice Lys (at the Mirror Gardens until the gate is reached, then herald of the tournament), Warden Aurel
 * at Halo Court, and the four ring holders of the tournament (th1 to th4), who wait at the arena edge.
 * Orlen Vael (chapter 3's person "orlen", spawned) is brought on stage by spawn commands in every scene.
 *
 * Returning people stand in Goldmere through phases in their own folders. The lead adds (places from ./places.js):
 *   ch1 cole:  { if: { all: ['c9:gate', { not: 'c9:tourney' }] }, at: gmCole, lines: ['ch9.p.cole.1', 'ch9.p.cole.2'] }
 *              { if: 'c9:tourney', at: hcCole, lines: ['ch9.p.cole.3', 'ch9.p.cole.4'] }
 *              { if: 'c9:ring', at: hcCole, lines: ['ch9.p.cole.5', 'ch9.p.cole.6'] }
 *   ch1 mira:  the same with gmMira / hcMira and ch9.p.mira.1 to .6
 *   ch1 mom, dad and ch4 lisel:  { if: 'c9:family', at: gmMom / gmDad / gmLisel, lines: [ch9.p.<id>.1, .2] }
 *              { if: 'c9:tourney', at: hcMom / hcDad / hcLisel, lines: [ch9.p.<id>.3, .4] }
 *   ch5 joss, rudd (c5:spoke) and pim (c5:spoke or c5:quiet):  { if: 'c9:crowd', at: hcCrowd1 / hcCrowd2 / hcPim,
 *              lines: ['ch9.p.<id>.1', 'ch9.p.<id>.2'] }  (with c5:quiet only Pim comes)
 * Each look is the person's own (key = id).
 */

import P from './places.js';

export default [
  {
    id: 'gm_innkeeper',
    name: 'ch9.name.gm_innkeeper',
    look: 'gm_innkeeper',
    at: P.tavernKeeper,
    lines: ['ch9.p.gm_innkeeper.1', 'ch9.p.gm_innkeeper.2'],
    service: 'ch9.svc.ramen'
  },
  {
    id: 'gm_shopkeeper',
    name: 'ch9.name.gm_shopkeeper',
    look: 'gm_shopkeeper',
    at: P.shopKeeper,
    lines: ['ch9.p.gm_shopkeeper.1', 'ch9.p.gm_shopkeeper.2'],
    service: 'shared.svc.shop'
  },
  {
    id: 'glass_keeper',
    name: 'ch9.name.glass_keeper',
    look: 'glass_keeper',
    at: P.glassKeeper,
    lines: ['ch9.p.glass_keeper.1', 'ch9.p.glass_keeper.2'],
    phases: [{ if: { ext: 'spell', has: 'mirror' }, lines: ['ch9.p.glass_keeper.3', 'ch9.p.glass_keeper.4'] }]
  },
  {
    id: 'benedek',
    name: 'ch9.name.benedek',
    look: 'benedek',
    at: P.h1Benedek,
    lines: ['ch9.p.benedek.1', 'ch9.p.benedek.2'],
    phases: [{ if: 'c9:page', lines: ['ch9.p.benedek.3', 'ch9.p.benedek.4'] }]
  },
  {
    id: 'hester',
    name: 'ch9.name.hester',
    look: 'hester',
    at: P.h2Hester,
    lines: ['ch9.p.hester.1', 'ch9.p.hester.2'],
    phases: [{ if: 'c9:hester', lines: ['ch9.p.hester.3', 'ch9.p.hester.4'] }]
  },
  {
    id: 'tobbe',
    name: 'ch9.name.tobbe',
    look: 'tobbe',
    at: P.h2Child,
    lines: ['ch9.p.tobbe.1', 'ch9.p.tobbe.2'],
    phases: [{ if: 'c9:hester', lines: ['ch9.p.tobbe.3', 'ch9.p.tobbe.4'] }]
  },
  {
    id: 'rowe',
    name: 'ch9.name.rowe',
    look: 'rowe',
    at: P.h3Rowe,
    lines: ['ch9.p.rowe.1', 'ch9.p.rowe.2'],
    phases: [{ if: 'c9:ring', lines: ['ch9.p.rowe.3', 'ch9.p.rowe.4'] }]
  },
  {
    id: 'perrin',
    name: 'ch9.name.perrin',
    look: 'perrin',
    at: P.h4Perrin,
    lines: ['ch9.p.perrin.1', 'ch9.p.perrin.2']
  },
  {
    id: 'wendel',
    name: 'ch9.name.wendel',
    look: 'wendel',
    at: P.vgWendel,
    lines: ['ch9.p.wendel.1', 'ch9.p.wendel.2']
  },
  {
    id: 'lys',
    name: 'ch9.name.lys',
    look: 'lys',
    at: P.mgLys,
    lines: ['ch9.p.lys.1', 'ch9.p.lys.2'],
    service: 'ch9.svc.lys',
    phases: [{ if: 'c9:gardens', at: P.hcLys, lines: ['ch9.p.lys.3', 'ch9.p.lys.4'], service: 'ch9.svc.herald' }]
  },
  {
    id: 'aurel',
    name: 'ch9.name.aurel',
    look: 'aurel',
    at: P.hcAurel,
    lines: ['ch9.p.aurel.1', 'ch9.p.aurel.2'],
    phases: [{ if: 'c9:ring', lines: ['ch9.p.aurel.3', 'ch9.p.aurel.4'] }]
  },
  { id: 'th1', name: 'ch9.name.th1', look: 'th1', at: P.hcTh[0], lines: ['ch9.p.th1.1', 'ch9.p.th1.2'] },
  { id: 'th2', name: 'ch9.name.th2', look: 'th2', at: P.hcTh[1], lines: ['ch9.p.th2.1', 'ch9.p.th2.2'] },
  { id: 'th3', name: 'ch9.name.th3', look: 'th3', at: P.hcTh[2], lines: ['ch9.p.th3.1', 'ch9.p.th3.2'] },
  { id: 'th4', name: 'ch9.name.th4', look: 'th4', at: P.hcTh[3], lines: ['ch9.p.th4.1', 'ch9.p.th4.2'] }
];
