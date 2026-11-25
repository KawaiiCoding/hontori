/*
 * ch10/maps/links.js
 * Job: the parts of the old maps that chapter 10 changes, and the ways that wait for the story.
 * links: the foot of the Athenaeum Stair at the top of Goldmere (stone steps where four trees stood).
 * states (game/maps/index.js): what stands in the way until a condition holds.
 *   goldmere          the stair's gate stays shut until the Halo Ring is won (c9:complete)
 *   athenaeum_stair   ivy hides the side way past the locked landing until Merrit's sketch is read (c10:sketch)
 *   athenaeum         the High Chamber is sealed until the east and west Councillors are beaten (c10:brand, c10:vesk)
 *   council_high      the Archmage's study is sealed until Councillor Hale is beaten (c10:hale)
 *   village           the Emberbrook fair stands only after the end (c10:complete): until then its stalls are not there
 */

export default {
  links: [
    {
      map: 'goldmere',
      without: [{ type: 'fruit_tree', x: 56, y: 0 }, { type: 'tree', x: 56, y: 1 }, { type: 'tree', x: 56, y: 2 }, { type: 'fruit_tree', x: 57, y: 2 }],
      props: [
        { type: 'stone_steps', x: 56, y: 0 }, { type: 'stone_steps', x: 57, y: 0 }, { type: 'stone_steps', x: 56, y: 1 }, { type: 'stone_steps', x: 57, y: 1 },
        { type: 'stone_steps', x: 56, y: 2 }, { type: 'stone_steps', x: 57, y: 2 }, { type: 'watch_lamp', x: 55, y: 3 }, { type: 'watch_lamp', x: 58, y: 3 }
      ],
      doors: [{ x: 56, y: 0, to: 'athenaeum_stair', tx: 14, ty: 66, dir: 1 }, { x: 57, y: 0, to: 'athenaeum_stair', tx: 15, ty: 66, dir: 1 }],
      labels: [{ x: 56, y: 4, name: 'ch10.map.goldmere.label.stair' }]
    }
  ],
  states: [
    { map: 'goldmere', until: 'c9:complete', props: [{ type: 'landing_gate', x: 56, y: 2 }], closes: ['athenaeum_stair'] },
    { map: 'athenaeum_stair', until: 'c10:sketch', props: [{ type: 'ivy_veil', x: 23, y: 28 }] },
    { map: 'athenaeum', until: { all: ['c10:brand', 'c10:vesk'] }, props: [{ type: 'council_seal', x: 16, y: 6 }], closes: ['council_high'] },
    { map: 'council_high', until: 'c10:hale', props: [{ type: 'council_seal', x: 12, y: 6 }], closes: ['vael_study'] },
    {
      map: 'village',
      until: { not: 'c10:complete' },
      props: [
        { type: 'fair_stall_hats', x: 4, y: 25 }, { type: 'fair_stall_frames', x: 10, y: 25 }, { type: 'fair_stall_lanterns', x: 36, y: 25 }, { type: 'fair_stall_sweets', x: 42, y: 25 },
        { type: 'lantern_string', x: 4, y: 24 }, { type: 'lantern_string', x: 10, y: 24 }, { type: 'lantern_string', x: 36, y: 24 }, { type: 'lantern_string', x: 42, y: 24 },
        { type: 'banner_pole', x: 16, y: 25 }, { type: 'banner_pole', x: 33, y: 25 }
      ]
    }
  ]
};
