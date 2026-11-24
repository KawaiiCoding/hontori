/*
 * ch4/maps/index.js
 * Job: the maps of chapter 4 (the Bell Under the Tide) as data, read by game/maps/index.js (the format is described in its header).
 * maps: one file per map. links and states: links.js. text: the map and place names.
 */

import ferry from './ferry.js';
import tidewell from './tidewell.js';
import saltmarsh from './saltmarsh.js';
import sunken_stair from './sunken_stair.js';
import tidewell_tavern from './tidewell_tavern.js';
import tidewell_shop from './tidewell_shop.js';
import tidewell_h1 from './tidewell_h1.js';
import tidewell_h2 from './tidewell_h2.js';
import tidewell_h3 from './tidewell_h3.js';
import tidewell_h4 from './tidewell_h4.js';
import lullaby_boat from './lullaby_boat.js';
import deepbell_hall from './deepbell_hall.js';
import joins from './links.js';
import text from './text.en.js';

export default {
  maps: [ferry, tidewell, saltmarsh, sunken_stair, tidewell_tavern, tidewell_shop, tidewell_h1, tidewell_h2, tidewell_h3, tidewell_h4, lullaby_boat, deepbell_hall],
  links: joins.links,
  states: joins.states,
  text
};
