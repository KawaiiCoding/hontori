/*
 * ch8/maps/duskmere_h1.js
 * Job: house 1 of Duskmere: a family that hides hunted hontori, small beds by the wall for them.
 */

export default {
  id: 'duskmere_h1',
  name: 'ch8.map.duskmere_h1',
  tileset: 'indoor',
  always: { time: 19.4, weather: 'clear' },
  legend: { F: 'floor_wood', K: 'floor_tile', W: 'wall', V: 'void', B: 'carpet_blue' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VFFFFFFFKKKKKV',
    'VFFFFFFFKKKKKV',
    'VFFFFFFFFFFFFV',
    'VFFBBBBBBFFFFV',
    'VFFBBBBBBFFFFV',
    'VFFBBBBBBFFFFV',
    'VFFFFFFFFFFFFV',
    'VVVVVVVFVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'picture', x: 4, y: 1 }, { type: 'wall_shelf', x: 6, y: 1 }, { type: 'hanging_pots', x: 9, y: 1 },
    { type: 'window', x: 12, y: 1 }, { type: 'bed', x: 1, y: 2 }, { type: 'dresser', x: 2, y: 2 }, { type: 'fireplace', x: 4, y: 2 },
    { type: 'sink', x: 8, y: 2 }, { type: 'stove', x: 9, y: 2 }, { type: 'cupboard', x: 11, y: 2 }, { type: 'dining_table', x: 4, y: 5 },
    { type: 'chair', x: 3, y: 6 }, { type: 'chair', x: 7, y: 5 }, { type: 'armchair', x: 11, y: 6 }, { type: 'cat_bed', x: 1, y: 6 },
    { type: 'plant', x: 12, y: 8 }, { type: 'coat_rack', x: 9, y: 8 }, { type: 'cat_bed', x: 1, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'duskmere', tx: 22, ty: 16, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[10, 5], [5, 4], [3, 8]],
    hidden: [[2, 6], [2, 8]]
  }
};
