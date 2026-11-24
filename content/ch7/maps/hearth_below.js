/*
 * ch7/maps/hearth_below.js
 * Job: the lava cave under Cinderreach, natural rock throughout: the mouth, the cavern between two lava pools, two side hollows, and at the far end the quiet chamber with the empty nest.
 */

export default {
  id: 'hearth_below',
  name: 'ch7.map.hearth_below',
  tileset: 'indoor',
  rest: false,
  legend: { S: 'cave_floor', V: 'cave_rock', W: 'cave_wall', L: 'cave_lava', M: 'cave_stalagmite', N: 'cave_nest' },
  rows: [
    'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
    'VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV',
    'VVVVVVVVVVVVVVVVVWWWWWWWWVVVVVVVVVVVVVVV',
    'VVVVVVVVVVVVVVVWWWWWWWWWWWVVVVVVWWWVVVVV',
    'VVVVVVVVVVVVVVVWWSSSNSSSSWVVVVVWWWWWVVVV',
    'VVVVVVVVVVVVVVVSMSSSSSSSMSVVVVVWLLLWVVVV',
    'VVVVVVVVVVVVVVVSSSSSSSSSSVVVVVVLLLLLVVVV',
    'VVVVVVVVVVVVVVVVVSSSSSSSVVVVVVVLLLLVVVVV',
    'VVVVVVVVVVVVVVVVVVVSSSVVVVVVVVVVVVVVVVVV',
    'VVVVVVVVVVVVVVVVWVVSSSVVVVVVVVVVVVVVVVVV',
    'VVVVVVVVVVVVWWWWWWWSSSWWWVWWVVVVVVVVVVVV',
    'VVVVVVVVVWVWWWWWSWWSSSWWWWWWWWWVVVVVVVVV',
    'VVWWWWWVVWWWSSSSSSSSSSSSSWSSWWWWWVWWWWWV',
    'VVWWWWWVWSWMSSSSSSSSSSSSSSSSSSSWWVWWWWWV',
    'VVSSSSSWWSSSSSSSSSSSSSSSSSSSSSSMSWSSSSSV',
    'VVSSSSSWSSSSSLSSSSSSSSSSSSSSLSSSSWSSSSSV',
    'VVSSSSSSSLLLLLLLSSSSSSSSSLLLLLLLSSSSSSSV',
    'VVVVVVSSLLLLLLLLSSSSSSSSLLLLLLLLLSSVVVVV',
    'VVVVVVVSLLLLLLLLLSSSSSSSLLLLLLLLLSVVVVVV',
    'VVVVVVVVSLLLLLLLSSSSSSSSSLLLLLLLVVVVVVVV',
    'VVVVVVVVSSSSLSSSSSSSSSSSSSSSSSSSVVVVVVVV',
    'VVVVVVVVVSVSVSSSSSSSSSSSSSSSSSSVVVVVVVVV',
    'VVVVVVVVVVVVVVSVSSSSSSSSSSVVVVVVVVVVVVVV',
    'VVVVVVVVVVVVVVVVVVVSSSSVVVVVVVVVVVVVVVVV',
    'VVVVVVVVVVVVVVVVVVWSSMVVVVVVVVVVVVVVVVVV',
    'VVVVVVWWWWWVVVVVVVWSSSVVVVVVVVVWVVVVVVVV',
    'VVVVVWWWWWWWVVVVVVSSSVVVVVVVVWWWWWVVVVVV',
    'VVVVVWLLLLLWVVVVVWSSSWWVVVVVWWWLWWWVVVVV',
    'VVVVVLLLLLLLVVVVWWSSSWWWWVVVWLLLLLWVVVVV',
    'VVVVVLLLLLLLVVVVWMSSSSSWWVVVLLLLLLLVVVVV',
    'VVVVVVLLLLLVVVVVSSSSSSSMSVVVVLLLLLVVVVVV',
    'VVVVVVVVVVVVVVVVSMSSSSSSSVVVVVVVVVVVVVVV',
    'VVVVVVVVVVVVVVVVVSSSSSSMSVVVVVVVVVVVVVVV',
    'VVVVVVVVVVVVVVVVVVSSSSSVVVVVVVVVVVVVVVVV',
    'VVVVVVVVVVVVVVVVVVVVSVVVVVVVVVVVVVVVVVVV',
    'VVVVVVVVVVVVVVVVVVVVSVVVVVVVVVVVVVVVVVVV'
  ],
  props: [
    { type: 'glowcaps', x: 17, y: 6 }
  ],
  doors: [
    { x: 20, y: 35, to: 'cinderreach', tx: 56, ty: 22, dir: 2 }
  ],
  spawn: { x: 20, y: 34, dir: 1 },
  labels: [
    { x: 20, y: 17, name: 'ch7.map.hearth_below.label.1' }, { x: 20, y: 5, name: 'ch7.map.hearth_below.label.2' }
  ],
  lights: [
    { x: 536, y: 104, r: 44, color: '#ff8a40', flicker: true }, { x: 152, y: 296, r: 44, color: '#ff8a40', flicker: true }, { x: 200, y: 296, r: 44, color: '#ff8a40', flicker: true },
    { x: 248, y: 296, r: 44, color: '#ff8a40', flicker: true }, { x: 392, y: 296, r: 44, color: '#ff8a40', flicker: true }, { x: 440, y: 296, r: 44, color: '#ff8a40', flicker: true },
    { x: 488, y: 296, r: 44, color: '#ff8a40', flicker: true }, { x: 104, y: 440, r: 44, color: '#ff8a40', flicker: true }, { x: 152, y: 440, r: 44, color: '#ff8a40', flicker: true },
    { x: 104, y: 488, r: 44, color: '#ff8a40', flicker: true }, { x: 152, y: 488, r: 44, color: '#ff8a40', flicker: true }, { x: 488, y: 488, r: 44, color: '#ff8a40', flicker: true },
    { x: 536, y: 488, r: 44, color: '#ff8a40', flicker: true }
  ],
  spots: {
    entry: [20, 31],
    cavern: [20, 17],
    nestFront: [20, 5],
    nestSide: [21, 4],
    cole: [18, 6],
    mira: [22, 6],
    pools: [[8, 15, 16, 20], [24, 15, 32, 20]],
    shoreWest: [17, 17],
    shoreEast: [23, 17],
    westHollow: [4, 15],
    eastHollow: [36, 15],
    passage: [20, 9]
  }
};
