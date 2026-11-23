/*
 * ch3/maps/kite_house.js
 * Job: the small school of Windrest, where the Ward Sigil is taught: a classroom among kite frames.
 */

export default {
  id: 'kite_house',
  name: 'ch3.map.kite_house',
  tileset: 'indoor',
  rest: false,
  legend: { F: 'floor_wood', W: 'wall', V: 'void', B: 'carpet_blue' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VFFFFFFFFFFFFV',
    'VFFFFFFFFFFFFV',
    'VFFFFBBBBFFFFV',
    'VFFFFBBBBFFFFV',
    'VFFFFBBBBFFFFV',
    'VFFFFBBBBFFFFV',
    'VFFFFFFFFFFFFV',
    'VVVVVVVFVVVVVV'
  ],
  props: [
    { type: 'window', x: 3, y: 1 }, { type: 'lantern_hang', x: 4, y: 1 }, { type: 'blackboard', x: 5, y: 1 }, { type: 'element_banner', x: 7, y: 1 },
    { type: 'wall_map', x: 9, y: 1 }, { type: 'bookshelf', x: 1, y: 2 }, { type: 'loom', x: 12, y: 2 }, { type: 'bookstack', x: 11, y: 2 },
    { type: 'globe', x: 1, y: 5 }, { type: 'school_desk', x: 3, y: 5 }, { type: 'school_desk', x: 10, y: 5 }, { type: 'school_desk', x: 3, y: 7 },
    { type: 'school_desk', x: 10, y: 7 }, { type: 'chest', x: 1, y: 8 }, { type: 'plant', x: 12, y: 8 }, { type: 'flower_vase', x: 12, y: 5 }
  ],
  doors: [
    { x: 7, y: 9, to: 'windrest', tx: 16, ty: 8, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    teacher: [7, 3],
    pupil: [5, 6]
  }
};
