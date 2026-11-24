/*
 * ch5/maps/index.js
 * Job: the maps of chapter 5 (the City That Never Sleeps) as data, read by game/maps/index.js (the format is described in its header).
 * maps: one file per map. links and states: links.js. text: the map and place names.
 */

import coast_road from './coast_road.js';
import coilhaven from './coilhaven.js';
import sparkmoor from './sparkmoor.js';
import coilhaven_tavern from './coilhaven_tavern.js';
import coilhaven_shop from './coilhaven_shop.js';
import coilhaven_h1 from './coilhaven_h1.js';
import coilhaven_h2 from './coilhaven_h2.js';
import coilhaven_h3 from './coilhaven_h3.js';
import coilhaven_h4 from './coilhaven_h4.js';
import tinker_shed from './tinker_shed.js';
import storm_works from './storm_works.js';
import joins from './links.js';
import text from './text.en.js';

export default {
  maps: [coast_road, coilhaven, sparkmoor, coilhaven_tavern, coilhaven_shop, coilhaven_h1, coilhaven_h2, coilhaven_h3, coilhaven_h4, tinker_shed, storm_works],
  links: joins.links,
  states: joins.states,
  text
};
