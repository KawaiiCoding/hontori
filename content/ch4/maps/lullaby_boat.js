/*
 * ch4/maps/lullaby_boat.js
 * Job: the small school of Tidewell, a moored boat where the Sleep Sigil is taught: a cabin classroom with a piano and two small bunks.
 */

export default {
  id: 'lullaby_boat',
  name: 'ch4.map.lullaby_boat',
  tileset: 'indoor',
  rest: false,
  legend: { F: 'floor_wood', W: 'wall', V: 'void', B: 'carpet_blue' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VFFFFFFFFFFFFV',
    'VFFFFFFFFFFFFV',
    'VFFFBBBBBBFFFV',
    'VFFFBBBBBBFFFV',
    'VFFFBBBBBBFFFV',
    'VFFFBBBBBBFFFV',
    'VFFFFFFFFFFFFV',
    'VVVVVVVFVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'blackboard', x: 3, y: 1 }, { type: 'element_banner', x: 5, y: 1 }, { type: 'lantern_hang', x: 7, y: 1 },
    { type: 'garland', x: 8, y: 1 }, { type: 'bookshelf', x: 1, y: 2 }, { type: 'piano', x: 10, y: 2 }, { type: 'stool', x: 10, y: 3 },
    { type: 'kid_bed', x: 12, y: 2 }, { type: 'kid_bed', x: 12, y: 5 }, { type: 'school_desk', x: 3, y: 5 }, { type: 'school_desk', x: 3, y: 7 },
    { type: 'school_desk', x: 10, y: 6 }, { type: 'candles', x: 1, y: 5 }, { type: 'cat_bed', x: 1, y: 8 }, { type: 'chest', x: 12, y: 8 },
    { type: 'flower_vase', x: 9, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'tidewell', tx: 16, ty: 34, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    teacher: [7, 3],
    pupil: [5, 6],
    piano: [11, 4]
  }
};
