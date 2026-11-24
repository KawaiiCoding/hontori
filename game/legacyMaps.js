/*
 * legacyMaps.js
 * Job: hand the game the maps of the classic scripts as clean map descriptions. The classic scripts
 * src/maps.js, village.js and interiors.js build their maps on window.H.maps; this adapter
 * reads them once and converts them. It is the only module that touches window.H.maps.
 * The chapters in ../content replace it with plain data; the description format stays.
 *
 * Public API:
 *   legacyMaps(art)   -> array of map descriptions (the format is specified in INTERFACES.md):
 *                        the maps of the current game, then the content maps (game/maps/index.js)
 *
 * What the legacy scripts need to run without the old engine: nothing beyond the painters
 * (they read H.propsOutdoor.info, H.furniture.info and H.buildings.info for footprints).
 */

import { withContentMaps } from './maps/index.js';

const NEARBY = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1], [2, 0], [-2, 0]];
const NO_GROUND_FOR_FIXTURES = new Set(['path', 'water', 'cobble']);
/* buildings of the classic maps drawn as another type: Rootwood Hall wears its own hall, not the Academy's */
const BUILDING_LOOK = { mossgrove: { school: 'school_grass' } };

export function legacyMaps(art, legacy = window.H) {
  /* the chapters written as data (content/<chapter>/maps) follow, joined to these by their links */
  return withContentMaps(Object.entries(legacy.maps || {}).map(([id, map]) => describe(id, map, art)));
}

function describe(id, map, art) {
  const description = {
    id,
    name: map.name || id,
    tileset: map.tileset === 'indoor' ? 'indoor' : 'outdoor',
    rows: map.ground.slice(),
    legend: { ...map.legend },
    props: (map.props || []).map((p) => ({ type: p.type, x: p.x, y: p.y })),
    buildings: (map.buildings || []).map((b) => ({ type: (BUILDING_LOOK[id] && BUILDING_LOOK[id][b.type]) || b.type, x: b.x, y: b.y })),
    people: people(map.npcs || []),
    doors: (map.doors || []).map((d) => ({ x: d.x, y: d.y, to: d.to, tx: d.tx, ty: d.ty, dir: d.dir || 0 })),
    spawn: { x: 1, y: 1, dir: 0, ...map.spawn },
    passable: (map.passable || []).map(([x, y]) => [x, y]),
    lights: (map.lights || []).map((l) => ({ ...l })),
    labels: (map.labels || []).map((l) => ({ ...l })),
    start: map.env ? { time: map.env.time, weather: map.env.weather || 'clear' } : null,
  };
  if (description.tileset === 'outdoor') keepRoadsClear(description, art);
  return description;
}

/* a person's look doubles as the id in the legacy data; a second use of a look gets a number */
function people(npcs) {
  const seen = new Map();
  return npcs.map((npc) => {
    const count = (seen.get(npc.key) || 0) + 1;
    seen.set(npc.key, count);
    const person = {
      id: count > 1 ? `${npc.key}${count}` : npc.key,
      look: npc.key,
      x: npc.x,
      y: npc.y,
      dir: npc.dir || 0,
    };
    if (npc.fixed) person.fixed = true;
    if (npc.idle) person.idle = npc.idle;
    if (npc.sched) person.schedule = npc.sched.map((slot) => ({ ...slot }));
    if (npc.lines) person.lines = npc.lines.map((line) => line.slice());
    if (npc.svc) person.service = npc.svc;
    if (npc.goneIf) person.goneIf = npc.goneIf;
    return person;
  });
}

/*
 * World rule 62: nothing solid stands on a road. The current engine moves any lamp, rock or
 * sign that landed on a path tile to the nearest free spot beside it when it starts; the same
 * is done here so every prop stands exactly where the current game shows it.
 */
function keepRoadsClear(description, art) {
  const tileAt = (x, y) => description.legend[(description.rows[y] || '')[x]];
  const used = new Set(description.props.map((p) => `${p.x},${p.y}`));
  for (const person of description.people) used.add(`${person.x},${person.y}`);
  for (const prop of description.props) {
    const info = art.propInfo(prop.type);
    if (!info || !info.solid || info.decor || art.propBelongsOnRoad(prop.type)) continue;
    if (tileAt(prop.x, prop.y) !== 'path') continue;
    for (const [dx, dy] of NEARBY) {
      const x = prop.x + dx;
      const y = prop.y + dy;
      const tile = tileAt(x, y);
      if (!tile || NO_GROUND_FOR_FIXTURES.has(tile) || used.has(`${x},${y}`)) continue;
      used.delete(`${prop.x},${prop.y}`);
      prop.x = x;
      prop.y = y;
      used.add(`${x},${y}`);
      break;
    }
  }
}
