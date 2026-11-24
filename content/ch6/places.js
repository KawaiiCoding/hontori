/*
 * ch6/places.js
 * Job: every map spot chapter 6 names (people, quest targets, trigger boxes), in one table, so the chapter follows
 * its maps by changing this file only. Each entry is plain data: a place { map, x, y, dir } or a box
 * { map, x: [x0, x1], y: [y0, y1] }. The comments name the spot of the maps lane (content/ch6/maps/) it follows.
 */

export default {
  /* Coilhaven (chapter 5 map): the north gate (links.js) */
  chGate: { map: 'coilhaven', x: 31, y: 2 },

  /* the mountain road: the halfway camp (camp, campSeat), the city lookout (lookout), the top (top) */
  mrCamp: { map: 'mountain_road', x: 6, y: 29, dir: 2 },
  mrLookout: { map: 'mountain_road', x: [33, 35], y: [38, 40] },
  mrTop: { map: 'mountain_road', x: 19, y: 3 },

  /* Stonehollow: the well square (square, crowd), Wren after the seal (wren), the hall door (hallDoor),
     the south gate (southGate), the quarry lane (westGate) */
  shSquareBox: { map: 'stonehollow', x: [26, 33], y: [22, 27] },
  shAgna: { map: 'stonehollow', x: 27, y: 25, dir: 1 },
  shWren: { map: 'stonehollow', x: 33, y: 24, dir: 2 },
  shHallDoor: { map: 'stonehollow', x: 30, y: 13 },
  shSouthGate: { map: 'stonehollow', x: 29, y: 41 },
  shWestGate: { map: 'stonehollow', x: 3, y: 13 },

  /* interiors: spots keeper, guests, people. h1 the Stonecutter's House, h2 the Carver's House, h3 the
     Miner's House, h4 the Weaver's House */
  tavernKeeper: { map: 'stonehollow_tavern', x: 13, y: 3, dir: 0 },
  tavernWren: { map: 'stonehollow_tavern', x: 5, y: 6, dir: 0 },
  shopKeeper: { map: 'stonehollow_shop', x: 7, y: 3, dir: 0 },
  h1Bask: { map: 'stonehollow_h1', x: 10, y: 5, dir: 0 },
  h2Agna: { map: 'stonehollow_h2', x: 4, y: 5, dir: 0 },
  h3Gorse: { map: 'stonehollow_h3', x: 3, y: 4, dir: 0 },
  h3Briar: { map: 'stonehollow_h3', x: 10, y: 7, dir: 0 },
  h4Mara: { map: 'stonehollow_h4', x: 5, y: 5, dir: 0 },
  h4Ottie: { map: 'stonehollow_h4', x: 10, y: 6, dir: 0 },

  /* the Drum Circle: teacher */
  drummer: { map: 'drum_circle', x: 11, y: 7, dir: 0 },

  /* the Old Quarry: Bask by the carts (foreman), the cave mouth (caveMouth) */
  oqBask: { map: 'old_quarry', x: 30, y: 17, dir: 2 },
  oqCaveMouth: { map: 'old_quarry', x: 21, y: 3 },

  /* the Listening Cave: the boulder room (puzzleEntry, boulders, pads, gate), the carvings chamber behind the
     gate (carvings, woman), the Fallen drift with its rockslide (drift) */
  lcTunnels: { map: 'listening_cave', x: 22, y: 17 },
  lcTunnelsBox: { map: 'listening_cave', x: [14, 30], y: [15, 17] },
  lcCarvings: { map: 'listening_cave', x: [15, 29], y: [3, 6] },
  lcDrift: { map: 'listening_cave', x: 36, y: 22 },

  /* Bedrock Hall: warden, apprentice, envoy, the door */
  hallHarrow: { map: 'bedrock_hall', x: 15, y: 7, dir: 0 },
  hallDunn: { map: 'bedrock_hall', x: 15, y: 16, dir: 0 },
  hallEnvoy: { map: 'bedrock_hall', x: 15, y: 17, dir: 1 },
  hallDoor: { map: 'bedrock_hall', x: 15, y: 20, dir: 1 }
};
