/*
 * shared/index.js
 * Job: the shared content folder, loaded before every chapter: items, voices, maps, kinds, spells, money,
 * forage, waters, wild habitats, shops, prop interactions, helper cards, scripts, the capsule machines and the Hontori
 * extensions.
 */

import items from './items.js';
import voices from './voices.js';
import maps from './maps.js';
import kinds from './hontori.js';
import spells from './spells.js';
import money from './money.js';
import forage from './forage.js';
import waters from './waters.js';
import wild from './wild.js';
import shops from './shops.js';
import interactions from './interactions.js';
import helpers from './helpers.js';
import pickup from './pickup.js';
import scripts from './scripts.js';
import extensions from './extensions.js';
import capsules from './capsules.js';
import world from './world.js';
import text from './text.en.js';
import kindText from './text.kinds.en.js';
import capsuleText from './text.capsules.en.js';

export default {
  id: 'shared', items, voices, maps, kinds, spells, money, forage, waters, wildHabitats: wild, goods: shops.goods, shopFlow: shops.flow,
  interactions: { ...interactions.handlers, ...capsules.interactions }, aliases: { ...interactions.aliases, ...capsules.aliases },
  helpers, pickup, scripts, extensions, world, capsules,
  text: { ...text, ...kindText, ...capsuleText },
};
