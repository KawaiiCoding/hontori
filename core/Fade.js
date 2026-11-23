/*
 * Fade.js
 * Job: a short fade to black and back, with one moment in the dark where the caller swaps
 * what is behind it (a map change, a scene change).
 *
 * Public API:
 *   start(ms, atDark)   fade out over ms/2, call atDark() once, fade back in over ms/2
 *   active              true from start until the picture is clear again
 *   update(dt)
 *   draw(ctx, width, height)
 */

/* the picture stays black this long, so the swap is never seen */
const HOLD = 0.03;

export class Fade {
  #half = 0;
  #time = 0;
  #atDark = null;
  #running = false;

  get active() {
    return this.#running;
  }

  start(ms, atDark) {
    this.#half = ms / 2000;
    this.#time = 0;
    this.#atDark = atDark;
    this.#running = true;
  }

  update(dt) {
    if (!this.#running) return;
    this.#time += dt;
    if (this.#atDark && this.#time >= this.#half) {
      const atDark = this.#atDark;
      this.#atDark = null;
      atDark();
    }
    if (this.#time >= this.#half * 2 + HOLD) this.#running = false;
  }

  draw(ctx, width, height) {
    if (!this.#running) return;
    ctx.globalAlpha = this.#darkness();
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
  }

  #darkness() {
    const out = this.#time / this.#half;
    if (out < 1) return out * out;
    const back = Math.min(1, (this.#time - this.#half - HOLD) / this.#half);
    if (back <= 0) return 1;
    return (1 - back) * (1 - back);
  }
}
