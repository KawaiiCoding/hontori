/*
 * ch6/maps/stonehollow_h3.js
 * Job: house 3 of Stonehollow: an old miner's house on the upper terrace, a map of the tunnels on the wall.
 */

export default {
  id: 'stonehollow_h3',
  name: 'ch6.map.stonehollow_h3',
  tileset: 'indoor',
  legend: { R: 'rug', W: 'wall', V: 'void', S: 'floor_stone' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VSSSSSSSSSSSSV',
    'VSSSSSSSSSSSSV',
    'VSRRRRRSSSSSSV',
    'VSRRRRRSSSSSSV',
    'VSRRRRRSSSSSSV',
    'VSRRRRRSSSSSSV',
    'VSSSSSSSSSSSSV',
    'VVVVVVVSVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'wall_map', x: 4, y: 1 }, { type: 'picture', x: 7, y: 1 }, { type: 'window', x: 9, y: 1 },
    { type: 'wall_shelf', x: 11, y: 1 }, { type: 'fireplace', x: 2, y: 2 }, { type: 'firewood', x: 4, y: 2 }, { type: 'wardrobe', x: 6, y: 2 },
    { type: 'desk', x: 9, y: 2 }, { type: 'bed', x: 12, y: 2 }, { type: 'chest', x: 11, y: 2 }, { type: 'armchair', x: 2, y: 5 },
    { type: 'sofa', x: 4, y: 6 }, { type: 'barrel_in', x: 1, y: 8 }, { type: 'table', x: 9, y: 5 }, { type: 'chair', x: 11, y: 5 },
    { type: 'candles', x: 12, y: 8 }, { type: 'plant', x: 1, y: 4 }, { type: 'laundry_basket', x: 8, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'stonehollow', tx: 11, ty: 13, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[3, 4], [10, 7]],
    map: [5, 2]
  }
};
