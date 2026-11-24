/*
 * ch8/events.js
 * Job: the story events of chapter 8: Cinderreach once chapter 7 is complete (the Mothwood is closed to a kid
 * without a Cinderreach flame: Brasa lights the Lantern, or lends her clay lamp), the Mothwood and its moths of
 * light, Old Wick's tea and Smudge the lost shadepup, Duskmere where it is always evening, the Lantern Room,
 * the grey watchers on the crater rim, Warden Nox, the cellar of hidden hontori, the Council captain's attack
 * (fought beside Nox: battle mode ally), Merrit (the grey cloak from Mossgrove) lifting the Sanctum seal
 * (c8:unseal), the three moon lamps, the ring duel under blind, and Lisel's letter.
 * Flags read by later chapters: c8:unseal, c8:merrit, c8:stair, c8:lisel, c8:ring, c8:complete.
 */

import P from './places.js';

export default [
  {
    id: 'c8_open',
    on: { auto: true },
    if: { all: [{ map: 'cinderreach' }, { indoor: false }, 'c7:complete', { not: 'ch8:open' }] },
    then: [
      { wait: 600 },
      { say: 'ch8.ev.open.1', who: 'kid' },
      { say: 'ch8.ev.open.2', who: 'kid' },
      { flag: 'ch8:open' },
      { say: 'ch8.ev.open.3', who: 'companion' },
      { quest: 'moonring', start: true }
    ]
  },
  {
    id: 'c8_gate',
    on: { door: { map: 'cinderreach', to: 'mothwood' }, block: true },
    if: { not: 'c8:flame' },
    once: false,
    then: [{ say: 'ch8.ev.gate.1', who: 'kid' }, { say: 'ch8.ev.gate.2', who: 'companion' }]
  },
  {
    id: 'c8_brasa',
    on: { talk: 'brasa' },
    if: { all: ['c7:complete', { not: 'c8:flame' }] },
    thenService: false,
    then: [{ run: 'ch8.flame' }]
  },
  {
    id: 'c8_wood',
    on: { enter: 'mothwood' },
    delay: 500,
    then: [
      { if: { quest: 'moonring', is: 'none' }, then: [{ quest: 'moonring', start: true, quiet: true }] },
      { say: 'ch8.ev.wood.1', who: 'kid' },
      { say: 'ch8.ev.wood.2', who: 'companion' }
    ]
  },
  {
    id: 'c8_moths',
    on: { area: P.mwMothsBox },
    then: [{ wait: 300 }, { say: 'ch8.ev.moths.1', who: 'kid' }, { say: 'ch8.ev.moths.2', who: 'kid' }, { say: 'ch8.ev.moths.3', who: 'companion' }]
  },
  {
    id: 'c8_wick',
    on: { talk: 'wick' },
    if: { not: 'c8:wick' },
    then: [{ run: 'ch8.wick' }]
  },
  {
    id: 'c8_linnet',
    on: { talk: 'linnet' },
    if: { has: 'wick_tin' },
    once: false,
    thenService: false,
    then: [{ run: 'ch8.tin' }]
  },
  {
    id: 'c8_pella',
    on: { talk: ['pella', 'cobb'] },
    if: { not: 'c8:pup:asked' },
    then: [{ run: 'ch8.pup.ask' }]
  },
  {
    id: 'c8_smudge',
    on: { talk: 'smudge' },
    if: { not: 'c8:pup' },
    once: false,
    then: [{ run: 'ch8.pup.find' }]
  },
  {
    id: 'c8_pella_back',
    on: { talk: ['pella', 'cobb'] },
    if: { all: ['c8:pup', { not: 'c8:pup:back' }] },
    then: [{ run: 'ch8.pup.home' }]
  },
  {
    id: 'c8_town',
    on: { enter: 'duskmere' },
    delay: 600,
    then: [
      { say: 'ch8.ev.town.1', who: 'kid' },
      { say: 'ch8.ev.town.2', who: 'kid' },
      { say: 'ch8.ev.town.3', who: 'companion' },
      { helper: 'c8_dusk', title: 'ch8.help.dusk.title', text: 'ch8.help.dusk', icon: 'dark' }
    ]
  },
  {
    id: 'c8_keeper',
    on: { talk: 'lantern_keeper' },
    if: { not: { ext: 'spell', has: 'lantern' } },
    once: false,
    then: [{ run: 'ch8.teach' }]
  },
  {
    id: 'c8_crater',
    on: { area: P.dmRimBox },
    if: { not: 'c8:watchers' },
    then: [{ say: 'ch8.ev.crater.1', who: 'kid' }, { say: 'ch8.ev.crater.2', who: 'kid' }, { say: 'ch8.ev.crater.3', who: 'companion' }]
  },
  {
    id: 'c8_hall_shut',
    on: { door: { map: 'duskmere', to: 'hollow_moon' }, block: true },
    if: { not: 'c8:watchers' },
    once: false,
    then: [{ say: 'ch8.ev.hallshut.1', who: 'kid' }]
  },
  {
    id: 'c8_hall',
    on: { enter: 'hollow_moon' },
    if: { not: 'c8:nox' },
    delay: 500,
    then: [{ run: 'ch8.nox.meet' }]
  },
  {
    id: 'c8_nox_meet',
    on: { talk: 'nox' },
    if: { not: 'c8:nox' },
    once: false,
    then: [{ run: 'ch8.nox.meet' }]
  },
  {
    id: 'c8_nox_square',
    on: { talk: 'nox' },
    if: { all: ['c8:nox', { not: 'c8:hidden' }] },
    once: false,
    then: [{ run: 'ch8.hidden' }]
  },
  {
    id: 'c8_attack',
    on: { auto: true },
    if: { all: ['c8:hidden', { map: 'duskmere' }, { indoor: false }, { not: 'c8:came' }] },
    then: [{ run: 'ch8.attack' }]
  },
  {
    id: 'c8_attack_stand',
    on: { enter: 'duskmere' },
    if: { all: ['c8:came', { not: 'c8:captain' }] },
    once: false,
    then: [
      { spawn: 'captain', at: { map: 'duskmere', x: P.dmCaptain.x, y: P.dmCaptain.y, dir: 0 } },
      { spawn: 'greycloak', at: { map: 'duskmere', x: P.dmCloak.x, y: P.dmCloak.y, dir: 0 } }
    ]
  },
  {
    id: 'c8_captain_again',
    on: { talk: ['captain', 'greycloak', 'nox'] },
    if: { all: ['c8:came', { not: 'c8:captain' }] },
    once: false,
    thenService: false,
    then: [{ run: 'ch8.fight' }]
  },
  {
    id: 'c8_merrit',
    on: { talk: 'greycloak' },
    if: 'c8:merrit',
    once: false,
    thenService: false,
    then: [{ cycle: [[{ say: 'ch8.ev.merrit.talk.1', who: 'greycloak' }], [{ say: 'ch8.ev.merrit.talk.2', who: 'greycloak' }], [{ say: 'ch8.ev.merrit.talk.3', who: 'greycloak' }]], mode: 'loop' }]
  },
  {
    id: 'c8_edda',
    on: { talk: 'edda' },
    if: { all: ['c8:captain', { not: 'c8:edda' }] },
    then: [
      { say: 'ch8.ev.edda.1', who: 'edda' },
      { say: 'ch8.ev.edda.2', who: 'edda' },
      { give: 'favour_token' },
      { flag: 'c8:edda' }
    ]
  },
  {
    id: 'c8_nox_ring',
    on: { talk: 'nox' },
    if: { all: ['c8:captain', { not: 'c8:ring' }] },
    once: false,
    then: [
      {
        branch: [
          { if: { not: { ext: 'spell', has: 'lantern' } }, then: [{ say: 'ch8.ev.nox.nosigil.1', who: 'nox' }, { say: 'ch8.ev.nox.nosigil.2', who: 'nox' }] },
          { if: { not: 'c8:lamps' }, then: [{ run: 'ch8.lamps' }] }
        ],
        else: [{ run: 'ch8.ringduel' }]
      }
    ]
  },
  {
    id: 'c8_lisel',
    on: { auto: true },
    if: { all: ['c8:ring', { map: 'duskmere' }, { indoor: false }, { not: 'c8:lisel' }] },
    then: [
      { wait: 600 },
      { ext: 'kiteFlight', mode: 'mail' },
      { sound: 'page' },
      { say: 'ch8.ev.lisel.1', who: 'kid' },
      { run: 'ch8.liselletter' },
      { flag: 'c8:lisel' },
      { say: 'ch8.ev.lisel.2', who: 'kid' },
      { say: 'ch8.ev.lisel.3', who: 'companion' },
      { flag: 'c8:complete' }
    ]
  }
];
