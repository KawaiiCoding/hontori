/*
 * ch9/scripts.js
 * Job: the scripts of chapter 9: the Golden Gate and Vael's welcome (the garden key), his offer to Cole in the
 * plaza, the Mirror Sigil (Glasshouse), Lys at the Mirror Gardens, the family and Lisel (the V, willingly), Vael's
 * garden of jars, the Ring Tournament (Mira's round, Cole's choice in the final, the crowd of chapter 5, the Halo
 * Ring, Vael noticing who can see), Tobbe's friend, the Halo Court bench, and the Gilded Spoon tavern (capital prices).
 *
 * Vael is kind in every line: he never threatens, never raises his voice, and is always a little too pleased.
 * He is brought on stage with spawn: at the gate, at the plaza fountain (where he stays), in his box at Halo Court.
 * The tournament is content `tournaments.halo` (./tournaments.js), run by { ext: 'tournament' } with a save point
 * before each round; a lost round is fought again from that round. Leaving Halo Court ends the run.
 */

import P from './places.js';

const RAMEN = 10;
const BED = 20;

export default {
  /* the gate of seven rings: each ring lights its socket (the kid holds them up), then Vael is there */
  'ch9.gate': [
    { say: 'ch9.ev.gate.1', who: 'kid' },
    { say: 'ch9.ev.gate.2', who: 'kid' },
    { sound: 'chime' },
    { wait: 500 },
    { sound: 'chime' },
    { say: 'ch9.ev.gate.3', who: 'kid' },
    { flag: 'c9:gate' },
    { sound: 'door' },
    { spawn: 'orlen', at: P.ggVael },
    { move: 'orlen', to: { player: [1, -1] } },
    { face: 'orlen', dir: 'player' },
    { say: 'ch9.ev.vael.1', who: 'orlen' },
    { say: 'ch9.ev.vael.2', who: 'orlen' },
    { say: 'ch9.ev.vael.3', who: 'orlen' },
    { say: 'ch9.ev.vael.4', who: 'orlen' },
    { give: 'garden_key' },
    { say: 'ch9.ev.vael.5', who: 'orlen' },
    { if: { has: 'token' }, then: [{ say: 'ch9.ev.vael.token', who: 'orlen' }] },
    { remove: 'orlen' },
    { spawn: 'orlen', at: P.gmVael },
    { say: 'ch9.ev.vael.6', who: 'companion' }
  ],

  /* the plaza: Vael offers Cole an apprenticeship in front of everyone */
  'ch9.offer': [
    { face: 'orlen', dir: 'player' },
    { say: 'ch9.ev.offer.1', who: 'orlen' },
    { say: 'ch9.ev.offer.2', who: 'orlen' },
    { face: 'cole', dir: 'player' },
    { say: 'ch9.ev.offer.3', who: 'orlen' },
    { say: 'ch9.ev.offer.4', who: 'orlen' },
    { say: 'ch9.ev.offer.5', who: 'cole' },
    { say: 'ch9.ev.offer.6', who: 'orlen' },
    { say: 'ch9.ev.offer.7', who: 'orlen' },
    { flag: 'c9:offer' },
    { wait: 400 },
    { move: 'cole', to: { player: [-1, 0] } },
    { move: 'mira', to: { player: [1, 0] } },
    { face: 'cole', dir: 'player' },
    { face: 'mira', dir: 'player' },
    { say: 'ch9.ev.offer.8', who: 'cole' },
    { say: 'ch9.ev.offer.9', who: 'mira' },
    { say: 'ch9.ev.offer.10', who: 'cole' },
    { say: 'ch9.ev.offer.11', who: 'kid' },
    { say: 'ch9.ev.offer.12', who: 'companion' }
  ],

  'ch9.teach': [
    { say: 'ch9.ev.glass.1', who: 'glass_keeper' },
    { say: 'ch9.ev.glass.2', who: 'glass_keeper' },
    { say: 'ch9.ev.glass.3', who: 'glass_keeper' },
    { ext: 'draw', sigil: 'mirror', text: 'ch9.ev.glass.draw' },
    { ext: 'learn', spell: 'mirror' },
    { sound: 'wand' },
    { say: 'ch9.ev.glass.4', who: 'glass_keeper' },
    { helper: 'c9_mirror', title: 'ch9.help.mirror.title', text: 'ch9.help.mirror', icon: 'light' },
    { say: 'ch9.ev.glass.5', who: 'companion' }
  ],
  'ch9.svc.lys': [
    { if: 'c9:gardens', then: [{ stop: true }] },
    {
      choose: [
        { text: 'ch9.ev.lys.reset', then: [{ puzzle: 'mirrors', do: 'reset' }, { sound: 'spin' }, { say: 'ch9.ev.lys.reset.1', who: 'lys' }] },
        { text: 'ch9.ev.lys.keep', then: [{ say: 'ch9.ev.lys.keep.1', who: 'lys' }] }
      ],
      cancel: 1
    }
  ],
  'ch9.svc.herald': [
    { if: 'c9:ring', then: [{ stop: true }] },
    { if: { ext: 'tournament', tournament: 'halo' }, then: [{ say: 'ch9.ev.lys.herald.run', who: 'lys' }, { stop: true }] },
    { say: 'ch9.ev.lys.herald', who: 'lys' }
  ],

  /* Mom, Dad and Lisel arrive; Lisel asks for the V (world rule 71: only the willing) */
  'ch9.family': [
    { flag: 'c9:family' },
    { wait: 500 },
    { say: 'ch9.ev.family.1', who: 'kid' },
    { move: 'mom', to: { player: [-1, 1] } },
    { move: 'dad', to: { player: [1, 1] } },
    { face: 'mom', dir: 'player' },
    { face: 'dad', dir: 'player' },
    { say: 'ch9.ev.family.2', who: 'mom' },
    { say: 'ch9.ev.family.3', who: 'dad' },
    { say: 'ch9.ev.family.4', who: 'mom' },
    { say: 'ch9.ev.family.5', who: 'companion' },
    { move: 'lisel', to: { player: [0, 1] } },
    { face: 'lisel', dir: 'player' },
    { run: 'ch9.lisel' }
  ],
  'ch9.lisel': [
    { say: 'ch9.ev.lisel.1', who: 'lisel' },
    { say: 'ch9.ev.lisel.2', who: 'lisel' },
    {
      choose: [
        { text: 'ch9.ev.lisel.opt', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch9.ev.lisel.wait', who: 'lisel' }, { stop: true }] }
      ],
      cancel: 1
    },
    { ext: 'draw', sigil: 'veil', text: 'ch9.ev.lisel.draw' },
    { sound: 'spell' },
    { wait: 700 },
    { say: 'ch9.ev.lisel.3', who: 'lisel' },
    { move: 'mira', to: { player: [1, 0] } },
    { face: 'mira', dir: 'player' },
    { say: 'ch9.ev.lisel.4', who: 'mira' },
    { say: 'ch9.ev.lisel.5', who: 'lisel' },
    { say: 'ch9.ev.lisel.6', who: 'lisel' },
    { say: 'ch9.ev.lisel.7', who: 'mira' },
    { flag: 'c9:lisel' },
    { wait: 500 },
    { say: 'ch9.ev.lisel.8', who: 'dad' },
    { say: 'ch9.ev.lisel.9', who: 'mom' },
    { say: 'ch9.ev.lisel.10', who: 'kid' }
  ],

  /* PLANT: Vael's garden of jars. Nothing is opened here; it is only seen and remembered. */
  'ch9.jars': [
    { wait: 500 },
    { say: 'ch9.jars.1', who: 'kid' },
    { say: 'ch9.jars.2', who: 'kid' },
    { wait: 700 },
    { say: 'ch9.jars.3', who: 'kid' },
    { say: 'ch9.jars.4', who: 'companion' },
    { move: 'wendel', to: { player: [1, 0] } },
    { face: 'wendel', dir: 'player' },
    { say: 'ch9.jars.5', who: 'wendel' },
    { say: 'ch9.jars.6', who: 'wendel' },
    { say: 'ch9.jars.7', who: 'kid' },
    { say: 'ch9.jars.8', who: 'wendel' },
    { flag: 'c9:jars' },
    { say: 'ch9.jars.9', who: 'kid' }
  ],
  /* the Ring Tournament */
  'ch9.tourney': [
    {
      branch: [
        { if: { ext: 'tournament', tournament: 'halo' }, then: [{ say: 'ch9.ev.aurel.resume', who: 'aurel' }] },
        { if: 'c9:tourney', then: [{ say: 'ch9.ev.aurel.again', who: 'aurel' }] }
      ],
      else: [{ say: 'ch9.ev.aurel.1', who: 'aurel' }, { say: 'ch9.ev.aurel.2', who: 'aurel' }]
    },
    { helper: 'c9_pure', title: 'ch9.help.pure.title', text: 'ch9.help.pure', icon: 'light' },
    {
      choose: [
        { text: 'ch9.ev.aurel.go', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch9.ev.aurel.wait', who: 'aurel' }, { stop: true }] }
      ],
      cancel: 1
    },
    { flag: 'c9:tourney' },
    { flag: 'c9:crowd' },
    { spawn: 'orlen', at: P.hcVael },
    {
      ext: 'tournament',
      tournament: 'halo',
      won: [{ run: 'ch9.won' }],
      lost: [{ say: 'ch9.ev.tourney.lost.1', who: 'aurel' }, { say: 'ch9.ev.tourney.lost.2', who: 'lys' }]
    }
  ],
  'ch9.round.mira': [
    { say: 'ch9.ev.herald.3', who: 'lys' },
    { move: 'mira', to: { player: [0, -2] } },
    { face: 'mira', dir: 'player' },
    { say: 'ch9.ev.mira.r.1', who: 'mira' },
    { if: 'c9:lisel', then: [{ say: 'ch9.ev.mira.r.2', who: 'lisel' }] }
  ],
  /* the final: Cole answers Vael in front of the whole arena, then gives the kid a real final */
  'ch9.round.final': [
    { say: 'ch9.ev.herald.4', who: 'lys' },
    { move: 'cole', to: { player: [0, -2] } },
    { say: 'ch9.ev.final.1', who: 'orlen' },
    { face: 'cole', dir: 1 },
    { wait: 900 },
    { say: 'ch9.ev.final.2', who: 'cole' },
    { say: 'ch9.ev.final.3', who: 'cole' },
    { say: 'ch9.ev.final.4', who: 'cole' },
    { flag: 'c9:cole' },
    { wait: 700 },
    { say: 'ch9.ev.final.5', who: 'kid' },
    { say: 'ch9.ev.final.6', who: 'orlen' },
    { face: 'cole', dir: 'player' },
    { say: 'ch9.ev.final.7', who: 'cole' },
    { helper: 'c9_flawless', title: 'ch9.help.flawless.title', text: 'ch9.help.flawless', icon: 'light' }
  ],
  'ch9.won': [
    { say: 'ch9.ev.won.1', who: 'cole' },
    { move: 'cole', to: { player: [1, 0] } },
    { face: 'cole', dir: 1 },
    { say: 'ch9.ev.won.2', who: 'kid' },
    { wait: 600 },
    {
      branch: [
        {
          if: 'c5:spoke',
          then: [
            { say: 'ch9.ev.crowd.spoke.1', who: 'kid' },
            { say: 'ch9.ev.crowd.spoke.2', who: 'joss' },
            { say: 'ch9.ev.crowd.spoke.3', who: 'rudd' },
            { say: 'ch9.ev.crowd.spoke.4', who: 'pim' }
          ]
        },
        {
          if: 'c5:quiet',
          then: [{ say: 'ch9.ev.crowd.quiet.1', who: 'kid' }, { say: 'ch9.ev.crowd.quiet.2', who: 'pim' }, { say: 'ch9.ev.crowd.quiet.3', who: 'kid' }]
        }
      ]
    },
    { wait: 500 },
    { move: 'aurel', to: { player: [0, -1] } },
    { face: 'aurel', dir: 'player' },
    { flag: 'c9:ring' },
    { ext: 'ring', element: 'light' },
    { give: 'halo_ring' },
    { money: 50, why: 'ch2.ev.15' },
    { say: 'ch9.ev.ring.1', who: 'aurel' },
    { say: 'ch9.ev.ring.2', who: 'aurel' },
    { move: 'orlen', to: { player: [-1, -1] } },
    { face: 'orlen', dir: 'player' },
    { say: 'ch9.ev.ring.3', who: 'orlen' },
    { say: 'ch9.ev.ring.4', who: 'orlen' },
    { say: 'ch9.ev.ring.5', who: 'orlen' },
    { say: 'ch9.ev.ring.6', who: 'orlen' },
    { say: 'ch9.ev.ring.7', who: 'orlen' },
    { remove: 'orlen' },
    { spawn: 'orlen', at: P.gmVael },
    { wait: 500 },
    { say: 'ch9.ev.ring.8', who: 'mom' },
    { say: 'ch9.ev.ring.9', who: 'companion' }
  ],
  'ch9.svc.bench': [
    { if: { ext: 'tournament', tournament: 'halo' }, then: [{ say: 'ch9.ev.bench.4', who: 'lys' }, { stop: true }] },
    { if: 'c9:court:rested', then: [{ say: 'ch9.ev.bench.3', who: 'lys' }, { stop: true }] },
    { say: 'ch9.ev.bench.1', who: 'lys' },
    { blackout: 900, then: [{ wait: 400 }, { heal: { hp: 'full', rest: true } }, { ext: 'mana', set: 'full' }, { flag: 'c9:court:rested' }] },
    { toast: 'ch9.ev.bench.2' }
  ],

  /* Tobbe's friend: his mother wishes to see what he sees (the V only works on the willing) */
  'ch9.hester': [
    { say: 'ch9.ev.hester.1', who: 'hester' },
    { say: 'ch9.ev.hester.2', who: 'hester' },
    {
      choose: [
        { text: 'ch9.ev.hester.opt', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch9.ev.hester.wait', who: 'hester' }, { stop: true }] }
      ],
      cancel: 1
    },
    { ext: 'draw', sigil: 'veil', text: 'ch9.ev.hester.draw' },
    { sound: 'spell' },
    { wait: 600 },
    { say: 'ch9.ev.hester.3', who: 'hester' },
    { say: 'ch9.ev.hester.4', who: 'tobbe' },
    { say: 'ch9.ev.hester.5', who: 'hester' },
    { flag: 'c9:hester' },
    { money: 30, why: 'ch9.ev.hester.why' },
    { give: 'spirit_snack', n: 2 },
    { say: 'ch9.ev.hester.6', who: 'companion' }
  ],

  'ch9.svc.guestbed': [
    { say: 'ch9.inn.1', who: 'gm_innkeeper', params: { coins: { coins: BED } } },
    {
      choose: [
        { text: 'ch1.bo.opt.rest', then: [] },
        { text: 'ch1.bo.opt.no', then: [{ say: 'ch9.inn.2', who: 'gm_innkeeper' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      spend: BED,
      fail: [{ say: 'ch9.inn.3', who: 'gm_innkeeper', params: { coins: { coins: BED } } }, { stop: true }]
    },
    { sound: 'sleep' },
    { fade: 800 },
    { rest: { hours: 8 } },
    { toast: 'ch1.bo.4' },
    { if: { companion: true }, then: [{ say: 'ch9.inn.4', who: 'companion' }] }
  ],
  'ch9.svc.ramen': [
    { say: 'ch9.inn.5', who: 'gm_innkeeper' },
    {
      choose: [
        { text: 'ch1.bo.opt.ramen', params: { price: { coins: RAMEN } }, then: [] },
        { text: 'ch1.bo.opt.bed', params: { coins: { coins: BED } }, then: [{ run: 'ch9.svc.guestbed' }, { stop: true }] },
        { text: 'ch1.bo.opt.none', then: [{ say: 'ch9.inn.2', who: 'gm_innkeeper' }, { stop: true }] }
      ],
      cancel: 2
    },
    {
      spend: RAMEN,
      fail: [{ say: 'ch9.inn.6', who: 'gm_innkeeper', params: { coins: { coins: RAMEN } } }, { stop: true }]
    },
    { heal: { hp: 'full', rest: true } },
    { ext: 'mana', set: 'full' },
    { sound: 'sparkle' },
    { fx: 'smoke', n: 6, dy: -14 },
    { toast: 'ch1.bo.10' },
    { say: 'ch9.inn.7', who: 'gm_innkeeper' }
  ]
};
