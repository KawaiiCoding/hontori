/*
 * DebugTools.js
 * Job: test helpers that exist only with ?debug=1: keys to change the hour and the weather,
 * the content check of every map at start, and the game object on window for the console.
 * It is registered as a system, so it also shows the system contract in use.
 *
 * Public API (registry kind "system"):
 *   new DebugTools()
 *   start(game)      T: three hours later.  R: next weather.  window.game = game
 *   problems         what the content checker found at start (array of strings)
 */

import { checkMaps } from '../core/check.js';
import { TileMap } from './TileMap.js';
import { WEATHERS } from './Environment.js';

export class DebugTools {
  problems = [];

  start(game) {
    window.game = game;
    game.debug = this;
    const maps = [...game.registry.all('map')].map((description) => new TileMap(description, game.art));
    this.problems = checkMaps(maps, game.art);
    window.addEventListener('keydown', (event) => {
      const env = game.scenes.top && game.scenes.top.env;
      if (!env) return;
      const key = event.key.toLowerCase();
      if (key === 't') env.setTime(env.time + 3);
      if (key === 'r') env.setWeather(WEATHERS[(WEATHERS.indexOf(env.weather) + 1) % WEATHERS.length]);
    });
  }
}
