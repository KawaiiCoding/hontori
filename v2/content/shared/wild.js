/*
 * shared/wild.js
 * Job: where each kind likes to live (src/encounters.js HAB). f: feature weights near a tile; day and night factors
 * (dusk is their mean); weather factors; rarity (below 0.5 also adds one level). features maps prop and tile types to a
 * feature. Night is 19.5 to 5.5, dusk 17.5 to 19.5 and 5.5 to 7. A carried lantern at night multiplies dark by 2.2
 * and raven by 1.6. Towns keep wild ones to tall grass, sand, flowers, water, fruit and the edges.
 */

export default {
  night: [19.5, 5.5],
  dusk: [[17.5, 19.5], [5.5, 7]],
  base: 0.05,
  lantern: { item: 'lantern', mul: { dark: 2.2, raven: 1.6 } },
  habitats: {
    water: {
      f: { water: 3, sand: 1.2, bridge: 1, reeds: 1.5, lilypad: 1 },
      day: 1,
      night: 0.8,
      wx: { rain: 2.2, fog: 1.2 },
      rare: 1
    },
    grass: {
      f: { tallgrass: 2.6, tree: 0.8, bush: 1, flowers: 0.6, garden: 1.5, fruit: 1.4 },
      day: 1,
      night: 0.6,
      wx: { rain: 1.3 },
      rare: 1
    },
    wind: {
      f: { open: 1.6, bridge: 1.5, flowers: 0.5, chime: 3 },
      day: 1,
      night: 0.6,
      wx: { wind: 2.5, rain: 0.7 },
      rare: 0.8
    },
    electric: {
      f: { lamp: 3, metal: 2, open: 0.3 },
      day: 0.8,
      night: 1,
      wx: { rain: 3, wind: 1.3, clear: 0.6 },
      rare: 0.35
    },
    earth: {
      f: { rock: 2.5, path: 0.5, sand: 0.6, wall: 1.2, field: 0.8 },
      day: 1,
      night: 0.8,
      wx: { rain: 0.8 },
      rare: 0.9
    },
    hontori: {
      f: { warm: 3, open: 0.4, path: 0.3 },
      day: 1.3,
      night: 0.25,
      wx: { clear: 1.4, rain: 0.25, snow: 0.3, fog: 0.6 },
      rare: 0.4
    },
    dark: {
      f: { shade: 1.6, mushroom: 3, tree: 0.8, tallgrass: 1.2, open: 0.7, path: 0.4 },
      day: 0.08,
      night: 3,
      wx: { fog: 2.2, rain: 1.1 },
      rare: 0.8
    },
    light: {
      f: { flowers: 1.4, statue: 5, open: 0.4 },
      day: 1.2,
      night: 0.08,
      wx: { clear: 1.4, rain: 0.4, fog: 0.5 },
      rare: 0.3
    },
    frog: {
      f: { lilypad: 3, reeds: 2.2, water: 1.4, tallgrass: 0.3 },
      day: 0.8,
      night: 1.3,
      wx: { rain: 2.6, fog: 1.3, clear: 0.8 },
      rare: 0.8
    },
    salamander: {
      f: { warm: 2.4, rock: 1, log: 1 },
      day: 0.9,
      night: 0.9,
      wx: { clear: 1.3, rain: 0.2, snow: 0.3 },
      rare: 0.35
    },
    squirrel: {
      f: { tree: 1.4, fruit: 2, open: 0.5, chime: 1.5 },
      day: 1.2,
      night: 0.3,
      wx: { wind: 2.6, rain: 0.6 },
      rare: 0.7
    },
    tortoise: {
      f: { garden: 1.4, tallgrass: 0.8, water: 0.6, mushroom: 1, shade: 1 },
      day: 1,
      night: 0.6,
      wx: { rain: 1.5, fog: 1.2 },
      rare: 0.45
    },
    hamster: {
      f: { lamp: 2, field: 1.6, garden: 0.8, metal: 1 },
      day: 0.9,
      night: 0.9,
      wx: { rain: 2.2, wind: 1.4, clear: 0.7 },
      rare: 0.4
    },
    crab: { f: { sand: 3, rock: 1.5, water: 0.6 }, day: 1, night: 0.9, wx: { rain: 1.2 }, rare: 0.6 },
    raven: {
      f: { tree: 1.2, shade: 1.4, field: 1, statue: 0.8 },
      day: 0.12,
      night: 2.2,
      wx: { fog: 2, rain: 1.2 },
      rare: 0.6
    },
    firefly: {
      f: { tallgrass: 1.2, flowers: 1.4, water: 0.8, reeds: 1.2, lamp: 1 },
      day: 0.1,
      night: 2.4,
      wx: { clear: 1.3, rain: 0.3, fog: 0.8 },
      rare: 0.35
    },
    /* chapter 3: the Whistling Pass */
    kestrip: { f: { open: 2, rock: 1, bridge: 1.2, chime: 1.5, tree: 0.5 }, day: 1.3, night: 0.3, wx: { wind: 2.4, clear: 1.2, rain: 0.6 }, rare: 0.75 },
    pufflet: { f: { flowers: 2.4, open: 1.2, tallgrass: 1, garden: 0.8 }, day: 1.2, night: 0.4, wx: { wind: 2.8, clear: 1.2, rain: 0.4 }, rare: 0.8 },
    cragnib: { f: { rock: 2.8, wall: 1.2, path: 0.5, open: 0.6 }, day: 1.1, night: 0.7, wx: { wind: 1.2, rain: 0.8 }, rare: 0.7 },
    pebblehop: { f: { rock: 2, tallgrass: 1.2, field: 1, sand: 0.8 }, day: 0.9, night: 1, wx: { fog: 1.2, rain: 0.7 }, rare: 0.85 },
    breezelet: { f: { tallgrass: 1.6, open: 1.2, rock: 0.8, chime: 1.4, bridge: 0.8 }, day: 1, night: 0.8, wx: { wind: 2.2, fog: 1.2 }, rare: 0.6 },
    skyfin: { f: { water: 2.4, bridge: 2, reeds: 0.8, open: 0.6 }, day: 1, night: 0.6, wx: { wind: 2.4, rain: 1.6 }, rare: 0.4 },
    voltmoth: { f: { lamp: 3, chime: 1.2, flowers: 0.8, metal: 1 }, day: 0.15, night: 2.4, wx: { wind: 1.6, rain: 1.8, clear: 0.8 }, rare: 0.35 },
    mossram: { f: { tallgrass: 1.6, rock: 1.4, garden: 1, field: 1.2, tree: 0.6 }, day: 1, night: 0.7, wx: { rain: 1.4, fog: 1.1 }, rare: 0.45 }
  },
  features: {
    props: {
      tree: 'tree',
      pine: 'tree',
      cherry_tree: 'tree',
      fruit_tree: 'fruit',
      bush: 'bush',
      butterfly_bush: 'bush',
      rock: 'rock',
      stone_wall_h: 'wall',
      mushroom_ring: 'mushroom',
      flower_patch: 'flowers',
      flowerbed: 'flowers',
      reeds: 'reeds',
      lilypad: 'lilypad',
      statue: 'statue',
      lamp: 'lamp',
      lantern_string: 'lamp',
      windchime: 'chime',
      log_pile: 'warm',
      campfire: 'warm',
      fireplace: 'warm',
      barrel: 'metal',
      cart: 'metal',
      mailbox: 'metal',
      fence_h: 'field',
      fence_v: 'field',
      hay_bale: 'field',
      garden_bed: 'garden',
      pumpkin: 'garden',
      well: 'metal'
    },
    tiles: {
      water: 'water',
      sand: 'sand',
      bridge: 'bridge',
      tallgrass: 'tallgrass',
      flowers: 'flowers',
      path: 'path',
      cobble: 'path'
    }
  },
  defaults: { count: 5, countTown: 4, level: [1, 3], hidden: 0.22 }
};
