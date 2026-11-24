/*
 * ch7/maps/cinderreach_shop.js
 * Job: the shop of Cinderreach: jars of Ember Dust on every shelf, heat cloaks by the door, the counter in the middle.
 */

export default {
  id: 'cinderreach_shop',
  name: 'ch7.map.cinderreach_shop',
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
    { type: 'potion_rack', x: 4, y: 2 }, { type: 'shop_shelf', x: 10, y: 2 }, { type: 'potion_rack', x: 12, y: 2 }, { type: 'potion_rack', x: 13, y: 2 },
    { type: 'barrel_in', x: 14, y: 2 }, { type: 'shop_counter', x: 6, y: 4 }, { type: 'shop_shelf', x: 1, y: 6 }, { type: 'barrel_in', x: 1, y: 8 },
    { type: 'shop_shelf', x: 13, y: 6 }, { type: 'chest', x: 14, y: 8 }, { type: 'floor_lamp', x: 12, y: 9 }, { type: 'candles', x: 1, y: 9 },
    { type: 'stove', x: 14, y: 9 }
  ],
  doors: [
    { x: 8, y: 10, to: 'cinderreach', tx: 43, ty: 20, dir: 0 }
  ],
  spawn: { x: 8, y: 9, dir: 1 },
  spots: {
    keeper: [7, 3],
    counter: [7, 5],
    guest: [4, 7]
  }
};
