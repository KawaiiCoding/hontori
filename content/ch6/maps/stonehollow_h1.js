/*
 * ch6/maps/stonehollow_h1.js
 * Job: house 1 of Stonehollow: a stonecutter's home on the lower terrace, a long table by the fire.
 */

export default {
  id: 'stonehollow_h1',
  name: 'ch6.map.stonehollow_h1',
  tileset: 'indoor',
  legend: { K: 'floor_tile', R: 'rug', W: 'wall', V: 'void', S: 'floor_stone' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VSSSSSSSKKKKKV',
    'VSSSSSSSKKKKKV',
    'VSSSSSSSSSSSSV',
    'VSSRRRRRRSSSSV',
    'VSSRRRRRRSSSSV',
    'VSSRRRRRRSSSSV',
    'VSSSSSSSSSSSSV',
    'VVVVVVVSVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'picture', x: 4, y: 1 }, { type: 'wall_shelf', x: 6, y: 1 }, { type: 'hanging_pots', x: 9, y: 1 },
    { type: 'window', x: 12, y: 1 }, { type: 'bed', x: 1, y: 2 }, { type: 'dresser', x: 2, y: 2 }, { type: 'fireplace', x: 4, y: 2 },
    { type: 'sink', x: 8, y: 2 }, { type: 'stove', x: 9, y: 2 }, { type: 'cupboard', x: 11, y: 2 }, { type: 'dining_table', x: 4, y: 5 },
    { type: 'chair', x: 3, y: 6 }, { type: 'chair', x: 7, y: 5 }, { type: 'armchair', x: 11, y: 6 }, { type: 'barrel_in', x: 1, y: 6 },
    { type: 'plant', x: 12, y: 8 }, { type: 'coat_rack', x: 9, y: 8 }, { type: 'firewood', x: 1, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'stonehollow', tx: 14, ty: 37, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[10, 5], [5, 4], [3, 8]]
  }
};
