/*
 * ch9/maps/vael_garden.js
 * Job: the Archmage's walled garden: cherry trees, a still pond, and along the two stone walks the places of his jars.
 */

export default {
  id: 'vael_garden',
  name: 'ch9.map.vael_garden',
  tileset: 'outdoor',
  rest: false,
  legend: { g: 'grass', f: 'flowers', c: 'cobble', w: 'water', s: 'sand' },
  rows: [
    'gggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggg',
    'gggffffffffffffffffffffffffggg',
    'gggffffffffffffffffffffffffggg',
    'gggfffccccccccccccccccccccfggg',
    'gggfffccccccccccccccccccccfggg',
    'gggfffccccccccccccccccccccfggg',
    'gggfffccccccccccccccccccccfggg',
    'gggfffccffffffffffffffffccfggg',
    'gggfffccfffffssssssfffffccfggg',
    'gggfffccffffswwwwwwsffffccfggg',
    'cccccccccccswwwwwwwwsfffccfggg',
    'cccccccccccswwwwwwwwsfffccfggg',
    'gggfffccffffswwwwwwsffffccfggg',
    'gggfffccfffffssssssfffffccfggg',
    'gggfffccffffffffffffffffccfggg',
    'gggfffccccccccccccccccccccfggg',
    'gggfffccccccccccccccccccccfggg',
    'gggfffccccccccccccccccccccfggg',
    'gggfffccccccccccccccccccccfggg',
    'gggffffffffffffffffffffffffggg',
    'gggffffffffffffffffffffffffggg',
    'gggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggg'
  ],
  things: {
    legend: { T: 'tree', W: 'stone_wall_h', L: 'lamp', S: 'sign', b: 'bench', f: 'flowerbed', s: 'statue', p: 'lilypad', e: 'cherry_tree', i: 'birdbath' },
    rows: [
      '.TTTTe.TTTT.eTTeTTTeeTTeTTTTTT',
      'TeTTTTT.T.TeeeTTeTTTTTeTTTTTee',
      'TTWWWWWWWWWWWWWWWWWWWWWWWWWWTT',
      'TT..........................TT',
      '.e..e.......f....f........e.eT',
      'Te..........................eT',
      'TT..........................TT',
      'TT..........................TT',
      'ee..........................TT',
      '.T..........b..........L....T.',
      'TT........e..........e.......e',
      '...S.L........................',
      '.........i....p..........s...e',
      '.................p..........Te',
      '.....L......................TT',
      'TT........e..........e......eT',
      'ee................b....L....eT',
      'ee..........................TT',
      'TT..........................TT',
      'e...........................eT',
      'Te..........................Te',
      'TT..e.......f....f........e.Te',
      'TT...........................e',
      'TTWWWWWWWWWWWWWWWWWWWWWWWWWWTT',
      'eTeT.eeT.TTTeTTTTTTTT.TTTTTTT.',
      'eTTeTTeeeeTeTTTTeeTT...TeTeTee'
    ]
  },
  doors: [
    { x: 0, y: 12, to: 'goldmere', tx: 70, ty: 10, dir: 2 }, { x: 0, y: 13, to: 'goldmere', tx: 70, ty: 11, dir: 2 }
  ],
  spawn: { x: 2, y: 12, dir: 3 },
  labels: [
    { x: 15, y: 12, name: 'ch9.map.vael_garden.label.1' }, { x: 15, y: 6, name: 'ch9.map.vael_garden.label.2' },
    { x: 1, y: 11, name: 'ch9.map.vael_garden.label.3' }
  ],
  /* the jars along the two walks, each sealed with grey wax, a hontori asleep inside */
  props: [8, 11, 14, 17, 20, 23].map((x) => ({ type: 'garden_jar', x, y: 6 })).concat([8, 11, 14, 17, 20, 23].map((x) => ({ type: 'garden_jar', x, y: 19 }))),
  start: { time: 10, weather: 'clear' },
  spots: {
    gate: [3, 12],
    vael: [22, 12],
    kid: [20, 12],
    jars: [[8, 6], [11, 6], [14, 6], [17, 6], [20, 6], [23, 6], [8, 19], [11, 19], [14, 19], [17, 19], [20, 19], [23, 19]],
    jarFront: [[8, 7], [14, 7], [20, 7], [8, 18], [14, 18], [20, 18]],
    pond: [11, 12],
    seat: [13, 10],
    statue: [24, 12]
  }
};
