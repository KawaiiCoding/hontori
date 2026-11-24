/*
 * ch6/index.js
 * Job: chapter 6, What the Stones Remember: the mountain road north from Coilhaven (open once chapter 5 is
 * complete), Stonehollow, the Drum Circle and the Rally Rune, the Old Quarry, the Listening Cave and its
 * carvings (the old law is one lifetime old; Burr's notes; the woman with the fox), the dark boulder tunnels,
 * Apprentice Dunn, Warden Harrow's wand duel for the Stone Ring, THE LOSS (the Council seals the Sanctum;
 * the kid chooses five), Wren after the seal, and Harrow's bridge to the Ash Road.
 * Flags read by later chapters: c6:sealed, c6:bridge, c6:complete, c6:wrenhome. laterFlags: c8:unseal
 * (chapter 8 breaks the seal; the quest The Sleeping Sanctum waits for it).
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
import interactions from './interactions.js';
import puzzles from './puzzles.js';
import items from './items.js';
import text from './text.en.js';
import lore from './lore.js';
import loreText from './text.lore.en.js';
import mapFolder from './maps/index.js';

export default {
  id: 'ch6',
  title: 'ch6.quest.stone',
  people,
  events,
  scripts,
  quests,
  trainers,
  trials,
  shops,
  goods,
  wild,
  interactions,
  puzzles,
  items,
  laterFlags: ['c8:unseal'],
  maps: mapFolder.maps,
  links: mapFolder.links,
  lore,
  text: { ...mapFolder.text, ...text, ...loreText }
};
