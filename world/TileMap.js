/*
 * TileMap.js
 * Job: one map as data, and the questions the world asks about it. No drawing.
 *
 * Public API:
 *   new TileMap(description, art)   description: see INTERFACES.md; art: the Art adapter (footprints)
 *   id, name, indoor, width, height (tiles), pixelWidth, pixelHeight
 *   props, buildings, people, doors, spawn, lights, labels, start   as described, doors as Door objects
 *   description                     the description it was built from
 *   inside(tx, ty)
 *   tileAt(tx, ty)                  tile id; outside the map, the id the tileset assumes there, or the
 *                                   nearest edge tile when that is flowing water (the sea runs on)
 *   solidAt(tx, ty)                 true for solid tiles, solid props, buildings and outside the map
 *   groundSolidAt(tx, ty)           true where the ground itself cannot be stood on (water, a wall) or outside
 *   openNear(tx, ty)                [tx, ty] itself when it can be stood on, else the nearest tile that can
 *                                   (never water, a wall or a thing); null when the map has none
 *   doorAt(tx, ty)                  the Door on that tile, or null
 *   thingAt(tx, ty)                 the prop or building standing on that tile, as
 *                                   { kind: 'prop' | 'building', type, object } or null
 */

import { TILE } from '../core/units.js';
import { Door } from './Door.js';

export class TileMap {
  #art;
  #tiles;
  #solid;
  #beyond;
  #flowing = new Map();
  #doors = new Map();

  constructor(description, art) {
    this.#art = art;
    this.description = description;
    this.id = description.id;
    this.name = description.name;
    this.indoor = description.tileset === 'indoor';
    this.height = description.rows.length;
    this.width = description.rows[0].length;
    this.pixelWidth = this.width * TILE;
    this.pixelHeight = this.height * TILE;
    this.props = description.props;
    this.buildings = description.buildings;
    this.people = description.people;
    this.spawn = description.spawn;
    this.lights = description.lights;
    this.labels = description.labels;
    this.start = description.start;
    this.doors = description.doors.map((door) => new Door(door));
    for (const door of this.doors) this.#doors.set(this.#index(door.x, door.y), door);

    this.#beyond = art.tileBeyond(this.indoor);
    const fallback = Object.values(description.legend)[0];
    this.#tiles = description.rows.map((row) => [...row].map((ch) => description.legend[ch] || fallback));
    this.#solid = this.#buildSolid(description.passable);
  }

  inside(tx, ty) {
    return tx >= 0 && ty >= 0 && tx < this.width && ty < this.height;
  }

  tileAt(tx, ty) {
    if (this.inside(tx, ty)) return this.#tiles[ty][tx];
    /* open water runs on past the edge of the map (no thin bank where the sea meets the border) */
    if (this.height > 0 && this.width > 0) {
      const edge = this.#tiles[Math.max(0, Math.min(this.height - 1, ty))][Math.max(0, Math.min(this.width - 1, tx))];
      if (this.#flows(edge)) return edge;
    }
    return this.#beyond;
  }

  #flows(tile) {
    let known = this.#flowing.get(tile);
    if (known === undefined) {
      try {
        known = !!this.#art.tileFlows(this.indoor, tile);
      } catch (error) {
        known = false;
      }
      this.#flowing.set(tile, known);
    }
    return known;
  }

  solidAt(tx, ty) {
    return !this.inside(tx, ty) || this.#solid[this.#index(tx, ty)] === 1;
  }

  groundSolidAt(tx, ty) {
    return !this.inside(tx, ty) || !!this.#art.tileSolid(this.indoor, this.#tiles[ty][tx]);
  }

  /* nobody is ever put on water or inside something: a bad target becomes the nearest open tile */
  openNear(tx, ty) {
    const x0 = Math.round(Number(tx) || 0);
    const y0 = Math.round(Number(ty) || 0);
    if (!this.solidAt(x0, y0)) return [x0, y0];
    const reach = Math.max(this.width, this.height);
    for (let r = 1; r <= reach; r++) {
      let best = null;
      let bestD = Infinity;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || this.solidAt(x0 + dx, y0 + dy)) continue;
          const d = dx * dx + dy * dy;
          if (d < bestD) {
            bestD = d;
            best = [x0 + dx, y0 + dy];
          }
        }
      }
      if (best) return best;
    }
    return null;
  }

  doorAt(tx, ty) {
    return this.#doors.get(this.#index(tx, ty)) || null;
  }

  thingAt(tx, ty) {
    let hit = null;
    for (const prop of this.props) {
      const info = this.#art.propInfo(prop.type);
      if (!info || !covers(prop, info, tx, ty)) continue;
      /* something you can bump into wins over decoration lying on the same tile */
      if (!hit || !info.decor) hit = { kind: 'prop', type: prop.type, object: prop };
    }
    for (const building of this.buildings) {
      const info = this.#art.buildingInfo(building.type);
      if (info && covers(building, info, tx, ty)) hit = { kind: 'building', type: building.type, object: building };
    }
    return hit;
  }

  #index(tx, ty) {
    return ty * this.width + tx;
  }

  #buildSolid(passable) {
    const art = this.#art;
    const solid = new Uint8Array(this.width * this.height);
    const block = (tx, ty) => {
      if (this.inside(tx, ty)) solid[this.#index(tx, ty)] = 1;
    };
    for (let ty = 0; ty < this.height; ty++) {
      for (let tx = 0; tx < this.width; tx++) {
        if (art.tileSolid(this.indoor, this.#tiles[ty][tx])) block(tx, ty);
      }
    }
    for (const prop of this.props) {
      const info = art.propInfo(prop.type);
      if (!info || !info.solid || info.decor) continue;
      for (let y = 0; y < info.fh; y++) for (let x = 0; x < info.fw; x++) block(prop.x + x, prop.y + y);
    }
    for (const building of this.buildings) {
      const info = art.buildingInfo(building.type);
      if (!info) continue;
      /* the doorway is the middle tile of the front row */
      const doorX = Math.floor(info.fw / 2);
      const doorY = info.fh - 1;
      for (let y = 0; y < info.fh; y++) {
        for (let x = 0; x < info.fw; x++) if (x !== doorX || y !== doorY) block(building.x + x, building.y + y);
      }
    }
    for (const [tx, ty] of passable) if (this.inside(tx, ty)) solid[this.#index(tx, ty)] = 0;
    return solid;
  }
}

function covers(object, info, tx, ty) {
  return tx >= object.x && tx < object.x + info.fw && ty >= object.y && ty < object.y + info.fh;
}
