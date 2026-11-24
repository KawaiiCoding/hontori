/*
 * ch7/scripts.js
 * Job: the scripts of chapter 7: the shut east road, Ottar's warm stone, Swift Step at the Smoke House, the hot
 * stair to the Hearth Below, THE EMPTY NEST, Brasa in the Hearth, Grandma's wand box (her note, young Vael's
 * letter, holding the wand), Cole and Mira in the square, the lava moat, Kell's service and duel, the one sure stroke,
 * the ring duel under heat, the cold kiln, the Crucible bench, and the Cinderreach tavern.
 *
 * The nest scene belongs to the kid's own hontori, the one that came down the chimney (kind "hontori"). It is
 * brought to the front first ({ ext: 'toFront' }), so the companion voice is its voice. Should it not be
 * carried, a short scene of the kid alone still finds the nest and sets c7:nest, so the road never stops.
 * Should it have no name yet, this is where it is invited to choose one ("Later" is always fine).
 */

import P from './places.js';

const OWN = { ext: 'carries', kind: 'hontori' };
const WATER = { ext: 'carries', element: 'water' };

export default {
  'ch7.roadshut': [
    { say: 'ch7.ev.roadshut.1', who: 'kid' },
    { say: 'ch7.ev.roadshut.2', who: 'companion' }
  ],
  'ch7.ottar': [
    { say: 'ch7.ev.ottar.1', who: 'ottar' },
    { say: 'ch7.ev.ottar.2', who: 'ottar' },
    { blackout: 900, then: [{ wait: 400 }, { heal: { hp: 'full' } }, { flag: 'c7:ottar' }] },
    { toast: 'ch7.ev.ottar.3' },
    { say: 'ch7.ev.ottar.4', who: 'ottar' },
    { say: 'ch7.ev.ottar.5', who: 'companion' }
  ],
  'ch7.teach': [
    { say: 'ch7.ev.smoke.1', who: 'smoke_keeper' },
    { say: 'ch7.ev.smoke.2', who: 'smoke_keeper' },
    { say: 'ch7.ev.smoke.3', who: 'smoke_keeper' },
    { ext: 'draw', sigil: 'step', text: 'ch7.ev.smoke.draw' },
    { ext: 'learn', spell: 'step' },
    { sound: 'wand' },
    { say: 'ch7.ev.smoke.4', who: 'smoke_keeper' },
    { helper: 'c7_step', title: 'ch7.help.step.title', text: 'ch7.help.step', icon: 'wind' },
    { say: 'ch7.ev.smoke.5', who: 'companion' }
  ],
  /* the lava moat before the Crucible: water cools the crossing into stone for good (c7:cooled opens the path
     through the maps lane's state); a water hontori carried, else one Tide Pearl; Kell helps a kid with neither */
  'ch7.cool': [
    {
      branch: [
        { if: WATER, then: [{ say: 'ch7.lava.water', who: 'kid' }] },
        { if: { has: 'tide_pearl' }, then: [{ take: 'tide_pearl' }, { say: 'ch7.lava.pearl', who: 'kid' }] }
      ],
      else: [{ say: 'ch7.lava.none', who: 'kid' }, { say: 'ch7.lava.none.2', who: 'companion' }, { stop: true }]
    },
    { sound: 'splash' },
    { blackout: 700, then: [{ wait: 300 }, { flag: 'c7:cooled' }] },
    { toast: 'ch7.lava.done' }
  ],
  'ch7.hearth.hot': [
    { flag: 'c7:hearth:tried' },
    { say: 'ch7.ev.hot.1', who: 'kid' },
    { say: 'ch7.ev.hot.2', who: 'companion' }
  ],

  /* THE EMPTY NEST: quiet and short. No music cue, no effects: only the stones, the ash and the words. */
  'ch7.nest': [
    { if: { not: OWN }, then: [{ run: 'ch7.nest.alone' }, { stop: true }] },
    { ext: 'toFront', kind: 'hontori' },
    { wait: 700 },
    { say: 'ch7.nest.1', who: 'kid' },
    { say: 'ch7.nest.2', who: 'kid' },
    { wait: 900 },
    { say: 'ch7.nest.3', who: 'companion' },
    { say: 'ch7.nest.4', who: 'companion' },
    { say: 'ch7.nest.5', who: 'kid' },
    { say: 'ch7.nest.6', who: 'companion' },
    { say: 'ch7.nest.7', who: 'kid' },
    { wait: 900 },
    { say: 'ch7.nest.8', who: 'kid' },
    { say: 'ch7.nest.9', who: 'companion' },
    { flag: 'c7:nest' },
    {
      if: { party: { named: false } },
      then: [
        { wait: 600 },
        { say: 'ch7.nest.name.1', who: 'kid' },
        { say: 'ch7.nest.name.2', who: 'companion' },
        {
          ask: 'name',
          target: 'lead',
          title: 'ch7.nest.name.title',
          then: [{ say: 'ch7.nest.name.3', who: 'companion' }]
        },
        { if: { party: { named: false } }, then: [{ say: 'ch7.nest.name.4', who: 'kid' }] }
      ]
    },
    { wait: 900 },
    { run: 'ch7.brasa.hearth' }
  ],
  'ch7.nest.alone': [
    { wait: 600 },
    { say: 'ch7.nest.1', who: 'kid' },
    { say: 'ch7.nest.2', who: 'kid' },
    { say: 'ch7.nest.alone.1', who: 'kid' },
    { flag: 'c7:nest' },
    { wait: 700 },
    { run: 'ch7.brasa.hearth' }
  ],
  'ch7.brasa.hearth': [
    { place: 'brasa', at: P.hbPassage },
    { move: 'brasa', to: { player: [1, 1] } },
    { face: 'brasa', dir: 'player' },
    { say: 'ch7.ev.brasa.1', who: 'brasa' },
    { if: OWN, then: [{ say: 'ch7.ev.brasa.2', who: 'brasa' }] },
    { say: 'ch7.ev.brasa.3', who: 'brasa' },
    { say: 'ch7.ev.brasa.4', who: 'brasa' },
    { say: 'ch7.ev.brasa.5', who: 'kid' },
    { say: 'ch7.ev.brasa.6', who: 'brasa' },
    { say: 'ch7.ev.brasa.7', who: 'brasa' },
    { flag: 'c7:brasa' }
  ],

  /* Grandma's wand box, by kite from home (Dad found it behind the loose hearth stone: "the hearth keeps secrets") */
  'ch7.box': [
    { wait: 600 },
    { ext: 'kiteFlight', mode: 'mail', bring: 'grandma_wand' },
    { sound: 'page' },
    { say: 'ch7.box.1', who: 'kid' },
    { say: 'ch7.box.mom.1', who: 'mom' },
    { say: 'ch7.box.dad.1', who: 'dad' },
    { say: 'ch7.box.mom.2', who: 'mom' },
    { say: 'ch7.box.mom.3', who: 'mom' },
    { wait: 500 },
    { say: 'ch7.box.2', who: 'kid' },
    { give: 'grandma_wand' },
    { sound: 'chime' },
    { say: 'ch7.box.3', who: 'kid' },
    { say: 'ch7.box.4', who: 'kid' },
    { give: 'grandma_letter' },
    { give: 'vael_young_letter' },
    { run: 'ch7.grandma' },
    { wait: 500 },
    { run: 'ch7.vael' },
    { wait: 500 },
    { say: 'ch7.box.5', who: 'kid' },
    { say: 'ch7.box.6', who: 'kid' },
    { flag: 'c7:box' },
    { say: 'ch7.box.7', who: 'companion' }
  ],
  'ch7.grandma': [
    { say: 'ch7.grandma.1', who: 'letter' },
    { say: 'ch7.grandma.2', who: 'letter' },
    { say: 'ch7.grandma.3', who: 'letter' },
    { say: 'ch7.grandma.4', who: 'letter' }
  ],
  'ch7.vael': [
    { say: 'ch7.vael.1', who: 'letter' },
    { say: 'ch7.vael.2', who: 'letter' },
    { say: 'ch7.vael.3', who: 'letter' },
    { say: 'ch7.vael.4', who: 'letter' }
  ],
  'ch7.wand.hold': [
    { sound: 'chime' },
    { say: 'ch7.wand.1', who: 'kid' },
    { say: 'ch7.wand.2', who: 'companion' }
  ],

  /* Cole and Mira arrive together; Cole has seen the jars and stands with the kid. No duel. */
  /* Cole's and Mira's service in their Cinderreach phases (chapter 1 people): nothing more than their words */
  'ch7.svc.friend': [{ stop: true }],
  'ch7.friends': [
    { move: 'mira', to: { player: [-1, -1] } },
    { move: 'cole', to: { player: [1, -1] } },
    { face: 'mira', dir: 'player' },
    { face: 'cole', dir: 'player' },
    { say: 'ch7.ev.friends.1', who: 'mira' },
    { say: 'ch7.ev.friends.2', who: 'cole' },
    { say: 'ch7.ev.friends.3', who: 'cole' },
    { say: 'ch7.ev.friends.4', who: 'kid' },
    { say: 'ch7.ev.friends.5', who: 'kid' },
    { say: 'ch7.ev.friends.6', who: 'cole' },
    { say: 'ch7.ev.friends.7', who: 'mira' },
    { say: 'ch7.ev.friends.8', who: 'mira' },
    { say: 'ch7.ev.friends.9', who: 'mira' },
    {
      if: 'c7:cooled',
      then: [{ say: 'ch7.ev.friends.10b', who: 'mira' }],
      else: [{ say: 'ch7.ev.friends.10', who: 'mira' }]
    },
    { give: 'tide_pearl', n: 3 },
    { say: 'ch7.ev.friends.11', who: 'cole' },
    { say: 'ch7.ev.friends.12', who: 'cole' },
    { flag: 'c7:friends' },
    { say: 'ch7.ev.friends.13', who: 'companion' }
  ],

  /* Kell keeps the Crucible door: he explains the court, puts the braziers out on request, and makes sure no one
     is left without water for the lava (two Tide Pearls, once) */
  'ch7.svc.kell': [
    { if: 'c7:kell', then: [{ stop: true }] },
    {
      if: { all: [{ not: 'c7:kell:pearls' }, { not: WATER }, { not: { has: 'tide_pearl' } }, { not: 'c7:cooled' }] },
      then: [
        { say: 'ch7.ev.kell.pearls.1', who: 'kell' },
        { give: 'tide_pearl', n: 2 },
        { flag: 'c7:kell:pearls' },
        { say: 'ch7.ev.kell.pearls.2', who: 'kell' }
      ]
    },
    { if: 'c7:braziers', then: [{ stop: true }] },
    {
      choose: [
        { text: 'ch7.ev.kell.reset', then: [{ puzzle: 'braziers', do: 'reset' }, { sound: 'sizzle' }, { say: 'ch7.ev.kell.reset.1', who: 'kell' }] },
        { text: 'ch7.ev.kell.keep', then: [{ say: 'ch7.ev.kell.keep.1', who: 'kell' }] }
      ],
      cancel: 1
    }
  ],
  'ch7.kell': [
    { say: 'ch7.ev.kell.1', who: 'kell' },
    { say: 'ch7.ev.kell.2', who: 'kell' },
    {
      choose: [
        { text: 'ch7.ev.kell.go', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch7.ev.kell.3', who: 'kell' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      battle: { opponent: 'kell' },
      after: 'wake',
      won: [
        { flag: 'c7:kell' },
        { say: 'ch7.ev.kell.4', who: 'kell' },
        { say: 'ch7.ev.kell.5', who: 'kell' }
      ],
      else: [{ say: 'ch7.ev.kell.6', who: 'kell' }]
    }
  ],

  /* the ring: one sure stroke first (the burn twist, once), then the duel under heat */
  'ch7.ringduel': [
    {
      if: { not: 'c7:stroke' },
      then: [
        { say: 'ch7.ev.stroke.1', who: 'brasa' },
        { say: 'ch7.ev.stroke.2', who: 'brasa' },
        { helper: 'c7_burn', title: 'ch7.help.burn.title', text: 'ch7.help.burn', icon: 'fire' },
        { ext: 'draw', sigil: 'shield', text: 'ch7.ev.stroke.draw', twist: 'burn' },
        { sound: 'chime' },
        { flag: 'c7:stroke' },
        { say: 'ch7.ev.stroke.3', who: 'brasa' }
      ]
    },
    { say: 'ch7.ev.ring.1', who: 'brasa' },
    { say: 'ch7.ev.ring.2', who: 'brasa' },
    { helper: 'c7_heat', title: 'ch7.help.heat.title', text: 'ch7.help.heat', icon: 'fire' },
    {
      choose: [
        { text: 'ch2.ev.13', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch7.ev.ring.3', who: 'brasa' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      battle: { opponent: 'brasa' },
      after: 'wake',
      won: [
        { flag: 'c7:ring' },
        { ext: 'ring', element: 'fire' },
        { give: 'flame_ring' },
        { money: 50, why: 'ch2.ev.15' },
        { say: 'ch7.ev.ring.4', who: 'brasa' },
        { say: 'ch7.ev.ring.5', who: 'brasa' },
        { say: 'ch7.ev.ring.6', who: 'brasa' },
        { say: 'ch7.ev.ring.7', who: 'companion' }
      ],
      else: [{ say: 'ch7.ev.ring.8', who: 'brasa' }]
    }
  ],
  'ch7.svc.bench': [
    { if: 'c7:crucible:rested', then: [{ say: 'ch7.ev.bench.3', who: 'kell' }, { stop: true }] },
    { say: 'ch7.ev.bench.1', who: 'kell' },
    { blackout: 900, then: [{ wait: 400 }, { heal: { hp: 'full', rest: true } }, { ext: 'mana', set: 'full' }, { flag: 'c7:crucible:rested' }] },
    { toast: 'ch7.ev.bench.2' }
  ],

  /* the cold kiln: a fire hontori breathes on it; a cinderkit asleep in the ash pit may come along */
  'ch7.kiln': [
    {
      if: { not: 'c7:kiln:asked' },
      then: [
        { say: 'ch7.ev.kiln.1', who: 'sefa' },
        { say: 'ch7.ev.kiln.2', who: 'sefa' },
        { flag: 'c7:kiln:asked' },
        { quest: 'kiln', start: true }
      ]
    },
    {
      if: { not: { ext: 'carries', element: 'fire' } },
      then: [{ say: 'ch7.ev.kiln.3', who: 'sefa' }, { stop: true }]
    },
    {
      choose: [
        { text: 'ch7.ev.kiln.opt', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch7.ev.kiln.4', who: 'sefa' }, { stop: true }] }
      ],
      cancel: 1
    },
    { blackout: 900, then: [{ sound: 'sizzle' }, { wait: 400 }, { flag: 'c7:kiln' }] },
    { say: 'ch7.ev.kiln.5', who: 'kid' },
    { say: 'ch7.ev.kiln.6', who: 'sefa' },
    { money: 25, why: 'ch7.ev.kiln.why' },
    { give: 'ember_dust', n: 2 },
    { say: 'ch7.ev.kiln.7', who: 'sefa' },
    {
      choose: [
        { text: 'ch7.ev.kiln.take', then: [{ ext: 'addHontori', kind: 'cinderkit' }, { say: 'ch7.ev.kiln.8', who: 'companion' }] },
        { text: 'ch7.ev.kiln.leave', then: [{ say: 'ch7.ev.kiln.9', who: 'sefa' }] }
      ],
      cancel: 1
    }
  ],

  'ch7.svc.guestbed': [
    { say: 'ch7.inn.1', who: 'cr_innkeeper', params: { coins: { coins: { price: 'guest_bed' } } } },
    {
      choose: [
        { text: 'ch1.bo.opt.rest', then: [] },
        { text: 'ch1.bo.opt.no', then: [{ say: 'ch7.inn.2', who: 'cr_innkeeper' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      spend: { price: 'guest_bed' },
      fail: [{ say: 'ch7.inn.3', who: 'cr_innkeeper', params: { coins: { coins: { price: 'guest_bed' } } } }, { stop: true }]
    },
    { sound: 'sleep' },
    { fade: 800 },
    { rest: { hours: 8 } },
    { toast: 'ch1.bo.4' },
    { if: { companion: true }, then: [{ say: 'ch7.inn.4', who: 'companion' }] }
  ],
  'ch7.svc.ramen': [
    { say: 'ch7.inn.5', who: 'cr_innkeeper' },
    {
      choose: [
        { text: 'ch1.bo.opt.ramen', params: { price: { coins: { price: 'ramen' } } }, then: [] },
        { text: 'ch1.bo.opt.bed', params: { coins: { coins: { price: 'guest_bed' } } }, then: [{ run: 'ch7.svc.guestbed' }, { stop: true }] },
        { text: 'ch1.bo.opt.none', then: [{ say: 'ch7.inn.2', who: 'cr_innkeeper' }, { stop: true }] }
      ],
      cancel: 2
    },
    {
      spend: { price: 'ramen' },
      fail: [{ say: 'ch7.inn.6', who: 'cr_innkeeper', params: { coins: { coins: { price: 'ramen' } } } }, { stop: true }]
    },
    { heal: { hp: 'full', rest: true } },
    { ext: 'mana', set: 'full' },
    { sound: 'sparkle' },
    { fx: 'smoke', n: 6, dy: -14 },
    { toast: 'ch1.bo.10' },
    { say: 'ch7.inn.7', who: 'cr_innkeeper' }
  ]
};
