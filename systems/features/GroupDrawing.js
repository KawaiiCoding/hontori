/*
 * GroupDrawing.js  (engine: features)
 * Job: a drawing made by many hands. A pale veil lies over the world; one by one, the people who stand with
 * the player each add a stroke of light (an arc of one great ring), with their face and name shown as they draw
 * it. Then the ring waits, turning slowly, for the player's own last shape (the caller opens the drawing prompt
 * over it). Last, lift(): the shape blazes in the middle of the ring, the light runs round the ring, and the veil
 * rises away from the bottom of the screen up, with one line of words. Every glow has its cause on screen: the
 * strokes come from the names shown, the blaze from the shape just drawn. It knows no game: the people, the
 * colours and the shape come from the caller.
 *
 * Public API:
 *   class GroupDrawingScene   overlay; enter({ strokes, veil, shape, strokeMs, gapMs })
 *        strokes   [{ name, portrait (a canvas or null), color }]   in the order they draw
 *        veil      the colour of the veil over the world (default a pale violet grey)
 *        shape     [[x, y], ...] the player's last shape in -1..1 units (blazes in the middle on lift)
 *        strokeMs  how long one stroke takes to draw (default 1100); gapMs: the pause after it (default 650,
 *                  and never less than the time to read the name)
 *     ready              a Promise that resolves once every stroke is drawn (the ring waits)
 *     lift({ text, color })   blaze, lift the veil, show the words for their reading time, then end;
 *                             a Promise that resolves when the scene is gone
 *   openGroupDrawing(game, options)   push it; returns the scene (await scene.ready, then scene.lift(...))
 */

import { element } from '../../ui/dom.js';
import { readMs } from '../../ui/readTime.js';
import { ScreenScene } from './ScreenScene.js';

const STROKE_MS = 1100;
const GAP_MS = 650;
const BLAZE_MS = 1400;
const LIFT_MS = 2600;
const END_FADE_MS = 600;
const FACE = 44;
const VEIL = '#b8b0c8';
const GOLD = '#ffd98a';
const STYLE_ID = 'ft-group-style';

const CSS = `
.ft-group{background:transparent}
.ft-group .who{position:absolute;left:50%;bottom:calc(var(--sa-b,0px) + 16%);transform:translate(-50%,8px);display:flex;align-items:center;
  gap:10px;padding:8px 16px 8px 8px;border-radius:16px;background:color-mix(in srgb,var(--panel-bottom) 86%,transparent);
  border:2px solid var(--accent);opacity:0;transition:opacity .35s ease,transform .35s ease;pointer-events:none}
.ft-group .who.on{opacity:1;transform:translate(-50%,0)}
.ft-group .who canvas{width:44px;height:44px;image-rendering:pixelated}
.ft-group .who b{font-size:clamp(16px,4.4cqmin,20px);font-weight:900;color:var(--text)}
.ft-group .say{position:absolute;left:16px;right:16px;bottom:calc(var(--sa-b,0px) + 14%);text-align:center;font-weight:900;
  font-size:clamp(18px,5cqmin,25px);line-height:1.3;text-wrap:balance;text-shadow:0 0 12px color-mix(in srgb,var(--accent) 60%,transparent),0 2px 0 rgba(0,0,0,.6);
  opacity:0;transition:opacity .6s ease;pointer-events:none}
.ft-group .say.on{opacity:1}
`;

function installStyle() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}

function rgba(hex, alpha) {
  const n = parseInt(String(hex).replace('#', ''), 16) || 0;
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`;
}

const ease = (k) => k * k * (3 - 2 * k);

export class GroupDrawingScene extends ScreenScene {
  overlay = true;
  frameRate = 30;
  ready;

  #strokes = [];
  #veil = VEIL;
  #shape = [];
  #strokeMs = STROKE_MS;
  #gapMs = GAP_MS;
  #start = 0;
  #times = [];
  #doneAt = 0;
  #liftAt = 0;
  #color = GOLD;
  #who = null;
  #face = null;
  #name = null;
  #say = null;
  #shown = -1;
  #readyResolve = null;
  #timers = [];

  constructor(game) {
    super(game, 'ft-group');
    this.ready = new Promise((resolve) => {
      this.#readyResolve = resolve;
    });
  }

  build(root, { strokes = [], veil, shape, strokeMs, gapMs } = {}) {
    installStyle();
    this.#strokes = (Array.isArray(strokes) ? strokes : []).filter(Boolean);
    if (typeof veil === 'string' && veil) this.#veil = veil;
    this.#shape = Array.isArray(shape) ? shape.filter((q) => Array.isArray(q) && q.length >= 2) : [];
    if (Number(strokeMs) > 0) this.#strokeMs = Number(strokeMs);
    if (Number(gapMs) >= 0 && gapMs !== null && gapMs !== undefined) this.#gapMs = Number(gapMs);
    this.makeCanvas(root);
    this.#who = element('div', 'who', root);
    this.#face = element('canvas', '', this.#who);
    this.#face.width = FACE;
    this.#face.height = FACE;
    this.#name = element('b', '', this.#who);
    this.#say = element('div', 'say', root);
    /* each stroke begins when the one before has been drawn and its name read */
    let at = 400;
    this.#times = this.#strokes.map((s) => {
      const begin = at;
      at += this.#strokeMs + Math.max(this.#gapMs, readMs(s.name || '', { min: 0 }) - this.#strokeMs);
      return begin;
    });
    this.#doneAt = at;
    this.#start = performance.now();
    this.#later(at, () => {
      this.#showWho(-1);
      if (this.#readyResolve) this.#readyResolve(true);
      this.#readyResolve = null;
      /* the ring only turns slowly while the player draws: few frames */
      this.frameRate = 15;
    });
    if (!this.#strokes.length && this.#readyResolve) {
      this.#readyResolve(true);
      this.#readyResolve = null;
    }
  }

  exit() {
    for (const t of this.#timers) clearTimeout(t);
    this.#timers = [];
    if (this.#readyResolve) this.#readyResolve(false);
    this.#readyResolve = null;
    super.exit();
  }

  /* the last shape blazes, the light runs round the ring, the veil rises away, the words show; then the end */
  lift({ text = '', color } = {}) {
    if (this.ended) return Promise.resolve(null);
    if (typeof color === 'string' && color) this.#color = color;
    this.#liftAt = performance.now();
    this.frameRate = 30;
    try {
      this.game.sound.play('spell');
    } catch (error) {
      /* silent */
    }
    this.#later(BLAZE_MS, () => {
      if (!this.#say) return;
      this.#say.textContent = text;
      this.#say.classList.add('on');
    });
    const stay = BLAZE_MS + Math.max(LIFT_MS, readMs(text));
    this.#later(stay, () => {
      if (this.root) this.root.classList.remove('on');
    });
    this.#later(stay + END_FADE_MS, () => this.done(true));
    return this.result;
  }

  draw() {
    const g = this.prepareCanvas();
    if (!g) return;
    const { width, height } = this.canvasSize();
    const now = performance.now();
    const t = now - this.#start;
    g.clearRect(0, 0, width, height);
    try {
      this.#paint(g, width, height, t, now);
    } catch (error) {
      /* a frame that fails is left blank; the moment goes on */
    }
  }

  #later(ms, fn) {
    this.#timers.push(setTimeout(() => {
      try {
        fn();
      } catch (error) {
        console.warn('Features: a group drawing step failed', error);
      }
    }, ms));
  }

  #showWho(index) {
    if (index === this.#shown || !this.#who) return;
    this.#shown = index;
    const s = this.#strokes[index];
    if (!s) {
      this.#who.classList.remove('on');
      return;
    }
    this.#name.textContent = s.name || '';
    const g = this.#face.getContext('2d');
    g.clearRect(0, 0, FACE, FACE);
    g.imageSmoothingEnabled = false;
    try {
      if (s.portrait) g.drawImage(s.portrait, 0, 0, FACE, FACE);
    } catch (error) {
      /* no face: the name still shows */
    }
    this.#face.hidden = !s.portrait;
    this.#who.classList.add('on');
    try {
      this.game.sound.play('blip');
    } catch (error) {
      /* silent */
    }
  }

  #paint(g, width, height, t, now) {
    const cx = width / 2;
    const cy = height * 0.46;
    const R = Math.min(width, height) * 0.36;
    const lift = this.#liftAt ? (now - this.#liftAt) / LIFT_MS : 0;
    const blaze = this.#liftAt ? Math.min(1, (now - this.#liftAt) / BLAZE_MS) : 0;
    const rising = this.#liftAt ? Math.max(0, Math.min(1, (now - this.#liftAt - BLAZE_MS * 0.6) / LIFT_MS)) : 0;

    /* the veil: it rises from the bottom up once the shape has blazed */
    const veilTop = -height * 0.1;
    const veilBottom = height * (1 - ease(rising) * 1.15);
    if (veilBottom > veilTop) {
      g.fillStyle = rgba(this.#veil, 0.42);
      g.fillRect(0, 0, width, Math.max(0, veilBottom));
      g.fillStyle = rgba(this.#veil, 0.3);
      for (let i = 0; i < 6; i++) {
        const y = veilBottom - 6 - i * 4 + Math.sin(t / 700 + i) * 2;
        g.fillRect(0, y, width, 1);
      }
    }

    /* the ring, stroke by stroke; each person's arc in their colour */
    const n = Math.max(1, this.#strokes.length);
    const seg = (Math.PI * 2) / n;
    const turn = -Math.PI / 2 + (t / 1000) * 0.08;
    let drawing = -1;
    g.lineCap = 'round';
    this.#strokes.forEach((s, i) => {
      const k = Math.max(0, Math.min(1, (t - this.#times[i]) / this.#strokeMs));
      if (k <= 0) return;
      if (k < 1) drawing = i;
      const a0 = turn + i * seg + 0.06;
      const a1 = a0 + (seg - 0.12) * ease(k);
      const color = s.color || GOLD;
      g.globalCompositeOperation = 'lighter';
      g.strokeStyle = rgba(color, 0.25 + 0.35 * blaze);
      g.lineWidth = 12;
      g.beginPath();
      g.arc(cx, cy, R, a0, a1);
      g.stroke();
      g.globalCompositeOperation = 'source-over';
      g.strokeStyle = blaze > 0 ? '#ffffff' : color;
      g.lineWidth = 3.5;
      g.beginPath();
      g.arc(cx, cy, R, a0, a1);
      g.stroke();
      /* the tip of the stroke being drawn */
      if (k < 1) {
        g.fillStyle = '#ffffff';
        g.beginPath();
        g.arc(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R, 5, 0, Math.PI * 2);
        g.fill();
      }
    });
    if (drawing >= 0) this.#showWho(drawing);

    /* lift: the player's shape blazes in the middle, and a light runs round the ring from it */
    if (this.#liftAt && this.#shape.length > 1) {
      const a = blaze < 1 ? blaze : Math.max(0, 1 - Math.max(0, lift - 0.5) * 2);
      const size = R * 0.62;
      g.globalCompositeOperation = 'lighter';
      for (const [w, alpha] of [[16, 0.25], [5, 0.9]]) {
        g.strokeStyle = rgba(w > 10 ? this.#color : '#ffffff', alpha * a);
        g.lineWidth = w;
        g.lineJoin = 'round';
        g.beginPath();
        this.#shape.forEach((q, i) => {
          const x = cx + q[0] * size;
          const y = cy + q[1] * size;
          if (i) g.lineTo(x, y);
          else g.moveTo(x, y);
        });
        g.stroke();
      }
      const run = turn + ease(Math.min(1, lift * 1.4)) * Math.PI * 2;
      g.fillStyle = rgba('#ffffff', 0.9 * a);
      g.beginPath();
      g.arc(cx + Math.cos(run) * R, cy + Math.sin(run) * R, 7, 0, Math.PI * 2);
      g.fill();
      g.globalCompositeOperation = 'source-over';
    }
  }
}

export function openGroupDrawing(game, options) {
  const scene = new GroupDrawingScene(game);
  try {
    game.scenes.push(scene, options);
  } catch (error) {
    console.warn('Features: a group drawing could not open', error);
    scene.done(null);
  }
  return scene;
}
