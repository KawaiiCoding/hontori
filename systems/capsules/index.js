/*
 * systems/capsules/index.js  (engine: capsules)
 * Job: capsule machines in a game: the rules (Capsules.js) read from the content, a save section, each
 * machine set into its map as a prop, and the story's extension that a machine's interaction script uses.
 * It knows no art and no coins: a paid turn is paid by the script (the core `spend` command) before it asks.
 *
 * Content (folder key `capsules`, merged over every folder): { slots, series, machines: [{ id, series, map,
 *   x, y, prop }] } (content/shared/capsules.js describes the fields).
 *
 * Public API:
 *   install(game, { reveal, refund })   -> the Capsules rules (also registered as service "capsuleRules")
 *        reveal(prize, seriesId, ctx): a Promise, shown after every turn (the script waits for it)
 *        refund(n): give coins back (only if a paid turn found nothing, which the script prevents)
 *   machineFor(game, target)            the machine being used ({ map, type, x, y } of a story target)
 *
 * What it registers:
 *   save section  "capsules" (Capsules.SAVE)
 *   service       "capsuleRules"
 *   story.command "ext:capsule"   { ext: 'capsule', turn: 'free' | 'paid' }   one turn of the machine in use
 *   story.condition "ext:capsule" { ext: 'capsule', done: true } (every prize owned) | { free: true } (the free
 *                 turn of today is there and a prize is left)
 *   story.value   "ext:capsule"   { ext: 'capsule', cost: true }   the price of a turn (0 when done)
 *   map props     every machine's `prop` on its map (a description registered under kind "map")
 */

import { Capsules, SAVE } from './Capsules.js';

export function bookOf(game) {
  const book = { series: {}, slots: {}, machines: [] };
  for (const folder of game.registry.all('content')) {
    const c = folder && folder.capsules;
    if (!c) continue;
    Object.assign(book.series, c.series || {});
    Object.assign(book.slots, c.slots || {});
    if (Array.isArray(c.machines)) book.machines.push(...c.machines);
  }
  return book;
}

function mapIdOf(map) {
  return map && typeof map === 'object' ? map.id : map;
}

export function machineFor(game, target) {
  const machines = bookOf(game).machines;
  const top = game.scenes && game.scenes.top;
  const here = mapIdOf((target && target.map) || (top && top.map));
  const onMap = machines.filter((m) => m.map === here);
  if (!target) return onMap[0] || null;
  return onMap.find((m) => m.prop === target.type) || onMap.find((m) => m.x === target.x && m.y === target.y) || onMap[0] || null;
}

function today(game) {
  try {
    const time = game.registry.get('service', 'time');
    return time ? Number(time.today()) || 0 : 0;
  } catch (error) {
    return 0;
  }
}

export function install(game, { reveal, refund } = {}) {
  const { registry } = game;
  const book = bookOf(game);
  game.save.define('capsules', SAVE);
  const rules = new Capsules(book, () => game.save.state.capsules, (type, payload) => game.bus.emit(type, payload));
  registry.add('service', 'capsuleRules', rules);

  /* each machine stands on its map as a prop (a map that is not there is skipped, with a note) */
  for (const m of book.machines) {
    const map = registry.get('map', m.map);
    if (!map || !m.prop) {
      console.warn(`capsules: machine "${m.id}" has no map "${m.map}"`);
      continue;
    }
    if (!Array.isArray(map.props)) map.props = [];
    if (!map.props.some((p) => p.type === m.prop)) map.props.push({ type: m.prop, x: m.x, y: m.y });
  }

  const seriesFor = (ctx) => {
    const machine = machineFor(game, ctx && ctx.target);
    return machine && rules.series(machine.series) ? machine.series : null;
  };

  registry.add('story.command', 'ext:capsule', async (node, ctx) => {
    const seriesId = seriesFor(ctx);
    if (!seriesId) return 'stop';
    const free = node.turn === 'free';
    const price = rules.price(seriesId);
    const prize = rules.turn(seriesId, { free, day: today(game) });
    if (!prize) {
      if (!free && price && refund) refund(price);
      return undefined;
    }
    game.save.commit();
    if (reveal) {
      try {
        await reveal(prize, seriesId, ctx);
      } catch (error) {
        console.warn('capsules: the reveal failed', error);
      }
    }
    return undefined;
  });

  registry.add('story.condition', 'ext:capsule', (node, ctx) => {
    const seriesId = seriesFor(ctx);
    if (!seriesId) return false;
    if (node.done) return rules.done(seriesId);
    if (node.free) return !rules.done(seriesId) && rules.freeToday(today(game));
    return false;
  });

  registry.add('story.value', 'ext:capsule', (node, ctx) => {
    const seriesId = seriesFor(ctx);
    return seriesId ? rules.price(seriesId) : 0;
  });

  return rules;
}
