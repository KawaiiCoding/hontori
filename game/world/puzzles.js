/*
 * game/world/puzzles.js
 * Job: Hontori's push puzzles in the world (content `puzzles`, type 'push'; src/puzzles.js): glowing
 * moss pads on the floor, leaf piles that glide one tile when the player walks into them, and a
 * lattice of roots across the gate tile. The rules are world/PushPuzzle.js. When every pad holds a
 * pile the puzzle's `solved` flag is set, the game is saved and its `onSolve` commands run; the gate
 * is gone and the leaves bloom into the moss. Unsolved piles go back when the room is entered again
 * (`resetOnEnter`), or on the story command { puzzle: id, do: 'reset' }.
 *
 * Public API:
 *   class Puzzles
 *     constructor(game)
 *     enter(world, stage)        map:enter: this map's puzzles into the picture
 *     gate(step)                 registry kind "gate": a pile is pushed (the player follows into its
 *                                tile) or refuses; the shut gate refuses
 *     update(dt)                 piles glide toward their tiles
 *     lights(world)              each world step: every moss pad glows, brighter and steady once
 *                                a pile rests on it (src/puzzles.js), through world.addLight
 *     has(id)                    true for a push puzzle of the content
 *     command(node, ctx)         story command "puzzle" { puzzle: id, do: 'reset' }
 *     solved(id), reset(id)      also offered as registry kind "service", id "puzzles" (a trial's
 *                                'push' test passes when solved(id) is true)
 */

import { PushPuzzle } from '../../world/PushPuzzle.js';
import { Painted } from '../../world/Painted.js';
import { TILE } from '../../core/units.js';
import { merged, storyOf, sound } from './common.js';

const GLIDE = 0.35;
const LEAF_COLORS = ['#6a2a10', '#a8461a', '#d8742a', '#f0a83a', '#ffd060', '#c03a24'];
const PAD_BLIP_MS = 200;
const PAD_LIGHT = { color: '#b0ff90', r: 16, on: 26 };

export class Puzzles {
  #game;
  #defs = null;
  #live = new Map();
  #pieces = [];

  constructor(game) {
    this.#game = game;
  }

  #all() {
    if (!this.#defs) {
      const all = merged(this.#game, 'puzzles');
      this.#defs = Object.fromEntries(Object.entries(all).filter(([, def]) => def && (def.type || 'push') === 'push'));
    }
    return this.#defs;
  }

  #puzzle(id) {
    const def = this.#all()[id];
    if (!def) return null;
    if (!this.#live.has(id)) this.#live.set(id, new PushPuzzle(def));
    return this.#live.get(id);
  }

  has(id) {
    return !!this.#all()[id];
  }

  solved(id) {
    const def = this.#all()[id];
    const story = storyOf(this.#game);
    return !!def && !!story && !!story.flag(def.solved);
  }

  reset(id) {
    const puzzle = this.#puzzle(id);
    if (!puzzle || this.solved(id)) return;
    puzzle.reset();
    for (const piece of this.#pieces) if (piece.data.id === id && piece.data.box) piece.data.snap = true;
  }

  command(node, ctx) {
    const id = ctx.value(node.puzzle);
    if ((node.do || 'reset') === 'reset') this.reset(id);
  }

  /* ---------- the map ---------- */

  enter(world, stage) {
    this.#pieces = [];
    for (const [id, def] of Object.entries(this.#all())) {
      if (def.map !== world.map.id) continue;
      const puzzle = this.#puzzle(id);
      if (def.resetOnEnter !== false && !this.solved(id)) puzzle.reset();
      for (const [x, y] of puzzle.pads) this.#add(stage, new Painted(`pad:${id}:${x}:${y}`, {
        x: x * TILE, y: y * TILE, depth: y * TILE + 1, paint: (ctx, p, art, env) => this.#paintPad(ctx, p, env),
      }), { id, puzzle, x, y });
      puzzle.boxes.forEach((box, index) => this.#add(stage, new Painted(`pile:${id}:${index}`, {
        x: box.x * TILE, y: box.y * TILE, depth: (p) => p.y + TILE,
        bounds: { left: -2, top: -2, right: TILE + 2, bottom: TILE + 4 },
        paint: (ctx, p, art, env) => this.#paintPile(ctx, p, env),
      }), { id, puzzle, box }));
      if (puzzle.gate) {
        const [x, y] = puzzle.gate;
        this.#add(stage, new Painted(`gate:${id}`, {
          x: x * TILE, y: y * TILE, depth: y * TILE + TILE,
          bounds: { left: -4, top: -20, right: TILE + 4, bottom: TILE + 2 },
          paint: (ctx, p) => this.#paintGate(ctx, p),
        }), { id, puzzle });
      }
    }
    this.#show();
  }

  #add(stage, piece, data) {
    piece.data = data;
    this.#pieces.push(piece);
    stage(piece);
  }

  /* piles and the gate leave the picture once solved; pads stay and bloom */
  #show() {
    for (const piece of this.#pieces) {
      const { id, box, x } = piece.data;
      if (box || x == null) piece.visible = !this.solved(id);
    }
  }

  lights(world) {
    for (const piece of this.#pieces) {
      const { id, puzzle, x, y, box } = piece.data;
      if (box || x == null || y == null) continue;
      const on = this.solved(id) || !!puzzle.boxAt(x, y);
      if (!piece.data.light) piece.data.light = { x: x * TILE + 8, y: y * TILE + 8, r: PAD_LIGHT.r, color: PAD_LIGHT.color, flicker: true };
      const light = piece.data.light;
      light.r = on ? PAD_LIGHT.on : PAD_LIGHT.r;
      light.flicker = !on;
      world.addLight(light);
    }
  }

  update() {
    for (const piece of this.#pieces) {
      const { box } = piece.data;
      if (!box) continue;
      const tx = box.x * TILE;
      const ty = box.y * TILE;
      if (piece.data.snap) {
        piece.data.snap = false;
        piece.moveTo(tx, ty);
        continue;
      }
      if (piece.x === tx && piece.y === ty) continue;
      let nx = piece.x + (tx - piece.x) * GLIDE;
      let ny = piece.y + (ty - piece.y) * GLIDE;
      if (Math.abs(tx - nx) < 0.2) nx = tx;
      if (Math.abs(ty - ny) < 0.2) ny = ty;
      piece.moveTo(nx, ny);
    }
  }

  gate(step) {
    if (step.door) return false;
    for (const [id, def] of Object.entries(this.#all())) {
      if (def.map !== step.map || this.solved(id)) continue;
      const puzzle = this.#puzzle(id);
      if (!puzzle.blocks(step.tx, step.ty, false)) continue;
      if (!puzzle.boxAt(step.tx, step.ty)) return true;
      return !this.#push(id, def, puzzle, step);
    }
    return false;
  }

  #push(id, def, puzzle, step) {
    const world = this.#game.scenes.top;
    const player = step.player;
    if (!world || !world.map || !player) return false;
    const dx = step.tx - player.tx;
    const dy = step.ty - player.ty;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return false;
    const moved = puzzle.push(step.tx, step.ty, dx, dy, (x, y) => world.map.inside(x, y) && !world.isBlocked(x, y) && !world.map.doorAt(x, y));
    if (!moved) {
      sound(this.#game, 'bump');
      return false;
    }
    sound(this.#game, 'step');
    if (moved.covered) this.#solve(def);
    else if (moved.onPad) setTimeout(() => sound(this.#game, 'blip'), PAD_BLIP_MS);
    return true;
  }

  #solve(def) {
    const story = storyOf(this.#game);
    if (!story) return;
    story.setFlag(def.solved, true);
    try {
      this.#game.save.commit();
    } catch (error) {
      console.warn('Puzzles: saving failed', error);
    }
    this.#show();
    if (Array.isArray(def.onSolve) && def.onSolve.length) story.run(def.onSolve);
  }

  /* ---------- the look (src/puzzles.js) ---------- */

  #paintPad(ctx, piece, env) {
    const { id, puzzle, x: tx, y: ty } = piece.data;
    const x = piece.x;
    const y = piece.y;
    const done = this.solved(id);
    const on = done || !!puzzle.boxAt(tx, ty);
    const pulse = (Math.sin((env.t || 0) * 2 + tx) + 1) / 2;
    ctx.fillStyle = on ? '#4aa040' : '#2f6a2a';
    ctx.fillRect(x + 2, y + 3, 12, 10);
    ctx.fillRect(x + 3, y + 2, 10, 12);
    ctx.fillStyle = on ? 'rgba(200,255,150,0.75)' : `rgba(140,240,120,${(0.25 + pulse * 0.35).toFixed(2)})`;
    ctx.fillRect(x + 5, y + 5, 6, 6);
    ctx.fillRect(x + 7, y + 3, 2, 10);
    ctx.fillRect(x + 3, y + 7, 10, 2);
    if (!done) return;
    /* the leaves sank into the moss and bloomed */
    ctx.fillStyle = '#ffd0e8';
    ctx.fillRect(x + 4, y + 4, 2, 2);
    ctx.fillRect(x + 10, y + 9, 2, 2);
    ctx.fillStyle = '#fff6a0';
    ctx.fillRect(x + 7, y + 6, 2, 2);
  }

  #paintPile(ctx, piece, env) {
    const { puzzle, box } = piece.data;
    const x = Math.round(piece.x);
    const y = Math.round(piece.y);
    const t = env.t || 0;
    ctx.fillStyle = 'rgba(30,15,5,0.35)';
    ctx.fillRect(x, y + 12, 16, 4);
    ctx.fillStyle = '#3a1808';
    ctx.fillRect(x + 1, y + 4, 14, 11);
    ctx.fillRect(x + 3, y + 1, 10, 14);
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 7; col++) {
        if (row === 0 && (col < 1 || col > 5)) continue;
        ctx.fillStyle = LEAF_COLORS[(row * 3 + col * 5 + (x >> 4)) % 6];
        ctx.fillRect(x + 2 + col * 2 + (row % 2), y + 2 + row * 2, 2, 2);
      }
    }
    const wave = Math.sin(t * 3 + x * 0.1) > 0.8 ? 1 : 0;
    ctx.fillStyle = '#ffe48a';
    ctx.fillRect(x + 6 + wave, y + 2, 3, 1);
    ctx.fillRect(x + 10, y + 5 + wave, 2, 1);
    if (puzzle.onPad(box.x, box.y)) {
      ctx.fillStyle = 'rgba(170,255,140,0.35)';
      ctx.fillRect(x + 1, y + 1, 14, 14);
    }
  }

  #paintGate(ctx, piece) {
    const gx = piece.x;
    const gy = piece.y;
    ctx.fillStyle = '#2a1a0c';
    ctx.fillRect(gx - 2, gy - 18, 20, 34);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i % 2 ? '#6a4424' : '#8a5a30';
      ctx.fillRect(gx - 1 + i * 4, gy - 17, 3, 32);
    }
    ctx.fillStyle = '#5a3a1e';
    for (let j = 0; j < 4; j++) ctx.fillRect(gx - 2, gy - 12 + j * 8, 20, 2);
    ctx.fillStyle = '#4a7a34';
    for (let k = 0; k < 6; k++) ctx.fillRect(gx + ((k * 7) % 18) - 1, gy - 16 + ((k * 11) % 30), 2, 2);
  }
}
