/*
 * SigilSurface.js  (engine: battle scene)
 * Job: let the player draw one stroke of glowing ink on the battle picture. It follows one pointer, keeps the
 * trail in art pixels, sheds sparks and small marks while the stroke grows, and hands the finished stroke to
 * the scene. What the stroke means is not its business (see gesture.js).
 *
 * Public API:
 *   new SigilSurface(element, {
 *     unit()              screen pixels per art pixel (the trail is kept in art pixels)
 *     mayStart()          false while drawing is not allowed
 *     onStart(), onGrow(trail, count), onEnd(trail)   trail: the points so far; onEnd also on a cancelled touch
 *     marks               small line drawings ([[x, y], ...] lists, size about 1) that peel off the ink
 *     onHum()             called now and then while the stroke grows (a soft sound)
 *   })
 *   color               the ink colour (the scene may change it while the stroke grows)
 *   drawing             a stroke is being drawn
 *   trail               the points of the stroke
 *   drop()              forget the stroke
 *   ash()               the stroke crumbles into grey dust (a spell that did not work)
 *   tick()              one step of the sparks (30 a second)
 *   draw(g, width)      paint the ink and its sparks
 *   dispose()           remove the listeners
 *   inkStroke(g, points, width, color, alpha)   the glowing line, for anything else drawn in ink
 */

const MIN_STEP = 0.7;
const HUM_EVERY = 18;
const ASH = ['#5a5a62', '#8a8890', '#3a3a40', '#a07050'];

function line(g, points, width, color, alpha) {
  if (points.length < 2) return;
  g.globalAlpha = alpha;
  g.lineWidth = width;
  g.strokeStyle = color;
  g.beginPath();
  g.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) g.lineTo(points[i][0], points[i][1]);
  g.stroke();
}

export function inkStroke(g, points, width, color, alpha) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.lineCap = 'round';
  g.lineJoin = 'round';
  line(g, points, width * 4.5, color, 0.16 * alpha);
  line(g, points, width * 2.2, color, 0.55 * alpha);
  line(g, points, width * 0.8, '#ffffff', alpha);
  g.restore();
}

export class SigilSurface {
  color = '#ffe6b0';
  drawing = false;
  trail = [];

  #element;
  #options;
  #pointer = null;
  #count = 0;
  #sparks = [];
  #listeners;
  #corner = { x: 0, y: 0 };

  constructor(element, options) {
    this.#element = element;
    this.#options = options;
    this.#listeners = [
      ['pointerdown', (e) => this.#down(e)],
      ['pointermove', (e) => this.#move(e)],
      ['pointerup', (e) => this.#up(e)],
      ['pointercancel', (e) => this.#up(e)]
    ];
    for (const [type, fn] of this.#listeners) element.addEventListener(type, fn);
  }

  dispose() {
    for (const [type, fn] of this.#listeners) this.#element.removeEventListener(type, fn);
  }

  drop() {
    this.trail = [];
  }

  ash() {
    this.trail.forEach((p, i) => {
      if (i % 2) return;
      this.#sparks.push({
        x: p[0], y: p[1], vx: (Math.random() - 0.5) * 0.4, vy: Math.random() * 0.2, g: 0.05, l: 1, d: 0.018,
        c: ASH[i % 4], s: 1 + Math.random(), n: 1
      });
    });
    this.trail = [];
  }

  tick() {
    const sparks = this.#sparks;
    for (let i = sparks.length - 1; i >= 0; i--) {
      const p = sparks[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g || 0;
      p.l -= p.d;
      if (p.l <= 0) sparks.splice(i, 1);
    }
  }

  draw(g, width) {
    if (this.trail.length > 1) inkStroke(g, this.trail, width, this.color, 1);
    for (const p of this.#sparks) {
      if (p.mark) {
        this.#drawMark(g, p);
        continue;
      }
      g.globalCompositeOperation = p.n ? 'source-over' : 'lighter';
      g.globalAlpha = Math.min(1, p.l);
      g.fillStyle = p.c;
      g.fillRect(p.x, p.y, p.s, p.s);
    }
    g.globalAlpha = 1;
    g.globalCompositeOperation = 'source-over';
  }

  #drawMark(g, p) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    g.translate(p.x, p.y);
    g.rotate(p.a);
    for (const stroke of p.mark) line(g, stroke.map((q) => [q[0] * p.s, q[1] * p.s]), Math.max(0.5, p.s * 0.35), p.c, Math.min(1, p.l));
    g.restore();
  }

  #point(event) {
    const unit = this.#options.unit();
    return [(event.clientX - this.#corner.x) / unit, (event.clientY - this.#corner.y) / unit];
  }

  #down(event) {
    const o = this.#options;
    if (this.drawing || (o.mayStart && !o.mayStart())) return;
    this.#pointer = event.pointerId;
    try {
      this.#element.setPointerCapture(event.pointerId);
    } catch (error) {
      /* a pointer that cannot be captured still draws */
    }
    const rect = this.#element.getBoundingClientRect();
    this.#corner.x = rect.left;
    this.#corner.y = rect.top;
    this.drawing = true;
    this.trail = [this.#point(event)];
    this.#count = 0;
    event.preventDefault();
    if (o.onStart) o.onStart();
  }

  #move(event) {
    if (!this.drawing || event.pointerId !== this.#pointer) return;
    const o = this.#options;
    const p = this.#point(event);
    const last = this.trail[this.trail.length - 1];
    if (Math.hypot(p[0] - last[0], p[1] - last[1]) < MIN_STEP) return;
    this.trail.push(p);
    this.#count++;
    const marks = o.marks || [];
    if (this.#count % 3 === 0 && marks.length) {
      this.#sparks.push({
        x: p[0], y: p[1], vx: (Math.random() - 0.5) * 0.6, vy: -0.3 - Math.random() * 0.5, l: 1.2, d: 0.025,
        mark: marks[(Math.random() * marks.length) | 0], a: Math.random() * 6, s: 1.4 + Math.random(), c: this.color
      });
    }
    if (Math.random() < 0.6) {
      this.#sparks.push({
        x: p[0], y: p[1], vx: (Math.random() - 0.5) * 1.2, vy: Math.random() - 0.7, l: 0.8, d: 0.04,
        c: Math.random() < 0.5 ? '#fff' : this.color, s: Math.random() < 0.5 ? 0.8 : 1.3
      });
    }
    if (this.#count % HUM_EVERY === 0 && o.onHum) o.onHum();
    if (o.onGrow) o.onGrow(this.trail, this.#count);
  }

  #up(event) {
    if (!this.drawing || event.pointerId !== this.#pointer) return;
    this.drawing = false;
    this.#pointer = null;
    if (this.#options.onEnd) this.#options.onEnd(this.trail);
  }
}
