/*
 * ch10/index.js
 * Job: chapter 10, A New Law, the finale (light and dark, levels 28 to 30): the Athenaeum Stair above Goldmere
 * (open to the tournament winner on c9:complete; the lookout, Attendant Odile's rest landing, the locked Council
 * gate passed by Merrit's sketch), the Athenaeum hall, the three Council chambers under three old rules
 * (noSwitch, noRest, blind), Grand Archmage Orlen Vael in his study (rule seal, two phases), the Great V over a
 * city that is asked first, mercy (the player's choice), the new law (the player writes its first line; the
 * hidden last line is undone), Vael's garden of jars opened, the ending picture story, the credits and home.
 * After the end the game stays open: the Emberbrook fair, a friendly duel with every Warden, rare hontori.
 * Flags read after the end: c10:mercy or c10:nomercy, c10:law_shared | c10:law_seen | c10:law_free,
 * c10:complete. The maps are the maps lane's folder (./maps/), loaded by game/maps/. Spots: ./places.js.
 */

import people from './people.js';
import events from './events.js';
import scripts from './scripts.js';
import quests from './quests.js';
import trainers from './trainers.js';
import trials from './trials.js';
import gauntlets from './gauntlets.js';
import shops from './shops.js';
import goods from './goods.js';
import wild from './wild.js';
import interactions from './interactions.js';
import items from './items.js';
import story from './story.js';
import credits from './credits.js';
import text from './text.en.js';
import lore from './lore.js';
import loreText from './text.lore.en.js';
import mapFolder from './maps/index.js';

export default {
  id: 'ch10',
  title: 'ch10.quest.law',
  people,
  events,
  scripts,
  quests,
  trainers,
  trials,
  gauntlets,
  shops,
  goods,
  wild,
  interactions,
  items,
  story,
  credits,
  maps: mapFolder.maps,
  links: mapFolder.links,
  lore,
  text: { ...mapFolder.text, ...text, ...loreText }
};
