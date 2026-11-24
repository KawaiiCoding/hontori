/*
 * ch9/maps/goldmere_shop.js
 * Job: the best shop of the journey: full shelves, a locked chest of things worth a few gold, the counter in the middle.
 */

export default {
  id: 'goldmere_shop',
  name: 'ch9.map.goldmere_shop',
  tileset: 'indoor',
  legend: { W: 'wall', V: 'void', H: 'floor_herring', B: 'carpet_blue' },
  rows: [
    'VWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWV',
    'VHHHHHHHHHHHHHHV',
    'VHHHHHHHHHHHHHHV',
    'VHHHHHHHHHHHHHHV',
    'VHHHHHHHHHHHHHHV',
    'VHHHBBBBBBBBHHHV',
    'VHHHBBBBBBBBHHHV',
    'VHHHBBBBBBBBHHHV',
    'VHHHHHHHHHHHHHHV',
    'VVVVVVVVHVVVVVVV'
  ],
  props: [
    { type: 'wall_shelf', x: 2, y: 1 }, { type: 'window', x: 5, y: 1 }, { type: 'lantern_hang', x: 7, y: 1 }, { type: 'wall_shelf', x: 9, y: 1 },
    { type: 'window', x: 12, y: 1 }, { type: 'picture', x: 14, y: 1 }, { type: 'shop_shelf', x: 1, y: 2 }, { type: 'potion_rack', x: 3, y: 2 },
    { type: 'potion_rack', x: 4, y: 2 }, { type: 'shop_shelf', x: 10, y: 2 }, { type: 'shop_shelf', x: 12, y: 2 }, { type: 'crystal_orb', x: 14, y: 2 },
    { type: 'shop_counter', x: 6, y: 4 }, { type: 'shop_shelf', x: 1, y: 6 }, { type: 'globe', x: 1, y: 8 }, { type: 'shop_shelf', x: 13, y: 6 },
    { type: 'chest', x: 14, y: 8 }, { type: 'floor_lamp', x: 12, y: 9 }, { type: 'potted_tree', x: 1, y: 9 }, { type: 'chest', x: 13, y: 9 },
    { type: 'flower_vase', x: 14, y: 9 }
  ],
  doors: [
    { x: 8, y: 10, to: 'goldmere', tx: 51, ty: 19, dir: 0 }
  ],
  spawn: { x: 8, y: 9, dir: 1 },
  spots: {
    keeper: [7, 3],
    counter: [7, 5],
    guest: [4, 7],
    treasure: [13, 8]
  }
};
