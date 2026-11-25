/*
 * ch10/maps/council_high.js
 * Job: the chamber of Councillor Hale (the rule: blind): pale marble, every window veiled, cold Council lanterns, the arched door to the Archmage's study behind the duel floor.
 */

export default {
  id: 'council_high',
  name: 'ch10.map.council_high',
  tileset: 'indoor',
  rest: false,
  legend: { W: 'wall', V: 'void', K: 'floor_marble', C: 'carpet_blue' },
  rows: [
    'VWWWWWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWWWWWV',
    'VWWWWWWWWWWWWWWWWWWWWWWWV',
    'VKKKKKKKKKKKKKKKKKKKKKKKV',
    'VKKKKKKKKKKKKKKKKKKKKKKKV',
    'VKKKKKKKKKKKKKKKKKKKKKKKV',
    'VKKKKKKKKCCCCCCCKKKKKKKKV',
    'VKKKKKKKKCCCCCCCKKKKKKKKV',
    'VKKKKKKKKCCCCCCCKKKKKKKKV',
    'VKKKKKKKKCCCCCCCKKKKKKKKV',
    'VKKKKKKKKCCCCCCCKKKKKKKKV',
    'VKKKKKKKKCCCCCCCKKKKKKKKV',
    'VKKKKKKKKCCCCCCCKKKKKKKKV',
    'VKKKKKKKKCCCCCCCKKKKKKKKV',
    'VKKKKKKKKKKCCCKKKKKKKKKKV',
    'VKKKKKKKKKKCCCKKKKKKKKKKV',
    'VVVVVVVVVVVKKKVVVVVVVVVVV'
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
    { type: 'hall_wall', x: 19, y: 4 }, { type: 'hall_wall', x: 20, y: 0 }, { type: 'hall_wall', x: 20, y: 2 }, { type: 'hall_wall', x: 20, y: 4 },
    { type: 'hall_wall', x: 21, y: 0 }, { type: 'hall_wall', x: 21, y: 2 }, { type: 'hall_wall', x: 21, y: 4 }, { type: 'hall_wall', x: 22, y: 0 },
    { type: 'hall_wall', x: 22, y: 2 }, { type: 'hall_wall', x: 22, y: 4 }, { type: 'hall_wall', x: 23, y: 0 }, { type: 'hall_wall', x: 23, y: 2 },
    { type: 'hall_wall', x: 23, y: 4 }, { type: 'council_seat_h', x: 16, y: 7 }, { type: 'athenaeum_door', x: 12, y: 5 }, { type: 'veil_curtain', x: 3, y: 3 },
    { type: 'veil_curtain', x: 6, y: 3 }, { type: 'veil_curtain', x: 18, y: 3 }, { type: 'veil_curtain', x: 21, y: 3 }, { type: 'council_banner', x: 10, y: 3 },
    { type: 'council_banner', x: 14, y: 3 }, { type: 'watch_lamp', x: 2, y: 7 }, { type: 'watch_lamp', x: 22, y: 7 }, { type: 'watch_lamp', x: 2, y: 15 },
    { type: 'watch_lamp', x: 22, y: 15 }, { type: 'crystal_orb', x: 7, y: 7 }, { type: 'tall_shelf', x: 4, y: 6 }, { type: 'stone_pillar', x: 7, y: 10 },
    { type: 'stone_pillar', x: 17, y: 10 }, { type: 'stone_pillar', x: 7, y: 14 }, { type: 'stone_pillar', x: 17, y: 14 }
  ],
  doors: [
    { x: 11, y: 19, to: 'athenaeum', tx: 16, ty: 7, dir: 0 }, { x: 12, y: 19, to: 'athenaeum', tx: 16, ty: 7, dir: 0 },
    { x: 13, y: 19, to: 'athenaeum', tx: 16, ty: 7, dir: 0 }, { x: 12, y: 6, to: 'vael_study', tx: 12, ty: 18, dir: 1 }
  ],
  spawn: { x: 12, y: 18, dir: 1 },
  spots: {
    councillor: [17, 8],
    duelFoe: [12, 10],
    duelKid: [12, 15],
    save: [12, 17],
    exit: [12, 18],
    studyDoor: [12, 7]
  }
};
