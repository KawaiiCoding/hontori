/*
 * shared/world.js
 * Job: the world map as data (the current game's src/mapview.js REG and ROADS): every region as a
 * place on the parchment, the maps that belong to it, its element, the ring earned there, why a
 * place is still closed, and the roads between places. Places without a name are quiet marks of
 * lands not reached in this episode. x and y are shares of the picture (0 to 1).
 * The folder key is `world`; the panels read it from any content folder.
 */

export default {
  regions: [
    { id: 'emberbrook', name: 'shared.world.emberbrook', x: 0.42, y: 0.16, element: 'fire',
      maps: ['home', 'village', 'tavern', 'shop', 'school', 'house_a1', 'house_a2', 'house_a3'] },
    { id: 'whisperwood', name: 'shared.world.whisperwood', x: 0.42, y: 0.38, element: 'grass', maps: ['whisperwood'] },
    { id: 'mossgrove', name: 'shared.world.mossgrove', x: 0.32, y: 0.58, element: 'grass', ring: 'grass',
      maps: ['mossgrove', 'rootwood_gate', 'rootwood_hall', 'moss_house1', 'moss_house2'] },
    { id: 'pass', name: 'shared.world.pass', x: 0.66, y: 0.56, element: 'wind', ring: 'wind', why: 'shared.world.pass.why',
      maps: ['whistling_pass', 'windrest', 'kite_house', 'kitewick', 'kitewick_tavern', 'kitewick_shop', 'kitewick_h1', 'kitewick_h2', 'kitewick_h3',
        'kitewick_h4', 'gale_loft', 'gale_bridges'] },
    { id: 'coast', name: 'shared.world.coast', x: 0.8, y: 0.76, element: 'water', ring: 'water', why: 'shared.world.coast.why',
      maps: ['tidewell', 'ferry', 'tidewell_tavern', 'tidewell_shop', 'tidewell_h1', 'tidewell_h2', 'tidewell_h3', 'tidewell_h4', 'lullaby_boat',
        'saltmarsh', 'sunken_stair', 'deepbell_hall'] },
    { id: 'coilhaven', name: 'shared.world.coilhaven', x: 0.9, y: 0.56, element: 'electric', ring: 'electric', why: 'shared.world.coilhaven.why',
      maps: ['coilhaven', 'coast_road', 'coilhaven_tavern', 'coilhaven_shop', 'coilhaven_h1', 'coilhaven_h2', 'coilhaven_h3', 'coilhaven_h4',
        'tinker_shed', 'sparkmoor', 'storm_works'] },
    { id: 'far2', x: 0.58, y: 0.84 },
    { id: 'far3', x: 0.86, y: 0.36 },
    { id: 'far4', x: 0.2, y: 0.82 },
    { id: 'far5', x: 0.12, y: 0.42 },
    { id: 'far6', x: 0.7, y: 0.18 },
    { id: 'far7', x: 0.38, y: 0.95 },
  ],
  roads: [
    ['emberbrook', 'whisperwood'], ['whisperwood', 'mossgrove'], ['mossgrove', 'pass'], ['pass', 'coast'], ['coast', 'coilhaven'],
    ['coast', 'far2'], ['pass', 'far3'], ['far2', 'far4'], ['far4', 'far5'], ['far3', 'far6'], ['far2', 'far7'],
  ],
  /* the sea in the south-east corner and the mountains beside the pass */
  sea: { x: 1.02, y: 1.02, rx: 0.42, ry: 0.3 },
  mountains: [
    { x: 0.58, y: 0.45 }, { x: 0.625, y: 0.48 }, { x: 0.67, y: 0.45 }, { x: 0.715, y: 0.48 },
    { x: 0.76, y: 0.45 }, { x: 0.805, y: 0.48 }, { x: 0.85, y: 0.45 },
  ],
};
