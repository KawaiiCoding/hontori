/*
 * Circuits.js  (engine: features)
 * Job: power-line puzzles in the world (rules in CircuitField.js). Content `puzzles` of the game's circuit
 * type name a source, a target and pieces of line standing on tiles. The player turns a piece a quarter by
 * using it (the action button facing it, or a tap). Every piece the power reaches glows at once, so the
 * player sees how far the line runs. When the power reaches the target, the puzzle's `solved` flag is set,
 * the game saves, the light runs along the line to the target, the pieces hold still for good and `onSolve`
 * runs. Piece turns are saved.
 *
 * Public API:
 *   installCircuits(game, options)   in build, before game.save.load() and game.start()
 *     options: {
 *       type            the puzzle type it owns ('circuit')
 *       paintPiece(ctx, x, y, look, env)   one piece in map pixels (x, y: the top-left of its tile);
 *                       look: { shape, base: [its open sides before any turn: 0 up, 1 right, 2 down, 3 left],
 *                       angle (quarter turns, eased while it turns: draw `base` turned by it), lit, near, fixed, done, wave (0..1: the light of a solved line passing) }
 *       paintSource(ctx, x, y, look, env)  look: { out (side index), lit, done, t }
 *       paintTarget(ctx, x, y, look, env)  look: { in (side index), lit, k (0..1 since it lit), done, t }
 *       light           optional { r, color, rise }: the lit target also lights the world around it
 *                       (rise: pixels above its tile's top where the light sits)
 *       sounds          { turn, lit, solve } sound names for game.sound.play (lit: a turn that carries the
 *                       power further than before)
 *     }
 *     returns the Circuits object below
 *   class Circuits
 *     solved(id), reset(id)   also offered as registry kind "service", id "circuits"
 *     fieldOf(id)
 *
 * Puzzle shape (content `puzzles`): { map, type, source: { x, y, out }, target: { x, y, in },
 *   pieces: [{ x, y, shape: 'line' | 'bend' | 'tee' | 'cross', turn, fixed }], solved: flag,
 *   onSolve: [commands], onTurn: [commands] (optional, instead of the sounds), help: { title, text, icon } }
 *   Every part stands on open floor in the map; this system draws it and keeps the player off it.
 *
 * What it registers:
 *   gate          "features:circuits"   no walking onto a part (in tap mode a walk that ends at a piece turns it)
 *   world.layer   "features:circuits"   the ring at the piece that can be turned now
 *   system        "features:circuits"   places the parts on map:enter
 *   service       "circuits"            { solved(id), reset(id) }
 *   puzzle.reset  type -> (id) => true when it owns that puzzle (and reset it)
 *   save section  "circuits"            { turns: { puzzleId: [turn of each piece] } }
 * With the debug tools, every puzzle of a map is proved fair on entering it (checkCircuitField).
 */

import { Painted } from '../../world/Painted.js';
import { addToWorld } from '../../world/Stage.js';
import { TILE } from '../../core/units.js';
import { CircuitField, checkCircuitField } from './CircuitField.js';

const TURN_SECONDS = 0.25;
/* the light of a solved line runs this many pieces a second */
const WAVE_SPEED = 7;
const STEP = [[0, 1], [0, -1], [-1, 0], [1, 0]];

export class Circuits {
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
    const section = this.#game.save.state.circuits;
    if (section && !section.turns) section.turns = {};
    return section ? section.turns : {};
  }

  fieldOf(id) {
    const def = this.#all()[id];
    if (!def) return null;
    if (!this.#fields.has(id)) {
      const field = new CircuitField(def);
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
    if (entry) entry.power = field.power();
    return true;
  }

  /* ---------- the map ---------- */

  #enter(world) {
    this.#world = world;
    this.#here = [];
    for (const [id, def] of Object.entries(this.#all())) {
      if (def.map !== world.map.id) continue;
      const field = this.fieldOf(id);
      const done = this.solved(id);
      const entry = { id, def, field, near: -1, turning: field.pieces.map(() => null), power: field.power(), litAt: done ? -1e9 : null, pieceLook: {}, endLook: {} };
      this.#here.push(entry);
      field.pieces.forEach((piece, index) => this.#place(world, `circuit:${id}:${index}`, piece, (ctx, p, env) => this.#paintPiece(ctx, entry, index, p, env)));
      this.#place(world, `circuit:${id}:source`, field.source, (ctx, p, env) => this.#paintEnd(ctx, entry, 'source', p, env));
      this.#place(world, `circuit:${id}:target`, field.target, (ctx, p, env) => this.#paintEnd(ctx, entry, 'target', p, env));
      if (this.#game.registry.has('system', 'debug')) this.#prove(id, def, world);
    }
  }

  #place(world, name, part, paint) {
    if (!Number.isInteger(part.x) || !Number.isInteger(part.y)) return;
    const piece = new Painted(name, {
      x: part.x * TILE, y: part.y * TILE, depth: part.y * TILE + TILE,
      bounds: { left: -6, top: -26, right: TILE + 6, bottom: TILE + 4 },
      paint: (ctx, p, art, env) => paint(ctx, p, env),
    });
    addToWorld(world, piece);
  }

  #prove(id, def, world) {
    try {
      const map = world.map;
      const start = def.start || [world.player.tx, world.player.ty];
      const problems = checkCircuitField(def, { start, walkable: (x, y) => map.inside(x, y) && !map.solidAt(x, y) });
      if (problems.length) console.warn(`Circuits: puzzle "${id}" is not fair:`, problems);
    } catch (error) {
      console.warn(`Circuits: puzzle "${id}" could not be proved`, error);
    }
  }

  #lit(entry) {
    return this.solved(entry.id) || entry.power.reached;
  }

  #paintPiece(ctx, entry, index, piece, env) {
    if (!this.#o.paintPiece) return;
    const field = entry.field;
    const turning = entry.turning[index];
    const k = turning ? Math.min(1, (this.#now - turning.at) / TURN_SECONDS) : 1;
    const turn = field.state[index];
    const look = entry.pieceLook;
    look.shape = field.pieces[index].shape;
    look.base = field.pieces[index].ends;
    look.angle = turning && k < 1 ? turning.from + (turn - turning.from + 4) % 4 * k : turn;
    look.lit = entry.power.lit[index] || (this.solved(entry.id) && !entry.power.reached);
    look.near = entry.near === index;
    look.fixed = field.pieces[index].fixed;
    look.done = this.solved(entry.id);
    const order = entry.power.path.indexOf(index);
    look.wave = entry.litAt !== null && order >= 0 ? waveAt((this.#now - entry.litAt) * WAVE_SPEED - order) : 0;
    this.#o.paintPiece(ctx, piece.x, piece.y, look, env);
  }

  #paintEnd(ctx, entry, which, piece, env) {
    const paint = which === 'source' ? this.#o.paintSource : this.#o.paintTarget;
    if (!paint) return;
    const field = entry.field;
    const look = entry.endLook;
    const done = this.solved(entry.id);
    look.done = done;
    look.t = this.#now;
    if (which === 'source') {
      look.out = field.source.out;
      look.lit = true;
    } else {
      look.in = field.target.in;
      /* the lamp lights once the running light has reached it */
      const since = entry.litAt === null ? Infinity : (this.#now - entry.litAt) * WAVE_SPEED - entry.power.path.length;
      look.lit = done && since >= 0;
      look.k = look.lit ? Math.min(1, since / (WAVE_SPEED * 0.6)) : 0;
    }
    paint(ctx, piece.x, piece.y, look, env);
  }

  #partAt(tx, ty) {
    for (const entry of this.#here) {
      const part = entry.field.partAt(tx, ty);
      if (part) return { entry, part, index: entry.field.pieceAt(tx, ty) };
    }
    return null;
  }

  #turn({ entry, index }) {
    const story = this.#story();
    if (!story || story.busy || index < 0 || this.solved(entry.id)) return;
    const field = entry.field;
    const piece = field.pieces[index];
    const target = { kind: 'circuit', type: `circuit:${entry.id}`, map: entry.def.map, x: piece.x, y: piece.y, id: entry.id };
    const commands = [];
    if (piece.fixed) {
      story.play(commands, { target });
      return;
    }
    const before = entry.power.lit.filter(Boolean).length;
    const from = field.state[index];
    field.turn(index);
    entry.turning[index] = { from, at: this.#now };
    this.#saved()[entry.id] = field.state.slice();
    entry.power = field.power();
    if (Array.isArray(entry.def.onTurn) && entry.def.onTurn.length) commands.push(...entry.def.onTurn);
    else {
      const further = entry.power.lit.filter(Boolean).length > before;
      const sound = further ? this.#o.sounds.lit || this.#o.sounds.turn : this.#o.sounds.turn;
      if (sound && !entry.power.reached) commands.push({ sound });
    }
    story.play(commands, { target });
    if (entry.power.reached) this.#solve(entry);
  }

  onInteract({ map, tx, ty }) {
    if (!this.#world || !map || this.#world.map !== map) return;
    const found = this.#partAt(tx, ty);
    if (found && found.part === 'piece') this.#turn(found);
  }

  gate(step) {
    if (step.door || !this.#here.length || !this.#world || step.map !== this.#world.map.id) return false;
    const found = this.#partAt(step.tx, step.ty);
    if (!found) return false;
    const input = this.#game.input;
    if (found.part === 'piece' && input && input.mode === 'tap' && !input.dx && !input.dy) this.#turn(found);
    return true;
  }

  #step({ tx, ty }) {
    for (const entry of this.#here) {
      if (!this.solved(entry.id) && this.#beside(entry.field, tx, ty) >= 0) this.#teach(entry);
    }
  }

  #beside(field, tx, ty) {
    for (const [dx, dy] of STEP) {
      const index = field.pieceAt(tx + dx, ty + dy);
      if (index >= 0 && !field.pieces[index].fixed) return index;
    }
    return -1;
  }

  #teach(entry) {
    const help = entry.def.help;
    const story = this.#story();
    if (!help || !help.text || !story || typeof story.helper !== 'function') return;
    try {
      story.helper({ id: `circuits:${entry.id}`, title: help.title, text: help.text, icon: help.icon });
    } catch (error) {
      console.warn('Circuits: the piece card could not be shown', error);
    }
  }

  #solve(entry) {
    const story = this.#story();
    if (!story || !entry.def.solved) return;
    story.setFlag(entry.def.solved, true);
    entry.litAt = this.#now;
    try {
      this.#game.save.commit();
    } catch (error) {
      console.warn('Circuits: saving failed', error);
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
    const light = this.#o.light;
    for (const entry of this.#here) {
      const done = this.solved(entry.id);
      entry.near = still && !done ? this.#beside(entry.field, player.tx, player.ty) : -1;
      const target = entry.field.target;
      if (!light || !done || !Number.isInteger(target.x) || typeof world.addLight !== 'function') continue;
      const since = entry.litAt === null ? Infinity : (this.#now - entry.litAt) * WAVE_SPEED - entry.power.path.length;
      if (since < 0) continue;
      const lamp = entry.lamp || (entry.lamp = { x: 0, y: 0, r: light.r || 40, color: light.color || '#ffe0a0', soft: true });
      lamp.x = target.x * TILE + TILE / 2;
      lamp.y = target.y * TILE - (light.rise || 0);
      world.addLight(lamp);
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
        console.warn('Circuits: the pieces could not be placed', error);
      }
    });
    this.#game.bus.on('player:step', (event) => {
      try {
        this.#step(event);
      } catch (error) {
        console.warn('Circuits: a step could not be checked', error);
      }
    });
  }
}

/* the light passing one piece: up quickly, then settling to a steady glow */
function waveAt(u) {
  if (u <= 0) return 0;
  if (u < 1) return u;
  return Math.max(0.35, 1 - (u - 1) * 0.5);
}

export function installCircuits(game, options = {}) {
  const circuits = new Circuits(game, options);
  const { registry } = game;
  game.save.define('circuits', { turns: {} });
  game.bus.on('world:interact', (event) => circuits.onInteract(event));
  registry.add('gate', 'features:circuits', (step) => circuits.gate(step));
  registry.add('world.layer', 'features:circuits', { update: (dt, world) => circuits.update(dt, world) });
  registry.add('system', 'features:circuits', circuits);
  registry.add('service', 'circuits', { solved: (id) => circuits.solved(id), reset: (id) => circuits.reset(id) });
  registry.add('puzzle.reset', options.type || 'circuit', (id) => (circuits.owns(id) ? (circuits.reset(id), true) : false));
  return circuits;
}
