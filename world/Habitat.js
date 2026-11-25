/*
 * Habitat.js
 * Job: where wild creatures like to live on one map, from data: what lies near each tile (water,
 * tall grass, trees, rocks, lamps, warm chimneys ...), the hour and the weather. It answers how well
 * each kind fits a tile, picks a kind for a tile, and lists the tiles where a wild one may live.
 * No drawing, no state beyond the tables it builds once per map.
 *
 * Public API:
 *   new Habitat(map, art, table, place)
 *        map: a TileMap; art: the art provider (building footprints)
 *        table: { night: [from, to], dusk: [[from, to]...], base, habitats: { kind: { f, day, night, wx, rare, maps,
 *                 after, level } }, has(flag) }   after: a flag; the kind lives here only once has(flag) answers
 *                 true (no has: never). level: [min, max], the kind's own levels instead of the place's
 *                 features: { props: { type: feature }, tiles: { tile: feature } },
 *                 warmBuildings: [type] }   warmBuildings: buildings with a big hearth (warmer around them)
 *        place: { level: [min, max], zones: [{ x, y, r, kind, w }] }
 *   kinds                         the kinds that can live here (every kind of the table, less those whose
 *                                 `maps` list leaves this map out or whose `after` flag is not set)
 *   isNight(hour), isDusk(hour)
 *   weights(tx, ty, env, factor)  { kind: score }; factor(kind) -> number scales a kind (a lantern)
 *   pick(tx, ty, env, factor, random)   { kind, level, score }
 *   candidates()                  [[x, y]] free tiles off the roads, away from doors and people; in a
 *                                 town (a map with buildings) only the wild edges
 */

const NEAR_FEATURES = new Set(['statue', 'lamp', 'warm', 'chime']);
const ROAD_TILES = new Set(['path', 'cobble', 'bridge']);
const TOWN_WILD_TILES = new Set(['tallgrass', 'sand', 'flowers', 'ash']);

function inRange(hour, [from, to]) {
  return from <= to ? hour >= from && hour < to : hour >= from || hour < to;
}

export class Habitat {
  #map;
  #art;
  #table;
  #place;
  #grid = null;
  #candidates = null;

  constructor(map, art, table = {}, place = {}) {
    this.#map = map;
    this.#art = art;
    this.#table = table;
    this.#place = place;
    /* a kind that names its maps (`maps: [map id ...]`) lives only there: a far country's creatures stay in it */
    this.kinds = Object.keys(table.habitats || {}).filter((kind) => {
      const habit = table.habitats[kind] || {};
      if (habit.after && !this.#has(habit.after)) return false;
      return !Array.isArray(habit.maps) || habit.maps.includes(map.id);
    });
  }

  #has(flag) {
    try {
      return typeof this.#table.has === 'function' && !!this.#table.has(flag);
    } catch (error) {
      return false;
    }
  }

  isNight(hour) {
    return inRange(hour, this.#table.night || [19.5, 5.5]);
  }

  isDusk(hour) {
    return (this.#table.dusk || []).some((range) => inRange(hour, range));
  }

  weights(tx, ty, env, factor) {
    const grid = this.#features();
    const here = (grid[ty] && grid[ty][tx]) || {};
    const hour = env ? env.time : 12;
    const weather = (env && env.weather) || 'clear';
    const night = this.isNight(hour);
    const dusk = !night && this.isDusk(hour);
    const base = this.#table.base ?? 0.05;
    const result = {};
    for (const kind of this.kinds) {
      const habit = this.#table.habitats[kind];
      let score = base;
      for (const [feature, weight] of Object.entries(habit.f || {})) if (here[feature]) score += Math.min(3, here[feature]) * weight;
      if (here[`z_${kind}`]) score += here[`z_${kind}`];
      const day = habit.day ?? 1;
      const dark = habit.night ?? 1;
      score *= night ? dark : dusk ? (day + dark) / 2 : day;
      score *= (habit.wx || {})[weather] || 1;
      score *= habit.rare ?? 1;
      if (factor) score *= factor(kind) || 1;
      result[kind] = score;
    }
    return result;
  }

  pick(tx, ty, env, factor, random = Math.random) {
    const weights = this.weights(tx, ty, env, factor);
    let sum = 0;
    for (const kind in weights) sum += weights[kind];
    let roll = random() * sum;
    let kind = this.kinds[0];
    for (const key in weights) {
      roll -= weights[key];
      if (roll <= 0) {
        kind = key;
        break;
      }
    }
    const habit = this.#table.habitats[kind] || {};
    const own = Array.isArray(habit.level) && habit.level.length === 2;
    const [low, high] = own ? habit.level : this.#place.level || [1, 3];
    let level = low + Math.floor(random() * (high - low + 1));
    if (!own && (habit.rare ?? 1) < 0.5) level += 1;
    return { kind, level, score: weights[kind] || 0 };
  }

  candidates() {
    if (this.#candidates) return this.#candidates;
    const map = this.#map;
    const description = map.description;
    const grid = this.#features();
    const town = (description.buildings || []).length > 0;
    const avoid = [];
    for (const door of description.doors || []) avoid.push([door.x, door.y, 4]);
    for (const person of description.people || []) avoid.push([person.x, person.y, 2]);
    const blocks = (description.buildings || []).map((building) => {
      const info = this.#art.buildingInfo(building.type) || { fw: 4, fh: 4 };
      return [building.x, building.y, building.x + info.fw - 1, building.y + info.fh - 1];
    });
    const out = [];
    for (let y = 1; y < map.height - 1; y++) {
      for (let x = 1; x < map.width - 1; x++) {
        if (map.solidAt(x, y) || map.doorAt(x, y)) continue;
        const tile = map.tileAt(x, y);
        if (ROAD_TILES.has(tile)) continue;
        if (avoid.some(([ax, ay, r]) => Math.abs(ax - x) + Math.abs(ay - y) < r)) continue;
        if (town) {
          const here = grid[y][x];
          const edge = Math.min(x, y, map.width - 1 - x, map.height - 1 - y);
          const wild = TOWN_WILD_TILES.has(tile) || here.water > 0.3 || here.fruit > 0.3 || edge <= 4;
          if (!wild) continue;
          if (blocks.some(([x0, y0, x1, y1]) => x >= x0 - 3 && x <= x1 + 3 && y >= y0 - 4 && y <= y1 + 3)) continue;
          if (here.path > 0.5 && tile !== 'tallgrass') continue;
        }
        out.push([x, y]);
      }
    }
    this.#candidates = out;
    return out;
  }

  /* what lies near each tile, worked out once */
  #features() {
    if (this.#grid) return this.#grid;
    const map = this.#map;
    const description = map.description;
    const { width: w, height: h } = map;
    const features = this.#table.features || {};
    const propFeature = features.props || {};
    const tileFeature = features.tiles || {};
    const raw = Array.from({ length: h }, () => Array.from({ length: w }, () => ({})));
    const trees = Array.from({ length: h }, () => new Uint8Array(w));
    const add = (x, y, key, value) => {
      if (x >= 0 && y >= 0 && x < w && y < h) raw[y][x][key] = (raw[y][x][key] || 0) + value;
    };
    const spread = (cx, cy, key, r, value) => {
      for (let y = cy - r; y <= cy + r; y++) {
        for (let x = cx - r; x <= cx + r; x++) {
          const d = Math.abs(x - cx) + Math.abs(y - cy);
          if (d <= r) add(x, y, key, value / (1 + d));
        }
      }
    };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const feature = tileFeature[map.tileAt(x, y)];
        if (feature) spread(x, y, feature, 2, 0.35);
      }
    }
    for (const prop of description.props || []) {
      const feature = propFeature[prop.type];
      if (!feature) continue;
      spread(prop.x, prop.y, feature, NEAR_FEATURES.has(feature) ? 4 : 2, feature === 'statue' ? 1.2 : 0.6);
      if (feature !== 'tree') continue;
      for (let y = prop.y - 2; y <= prop.y + 2; y++) {
        for (let x = prop.x - 2; x <= prop.x + 2; x++) if (y >= 0 && y < h && x >= 0 && x < w) trees[y][x]++;
      }
    }
    const warm = new Set(this.#table.warmBuildings || []);
    for (const building of description.buildings || []) {
      const info = this.#art.buildingInfo(building.type) || { fw: 4, fh: 4 };
      /* chimneys and hearths are warm */
      spread(building.x + (info.fw >> 1), building.y + info.fh, 'warm', 5, warm.has(building.type) ? 1.4 : 0.6);
    }
    const zones = this.#place.zones || [];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const here = raw[y][x];
        const count = trees[y][x];
        here.shade = Math.max(0, count - 3) * 0.35;
        here.open = count === 0 && !here.water && !here.path ? 1 : count <= 1 ? 0.4 : 0;
        for (const zone of zones) {
          const d = Math.hypot(x - zone.x, y - zone.y);
          if (d <= zone.r) here[`z_${zone.kind}`] = (here[`z_${zone.kind}`] || 0) + zone.w * (1 - d / (zone.r + 1));
        }
      }
    }
    this.#grid = raw;
    return raw;
  }
}
