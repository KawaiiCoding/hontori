/*
 * Compass.js
 * Job: the calm compass arrow in the world. When the followed quest's next spot (or the door toward it)
 * is off screen, one small arrow beside the player's character points to it in one of 8 steady
 * directions. It fades in and out and turns smoothly, only when the direction really changes.
 *
 * Public API (registry kind "world.layer": drawn by the world over the picture, in view pixels):
 *   new Compass(game, quests, { fill, edge, visible(), moment(name) })
 *        visible(): an extra rule for showing it (for example: a compass is carried);
 *        moment('compass:offscreen') the first time it points
 *   update(dt, world)    world: the WorldScene; eases the arrow (fixed step, only while the world runs)
 *   draw(ctx, world)     paints it; never throws, changes nothing
 *
 * The goal is read again on "map:enter", "world:tick" and "quest:change", not every frame.
 */

import { TILE } from '../core/units.js';

/* 16 steady directions: precise enough to follow, calm enough not to jitter */
const STEP = Math.PI / 8;
/* the spot counts as on screen this many pixels inside the view edge */
const EDGE = 12;
/* how far the arrow sits from the body, across and up and down */
const REACH_X = 20;
const REACH_Y = 16;
const BODY_ABOVE_FEET = 9;
/* share of the way eased per 1/30 s, as in the current game */
const FADE = 0.06;
const TURN = 0.12;
const OPACITY = 0.5;
const SCALE = 0.65;
/* the goal is read again this often (seconds) */
const REREAD = 0.5;

export class Compass {
  #game;
  #quests;
  #fill;
  #edge;
  #visible;
  #moment;
  #goal = null;
  #alpha = 0;
  #angle = 0;
  #aim = 0;
  #told = false;
  #since = 0;

  constructor(game, quests, { fill = '#ffe2a0', edge = 'rgba(40,24,6,.7)', visible, moment } = {}) {
    this.#game = game;
    this.#quests = quests;
    this.#fill = fill;
    this.#edge = edge;
    this.#visible = visible;
    this.#moment = moment;
    const reread = (event) => this.#reread(event && event.map && event.map.id);
    game.bus.on('map:enter', reread);
    game.bus.on('world:tick', reread);
    game.bus.on('quest:change', () => this.#reread());
  }

  update(dt, world) {
    if (!world || !world.player || !world.camera) return;
    this.#since += dt;
    if (this.#since >= REREAD) { this.#since = 0; this.#reread(world.map && world.map.id); }
    const goal = this.#goal && world.map && this.#goal.map === world.map.id ? this.#goal : null;
    let want = 0;
    if (goal) {
      const { camera, player } = world;
      const sx = goal.x * TILE + TILE / 2 - camera.x;
      const sy = goal.y * TILE + TILE / 2 - camera.y;
      if (sx < EDGE || sy < EDGE || sx > camera.width - EDGE || sy > camera.height - EDGE) {
        want = 1;
        /* from the middle of the kid's body to the middle of the goal tile, in pixels */
        const raw = Math.atan2(goal.y * TILE + TILE / 2 - (player.y - BODY_ABOVE_FEET), goal.x * TILE + TILE / 2 - player.x);
        this.#aim = Math.round(raw / STEP) * STEP;
        if (this.#alpha < 0.02) this.#angle = this.#aim;
        if (!this.#told) {
          this.#told = true;
          try {
            if (this.#moment) this.#moment('compass:offscreen');
          } catch (error) {
            /* nobody listens */
          }
        }
      }
    }
    const frames = dt * 30;
    this.#alpha += (want - this.#alpha) * (1 - Math.pow(1 - FADE, frames));
    if (want) {
      const turn = Math.atan2(Math.sin(this.#aim - this.#angle), Math.cos(this.#aim - this.#angle));
      this.#angle += turn * (1 - Math.pow(1 - TURN, frames));
    }
  }

  draw(ctx, world) {
    if (this.#alpha <= 0.02 || !world || !world.player || !world.camera) return;
    const { camera, player } = world;
    const x = Math.round(player.x - camera.x + Math.cos(this.#angle) * REACH_X);
    const y = Math.round(player.y - BODY_ABOVE_FEET - camera.y + Math.sin(this.#angle) * REACH_Y);
    ctx.save();
    try {
      ctx.globalAlpha = this.#alpha * OPACITY;
      ctx.translate(x, y);
      ctx.rotate(this.#angle);
      ctx.scale(SCALE, SCALE);
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, -4);
      ctx.lineTo(-2, 0);
      ctx.lineTo(-4, 4);
      ctx.closePath();
      ctx.fillStyle = this.#fill;
      ctx.strokeStyle = this.#edge;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fill();
    } catch (error) {
      /* a draw call never throws */
    } finally {
      ctx.restore();
    }
  }

  #reread(mapId) {
    try {
      const top = this.#game.scenes.base;
      const id = mapId || (top && top.map && top.map.id);
      const shown = !this.#visible || this.#visible();
      this.#goal = id && shown ? this.#quests.goal(id) : null;
    } catch (error) {
      this.#goal = null;
    }
  }
}
