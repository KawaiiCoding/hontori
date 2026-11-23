/*
 * HontoriArt.js
 * Job: Hontori's art provider (the interface is specified in INTERFACES.md): the single door to
 * the painters of the current game (the classic scripts in src/ that
 * paint every tile, prop, building, person, hontori, light and weather effect in code, on the
 * global window.H). Nothing else touches window.H for art.
 *
 * Coordinates are logical pixels on a context that is already scaled by RENDER_SCALE.
 * `env` is the world's Environment: { t, time, weather, wind, indoor }.
 *
 * Public API (class HontoriArt):
 *   Tiles
 *     knowsTile(indoor, id)            is this tile id painted by that tileset
 *     tileSolid(indoor, id)            does the tile block walking
 *     tileAnimates(indoor, id)         does its picture change with time, wind or weather
 *     tileFlows(indoor, id)            is its motion continuous across tile borders (water), so that
 *                                      it must be drawn every frame and never sampled
 *     tileOverhang(indoor)             pixels a tile may paint above its own square (grass blades)
 *     tileBeyond(indoor)               the tile id assumed outside the map
 *     tileIsRoad(indoor, id)           is it a road, which nothing solid may stand on
 *     drawTile(ctx, indoor, id, px, py, tx, ty, env, neighbour)   neighbour(dx, dy) -> tile id
 *   Props (trees, furniture, lamps ...)
 *     propInfo(type)                   { fw, fh, solid, decor, light } or null if unknown
 *     propAnimates(type)               does its picture change with time, wind, weather or hour
 *     propBelongsOnRoad(type)          may it stand on a road although it is solid (a rockslide)
 *     propBounds(type)                 { left, top, right, bottom } of its art around its tile corner
 *     drawProp(ctx, type, px, py, env)
 *     addProp(type, { info, draw(ctx, px, py, env), animates })   a prop the game layer paints itself (a
 *                                      capsule machine); info: { fw, fh, solid, decor, light }. Registered
 *                                      before the maps are checked or entered; one type means one thing
 *   Buildings
 *     buildingInfo(type)               { fw, fh, lights } or null if unknown
 *     buildingBounds(type)
 *     drawBuilding(ctx, type, px, py, env)
 *   People and creatures
 *     knowsLook(look)
 *     drawPerson(ctx, look, x, y, dir, frame, env, pose)   pose: { npc, seed, idle, talking } or undefined
 *     drawCreature(ctx, key, x, y, env, pose)              a hontori; pose: { scale, dir, moving, sit, noShadow }
 *     portrait(kind, key, stage)       a canvas with the face of a 'person' or a 'creature' (stage: the
 *                                      creature's stage, default 1)
 *   Light, weather, small life
 *     drawShadow(ctx, x, y, rx, ry, env)                   ground shadow that follows the sun
 *     createLighting(width, height)    -> { render(ctx, camX, camY, env, lights) }
 *     createWeather(width, height)     -> { update(dt, env), draw(ctx, camX, camY, env) }
 *     createParticles()                -> { emit(kind, x, y, count), update(dt, env), draw(ctx, camX, camY) }
 *     createAmbient(mapData)           -> { update(dt, env, x, y), draw(ctx, env), lights() }
 *                                         birds, ducks, butterflies, petals, fireflies of an outdoor map
 *   Icons
 *     iconUrl(name)                    a data URL of the 2x pixel icon of that name ('cog', 'bell', 'day' ...)
 *     itemIconUrl(id)                  a data URL of the 2x pixel icon that looks like that item (a fish, the
 *                                      pouch), or null when the painters have none (use iconUrl of its named icon)
 *   Checking (slow; for the content checker only)
 *     tileChangesOverTime(indoor, id)  true if the tile really paints differently as time passes
 *     propChangesOverTime(type)        the same for a prop
 *
 * Which things animate was established by reading the painters (see ANIMATED_* below); the
 * content checker verifies it again by painting everything that gets baked at several moments.
 */

import { TILE, RENDER_SCALE } from '../core/units.js';
import { hasItemIcon, itemIconUrl as ownItemIconUrl } from './items/icons.js';

const REQUIRED = ['icons', 'fx', 'tilesOutdoor', 'tilesIndoor', 'propsOutdoor', 'furniture', 'buildings', 'chars', 'spirits'];

/* tiles_outdoor.js: blades sway with wind and time, each tile on its own */
const SWAYING_OUTDOOR_TILES = new Set(['grass', 'tallgrass', 'flowers']);
/* tiles_outdoor.js: one sheet of drifting strokes, sparkles and shore foam runs through all water */
const FLOWING_OUTDOOR_TILES = new Set(['water', 'bridge']);
const OUTDOOR_TILES = new Set(['grass', 'tallgrass', 'flowers', 'path', 'cobble', 'sand', 'water', 'bridge']);
/* tiles_indoor.js, interior_plus.js, walltops.js: every indoor tile is a fixed picture */
const INDOOR_TILES = new Set([
  'floor_wood', 'floor_tile', 'rug', 'wall', 'void', 'floor_herring', 'floor_stone', 'carpet_blue',
]);
/* tall grass blades reach 12 pixels above their tile */
const OUTDOOR_OVERHANG = 12;

/* world rule 62: only these may stand on a road */
const ROAD_FIXTURES = new Set(['rockslide', 'stepping_stone', 'bridge']);

const ANIMATED_PROPS = new Set([
  /* props_outdoor.js and outdoor_plus.js: wind sway */
  'tree', 'pine', 'bush', 'fruit_tree', 'cherry_tree', 'butterfly_bush', 'flower_patch', 'reeds',
  'market_stall', 'laundry_line', 'windchime',
  /* outdoor_plus.js: slow two-frame loops */
  'lilypad', 'birdbath',
  /* lit after dusk */
  'lamp', 'lantern_string',
  /* furniture.js: flames, pendulum, sky behind the pane */
  'fireplace', 'clock', 'window',
  /* interior_plus.js, interiors_props.js, hall_props.js: frame loops and glows */
  'cat_bed', 'candles', 'wall_shelf', 'garland', 'ramen_pot', 'crystal_orb', 'heart_tree', 'glowcaps',
]);

/* the measuring canvas: art is painted with its tile corner at ORIGIN and the painted box is read back */
const PROBE_SIZE = 384;
const PROBE_ORIGIN_X = 96;
const PROBE_ORIGIN_Y = 256;
/* animated art sways a little beyond the picture that was measured */
const BOUNDS_MARGIN = 12;
const PROBE_ENVS = [
  { t: 0, time: 12, weather: 'clear', wind: 0.1, indoor: false },
  { t: 0.37, time: 12, weather: 'clear', wind: 0.1, indoor: false },
  { t: 1.13, time: 12, weather: 'wind', wind: 0.6, indoor: false },
  { t: 2.9, time: 22, weather: 'clear', wind: 0.3, indoor: false },
  { t: 7.7, time: 22, weather: 'rain', wind: 0.45, indoor: false },
];

export class HontoriArt {
  #h;
  #itemUrls = new Map();
  #bounds = new Map();
  #probe = null;
  #ownProps = new Map();

  constructor(legacy = window.H) {
    const missing = REQUIRED.filter((name) => !legacy || !legacy[name]);
    if (missing.length) throw new Error(`HontoriArt: painters not loaded: ${missing.join(', ')}`);
    this.#h = legacy;
    /* spirits.js rasterises its frames at this scale */
    legacy.renderScale = RENDER_SCALE;
  }

  /* ---------- tiles ---------- */

  knowsTile(indoor, id) {
    return (indoor ? INDOOR_TILES : OUTDOOR_TILES).has(id);
  }

  tileSolid(indoor, id) {
    return !!this.#tileset(indoor).solid[id];
  }

  tileAnimates(indoor, id) {
    return !indoor && (SWAYING_OUTDOOR_TILES.has(id) || FLOWING_OUTDOOR_TILES.has(id));
  }

  tileFlows(indoor, id) {
    return !indoor && FLOWING_OUTDOOR_TILES.has(id);
  }

  tileOverhang(indoor) {
    return indoor ? 0 : OUTDOOR_OVERHANG;
  }

  tileBeyond(indoor) {
    return indoor ? 'void' : 'grass';
  }

  tileIsRoad(indoor, id) {
    return !indoor && id === 'path';
  }

  drawTile(ctx, indoor, id, px, py, tx, ty, env, neighbour) {
    this.#tileset(indoor).draw(ctx, id, px, py, tx, ty, env, neighbour);
  }

  /* ---------- props ---------- */

  propInfo(type) {
    const own = this.#ownProps.get(type);
    if (own) return own.info;
    return this.#h.furniture.info[type] || this.#h.propsOutdoor.info[type] || null;
  }

  propAnimates(type) {
    const own = this.#ownProps.get(type);
    return own ? !!own.animates : ANIMATED_PROPS.has(type);
  }

  addProp(type, { info, draw, animates = false }) {
    if (this.#ownProps.has(type) || this.#h.furniture.info[type] || this.#h.propsOutdoor.info[type]) {
      throw new Error(`HontoriArt: the prop "${type}" already exists`);
    }
    this.#ownProps.set(type, { info: { fw: 1, fh: 1, solid: true, ...info }, draw, animates });
  }

  propBelongsOnRoad(type) {
    return ROAD_FIXTURES.has(type);
  }

  propBounds(type) {
    return this.#measured(`prop:${type}`, (ctx, env) => this.drawProp(ctx, type, PROBE_ORIGIN_X, PROBE_ORIGIN_Y, env));
  }

  drawProp(ctx, type, px, py, env) {
    const own = this.#ownProps.get(type);
    if (own) {
      own.draw(ctx, px, py, env);
      return;
    }
    const h = this.#h;
    if (h.furniture.info[type]) h.furniture.draw(ctx, type, px, py, env);
    else h.propsOutdoor.draw(ctx, type, px, py, env);
  }

  /* ---------- buildings ---------- */

  buildingInfo(type) {
    return this.#h.buildings.info[type] || null;
  }

  buildingBounds(type) {
    return this.#measured(`building:${type}`, (ctx, env) => this.drawBuilding(ctx, type, PROBE_ORIGIN_X, PROBE_ORIGIN_Y, env));
  }

  drawBuilding(ctx, type, px, py, env) {
    this.#h.buildings.draw(ctx, type, px, py, env);
  }

  /* ---------- people and creatures ---------- */

  knowsLook(look) {
    return !!this.#h.chars.data[look];
  }

  drawPerson(ctx, look, x, y, dir, frame, env, pose) {
    this.#h.chars.draw(ctx, look, x, y, dir, frame, env, pose);
  }

  drawCreature(ctx, key, x, y, env, pose) {
    this.#h.spirits.draw(ctx, key, x, y, env, pose);
  }

  portrait(kind, key, stage) {
    return kind === 'creature' ? this.#h.spirits.portrait(key, stage) : this.#h.chars.portrait(key);
  }

  /* ---------- light, weather, small life ---------- */

  drawShadow(ctx, x, y, rx, ry, env) {
    this.#h.fx.shadow(ctx, x, y, rx, ry, env);
  }

  createLighting(width, height) {
    return this.#h.fx.createLighting(width, height);
  }

  createWeather(width, height) {
    return this.#h.fx.createWeather(width, height);
  }

  createParticles() {
    return this.#h.fx.createParticles();
  }

  createAmbient(mapData) {
    const h = this.#h;
    /* the painter reads the map in the current game's shape and rewrites its `lights` every update */
    const legacyMap = {
      tileset: mapData.tileset, w: mapData.rows[0].length, h: mapData.rows.length,
      ground: mapData.rows, legend: mapData.legend,
      props: mapData.props, buildings: mapData.buildings, lights: mapData.lights || [],
    };
    const critters = h.ambient.create(legacyMap);
    const near = { x: 0, y: 0 };
    return {
      update(dt, env, x, y) {
        near.x = x;
        near.y = y;
        h.ambientPlayer = near;
        critters.update(dt, env);
      },
      draw(ctx, env) {
        h.ambientPlayer = near;
        critters.draw(ctx, env);
      },
      lights() {
        return legacyMap.lights;
      },
    };
  }

  /* ---------- icons ---------- */

  iconUrl(name) {
    return this.#h.icons.url(name, 2);
  }

  itemIconUrl(id) {
    const h = this.#h;
    try {
      if (hasItemIcon(id)) return ownItemIconUrl(id, RENDER_SCALE);
      if (h.itemIcons && h.itemIcons.has(id)) return h.itemIcons.url(id, RENDER_SCALE);
      /* the home things are painted by the current game's item module, when it is loaded */
      if (!h.items || !Array.isArray(h.items.list) || !h.items.list.some((item) => item.id === id)) return null;
      if (this.#itemUrls.has(id)) return this.#itemUrls.get(id);
      const canvas = document.createElement('canvas');
      canvas.width = TILE * RENDER_SCALE;
      canvas.height = TILE * RENDER_SCALE;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.scale(RENDER_SCALE, RENDER_SCALE);
      h.items.draw(ctx, id, 0, 0);
      const url = canvas.toDataURL();
      this.#itemUrls.set(id, url);
      return url;
    } catch (error) {
      return null;
    }
  }

  /* ---------- checking ---------- */

  tileChangesOverTime(indoor, id) {
    const tx = PROBE_ORIGIN_X / TILE;
    const ty = PROBE_ORIGIN_Y / TILE;
    const same = () => id;
    return this.#changesOverTime((ctx, env) => this.drawTile(ctx, indoor, id, PROBE_ORIGIN_X, PROBE_ORIGIN_Y, tx, ty, env, same));
  }

  propChangesOverTime(type) {
    return this.#changesOverTime((ctx, env) => this.drawProp(ctx, type, PROBE_ORIGIN_X, PROBE_ORIGIN_Y, env));
  }

  /* ---------- private ---------- */

  #changesOverTime(paint) {
    const first = this.#snapshot(paint, PROBE_ENVS[0]).slice();
    for (let i = 1; i < PROBE_ENVS.length; i++) {
      const next = this.#snapshot(paint, PROBE_ENVS[i]);
      for (let p = 0; p < first.length; p++) if (first[p] !== next[p]) return true;
    }
    return false;
  }

  #tileset(indoor) {
    return indoor ? this.#h.tilesIndoor : this.#h.tilesOutdoor;
  }

  #snapshot(paint, env) {
    if (!this.#probe) {
      const canvas = document.createElement('canvas');
      canvas.width = PROBE_SIZE;
      canvas.height = PROBE_SIZE;
      this.#probe = canvas.getContext('2d', { willReadFrequently: true });
    }
    const ctx = this.#probe;
    ctx.clearRect(0, 0, PROBE_SIZE, PROBE_SIZE);
    ctx.save();
    paint(ctx, env);
    ctx.restore();
    return ctx.getImageData(0, 0, PROBE_SIZE, PROBE_SIZE).data;
  }

  #measured(key, paint) {
    let box = this.#bounds.get(key);
    if (!box) {
      box = this.#measure(paint);
      this.#bounds.set(key, box);
    }
    return box;
  }

  #measure(paint) {
    const data = this.#snapshot(paint, PROBE_ENVS[0]);
    let left = PROBE_SIZE;
    let top = PROBE_SIZE;
    let right = -1;
    let bottom = -1;
    for (let y = 0; y < PROBE_SIZE; y++) {
      for (let x = 0; x < PROBE_SIZE; x++) {
        if (!data[(y * PROBE_SIZE + x) * 4 + 3]) continue;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
    /* art that paints nothing at this moment still occupies its tile */
    if (right < 0) return { left: 0, top: 0, right: TILE, bottom: TILE };
    return {
      left: left - PROBE_ORIGIN_X - BOUNDS_MARGIN,
      top: top - PROBE_ORIGIN_Y - BOUNDS_MARGIN,
      right: right + 1 - PROBE_ORIGIN_X + BOUNDS_MARGIN,
      bottom: bottom + 1 - PROBE_ORIGIN_Y + BOUNDS_MARGIN,
    };
  }
}
