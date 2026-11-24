/*
 * ch9/events.js
 * Job: the story events of chapter 9: the road to the Golden Gate (opened by c8:complete), the gate of seven rings
 * and Vael's welcome, Goldmere the adoring city, Vael's offer to Cole in the plaza, the Glasshouse (Mirror
 * Sigil), the Mirror Gardens, the family and Lisel in the plaza (she sees, willingly), Vael's garden of covered
 * jars (the plant), Halo Court and the Ring Tournament (four rounds, a save point each, Cole's choice in the
 * final, the crowd of chapter 5), the Halo Ring, and the small things of Goldmere (Tobbe's friend, the first
 * page of the old law).
 * Flags read by later chapters: c9:jars, c9:cole (Cole refused Vael), c9:lisel, c9:ring, c9:complete.
 */

import P from './places.js';

/* the seven rings the gate asks for (the eighth, light, is won here) */
const SEVEN = {
  all: [
    { ext: 'ring', has: 'grass' },
    { ext: 'ring', has: 'wind' },
    { ext: 'ring', has: 'water' },
    { ext: 'ring', has: 'electric' },
    { ext: 'ring', has: 'earth' },
    { ext: 'ring', has: 'fire' },
    { ext: 'ring', has: 'dark' }
  ]
};

export default [
  {
    id: 'c9_open',
    on: { flag: 'c8:complete' },
    then: [{ quest: 'haloring', start: true }]
  },
  {
    id: 'c9_road',
    on: { enter: 'golden_gate' },
    delay: 500,
    then: [
      { if: { quest: 'haloring', is: 'none' }, then: [{ quest: 'haloring', start: true, quiet: true }] },
      { say: 'ch9.ev.road.1', who: 'kid' },
      { say: 'ch9.ev.road.2', who: 'companion' }
    ]
  },
  {
    id: 'c9_gate',
    on: { area: P.ggGateBox },
    if: { not: 'c9:gate' },
    once: false,
    then: [{ if: SEVEN, then: [{ run: 'ch9.gate' }], else: [{ say: 'ch9.ev.gate.few', who: 'kid' }] }]
  },
  {
    id: 'c9_gate_shut',
    on: { door: { map: 'golden_gate', to: 'goldmere' }, block: true },
    if: { not: 'c9:gate' },
    once: false,
    then: [{ say: 'ch9.ev.gate.shut', who: 'kid' }]
  },
  {
    id: 'c9_city',
    on: { enter: 'goldmere' },
    delay: 600,
    then: [
      { say: 'ch9.ev.city.1', who: 'kid' },
      { say: 'ch9.ev.city.2', who: 'kid' },
      { say: 'ch9.ev.city.3', who: 'companion' }
    ]
  },
  {
    id: 'c9_offer',
    on: { area: P.gmPlazaBox },
    if: { all: ['c9:gate', { not: 'c9:offer' }] },
    once: false,
    then: [{ run: 'ch9.offer' }]
  },
  {
    id: 'c9_vael_talk',
    on: { talk: 'orlen' },
    if: { map: 'goldmere' },
    once: false,
    thenService: false,
    then: [
      {
        branch: [
          { if: { not: 'c9:gardens' }, then: [{ say: 'ch9.ev.vael.talk.1', who: 'orlen' }] },
          { if: { not: 'c9:jars' }, then: [{ say: 'ch9.ev.vael.talk.2', who: 'orlen' }] },
          { if: { not: 'c9:ring' }, then: [{ say: 'ch9.ev.vael.talk.3', who: 'orlen' }] }
        ],
        else: [{ say: 'ch9.ev.vael.talk.4', who: 'orlen' }]
      }
    ]
  },
  {
    id: 'c9_vael_court',
    on: { talk: 'orlen' },
    if: { map: 'halo_court' },
    once: false,
    thenService: false,
    then: [{ if: 'c9:ring', then: [{ say: 'ch9.ev.vael.talk.4', who: 'orlen' }], else: [{ say: 'ch9.ev.vael.talk.3', who: 'orlen' }] }]
  },
  {
    id: 'c9_glass',
    on: { talk: 'glass_keeper' },
    if: { not: { ext: 'spell', has: 'mirror' } },
    once: false,
    then: [{ run: 'ch9.teach' }]
  },
  {
    id: 'c9_gardens',
    on: { enter: 'mirror_gardens' },
    if: { not: 'c9:gardens' },
    delay: 500,
    then: [{ say: 'ch9.ev.gardens.1', who: 'kid' }, { say: 'ch9.ev.gardens.2', who: 'companion' }]
  },
  {
    id: 'c9_family',
    on: { auto: true },
    if: { all: ['c9:gardens', { map: 'goldmere' }, { indoor: false }, { not: 'c9:family' }] },
    then: [{ run: 'ch9.family' }]
  },
  {
    id: 'c9_lisel',
    on: { talk: 'lisel' },
    if: { all: ['c9:family', { not: 'c9:lisel' }] },
    once: false,
    thenService: false,
    then: [{ run: 'ch9.lisel' }]
  },
  {
    id: 'c9_garden_shut',
    on: { door: { map: 'goldmere', to: 'vael_garden' }, block: true },
    if: { not: { has: 'garden_key' } },
    once: false,
    then: [{ say: 'ch9.ev.garden.shut', who: 'kid' }]
  },
  {
    id: 'c9_jars',
    on: { area: P.vgJarsBox },
    if: { not: 'c9:jars' },
    then: [{ run: 'ch9.jars' }]
  },
  {
    id: 'c9_court_shut',
    on: { door: { map: 'goldmere', to: 'halo_court' }, block: true },
    if: { not: 'c9:gardens' },
    once: false,
    then: [{ say: 'ch9.ev.court.shut.1', who: 'sign' }, { say: 'ch9.ev.court.shut.2', who: 'kid' }]
  },
  {
    id: 'c9_court',
    on: { enter: 'halo_court' },
    delay: 500,
    then: [{ say: 'ch9.ev.court.1', who: 'kid' }, { say: 'ch9.ev.court.2', who: 'companion' }]
  },
  {
    id: 'c9_court_enter',
    on: { enter: 'halo_court' },
    once: false,
    then: [{ unflag: 'c9:court:rested' }]
  },
  {
    id: 'c9_aurel',
    on: { talk: 'aurel' },
    if: { not: 'c9:ring' },
    once: false,
    then: [
      {
        branch: [
          { if: { not: 'c9:family' }, then: [{ say: 'ch9.ev.aurel.wait.1', who: 'aurel' }] },
          { if: { not: 'c9:jars' }, then: [{ say: 'ch9.ev.aurel.wait.2', who: 'aurel' }] }
        ],
        else: [{ run: 'ch9.tourney' }]
      }
    ]
  },
  {
    id: 'c9_tobbe',
    on: { talk: 'tobbe' },
    if: { quest: 'tobbe', is: 'none' },
    then: [
      { say: 'ch9.ev.tobbe.1', who: 'tobbe' },
      { say: 'ch9.ev.tobbe.2', who: 'tobbe' },
      { say: 'ch9.ev.tobbe.3', who: 'kid' },
      { quest: 'tobbe', start: true }
    ]
  },
  {
    id: 'c9_hester',
    on: { talk: 'hester' },
    if: { all: [{ quest: 'tobbe', is: 'active' }, { not: 'c9:hester' }] },
    once: false,
    then: [{ run: 'ch9.hester' }]
  },
  {
    id: 'c9_page',
    on: { talk: 'benedek' },
    if: { not: 'c9:page' },
    then: [
      { say: 'ch9.ev.page.1', who: 'benedek' },
      { say: 'ch9.ev.page.2', who: 'benedek' },
      { say: 'ch9.ev.page.3', who: 'kid' },
      { say: 'ch9.ev.page.4', who: 'kid' },
      { say: 'ch9.ev.page.5', who: 'benedek' },
      { flag: 'c9:page' },
      { say: 'ch9.ev.page.6', who: 'companion' }
    ]
  },
  {
    id: 'c9_end',
    on: { auto: true },
    if: { all: ['c9:ring', { map: 'goldmere' }, { indoor: false }, { not: 'c9:complete' }] },
    then: [
      { wait: 600 },
      { say: 'ch9.ev.end.1', who: 'kid' },
      { say: 'ch9.ev.end.2', who: 'kid' },
      { flag: 'c9:complete' },
      { say: 'ch9.ev.end.3', who: 'companion' }
    ]
  }
];
