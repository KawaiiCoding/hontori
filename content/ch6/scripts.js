/*
 * ch6/scripts.js
 * Job: the scripts of chapter 6: the shut gate, the carter's fire, the letters, Wren before and after the seal,
 * the Rally Rune (Drum Circle), Bask's duel, the Fallen drift and Gorse's chisel, the West drift chest, Ottie and the humming cave, the
 * carvings, Burr's page, Gorse and the one-lifetime law, Apprentice Dunn, Warden Harrow (the warning, the wand
 * duel), THE LOSS and Harrow's bridge, the Hall bench and the Stonehollow tavern.
 *
 * THE LOSS (world rule 80) is fair in three ways. Warned: Harrow tells the kid what will happen before the duel
 * and lets them set their party first. Chosen: the envoy reads the order and the kid picks the five who stay
 * awake on a clear screen ({ ext: 'chooseCarry' }); backing out of it means the envoy simply waits by the door.
 * Temporary: every voice says "asleep, not gone", the order is kept in the bag, and the quest The Sleeping
 * Sanctum stays in the log until the seal is broken in chapter 8.
 */

import P from './places.js';

const RAMEN = 6;
const BED = 12;

export default {
  'ch6.gateshut': [
    { say: 'ch6.ev.gate.1', who: 'sign' },
    { say: 'ch6.ev.gate.2', who: 'companion' }
  ],
  'ch6.tamsin': [
    { say: 'ch6.ev.tamsin.1', who: 'tamsin' },
    { say: 'ch6.ev.tamsin.2', who: 'tamsin' },
    { blackout: 900, then: [{ sound: 'sizzle' }, { wait: 400 }, { heal: { hp: 'full' } }, { flag: 'c6:tamsin' }] },
    { toast: 'ch6.ev.tamsin.3' },
    { say: 'ch6.ev.tamsin.4', who: 'tamsin' },
    { give: 'dug_treat', n: 2 },
    { say: 'ch6.ev.tamsin.5', who: 'companion' }
  ],
  'ch6.letter': [
    { say: 'ch6.letter.1', who: 'mom' },
    { say: 'ch6.letter.2', who: 'dad' },
    { say: 'ch6.letter.3', who: 'mom' }
  ],
  'ch6.letter2': [
    { say: 'ch6.letter2.1', who: 'mom' },
    { say: 'ch6.letter2.2', who: 'mom' },
    { say: 'ch6.letter2.3', who: 'dad' },
    { say: 'ch6.letter2.4', who: 'mom' }
  ],
  'ch6.wren.meet': [
    { say: 'ch6.ev.wren.1', who: 'wren' },
    { say: 'ch6.ev.wren.2', who: 'wren' },
    { say: 'ch6.ev.wren.3', who: 'wren' },
    { say: 'ch6.ev.wren.4', who: 'kid' },
    { say: 'ch6.ev.wren.5', who: 'wren' }
  ],
  'ch6.wren.after': [
    { move: 'wren', to: { player: [0, -1] } },
    { face: 'wren', dir: 'player' },
    { say: 'ch6.ev.wrenafter.1', who: 'wren' },
    { say: 'ch6.ev.wrenafter.2', who: 'wren' },
    { say: 'ch6.ev.wrenafter.3', who: 'wren' },
    { say: 'ch6.ev.wrenafter.4', who: 'kid' },
    { say: 'ch6.ev.wrenafter.5', who: 'wren' },
    { say: 'ch6.ev.wrenafter.6', who: 'wren' },
    { say: 'ch6.ev.wrenafter.7', who: 'companion' },
    { say: 'ch6.ev.wrenafter.8', who: 'wren' },
    { give: 'spirit_snack', n: 2 },
    { move: 'wren', to: [P.shSouthGate.x, P.shSouthGate.y] },
    { flag: 'c6:wrenhome' },
    { say: 'ch6.ev.wrenafter.9', who: 'kid' }
  ],
  'ch6.teach': [
    { say: 'ch6.ev.drummer.1', who: 'drummer' },
    { note: [45, 45, 52, 45, 57], count: 4 },
    { say: 'ch6.ev.drummer.2', who: 'drummer' },
    { say: 'ch6.ev.drummer.3', who: 'drummer' },
    { ext: 'draw', sigil: 'boost', text: 'ch6.ev.drummer.draw' },
    { flag: 'c6:rune' },
    { ext: 'learn', spell: 'boost' },
    { sound: 'wand' },
    { say: 'ch6.ev.drummer.4', who: 'drummer' },
    { say: 'ch6.ev.drummer.5', who: 'drummer' },
    { say: 'ch6.ev.drummer.6', who: 'companion' }
  ],
  'ch6.svc.bask': [
    { if: 'c6:bask', then: [{ stop: true }] },
    { say: 'ch6.ev.bask.1', who: 'bask' },
    {
      choose: [
        { text: 'ch6.ev.bask.opt', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch6.ev.bask.2', who: 'bask' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      battle: { opponent: 'bask' },
      after: 'wake',
      won: [{ flag: 'c6:bask' }, { say: 'ch6.ev.bask.3', who: 'bask' }, { say: 'ch6.ev.bask.4', who: 'bask' }],
      else: [{ say: 'ch6.ev.bask.2', who: 'bask' }]
    }
  ],
  'ch6.drift': [
    { if: 'c6:chisel', then: [{ say: 'ch6.ev.shaft.done', who: 'kid' }, { stop: true }] },
    { say: 'ch6.ev.shaft.1', who: 'kid' },
    {
      if: { not: { has: 'miner_rope' } },
      then: [{ say: 'ch6.ev.shaft.2', who: 'companion' }, { stop: true }]
    },
    {
      choose: [
        { text: 'ch6.ev.shaft.opt', desc: 'ch6.ev.shaft.opt.desc', then: [] },
        { text: 'ch2.ev.notyet', then: [{ stop: true }] }
      ],
      cancel: 1
    },
    { blackout: 1200, then: [{ sound: 'creak' }, { wait: 500 }, { sound: 'step' }, { wait: 400 }, { flag: 'c6:chisel' }] },
    { say: 'ch6.ev.shaft.3', who: 'kid' },
    { give: 'carving_chisel' },
    { say: 'ch6.ev.shaft.4', who: 'kid' },
    { say: 'ch6.ev.shaft.5', who: 'companion' }
  ],
  'ch6.chest': [
    { if: 'c6:chest', then: [{ say: 'ch6.ev.chest.done', who: 'kid' }, { stop: true }] },
    { sound: 'creak' },
    { say: 'ch6.ev.chest.1', who: 'kid' },
    { flag: 'c6:chest' },
    { give: 'dug_treat', n: 2 },
    { give: 'herb', n: 2 },
    { say: 'ch6.ev.chest.2', who: 'companion' }
  ],
  'ch6.gorse.first': [
    { say: 'ch6.ev.gorse.1', who: 'gorse' },
    { say: 'ch6.ev.gorse.2', who: 'gorse' },
    { say: 'ch6.ev.gorse.3', who: 'gorse' },
    { flag: 'c6:gorse:met' },
    { quest: 'chisel', start: true }
  ],
  'ch6.gorse.law': [
    { say: 'ch6.ev.law.1', who: 'gorse' },
    { say: 'ch6.ev.law.2', who: 'gorse' },
    { say: 'ch6.ev.law.3', who: 'gorse' },
    { say: 'ch6.ev.law.4', who: 'kid' },
    { say: 'ch6.ev.law.5', who: 'gorse' },
    {
      if: 'c6:burr',
      then: [{ say: 'ch6.ev.law.6', who: 'kid' }, { say: 'ch6.ev.law.7', who: 'gorse' }],
      else: [{ say: 'ch6.ev.law.8', who: 'kid' }]
    },
    { flag: 'c6:gorse' },
    { say: 'ch6.ev.law.9', who: 'companion' }
  ],
  'ch6.chisel.back': [
    { say: 'ch6.ev.chisel.1', who: 'kid' },
    { take: 'carving_chisel' },
    { say: 'ch6.ev.chisel.2', who: 'gorse' },
    { say: 'ch6.ev.chisel.3', who: 'gorse' },
    { flag: 'c6:chisel:back' },
    { money: 30, why: 'ch6.ev.chisel.why' },
    { say: 'ch6.ev.chisel.4', who: 'briar' }
  ],
  'ch6.ottie.first': [
    { say: 'ch6.ev.ottie.1', who: 'ottie' },
    { say: 'ch6.ev.ottie.2', who: 'ottie' },
    { say: 'ch6.ev.ottie.3', who: 'mara' },
    { flag: 'c6:ottie:asked' },
    { quest: 'ottie', start: true }
  ],
  'ch6.ottie.tell': [
    { say: 'ch6.ev.ottie.4', who: 'kid' },
    { say: 'ch6.ev.ottie.5', who: 'ottie' },
    { say: 'ch6.ev.ottie.6', who: 'kid' },
    { flag: 'c6:ottie' },
    { say: 'ch6.ev.ottie.7', who: 'mara' },
    { give: 'dug_treat', n: 3 },
    { say: 'ch6.ev.ottie.8', who: 'ottie' }
  ],
  'ch6.carvings': [
    { wait: 300 },
    {
      if: { has: 'lantern' },
      then: [{ say: 'ch6.ev.carvings.light', who: 'kid' }],
      else: [{ say: 'ch6.ev.carvings.dark', who: 'kid' }]
    },
    { say: 'ch6.ev.carvings.1', who: 'kid' },
    { say: 'ch6.ev.carvings.2', who: 'kid' },
    { say: 'ch6.ev.carvings.3', who: 'kid' },
    { wait: 400 },
    { say: 'ch6.ev.carvings.4', who: 'kid' },
    { say: 'ch6.ev.carvings.5', who: 'kid' },
    { say: 'ch6.ev.carvings.6', who: 'companion' },
    { say: 'ch6.ev.carvings.7', who: 'kid' },
    { flag: 'c6:carvings' }
  ],
  'ch6.burrletter': [
    { say: 'ch6.burr.1', who: 'burr' },
    { say: 'ch6.burr.2', who: 'burr' },
    { say: 'ch6.burr.3', who: 'burr' }
  ],
  'ch6.burrpage': [
    { say: 'ch6.burrpage.1', who: 'letter' },
    { say: 'ch6.burrpage.2', who: 'letter' }
  ],
  'ch6.order': [
    { say: 'ch6.order.1', who: 'letter' },
    { say: 'ch6.order.2', who: 'letter' },
    { say: 'ch6.order.3', who: 'orlen' },
    { say: 'ch6.order.4', who: 'orlen' }
  ],
  'ch6.dunn': [
    {
      if: { not: 'c6:dunn:met' },
      then: [
        { say: 'ch6.ev.dunn.1', who: 'dunn_hollow' },
        { say: 'ch6.ev.dunn.2', who: 'dunn_hollow' },
        { flag: 'c6:dunn:met' }
      ]
    },
    { say: 'ch6.ev.dunn.3', who: 'dunn_hollow' },
    {
      choose: [
        { text: 'ch6.ev.dunn.opt', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch6.ev.dunn.wait', who: 'dunn_hollow' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      battle: { opponent: 'dunn_hollow' },
      after: 'wake',
      won: [
        { flag: 'c6:dunn' },
        { say: 'ch6.ev.dunn.4', who: 'dunn_hollow' },
        { say: 'ch6.ev.dunn.5', who: 'dunn_hollow' },
        { if: { not: { ext: 'spell', has: 'boost' } }, then: [{ say: 'ch6.ev.dunn.6', who: 'dunn_hollow' }] },
        { if: { ext: 'lead', stage: { gte: 4 } }, then: [{ say: 'ch6.ev.dunn.grown', who: 'companion' }] }
      ],
      else: [{ say: 'ch6.ev.dunn.lost', who: 'dunn_hollow' }]
    }
  ],
  'ch6.harrow.first': [
    { say: 'ch6.ev.harrow.first.1', who: 'harrow' },
    { say: 'ch6.ev.harrow.first.2', who: 'harrow' },
    { say: 'ch6.ev.harrow.first.3', who: 'harrow' }
  ],
  /* the warning comes before the duel, every time until the seal, short after the first */
  'ch6.harrow.warn': [
    {
      if: { not: 'c6:warned' },
      then: [
        { say: 'ch6.ev.warn.1', who: 'harrow' },
        { say: 'ch6.ev.warn.2', who: 'harrow' },
        { say: 'ch6.ev.warn.3', who: 'harrow' },
        { say: 'ch6.ev.warn.4', who: 'harrow' },
        { say: 'ch6.ev.warn.5', who: 'kid' },
        { flag: 'c6:warned' },
        { helper: 'c6_seal', title: 'ch6.help.seal.title', text: 'ch6.help.seal', icon: 'wand' }
      ],
      else: [{ say: 'ch6.ev.warn.again', who: 'harrow' }]
    }
  ],
  'ch6.harrow.duel': [
    { run: 'ch6.harrow.warn' },
    {
      choose: [
        { text: 'ch6.ev.duel.go', desc: 'ch6.ev.duel.go.desc', then: [] },
        { text: 'ch6.ev.duel.wait', desc: 'ch6.ev.duel.wait.desc', then: [{ say: 'ch6.ev.duel.later', who: 'harrow' }, { stop: true }] }
      ],
      cancel: 1
    },
    { say: 'ch6.ev.duel.1', who: 'harrow' },
    { helper: 'c6_wandduel', title: 'ch6.help.wandduel.title', text: 'ch6.help.wandduel', icon: 'wand' },
    {
      battle: { opponent: 'harrow' },
      won: [
        { flag: 'c6:ring' },
        { ext: 'ring', element: 'earth' },
        { give: 'stone_ring' },
        { money: 50, why: 'ch2.ev.15' },
        { say: 'ch6.ev.ring.1', who: 'harrow' },
        { say: 'ch6.ev.ring.2', who: 'harrow' },
        { say: 'ch6.ev.ring.3', who: 'companion' },
        { wait: 500 },
        { sound: 'creak' },
        { spawn: 'envoy', at: { map: 'bedrock_hall', x: P.hallDoor.x, y: P.hallDoor.y, dir: 1 } },
        { move: 'envoy', to: { player: [0, 2] } },
        { face: 'envoy', dir: 'player' },
        { say: 'ch6.ev.ring.4', who: 'harrow' },
        { run: 'ch6.seal' }
      ],
      else: [{ say: 'ch6.ev.duel.lost.1', who: 'harrow' }, { say: 'ch6.ev.duel.lost.2', who: 'harrow' }]
    }
  ],
  /* THE LOSS: the order, the choice of five, the seal. Backing out leaves the envoy waiting; nothing is lost yet */
  'ch6.seal': [
    { face: 'envoy', dir: 'player' },
    {
      if: { not: 'c6:order' },
      then: [
        { say: 'ch6.ev.seal.1', who: 'envoy' },
        {
          if: { flag: 'c5:token', is: 'kept' },
          then: [{ say: 'ch6.ev.seal.token', who: 'kid' }],
          else: [{ say: 'ch6.ev.seal.notoken', who: 'kid' }]
        },
        { say: 'ch6.ev.seal.2', who: 'envoy' },
        { say: 'ch6.ev.seal.3', who: 'envoy' },
        { say: 'ch6.ev.seal.4', who: 'envoy' },
        { say: 'ch6.order.3', who: 'orlen' },
        { say: 'ch6.order.4', who: 'orlen' },
        { give: 'sanctum_order' },
        { flag: 'c6:order' },
        { say: 'ch6.ev.seal.5', who: 'kid' },
        { say: 'ch6.ev.seal.6', who: 'harrow' }
      ],
      else: [{ say: 'ch6.ev.seal.back', who: 'envoy' }]
    },
    { say: 'ch6.ev.seal.7', who: 'envoy' },
    {
      choose: [
        { text: 'ch6.ev.seal.opt', desc: 'ch6.ev.seal.opt.desc', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch6.ev.seal.wait', who: 'envoy' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      if: { ext: 'sanctum', count: { gte: 1 } },
      then: [
        {
          ext: 'chooseCarry',
          n: 5,
          title: 'ch6.carry.title',
          sub: 'ch6.carry.sub',
          confirm: 'ch6.carry.confirm',
          then: [],
          else: [{ say: 'ch6.ev.seal.wait', who: 'envoy' }, { stop: true }]
        }
      ],
      else: [{ say: 'ch6.ev.seal.all', who: 'kid' }]
    },
    { say: 'ch6.ev.seal.8', who: 'envoy' },
    { sound: 'step' },
    { fx: 'smoke', n: 5, dy: -10, at: 'player' },
    { ext: 'sanctum', seal: true },
    { flag: 'c6:sealed' },
    { toast: 'ch6.ev.seal.toast' },
    { wait: 400 },
    { say: 'ch6.ev.seal.9', who: 'kid' },
    { say: 'ch6.ev.seal.10', who: 'companion' },
    { say: 'ch6.ev.seal.11', who: 'envoy' },
    { remove: 'envoy' },
    { wait: 400 },
    { quest: 'sanctum', start: true },
    { run: 'ch6.bridge' }
  ],
  'ch6.bridge': [
    { face: 'harrow', dir: 'player' },
    { say: 'ch6.ev.bridge.1', who: 'harrow' },
    { say: 'ch6.ev.bridge.2', who: 'harrow' },
    { say: 'ch6.ev.bridge.3', who: 'harrow' },
    { say: 'ch6.ev.bridge.4', who: 'harrow' },
    { shake: 0.6 },
    { sound: 'creak' },
    { flag: 'c6:bridge' },
    { toast: 'ch6.ev.bridge.toast' },
    { say: 'ch6.ev.bridge.5', who: 'harrow' },
    { say: 'ch6.ev.bridge.6', who: 'harrow' },
    { say: 'ch6.ev.bridge.7', who: 'companion' }
  ],
  'ch6.svc.hallbench': [
    { say: 'ch6.ev.bench.1', who: 'kid' },
    { blackout: 900, then: [{ wait: 400 }, { heal: { hp: 'full', rest: true } }, { ext: 'mana', set: 'full' }] },
    { toast: 'ch6.ev.bench.2' }
  ],
  'ch6.svc.guestbed': [
    { say: 'ch6.inn.1', who: 'sh_innkeeper', params: { coins: { coins: BED } } },
    {
      choose: [
        { text: 'ch1.bo.opt.rest', then: [] },
        { text: 'ch1.bo.opt.no', then: [{ say: 'ch6.inn.2', who: 'sh_innkeeper' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      spend: BED,
      fail: [{ say: 'ch6.inn.3', who: 'sh_innkeeper', params: { coins: { coins: BED } } }, { stop: true }]
    },
    { sound: 'sleep' },
    { fade: 800 },
    { rest: { hours: 8 } },
    { toast: 'ch1.bo.4' },
    { if: { companion: true }, then: [{ say: 'ch6.inn.4', who: 'companion' }] }
  ],
  'ch6.svc.ramen': [
    { say: 'ch6.inn.5', who: 'sh_innkeeper' },
    {
      choose: [
        { text: 'ch1.bo.opt.ramen', params: { price: { coins: RAMEN } }, then: [] },
        { text: 'ch1.bo.opt.bed', params: { coins: { coins: BED } }, then: [{ run: 'ch6.svc.guestbed' }, { stop: true }] },
        { text: 'ch1.bo.opt.none', then: [{ say: 'ch6.inn.2', who: 'sh_innkeeper' }, { stop: true }] }
      ],
      cancel: 2
    },
    {
      spend: RAMEN,
      fail: [{ say: 'ch6.inn.6', who: 'sh_innkeeper', params: { coins: { coins: RAMEN } } }, { stop: true }]
    },
    { heal: { hp: 'full', rest: true } },
    { ext: 'mana', set: 'full' },
    { sound: 'sparkle' },
    { fx: 'smoke', n: 6, dy: -14 },
    { toast: 'ch1.bo.10' },
    { say: 'ch6.inn.7', who: 'sh_innkeeper' }
  ]
};
