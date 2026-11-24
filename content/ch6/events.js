/*
 * ch6/events.js
 * Job: the story events of chapter 6: Coilhaven's north gate (open once chapter 5 is complete), the mountain road,
 * the carter's fire and the lookout halfway, Stonehollow and a kite letter, Wren at the tavern, the Drum Circle
 * and the Rally Rune, the Old Quarry (Bask) and the Listening Cave behind it (the dark, the boulder room, the carvings behind its
 * gate, the Fallen drift), Granny Burr's
 * page by kite, Old Gorse and the one-lifetime law, Ottie and the humming cave, the boulder tunnels, Apprentice
 * Dunn, Warden Harrow's warning and the wand duel, THE LOSS (the Council envoy, the choice of five, the seal),
 * Wren after the seal, Harrow's bridge to the Ash Road (c6:bridge) and the letter home (c6:complete).
 * Flags read by later chapters: c6:sealed, c6:bridge, c6:complete, c6:wrenhome.
 */

import P from './places.js';

export default [
  {
    id: 'c6_gate_shut',
    on: { door: { map: 'coilhaven', to: 'mountain_road' }, block: true },
    if: { not: 'c5:complete' },
    once: false,
    then: [{ run: 'ch6.gateshut' }]
  },
  {
    id: 'c6_open',
    on: { auto: true },
    if: { all: [{ map: 'coilhaven' }, { indoor: false }, 'c5:complete', { not: 'ch6:open' }] },
    then: [
      { wait: 600 },
      { sound: 'creak' },
      { say: 'ch6.ev.open.1', who: 'kid' },
      { flag: 'ch6:open' },
      { say: 'ch6.ev.open.2', who: 'companion' },
      { quest: 'stonering', start: true }
    ]
  },
  {
    id: 'c6_road',
    on: { enter: 'mountain_road' },
    delay: 500,
    then: [
      { if: { quest: 'stonering', is: 'none' }, then: [{ quest: 'stonering', start: true, quiet: true }] },
      { say: 'ch6.ev.road.1', who: 'kid' },
      { say: 'ch6.ev.road.2', who: 'companion' }
    ]
  },
  {
    id: 'c6_lookout',
    on: { area: P.mrLookout },
    then: [
      { wait: 300 },
      { say: 'ch6.ev.lookout.1', who: 'kid' },
      { say: 'ch6.ev.lookout.2', who: 'kid' },
      { say: 'ch6.ev.lookout.3', who: 'companion' },
      { give: 'herb', n: 2 }
    ]
  },
  {
    id: 'c6_tamsin',
    on: { talk: 'tamsin' },
    if: { not: 'c6:tamsin' },
    then: [{ run: 'ch6.tamsin' }]
  },
  {
    id: 'c6_town',
    on: { enter: 'stonehollow' },
    delay: 600,
    then: [
      { say: 'ch6.ev.town.1', who: 'kid' },
      { say: 'ch6.ev.town.2', who: 'kid' },
      { say: 'ch6.ev.town.3', who: 'companion' },
      { flag: 'c6:wren' },
      { wait: 400 },
      { ext: 'kiteFlight', mode: 'mail' },
      { sound: 'page' },
      { say: 'ch6.ev.letter.1', who: 'kid' },
      { run: 'ch6.letter' },
      { say: 'ch6.ev.letter.2', who: 'companion' }
    ]
  },
  {
    id: 'c6_wren_meet',
    on: { talk: 'wren' },
    if: { all: ['c6:wren', { not: 'c6:sealed' }] },
    thenService: false,
    then: [{ run: 'ch6.wren.meet' }]
  },
  {
    id: 'c6_wren_after',
    on: { area: P.shSquareBox, rearm: true },
    if: { all: ['c6:sealed', { not: 'c6:wrenhome' }] },
    once: false,
    then: [{ run: 'ch6.wren.after' }]
  },
  {
    id: 'c6_wren_after_talk',
    on: { talk: 'wren' },
    if: { all: ['c6:sealed', { not: 'c6:wrenhome' }] },
    once: false,
    thenService: false,
    then: [{ run: 'ch6.wren.after' }]
  },
  {
    id: 'c6_drummer',
    on: { talk: 'drummer' },
    if: { not: { ext: 'spell', has: 'boost' } },
    once: false,
    then: [{ run: 'ch6.teach' }]
  },
  {
    id: 'c6_quarry',
    on: { enter: 'old_quarry' },
    delay: 500,
    then: [{ say: 'ch6.ev.quarry.1', who: 'kid' }, { say: 'ch6.ev.quarry.2', who: 'companion' }]
  },
  {
    id: 'c6_gorse_first',
    on: { talk: 'gorse' },
    if: { not: 'c6:gorse:met' },
    then: [{ run: 'ch6.gorse.first' }]
  },
  {
    id: 'c6_gorse_law',
    on: { talk: 'gorse' },
    if: { all: ['c6:carvings', { not: 'c6:gorse' }] },
    then: [{ run: 'ch6.gorse.law' }]
  },
  {
    id: 'c6_gorse_chisel',
    on: { talk: 'gorse' },
    if: { has: 'carving_chisel' },
    once: false,
    thenService: false,
    then: [{ run: 'ch6.chisel.back' }]
  },
  {
    id: 'c6_ottie_first',
    on: { talk: ['ottie', 'mara'] },
    if: { not: 'c6:ottie:asked' },
    then: [{ run: 'ch6.ottie.first' }]
  },
  {
    id: 'c6_ottie_tell',
    on: { talk: 'ottie' },
    if: { all: ['c6:carvings', 'c6:ottie:asked', { not: 'c6:ottie' }] },
    then: [{ run: 'ch6.ottie.tell' }]
  },
  {
    id: 'c6_cave',
    on: { enter: 'listening_cave' },
    delay: 500,
    then: [
      { say: 'ch6.ev.cave.1', who: 'kid' },
      {
        if: { has: 'lantern' },
        then: [{ say: 'ch6.ev.cave.2', who: 'kid' }, { say: 'ch6.ev.cave.3', who: 'companion' }],
        else: [{ say: 'ch6.ev.cave.4', who: 'kid' }, { say: 'ch6.ev.cave.5', who: 'companion' }]
      },
      { helper: 'c6_dark', title: 'ch6.help.dark.title', text: 'ch6.help.dark', icon: 'lantern' }
    ]
  },
  {
    id: 'c6_carvings',
    on: { area: P.lcCarvings },
    if: { not: 'c6:carvings' },
    then: [{ run: 'ch6.carvings' }]
  },
  {
    id: 'c6_burr',
    on: { auto: true },
    if: { all: ['c6:carvings', { map: 'stonehollow' }, { indoor: false }, { not: 'c6:burr' }] },
    then: [
      { wait: 600 },
      { ext: 'kiteFlight', mode: 'mail' },
      { sound: 'page' },
      { say: 'ch6.ev.burr.1', who: 'kid' },
      { run: 'ch6.burrletter' },
      { flag: 'c6:burr' },
      { give: 'burr_page' },
      { say: 'ch6.ev.burr.2', who: 'kid' },
      { say: 'ch6.ev.burr.3', who: 'kid' },
      { say: 'ch6.ev.burr.4', who: 'companion' }
    ]
  },
  {
    id: 'c6_tunnels_door',
    on: { door: { map: 'stonehollow', to: 'bedrock_hall' }, block: true },
    if: { not: 'c6:tunnels' },
    once: false,
    then: [{ say: 'ch6.ev.door.1', who: 'sign' }, { say: 'ch6.ev.door.2', who: 'companion' }]
  },
  {
    id: 'c6_tunnels_first',
    on: { area: P.lcTunnelsBox },
    if: { not: 'c6:tunnels' },
    then: [{ say: 'ch6.ev.tunnels.1', who: 'kid' }, { say: 'ch6.ev.tunnels.2', who: 'companion' }]
  },
  {
    id: 'c6_hall',
    on: { enter: 'bedrock_hall' },
    delay: 500,
    then: [{ say: 'ch6.ev.hall.1', who: 'kid' }, { say: 'ch6.ev.hall.2', who: 'companion' }]
  },
  {
    id: 'c6_dunn',
    on: { talk: 'dunn_hollow' },
    if: { not: 'c6:dunn' },
    once: false,
    then: [{ run: 'ch6.dunn' }]
  },
  {
    id: 'c6_harrow',
    on: { talk: 'harrow' },
    if: { not: 'c6:ring' },
    once: false,
    then: [
      {
        branch: [
          { if: { not: 'c6:dunn' }, then: [{ run: 'ch6.harrow.first' }] },
          { if: { not: { ext: 'spell', has: 'boost' } }, then: [{ say: 'ch6.ev.harrow.norune.1', who: 'harrow' }, { say: 'ch6.ev.harrow.norune.2', who: 'harrow' }] }
        ],
        else: [{ run: 'ch6.harrow.duel' }]
      }
    ]
  },
  {
    id: 'c6_envoy',
    on: { talk: ['envoy', 'harrow'] },
    if: { all: ['c6:ring', { not: 'c6:sealed' }] },
    once: false,
    thenService: false,
    then: [{ run: 'ch6.seal' }]
  },
  {
    id: 'c6_bridge',
    on: { talk: 'harrow' },
    if: { all: ['c6:sealed', { not: 'c6:bridge' }] },
    once: false,
    then: [{ run: 'ch6.bridge' }]
  },
  {
    id: 'c6_letter2',
    on: { auto: true },
    if: { all: ['c6:bridge', 'c6:wrenhome', { map: 'stonehollow' }, { indoor: false }] },
    then: [
      { wait: 600 },
      { ext: 'kiteFlight', mode: 'mail' },
      { sound: 'page' },
      { say: 'ch6.ev.letter2.1', who: 'kid' },
      { run: 'ch6.letter2' },
      { flag: 'c6:complete' },
      { say: 'ch6.ev.letter2.2', who: 'companion' }
    ]
  }
];
