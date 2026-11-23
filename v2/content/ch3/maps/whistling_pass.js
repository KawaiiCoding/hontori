/*
 * ch3/maps/whistling_pass.js
 * Job: the cliff road east of Mossgrove: three levels joined by climbs, a mountain stream, the windy ledge on top.
 */

export default {
  id: 'whistling_pass',
  name: 'ch3.map.whistling_pass',
  tileset: 'outdoor',
  legend: { g: 'grass', t: 'tallgrass', f: 'flowers', p: 'path', c: 'cobble', w: 'water', s: 'sand', b: 'bridge' },
  rows: [
    'ggggggggggggggggggggggggggswwwsggggggggggggggggggggggggggggg',
    'ggggggggggggggggggggggggggswwwsggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggswwwsgggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggswwwsgggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggswwwsgggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggswwwsgggggggggggggggggggggggggggg',
    'gggggggggccccccccccccccccccswwwscccccccccccccccccccccccccccg',
    'gggggggggggggggggggggggggggswwwsgggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggswwwsgggggggggggggggggggggggggggg',
    'ggggggggggggppppppppppppppppbbbppppppppppppppppppppppppppppp',
    'ggggggggggggppppppppppppppppbbbppppppppppppppppppppppppppppp',
    'ggggggggggggppgggggggggggggswwwsgggggggggggggggggggggggggggg',
    'ggggggggggggppggggggggggggswwwsggggggggggggggggggggggggggggg',
    'ggggggggggggppggcccccccccswwwsccccccccccccccccccccccccccccgg',
    'ggtttttttgggppggttttttttgswwwsgtttttttttttgggggggggggggggggg',
    'ggtttttttgggppggttttttttgswwwsgtttttttttttgggggggggggggggggg',
    'ggtttttttgggppggttttttttgswwwsgtttttttttttgggggggggggggggggg',
    'ggggggggggggppgggggggggggswwwsgggggggggggggggggggggggggggggg',
    'ggggggggggggppppppppppppppbbbpppppppppppppppppgggggggggggggg',
    'ggggggggggggppppppppppppppbbbpppppppppppppppppgggggggggggggg',
    'gggggggggggggggggggggggggswwwsggggggggggggggppgggggggggggggg',
    'gggggggggggggggffffffffgggswwwsgggggggggggggppggtttttttttggg',
    'gggggggggggggggffffffffgggswwwsgggggggggggggppggtttttttttggg',
    'ggggggggggggggggggggggggggswwwsgggggggggggggppggtttttttttggg',
    'gggccccccccccccccccccccccccswwwsccccccccccggppggtttttttttggg',
    'gggggggggggggggggggggggggggswwwsggggggggggggppggtttttttttggg',
    'gggggggggggggggggggggggggggswwwsggggggggggggppgggggggggggggg',
    'ppppppppppppppppppppppppppppbbbpppppppppppppppgffffffffggggg',
    'ppppppppppppppppppppppppppppbbbpppppppppppppppgffffffffggggg',
    'gggggggggggggggggggggggggssswwwssggggggggggggggffffffffggggg',
    'gggggtttttttttttttttttggswwwwwwwwsgggggggggggggggggggggggggg',
    'gggggtttttttttttttttttgswwwwwwwwwwsggggggggggggggggggggggggg',
    'gggggggggggggggggggggggswwwwwwwwwwsggggggggggggggggggggggggg',
    'ggggggggggggggggggggggggswwwwwwwwsgggggggggggggggggggggggggg'
  ],
  things: {
    legend: { P: 'pine', B: 'bush', R: 'rock', W: 'stone_wall_h', L: 'lamp', S: 'sign', C: 'windchime', b: 'bench', k: 'cart', c: 'crate', a: 'barrel', o: 'log_pile', s: 'statue', r: 'reeds', n: 'mushroom_ring', d: 'butterfly_bush' },
    rows: [
      'R.PRP.PPP.PPPPPRPPP.PR.RPR.....PPRRPRPPRPRPPRP.PPR.RPP.PR.PP',
      '.PRRPPRPPP..RPPP.PPPPRP.PP.....PRPP.PPRP.RR.PPPPPPR.R.RP.R.P',
      'RR......R........................R....B.....B.....R.......PP',
      'PP.........P.............R................................PP',
      '.P.......R.......R.......R.......R.............R..R........P',
      'R..R.R...WWWWWWWWRWRWRWWWWWW...WWRWWWRWWWWWWWWWRRWWWWWWWWRWR',
      'PP..........................................................',
      '...B.R....R.........B.....R....R...........B...............P',
      'RWWWWWWWWWW......................C.....C.....C.....C.....S..',
      '.R..........................................................',
      'RR..........................................................',
      'P.....................L.................................L...',
      'R....R.........WWWWWWWWRWWW...WWWWWRRWWWWWWWWWWWRRWWWWWRWWWW',
      'RR.......BP................................................P',
      '.P.......PR...L...........................................P.',
      'PR........R...........................B...................PR',
      'P.........P....b...........................P...P....B....RPP',
      'RP.B.....BR...................................S........B..PP',
      'RP........P...............................................RR',
      'PR..n.R...P.......................................b....s..PP',
      'RP.R.....BP.......L......R........L............n..........PP',
      'PRB...B...P.....................R.......R.................RP',
      'RP........R...................................LR..........PR',
      'RWWRRWWWWRWWWWWWRWWWWWWWRWW...WWWWWWWWWWWWR...............PR',
      'PP.........................................................R',
      'PP..k..ca.o..R.................................P..........PP',
      '..S...........R...L.................L..........d.......P..P.',
      '..........................................................P.',
      '.........................................................RRR',
      '........................R.....................R............R',
      'PP...............................R....R.B.......R....n....PP',
      'RP.....................r..........r...........P........B..PP',
      'P.RRPPPR.PPRR.PPPPRRPPP............RP.P.RR.PPRRRPPPR..P..PP.',
      'RPPPP.RRPPRPRPPPRRPPPRPR..........PR.RP.P.RPP..RPR.R.PPP.PRP'
    ]
  },
  doors: [
    { x: 0, y: 27, to: 'mossgrove', tx: 38, ty: 15, dir: 2 }, { x: 0, y: 28, to: 'mossgrove', tx: 38, ty: 16, dir: 2 },
    { x: 59, y: 9, to: 'windrest', tx: 1, ty: 12, dir: 3 }, { x: 59, y: 10, to: 'windrest', tx: 1, ty: 13, dir: 3 }
  ],
  spawn: { x: 1, y: 27, dir: 3 },
  labels: [
    { x: 6, y: 25, name: 'ch3.map.whistling_pass.label.1' }, { x: 28, y: 18, name: 'ch3.map.whistling_pass.label.2' },
    { x: 42, y: 9, name: 'ch3.map.whistling_pass.label.3' }, { x: 52, y: 23, name: 'ch3.map.whistling_pass.label.4' },
    { x: 57, y: 9, name: 'ch3.map.whistling_pass.label.5' }
  ],
  start: { time: 10, weather: 'wind' },
  spots: {
    camp: [6, 26],
    ledge: [32, 9, 54, 10],
    lookout: [54, 20],
    meadows: [[36, 15], [13, 30], [52, 23], [5, 15]]
  }
};
