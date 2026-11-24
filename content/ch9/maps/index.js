/*
 * ch9/maps/index.js
 * Job: the maps of chapter 9 (The Golden City) as data, read by game/maps/index.js (the format is described in its header).
 * maps: one file per map. links and states: links.js. text: the map and place names.
 */

import golden_gate from './golden_gate.js';
import goldmere from './goldmere.js';
import mirror_gardens from './mirror_gardens.js';
import vael_garden from './vael_garden.js';
import goldmere_tavern from './goldmere_tavern.js';
import goldmere_shop from './goldmere_shop.js';
import goldmere_h1 from './goldmere_h1.js';
import goldmere_h2 from './goldmere_h2.js';
import goldmere_h3 from './goldmere_h3.js';
import goldmere_h4 from './goldmere_h4.js';
import glasshouse from './glasshouse.js';
import halo_court from './halo_court.js';
import joins from './links.js';
import text from './text.en.js';

export default {
  maps: [golden_gate, goldmere, mirror_gardens, vael_garden, goldmere_tavern, goldmere_shop, goldmere_h1, goldmere_h2, goldmere_h3, goldmere_h4, glasshouse, halo_court],
  links: joins.links,
  states: joins.states,
  text
};
