/*
 * ch8/maps/duskmere_tavern.js
 * Job: the tavern of Duskmere: firelight and candles only, the counter with the ramen pot, a guest bed.
 */

export default {
  id: 'duskmere_tavern',
  name: 'ch8.map.duskmere_tavern',
  tileset: 'indoor',
  always: { time: 18.5, weather: 'clear' },
  legend: { F: 'floor_wood', K: 'floor_tile', W: 'wall', V: 'void', B: 'carpet_blue' },
  rows: [
    'VWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWV',
    'VFFFFFFFFFFKKKKKKV',
    'VFBBBBBBBFFKKKKKKV',
    'VFBBBBBBBFFKKKKKKV',
    'VFBBBBBBBFFFFFFFFV',
    'VFFFFFFFFFFFFFFFFV',
    'VFBBBBBBFFFFFFFFFV',
    'VFBBBBBBFFFFFFFFFV',
    'VFBBBBBBFFFFFFFFFV',
    'VFFFFFFFFFFFFFFFFV',
    'VVVVVVVVVFVVVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'picture', x: 4, y: 1 }, { type: 'garland', x: 6, y: 1 }, { type: 'notice_board', x: 8, y: 1 },
    { type: 'hanging_pots', x: 13, y: 1 }, { type: 'window', x: 16, y: 1 }, { type: 'stove', x: 15, y: 2 }, { type: 'cupboard', x: 13, y: 2 },
    { type: 'sink', x: 16, y: 2 }, { type: 'tavern_counter', x: 12, y: 4 }, { type: 'ramen_pot', x: 15, y: 4 }, { type: 'barrel_in', x: 11, y: 2 },
    { type: 'fireplace', x: 4, y: 2 }, { type: 'tavern_table', x: 2, y: 4 }, { type: 'stool', x: 4, y: 4 }, { type: 'stool', x: 1, y: 5 },
    { type: 'tavern_table', x: 6, y: 4 }, { type: 'stool', x: 8, y: 5 }, { type: 'tavern_table', x: 2, y: 7 }, { type: 'stool', x: 4, y: 8 },
    { type: 'tavern_table', x: 6, y: 7 }, { type: 'stool', x: 5, y: 7 }, { type: 'bed', x: 16, y: 7 }, { type: 'chest', x: 15, y: 7 },
    { type: 'candles', x: 14, y: 10 }, { type: 'barrel_in', x: 1, y: 10 }, { type: 'clock', x: 9, y: 2 }, { type: 'plant', x: 16, y: 10 },
    { type: 'coat_rack', x: 10, y: 2 }
  ],
  doors: [
    { x: 9, y: 11, to: 'duskmere', tx: 14, ty: 16, dir: 0 }
  ],
  spawn: { x: 9, y: 10, dir: 1 },
  spots: {
    keeper: [13, 3],
    counter: [13, 5],
    bedside: [15, 8],
    guests: [[5, 6], [9, 6], [4, 10]]
  }
};
