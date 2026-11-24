/*
 * ch4/maps/tidewell_shop.js
 * Job: the shop of Tidewell: hooks, rope and lantern oil on the shelves, the counter by the window.
 */

export default {
  id: 'tidewell_shop',
  name: 'ch4.map.tidewell_shop',
  tileset: 'indoor',
  legend: { F: 'floor_wood', K: 'floor_tile', R: 'rug', W: 'wall', V: 'void' },
  rows: [
    'VWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWV',
    'VFFFFFFFFKKKKKKV',
    'VFFFFFFFFKKKKKKV',
    'VFFFFFFFFKKKKKKV',
    'VFFFFFFFFFFFFFFV',
    'VFFRRRRRRFFFFFFV',
    'VFFRRRRRRFFFFFFV',
    'VFFRRRRRRFFFFFFV',
    'VFFFFFFFFFFFFFFV',
    'VVVVVVVVFVVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'wall_shelf', x: 4, y: 1 }, { type: 'lantern_hang', x: 7, y: 1 }, { type: 'wall_map', x: 9, y: 1 },
    { type: 'window', x: 12, y: 1 }, { type: 'shop_shelf', x: 1, y: 2 }, { type: 'shop_shelf', x: 3, y: 2 }, { type: 'barrel_in', x: 6, y: 2 },
    { type: 'potion_rack', x: 14, y: 2 }, { type: 'shop_shelf', x: 12, y: 2 }, { type: 'shop_counter', x: 10, y: 4 }, { type: 'barrel_in', x: 1, y: 5 },
    { type: 'shop_shelf', x: 1, y: 7 }, { type: 'chest', x: 14, y: 7 }, { type: 'barrel_in', x: 14, y: 8 }, { type: 'loom', x: 5, y: 2 },
    { type: 'plant', x: 1, y: 9 }, { type: 'flower_vase', x: 14, y: 9 }, { type: 'floor_lamp', x: 10, y: 9 }
  ],
  doors: [
    { x: 8, y: 10, to: 'tidewell', tx: 34, ty: 11, dir: 0 }
  ],
  spawn: { x: 8, y: 9, dir: 1 },
  spots: {
    keeper: [11, 3],
    counter: [11, 5],
    guest: [5, 7]
  }
};
