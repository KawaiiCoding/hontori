/*
 * Player.js
 * Job: the one the player moves. An Actor that walks where the player's intent points, one tile at a time,
 * and leaves a trail for the companion to follow.
 *
 * Public API:
 *   new Player(look)
 *   pace                       1; a system may set it to change the walking time per tile (riding)
 *   trail                      recent feet positions [[x, y], ...], oldest first
 *   tryStep(dx, dy, carry, canEnter)   turn toward (dx, dy) and start a step if canEnter(tx, ty)
 *                              allows the tile ahead; returns true if a step started
 *   advance(dt, running)       walk the current step; returns the progress left over when the
 *                              player arrives on the tile, or -1
 *   forgetTrail()              after being placed somewhere new
 */

import { Actor } from './Actor.js';
import { DOWN, UP, LEFT, RIGHT, DIR_STEP } from '../core/units.js';

const WALK_SECONDS_PER_TILE = 0.24;
const RUN_SECONDS_PER_TILE = 0.14;
const TRAIL_SPACING = 2;
const TRAIL_LENGTH = 40;

export class Player extends Actor {
  trail = [];
  /* seconds per tile are multiplied by this (a mount is quicker: below 1) */
  pace = 1;

  constructor(look) {
    super('player', look);
  }

  tryStep(dx, dy, carry, canEnter) {
    const dir = this.#dirOf(dx, dy);
    this.dir = dir;
    if (!canEnter(this.tx + DIR_STEP[dir][0], this.ty + DIR_STEP[dir][1])) {
      this.frame = 0;
      return false;
    }
    this.stepTo(dir, carry);
    return true;
  }

  advance(dt, running) {
    const left = this.walk(dt / ((running ? RUN_SECONDS_PER_TILE : WALK_SECONDS_PER_TILE) * (this.pace > 0 ? this.pace : 1)));
    const last = this.trail[this.trail.length - 1];
    if (!last || Math.hypot(last[0] - this.x, last[1] - this.y) >= TRAIL_SPACING) {
      this.trail.push([this.x, this.y]);
      if (this.trail.length > TRAIL_LENGTH) this.trail.shift();
    }
    return left;
  }

  forgetTrail() {
    this.trail.length = 0;
  }

  /* with two directions held, keep walking along the current axis so diagonals do not jitter */
  #dirOf(dx, dy) {
    const vertical = dy > 0 ? DOWN : UP;
    const horizontal = dx < 0 ? LEFT : RIGHT;
    if (dx && dy) return this.dir === DOWN || this.dir === UP ? vertical : horizontal;
    return dy ? vertical : horizontal;
  }
}
