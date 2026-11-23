/*
 * index.js  (engine: time)
 * Job: install the time lane: the calendar (days, dawn, weather of the day, resting), the
 * explored tiles of every map, the story commands and conditions that belong to time, and the
 * area map panel. Nothing here names a game; the game layer passes its choices in.
 *
 * Public API:
 *   install(game, layer)   call before game.save.load() and game.start(); returns the time service
 *        layer: { dawn, weathers, weatherOf, revealRadius, areaMap }   all optional
 *          areaMap: { style, icon, label, hint, order, canOpen, refreshOn }  (ui/AreaMap.js); left out, no map panel
 *   Calendar, Explored, Regen, TIME_SAVE, EXPLORED_SAVE   the parts, for a game that wires them itself
 *
 * What it registers:
 *   save sections   "time" (TIME_SAVE), "explored" (EXPLORED_SAVE)
 *   system          "time" (Calendar), "explored" (Explored)
 *   service         "time" -> the time service (below)
 *   story.command   "rest"   { rest: { hours, wakeAt: [{ if, hour, toast }] } }    (schema section 6)
 *                   "time"   { time: hour } | { time: { add: hours } }   (hour and hours are values)
 *   story.condition "mapRest"  { mapRest: bool }: resting is allowed on the current map (its
 *                              "rest" field, or that of its entry in a content folder's "maps"
 *                              list, is not false) equals the value
 *   story.value     "day"    the day of the journey (a flag stored as 'today' compares with it)
 *   panel, hud.button  "areamap", "map"  (when layer.areaMap is given)
 *   Every handler is (node, ctx); ctx is the story runner's context (value, test, text, run, vars,
 *   target). An id that is already taken is left alone.
 *
 * The time service (registry "service" "time"):
 *   day, today()             the day of the journey (a flag value 'today' compares with it)
 *   world                    the live WorldScene, or null
 *   rest(options, ctx), setTime(hour), addTime(hours), newDay(reason), weatherOf(day)
 *   explored                 the Explored system: bits, seen, reveal, revealAll
 *
 * Events: "time:day", "time:rest", "time:set" (Calendar.js), "map:explored" (Explored.js)
 */

import { Calendar, TIME_SAVE } from './Calendar.js';
import { Explored, EXPLORED_SAVE } from './Explored.js';
import { Regen } from './Regen.js';
import { offer, contentFolders } from './links.js';
import { registerAreaMap } from '../../ui/AreaMap.js';

export { Calendar, Explored, Regen, TIME_SAVE, EXPLORED_SAVE };

export function install(game, layer = {}) {
  const { registry } = game;
  const calendar = new Calendar({ dawn: layer.dawn, weathers: layer.weathers, weatherOf: layer.weatherOf });
  const explored = new Explored({ radius: layer.revealRadius });

  game.save.define('time', TIME_SAVE);
  game.save.define('explored', EXPLORED_SAVE);
  registry.add('system', 'time', calendar);
  registry.add('system', 'explored', explored);

  const service = {
    get day() {
      return calendar.day;
    },
    today: () => calendar.day,
    get world() {
      return calendar.world;
    },
    rest: (options, ctx) => calendar.rest(options, ctx),
    setTime: (hour) => calendar.setTime(hour),
    addTime: (hours) => calendar.addTime(hours),
    newDay: (reason) => calendar.newDay(reason),
    weatherOf: (day) => calendar.weatherOf(day),
    explored,
  };
  offer(registry, 'service', 'time', service);

  /* a command returns no signal: the result of a rest stays inside the calendar */
  offer(registry, 'story.command', 'rest', (node, ctx) => {
    calendar.rest(node.rest === true ? {} : node.rest || {}, ctx);
  });
  offer(registry, 'story.command', 'time', (node, ctx) => {
    const resolve = (v) => Number(ctx && typeof ctx.value === 'function' ? ctx.value(v) : v);
    const spec = node.time;
    const add = spec && typeof spec === 'object' && 'add' in spec;
    const hours = resolve(add ? spec.add : spec);
    if (!Number.isFinite(hours)) console.warn('time: a "time" command needs an hour or { add }', node);
    else if (add) calendar.addTime(hours);
    else calendar.setTime(hours);
  });
  offer(registry, 'story.value', 'day', () => calendar.day);
  offer(registry, 'story.condition', 'mapRest', (node) => {
    const world = calendar.world;
    const map = world && world.map;
    if (!map) return !!node.mapRest;
    let allowed = map.description.rest !== false;
    for (const folder of contentFolders(game)) {
      const entry = Array.isArray(folder && folder.maps) ? folder.maps.find((m) => m && m.id === map.id) : null;
      if (entry && entry.rest === false) allowed = false;
    }
    return allowed === !!node.mapRest;
  });

  if (layer.areaMap) {
    registerAreaMap(game, { ...layer.areaMap, explored, world: () => calendar.world });
  }
  return service;
}
