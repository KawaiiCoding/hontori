/*
 * AreaMap.js
 * Job: the area map panel: a pixel picture of the current map (ground, roads, trees, buildings,
 * doors, people) where only explored tiles show and the rest stays in fog, with place names,
 * markers other systems register, and a dot where the player stands. Drag to look; pinch,
 * the mouse wheel or the + and - buttons zoom. It redraws only when something changes.
 *
 * Public API:
 *   registerAreaMap(game, { explored, world, style, icon, label, hint, order, canOpen, refreshOn })
 *        registers panel "areamap" and HUD button "map". The panel definition also offers, for
 *        panels that extend it (game/panels/worldmap.js):
 *          explored(mapId) -> true when the player has seen any tile of that map
 *          outdoor(mapId)  -> true when that map exists and is not indoor
 *          mountMap(parent, mapId) -> the map's name, or null; shows that map's explored tiles in
 *                          parent, read-only (the player is not moved; no dot unless it is the map
 *                          the player is on)
 *        explored: an Explored (systems/time/Explored.js); world(): the live WorldScene or null;
 *        canOpen(quiet): optional, false keeps the map shut and its button dimmed; called with quiet
 *        true it only answers, without it (a tap) it explains why itself; refreshOn: the events after
 *        which the button asks again (ui/Hud.js);
 *        style: the game's look of the map (see game/time/mapStyle.js):
 *          { background, fog: [r, g, b], tile: { tileId: colour }, otherTile,
 *            tileDetail(ctx, tileId, px, py, size) optional, roads: [tileIds], roadEdge,
 *            tree(propType) -> bool, treeDark, treeLight, roof: { buildingType: colour }, otherRoof,
 *            wall, doorFrame, doorLight, person, personEdge, you, youGlow, marker, markerEdge,
 *            labelBack, labelEdge, labelText, legend: [[colour, word]],
 *            words: { you, marker, closer, whole }, doorLabel(door, targetDescription) -> text or null }
 *
 * Registry kind it reads:
 *   "map.marker"   id -> (mapId, game) => [{ x, y, color, legend }]   spots to mark (a quest goal)
 */

import { element, icon } from './dom.js';
import { lookupText } from '../systems/time/links.js';
import { TileMap } from '../world/TileMap.js';

/* logical pixels per tile in the baked picture */
const SCALE = 8;
/* the close view shows about this many tiles across */
const CLOSE_TILES = 16;
const MAX_HEIGHT_SHARE = 0.55;
const LABEL_HEIGHT = 16;
const BASES_KEPT = 4;

export function registerAreaMap(game, { explored, world, style, icon: iconName = 'map', label = 'Map', hint, order = 40, canOpen, refreshOn }) {
  const bases = new Map();
  /* a read-only TileMap for a map id; the live one when the player is on it */
  const tileMap = (mapId) => {
    const scene = world();
    if (scene && scene.map && scene.map.id === mapId) return scene.map;
    try {
      const description = game.registry.get('map', mapId);
      return description ? new TileMap(description, game.art) : null;
    } catch (error) {
      console.warn(`AreaMap: map "${mapId}" cannot be read`, error);
      return null;
    }
  };
  const describe = (mapId) => {
    try {
      return game.registry.get('map', mapId) || null;
    } catch (error) {
      return null;
    }
  };
  game.registry.add('panel', 'areamap', {
    icon: iconName,
    /* read when the panel opens: the name of the map the player is on */
    get title() {
      const scene = world();
      return (scene && scene.map && scene.map.name) || label;
    },
    sub: hint,
    build(panel) {
      const scene = world();
      if (!scene || !scene.map) return;
      new AreaMapView(game, scene, explored, style, bases).mount((node) => panel.add(node));
    },
    explored(mapId) {
      const description = describe(mapId);
      if (!description || !Array.isArray(description.rows) || !description.rows.length) return false;
      try {
        const bits = explored.bits({ id: mapId, width: description.rows[0].length, height: description.rows.length });
        return bits.some((bit) => bit);
      } catch (error) {
        return false;
      }
    },
    outdoor(mapId) {
      const description = describe(mapId);
      return !!description && description.tileset !== 'indoor';
    },
    mountMap(parent, mapId) {
      const scene = world();
      const map = tileMap(mapId);
      if (!scene || !map) return null;
      new AreaMapView(game, scene, explored, style, bases, map).mount((node) => parent.appendChild(node));
      return map.name;
    },
  });
  game.registry.add('hud.button', 'map', {
    icon: iconName, label, order,
    /* without canOpen the button is always bright; canOpen(true) only asks, canOpen() may also say why not */
    enabled: canOpen ? () => canOpen(true) : undefined,
    refreshOn,
    open: () => {
      if (canOpen && !canOpen()) return;
      game.ui.openPanel('areamap');
    },
  });
}

class AreaMapView {
  #game;
  #scene;
  #map;
  #explored;
  #style;
  #bases;
  #root;
  #viewport;
  #canvas;
  #ctx;
  #base;
  #fog;
  #labels;
  #markers;
  #width = 0;
  #height = 0;
  #ratio = 1;
  #fit = 1;
  #zoom = 0;
  #ox = 0;
  #oy = 0;
  #pointers = new Map();
  #pinch = null;
  /* true when this is the map the player stands on: the dot, the people and walking reveal show */
  #here = true;

  constructor(game, scene, explored, style, bases, map = scene.map) {
    this.#game = game;
    this.#scene = scene;
    this.#map = map;
    this.#here = !!scene.map && map.id === scene.map.id;
    this.#explored = explored;
    this.#style = style;
    this.#bases = bases;
  }

  /* add(node): puts the view where it belongs (a Panel's add, or a parent's appendChild) */
  mount(add) {
    const map = this.#map;
    const style = this.#style;
    if (this.#here) this.#explored.reveal(map, this.#scene.player.tx, this.#scene.player.ty);
    this.#root = element('div', 'ui-amap');
    this.#viewport = element('div', 'vp', this.#root);
    this.#viewport.style.background = style.background;
    this.#canvas = element('canvas', '', this.#viewport);
    this.#canvas.setAttribute('role', 'img');
    this.#canvas.setAttribute('aria-label', map.name);
    this.#ctx = this.#canvas.getContext('2d');
    const zoom = element('div', 'zm', this.#viewport);
    this.#zoomButton(zoom, 'plus', style.words.closer, () => this.#closer());
    this.#zoomButton(zoom, 'minus', style.words.whole, () => this.#wider());

    this.#base = this.#baseOf(map);
    this.#fog = this.#paintFog();
    this.#labels = this.#collectLabels();
    this.#markers = this.#collectMarkers();
    this.#legend();
    this.#listen();
    add(this.#root);
    /* the sheet is laid out after build; size and draw once it has a width */
    const observer = new ResizeObserver(() => {
      if (!this.#root.isConnected) {
        observer.disconnect();
        return;
      }
      this.#size();
    });
    observer.observe(this.#root);
  }

  #zoomButton(parent, iconName, word, onPress) {
    const button = element('button', 'ui-x', parent);
    button.type = 'button';
    button.title = word;
    button.setAttribute('aria-label', word);
    button.appendChild(icon(this.#game.art, iconName));
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      onPress();
    });
  }

  #legend() {
    const style = this.#style;
    const legend = element('div', 'lg', this.#root);
    /* another map shows no live people and no player, so their legend entries stay out */
    const entries = this.#here ? [...style.legend, [style.you, style.words.you]] : style.legend.filter(([colour]) => colour !== style.person);
    const seen = new Set();
    for (const marker of this.#markers) {
      const word = marker.legend || style.words.marker;
      if (!seen.has(word)) entries.push([marker.color || style.marker, word]);
      seen.add(word);
    }
    for (const [colour, word] of entries) {
      const item = element('span', '', legend);
      element('i', '', item).style.background = colour;
      item.appendChild(document.createTextNode(word));
    }
  }

  /* ---------- pictures ---------- */

  #baseOf(map) {
    const bases = this.#bases;
    if (bases.has(map.id)) {
      const base = bases.get(map.id);
      bases.delete(map.id);
      bases.set(map.id, base);
      return base;
    }
    const base = this.#paintBase(map);
    bases.set(map.id, base);
    if (bases.size > BASES_KEPT) bases.delete(bases.keys().next().value);
    return base;
  }

  #paintBase(map) {
    const style = this.#style;
    const art = this.#game.art;
    const S = SCALE;
    const canvas = document.createElement('canvas');
    canvas.width = map.width * S;
    canvas.height = map.height * S;
    const g = canvas.getContext('2d');
    const roads = new Set(style.roads);
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        g.fillStyle = style.tile[map.tileAt(x, y)] || style.otherTile;
        g.fillRect(x * S, y * S, S, S);
        if (style.tileDetail) style.tileDetail(g, map.tileAt(x, y), x * S, y * S, S);
      }
    }
    /* a soft darker rim along road edges so the roads read clearly */
    g.fillStyle = style.roadEdge;
    const road = (x, y) => roads.has(map.tileAt(x, y));
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        if (!road(x, y)) continue;
        if (y > 0 && !road(x, y - 1)) g.fillRect(x * S, y * S, S, 1);
        if (y < map.height - 1 && !road(x, y + 1)) g.fillRect(x * S, y * S + S - 1, S, 1);
        if (x > 0 && !road(x - 1, y)) g.fillRect(x * S, y * S, 1, S);
        if (x < map.width - 1 && !road(x + 1, y)) g.fillRect(x * S + S - 1, y * S, 1, S);
      }
    }
    for (const prop of map.props) {
      if (!style.tree(prop.type)) continue;
      const cx = prop.x * S + S / 2;
      const cy = prop.y * S + S / 2;
      g.fillStyle = style.treeDark;
      g.beginPath();
      g.arc(cx, cy, S * 0.75, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = style.treeLight;
      g.beginPath();
      g.arc(cx - 1, cy - 1, S * 0.4, 0, Math.PI * 2);
      g.fill();
    }
    for (const building of map.buildings) {
      const info = art.buildingInfo(building.type);
      if (!info) continue;
      const X = building.x * S;
      const Y = building.y * S;
      const W = info.fw * S;
      const H = info.fh * S;
      const roofH = Math.round(H * 0.62);
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.fillRect(X + 2, Y + 2, W, H);
      g.fillStyle = style.wall;
      g.fillRect(X, Y + roofH, W, H - roofH);
      g.fillStyle = style.roof[building.type] || style.otherRoof;
      g.fillRect(X, Y, W, roofH);
      g.fillStyle = 'rgba(255,255,255,.22)';
      g.fillRect(X, Y, W, 2);
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.fillRect(X, Y + roofH - 2, W, 2);
      g.fillStyle = 'rgba(0,0,0,.12)';
      for (let k = 1; k < 4; k++) g.fillRect(X, Y + Math.round((roofH * k) / 4), W, 1);
    }
    for (const door of map.doors) {
      g.fillStyle = style.doorFrame;
      g.fillRect(door.x * S + 1, door.y * S, S - 2, S);
      g.fillStyle = style.doorLight;
      g.fillRect(door.x * S + 2, door.y * S + 1, S - 4, S - 2);
    }
    return canvas;
  }

  /* one pixel per tile, partly see-through near the explored edge; scaled up smoothly */
  #paintFog() {
    const map = this.#map;
    const bits = this.#explored.bits(map);
    const [r, gr, b] = this.#style.fog;
    const canvas = document.createElement('canvas');
    canvas.width = map.width;
    canvas.height = map.height;
    const g = canvas.getContext('2d');
    const image = g.createImageData(map.width, map.height);
    const data = image.data;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        let alpha = 255;
        if (bits[y * map.width + x]) {
          let unseen = 0;
          let count = 0;
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const xx = x + dx;
              const yy = y + dy;
              if (xx < 0 || yy < 0 || xx >= map.width || yy >= map.height) continue;
              count++;
              if (!bits[yy * map.width + xx]) unseen++;
            }
          }
          alpha = Math.round((200 * unseen) / count);
        }
        const at = (y * map.width + x) * 4;
        data[at] = r;
        data[at + 1] = gr;
        data[at + 2] = b;
        data[at + 3] = alpha;
      }
    }
    g.putImageData(image, 0, 0);
    return canvas;
  }

  /* place names only where the player has been; doors name where they lead */
  #collectLabels() {
    const map = this.#map;
    const game = this.#game;
    const out = [];
    const have = new Set();
    const near = (x, y) => {
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (this.#explored.seen(map, x + dx, y + dy)) return true;
      return false;
    };
    const add = (x, y, text) => {
      if (!text || have.has(text) || !map.inside(x, y) || !near(x, y)) return;
      have.add(text);
      out.push({ x, y, text });
    };
    for (const door of map.doors) {
      let text = null;
      try {
        text = this.#style.doorLabel(door, game.registry.get('map', door.to));
      } catch (error) {
        console.warn('AreaMap: a door label failed', error);
      }
      add(door.x, door.y, text);
    }
    for (const label of map.labels || []) add(label.x, label.y, lookupText(game, label.name));
    return out;
  }

  #collectMarkers() {
    const out = [];
    for (const provide of this.#game.registry.all('map.marker')) {
      try {
        const markers = provide(this.#map.id, this.#game) || [];
        for (const marker of markers) if (marker && Number.isFinite(marker.x) && Number.isFinite(marker.y)) out.push(marker);
      } catch (error) {
        console.warn('AreaMap: a map marker failed', error);
      }
    }
    return out;
  }

  /* ---------- view ---------- */

  #size() {
    const map = this.#map;
    const free = this.#root.clientWidth;
    if (!free) return;
    const maxHeight = Math.max(160, window.innerHeight * MAX_HEIGHT_SHARE);
    let width = free;
    let height = Math.min(maxHeight, (free * map.height) / map.width);
    if (height < (free * map.height) / map.width) width = Math.min(free, (height * map.width) / map.height);
    width = Math.floor(width);
    height = Math.floor(height);
    if (width === this.#width && height === this.#height) return;
    this.#width = width;
    this.#height = height;
    this.#ratio = Math.min(2, window.devicePixelRatio || 1);
    this.#viewport.style.width = `${width}px`;
    this.#viewport.style.height = `${height}px`;
    this.#canvas.width = Math.round(width * this.#ratio);
    this.#canvas.height = Math.round(height * this.#ratio);
    this.#fit = Math.min(width / (map.width * SCALE), height / (map.height * SCALE));
    if (!this.#zoom || this.#zoom < this.#fit) this.#zoom = this.#fit;
    this.#zoom = Math.min(this.#zoom, this.#closest());
    this.#clamp();
    this.#draw();
  }

  #closest() {
    return Math.max(this.#fit * 1.5, Math.min(this.#width, this.#height) / (CLOSE_TILES * SCALE));
  }

  #clamp() {
    const map = this.#map;
    const mw = map.width * SCALE * this.#zoom;
    const mh = map.height * SCALE * this.#zoom;
    this.#ox = mw <= this.#width ? (this.#width - mw) / 2 : Math.min(0, Math.max(this.#width - mw, this.#ox));
    this.#oy = mh <= this.#height ? (this.#height - mh) / 2 : Math.min(0, Math.max(this.#height - mh, this.#oy));
  }

  #zoomAt(zoom, sx, sy) {
    const next = Math.max(this.#fit, Math.min(this.#closest(), zoom));
    this.#ox = sx - ((sx - this.#ox) * next) / this.#zoom;
    this.#oy = sy - ((sy - this.#oy) * next) / this.#zoom;
    this.#zoom = next;
    this.#clamp();
    this.#draw();
  }

  #closer() {
    if (!this.#here) {
      this.#zoomAt(this.#zoom * 2, this.#width / 2, this.#height / 2);
      return;
    }
    const player = this.#scene.player;
    this.#zoom = Math.min(this.#closest(), this.#zoom * 2);
    this.#ox = this.#width / 2 - (player.tx + 0.5) * SCALE * this.#zoom;
    this.#oy = this.#height / 2 - (player.ty + 0.5) * SCALE * this.#zoom;
    this.#clamp();
    this.#draw();
  }

  #wider() {
    this.#zoomAt(this.#zoom / 2, this.#width / 2, this.#height / 2);
  }

  #listen() {
    const viewport = this.#viewport;
    const canvas = this.#canvas;
    const at = (event) => {
      const box = viewport.getBoundingClientRect();
      return [event.clientX - box.left, event.clientY - box.top];
    };
    viewport.addEventListener('wheel', (event) => {
      event.preventDefault();
      const [x, y] = at(event);
      this.#zoomAt(this.#zoom * (event.deltaY < 0 ? 1.15 : 1 / 1.15), x, y);
    }, { passive: false });
    canvas.addEventListener('pointerdown', (event) => {
      this.#pointers.set(event.pointerId, at(event));
      try {
        canvas.setPointerCapture(event.pointerId);
      } catch (error) {
        /* capture is a nicety; dragging works without it */
      }
      this.#pinch = null;
      event.preventDefault();
    });
    canvas.addEventListener('pointermove', (event) => {
      const pointers = this.#pointers;
      if (!pointers.has(event.pointerId)) return;
      const point = at(event);
      if (pointers.size >= 2) {
        pointers.set(event.pointerId, point);
        const [a, b] = [...pointers.values()];
        const distance = Math.hypot(a[0] - b[0], a[1] - b[1]);
        const mx = (a[0] + b[0]) / 2;
        const my = (a[1] + b[1]) / 2;
        const pinch = this.#pinch;
        if (pinch) {
          this.#ox += mx - pinch.mx;
          this.#oy += my - pinch.my;
          this.#zoomAt((this.#zoom * distance) / Math.max(1, pinch.distance), mx, my);
        }
        this.#pinch = { distance, mx, my };
        return;
      }
      const last = pointers.get(event.pointerId);
      this.#ox += point[0] - last[0];
      this.#oy += point[1] - last[1];
      pointers.set(event.pointerId, point);
      this.#clamp();
      this.#draw();
    });
    const up = (event) => {
      this.#pointers.delete(event.pointerId);
      this.#pinch = null;
    };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
  }

  #draw() {
    const g = this.#ctx;
    const style = this.#style;
    const map = this.#map;
    const width = this.#width;
    const height = this.#height;
    if (!width || !height) return;
    try {
      g.setTransform(this.#ratio, 0, 0, this.#ratio, 0, 0);
      g.fillStyle = style.background;
      g.fillRect(0, 0, width, height);
      const q = SCALE * this.#zoom;
      const ox = this.#ox;
      const oy = this.#oy;
      g.imageSmoothingEnabled = this.#zoom < 1;
      g.drawImage(this.#base, ox, oy, map.width * q, map.height * q);
      this.#drawPeople(g, ox, oy, q);
      g.imageSmoothingEnabled = true;
      g.drawImage(this.#fog, ox, oy, map.width * q, map.height * q);
      for (const marker of this.#markers) this.#drawMarker(g, ox + (marker.x + 0.5) * q, oy + (marker.y + 0.5) * q, q, marker.color || style.marker);
      this.#drawLabels(g, ox, oy, q);
      if (this.#here) this.#drawPlayer(g, ox, oy, q);
    } catch (error) {
      console.warn('AreaMap: drawing failed', error);
    }
  }

  /* people are drawn where they stand now, and only where the player has seen */
  #drawPeople(g, ox, oy, q) {
    const style = this.#style;
    const r = Math.max(2, q * 0.42);
    if (!this.#here) return;
    for (const person of this.#scene.people || []) {
      if (person.away || !this.#explored.seen(this.#map, person.tx, person.ty)) continue;
      const x = ox + (person.tx + 0.5) * q;
      const y = oy + (person.ty + 0.5) * q;
      g.fillStyle = style.personEdge;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = style.person;
      g.beginPath();
      g.arc(x, y, r * 0.72, 0, Math.PI * 2);
      g.fill();
    }
  }

  #drawMarker(g, x, y, q, colour) {
    const r = Math.max(5, q * 0.6);
    g.fillStyle = colour;
    g.strokeStyle = this.#style.markerEdge;
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(x, y - r);
    g.lineTo(x + r * 0.7, y);
    g.lineTo(x, y + r);
    g.lineTo(x - r * 0.7, y);
    g.closePath();
    g.fill();
    g.stroke();
  }

  #drawPlayer(g, ox, oy, q) {
    const player = this.#scene.player;
    const x = ox + (player.tx + 0.5) * q;
    const y = oy + (player.ty + 0.5) * q;
    const r = Math.max(4, q * 0.5);
    g.fillStyle = this.#style.youGlow;
    g.beginPath();
    g.arc(x, y, r * 2, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = this.#style.you;
    g.strokeStyle = '#fff';
    g.lineWidth = 2;
    g.beginPath();
    g.arc(x, y, r, 0, Math.PI * 2);
    g.fill();
    g.stroke();
  }

  /* a label that would overlap one already placed is left out */
  #drawLabels(g, ox, oy, q) {
    if (!this.#labels.length) return;
    const style = this.#style;
    const width = this.#width;
    const height = this.#height;
    g.save();
    g.font = `800 11px ${this.#game.theme.font.family}`;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    const placed = [];
    for (const label of this.#labels) {
      const lift = Math.max(10, q * 0.9);
      let y = oy + (label.y + 0.5) * q - lift;
      const w = g.measureText(label.text).width + 10;
      if (y - LABEL_HEIGHT / 2 < 2) y = oy + (label.y + 0.5) * q + lift;
      const box = { x: Math.max(2, Math.min(width - w - 2, ox + (label.x + 0.5) * q - w / 2)), y: y - LABEL_HEIGHT / 2, w, h: LABEL_HEIGHT };
      if (box.x + box.w < 0 || box.y + box.h < 0 || box.x > width || box.y > height) continue;
      const overlaps = placed.some((o) => box.x < o.x + o.w + 2 && o.x < box.x + box.w + 2 && box.y < o.y + o.h + 2 && o.y < box.y + box.h + 2);
      if (overlaps) continue;
      placed.push(box);
      g.fillStyle = style.labelBack;
      g.strokeStyle = style.labelEdge;
      g.lineWidth = 1;
      g.beginPath();
      if (g.roundRect) g.roundRect(box.x, box.y, box.w, box.h, 6);
      else g.rect(box.x, box.y, box.w, box.h);
      g.fill();
      g.stroke();
      g.fillStyle = style.labelText;
      g.fillText(label.text, box.x + w / 2, y + 0.5);
    }
    g.restore();
  }
}
