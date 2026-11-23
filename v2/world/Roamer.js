/*
 * Roamer.js
 * Job: a wild creature that lives around a home tile: it idles, wanders a little, notices the player
 * when they come close (a small "!" pops up), drifts toward them, gives up and goes home when they
 * are too far. It moves freely in map pixels, never on the tile grid, and blocks nobody. A hidden
 * one shows only a faint shimmer until the player can see it. It fades in when it appears and out
 * when it leaves.
 *
 * Public API:
 *   new Roamer(id, { kind, level, home: [tx, ty], hidden, scale })
 *   kind, level, hidden, home, state ('idle' | 'wander' | 'notice' | 'chase' | 'home'), alpha, canSee
 *   show()            already there when the map is entered: no fade-in
 *   update(dt, ctx)   ctx: { player: { x, y }, calm, canSee, isFree(tx, ty), sound(name), emit(kind, x, y, n) }
 *        calm: nothing may notice the player now (a script, a grace time, a rider); canSee: hidden
 *        ones are visible. Returns true while it touches the player (the owner starts the meeting).
 *   leave()           fade out; gone becomes true when it has faded
 *   settle()          stop chasing and go home (after a meeting)
 *   gone              faded out completely: the owner drops it
 *   depth, bounds, draw(ctx, art, env)   art.drawCreature paints it
 */

import { Entity } from './Entity.js';
import { TILE } from '../core/units.js';

const NOTICE_RANGE = 3 * TILE;
const GIVE_UP_RANGE = 6 * TILE;
const LEASH_TILES = 9;
const CHASE_SPEED = 26;
const HOME_SPEED = 16;
const WANDER_SPEED = 12;
const FADE_PER_SECOND = 0.8;
const TOUCH_X = 10;
const TOUCH_Y = 9;
const SPARKLE_PER_SECOND = 0.6;
const HALF_WIDTH = 14;
const HEIGHT = 30;
/* the "!" that pops up when it notices the player, row by row: o edge, w white, r red */
const BANG = ['.ooooooo.', 'owwwwwwwo', 'owwwrwwwo', 'owwrrrwwo', 'owwrrrwwo', 'owwwrwwwo', 'owwwrwwwo', 'owwwwwwwo', 'owwwrwwwo', '.ooooooo.', '...owo...', '....o....'];
const BANG_COLORS = { o: '#2a1e2e', w: '#fff8e8', r: '#e0483c' };
const BANG_RUNS = [];
BANG.forEach((row, y) => {
  let start = 0;
  for (let x = 1; x <= row.length; x++) {
    if (x < row.length && row[x] === row[start]) continue;
    if (BANG_COLORS[row[start]]) BANG_RUNS.push({ x: start, y, w: x - start, color: BANG_COLORS[row[start]] });
    start = x;
  }
});

const centreX = (tx) => tx * TILE + 8;
const centreY = (ty) => ty * TILE + 12;

export class Roamer extends Entity {
  state = 'idle';
  alpha = 0;
  gone = false;
  dir = 0;
  moving = false;
  canSee = false;

  #fade = 1;
  #timer = 1 + Math.random() * 3;
  #bang = 0;
  #phase = Math.random() * 6.28;
  #goal = { x: 0, y: 0 };
  #pose = { scale: 0.8, dir: 0, moving: false, noShadow: true, alpha: 1 };

  constructor(id, { kind, level, home, hidden = false, scale = 0.8 }) {
    super(id);
    this.kind = kind;
    this.level = level;
    this.hidden = hidden;
    this.home = [home[0], home[1]];
    this.tx = home[0];
    this.ty = home[1];
    this.dir = Math.floor(Math.random() * 4);
    this.#pose.scale = scale;
    this.#place(centreX(home[0]), centreY(home[1]));
  }

  get depth() {
    return this.y + 10;
  }

  /* already standing when the map is entered: no fade */
  show() {
    this.alpha = 1;
    this.#fade = 0;
  }

  leave() {
    this.#fade = -1;
  }

  settle() {
    if (this.state === 'chase' || this.state === 'notice') this.state = 'home';
    this.#bang = 0;
  }

  update(dt, ctx) {
    this.#phase += dt;
    this.canSee = !!ctx.canSee;
    if (this.#fade > 0) {
      this.alpha = Math.min(1, this.alpha + dt * FADE_PER_SECOND);
      if (this.alpha >= 1) this.#fade = 0;
    } else if (this.#fade < 0) {
      this.alpha -= dt * FADE_PER_SECOND;
      if (this.alpha <= 0) {
        this.alpha = 0;
        this.gone = true;
        return false;
      }
    }
    this.#bang = Math.max(0, this.#bang - dt);
    const player = ctx.player;
    const dx = player.x - this.x;
    const dy = player.y - 4 - this.y;
    const distance = Math.hypot(dx, dy);
    const calm = ctx.calm || this.#fade < 0 || (this.hidden && !ctx.canSee);

    if (!calm && this.state !== 'chase' && this.state !== 'notice' && distance < NOTICE_RANGE) {
      this.state = 'notice';
      this.#timer = 0.7;
      this.#bang = 1.1;
      this.moving = false;
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : dy < 0 ? 1 : 0;
      if (ctx.sound) ctx.sound('sparkle');
    }
    this.#act(dt, ctx, calm, distance);
    if (ctx.emit && Math.random() < dt * SPARKLE_PER_SECOND) ctx.emit('sparkle', this.x + (Math.random() - 0.5) * 10, this.y - 4, 1);
    return !calm && this.alpha > 0.6 && Math.abs(dx) < TOUCH_X && Math.abs(dy) < TOUCH_Y;
  }

  #act(dt, ctx, calm, distance) {
    const [hx, hy] = this.home;
    if (this.state === 'notice') {
      this.#timer -= dt;
      this.moving = false;
      if (this.#timer <= 0) this.state = 'chase';
    } else if (this.state === 'chase') {
      if (calm || distance > GIVE_UP_RANGE || Math.abs(this.tx - hx) + Math.abs(this.ty - hy) > LEASH_TILES) this.state = 'home';
      else this.#stepToward(ctx.player.x, ctx.player.y - 4, CHASE_SPEED, dt, ctx);
    } else if (this.state === 'home') {
      if (this.#stepToward(centreX(hx), centreY(hy), HOME_SPEED, dt, ctx)) {
        this.state = 'idle';
        this.#timer = 2 + Math.random() * 3;
      }
    } else if (this.state === 'idle') {
      this.moving = false;
      this.#timer -= dt;
      if (this.#timer > 0) return;
      for (let tries = 0; tries < 6; tries++) {
        const gx = hx + Math.round((Math.random() - 0.5) * 6);
        const gy = hy + Math.round((Math.random() - 0.5) * 4);
        if (!ctx.isFree(gx, gy)) continue;
        this.#goal.x = centreX(gx);
        this.#goal.y = centreY(gy);
        this.state = 'wander';
        this.#timer = 6;
        return;
      }
      this.#timer = 1.5 + Math.random() * 2;
    } else if (this.state === 'wander') {
      this.#timer -= dt;
      if (this.#stepToward(this.#goal.x, this.#goal.y, WANDER_SPEED, dt, ctx) || this.#timer <= 0) {
        this.state = 'idle';
        this.#timer = 2 + Math.random() * 4;
        this.moving = false;
      }
    }
  }

  /* true when it has arrived (or cannot go on) */
  #stepToward(gx, gy, speed, dt, ctx) {
    const dx = gx - this.x;
    const dy = gy - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 0.5) {
      this.moving = false;
      return true;
    }
    const step = Math.min(d, speed * dt);
    let nx = this.x + (dx / d) * step;
    let ny = this.y + (dy / d) * step;
    const tileOf = (x, y) => [Math.floor(x / TILE), Math.floor((y + 3) / TILE)];
    let [ntx, nty] = tileOf(nx, ny);
    if ((ntx !== this.tx || nty !== this.ty) && !ctx.isFree(ntx, nty)) {
      /* slide along one axis */
      const [ax, ay] = tileOf(this.x + Math.sign(dx) * step, this.y);
      const [bx, by] = tileOf(this.x, this.y + Math.sign(dy) * step);
      if (Math.abs(dx) > 0.3 && ctx.isFree(ax, ay)) {
        nx = this.x + Math.sign(dx) * step;
        ny = this.y;
      } else if (Math.abs(dy) > 0.3 && ctx.isFree(bx, by)) {
        nx = this.x;
        ny = this.y + Math.sign(dy) * step;
      } else {
        this.moving = false;
        return true;
      }
      [ntx, nty] = tileOf(nx, ny);
    }
    if (Math.abs(nx - this.x) > 0.05 || Math.abs(ny - this.y) > 0.05) {
      this.dir = Math.abs(nx - this.x) > Math.abs(ny - this.y) ? (nx < this.x ? 2 : 3) : ny < this.y ? 1 : 0;
    }
    this.tx = ntx;
    this.ty = nty;
    this.moving = true;
    this.#place(nx, ny);
    return false;
  }

  #place(x, y) {
    this.x = x;
    this.y = y;
    const b = this.bounds;
    b.left = x - HALF_WIDTH;
    b.right = x + HALF_WIDTH;
    b.top = y - HEIGHT;
    b.bottom = y + 14;
  }

  draw(ctx, art, env) {
    if (this.alpha <= 0) return;
    const phase = this.#phase;
    if (this.hidden && !this.canSee) {
      /* a faint shimmer in the air */
      ctx.fillStyle = `rgba(220,235,255,${(0.25 + Math.sin(phase * 2.6) * 0.15).toFixed(3)})`;
      for (let q = 0; q < 4; q++) {
        const angle = phase * 1.3 + q * 1.57;
        ctx.fillRect(Math.round(this.x + Math.cos(angle) * 5), Math.round(this.y - 2 + Math.sin(angle * 1.4) * 4), 1, 1);
      }
      return;
    }
    const bob = Math.sin(phase * 2.2) * 1.2;
    const pose = this.#pose;
    pose.dir = this.dir;
    pose.moving = this.moving;
    pose.alpha = (0.84 + Math.sin(phase * 3.1) * 0.08) * this.alpha;
    art.drawShadow(ctx, this.x, this.y + 10, 4, 1.5, env);
    art.drawCreature(ctx, this.kind, Math.round(this.x), Math.round(this.y - 1 + bob), env, pose);
    if (this.#bang > 0) {
      const pop = this.#bang > 0.95 ? (1.1 - this.#bang) * 20 : 3;
      const left = Math.round(this.x - 4);
      const top = Math.round(this.y - 24 - Math.min(3, pop));
      ctx.globalAlpha = Math.min(1, this.#bang * 3);
      for (const run of BANG_RUNS) {
        ctx.fillStyle = run.color;
        ctx.fillRect(left + run.x, top + run.y, run.w, 1);
      }
      ctx.globalAlpha = 1;
    }
  }
}
