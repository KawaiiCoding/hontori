/*
 * ch6/maps/stonehollow_shop.js
 * Job: the shop of Stonehollow: lantern oil, rope and miner's gear on the shelves, the counter in the middle.
 */

export default {
  id: 'stonehollow_shop',
  name: 'ch6.map.stonehollow_shop',
  tileset: 'indoor',
  legend: { R: 'rug', W: 'wall', V: 'void', S: 'floor_stone' },
  rows: [
    'VWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWV',
    'VSSSSSSSSSSSSSSV',
    'VSSSSSSSSSSSSSSV',
    'VSSSSSSSSSSSSSSV',
    'VSSSSSSSSSSSSSSV',
    'VSSSSRRRRRRSSSSV',
    'VSSSSRRRRRRSSSSV',
    'VSSSSRRRRRRSSSSV',
    'VSSSSSSSSSSSSSSV',
    'VVVVVVVVSVVVVVVV'
  ],
  props: [
    { type: 'wall_shelf', x: 2, y: 1 }, { type: 'window', x: 5, y: 1 }, { type: 'lantern_hang', x: 7, y: 1 }, { type: 'wall_map', x: 9, y: 1 },
    { type: 'window', x: 12, y: 1 }, { type: 'lantern_hang', x: 14, y: 1 }, { type: 'shop_shelf', x: 1, y: 2 }, { type: 'barrel_in', x: 3, y: 2 },
    { type: 'barrel_in', x: 4, y: 2 }, { type: 'shop_shelf', x: 10, y: 2 }, { type: 'shop_shelf', x: 12, y: 2 }, { type: 'potion_rack', x: 14, y: 2 },
    { type: 'shop_counter', x: 6, y: 4 }, { type: 'shop_shelf', x: 1, y: 6 }, { type: 'firewood', x: 1, y: 8 }, { type: 'shop_shelf', x: 13, y: 6 },
    { type: 'chest', x: 14, y: 8 }, { type: 'floor_lamp', x: 12, y: 9 }, { type: 'barrel_in', x: 1, y: 9 }, { type: 'candles', x: 14, y: 9 }
  ],
  doors: [
    { x: 8, y: 10, to: 'stonehollow', tx: 45, ty: 24, dir: 0 }
  ],
  spawn: { x: 8, y: 9, dir: 1 },
  spots: {
    keeper: [7, 3],
    counter: [7, 5],
    guest: [4, 7]
  }
};
