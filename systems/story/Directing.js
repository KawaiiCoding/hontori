/*
 * Directing.js
 * Job: the people of the story in the world. It matches each person standing on the current map
 * to their content description, keeps them where their story phase and their day put them (or out
 * of the world while `goneIf` holds or until they are spawned), and walks, turns, places, spawns
 * and removes them for scripts.
 *
 * Public API:
 *   new PeopleDirector(story)
 *   attach(world)            a map was entered: match its people and place them at once
 *   contentOf(person)        the content description of a person in the world, or null
 *   find(id)                 the person in the world for a content id (or a world id), or null
 *   resolve(def)             the description with every phase whose condition holds applied
 *   placement(def)           { map, x, y, dir, away, gone, lines, service } for the current hour
 *   refresh(force)           put everyone where they belong now; without force nobody appears,
 *                            vanishes or jumps within sight of the player outdoors
 *   walk(person, path, speed)   a Promise that resolves when the person has walked the path
 *   step(dt)                 advance the walking people (called while a script runs)
 *   release()                a script ended: the people it directed go back to their day; whoever
 *                            was walked or placed away from where their day puts them on this map
 *                            walks back there at once (stepHome)
 *   stepHome(dt)             advance the people walking back (a world layer, while no script runs)
 *   adopt(def, at)           someone the map does not hold comes to stand on it (world.addPerson):
 *                            a `spawned` person of the content; the Person, or null
 *   drop(person)             take someone out: a person brought in by adopt leaves the map, anyone
 *                            else is put away
 *   DIRECTING                { move, face, place, spawn, remove } registered as "story.command"
 *
 * Positions in commands: [x, y], 'player' (beside the player), or { player: [dx, dy] }.
 */

import { Schedule } from '../../world/Schedule.js';
import { findPath } from '../../world/PathFinder.js';
import { DIR_STEP, dirOfStep } from '../../core/units.js';

/* in tiles: closer than this the player would see someone appear or jump */
const IN_SIGHT = 7;
const WALK_SPEED = 3.2;

export class PeopleDirector {
  #story;
  #world = null;
  #matches = new Map();
  #schedules = new WeakMap();
  #walkers = [];
  #directed = new Set();
  #controlled = new Set();
  #homeward = [];

  constructor(story) {
    this.#story = story;
  }

  attach(world) {
    this.#world = world;
    this.#walkers = [];
    this.#homeward = [];
    this.#directed.clear();
    this.#controlled.clear();
    this.#match(world);
    this.#adoptSpawned(world);
    this.refresh(true);
  }

  adopt(def, at) {
    const world = this.#world;
    if (!world || !def || !at || typeof world.addPerson !== 'function') return null;
    try {
      const person = world.addPerson({ id: def.id, look: def.look, x: at.x, y: at.y, dir: at.dir || 0, fixed: def.fixed, idle: def.idle });
      person.held = true;
      this.#controlled.add(person);
      this.#matches.set(person, def);
      return person;
    } catch (error) {
      console.warn(`Story: "${def.id}" could not be brought onto the map`, error);
      return null;
    }
  }

  drop(person) {
    const world = this.#world;
    if (world && typeof world.removePerson === 'function' && world.removePerson(person)) {
      this.#matches.delete(person);
      this.#controlled.delete(person);
      this.#directed.delete(person);
      for (const walker of this.#walkers) if (walker.person === person) walker.resolve();
      this.#walkers = this.#walkers.filter((walker) => walker.person !== person);
      return;
    }
    this.direct(person);
    person.away = true;
  }

  /* a spawned person saved on this map, whom the map itself does not hold, is brought in again */
  #adoptSpawned(world) {
    const spawned = this.#story.saved.spawned || {};
    const here = new Set([...this.#matches.values()].map((def) => def.id));
    for (const [id, at] of Object.entries(spawned)) {
      const def = this.#story.library.people.get(id);
      if (def && at && at.map === world.map.id && !here.has(id)) this.adopt(def, at);
    }
  }

  contentOf(person) {
    return this.#matches.get(person) || null;
  }

  find(id) {
    const world = this.#world;
    if (!world) return null;
    for (const [person, def] of this.#matches) if (def.id === id) return person;
    return world.people.find((person) => person.id === id) || null;
  }

  resolve(def) {
    if (!def.phases) return def;
    const resolved = { ...def };
    for (const phase of def.phases) {
      if (!this.#story.test(phase.if, {})) continue;
      for (const [key, value] of Object.entries(phase)) if (key !== 'if') resolved[key] = value;
    }
    return resolved;
  }

  placement(def) {
    const story = this.#story;
    const world = this.#world;
    const resolved = this.resolve(def);
    let at = resolved.at || {};
    let gone = resolved.goneIf !== undefined && story.test(resolved.goneIf, {});
    if (resolved.spawned) {
      const spawned = story.saved.spawned[resolved.id];
      if (spawned) at = spawned;
      else gone = true;
    }
    const slot = resolved.schedule && world ? this.#slotAt(resolved.schedule, world.env.time) : null;
    const placed = slot && slot.x != null;
    return {
      map: (placed && slot.map) || at.map,
      x: placed ? slot.x : at.x,
      y: placed ? slot.y : at.y,
      dir: placed && slot.dir != null ? slot.dir : at.dir,
      away: !!(slot && slot.away),
      gone,
      lines: (slot && slot.lines) || resolved.lines || [],
      service: slot && slot.service !== undefined ? slot.service : resolved.service,
      def: resolved,
    };
  }

  refresh(force) {
    const world = this.#world;
    if (!world || !world.map) return;
    for (const [person, def] of this.#matches) {
      if (this.#directed.has(person) || this.#homeward.some((walker) => walker.person === person)) continue;
      const place = this.placement(def);
      const show = !place.gone && !place.away && place.map === world.map.id && place.x != null;
      const moves = show && (person.tx !== place.x || person.ty !== place.y);
      if (person.away === !show && !moves) continue;
      if (!force && this.#inSight(person, place) && (!world.env.indoor || moves)) continue;
      /* from here on the story, not the map's own day, says where this person stands */
      person.held = true;
      this.#controlled.add(person);
      person.away = !show;
      if (moves) person.placeAt(place.x, place.y, place.dir != null ? place.dir : person.dir);
    }
  }

  walk(person, path, speed = WALK_SPEED) {
    this.#homeward = this.#homeward.filter((walker) => walker.person !== person);
    this.#directed.add(person);
    person.held = true;
    return new Promise((resolve) => {
      this.#walkers = this.#walkers.filter((walker) => walker.person !== person);
      this.#walkers.push({ person, path: path.slice(), speed, resolve });
    });
  }

  direct(person) {
    this.#homeward = this.#homeward.filter((walker) => walker.person !== person);
    this.#directed.add(person);
    person.held = true;
  }

  get walking() {
    return this.#walkers.length > 0 || this.#homeward.length > 0;
  }

  step(dt) {
    this.stepHome(dt);
    if (!this.#walkers.length) return;
    for (const walker of this.#walkers) this.#stepWalker(walker, dt);
    this.#walkers = this.#walkers.filter((walker) => !walker.done);
  }

  release() {
    for (const walker of this.#walkers) walker.resolve();
    this.#walkers = [];
    for (const person of this.#directed) {
      person.held = this.#controlled.has(person);
      this.#sendHome(person);
    }
    this.#directed.clear();
  }

  /* someone the script moved walks back to the place their day gives them on this map */
  #sendHome(person) {
    const world = this.#world;
    const def = this.#matches.get(person);
    if (!world || !world.map || !def || person.away) return;
    const place = this.placement(def);
    const show = !place.gone && !place.away && place.map === world.map.id && place.x != null;
    if (!show || (person.tx === place.x && person.ty === place.y)) return;
    const player = world.player;
    const canWalk = (x, y) => (x === person.tx && y === person.ty)
      || (x === place.x && y === place.y)
      || (!world.isBlocked(x, y) && !(x === player.tx && y === player.ty));
    const path = findPath(world.map.width, world.map.height, person.tx, person.ty, [[place.x, place.y]], canWalk);
    if (!path) return;
    person.held = true;
    this.#homeward.push({ person, path: path.slice(), speed: WALK_SPEED, dir: place.dir, resolve: () => {} });
  }

  stepHome(dt) {
    if (!this.#homeward.length) return;
    const world = this.#world;
    for (const walker of this.#homeward) {
      const { person } = walker;
      const next = walker.path.find(([x, y]) => x !== person.tx || y !== person.ty);
      /* the player stands in the way: wait until they step aside */
      if (!person.moving && next && world && world.player.tx === next[0] && world.player.ty === next[1]) continue;
      this.#stepWalker(walker, dt);
      if (!walker.done) continue;
      if (walker.dir != null) person.dir = walker.dir;
      person.held = this.#controlled.has(person);
    }
    this.#homeward = this.#homeward.filter((walker) => !walker.done);
  }

  /* ---------- matching the map's people to the content ---------- */

  #match(world) {
    this.#matches.clear();
    const mapId = world.map.id;
    const people = [...this.#story.library.people.values()].filter((def) => this.#canBeOn(def, mapId));
    const taken = new Set();
    const take = (person, def) => {
      this.#matches.set(person, def);
      taken.add(def);
    };
    const free = world.people.filter((person) => {
      const def = people.find((d) => d.id === person.id && !taken.has(d));
      if (def) take(person, def);
      return !def;
    });
    for (const person of free) {
      const same = people.filter((d) => d.look === person.look && !taken.has(d));
      const here = same.find((d) => this.#standsAt(d, mapId, person.def.x, person.def.y));
      const def = here || (same.length === 1 ? same[0] : null);
      if (def) take(person, def);
    }
  }

  #places(def) {
    const places = [];
    const add = (at, schedule) => {
      if (at) places.push(at);
      for (const slot of schedule || []) if (slot.x != null) places.push({ map: slot.map || (at && at.map) || def.at.map, x: slot.x, y: slot.y });
    };
    add(def.at, def.schedule);
    for (const phase of def.phases || []) add(phase.at || def.at, phase.schedule);
    return places;
  }

  #canBeOn(def, mapId) {
    return this.#places(def).some((place) => place.map === mapId);
  }

  #standsAt(def, mapId, x, y) {
    return this.#places(def).some((place) => place.map === mapId && place.x === x && place.y === y);
  }

  #slotAt(slots, hour) {
    let schedule = this.#schedules.get(slots);
    if (!schedule) {
      schedule = new Schedule(slots);
      this.#schedules.set(slots, schedule);
    }
    return schedule.slotAt(hour);
  }

  #inSight(person, place) {
    const { player } = this.#world;
    const near = (x, y) => Math.abs(player.tx - x) + Math.abs(player.ty - y) < IN_SIGHT;
    return (!person.away && near(person.tx, person.ty)) || (place.x != null && near(place.x, place.y));
  }

  #stepWalker(walker, dt) {
    const { person } = walker;
    if (!person.moving) {
      while (walker.path.length && walker.path[0][0] === person.tx && walker.path[0][1] === person.ty) walker.path.shift();
      const next = walker.path.shift();
      if (!next) {
        walker.done = true;
        walker.resolve();
        return;
      }
      const dx = next[0] - person.tx;
      const dy = next[1] - person.ty;
      if (Math.abs(dx) + Math.abs(dy) !== 1) {
        person.placeAt(next[0], next[1], person.dir);
        return;
      }
      person.stepTo(dirOfStep(dx, dy));
    }
    person.walk(dt * walker.speed);
  }
}

/* ---------- the commands ---------- */

/* the story never stands anyone on water or in a wall: such a tile becomes the nearest open one */
function openTile(world, x, y) {
  try {
    const map = world && world.map;
    if (map && typeof map.groundSolidAt === 'function' && map.groundSolidAt(x, y) && map.solidAt(x, y)) {
      const open = map.openNear(x, y);
      if (open) {
        console.warn(`Story: ${map.id} ${x},${y} is water or a wall; using ${open[0]},${open[1]}`);
        return open;
      }
    }
  } catch (error) {
    /* the tile stands as asked */
  }
  return [x, y];
}

function playerOf(story) {
  const world = story.world;
  return world ? world.player : null;
}

/* [x, y], { player: [dx, dy] }, or 'player' (the free tiles beside the player) -> goal tiles */
function goalsOf(spec, story, ctx) {
  const player = playerOf(story);
  if (Array.isArray(spec)) return [[story.value(spec[0], ctx), story.value(spec[1], ctx)]];
  if (!player) return [];
  if (spec === 'player') return DIR_STEP.map(([dx, dy]) => [player.tx + dx, player.ty + dy]);
  if (spec && Array.isArray(spec.player)) return [[player.tx + spec.player[0], player.ty + spec.player[1]]];
  return [];
}

function facePlayer(person, player) {
  const dx = player.tx - person.tx;
  const dy = player.ty - person.ty;
  if (!dx && !dy) return person.dir;
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 3 : 2;
  return dy > 0 ? 0 : 1;
}

function personFor(story, id, ctx, verb) {
  const person = id === 'self' ? ctx.person : story.people.find(id);
  if (!person) story.warnOnce(`${verb}:${id}`, `Story: "${verb}" found nobody called "${id}" on this map`);
  return person || null;
}

export const DIRECTING = {
  async move(cmd, ctx, story) {
    const world = story.world;
    const person = personFor(story, cmd.move, ctx, 'move');
    if (!world || !person) return;
    let path = cmd.path ? cmd.path.map(([x, y]) => [x, y]) : null;
    if (!path) {
      const player = world.player;
      const goals = goalsOf(cmd.to, story, ctx).filter(([x, y]) => world.map.inside(x, y));
      const canWalk = (x, y) => (x === person.tx && y === person.ty)
        || (!world.isBlocked(x, y) && !(x === player.tx && y === player.ty));
      path = goals.length ? findPath(world.map.width, world.map.height, person.tx, person.ty, goals, canWalk) : null;
    }
    if (!path) {
      story.warnOnce(`move-path:${cmd.move}`, `Story: "${cmd.move}" has no way to walk there`);
      return;
    }
    await story.people.walk(person, path, Number(story.value(cmd.speed, ctx)) || undefined);
  },

  face(cmd, ctx, story) {
    const person = personFor(story, cmd.face, ctx, 'face');
    const player = playerOf(story);
    if (!person) return;
    story.people.direct(person);
    person.dir = cmd.dir === 'player' && player ? facePlayer(person, player) : Number(story.value(cmd.dir, ctx)) || 0;
  },

  /* stand someone on a tile at once: { place: id, at: [x, y] | { player: [dx, dy] }, dir } */
  place(cmd, ctx, story) {
    const person = personFor(story, cmd.place, ctx, 'place');
    const [goal] = goalsOf(cmd.at, story, ctx);
    if (!person || !goal) return;
    story.people.direct(person);
    person.away = false;
    const player = playerOf(story);
    const [x, y] = openTile(story.world, goal[0], goal[1]);
    person.placeAt(x, y, person.dir);
    if (cmd.dir != null && cmd.dir !== 'player') person.dir = Number(story.value(cmd.dir, ctx)) || 0;
    else if (player) person.dir = facePlayer(person, player);
  },

  spawn(cmd, ctx, story) {
    const at = cmd.at || {};
    story.saved.spawned[cmd.spawn] = { map: at.map, x: at.x, y: at.y, dir: at.dir || 0 };
    const world = story.world;
    if (!world || world.map.id !== at.map) return;
    const person = story.people.find(cmd.spawn) || story.people.adopt(story.library.people.get(cmd.spawn), at);
    if (!person) {
      story.warnOnce(`spawn:${cmd.spawn}`, `Story: "${cmd.spawn}" cannot appear: nobody of that id is known`);
      return;
    }
    story.people.direct(person);
    person.away = false;
    const [x, y] = openTile(world, at.x, at.y);
    person.placeAt(x, y, at.dir || 0);
  },

  remove(cmd, ctx, story) {
    delete story.saved.spawned[cmd.remove];
    const person = story.people.find(cmd.remove);
    if (person) story.people.drop(person);
  },
};

