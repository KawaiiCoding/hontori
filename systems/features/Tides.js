/*
 * Tides.js  (engine: features)
 * Job: water-level puzzles in the world (rules in TideField.js). Content `puzzles` of the game's tide type
 * name basins of floor tiles that hold water, wheels standing on tiles that open or close a basin's sluice,
 * and a goal. The player turns a wheel by using it (the action button facing it, or a tap); an opened basin
 * drains into the basin it spills into (or the sea), and the water visibly runs out of one and into the other. A flooded basin cannot be walked; a dry one can. A wheel that would flood the tile
 * the player stands on does not turn (the puzzle's `blocked` text says why). Reaching the goal sets the
 * puzzle's `solved` flag, saves, drains every basin of it for good (the way back stays open) and runs
 * `onSolve`. Wheel turns are saved, so a journey always comes back to the same water.
 *
 * Public API:
 *   installTides(game, options)   in build, before game.save.load() and game.start()
 *     options: {
 *       type            the puzzle type it owns ('tide')
 *       paintWheel(ctx, x, y, look, env)   a wheel in map pixels: x, y the top-left of its tile;
 *                       look: { turn, from, k, near, settings, open } (turn: 0 closed, 1 open; k: 0..1 of the
 *                       turn from `from`; near: the player stands next to it and can turn it now)
 *       paintWater(ctx, px, py, look, art, env)   the water over one basin tile (px, py its top-left in
 *                       map pixels); look: { tx, ty, fill (0..1, eased: 0 dry, 1 two units of water or more),
 *                       edge: { up, down, left, right }
 *                       (true where the next tile is not flooded water of the same basin) }
 *       sounds          { turn, fill, drain, refuse, solve } sound names for game.sound.play
 *     }
 *     returns the Tides object below
 *   class Tides
 *     solved(id), reset(id)   also offered as registry kind "service", id "tides"; reset does nothing while
 *                             the player stands in a basin that would flood (returns false)
 *     fieldOf(id)             the TideField of a puzzle (for a test or a checker)
 *
 * Puzzle shape (content `puzzles`): { map, type, wheels: [{ x, y, basin, open }],
 *   basins: [{ id, x: [x0, x1], y: [y0, y1], start: 'high' | 'low' | units, spill: basinId }],
 *   goal: { x: [x0, x1], y: [y0, y1] }, solved: flag,
 *   onSolve: [commands], onTurn: [commands] (optional, instead of the sounds), blocked: text id,
 *   help: { title, text, icon } }   help is the once-only card shown the first time the player stands next
 *   to one of its wheels. Basin tiles are open floor in the map (steps, stones); the water is drawn here.
 *
 * What it registers:
 *   gate          "features:tides"    no walking onto a wheel (in tap mode a walk that ends at one turns it)
 *                                     or into flooded water
 *   world.layer   "features:tides"    eases the water up and down; the ring at the wheel that can be turned
 *   system        "features:tides"    places the wheels and the water on map:enter, watches for the goal
 *   service       "tides"             { solved(id), reset(id) }
 *   puzzle.reset  type -> (id) => true when it owns that puzzle (and reset it)
 *   save section  "tides"             { turns: { puzzleId: TideField state (sluices, then water) } }
 * With the debug tools, every puzzle of a map is proved fair on entering it (checkTideField).
 */

import { Painted } from '../../world/Painted.js';
import { addToWorld } from '../../world/Stage.js';
import { TILE } from '../../core/units.js';
import { TideField, checkTideField } from './TideField.js';

const TURN_SECONDS = 0.45;
const FILL_SECONDS = 0.9;
/* the water a basin shows at its fullest; one unit shows as a little shallower */
const DEEP = 2;
/* the water lies flat on the floor: under every prop, person and the player */
const WATER_DEPTH = -1e7;
const STEP = [[0, 1], [0, -1], [-1, 0], [1, 0]];

const span = (v) => (Array.isArray(v) ? v : [v, v]);

export class Tides {
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

  /* ---------- the puzzles ---------- */

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

  #saved() {
    const section = this.#game.save.state.tides;
    if (section && !section.turns) section.turns = {};
    return section ? section.turns : {};
  }

  fieldOf(id) {
    const def = this.#all()[id];
    if (!def) return null;
    if (!this.#fields.has(id)) {
      const field = new TideField(def);
      field.load(this.#saved()[id]);
      this.#fields.set(id, field);
    }
    const field = this.#fields.get(id);
    field.low = this.solved(id);
    return field;
  }

  solved(id) {
    const def = this.#all()[id];
    const story = this.#story();
    return !!def && !!story && !!def.solved && !!story.flag(def.solved);
  }

  reset(id) {
    const field = this.fieldOf(id);
    if (!field || this.solved(id)) return false;
    const before = field.state.slice();
    field.reset();
    const world = this.#world;
    const def = this.#all()[id];
    if (world && world.map && def.map === world.map.id && world.player && field.flooded(world.player.tx, world.player.ty)) {
      /* never fill the water over the kid's head */
      field.load(before);
      return false;
    }
    this.#saved()[id] = field.state.slice();
    return true;
  }

  /* ---------- the map ---------- */

  #enter(world) {
    this.#world = world;
    this.#here = [];
    const map = world.map;
    for (const [id, def] of Object.entries(this.#all())) {
      if (def.map !== map.id) continue;
      const field = this.fieldOf(id);
      const entry = { id, def, field, near: -1, turning: field.wheels.map(() => null), fill: field.basins.map((b, i) => depthOf(field.waterOf(i))) };
      this.#here.push(entry);
      field.basins.forEach((basin, index) => this.#placeWater(world, entry, basin, index));
      field.wheels.forEach((wheel, index) => {
        const piece = new Painted(`wheel:${id}:${index}`, {
          x: wheel.x * TILE, y: wheel.y * TILE, depth: wheel.y * TILE + TILE,
          bounds: { left: -8, top: -24, right: TILE + 8, bottom: TILE + 4 },
          paint: (ctx, p, art, env) => this.#paintWheel(ctx, entry, index, p, env),
        });
        addToWorld(world, piece);
      });
      if (world.player && field.flooded(world.player.tx, world.player.ty)) console.warn(`Tides: the player arrived under water in puzzle "${id}"`);
      if (this.#game.registry.has('system', 'debug')) this.#prove(id, def, world);
    }
  }

  #placeWater(world, entry, basin, index) {
    const [ax, bx] = span(basin.x);
    const [ay, by] = span(basin.y);
    const x0 = Math.min(ax, bx);
    const x1 = Math.max(ax, bx);
    const y0 = Math.min(ay, by);
    const y1 = Math.max(ay, by);
    const field = entry.field;
    const wet = (tx, ty) => field.basinAt(tx, ty) === index && field.waterOf(index) > 0;
    /* one look object per basin, filled in again for each tile: nothing is made while drawing */
    const look = { tx: 0, ty: 0, fill: 0, edge: { up: false, down: false, left: false, right: false } };
    const piece = new Painted(`tide:${entry.id}:${index}`, {
      x: x0 * TILE, y: y0 * TILE, depth: WATER_DEPTH + index,
      bounds: { left: 0, top: 0, right: (x1 - x0 + 1) * TILE, bottom: (y1 - y0 + 1) * TILE },
      paint: (ctx, p, art, env) => {
        const fill = entry.fill[index];
        if (!this.#o.paintWater || fill <= 0.01) return;
        look.fill = fill;
        for (let ty = y0; ty <= y1; ty++) {
          for (let tx = x0; tx <= x1; tx++) {
            look.tx = tx;
            look.ty = ty;
            look.edge.up = !wet(tx, ty - 1);
            look.edge.down = !wet(tx, ty + 1);
            look.edge.left = !wet(tx - 1, ty);
            look.edge.right = !wet(tx + 1, ty);
            this.#o.paintWater(ctx, tx * TILE, ty * TILE, look, art, env);
          }
        }
      },
    });
    addToWorld(world, piece);
  }

  #prove(id, def, world) {
    try {
      const map = world.map;
      const start = def.start || [world.player.tx, world.player.ty];
      const problems = checkTideField(def, { start, walkable: (x, y) => map.inside(x, y) && !map.solidAt(x, y) });
      if (problems.length) console.warn(`Tides: puzzle "${id}" is not fair:`, problems);
    } catch (error) {
      console.warn(`Tides: puzzle "${id}" could not be proved`, error);
    }
  }

  #paintWheel(ctx, entry, index, piece, env) {
    if (!this.#o.paintWheel) return;
    const turning = entry.turning[index];
    const turn = entry.field.isOpen(index) ? 1 : 0;
    const k = turning ? Math.min(1, (this.#now - turning.at) / TURN_SECONDS) : 1;
    const look = entry.wheelLook || (entry.wheelLook = { turn: 0, from: 0, k: 1, near: false, settings: 2, open: false });
    look.turn = turn;
    look.from = turning && k < 1 ? turning.from : turn;
    look.k = k;
    look.near = entry.near === index;
    look.open = turn === 1;
    this.#o.paintWheel(ctx, piece.x, piece.y, look, env);
  }

  #wheelAt(tx, ty) {
    for (const entry of this.#here) {
      const index = entry.field.wheelAt(tx, ty);
      if (index >= 0) return { entry, index };
    }
    return null;
  }

  #turn({ entry, index }) {
    const story = this.#story();
    if (!story || story.busy || this.solved(entry.id)) return;
    const player = this.#world && this.#world.player;
    const field = entry.field;
    const wheel = field.wheels[index];
    const target = { kind: 'wheel', type: `wheel:${entry.id}`, map: entry.def.map, x: wheel.x, y: wheel.y, id: entry.id };
    if (player && field.wouldFlood(index, player.tx, player.ty)) {
      const commands = [];
      if (this.#o.sounds.refuse) commands.push({ sound: this.#o.sounds.refuse });
      if (entry.def.blocked) commands.push({ toast: entry.def.blocked });
      story.play(commands, { target });
      return;
    }
    const before = field.basins.map((b, i) => field.waterOf(i) > 0);
    const from = field.isOpen(index) ? 1 : 0;
    field.turn(index);
    entry.turning[index] = { from, at: this.#now };
    this.#saved()[entry.id] = field.state.slice();
    const after = field.basins.map((b, i) => field.waterOf(i) > 0);
    const commands = [];
    if (Array.isArray(entry.def.onTurn) && entry.def.onTurn.length) commands.push(...entry.def.onTurn);
    else {
      const filled = after.some((wet, i) => wet && !before[i]);
      const drained = after.some((wet, i) => !wet && before[i]);
      const sound = drained ? this.#o.sounds.drain : filled ? this.#o.sounds.fill : this.#o.sounds.turn;
      if (sound) commands.push({ sound });
    }
    /* the turn plays as a short script, so nothing else uses the same tile this time */
    story.play(commands, { target });
  }

  onInteract({ map, tx, ty }) {
    if (!this.#world || !map || this.#world.map !== map) return;
    const found = this.#wheelAt(tx, ty);
    if (found) this.#turn(found);
  }

  gate(step) {
    if (step.door || !this.#here.length || !this.#world || step.map !== this.#world.map.id) return false;
    const found = this.#wheelAt(step.tx, step.ty);
    if (found) {
      const input = this.#game.input;
      if (input && input.mode === 'tap' && !input.dx && !input.dy) this.#turn(found);
      return true;
    }
    for (const entry of this.#here) if (entry.field.flooded(step.tx, step.ty)) return true;
    return false;
  }

  /* ---------- the player and the water ---------- */

  #step({ tx, ty }) {
    for (const entry of this.#here) {
      if (this.solved(entry.id)) continue;
      if (entry.field.atGoal(tx, ty)) this.#solve(entry);
      else if (this.#beside(entry.field, tx, ty) >= 0) this.#teach(entry);
    }
  }

  #beside(field, tx, ty) {
    for (const [dx, dy] of STEP) {
      const index = field.wheelAt(tx + dx, ty + dy);
      if (index >= 0) return index;
    }
    return -1;
  }

  #teach(entry) {
    const help = entry.def.help;
    const story = this.#story();
    if (!help || !help.text || !story || typeof story.helper !== 'function') return;
    try {
      story.helper({ id: `tides:${entry.id}`, title: help.title, text: help.text, icon: help.icon });
    } catch (error) {
      console.warn('Tides: the wheel card could not be shown', error);
    }
  }

  #solve(entry) {
    const story = this.#story();
    if (!story || !entry.def.solved) return;
    story.setFlag(entry.def.solved, true);
    entry.field.low = true;
    try {
      this.#game.save.commit();
    } catch (error) {
      console.warn('Tides: saving failed', error);
    }
    this.#sound(this.#o.sounds.solve);
    if (Array.isArray(entry.def.onSolve) && entry.def.onSolve.length) story.run(entry.def.onSolve);
  }

  update(dt, world) {
    this.#now += dt;
    if (world !== this.#world || !this.#here.length) return;
    const player = world.player;
    const story = this.#story();
    const still = player && !player.moving && !(story && story.busy);
    const rate = dt / FILL_SECONDS;
    for (const entry of this.#here) {
      const field = entry.field;
      field.low = this.solved(entry.id);
      entry.near = still && !field.low ? this.#beside(field, player.tx, player.ty) : -1;
      for (let i = 0; i < entry.fill.length; i++) {
        const want = depthOf(field.waterOf(i));
        const have = entry.fill[i];
        entry.fill[i] = want > have ? Math.min(want, have + rate) : Math.max(want, have - rate);
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
        console.warn('Tides: the wheels could not be placed', error);
      }
    });
    this.#game.bus.on('player:step', (event) => {
      try {
        this.#step(event);
      } catch (error) {
        console.warn('Tides: a step could not be checked', error);
      }
    });
  }
}

function depthOf(water) {
  return Math.min(water, DEEP) / DEEP;
}

export function installTides(game, options = {}) {
  const tides = new Tides(game, options);
  const { registry } = game;
  game.save.define('tides', { turns: {} });
  game.bus.on('world:interact', (event) => tides.onInteract(event));
  registry.add('gate', 'features:tides', (step) => tides.gate(step));
  registry.add('world.layer', 'features:tides', { update: (dt, world) => tides.update(dt, world) });
  registry.add('system', 'features:tides', tides);
  registry.add('service', 'tides', { solved: (id) => tides.solved(id), reset: (id) => tides.reset(id) });
  registry.add('puzzle.reset', options.type || 'tide', (id) => (tides.owns(id) ? (tides.reset(id), true) : false));
  return tides;
}
