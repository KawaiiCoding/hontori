/*
 * pixels.js  (Hontori: capsules)
 * Job: a small pixel painter in the style of the game's icons (src/icons.js): each pixel belongs to a
 * material ramp, tones are shaded from the light at the top left, every shape gets an outline in its
 * darkest tone, and highlight dots go on last. The capsule prizes, the machine and the keepsakes are
 * painted with it, so they look like the rest of the game.
 *
 * Public API:
 *   ramp(hex)                    a five-tone ramp [outline, dark, base, light, high] made from one colour
 *   RAMPS                        named ramps (gold, straw, metal, glass, copper, cream, white, leaf, ...)
 *   class Grid                   new Grid(width, height)
 *     px(x, y, ramp, tone), rect(x, y, w, h, ramp), disc(cx, cy, r, ramp, clip), bmp(rows, ox, oy, map),
 *     tone(x, y, t), dot(x, y, color), clear(x, y), get(x, y)
 *     render(outline = true) -> a canvas of width x height (one pixel per grid cell)
 *   scaled(canvas, scale)        a copy scaled up with hard pixels
 */

function clamp(n) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function mix(hex, toward, amount) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const parts = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => clamp(c + (toward - c) * amount));
  return `#${parts.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

const ramps = new Map();

export function ramp(hex) {
  if (!ramps.has(hex)) ramps.set(hex, [mix(hex, 16, 0.72), mix(hex, 0, 0.3), hex, mix(hex, 255, 0.32), mix(hex, 255, 0.72)]);
  return ramps.get(hex);
}

export const RAMPS = Object.freeze({
  gold: ['#5a3200', '#c08010', '#f0b828', '#ffdc5a', '#fff8c8'],
  straw: ['#5a3a10', '#c09040', '#e8c468', '#f8e09a', '#fff6d0'],
  metal: ['#2e2a3a', '#7c7c92', '#b4b4c8', '#dcdcea', '#ffffff'],
  glass: ['#2a4a6a', '#7aa6c8', '#b8dcf0', '#e0f4ff', '#ffffff'],
  copper: ['#3e1a0a', '#9a4a22', '#d0743a', '#f0a060', '#ffd8b0'],
  cream: ['#3a2a10', '#c8a868', '#f0dcae', '#fff4d8', '#ffffff'],
  white: ['#2a2e48', '#a8b0cc', '#dfe4f2', '#f6f8ff', '#ffffff'],
  leaf: ['#103a14', '#2a7a2a', '#4aaa3a', '#8ad65a', '#e0ffc0'],
  wood: ['#2a140a', '#5e3418', '#8a5428', '#b47a40', '#dcaa6a'],
  acorn: ['#2e1a0c', '#6e4424', '#9a6436', '#c08a54', '#e8c08a'],
  red: ['#4a0a0a', '#b02a1c', '#e0482c', '#ff7a5a', '#ffd0c0'],
  pink: ['#4a1426', '#c0506a', '#f07a90', '#ffa8b8', '#ffe0e8'],
  blue: ['#0e2250', '#2a5ab0', '#4a8ae4', '#8ac0ff', '#e0f2ff'],
  dark: ['#0a0a14', '#1a1a2a', '#2a2a3e', '#3a3a52', '#5a5a74'],
});

export class Grid {
  constructor(width, height) {
    this.w = width;
    this.h = height;
    this.m = new Array(width * height).fill(null);
    this.t = new Array(width * height).fill(-1);
    this.ov = [];
  }

  ok(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  px(x, y, m, t) {
    x |= 0;
    y |= 0;
    if (!this.ok(x, y)) return;
    const i = y * this.w + x;
    this.m[i] = m;
    this.t[i] = t == null ? -1 : t;
  }

  get(x, y) {
    return this.ok(x, y) ? this.m[y * this.w + x] : null;
  }

  tone(x, y, t) {
    if (this.ok(x, y) && this.m[y * this.w + x]) this.t[y * this.w + x] = t;
  }

  clear(x, y) {
    if (!this.ok(x, y)) return;
    this.m[y * this.w + x] = null;
    this.t[y * this.w + x] = -1;
  }

  rect(x, y, w, h, m) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, m);
  }

  disc(cx, cy, r, m, clip) {
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r && (!clip || clip(x, y))) this.px(x, y, m);
      }
    }
  }

  /* rows of characters; map: char -> [ramp, tone] */
  bmp(rows, ox, oy, map) {
    for (let j = 0; j < rows.length; j++) {
      for (let i = 0; i < rows[j].length; i++) {
        const v = map[rows[j][i]];
        if (v) this.px(ox + i, oy + j, v[0], v[1]);
      }
    }
  }

  dot(x, y, color) {
    this.ov.push([x, y, color || '#ffffff']);
  }

  render(outline = true) {
    const { w, h, m, t } = this;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const g = canvas.getContext('2d');
    /* tones from the light at the top left, as the game's icons */
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        const here = m[i];
        if (!here || t[i] >= 0) continue;
        const below = this.get(x, y + 1) !== here;
        const right = this.get(x + 1, y) !== here;
        const above = this.get(x, y - 1) !== here;
        const left = this.get(x - 1, y) !== here;
        if (below && !above) t[i] = 1;
        else if (right && !left && !above) t[i] = 1;
        else if ((above || left) && !below) t[i] = 3;
        else t[i] = 2;
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (!m[i]) continue;
        g.fillStyle = m[i][Math.max(0, Math.min(4, t[i]))];
        g.fillRect(x, y, 1, 1);
      }
    }
    if (outline) {
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          if (m[y * w + x]) continue;
          const n = this.get(x, y + 1) || this.get(x, y - 1) || this.get(x + 1, y) || this.get(x - 1, y);
          if (!n) continue;
          g.fillStyle = n[0];
          g.fillRect(x, y, 1, 1);
        }
      }
    }
    for (const [x, y, color] of this.ov) {
      if (!this.ok(x, y)) continue;
      g.fillStyle = color;
      g.fillRect(x, y, 1, 1);
    }
    return canvas;
  }
}

export function scaled(canvas, scale) {
  const out = document.createElement('canvas');
  out.width = canvas.width * scale;
  out.height = canvas.height * scale;
  const g = out.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(canvas, 0, 0, out.width, out.height);
  return out;
}
