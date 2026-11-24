/*
 * ch5/index.js
 * Job: chapter 5, The City That Never Sleeps: the coast road north from Tidewell (opened by the Tide Ring),
 * Coilhaven and its lamps of trapped sparks, the Tinker's Shed, the choice in the square, the Token's secret,
 * Master Ashfield and Cole, the grey cloaks at the north gate, Sparkmoor and the circuit door, and the Storm
 * Works gauntlet for the Spark Ring. Flags read by later chapters: c5:spoke or c5:quiet, c5:token
 * ('kept' or 'dropped'), c5:cloaks, c5:ashfield.
 * The maps are the maps lane's folder (./maps/), loaded by game/maps/.
 */

import people from './people.js';
import events from './events.js';
import scripts from './scripts.js';
import quests from './quests.js';
import trainers from './trainers.js';
import trials from './trials.js';
import shops from './shops.js';
import goods from './goods.js';
import gauntlets from './gauntlets.js';
import wild from './wild.js';
import interactions from './interactions.js';
import puzzles from './puzzles.js';
import items from './items.js';
import text from './text.en.js';
import mapFolder from './maps/index.js';

export default {
  id: 'ch5',
  title: 'ch5.quest.spark',
  people,
  events,
  scripts,
  quests,
  trainers,
  trials,
  shops,
  goods,
  gauntlets,
  wild,
  interactions,
  puzzles,
  items,
  maps: mapFolder.maps,
  links: mapFolder.links,
  text: { ...mapFolder.text, ...text }
};
