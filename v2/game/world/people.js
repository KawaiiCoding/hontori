/*
 * game/world/people.js
 * Job: everyone the content places on a map stands on that map, once. The maps of the current game
 * bring most people with them: a map person is a content person when the id is the same, else when
 * they stand on one of that person's places on the map, else when the look is the same. A matched map
 * person takes the content id (so the story finds them by id) and the content look once the painters
 * know it. A content person whom no map person matches is added to the map description at their
 * first place on it, so the story can direct them. Spawned people are left to the story's spawn command.
 *
 * Public API:
 *   addContentPeople(game)   at build, after the maps and the content are registered; returns the
 *                            ids added, as "<map>/<person>" (for a report)
 */

import { listed } from './common.js';

function placesOf(person) {
  const places = [];
  const add = (at, schedule) => {
    if (at && at.map) places.push(at);
    for (const slot of schedule || []) {
      if (slot.x == null) continue;
      places.push({ map: slot.map || (at && at.map) || (person.at && person.at.map), x: slot.x, y: slot.y, dir: slot.dir });
    }
  };
  add(person.at, person.schedule);
  for (const phase of person.phases || []) add(phase.at || person.at, phase.schedule);
  return places.filter((place) => place.map);
}

/* the map person is that content person: it takes their id, and their look once the painters know it */
function adopt(game, mapPerson, person) {
  mapPerson.id = person.id;
  let known = false;
  try {
    known = !!person.look && game.art.knowsLook(person.look);
  } catch (error) {
    known = false;
  }
  if (known) mapPerson.look = person.look;
}

export function addContentPeople(game) {
  const added = [];
  const byMap = new Map();
  for (const person of listed(game, 'people')) {
    if (!person || person.spawned || !person.id) continue;
    for (const place of placesOf(person)) {
      if (!byMap.has(place.map)) byMap.set(place.map, new Map());
      const here = byMap.get(place.map);
      if (!here.has(person.id)) here.set(person.id, { person, place });
    }
  }
  for (const [mapId, wanted] of byMap) {
    const map = game.registry.get('map', mapId);
    if (!map || !Array.isArray(map.people)) continue;
    const free = new Set(map.people);
    const missing = [];
    for (const entry of wanted.values()) {
      const same = map.people.find((p) => free.has(p) && p.id === entry.person.id);
      if (same) free.delete(same);
      else missing.push(entry);
    }
    for (const entry of missing) {
      const here = placesOf(entry.person).filter((place) => place.map === mapId);
      const same = map.people.find((p) => free.has(p) && here.some((place) => place.x === p.x && place.y === p.y))
        || map.people.find((p) => free.has(p) && p.look === entry.person.look);
      if (same) {
        free.delete(same);
        adopt(game, same, entry.person);
        continue;
      }
      const { person, place } = entry;
      const description = { id: person.id, look: person.look, x: place.x, y: place.y, dir: place.dir || 0 };
      if (person.fixed) description.fixed = true;
      if (person.idle) description.idle = person.idle;
      map.people.push(description);
      added.push(`${mapId}/${person.id}`);
    }
  }
  return added;
}
