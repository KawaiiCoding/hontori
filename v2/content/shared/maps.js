/*
 * shared/maps.js
 * Job: every map id the content may name, with its shown name, map-screen labels and whether resting
 * (the teddy) is allowed. The grids, props and doors are still read from the current game by content/legacy.js.
 */

export default [
  { id: 'home', name: 'shared.map.home' },
  {
    id: 'village',
    name: 'shared.map.village',
    labels: [
      { x: 7, y: 7, name: 'shared.map.village.label.1' },
      { x: 49, y: 21, name: 'shared.map.village.label.2' }
    ]
  },
  {
    id: 'whisperwood',
    name: 'shared.map.whisperwood',
    labels: [
      { x: 10, y: 27, name: 'shared.map.whisperwood.label.1' },
      { x: 41, y: 4, name: 'shared.map.whisperwood.label.2' },
      { x: 41, y: 36, name: 'shared.map.whisperwood.label.3' },
      { x: 25, y: 37, name: 'shared.map.whisperwood.label.4' }
    ]
  },
  {
    id: 'mossgrove',
    name: 'shared.map.mossgrove',
    labels: [
      { x: 20, y: 2, name: 'shared.map.mossgrove.label.1' },
      { x: 33, y: 2, name: 'shared.map.mossgrove.label.2' },
      { x: 36, y: 12, name: 'shared.map.mossgrove.label.3' }
    ]
  },
  { id: 'rootwood_hall', name: 'shared.map.rootwood_hall', rest: false },
  { id: 'rootwood_gate', name: 'shared.map.rootwood_gate', rest: false },
  { id: 'moss_house1', name: 'shared.map.moss_house1' },
  { id: 'moss_house2', name: 'shared.map.moss_house2' },
  { id: 'tavern', name: 'shared.map.tavern' },
  { id: 'shop', name: 'shared.map.shop' },
  { id: 'school', name: 'shared.map.school', rest: false },
  { id: 'house_a1', name: 'shared.map.house_a1' },
  { id: 'house_a2', name: 'shared.map.house_a2' },
  { id: 'house_a3', name: 'shared.map.house_a3' }
];
