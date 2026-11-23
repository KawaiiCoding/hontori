/*
 * Explored.js  (engine: time)
 * Job: which tiles of each map the player has seen. Walking reveals a circle around the
 * player outdoors and the whole room indoors. Kept per map as one bit per tile, saved as a
 * short text of 6 bits per letter.
 *
 * Public API (registry kind "system"):
 *   new Explored({ radius })     radius: tiles seen around the player outdoors (default 6)
 *   start(game)
 *   bits(map)                    a Uint8Array (width * height), 1 where seen; map: a TileMap or
 *                                { id, width, height }
 *   seen(map, tx, ty)
 *   reveal(map, tx, ty, radius)  reveal a circle; returns true if anything new was seen
 *   revealAll(map)
 *
 * Saved state (section "explored", see EXPLORED_SAVE): { maps: { [mapId]: text } }
 *
 * Event it emits on game.bus:
 *   "map:explored"   { map }     something new was seen on that map
 */

export const EXPLORED_SAVE = { maps: {} };

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
/* a circle of radius r also takes the tiles just past its rim, so it reads round on a grid */
const RIM = 2;

function decode(text, size) {
  const bits = new Uint8Array(size);
  if (typeof text !== 'string') return bits;
  for (let i = 0; i < text.length; i++) {
    const value = LETTERS.indexOf(text[i]);
    if (value < 0) continue;
    for (let k = 0; k < 6; k++) if ((value >> k) & 1 && i * 6 + k < size) bits[i * 6 + k] = 1;
  }
  return bits;
}

function encode(bits) {
  let text = '';
  for (let i = 0; i < bits.length; i += 6) {
    let value = 0;
    for (let k = 0; k < 6; k++) if (bits[i + k]) value |= 1 << k;
    text += LETTERS[value];
  }
  return text;
}

export class Explored {
  #game = null;
  #radius;
  #cache = new Map();
  #owner = null;

  constructor({ radius = 6 } = {}) {
    this.#radius = radius;
  }

  start(game) {
    this.#game = game;
    game.bus.on('map:enter', ({ map, scene }) => this.#walk(map, scene.player));
    game.bus.on('player:step', ({ map, player }) => this.#walk(map, player));
  }

  #saved() {
    const section = this.#game && this.#game.save.state.explored;
    if (!section) return null;
    if (!section.maps || typeof section.maps !== 'object') section.maps = {};
    /* another journey was loaded: forget what the last one had seen */
    if (section.maps !== this.#owner) {
      this.#owner = section.maps;
      this.#cache.clear();
    }
    return section.maps;
  }

  bits(map) {
    const saved = this.#saved();
    const size = map.width * map.height;
    let bits = this.#cache.get(map.id);
    if (!bits || bits.length !== size) {
      bits = decode(saved && saved[map.id], size);
      this.#cache.set(map.id, bits);
    }
    return bits;
  }

  seen(map, tx, ty) {
    if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return false;
    return !!this.bits(map)[ty * map.width + tx];
  }

  reveal(map, tx, ty, radius = this.#radius) {
    const bits = this.bits(map);
    const reach = radius * radius + RIM;
    const x0 = Math.max(0, Math.floor(tx - radius));
    const x1 = Math.min(map.width - 1, Math.ceil(tx + radius));
    const y0 = Math.max(0, Math.floor(ty - radius));
    const y1 = Math.min(map.height - 1, Math.ceil(ty + radius));
    let changed = false;
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const at = y * map.width + x;
        if (bits[at] || (x - tx) * (x - tx) + (y - ty) * (y - ty) > reach) continue;
        bits[at] = 1;
        changed = true;
      }
    }
    if (changed) this.#store(map, bits);
    return changed;
  }

  revealAll(map) {
    const bits = this.bits(map);
    if (bits.every((bit) => bit)) return false;
    bits.fill(1);
    this.#store(map, bits);
    return true;
  }

  #walk(map, player) {
    if (!map || !player) return;
    if (map.indoor) this.revealAll(map);
    else this.reveal(map, player.tx, player.ty);
  }

  #store(map, bits) {
    const saved = this.#saved();
    if (saved) saved[map.id] = encode(bits);
    this.#game.bus.emit('map:explored', { map });
  }
}
