/*
 * shared/items.js
 * Job: every item id: name, icon, kind (pocket, key, trade, supply), bag text, sell value and effect.
 * effect names what the item does (read by the inventory and the game layer); one id means one thing.
 * The saddle's bag description is new in v2 (src/menu.js has none). No ramen item: Big Bo's bowl heals on the spot.
 */

export default {
  backpack: {
    id: 'backpack',
    name: 'shared.item.backpack.name',
    icon: 'backpack',
    kind: 'pocket',
    desc: 'shared.item.backpack.desc',
    use: 'shared.item.backpack.use',
    tag: 'shared.item.backpack.tag',
    effect: 'pocketPlus',
    pocket: false
  },
  lantern: {
    id: 'lantern',
    name: 'shared.item.lantern.name',
    icon: 'lantern',
    kind: 'pocket',
    desc: 'shared.item.lantern.desc',
    use: 'shared.item.lantern.use',
    tag: 'shared.item.lantern.tag',
    effect: 'lantern',
    pocket: true
  },
  teddy: {
    id: 'teddy',
    name: 'shared.item.teddy.name',
    icon: 'teddy',
    kind: 'pocket',
    desc: 'shared.item.teddy.desc',
    use: 'shared.item.teddy.use',
    tag: 'shared.item.teddy.tag',
    effect: 'rest',
    pocket: true,
    actions: [
      {
        label: 'shared.item.teddy.rest',
        desc: 'shared.item.teddy.rest.desc',
        off: [{ if: { any: [{ mapRest: false }, { indoor: 'school' }] }, text: 'shared.item.teddy.rest.no' }],
        then: [{ fade: 900 }, { rest: { hours: 8 } }, { toast: 'shared.item.teddy.rested' }]
      }
    ]
  },
  cookbook: {
    id: 'cookbook',
    name: 'shared.item.cookbook.name',
    icon: 'cookbook',
    kind: 'pocket',
    desc: 'shared.item.cookbook.desc',
    use: 'shared.item.cookbook.use',
    tag: 'shared.item.cookbook.tag',
    effect: 'cook',
    pocket: true
  },
  compass: {
    id: 'compass',
    name: 'shared.item.compass.name',
    icon: 'compass',
    kind: 'pocket',
    desc: 'shared.item.compass.desc',
    use: 'shared.item.compass.use',
    tag: 'shared.item.compass.tag',
    effect: 'compass',
    actions: [
      { label: 'shared.item.compass.off', desc: 'shared.item.compass.off.desc', if: { not: 'compass:off' }, then: [{ flag: 'compass:off' }, { toast: 'shared.item.compass.offed' }] },
      { label: 'shared.item.compass.on', desc: 'shared.item.compass.on.desc', if: 'compass:off', then: [{ unflag: 'compass:off' }, { toast: 'shared.item.compass.oned' }] }
    ],
    pocket: true
  },
  slingshot: {
    id: 'slingshot',
    name: 'shared.item.slingshot.name',
    icon: 'slingshot',
    kind: 'pocket',
    desc: 'shared.item.slingshot.desc',
    use: 'shared.item.slingshot.use',
    tag: 'shared.item.slingshot.tag',
    effect: 'sling',
    pocket: true
  },
  bread: {
    id: 'bread',
    name: 'shared.item.bread.name',
    icon: 'bread',
    kind: 'pocket',
    desc: 'shared.item.bread.desc',
    use: 'shared.item.bread.use',
    tag: 'shared.item.bread.tag',
    effect: 'calm',
    pocket: true
  },
  map: {
    id: 'map',
    name: 'shared.item.map.name',
    icon: 'map',
    kind: 'key',
    desc: 'shared.item.map.desc',
    use: 'shared.item.map.use',
    tag: 'shared.item.map.tag',
    effect: 'map',
    pocket: false
  },
  kite: {
    id: 'kite',
    name: 'shared.item.kite.name',
    icon: 'kite',
    kind: 'pocket',
    desc: 'shared.item.kite.desc',
    use: 'shared.item.kite.use',
    tag: 'shared.item.kite.tag',
    effect: 'kite',
    pocket: true,
    actions: [
      {
        label: 'shared.item.kite.fly',
        desc: 'shared.item.kite.fly.desc',
        if: { indoor: false },
        off: [
          { if: { not: { weather: 'wind' } }, text: 'shared.item.kite.fly.wind' },
          { if: { not: { tile: ['grass', 'tallgrass', 'flowers'] } }, text: 'shared.item.kite.fly.grass' }
        ],
        then: [{ ext: 'revealMap', radius: 18 }, { sound: 'sparkle' }, { toast: 'shared.item.kite.flown' }]
      }
    ]
  },
  mirror: {
    id: 'mirror',
    name: 'shared.item.mirror.name',
    icon: 'mirror',
    kind: 'pocket',
    desc: 'shared.item.mirror.desc',
    use: 'shared.item.mirror.use',
    tag: 'shared.item.mirror.tag',
    effect: 'mirror',
    pocket: true
  },
  wand: {
    id: 'wand',
    name: 'shared.item.wand.name',
    icon: 'wand',
    kind: 'key',
    desc: null,
    use: 'shared.item.wand.use',
    tag: 'shared.item.wand.tag',
    effect: 'spells'
  },
  novice_cert: {
    id: 'novice_cert',
    name: 'shared.item.novice_cert.name',
    icon: 'scroll',
    kind: 'key',
    desc: null,
    use: 'shared.item.novice_cert.use',
    tag: 'shared.item.novice_cert.tag',
    effect: 'proof'
  },
  grey_letter: {
    id: 'grey_letter',
    name: 'shared.item.grey_letter.name',
    icon: 'scroll',
    kind: 'key',
    desc: null,
    use: 'shared.item.grey_letter.use',
    tag: 'shared.item.grey_letter.tag',
    effect: 'story'
  },
  ring_leaf: {
    id: 'ring_leaf',
    name: 'shared.item.ring_leaf.name',
    icon: 'grass',
    kind: 'key',
    desc: null,
    use: 'shared.item.ring_leaf.use',
    tag: 'shared.item.ring_leaf.tag',
    effect: 'ring'
  },
  herb: {
    id: 'herb',
    name: 'shared.item.herb.name',
    icon: 'grass',
    kind: 'supply',
    desc: null,
    use: 'shared.item.herb.use',
    tag: 'shared.item.herb.tag',
    effect: 'battleMana'
  },
  ember_dust: {
    id: 'ember_dust',
    name: 'shared.item.ember_dust.name',
    icon: 'fire',
    kind: 'supply',
    desc: null,
    use: 'shared.item.ember_dust.use',
    tag: 'shared.item.ember_dust.tag',
    effect: 'reviveFire'
  },
  tide_pearl: {
    id: 'tide_pearl',
    name: 'shared.item.tide_pearl.name',
    icon: 'water',
    kind: 'supply',
    desc: null,
    use: 'shared.item.tide_pearl.use',
    tag: 'shared.item.tide_pearl.tag',
    effect: 'reviveWater'
  },
  spirit_snack: {
    id: 'spirit_snack',
    name: 'shared.item.spirit_snack.name',
    icon: 'heart',
    kind: 'supply',
    desc: null,
    use: 'shared.item.spirit_snack.use',
    tag: 'shared.item.spirit_snack.tag',
    effect: 'reviveOther'
  },
  charm: {
    id: 'charm',
    name: 'shared.item.charm.name',
    icon: 'star',
    kind: 'supply',
    desc: null,
    use: 'shared.item.charm.use',
    tag: 'shared.item.charm.tag',
    effect: 'luck'
  },
  blue_backpack: {
    id: 'blue_backpack',
    name: 'shared.item.blue_backpack.name',
    icon: 'backpack',
    kind: 'supply',
    desc: null,
    use: 'shared.item.blue_backpack.use',
    tag: 'shared.item.blue_backpack.tag',
    effect: 'pocketPlus'
  },
  saddle: {
    id: 'saddle',
    name: 'shared.item.saddle.name',
    icon: 'paw',
    kind: 'supply',
    desc: 'shared.item.saddle.desc',
    use: null,
    tag: null,
    effect: 'ride'
  },
  shiny_pebble: {
    id: 'shiny_pebble',
    name: 'shared.item.shiny_pebble.name',
    icon: 'crystal',
    kind: 'trade',
    value: 4,
    desc: 'shared.item.shiny_pebble.desc',
    effect: 'sell'
  },
  feather: {
    id: 'feather',
    name: 'shared.item.feather.name',
    icon: 'feather',
    kind: 'trade',
    value: 2,
    desc: 'shared.item.feather.desc',
    effect: 'sell'
  },
  glowcap: {
    id: 'glowcap',
    name: 'shared.item.glowcap.name',
    icon: 'light',
    kind: 'trade',
    value: 6,
    desc: 'shared.item.glowcap.desc',
    effect: 'sell'
  },
  river_reed: {
    id: 'river_reed',
    name: 'shared.item.river_reed.name',
    icon: 'water',
    kind: 'trade',
    value: 2,
    desc: 'shared.item.river_reed.desc',
    effect: 'sell'
  },
  acorn: {
    id: 'acorn',
    name: 'shared.item.acorn.name',
    icon: 'earth',
    kind: 'trade',
    value: 1,
    desc: 'shared.item.acorn.desc',
    effect: 'sell'
  },
  wild_herb: {
    id: 'wild_herb',
    name: 'shared.item.wild_herb.name',
    icon: 'grass',
    kind: 'trade',
    value: 2,
    desc: 'shared.item.wild_herb.desc',
    effect: 'sell'
  },
  minnow: {
    id: 'minnow',
    name: 'shared.item.minnow.name',
    icon: 'water',
    kind: 'trade',
    value: 2,
    desc: 'shared.water.village.desc',
    tags: ['fish'],
    effect: 'sell'
  },
  carp: {
    id: 'carp',
    name: 'shared.item.carp.name',
    icon: 'water',
    kind: 'trade',
    value: 5,
    desc: 'shared.water.village.desc',
    tags: ['fish'],
    effect: 'sell'
  },
  moonfin: {
    id: 'moonfin',
    name: 'shared.item.moonfin.name',
    icon: 'water',
    kind: 'trade',
    value: 14,
    desc: 'shared.water.village.desc',
    tags: ['fish'],
    effect: 'sell'
  },
  trout: {
    id: 'trout',
    name: 'shared.item.trout.name',
    icon: 'water',
    kind: 'trade',
    value: 6,
    desc: 'shared.water.whisperwood.desc',
    tags: ['fish'],
    effect: 'sell'
  },
  perch: {
    id: 'perch',
    name: 'shared.item.perch.name',
    icon: 'water',
    kind: 'trade',
    value: 4,
    desc: 'shared.water.whisperwood.desc',
    tags: ['fish'],
    effect: 'sell'
  },
  glowgill: {
    id: 'glowgill',
    name: 'shared.item.glowgill.name',
    icon: 'water',
    kind: 'trade',
    value: 16,
    desc: 'shared.water.whisperwood.desc',
    tags: ['fish'],
    effect: 'sell'
  },
  koi: {
    id: 'koi',
    name: 'shared.item.koi.name',
    icon: 'water',
    kind: 'trade',
    value: 9,
    desc: 'shared.water.mossgrove.desc',
    tags: ['fish'],
    effect: 'sell'
  },
  bass: {
    id: 'bass',
    name: 'shared.item.bass.name',
    icon: 'water',
    kind: 'trade',
    value: 7,
    desc: 'shared.water.mossgrove.desc',
    tags: ['fish'],
    effect: 'sell'
  },
  starkoi: {
    id: 'starkoi',
    name: 'shared.item.starkoi.name',
    icon: 'water',
    kind: 'trade',
    value: 22,
    desc: 'shared.water.mossgrove.desc',
    tags: ['fish'],
    effect: 'sell'
  },
  mackerel: {
    id: 'mackerel',
    name: 'shared.item.mackerel.name',
    icon: 'water',
    kind: 'trade',
    value: 6,
    desc: 'shared.water.sea.desc',
    tags: ['fish'],
    effect: 'sell'
  },
  snapper: {
    id: 'snapper',
    name: 'shared.item.snapper.name',
    icon: 'water',
    kind: 'trade',
    value: 10,
    desc: 'shared.water.sea.desc',
    tags: ['fish'],
    effect: 'sell'
  },
  tidefin: {
    id: 'tidefin',
    name: 'shared.item.tidefin.name',
    icon: 'water',
    kind: 'trade',
    value: 28,
    desc: 'shared.water.sea.desc',
    tags: ['fish'],
    effect: 'sell'
  }
};
