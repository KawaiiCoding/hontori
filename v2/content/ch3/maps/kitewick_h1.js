/*
 * ch3/maps/kitewick_h1.js
 * Job: house 1 of Kitewick: a family home with a big table and a child's bed.
 */

export default {
  id: 'kitewick_h1',
  name: 'ch3.map.kitewick_h1',
  tileset: 'indoor',
  legend: { F: 'floor_wood', K: 'floor_tile', R: 'rug', W: 'wall', V: 'void' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VKKKKKFFFFFFFV',
    'VKKKKKFFFFFFFV',
    'VFFFFFFFFFFFFV',
    'VFFRRRRRRFFFFV',
    'VFFRRRRRRFFFFV',
    'VFFRRRRRRFFFFV',
    'VFFFFFFFFFFFFV',
    'VVVVVVVFVVVVVV'
  ],
  props: [
    { type: 'window', x: 3, y: 1 }, { type: 'picture', x: 6, y: 1 }, { type: 'garland', x: 8, y: 1 }, { type: 'window', x: 11, y: 1 },
    { type: 'stove', x: 1, y: 2 }, { type: 'cupboard', x: 2, y: 2 }, { type: 'sink', x: 4, y: 2 }, { type: 'fireplace', x: 6, y: 2 },
    { type: 'dresser', x: 9, y: 2 }, { type: 'bed', x: 11, y: 2 }, { type: 'kid_bed', x: 12, y: 2 }, { type: 'dining_table', x: 4, y: 5 },
    { type: 'chair', x: 3, y: 5 }, { type: 'chair', x: 7, y: 6 }, { type: 'toybox', x: 12, y: 6 }, { type: 'plant', x: 1, y: 8 },
    { type: 'coat_rack', x: 10, y: 8 }, { type: 'laundry_basket', x: 12, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'kitewick', tx: 43, ty: 10, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[5, 4], [9, 6], [11, 5]]
  }
};
