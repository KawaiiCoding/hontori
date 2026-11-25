/*
 * ch10/maps/vael_study.js
 * Job: Orlen Vael's study: grand but warm: books to the ceiling, a fire with two armchairs, the great round window over his desk, a piano, the rug where the last duel is fought.
 */

export default {
  id: 'vael_study',
  name: 'ch10.map.vael_study',
  tileset: 'indoor',
  rest: false,
  legend: { F: 'floor_wood', W: 'wall', V: 'void', R: 'rug' },
  rows: [
    'VWWWWWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWWWWWV',
    'VFFFFFFFFFFFFFFFFFFFFFFFV',
    'VFFFFFFFFFFFFFFFFFFFFFFFV',
    'VFFFFFFFFFFFFFFFFFFFFFFFV',
    'VFFFFFRRRRRRRRRRRRRFFFFFV',
    'VFFFFFRRRRRRRRRRRRRFFFFFV',
    'VFFFFFRRRRRRRRRRRRRFFFFFV',
    'VFFFFFRRRRRRRRRRRRRFFFFFV',
    'VFFFFFRRRRRRRRRRRRRFFFFFV',
    'VFFFFFRRRRRRRRRRRRRFFFFFV',
    'VFFFFFRRRRRRRRRRRRRFFFFFV',
    'VFFFFFRRRRRRRRRRRRRFFFFFV',
    'VFFFFFFFFFFRRRFFFFFFFFFFV',
    'VFFFFFFFFFFRRRFFFFFFFFFFV',
    'VVVVVVVVVVVFFFVVVVVVVVVVV'
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
    { type: 'hall_wall', x: 23, y: 4 }, { type: 'study_window', x: 11, y: 3 }, { type: 'tall_shelf', x: 1, y: 6 }, { type: 'fireplace', x: 3, y: 6 },
    { type: 'tall_shelf', x: 5, y: 6 }, { type: 'tall_shelf', x: 7, y: 6 }, { type: 'tall_shelf', x: 16, y: 6 }, { type: 'tall_shelf', x: 18, y: 6 },
    { type: 'tall_shelf', x: 20, y: 6 }, { type: 'tall_shelf', x: 22, y: 6 }, { type: 'picture', x: 9, y: 3 }, { type: 'picture', x: 15, y: 3 },
    { type: 'study_desk', x: 11, y: 7 }, { type: 'globe', x: 9, y: 7 }, { type: 'telescope', x: 15, y: 7 }, { type: 'armchair', x: 2, y: 8 },
    { type: 'armchair', x: 5, y: 8 }, { type: 'sofa', x: 2, y: 12 }, { type: 'flower_vase', x: 1, y: 10 }, { type: 'piano', x: 20, y: 9 },
    { type: 'bookstack', x: 22, y: 12 }, { type: 'plant', x: 23, y: 14 }, { type: 'floor_lamp', x: 19, y: 12 }, { type: 'floor_lamp', x: 7, y: 17 },
    { type: 'floor_lamp', x: 17, y: 17 }, { type: 'potted_tree', x: 1, y: 17 }, { type: 'potted_tree', x: 23, y: 17 }, { type: 'candles', x: 4, y: 16 },
    { type: 'chest', x: 20, y: 16 }, { type: 'bookstack', x: 21, y: 16 }
  ],
  doors: [
    { x: 11, y: 19, to: 'council_high', tx: 12, ty: 7, dir: 0 }, { x: 12, y: 19, to: 'council_high', tx: 12, ty: 7, dir: 0 },
    { x: 13, y: 19, to: 'council_high', tx: 12, ty: 7, dir: 0 }
  ],
  spawn: { x: 12, y: 18, dir: 1 },
  start: { time: 18, weather: 'clear' },
  spots: {
    vael: [12, 9],
    desk: [12, 9],
    duelFoe: [12, 10],
    duelKid: [12, 15],
    save: [12, 17],
    exit: [12, 18],
    fire: [4, 8],
    window: [12, 9],
    mercyVael: [12, 11],
    mercyKid: [12, 13],
    seat: [3, 9],
    piano: [20, 11]
  }
};
