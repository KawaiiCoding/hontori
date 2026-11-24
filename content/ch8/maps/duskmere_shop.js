/*
 * ch8/maps/duskmere_shop.js
 * Job: the shop of Duskmere, where a favour buys more than a coin: half-empty shelves, a board of who owes whom.
 */

export default {
  id: 'duskmere_shop',
  name: 'ch8.map.duskmere_shop',
  tileset: 'indoor',
  always: { time: 18.5, weather: 'clear' },
  legend: { F: 'floor_wood', W: 'wall', V: 'void', B: 'carpet_blue' },
  rows: [
    'VWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWV',
    'VFFFFFFFFFFFFFFV',
    'VFFFFFFFFFFFFFFV',
    'VFFFFFFFFFFFFFFV',
    'VFFFFFFFFFFFFFFV',
    'VFFFFBBBBBBFFFFV',
    'VFFFFBBBBBBFFFFV',
    'VFFFFBBBBBBFFFFV',
    'VFFFFFFFFFFFFFFV',
    'VVVVVVVVFVVVVVVV'
  ],
  props: [
    { type: 'wall_shelf', x: 2, y: 1 }, { type: 'window', x: 5, y: 1 }, { type: 'notice_board', x: 8, y: 1 }, { type: 'window', x: 12, y: 1 },
    { type: 'herb_rack', x: 14, y: 1 }, { type: 'shop_shelf', x: 1, y: 2 }, { type: 'barrel_in', x: 3, y: 2 }, { type: 'potion_rack', x: 4, y: 2 },
    { type: 'shop_shelf', x: 10, y: 2 }, { type: 'shop_shelf', x: 12, y: 2 }, { type: 'chest', x: 14, y: 2 }, { type: 'shop_counter', x: 6, y: 4 },
    { type: 'shop_shelf', x: 1, y: 6 }, { type: 'chest', x: 1, y: 8 }, { type: 'shop_shelf', x: 13, y: 6 }, { type: 'chest', x: 14, y: 8 },
    { type: 'candles', x: 12, y: 9 }, { type: 'barrel_in', x: 1, y: 9 }, { type: 'bookstack', x: 14, y: 9 }
  ],
  doors: [
    { x: 8, y: 10, to: 'duskmere', tx: 36, ty: 16, dir: 0 }
  ],
  spawn: { x: 8, y: 9, dir: 1 },
  spots: {
    keeper: [7, 3],
    counter: [7, 5],
    guest: [4, 7],
    board: [8, 2]
  }
};
