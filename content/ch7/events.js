/*
 * ch7/events.js
 * Job: the story events of chapter 7: the lava stream on the Ash Road (until Harrow lays the stone bridge,
 * c6:bridge, which starts the Flame Ring), Ottar's warm stone at the lookout, Cinderreach and
 * the hontori's sense of home, the Smoke House (Swift Step), the stair to the Hearth Below (the heat cloak), THE
 * EMPTY NEST (the hontori remembers; the invitation to a name; Warden Brasa), Grandma's wand box by kite (her
 * note and young Vael's letter), Cole and Mira in the square, the lava moat (cooled with water: c7:cooled), Kell
 * by the carving, the Crucible door, the bench, the ring duel under heat, and the small quest of the cold kiln.
 * Flags read by later chapters: c7:nest, c7:box (the kid holds grandma_wand), c7:friends, c7:ring, c7:complete.
 */

import P from './places.js';

export default [
  {
    id: 'c7_road_early',
    on: { area: { map: 'ash_road', x: [12, 18], y: [13, 16] } },
    if: { not: 'c6:bridge' },
    then: [{ wait: 300 }, { run: 'ch7.roadshut' }]
  },
  {
    id: 'c7_open',
    on: { flag: 'c6:bridge' },
    then: [{ quest: 'flamering', start: true }]
  },
  {
    id: 'c7_road',
    on: { enter: 'ash_road' },
    if: 'c6:bridge',
    delay: 500,
    then: [
      { if: { quest: 'flamering', is: 'none' }, then: [{ quest: 'flamering', start: true, quiet: true }] },
      { say: 'ch7.ev.road.1', who: 'kid' },
      { say: 'ch7.ev.road.2', who: 'kid' },
      { say: 'ch7.ev.road.3', who: 'companion' }
    ]
  },
  {
    id: 'c7_ottar',
    on: { talk: 'ottar' },
    if: { not: 'c7:ottar' },
    then: [{ run: 'ch7.ottar' }]
  },
  {
    id: 'c7_lookout',
    on: { area: P.arLookout },
    then: [
      { wait: 300 },
      { say: 'ch7.ev.lookout.1', who: 'kid' },
      { say: 'ch7.ev.lookout.2', who: 'companion' },
      { give: 'ember_dust', n: 2 }
    ]
  },
  {
    id: 'c7_city',
    on: { enter: 'cinderreach' },
    delay: 600,
    then: [
      { say: 'ch7.ev.city.1', who: 'kid' },
      { say: 'ch7.ev.city.2', who: 'kid' },
      { wait: 400 },
      { say: 'ch7.ev.city.3', who: 'companion' },
      { say: 'ch7.ev.city.4', who: 'kid' },
      { say: 'ch7.ev.city.5', who: 'companion' }
    ]
  },
  {
    id: 'c7_cool',
    on: { tile: 'lava', map: 'cinderreach' },
    if: { all: [{ area: P.crCoolBox }, { not: 'c7:cooled' }] },
    once: false,
    then: [{ run: 'ch7.cool' }]
  },
  {
    id: 'c7_moat',
    on: { area: P.crCoolBox },
    if: { not: 'c7:cooled' },
    then: [{ wait: 300 }, { say: 'ch7.ev.moat.1', who: 'kid' }, { say: 'ch7.ev.moat.2', who: 'companion' }]
  },
  {
    id: 'c7_smoke',
    on: { talk: 'smoke_keeper' },
    if: { not: { ext: 'spell', has: 'step' } },
    once: false,
    then: [{ run: 'ch7.teach' }]
  },
  {
    id: 'c7_hearth_hot',
    on: { door: { map: 'cinderreach', to: 'hearth_below' }, block: true },
    if: { not: { has: 'heat_cloak' } },
    once: false,
    then: [{ run: 'ch7.hearth.hot' }]
  },
  {
    id: 'c7_cloak_gift',
    on: { talk: 'cr_shopkeeper' },
    if: { all: ['c7:hearth:tried', { not: { has: 'heat_cloak' } }, { coins: { lt: 30 } }] },
    thenService: false,
    then: [
      { say: 'ch7.ev.cloak.1', who: 'cr_shopkeeper' },
      { say: 'ch7.ev.cloak.2', who: 'cr_shopkeeper' },
      { give: 'heat_cloak' },
      { say: 'ch7.ev.cloak.3', who: 'cr_shopkeeper' }
    ]
  },
  {
    id: 'c7_hearth',
    on: { enter: 'hearth_below' },
    if: { not: 'c7:nest' },
    delay: 500,
    then: [
      { say: 'ch7.ev.hearth.1', who: 'kid' },
      { say: 'ch7.ev.hearth.2', who: 'kid' },
      { say: 'ch7.ev.hearth.3', who: 'companion' }
    ]
  },
  {
    id: 'c7_nest',
    on: { area: P.hbNestBox },
    if: { not: 'c7:nest' },
    then: [{ run: 'ch7.nest' }]
  },
  {
    id: 'c7_brasa_early',
    on: { talk: 'brasa' },
    if: { not: 'c7:nest' },
    once: false,
    then: [{ say: 'ch7.ev.brasa.early', who: 'brasa' }]
  },
  {
    id: 'c7_box',
    on: { auto: true },
    if: { all: ['c7:nest', { map: 'cinderreach' }, { indoor: false }, { not: 'c7:box' }] },
    then: [{ run: 'ch7.box' }]
  },
  {
    id: 'c7_friends',
    on: { area: P.crSquareBox },
    if: { all: ['c7:box', { not: 'c7:friends' }] },
    once: false,
    then: [{ run: 'ch7.friends' }]
  },
  {
    id: 'c7_friends_talk',
    on: { talk: ['cole', 'mira'] },
    if: { all: [{ map: 'cinderreach' }, 'c7:box', { not: 'c7:friends' }] },
    once: false,
    thenService: false,
    then: [{ run: 'ch7.friends' }]
  },
  {
    id: 'c7_crucible_shut',
    on: { door: { map: 'cinderreach', to: 'ember_crucible' }, block: true },
    if: { not: 'c7:braziers' },
    once: false,
    then: [{ say: 'ch7.ev.door.0', who: 'kid' }]
  },
  {
    id: 'c7_crucible_away',
    on: { door: { map: 'cinderreach', to: 'ember_crucible' }, block: true },
    if: { not: 'c7:brasa' },
    once: false,
    then: [{ say: 'ch7.ev.door.1', who: 'sign' }, { say: 'ch7.ev.door.2', who: 'kid' }]
  },
  {
    id: 'c7_crucible_enter',
    on: { enter: 'ember_crucible' },
    once: false,
    then: [{ unflag: 'c7:crucible:rested' }]
  },
  {
    id: 'c7_crucible_first',
    on: { enter: 'ember_crucible' },
    delay: 500,
    then: [{ say: 'ch7.ev.crucible.1', who: 'kid' }, { say: 'ch7.ev.crucible.2', who: 'companion' }]
  },
  {
    id: 'c7_kell_court',
    on: { talk: 'kell' },
    if: { all: [{ map: 'cinderreach' }, { not: 'c7:kell:met' }] },
    then: [
      { say: 'ch7.ev.kell.court.1', who: 'kell' },
      { say: 'ch7.ev.kell.court.2', who: 'kell' },
      { say: 'ch7.ev.kell.court.3', who: 'kell' },
      { flag: 'c7:kell:met' }
    ]
  },
  {
    id: 'c7_kell',
    on: { talk: 'kell' },
    if: { all: ['c7:braziers', { not: 'c7:kell' }] },
    once: false,
    thenService: false,
    then: [{ run: 'ch7.kell' }]
  },
  {
    id: 'c7_brasa',
    on: { talk: 'brasa' },
    if: { all: [{ map: 'ember_crucible' }, { not: 'c7:ring' }] },
    once: false,
    then: [
      {
        branch: [
          { if: { not: 'c7:braziers' }, then: [{ say: 'ch7.ev.brasa.wait.1', who: 'brasa' }] },
          { if: { not: 'c7:kell' }, then: [{ say: 'ch7.ev.brasa.wait.2', who: 'brasa' }] }
        ],
        else: [{ run: 'ch7.ringduel' }]
      }
    ]
  },
  {
    id: 'c7_sefa',
    on: { talk: 'sefa' },
    if: { not: 'c7:kiln' },
    once: false,
    then: [{ run: 'ch7.kiln' }]
  },
  {
    id: 'c7_marro',
    on: { talk: 'marro' },
    if: { not: 'c7:nest' },
    then: [
      { say: 'ch7.ev.marro.1', who: 'marro' },
      { say: 'ch7.ev.marro.2', who: 'marro' },
      { say: 'ch7.ev.marro.3', who: 'marro' },
      { say: 'ch7.ev.marro.4', who: 'companion' }
    ]
  },
  {
    id: 'c7_juno',
    on: { talk: 'juno' },
    if: { all: ['c7:box', { not: 'c7:juno' }] },
    then: [
      { say: 'ch7.ev.juno.1', who: 'kid' },
      { say: 'ch7.ev.juno.2', who: 'juno' },
      { say: 'ch7.ev.juno.3', who: 'juno' },
      { say: 'ch7.ev.juno.4', who: 'juno' },
      { flag: 'c7:juno' },
      { give: 'spirit_snack', n: 2 }
    ]
  },
  {
    id: 'c7_rusk',
    on: { talk: 'rusk' },
    if: { not: { has: 'heat_cloak' } },
    once: false,
    then: [{ say: 'ch7.ev.rusk.1', who: 'rusk' }, { say: 'ch7.ev.rusk.2', who: 'rusk' }]
  },
  {
    id: 'c7_end',
    on: { auto: true },
    if: { all: ['c7:ring', { map: 'cinderreach' }, { indoor: false }, { not: 'c7:complete' }] },
    then: [
      { wait: 600 },
      { say: 'ch7.ev.end.1', who: 'kid' },
      { say: 'ch7.ev.end.2', who: 'kid' },
      { flag: 'c7:complete' },
      { say: 'ch7.ev.end.3', who: 'companion' }
    ]
  }
];
