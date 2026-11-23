/*
 * Companion.js
 * Job: the creature that walks with the player. It hops along the player's trail, dashes to
 * catch up, and when the player rests it sits down or takes a short stroll nearby.
 *
 * Public API:
 *   new Companion({ key, light, sheds })
 *        key: a creature the art provider knows; light: the glow it carries, { r, color, flicker, soft };
 *        sheds: the particle kind it drops now and then, or null
 *   key, sheds
 *   light                  the glow, placed on its body (a light for the lighting pass)
 *   joinAt(x, y)           appear beside a point (after a map change)
 *   update(dt, player, isBlocked)   isBlocked(tx, ty): may it not stroll onto that tile
 *   shedding               true on the steps where it drops a particle (the scene emits it)
 *   dress                  null, or (ctx, key, x, y, env, pose) => void: the game paints something the
 *                          creature wears over it, with the same place and pose (guarded: one that throws
 *                          is dropped)
 *   draw(ctx, art, env)
 */

import { Entity } from './Entity.js';
import { TILE, DOWN, UP, LEFT, RIGHT } from '../core/units.js';

const FOLLOW_SPEED = 62;
const CATCH_UP_SPEED = 95;
const STROLL_SPEED = 30;
/* it trails this many trail points behind the player */
const TRAIL_LAG = 9;
const CATCH_UP_DISTANCE = 34;
const LOST_DISTANCE = 120;
const REST_AFTER = 2.5;
const STROLL_CHANCE = 0.25;
/* the body floats this far above the ground point */
const BODY_LIFT = 10;
const HOP_HEIGHT = 1.6;
const HOP_RATE = 0.16;
const SHEDS_PER_SECOND = 1.5;
const DRAW_SCALE = 0.75;

export class Companion extends Entity {
  shedding = false;
  dress = null;

  #mode = 'follow';
  #act = 'sit';
  #timer = 0;
  #idle = 0;
  #speed = 0;
  #hop = 0;
  #hopPhase = 0;
  #strollX = null;
  #strollY = 0;
  #pose = { scale: DRAW_SCALE, dir: DOWN, noShadow: true, moving: false, sit: false };

  constructor({ key, light, sheds = null }) {
    super('companion');
    this.key = key;
    this.sheds = sheds;
    this.light = { x: 0, y: 0, ...light };
  }

  joinAt(x, y) {
    this.x = x;
    this.y = y;
    this.#mode = 'follow';
    this.#idle = 0;
    this.#hop = 0;
    this.#strollX = null;
    this.#settle(false);
  }

  update(dt, player, isBlocked) {
    let targetX = this.x;
    let targetY = this.y;
    let speed = FOLLOW_SPEED;

    if (player.moving) {
      this.#idle = 0;
      this.#mode = 'follow';
    } else {
      this.#idle += dt;
    }

    if (this.#mode === 'follow') {
      const far = Math.hypot(player.x - this.x, player.y - this.y);
      const behind = player.trail.length > TRAIL_LAG ? player.trail[player.trail.length - TRAIL_LAG] : null;
      if (behind && player.moving) {
        targetX = behind[0];
        targetY = behind[1];
      }
      if (far > CATCH_UP_DISTANCE) {
        targetX = player.x;
        targetY = player.y;
        speed = CATCH_UP_SPEED;
      }
      if (far > LOST_DISTANCE) {
        this.x = player.x;
        this.y = player.y;
      }
      if (this.#idle > REST_AFTER) this.#rest(4 + Math.random() * 4);
    }

    if (this.#mode === 'play') {
      this.#timer -= dt;
      if (this.#timer <= 0) this.#chooseRestOrStroll(player, isBlocked);
      if (this.#act === 'stroll' && this.#strollX !== null) {
        targetX = this.#strollX;
        targetY = this.#strollY;
        speed = STROLL_SPEED;
      }
    }

    const moved = this.#moveToward(targetX, targetY, speed, dt);
    const pose = this.#pose;
    pose.moving = moved > 0.05;
    pose.sit = !pose.moving && this.#mode === 'play' && this.#act === 'sit';
    if (pose.sit) pose.dir = DOWN;
    this.#hopAlong(moved, dt);
    this.#settle(Math.random() < dt * SHEDS_PER_SECOND);
  }

  draw(ctx, art, env) {
    const bodyY = this.y - BODY_LIFT - this.#hop;
    art.drawShadow(ctx, this.x, this.y, Math.max(3, 5 - this.#hop * 0.25), 2, env);
    art.drawCreature(ctx, this.key, Math.round(this.x), Math.round(bodyY), env, this.#pose);
    if (!this.dress) return;
    try {
      this.dress(ctx, this.key, Math.round(this.x), Math.round(bodyY), env, this.#pose);
    } catch (error) {
      this.dress = null;
      console.warn('Companion: what it wears could not be drawn', error);
    }
  }

  #rest(seconds) {
    this.#mode = 'play';
    this.#act = 'sit';
    this.#timer = seconds;
  }

  /* mostly rest beside the player; a short calm stroll now and then */
  #chooseRestOrStroll(player, isBlocked) {
    if (Math.random() >= STROLL_CHANCE) {
      this.#rest(5 + Math.random() * 6);
      return;
    }
    this.#act = 'stroll';
    this.#timer = 2.5;
    for (let tries = 0; tries < 6; tries++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 12 + Math.random() * 10;
      const x = player.x + Math.cos(angle) * distance;
      const y = player.y + Math.sin(angle) * distance * 0.7;
      if (isBlocked(Math.floor(x / TILE), Math.floor((y - 2) / TILE))) continue;
      this.#strollX = x;
      this.#strollY = y;
      return;
    }
  }

  #moveToward(targetX, targetY, speed, dt) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const distance = Math.hypot(dx, dy);
    const wanted = distance > 0.6 ? Math.min(speed, distance * 6) : 0;
    this.#speed += (wanted - this.#speed) * Math.min(1, dt * 8);
    if (distance <= 0.6) return 0;
    const moved = Math.min(distance, this.#speed * dt);
    this.x += dx / distance * moved;
    this.y += dy / distance * moved;
    if (moved > 0.05) {
      if (Math.abs(dx) > Math.abs(dy)) this.#pose.dir = dx < 0 ? LEFT : RIGHT;
      else this.#pose.dir = dy < 0 ? UP : DOWN;
    }
    return moved;
  }

  /* one bounce about every 11 pixels while travelling; settle smoothly when it stops */
  #hopAlong(moved, dt) {
    if (moved > 0.01) {
      this.#hopPhase += moved * HOP_RATE;
      const height = Math.abs(Math.sin(this.#hopPhase)) * HOP_HEIGHT;
      this.#hop += (height - this.#hop) * Math.min(1, dt * 12);
    } else {
      this.#hop -= this.#hop * Math.min(1, dt * 14);
      this.#hopPhase = 0;
    }
  }

  #settle(shedding) {
    this.shedding = shedding;
    const bodyY = this.y - BODY_LIFT - this.#hop;
    this.light.x = this.x;
    this.light.y = bodyY;
    const b = this.bounds;
    b.left = this.x - 20;
    b.right = this.x + 20;
    b.top = bodyY - 22;
    b.bottom = this.y + 6;
  }
}
