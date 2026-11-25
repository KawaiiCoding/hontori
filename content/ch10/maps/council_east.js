/*
 * ch10/maps/council_east.js
 * Job: the chamber of Councillor Brand (the rule: no switching): cold stone, a blue runner, iron chains around the duel floor, his high seat with the blue cushion.
 */

export default {
  id: 'council_east',
  name: 'ch10.map.council_east',
  tileset: 'indoor',
  rest: false,
  legend: { W: 'wall', V: 'void', S: 'floor_stone', C: 'carpet_blue' },
  rows: [
    'VWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWV',
    'VSSSSSSSSSSSSSSSSSSSV',
    'VSSSSSSSSSSSSSSSSSSSV',
    'VSSSSSSSSSSSSSSSSSSSV',
    'VSSSSSSCCCCCCCSSSSSSV',
    'VSSSSSSCCCCCCCSSSSSSV',
    'VSSSSSSCCCCCCCSSSSSSV',
    'VSSSSSSCCCCCCCSSSSSSV',
    'VSSSSSSCCCCCCCSSSSSSV',
    'VSSSSSSCCCCCCCSSSSSSV',
    'VSSSSSSCCCCCCCSSSSSSV',
    'VSSSSSSCCCCCCCSSSSSSV',
    'VSSSSSSSSCCCSSSSSSSSV',
    'VSSSSSSSSCCCSSSSSSSSV',
    'VVVVVVVVVSSSVVVVVVVVV'
  ],
  props: [
    { type: 'hall_wall', x: 1, y: 0 }, { type: 'hall_wall', x: 1, y: 2 }, { type: 'hall_wall', x: 1, y: 4 }, { type: 'hall_wall', x: 2, y: 0 },
    { type: 'hall_wall', x: 2, y: 2 }, { type: 'hall_wall', x: 2, y: 4 }, { type: 'hall_wall', x: 3, y: 0 }, { type: 'hall_wall', x: 3, y: 2 },
    { type: 'hall_wall', x: 3, y: 4 }, { type: 'hall_wall', x: 4, y: 0 }, { type: 'hall_wall', x: 4, y: 2 }, { type: 'hall_wall', x: 4, y: 4 },
    { type: 'hall_wall', x: 5, y: 0 }, { type: 'hall_wall', x: 5, y: 2 }, { type: 'hall_wall', x: 5, y: 4 }, { type: 'hall_wall', x: 6, y: 0 },
    { type: 'hall_wall', x: 6, y: 2 }, { type: 'hall_wall', x: 6, y: 4 }, { type: 'hall_wall', x: 7, y: 0 }, { type: 'hall_wall', x: 7, y: 2 },
    { type: 'hall_wall', x: 7, y: 4 }, { type: 'hall_wall', x: 8, y: 0 }, { type: 'hall_wall', x: 8, y: 2 }, { type: 'hall_wall', x: 8, y: 4 },
    { type: 'hall_wall', x: 9, y: 0 }, { type: 'hall_wall', x: 9, y: 2 }, { type: 'hall_wall', x: 9, y: 4 }, { type: 'hall_wall', x: 10, y: 0 },
    { type: 'hall_wall', x: 10, y: 2 }, { type: 'hall_wall', x: 10, y: 4 }, { type: 'hall_wall', x: 11, y: 0 }, { type: 'hall_wall', x: 11, y: 2 },
    { type: 'hall_wall', x: 11, y: 4 }, { type: 'hall_wall', x: 12, y: 0 }, { type: 'hall_wall', x: 12, y: 2 }, { type: 'hall_wall', x: 12, y: 4 },
    { type: 'hall_wall', x: 13, y: 0 }, { type: 'hall_wall', x: 13, y: 2 }, { type: 'hall_wall', x: 13, y: 4 }, { type: 'hall_wall', x: 14, y: 0 },
    { type: 'hall_wall', x: 14, y: 2 }, { type: 'hall_wall', x: 14, y: 4 }, { type: 'hall_wall', x: 15, y: 0 }, { type: 'hall_wall', x: 15, y: 2 },
    { type: 'hall_wall', x: 15, y: 4 }, { type: 'hall_wall', x: 16, y: 0 }, { type: 'hall_wall', x: 16, y: 2 }, { type: 'hall_wall', x: 16, y: 4 },
    { type: 'hall_wall', x: 17, y: 0 }, { type: 'hall_wall', x: 17, y: 2 }, { type: 'hall_wall', x: 17, y: 4 }, { type: 'hall_wall', x: 18, y: 0 },
    { type: 'hall_wall', x: 18, y: 2 }, { type: 'hall_wall', x: 18, y: 4 }, { type: 'hall_wall', x: 19, y: 0 }, { type: 'hall_wall', x: 19, y: 2 },
    { type: 'hall_wall', x: 19, y: 4 }, { type: 'council_seat_e', x: 9, y: 7 }, { type: 'council_banner', x: 5, y: 3 }, { type: 'council_banner', x: 15, y: 3 },
    { type: 'window', x: 8, y: 3 }, { type: 'window', x: 12, y: 3 }, { type: 'watch_lamp', x: 2, y: 7 }, { type: 'watch_lamp', x: 18, y: 7 },
    { type: 'chain_post', x: 5, y: 9 }, { type: 'chain_post', x: 5, y: 12 }, { type: 'chain_post', x: 5, y: 15 }, { type: 'chain_post', x: 15, y: 9 },
    { type: 'chain_post', x: 15, y: 12 }, { type: 'chain_post', x: 15, y: 15 }, { type: 'bookstack', x: 1, y: 17 }, { type: 'notice_board', x: 2, y: 6 },
    { type: 'notice_board', x: 17, y: 6 }, { type: 'stone_pillar', x: 1, y: 10 }, { type: 'stone_pillar', x: 19, y: 10 }
  ],
  doors: [
    { x: 9, y: 19, to: 'athenaeum', tx: 26, ty: 7, dir: 0 }, { x: 10, y: 19, to: 'athenaeum', tx: 26, ty: 7, dir: 0 },
    { x: 11, y: 19, to: 'athenaeum', tx: 26, ty: 7, dir: 0 }
  ],
  spawn: { x: 10, y: 18, dir: 1 },
  spots: {
    councillor: [10, 8],
    duelFoe: [10, 10],
    duelKid: [10, 15],
    save: [10, 17],
    exit: [10, 18]
  }
};
