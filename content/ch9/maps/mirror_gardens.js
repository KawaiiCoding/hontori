/*
 * ch9/maps/mirror_gardens.js
 * Job: the formal gardens west of Goldmere, Halo Court's entrance test: flower beds between straight sand walks, the lamp of light in one corner, the gate stone in the other, mirrors where the walks cross.
 */

export default {
  id: 'mirror_gardens',
  name: 'ch9.map.mirror_gardens',
  tileset: 'outdoor',
  rest: false,
  legend: { g: 'grass', f: 'flowers', p: 'path', c: 'cobble', w: 'water', s: 'sand' },
  rows: [
    'gggggggggggggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggggggggggggg',
    'gggfsfffffffsfffffffffffsfffffsfffsffggg',
    'gggfsfffffffsfffffffffffsfffffsffcccfggg',
    'gggsssssssssssssssssssssssssssssscccsggg',
    'gggfsfffffffsfffffffffffsfffffsffcccfggg',
    'gggfsfffffffsfffsssssfffsfffffsfffsffggg',
    'gggfsfffffffsffswwwwwsffsfffffsfffsffggg',
    'gggfsfffffffsfswwwwwwwsfsfffffsfffsffggg',
    'gggfsfffffffsfswwwwwwwsfsfffffsfffsffggg',
    'gggfsfffffffsffswwwwwsffsfffffsfffsffggg',
    'gggfsfffffffsfffsssssfffsfffffsfffsffggg',
    'gggfsfffffffsfffffffffffsfffffsfffsffggg',
    'gggssssssssssssssssssssssssssssssssssggg',
    'gggfsfffffffsfffffffffffsfffffpppppppppp',
    'gggfsfffffffsfffffffffffsfffffpppppppppp',
    'gggfsfffffffsfffffffffffsfffffsfffsffggg',
    'gggfsfffffffsfffffffffffsfffffsfffsffggg',
    'gggfsfffffffsfffffffffffsfffffsfffsffggg',
    'gggssssssssssssssssssssssssssssssssssggg',
    'gggfsfffffffsffsswwwssffsfffffsfffsffggg',
    'gggfsfffffffsfswwwwwwwsfsfffffsfffsffggg',
    'gggfsfffffffsfswwwwwwwsfsfffffsfffsffggg',
    'gggfsfffffffsffsswwwssffsfffffsfffsffggg',
    'gggcccffffffsffffsssffffsfffffsfffsffggg',
    'gggcccsssssssssssssssssssssssssssssssggg',
    'gggcccffffffsfffffffffffsfffffsfffsffggg',
    'gggfsfffffffsfffffffffffsfffffsfffsffggg',
    'gggggggggggggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggggggggggggg',
    'gggggggggggggggggggggggggggggggggggggggg'
  ],
  things: {
    legend: { T: 'tree', B: 'bush', L: 'lamp', S: 'sign', b: 'bench', s: 'statue', p: 'lilypad', e: 'cherry_tree', i: 'birdbath' },
    rows: [
      'TeTeT.TT.TTe...TT.TTTTTTTTee.e.eeTTTeT.e',
      'TTe.TeTe..eTeTeTeTTTeTTeTTTTe.eT.T.eTeTe',
      'TT....................................TT',
      'TT............BBBBBBBBB.............s.TT',
      'eT....................................TT',
      'TT....................................ee',
      'TT....................................e.',
      'ee..................................S.ee',
      'TT....BBBBB................e..........TT',
      'Te...............p..............e.....TT',
      '...................p......BBB.........eT',
      'eT......e.............................eT',
      'Te....b...........i...................e.',
      'TT......................................',
      'ee..................................L...',
      'eT......................................',
      'Te......................................',
      'T.......e.....BBBBBBBBB.............L...',
      'ee.........................e............',
      '.T....................................ee',
      'ee....................................e.',
      'T.........................b...........ee',
      'eT................p...................TT',
      'Te....BBBBB...............BBB.........Te',
      'Te....S.........................e.....ee',
      'Te................i...................Te',
      'T.....................................T.',
      'T..............................b......TT',
      'TT.s..........BBBBBBBBB...............TT',
      'TT....................................TT',
      '.eeTTTTeTeT.e.TTTT.TeTe.eTTTTTT.eTeTTeTT',
      'TTe.eeeTTTTeeeTTTTTTeTTTTeTTTT.eTTTeeTTT'
    ]
  },
  doors: [
    { x: 39, y: 15, to: 'goldmere', tx: 1, ty: 25, dir: 3 }, { x: 39, y: 16, to: 'goldmere', tx: 1, ty: 26, dir: 3 }
  ],
  spawn: { x: 37, y: 15, dir: 2 },
  labels: [
    { x: 4, y: 26, name: 'ch9.map.mirror_gardens.label.1' }, { x: 34, y: 5, name: 'ch9.map.mirror_gardens.label.2' },
    { x: 18, y: 9, name: 'ch9.map.mirror_gardens.label.3' }, { x: 38, y: 14, name: 'ch9.map.mirror_gardens.label.4' }
  ],
  start: { time: 10, weather: 'clear' },
  spots: {
    source: [4, 26],
    target: [34, 5],
    mirrors: [[12, 26], [12, 14], [24, 14], [24, 5], [12, 5], [24, 26], [30, 20]],
    beam: [[4, 26], [12, 26], [12, 14], [24, 14], [24, 5], [34, 5]],
    lys: [35, 13],
    entry: [36, 15],
    pond: [18, 13],
    seat: [7, 13]
  }
};
