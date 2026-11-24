/*
 * ch4/maps/tidewell_tavern.js
 * Job: the tavern of Tidewell: the counter with the ramen pot, tables by the fire, a guest bed.
 */

export default {
  id: 'tidewell_tavern',
  name: 'ch4.map.tidewell_tavern',
  tileset: 'indoor',
  legend: { F: 'floor_wood', R: 'rug', W: 'wall', V: 'void', S: 'floor_stone' },
  rows: [
    'VWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWV',
    'VSSSSSSFFFFFFFFFFV',
    'VSSSSSSFFFFFFFFFFV',
    'VSSSSSSFFFFFFFFFFV',
    'VFFFFFFFFFFFFFFFFV',
    'VFFFFFFFFRRRRRRRFV',
    'VFFFFFFFFRRRRRRRFV',
    'VFFFFFFFFRRRRRRRFV',
    'VFFFFFFFFRRRRRRRFV',
    'VFFFFFFFFFFFFFFFFV',
    'VVVVVVVVVFVVVVVVVV'
  ],
  props: [
    { type: 'hanging_pots', x: 2, y: 1 }, { type: 'window', x: 5, y: 1 }, { type: 'notice_board', x: 7, y: 1 }, { type: 'picture', x: 13, y: 1 },
    { type: 'window', x: 15, y: 1 }, { type: 'lantern_hang', x: 16, y: 1 }, { type: 'lantern_hang', x: 4, y: 1 }, { type: 'stove', x: 1, y: 2 },
    { type: 'cupboard', x: 2, y: 2 }, { type: 'tavern_counter', x: 2, y: 4 }, { type: 'ramen_pot', x: 1, y: 4 }, { type: 'barrel_in', x: 5, y: 2 },
    { type: 'coat_rack', x: 7, y: 2 }, { type: 'tavern_table', x: 10, y: 3 }, { type: 'stool', x: 9, y: 3 }, { type: 'stool', x: 12, y: 4 },
    { type: 'tavern_table', x: 14, y: 3 }, { type: 'stool', x: 16, y: 4 }, { type: 'tavern_table', x: 10, y: 7 }, { type: 'stool', x: 9, y: 8 },
    { type: 'stool', x: 12, y: 7 }, { type: 'tavern_table', x: 14, y: 7 }, { type: 'stool', x: 13, y: 8 }, { type: 'bed', x: 1, y: 7 },
    { type: 'chest', x: 2, y: 7 }, { type: 'floor_lamp', x: 3, y: 10 }, { type: 'barrel_in', x: 16, y: 10 }, { type: 'flower_vase', x: 16, y: 6 },
    { type: 'plant', x: 1, y: 10 }, { type: 'fireplace', x: 10, y: 2 }
  ],
  doors: [
    { x: 9, y: 11, to: 'tidewell', tx: 23, ty: 11, dir: 0 }
  ],
  spawn: { x: 9, y: 10, dir: 1 },
  spots: {
    keeper: [3, 3],
    counter: [3, 5],
    bedside: [2, 8],
    guests: [[12, 5], [8, 6], [14, 5]]
  }
};
