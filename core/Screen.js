/*
 * Screen.js
 * Job: own the game canvas and fit it to the device. The short side of the view is about 14 tiles,
 * the long side follows the screen's aspect (never stretched), and art is drawn at RENDER_SCALE.
 *
 * Public API:
 *   new Screen(canvas, root, onResize)   onResize(width, height) is called after every real change
 *   canvas, ctx       the game canvas; ctx is already scaled, so callers draw in logical pixels
 *   width, height     the logical view size
 *   fit()             apply a pending size change; called once per frame, reads no layout itself
 *   toView(clientX, clientY)   client pixels to logical view pixels (reads layout; use on taps only)
 *   newSheet(width, height, opaque)   an offscreen canvas of that logical size with the same scale
 */

import { RENDER_SCALE } from './units.js';

const SHORT_SIDE = 216;
const LONG_SIDE_LIMIT = 440;
/* a phone's address bar sliding away changes the height a little; that is not worth a rebuild */
const SMALL_CHANGE = 0.18;

export class Screen {
  width = 0;
  height = 0;

  #root;
  #onResize;
  #box = { w: 0, h: 0 };
  #pending = null;

  constructor(canvas, root, onResize) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.#root = root;
    this.#onResize = onResize;
    new ResizeObserver((entries) => {
      const size = entries[0].contentRect;
      this.#pending = { w: Math.round(size.width), h: Math.round(size.height) };
    }).observe(root);
    this.#apply({ w: root.clientWidth, h: root.clientHeight });
  }

  fit() {
    const next = this.#pending;
    if (!next) return;
    this.#pending = null;
    const was = this.#box;
    const real = next.w !== was.w
      || Math.abs(next.h - was.h) > was.h * SMALL_CHANGE
      || (next.w > next.h) !== (was.w > was.h);
    if (real) this.#apply(next);
  }

  toView(clientX, clientY) {
    const box = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - box.left) / box.width * this.width,
      y: (clientY - box.top) / box.height * this.height,
    };
  }

  newSheet(width, height, opaque) {
    const canvas = document.createElement('canvas');
    canvas.width = width * RENDER_SCALE;
    canvas.height = height * RENDER_SCALE;
    const ctx = canvas.getContext('2d', { alpha: !opaque });
    ctx.imageSmoothingEnabled = false;
    return { canvas, ctx };
  }

  #apply(box) {
    this.#box = box;
    const low = Math.max(1, Math.min(box.w, box.h));
    const high = Math.max(1, box.w, box.h);
    const long = Math.min(LONG_SIDE_LIMIT, SHORT_SIDE * high / low);
    const short = long * low / high;
    const portrait = box.h >= box.w;
    this.width = Math.round(portrait ? short : long);
    this.height = Math.round(portrait ? long : short);
    this.canvas.width = this.width * RENDER_SCALE;
    this.canvas.height = this.height * RENDER_SCALE;
    this.ctx.setTransform(RENDER_SCALE, 0, 0, RENDER_SCALE, 0, 0);
    this.ctx.imageSmoothingEnabled = false;
    this.#root.classList.toggle('land', box.w > box.h);
    this.#onResize(this.width, this.height);
  }
}
