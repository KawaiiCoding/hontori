/*
 * ch3/maps/kitewick_h2.js
 * Job: house 2 of Kitewick: the kite maker's home, with a loom and a drawing desk.
 */

export default {
  id: 'kitewick_h2',
  name: 'ch3.map.kitewick_h2',
  tileset: 'indoor',
  legend: { W: 'wall', V: 'void', H: 'floor_herring', B: 'carpet_blue' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VHHHHHHHHHHHHV',
    'VHHHHHHHHHHHHV',
    'VHHHHHHHHHHHHV',
    'VHHHBBBBBBHHHV',
    'VHHHBBBBBBHHHV',
    'VHHHBBBBBBHHHV',
    'VHHHHHHHHHHHHV',
    'VVVVVVVHVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'wall_map', x: 4, y: 1 }, { type: 'hanging_pots', x: 7, y: 1 }, { type: 'window', x: 10, y: 1 },
    { type: 'loom', x: 1, y: 2 }, { type: 'desk', x: 3, y: 2 }, { type: 'bookshelf', x: 6, y: 2 }, { type: 'chest', x: 9, y: 2 },
    { type: 'bed', x: 11, y: 2 }, { type: 'wardrobe', x: 1, y: 5 }, { type: 'table', x: 6, y: 5 }, { type: 'chair', x: 5, y: 5 },
    { type: 'chair', x: 8, y: 6 }, { type: 'globe', x: 12, y: 6 }, { type: 'laundry_basket', x: 12, y: 8 }, { type: 'plant', x: 1, y: 8 },
    { type: 'floor_lamp', x: 10, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'kitewick', tx: 44, ty: 20, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[3, 3], [9, 5]]
  }
};
