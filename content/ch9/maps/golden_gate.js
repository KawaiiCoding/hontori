/*
 * ch9/maps/golden_gate.js
 * Job: the road up from Duskmere to the capital: evening woods and meadows, then the great wall and the golden gate that opens to seven rings, the court of statues behind it.
 */

export default {
  id: 'golden_gate',
  name: 'ch9.map.golden_gate',
  tileset: 'outdoor',
  rest: false,
  legend: { g: 'grass', t: 'tallgrass', f: 'flowers', p: 'path', c: 'cobble', s: 'sand' },
  rows: [
    'sssssssssssssssssssppsssssssssssssssssss',
    'sssssssssssssssssssppsssssssssssssssssss',
    'sssssssssssssssssssppsssssssssssssssssss',
    'sssssssssssssccccccccccccccsssssssssssss',
    'sssssssssssssccccccccccccccsssssssssssss',
    'sssssssssssssccccccccccccccsssssssssssss',
    'sssssssssssssccccccccccccccsssssssssssss',
    'sssssssssssssccccccccccccccsssssssssssss',
    'sssssssssssssssssssccsssssssssssssssssss',
    'sssssssssssssssssssccsssssssssssssssssss',
    'gggggggggggggggggggccggggggggggggggggggg',
    'gggggggggggggggccccccccccggggggggggggggg',
    'gggfffffffffffgccccccccccgfffffffffffggg',
    'gggfffffffffffgccccccccccgfffffffffffggg',
    'gggfffffffffffgccccccccccgfffffffffffggg',
    'gggfffffffffffgggggppgggggfffffffffffggg',
    'gggfffffffffffgggggppgggggfffffffffffggg',
    'gggfffffffffffgggggppgggggfffffffffffggg',
    'gggggggggggggggggggppggggggggggggggggggg',
    'gggggggggggggggggggppggggggggggggggggggg',
    'gggggggggggggggggggppggggggggggggggggggg',
    'ggggtttttttttttggggppggggtttttttttttgggg',
    'ggggtttttttttttggggppggggtttttttttttgggg',
    'ggggtttttttttttggggppggggtttttttttttgggg',
    'ggggtttttttttttggggppggggtttttttttttgggg',
    'ggggtttttttttttggggppggggtttttttttttgggg',
    'gggggggggggggggggggppggggggggggggggggggg',
    'gggggggggggggggggggppggggggggggggggggggg',
    'gggggggggggggggggggppggggggggggggggggggg',
    'gggggggggggggggggggppggggggggggggggggggg'
  ],
  things: {
    legend: { T: 'tree', P: 'pine', W: 'stone_wall_h', L: 'lamp', S: 'sign', b: 'bench', f: 'flowerbed', s: 'statue', l: 'lantern_string', t: 'fruit_tree', e: 'cherry_tree' },
    rows: [
      '........................................',
      '........................................',
      '........................................',
      '......e.......f.........f........e......',
      '..................L..L..................',
      '...t..........L..........L..........t...',
      '..........e..................e..........',
      '.................s....s.................',
      '..............l........l................',
      'WWWWWWWWWWWWWWWWWWW..WWWWWWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWWWWWW..WWWWWWWWWWWWWWWWWWW',
      'TT...............s....s...............TT',
      '.T............f........f..............TT',
      'PT.........e......L..L......e..........T',
      'TTe............b.......b..............TP',
      'TT......e......................e.......T',
      'T.....................S...............TT',
      'TT....................................PT',
      '.T.e.....................T............TT',
      'TT.e..................................PT',
      'T.................L..L................TT',
      '......................................P.',
      'TT.....................................P',
      'PP....................................TT',
      'TT......................e..............T',
      'TP....................................T.',
      'T..........T....T.L..L................PT',
      'TT...........e........Se...............P',
      '.TTTTTP.TTT..TPPP......TTTTP.T.PP.T.TTTT',
      '.P.PP.P..PP.TTTT.......T.TTTTTPTPTT.TTTT'
    ]
  },
  doors: [
    { x: 19, y: 29, to: 'duskmere', tx: 54, ty: 20, dir: 2 }, { x: 20, y: 29, to: 'duskmere', tx: 54, ty: 21, dir: 2 },
    { x: 19, y: 0, to: 'goldmere', tx: 35, ty: 50, dir: 1 }, { x: 20, y: 0, to: 'goldmere', tx: 36, ty: 50, dir: 1 }
  ],
  spawn: { x: 19, y: 27, dir: 1 },
  labels: [
    { x: 19, y: 10, name: 'ch9.map.golden_gate.label.1' }, { x: 19, y: 28, name: 'ch9.map.golden_gate.label.2' },
    { x: 19, y: 1, name: 'ch9.map.golden_gate.label.3' }
  ],
  /* the arch of the Golden Gate with its leaves swung back; while it is shut, ./links.js stands the closed leaves here */
  props: [{ type: 'golden_gate_open', x: 19, y: 9 }],
  start: { time: 9, weather: 'clear' },
  spots: {
    gate: [[19, 9], [20, 9], [19, 10], [20, 10]],
    gateFront: [19, 12],
    guards: [[18, 11], [21, 11]],
    rings: [20, 12],
    court: [19, 6],
    road: [19, 20],
    meadow: [8, 14]
  }
};
