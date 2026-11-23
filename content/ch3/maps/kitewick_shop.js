/*
 * ch3/maps/kitewick_shop.js
 * Job: the shop of Kitewick: shelves, a counter, kite cloth on the loom.
 */

export default {
  id: 'kitewick_shop',
  name: 'ch3.map.kitewick_shop',
  tileset: 'indoor',
  legend: { F: 'floor_wood', K: 'floor_tile', R: 'rug', W: 'wall', V: 'void' },
  rows: [
    'VWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWV',
    'VFFFFKKKKKKFFFFV',
    'VFFFFKKKKKKFFFFV',
    'VFFFFFFFFFFFFFFV',
    'VFFFFFFFFFFFFFFV',
    'VFFFFRRRRRRFFFFV',
    'VFFFFRRRRRRFFFFV',
    'VFFFFRRRRRRFFFFV',
    'VFFFFFFFFFFFFFFV',
    'VVVVVVVVFVVVVVVV'
  ],
  props: [
    { type: 'lantern_hang', x: 5, y: 1 }, { type: 'window', x: 7, y: 1 }, { type: 'wall_shelf', x: 9, y: 1 }, { type: 'picture', x: 12, y: 1 },
    { type: 'shop_shelf', x: 1, y: 2 }, { type: 'shop_shelf', x: 3, y: 2 }, { type: 'shop_shelf', x: 11, y: 2 }, { type: 'potion_rack', x: 13, y: 2 },
    { type: 'potion_rack', x: 14, y: 2 }, { type: 'barrel_in', x: 10, y: 2 }, { type: 'shop_counter', x: 6, y: 4 }, { type: 'barrel_in', x: 1, y: 5 },
    { type: 'barrel_in', x: 1, y: 6 }, { type: 'loom', x: 14, y: 5 }, { type: 'shop_shelf', x: 12, y: 7 }, { type: 'chest', x: 1, y: 9 },
    { type: 'flower_vase', x: 2, y: 9 }, { type: 'plant', x: 14, y: 9 }
  ],
  doors: [
    { x: 8, y: 10, to: 'kitewick', tx: 13, ty: 12, dir: 0 }
  ],
  spawn: { x: 8, y: 9, dir: 1 },
  spots: {
    keeper: [7, 3],
    counter: [7, 5],
    guest: [4, 7]
  }
};
