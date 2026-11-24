/*
 * ch5/maps/coilhaven_h4.js
 * Job: house 4 of Coilhaven: the old clockmaker, clocks along the wall.
 */

export default {
  id: 'coilhaven_h4',
  name: 'ch5.map.coilhaven_h4',
  tileset: 'indoor',
  legend: { F: 'floor_wood', R: 'rug', W: 'wall', V: 'void' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VFFFFFFFFFFFFV',
    'VFFFFFFFFFFFFV',
    'VFRRRRRRFFFFFV',
    'VFRRRRRRFFFFFV',
    'VFRRRRRRFFFFFV',
    'VFRRRRRRFFFFFV',
    'VFFFFFFFFFFFFV',
    'VVVVVVVFVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'picture', x: 4, y: 1 }, { type: 'wall_shelf', x: 6, y: 1 }, { type: 'wall_shelf', x: 9, y: 1 },
    { type: 'window', x: 12, y: 1 }, { type: 'clock', x: 1, y: 2 }, { type: 'bookshelf', x: 2, y: 2 }, { type: 'clock', x: 4, y: 2 },
    { type: 'desk', x: 6, y: 2 }, { type: 'clock', x: 8, y: 2 }, { type: 'fireplace', x: 9, y: 2 }, { type: 'bed', x: 12, y: 2 },
    { type: 'armchair', x: 3, y: 5 }, { type: 'table', x: 5, y: 5 }, { type: 'chair', x: 7, y: 6 }, { type: 'globe', x: 1, y: 5 },
    { type: 'telescope', x: 12, y: 6 }, { type: 'bookstack', x: 10, y: 6 }, { type: 'candles', x: 1, y: 8 }, { type: 'plant', x: 12, y: 8 },
    { type: 'chest', x: 10, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'coilhaven', tx: 52, ty: 21, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[4, 4], [9, 6]]
  }
};
