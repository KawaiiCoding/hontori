/*
 * bloom.js  (Hontori: features)
 * Job: the Element Bloom (src/progress.js evolveSeq), Hontori's own way to grow a stage: after a battle, a
 * hontori whose level has reached its next stage asks to bloom. "Not yet" lets it wait until its next level;
 * "Let it bloom" curls it into a shell of its element, the kid opens the shell with the V, the shell breaks
 * into pieces of itself and the new form rises from the light.
 *
 * Public API:
 *   installBloom(game)
 *   class BloomScene        enter({ member, kind, name, to, text })   result: true when it bloomed
 *
 * What it registers:
 *   story.command  "ext:bloom"   every party member that can bloom is asked in turn (the script waits)
 *   system         "bloom"       after "battle:end", asks the story to run { ext: 'bloom' } once the world is calm
 */

import { element } from '../../ui/dom.js';
import { Button } from '../../ui/Button.js';
import { ScreenScene, openScreen } from '../../systems/features/index.js';
import { canEvolve, stageFor, applyEvolve } from '../battle/growth.js';
import { kindOf } from './content.js';
import { drawSigil } from './sigil.js';

const SHELL = {
  fire: { a: '#ffb050', b: '#c2401a', line: '#ffe08a' },
  water: { a: '#9fd8ff', b: '#2a6ac0', line: '#e8f8ff' },
  wind: { a: '#d8fff4', b: '#5ab8a0', line: '#ffffff' },
  grass: { a: '#b8f090', b: '#3a8a3a', line: '#f0ffd0' },
  electric: { a: '#fff4a0', b: '#c0a020', line: '#ffffff' },
  earth: { a: '#e0c090', b: '#7a5530', line: '#fff0d0' },
  dark: { a: '#b8a0ff', b: '#3a2a70', line: '#e8dcff' },
  light: { a: '#fffbe0', b: '#d8c070', line: '#ffffff' },
};
const SPRITE = 160;
const EGG_W = 30;
const EGG_H = 38;
const STEP = 1 / 60;
const STILL_ENV = { t: 0, time: 12, weather: 'clear', wind: 0, indoor: true };

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a, b, t) {
  return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)},${Math.round(a[1] + (b[1] - a[1]) * t)},${Math.round(a[2] + (b[2] - a[2]) * t)})`;
}

function sound(game, name) {
  try {
    game.sound.play(name);
  } catch (error) {
    /* silent */
  }
}

export class BloomScene extends ScreenScene {
  frameRate = 30;

  #o = null;
  #shell = SHELL.fire;
  #msg = null;
  #row = null;
  #phase = 'ask';
  #phaseAt = 0;
  #clock = 0;
  #carry = 0;
  #old = null;
  #new = null;
  #eggs = new Map();
  #cracks = [];
  #motes = [];
  #shards = [];
  #canClose = false;
  #bloomed = false;
  #timers = [];

  constructor(game) {
    super(game, 'ft-moment');
  }

  build(root, options) {
    this.#o = options;
    this.#shell = SHELL[options.element] || SHELL.fire;
    this.makeCanvas(root);
    this.#msg = element('div', 'msg', root, options.text('shared.feat.bloom.ask', { name: options.name, element: options.text(`shared.feat.element.${options.element}`) }));
    this.#msg.style.borderColor = this.#shell.a;
    this.#row = element('div', 'row', root);
    const later = new Button(this.game.art, { label: options.text('shared.feat.bloom.wait'), kind: 'alt', small: true, onPress: (e) => this.#wait(e) });
    const go = new Button(this.game.art, { label: options.text('shared.feat.bloom.go'), small: true, onPress: (e) => this.#go(e) });
    this.#row.append(later.element, go.element);
    this.#old = this.#sprite(options.member.key, options.member.stage || 1);
    this.#new = this.#sprite(options.member.key, options.to);
    for (let c = 0; c < 5; c++) {
      const a0 = (c / 5) * Math.PI * 2 + Math.random() * 0.5;
      const points = [];
      for (let j = 1; j <= 5; j++) points.push([Math.cos(a0 + (Math.random() - 0.5) * 0.6) * j * 0.17, Math.sin(a0 + (Math.random() - 0.5) * 0.6) * j * 0.2]);
      this.#cracks.push(points);
    }
    root.addEventListener('click', () => {
      if (this.#canClose) this.done(this.#bloomed);
    });
    sound(this.game, 'sparkle');
  }

  exit() {
    for (const timer of this.#timers) clearTimeout(timer);
    this.#timers = [];
    super.exit();
  }

  onKey(event) {
    if ((event.key === 'Enter' || event.key === ' ') && this.#canClose) this.done(this.#bloomed);
  }

  update(dt) {
    this.#step(dt);
  }

  ambient(dt) {
    this.#step(dt);
  }

  draw() {
    const g = this.prepareCanvas();
    if (!g) return;
    const { width: W, height: H } = this.canvasSize();
    const t = this.#clock;
    const lt = t - this.#phaseAt;
    const cx = W / 2;
    const cy = H * 0.4;
    const k = Math.min(W, H) / 260;
    const size = SPRITE * k * 1.3;
    const r = size * 0.42;
    const sh = this.#shell;
    g.fillStyle = '#07081a';
    g.fillRect(0, 0, W, H);
    g.fillStyle = sh.a;
    g.globalAlpha = 0.35;
    for (const q of this.#motes) g.fillRect(q.x * W, H + 5 - q.y, q.s * k, q.s * k);
    g.globalAlpha = 0.35;
    g.strokeStyle = sh.a;
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(cx, cy + size * 0.46, size * 0.5, size * 0.12, 0, 0, Math.PI * 2);
    g.stroke();
    g.globalAlpha = 1;
    const bob = Math.sin(t * 2) * 3 * k;
    if (this.#phase === 'ask' || this.#phase === 'wait') {
      g.drawImage(this.#old, cx - size / 2, cy - size / 2 + bob, size, size);
    } else if (this.#phase === 'curl' || this.#phase === 'shell') {
      /* the hontori shrinks and fades while the shell grows around it */
      const p = Math.min(1, lt / 1.6);
      const s1 = size * (1 - p * 0.55);
      g.globalAlpha = 1 - p;
      g.drawImage(this.#old, cx - s1 / 2, cy - s1 / 2 + bob, s1, s1);
      g.globalAlpha = 1;
      this.#drawShell(g, cx, cy + bob, r * (0.4 + p * 0.6), p, 0);
    } else {
      const p2 = Math.min(1, lt / 0.5);
      if (lt < 0.5) this.#drawShell(g, cx, cy + bob, r * (1 + 0.04 * Math.sin(lt * 60)), 1, p2);
      /* the new form rises from the light */
      const p3 = Math.max(0, Math.min(1, (lt - 0.45) / 0.8));
      if (p3 > 0) {
        const glow = g.createRadialGradient(cx, cy, 0, cx, cy, size * 0.8);
        glow.addColorStop(0, `rgba(255,255,255,${0.25 * (1 - p3 * 0.6)})`);
        glow.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = glow;
        g.fillRect(cx - size, cy - size, size * 2, size * 2);
        const s2 = size * (0.7 + 0.3 * p3);
        g.globalAlpha = p3;
        g.drawImage(this.#new, cx - s2 / 2, cy - s2 / 2 + bob - (1 - p3) * 10, s2, s2);
        g.globalAlpha = 1;
      }
      if (lt >= 0.5) {
        const es = Math.max(2, Math.round(((size * 0.84) / EGG_H) * 1.15));
        for (const piece of this.#shards) {
          g.save();
          g.translate(cx + piece.x + piece.ox * es, cy + piece.y + piece.oy * es);
          g.rotate(piece.r);
          g.globalAlpha = Math.min(1, piece.l);
          g.drawImage(piece.img, (-piece.img.width * es) / 2, (-piece.img.height * es) / 2, piece.img.width * es, piece.img.height * es);
          g.restore();
        }
      }
    }
  }

  #step(dt) {
    this.#carry += dt;
    while (this.#carry >= STEP) {
      this.#carry -= STEP;
      this.#clock += STEP;
      const t = this.#clock;
      /* a slow garden of element motes drifting up (x as a share of the width, y in pixels from the bottom) */
      if (Math.random() < 0.5) this.#motes.push({ x: Math.random(), y: 0, v: 12 + Math.random() * 24, s: 1 + Math.random() * 2.5, w: Math.random() * 6 });
      for (let i = this.#motes.length - 1; i >= 0; i--) {
        const q = this.#motes[i];
        q.y += q.v / 60;
        q.x += (Math.sin(t + q.w) * 0.3) / 400;
        if (q.y > 1200) this.#motes.splice(i, 1);
      }
      if (this.#phase === 'open' && t - this.#phaseAt >= 0.5) {
        for (let i = this.#shards.length - 1; i >= 0; i--) {
          const s = this.#shards[i];
          s.l -= 1 / 60;
          if (s.l <= 0) {
            this.#shards.splice(i, 1);
            continue;
          }
          s.x += s.vx / 60;
          s.y += s.vy / 60;
          s.vy += 3;
          s.r += s.vr / 60;
        }
      }
    }
  }

  #setPhase(phase) {
    this.#phase = phase;
    this.#phaseAt = this.#clock;
  }

  #later(ms, fn) {
    this.#timers.push(setTimeout(() => {
      if (!this.ended) fn();
    }, ms));
  }

  #wait(event) {
    if (event) event.stopPropagation();
    if (this.#phase !== 'ask') return;
    this.#row.remove();
    this.#o.member.hold = true;
    this.#msg.textContent = this.#o.text('shared.feat.bloom.waits', { name: this.#o.name });
    sound(this.game, 'bump');
    this.#setPhase('wait');
    this.#finish();
  }

  #go(event) {
    if (event) event.stopPropagation();
    if (this.#phase !== 'ask') return;
    this.#row.remove();
    sound(this.game, 'spell');
    this.#msg.textContent = this.#o.text('shared.feat.bloom.curl', { name: this.#o.name, shell: this.#o.text(`shared.feat.bloom.shell.${this.#o.element}`) });
    this.#setPhase('curl');
    this.#later(1900, () => this.#askV());
  }

  async #askV() {
    this.#setPhase('shell');
    this.#phaseAt -= 1.6;
    this.#msg.textContent = this.#o.text('shared.feat.bloom.open');
    await drawSigil(this.game, 'veil', this.#o.text('shared.feat.bloom.draw'));
    if (this.ended) return;
    this.#setPhase('open');
    sound(this.game, 'wand');
    this.#o.bloom();
    this.#bloomed = true;
    this.#breakShell();
    this.#later(900, () => {
      this.#msg.textContent = this.#o.text('shared.feat.bloom.done', { name: this.#o.name, stage: this.#o.newName });
      this.#finish();
    });
  }

  #finish() {
    this.#later(1200, () => {
      this.#canClose = true;
      this.#msg.textContent += `  ${this.#o.text('shared.feat.bloom.tap')}`;
    });
  }

  #sprite(key, stage) {
    const canvas = document.createElement('canvas');
    canvas.width = SPRITE;
    canvas.height = SPRITE;
    const g = canvas.getContext('2d');
    g.imageSmoothingEnabled = false;
    try {
      this.game.art.drawCreature(g, key, SPRITE / 2, SPRITE / 2, STILL_ENV, { scale: SPRITE / 40, noShadow: true, stage });
    } catch (error) {
      /* an empty picture rather than none */
    }
    return canvas;
  }

  /* the shell is pixel art like every hontori: a small egg lit from the top left, an outline of its own
     colour, a band pattern of its element, scaled up with sharp pixels; crack 0..1 draws the cracks */
  #egg(crack) {
    const key = Math.round(crack * 5);
    if (this.#eggs.has(key)) return this.#eggs.get(key);
    const canvas = document.createElement('canvas');
    canvas.width = EGG_W;
    canvas.height = EGG_H;
    const e = canvas.getContext('2d');
    const sh = this.#shell;
    const A = hexRgb(sh.a);
    const B = hexRgb(sh.b);
    const L = hexRgb(sh.line);
    const D = [B[0] * 0.45, B[1] * 0.45, B[2] * 0.5];
    const ramp = [mix(D, B, 0.6), mix(B, B, 0), mix(B, A, 0.5), mix(A, A, 0), mix(A, L, 0.6)];
    const inside = (x, y) => {
      let u = (x - 14.5) / 12.5;
      const v = (y - 20) / 17;
      if (v < 0) u *= 1 + v * 0.18;
      return u * u + v * v < 1;
    };
    for (let y = 0; y < EGG_H; y++) {
      for (let x = 0; x < EGG_W; x++) {
        if (!inside(x, y)) {
          if (inside(x - 1, y) || inside(x + 1, y) || inside(x, y - 1) || inside(x, y + 1)) {
            e.fillStyle = mix(D, D, 0);
            e.fillRect(x, y, 1, 1);
          }
          continue;
        }
        const lx = (x - 9) / 14;
        const ly = (y - 10) / 18;
        const lit = 1 - Math.sqrt(lx * lx + ly * ly);
        const band = y % 7 === 3 ? -0.18 : 0;
        const dither = (x + y) & 1 ? 0.06 : 0;
        e.fillStyle = ramp[Math.max(0, Math.min(4, Math.floor((lit + band + dither + 0.35) * 4)))];
        e.fillRect(x, y, 1, 1);
      }
    }
    e.fillStyle = mix(L, L, 0);
    e.fillRect(8, 9, 2, 1);
    e.fillRect(7, 10, 1, 2);
    e.fillRect(11, 7, 1, 1);
    e.fillStyle = mix(L, A, 0.3);
    e.fillRect(14, 18, 2, 4);
    e.fillRect(13, 19, 4, 2);
    if (crack > 0) {
      e.fillStyle = mix(L, L, 0);
      for (const c of this.#cracks) {
        const n = Math.ceil(c.length * crack);
        let px = 14.5;
        let py = 20;
        for (let q = 0; q < n; q++) {
          const tx = 14.5 + c[q][0] * 12.5;
          const ty = 20 + c[q][1] * 17;
          const steps = Math.ceil(Math.max(Math.abs(tx - px), Math.abs(ty - py)));
          for (let s = 0; s <= steps; s++) {
            const xx = Math.round(px + ((tx - px) * s) / Math.max(1, steps));
            const yy = Math.round(py + ((ty - py) * s) / Math.max(1, steps));
            if (inside(xx, yy)) e.fillRect(xx, yy, 1, 1);
          }
          px = tx;
          py = ty;
        }
      }
    }
    this.#eggs.set(key, canvas);
    return canvas;
  }

  #drawShell(g, cx, cy, r, alpha, crack) {
    const egg = this.#egg(crack || 0);
    const scale = Math.max(2, Math.round(((r * 2) / egg.height) * 1.15));
    const w = egg.width * scale;
    const h = egg.height * scale;
    g.save();
    g.imageSmoothingEnabled = false;
    g.globalAlpha = alpha;
    if (crack > 0) {
      g.shadowColor = this.#shell.a;
      g.shadowBlur = 18;
    }
    g.drawImage(egg, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
    g.restore();
  }

  /* the shell breaks along its cracks into real pieces of itself that fly out, spin, fall and fade */
  #breakShell() {
    const egg = this.#egg(1);
    const CW = 8;
    const CH = 8;
    for (let y0 = 0; y0 < egg.height; y0 += CH) {
      for (let x0 = 0; x0 < egg.width; x0 += CW) {
        const piece = document.createElement('canvas');
        piece.width = CW;
        piece.height = CH;
        const pg = piece.getContext('2d', { willReadFrequently: true });
        pg.drawImage(egg, -x0, -y0);
        const data = pg.getImageData(0, 0, CW, CH).data;
        let any = false;
        for (let q = 3; q < data.length; q += 4) {
          if (data[q] > 0) {
            any = true;
            break;
          }
        }
        if (!any) continue;
        const ox = x0 + CW / 2 - egg.width / 2;
        const oy = y0 + CH / 2 - egg.height / 2;
        const angle = Math.atan2(oy, ox);
        const speed = 70 + Math.random() * 110;
        this.#shards.push({ img: piece, ox, oy, x: 0, y: 0, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 60, r: 0, vr: (Math.random() - 0.5) * 7, l: 1.5 });
      }
    }
  }
}

function partyOf(game) {
  const items = game.registry.get('service', 'items');
  return items && items.party ? items.party : null;
}

function nameOf(ctx, member, kind, stage) {
  if (member.nick) return String(member.nick);
  const stages = (kind && kind.stages) || [];
  const entry = stages[Math.max(0, Math.min(stages.length - 1, stage - 1))];
  return entry ? ctx.text(entry.name) : member.key;
}

export function installBloom(game) {
  const { registry } = game;

  registry.add('story.command', 'ext:bloom', async (node, ctx) => {
    const party = partyOf(game);
    if (!party) return undefined;
    for (const member of party.members()) {
      if (!member || !canEvolve(member)) continue;
      const kind = kindOf(game, member.key);
      const to = stageFor(member.level);
      const scene = new BloomScene(game);
      await openScreen(game, scene, {
        member,
        to,
        element: (kind && kind.element) || 'fire',
        name: nameOf(ctx, member, kind, member.stage || 1),
        newName: nameOf(ctx, { key: member.key }, kind, to),
        text: (id, params) => ctx.text(id, params),
        bloom: () => {
          applyEvolve(member, to);
          party.changed();
          game.save.commit();
        },
      });
      if (ctx.story.ended(ctx)) return 'stop';
    }
    game.save.commit();
    return undefined;
  });

  registry.add('system', 'bloom', {
    start(owner) {
      owner.bus.on('battle:end', () => {
        const party = partyOf(owner);
        const story = owner.registry.get('service', 'story');
        if (!party || !story || !party.members().some((member) => member && canEvolve(member))) return;
        story.run([{ ext: 'bloom' }]);
      });
    },
  });
}
