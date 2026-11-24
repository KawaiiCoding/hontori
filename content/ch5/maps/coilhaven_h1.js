/*
 * ch5/maps/coilhaven_h1.js
 * Job: house 1 of Coilhaven: the workshop of the ring-smith Master Ashfield, the forge at one end, rings and lamp jars on the shelves, his bed at the other.
 */

export default {
  id: 'coilhaven_h1',
  name: 'ch5.map.coilhaven_h1',
  tileset: 'indoor',
  legend: { F: 'floor_wood', K: 'floor_tile', W: 'wall', V: 'void', S: 'floor_stone' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VKKKKKSSSSSSSV',
    'VKKKKKSSSSSSSV',
    'VKKKKKSSSSSSSV',
    'VSSSSSSSSSSSSV',
    'VSSSSSSSFFFFFV',
    'VSSSSSSSFFFFFV',
    'VSSSSSSSFFFFFV',
    'VVVVVVVSVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'wall_shelf', x: 4, y: 1 }, { type: 'lantern_hang', x: 5, y: 1 }, { type: 'stove', x: 1, y: 2 },
    { type: 'firewood', x: 2, y: 2 }, { type: 'barrel_in', x: 3, y: 2 }, { type: 'potion_rack', x: 6, y: 2 }, { type: 'potion_rack', x: 7, y: 2 },
    { type: 'shop_shelf', x: 8, y: 2 }, { type: 'shop_shelf', x: 10, y: 2 }, { type: 'potion_rack', x: 12, y: 2 }, { type: 'counter', x: 3, y: 5 },
    { type: 'desk', x: 1, y: 5 }, { type: 'chest', x: 1, y: 8 }, { type: 'bed', x: 12, y: 6 }, { type: 'dresser', x: 11, y: 6 },
    { type: 'floor_lamp', x: 9, y: 8 }, { type: 'candles', x: 5, y: 8 }, { type: 'barrel_in', x: 2, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'coilhaven', tx: 43, ty: 34, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[3, 4], [9, 4]],
    smith: [3, 4],
    cole: [6, 6],
    jars: [[6, 3], [7, 3], [12, 3]]
  }
};
