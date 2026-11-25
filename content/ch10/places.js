/*
 * ch10/places.js
 * Job: every map spot chapter 10 names (people, quest targets, trigger boxes, shelves), in one table, so the
 * chapter follows its maps by changing this file only. Each entry is plain data: a place { map, x, y, dir } or
 * a box { map, x: [x0, x1], y: [y0, y1] }. The comment on each group names the `spots` of the maps lane
 * (content/ch10/maps/) the numbers come from; Vael's garden (chapter 9), Emberbrook's village and home are the
 * existing maps.
 */

export default {
  /* the Athenaeum Stair: foot 14,64; the turn halfway (lookout box around turn 6,55); the rest landing with
     Attendant Odile (attendant 7,35; the ramen cart 5,35 and the cot 3,39 are handled in ./interactions.js);
     the locked Council gate (gateFront 14,26, the box around it); the ivy over the side way (ivy 23,28) */
  stFoot: { map: 'athenaeum_stair', x: 14, y: 64 },
  stLookoutBox: { map: 'athenaeum_stair', x: [4, 8], y: [54, 56] },
  stAttendant: { map: 'athenaeum_stair', x: 7, y: 35, dir: 0 },
  stLock: { map: 'athenaeum_stair', x: 14, y: 26 },
  stLockBox: { map: 'athenaeum_stair', x: [12, 16], y: [25, 27] },
  stIvy: { map: 'athenaeum_stair', x: 22, y: 28 },

  /* the Athenaeum: the hall (spot hall), the great V (spot greatV: ten tiles in a V, the left arm 10,12 to 14,16,
     the right arm 22,12 to 18,16), the kid's place in it (greatVKid 16,17), Vael brought down (mercyVael 16,13),
     the readers' tables (readers) and the two outer council doors (councillors 6,8 and 26,8) for the other six
     Wardens, the council doors, and the shelf (the bookstack at 11,25) */
  ahHall: { map: 'athenaeum', x: 16, y: 20 },
  ahGreatV: { map: 'athenaeum', x: 16, y: 14 },
  ahVael: { map: 'athenaeum', x: 16, y: 13, dir: 0 },
  ahHighDoor: { map: 'athenaeum', x: 16, y: 7 },
  ahShelf: { map: 'athenaeum', x: 11, y: 25 },
  ahNox: { map: 'athenaeum', x: 10, y: 12, dir: 3 },
  ahWren: { map: 'athenaeum', x: 11, y: 13, dir: 3 },
  ahLisel: { map: 'athenaeum', x: 12, y: 14, dir: 3 },
  ahMira: { map: 'athenaeum', x: 13, y: 15, dir: 3 },
  ahMom: { map: 'athenaeum', x: 14, y: 16, dir: 3 },
  ahAurel: { map: 'athenaeum', x: 22, y: 12, dir: 2 },
  ahPim: { map: 'athenaeum', x: 21, y: 13, dir: 2 },
  ahMerrit: { map: 'athenaeum', x: 20, y: 14, dir: 2 },
  ahCole: { map: 'athenaeum', x: 19, y: 15, dir: 2 },
  ahDad: { map: 'athenaeum', x: 18, y: 16, dir: 2 },
  ahFern: { map: 'athenaeum', x: 9, y: 23, dir: 1 },
  ahZephra: { map: 'athenaeum', x: 11, y: 23, dir: 1 },
  ahMaren: { map: 'athenaeum', x: 23, y: 23, dir: 1 },
  ahVolta: { map: 'athenaeum', x: 25, y: 23, dir: 1 },
  ahHarrow: { map: 'athenaeum', x: 6, y: 8, dir: 0 },
  ahBrasa: { map: 'athenaeum', x: 26, y: 8, dir: 0 },

  /* the Council chambers (spot councillor): Brand in the east, Vesk in the west, Hale in the high chamber, whose
     north door (studyDoor 12,7) leads to Vael's study */
  ceBrand: { map: 'council_east', x: 10, y: 8, dir: 0 },
  cwVesk: { map: 'council_west', x: 10, y: 8, dir: 0 },
  chHale: { map: 'council_high', x: 17, y: 8, dir: 0 },
  chStudyDoor: { map: 'council_high', x: 12, y: 7 },

  /* Vael's study: Vael at his desk (spot vael 12,9), the shelf (the bookstack at 22,12) */
  vsVael: { map: 'vael_study', x: 12, y: 9, dir: 0 },
  vsShelf: { map: 'vael_study', x: 22, y: 12 },

  /* Vael's garden (chapter 9's spots): the gate (gate 3,12), where the kid arrives (kid 20,12), the lawn box
     before the rows, Vael on the path (vael 22,12), Mira, Lisel and Cole beside the kid (east of the hedge) */
  vgGate: { map: 'vael_garden', x: 3, y: 12 },
  vgArrive: { map: 'vael_garden', x: 20, y: 12, dir: 2 },
  vgLawnBox: { map: 'vael_garden', x: [4, 21], y: [10, 14] },
  vgVael: { map: 'vael_garden', x: 23, y: 12, dir: 2 },
  vgMira: { map: 'vael_garden', x: 21, y: 11, dir: 3 },
  vgLisel: { map: 'vael_garden', x: 22, y: 11, dir: 3 },
  vgCole: { map: 'vael_garden', x: 21, y: 13, dir: 3 },

  /* Emberbrook after the end: the four fair keepers in front of their stalls (village 7,25 / 13,25 / 39,25 /
     45,25), the green between them (a box), and the friends who come to the fair */
  fair1: { map: 'village', x: 7, y: 25, dir: 0 },
  fair2: { map: 'village', x: 13, y: 25, dir: 0 },
  fair3: { map: 'village', x: 39, y: 25, dir: 0 },
  fair4: { map: 'village', x: 45, y: 25, dir: 0 },
  fairGreenBox: { map: 'village', x: [4, 46], y: [26, 28] },
  fairMira: { map: 'village', x: 10, y: 27, dir: 3 },
  fairCole: { map: 'village', x: 36, y: 27, dir: 3 },
  fairWren: { map: 'village', x: 44, y: 27, dir: 2 },

  /* home (the fireplace is at 14,2): the kid arrives by the fire, Mom and Dad on either side */
  homeKid: { map: 'home', x: 15, y: 5, dir: 1 },
  homeMom: { map: 'home', x: 13, y: 6, dir: 3 },
  homeDad: { map: 'home', x: 17, y: 6, dir: 2 }
};
