/*
 * ch4/events.js
 * Job: the story events of chapter 4: the ferry comes in at Kitewick and is boarded at either end, Tidewell, Warden Maren at the flooded hall,
 * the Lullaby Boat, the Saltmarsh and its lookout, Isk and the tide wheels of the Sunken Stair, the drowned bell
 * and the old order, Orlen Vael's kite letter, Mira and Lisel, Old Sava's gift, Isk and Maren in the drained hall,
 * and Rook's letter after the ring.
 */

import P from './places.js';

export default [
  {
    id: 'c4_open',
    on: { auto: true },
    if: { all: [{ map: 'kitewick' }, 'c3:complete', { indoor: false }, { not: 'c4:open' }] },
    then: [
      { wait: 1200 },
      { sound: 'horn' },
      { say: 'ch4.ev.open.1', who: 'kid' },
      { say: 'ch4.ev.open.2', who: 'companion' },
      { flag: 'c4:open' },
      { quest: 'tidering', start: true }
    ]
  },
  {
    id: 'c4_tidewell',
    on: { enter: 'tidewell' },
    delay: 500,
    then: [
      { say: 'ch4.ev.tidewell.1', who: 'kid' },
      { say: 'ch4.ev.tidewell.2', who: 'companion' },
      { say: 'ch4.ev.tidewell.3', who: 'kid' },
      { quest: 'mirahome', start: true }
    ]
  },
  {
    id: 'c4_jetty',
    on: { door: { map: 'kitewick', to: 'ferry' }, block: true },
    if: { not: 'c4:open' },
    once: false,
    then: [{ run: 'ch4.ferry.closed' }]
  },
  /* the ferry is a ride (the travel command), never a walk: stepping onto the jetty's end or the pier's end boards it */
  {
    id: 'c4_board_kitewick',
    on: { door: { map: 'kitewick', to: 'ferry' }, block: true },
    if: 'c4:open',
    once: false,
    then: [{ run: 'ch4.board.south' }]
  },
  {
    id: 'c4_board_tidewell',
    on: { door: { map: 'tidewell', to: 'ferry' }, block: true },
    once: false,
    then: [{ run: 'ch4.board.north' }]
  },
  {
    id: 'c4_maren',
    on: { talk: 'maren' },
    if: { not: 'c4:ring' },
    once: false,
    then: [
      {
        branch: [
          { if: { not: 'c4:maren' }, then: [{ run: 'ch4.maren.meet' }] },
          { if: { not: 'c4:bell' }, then: [{ say: 'ch4.ev.maren.7', who: 'maren' }] },
          { if: { not: 'c4:isk' }, then: [{ say: 'ch4.ev.maren.8', who: 'maren' }] }
        ],
        else: [{ run: 'ch4.ringduel' }]
      }
    ]
  },
  {
    id: 'c4_keeper',
    on: { talk: 'lullaby_keeper' },
    if: { not: { ext: 'spell', has: 'sleep' } },
    once: false,
    then: [
      { say: 'ch4.ev.keeper.1', who: 'lullaby_keeper' },
      { say: 'ch4.ev.keeper.2', who: 'lullaby_keeper' },
      { say: 'ch4.ev.keeper.3', who: 'lullaby_keeper' },
      { ext: 'draw', sigil: 'sleep', text: 'ch4.ev.keeper.draw' },
      { flag: 'c4:lullaby' },
      { ext: 'learn', spell: 'sleep' },
      { sound: 'wand' },
      { say: 'ch4.ev.keeper.4', who: 'lullaby_keeper' },
      { say: 'ch4.ev.keeper.5', who: 'companion' }
    ]
  },
  {
    id: 'c4_saltmarsh',
    on: { enter: 'saltmarsh' },
    delay: 500,
    then: [
      { say: 'ch4.ev.marsh.1', who: 'kid' },
      { say: 'ch4.ev.marsh.2', who: 'companion' }
    ]
  },
  {
    id: 'c4_lookout',
    on: { area: P.smLookout },
    then: [
      { wait: 300 },
      { say: 'ch4.ev.lookout.1', who: 'kid' },
      { say: 'ch4.ev.lookout.2', who: 'companion' },
      { say: 'ch4.ev.lookout.3', who: 'kid' },
      { give: 'tide_pearl' }
    ]
  },
  {
    id: 'c4_stair',
    on: { enter: 'sunken_stair' },
    if: { not: 'c4:stair' },
    delay: 500,
    then: [
      { say: 'ch4.ev.stair.1', who: 'isk' },
      { say: 'ch4.ev.stair.2', who: 'isk' },
      { say: 'ch4.ev.stair.3', who: 'isk' },
      { say: 'ch4.ev.stair.4', who: 'isk' }
    ]
  },
  {
    id: 'c4_isk_sleep',
    on: { talk: 'isk' },
    if: { all: [{ not: { ext: 'spell', has: 'sleep' } }, { not: 'c4:bell' }] },
    once: false,
    thenService: false,
    then: [
      { say: 'ch4.ev.isk.s1', who: 'isk' },
      { say: 'ch4.ev.isk.s2', who: 'isk' },
      { ext: 'draw', sigil: 'sleep', text: 'ch4.ev.keeper.draw' },
      { flag: 'c4:lullaby' },
      { ext: 'learn', spell: 'sleep' },
      { sound: 'wand' },
      { say: 'ch4.ev.isk.s3', who: 'isk' },
      { say: 'ch4.ev.keeper.5', who: 'companion' }
    ]
  },
  {
    id: 'c4_bell',
    on: { area: P.ssBell, rearm: true },
    if: { all: ['c4:stair', { not: 'c4:bell' }] },
    once: false,
    then: [{ run: 'ch4.bell' }]
  },
  {
    id: 'c4_vael',
    on: { enter: 'tidewell' },
    if: 'c4:order',
    delay: 700,
    then: [
      { ext: 'kiteFlight', mode: 'mail', bring: 'vael_letter' },
      { sound: 'page' },
      { say: 'ch4.ev.vael.1', who: 'kid' },
      { say: 'ch4.ev.vael.2', who: 'letter' },
      { run: 'ch4.vaelletter' },
      { give: 'vael_letter' },
      { say: 'ch4.ev.vael.3', who: 'kid' },
      { say: 'ch4.ev.vael.4', who: 'kid' },
      { say: 'ch4.ev.vael.5', who: 'companion' }
    ]
  },
  {
    id: 'c4_hall_enter',
    on: { enter: 'deepbell_hall' },
    once: false,
    then: [{ unflag: 'c4:hall:rested' }]
  },
  {
    id: 'c4_isk',
    on: { talk: 'isk' },
    if: { all: ['c4:bell', { not: 'c4:isk' }] },
    once: false,
    thenService: false,
    then: [
      { say: 'ch4.ev.isk.1', who: 'isk' },
      { say: 'ch4.ev.isk.2', who: 'isk' },
      {
        choose: [
          { text: 'ch4.ev.isk.opt', then: [] },
          { text: 'ch2.ev.notyet', then: [{ say: 'ch4.ev.isk.3', who: 'isk' }, { stop: true }] }
        ],
        cancel: 1
      },
      {
        battle: { opponent: 'isk' },
        after: 'wake',
        won: [
          { flag: 'c4:isk' },
          { say: 'ch4.ev.isk.4', who: 'isk' },
          { say: 'ch4.ev.isk.5', who: 'isk' },
          { say: 'ch4.ev.isk.6', who: 'companion' }
        ],
        else: [{ say: 'ch4.ev.isk.7', who: 'isk' }]
      }
    ]
  },
  {
    id: 'c4_mira',
    on: { talk: 'mira' },
    if: { all: [{ map: 'tidewell_h1' }, { not: 'c4:lisel' }] },
    once: false,
    thenService: false,
    then: [
      {
        if: { not: 'c4:mira:met' },
        then: [
          { say: 'ch4.ev.mira.1', who: 'mira' },
          { say: 'ch4.ev.mira.2', who: 'mira' },
          { say: 'ch4.ev.mira.3', who: 'mira' },
          { flag: 'c4:mira:met' }
        ]
      },
      { run: 'ch4.lisel' }
    ]
  },
  {
    id: 'c4_sava',
    on: { talk: 'sava' },
    if: 'c4:bell',
    then: [
      { say: 'ch4.ev.sava.1', who: 'sava' },
      { say: 'ch4.ev.sava.2', who: 'sava' },
      { give: 'tide_pearl', n: 2 },
      { say: 'ch4.ev.sava.3', who: 'companion' }
    ]
  },
  {
    id: 'c4_rook',
    on: { enter: 'tidewell' },
    if: 'c4:ring',
    delay: 700,
    then: [
      { ext: 'kiteFlight', mode: 'mail', bring: 'rook_letter' },
      { sound: 'page' },
      { say: 'ch4.ev.rook.1', who: 'kid' },
      { run: 'ch4.rookletter' },
      { give: 'rook_letter' },
      { say: 'ch4.ev.rook.2', who: 'kid' },
      { say: 'ch4.ev.rook.3', who: 'companion' },
      { flag: 'c4:complete' }
    ]
  }
];
