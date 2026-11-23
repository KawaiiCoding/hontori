/*
 * DrawPrompt.js  (engine: features)
 * Job: "draw this shape" outside a battle: the world dims, a turning circle and a dashed guide with a dot
 * gliding along it show the shape, the player draws one stroke of ink, and a stroke that matches flares and
 * ends the prompt (a miss crumbles to ash and says so). It knows no game: the shapes, the recogniser, the
 * colours and the circle painter come from the caller.
 *
 * Public API:
 *   class DrawPromptScene     overlay; enter(options), result resolves true when drawn (null if removed)
 *   drawPrompt(game, options) open it; a Promise of true (drawn) or null
 *     options: {
 *       shape        the id the recogniser knows
 *       recognizer   { recognize(stroke, allowed), glyph(id) }   (systems/battle-scene/gesture.js)
 *       color        the ink and circle colour
 *       text, sub    the words above (strings); retry: the words after a miss
 *       circle(g, shape, x, y, r, color, { rot, alpha, glyph, lw, simple, seed })   the magic circle painter
 *       marks        small line drawings that peel off the ink
 *       sounds       { ok, miss, hum } sound names for game.sound.play
 *       twist        optional: { offset(seconds, width, height, out) } writes out.x, out.y (screen pixels):
 *                    the page moves by that much while the prompt is open; the guide moves with it and
 *                    ink already drawn rides along, so the player has to follow the page (twists.js)
 *     }
 */

import { element } from '../../ui/dom.js';
import { SigilSurface } from '../battle-scene/SigilSurface.js';
import { ScreenScene, openScreen } from './ScreenScene.js';

/* screen pixels per drawing pixel: the ink and its sparks are drawn at twice their size */
const UNIT = 2;
const SPARK_STEP = 1 / 30;
const GLIDE_SECONDS = 3.2;
const WIN_MS = 1250;

function rgba(hex, alpha) {
  const n = parseInt(String(hex).replace('#', ''), 16) || 0;
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export class DrawPromptScene extends ScreenScene {
  overlay = true;
  frameRate = 30;

  #o = null;
  #surface = null;
  #tip = null;
  #guide = [];
  #lengths = [0];
  #release = null;
  #started = 0;
  #won = 0;
  #burst = [];
  #carry = 0;
  #timer = 0;
  #page = { x: 0, y: 0 };
  #moved = { x: 0, y: 0 };

  constructor(game) {
    super(game, 'ft-draw');
  }

  build(root, options) {
    this.#o = { color: '#ffd98a', sounds: {}, ...options };
    const o = this.#o;
    const canvas = this.makeCanvas(root);
    this.#tip = element('div', 'tip', root, o.text || '');
    if (o.sub) element('div', 'sub', this.#tip, o.sub);
    this.#guide = (o.recognizer && o.recognizer.glyph(o.shape)) || [];
    for (let i = 1; i < this.#guide.length; i++) {
      const a = this.#guide[i - 1];
      const b = this.#guide[i];
      this.#lengths.push(this.#lengths[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
    }
    this.#started = performance.now();
    this.#release = this.game.clock.requestRate(60);
    this.#surface = new SigilSurface(canvas, {
      unit: () => UNIT,
      mayStart: () => !this.#won,
      marks: o.marks || [],
      onHum: () => this.#sound(o.sounds.hum),
      onEnd: (trail) => this.#judge(trail),
    });
    this.#surface.color = o.color;
  }

  exit() {
    clearTimeout(this.#timer);
    if (this.#surface) this.#surface.dispose();
    this.#surface = null;
    if (this.#release) this.#release();
    this.#release = null;
    super.exit();
  }

  update(dt) {
    this.#drift();
    this.#carry += dt;
    while (this.#carry >= SPARK_STEP) {
      this.#carry -= SPARK_STEP;
      if (this.#surface) this.#surface.tick();
      for (let i = this.#burst.length - 1; i >= 0; i--) {
        const p = this.#burst[i];
        p.x += p.vx;
        p.y += p.vy;
        p.l -= p.d;
        if (p.l <= 0) this.#burst.splice(i, 1);
      }
    }
  }

  draw() {
    const g = this.prepareCanvas();
    if (!g || !this.#o) return;
    const { width, height } = this.canvasSize();
    const o = this.#o;
    const now = performance.now();
    const t = (now - this.#started) / 1000;
    const s = Math.min(width, height) * 0.5;
    const cx = width / 2 + this.#page.x;
    const cy = height * 0.54 + this.#page.y;
    g.clearRect(0, 0, width, height);
    try {
      if (!this.#won) this.#drawGuide(g, o, cx, cy, s, t);
      else this.#drawWin(g, o, cx, cy, s, t, (now - this.#won) / 1000, width, height);
    } catch (error) {
      /* a painter that fails leaves the guide out; the stroke still counts */
    }
    g.save();
    g.scale(UNIT, UNIT);
    if (this.#surface) this.#surface.draw(g, 1.2);
    g.restore();
    for (const p of this.#burst) {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = Math.min(1, p.l);
      g.fillStyle = p.c;
      g.fillRect(p.x, p.y, 3, 3);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }

  /* the twist moves the page; ink of the stroke being drawn rides along with it */
  #drift() {
    const twist = this.#o && this.#o.twist;
    if (!twist || this.#won || typeof twist.offset !== 'function') return;
    const { width, height } = this.canvasSize();
    const moved = this.#moved;
    moved.x = this.#page.x;
    moved.y = this.#page.y;
    try {
      twist.offset((performance.now() - this.#started) / 1000, width, height, this.#page);
    } catch (error) {
      this.#page.x = moved.x;
      this.#page.y = moved.y;
      return;
    }
    const dx = (this.#page.x - moved.x) / UNIT;
    const dy = (this.#page.y - moved.y) / UNIT;
    const surface = this.#surface;
    if (!surface || !surface.drawing || (!dx && !dy)) return;
    for (const p of surface.trail) {
      p[0] += dx;
      p[1] += dy;
    }
  }

  #drawGuide(g, o, cx, cy, s, t) {
    if (o.circle) o.circle(g, o.shape, cx, cy, s * 0.72, o.color, { rot: t * 0.25, alpha: 0.45 + 0.1 * Math.sin(t * 2), glyph: 0 });
    const guide = this.#guide;
    if (guide.length < 2) return;
    g.save();
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.setLineDash([6, 10]);
    g.lineWidth = 4;
    g.strokeStyle = rgba(o.color, 0.45);
    g.beginPath();
    guide.forEach((q, i) => {
      const x = cx + q[0] * s * 0.85;
      const y = cy + q[1] * s * 0.85;
      if (i) g.lineTo(x, y);
      else g.moveTo(x, y);
    });
    g.stroke();
    g.restore();
    /* the dot glides along the guide by its length, slowly, so the player can follow it */
    const total = this.#lengths[this.#lengths.length - 1] || 1;
    const at = ((t / GLIDE_SECONDS) % 1) * total;
    let seg = 1;
    while (seg < guide.length - 1 && this.#lengths[seg] < at) seg++;
    const from = this.#lengths[seg - 1];
    const to = this.#lengths[seg];
    const f = to > from ? (at - from) / (to - from) : 0;
    const x = cx + (guide[seg - 1][0] + (guide[seg][0] - guide[seg - 1][0]) * f) * s * 0.85;
    const y = cy + (guide[seg - 1][1] + (guide[seg][1] - guide[seg - 1][1]) * f) * s * 0.85;
    g.globalCompositeOperation = 'lighter';
    g.fillStyle = rgba(o.color, 0.35);
    g.beginPath();
    g.arc(x, y, 12, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#fff';
    g.beginPath();
    g.arc(x, y, 5, 0, Math.PI * 2);
    g.fill();
    g.globalCompositeOperation = 'source-over';
  }

  /* the shape flares, then opens into a large turning circle with rays of light */
  #drawWin(g, o, cx, cy, s, t, u, width, height) {
    const a = u < 0.15 ? 1 : Math.max(0, 1 - (u - 0.6) / 0.6);
    g.globalCompositeOperation = 'lighter';
    const glow = g.createRadialGradient(cx, cy, 0, cx, cy, s * (0.4 + u * 1.2));
    glow.addColorStop(0, rgba(o.color, 0.5 * a));
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, width, height);
    g.strokeStyle = '#fff6e0';
    g.lineWidth = 3;
    for (let r = 0; r < 12; r++) {
      const an = (r / 12) * Math.PI * 2 + u;
      g.globalAlpha = 0.25 * a;
      g.beginPath();
      g.moveTo(cx + Math.cos(an) * s * 0.3, cy + Math.sin(an) * s * 0.3);
      g.lineTo(cx + Math.cos(an) * s * (0.6 + u * 1.5), cy + Math.sin(an) * s * (0.6 + u * 1.5));
      g.stroke();
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
    if (o.circle) {
      o.circle(g, o.shape, cx, cy, s * (0.72 + u * 0.7), o.color, { rot: t * 1.6, alpha: a, lw: 1.4 });
      o.circle(g, o.shape, cx, cy, s * (0.4 + u * 0.3), '#ffffff', { rot: -t * 2.2, alpha: a * 0.6, simple: true, glyph: 0, seed: 3 });
    }
  }

  #judge(trail) {
    const o = this.#o;
    let kind = null;
    try {
      kind = o.recognizer ? o.recognizer.recognize(trail, [o.shape]) : o.shape;
    } catch (error) {
      kind = null;
    }
    if (kind !== o.shape) {
      if (this.#tip) this.#tip.textContent = o.retry || '';
      this.#surface.ash();
      this.#sound(o.sounds.miss);
      return;
    }
    this.#won = performance.now();
    if (this.#tip) this.#tip.textContent = '';
    this.#surface.drop();
    this.#sound(o.sounds.ok);
    const { width, height } = this.canvasSize();
    for (let i = 0; i < 90; i++) {
      const an = Math.random() * Math.PI * 2;
      const v = Math.random() * 14;
      this.#burst.push({ x: width / 2 + this.#page.x, y: height * 0.54 + this.#page.y, vx: Math.cos(an) * v, vy: Math.sin(an) * v, l: 1.4, d: 0.04, c: i % 3 ? o.color : '#fff' });
    }
    this.#timer = setTimeout(() => this.done(true), WIN_MS);
  }

  #sound(name) {
    if (!name) return;
    try {
      this.game.sound.play(name);
    } catch (error) {
      /* a missing sound never stops the prompt */
    }
  }
}

export function drawPrompt(game, options) {
  return openScreen(game, new DrawPromptScene(game), options);
}
