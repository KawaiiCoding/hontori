/*
 * arena.js  (Hontori game layer)
 * Job: the place a battle happens in: sky with sun, moon, stars and clouds for the hour, far mountains, the
 * land of the biome (meadow, forest, river or indoor), the two platforms the hontori stand on, swaying grass,
 * reeds, fireflies and butterflies, foreground foliage, and the weather (rain with ripples, snow, fog, wind).
 * The fixed parts are painted once into two pictures; only what moves is drawn each frame. This is the current
 * game's battle backdrop (src/battle.js buildScene, drawSceneBack, drawSceneFront).
 *
 * Public API:
 *   new Arena(width, height, biome, env, places)
 *       width, height in art pixels; biome: 'meadow' | 'forest' | 'river' | 'indoor';
 *       env: { time, weather }; places: { foe: { x, gy }, me: { x, gy } } (centre and ground line of each side)
 *   update(dt)                 move clouds, rain, snow, leaves and ripples
 *   drawBack(g, time)          everything behind the hontori
 *   drawFront(g, time, uiTop)  foliage and weather in front of them; uiTop: where the interface begins
 *   horizon                    the y of the horizon
 *   timeOfDay(hour)            'dawn' | 'day' | 'dusk' | 'night'
 */

import { rgba } from './look.js';

const TAU = 6.283;
const SKY = {
  dawn: ['#4a5a9a', '#e8a0a8', '#ffd6a8'], day: ['#3f9be8', '#93d2ff', '#dcf3ff'],
  dusk: ['#2a2860', '#b0507a', '#ff9e5e'], night: ['#060a20', '#121a44', '#24305e']
};
const TINT = { dawn: 'rgba(255,140,150,.16)', day: null, dusk: 'rgba(200,80,60,.26)', night: 'rgba(14,24,72,.58)' };
const BIOME = {
  meadow: { ground: '#86c95e', dark: '#5fa846', light: '#a8e07a', hill1: '#79bd68', hill2: '#5aa456' },
  forest: { ground: '#4f8a3e', dark: '#3a6c30', light: '#6aa84e', hill1: '#2f5a3a', hill2: '#24482e' },
  river: { ground: '#7cc062', dark: '#5a9e4a', light: '#9fd87a', hill1: '#6aa86a', hill2: '#4f8e58' },
  indoor: { ground: '#9a6a42', dark: '#7a4e2e', light: '#b8845a' }
};

export function timeOfDay(hour) {
  return hour >= 5 && hour < 8 ? 'dawn' : hour >= 8 && hour < 17 ? 'day' : hour >= 17 && hour < 20 ? 'dusk' : 'night';
}

function seeded(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function sheet(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w));
  c.height = Math.max(1, Math.ceil(h));
  return c;
}

function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return `#${((1 << 24) | (f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1)}`;
}

function mountains(g, W, base, hmax, R, color, caps) {
  const pts = [];
  let x = -4;
  let y = base - hmax * 0.4;
  while (x < W + 8) {
    pts.push([x, y]);
    x += 4 + R() * 8;
    y = base - hmax * (0.25 + R() * 0.75);
  }
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(-4, base + 4);
  for (const p of pts) g.lineTo(p[0], p[1]);
  g.lineTo(W + 8, base + 4);
  g.fill();
  g.fillStyle = shade(color, 0.18);
  for (let i = 0; i < pts.length - 1; i++) {
    const p = pts[i];
    const q = pts[i + 1];
    if (q[1] <= p[1]) continue;
    g.beginPath();
    g.moveTo(p[0], p[1]);
    g.lineTo(q[0], q[1]);
    g.lineTo(p[0] + (q[0] - p[0]) * 0.3, base + 4);
    g.fill();
  }
  if (!caps) return;
  g.fillStyle = 'rgba(250,252,255,.9)';
  for (const p of pts) {
    if (p[1] >= base - hmax * 0.7) continue;
    g.beginPath();
    g.moveTo(p[0] - 3, p[1] + 3);
    g.lineTo(p[0], p[1]);
    g.lineTo(p[0] + 3, p[1] + 3);
    g.fill();
  }
}

function hills(g, W, base, amp, R, color, f) {
  const ph = R() * 6;
  const ph2 = R() * 6;
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, base + 20);
  for (let x = 0; x <= W; x += 2) g.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(x * f + ph)) - amp * 0.4 * Math.sin(x * f * 2.7 + ph2));
  g.lineTo(W, base + 20);
  g.fill();
}

function pine(g, x, base, h, color, snow) {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x - h * 0.3, base);
  g.lineTo(x, base - h);
  g.lineTo(x + h * 0.3, base);
  g.fill();
  if (snow) {
    g.fillStyle = 'rgba(240,246,255,.8)';
    g.fillRect(x - 1, base - h + 1, 2, 2);
  }
}

function roundTree(g, x, y, r, color) {
  g.fillStyle = '#4a3a2a';
  g.fillRect(x - 0.5, y, 1, 3);
  g.fillStyle = color;
  g.beginPath();
  g.arc(x, y - r * 0.6, r, 0, TAU);
  g.fill();
  g.fillStyle = shade(color, 0.15);
  g.fillRect(x - r * 0.5, y - r, 2, 1);
}

function trunk(g, cx, base, w, color) {
  const x = Math.round(cx - w / 2);
  g.fillStyle = color;
  g.fillRect(x, 0, w, base);
  g.fillStyle = shade(color, 0.15);
  g.fillRect(x + 1, 0, 1, base);
  g.fillStyle = shade(color, -0.3);
  g.fillRect(x + w - 1, 0, 1, base);
  g.fillStyle = shade(color, -0.2);
  for (let y = 4; y < base; y += 7) g.fillRect(x + 2, y, Math.max(1, w - 4), 1);
  g.fillStyle = shade(color, -0.1);
  g.fillRect(x - 2, base - 2, w + 4, 2);
  g.fillRect(x - 3, base - 1, 2, 1);
  g.fillRect(x + w + 1, base - 1, 2, 1);
}

function mushroom(g, fx, fy, R) {
  const x = fx | 0;
  const y = fy | 0;
  g.fillStyle = '#f0e8d0';
  g.fillRect(x, y, 1, 2);
  g.fillStyle = R() < 0.5 ? '#d84a3a' : '#e0a040';
  g.fillRect(x - 1, y - 1, 3, 1);
  g.fillStyle = '#fff';
  g.fillRect(x, y - 1, 1, 1);
}

function platform(g, x, y, rx, kind, R, snow) {
  const ry = rx * 0.3;
  const ell = (dx, dy, a, b, c) => {
    g.fillStyle = c;
    g.beginPath();
    g.ellipse(x + dx, y + dy, a, b, 0, 0, TAU);
    g.fill();
  };
  if (kind === 'grass' || kind === 'moss') {
    const moss = kind === 'moss';
    ell(0, 2, rx + 1, ry + 1.5, '#6a4a2c');
    ell(0, 0, rx, ry, moss ? '#3a6a32' : '#4f9a3e');
    ell(0, -0.5, rx * 0.86, ry * 0.75, moss ? '#4f8a40' : '#74c058');
    ell(-rx * 0.2, -1.2, rx * 0.45, ry * 0.3, moss ? '#68a050' : '#92d872');
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * TAU;
      g.fillStyle = i % 2 ? '#3a7a30' : '#5fae48';
      g.fillRect((x + Math.cos(a) * rx * 0.97) | 0, ((y + Math.sin(a) * ry * 0.97) | 0) - 2, 1, 2);
    }
    if (moss) {
      g.fillStyle = '#5a4028';
      for (let r = 0; r < 4; r++) {
        const a = 0.3 + r * 0.8;
        g.fillRect((x + Math.cos(a) * rx * 0.9) | 0, (y + Math.sin(a) * ry + 1) | 0, 4, 1);
      }
    }
  } else if (kind === 'stone') {
    ell(0, 2, rx + 1, ry + 1.5, '#4a4a52');
    ell(0, 0, rx, ry, '#8a8a94');
    ell(0, -0.5, rx * 0.86, ry * 0.75, '#a4a4ae');
    g.strokeStyle = '#7a7a84';
    g.lineWidth = 0.6;
    for (let c = 0; c < 7; c++) {
      const cx = x + (R() - 0.5) * rx * 1.4;
      const cy = y + (R() - 0.5) * ry * 1.2;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + 4, cy + 1);
      g.stroke();
    }
    g.fillStyle = '#5a9a4a';
    for (let m = 0; m < 8; m++) g.fillRect((x + (R() - 0.5) * rx * 1.8) | 0, (y + ry * 0.6 + R() * 2) | 0, 2, 1);
  } else if (kind === 'sand') {
    ell(0, 2, rx + 1, ry + 1.5, '#a8925a');
    ell(0, 0, rx, ry, '#dcc68e');
    ell(0, -0.5, rx * 0.86, ry * 0.75, '#ead8a4');
    for (let s = 0; s < 40; s++) {
      g.fillStyle = R() < 0.5 ? '#c4ae76' : '#f4e6bc';
      g.fillRect((x + (R() - 0.5) * rx * 1.6) | 0, (y + (R() - 0.5) * ry * 1.4) | 0, 1, 1);
    }
    g.fillStyle = '#f0e0d0';
    g.fillRect((x + rx * 0.5) | 0, (y + 1) | 0, 2, 1);
  } else {
    const main = kind === 'rug' ? '#7a3a5a' : '#3a5a8a';
    ell(0, 1, rx + 1, ry + 1, '#5a3a22');
    ell(0, 0, rx, ry, '#e0b060');
    ell(0, 0, rx * 0.9, ry * 0.85, main);
    ell(0, 0, rx * 0.62, ry * 0.58, shade(main, 0.2));
    g.fillStyle = '#e0b060';
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * TAU;
      g.fillRect((x + Math.cos(a) * rx * 0.76) | 0, (y + Math.sin(a) * ry * 0.72) | 0, 1, 1);
    }
  }
  if (snow && kind !== 'rug' && kind !== 'rug2') {
    g.fillStyle = 'rgba(245,250,255,.55)';
    g.beginPath();
    g.ellipse(x - rx * 0.15, y - 0.5, rx * 0.6, ry * 0.5, 0, 0, TAU);
    g.fill();
  }
}

/* blades and fronds rising from a bottom corner of the screen */
function foliage(biome, R, tod, snow, right) {
  const w = 34;
  const h = 52;
  const c = sheet(w, h);
  const g = c.getContext('2d');
  const dark = tod === 'night' ? 0.55 : tod === 'dusk' ? 0.25 : 0;
  const base = biome === 'forest' ? ['#1f4a26', '#2a6030', '#38783a'] : biome === 'river' ? ['#3a6a2a', '#5a8a34', '#7aa848'] : ['#2f7a2a', '#4a9a38', '#6cbc4a'];
  const cols = base.map((k) => shade(k, -dark));
  for (let i = 0; i < 16; i++) {
    const bx = R() * w * 0.8;
    const bh = h * (0.4 + R() * 0.6);
    const lean = (R() - 0.3) * 12;
    const wd = biome === 'forest' ? 3 : 2;
    g.fillStyle = cols[i % 3];
    g.beginPath();
    g.moveTo(bx - wd, h);
    g.quadraticCurveTo(bx + lean * 0.3, h - bh * 0.5, bx + lean, h - bh);
    g.quadraticCurveTo(bx + lean * 0.3 + wd, h - bh * 0.5, bx + wd, h);
    g.fill();
    if (biome === 'forest' && i % 3 === 0) {
      for (let f = 0; f < 6; f++) {
        const t = f / 6;
        const fx = bx + lean * t;
        const fy = h - bh * t;
        g.fillRect(fx | 0, fy | 0, 4, 1);
        g.fillRect((fx - 4) | 0, (fy + 1) | 0, 4, 1);
      }
    }
  }
  if (biome === 'river') {
    for (let k = 0; k < 3; k++) {
      const cx = 6 + k * 8 + R() * 3;
      const cy = 6 + R() * 10;
      g.fillStyle = shade('#4a8a30', -dark);
      g.fillRect(cx, cy, 1, h - cy);
      g.fillStyle = shade('#6a4024', -dark);
      g.fillRect(cx - 1, cy, 3, 6);
    }
  }
  if (biome === 'meadow') {
    for (let fl = 0; fl < 5; fl++) {
      const px = 4 + R() * (w - 8);
      const py = 10 + R() * 20;
      g.fillStyle = shade(['#ffffff', '#ffd84a', '#ff8ab0'][fl % 3], -dark);
      g.fillRect(px | 0, py | 0, 2, 2);
      g.fillStyle = shade('#ffd84a', -dark);
      g.fillRect((px | 0) + (fl % 3 ? 0 : 1), py | 0, 1, 1);
    }
  }
  if (snow) {
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(240,246,255,.35)';
    g.fillRect(0, 0, w, h * 0.5);
    g.globalCompositeOperation = 'source-over';
  }
  if (!right) return c;
  const flipped = sheet(w, h);
  const g2 = flipped.getContext('2d');
  g2.translate(w, 0);
  g2.scale(-1, 1);
  g2.drawImage(c, 0, 0);
  return flipped;
}

export class Arena {
  #W;
  #H;
  #env;
  #biome;
  #sky;
  #land;
  #clouds = [];
  #stars = [];
  #tufts = [];
  #reeds = [];
  #flies = [];
  #drops = [];
  #ripples = [];
  #leaves = [];
  #river = null;
  #shafts = null;
  #fog = null;
  #window = null;
  #left = null;
  #right = null;
  #uiTop = 0;
  #time = 0;

  constructor(width, height, biome, env, places) {
    this.#W = width;
    this.#H = height;
    this.#biome = BIOME[biome] ? biome : 'meadow';
    this.#env = { time: env.time == null ? 12 : env.time, weather: env.weather || 'clear' };
    this.horizon = Math.round(height * 0.25);
    this.#uiTop = height;
    this.#build(places);
  }

  update(dt) {
    const W = this.#W;
    const H = this.#H;
    const wx = this.#env.weather;
    for (const c of this.#clouds) {
      c.x += c.v * dt;
      if (c.x > W + 2) c.x = -c.c.width - 2;
    }
    this.#time += dt;
    for (const l of this.#leaves) {
      l.x += l.v * dt;
      l.y += Math.sin(this.#time * 2 + l.ph) * 0.15 + (wx === 'wind' ? 0.1 : 0.25) * dt * 20;
      if (l.x > W + 4 || l.y > H) {
        l.x = -4;
        l.y = Math.random() * H * 0.7;
      }
    }
    if (this.#biome === 'indoor') return;
    if (wx === 'rain') {
      for (const d of this.#drops) {
        d.y += d.v * dt;
        d.x -= d.v * dt * 0.12;
        if (d.y > H) {
          d.y = -6;
          d.x = Math.random() * W * 1.2;
        }
      }
      if (this.#ripples.length < 8 && Math.random() < 0.15) {
        this.#ripples.push({ x: Math.random() * W, y: this.horizon + 12 + Math.random() * (this.#uiTop - this.horizon - 12), t: 0 });
      }
      for (let i = this.#ripples.length - 1; i >= 0; i--) {
        const q = this.#ripples[i];
        q.t += dt;
        if (q.t > 0.6) this.#ripples.splice(i, 1);
      }
    } else if (wx === 'snow') {
      for (const d of this.#drops) {
        d.y += d.v * dt;
        if (d.y > H) {
          d.y = -2;
          d.x = Math.random() * W;
        }
      }
    }
  }

  drawBack(g, T) {
    const W = this.#W;
    const wx = this.#env.weather;
    g.drawImage(this.#sky, 0, 0);
    if (this.#biome !== 'indoor') {
      for (const c of this.#clouds) g.drawImage(c.c, Math.round(c.x), Math.round(c.y));
      this.#stars.forEach((s, i) => {
        g.fillStyle = `rgba(255,255,240,${0.5 + 0.5 * Math.sin(T * 2 + i * 1.7)})`;
        g.fillRect(s[0] - 1, s[1], 3, 1);
        g.fillRect(s[0], s[1] - 1, 1, 3);
      });
    }
    g.drawImage(this.#land, 0, 0);
    const wind = wx === 'wind' ? 2.6 : wx === 'rain' ? 1.4 : 1;
    if (this.#river) this.#drawRiver(g, T, wind);
    if (this.#shafts) {
      g.globalCompositeOperation = 'lighter';
      g.globalAlpha = 0.28 + 0.12 * Math.sin(T * 0.7);
      g.drawImage(this.#shafts, Math.sin(T * 0.3) * 2, 0);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
    g.lineWidth = 1;
    for (const q of this.#tufts) {
      const sw = Math.sin(T * 1.6 + q.x * 0.15 + q.ph) * (q.h / 5) * wind;
      g.strokeStyle = q.c;
      g.beginPath();
      g.moveTo(q.x - 1, q.y);
      g.lineTo(q.x - 2 + sw * 0.8, q.y - q.h * 0.7);
      g.moveTo(q.x, q.y);
      g.lineTo(q.x + sw, q.y - q.h);
      g.moveTo(q.x + 1, q.y);
      g.lineTo(q.x + 2 + sw * 0.8, q.y - q.h * 0.8);
      g.stroke();
      if (q.f) {
        g.fillStyle = q.f;
        g.fillRect(Math.round(q.x + sw) - 1, Math.round(q.y - q.h) - 1, 2, 2);
      }
    }
    this.#flies.forEach((f, i) => {
      const x = f.x + Math.sin(T * 0.5 + f.ph) * 18;
      const y = f.y + Math.sin(T * 0.9 + f.ph * 2) * 6;
      if (f.k === 'fly') {
        const a = 0.5 + 0.5 * Math.sin(T * 3 + f.ph);
        g.globalCompositeOperation = 'lighter';
        g.fillStyle = `rgba(220,255,140,${a * 0.3})`;
        g.fillRect(x - 1, y - 1, 3, 3);
        g.fillStyle = `rgba(240,255,180,${a})`;
        g.fillRect(x, y, 1, 1);
        g.globalCompositeOperation = 'source-over';
      } else {
        const up = Math.floor(T * 8 + i) % 2;
        g.fillStyle = f.c;
        g.fillRect(x - 2, y - (up ? 1 : 0), 2, up ? 1 : 2);
        g.fillRect(x + 1, y - (up ? 1 : 0), 2, up ? 1 : 2);
        g.fillStyle = '#3a2a1a';
        g.fillRect(x, y, 1, 1);
      }
    });
  }

  drawFront(g, T, uiTop) {
    const W = this.#W;
    const H = this.#H;
    const wx = this.#env.weather;
    this.#uiTop = uiTop;
    if (this.#left) {
      const wind = wx === 'wind' ? 2.5 : 1;
      const base = uiTop + 6;
      [[this.#left, 0], [this.#right, W - this.#right.width]].forEach((f, i) => {
        g.save();
        g.translate(f[1], base);
        g.transform(1, 0, Math.sin(T * 1.1 + i * 2) * 0.06 * wind, 1, 0, 0);
        g.drawImage(f[0], 0, -f[0].height);
        g.restore();
      });
    }
    for (const l of this.#leaves) {
      const flip = Math.sin(T * 6 + l.ph) > 0;
      g.fillStyle = l.c;
      g.fillRect(l.x | 0, l.y | 0, flip ? 2 : 1, flip ? 1 : 2);
    }
    if (this.#biome === 'indoor') {
      if (wx === 'rain' && this.#window) this.#drawWindowRain(g, T);
      return;
    }
    if (wx === 'rain') {
      g.strokeStyle = 'rgba(200,215,240,.5)';
      g.lineWidth = 0.6;
      g.beginPath();
      for (const d of this.#drops) {
        g.moveTo(d.x, d.y);
        g.lineTo(d.x - 0.8, d.y + 5);
      }
      g.stroke();
      g.strokeStyle = 'rgba(210,225,255,.55)';
      g.lineWidth = 0.5;
      for (const q of this.#ripples) {
        g.globalAlpha = Math.max(0, 1 - q.t / 0.6);
        g.beginPath();
        g.ellipse(q.x, q.y, 1 + q.t * 7, 0.5 + q.t * 2, 0, 0, TAU);
        g.stroke();
      }
      g.globalAlpha = 1;
    } else if (wx === 'snow') {
      g.fillStyle = 'rgba(255,255,255,.9)';
      for (const d of this.#drops) g.fillRect((d.x + Math.sin(T + d.ph) * 4) | 0, d.y | 0, d.s, d.s);
    } else if (wx === 'fog' && this.#fog) {
      for (const b of [[this.horizon - 6, 4, 0.9], [H * 0.46, -6, 0.7], [H * 0.7, 3, 0.6]]) {
        const o = (((T * b[1]) % W) + W) % W;
        g.globalAlpha = b[2];
        g.drawImage(this.#fog, -o, b[0]);
        g.drawImage(this.#fog, -o + W * 2, b[0]);
      }
      g.globalAlpha = 1;
    } else if (wx === 'wind') {
      g.strokeStyle = 'rgba(255,255,255,.35)';
      g.lineWidth = 0.5;
      g.beginPath();
      for (let k = 0; k < 5; k++) {
        const x = ((T * 90 + k * 53) % (W + 40)) - 20;
        const y = this.horizon + 6 + ((k * 23) % (H * 0.6));
        g.moveTo(x, y);
        g.lineTo(x + 12, y);
      }
      g.stroke();
    }
  }

  /* ---------- private ---------- */

  #drawRiver(g, T, wind) {
    const W = this.#W;
    const [y0, y1] = this.#river;
    g.fillStyle = 'rgba(200,235,255,.35)';
    for (let r = y0 + 1; r < y1; r += 2) {
      const off = (T * (10 + (r - y0) * 1.5)) % 14;
      for (let x = -14 + off + ((r * 7) % 9); x < W; x += 14) g.fillRect(x | 0, r, 4, 1);
    }
    for (let s = 0; s < 6; s++) {
      const sx = (s * 37 + Math.floor(T * 1.5 + s) * 53) % W;
      const ph = (T * 1.5 + s) % 1;
      if (ph >= 0.4) continue;
      g.fillStyle = `rgba(255,255,255,${1 - ph / 0.4})`;
      g.fillRect(sx | 0, y0 + 2 + ((s * 5) % (y1 - y0 - 3)), 1, 1);
    }
    g.lineWidth = 1;
    for (const q of this.#reeds) {
      const sw = Math.sin(T * 1.8 + q.x * 0.2) * wind;
      g.strokeStyle = '#4a7a2a';
      g.beginPath();
      g.moveTo(q.x, q.y);
      g.quadraticCurveTo(q.x, q.y - q.h * 0.6, q.x + sw, q.y - q.h);
      g.stroke();
      g.fillStyle = '#6a4024';
      g.fillRect(q.x + sw - 0.5, q.y - q.h, 2, 3);
    }
  }

  #drawWindowRain(g, T) {
    const w = this.#window;
    g.strokeStyle = 'rgba(200,220,255,.6)';
    g.lineWidth = 0.5;
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const rx = w[0] + ((i * 7 + T * 12) % w[2]);
      const ry = w[1] + ((i * 11 + T * 60) % w[3]);
      g.moveTo(rx, ry);
      g.lineTo(rx - 0.5, Math.min(w[1] + w[3], ry + 3));
    }
    g.stroke();
  }

  #build(P) {
    const W = this.#W;
    const H = this.#H;
    const biome = this.#biome;
    const B = BIOME[biome];
    const wx = this.#env.weather;
    const tod = timeOfDay(this.#env.time);
    const hz = this.horizon;
    const R = seeded(Math.round(W * 13 + H * 7) + biome.length * 977);
    const wet = wx === 'rain' || wx === 'fog';
    const snow = wx === 'snow';
    this.#sky = sheet(W, H * 0.45);
    this.#land = sheet(W, H);
    const g = this.#land.getContext('2d');
    this.#paintSky(R, tod, wet || snow);
    this.#makeClouds(R, tod);
    if (biome === 'indoor') this.#paintIndoor(g, R, tod);
    else this.#paintLand(g, R, B, P, snow);
    platform(g, P.foe.x, P.foe.gy, 30, biome === 'river' ? 'stone' : biome === 'indoor' ? 'rug' : biome === 'forest' ? 'moss' : 'grass', R, snow);
    platform(g, P.me.x, P.me.gy, 40, biome === 'river' ? 'sand' : biome === 'indoor' ? 'rug2' : biome === 'forest' ? 'moss' : 'grass', R, snow);
    g.globalCompositeOperation = 'source-atop';
    if (TINT[tod]) {
      g.fillStyle = TINT[tod];
      g.fillRect(0, 0, W, H);
    }
    if (wet && biome !== 'indoor') {
      g.fillStyle = wx === 'rain' ? 'rgba(60,70,100,.22)' : 'rgba(200,210,225,.18)';
      g.fillRect(0, 0, W, H);
    }
    g.globalCompositeOperation = 'source-over';
    if (biome !== 'indoor') {
      this.#left = foliage(biome, R, tod, snow, false);
      this.#right = foliage(biome, R, tod, snow, true);
    }
    if (wx === 'rain') for (let d = 0; d < 90; d++) this.#drops.push({ x: R() * W * 1.2, y: R() * H, v: 150 + R() * 80 });
    if (snow) for (let d = 0; d < 70; d++) this.#drops.push({ x: R() * W, y: R() * H, v: 10 + R() * 14, ph: R() * 6, s: R() < 0.2 ? 2 : 1 });
    if (wx === 'wind' || biome === 'forest') {
      const n = wx === 'wind' ? 14 : 5;
      for (let l = 0; l < n; l++) {
        this.#leaves.push({ x: R() * W, y: R() * H * 0.8, v: wx === 'wind' ? 30 + R() * 30 : 4 + R() * 5, ph: R() * 6, c: ['#a8d860', '#e0a040', '#7ec050'][l % 3] });
      }
    }
    if (wx === 'fog') this.#makeFog(R);
    if (biome !== 'indoor' && wx === 'clear') {
      if (tod === 'night') {
        for (let f = 0; f < 9; f++) this.#flies.push({ x: R() * W, y: hz + 14 + R() * H * 0.45, ph: R() * 6, k: 'fly' });
      } else if (biome === 'meadow') {
        for (let f = 0; f < 3; f++) this.#flies.push({ x: R() * W, y: hz + 20 + R() * H * 0.3, ph: R() * 6, k: 'bfly', c: ['#ffffff', '#ffd84a', '#ff9ac8'][f] });
      }
    }
  }

  #paintSky(R, tod, hazy) {
    const W = this.#W;
    const hz = this.horizon;
    const sky = this.#sky;
    const sg = sky.getContext('2d');
    const c3 = SKY[tod];
    const gr = sg.createLinearGradient(0, 0, 0, sky.height);
    gr.addColorStop(0, c3[0]);
    gr.addColorStop(0.65, c3[1]);
    gr.addColorStop(1, c3[2]);
    sg.fillStyle = gr;
    sg.fillRect(0, 0, W, sky.height);
    if (tod === 'night') {
      for (let i = 0; i < 70; i++) {
        const sx = R() * W;
        const sy = R() * hz * 1.1;
        sg.fillStyle = `rgba(255,255,255,${0.3 + R() * 0.6})`;
        sg.fillRect(sx | 0, sy | 0, 1, 1);
        if (i < 10) this.#stars.push([sx | 0, sy | 0]);
      }
    }
    const sun = {
      dawn: [W * 0.8, hz - 4, 6, '#ffd0b0'], day: [W * 0.2, hz * 0.32, 6, '#fffbe0'],
      dusk: [W * 0.25, hz - 2, 8, '#ffb070'], night: [W * 0.22, hz * 0.34, 5, '#f4f0dc']
    }[tod];
    const halo = sg.createRadialGradient(sun[0], sun[1], 0, sun[0], sun[1], sun[2] * 5);
    halo.addColorStop(0, rgba(sun[3], hazy ? 0.35 : 0.6));
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    sg.fillStyle = halo;
    sg.fillRect(0, 0, W, sky.height);
    sg.fillStyle = sun[3];
    sg.globalAlpha = hazy ? 0.5 : 1;
    sg.beginPath();
    sg.arc(sun[0], sun[1], sun[2], 0, TAU);
    sg.fill();
    if (tod === 'night') {
      /* the moon is a sun with a bite of sky taken out, and two craters */
      sg.fillStyle = c3[1];
      sg.beginPath();
      sg.arc(sun[0] + 2.5, sun[1] - 1.5, sun[2] * 0.85, 0, TAU);
      sg.fill();
      sg.fillStyle = 'rgba(200,200,180,.5)';
      sg.fillRect(sun[0] - 3, sun[1], 1, 1);
      sg.fillRect(sun[0] - 2, sun[1] + 2, 1, 1);
    }
    sg.globalAlpha = 1;
    if (hazy) {
      sg.fillStyle = this.#env.weather === 'rain' ? 'rgba(90,100,120,.45)' : 'rgba(200,210,220,.35)';
      sg.fillRect(0, 0, W, sky.height);
    }
  }

  #makeClouds(R, tod) {
    const W = this.#W;
    const wx = this.#env.weather;
    let color = tod === 'night' ? '#3a4472' : tod === 'dusk' ? '#f0a088' : tod === 'dawn' ? '#ffdcd4' : '#ffffff';
    if (wx === 'rain') color = tod === 'night' ? '#2a3048' : '#8a92a4';
    const count = wx === 'rain' || wx === 'snow' ? 6 : wx === 'clear' ? 3 : 4;
    for (let k = 0; k < count; k++) {
      const cw = 18 + R() * 22;
      const ch = 8 + R() * 5;
      const cs = sheet(cw, ch);
      const cg = cs.getContext('2d');
      for (let b = 0; b < 6; b++) {
        cg.fillStyle = b < 2 ? shade(color, -0.12) : color;
        const bx = 3 + R() * (cw - 10);
        const br = 2 + R() * 3.5;
        cg.beginPath();
        cg.arc(bx + br, ch - br - (b < 2 ? 0 : 1.5), br, 0, TAU);
        cg.fill();
      }
      cg.fillStyle = shade(color, -0.12);
      cg.fillRect(2, ch - 2, cw - 4, 2);
      this.#clouds.push({ c: cs, x: R() * W, y: 2 + R() * (this.horizon - 10), v: (0.6 + R() * 1.4) * (wx === 'wind' ? 4 : 1) });
    }
  }

  #paintLand(g, R, B, P, snow) {
    const W = this.#W;
    const H = this.#H;
    const hz = this.horizon;
    const biome = this.#biome;
    const tod = timeOfDay(this.#env.time);
    const wx = this.#env.weather;
    mountains(g, W, hz + 1, 26, R, '#9aaecb', snow || R() < 0.5);
    mountains(g, W, hz + 2, 16, R, '#7f98b8', snow);
    if (biome === 'forest') {
      for (let p = -4; p < W + 4; p += 3 + R() * 4) pine(g, p, hz + 6 + R() * 3, 9 + R() * 10, R() < 0.5 ? B.hill1 : B.hill2, snow);
    } else {
      hills(g, W, hz + 4, 7, R, B.hill1, 0.05);
      hills(g, W, hz + 9, 5, R, B.hill2, 0.08);
      for (let t = 0; t < 6; t++) roundTree(g, R() * W, hz + 5 + R() * 6, 3 + R() * 2, shade(B.hill2, -0.15));
    }
    const ground = g.createLinearGradient(0, hz + 6, 0, H);
    ground.addColorStop(0, shade(B.ground, -0.08));
    ground.addColorStop(1, B.ground);
    g.fillStyle = ground;
    g.fillRect(0, hz + 8, W, H - hz);
    if (biome !== 'forest') {
      g.fillStyle = B.hill2;
      g.fillRect(0, hz + 8, W, 2);
    }
    /* texture: specks, denser and longer towards the viewer */
    for (let y = hz + 9; y < H; y++) {
      const depth = (y - hz) / (H - hz);
      const n = Math.round(W * 0.06 * (0.5 + depth));
      for (let q = 0; q < n; q++) {
        const x = (R() * W) | 0;
        g.fillStyle = R() < 0.5 ? B.dark : B.light;
        /* the unused draw keeps the random sequence, and so the picture, of the current game */
        if (depth > 0.4) R();
        g.fillRect(x, y, 1, depth > 0.4 && R() < 0.5 ? 2 : 1);
      }
    }
    if (biome === 'forest') this.#paintForest(g, R, tod, wx);
    if (biome === 'river') this.#paintRiver(g, R);
    if (biome === 'meadow') {
      for (let fl = 0; fl < 70; fl++) {
        const fy = hz + 12 + R() * (H * 0.7 - hz);
        const fx = R() * W;
        g.fillStyle = ['#ffffff', '#ffd84a', '#ff8ab0', '#b8a0ff', '#ff6a5a'][fl % 5];
        g.fillRect(fx | 0, fy | 0, 1, 1);
        if ((fy - hz) / H > 0.2) {
          g.fillRect((fx | 0) + 1, fy | 0, 1, 1);
          g.fillStyle = '#4a8a3a';
          g.fillRect(fx | 0, (fy | 0) + 1, 1, 1);
        }
      }
    }
    if (snow) {
      g.globalCompositeOperation = 'source-atop';
      g.fillStyle = 'rgba(240,246,255,.5)';
      g.fillRect(0, hz + 8, W, H);
      g.globalCompositeOperation = 'source-over';
      g.fillStyle = 'rgba(255,255,255,.9)';
      for (let s = 0; s < 260; s++) g.fillRect((R() * W) | 0, (hz + 9 + R() * (H - hz)) | 0, R() < 0.3 ? 2 : 1, 1);
    }
    const count = biome === 'forest' ? 26 : 36;
    for (let t = 0; t < count; t++) {
      const ty = hz + 12 + R() * (H * 0.78 - hz);
      const tx = R() * W;
      if (Math.abs(tx - P.foe.x) < 30 && Math.abs(ty - P.foe.gy) < 10) continue;
      if (Math.abs(tx - P.me.x) < 38 && Math.abs(ty - P.me.gy) < 12) continue;
      if (this.#river && ty > this.#river[0] - 6 && ty < this.#river[1] + 8) continue;
      const depth = (ty - hz) / (H - hz);
      this.#tufts.push({
        x: tx, y: ty, h: 2 + depth * 6, c: R() < 0.5 ? B.dark : shade(B.dark, -0.15),
        f: biome === 'meadow' && R() < 0.35 ? ['#fff', '#ffd84a', '#ff8ab0', '#b8a0ff'][t % 4] : null, ph: R() * 6
      });
    }
    this.#tufts.sort((a, b) => a.y - b.y);
  }

  #paintForest(g, R, tod, wx) {
    const W = this.#W;
    const H = this.#H;
    const hz = this.horizon;
    for (let lf = 0; lf < 120; lf++) {
      g.fillStyle = ['#a8682a', '#c08a3a', '#6a4a22', '#88b048'][lf % 4];
      g.fillRect((R() * W) | 0, (hz + 10 + R() * (H - hz)) | 0, 2, 1);
    }
    [0.04, 0.2, 0.46, 0.62, 0.9, 0.98].forEach((fx, i) => {
      const near = i % 2 === 0;
      const bw = near ? 7 + R() * 4 : 4 + R() * 2;
      const base = near ? hz + 18 + R() * 8 : hz + 9;
      trunk(g, W * fx, base, bw, shade('#4a3424', near ? 0 : 0.12));
    });
    for (let c = 0; c < 40; c++) {
      const cx = R() * W;
      const cy = R() * hz * 0.5 - 4;
      const rr = 5 + R() * 8;
      g.fillStyle = ['#1f4a2a', '#2a5a32', '#18402a'][c % 3];
      g.beginPath();
      g.arc(cx, cy, rr, 0, TAU);
      g.fill();
    }
    g.fillStyle = '#3f7a44';
    for (let h = 0; h < 30; h++) g.fillRect((R() * W) | 0, (R() * hz * 0.45) | 0, 2, 1);
    if (tod !== 'night' && wx !== 'rain') {
      const shafts = sheet(W, H);
      const sg = shafts.getContext('2d');
      for (let s = 0; s < 4; s++) {
        const x0 = W * (0.1 + s * 0.26 + R() * 0.08);
        const wd = 5 + R() * 7;
        const light = sg.createLinearGradient(0, 0, 0, H * 0.75);
        light.addColorStop(0, 'rgba(255,248,200,.5)');
        light.addColorStop(1, 'rgba(255,248,200,0)');
        sg.fillStyle = light;
        sg.beginPath();
        sg.moveTo(x0, 0);
        sg.lineTo(x0 + wd, 0);
        sg.lineTo(x0 + wd + 26, H * 0.75);
        sg.lineTo(x0 + 22, H * 0.75);
        sg.fill();
      }
      this.#shafts = shafts;
    }
    for (let m = 0; m < 6; m++) mushroom(g, R() * W, hz + 16 + R() * (H * 0.5), R);
  }

  #paintRiver(g, R) {
    const W = this.#W;
    const H = this.#H;
    const y0 = Math.round(H * 0.47);
    const y1 = Math.round(H * 0.545);
    g.fillStyle = '#d8c48a';
    g.fillRect(0, y0 - 4, W, y1 - y0 + 9);
    g.fillStyle = '#b8a46a';
    g.fillRect(0, y0 - 1, W, 1);
    g.fillRect(0, y1 + 1, W, 2);
    const water = g.createLinearGradient(0, y0, 0, y1);
    water.addColorStop(0, '#2f78c0');
    water.addColorStop(1, '#3f9ad8');
    g.fillStyle = water;
    g.fillRect(0, y0, W, y1 - y0 + 1);
    for (let p = 0; p < 40; p++) {
      g.fillStyle = R() < 0.5 ? '#9a9080' : '#c8bca0';
      g.fillRect((R() * W) | 0, (R() < 0.5 ? y0 - 4 + R() * 3 : y1 + 2 + R() * 5) | 0, 1, 1);
    }
    this.#river = [y0, y1];
    for (let r = 0; r < 14; r++) this.#reeds.push({ x: R() * W, y: (r % 2 ? y0 - 2 : y1 + 5) + R() * 2, h: 6 + R() * 6 });
  }

  #paintIndoor(g, R, tod) {
    const W = this.#W;
    const H = this.#H;
    const sky = this.#sky;
    const wall = Math.round(H * 0.33);
    /* back wall of planks */
    for (let x = 0; x < W; x += 6) {
      g.fillStyle = (x / 6) % 2 ? '#80583a' : '#744e32';
      g.fillRect(x, 0, 6, wall);
      g.fillStyle = '#5a3a24';
      g.fillRect(x, 0, 1, wall);
    }
    g.fillStyle = '#4a2e1c';
    g.fillRect(0, wall - 3, W, 3);
    g.fillStyle = '#9a6a44';
    g.fillRect(0, wall - 4, W, 1);
    /* a window with the sky of the hour */
    const wx = Math.round(W * 0.18);
    const wy = Math.round(H * 0.06);
    const ww = 30;
    const wh = 26;
    g.drawImage(sky, 0, 0, W, sky.height * 0.7, wx, wy, ww, wh);
    g.fillStyle = '#5a3a24';
    g.fillRect(wx - 2, wy - 2, ww + 4, 2);
    g.fillRect(wx - 2, wy + wh, ww + 4, 3);
    g.fillRect(wx - 2, wy, 2, wh);
    g.fillRect(wx + ww, wy, 2, wh);
    g.fillRect(wx + ww / 2 - 1, wy, 2, wh);
    g.fillRect(wx, wy + wh / 2 - 1, ww, 2);
    this.#window = [wx, wy, ww, wh];
    /* a shelf with books and jars */
    const sx = Math.round(W * 0.6);
    const sy = Math.round(H * 0.12);
    g.fillStyle = '#4a2e1c';
    g.fillRect(sx, sy, 40, 2);
    g.fillRect(sx, sy + 14, 40, 2);
    for (let b = 0; b < 9; b++) {
      g.fillStyle = ['#a04040', '#406aa0', '#4a8a4a', '#c09040', '#7a4a90'][b % 5];
      const bh = 6 + R() * 5;
      g.fillRect(sx + 2 + b * 4, sy - bh, 3, bh);
    }
    for (let j = 0; j < 3; j++) {
      g.fillStyle = '#a8d0d8';
      g.fillRect(sx + 4 + j * 12, sy + 8, 6, 6);
      g.fillStyle = ['#e0a040', '#7ed957', '#ff8a3c'][j];
      g.fillRect(sx + 5 + j * 12, sy + 10, 4, 4);
    }
    /* floor boards in perspective */
    g.fillStyle = '#9a6a42';
    g.fillRect(0, wall, W, H - wall);
    g.fillStyle = '#7a4e2e';
    for (let y = wall, step = 3; y < H; y += step, step *= 1.18) g.fillRect(0, Math.round(y), W, 1);
    g.strokeStyle = 'rgba(90,56,32,.6)';
    g.lineWidth = 0.7;
    for (let k = -8; k <= 8; k++) {
      g.beginPath();
      g.moveTo(W / 2 + k * 10, wall);
      g.lineTo(W / 2 + k * 40, H);
      g.stroke();
    }
    for (let n = 0; n < 160; n++) {
      g.fillStyle = R() < 0.5 ? '#8a5c38' : '#aa7a50';
      g.fillRect((R() * W) | 0, (wall + R() * (H - wall)) | 0, 2, 1);
    }
    /* window light on the floor by day */
    const light = tod === 'day' ? 0.28 : tod === 'night' ? 0 : 0.18;
    if (light) {
      g.fillStyle = `rgba(255,240,190,${light})`;
      g.beginPath();
      g.moveTo(wx, wall);
      g.lineTo(wx + ww, wall);
      g.lineTo(wx + ww + 40, H * 0.62);
      g.lineTo(wx + 10, H * 0.62);
      g.fill();
    }
    /* a lamp on the wall */
    const lx = (W * 0.9) | 0;
    const ly = (H * 0.1) | 0;
    g.fillStyle = '#3a2a1a';
    g.fillRect(lx, ly, 1, 8);
    g.fillStyle = '#ffd27a';
    g.fillRect(lx - 2, ly + 8, 5, 4);
    const glow = g.createRadialGradient(W * 0.9, H * 0.1 + 10, 0, W * 0.9, H * 0.1 + 10, 40);
    glow.addColorStop(0, `rgba(255,200,120,${tod === 'night' ? 0.4 : 0.15})`);
    glow.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, W, H);
  }

  #makeFog(R) {
    const W = this.#W;
    const fog = sheet(W * 2, 34);
    const g = fog.getContext('2d');
    for (let f = 0; f < 26; f++) {
      const fx = R() * W * 2;
      const fy = 10 + R() * 14;
      const fr = 8 + R() * 12;
      const puff = g.createRadialGradient(fx, fy, 0, fx, fy, fr);
      puff.addColorStop(0, 'rgba(225,232,240,.55)');
      puff.addColorStop(1, 'rgba(225,232,240,0)');
      g.fillStyle = puff;
      g.fillRect(fx - fr, fy - fr, fr * 2, fr * 2);
      if (fx < fr) g.fillRect(fx - fr + W * 2, fy - fr, fr * 2, fr * 2);
    }
    this.#fog = fog;
  }
}
