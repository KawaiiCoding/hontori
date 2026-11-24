/*
 * ch7/maps/cinderreach_h2.js
 * Job: house 2 of Cinderreach: a potter's home, vases drying by the wall.
 */

export default {
  id: 'cinderreach_h2',
  name: 'ch7.map.cinderreach_h2',
  tileset: 'indoor',
  legend: { K: 'floor_tile', W: 'wall', V: 'void', H: 'floor_herring', B: 'carpet_blue' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VKKKKHHHHHHHHV',
    'VKKKKHHHHHHHHV',
    'VHHHHHHHHHHHHV',
    'VHHHHBBBBBHHHV',
    'VHHHHBBBBBHHHV',
    'VHHHHBBBBBHHHV',
    'VHHHHHHHHHHHHV',
    'VVVVVVVHVVVVVV'
  ],
  props: [
    { type: 'window', x: 3, y: 1 }, { type: 'herb_rack', x: 5, y: 1 }, { type: 'wall_shelf', x: 7, y: 1 }, { type: 'picture', x: 10, y: 1 },
    { type: 'window', x: 12, y: 1 }, { type: 'stove', x: 1, y: 2 }, { type: 'sink', x: 2, y: 2 }, { type: 'cupboard', x: 3, y: 2 },
    { type: 'shop_shelf', x: 6, y: 2 }, { type: 'clock', x: 8, y: 2 }, { type: 'bed', x: 12, y: 2 }, { type: 'chest', x: 11, y: 2 },
    { type: 'table', x: 6, y: 5 }, { type: 'chair', x: 5, y: 5 }, { type: 'chair', x: 8, y: 6 }, { type: 'barrel_in', x: 1, y: 6 },
    { type: 'flower_vase', x: 1, y: 8 }, { type: 'cat_bed', x: 12, y: 8 }, { type: 'floor_lamp', x: 10, y: 8 }, { type: 'flower_vase', x: 3, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'cinderreach', tx: 36, ty: 31, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[4, 5], [10, 5]]
  }
};
