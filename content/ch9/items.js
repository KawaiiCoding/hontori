/*
 * ch9/items.js
 * Job: the things of chapter 9 (schema section 1: one id means one thing). The Halo Ring is the eighth Warden's
 * vote: with it all eight are the kid's. Vael's garden key opens the gate of his garden.
 * The Sun Crystal is the dearest thing in the best shop of the game: set in the wand, it holds two more mana
 * for good (effect manaPlus, once per journey).
 */

export default {
  halo_ring: {
    id: 'halo_ring',
    name: 'ch9.item.halo_ring.name',
    icon: 'light',
    kind: 'key',
    desc: null,
    use: 'ch9.item.halo_ring.use',
    tag: 'ch9.item.halo_ring.tag',
    effect: 'ring'
  },
  garden_key: {
    id: 'garden_key',
    name: 'ch9.item.garden_key.name',
    icon: 'garden_key',
    kind: 'key',
    desc: null,
    use: 'ch9.item.garden_key.use',
    tag: 'ch9.item.garden_key.tag',
    effect: 'story'
  },
  sun_crystal: {
    id: 'sun_crystal',
    name: 'ch9.item.sun_crystal.name',
    icon: 'crystal',
    kind: 'key',
    desc: 'ch9.item.sun_crystal.desc',
    use: 'ch9.item.sun_crystal.use',
    tag: 'ch9.item.sun_crystal.tag',
    effect: 'manaPlus'
  }
};
