/*
 * ch9/index.js
 * Job: chapter 9, The Golden City: the Golden Gate that opens to seven rings, Goldmere and Orlen Vael, kind and on
 * stage all chapter (his welcome, his offer to Cole, his box at the tournament), the Glasshouse (Mirror Sigil),
 * the Mirror Gardens, Mom, Dad and Lisel in the plaza (Lisel sees, willingly), Vael's garden of covered jars
 * (the plant of the final secret), and the Ring Tournament of Halo Court: four rounds under the ring rule pure,
 * a save point each, Cole's choice in the final, and the crowd that chapter 5's choice brings. The Halo Ring is
 * the eighth vote. Flags read by later chapters: c9:jars, c9:cole, c9:lisel, c9:page, c9:ring, c9:complete.
 * The maps are the maps lane's folder (./maps/), loaded by game/maps/. Spots: ./places.js.
 */

import people from './people.js';
import events from './events.js';
import scripts from './scripts.js';
import quests from './quests.js';
import trainers from './trainers.js';
import trials from './trials.js';
import tournaments from './tournaments.js';
import shops from './shops.js';
import goods from './goods.js';
import wild from './wild.js';
import interactions from './interactions.js';
import puzzles from './puzzles.js';
import items from './items.js';
import text from './text.en.js';
import mapFolder from './maps/index.js';

export default {
  id: 'ch9',
  title: 'ch9.quest.halo',
  people,
  events,
  scripts,
  quests,
  trainers,
  trials,
  tournaments,
  shops,
  goods,
  wild,
  interactions,
  puzzles,
  items,
  maps: mapFolder.maps,
  links: mapFolder.links,
  text: { ...mapFolder.text, ...text }
};
