/*
 * ch4/maps/tidewell_h3.js
 * Job: house 3 of Tidewell: the old bell ringer's house, sea charts on the wall and a telescope at the window.
 */

export default {
  id: 'tidewell_h3',
  name: 'ch4.map.tidewell_h3',
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
    'VFRRRRRFFFFFFV',
    'VFFFFFFFFFFFFV',
    'VVVVVVVFVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'wall_map', x: 4, y: 1 }, { type: 'picture', x: 7, y: 1 }, { type: 'window', x: 9, y: 1 },
    { type: 'wall_shelf', x: 11, y: 1 }, { type: 'fireplace', x: 2, y: 2 }, { type: 'firewood', x: 4, y: 2 }, { type: 'bookshelf', x: 6, y: 2 },
    { type: 'desk', x: 9, y: 2 }, { type: 'bed', x: 12, y: 2 }, { type: 'telescope', x: 11, y: 2 }, { type: 'armchair', x: 2, y: 5 },
    { type: 'sofa', x: 4, y: 6 }, { type: 'globe', x: 1, y: 8 }, { type: 'table', x: 9, y: 5 }, { type: 'chair', x: 11, y: 5 },
    { type: 'candles', x: 12, y: 8 }, { type: 'plant', x: 1, y: 4 }, { type: 'bookstack', x: 8, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'tidewell', tx: 11, ty: 27, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[3, 4], [10, 7]]
  }
};
