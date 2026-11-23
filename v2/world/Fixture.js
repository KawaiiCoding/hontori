/*
 * Fixture.js
 * Job: the things that stand on a map and never move: props (trees, lamps, furniture) and
 * buildings. They are Entities so that people can walk in front of and behind them.
 *
 * Public API:
 *   new Prop(def, index, info, art, indoor)       def: { type, x, y }; info: art.propInfo(type);
 *                          info.hangs: it hangs on a wall (a sign over a door): in front of its row, no shadow
 *   new Building(def, index, info, art)           info: art.buildingInfo(type)
 *   type, def, depth, bounds
 *   lights                 the lights it carries, placed in map pixels: [{ x, y, r, color, flicker }]
 *   draw(ctx, art, env)
 *   Building.hides(x, y)   true if someone whose feet are at that point stands behind the building
 */

import { Entity } from './Entity.js';
import { TILE } from '../core/units.js';

/* how far a ground shadow can reach beyond its radius when the sun is low */
const SHADOW_STRETCH = 2.5;
/* a building's art rises this far above its footprint for the see-through test */
const ROOF_RISE = 48;

class Fixture extends Entity {
  lights = [];

  #depth;
  #shadow = null;

  constructor(id, def, info, artBounds) {
    super(id, def.x * TILE, def.y * TILE);
    this.type = def.type;
    this.def = def;
    /* something that hangs on a wall is drawn just in front of what stands on its row */
    this.#depth = this.y + info.fh * TILE + (info.hangs ? 1 : 0);
    this.bounds = {
      left: this.x + artBounds.left,
      top: this.y + artBounds.top,
      right: this.x + artBounds.right,
      bottom: this.y + artBounds.bottom,
    };
  }

  get depth() {
    return this.#depth;
  }

  addShadow(x, y, rx, ry) {
    this.#shadow = { x, y, rx, ry };
    const reach = rx * SHADOW_STRETCH + 2;
    const b = this.bounds;
    b.left = Math.min(b.left, x - reach);
    b.right = Math.max(b.right, x + reach);
    b.bottom = Math.max(b.bottom, y + ry * 2 + 2);
  }

  addLight(light) {
    this.lights.push({
      x: this.x + (light.dx || 0),
      y: this.y + (light.dy || 0),
      r: light.r || 40,
      color: light.color || '#ffcf7a',
      flicker: light.flicker ?? true,
    });
  }

  drawShadow(ctx, art, env) {
    const s = this.#shadow;
    if (s) art.drawShadow(ctx, s.x, s.y, s.rx, s.ry, env);
  }
}

export class Prop extends Fixture {
  constructor(def, index, info, art, indoor) {
    super(`prop${index}`, def, info, art.propBounds(def.type));
    /* decoration lies flat and indoor light is even: only outdoor things that stand cast a shadow */
    if (!indoor && !info.decor && !info.hangs) this.addShadow(this.x + info.fw * 8, this.depth - 2, info.fw * 7, 3);
    if (info.light) this.addLight(info.light);
  }

  draw(ctx, art, env) {
    this.drawShadow(ctx, art, env);
    art.drawProp(ctx, this.type, this.x, this.y, env);
  }
}

export class Building extends Fixture {
  #right;

  constructor(def, index, info, art) {
    super(`building${index}`, def, info, art.buildingBounds(def.type));
    this.#right = this.x + info.fw * TILE;
    this.addShadow(this.x + info.fw * 8, this.depth - 1, info.fw * 8 + 4, 6);
    for (const light of info.lights || []) this.addLight(light);
  }

  draw(ctx, art, env) {
    this.drawShadow(ctx, art, env);
    art.drawBuilding(ctx, this.type, this.x, this.y, env);
  }

  hides(x, y) {
    return y < this.depth && y > this.y - ROOF_RISE && x > this.x - 4 && x < this.#right + 4;
  }
}
