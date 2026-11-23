/*
 * ch3/maps/kitewick_h4.js
 * Job: house 4 of Kitewick: the bell keeper's small home.
 */

export default {
  id: 'kitewick_h4',
  name: 'ch3.map.kitewick_h4',
  tileset: 'indoor',
  legend: { K: 'floor_tile', R: 'rug', W: 'wall', V: 'void', H: 'floor_herring' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VKKKKKHHHHHHHV',
    'VKKKKKHHHHHHHV',
    'VHHHHHHHHHHHHV',
    'VHHHHRRRRHHHHV',
    'VHHHHRRRRHHHHV',
    'VHHHHRRRRHHHHV',
    'VHHHHHHHHHHHHV',
    'VVVVVVVHVVVVVV'
  ],
  props: [
    { type: 'window', x: 3, y: 1 }, { type: 'herb_rack', x: 5, y: 1 }, { type: 'wall_shelf', x: 7, y: 1 }, { type: 'window', x: 10, y: 1 },
    { type: 'stove', x: 1, y: 2 }, { type: 'cupboard', x: 2, y: 2 }, { type: 'sink', x: 4, y: 2 }, { type: 'bookshelf', x: 8, y: 2 },
    { type: 'bed', x: 11, y: 2 }, { type: 'dresser', x: 12, y: 5 }, { type: 'table', x: 6, y: 5 }, { type: 'chair', x: 5, y: 6 },
    { type: 'chair', x: 8, y: 5 }, { type: 'armchair', x: 2, y: 6 }, { type: 'flower_vase', x: 12, y: 8 }, { type: 'floor_lamp', x: 1, y: 8 },
    { type: 'cat_bed', x: 10, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'kitewick', tx: 18, ty: 33, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[4, 4], [9, 6]]
  }
};
