/*
 * ch8/maps/index.js
 * Job: the maps of chapter 8 (The Town With No Lamps) as data, read by game/maps/index.js (the format is described in its header).
 * maps: one file per map. links and states: links.js. text: the map and place names.
 */

import mothwood from './mothwood.js';
import duskmere from './duskmere.js';
import duskmere_tavern from './duskmere_tavern.js';
import duskmere_shop from './duskmere_shop.js';
import duskmere_h1 from './duskmere_h1.js';
import duskmere_h2 from './duskmere_h2.js';
import duskmere_h3 from './duskmere_h3.js';
import duskmere_h4 from './duskmere_h4.js';
import lantern_room from './lantern_room.js';
import hollow_moon from './hollow_moon.js';
import joins from './links.js';
import text from './text.en.js';

export default {
  maps: [mothwood, duskmere, duskmere_tavern, duskmere_shop, duskmere_h1, duskmere_h2, duskmere_h3, duskmere_h4, lantern_room, hollow_moon],
  links: joins.links,
  states: joins.states,
  text
};
