/*
 * ch10/maps/council_west.js
 * Job: the chamber of Councillor Vesk (the rule: no rest): warm herringbone, a gold runner, tall hourglasses all run down and not a single seat but hers.
 */

export default {
  id: 'council_west',
  name: 'ch10.map.council_west',
  tileset: 'indoor',
  rest: false,
  legend: { W: 'wall', V: 'void', B: 'carpet_gold', H: 'floor_herring' },
  rows: [
    'VWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWV',
    'VHHHHHHHHHHHHHHHHHHHV',
    'VHHHHHHHHHHHHHHHHHHHV',
    'VHHHHHHHHHHHHHHHHHHHV',
    'VHHHHHHBBBBBBBHHHHHHV',
    'VHHHHHHBBBBBBBHHHHHHV',
    'VHHHHHHBBBBBBBHHHHHHV',
    'VHHHHHHBBBBBBBHHHHHHV',
    'VHHHHHHBBBBBBBHHHHHHV',
    'VHHHHHHBBBBBBBHHHHHHV',
    'VHHHHHHBBBBBBBHHHHHHV',
    'VHHHHHHBBBBBBBHHHHHHV',
    'VHHHHHHHHBBBHHHHHHHHV',
    'VHHHHHHHHBBBHHHHHHHHV',
    'VVVVVVVVVHHHVVVVVVVVV'
  ],
  props: [
    { type: 'hall_wall', x: 1, y: 0 }, { type: 'hall_wall', x: 1, y: 2 }, { type: 'hall_wall', x: 1, y: 4 }, { type: 'hall_wall', x: 2, y: 0 },
    { type: 'hall_wall', x: 2, y: 2 }, { type: 'hall_wall', x: 2, y: 4 }, { type: 'hall_wall', x: 3, y: 0 }, { type: 'hall_wall', x: 3, y: 2 },
    { type: 'hall_wall', x: 3, y: 4 }, { type: 'hall_wall', x: 4, y: 0 }, { type: 'hall_wall', x: 4, y: 2 }, { type: 'hall_wall', x: 4, y: 4 },
    { type: 'hall_wall', x: 5, y: 0 }, { type: 'hall_wall', x: 5, y: 2 }, { type: 'hall_wall', x: 5, y: 4 }, { type: 'hall_wall', x: 6, y: 0 },
    { type: 'hall_wall', x: 6, y: 2 }, { type: 'hall_wall', x: 6, y: 4 }, { type: 'hall_wall', x: 7, y: 0 }, { type: 'hall_wall', x: 7, y: 2 },
    { type: 'hall_wall', x: 7, y: 4 }, { type: 'hall_wall', x: 8, y: 0 }, { type: 'hall_wall', x: 8, y: 2 }, { type: 'hall_wall', x: 8, y: 4 },
    { type: 'hall_wall', x: 9, y: 0 }, { type: 'hall_wall', x: 9, y: 2 }, { type: 'hall_wall', x: 9, y: 4 }, { type: 'hall_wall', x: 10, y: 0 },
    { type: 'hall_wall', x: 10, y: 2 }, { type: 'hall_wall', x: 10, y: 4 }, { type: 'hall_wall', x: 11, y: 0 }, { type: 'hall_wall', x: 11, y: 2 },
    { type: 'hall_wall', x: 11, y: 4 }, { type: 'hall_wall', x: 12, y: 0 }, { type: 'hall_wall', x: 12, y: 2 }, { type: 'hall_wall', x: 12, y: 4 },
    { type: 'hall_wall', x: 13, y: 0 }, { type: 'hall_wall', x: 13, y: 2 }, { type: 'hall_wall', x: 13, y: 4 }, { type: 'hall_wall', x: 14, y: 0 },
    { type: 'hall_wall', x: 14, y: 2 }, { type: 'hall_wall', x: 14, y: 4 }, { type: 'hall_wall', x: 15, y: 0 }, { type: 'hall_wall', x: 15, y: 2 },
    { type: 'hall_wall', x: 15, y: 4 }, { type: 'hall_wall', x: 16, y: 0 }, { type: 'hall_wall', x: 16, y: 2 }, { type: 'hall_wall', x: 16, y: 4 },
    { type: 'hall_wall', x: 17, y: 0 }, { type: 'hall_wall', x: 17, y: 2 }, { type: 'hall_wall', x: 17, y: 4 }, { type: 'hall_wall', x: 18, y: 0 },
    { type: 'hall_wall', x: 18, y: 2 }, { type: 'hall_wall', x: 18, y: 4 }, { type: 'hall_wall', x: 19, y: 0 }, { type: 'hall_wall', x: 19, y: 2 },
    { type: 'hall_wall', x: 19, y: 4 }, { type: 'council_seat_w', x: 9, y: 7 }, { type: 'council_banner', x: 5, y: 3 }, { type: 'council_banner', x: 15, y: 3 },
    { type: 'window', x: 8, y: 3 }, { type: 'window', x: 12, y: 3 }, { type: 'clock', x: 2, y: 6 }, { type: 'clock', x: 18, y: 6 },
    { type: 'hourglass_stand', x: 5, y: 9 }, { type: 'hourglass_stand', x: 5, y: 13 }, { type: 'hourglass_stand', x: 15, y: 9 }, { type: 'hourglass_stand', x: 15, y: 13 },
    { type: 'hourglass_stand', x: 3, y: 7 }, { type: 'hourglass_stand', x: 17, y: 7 }, { type: 'candles', x: 1, y: 16 }, { type: 'candles', x: 19, y: 16 },
    { type: 'potted_tree', x: 1, y: 9 }, { type: 'potted_tree', x: 19, y: 9 }
  ],
  doors: [
    { x: 9, y: 19, to: 'athenaeum', tx: 6, ty: 7, dir: 0 }, { x: 10, y: 19, to: 'athenaeum', tx: 6, ty: 7, dir: 0 },
    { x: 11, y: 19, to: 'athenaeum', tx: 6, ty: 7, dir: 0 }
  ],
  spawn: { x: 10, y: 18, dir: 1 },
  spots: {
    councillor: [10, 8],
    duelFoe: [10, 10],
    duelKid: [10, 15],
    save: [10, 17],
    exit: [10, 18]
  }
};
