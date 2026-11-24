/*
 * ch6/maps/stonehollow_h4.js
 * Job: house 4 of Stonehollow: a family of weavers beside the hall, a loom by the wall.
 */

export default {
  id: 'stonehollow_h4',
  name: 'ch6.map.stonehollow_h4',
  tileset: 'indoor',
  legend: { F: 'floor_wood', K: 'floor_tile', R: 'rug', W: 'wall', V: 'void' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VKKKKKFFFFFFFV',
    'VKKKKKFFFFFFFV',
    'VFFFFFFFFFFFFV',
    'VFFFFFRRRRRFFV',
    'VFFFFFRRRRRFFV',
    'VFFFFFRRRRRFFV',
    'VFFFFFFFFFFFFV',
    'VVVVVVVFVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'hanging_pots', x: 4, y: 1 }, { type: 'picture', x: 7, y: 1 }, { type: 'garland', x: 9, y: 1 },
    { type: 'window', x: 12, y: 1 }, { type: 'stove', x: 1, y: 2 }, { type: 'cupboard', x: 2, y: 2 }, { type: 'sink', x: 4, y: 2 },
    { type: 'bookshelf', x: 7, y: 2 }, { type: 'bed', x: 10, y: 2 }, { type: 'kid_bed', x: 12, y: 2 }, { type: 'table', x: 7, y: 5 },
    { type: 'chair', x: 6, y: 6 }, { type: 'chair', x: 9, y: 5 }, { type: 'loom', x: 1, y: 6 }, { type: 'stool', x: 2, y: 7 },
    { type: 'toybox', x: 12, y: 6 }, { type: 'plant', x: 12, y: 8 }, { type: 'laundry_basket', x: 1, y: 8 }, { type: 'coat_rack', x: 4, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'stonehollow', tx: 48, ty: 13, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[5, 5], [10, 6], [3, 8]]
  }
};
