/*
 * ch5/maps/coilhaven_tavern.js
 * Job: the tavern of Coilhaven: the counter with the ramen pot, tables for the workers, a guest bed.
 */

export default {
  id: 'coilhaven_tavern',
  name: 'ch5.map.coilhaven_tavern',
  tileset: 'indoor',
  legend: { F: 'floor_wood', K: 'floor_tile', R: 'rug', W: 'wall', V: 'void' },
  rows: [
    'VWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWV',
    'VFFFFFFFFFFKKKKKKV',
    'VFRRRRRRRFFKKKKKKV',
    'VFRRRRRRRFFKKKKKKV',
    'VFRRRRRRRFFFFFFFFV',
    'VFFFFFFFFFFFFFFFFV',
    'VFRRRRRRFFFFFFFFFV',
    'VFRRRRRRFFFFFFFFFV',
    'VFRRRRRRFFFFFFFFFV',
    'VFFFFFFFFFFFFFFFFV',
    'VVVVVVVVVFVVVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'lantern_hang', x: 4, y: 1 }, { type: 'picture', x: 6, y: 1 }, { type: 'notice_board', x: 8, y: 1 },
    { type: 'lantern_hang', x: 11, y: 1 }, { type: 'hanging_pots', x: 13, y: 1 }, { type: 'window', x: 16, y: 1 }, { type: 'stove', x: 15, y: 2 },
    { type: 'cupboard', x: 13, y: 2 }, { type: 'sink', x: 16, y: 2 }, { type: 'tavern_counter', x: 12, y: 4 }, { type: 'ramen_pot', x: 15, y: 4 },
    { type: 'barrel_in', x: 11, y: 2 }, { type: 'tavern_table', x: 2, y: 3 }, { type: 'stool', x: 4, y: 3 }, { type: 'stool', x: 1, y: 4 },
    { type: 'tavern_table', x: 6, y: 3 }, { type: 'stool', x: 8, y: 4 }, { type: 'tavern_table', x: 2, y: 7 }, { type: 'stool', x: 4, y: 8 },
    { type: 'tavern_table', x: 6, y: 7 }, { type: 'stool', x: 5, y: 7 }, { type: 'bed', x: 16, y: 7 }, { type: 'chest', x: 15, y: 7 },
    { type: 'floor_lamp', x: 14, y: 10 }, { type: 'barrel_in', x: 1, y: 10 }, { type: 'clock', x: 9, y: 2 }, { type: 'plant', x: 16, y: 10 },
    { type: 'coat_rack', x: 10, y: 2 }
  ],
  doors: [
    { x: 9, y: 11, to: 'coilhaven', tx: 26, ty: 18, dir: 0 }
  ],
  spawn: { x: 9, y: 10, dir: 1 },
  spots: {
    keeper: [13, 3],
    counter: [13, 5],
    bedside: [15, 8],
    guests: [[5, 5], [9, 6], [4, 9]]
  }
};
