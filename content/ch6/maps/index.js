/*
 * ch6/maps/index.js
 * Job: the maps of chapter 6 (What the Stones Remember) as data, read by game/maps/index.js (the format is described in its header).
 * maps: one file per map. links and states: links.js. text: the map and place names.
 */

import mountain_road from './mountain_road.js';
import stonehollow from './stonehollow.js';
import drum_circle from './drum_circle.js';
import old_quarry from './old_quarry.js';
import listening_cave from './listening_cave.js';
import stonehollow_tavern from './stonehollow_tavern.js';
import stonehollow_shop from './stonehollow_shop.js';
import stonehollow_h1 from './stonehollow_h1.js';
import stonehollow_h2 from './stonehollow_h2.js';
import stonehollow_h3 from './stonehollow_h3.js';
import stonehollow_h4 from './stonehollow_h4.js';
import bedrock_hall from './bedrock_hall.js';
import joins from './links.js';
import text from './text.en.js';

export default {
  maps: [mountain_road, stonehollow, drum_circle, old_quarry, listening_cave, stonehollow_tavern, stonehollow_shop, stonehollow_h1, stonehollow_h2, stonehollow_h3, stonehollow_h4, bedrock_hall],
  links: joins.links,
  states: joins.states,
  text
};
