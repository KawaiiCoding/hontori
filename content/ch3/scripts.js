/*
 * ch3/scripts.js
 * Job: the scripts of chapter 3: the rockslide, the two letters from home, the Kite House, the broken bridge and
 * Orlen Vael, The Lost Kite and Cole's note, the bell tower, Hask's family, the vanes, the three bells of Gale Loft,
 * the ring duel, Cole's rematch, and the Kitewick tavern.
 */

export default {
  'ch3.slide': [
    { say: 'ch3.ev.slide.1', who: 'kid' },
    {
      if: { all: [{ ext: 'full' }, { not: 'c2:ring' }] },
      then: [{ say: 'ch3.ev.slide.2', who: 'dunn' }],
      else: [{ say: 'ch3.ev.slide.3', who: 'dunn' }]
    }
  ],
  'ch3.letter1': [
    { say: 'ch3.letter1.1', who: 'mom' },
    { say: 'ch3.letter1.2', who: 'mom' },
    { say: 'ch3.letter1.3', who: 'dad' },
    { say: 'ch3.letter1.4', who: 'dad' }
  ],
  'ch3.letter2': [
    { say: 'ch3.letter2.1', who: 'mom' },
    { say: 'ch3.letter2.2', who: 'dad' },
    { say: 'ch3.letter2.3', who: 'mom' }
  ],
  'ch3.colenote': [
    { say: 'ch3.colenote.1', who: 'cole' },
    { say: 'ch3.colenote.2', who: 'cole' },
    { say: 'ch3.colenote.3', who: 'cole' }
  ],
  'ch3.svc.keeper': [
    { if: { not: { ext: 'spell', has: 'shield' } }, then: [{ stop: true }] },
    { if: { has: 'kite' }, then: [{ stop: true }] },
    { say: 'ch3.ev.keeper.kite.1', who: 'kite_keeper' },
    { give: 'kite' },
    { if: { not: { has: 'kite' } }, then: [{ say: 'ch3.ev.keeper.kite.2', who: 'kite_keeper' }] }
  ],
  'ch3.bridge': [
    {
      if: { not: 'c3:bridge:seen' },
      then: [
        { say: 'ch3.ev.bridge.1', who: 'kid' },
        { say: 'ch3.ev.bridge.2', who: 'hask' },
        { say: 'ch3.ev.bridge.3', who: 'hask' },
        { flag: 'c3:bridge:seen' }
      ]
    },
    { spawn: 'orlen', at: { map: 'kitewick', x: 44, y: 20, dir: 3 } },
    { move: 'orlen', to: 'player' },
    { face: 'orlen', dir: 'player' },
    { say: 'ch3.ev.orlen.1', who: 'orlen' },
    { say: 'ch3.ev.orlen.2', who: 'kid' },
    { say: 'ch3.ev.orlen.3', who: 'orlen' },
    { say: 'ch3.ev.orlen.4', who: 'orlen' },
    { say: 'ch3.ev.orlen.5', who: 'hask' },
    { say: 'ch3.ev.orlen.6', who: 'orlen' },
    { say: 'ch3.ev.orlen.7', who: 'orlen' },
    { say: 'ch3.ev.orlen.8', who: 'orlen' },
    { give: 'token' },
    { say: 'ch3.ev.orlen.9', who: 'orlen' },
    { remove: 'orlen' },
    {
      blackout: 900,
      then: [{ sound: 'creak' }, { wait: 300 }, { sound: 'step' }, { flag: 'c3:bridge' }, { time: { add: 2 } }]
    },
    { toast: 'ch3.ev.bridge.4' },
    { say: 'ch3.ev.bridge.5', who: 'hask' },
    { say: 'ch3.ev.bridge.6', who: 'kid' },
    { say: 'ch3.ev.bridge.7', who: 'companion' }
  ],
  'ch3.svc.hask': [
    { if: { not: 'c3:bridge' }, then: [{ run: 'ch3.bridge' }, { stop: true }] },
    { if: 'c3:family', then: [{ stop: true }] },
    { say: 'ch3.ev.hask.1', who: 'hask' },
    { say: 'ch3.ev.hask.2', who: 'hask' },
    { if: { quest: 'family', is: 'none' }, then: [{ quest: 'family', start: true }] }
  ],
  'ch3.family': [
    { if: { quest: 'family', is: 'none' }, then: [{ quest: 'family', start: true, quiet: true }] },
    { say: 'ch3.ev.family.1', who: 'ama' },
    { say: 'ch3.ev.family.2', who: 'kid' },
    { say: 'ch3.ev.family.3', who: 'rue' },
    { say: 'ch3.ev.family.4', who: 'ama' },
    {
      blackout: 900,
      then: [{ sound: 'sizzle' }, { wait: 400 }, { heal: { hp: 'full' } }, { ext: 'mana', set: 'full' }, { flag: 'c3:family' }]
    },
    { toast: 'ch3.ev.family.5' },
    { say: 'ch3.ev.family.6', who: 'ama' },
    { give: 'wild_herb', n: 2 },
    { say: 'ch3.ev.family.7', who: 'companion' }
  ],
  'ch3.kiteflight': [
    { if: { not: { has: 'kite' } }, then: [{ say: 'ch3.ev.kite.1', who: 'wila' }, { stop: true }] },
    { say: 'ch3.ev.kite.3', who: 'wila' },
    {
      choose: [
        { text: 'ch3.ev.kite.opt', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch3.ev.kite.4', who: 'wila' }, { stop: true }] }
      ],
      cancel: 1
    },
    { ext: 'kiteFlight', mode: 'fly', to: [25, 25], bring: 'cole_kite_note' },
    { say: 'ch3.ev.kite.5', who: 'kid' },
    { give: 'cole_kite_note' },
    { flag: 'c3:kite:note' },
    { say: 'ch3.ev.kite.6', who: 'kid' },
    { run: 'ch3.colenote' },
    { say: 'ch3.ev.kite.7', who: 'kid' },
    { say: 'ch3.ev.kite.8', who: 'companion' },
    { say: 'ch3.ev.kite.9', who: 'wila' },
    { money: 20, why: 'ch3.ev.kite.why' },
    /* Cole walks up to the kite post, so he is there when his quest points at it */
    { place: 'cole', at: [19, 20] },
    { move: 'cole', to: [25, 20] },
    { face: 'cole', dir: 'player' },
    { say: 'ch3.ev.kite.10', who: 'cole' },
    { quest: 'colerematch', start: true }
  ],
  'ch3.bell': [
    {
      if: { not: { ext: 'spell', has: 'shield' } },
      then: [{ say: 'ch3.ev.bell.1', who: 'oda' }, { say: 'ch3.ev.bell.2', who: 'companion' }, { stop: true }]
    },
    {
      choose: [
        { text: 'ch3.ev.bell.opt', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch3.ev.bell.3', who: 'oda' }, { stop: true }] }
      ],
      cancel: 1
    },
    { say: 'ch3.ev.bell.4', who: 'oda' },
    { ext: 'draw', sigil: 'shield', text: 'ch3.ev.bell.draw' },
    { sound: 'spell' },
    { fx: 'magic', n: 12, dy: -16 },
    { wait: 500 },
    { say: 'ch3.ev.bell.5', who: 'kid' },
    { flag: 'c3:bell' },
    { wait: 300 },
    { sound: 'bell' },
    { say: 'ch3.ev.bell.6', who: 'oda' },
    { money: 20, why: 'ch3.ev.bell.why' },
    { say: 'ch3.ev.bell.7', who: 'kid' },
    {
      choose: [
        { text: 'ch3.ev.bell.take', then: [{ ext: 'addHontori', kind: 'kestrip', level: 8 }, { say: 'ch3.ev.bell.8', who: 'companion' }] },
        { text: 'ch3.ev.bell.leave', then: [{ say: 'ch3.ev.bell.9', who: 'oda' }] }
      ],
      cancel: 1
    }
  ],
  'ch3.svc.vanes': [
    { if: 'c3:vanes', then: [{ say: 'ch3.ev.vanes.1', who: 'lio' }, { stop: true }] },
    {
      choose: [
        {
          text: 'ch3.ev.vanes.2',
          then: [{ puzzle: 'vanes', do: 'reset' }, { sound: 'spin' }, { say: 'ch3.ev.vanes.3', who: 'lio' }]
        },
        { text: 'ch3.ev.vanes.4', then: [{ say: 'ch3.ev.vanes.5', who: 'lio' }] }
      ],
      cancel: 1
    }
  ],
  'ch3.svc.loftbench': [
    { if: 'c3:loft:rested', then: [{ say: 'ch3.ev.loftbench.3', who: 'tolle' }, { stop: true }] },
    { say: 'ch3.ev.loftbench.1', who: 'tolle' },
    { blackout: 900, then: [{ wait: 400 }, { heal: { hp: 'full', rest: true } }, { ext: 'mana', set: 'full' }, { flag: 'c3:loft:rested' }] },
    { toast: 'ch3.ev.loftbench.2' }
  ],
  'ch3.bells.try': [
    {
      if: { not: { ext: 'spell', has: 'shield' } },
      then: [{ say: 'ch3.ev.zephra.6', who: 'zephra' }, { stop: true }]
    },
    { run: 'ch3.bells' }
  ],
  'ch3.bells': [
    { say: 'ch3.ev.bells.1', who: 'zephra' },
    { ext: 'draw', sigil: 'shield', text: 'ch3.ev.bells.draw.1', twist: 'drift' },
    { sound: 'chime' },
    { toast: 'ch3.ev.bells.still.1' },
    { wait: 500 },
    { say: 'ch3.ev.bells.2', who: 'zephra' },
    { ext: 'draw', sigil: 'shield', text: 'ch3.ev.bells.draw.2', twist: 'drift' },
    { sound: 'chime' },
    { toast: 'ch3.ev.bells.still.2' },
    { wait: 500 },
    { say: 'ch3.ev.bells.3', who: 'zephra' },
    { ext: 'draw', sigil: 'shield', text: 'ch3.ev.bells.draw.3', twist: 'drift' },
    { sound: 'chime' },
    { toast: 'ch3.ev.bells.still.3' },
    { wait: 500 },
    { flag: 'c3:wand' },
    { say: 'ch3.ev.bells.4', who: 'zephra' },
    { say: 'ch3.ev.bells.5', who: 'companion' }
  ],
  'ch3.ringduel': [
    { say: 'ch3.ev.ring.1', who: 'zephra' },
    { say: 'ch3.ev.ring.2', who: 'zephra' },
    {
      choose: [
        { text: 'ch2.ev.13', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch3.ev.ring.3', who: 'zephra' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      battle: { opponent: 'zephra' },
      after: 'wake',
      won: [
        { flag: 'c3:ring' },
        { ext: 'ring', element: 'wind' },
        { give: 'gale_ring' },
        { money: 50, why: 'ch2.ev.15' },
        { say: 'ch3.ev.ring.4', who: 'zephra' },
        { say: 'ch3.ev.ring.5', who: 'zephra' },
        { say: 'ch3.ev.ring.6', who: 'zephra' },
        { say: 'ch3.ev.ring.7', who: 'companion' }
      ],
      else: [{ say: 'ch3.ev.ring.8', who: 'zephra' }]
    }
  ],
  'ch3.svc.cole': [
    { if: 'c3:cole', then: [{ say: 'ch3.ev.cole.done', who: 'cole' }, { stop: true }] },
    { say: 'ch3.ev.cole.5', who: 'cole' },
    {
      choose: [
        { text: 'ch1.duel.opt.cole', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch3.ev.cole.6', who: 'cole' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      battle: { opponent: 'cole_kitewick' },
      after: 'wake',
      won: [
        { flag: 'c3:cole' },
        { say: 'ch3.ev.cole.7', who: 'cole' },
        { say: 'ch3.ev.cole.8', who: 'cole' },
        { say: 'ch3.ev.cole.9', who: 'companion' }
      ],
      else: [{ say: 'ch3.ev.cole.10', who: 'cole' }]
    }
  ],
  'ch3.svc.guestbed': [
    { say: 'ch3.inn.1', who: 'kw_innkeeper', params: { coins: { coins: { price: 'guest_bed' } } } },
    {
      choose: [
        { text: 'ch1.bo.opt.rest', then: [] },
        { text: 'ch1.bo.opt.no', then: [{ say: 'ch3.inn.2', who: 'kw_innkeeper' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      spend: { price: 'guest_bed' },
      fail: [{ say: 'ch3.inn.3', who: 'kw_innkeeper', params: { coins: { coins: { price: 'guest_bed' } } } }, { stop: true }]
    },
    { sound: 'sleep' },
    { fade: 800 },
    { rest: { hours: 8 } },
    { toast: 'ch1.bo.4' },
    { if: { companion: true }, then: [{ say: 'ch3.inn.4', who: 'companion' }] }
  ],
  'ch3.svc.ramen': [
    { say: 'ch3.inn.5', who: 'kw_innkeeper' },
    {
      choose: [
        { text: 'ch1.bo.opt.ramen', params: { price: { coins: { price: 'ramen' } } }, then: [] },
        {
          text: 'ch1.bo.opt.bed',
          params: { coins: { coins: { price: 'guest_bed' } } },
          then: [{ run: 'ch3.svc.guestbed' }, { stop: true }]
        },
        { text: 'ch1.bo.opt.none', then: [{ say: 'ch3.inn.2', who: 'kw_innkeeper' }, { stop: true }] }
      ],
      cancel: 2
    },
    {
      spend: { price: 'ramen' },
      fail: [{ say: 'ch3.inn.6', who: 'kw_innkeeper', params: { coins: { coins: { price: 'ramen' } } } }, { stop: true }]
    },
    { heal: { hp: 'full', rest: true } },
    { ext: 'mana', set: 'full' },
    { sound: 'sparkle' },
    { fx: 'smoke', n: 6, dy: -14 },
    { toast: 'ch1.bo.10' },
    { say: 'ch3.inn.7', who: 'kw_innkeeper' }
  ]
};
