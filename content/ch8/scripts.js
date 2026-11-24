/*
 * ch8/scripts.js
 * Job: the scripts of chapter 8: Brasa's flame, Old Wick and her tea, Linnet, Smudge the shadepup, the Lantern
 * Sigil, Tallow's favour trade, meeting Nox, the cellar of hidden hontori, the captain's attack and the battle
 * beside Nox (mode ally), Merrit and the broken seal, the moon lamps (twist unseen), the ring duel (rule blind),
 * Lisel's letter, the crater bench and the Duskmere tavern.
 *
 * The battle beside Nox: { battle: { opponent: 'captain', mode: 'ally', ally: { name, look, team } } }. The
 * kid's lead and Nox's hontori stand together against the captain's two; the kid chooses only for their own.
 * A lost battle leaves the captain in the square; any talk with him, the cloak or Nox tries again.
 */

import P from './places.js';

const RAMEN = 8;
const BED = 15;

export default {
  'ch8.flame': [
    { say: 'ch8.ev.flame.1', who: 'brasa' },
    { say: 'ch8.ev.flame.2', who: 'brasa' },
    {
      if: { has: 'lantern' },
      then: [
        { say: 'ch8.ev.flame.3', who: 'brasa' },
        { sound: 'sizzle' },
        { fx: 'ember', n: 6, dy: -10, at: 'player' },
        { flag: 'c8:flame' },
        { toast: 'ch8.ev.flame.toast' }
      ],
      else: [
        { say: 'ch8.ev.flame.4', who: 'brasa' },
        { give: 'ember_lamp' },
        { flag: 'c8:flame' }
      ]
    },
    { say: 'ch8.ev.flame.5', who: 'brasa' },
    { say: 'ch8.ev.flame.6', who: 'companion' }
  ],
  'ch8.wick': [
    { say: 'ch8.ev.wick.1', who: 'wick' },
    { say: 'ch8.ev.wick.2', who: 'wick' },
    { blackout: 900, then: [{ sound: 'sizzle' }, { wait: 400 }, { heal: { hp: 'full' } }, { flag: 'c8:wick' }] },
    { toast: 'ch8.ev.wick.3' },
    { say: 'ch8.ev.wick.4', who: 'wick' },
    { say: 'ch8.ev.wick.5', who: 'wick' },
    { give: 'wick_tin' },
    { quest: 'wicktea', start: true },
    { say: 'ch8.ev.wick.6', who: 'companion' }
  ],
  'ch8.tin': [
    { say: 'ch8.ev.tin.1', who: 'kid' },
    { take: 'wick_tin' },
    { say: 'ch8.ev.tin.2', who: 'linnet' },
    { say: 'ch8.ev.tin.3', who: 'linnet' },
    { flag: 'c8:tin' },
    { give: 'favour_token' },
    { say: 'ch8.ev.tin.4', who: 'linnet' }
  ],
  'ch8.pup.ask': [
    { say: 'ch8.ev.pup.1', who: 'pella' },
    { say: 'ch8.ev.pup.2', who: 'pella' },
    { say: 'ch8.ev.pup.3', who: 'cobb' },
    { flag: 'c8:pup:asked' },
    { quest: 'smudge', start: true }
  ],
  'ch8.pup.find': [
    { say: 'ch8.ev.pup.4', who: 'kid' },
    {
      choose: [
        { text: 'ch8.ev.pup.opt', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch8.ev.pup.5', who: 'kid' }, { stop: true }] }
      ],
      cancel: 1
    },
    { sound: 'pickup' },
    { flag: 'c8:pup' },
    { say: 'ch8.ev.pup.6', who: 'kid' },
    { if: { not: 'c8:pup:asked' }, then: [{ say: 'ch8.ev.pup.7', who: 'kid' }, { flag: 'c8:pup:asked' }, { quest: 'smudge', start: true, quiet: true }] },
    { say: 'ch8.ev.pup.8', who: 'companion' }
  ],
  'ch8.pup.home': [
    { say: 'ch8.ev.pup.9', who: 'kid' },
    { flag: 'c8:pup:back' },
    { say: 'ch8.ev.pup.10', who: 'pella' },
    { say: 'ch8.ev.pup.11', who: 'cobb' },
    { give: 'favour_token' },
    { say: 'ch8.ev.pup.12', who: 'pella' }
  ],
  'ch8.teach': [
    { say: 'ch8.ev.keeper.1', who: 'lantern_keeper' },
    { say: 'ch8.ev.keeper.2', who: 'lantern_keeper' },
    { say: 'ch8.ev.keeper.3', who: 'lantern_keeper' },
    { ext: 'draw', sigil: 'lantern', text: 'ch8.ev.keeper.draw' },
    { flag: 'c8:sigil' },
    { ext: 'learn', spell: 'lantern' },
    { sound: 'wand' },
    { say: 'ch8.ev.keeper.4', who: 'lantern_keeper' },
    { say: 'ch8.ev.keeper.5', who: 'companion' }
  ],
  'ch8.svc.tallow': [
    { say: 'ch8.ev.tallow.1', who: 'dm_shopkeeper' },
    { helper: 'c8_favour', title: 'ch8.help.favour.title', text: 'ch8.help.favour', icon: 'star' },
    {
      choose: [
        {
          text: 'ch8.ev.tallow.trade',
          desc: 'ch8.ev.tallow.trade.desc',
          off: { not: { has: 'favour_token' } },
          offText: 'ch8.ev.tallow.trade.off',
          then: [{ run: 'ch8.svc.trade' }]
        },
        { text: 'ch8.ev.tallow.shop', desc: 'ch8.ev.tallow.shop.desc', then: [{ shop: 'duskmere' }] },
        { text: 'ch1.bo.opt.none', then: [{ say: 'ch8.ev.tallow.bye', who: 'dm_shopkeeper' }] }
      ],
      cancel: 2
    }
  ],
  'ch8.svc.trade': [
    { say: 'ch8.ev.tallow.2', who: 'dm_shopkeeper' },
    {
      choose: [
        { text: 'ch8.ev.trade.snacks', desc: 'ch8.ev.trade.snacks.desc', then: [{ take: 'favour_token' }, { give: 'spirit_snack', n: 3 }] },
        { text: 'ch8.ev.trade.herbs', desc: 'ch8.ev.trade.herbs.desc', then: [{ take: 'favour_token' }, { give: 'herb', n: 4 }] },
        {
          text: 'ch8.ev.trade.charm',
          desc: 'ch8.ev.trade.charm.desc',
          if: { not: { has: 'charm' } },
          then: [{ take: 'favour_token' }, { give: 'charm' }]
        },
        { text: 'ch1.bo.opt.none', then: [{ stop: true }] }
      ],
      cancel: 3
    },
    { say: 'ch8.ev.tallow.3', who: 'dm_shopkeeper' }
  ],
  'ch8.nox.meet': [
    { move: 'nox', to: { player: [0, -1] } },
    { face: 'nox', dir: 'player' },
    { say: 'ch8.ev.nox.1', who: 'nox' },
    { say: 'ch8.ev.nox.2', who: 'nox' },
    { say: 'ch8.ev.nox.3', who: 'kid' },
    { say: 'ch8.ev.nox.4', who: 'nox' },
    { say: 'ch8.ev.nox.5', who: 'nox' },
    { flag: 'c8:nox' },
    { say: 'ch8.ev.nox.6', who: 'companion' }
  ],
  'ch8.hidden': [
    { say: 'ch8.ev.hidden.1', who: 'nox' },
    {
      blackout: 1200,
      then: [{ sound: 'creak' }, { wait: 500 }]
    },
    { say: 'ch8.ev.hidden.2', who: 'kid' },
    { say: 'ch8.ev.hidden.3', who: 'kid' },
    { say: 'ch8.ev.hidden.4', who: 'edda' },
    { say: 'ch8.ev.hidden.5', who: 'nox' },
    { say: 'ch8.ev.hidden.6', who: 'nox' },
    { say: 'ch8.ev.hidden.7', who: 'kid' },
    { say: 'ch8.ev.hidden.8', who: 'nox' },
    { flag: 'c8:hidden' },
    { say: 'ch8.ev.hidden.9', who: 'companion' }
  ],
  'ch8.attack': [
    { wait: 500 },
    { sound: 'horn' },
    { say: 'ch8.ev.attack.1', who: 'kid' },
    { spawn: 'captain', at: { map: 'duskmere', x: P.dmCaptain.x, y: P.dmCaptain.y, dir: 0 } },
    { spawn: 'greycloak', at: { map: 'duskmere', x: P.dmCloak.x, y: P.dmCloak.y, dir: 0 } },
    { flag: 'c8:came' },
    { move: 'captain', to: { player: [0, -2] } },
    { move: 'greycloak', to: { player: [1, -3] } },
    { move: 'nox', to: { player: [-1, 0] } },
    { face: 'captain', dir: 'player' },
    { say: 'ch8.ev.attack.2', who: 'captain' },
    { say: 'ch8.ev.attack.3', who: 'captain' },
    { say: 'ch8.ev.attack.4', who: 'nox' },
    { say: 'ch8.ev.attack.5', who: 'captain' },
    { say: 'ch8.ev.attack.6', who: 'nox' },
    { say: 'ch8.ev.attack.7', who: 'kid' },
    { say: 'ch8.ev.attack.8', who: 'kid' },
    { run: 'ch8.fight' }
  ],
  'ch8.fight': [
    { if: 'c8:fight:tried', then: [{ say: 'ch8.ev.fight.again', who: 'nox' }] },
    { flag: 'c8:fight:tried' },
    { say: 'ch8.ev.fight.1', who: 'nox' },
    { helper: 'c8_ally', title: 'ch8.help.ally.title', text: 'ch8.help.ally', icon: 'dark' },
    {
      battle: {
        opponent: 'captain',
        mode: 'ally',
        ally: {
          name: 'ch8.name.nox',
          look: 'nox',
          team: [{ kind: 'gloomowl', stage: 4, level: { ext: 'leadLevel', add: 0, min: 23, none: 24 } }]
        }
      },
      after: 'wake',
      won: [{ run: 'ch8.won' }],
      else: [{ say: 'ch8.ev.fight.lost.1', who: 'nox' }, { say: 'ch8.ev.fight.lost.2', who: 'nox' }]
    }
  ],
  'ch8.won': [
    { flag: 'c8:captain' },
    { say: 'ch8.ev.won.1', who: 'captain' },
    { say: 'ch8.ev.won.2', who: 'captain' },
    { say: 'ch8.ev.won.3', who: 'captain' },
    { remove: 'captain' },
    { wait: 500 },
    { if: { ext: 'lead', stage: { gte: 5 } }, then: [{ say: 'ch8.ev.won.grown', who: 'companion' }] },
    { face: 'greycloak', dir: 'player' },
    { say: 'ch8.ev.merrit.1', who: 'kid' },
    { say: 'ch8.ev.merrit.2', who: 'greycloak' },
    { say: 'ch8.ev.merrit.3', who: 'greycloak' },
    { say: 'ch8.ev.merrit.4', who: 'greycloak' },
    { flag: 'c8:merrit' },
    { say: 'ch8.ev.merrit.5', who: 'greycloak' },
    { say: 'ch8.ev.merrit.6', who: 'greycloak' },
    { sound: 'spell' },
    { fx: 'magic', n: 14, dy: -12, at: 'player' },
    { ext: 'sanctum', seal: false },
    { flag: 'c8:unseal' },
    { sound: 'sparkle' },
    { toast: 'ch8.ev.merrit.toast' },
    { say: 'ch8.ev.merrit.7', who: 'kid' },
    { say: 'ch8.ev.merrit.8', who: 'companion' },
    { say: 'ch8.ev.merrit.9', who: 'greycloak' },
    { say: 'ch8.ev.merrit.10', who: 'greycloak' },
    { give: 'stair_sketch' },
    { flag: 'c8:stair' },
    { say: 'ch8.ev.merrit.11', who: 'greycloak' },
    { remove: 'greycloak' },
    { spawn: 'greycloak', at: { map: 'duskmere_h4', x: P.h4Merrit.x, y: P.h4Merrit.y, dir: 0 } },
    { say: 'ch8.ev.won.4', who: 'nox' },
    { say: 'ch8.ev.won.5', who: 'nox' }
  ],
  'ch8.lamps': [
    { say: 'ch8.ev.lamps.1', who: 'nox' },
    { say: 'ch8.ev.lamps.2', who: 'nox' },
    { helper: 'c8_unseen', title: 'ch8.help.unseen.title', text: 'ch8.help.unseen', icon: 'wand' },
    { ext: 'draw', sigil: 'lantern', text: 'ch8.ev.lamps.draw.1', twist: 'unseen' },
    { sound: 'chime' },
    { toast: 'ch8.ev.lamps.done.1' },
    { wait: 500 },
    { ext: 'draw', sigil: 'lantern', text: 'ch8.ev.lamps.draw.2', twist: 'unseen' },
    { sound: 'chime' },
    { toast: 'ch8.ev.lamps.done.2' },
    { wait: 500 },
    { ext: 'draw', sigil: 'lantern', text: 'ch8.ev.lamps.draw.3', twist: 'unseen' },
    { sound: 'chime' },
    { toast: 'ch8.ev.lamps.done.3' },
    { flag: 'c8:lamps' },
    { say: 'ch8.ev.lamps.3', who: 'nox' },
    { say: 'ch8.ev.lamps.4', who: 'companion' }
  ],
  'ch8.ringduel': [
    { say: 'ch8.ev.duel.1', who: 'nox' },
    { helper: 'c8_blind', title: 'ch8.help.blind.title', text: 'ch8.help.blind', icon: 'dark' },
    {
      choose: [
        { text: 'ch8.ev.duel.go', desc: 'ch8.ev.duel.go.desc', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch8.ev.duel.later', who: 'nox' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      battle: { opponent: 'nox' },
      won: [
        { flag: 'c8:ring' },
        { ext: 'ring', element: 'dark' },
        { give: 'moon_ring' },
        { money: 50, why: 'ch2.ev.15' },
        { say: 'ch8.ev.ring.1', who: 'nox' },
        { say: 'ch8.ev.ring.2', who: 'nox' },
        { say: 'ch8.ev.ring.3', who: 'nox' },
        { say: 'ch8.ev.ring.4', who: 'companion' }
      ],
      else: [{ say: 'ch8.ev.duel.lost.1', who: 'nox' }, { say: 'ch8.ev.duel.lost.2', who: 'nox' }]
    }
  ],
  'ch8.liselletter': [
    { say: 'ch8.lisel.1', who: 'lisel' },
    { say: 'ch8.lisel.2', who: 'lisel' },
    { say: 'ch8.lisel.3', who: 'lisel' }
  ],
  'ch8.sketch': [
    { say: 'ch8.sketch.1', who: 'letter' },
    { say: 'ch8.sketch.2', who: 'letter' }
  ],
  'ch8.svc.moonbench': [
    { say: 'ch8.ev.bench.1', who: 'kid' },
    { blackout: 900, then: [{ wait: 400 }, { heal: { hp: 'full', rest: true } }, { ext: 'mana', set: 'full' }] },
    { toast: 'ch8.ev.bench.2' }
  ],
  'ch8.svc.guestbed': [
    { say: 'ch8.inn.1', who: 'dm_innkeeper', params: { coins: { coins: BED } } },
    {
      choose: [
        { text: 'ch1.bo.opt.rest', then: [] },
        { text: 'ch1.bo.opt.no', then: [{ say: 'ch8.inn.2', who: 'dm_innkeeper' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      spend: BED,
      fail: [{ say: 'ch8.inn.3', who: 'dm_innkeeper', params: { coins: { coins: BED } } }, { stop: true }]
    },
    { sound: 'sleep' },
    { fade: 800 },
    { rest: { hours: 8 } },
    { toast: 'ch1.bo.4' },
    { if: { companion: true }, then: [{ say: 'ch8.inn.4', who: 'companion' }] }
  ],
  'ch8.svc.ramen': [
    { say: 'ch8.inn.5', who: 'dm_innkeeper' },
    {
      choose: [
        { text: 'ch1.bo.opt.ramen', params: { price: { coins: RAMEN } }, then: [] },
        { text: 'ch1.bo.opt.bed', params: { coins: { coins: BED } }, then: [{ run: 'ch8.svc.guestbed' }, { stop: true }] },
        { text: 'ch1.bo.opt.none', then: [{ say: 'ch8.inn.2', who: 'dm_innkeeper' }, { stop: true }] }
      ],
      cancel: 2
    },
    {
      spend: RAMEN,
      fail: [{ say: 'ch8.inn.6', who: 'dm_innkeeper', params: { coins: { coins: RAMEN } } }, { stop: true }]
    },
    { heal: { hp: 'full', rest: true } },
    { ext: 'mana', set: 'full' },
    { sound: 'sparkle' },
    { fx: 'smoke', n: 6, dy: -14 },
    { toast: 'ch1.bo.10' },
    { say: 'ch8.inn.7', who: 'dm_innkeeper' }
  ]
};
