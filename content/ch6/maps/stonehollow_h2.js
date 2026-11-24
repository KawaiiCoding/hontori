/*
 * ch6/maps/stonehollow_h2.js
 * Job: house 2 of Stonehollow: a carver's home, small stone figures on every shelf.
 */

export default {
  id: 'stonehollow_h2',
  name: 'ch6.map.stonehollow_h2',
  tileset: 'indoor',
  legend: { F: 'floor_wood', K: 'floor_tile', W: 'wall', V: 'void', B: 'carpet_blue' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VKKKKFFFFFFFFV',
    'VKKKKFFFFFFFFV',
    'VFFFFFFFFFFFFV',
    'VFFFFBBBBBFFFV',
    'VFFFFBBBBBFFFV',
    'VFFFFBBBBBFFFV',
    'VFFFFFFFFFFFFV',
    'VVVVVVVFVVVVVV'
  ],
  props: [
    { type: 'window', x: 3, y: 1 }, { type: 'herb_rack', x: 5, y: 1 }, { type: 'wall_shelf', x: 7, y: 1 }, { type: 'picture', x: 10, y: 1 },
    { type: 'window', x: 12, y: 1 }, { type: 'stove', x: 1, y: 2 }, { type: 'sink', x: 2, y: 2 }, { type: 'cupboard', x: 3, y: 2 },
    { type: 'bookshelf', x: 6, y: 2 }, { type: 'clock', x: 8, y: 2 }, { type: 'bed', x: 12, y: 2 }, { type: 'chest', x: 11, y: 2 },
    { type: 'table', x: 6, y: 5 }, { type: 'chair', x: 5, y: 5 }, { type: 'chair', x: 8, y: 6 }, { type: 'desk', x: 1, y: 6 },
    { type: 'bookstack', x: 1, y: 8 }, { type: 'cat_bed', x: 12, y: 8 }, { type: 'floor_lamp', x: 10, y: 8 }, { type: 'flower_vase', x: 3, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'stonehollow', tx: 45, ty: 37, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[4, 5], [10, 5]],
    desk: [2, 6]
  }
};
