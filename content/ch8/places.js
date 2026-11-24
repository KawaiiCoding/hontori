/*
 * ch8/places.js
 * Job: every map spot chapter 8 names (people, quest targets, trigger boxes), in one table, so the chapter follows
 * its maps by changing this file only. Each entry is plain data: a place { map, x, y, dir } or a box
 * { map, x: [x0, x1], y: [y0, y1] }. The comment on each group names the spot of the maps lane
 * (content/ch8/maps/, `spots`) it follows. The watchers puzzle's own geometry is in ./puzzles.js.
 */

export default {
  /* chapter 7 places: Brasa in the Ember Crucible (ch7 place ecBrasa); Cinderreach's south opening to the
     Mothwood (content/ch7/maps/links.js) */
  ecBrasa: { map: 'ember_crucible', x: 15, y: 7, dir: 0 },
  crMothGate: { map: 'cinderreach', x: 29, y: 41 },

  /* the Mothwood: the first moths by the north edge (edge, moths[0]), Old Wick in the glade halfway (glade),
     Smudge by the pool (pool), the south edge toward Duskmere (south) */
  mwMothsBox: { map: 'mothwood', x: [19, 25], y: [4, 8] },
  mwWick: { map: 'mothwood', x: 7, y: 23, dir: 3 },
  mwPup: { map: 'mothwood', x: 36, y: 30, dir: 2 },
  mwSouth: { map: 'mothwood', x: 21, y: 52 },

  /* Duskmere: the square (square), the captain and the cloak beside him (captain, captainSide[1]), Nox in the
     square (nox), the crater gate and the watchers' rim (craterGate, watchStart), Hollow Moon's door (hallDoor) */
  dmSquare: { map: 'duskmere', x: 27, y: 20 },
  dmNox: { map: 'duskmere', x: 29, y: 21, dir: 0 },
  dmCaptain: { map: 'duskmere', x: 28, y: 18, dir: 0 },
  dmCloak: { map: 'duskmere', x: 30, y: 17, dir: 0 },
  dmCraterGate: { map: 'duskmere', x: 29, y: 45 },
  dmRimBox: { map: 'duskmere', x: [28, 31], y: [44, 46] },
  dmHallDoor: { map: 'duskmere', x: 41, y: 42 },

  /* interiors: spots keeper, people. h1 Pella, Cobb and Smudge; h2 Linnet; h3 Edda (the wardrobe hides the
     cellar stair); h4 stands empty until Merrit lodges there */
  tavernKeeper: { map: 'duskmere_tavern', x: 13, y: 3, dir: 0 },
  shopKeeper: { map: 'duskmere_shop', x: 7, y: 3, dir: 0 },
  h1Pella: { map: 'duskmere_h1', x: 5, y: 4, dir: 0 },
  h1Cobb: { map: 'duskmere_h1', x: 10, y: 5, dir: 0 },
  h1Smudge: { map: 'duskmere_h1', x: 3, y: 8, dir: 3 },
  h2Linnet: { map: 'duskmere_h2', x: 4, y: 5, dir: 0 },
  h3Edda: { map: 'duskmere_h3', x: 3, y: 4, dir: 0 },
  h4Merrit: { map: 'duskmere_h4', x: 5, y: 5, dir: 0 },

  /* the Lantern Room: teacher */
  lanternKeeper: { map: 'lantern_room', x: 7, y: 3, dir: 0 },

  /* Hollow Moon: Nox in her ring (warden) */
  hmNox: { map: 'hollow_moon', x: 15, y: 7, dir: 0 }
};
