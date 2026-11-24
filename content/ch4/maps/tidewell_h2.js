/*
 * ch4/maps/tidewell_h2.js
 * Job: house 2 of Tidewell: a fisher's home, barrels by the wall and a cat by the lamp.
 */

export default {
  id: 'tidewell_h2',
  name: 'ch4.map.tidewell_h2',
  tileset: 'indoor',
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
    { type: 'table', x: 6, y: 5 }, { type: 'chair', x: 5, y: 5 }, { type: 'chair', x: 8, y: 6 }, { type: 'barrel_in', x: 1, y: 6 },
    { type: 'barrel_in', x: 1, y: 7 }, { type: 'cat_bed', x: 12, y: 8 }, { type: 'floor_lamp', x: 10, y: 8 }, { type: 'laundry_basket', x: 2, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'tidewell', tx: 41, ty: 17, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[4, 5], [10, 5]]
  }
};
