/*
 * ch9/places.js
 * Job: every map spot chapter 9 names (people, quest targets, trigger boxes, puzzle parts), in one table, so the
 * chapter follows its maps by changing this file only. Each entry is plain data: a place { map, x, y, dir } or
 * a box { map, x: [x0, x1], y: [y0, y1] }; a bare [x, y] is a tile of the map the running scene is on. The
 * comment on each group names the spot the maps lane (content/ch9/maps/, `spots`) should have; the lead aligns
 * the numbers once those maps exist.
 */

export default {
  /* the Golden Gate: the box in front of it (spot gateFront), Vael inside the gate (spot court) */
  ggGate: { map: 'golden_gate', x: 19, y: 12 },
  ggGateBox: { map: 'golden_gate', x: [17, 22], y: [11, 13] },
  ggVael: { map: 'golden_gate', x: 19, y: 6, dir: 0 },

  /* Goldmere: the grand plaza (spot plaza) and the box around it, Vael by the fountain (spot vael), Cole and Mira
     (spots cole, mira), the family (spots parents, lisel), the Glasshouse door, the west gate to the Mirror
     Gardens (spot westGate), the Halo Court door (spot courtDoor), the garden gate (spot gardenGate) */
  gmPlaza: { map: 'goldmere', x: 35, y: 21 },
  gmPlazaBox: { map: 'goldmere', x: [31, 40], y: [18, 24] },
  gmVael: { map: 'goldmere', x: 36, y: 15, dir: 0 },
  gmCole: { map: 'goldmere', x: 34, y: 20, dir: 3 },
  gmMira: { map: 'goldmere', x: 37, y: 20, dir: 2 },
  gmMom: { map: 'goldmere', x: 30, y: 26, dir: 3 },
  gmDad: { map: 'goldmere', x: 31, y: 26, dir: 3 },
  gmLisel: { map: 'goldmere', x: 41, y: 26, dir: 2 },
  gmGlassDoor: { map: 'goldmere', x: 60, y: 19 },
  gmGardensGate: { map: 'goldmere', x: 3, y: 25 },
  gmHaloDoor: { map: 'goldmere', x: 36, y: 12 },
  gmGardenGate: { map: 'goldmere', x: 68, y: 10 },

  /* interiors (spots keeper, people) */
  tavernKeeper: { map: 'goldmere_tavern', x: 13, y: 3, dir: 0 },
  shopKeeper: { map: 'goldmere_shop', x: 7, y: 3, dir: 0 },
  h1Benedek: { map: 'goldmere_h1', x: 5, y: 4, dir: 0 },
  h2Hester: { map: 'goldmere_h2', x: 4, y: 5, dir: 0 },
  h2Child: { map: 'goldmere_h2', x: 10, y: 5, dir: 2 },
  h3Rowe: { map: 'goldmere_h3', x: 3, y: 4, dir: 0 },
  h4Perrin: { map: 'goldmere_h4', x: 5, y: 5, dir: 0 },

  /* the Glasshouse: the keeper (spot teacher) */
  glassKeeper: { map: 'glasshouse', x: 7, y: 3, dir: 0 },

  /* the Mirror Gardens: Lys by the entry (spot lys); the beam and mirrors are in ./puzzles.js */
  mgLys: { map: 'mirror_gardens', x: 35, y: 13, dir: 2 },

  /* Halo Court: Aurel (spot warden), Vael beside her (spot vael), Lys (spot apprentice), the four ring holders
     (spot holders), Cole and Mira (spots cole, mira), the family in the west stands (spots parents, lisel), the
     Coilhaven crowd in the east stands (spots workers, pim) */
  hcAurel: { map: 'halo_court', x: 17, y: 7, dir: 0 },
  hcVael: { map: 'halo_court', x: 19, y: 7, dir: 0 },
  hcLys: { map: 'halo_court', x: 17, y: 19, dir: 1 },
  hcTh: [{ map: 'halo_court', x: 10, y: 9, dir: 3 }, { map: 'halo_court', x: 24, y: 9, dir: 2 }, { map: 'halo_court', x: 10, y: 17, dir: 3 }, { map: 'halo_court', x: 24, y: 17, dir: 2 }],
  hcCole: { map: 'halo_court', x: 13, y: 17, dir: 1 },
  hcMira: { map: 'halo_court', x: 21, y: 17, dir: 1 },
  hcMom: { map: 'halo_court', x: 6, y: 11, dir: 3 },
  hcDad: { map: 'halo_court', x: 6, y: 12, dir: 3 },
  hcLisel: { map: 'halo_court', x: 6, y: 14, dir: 3 },
  hcCrowd1: { map: 'halo_court', x: 28, y: 14, dir: 2 },
  hcCrowd2: { map: 'halo_court', x: 28, y: 16, dir: 2 },
  hcPim: { map: 'halo_court', x: 28, y: 13, dir: 2 },

  /* Vael's garden: the lawn by the gate (spots gate, pond) from where the rows of covered jars (spot jars) are
     seen, and the box there; Wendel on the path (spot vael) */
  vgJarsBox: { map: 'vael_garden', x: [4, 9], y: [10, 15] },
  vgWendel: { map: 'vael_garden', x: 22, y: 12, dir: 2 }
};
