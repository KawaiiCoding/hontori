/*
 * ch9/maps/goldmere_h3.js
 * Job: house 3 of Goldmere: a singer of the city choir, a piano by the door.
 */

export default {
  id: 'goldmere_h3',
  name: 'ch9.map.goldmere_h3',
  tileset: 'indoor',
  legend: { R: 'rug', W: 'wall', V: 'void', H: 'floor_herring' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VHHHHHHHHHHHHV',
    'VHHHHHHHHHHHHV',
    'VHRRRRRHHHHHHV',
    'VHRRRRRHHHHHHV',
    'VHRRRRRHHHHHHV',
    'VHRRRRRHHHHHHV',
    'VHHHHHHHHHHHHV',
    'VVVVVVVHVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'picture', x: 4, y: 1 }, { type: 'garland', x: 7, y: 1 }, { type: 'window', x: 9, y: 1 },
    { type: 'wall_shelf', x: 11, y: 1 }, { type: 'fireplace', x: 2, y: 2 }, { type: 'bookshelf', x: 4, y: 2 }, { type: 'wardrobe', x: 6, y: 2 },
    { type: 'desk', x: 9, y: 2 }, { type: 'bed', x: 12, y: 2 }, { type: 'chest', x: 11, y: 2 }, { type: 'armchair', x: 2, y: 5 },
    { type: 'sofa', x: 4, y: 6 }, { type: 'potted_tree', x: 1, y: 8 }, { type: 'table', x: 9, y: 5 }, { type: 'chair', x: 11, y: 5 },
    { type: 'candles', x: 12, y: 8 }, { type: 'plant', x: 1, y: 4 }, { type: 'piano', x: 9, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'goldmere', tx: 46, ty: 37, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[3, 4], [10, 7]]
  }
};
