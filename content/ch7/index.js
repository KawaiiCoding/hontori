/*
 * ch7/index.js
 * Job: chapter 7, Where the Chimney Leads: the Ash Road over Harrow's stone bridge (c6:bridge), Cinderreach and
 * its window lights, the Smoke House (Swift Step), the Hearth Below and the empty nest where the kid's own
 * hontori was born (the invitation to a name, Warden Brasa), Grandma's wand box by kite (her note, young Orlen
 * Vael's letter, her wand that still answers), Cole and Mira standing with the kid, the lava moat and the four
 * braziers of the Ember Crucible, Apprentice Kell, and the Flame Ring under the ring rule heat.
 * Flags read by later chapters: c7:nest, c7:box, c7:friends, c7:ring, c7:complete.
 * The maps are the maps lane's folder (./maps/), loaded by game/maps/. Spots: ./places.js.
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
  id: 'ch7',
  title: 'ch7.quest.flame',
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
  maps: mapFolder.maps,
  links: mapFolder.links,
  lore,
  text: { ...mapFolder.text, ...text, ...loreText }
};
