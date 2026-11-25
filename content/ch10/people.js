/*
 * ch10/people.js
 * Job: everyone of chapter 10 (schema section 3): Attendant Odile on the rest landing of the Athenaeum Stair,
 * the three Councillors in their chambers (Brand in the east, Vesk in the west, Hale in the high chamber), and
 * after the end the four stall keepers of the Emberbrook fair (Gil's hats, Wynn's pictures, Bex's lanterns,
 * Moll's sweets), there only once c10:complete is set.
 * Orlen Vael (chapter 3's "orlen") and Merrit (chapter 2's "greycloak") are spawned people: this chapter moves
 * them with spawn commands (./scripts.js).
 *
 * Returning people stand in the Athenaeum, the garden and Emberbrook through phases in their own folders. The
 * lead adds them (places from ./places.js; each phase also sets schedule: null; it must come after the
 * person's chapter 9 phases so it wins):
 *   HALL = { all: ['c10:vael', { not: 'c10:law' }] }     GARDEN = { all: ['c10:law', { not: 'c10:jars' }] }
 *   ch1 mira, cole:  HALL at ahMira / ahCole, lines ch10.p.<id>.1, .2; GARDEN at vgMira / vgCole, .3, .4;
 *                    { if: 'c10:jars' } at fairMira / fairCole, .5, .6
 *   ch4 lisel:       HALL at ahLisel (.1, .2); GARDEN at vgLisel (.3, .4); { if: 'c10:jars' } back at her ch4
 *                    place in Tidewell (.5, .6)
 *   ch1 wren:        HALL at ahWren (.1, .2); { if: 'c10:jars', at: fairWren } (.3, .4)
 *   ch5 pim:         HALL at ahPim (.1, .2); { if: 'c10:law' } back at his ch5 place (.3, .4)
 *   ch1 mom, dad:    HALL at ahMom / ahDad (.1, .2); { if: 'c10:law', at: homeMom / homeDad } (.3, .4)
 *   the 8 Wardens fern, zephra, maren, volta, harrow, brasa, nox, aurel (ch2 to ch9):
 *                    HALL at ahFern, ahZephra, ahMaren, ahVolta, ahHarrow, ahBrasa, ahNox, ahAurel (.1, .2);
 *                    { if: 'c10:law' } back at their own place (no at), lines ch10.p.<id>.3, .4
 *   ch2 greycloak (Merrit, spawned):  { if: 'c10:fallen', lines: ['ch10.p.merrit.1', 'ch10.p.merrit.2'] }
 *   ch3 orlen (spawned):  { if: 'c10:mercy', lines: ['ch10.p.orlen.mercy'] }, { if: 'c10:nomercy',
 *                    lines: ['ch10.p.orlen.closed'] } (his talk events in ./events.js speak first)
 * Each look is the person's own (key = id).
 */

import P from './places.js';

const AFTER = { not: 'c10:complete' };

export default [
  {
    id: 'attendant',
    name: 'ch10.name.attendant',
    look: 'attendant',
    at: P.stAttendant,
    lines: ['ch10.p.attendant.1', 'ch10.p.attendant.2'],
    service: 'ch10.svc.landing',
    phases: [{ if: 'c10:complete', lines: ['ch10.p.attendant.3', 'ch10.p.attendant.4'] }]
  },
  {
    id: 'cn_brand',
    name: 'ch10.name.cn_brand',
    look: 'cn_brand',
    at: P.ceBrand,
    lines: ['ch10.p.cn_brand.1', 'ch10.p.cn_brand.2'],
    phases: [{ if: 'c10:brand', lines: ['ch10.p.cn_brand.3', 'ch10.p.cn_brand.4'] }]
  },
  {
    id: 'cn_vesk',
    name: 'ch10.name.cn_vesk',
    look: 'cn_vesk',
    at: P.cwVesk,
    lines: ['ch10.p.cn_vesk.1', 'ch10.p.cn_vesk.2'],
    phases: [{ if: 'c10:vesk', lines: ['ch10.p.cn_vesk.3', 'ch10.p.cn_vesk.4'] }]
  },
  {
    id: 'cn_hale',
    name: 'ch10.name.cn_hale',
    look: 'cn_hale',
    at: P.chHale,
    lines: ['ch10.p.cn_hale.1', 'ch10.p.cn_hale.2'],
    phases: [{ if: 'c10:hale', lines: ['ch10.p.cn_hale.3', 'ch10.p.cn_hale.4'] }]
  },
  {
    id: 'fair_1',
    name: 'ch10.name.fair_1',
    look: 'fair_1',
    at: P.fair1,
    goneIf: AFTER,
    lines: ['ch10.p.fair_1.1', 'ch10.p.fair_1.2'],
    service: 'shared.svc.shop'
  },
  {
    id: 'fair_2',
    name: 'ch10.name.fair_2',
    look: 'fair_2',
    at: P.fair2,
    goneIf: AFTER,
    lines: ['ch10.p.fair_2.1', 'ch10.p.fair_2.2'],
    service: 'shared.svc.shop'
  },
  {
    id: 'fair_3',
    name: 'ch10.name.fair_3',
    look: 'fair_3',
    at: P.fair3,
    goneIf: AFTER,
    lines: ['ch10.p.fair_3.1', 'ch10.p.fair_3.2'],
    service: 'shared.svc.shop'
  },
  {
    id: 'fair_4',
    name: 'ch10.name.fair_4',
    look: 'fair_4',
    at: P.fair4,
    goneIf: AFTER,
    lines: ['ch10.p.fair_4.1', 'ch10.p.fair_4.2'],
    service: 'shared.svc.shop'
  }
];
