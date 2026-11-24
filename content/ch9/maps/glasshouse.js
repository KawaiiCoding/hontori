/*
 * ch9/maps/glasshouse.js
 * Job: the small school of Goldmere, where the Mirror Sigil is taught: a bright room of windows and plants.
 */

export default {
  id: 'glasshouse',
  name: 'ch9.map.glasshouse',
  tileset: 'indoor',
  rest: false,
  legend: { K: 'floor_tile', W: 'wall', V: 'void', H: 'floor_herring' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VKKKKKKKKKKKKV',
    'VKKKKKKKKKKKKV',
    'VKKKHHHHHHKKKV',
    'VKKKHHHHHHKKKV',
    'VKKKHHHHHHKKKV',
    'VKKKHHHHHHKKKV',
    'VKKKKKKKKKKKKV',
    'VVVVVVVKVVVVVV'
  ],
  props: [
    { type: 'bookshelf', x: 7, y: 2 },
    { type: 'window', x: 2, y: 1 }, { type: 'blackboard', x: 4, y: 1 }, { type: 'window', x: 7, y: 1 }, { type: 'window', x: 9, y: 1 },
    { type: 'element_banner', x: 12, y: 1 }, { type: 'leaf_window', x: 10, y: 1 }, { type: 'potted_tree', x: 1, y: 2 }, { type: 'crystal_orb', x: 4, y: 2 },
    { type: 'plant', x: 6, y: 2 }, { type: 'plant', x: 9, y: 2 }, { type: 'potted_tree', x: 12, y: 2 }, { type: 'school_desk', x: 3, y: 5 },
    { type: 'school_desk', x: 3, y: 7 }, { type: 'school_desk', x: 10, y: 5 }, { type: 'school_desk', x: 10, y: 7 }, { type: 'flower_vase', x: 1, y: 5 },
    { type: 'plant', x: 12, y: 5 }, { type: 'plant', x: 1, y: 8 }, { type: 'floor_lamp', x: 12, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'goldmere', tx: 60, ty: 19, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    teacher: [7, 3],
    pupil: [6, 6],
    mirror: [8, 3]
  }
};
