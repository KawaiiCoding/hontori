/*
 * Painted.js
 * Job: a small thing in the world that is drawn by a paint function and sorted in depth with
 * everyone else: a thing lying on the floor, a pad on the ground, a pile that can be pushed, a
 * fishing line. It blocks nobody; a system that wants it solid says so through a gate.
 *
 * Public API:
 *   new Painted(id, { x, y, depth, bounds, paint, update })
 *        x, y      a point in map pixels (the paint function decides what it means)
 *        depth     drawing order (default: y); a number, or a function (thing) -> number
 *        bounds    { left, top, right, bottom } around (x, y), for culling (default: one tile)
 *        paint     (ctx, thing, art, env) -> nothing; must not throw or change game state
 *        update    optional (dt, thing) -> nothing; called by its owner, never by the view
 *   x, y, visible, data (anything the owner keeps on it)
 *   moveTo(x, y)   move it, keeping its bounds around the new point
 *   depth, bounds, draw(ctx, art, env), update(dt)
 */

import { Entity } from './Entity.js';
import { TILE } from '../core/units.js';

const TILE_BOUNDS = { left: -4, top: -TILE, right: TILE + 4, bottom: TILE + 4 };

export class Painted extends Entity {
  data = null;

  #depth;
  #around;
  #paint;
  #update;

  constructor(id, { x = 0, y = 0, depth, bounds = TILE_BOUNDS, paint, update } = {}) {
    super(id, x, y);
    this.#depth = depth;
    this.#around = { ...bounds };
    this.#paint = paint || null;
    this.#update = update || null;
    this.moveTo(x, y);
  }

  get depth() {
    const depth = this.#depth;
    if (typeof depth === 'function') return depth(this);
    return depth ?? this.y;
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;
    const around = this.#around;
    const b = this.bounds;
    b.left = x + around.left;
    b.top = y + around.top;
    b.right = x + around.right;
    b.bottom = y + around.bottom;
  }

  update(dt) {
    if (this.#update) this.#update(dt, this);
  }

  draw(ctx, art, env) {
    if (this.#paint) this.#paint(ctx, this, art, env);
  }
}
