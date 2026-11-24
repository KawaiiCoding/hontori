/*
 * Mirrors.js  (engine: features)
 * Job: beam-and-mirrors puzzles in the world (rules in MirrorField.js). Content `puzzles` of the game's mirror type
 * name a source, a target and mirrors standing on tiles. The player swings a mirror by using it (the action button
 * facing it, or a tap). The beam is drawn as it runs after every swing, so the player sees how far it gets. When it
 * reaches the target from the right side, the puzzle's `solved` flag is set, the game saves, the mirrors hold still
 * for good and `onSolve` runs. Mirror leans are saved.
 *
 * Public API:
 *   installMirrors(game, options)   in build, before game.save.load() and game.start()
 *     options: {
 *       type            the puzzle type it owns ('mirrors')
 *       paintMirror(ctx, x, y, look, env)   map pixels (x, y: the tile's top-left); look: { lean (0 '/', 1 '\'),
 *                       lit (the beam meets it), near, done, swing (0..1 while it swings) }
 *       paintSource(ctx, x, y, look, env), paintTarget(ctx, x, y, look, env)   look: { lit, done, t }
 *       paintBeam(ctx, points, look)        view pixels: the beam as a list of points (tile centres), look:
 *                       { reached, done, t }
 *       sounds          { turn, solve }
 *     }
 *     returns the Mirrors object below
 *   class Mirrors       solved(id), reset(id)   also registry "service" "mirrors"
 *
 * Puzzle shape (content `puzzles`): { map, type, source: { x, y, out }, target: { x, y, in }, mirrors: [{ id, x, y,
 *   lean }], solved: flag, onSolve: [commands], onTurn: [commands], help: { title, text, icon } }
 *
 * What it registers: gate, world.layer and system "features:mirrors", service "mirrors", puzzle.reset (type), save
 *   section "mirrors" { leans: { puzzleId: [lean of each mirror] } }. With the debug tools every puzzle of a map is
 *   proved fair on entering it (checkMirrorField).
 */

import { Painted } from '../../world/Painted.js';
import { addToWorld } from '../../world/Stage.js';
import { TILE } from '../../core/units.js';
import { MirrorField, checkMirrorField } from './MirrorField.js';

const STEP = [[0, 1], [0, -1], [-1, 0], [1, 0]];
const SWING_SECONDS = 0.25;

export class Mirrors {
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

  #saved() {
    const section = this.#game.save.state.mirrors;
    if (section && !section.leans) section.leans = {};
    return section ? section.leans : {};
  }

  fieldOf(id) {
    const def = this.#all()[id];
    if (!def) return null;
    if (!this.#fields.has(id)) {
      const field = new MirrorField(def);
      field.load(this.#saved()[id]);
      this.#fields.set(id, field);
    }
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
    this.#saved()[id] = field.state.slice();
    const entry = this.#here.find((e) => e.id === id);
    if (entry) this.#trace(entry);
    return true;
  }

  #inside() {
    const map = this.#world && this.#world.map;
    return map ? (x, y) => map.inside(x, y) : undefined;
  }

  #trace(entry) {
    entry.beam = entry.field.beam(this.#inside());
    entry.points = [[entry.field.source.x, entry.field.source.y], ...entry.beam.path];
  }

  /* ---------- the map ---------- */

  #enter(world) {
    this.#world = world;
    this.#here = [];
    for (const [id, def] of Object.entries(this.#all())) {
      if (def.map !== world.map.id) continue;
      const field = this.fieldOf(id);
      const entry = { id, def, field, near: -1, swinging: field.mirrors.map(() => null), beam: null, points: [], look: {}, endLook: {} };
      this.#trace(entry);
      this.#here.push(entry);
      field.mirrors.forEach((mirror, index) => this.#place(world, `mirror:${id}:${index}`, mirror, (ctx, p, env) => this.#paintMirror(ctx, entry, index, p, env)));
      this.#place(world, `mirror:${id}:source`, field.source, (ctx, p, env) => this.#paintEnd(ctx, entry, 'source', p, env));
      this.#place(world, `mirror:${id}:target`, field.target, (ctx, p, env) => this.#paintEnd(ctx, entry, 'target', p, env));
      if (this.#game.registry.has('system', 'debug')) this.#prove(id, def, world);
    }
  }

  #place(world, name, part, paint) {
    if (!Number.isInteger(part.x) || !Number.isInteger(part.y)) return;
    addToWorld(world, new Painted(name, {
      x: part.x * TILE, y: part.y * TILE, depth: part.y * TILE + TILE,
      bounds: { left: -4, top: -24, right: TILE + 4, bottom: TILE + 2 },
      paint: (ctx, p, art, env) => paint(ctx, p, env),
    }));
  }

  #prove(id, def, world) {
    try {
      const map = world.map;
      const start = def.start || (map.spawn ? [map.spawn.x, map.spawn.y] : [world.player.tx, world.player.ty]);
      const problems = checkMirrorField(def, { start, inside: (x, y) => map.inside(x, y), walkable: (x, y) => map.inside(x, y) && !map.solidAt(x, y) });
      if (problems.length) console.warn(`Mirrors: puzzle "${id}" is not fair:`, problems);
    } catch (error) {
      console.warn(`Mirrors: puzzle "${id}" could not be proved`, error);
    }
  }

  #paintMirror(ctx, entry, index, piece, env) {
    if (!this.#o.paintMirror) return;
    const look = entry.look;
    const swing = entry.swinging[index];
    look.lean = entry.field.state[index];
    look.swing = swing ? Math.max(0, 1 - (this.#now - swing) / SWING_SECONDS) : 0;
    look.lit = entry.beam.hits.includes(index) || this.solved(entry.id);
    look.near = entry.near === index;
    look.done = this.solved(entry.id);
    this.#o.paintMirror(ctx, piece.x, piece.y, look, env);
  }

  #paintEnd(ctx, entry, which, piece, env) {
    const paint = which === 'source' ? this.#o.paintSource : this.#o.paintTarget;
    if (!paint) return;
    const look = entry.endLook;
    look.done = this.solved(entry.id);
    look.lit = which === 'source' || look.done || entry.beam.reached;
    look.t = this.#now;
    paint(ctx, piece.x, piece.y, look, env);
  }

  #turn(entry, index) {
    const story = this.#story();
    if (!story || story.busy || index < 0 || this.solved(entry.id)) return;
    const field = entry.field;
    const mirror = field.mirrors[index];
    field.turn(index);
    entry.swinging[index] = this.#now;
    this.#saved()[entry.id] = field.state.slice();
    this.#trace(entry);
    const target = { kind: 'mirror', type: `${this.#o.type}:${entry.id}`, map: entry.def.map, x: mirror.x, y: mirror.y, id: entry.id };
    const commands = Array.isArray(entry.def.onTurn) && entry.def.onTurn.length ? entry.def.onTurn.slice() : [];
    if (!commands.length && this.#o.sounds.turn && !entry.beam.reached) commands.push({ sound: this.#o.sounds.turn });
    story.play(commands, { target });
    if (entry.beam.reached) this.#solve(entry);
  }

  onInteract({ map, tx, ty }) {
    if (!this.#world || !map || this.#world.map !== map) return;
    for (const entry of this.#here) {
      const index = entry.field.mirrorAt(tx, ty);
      if (index >= 0) return this.#turn(entry, index);
    }
    return undefined;
  }

  gate(step) {
    if (step.door || !this.#here.length || !this.#world || step.map !== this.#world.map.id) return false;
    for (const entry of this.#here) {
      const part = entry.field.partAt(step.tx, step.ty);
      if (!part) continue;
      const input = this.#game.input;
      if (part === 'mirror' && input && input.mode === 'tap' && !input.dx && !input.dy) this.#turn(entry, entry.field.mirrorAt(step.tx, step.ty));
      return true;
    }
    return false;
  }

  #step({ tx, ty }) {
    for (const entry of this.#here) {
      if (this.solved(entry.id) || !entry.def.help) continue;
      if (!entry.field.mirrors.some((m) => STEP.some(([dx, dy]) => m.x === tx + dx && m.y === ty + dy))) continue;
      const story = this.#story();
      const help = entry.def.help;
      if (story && typeof story.helper === 'function' && help.text) story.helper({ id: `mirrors:${entry.id}`, title: help.title, text: help.text, icon: help.icon });
    }
  }

  #solve(entry) {
    const story = this.#story();
    if (!story || !entry.def.solved) return;
    story.setFlag(entry.def.solved, true);
    try {
      this.#game.save.commit();
    } catch (error) {
      console.warn('Mirrors: saving failed', error);
    }
    if (Array.isArray(entry.def.onSolve) && entry.def.onSolve.length) story.run(entry.def.onSolve);
    else if (this.#o.sounds.solve) this.#game.sound.play(this.#o.sounds.solve);
  }

  update(dt, world) {
    this.#now += dt;
    if (world !== this.#world || !this.#here.length) return;
    const player = world.player;
    const story = this.#story();
    const still = player && !player.moving && !(story && story.busy);
    for (const entry of this.#here) {
      entry.near = -1;
      if (!still || this.solved(entry.id)) continue;
      entry.near = entry.field.mirrors.findIndex((m) => STEP.some(([dx, dy]) => m.x === player.tx + dx && m.y === player.ty + dy));
    }
  }

  draw(ctx, world) {
    if (world !== this.#world || !this.#here.length || !this.#o.paintBeam) return;
    const cam = world.camera;
    for (const entry of this.#here) {
      if (!entry.points.length) continue;
      const points = entry.points.map(([x, y]) => [x * TILE + TILE / 2 - cam.x, y * TILE + TILE / 2 - 6 - cam.y]);
      this.#o.paintBeam(ctx, points, { reached: entry.beam.reached, done: this.solved(entry.id), t: this.#now });
    }
  }

  start() {
    this.#game.bus.on('map:enter', ({ scene }) => {
      try {
        this.#enter(scene);
      } catch (error) {
        console.warn('Mirrors: the mirrors could not be placed', error);
      }
    });
    this.#game.bus.on('player:step', (event) => {
      try {
        this.#step(event);
      } catch (error) {
        console.warn('Mirrors: a step could not be checked', error);
      }
    });
  }
}

export function installMirrors(game, options = {}) {
  const mirrors = new Mirrors(game, options);
  const { registry } = game;
  game.save.define('mirrors', { leans: {} });
  game.bus.on('world:interact', (event) => mirrors.onInteract(event));
  registry.add('gate', 'features:mirrors', (step) => mirrors.gate(step));
  registry.add('world.layer', 'features:mirrors', { update: (dt, world) => mirrors.update(dt, world), draw: (ctx, world) => mirrors.draw(ctx, world) });
  registry.add('system', 'features:mirrors', mirrors);
  registry.add('service', 'mirrors', { solved: (id) => mirrors.solved(id), reset: (id) => mirrors.reset(id) });
  registry.add('puzzle.reset', options.type || 'mirrors', (id) => (mirrors.owns(id) ? (mirrors.reset(id), true) : false));
  return mirrors;
}
