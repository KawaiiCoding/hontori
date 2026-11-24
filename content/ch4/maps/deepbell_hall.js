/*
 * ch4/maps/deepbell_hall.js
 * Job: the great school of water: the hall with the Warden's ring on its sea-blue floor, the bell's place under the far wall, a guest nook with a bed.
 */

export default {
  id: 'deepbell_hall',
  name: 'ch4.map.deepbell_hall',
  tileset: 'indoor',
  rest: false,
  legend: { K: 'floor_tile', W: 'wall', V: 'void', H: 'floor_herring', S: 'floor_stone', B: 'carpet_blue' },
  rows: [
    'VWWWWWWWWWWWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWWWWWWWWWWWV',
    'VSSSSSSSSSSSSSSSSSSSSSSSSSSSSSV',
    'VSSSSSSSSSSSSSSSSSSSSSSSSSSSSSV',
    'VSSSSSSSSBBBBBBBBBBBBBSSSSSSSSV',
    'VSSSSSSSSBKKKKKKKKKKKBSSSSSSSSV',
    'VSSSSSSSSBKKKKKKKKKKKBSSSSSSSSV',
    'VSSSSSSSSBKKKKKKKKKKKBSSSSSSSSV',
    'VSSSSSSSSBKKKKKKKKKKKBSSSSSSSSV',
    'VSSSSSSSSBBBBBBBBBBBBBSSSSSSSSV',
    'VSSSSSSSSSSSSSBBBSSSSSSSSSSSSSV',
    'VSSSSSSSSSSSSSBBBSSSSSSSSSSSSSV',
    'VHHHHHHSSSSSSSBBBSSSSSSSHHHHHHV',
    'VHHHHHHSSSSSSSBBBSSSSSSSHHHHHHV',
    'VHHHHHHSSSSSSSBBBSSSSSSSHHHHHHV',
    'VHHHHHHSSSSSSSBBBSSSSSSSHHHHHHV',
    'VHHHHHHSSSSSSSBBBSSSSSSSHHHHHHV',
    'VVVVVVVVVVVVVVSSSVVVVVVVVVVVVVV'
  ],
  props: [
    { type: 'hall_wall', x: 1, y: 0 }, { type: 'hall_wall', x: 1, y: 2 }, { type: 'hall_wall', x: 1, y: 4 }, { type: 'hall_wall', x: 2, y: 0 },
    { type: 'hall_wall', x: 2, y: 2 }, { type: 'hall_wall', x: 2, y: 4 }, { type: 'hall_wall', x: 3, y: 0 }, { type: 'hall_wall', x: 3, y: 2 },
    { type: 'hall_wall', x: 3, y: 4 }, { type: 'hall_wall', x: 4, y: 0 }, { type: 'hall_wall', x: 4, y: 2 }, { type: 'hall_wall', x: 4, y: 4 },
    { type: 'hall_wall', x: 5, y: 0 }, { type: 'hall_wall', x: 5, y: 2 }, { type: 'hall_wall', x: 5, y: 4 }, { type: 'hall_wall', x: 6, y: 0 },
    { type: 'hall_wall', x: 6, y: 2 }, { type: 'hall_wall', x: 6, y: 4 }, { type: 'hall_wall', x: 7, y: 0 }, { type: 'hall_wall', x: 7, y: 2 },
    { type: 'hall_wall', x: 7, y: 4 }, { type: 'hall_wall', x: 8, y: 0 }, { type: 'hall_wall', x: 8, y: 2 }, { type: 'hall_wall', x: 8, y: 4 },
    { type: 'hall_wall', x: 9, y: 0 }, { type: 'hall_wall', x: 9, y: 2 }, { type: 'hall_wall', x: 9, y: 4 }, { type: 'hall_wall', x: 10, y: 0 },
    { type: 'hall_wall', x: 10, y: 2 }, { type: 'hall_wall', x: 10, y: 4 }, { type: 'hall_wall', x: 11, y: 0 }, { type: 'hall_wall', x: 11, y: 2 },
    { type: 'hall_wall', x: 11, y: 4 }, { type: 'hall_wall', x: 12, y: 0 }, { type: 'hall_wall', x: 12, y: 2 }, { type: 'hall_wall', x: 12, y: 4 },
    { type: 'hall_wall', x: 13, y: 0 }, { type: 'hall_wall', x: 13, y: 2 }, { type: 'hall_wall', x: 13, y: 4 }, { type: 'hall_wall', x: 14, y: 0 },
    { type: 'hall_wall', x: 14, y: 2 }, { type: 'hall_wall', x: 14, y: 4 }, { type: 'hall_wall', x: 15, y: 0 }, { type: 'hall_wall', x: 15, y: 2 },
    { type: 'hall_wall', x: 15, y: 4 }, { type: 'hall_wall', x: 16, y: 0 }, { type: 'hall_wall', x: 16, y: 2 }, { type: 'hall_wall', x: 16, y: 4 },
    { type: 'hall_wall', x: 17, y: 0 }, { type: 'hall_wall', x: 17, y: 2 }, { type: 'hall_wall', x: 17, y: 4 }, { type: 'hall_wall', x: 18, y: 0 },
    { type: 'hall_wall', x: 18, y: 2 }, { type: 'hall_wall', x: 18, y: 4 }, { type: 'hall_wall', x: 19, y: 0 }, { type: 'hall_wall', x: 19, y: 2 },
    { type: 'hall_wall', x: 19, y: 4 }, { type: 'hall_wall', x: 20, y: 0 }, { type: 'hall_wall', x: 20, y: 2 }, { type: 'hall_wall', x: 20, y: 4 },
    { type: 'hall_wall', x: 21, y: 0 }, { type: 'hall_wall', x: 21, y: 2 }, { type: 'hall_wall', x: 21, y: 4 }, { type: 'hall_wall', x: 22, y: 0 },
    { type: 'hall_wall', x: 22, y: 2 }, { type: 'hall_wall', x: 22, y: 4 }, { type: 'hall_wall', x: 23, y: 0 }, { type: 'hall_wall', x: 23, y: 2 },
    { type: 'hall_wall', x: 23, y: 4 }, { type: 'hall_wall', x: 24, y: 0 }, { type: 'hall_wall', x: 24, y: 2 }, { type: 'hall_wall', x: 24, y: 4 },
    { type: 'hall_wall', x: 25, y: 0 }, { type: 'hall_wall', x: 25, y: 2 }, { type: 'hall_wall', x: 25, y: 4 }, { type: 'hall_wall', x: 26, y: 0 },
    { type: 'hall_wall', x: 26, y: 2 }, { type: 'hall_wall', x: 26, y: 4 }, { type: 'hall_wall', x: 27, y: 0 }, { type: 'hall_wall', x: 27, y: 2 },
    { type: 'hall_wall', x: 27, y: 4 }, { type: 'hall_wall', x: 28, y: 0 }, { type: 'hall_wall', x: 28, y: 2 }, { type: 'hall_wall', x: 28, y: 4 },
    { type: 'hall_wall', x: 29, y: 0 }, { type: 'hall_wall', x: 29, y: 2 }, { type: 'hall_wall', x: 29, y: 4 }, { type: 'window', x: 4, y: 3 },
    { type: 'window', x: 10, y: 3 }, { type: 'window', x: 13, y: 3 }, { type: 'window', x: 17, y: 3 }, { type: 'window', x: 20, y: 3 },
    { type: 'window', x: 26, y: 3 }, { type: 'element_banner', x: 7, y: 3 }, { type: 'element_banner', x: 23, y: 3 }, { type: 'stone_pillar', x: 7, y: 8 },
    { type: 'stone_pillar', x: 23, y: 8 }, { type: 'stone_pillar', x: 7, y: 13 }, { type: 'stone_pillar', x: 23, y: 13 }, { type: 'stone_pillar', x: 12, y: 16 },
    { type: 'stone_pillar', x: 18, y: 16 }, { type: 'candles', x: 13, y: 6 }, { type: 'candles', x: 17, y: 6 }, { type: 'potted_tree', x: 9, y: 6 },
    { type: 'potted_tree', x: 21, y: 6 }, { type: 'bookshelf', x: 1, y: 6 }, { type: 'bookshelf', x: 3, y: 6 }, { type: 'globe', x: 29, y: 6 },
    { type: 'bookshelf', x: 26, y: 6 }, { type: 'crystal_orb', x: 5, y: 6 }, { type: 'crystal_orb', x: 25, y: 6 }, { type: 'bench', x: 4, y: 10 },
    { type: 'bench', x: 25, y: 10 }, { type: 'school_desk', x: 2, y: 17 }, { type: 'school_desk', x: 4, y: 17 }, { type: 'bookstack', x: 1, y: 20 },
    { type: 'candles', x: 6, y: 20 }, { type: 'potted_tree', x: 1, y: 13 }, { type: 'bed', x: 28, y: 16 }, { type: 'chest', x: 26, y: 16 },
    { type: 'candles', x: 29, y: 20 }, { type: 'flower_vase', x: 24, y: 20 }, { type: 'potted_tree', x: 29, y: 13 }
  ],
  doors: [
    { x: 15, y: 21, to: 'tidewell', tx: 61, ty: 22, dir: 0 }, { x: 14, y: 21, to: 'tidewell', tx: 61, ty: 22, dir: 0 },
    { x: 16, y: 21, to: 'tidewell', tx: 61, ty: 22, dir: 0 }
  ],
  spawn: { x: 15, y: 20, dir: 1 },
  spots: {
    warden: [15, 7],
    bell: [15, 6],
    apprentice: [15, 16],
    ring: [10, 9, 20, 12],
    bedside: [27, 17],
    pupils: [[3, 18], [5, 18]],
    benches: [[4, 11], [25, 11]]
  }
};
