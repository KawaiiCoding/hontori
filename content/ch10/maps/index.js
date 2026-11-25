/*
 * ch10/maps/index.js
 * Job: the maps of chapter 10 (A New Law) as data, read by game/maps/index.js (the format is described in its header).
 * maps: one file per map. links and states: links.js (the stair's foot in Goldmere, the shut ways, the fair in Emberbrook).
 * text: the map and place names.
 */

import athenaeum_stair from './athenaeum_stair.js';
import athenaeum from './athenaeum.js';
import council_east from './council_east.js';
import council_west from './council_west.js';
import council_high from './council_high.js';
import vael_study from './vael_study.js';
import joins from './links.js';
import text from './text.en.js';

export default {
  maps: [athenaeum_stair, athenaeum, council_east, council_west, council_high, vael_study],
  links: joins.links,
  states: joins.states,
  text
};
