/*
 * BattleStage.js  (engine: battle scene)
 * Job: the pixel picture of a battle and everything on it that runs on time: waits, timed effects, particles,
 * floating words, screen shake, flashes and darkness. The scene steps it and gives it painters; animations use
 * it and never touch a timer of the browser, so a hidden page pauses a battle exactly.
 *
 * Public API:
 *   new BattleStage(canvas)
 *   width, height        the picture in art pixels;  unit: screen pixels per art pixel;  time: seconds played
 *   fit(cssWidth, cssHeight, pixelRatio)   size the canvas; true when the art size changed
 *   update(dt)           advance waits and effects; -> how many 30-per-second ticks passed
 *   tick()               one tick of the particles and floating words (the scene calls it per tick)
 *   draw(painters)       painters: { back(g), actors(g), front(g), over(g) }, each optional
 *   wait(ms)             a Promise that resolves after that much played time
 *   after(ms, fn)        call fn later (dropped when the stage is cleared)
 *   fx(ms, draw, back)   a timed drawer draw(g, k 0..1, ms); back: behind the actors
 *   run(ms, { step, draw, back })   -> Promise; step(k) runs on time, draw(g, k, ms) per frame
 *   tween(ms, step, draw)           the same, in the order animations like to write it
 *   particle(o)          { x, y, vx, vy, l (life), d (decay per tick), c, s, g (gravity), n (normal blend), dr (drag) }
 *   burst(x, y, color, count, spread)
 *   float(x, y, text, color, big)   a word that drifts up and fades
 *   shake(amount), flash(color, alpha), dim(alpha, ms)
 *   clear()              drop every wait, effect and particle (the scene is leaving)
 */

const TICK = 1 / 30;
const SHAKE_FADE = 2.2;
const FLASH_FADE = 2.5;
const FLOAT_RISE = 0.22;
const FLOAT_FADE = 0.011;
const SMALLEST_UNIT = 2;
/* the shorter side of the screen shows about this many art pixels */
const SHORT_SIDE = 120;

export class BattleStage {
  width = 0;
  height = 0;
  unit = SMALLEST_UNIT;
  time = 0;
  font = 'sans-serif';

  #canvas;
  #g;
  #ratio = 1;
  #owed = 0;
  #timers = [];
  #effects = [];
  #particles = [];
  #floats = [];
  #dims = [];
  #shake = 0;
  #flash = { a: 0, c: '#fff' };

  constructor(canvas) {
    this.#canvas = canvas;
    this.#g = canvas.getContext('2d');
  }

  fit(cssWidth, cssHeight, pixelRatio) {
    const ratio = Math.min(2, pixelRatio || 1);
    const unit = Math.max(SMALLEST_UNIT, Math.floor(Math.min(cssWidth, cssHeight) / SHORT_SIDE));
    const width = Math.ceil(cssWidth / unit);
    const height = Math.ceil(cssHeight / unit);
    this.#ratio = ratio;
    this.#canvas.width = Math.round(cssWidth * ratio);
    this.#canvas.height = Math.round(cssHeight * ratio);
    const changed = width !== this.width || height !== this.height || unit !== this.unit;
    this.unit = unit;
    this.width = width;
    this.height = height;
    return changed;
  }

  update(dt) {
    this.time += dt;
    const ms = dt * 1000;
    for (let i = 0; i < this.#timers.length; i++) {
      const t = this.#timers[i];
      t.left -= ms;
      if (t.left > 0) continue;
      this.#timers.splice(i, 1);
      i--;
      this.#guard(t.fn);
    }
    for (let i = 0; i < this.#effects.length; i++) {
      const e = this.#effects[i];
      e.t += ms;
      e.k = Math.min(1, e.t / e.ms);
      if (e.step) this.#guard(e.step, e.k);
      if (e.k < 1) continue;
      this.#effects.splice(this.#effects.indexOf(e), 1);
      i--;
      if (e.done) e.done();
    }
    for (let i = this.#dims.length - 1; i >= 0; i--) {
      const d = this.#dims[i];
      d.t += ms;
      if (d.t >= d.ms) this.#dims.splice(i, 1);
    }
    this.#shake = Math.max(0, this.#shake - dt * SHAKE_FADE);
    this.#flash.a = Math.max(0, this.#flash.a - dt * FLASH_FADE);
    this.#owed += dt;
    let ticks = 0;
    while (this.#owed >= TICK) {
      this.#owed -= TICK;
      ticks++;
    }
    return ticks;
  }

  tick() {
    const parts = this.#particles;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g || 0;
      if (p.dr) {
        p.vx *= p.dr;
        p.vy *= p.dr;
      }
      p.l -= p.d;
      if (p.l <= 0) parts.splice(i, 1);
    }
    const floats = this.#floats;
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.y -= FLOAT_RISE;
      f.l -= FLOAT_FADE;
      if (f.l <= 0) floats.splice(i, 1);
    }
  }

  draw(painters) {
    const g = this.#g;
    const W = this.width;
    const H = this.height;
    const scale = this.#ratio * this.unit;
    g.setTransform(scale, 0, 0, scale, 0, 0);
    g.imageSmoothingEnabled = false;
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    const s = this.#shake;
    g.save();
    if (s > 0) g.translate(Math.round((Math.random() - 0.5) * 3 * s), Math.round((Math.random() - 0.5) * 1.5 * s));
    this.#paint(painters.back, g);
    this.#drawEffects(g, true);
    this.#paint(painters.actors, g);
    let dark = 0;
    for (const d of this.#dims) {
      const k = d.t / d.ms;
      dark = Math.max(dark, d.a * Math.min(1, k * 5, (1 - k) * 4));
    }
    if (dark > 0) {
      g.fillStyle = `rgba(8,2,18,${dark})`;
      g.fillRect(-4, -4, W + 8, H + 8);
    }
    this.#drawEffects(g, false);
    for (const p of this.#particles) {
      g.globalCompositeOperation = p.n ? 'source-over' : 'lighter';
      g.globalAlpha = Math.max(0, Math.min(1, p.l));
      g.fillStyle = p.c;
      g.fillRect(p.x, p.y, p.s, p.s);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    this.#paint(painters.front, g);
    g.restore();
    g.textAlign = 'center';
    g.lineWidth = 2;
    g.strokeStyle = 'rgba(0,0,0,.7)';
    for (const f of this.#floats) {
      g.globalAlpha = Math.max(0, Math.min(1, f.l * 2));
      g.font = `bold ${f.big ? 11 : 7}px ${this.font}`;
      g.strokeText(f.t, f.x, f.y);
      g.fillStyle = f.c;
      g.fillText(f.t, f.x, f.y);
    }
    g.globalAlpha = 1;
    this.#paint(painters.over, g);
    if (this.#flash.a > 0) {
      g.globalAlpha = this.#flash.a;
      g.fillStyle = this.#flash.c;
      g.fillRect(0, 0, W, H);
      g.globalAlpha = 1;
    }
  }

  wait(ms) {
    return new Promise((resolve) => this.after(ms, resolve));
  }

  after(ms, fn) {
    this.#timers.push({ left: ms, fn });
  }

  fx(ms, draw, back) {
    this.#effects.push({ t: 0, k: 0, ms, draw, back: !!back });
  }

  run(ms, o) {
    return new Promise((done) => this.#effects.push({ t: 0, k: 0, ms, step: o.step, draw: o.draw, back: !!o.back, done }));
  }

  tween(ms, step, draw) {
    return this.run(ms, { step, draw });
  }

  particle(o) {
    this.#particles.push(Object.assign({ vx: 0, vy: 0, l: 1, d: 0.03, c: '#fff', s: 1.5 }, o));
  }

  burst(x, y, color, count, spread) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * 6.283;
      const v = Math.random() * (spread || 1.2);
      this.#particles.push({
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 0.2, l: 1, d: 0.02 + Math.random() * 0.02,
        c: Math.random() < 0.3 ? '#ffffff' : color, s: Math.random() < 0.5 ? 1 : 1.5
      });
    }
  }

  float(x, y, text, color, big) {
    this.#floats.push({ x, y, t: text, c: color || '#fff', l: 1, big: !!big });
  }

  shake(amount) {
    this.#shake = Math.max(this.#shake, amount);
  }

  flash(color, alpha) {
    this.#flash.c = color;
    this.#flash.a = Math.max(this.#flash.a, alpha);
  }

  dim(alpha, ms) {
    this.#dims.push({ t: 0, ms, a: alpha });
  }

  clear() {
    this.#timers.length = 0;
    this.#effects.length = 0;
    this.#particles.length = 0;
    this.#floats.length = 0;
    this.#dims.length = 0;
  }

  #drawEffects(g, back) {
    for (const e of this.#effects) {
      if (e.back !== back || !e.draw) continue;
      g.save();
      try {
        e.draw(g, e.k, e.t);
      } catch (error) {
        e.draw = null;
        console.error('BattleStage: an effect failed and was dropped', error);
      }
      g.restore();
    }
  }

  #paint(painter, g) {
    if (!painter) return;
    g.save();
    try {
      painter(g);
    } catch (error) {
      console.error('BattleStage: a painter failed', error);
    }
    g.restore();
  }

  #guard(fn, value) {
    try {
      fn(value);
    } catch (error) {
      console.error('BattleStage: a timed step failed', error);
    }
  }
}
