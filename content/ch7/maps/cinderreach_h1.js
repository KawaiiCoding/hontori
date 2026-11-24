/*
 * ch7/maps/cinderreach_h1.js
 * Job: house 1 of Cinderreach: a glassblower's home, coloured bottles on the shelf.
 */

export default {
  id: 'cinderreach_h1',
  name: 'ch7.map.cinderreach_h1',
  tileset: 'indoor',
  legend: { F: 'floor_wood', K: 'floor_tile', R: 'rug', W: 'wall', V: 'void' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VFFFFFFFKKKKKV',
    'VFFFFFFFKKKKKV',
    'VFFFFFFFFFFFFV',
    'VFFRRRRRRFFFFV',
    'VFFRRRRRRFFFFV',
    'VFFRRRRRRFFFFV',
    'VFFFFFFFFFFFFV',
    'VVVVVVVFVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'wall_shelf', x: 4, y: 1 }, { type: 'lantern_hang', x: 6, y: 1 }, { type: 'hanging_pots', x: 9, y: 1 },
    { type: 'window', x: 12, y: 1 }, { type: 'bed', x: 1, y: 2 }, { type: 'dresser', x: 2, y: 2 }, { type: 'potion_rack', x: 4, y: 2 },
    { type: 'potion_rack', x: 5, y: 2 }, { type: 'sink', x: 8, y: 2 }, { type: 'stove', x: 9, y: 2 }, { type: 'cupboard', x: 11, y: 2 },
    { type: 'table', x: 4, y: 5 }, { type: 'chair', x: 3, y: 6 }, { type: 'chair', x: 6, y: 5 }, { type: 'counter', x: 10, y: 6 },
    { type: 'barrel_in', x: 1, y: 6 }, { type: 'plant', x: 12, y: 8 }, { type: 'coat_rack', x: 9, y: 8 }, { type: 'candles', x: 1, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'cinderreach', tx: 7, ty: 31, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[10, 5], [5, 4], [3, 8]]
  }
};
