/*
 * index.js  (Hontori: time)
 * Job: install the time lane with Hontori's choices: its daily weather, dawn, how far the player
 * sees on the area map, the map's look, the Map button that needs the Map item (world rule 47),
 * the wand's mana, and the kite's wide view (the "revealMap" extension).
 *
 * Public API:
 *   install(game)   call in main.js before game.save.load() and game.start(); returns the time service
 *
 * What it registers beyond systems/time/index.js and mana.js:
 *   story.command  "ext:revealMap"   { ext: 'revealMap', radius }   reveal a circle around the player
 */

import { install as installTime } from '../../systems/time/index.js';
import { offer } from '../../systems/time/links.js';
import { mapStyle } from './mapStyle.js';
import { installMana } from './mana.js';
import { t } from '../text.js';

/* how often each weather is the weather of a day; snow waits for a winter story */
const DAILY_WEATHER = { clear: 5, wind: 2, rain: 2, fog: 1, snow: 0 };
const DAWN = 5;
const SEEN_RADIUS = 6;

export function install(game) {
  const { registry } = game;
  const hasMap = () => {
    const service = registry.get('service', 'story');
    if (!service || typeof service.test !== 'function') return true;
    try {
      return !!service.test({ has: 'map' });
    } catch (error) {
      console.warn('time: the map check failed', error);
      return true;
    }
  };

  const time = installTime(game, {
    dawn: DAWN,
    weathers: DAILY_WEATHER,
    revealRadius: SEEN_RADIUS,
    areaMap: {
      style: mapStyle,
      icon: 'map',
      label: t('shared.ui.map.label'),
      hint: t('shared.ui.map.hint'),
      order: 40,
      /* the button is dimmed until the Map is carried; a tap then says so in one short line */
      canOpen: (quiet) => {
        if (hasMap()) return true;
        if (!quiet) game.ui.toast(t('shared.ui.map.none'));
        return false;
      },
      refreshOn: ['inventory:change'],
    },
  });
  installMana(game);

  offer(registry, 'story.command', 'ext:revealMap', (node) => {
    const world = time.world;
    if (!world || !world.map || world.map.indoor) return;
    time.explored.reveal(world.map, world.player.tx, world.player.ty, node.radius);
  });
  return time;
}
