/*
 * ch7/people.js
 * Job: everyone of chapter 7 (schema section 3): Ottar the road-mender at his warm stone halfway along the Ash
 * Road, Cinderreach (tavern, shop, the glassblower in house 1, old Marro who saw the night of the jars in
 * house 2, Kell's sister and father in house 3, Juno of the window lights in house 4), the Smoke House,
 * Apprentice Kell (beside the carving before the Crucible until the brazier court is open, then inside the
 * door), and Warden Brasa, who keeps the empty nests warm in the Hearth Below until the kid has found the nest,
 * then waits in the ring of the Ember Crucible.
 * Cole and Mira are chapter 1's people: their Cinderreach places are phases there (flags c7:box and
 * c7:friends, places crCole, crMira, tavernCole, tavernMira). Places come from ./places.js; each look
 * is the person's own (key = id).
 */

import P from './places.js';

export default [
  {
    id: 'ottar',
    name: 'ch7.name.ottar',
    look: 'ottar',
    at: P.arCamp,
    lines: ['ch7.p.ottar.1', 'ch7.p.ottar.2'],
    phases: [{ if: 'c7:ottar', lines: ['ch7.p.ottar.3', 'ch7.p.ottar.4'] }]
  },
  {
    id: 'cr_innkeeper',
    name: 'ch7.name.cr_innkeeper',
    look: 'cr_innkeeper',
    at: P.tavernKeeper,
    lines: ['ch7.p.cr_innkeeper.1', 'ch7.p.cr_innkeeper.2'],
    service: 'ch7.svc.ramen'
  },
  {
    id: 'cr_shopkeeper',
    name: 'ch7.name.cr_shopkeeper',
    look: 'cr_shopkeeper',
    at: P.shopKeeper,
    lines: ['ch7.p.cr_shopkeeper.1', 'ch7.p.cr_shopkeeper.2'],
    service: 'shared.svc.shop'
  },
  {
    id: 'smoke_keeper',
    name: 'ch7.name.smoke_keeper',
    look: 'smoke_keeper',
    at: P.smokeKeeper,
    lines: ['ch7.p.smoke_keeper.1', 'ch7.p.smoke_keeper.2'],
    phases: [{ if: { ext: 'spell', has: 'step' }, lines: ['ch7.p.smoke_keeper.3', 'ch7.p.smoke_keeper.4'] }]
  },
  {
    id: 'sefa',
    name: 'ch7.name.sefa',
    look: 'sefa',
    at: P.h1Sefa,
    lines: ['ch7.p.sefa.1', 'ch7.p.sefa.2'],
    phases: [{ if: 'c7:kiln', lines: ['ch7.p.sefa.3', 'ch7.p.sefa.4'] }]
  },
  {
    id: 'marro',
    name: 'ch7.name.marro',
    look: 'marro',
    at: P.h2Marro,
    lines: ['ch7.p.marro.1', 'ch7.p.marro.2'],
    phases: [{ if: 'c7:nest', lines: ['ch7.p.marro.3', 'ch7.p.marro.4'] }]
  },
  {
    id: 'tilde',
    name: 'ch7.name.tilde',
    look: 'tilde',
    at: P.h3Tilde,
    lines: ['ch7.p.tilde.1', 'ch7.p.tilde.2'],
    phases: [{ if: 'c7:kell', lines: ['ch7.p.tilde.3', 'ch7.p.tilde.4'] }]
  },
  {
    id: 'rusk',
    name: 'ch7.name.rusk',
    look: 'rusk',
    at: P.h3Rusk,
    lines: ['ch7.p.rusk.1', 'ch7.p.rusk.2']
  },
  {
    id: 'juno',
    name: 'ch7.name.juno',
    look: 'juno',
    at: P.h4Juno,
    lines: ['ch7.p.juno.1', 'ch7.p.juno.2'],
    phases: [{ if: 'c7:juno', lines: ['ch7.p.juno.3', 'ch7.p.juno.4'] }]
  },
  {
    id: 'kell',
    name: 'ch7.name.kell',
    look: 'kell',
    at: P.crKell,
    lines: ['ch7.p.kell.1', 'ch7.p.kell.2'],
    service: 'ch7.svc.kell',
    phases: [
      { if: 'c7:braziers', at: P.ecKell, lines: ['ch7.p.kell.5', 'ch7.p.kell.6'] },
      { if: 'c7:kell', at: P.ecKell, lines: ['ch7.p.kell.3', 'ch7.p.kell.4'] }
    ]
  },
  {
    id: 'brasa',
    name: 'ch7.name.brasa',
    look: 'brasa',
    at: P.hbBrasa,
    lines: ['ch7.p.brasa.1', 'ch7.p.brasa.2'],
    phases: [
      { if: 'c7:brasa', at: P.ecBrasa, lines: ['ch7.p.brasa.3', 'ch7.p.brasa.4'] },
      { if: 'c7:ring', at: P.ecBrasa, lines: ['ch7.p.brasa.5', 'ch7.p.brasa.6'] }
    ]
  }
];
