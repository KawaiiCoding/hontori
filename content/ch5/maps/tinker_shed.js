/*
 * ch5/maps/tinker_shed.js
 * Job: the small school of Coilhaven, where the Stun Sigil is taught: a workshop with a classroom in the middle.
 */

export default {
  id: 'tinker_shed',
  name: 'ch5.map.tinker_shed',
  tileset: 'indoor',
  rest: false,
  legend: { F: 'floor_wood', W: 'wall', V: 'void', S: 'floor_stone' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VSSSSSSSSSSSSV',
    'VSSSSSSSSSSSSV',
    'VSSSFFFFFFSSSV',
    'VSSSFFFFFFSSSV',
    'VSSSFFFFFFSSSV',
    'VSSSFFFFFFSSSV',
    'VSSSSSSSSSSSSV',
    'VVVVVVVSVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'wall_shelf', x: 4, y: 1 }, { type: 'blackboard', x: 6, y: 1 }, { type: 'element_banner', x: 9, y: 1 },
    { type: 'lantern_hang', x: 10, y: 1 }, { type: 'window', x: 12, y: 1 }, { type: 'shop_shelf', x: 1, y: 2 }, { type: 'barrel_in', x: 3, y: 2 },
    { type: 'crystal_orb', x: 5, y: 2 }, { type: 'counter', x: 10, y: 2 }, { type: 'potion_rack', x: 12, y: 2 }, { type: 'school_desk', x: 3, y: 5 },
    { type: 'school_desk', x: 3, y: 7 }, { type: 'school_desk', x: 10, y: 5 }, { type: 'school_desk', x: 10, y: 7 }, { type: 'stove', x: 1, y: 5 },
    { type: 'firewood', x: 1, y: 6 }, { type: 'chest', x: 1, y: 8 }, { type: 'floor_lamp', x: 12, y: 8 }, { type: 'clock', x: 9, y: 2 },
    { type: 'loom', x: 12, y: 5 }
  ],
  doors: [
    { x: 7, y: 9, to: 'coilhaven', tx: 21, ty: 34, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    teacher: [7, 3],
    pupil: [5, 6],
    bench: [11, 3]
  }
};
