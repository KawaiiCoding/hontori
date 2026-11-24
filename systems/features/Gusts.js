/*
 * Gusts.js  (engine: features)
 * Job: wind-vane puzzles in the world (rules in GustField.js). Content `puzzles` of the game's vane type name
 * vanes standing on tiles, gust zones over bridges or ledges, and a goal. The player turns a vane by using it
 * (the action button facing it, or a tap); its gust then blows the way it points. Stepping onto a windy tile
 * carries the player along the wind; inside a windy zone only a step with the wind is allowed. Reaching the
 * goal sets the puzzle's `solved` flag, saves, calms every gust of it (so it can be crossed both ways) and runs
 * `onSolve`. Vane turns are saved, so a journey always comes back to the same wind.
 *
 * Public API:
 *   installGusts(game, options)   in build, before game.save.load() and game.start()
 *     options: {
 *       type          the puzzle type it owns ('vanes')
 *       paintVane(ctx, x, y, look, env)   a vane in map pixels: x, y the top-left of its tile;
 *                     look: { dir, from, k, near } (k: 0..1 of the turn from `from` to `dir`; near: the
 *                     player stands next to it and can turn it now)
 *       streak        { color, width, length, speed, density }   the faint wind lines drifting over a windy
 *                     zone the way it blows (length in pixels, speed in pixels a second, lines per tile)
 *       sounds        { turn, gust, solve } sound names for game.sound.play
 *     }
 *     returns the Gusts object below
 *   class Gusts
 *     solved(id), reset(id)   also offered as registry kind "service", id "gusts"
 *     fieldOf(id)             the GustField of a puzzle (for a test or a checker)
 *
 * Puzzle shape (content `puzzles`): { map, type, vanes: [{ x, y, turns: ['up', 'right', ...], start, gusts: [id] }],
 *   gusts: [{ id, x: [x0, x1], y: [y0, y1] }], goal: { x: [x0, x1], y: [y0, y1] }, solved: flag,
 *   onSolve: [commands], onTurn: [commands] (optional, instead of the turn sound), help: { title, text, icon } }
 *   help is the once-only card shown the first time the player stands next to one of its vanes (text ids).
 *
 * What it registers:
 *   gate          "features:gusts"    no walking onto a vane (in tap mode a walk that ends at one turns it);
 *                                     inside a windy zone only with the wind
 *   world.layer   "features:gusts"    carries the player along the wind; draws the wind lines
 *   system        "features:gusts"    places the vanes on map:enter, watches player:step for the goal
 *   service       "gusts"             { solved(id), reset(id) }
 *   puzzle.reset  type -> (id) => true when it owns that puzzle (and reset it)
 *   save section  "gusts"             { turns: { puzzleId: [turn index of each vane] } }
 * With the debug tools, every puzzle of a map is proved fair on entering it (checkGustField) and the
 * problems go to the console.
 */

import { Painted } from '../../world/Painted.js';
import { addToWorld } from '../../world/Stage.js';
import { TILE } from '../../core/units.js';
import { GustField, checkGustField } from './GustField.js';

const TURN_SECONDS = 0.3;
const CARRY_LIMIT = 64;
const STREAK = { color: 'rgba(235,245,255,0.35)', width: 1, length: 6, speed: 30, density: 0.7 };
const STEP = [[0, 1], [0, -1], [-1, 0], [1, 0]];

const span = (v) => (Array.isArray(v) ? v : [v, v]);

/* a zone's rectangle in map pixels and its number of wind lines, worked out once per map */
function boxOf(zone, zi, density) {
  const [ax, bx] = span(zone.x);
  const [ay, by] = span(zone.y);
  const x0 = Math.min(ax, bx) * TILE;
  const x1 = (Math.max(ax, bx) + 1) * TILE;
  const y0 = Math.min(ay, by) * TILE;
  const y1 = (Math.max(ay, by) + 1) * TILE;
  const count = Math.max(2, Math.round(((x1 - x0) * (y1 - y0)) / (TILE * TILE) * density));
  return { x0, x1, y0, y1, zi, count };
}

export class Gusts {
  #game;
  #o;
  #defs = null;
  #fields = new Map();
  #world = null;
  #here = [];
  #pending = false;
  #carried = 0;
  #now = 0;

  constructor(game, options) {
    this.#game = game;
    this.#o = { sounds: {}, ...options };
    this.#o.streak = { ...STREAK, ...(options.streak || {}) };
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

  #story() {
    return this.#game.story || this.#game.registry.get('service', 'story') || null;
  }

  #saved() {
    const section = this.#game.save.state.gusts;
    if (section && !section.turns) section.turns = {};
    return section ? section.turns : {};
  }

  fieldOf(id) {
    const def = this.#all()[id];
    if (!def) return null;
    if (!this.#fields.has(id)) {
      const field = new GustField(def);
      field.load(this.#saved()[id]);
      this.#fields.set(id, field);
    }
    const field = this.#fields.get(id);
    field.calm = this.solved(id);
    return field;
  }

  solved(id) {
    const def = this.#all()[id];
    const story = this.#story();
    return !!def && !!story && !!def.solved && !!story.flag(def.solved);
  }

  reset(id) {
    const field = this.fieldOf(id);
    if (!field || this.solved(id)) return;
    field.reset();
    this.#saved()[id] = field.state.slice();
  }

  /* ---------- the map ---------- */

  #enter(world) {
    this.#world = world;
    this.#here = [];
    this.#pending = true;
    this.#carried = 0;
    const map = world.map;
    for (const [id, def] of Object.entries(this.#all())) {
      if (def.map !== map.id) continue;
      const field = this.fieldOf(id);
      const density = this.#o.streak.density;
      const entry = { id, def, field, near: -1, turning: field.vanes.map(() => null), boxes: field.zones.map((zone, zi) => boxOf(zone, zi, density)) };
      this.#here.push(entry);
      field.vanes.forEach((vane, index) => {
        const piece = new Painted(`vane:${id}:${index}`, {
          x: vane.x * TILE, y: vane.y * TILE, depth: vane.y * TILE + TILE,
          bounds: { left: -10, top: -32, right: TILE + 10, bottom: TILE + 4 },
          paint: (ctx, p, art, env) => this.#paintVane(ctx, entry, index, p, env),
        });
        addToWorld(world, piece);
      });
      if (this.#game.registry.has('system', 'debug')) this.#prove(id, def, world);
    }
  }

  #prove(id, def, world) {
    try {
      const map = world.map;
      const start = def.start || [world.player.tx, world.player.ty];
      const problems = checkGustField(def, { start, walkable: (x, y) => map.inside(x, y) && !map.solidAt(x, y) });
      if (problems.length) console.warn(`Gusts: puzzle "${id}" is not fair:`, problems);
    } catch (error) {
      console.warn(`Gusts: puzzle "${id}" could not be proved`, error);
    }
  }

  #paintVane(ctx, entry, index, piece, env) {
    if (!this.#o.paintVane) return;
    const turning = entry.turning[index];
    const dir = entry.field.dirOf(index);
    const k = turning ? Math.min(1, (this.#now - turning.at) / TURN_SECONDS) : 1;
    this.#o.paintVane(ctx, piece.x, piece.y, { dir, from: turning && k < 1 ? turning.from : dir, k, near: entry.near === index }, env);
  }

  #vaneAt(tx, ty) {
    for (const entry of this.#here) {
      const index = entry.field.vaneAt(tx, ty);
      if (index >= 0) return { entry, index };
    }
    return null;
  }

  #turn({ entry, index }) {
    const story = this.#story();
    if (!story || story.busy) return;
    const from = entry.field.dirOf(index);
    entry.field.turn(index);
    entry.turning[index] = { from, at: this.#now };
    this.#saved()[entry.id] = entry.field.state.slice();
    const vane = entry.field.vanes[index];
    const commands = [];
    if (Array.isArray(entry.def.onTurn) && entry.def.onTurn.length) commands.push(...entry.def.onTurn);
    else if (this.#o.sounds.turn) commands.push({ sound: this.#o.sounds.turn });
    /* the turn plays as a short script, so nothing else uses the same tile this time */
    story.play(commands, { target: { kind: 'vane', type: `vane:${entry.id}`, map: entry.def.map, x: vane.x, y: vane.y, id: entry.id } });
  }

  onInteract({ map, tx, ty }) {
    if (!this.#world || !map || this.#world.map !== map) return;
    const found = this.#vaneAt(tx, ty);
    if (found) this.#turn(found);
  }

  gate(step) {
    if (step.door || !this.#here.length || !this.#world || step.map !== this.#world.map.id) return false;
    const player = step.player || this.#world.player;
    const found = this.#vaneAt(step.tx, step.ty);
    if (found) {
      /* a tap route that ends at a vane turns it, as a tap on anything solid uses it */
      const input = this.#game.input;
      if (input && input.mode === 'tap' && !input.dx && !input.dy) this.#turn(found);
      return true;
    }
    for (const entry of this.#here) if (!entry.field.allows(player.tx, player.ty, step.tx, step.ty)) return true;
    return false;
  }

  /* ---------- the wind on the player ---------- */

  #step({ tx, ty }) {
    if (!this.#here.length) return;
    this.#pending = true;
    for (const entry of this.#here) {
      if (this.solved(entry.id)) continue;
      if (entry.field.atGoal(tx, ty)) this.#solve(entry);
      else if (this.#beside(entry.field, tx, ty) >= 0) this.#teach(entry);
    }
  }

  /* the vane next to a tile (one step away, not across a corner), or -1 */
  #beside(field, tx, ty) {
    for (const [dx, dy] of STEP) {
      const index = field.vaneAt(tx + dx, ty + dy);
      if (index >= 0) return index;
    }
    return -1;
  }

  /* the once-only card, the first time the player stands where a vane can be turned */
  #teach(entry) {
    const help = entry.def.help;
    const story = this.#story();
    if (!help || !help.text || !story || typeof story.helper !== 'function') return;
    try {
      story.helper({ id: `gusts:${entry.id}`, title: help.title, text: help.text, icon: help.icon });
    } catch (error) {
      console.warn('Gusts: the vane card could not be shown', error);
    }
  }

  /* which vane the player could turn right now, for its ring on the ground */
  #nearby(world) {
    const player = world.player;
    const story = this.#story();
    const still = player && !player.moving && !(story && story.busy);
    for (const entry of this.#here) {
      entry.near = still && !this.solved(entry.id) ? this.#beside(entry.field, player.tx, player.ty) : -1;
    }
  }

  #solve(entry) {
    const story = this.#story();
    if (!story || !entry.def.solved) return;
    story.setFlag(entry.def.solved, true);
    entry.field.calm = true;
    try {
      this.#game.save.commit();
    } catch (error) {
      console.warn('Gusts: saving failed', error);
    }
    this.#sound(this.#o.sounds.solve);
    if (Array.isArray(entry.def.onSolve) && entry.def.onSolve.length) story.run(entry.def.onSolve);
  }

  update(dt, world) {
    this.#now += dt;
    if (world !== this.#world || !this.#here.length) return;
    this.#nearby(world);
    if (!this.#pending) return;
    const player = world.player;
    if (!player || player.moving) return;
    const free = (x, y) => world.map.inside(x, y) && !world.isBlocked(x, y) && !this.#vaneAt(x, y);
    let dir = -1;
    for (const entry of this.#here) {
      entry.field.calm = this.solved(entry.id);
      dir = entry.field.carry(player.tx, player.ty, free);
      if (dir >= 0) break;
    }
    if (dir < 0 || this.#carried >= CARRY_LIMIT) {
      this.#pending = false;
      this.#carried = 0;
      return;
    }
    /* pushed: the player keeps facing the way they looked */
    if (!this.#carried) this.#sound(this.#o.sounds.gust);
    this.#carried++;
    this.#pending = false;
    const facing = player.dir;
    player.stepTo(dir, 0);
    player.dir = facing;
  }

  /* wind lines over the windy zones on screen, worked out from the time alone */
  draw(ctx, world) {
    if (world !== this.#world || !this.#here.length || !world.camera) return;
    const cam = world.camera;
    const streak = this.#o.streak;
    ctx.save();
    ctx.fillStyle = streak.color;
    for (const entry of this.#here) {
      const field = entry.field;
      if (field.calm) continue;
      for (const box of entry.boxes) {
        const { x0, x1, y0, y1, zi, count } = box;
        if (x1 < cam.x || y1 < cam.y || x0 > cam.x + cam.width || y0 > cam.y + cam.height) continue;
        const dir = field.windAt(x0 / TILE, y0 / TILE);
        if (dir < 0) continue;
        const [sx, sy] = STEP[dir];
        const w = x1 - x0;
        const h = y1 - y0;
        const along = sx ? w : h;
        const across = sx ? h : w;
        for (let i = 0; i < count; i++) {
          const seed = (i * 7919 + zi * 104729) % 1000;
          const lane = ((seed * 0.618) % 1) * across;
          let run = ((this.#now * streak.speed * (0.8 + (seed % 5) * 0.1)) + seed * 3) % (along + streak.length * 2);
          run -= streak.length;
          const a = sx > 0 || sy > 0 ? run : along - run;
          const px = sx ? x0 + a : x0 + lane;
          const py = sx ? y0 + lane : y0 + a;
          const bx = Math.max(x0, Math.min(x1, px));
          const by = Math.max(y0, Math.min(y1, py));
          const ex = Math.max(x0, Math.min(x1, px - sx * streak.length));
          const ey = Math.max(y0, Math.min(y1, py - sy * streak.length));
          const long = Math.round(Math.abs(ex - bx) + Math.abs(ey - by));
          if (!long) continue;
          /* a crisp pixel dash along the wind */
          const left = Math.round(Math.min(bx, ex) - cam.x);
          const top = Math.round(Math.min(by, ey) - cam.y);
          if (sx) ctx.fillRect(left, top, long, streak.width);
          else ctx.fillRect(left, top, streak.width, long);
        }
      }
    }
    ctx.restore();
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
        console.warn('Gusts: the vanes could not be placed', error);
      }
    });
    this.#game.bus.on('player:step', (event) => this.#step(event));
  }
}

export function installGusts(game, options = {}) {
  const gusts = new Gusts(game, options);
  const { registry } = game;
  game.save.define('gusts', { turns: {} });
  /* before the story starts listening, so a vane is turned before the story uses the tile */
  game.bus.on('world:interact', (event) => gusts.onInteract(event));
  registry.add('gate', 'features:gusts', (step) => gusts.gate(step));
  registry.add('world.layer', 'features:gusts', { update: (dt, world) => gusts.update(dt, world), draw: (ctx, world) => gusts.draw(ctx, world) });
  registry.add('system', 'features:gusts', gusts);
  registry.add('service', 'gusts', { solved: (id) => gusts.solved(id), reset: (id) => gusts.reset(id) });
  registry.add('puzzle.reset', options.type || 'vanes', (id) => (gusts.fieldOf(id) ? (gusts.reset(id), true) : false));
  return gusts;
}
