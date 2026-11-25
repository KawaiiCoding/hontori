/*
 * maps/index.js
 * Job: the content-map loader. A chapter writes its maps as plain data (content/<chapter>/maps/); this
 * module turns that data into the map descriptions the world reads (INTERFACES.md section 6), so a new
 * town needs no map script. It also joins new maps to old ones (links) and keeps the parts of a map
 * that depend on the story (states: a rockslide that lies on a road until the road is opened).
 *
 * Public API:
 *   withContentMaps(descriptions)   the given descriptions (the maps of the current game) with every
 *                                   link and state applied, followed by every content map
 *   buildMap(data, text)            one map description from one content map (text: { id: words })
 *   schoolProps(data)               the props of a map's small school dressing (see `school` below)
 *   installMaps(game)               registers system "maps": when the story changes a state of the map
 *                                   the player stands on, the map is entered again behind the door fade
 *   MAP_FOLDERS                     the chapter map folders, in load order (a new chapter is one import)
 *
 * A content map (all plain data):
 *   { id, name, tileset: 'outdoor' | 'indoor', rest: false (optional: no resting here),
 *     legend: { letter: tile id }, rows: [one string per row],
 *     things: { legend: { letter: prop type | { building: type } }, rows: [...] },
 *         optional second grid of the same size: a letter marks the top-left tile of a prop or a
 *         building, "." is nothing
 *     props, buildings, doors, spawn, passable, lights, labels, start     as in INTERFACES.md section 6
 *     spots: { name: [x, y] | [[x, y] ...] }    named tiles for other content (carried untouched)
 *     dark: { level, sight, lantern: { item, sight, oil } }   optional: a dark map (world/Darkness.js); the
 *         lantern sight while that item is carried, the oil sight while Lantern Oil is carried too
 *     school: { door: [x, y], element, name: text id, touch: 'kites', touchAt: [[x, y] ...] }
 *         optional: the house with that door is a small school. It gets the small school dressing: a
 *         name board over the door ("school_sign:<map id>"), the banner of its element on the wall
 *         ("school_banner_<element>") and a touch of its own (kites on poles: "kite_pole", by default
 *         two tiles left and right of the door, one row in front). Painted by game/world/schools.js. }
 *   name and label names are text ids; the folder's text table gives the words.
 *
 * A folder: { maps: [content map ...], links: [...], states: [...], text: { id: words } }
 *   link:  { map, doors: [...], labels: [...], props: [...], without: [{ type, x, y }] }
 *          added to (and "without": taken from) a map that already exists, for good
 *   state: { map, until: condition, props: [...], tiles: [[x, y, letter] ...], closes: [map id ...] }
 *          while the condition does not hold the props stand on the map, the tiles hold that legend
 *          letter (a gap in a bridge) and the doors to the maps in "closes" do not exist. Without the
 *          story service every state counts as not yet reached.
 */

import ch3 from '../../content/ch3/maps/index.js';
import ch4 from '../../content/ch4/maps/index.js';
import ch5 from '../../content/ch5/maps/index.js';
import ch6 from '../../content/ch6/maps/index.js';
import ch7 from '../../content/ch7/maps/index.js';
import ch8 from '../../content/ch8/maps/index.js';
import ch9 from '../../content/ch9/maps/index.js';
import ch10 from '../../content/ch10/maps/index.js';

export const MAP_FOLDERS = [ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10];

const EMPTY = '.';
let testCondition = null;

export function withContentMaps(descriptions, folders = MAP_FOLDERS) {
  const all = descriptions.slice();
  for (const folder of folders) {
    for (const data of folder.maps || []) all.push(buildMap(data, folder.text));
  }
  const byId = new Map(all.map((description) => [description.id, description]));
  for (const folder of folders) {
    for (const link of folder.links || []) applyLink(byId.get(link.map), link, folder.text);
  }
  const states = folders.flatMap((folder) => folder.states || []);
  for (const description of all) {
    const own = states.filter((state) => state.map === description.id);
    if (own.length) keepStates(description, own);
  }
  return all;
}

export function buildMap(data, text = {}) {
  const words = (id) => (id in text ? text[id] : id);
  const props = (data.props || []).map((prop) => ({ ...prop }));
  const buildings = (data.buildings || []).map((building) => ({ ...building }));
  readThings(data.things, props, buildings);
  for (const prop of schoolProps(data)) props.push(prop);
  const description = {
    id: data.id,
    name: words(data.name || data.id),
    tileset: data.tileset === 'indoor' ? 'indoor' : 'outdoor',
    rows: data.rows.slice(),
    legend: { ...data.legend },
    props,
    buildings,
    people: [],
    doors: (data.doors || []).map((door) => ({ dir: 0, ...door })),
    spawn: { x: 1, y: 1, dir: 0, ...data.spawn },
    passable: (data.passable || []).map(([x, y]) => [x, y]),
    lights: (data.lights || []).map((light) => ({ ...light })),
    labels: (data.labels || []).map((label) => ({ ...label, name: words(label.name) })),
    start: data.start ? { ...data.start } : null,
    spots: data.spots || {},
  };
  if (data.school) description.school = { ...data.school, name: words(data.school.name) };
  if (data.rest === false) description.rest = false;
  /* a dark map (a cave): the world's darkness pass reads it (world/Darkness.js, game/features/lantern.js) */
  if (data.dark && typeof data.dark === 'object') description.dark = { ...data.dark, lantern: data.dark.lantern ? { ...data.dark.lantern } : undefined };
  return description;
}

/* the small school dressing of a content map, as props */
export function schoolProps(data) {
  const school = data && data.school;
  if (!school || !Array.isArray(school.door)) return [];
  const [x, y] = school.door;
  const props = [{ type: `school_sign:${data.id}`, x, y }];
  if (school.element) props.push({ type: `school_banner_${school.element}`, x: x - 1, y });
  if (school.touch === 'kites') {
    for (const [tx, ty] of school.touchAt || [[x - 2, y + 1], [x + 2, y + 1]]) props.push({ type: 'kite_pole', x: tx, y: ty });
  }
  return props;
}

export function installMaps(game) {
  game.registry.add('system', 'maps', new MapStates());
}

/* the second grid: one letter per tile, the top-left tile of whatever stands there */
function readThings(things, props, buildings) {
  if (!things || !things.rows) return;
  const legend = things.legend || {};
  things.rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const entry = row[x] === EMPTY ? null : legend[row[x]];
      if (!entry) continue;
      if (typeof entry === 'string') props.push({ type: entry, x, y });
      else if (entry.building) buildings.push({ type: entry.building, x, y });
    }
  });
}

function applyLink(description, link, text = {}) {
  if (!description) {
    console.warn(`maps: a link names the unknown map "${link.map}"`);
    return;
  }
  const gone = link.without || [];
  if (gone.length) {
    description.props = description.props.filter((prop) => !gone.some((g) => g.type === prop.type && g.x === prop.x && g.y === prop.y));
  }
  for (const prop of link.props || []) description.props.push({ ...prop });
  for (const door of link.doors || []) description.doors.push({ dir: 0, ...door });
  for (const label of link.labels || []) description.labels.push({ ...label, name: label.name in text ? text[label.name] : label.name });
}

/*
 * A map with states answers "props", "rows" and "doors" for the story as it stands at that moment. The
 * world reads both each time it enters the map, so a state never needs to be pushed into it.
 */
function keepStates(description, states) {
  const baseProps = description.props;
  const baseDoors = description.doors;
  const baseRows = description.rows;
  description.states = states;
  Object.defineProperty(description, 'rows', {
    enumerable: true,
    get() {
      const changed = states.filter(pending).flatMap((state) => state.tiles || []);
      if (!changed.length) return baseRows;
      const rows = baseRows.map((row) => [...row]);
      for (const [x, y, letter] of changed) if (rows[y] && x >= 0 && x < rows[y].length) rows[y][x] = letter;
      return rows.map((row) => row.join(''));
    },
  });
  Object.defineProperty(description, 'props', {
    enumerable: true,
    get() {
      const extra = states.filter(pending).flatMap((state) => state.props || []);
      return extra.length ? baseProps.concat(extra) : baseProps;
    },
  });
  Object.defineProperty(description, 'doors', {
    enumerable: true,
    get() {
      const closed = new Set(states.filter(pending).flatMap((state) => state.closes || []));
      return closed.size ? baseDoors.filter((door) => !closed.has(door.to)) : baseDoors;
    },
  });
}

/* a state is pending until its condition holds */
function pending(state) {
  if (!testCondition) return true;
  try {
    return !testCondition(state.until);
  } catch (error) {
    console.warn('maps: a state condition failed', error);
    return true;
  }
}

function signature(description) {
  return (description.states || []).map((state) => (pending(state) ? '1' : '0')).join('');
}

class MapStates {
  #game = null;
  #shown = '';

  start(game) {
    this.#game = game;
    testCondition = (condition) => {
      const story = game.registry.get('service', 'story');
      return !!(story && story.test(condition));
    };
    game.bus.on('map:enter', ({ map }) => {
      this.#shown = signature(map.description);
    });
    game.bus.on('story:flag', () => this.#refresh());
    game.bus.on('story:end', () => this.#refresh());
  }

  /* the map on screen was built for another state: enter it again where the player stands */
  #refresh() {
    try {
      const game = this.#game;
      const world = game.scenes.base;
      if (!world || !world.map || !world.player || typeof world.goTo !== 'function') return;
      const description = world.map.description;
      if (!description.states || signature(description) === this.#shown) return;
      const story = game.registry.get('service', 'story');
      if (story && story.busy) return;
      this.#shown = signature(description);
      world.goTo(world.map.id, world.player.tx, world.player.ty, world.player.dir);
    } catch (error) {
      console.warn('maps: could not refresh the map', error);
    }
  }
}
