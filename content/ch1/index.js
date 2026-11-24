/*
 * ch1/index.js
 * Job: chapter 1, Emberbrook: the first morning, the Academy, Wet Pawprints, the Elder's second cup, the south road.
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
import objects from './objects.js';
import pickups from './pickups.js';
import screens from './screens.js';
import rules from './rules.js';
import text from './text.en.js';
import lore from './lore.js';
import loreText from './text.lore.en.js';

export default { id: 'ch1', title: 'ch1.quest.academy', people, events, scripts, quests, trainers, trials, shops, wild, interactions, objects, pickups, screens, doors: rules.doors, rest: rules.rest, lore, text: { ...text, ...loreText } };
