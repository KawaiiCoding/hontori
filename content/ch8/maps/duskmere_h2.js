/*
 * ch8/maps/duskmere_h2.js
 * Job: house 2 of Duskmere: a watcher of the evening sky, a telescope at the window.
 */

export default {
  id: 'duskmere_h2',
  name: 'ch8.map.duskmere_h2',
  tileset: 'indoor',
  always: { time: 19.4, weather: 'clear' },
  legend: { K: 'floor_tile', W: 'wall', V: 'void', H: 'floor_herring', B: 'carpet_blue' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VKKKKHHHHHHHHV',
    'VKKKKHHHHHHHHV',
    'VHHHHHHHHHHHHV',
    'VHHHHBBBBBHHHV',
    'VHHHHBBBBBHHHV',
    'VHHHHBBBBBHHHV',
    'VHHHHHHHHHHHHV',
    'VVVVVVVHVVVVVV'
  ],
  props: [
    { type: 'window', x: 3, y: 1 }, { type: 'herb_rack', x: 5, y: 1 }, { type: 'wall_shelf', x: 7, y: 1 }, { type: 'picture', x: 10, y: 1 },
    { type: 'window', x: 12, y: 1 }, { type: 'stove', x: 1, y: 2 }, { type: 'sink', x: 2, y: 2 }, { type: 'cupboard', x: 3, y: 2 },
    { type: 'bookshelf', x: 6, y: 2 }, { type: 'clock', x: 8, y: 2 }, { type: 'bed', x: 12, y: 2 }, { type: 'chest', x: 11, y: 2 },
    { type: 'table', x: 6, y: 5 }, { type: 'chair', x: 5, y: 5 }, { type: 'chair', x: 8, y: 6 }, { type: 'telescope', x: 1, y: 6 },
    { type: 'bookstack', x: 1, y: 8 }, { type: 'candles', x: 12, y: 8 }, { type: 'armchair', x: 10, y: 8 }, { type: 'flower_vase', x: 3, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'duskmere', tx: 44, ty: 16, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[4, 5], [10, 5]]
  }
};
