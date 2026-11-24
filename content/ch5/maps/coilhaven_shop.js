/*
 * ch5/maps/coilhaven_shop.js
 * Job: the shop of Coilhaven: full shelves and high prices, the counter in the middle.
 */

export default {
  id: 'coilhaven_shop',
  name: 'ch5.map.coilhaven_shop',
  tileset: 'indoor',
  legend: { K: 'floor_tile', R: 'rug', W: 'wall', V: 'void' },
  rows: [
    'VWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWV',
    'VKKKKKKKKKKKKKKV',
    'VKKKKKKKKKKKKKKV',
    'VKKKKKKKKKKKKKKV',
    'VKKKKKKKKKKKKKKV',
    'VKKKKRRRRRRKKKKV',
    'VKKKKRRRRRRKKKKV',
    'VKKKKRRRRRRKKKKV',
    'VKKKKKKKKKKKKKKV',
    'VVVVVVVVKVVVVVVV'
  ],
  props: [
    { type: 'wall_shelf', x: 2, y: 1 }, { type: 'window', x: 5, y: 1 }, { type: 'lantern_hang', x: 7, y: 1 }, { type: 'wall_shelf', x: 9, y: 1 },
    { type: 'window', x: 12, y: 1 }, { type: 'picture', x: 14, y: 1 }, { type: 'shop_shelf', x: 1, y: 2 }, { type: 'potion_rack', x: 3, y: 2 },
    { type: 'potion_rack', x: 4, y: 2 }, { type: 'clock', x: 5, y: 2 }, { type: 'shop_shelf', x: 10, y: 2 }, { type: 'shop_shelf', x: 12, y: 2 },
    { type: 'barrel_in', x: 14, y: 2 }, { type: 'shop_counter', x: 6, y: 4 }, { type: 'shop_shelf', x: 1, y: 6 }, { type: 'barrel_in', x: 1, y: 8 },
    { type: 'shop_shelf', x: 13, y: 6 }, { type: 'chest', x: 14, y: 8 }, { type: 'floor_lamp', x: 12, y: 9 }, { type: 'plant', x: 1, y: 9 },
    { type: 'globe', x: 14, y: 9 }
  ],
  doors: [
    { x: 8, y: 10, to: 'coilhaven', tx: 38, ty: 18, dir: 0 }
  ],
  spawn: { x: 8, y: 9, dir: 1 },
  spots: {
    keeper: [7, 3],
    counter: [7, 5],
    guest: [4, 7]
  }
};
