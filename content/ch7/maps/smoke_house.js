/*
 * ch7/maps/smoke_house.js
 * Job: the small school of Cinderreach, where Swift Step is taught: a smoky stone room with a fire that never goes out.
 */

export default {
  id: 'smoke_house',
  name: 'ch7.map.smoke_house',
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
    { type: 'window', x: 2, y: 1 }, { type: 'blackboard', x: 3, y: 1 }, { type: 'element_banner', x: 6, y: 1 }, { type: 'lantern_hang', x: 8, y: 1 },
    { type: 'herb_rack', x: 10, y: 1 }, { type: 'window', x: 12, y: 1 }, { type: 'fireplace', x: 9, y: 2 }, { type: 'firewood', x: 11, y: 2 },
    { type: 'stove', x: 1, y: 2 }, { type: 'barrel_in', x: 12, y: 2 }, { type: 'crystal_orb', x: 5, y: 2 }, { type: 'school_desk', x: 3, y: 5 },
    { type: 'school_desk', x: 3, y: 7 }, { type: 'school_desk', x: 10, y: 5 }, { type: 'school_desk', x: 10, y: 7 }, { type: 'candles', x: 1, y: 5 },
    { type: 'firewood', x: 1, y: 8 }, { type: 'chest', x: 12, y: 8 }, { type: 'floor_lamp', x: 12, y: 5 }
  ],
  doors: [
    { x: 7, y: 9, to: 'cinderreach', tx: 16, ty: 31, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    teacher: [7, 3],
    pupil: [6, 6],
    fire: [9, 3],
    run: [[4, 8], [9, 8]]
  }
};
