/*
 * ch3/maps/windrest.js
 * Job: the hamlet after the pass: the Kite House with its yard, a garden, a well, a pond.
 */

export default {
  id: 'windrest',
  name: 'ch3.map.windrest',
  tileset: 'outdoor',
  legend: { g: 'grass', t: 'tallgrass', f: 'flowers', p: 'path', c: 'cobble', w: 'water', s: 'sand' },
  rows: [
    'gggggggggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggggggggg',
    'gggffffffgggggggggggggggggttttttttgg',
    'gggffffffgggggggggggggggggttttttttgg',
    'gggffffffgggggggggggggggggttttttttgg',
    'gggffffffgggggggggggggggggttttttttgg',
    'ggggggggggggggggggggggggggttttttttgg',
    'gggggggggggggccccccccggggggggggggggg',
    'gggggggggggggccccccccggggggggggggggg',
    'ggggggggggggggggppgggggggggggggggggg',
    'ggggggggggggggggppgggggggggggggggggg',
    'pppppppppppppppppppppppppppppppppppp',
    'pppppppppppppppppppppppppppppppppppp',
    'gggggggggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggssssssggggg',
    'ggggggggggggggggggggggggswwwwwwsgggg',
    'ggggggggggggggttttttgggswwwwwwwwsggg',
    'ggggggggggggggttttttgggswwwwwwwwsggg',
    'ggggggggggggggttttttgggswwwwwwwwsggg',
    'ggggggggggggggttttttggggswwwwwwsgggg',
    'gggggggggggggggggggggggggssssssggggg',
    'gggggggggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggggggggg'
  ],
  things: {
    legend: { T: 'tree', P: 'pine', B: 'bush', R: 'rock', L: 'lamp', S: 'sign', C: 'windchime', b: 'bench', w: 'well', F: 'fence_h', k: 'cart', c: 'crate', a: 'barrel', h: 'hay_bale', g: 'garden_bed', u: 'pumpkin', m: 'mailbox', M: 'market_stall', l: 'lantern_string', y: 'laundry_line', r: 'reeds', p: 'lilypad', t: 'fruit_tree', e: 'cherry_tree', i: 'birdbath', q: 'flower_patch', d: 'butterfly_bush', K: { building: 'house_player' } },
    rows: [
      'P.PTT.TTTTT.T..TT....PTTT.PPTT..TTTP',
      'PTTT.TPTTTPT.TTTTPP.PTTTTT.PTPTT....',
      'TP............................B...TT',
      '.T.................................T',
      'TT.......Be..K.........e..........PP',
      'TT..................y.............TT',
      'PT.................R...............T',
      '.P....d............m..............T.',
      '.Tt...T.....C........C..........B.PT',
      '.T.i................................',
      'TT...b...l........S..l...M.ca......T',
      '....L......q...................L....',
      '....................................',
      '....................................',
      '..S...........L.........L........S..',
      'TPFFFFF.FFFFF.........w.......k...TT',
      'TP........B......B..q........q......',
      'T..g..g..g..........................',
      'PTB......TB.......................P.',
      '.P.g..g..g.............r..........PT',
      'PT........................p.......PT',
      'TT.........u.t...............p..r.T.',
      'PT.hh....u...........d............TT',
      'PT.T.................T..R.r.......TT',
      'TPPT.TPTT.TT.TPPP.PTT.TTPTTPTPTTPT.T',
      'PPTT.TPTTT.TPPTPTPTTTTT.PTTTTTPT.T.P',
      'PTTP.PTPTTPTT.PTTPTPPT.TPTPTTPTTPTPT',
      'TPPTTPT.PTTPTPTT.PTTPTTPPT.TPTTPPTTP',
      'PTPTTPPTTPT.PTTPTPTTPTPTTPTPPTT.PTPT',
      'TTPPTPTTPTPPTTPTPPTTPTTPTPTTPPTTPTPP'
    ]
  },
  doors: [
    { x: 0, y: 12, to: 'whistling_pass', tx: 58, ty: 9, dir: 2 }, { x: 0, y: 13, to: 'whistling_pass', tx: 58, ty: 10, dir: 2 },
    { x: 35, y: 12, to: 'kitewick', tx: 1, ty: 19, dir: 3 }, { x: 35, y: 13, to: 'kitewick', tx: 1, ty: 20, dir: 3 },
    { x: 16, y: 7, to: 'kite_house', tx: 7, ty: 8, dir: 1 }
  ],
  spawn: { x: 1, y: 12, dir: 3 },
  labels: [
    { x: 16, y: 5, name: 'ch3.map.windrest.label.1' }, { x: 27, y: 20, name: 'ch3.map.windrest.label.2' },
    { x: 34, y: 11, name: 'ch3.map.windrest.label.3' }
  ],
  start: { time: 10, weather: 'wind' },
  school: { door: [16, 7], element: 'wind', name: 'ch3.map.kite_house', touch: 'kites', touchAt: [[13, 8], [19, 8], [20, 6]] },
  spots: {
    yard: [16, 9],
    mail: [19, 8],
    stall: [26, 11],
    garden: [7, 18],
    meadows: [[29, 5], [16, 20]]
  }
};
