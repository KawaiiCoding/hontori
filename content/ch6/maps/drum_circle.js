/*
 * ch6/maps/drum_circle.js
 * Job: the small school of Stonehollow, where the Rally Sigil is taught: an open ring of standing stones on a ledge above the town, the drums at the far side.
 */

export default {
  id: 'drum_circle',
  name: 'ch6.map.drum_circle',
  tileset: 'outdoor',
  rest: false,
  legend: { g: 'grass', t: 'tallgrass', f: 'flowers', p: 'path', c: 'cobble', s: 'sand' },
  rows: [
    'gggggggggggggggggggggggg',
    'gggggggggggggggggggggggg',
    'gggggggggggggggggggggggg',
    'ggggggggggccccgggggggggg',
    'gggggggccccccccccggggggg',
    'ggggggccccccccccccgggggg',
    'gggggccccccccccccccggggg',
    'ggggcccccsssssscccccgggg',
    'ggggccccssssssssccccgggg',
    'ggggccccssssssssccccgggg',
    'ggggccccssssssssccccgggg',
    'ggggccccssssssssccccgggg',
    'ggggcccccsssssscccccgggg',
    'gggggccccccccccccccggggg',
    'ggggggccccccccccccgggggg',
    'gggggggccccppccccggggggg',
    'gfffffffggcppcggtttttttg',
    'gfffffffgggppgggtttttttg',
    'gfffffffgggppgggtttttttg',
    'gfffffffgggppgggtttttttg',
    'gggggggggggppggggggggggg',
    'gggggggggggppggggggggggg'
  ],
  things: {
    legend: { P: 'pine', R: 'rock', L: 'lamp', S: 'sign', b: 'bench', a: 'drum', D: 'drum_big', E: 'school_touch_earth', l: 'lantern_string' },
    rows: [
      'RR.RPPPPRRRPRPR.PPRPPRRP',
      '..RPPRP.R.PPRRRP.PPRP.RP',
      'RR....................PR',
      '.P......R.l....R.P....PP',
      'R..........D......RR..PR',
      'PR...R....a..a....RR..RP',
      'RP......a......a......RR',
      'R...L..............L..RP',
      '.R....................PP',
      'RR.R................R.RP',
      'R.....................PR',
      'PP....................RR',
      'RP.....b.......b......PP',
      'RP....................PP',
      'P....R............R...RP',
      'RR.....................P',
      'R........L....L........P',
      'R.........E..E.........R',
      '.............S.P.......P',
      'P......................R',
      'PRRRPPRP.......PRP.P..PP',
      'RRPPPRRPP......PPRRPR.RP'
    ]
  },
  props: [
    { type: 'bookstack', x: 6, y: 12 }
  ],
  doors: [
    { x: 11, y: 21, to: 'stonehollow', tx: 40, ty: 1, dir: 0 }, { x: 12, y: 21, to: 'stonehollow', tx: 41, ty: 1, dir: 0 }
  ],
  spawn: { x: 11, y: 19, dir: 1 },
  labels: [
    { x: 11, y: 9, name: 'ch6.map.drum_circle.label.1' }, { x: 11, y: 20, name: 'ch6.map.drum_circle.label.2' }
  ],
  start: { time: 10, weather: 'clear' },
  spots: {
    teacher: [11, 7],
    pupil: [11, 11],
    centre: [11, 9],
    drums: [[8, 7], [10, 6], [13, 6], [15, 7]],
    seats: [[8, 13], [16, 13]],
    gate: [11, 16]
  }
};
