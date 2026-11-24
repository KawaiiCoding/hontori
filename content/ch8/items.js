/*
 * ch8/items.js
 * Job: the things of chapter 8 (schema section 1: one id means one thing). The Moon Ring is the seventh Warden's
 * vote. A Favour Token is what Duskmere pays for help, and Tallow's shop takes it instead of coins. The Ember
 * Lamp is Brasa's clay lamp with a Cinderreach flame, for a kid who left the Lantern at home: it lights the
 * dark like the Lantern. Wick's tea tin is carried to her sister Linnet. Merrit's sketch of the Athenaeum stair
 * can be read again from the bag.
 */

export default {
  moon_ring: {
    id: 'moon_ring',
    name: 'ch8.item.moon_ring.name',
    icon: 'dark',
    kind: 'key',
    desc: null,
    use: 'ch8.item.moon_ring.use',
    tag: 'ch8.item.moon_ring.tag',
    effect: 'ring'
  },
  favour_token: {
    id: 'favour_token',
    name: 'ch8.item.favour_token.name',
    icon: 'star',
    kind: 'supply',
    desc: 'ch8.item.favour_token.desc',
    use: 'ch8.item.favour_token.use',
    tag: 'ch8.item.favour_token.tag',
    effect: 'story'
  },
  ember_lamp: {
    id: 'ember_lamp',
    name: 'ch8.item.ember_lamp.name',
    icon: 'lantern',
    kind: 'key',
    desc: null,
    use: 'ch8.item.ember_lamp.use',
    tag: 'ch8.item.ember_lamp.tag',
    effect: 'lantern'
  },
  wick_tin: {
    id: 'wick_tin',
    name: 'ch8.item.wick_tin.name',
    icon: 'heart',
    kind: 'key',
    desc: null,
    use: 'ch8.item.wick_tin.use',
    tag: 'ch8.item.wick_tin.tag',
    effect: 'story'
  },
  stair_sketch: {
    id: 'stair_sketch',
    name: 'ch8.item.stair_sketch.name',
    icon: 'scroll',
    kind: 'key',
    desc: null,
    use: 'ch8.item.stair_sketch.use',
    tag: 'ch8.item.stair_sketch.tag',
    effect: 'story',
    actions: [{ label: 'ch3.item.read', desc: 'ch3.item.read.desc', then: [{ run: 'ch8.sketch' }] }]
  }
};
