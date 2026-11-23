/*
 * ch3/maps/kitewick_tavern.js
 * Job: the tavern of Kitewick: a counter with the ramen pot, tables, a guest bed.
 */

export default {
  id: 'kitewick_tavern',
  name: 'ch3.map.kitewick_tavern',
  tileset: 'indoor',
  legend: { F: 'floor_wood', R: 'rug', W: 'wall', V: 'void', S: 'floor_stone' },
  rows: [
    'VWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWV',
    'VFFFFFFFFFFSSSSSSV',
    'VFFFFFFFFFFSSSSSSV',
    'VFFFFFFFFFFSSSSSSV',
    'VFFFFFFFFFFFFFFFFV',
    'VFRRRRRRRFFFFFFFFV',
    'VFRRRRRRRFFFFFFFFV',
    'VFRRRRRRRFFFFFFFFV',
    'VFRRRRRRRFFFFFFFFV',
    'VFFFFFFFFFFFFFFFFV',
    'VVVVVVVVVFVVVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'picture', x: 4, y: 1 }, { type: 'lantern_hang', x: 6, y: 1 }, { type: 'notice_board', x: 8, y: 1 },
    { type: 'lantern_hang', x: 11, y: 1 }, { type: 'window', x: 13, y: 1 }, { type: 'hanging_pots', x: 15, y: 1 }, { type: 'cupboard', x: 15, y: 2 },
    { type: 'stove', x: 14, y: 2 }, { type: 'tavern_counter', x: 13, y: 4 }, { type: 'ramen_pot', x: 16, y: 4 }, { type: 'tavern_table', x: 3, y: 3 },
    { type: 'stool', x: 2, y: 3 }, { type: 'stool', x: 5, y: 4 }, { type: 'tavern_table', x: 7, y: 3 }, { type: 'stool', x: 9, y: 3 },
    { type: 'tavern_table', x: 3, y: 7 }, { type: 'stool', x: 5, y: 7 }, { type: 'stool', x: 2, y: 8 }, { type: 'tavern_table', x: 6, y: 7 },
    { type: 'stool', x: 8, y: 8 }, { type: 'barrel_in', x: 1, y: 5 }, { type: 'barrel_in', x: 1, y: 6 }, { type: 'bed', x: 16, y: 7 },
    { type: 'chest', x: 15, y: 7 }, { type: 'plant', x: 16, y: 10 }, { type: 'flower_vase', x: 1, y: 10 }, { type: 'floor_lamp', x: 12, y: 10 },
    { type: 'coat_rack', x: 11, y: 2 }
  ],
  doors: [
    { x: 9, y: 11, to: 'kitewick', tx: 28, ty: 13, dir: 0 }
  ],
  spawn: { x: 9, y: 10, dir: 1 },
  spots: {
    keeper: [12, 3],
    counter: [14, 5],
    bedside: [15, 8],
    guests: [[6, 5], [5, 8], [10, 7]]
  }
};
