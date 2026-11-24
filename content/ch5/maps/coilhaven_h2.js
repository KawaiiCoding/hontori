/*
 * ch5/maps/coilhaven_h2.js
 * Job: house 2 of Coilhaven: the lamplighter's family, a long table and a child's bed.
 */

export default {
  id: 'coilhaven_h2',
  name: 'ch5.map.coilhaven_h2',
  tileset: 'indoor',
  legend: { F: 'floor_wood', K: 'floor_tile', R: 'rug', W: 'wall', V: 'void' },
  rows: [
    'VWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWV',
    'VKKKKKFFFFFFFV',
    'VKKKKKFFFFFFFV',
    'VFFFFFFFFFFFFV',
    'VFFFRRRRRRFFFV',
    'VFFFRRRRRRFFFV',
    'VFFFRRRRRRFFFV',
    'VFFFFFFFFFFFFV',
    'VVVVVVVFVVVVVV'
  ],
  props: [
    { type: 'window', x: 2, y: 1 }, { type: 'hanging_pots', x: 4, y: 1 }, { type: 'picture', x: 7, y: 1 }, { type: 'lantern_hang', x: 9, y: 1 },
    { type: 'window', x: 11, y: 1 }, { type: 'stove', x: 1, y: 2 }, { type: 'sink', x: 2, y: 2 }, { type: 'cupboard', x: 3, y: 2 },
    { type: 'bookshelf', x: 7, y: 2 }, { type: 'bed', x: 10, y: 2 }, { type: 'kid_bed', x: 12, y: 2 }, { type: 'dining_table', x: 5, y: 5 },
    { type: 'chair', x: 4, y: 5 }, { type: 'chair', x: 8, y: 6 }, { type: 'toybox', x: 12, y: 6 }, { type: 'armchair', x: 1, y: 6 },
    { type: 'plant', x: 1, y: 8 }, { type: 'coat_rack', x: 10, y: 8 }, { type: 'laundry_basket', x: 12, y: 8 }
  ],
  doors: [
    { x: 7, y: 9, to: 'coilhaven', tx: 22, ty: 9, dir: 0 }
  ],
  spawn: { x: 7, y: 8, dir: 1 },
  spots: {
    people: [[6, 4], [10, 6], [3, 7]]
  }
};
