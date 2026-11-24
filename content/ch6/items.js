/*
 * ch6/items.js
 * Job: the things of chapter 6 (schema section 1: one id means one thing). The Stone Ring is the fifth Warden's
 * vote. Lantern Oil widens the Lantern's light in dark caves while it is carried; the Miner's Rope lets the kid
 * climb down the old shaft in the Old Quarry; a Dugsworth Treat mends one hontori in a battle (an earth hontori
 * fully). The page of Burr's notes, the Council order and Agna's mother's chisel can be read or looked at again
 * from the bag.
 */

export default {
  stone_ring: {
    id: 'stone_ring',
    name: 'ch6.item.stone_ring.name',
    icon: 'earth',
    kind: 'key',
    desc: null,
    use: 'ch6.item.stone_ring.use',
    tag: 'ch6.item.stone_ring.tag',
    effect: 'ring'
  },
  lantern_oil: {
    id: 'lantern_oil',
    name: 'ch6.item.lantern_oil.name',
    icon: 'lantern',
    kind: 'supply',
    desc: 'ch6.item.lantern_oil.desc',
    use: 'ch6.item.lantern_oil.use',
    tag: 'ch6.item.lantern_oil.tag',
    effect: 'lanternOil'
  },
  miner_rope: {
    id: 'miner_rope',
    name: 'ch6.item.miner_rope.name',
    icon: 'earth',
    kind: 'supply',
    desc: 'ch6.item.miner_rope.desc',
    use: 'ch6.item.miner_rope.use',
    tag: 'ch6.item.miner_rope.tag',
    effect: 'story'
  },
  dug_treat: {
    id: 'dug_treat',
    name: 'ch6.item.dug_treat.name',
    icon: 'heart',
    kind: 'supply',
    desc: 'ch6.item.dug_treat.desc',
    use: 'ch6.item.dug_treat.use',
    tag: 'ch6.item.dug_treat.tag',
    effect: 'earthTreat'
  },
  carving_chisel: {
    id: 'carving_chisel',
    name: 'ch6.item.carving_chisel.name',
    icon: 'earth',
    kind: 'key',
    desc: null,
    use: 'ch6.item.carving_chisel.use',
    tag: 'ch6.item.carving_chisel.tag',
    effect: 'story'
  },
  burr_page: {
    id: 'burr_page',
    name: 'ch6.item.burr_page.name',
    icon: 'scroll',
    kind: 'key',
    desc: null,
    use: 'ch6.item.burr_page.use',
    tag: 'ch3.item.letter.tag',
    effect: 'story',
    actions: [{ label: 'ch3.item.read', desc: 'ch3.item.read.desc', then: [{ run: 'ch6.burrpage' }] }]
  },
  sanctum_order: {
    id: 'sanctum_order',
    name: 'ch6.item.sanctum_order.name',
    icon: 'scroll',
    kind: 'key',
    desc: null,
    use: 'ch6.item.sanctum_order.use',
    tag: 'ch6.item.sanctum_order.tag',
    effect: 'story',
    actions: [{ label: 'ch3.item.read', desc: 'ch3.item.read.desc', then: [{ run: 'ch6.order' }] }]
  }
};
