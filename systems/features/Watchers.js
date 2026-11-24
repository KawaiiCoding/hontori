/*
 * Watchers.js  (engine: features)
 * Job: sneaking puzzles in the world (rules in WatcherField.js). Content `puzzles` of the game's watcher type name
 * a start, a goal, shadow tiles and watchers that walk set loops with a cone of light ahead. While the puzzle is
 * open the watchers walk (one step a second; they hold still while a script runs). A player who stands in a cone
 * off a shadow is caught: the watcher says the puzzle's `caught` line, the screen fades, and the player stands
 * again on the last shadow touched (else the start). Never a fight. Reaching the goal sets the `solved` flag,
 * saves, sends the watchers away and runs `onSolve`.
 *
 * Public API:
 *   installWatchers(game, options)   in build, before game.save.load() and game.start()
 *     options: {
 *       type             the puzzle type it owns ('watchers')
 *       paintWatcher(ctx, x, y, look, env)   map pixels: the feet of the watcher; look: { dir, moving, t, seen }
 *       paintCone(ctx, tiles, look)          view pixels: the cone's tiles as [x, y] top-left corners and the tile
 *                        size, look: { tile, dir, seen, t }
 *       paintShadow(ctx, x, y, look, env)    map pixels (x, y: the tile's top-left); look: { here, t }
 *       light            optional { r, color, rise }: each watcher's lantern lights the world
 *       who              optional: the speaker id of the caught line (default: none)
 *       sounds           { caught }
 *     }
 *   class Watchers       solved(id), reset(id)   also registry "service" "watchers"
 *
 * Puzzle shape: { map, type, start: [x, y], goal: { x: [x0, x1], y: [y0, y1] }, shadows: [[x, y]], watchers:
 *   [{ path, speed, reach }], caught: textId, who (optional speaker of it), solved: flag, onSolve: [commands], help: { title, text, icon } }
 *
 * What it registers: world.layer and system "features:watchers", service "watchers", story.command
 *   "ext:watchersBack" (its own: puts the player back after a catch), puzzle.reset (type). With the debug tools every
 *   puzzle of a map is proved fair on entering it (checkWatcherField).
 */

import { Painted } from '../../world/Painted.js';
import { addToWorld } from '../../world/Stage.js';
import { TILE } from '../../core/units.js';
import { WatcherField, checkWatcherField } from './WatcherField.js';

const STEP_SECONDS = 1;
const CONE_ROOM = 6;

export class Watchers {
  #game;
  #o;
  #defs = null;
  #world = null;
  #here = [];
  #now = 0;

  constructor(game, options) {
    this.#game = game;
    this.#o = { sounds: {}, ...options };
  }

  #all() {
    if (!this.#defs) {
      this.#defs = {};
      for (const folder of this.#game.registry.all('content')) {
        const table = folder && folder.puzzles;
        if (!table || typeof table !== 'object') continue;
        for (const [id, def] of Object.entries(table)) if (def && def.type === this.#o.type) this.#defs[id] = def;
      }
    }
    return this.#defs;
  }

  owns(id) {
    return !!this.#all()[id];
  }

  #story() {
    return this.#game.story || this.#game.registry.get('service', 'story') || null;
  }

  solved(id) {
    const def = this.#all()[id];
    const story = this.#story();
    return !!def && !!story && !!def.solved && !!story.flag(def.solved);
  }

  reset(id) {
    const entry = this.#here.find((e) => e.id === id);
    if (!entry || this.solved(id)) return false;
    entry.step = 0;
    entry.clock = 0;
    entry.last = null;
    return true;
  }

  #enter(world) {
    this.#world = world;
    this.#here = [];
    for (const [id, def] of Object.entries(this.#all())) {
      if (def.map !== world.map.id || this.solved(id)) continue;
      const field = new WatcherField(def);
      const entry = { id, def, field, step: 0, clock: 0, last: null, caught: false, lamps: [], looks: [], seen: -1 };
      this.#here.push(entry);
      field.watchers.forEach((w, i) => {
        const piece = new Painted(`watcher:${id}:${i}`, {
          x: 0, y: 0, depth: (p) => p.y,
          bounds: { left: -12, top: -32, right: 12, bottom: 4 },
          paint: (ctx, p, art, env) => this.#paintWatcher(ctx, entry, i, p, env),
        });
        entry.looks.push({ piece, dir: 2, moving: false, seen: false });
        addToWorld(world, piece);
      });
      for (const key of field.shadows) {
        const [x, y] = key.split(',').map(Number);
        addToWorld(world, new Painted(`shadow:${id}:${key}`, {
          x: x * TILE, y: y * TILE, depth: 0,
          paint: (ctx, p, art, env) => this.#paintShadow(ctx, entry, x, y, p, env),
        }));
      }
      this.#place(entry, 0);
      if (this.#game.registry.has('system', 'debug')) this.#prove(id, def, world);
    }
  }

  #prove(id, def, world) {
    try {
      const map = world.map;
      const problems = checkWatcherField(def, { walkable: (x, y) => map.inside(x, y) && !map.solidAt(x, y) });
      if (problems.length) console.warn(`Watchers: puzzle "${id}" is not fair:`, problems);
    } catch (error) {
      console.warn(`Watchers: puzzle "${id}" could not be proved`, error);
    }
  }

  /* where each watcher stands: between the tile of this step and the next, eased by k (0..1) */
  #place(entry, k) {
    entry.field.watchers.forEach((w, i) => {
      const a = entry.field.at(i, entry.step);
      const b = entry.field.at(i, entry.step + 1);
      const look = entry.looks[i];
      if (!a || !b) return;
      const x = (a.x + (b.x - a.x) * k) * TILE + TILE / 2;
      const y = (a.y + (b.y - a.y) * k) * TILE + TILE - 2;
      look.dir = a.dir;
      look.moving = a.x !== b.x || a.y !== b.y;
      look.piece.moveTo(x, y);
    });
  }

  #paintWatcher(ctx, entry, i, piece, env) {
    if (!this.#o.paintWatcher || this.solved(entry.id)) return;
    const look = entry.looks[i];
    look.t = this.#now;
    look.seen = entry.seen === i;
    this.#o.paintWatcher(ctx, piece.x, piece.y, look, env);
  }

  #paintShadow(ctx, entry, x, y, piece, env) {
    if (!this.#o.paintShadow || this.solved(entry.id)) return;
    const player = this.#world && this.#world.player;
    this.#o.paintShadow(ctx, piece.x, piece.y, { here: !!player && player.tx === x && player.ty === y, t: this.#now }, env);
  }

  #check(entry) {
    const world = this.#world;
    const story = this.#story();
    if (!world || !story || story.busy || entry.caught || this.solved(entry.id)) return;
    const { tx, ty } = world.player;
    if (entry.field.isShadow(tx, ty)) entry.last = [tx, ty];
    const help = entry.def.help;
    const [sx, sy] = entry.field.start || [tx, ty];
    if (help && help.text && Math.abs(tx - sx) + Math.abs(ty - sy) <= 3 && typeof story.helper === 'function') {
      story.helper({ id: `watchers:${entry.id}`, title: help.title, text: help.text, icon: help.icon });
    }
    if (entry.field.inGoal(tx, ty)) {
      this.#solve(entry);
      return;
    }
    const by = entry.field.sees(tx, ty, entry.step);
    if (by < 0) return;
    entry.caught = true;
    entry.seen = by;
    const commands = [];
    if (this.#o.sounds.caught) commands.push({ sound: this.#o.sounds.caught });
    const who = entry.def.who || this.#o.who;
    if (entry.def.caught) commands.push(who ? { say: entry.def.caught, who } : { say: entry.def.caught });
    commands.push({ blackout: 700, then: [{ ext: 'watchersBack', puzzle: entry.id }] });
    story.run(commands);
  }

  /* the story command run inside the fade: the player stands on the last shadow (else the start) */
  back(node) {
    const entry = this.#here.find((e) => e.id === node.puzzle);
    const world = this.#world;
    if (!entry || !world) return;
    const [x, y] = entry.last || entry.field.start;
    try {
      world.player.placeAt(x, y, world.player.dir);
      if (world.companion && typeof world.companion.joinAt === 'function') world.companion.joinAt(world.player.x, world.player.y);
    } catch (error) {
      console.warn('Watchers: the player could not be put back', error);
    }
    entry.caught = false;
    entry.seen = -1;
  }

  #solve(entry) {
    const story = this.#story();
    if (!story || !entry.def.solved) return;
    story.setFlag(entry.def.solved, true);
    try {
      this.#game.save.commit();
    } catch (error) {
      console.warn('Watchers: saving failed', error);
    }
    if (Array.isArray(entry.def.onSolve) && entry.def.onSolve.length) story.run(entry.def.onSolve);
  }

  update(dt, world) {
    this.#now += dt;
    if (world !== this.#world || !this.#here.length) return;
    const story = this.#story();
    const busy = !!(story && story.busy);
    for (const entry of this.#here) {
      if (this.solved(entry.id)) continue;
      if (!busy && !entry.caught) {
        entry.clock += dt;
        while (entry.clock >= STEP_SECONDS) {
          entry.clock -= STEP_SECONDS;
          entry.step = (entry.step + 1) % entry.field.period;
        }
      }
      this.#place(entry, entry.clock / STEP_SECONDS);
      this.#check(entry);
      const light = this.#o.light;
      if (!light || typeof world.addLight !== 'function') continue;
      entry.looks.forEach((look, i) => {
        const lamp = entry.lamps[i] || (entry.lamps[i] = { x: 0, y: 0, r: light.r || 30, color: light.color || '#dfe8ff', soft: true });
        lamp.x = look.piece.x;
        lamp.y = look.piece.y - (light.rise || 12);
        world.addLight(lamp);
      });
    }
  }

  draw(ctx, world) {
    if (world !== this.#world || !this.#here.length || !this.#o.paintCone) return;
    const cam = world.camera;
    for (const entry of this.#here) {
      if (this.solved(entry.id)) continue;
      entry.field.watchers.forEach((w, i) => {
        const tiles = entry.field.cone(i, entry.step).slice(1).map(([x, y]) => [x * TILE - cam.x, y * TILE - cam.y]);
        if (tiles.every(([x, y]) => x < -TILE * CONE_ROOM || y < -TILE * CONE_ROOM || x > cam.width + TILE || y > cam.height + TILE)) return;
        this.#o.paintCone(ctx, tiles, { tile: TILE, dir: entry.looks[i].dir, seen: entry.seen === i, t: this.#now });
      });
    }
  }

  start() {
    this.#game.bus.on('map:enter', ({ scene }) => {
      try {
        this.#enter(scene);
      } catch (error) {
        console.warn('Watchers: they could not be placed', error);
      }
    });
  }
}

export function installWatchers(game, options = {}) {
  const watchers = new Watchers(game, options);
  const { registry } = game;
  registry.add('world.layer', 'features:watchers', { update: (dt, world) => watchers.update(dt, world), draw: (ctx, world) => watchers.draw(ctx, world) });
  registry.add('system', 'features:watchers', watchers);
  registry.add('service', 'watchers', { solved: (id) => watchers.solved(id), reset: (id) => watchers.reset(id) });
  registry.add('story.command', 'ext:watchersBack', (node) => watchers.back(node));
  registry.add('puzzle.reset', options.type || 'watchers', (id) => (watchers.owns(id) ? (watchers.reset(id), true) : false));
  return watchers;
}
