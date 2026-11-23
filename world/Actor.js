/*
 * Actor.js
 * Job: an Entity drawn as a person that stands on the tile grid and walks it one tile at a time.
 *
 * Public API:
 *   new Actor(id, look)   look: a character the painters know
 *   look, tx, ty, dir, frame, moving, steps
 *   pose                  extra painter options ({ npc, seed, idle, talking }) or undefined
 *   placeAt(tx, ty, dir)  stand on a tile at once
 *   stepTo(dir, carry)    start walking one tile in that direction; carry: progress (0..1) left over
 *                         from the step before, so chained steps run without a hitch
 *   walk(amount)          advance the current step by a share of a tile; returns the progress left
 *                         over when the step is complete, or -1 while still walking
 *   painter               optional (ctx, art, env, shadow) => void set from outside: it paints the actor
 *                         instead of its own look until it is set to null (shadow: draw the shadow too)
 *   draw(ctx, art, env)   shadow and body
 *   drawBody(ctx, art, env)   the body alone (the see-through outline behind tall things)
 */

import { Entity } from './Entity.js';
import { DIR_STEP, feetX, feetY } from '../core/units.js';

/* a person's art is 28 pixels wide and tall, centred on the feet; the shadow reaches a little further */
const HALF_WIDTH = 16;
const HEIGHT = 30;
const BELOW = 6;

export class Actor extends Entity {
  tx = 0;
  ty = 0;
  dir = 0;
  frame = 0;
  moving = false;
  painter = null;
  steps = 0;
  pose = undefined;

  #fromX = 0;
  #fromY = 0;
  #progress = 0;

  constructor(id, look) {
    super(id);
    this.look = look;
  }

  placeAt(tx, ty, dir = this.dir) {
    this.tx = tx;
    this.ty = ty;
    this.dir = dir;
    this.moving = false;
    this.frame = 0;
    this.#moveTo(feetX(tx), feetY(ty));
  }

  stepTo(dir, carry = 0) {
    this.dir = dir;
    this.#fromX = this.tx;
    this.#fromY = this.ty;
    this.tx += DIR_STEP[dir][0];
    this.ty += DIR_STEP[dir][1];
    this.#progress = carry;
    this.moving = true;
    /* show the first walk frame at once, so chained steps never flash the standing frame */
    this.walk(0);
  }

  walk(amount) {
    this.#progress += amount;
    if (this.#progress >= 1) {
      const left = this.#progress - 1;
      this.moving = false;
      this.steps++;
      this.frame = 0;
      this.#moveTo(feetX(this.tx), feetY(this.ty));
      return left;
    }
    const k = this.#progress;
    this.#moveTo(feetX(this.#fromX + (this.tx - this.#fromX) * k), feetY(this.#fromY + (this.ty - this.#fromY) * k));
    /* four walk frames: each step swings one leg out and back, alternating legs */
    const odd = this.steps % 2 === 1;
    if (k < 0.5) this.frame = odd ? 1 : 3;
    else this.frame = odd ? 2 : 0;
    return -1;
  }

  /* a painter set from outside draws this actor instead of its own look (a rider on a mount) */
  #paintedBy(ctx, art, env, shadow) {
    if (typeof this.painter !== 'function') return false;
    try {
      this.painter(ctx, art, env, shadow);
    } catch (error) {
      /* nothing in a draw path may throw */
    }
    return true;
  }

  draw(ctx, art, env) {
    if (this.#paintedBy(ctx, art, env, true)) return;
    art.drawShadow(ctx, this.x, this.y, 6, 2, env);
    this.drawBody(ctx, art, env);
  }

  drawBody(ctx, art, env) {
    if (this.#paintedBy(ctx, art, env, false)) return;
    art.drawPerson(ctx, this.look, Math.round(this.x), Math.round(this.y), this.dir, this.frame, env, this.pose);
  }

  #moveTo(x, y) {
    this.x = x;
    this.y = y;
    const b = this.bounds;
    b.left = x - HALF_WIDTH;
    b.right = x + HALF_WIDTH;
    b.top = y - HEIGHT;
    b.bottom = y + BELOW;
  }
}
