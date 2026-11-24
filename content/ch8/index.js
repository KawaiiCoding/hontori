/*
 * ch8/index.js
 * Job: chapter 8, The Town With No Lamps: Brasa's flame (c8:flame) and the Mothwood west of Cinderreach (open once
 * chapter 7 is complete), Old Wick and Smudge, Duskmere where it is always evening, Tallow's favour shop, the
 * Lantern Room (Lantern Sigil), the grey watchers of Hollow Moon, Warden Nox Ardley and the cellar of hidden
 * hontori, the Council captain's attack fought side by side (mode ally), Merrit (the grey cloak from Mossgrove)
 * breaking the Sanctum seal (c8:unseal) and drawing the Athenaeum stair, the moon lamps (twist unseen), the
 * Moon Ring under blind, and Lisel's letter.
 * Flags read by later chapters: c8:unseal, c8:merrit, c8:stair, c8:lisel, c8:ring, c8:complete.
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
import mapFolder from './maps/index.js';

export default {
  id: 'ch8',
  title: 'ch8.quest.moon',
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
  text: { ...mapFolder.text, ...text }
};
