/*
 * ch4/places.js
 * Job: every map spot chapter 4 names (people, quest targets, trigger boxes), in one table, so the chapter follows
 * its maps by changing this file only. Each entry is plain data: a place { map, x, y, dir } or a box
 * { map, x: [x0, x1], y: [y0, y1] }. The comments name the spot of the maps lane (content/ch4/maps/) it follows.
 */

export default {
  /* Kitewick (chapter 3 map): the ferry jetty door, links.js */
  kwJetty: { map: 'kitewick', x: 10, y: 26 },

  /* the ferry deck: spot ferryman */
  ferryman: { map: 'ferry', x: 10, y: 10, dir: 0 },

  /* Tidewell: Maren beside the flooded causeway (causewayWest), the quay, the fishing pier, the gates */
  tdMaren: { map: 'tidewell', x: 47, y: 24, dir: 3 },
  tdCauseway: { map: 'tidewell', x: 48, y: 23 },
  tdNell: { map: 'tidewell', x: 12, y: 28, dir: 1 },
  tdJory: { map: 'tidewell', x: 34, y: 28, dir: 0 },
  tdDoran: { map: 'tidewell', x: 41, y: 35, dir: 0 },
  tdBoat: { map: 'tidewell', x: 16, y: 34 },
  tdHome: { map: 'tidewell', x: 10, y: 16 },
  tdWest: { map: 'tidewell', x: 3, y: 20 },

  /* interiors: spots keeper, teacher, lisel, people */
  tavernKeeper: { map: 'tidewell_tavern', x: 3, y: 3, dir: 0 },
  shopKeeper: { map: 'tidewell_shop', x: 11, y: 3, dir: 0 },
  boatKeeper: { map: 'lullaby_boat', x: 7, y: 3, dir: 0 },
  h1Lisel: { map: 'tidewell_h1', x: 10, y: 5, dir: 0 },
  h1Mira: { map: 'tidewell_h1', x: 5, y: 4, dir: 0 },
  h2Doran: { map: 'tidewell_h2', x: 4, y: 5, dir: 0 },
  h2Jory: { map: 'tidewell_h2', x: 10, y: 5, dir: 0 },
  h3Sava: { map: 'tidewell_h3', x: 3, y: 4, dir: 0 },
  h4Nell: { map: 'tidewell_h4', x: 5, y: 5, dir: 0 },

  /* the Saltmarsh: Hollis at the marsh rest (rest), the lookout on the heron islet (heron), the stair gate */
  smHollis: { map: 'saltmarsh', x: 25, y: 22, dir: 2 },
  smLookout: { map: 'saltmarsh', x: [24, 28], y: [7, 9] },
  smStairGate: { map: 'saltmarsh', x: 14, y: 34 },

  /* the Sunken Stair: Isk on the first landing (top), the bell court (bellFront) */
  ssIsk: { map: 'sunken_stair', x: 17, y: 6, dir: 0 },
  ssBell: { map: 'sunken_stair', x: [11, 17], y: [34, 36] },
  ssBellFront: { map: 'sunken_stair', x: 14, y: 35 },

  /* Deepbell Hall, once drained: spots warden, apprentice */
  hallMaren: { map: 'deepbell_hall', x: 15, y: 7, dir: 0 },
  hallIsk: { map: 'deepbell_hall', x: 15, y: 16, dir: 0 }
};
