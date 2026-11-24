/*
 * ch7/maps/index.js
 * Job: the maps of chapter 7 (Where the Chimney Leads) as data, read by game/maps/index.js (the format is described in its header).
 * maps: one file per map. links and states: links.js. text: the map and place names.
 */

import ash_road from './ash_road.js';
import cinderreach from './cinderreach.js';
import hearth_below from './hearth_below.js';
import cinderreach_tavern from './cinderreach_tavern.js';
import cinderreach_shop from './cinderreach_shop.js';
import cinderreach_h1 from './cinderreach_h1.js';
import cinderreach_h2 from './cinderreach_h2.js';
import cinderreach_h3 from './cinderreach_h3.js';
import cinderreach_h4 from './cinderreach_h4.js';
import smoke_house from './smoke_house.js';
import ember_crucible from './ember_crucible.js';
import joins from './links.js';
import text from './text.en.js';

export default {
  maps: [ash_road, cinderreach, hearth_below, cinderreach_tavern, cinderreach_shop, cinderreach_h1, cinderreach_h2, cinderreach_h3, cinderreach_h4, smoke_house, ember_crucible],
  links: joins.links,
  states: joins.states,
  text
};
