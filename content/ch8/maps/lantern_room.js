/*
 * ch8/maps/lantern_room.js
 * Job: the small school of Duskmere, where the Lantern Sigil is taught: the one room in town with lit lanterns, kept behind shutters.
 */

export default {
  id: 'lantern_room',
  name: 'ch8.map.lantern_room',
  tileset: 'indoor',
  rest: false,
  always: { time: 19.4, weather: 'clear' },
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
    { type: 'window', x: 2, y: 1 }, { type: 'blackboard', x: 4, y: 1 }, { type: 'lantern_hang', x: 7, y: 1 }, { type: 'lantern_hang', x: 9, y: 1 },
    { type: 'element_banner', x: 11, y: 1 }, { type: 'window', x: 12, y: 1 }, { type: 'bookshelf', x: 1, y: 2 }, { type: 'crystal_orb', x: 4, y: 2 },
    { type: 'candles', x: 9, y: 2 }, { type: 'chest', x: 12, y: 2 }, { type: 'school_desk', x: 3, y: 5 }, { type: 'school_desk', x: 3, y: 7 },
    { type: 'school_desk', x: 10, y: 5 }, { type: 'school_desk', x: 10, y: 7 }, { type: 'candles', x: 1, y: 5 }, { type: 'candles', x: 12, y: 5 },
    { type: 'bookstack', x: 1, y: 8 }, { type: 'floor_lamp', x: 12, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'duskmere', tx: 36, ty: 28, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    teacher: [7, 3],
    pupil: [6, 6],
    lanterns: [[7, 2], [9, 3]]
  }
};
