/*
 * ch7/items.js
 * Job: the things of chapter 7 (schema section 1: one id means one thing). The Flame Ring is the sixth Warden's
 * vote. The heat cloak lets the kid walk down into the Hearth Below (the stair is too hot without it). Grandma's
 * wand box comes by kite from home: her wand (it still answers), her note, and a letter young Orlen Vael once
 * wrote to her. The two letters can be read again from the bag, and the wand can be held.
 */

export default {
  flame_ring: {
    id: 'flame_ring',
    name: 'ch7.item.flame_ring.name',
    icon: 'fire',
    kind: 'key',
    desc: null,
    use: 'ch7.item.flame_ring.use',
    tag: 'ch7.item.flame_ring.tag',
    effect: 'ring'
  },
  heat_cloak: {
    id: 'heat_cloak',
    name: 'ch7.item.heat_cloak.name',
    icon: 'heat_cloak',
    kind: 'key',
    desc: 'ch7.item.heat_cloak.desc',
    use: 'ch7.item.heat_cloak.use',
    tag: 'ch7.item.heat_cloak.tag',
    effect: 'story'
  },
  grandma_wand: {
    id: 'grandma_wand',
    name: 'ch7.item.grandma_wand.name',
    icon: 'wand',
    kind: 'key',
    desc: null,
    use: 'ch7.item.grandma_wand.use',
    tag: 'ch7.item.grandma_wand.tag',
    effect: 'story',
    actions: [{ label: 'ch7.item.hold', desc: 'ch7.item.hold.desc', then: [{ run: 'ch7.wand.hold' }] }]
  },
  grandma_letter: {
    id: 'grandma_letter',
    name: 'ch7.item.grandma_letter.name',
    icon: 'scroll',
    kind: 'key',
    desc: null,
    use: 'ch7.item.grandma_letter.use',
    tag: 'ch7.item.letter.tag',
    effect: 'story',
    actions: [{ label: 'ch7.item.read', desc: 'ch7.item.read.desc', then: [{ run: 'ch7.grandma' }] }]
  },
  vael_young_letter: {
    id: 'vael_young_letter',
    name: 'ch7.item.vael_young_letter.name',
    icon: 'scroll',
    kind: 'key',
    desc: null,
    use: 'ch7.item.vael_young_letter.use',
    tag: 'ch7.item.letter.tag',
    effect: 'story',
    actions: [{ label: 'ch7.item.read', desc: 'ch7.item.read.desc', then: [{ run: 'ch7.vael' }] }]
  }
};
