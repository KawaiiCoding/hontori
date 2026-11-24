/*
 * ch7/places.js
 * Job: every map spot chapter 7 names (people, quest targets, trigger boxes, puzzle parts), in one table, so the
 * chapter follows its maps by changing this file only. Each entry is plain data: a place { map, x, y, dir } or
 * a box { map, x: [x0, x1], y: [y0, y1] }. The comment on each group names the spot of the maps lane
 * (content/ch7/maps/, `spots`) it matches.
 */

export default {
  /* Stonehollow (chapter 6 map): the east road out to the Ash Road (chapter 6 place shEastRoad) */
  shEastRoad: { map: 'stonehollow', x: 48, y: 20 },

  /* the Ash Road: the lava stream before Harrow's bridge (spot bridgeWest), the lookout halfway (spot lookout,
     with Ottar beside the seat), the east gate down to Cinderreach (spot eastGate) */
  arBridgeWest: { map: 'ash_road', x: 17, y: 14 },
  arLookout: { map: 'ash_road', x: [35, 39], y: [3, 6] },
  arCamp: { map: 'ash_road', x: 39, y: 6, dir: 2 },
  arEast: { map: 'ash_road', x: 61, y: 20 },

  /* Cinderreach: the square (spots square, cole, mira) and the box around it; the lava crossing before the
     Crucible (spots cool, coolFrom) and the box the player stands in to cool it; the carving (spot carvings) with
     Kell beside it until the court is open; the Crucible door (spot crucibleDoor); the Hearth gate (spot
     hearthGate); the Smoke House door (school door) */
  crSquare: { map: 'cinderreach', x: 29, y: 23 },
  crSquareBox: { map: 'cinderreach', x: [26, 33], y: [21, 25] },
  crCole: { map: 'cinderreach', x: 28, y: 24, dir: 1 },
  crMira: { map: 'cinderreach', x: 31, y: 24, dir: 1 },
  crCoolFrom: { map: 'cinderreach', x: 29, y: 14 },
  crCoolBox: { map: 'cinderreach', x: [28, 31], y: [14, 15] },
  crCarving: { map: 'cinderreach', x: 32, y: 15 },
  crKell: { map: 'cinderreach', x: 34, y: 15, dir: 2 },
  crCrucibleDoor: { map: 'cinderreach', x: 29, y: 11 },
  crHearthGate: { map: 'cinderreach', x: 56, y: 22 },
  crSmokeDoor: { map: 'cinderreach', x: 16, y: 31 },

  /* interiors (spots keeper, people, guests) */
  tavernKeeper: { map: 'cinderreach_tavern', x: 13, y: 3, dir: 0 },
  tavernCole: { map: 'cinderreach_tavern', x: 5, y: 5, dir: 3 },
  tavernMira: { map: 'cinderreach_tavern', x: 9, y: 6, dir: 2 },
  shopKeeper: { map: 'cinderreach_shop', x: 7, y: 3, dir: 0 },
  h1Sefa: { map: 'cinderreach_h1', x: 5, y: 4, dir: 0 },
  h2Marro: { map: 'cinderreach_h2', x: 4, y: 5, dir: 0 },
  h3Tilde: { map: 'cinderreach_h3', x: 3, y: 4, dir: 0 },
  h3Rusk: { map: 'cinderreach_h3', x: 10, y: 7, dir: 2 },
  h4Juno: { map: 'cinderreach_h4', x: 5, y: 5, dir: 0 },

  /* the Smoke House: the keeper by the fire (spot teacher) */
  smokeKeeper: { map: 'smoke_house', x: 7, y: 3, dir: 0 },

  /* the Hearth Below: the nest (spots nestFront, nestSide; the cat_bed prop at 20,3 is the nest) and the box in
     front of it; Brasa in the east nook (spot nook) until the nest is found; the passage she comes up (spot
     passage) */
  hbNest: { map: 'hearth_below', x: 20, y: 5 },
  hbNestBox: { map: 'hearth_below', x: [18, 22], y: [4, 6] },
  hbBrasa: { map: 'hearth_below', x: 36, y: 14, dir: 2 },
  hbPassage: [20, 8],

  /* the Ember Crucible: Kell (spot apprentice), Brasa in the ring (spot warden) */
  ecKell: { map: 'ember_crucible', x: 15, y: 16, dir: 0 },
  ecBrasa: { map: 'ember_crucible', x: 15, y: 7, dir: 0 }
};
