/*
 * game/panels/index.js  (Hontori: panels)
 * Job: install Hontori's panels: the party, its moves, the Wand Sanctum, the spell loadout, the
 * Wand Memory, the wand's section of the Menu, the World tab of the map, the first-touch guide
 * card, and the title screen's and HUD's words taken from text ids.
 *
 * Public API:
 *   install(game)   after the lanes (items, time, Hontori's party and battles), before the
 *                   stand-ins, game.save.load() and game.start()
 *
 * What it registers:
 *   (its words are in content/shared/text.en.js, the world map's data in content/shared/world.js)
 *   panel           "party", "sanctum", "spells", "memory" (screens.js)
 *   system          "guide"; story.command "helper" (guide.js)
 *   it extends      panel "settings" (the wand section) and panel "areamap" (the World tab)
 *   it sets         game.theme.title and game.theme.words from text ids (words.js)
 */

import text from '../../content/shared/text.en.js';
import { Roster } from './roster.js';
import { installGuide } from './guide.js';
import { installScreens } from './screens.js';
import { installWorldTab } from './worldmap.js';
import { applyThemeWords } from './words.js';
import { SANCTUM_WORDS } from '../features/sanctum.js';

export function install(game) {
  /* the words of the sealed Sanctum stand in until the content has its own */
  const roster = new Roster(game, { ...SANCTUM_WORDS, ...text });
  applyThemeWords(game, roster);
  const guide = installGuide(game, roster);
  installScreens(game, roster, guide);
  if (!installWorldTab(game, roster, guide)) console.warn('panels: there is no area map; the World tab waits for it');
  return { roster, guide };
}
