/*
 * Braziers.js  (engine: features)
 * Job: lighting-in-order puzzles in the world (rules in BrazierField.js). Content `puzzles` of the game's
 * brazier type name braziers on tiles, the order to light them in and the carvings that show that order. The
 * player uses a brazier (the action button facing it, or a tap) to light it, if one of the puzzle's ways to
 * light holds (`light.ways`, tried in order; each `then` runs first); with no way, `light.else` runs. The
 * next one in the order stays lit; any other flares for a moment and then every brazier goes out, and `wrong`
 * runs. When the last one is lit, the puzzle's `solved` flag is set, the game saves, every brazier burns for
 * good and `onSolve` runs. Using a carving says its lines. What is lit is not saved: a map entered again
 * starts dark (solved stays solved).
 *
 * Public API:
 *   installBraziers(game, options)   in build, before game.save.load() and game.start()
 *     options: {
 *       type            the puzzle type it owns ('braziers')
 *       paintBrazier(ctx, x, y, look, env)   one brazier in map pixels (x, y: the top-left of its tile);
 *                       look: { lit, k (0..1 since it caught), flare (0..1 of a wrong one dying), near, done, t }
 *       paintCarving(ctx, x, y, look, env)   look: { near, done, t }
 *       light           optional { r, color, rise }: a lit brazier lights the world around it
 *       sounds          { light, wrong, solve } sound names (only when the content gives no commands of its own)
 *     }
 *     returns the Braziers object below
 *   class Braziers
 *     solved(id), reset(id)   also offered as registry kind "service", id "braziers"
 *
 * Puzzle shape (content `puzzles`): { map, type, braziers: [{ id, x, y }], order: [id], carvings: [{ x, y, text:
 *   [textId] }], light: { ways: [{ if, then }], else: [commands] }, wrong: [commands], solved: flag,
 *   onSolve: [commands], help: { title, text, icon } }. Braziers and carvings stand on open floor; this system
 *   draws them and keeps the player off them.
 *
 * What it registers:
 *   gate          "features:braziers"   no walking onto a brazier or a carving (in tap mode a walk that ends at
 *                                       one uses it)
 *   world.layer   "features:braziers"   the lights of lit braziers, the ring at the one that can be used now
 *   system        "features:braziers"   places them on map:enter
 *   service       "braziers"            { solved(id), reset(id) }
 *   story.command "ext:brazierLit"      (its own: lights the brazier a way allowed) { ext, puzzle, brazier }
 *   puzzle.reset  type -> (id) => true when it owns that puzzle (and put them all out)
 * With the debug tools, every puzzle of a map is proved fair on entering it (checkBrazierField).
 */

import { Painted } from '../../world/Painted.js';
import { addToWorld } from '../../world/Stage.js';
import { TILE } from '../../core/units.js';
import { BrazierField, checkBrazierField } from './BrazierField.js';

const STEP = [[0, 1], [0, -1], [-1, 0], [1, 0]];
const CATCH_SECONDS = 0.5;
const FLARE_SECONDS = 0.8;

export class Braziers {
  #game;
  #o;
  #defs = null;
  #fields = new Map();
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

  fieldOf(id) {
    const def = this.#all()[id];
    if (!def) return null;
    if (!this.#fields.has(id)) this.#fields.set(id, new BrazierField(def));
    return this.#fields.get(id);
  }

  solved(id) {
    const def = this.#all()[id];
    const story = this.#story();
    return !!def && !!story && !!def.solved && !!story.flag(def.solved);
  }

  reset(id) {
    const field = this.fieldOf(id);
    if (!field || this.solved(id)) return false;
    field.reset();
    const entry = this.#here.find((e) => e.id === id);
    if (entry) entry.caught = {};
    return true;
  }

  /* ---------- the map ---------- */

  #enter(world) {
    this.#world = world;
    this.#here = [];
    for (const [id, def] of Object.entries(this.#all())) {
      if (def.map !== world.map.id) continue;
      const field = this.fieldOf(id);
      field.reset();
      const entry = { id, def, field, near: null, caught: {}, flare: null, lamps: {}, look: {} };
      this.#here.push(entry);
      for (const brazier of field.braziers) {
        this.#place(world, `brazier:${id}:${brazier.id}`, brazier, { left: -4, top: -24, right: TILE + 4, bottom: TILE + 2 },
          (ctx, p, env) => this.#paintBrazier(ctx, entry, brazier, p, env));
      }
      field.carvings.forEach((carving, i) => {
        this.#place(world, `carving:${id}:${i}`, carving, { left: -2, top: -18, right: TILE + 2, bottom: TILE + 2 },
          (ctx, p, env) => this.#paintCarving(ctx, entry, carving, p, env));
      });
      if (this.#game.registry.has('system', 'debug')) this.#prove(id, def, world);
    }
  }

  #place(world, name, part, bounds, paint) {
    if (!Number.isInteger(part.x) || !Number.isInteger(part.y)) return;
    addToWorld(world, new Painted(name, {
      x: part.x * TILE, y: part.y * TILE, depth: part.y * TILE + TILE, bounds,
      paint: (ctx, p, art, env) => paint(ctx, p, env),
    }));
  }

  #prove(id, def, world) {
    try {
      const map = world.map;
      /* from the map's own start, as the content checker does (the player may stand anywhere now) */
      const start = def.start || (map.spawn ? [map.spawn.x, map.spawn.y] : [world.player.tx, world.player.ty]);
      const problems = checkBrazierField(def, { start, walkable: (x, y) => map.inside(x, y) && !map.solidAt(x, y) });
      if (problems.length) console.warn(`Braziers: puzzle "${id}" is not fair:`, problems);
    } catch (error) {
      console.warn(`Braziers: puzzle "${id}" could not be proved`, error);
    }
  }

  #paintBrazier(ctx, entry, brazier, piece, env) {
    if (!this.#o.paintBrazier) return;
    const look = entry.look;
    const done = this.solved(entry.id);
    const lit = done || entry.field.isLit(brazier.id);
    const caught = entry.caught[brazier.id];
    const flare = entry.flare && entry.flare.id === brazier.id ? 1 - (this.#now - entry.flare.at) / FLARE_SECONDS : 0;
    look.lit = lit;
    look.k = lit ? (caught == null ? 1 : Math.min(1, (this.#now - caught) / CATCH_SECONDS)) : 0;
    look.flare = Math.max(0, flare);
    look.near = entry.near === brazier;
    look.done = done;
    look.t = this.#now;
    this.#o.paintBrazier(ctx, piece.x, piece.y, look, env);
  }

  #paintCarving(ctx, entry, carving, piece, env) {
    if (!this.#o.paintCarving) return;
    const look = entry.look;
    look.near = entry.near === carving;
    look.done = this.solved(entry.id);
    look.t = this.#now;
    this.#o.paintCarving(ctx, piece.x, piece.y, look, env);
  }

  #partAt(tx, ty) {
    for (const entry of this.#here) {
      const brazier = entry.field.brazierAt(tx, ty);
      if (brazier) return { entry, brazier };
      const carving = entry.field.carvingAt(tx, ty);
      if (carving) return { entry, carving };
    }
    return null;
  }

  #use(found) {
    const story = this.#story();
    if (!story || story.busy) return;
    const { entry, brazier, carving } = found;
    const def = entry.def;
    const at = brazier || carving;
    const target = { kind: 'brazier', type: `${this.#o.type}:${entry.id}`, map: def.map, x: at.x, y: at.y, id: entry.id };
    if (carving) {
      story.play(carving.text.map((id) => ({ say: id })), { target });
      return;
    }
    if (this.solved(entry.id) || entry.field.isLit(brazier.id)) return;
    const lit = { ext: 'brazierLit', puzzle: entry.id, brazier: brazier.id };
    const light = def.light || {};
    const ways = Array.isArray(light.ways) ? light.ways.filter(Boolean) : [];
    const commands = ways.length
      ? [{ branch: ways.map((way) => ({ if: way.if, then: [...(Array.isArray(way.then) ? way.then : []), lit] })), else: Array.isArray(light.else) ? light.else : [] }]
      : [lit];
    story.play(commands, { target });
  }

  /* the story command a way runs once it holds */
  lit(node) {
    const entry = this.#here.find((e) => e.id === node.puzzle);
    if (!entry || this.solved(entry.id)) return;
    const result = entry.field.light(node.brazier);
    const story = this.#story();
    if (result === 'already') return;
    if (result === 'wrong') {
      entry.flare = { id: String(node.brazier), at: this.#now };
      entry.caught = {};
      const wrong = entry.def.wrong;
      if (Array.isArray(wrong) && wrong.length && story) story.run(wrong);
      else this.#sound(this.#o.sounds.wrong);
      return;
    }
    entry.caught[String(node.brazier)] = this.#now;
    if (result === 'solved') {
      this.#solve(entry);
      return;
    }
    this.#sound(this.#o.sounds.light);
  }

  onInteract({ map, tx, ty }) {
    if (!this.#world || !map || this.#world.map !== map) return;
    const found = this.#partAt(tx, ty);
    if (found) this.#use(found);
  }

  gate(step) {
    if (step.door || !this.#here.length || !this.#world || step.map !== this.#world.map.id) return false;
    const found = this.#partAt(step.tx, step.ty);
    if (!found) return false;
    const input = this.#game.input;
    if (input && input.mode === 'tap' && !input.dx && !input.dy) this.#use(found);
    return true;
  }

  #step({ tx, ty }) {
    for (const entry of this.#here) {
      if (this.solved(entry.id)) continue;
      if (entry.field.braziers.some((b) => STEP.some(([dx, dy]) => b.x === tx + dx && b.y === ty + dy))) this.#teach(entry);
    }
  }

  #teach(entry) {
    const help = entry.def.help;
    const story = this.#story();
    if (!help || !help.text || !story || typeof story.helper !== 'function') return;
    try {
      story.helper({ id: `braziers:${entry.id}`, title: help.title, text: help.text, icon: help.icon });
    } catch (error) {
      console.warn('Braziers: the help card could not be shown', error);
    }
  }

  #solve(entry) {
    const story = this.#story();
    if (!story || !entry.def.solved) return;
    story.setFlag(entry.def.solved, true);
    try {
      this.#game.save.commit();
    } catch (error) {
      console.warn('Braziers: saving failed', error);
    }
    if (Array.isArray(entry.def.onSolve) && entry.def.onSolve.length) story.run(entry.def.onSolve);
    else this.#sound(this.#o.sounds.solve);
  }

  update(dt, world) {
    this.#now += dt;
    if (world !== this.#world || !this.#here.length) return;
    const player = world.player;
    const story = this.#story();
    const still = player && !player.moving && !(story && story.busy);
    const light = this.#o.light;
    for (const entry of this.#here) {
      const done = this.solved(entry.id);
      entry.near = null;
      if (still && !done) {
        for (const part of [...entry.field.braziers, ...entry.field.carvings]) {
          if (STEP.some(([dx, dy]) => part.x === player.tx + dx && part.y === player.ty + dy)) entry.near = part;
        }
      }
      if (entry.flare && this.#now - entry.flare.at > FLARE_SECONDS) entry.flare = null;
      if (!light || typeof world.addLight !== 'function') continue;
      for (const brazier of entry.field.braziers) {
        const flaring = entry.flare && entry.flare.id === brazier.id;
        if (!(done || entry.field.isLit(brazier.id) || flaring)) continue;
        const lamp = entry.lamps[brazier.id] || (entry.lamps[brazier.id] = { x: 0, y: 0, r: light.r || 40, color: light.color || '#ffb060', flicker: true, soft: true });
        lamp.x = brazier.x * TILE + TILE / 2;
        lamp.y = brazier.y * TILE - (light.rise || 0);
        world.addLight(lamp);
      }
    }
  }

  #sound(name) {
    if (!name) return;
    try {
      this.#game.sound.play(name);
    } catch (error) {
      /* a missing sound never stops the game */
    }
  }

  start() {
    this.#game.bus.on('map:enter', ({ scene }) => {
      try {
        this.#enter(scene);
      } catch (error) {
        console.warn('Braziers: they could not be placed', error);
      }
    });
    this.#game.bus.on('player:step', (event) => {
      try {
        this.#step(event);
      } catch (error) {
        console.warn('Braziers: a step could not be checked', error);
      }
    });
  }
}

export function installBraziers(game, options = {}) {
  const braziers = new Braziers(game, options);
  const { registry } = game;
  game.bus.on('world:interact', (event) => braziers.onInteract(event));
  registry.add('gate', 'features:braziers', (step) => braziers.gate(step));
  registry.add('world.layer', 'features:braziers', { update: (dt, world) => braziers.update(dt, world) });
  registry.add('system', 'features:braziers', braziers);
  registry.add('service', 'braziers', { solved: (id) => braziers.solved(id), reset: (id) => braziers.reset(id) });
  registry.add('story.command', 'ext:brazierLit', (node) => braziers.lit(node));
  registry.add('puzzle.reset', options.type || 'braziers', (id) => (braziers.owns(id) ? (braziers.reset(id), true) : false));
  return braziers;
}
