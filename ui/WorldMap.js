/*
 * WorldMap.js
 * Job: the world map picture: every region as a place on a pixel landscape, linked by roads, in
 * the same palette, pixel scale and labels as the area map. Places the player knows have names
 * and a lit mark; the next place heard of shows its name (and why it is closed); the rest stay
 * in fog. A soft pulsing dot shows where the player is. It is painted once per size and state;
 * nothing redraws per frame (the pulse is a CSS animation).
 *
 * Public API:
 *   new WorldMapView(view)
 *        view: { places: [{ id, x, y, name, known, heard, icon, ring }], roads: [[idA, idB]], here,
 *                sea: { x, y, rx, ry } | null, mountains: [{ x, y }], palette, label, onPick }
 *        x, y: shares of the picture (0 to 1); name: shown text or null (a quiet mark); icon: an
 *        image URL; ring: a gold ring around the mark; here: id of the place the player is in.
 *        palette: { grass, tallgrass, flowers, water, waterLight, sand, path, treeDark, treeLight,
 *                   snow, rock, rockDark, fog, markEdge, markKnown, markHeard, ring, you, youGlow,
 *                   labelBack, labelEdge, labelText }
 *        label: accessible name of the picture
 *        onPick(place): optional; every known or heard place is then a tap target (.pick, 44 px)
 *   element          the view (append it where it belongs)
 *   mount(parent)    append and size it once it has a width (a ResizeObserver, dropped when removed)
 */

import { element } from './dom.js';

const MAX_HEIGHT_SHARE = 0.55;
const ROAD_WIGGLE = 3;

function hash(x, y) {
  let n = (x * 374761393 + y * 668265263) | 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

export class WorldMapView {
  #view;
  #canvas;
  #you;
  #taps;
  #width = 0;
  #height = 0;

  constructor(view) {
    this.#view = view;
    this.element = element('div', 'ui-wmap');
    const viewport = element('div', 'vp', this.element);
    viewport.style.background = view.palette.fog;
    this.#canvas = element('canvas', '', viewport);
    this.#canvas.setAttribute('role', 'img');
    if (view.label) this.#canvas.setAttribute('aria-label', view.label);
    this.#you = element('i', 'you', viewport);
    this.#you.hidden = true;
    this.#you.style.setProperty('--you', view.palette.you);
    this.#you.style.setProperty('--you-glow', view.palette.youGlow);
    this.#taps = element('div', 'taps', viewport);
  }

  mount(parent) {
    parent.appendChild(this.element);
    const observer = new ResizeObserver(() => {
      if (!this.element.isConnected) {
        observer.disconnect();
        return;
      }
      this.#size();
    });
    observer.observe(this.element);
  }

  #size() {
    const free = this.element.clientWidth;
    if (!free) return;
    const width = Math.floor(free);
    const height = Math.floor(Math.min(width * 0.92, Math.max(160, window.innerHeight * MAX_HEIGHT_SHARE)));
    if (width === this.#width && height === this.#height) return;
    this.#width = width;
    this.#height = height;
    const viewport = this.#canvas.parentNode;
    viewport.style.width = `${width}px`;
    viewport.style.height = `${height}px`;
    try {
      this.#paint(width, height);
    } catch (error) {
      console.warn('WorldMap: painting failed', error);
    }
  }

  #paint(W, H) {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const canvas = this.#canvas;
    canvas.width = Math.round(W * ratio);
    canvas.height = Math.round(H * ratio);
    const g = canvas.getContext('2d');
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    const scale = Math.max(2, Math.floor(W / 110));
    const PW = Math.ceil(W / scale);
    const PH = Math.ceil(H / scale);
    g.imageSmoothingEnabled = false;
    g.drawImage(this.#land(PW, PH), 0, 0, PW * scale, PH * scale);
    this.#marks(g, W, H);
  }

  /* the landscape in big pixels: land and sea, a sandy coast, little trees, mountains, roads, then fog */
  #land(PW, PH) {
    const view = this.#view;
    const P = view.palette;
    const pixels = element('canvas');
    pixels.width = PW;
    pixels.height = PH;
    const g = pixels.getContext('2d');
    const sea = view.sea;
    const wet = new Uint8Array(PW * PH);
    for (let y = 0; y < PH; y++) {
      for (let x = 0; x < PW; x++) {
        const u = x / PW;
        const v = y / PH;
        const isSea = !!sea && ((u - sea.x) ** 2) / (sea.rx ** 2) + ((v - sea.y) ** 2) / (sea.ry ** 2) < 1;
        wet[y * PW + x] = isSea ? 1 : 0;
        const r = hash(x, y);
        g.fillStyle = isSea ? (r < 0.06 ? P.waterLight : P.water) : r < 0.12 ? P.tallgrass : r < 0.2 ? P.flowers : P.grass;
        g.fillRect(x, y, 1, 1);
      }
    }
    g.fillStyle = P.sand;
    for (let y = 1; y < PH - 1; y++) {
      for (let x = 1; x < PW - 1; x++) {
        if (wet[y * PW + x]) continue;
        if (wet[y * PW + x + 1] || wet[(y + 1) * PW + x]) g.fillRect(x, y, 1, 1);
      }
    }
    for (let k = 0; k < 140; k++) {
      const tx = hash(k, 7) * PW;
      const ty = hash(k, 9) * PH;
      const u = tx / PW;
      const v = ty / PH;
      if (sea && ((u - sea.x) ** 2) / (sea.rx ** 2 * 1.1) + ((v - sea.y) ** 2) / (sea.ry ** 2 * 1.2) < 1) continue;
      g.fillStyle = P.treeDark;
      g.fillRect(tx - 1, ty - 1, 3, 3);
      g.fillStyle = P.treeLight;
      g.fillRect(tx - 1, ty - 1, 2, 2);
    }
    for (const m of view.mountains || []) {
      const mx = Math.round(PW * m.x);
      const my = Math.round(PH * m.y);
      for (let h = 0; h < 7; h++) {
        g.fillStyle = h < 2 ? P.snow : P.rock;
        g.fillRect(mx - h, my - 7 + h, h * 2 + 1, 1);
        g.fillStyle = P.rockDark;
        g.fillRect(mx, my - 7 + h, h + 1, 1);
      }
    }
    const byId = new Map(view.places.map((p) => [p.id, p]));
    g.fillStyle = P.path;
    for (const [from, to] of view.roads) {
      const a = byId.get(from);
      const b = byId.get(to);
      if (!a || !b || !(a.known || b.known)) continue;
      /* dotted toward a place not reached yet */
      const both = a.known && b.known;
      const x0 = a.x * PW;
      const y0 = a.y * PH;
      const x1 = b.x * PW;
      const y1 = b.y * PH;
      const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
      for (let i = 0; i <= n; i++) {
        if (!both && (i >> 1) % 2) continue;
        const q = i / n;
        g.fillRect((x0 + (x1 - x0) * q + Math.sin(q * Math.PI) * ROAD_WIGGLE) | 0, (y0 + (y1 - y0) * q) | 0, 2, 2);
      }
    }
    const fog = element('canvas');
    fog.width = PW;
    fog.height = PH;
    const f = fog.getContext('2d');
    f.fillStyle = P.fog;
    f.fillRect(0, 0, PW, PH);
    f.globalCompositeOperation = 'destination-out';
    for (const p of view.places) {
      if (!p.known && !p.heard) continue;
      const radius = (p.known ? 0.2 : 0.11) * PW;
      const glow = f.createRadialGradient(p.x * PW, p.y * PH, radius * 0.4, p.x * PW, p.y * PH, radius);
      glow.addColorStop(0, 'rgba(0,0,0,1)');
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      f.fillStyle = glow;
      f.fillRect(0, 0, PW, PH);
    }
    g.drawImage(fog, 0, 0);
    return pixels;
  }

  /* the marks with their icons and rings, then the labels, then the player's dot */
  #marks(g, W, H) {
    const view = this.#view;
    const P = view.palette;
    const labels = [];
    let here = null;
    for (const p of view.places) {
      if (!p.known && !p.heard) continue;
      const x = Math.round(p.x * W);
      const y = Math.round(p.y * H);
      g.fillStyle = P.markEdge;
      g.beginPath();
      g.arc(x, y, 12, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = p.known ? P.markKnown : P.markHeard;
      g.beginPath();
      g.arc(x, y, 10, 0, Math.PI * 2);
      g.fill();
      if (p.icon) this.#icon(g, p.icon, x, y, p.known ? 1 : 0.55);
      if (p.ring) {
        g.strokeStyle = P.ring;
        g.lineWidth = 2;
        g.beginPath();
        g.arc(x, y, 15, 0, Math.PI * 2);
        g.stroke();
      }
      if (p.name) labels.push({ text: p.name, x, y: y + 22 });
      if (p.id === view.here) here = { x, y };
    }
    this.#labels(g, labels, W, H);
    this.#tapTargets(W, H);
    this.#you.hidden = !here;
    if (here) {
      this.#you.style.left = `${here.x + 18}px`;
      this.#you.style.top = `${here.y - 10}px`;
    }
  }

  /* one button over each mark the player can see, so a place can be tapped */
  #tapTargets(W, H) {
    const view = this.#view;
    this.#taps.replaceChildren();
    if (typeof view.onPick !== 'function') return;
    for (const p of view.places) {
      if (!p.known && !p.heard) continue;
      const button = element('button', p.known ? 'pick' : 'pick heard', this.#taps);
      button.type = 'button';
      if (p.name) button.setAttribute('aria-label', p.name);
      button.style.left = `${Math.round(p.x * W)}px`;
      button.style.top = `${Math.round(p.y * H)}px`;
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        try {
          view.onPick(p);
        } catch (error) {
          console.warn('WorldMap: picking a place failed', error);
        }
      });
    }
  }

  #icon(g, src, x, y, alpha) {
    const image = new Image();
    const draw = () => {
      g.globalAlpha = alpha;
      g.drawImage(image, x - 8, y - 8, 16, 16);
      g.globalAlpha = 1;
    };
    image.onload = () => {
      try {
        draw();
      } catch (error) {
        /* an icon that cannot be drawn leaves the plain mark */
      }
    };
    image.src = src;
  }

  #labels(g, labels, W, H) {
    const P = this.#view.palette;
    const font = getComputedStyle(this.element).fontFamily || 'sans-serif';
    g.save();
    g.font = `800 11px ${font}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const placed = [];
    for (const label of labels) {
      const w = g.measureText(label.text).width + 10;
      const h = 16;
      const box = { x: Math.max(2, Math.min(W - w - 2, label.x - w / 2)), y: Math.min(H - h - 2, label.y - h / 2), w, h };
      if (placed.some((o) => box.x < o.x + o.w + 2 && o.x < box.x + box.w + 2 && box.y < o.y + o.h + 2 && o.y < box.y + box.h + 2)) continue;
      placed.push(box);
      g.fillStyle = P.labelBack;
      g.strokeStyle = P.labelEdge;
      g.lineWidth = 1;
      g.beginPath();
      if (g.roundRect) g.roundRect(box.x, box.y, box.w, box.h, 6);
      else g.rect(box.x, box.y, box.w, box.h);
      g.fill();
      g.stroke();
      g.fillStyle = P.labelText;
      g.fillText(label.text, box.x + w / 2, box.y + h / 2 + 0.5);
    }
    g.restore();
  }
}
