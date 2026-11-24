/*
 * ch6/people.js
 * Job: everyone of chapter 6 (schema section 3): the carter at the fire halfway up the mountain road, Stonehollow
 * (tavern, shop, Mason Agna in the square by day and at home in the Carver's House at night, Quarryman Bask
 * in the Old Quarry by day and in the Stonecutter's House at night, Old Gorse and his granddaughter Briar in the
 * Miner's House, Ottie and his mother Mara, a weaver, in the Weaver's House), the Drum
 * Circle, the Old Quarry, and Bedrock Hall (Apprentice Dunn, Warden Harrow). The Council envoy appears only
 * through a spawn command. Wren is chapter 1's person: her Stonehollow place is a phase there (flags c6:wren,
 * c6:wrenhome). Apprentice Dunn is "dunn_hollow": Foreman Dunn of Mossgrove (chapter 3) is her father.
 * Every spot comes from ./places.js; each look is the person's own (key = id).
 */

import P from './places.js';

export default [
  {
    id: 'tamsin',
    name: 'ch6.name.tamsin',
    look: 'tamsin',
    at: P.mrCamp,
    lines: ['ch6.p.tamsin.1', 'ch6.p.tamsin.2'],
    phases: [{ if: 'c6:tamsin', lines: ['ch6.p.tamsin.3', 'ch6.p.tamsin.4'] }]
  },
  {
    id: 'sh_innkeeper',
    name: 'ch6.name.sh_innkeeper',
    look: 'sh_innkeeper',
    at: P.tavernKeeper,
    lines: ['ch6.p.sh_innkeeper.1', 'ch6.p.sh_innkeeper.2'],
    service: 'ch6.svc.ramen',
    phases: [{ if: 'c6:sealed', lines: ['ch6.p.sh_innkeeper.3', 'ch6.p.sh_innkeeper.2'] }]
  },
  {
    id: 'sh_shopkeeper',
    name: 'ch6.name.sh_shopkeeper',
    look: 'sh_shopkeeper',
    at: P.shopKeeper,
    lines: ['ch6.p.sh_shopkeeper.1', 'ch6.p.sh_shopkeeper.2'],
    service: 'shared.svc.shop'
  },
  {
    id: 'drummer',
    name: 'ch6.name.drummer',
    look: 'drummer',
    at: P.drummer,
    lines: ['ch6.p.drummer.1', 'ch6.p.drummer.2'],
    phases: [{ if: 'c6:rune', lines: ['ch6.p.drummer.3', 'ch6.p.drummer.4'] }]
  },
  {
    id: 'gorse',
    name: 'ch6.name.gorse',
    look: 'gorse',
    at: P.h3Gorse,
    lines: ['ch6.p.gorse.1', 'ch6.p.gorse.2'],
    phases: [
      { if: 'c6:carvings', lines: ['ch6.p.gorse.3', 'ch6.p.gorse.4'] },
      { if: 'c6:chisel:back', lines: ['ch6.p.gorse.5', 'ch6.p.gorse.6'] }
    ]
  },
  {
    id: 'briar',
    name: 'ch6.name.briar',
    look: 'briar',
    at: P.h3Briar,
    lines: ['ch6.p.briar.1', 'ch6.p.briar.2'],
    phases: [{ if: 'c6:sealed', lines: ['ch6.p.briar.3', 'ch6.p.briar.4'] }]
  },
  {
    id: 'agna',
    name: 'ch6.name.agna',
    look: 'agna',
    at: P.shAgna,
    lines: ['ch6.p.agna.1', 'ch6.p.agna.2'],
    schedule: [
      { from: 7, to: 20 },
      { from: 20, to: 7, map: 'stonehollow_h2', x: P.h2Agna.x, y: P.h2Agna.y, dir: 0, lines: ['ch6.p.agna.3', 'ch6.p.agna.4'] }
    ],
    phases: [{ if: 'c6:carvings', lines: ['ch6.p.agna.5', 'ch6.p.agna.6'] }]
  },
  {
    id: 'bask',
    name: 'ch6.name.bask',
    look: 'bask',
    at: P.oqBask,
    lines: ['ch6.p.bask.1', 'ch6.p.bask.2'],
    service: 'ch6.svc.bask',
    schedule: [
      { from: 7, to: 19 },
      { from: 19, to: 7, map: 'stonehollow_h1', x: P.h1Bask.x, y: P.h1Bask.y, dir: 0, lines: ['ch6.p.bask.3', 'ch6.p.bask.4'] }
    ]
  },
  {
    id: 'ottie',
    name: 'ch6.name.ottie',
    look: 'ottie',
    at: P.h4Ottie,
    lines: ['ch6.p.ottie.1', 'ch6.p.ottie.2'],
    phases: [{ if: 'c6:ottie', lines: ['ch6.p.ottie.3', 'ch6.p.ottie.4'] }]
  },
  {
    id: 'mara',
    name: 'ch6.name.mara',
    look: 'mara',
    at: P.h4Mara,
    lines: ['ch6.p.mara.1', 'ch6.p.mara.2'],
    phases: [{ if: 'c6:ottie', lines: ['ch6.p.mara.3', 'ch6.p.mara.4'] }]
  },
  {
    id: 'dunn_hollow',
    name: 'ch6.name.dunn_hollow',
    look: 'dunn_hollow',
    at: P.hallDunn,
    lines: ['ch6.p.dunn.1', 'ch6.p.dunn.2'],
    phases: [
      { if: 'c6:dunn', lines: ['ch6.p.dunn.3', 'ch6.p.dunn.4'] },
      { if: 'c6:sealed', lines: ['ch6.p.dunn.5', 'ch6.p.dunn.6'] }
    ]
  },
  {
    id: 'harrow',
    name: 'ch6.name.harrow',
    look: 'harrow',
    at: P.hallHarrow,
    lines: ['ch6.p.harrow.1', 'ch6.p.harrow.2'],
    phases: [{ if: 'c6:bridge', lines: ['ch6.p.harrow.3', 'ch6.p.harrow.4'] }]
  },
  {
    id: 'envoy',
    name: 'ch6.name.envoy',
    look: 'envoy',
    at: null,
    lines: ['ch6.p.envoy.1'],
    spawned: true
  }
];
