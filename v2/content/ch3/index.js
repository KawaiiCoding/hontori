/*
 * ch3/index.js
 * Job: chapter 3, the Whistling Pass: the road east of Mossgrove (opened with the full journey), Windrest and the
 * Kite House, Orlen Vael at the broken bridge, Kitewick and its small quests, Gale Loft and the Gale Ring.
 * The maps are the maps lane's folder (./maps/), loaded by game/maps/.
 */

import people from './people.js';
import events from './events.js';
import scripts from './scripts.js';
import quests from './quests.js';
import trainers from './trainers.js';
import trials from './trials.js';
import shops from './shops.js';
import wild from './wild.js';
import interactions from './interactions.js';
import puzzles from './puzzles.js';
import items from './items.js';
import text from './text.en.js';
import mapFolder from './maps/index.js';

export default { id: 'ch3', title: 'ch3.quest.gale', people, events, scripts, quests, trainers, trials, shops, wild, interactions, puzzles, items, stuckKites: [{ map: 'kitewick', at: [25, 25], until: 'c3:kite:note' }], maps: mapFolder.maps, links: mapFolder.links, text: { ...mapFolder.text, ...text } };
