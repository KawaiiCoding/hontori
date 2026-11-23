/*
 * ch3/maps/index.js
 * Job: the maps of chapter 3 as data, read by game/maps/index.js (the format is described in its header).
 * maps: one file per map. links and states: links.js. text: the map and place names.
 */

import whistling_pass from './whistling_pass.js';
import windrest from './windrest.js';
import kitewick from './kitewick.js';
import gale_bridges from './gale_bridges.js';
import kite_house from './kite_house.js';
import kitewick_tavern from './kitewick_tavern.js';
import kitewick_shop from './kitewick_shop.js';
import kitewick_h1 from './kitewick_h1.js';
import kitewick_h2 from './kitewick_h2.js';
import kitewick_h3 from './kitewick_h3.js';
import kitewick_h4 from './kitewick_h4.js';
import gale_loft from './gale_loft.js';
import joins from './links.js';
import text from './text.en.js';

export default {
  maps: [whistling_pass, windrest, kitewick, gale_bridges, kite_house, kitewick_tavern, kitewick_shop, kitewick_h1, kitewick_h2, kitewick_h3, kitewick_h4, gale_loft],
  links: joins.links,
  states: joins.states,
  text
};
