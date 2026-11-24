/*
 * ch5/scripts.js
 * Job: the scripts of chapter 5: the pedlar's fire, the letters, the Thunder Seal (Tinker's Shed, with Dov as the
 * second teacher on Sparkmoor), the lamp that cries, the square and the choice, the Token, Master Ashfield and
 * Cole, the stopped clock, the grey cloaks at the north gate, the circuit door, the three loose sparks, the
 * gauntlet with its save points, the Works bench, and the Coilhaven tavern (dearer than elsewhere).
 * The gauntlet is content `gauntlets.storm` (./gauntlets.js), run by { ext: 'gauntlet' }: Pim, then Foreman
 * Grell, then Volta, with a save point before each duel; a lost duel puts everything back as it was at that
 * save point, so the next try starts at the same duel. Leaving the Works ends the run.
 */

const RAMEN = 8;
const BED = 15;

export default {
  'ch5.suri': [
    { say: 'ch5.ev.suri.1', who: 'suri' },
    { say: 'ch5.ev.suri.2', who: 'suri' },
    { blackout: 900, then: [{ sound: 'sizzle' }, { wait: 400 }, { heal: { hp: 'full' } }, { flag: 'c5:suri' }] },
    { toast: 'ch5.ev.suri.3' },
    { say: 'ch5.ev.suri.4', who: 'suri' },
    { give: 'spirit_snack' },
    { say: 'ch5.ev.suri.5', who: 'companion' }
  ],
  'ch5.letter': [
    { say: 'ch5.letter.1', who: 'mom' },
    { say: 'ch5.letter.2', who: 'mom' },
    { say: 'ch5.letter.3', who: 'dad' },
    { say: 'ch5.letter.4', who: 'dad' }
  ],
  'ch5.letter2': [
    { say: 'ch5.letter2.1', who: 'mom' },
    { say: 'ch5.letter2.2', who: 'dad' },
    { say: 'ch5.letter2.3', who: 'mom' }
  ],
  'ch5.jartag': [
    { say: 'ch5.jartag.1', who: 'letter' },
    { say: 'ch5.jartag.2', who: 'letter' }
  ],
  'ch5.teach': [
    { say: 'ch5.ev.tinker.1', who: 'tinker' },
    { say: 'ch5.ev.tinker.2', who: 'tinker' },
    { say: 'ch5.ev.tinker.3', who: 'tinker' },
    { ext: 'draw', sigil: 'stun', text: 'ch5.ev.tinker.draw' },
    { flag: 'c5:seal' },
    { ext: 'learn', spell: 'stun' },
    { sound: 'wand' },
    { say: 'ch5.ev.tinker.4', who: 'tinker' },
    { say: 'ch5.ev.tinker.5', who: 'companion' },
    { if: { not: 'c5:spark' }, then: [{ say: 'ch5.ev.tinker.lamp.1', who: 'tinker' }, { say: 'ch5.ev.tinker.lamp.2', who: 'tinker' }] }
  ],
  'ch5.teach.dov': [
    { say: 'ch5.ev.dov.teach.1', who: 'dov' },
    { say: 'ch5.ev.tinker.3', who: 'dov' },
    { ext: 'draw', sigil: 'stun', text: 'ch5.ev.tinker.draw' },
    { flag: 'c5:seal' },
    { ext: 'learn', spell: 'stun' },
    { sound: 'wand' },
    { say: 'ch5.ev.dov.teach.2', who: 'dov' },
    { say: 'ch5.ev.tinker.5', who: 'companion' }
  ],
  'ch5.roadshut': [
    { say: 'ch5.ev.roadshut.1', who: 'sign' },
    { say: 'ch5.ev.roadshut.2', who: 'companion' }
  ],
  'ch5.spark': [
    { if: 'c5:spark', then: [{ run: 'ch5.square' }, { stop: true }] },
    {
      if: { not: 'c5:spark:seen' },
      then: [
        { say: 'ch5.ev.spark.1', who: 'kid' },
        { say: 'ch5.ev.spark.2', who: 'kid' },
        { say: 'ch5.ev.spark.3', who: 'kid' },
        { say: 'ch5.ev.spark.4', who: 'companion' },
        { flag: 'c5:spark:seen' }
      ]
    },
    {
      choose: [
        { text: 'ch5.ev.spark.opt', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch5.ev.spark.5', who: 'kid' }, { stop: true }] }
      ],
      cancel: 1
    },
    { ext: 'draw', sigil: 'veil', text: 'ch5.ev.spark.draw' },
    { sound: 'spell' },
    { fx: 'magic', n: 14, dy: -20 },
    { wait: 600 },
    { sound: 'sparkle' },
    { say: 'ch5.ev.spark.6', who: 'kid' },
    { flag: 'c5:spark' },
    { give: 'freed_spark_note' },
    { say: 'ch5.ev.spark.7', who: 'kid' },
    { say: 'ch5.ev.spark.8', who: 'kid' },
    {
      choose: [
        { text: 'ch5.ev.spark.take', then: [{ ext: 'addHontori', kind: 'electric', level: 14 }, { say: 'ch5.ev.spark.9', who: 'companion' }] },
        { text: 'ch5.ev.spark.leave', then: [{ say: 'ch5.ev.spark.10', who: 'kid' }, { say: 'ch5.ev.spark.11', who: 'companion' }] }
      ],
      cancel: 1
    },
    { wait: 400 },
    { run: 'ch5.square' }
  ],
  'ch5.square': [
    { say: 'ch5.ev.square.1', who: 'kid' },
    { spawn: 'greycloak_road1', at: { map: 'coilhaven', x: 31, y: 6, dir: 0 } },
    { spawn: 'greycloak_road2', at: { map: 'coilhaven', x: 32, y: 6, dir: 0 } },
    /* the kid faces the lamp from the street side; the two cloaks come up the open street behind */
    { place: 'greycloak_road1', at: { player: [-2, 2] } },
    { place: 'greycloak_road2', at: { player: [2, 2] } },
    { move: 'greycloak_road1', to: { player: [-1, 1] } },
    { move: 'greycloak_road2', to: { player: [1, 1] } },
    { face: 'greycloak_road1', dir: 'player' },
    { face: 'greycloak_road2', dir: 'player' },
    { say: 'ch5.ev.square.2', who: 'greycloak_road1' },
    { say: 'ch5.ev.square.3', who: 'greycloak_road2' },
    { say: 'ch5.ev.square.4', who: 'kid' },
    {
      choose: [
        {
          text: 'ch5.ev.square.speak',
          desc: 'ch5.ev.square.speak.desc',
          then: [
            { say: 'ch5.ev.square.5', who: 'kid' },
            { say: 'ch5.ev.square.6', who: 'kid' },
            { say: 'ch5.ev.square.7', who: 'greycloak_road2' },
            { say: 'ch5.ev.square.8', who: 'kid' },
            { flag: 'c5:spoke' }
          ]
        },
        {
          text: 'ch5.ev.square.quiet',
          desc: 'ch5.ev.square.quiet.desc',
          then: [
            { say: 'ch5.ev.square.9', who: 'kid' },
            { say: 'ch5.ev.square.10', who: 'greycloak_road2' },
            { say: 'ch5.ev.square.11', who: 'kid' },
            { flag: 'c5:quiet' }
          ]
        }
      ]
    },
    { flag: 'c5:choice' },
    { say: 'ch5.ev.square.12', who: 'greycloak_road1' },
    { say: 'ch5.ev.square.13', who: 'greycloak_road1' },
    { remove: 'greycloak_road1' },
    { remove: 'greycloak_road2' },
    /* after speaking out, the two cloaks wait at the north gate (maps lane spot "cloaks") */
    {
      if: 'c5:spoke',
      then: [
        { spawn: 'greycloak_road1', at: { map: 'coilhaven', x: 31, y: 6, dir: 0 } },
        { spawn: 'greycloak_road2', at: { map: 'coilhaven', x: 32, y: 6, dir: 0 } }
      ]
    },
    { wait: 400 },
    { if: { has: 'token' }, then: [{ run: 'ch5.token' }] },
    { say: 'ch5.ev.square.14', who: 'kid' },
    { quest: 'ringsmith', start: true }
  ],
  'ch5.token': [
    { say: 'ch5.ev.token.1', who: 'kid' },
    { say: 'ch5.ev.token.2', who: 'kid' },
    { say: 'ch5.ev.token.3', who: 'companion' },
    {
      choose: [
        {
          text: 'ch5.ev.token.drop',
          desc: 'ch5.ev.token.drop.desc',
          then: [
            { blackout: 900, then: [{ sound: 'step' }, { wait: 300 }, { take: 'token' }, { flag: 'c5:token', value: 'dropped' }] },
            { say: 'ch5.ev.token.4', who: 'kid' },
            { say: 'ch5.ev.token.5', who: 'companion' }
          ]
        },
        {
          text: 'ch5.ev.token.keep',
          desc: 'ch5.ev.token.keep.desc',
          then: [
            { flag: 'c5:token', value: 'kept' },
            { say: 'ch5.ev.token.6', who: 'kid' },
            { say: 'ch5.ev.token.7', who: 'companion' }
          ]
        }
      ]
    }
  ],
  'ch5.ashfield': [
    { say: 'ch5.ev.ashfield.1', who: 'kid' },
    { say: 'ch5.ev.ashfield.2', who: 'bram_ashfield' },
    { say: 'ch5.ev.ashfield.3', who: 'kid' },
    { say: 'ch5.ev.ashfield.4', who: 'bram_ashfield' },
    /* Cole comes in at the workshop door; from here on his chapter 1 entry has a Coilhaven phase (c5:cole) */
    { flag: 'c5:cole' },
    { place: 'cole', at: [7, 8] },
    { move: 'cole', to: { player: [1, 0] } },
    { face: 'cole', dir: 'player' },
    { say: 'ch5.ev.ashfield.5', who: 'cole' },
    { say: 'ch5.ev.ashfield.6', who: 'bram_ashfield' },
    { say: 'ch5.ev.ashfield.7', who: 'cole' },
    { say: 'ch5.ev.ashfield.8', who: 'cole' },
    { say: 'ch5.ev.ashfield.9', who: 'cole' },
    { say: 'ch5.ev.ashfield.10', who: 'bram_ashfield' },
    { say: 'ch5.ev.ashfield.11', who: 'cole' },
    { say: 'ch5.ev.ashfield.12', who: 'bram_ashfield' },
    { say: 'ch5.ev.ashfield.13', who: 'cole' },
    { flag: 'c5:ashfield' },
    { say: 'ch5.ev.ashfield.14', who: 'kid' },
    { say: 'ch5.ev.ashfield.15', who: 'companion' }
  ],
  'ch5.clock': [
    {
      if: { not: 'c5:clock:asked' },
      then: [
        { say: 'ch5.ev.clock.1', who: 'hettie' },
        { say: 'ch5.ev.clock.2', who: 'hettie' },
        { flag: 'c5:clock:asked' },
        { quest: 'clock', start: true }
      ]
    },
    {
      if: { not: { ext: 'spell', has: 'stun' } },
      then: [{ say: 'ch5.ev.clock.3', who: 'hettie' }, { say: 'ch5.ev.clock.4', who: 'companion' }, { stop: true }]
    },
    {
      choose: [
        { text: 'ch5.ev.clock.opt', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch5.ev.clock.5', who: 'hettie' }, { stop: true }] }
      ],
      cancel: 1
    },
    { ext: 'draw', sigil: 'stun', text: 'ch5.ev.clock.draw' },
    { sound: 'spell' },
    { fx: 'magic', n: 10, dy: -14 },
    { wait: 500 },
    { say: 'ch5.ev.clock.6', who: 'kid' },
    { flag: 'c5:clock' },
    { sound: 'chime' },
    { say: 'ch5.ev.clock.7', who: 'hettie' },
    { money: 20, why: 'ch5.ev.clock.why' },
    {
      choose: [
        { text: 'ch5.ev.clock.take', then: [{ ext: 'addHontori', kind: 'sparkmouse', level: 14 }, { say: 'ch5.ev.clock.8', who: 'companion' }] },
        { text: 'ch5.ev.clock.leave', then: [{ say: 'ch5.ev.clock.9', who: 'hettie' }] }
      ],
      cancel: 1
    }
  ],
  'ch5.cloaks': [
    { face: 'greycloak_road1', dir: 'player' },
    { face: 'greycloak_road2', dir: 'player' },
    { say: 'ch5.ev.cloaks.1', who: 'greycloak_road1' },
    {
      if: { flag: 'c5:token', is: 'kept' },
      then: [{ say: 'ch5.ev.cloaks.2', who: 'greycloak_road2' }],
      else: [{ say: 'ch5.ev.cloaks.3', who: 'greycloak_road2' }]
    },
    { say: 'ch5.ev.cloaks.4', who: 'greycloak_road1' },
    {
      choose: [
        { text: 'ch5.ev.cloaks.opt', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch5.ev.cloaks.6', who: 'greycloak_road1' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      if: { not: 'c5:cloak1' },
      then: [
        {
          battle: { opponent: 'greycloak_road1' },
          after: 'wake',
          won: [{ flag: 'c5:cloak1' }, { say: 'ch5.ev.cloaks.5', who: 'greycloak_road1' }],
          else: [{ say: 'ch5.ev.cloaks.6', who: 'greycloak_road1' }, { stop: true }]
        }
      ]
    },
    { say: 'ch5.ev.cloaks.7', who: 'greycloak_road2' },
    {
      battle: { opponent: 'greycloak_road2' },
      after: 'wake',
      won: [
        { flag: 'c5:cloaks' },
        { say: 'ch5.ev.cloaks.8', who: 'greycloak_road2' },
        { remove: 'greycloak_road1' },
        { remove: 'greycloak_road2' },
        { wait: 400 },
        { say: 'ch5.ev.cloaks.9', who: 'kid' },
        { say: 'ch5.ev.cloaks.10', who: 'companion' }
      ],
      else: [{ say: 'ch5.ev.cloaks.6', who: 'greycloak_road2' }]
    }
  ],
  /* Cole's service in his Coilhaven phase (chapter 1 people): nothing more than his words */
  'ch5.svc.cole': [{ stop: true }],
  'ch5.svc.circuit': [
    { if: 'c5:circuit', then: [{ say: 'ch5.ev.circuit.1', who: 'dov' }, { stop: true }] },
    {
      choose: [
        {
          text: 'ch5.ev.circuit.2',
          then: [{ puzzle: 'circuit', do: 'reset' }, { sound: 'spin' }, { say: 'ch5.ev.circuit.3', who: 'dov' }]
        },
        { text: 'ch5.ev.circuit.4', then: [{ say: 'ch5.ev.circuit.5', who: 'dov' }] }
      ],
      cancel: 1
    }
  ],
  'ch5.volta.first': [
    { say: 'ch5.ev.volta.first.1', who: 'volta' },
    { say: 'ch5.ev.volta.first.2', who: 'volta' },
    { say: 'ch5.ev.volta.first.3', who: 'volta' }
  ],
  'ch5.sparks.try': [
    { if: { not: { ext: 'spell', has: 'stun' } }, then: [{ say: 'ch5.ev.volta.noseal', who: 'volta' }, { stop: true }] },
    { run: 'ch5.sparks' }
  ],
  'ch5.sparks': [
    { say: 'ch5.ev.sparks.1', who: 'volta' },
    { ext: 'draw', sigil: 'stun', text: 'ch5.ev.sparks.draw.1', twist: 'quick' },
    { sound: 'chime' },
    { toast: 'ch5.ev.sparks.done.1' },
    { wait: 500 },
    { say: 'ch5.ev.sparks.2', who: 'volta' },
    { ext: 'draw', sigil: 'stun', text: 'ch5.ev.sparks.draw.2', twist: 'quick' },
    { sound: 'chime' },
    { toast: 'ch5.ev.sparks.done.2' },
    { wait: 500 },
    { say: 'ch5.ev.sparks.3', who: 'volta' },
    { ext: 'draw', sigil: 'stun', text: 'ch5.ev.sparks.draw.3', twist: 'quick' },
    { sound: 'chime' },
    { toast: 'ch5.ev.sparks.done.3' },
    { wait: 500 },
    { flag: 'c5:wand' },
    { say: 'ch5.ev.sparks.4', who: 'volta' },
    { say: 'ch5.ev.sparks.5', who: 'volta' },
    { say: 'ch5.ev.sparks.6', who: 'volta' },
    { helper: 'c5_norest', title: 'ch5.help.norest.title', text: 'ch5.help.norest', icon: 'electric' },
    { say: 'ch5.ev.sparks.7', who: 'companion' }
  ],
  'ch5.gauntlet': [
    {
      branch: [
        { if: { ext: 'gauntlet', gauntlet: 'storm' }, then: [{ say: 'ch5.ev.gauntlet.resume', who: 'self' }] },
        { if: 'c5:pim', then: [{ say: 'ch5.ev.gauntlet.again', who: 'self' }] }
      ],
      else: [{ say: 'ch5.ev.gauntlet.ask', who: 'self' }]
    },
    {
      choose: [
        { text: 'ch5.ev.gauntlet.go', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch5.ev.gauntlet.wait', who: 'self' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      ext: 'gauntlet',
      gauntlet: 'storm',
      won: [
        { flag: 'c5:ring' },
        { ext: 'ring', element: 'electric' },
        { give: 'spark_ring' },
        { money: 50, why: 'ch2.ev.15' },
        { say: 'ch5.ev.ring.2', who: 'volta' },
        { say: 'ch5.ev.ring.3', who: 'volta' },
        { say: 'ch5.ev.ring.4', who: 'volta' },
        {
          branch: [
            { if: 'c5:spoke', then: [{ say: 'ch5.ev.ring.pim.spoke', who: 'pim' }] },
            { if: 'c5:quiet', then: [{ say: 'ch5.ev.ring.pim.quiet', who: 'pim' }] }
          ]
        },
        { say: 'ch5.ev.ring.5', who: 'companion' }
      ],
      lost: [{ say: 'ch5.ev.gauntlet.lost.1', who: 'volta' }, { say: 'ch5.ev.gauntlet.lost.2', who: 'volta' }]
    }
  ],
  'ch5.svc.worksbench': [
    { if: { ext: 'gauntlet', gauntlet: 'storm' }, then: [{ say: 'ch5.ev.bench.4', who: 'pim' }, { stop: true }] },
    { if: 'c5:works:rested', then: [{ say: 'ch5.ev.bench.3', who: 'pim' }, { stop: true }] },
    { say: 'ch5.ev.bench.1', who: 'pim' },
    { blackout: 900, then: [{ wait: 400 }, { heal: { hp: 'full', rest: true } }, { ext: 'mana', set: 'full' }, { flag: 'c5:works:rested' }] },
    { toast: 'ch5.ev.bench.2' }
  ],
  'ch5.svc.guestbed': [
    { say: 'ch5.inn.1', who: 'ch_innkeeper', params: { coins: { coins: BED } } },
    {
      choose: [
        { text: 'ch1.bo.opt.rest', then: [] },
        { text: 'ch1.bo.opt.no', then: [{ say: 'ch5.inn.2', who: 'ch_innkeeper' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      spend: BED,
      fail: [{ say: 'ch5.inn.3', who: 'ch_innkeeper', params: { coins: { coins: BED } } }, { stop: true }]
    },
    { sound: 'sleep' },
    { fade: 800 },
    { rest: { hours: 8 } },
    { toast: 'ch1.bo.4' },
    { if: { companion: true }, then: [{ say: 'ch5.inn.4', who: 'companion' }] }
  ],
  'ch5.svc.ramen': [
    { say: 'ch5.inn.5', who: 'ch_innkeeper' },
    {
      choose: [
        { text: 'ch1.bo.opt.ramen', params: { price: { coins: RAMEN } }, then: [] },
        { text: 'ch1.bo.opt.bed', params: { coins: { coins: BED } }, then: [{ run: 'ch5.svc.guestbed' }, { stop: true }] },
        { text: 'ch1.bo.opt.none', then: [{ say: 'ch5.inn.2', who: 'ch_innkeeper' }, { stop: true }] }
      ],
      cancel: 2
    },
    {
      spend: RAMEN,
      fail: [{ say: 'ch5.inn.6', who: 'ch_innkeeper', params: { coins: { coins: RAMEN } } }, { stop: true }]
    },
    { heal: { hp: 'full', rest: true } },
    { ext: 'mana', set: 'full' },
    { sound: 'sparkle' },
    { fx: 'smoke', n: 6, dy: -14 },
    { toast: 'ch1.bo.10' },
    { say: 'ch5.inn.7', who: 'ch_innkeeper' }
  ]
};
