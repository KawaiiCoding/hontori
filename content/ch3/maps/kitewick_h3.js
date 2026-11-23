/*
 * ch3/maps/kitewick_h3.js
 * Job: house 3 of Kitewick: a quiet house with a fireplace, a piano and a telescope.
 */

export default {
  id: 'kitewick_h3',
  name: 'ch3.map.kitewick_h3',
  tileset: 'indoor',
  legend: { F: 'floor_wood', R: 'rug', W: 'wall', V: 'void' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VFFFFFFFFFFFFV',
    'VFFFFFFFFFFFFV',
    'VFRRRRRFFFFFFV',
    'VFRRRRRFFFFFFV',
    'VFRRRRRFFFFFFV',
    'VFFFFFFFFFFFFV',
    'VFFFFFFFFFFFFV',
    'VVVVVVVFVVVVVV'
  ],
  props: [
    { type: 'window', x: 1, y: 1 }, { type: 'picture', x: 5, y: 1 }, { type: 'wall_shelf', x: 7, y: 1 }, { type: 'window', x: 10, y: 1 },
    { type: 'fireplace', x: 3, y: 2 }, { type: 'firewood', x: 5, y: 2 }, { type: 'clock', x: 6, y: 2 }, { type: 'bookshelf', x: 8, y: 2 },
    { type: 'bed', x: 11, y: 2 }, { type: 'telescope', x: 12, y: 2 }, { type: 'armchair', x: 2, y: 4 }, { type: 'sofa', x: 4, y: 6 },
    { type: 'piano', x: 9, y: 6 }, { type: 'stool', x: 10, y: 7 }, { type: 'cat_bed', x: 12, y: 8 }, { type: 'candles', x: 1, y: 8 },
    { type: 'plant', x: 12, y: 5 }
  ],
  doors: [
    { x: 7, y: 9, to: 'kitewick', tx: 39, ty: 33, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[3, 5], [8, 4]]
  }
};
