/*
 * ch4/index.js
 * Job: chapter 4, The Bell Under the Tide: the ferry from Kitewick's lake to Tidewell on the coast, the Lullaby
 * Boat and the Dream Veil, Warden Maren and her flooded hall, the Saltmarsh, the tide wheels of the Sunken Stair,
 * the drowned bell and Orlen Vael's old order, Mira and her mother Lisel, the Tide Ring.
 * The maps are the maps lane's folder (./maps/), loaded by game/maps/. Every map spot is in ./places.js.
 */

import people from './people.js';
import events from './events.js';
import scripts from './scripts.js';
import quests from './quests.js';
import trainers from './trainers.js';
import trials from './trials.js';
import shops from './shops.js';
import goods from './goods.js';
import wild from './wild.js';
import waters from './waters.js';
import interactions from './interactions.js';
import puzzles from './puzzles.js';
import items from './items.js';
import text from './text.en.js';
import lore from './lore.js';
import loreText from './text.lore.en.js';
import mapFolder from './maps/index.js';

export default {
  id: 'ch4',
  title: 'ch4.quest.tide',
  people,
  events,
  scripts,
  quests,
  trainers,
  trials,
  shops,
  goods,
  wild,
  waters,
  interactions,
  puzzles,
  items,
  maps: mapFolder.maps,
  links: mapFolder.links,
  lore,
  text: { ...mapFolder.text, ...text, ...loreText }
};
