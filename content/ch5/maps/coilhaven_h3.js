/*
 * ch5/maps/coilhaven_h3.js
 * Job: house 3 of Coilhaven: two workers of the Storm Works share it; plain beds, a good table.
 */

export default {
  id: 'coilhaven_h3',
  name: 'ch5.map.coilhaven_h3',
  tileset: 'indoor',
  legend: { W: 'wall', V: 'void', H: 'floor_herring', B: 'carpet_blue' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VHHHHHHHHHHHHV',
    'VHHHHHHHHHHHHV',
    'VHHHHHHHHHHHHV',
    'VHHHHBBBBBHHHV',
    'VHHHHBBBBBHHHV',
    'VHHHHBBBBBHHHV',
    'VHHHHHHHHHHHHV',
    'VVVVVVVHVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'wall_map', x: 4, y: 1 }, { type: 'wall_shelf', x: 7, y: 1 }, { type: 'window', x: 10, y: 1 },
    { type: 'picture', x: 12, y: 1 }, { type: 'bed', x: 1, y: 2 }, { type: 'bed', x: 3, y: 2 }, { type: 'wardrobe', x: 5, y: 2 },
    { type: 'stove', x: 8, y: 2 }, { type: 'cupboard', x: 9, y: 2 }, { type: 'sink', x: 11, y: 2 }, { type: 'table', x: 6, y: 5 },
    { type: 'chair', x: 5, y: 6 }, { type: 'chair', x: 8, y: 5 }, { type: 'sofa', x: 11, y: 6 }, { type: 'firewood', x: 12, y: 2 },
    { type: 'floor_lamp', x: 1, y: 8 }, { type: 'plant', x: 12, y: 8 }, { type: 'cat_bed', x: 3, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'coilhaven', tx: 41, ty: 9, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[4, 5], [10, 5]]
  }
};
