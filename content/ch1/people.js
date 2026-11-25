/*
 * ch1/people.js
 * Job: everyone in Emberbrook, its houses and Whisperwood, with their day and their story phases (schema section 3).
 */

export default [
  {
    id: 'mom',
    name: 'ch1.name.mom',
    look: 'mom',
    at: { map: 'home', x: 5, y: 3, dir: 0 },
    lines: ['ch1.p.mom.1', 'ch1.p.mom.2'],
    phases: [
      {
        if: 'c1:morning',
        schedule: [
          { from: 6, to: 11, x: 3, y: 3, dir: 0, lines: ['ch1.p.mom.3', 'ch1.p.mom.4'] },
          { from: 11, to: 17, x: 7, y: 6, dir: 2, lines: ['ch1.p.mom.5', 'ch1.p.mom.6'] },
          { from: 17, to: 21, x: 2, y: 3, dir: 0, lines: ['ch1.p.mom.7', 'ch1.p.mom.8'] },
          { from: 21, to: 24, x: 15, y: 11, dir: 0, lines: ['ch1.p.mom.9', 'ch1.p.mom.10'] },
          { from: 0, to: 6, away: true }
        ]
      },
      /* chapter 9: come to Goldmere to watch the tournament (they can see, which is against his law) */
      { if: 'c9:family', at: { map: 'goldmere', x: 30, y: 26, dir: 3 }, schedule: null, lines: ['ch9.p.mom.1', 'ch9.p.mom.2'] },
      { if: 'c9:tourney', at: { map: 'halo_court', x: 6, y: 11, dir: 3 }, schedule: null, lines: ['ch9.p.mom.3', 'ch9.p.mom.4'] },
      /* chapter 10: the Athenaeum hall, Vael's garden, then home or the fair */
      { if: { all: ['c10:vael', { not: 'c10:law' }] }, at: { map: 'athenaeum', x: 14, y: 16, dir: 3 }, schedule: null, lines: ['ch10.p.mom.1', 'ch10.p.mom.2'] },
      { if: 'c10:law', at: { map: 'home', x: 13, y: 6, dir: 3 }, schedule: null, lines: ['ch10.p.mom.3', 'ch10.p.mom.4'] }
    ]
  },
  {
    id: 'dad',
    name: 'ch1.name.dad',
    look: 'dad',
    at: { map: 'home', x: 18, y: 8, dir: 2 },
    lines: ['ch1.p.dad.1', 'ch1.p.dad.2'],
    phases: [
      {
        if: 'c1:morning',
        schedule: [
          { from: 6, to: 11, x: 4, y: 8, dir: 0, lines: ['ch1.p.dad.3', 'ch1.p.dad.4'] },
          { from: 11, to: 17, x: 12, y: 5, dir: 2, lines: ['ch1.p.dad.5', 'ch1.p.dad.6'] },
          { from: 17, to: 21, x: 15, y: 4, dir: 0, lines: ['ch1.p.dad.7', 'ch1.p.dad.8'] },
          { from: 21, to: 24, x: 18, y: 8, dir: 2, lines: ['ch1.p.dad.9', 'ch1.p.dad.10'] },
          { from: 0, to: 6, away: true }
        ]
      },
      /* chapter 9: come to Goldmere to watch the tournament (they can see, which is against his law) */
      { if: 'c9:family', at: { map: 'goldmere', x: 31, y: 26, dir: 3 }, schedule: null, lines: ['ch9.p.dad.1', 'ch9.p.dad.2'] },
      { if: 'c9:tourney', at: { map: 'halo_court', x: 6, y: 12, dir: 3 }, schedule: null, lines: ['ch9.p.dad.3', 'ch9.p.dad.4'] },
      /* chapter 10: the Athenaeum hall, Vael's garden, then home or the fair */
      { if: { all: ['c10:vael', { not: 'c10:law' }] }, at: { map: 'athenaeum', x: 18, y: 16, dir: 2 }, schedule: null, lines: ['ch10.p.dad.1', 'ch10.p.dad.2'] },
      { if: 'c10:law', at: { map: 'home', x: 17, y: 6, dir: 2 }, schedule: null, lines: ['ch10.p.dad.3', 'ch10.p.dad.4'] }
    ]
  },
  {
    id: 'elder',
    name: 'ch1.name.elder',
    look: 'elder',
    at: { map: 'village', x: 33, y: 12, dir: 0 },
    lines: ['ch1.p.elder.1', 'ch1.p.elder.2']
  },
  {
    id: 'rosa',
    name: 'ch1.name.rosa',
    look: 'baker',
    at: { map: 'village', x: 25, y: 19, dir: 3 },
    lines: ['ch1.p.rosa.1', 'ch1.p.rosa.2']
  },
  {
    id: 'oru',
    name: 'ch1.name.oru',
    look: 'fisher',
    at: { map: 'village', x: 46, y: 9, dir: 3 },
    lines: ['ch1.p.oru.1'],
    fixed: true,
    service: 'shared.svc.fisher'
  },
  {
    id: 'ula',
    name: 'ch1.name.ula',
    look: 'grandma',
    at: { map: 'village', x: 11, y: 12, dir: 1 },
    lines: ['ch1.p.ula.1', 'ch1.p.ula.2']
  },
  {
    id: 'hob',
    name: 'ch1.name.hob',
    look: 'farmer',
    at: { map: 'village', x: 7, y: 17, dir: 0 },
    lines: ['ch1.p.hob.1', 'ch1.p.hob.2']
  },
  {
    id: 'gatekeeper',
    name: 'ch1.name.gatekeeper',
    look: 'gatekeeper',
    at: { map: 'village', x: 32, y: 10, dir: 2 },
    lines: ['ch1.p.gatekeeper.1', 'ch1.p.gatekeeper.2'],
    phases: [{ if: 'c1:academy', lines: ['ch1.p.gatekeeper.3', 'ch1.p.gatekeeper.4'] }]
  },
  {
    id: 'bram',
    name: 'ch1.name.bram',
    look: 'guard',
    at: { map: 'village', x: 32, y: 37, dir: 0 },
    lines: ['ch1.p.bram.1', 'ch1.p.bram.2'],
    phases: [{ if: { quest: 'academy', is: 'done' }, lines: ['ch1.p.bram.3', 'ch1.p.bram.4'] }]
  },
  {
    id: 'ivy',
    name: 'ch1.name.ivy',
    look: 'gardener',
    at: { map: 'village', x: 57, y: 13, dir: 2 },
    lines: ['ch1.p.ivy.1', 'ch1.p.ivy.2']
  },
  {
    id: 'rowan',
    name: 'ch1.name.rowan',
    look: 'traveler',
    at: { map: 'village', x: 56, y: 24, dir: 2 },
    lines: ['ch1.p.rowan.1', 'ch1.p.rowan.2'],
    phases: [
      {
        if: 'c1:complete',
        at: { map: 'mossgrove', x: 32, y: 17, dir: 3 },
        lines: ['ch1.p.rowan.3', 'ch1.p.rowan.4']
      }
    ]
  },
  {
    id: 'kip',
    name: 'ch1.name.kip',
    look: 'kid2',
    at: { map: 'village', x: 19, y: 36, dir: 0 },
    lines: ['ch1.p.kip.1', 'ch1.p.kip.2']
  },
  {
    id: 'milo',
    name: 'ch1.name.milo',
    look: 'milo',
    at: { map: 'village', x: 52, y: 28, dir: 3 },
    lines: ['ch1.p.milo.1', 'ch1.p.milo.2']
  },
  {
    id: 'tansy',
    name: 'ch1.name.tansy',
    look: 'tansy',
    at: { map: 'village', x: 34, y: 26, dir: 0 },
    lines: ['ch1.p.tansy.1', 'ch1.p.tansy.2']
  },
  {
    id: 'bo',
    name: 'ch1.name.bo',
    look: 'innkeeper',
    at: { map: 'tavern', x: 5, y: 3, dir: 0 },
    lines: ['ch1.p.bo.1', 'ch1.p.bo.2'],
    service: 'ch1.svc.ramen'
  },
  {
    id: 'rook',
    name: 'ch1.name.rook',
    look: 'rook',
    at: { map: 'tavern', x: 8, y: 7, dir: 3 },
    lines: ['ch1.p.rook.1', 'ch1.p.rook.2']
  },
  {
    id: 'sumi',
    name: 'ch1.name.sumi',
    look: 'sumi',
    at: { map: 'tavern', x: 11, y: 4, dir: 0 },
    lines: ['ch1.p.sumi.1', 'ch1.p.sumi.2']
  },
  {
    id: 'nettle',
    name: 'ch1.name.nettle',
    look: 'shopkeeper',
    at: { map: 'shop', x: 7, y: 3, dir: 0 },
    lines: ['ch1.p.nettle.1', 'ch1.p.nettle.2'],
    service: 'shared.svc.shop'
  },
  {
    id: 'juniper',
    name: 'ch1.name.juniper',
    look: 'juniper',
    at: { map: 'shop', x: 4, y: 7, dir: 1 },
    lines: ['ch1.p.juniper.1', 'ch1.p.juniper.2']
  },
  {
    id: 'sorrel',
    name: 'ch1.name.sorrel',
    look: 'sorrel',
    at: { map: 'school', x: 8, y: 3, dir: 0 },
    lines: ['ch1.p.sorrel.1', 'ch1.p.sorrel.2'],
    service: 'ch1.svc.lessons'
  },
  {
    id: 'cole',
    name: 'ch1.name.cole',
    look: 'boy',
    at: { map: 'school', x: 5, y: 7, dir: 1 },
    lines: ['ch1.p.cole.1', 'ch1.p.cole.2'],
    service: 'ch1.svc.duel.cole',
    /* chapter 3: after his warning kite he waits at the kite post of Kitewick for the rematch */
    phases: [
      { if: 'c3:kite:note', at: { map: 'kitewick', x: 25, y: 20, dir: 0 }, lines: ['ch3.p.cole.1', 'ch3.p.cole.2'], service: 'ch3.svc.cole' },
      /* chapter 5: after the scene with his father he stays in the ring-smith's house in Coilhaven */
      { if: 'c5:cole', at: { map: 'coilhaven_h1', x: 6, y: 6, dir: 2 }, lines: ['ch5.p.cole.1', 'ch5.p.cole.2'], service: 'ch5.svc.cole' },
      /* chapter 7: he and Mira find the kid in Cinderreach, then rest at the tavern there */
      { if: { all: ['c7:box', { not: 'c7:friends' }] }, at: { map: 'cinderreach', x: 28, y: 24, dir: 1 }, lines: ['ch7.p.cole.1', 'ch7.p.cole.2'], service: 'ch7.svc.friend' },
      { if: 'c7:friends', at: { map: 'cinderreach_tavern', x: 5, y: 5, dir: 3 }, lines: ['ch7.p.cole.1', 'ch7.p.cole.2'], service: 'ch7.svc.friend' },
      /* chapter 9: in Goldmere's plaza, then at the edge of the tournament ring */
      { if: { all: ['c9:gate', { not: 'c9:tourney' }] }, at: { map: 'goldmere', x: 34, y: 20, dir: 3 }, schedule: null, lines: ['ch9.p.cole.1', 'ch9.p.cole.2'] },
      { if: 'c9:tourney', at: { map: 'halo_court', x: 13, y: 17, dir: 1 }, schedule: null, lines: ['ch9.p.cole.3', 'ch9.p.cole.4'] },
      { if: 'c9:ring', at: { map: 'halo_court', x: 13, y: 17, dir: 1 }, schedule: null, lines: ['ch9.p.cole.5', 'ch9.p.cole.6'] },
      /* chapter 10: the Athenaeum hall, Vael's garden, then home or the fair */
      { if: { all: ['c10:vael', { not: 'c10:law' }] }, at: { map: 'athenaeum', x: 19, y: 15, dir: 2 }, schedule: null, lines: ['ch10.p.cole.1', 'ch10.p.cole.2'] },
      { if: { all: ['c10:law', { not: 'c10:jars' }] }, at: { map: 'vael_garden', x: 21, y: 13, dir: 3 }, schedule: null, lines: ['ch10.p.cole.3', 'ch10.p.cole.4'] },
      { if: 'c10:jars', at: { map: 'village', x: 36, y: 27, dir: 3 }, schedule: null, lines: ['ch10.p.cole.5', 'ch10.p.cole.6'] }
    ]
  },
  {
    id: 'mira',
    name: 'ch1.name.mira',
    look: 'girl',
    at: { map: 'school', x: 15, y: 7, dir: 1 },
    lines: ['ch1.p.mira.1', 'ch1.p.mira.2'],
    service: 'ch1.svc.duel.mira',
    /* chapter 4: she has gone home to Tidewell, to her mother's house */
    phases: [
      { if: 'c4:open', at: { map: 'tidewell_h1', x: 5, y: 4, dir: 0 }, lines: ['ch4.p.mira.1', 'ch4.p.mira.2'], service: 'ch4.svc.mira' },
      /* chapter 7: with Cole in Cinderreach */
      { if: { all: ['c7:box', { not: 'c7:friends' }] }, at: { map: 'cinderreach', x: 31, y: 24, dir: 1 }, lines: ['ch7.p.mira.1', 'ch7.p.mira.2'], service: 'ch7.svc.friend' },
      { if: 'c7:friends', at: { map: 'cinderreach_tavern', x: 9, y: 6, dir: 2 }, lines: ['ch7.p.mira.1', 'ch7.p.mira.2'], service: 'ch7.svc.friend' },
      /* chapter 9: in Goldmere's plaza, then at the edge of the tournament ring */
      { if: { all: ['c9:gate', { not: 'c9:tourney' }] }, at: { map: 'goldmere', x: 37, y: 20, dir: 2 }, schedule: null, lines: ['ch9.p.mira.1', 'ch9.p.mira.2'] },
      { if: 'c9:tourney', at: { map: 'halo_court', x: 21, y: 17, dir: 1 }, schedule: null, lines: ['ch9.p.mira.3', 'ch9.p.mira.4'] },
      { if: 'c9:ring', at: { map: 'halo_court', x: 21, y: 17, dir: 1 }, schedule: null, lines: ['ch9.p.mira.5', 'ch9.p.mira.6'] },
      /* chapter 10: the Athenaeum hall, Vael's garden, then home or the fair */
      { if: { all: ['c10:vael', { not: 'c10:law' }] }, at: { map: 'athenaeum', x: 13, y: 15, dir: 3 }, schedule: null, lines: ['ch10.p.mira.1', 'ch10.p.mira.2'] },
      { if: { all: ['c10:law', { not: 'c10:jars' }] }, at: { map: 'vael_garden', x: 21, y: 11, dir: 3 }, schedule: null, lines: ['ch10.p.mira.3', 'ch10.p.mira.4'] },
      { if: 'c10:jars', at: { map: 'village', x: 10, y: 27, dir: 3 }, schedule: null, lines: ['ch10.p.mira.5', 'ch10.p.mira.6'] }
    ]
  },
  {
    id: 'wren',
    name: 'ch1.name.wren',
    look: 'wren',
    at: { map: 'house_a1', x: 2, y: 8, dir: 1 },
    lines: ['ch1.p.wren.1', 'ch1.p.wren.2'],
    phases: [
      {
        if: 'c1:complete',
        at: { map: 'rootwood_hall', x: 5, y: 18, dir: 3 },
        lines: ['ch1.p.wren.3', 'ch1.p.wren.4']
      },
      /* chapter 6: an apprentice of Rootwood now, she comes through Stonehollow and loses hontori to the seal too */
      { if: { all: ['c6:wren', { not: 'c6:wrenhome' }] }, at: { map: 'stonehollow_tavern', x: 5, y: 6, dir: 0 }, lines: ['ch6.p.wren.1', 'ch6.p.wren.2'] },
      { if: { all: ['c6:sealed', { not: 'c6:wrenhome' }] }, at: { map: 'stonehollow', x: 33, y: 24, dir: 2 }, lines: ['ch6.p.wren.3', 'ch6.p.wren.4'] },
      /* chapter 10: the Athenaeum hall, Vael's garden, then home or the fair */
      { if: { all: ['c10:vael', { not: 'c10:law' }] }, at: { map: 'athenaeum', x: 11, y: 13, dir: 3 }, schedule: null, lines: ['ch10.p.wren.1', 'ch10.p.wren.2'] },
      { if: 'c10:jars', at: { map: 'village', x: 44, y: 27, dir: 2 }, schedule: null, lines: ['ch10.p.wren.3', 'ch10.p.wren.4'] }
    ]
  },
  {
    id: 'hazel',
    name: 'ch1.name.hazel',
    look: 'hazel',
    at: { map: 'house_a1', x: 9, y: 5, dir: 0 },
    lines: ['ch1.p.hazel.1', 'ch1.p.hazel.2']
  },
  {
    id: 'tobin',
    name: 'ch1.name.tobin',
    look: 'tobin',
    at: { map: 'house_a2', x: 9, y: 8, dir: 1 },
    lines: ['ch1.p.tobin.1', 'ch1.p.tobin.2']
  },
  {
    id: 'corin',
    name: 'ch1.name.corin',
    look: 'corin',
    at: { map: 'house_a2', x: 5, y: 3, dir: 0 },
    lines: ['ch1.p.corin.1', 'ch1.p.corin.2']
  },
  {
    id: 'fenn',
    name: 'ch1.name.fenn',
    look: 'fenn',
    at: { map: 'house_a3', x: 7, y: 4, dir: 0 },
    lines: ['ch1.p.fenn.1', 'ch1.p.fenn.2']
  },
  {
    id: 'lark',
    name: 'ch1.name.lark',
    look: 'lark',
    at: { map: 'house_a3', x: 4, y: 8, dir: 1 },
    lines: ['ch1.p.lark.1', 'ch1.p.lark.2']
  },
  {
    id: 'alder',
    name: 'ch1.name.alder',
    look: 'alder',
    at: { map: 'whisperwood', x: 21, y: 4, dir: 2 },
    lines: ['ch1.p.alder.1', 'ch1.p.alder.2']
  },
  {
    id: 'sela',
    name: 'ch1.name.sela',
    look: 'sela',
    at: { map: 'whisperwood', x: 36, y: 27, dir: 2 },
    lines: ['ch1.p.sela.1', 'ch1.p.sela.2']
  },
  {
    id: 'tam',
    name: 'ch1.name.tam',
    look: 'tam',
    at: { map: 'whisperwood', x: 22, y: 17, dir: 2 },
    lines: ['ch1.p.tam.1'],
    service: 'shared.svc.fisher'
  }
];
