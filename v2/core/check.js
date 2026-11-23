/*
 * check.js
 * Job: the content checker. In debug mode it reads every loaded map and reports what is wrong
 * with the data, so mistakes are found at load and not by playing.
 *
 * Public API:
 *   checkMaps(maps, art)   maps: TileMap objects; art: the game's art provider
 *        returns the problems as readable strings and prints them as one list in the console
 *
 * What it checks for each map:
 *   - every row has the map's width and every letter is in the legend
 *   - every legend entry is a tile the painters know
 *   - every prop and building has a known type and lies inside the map
 *   - every door leads to a map that exists and lands on a walkable tile there
 *   - the spawn point is walkable
 *   - every person has a unique id, a known look and a walkable tile of their own,
 *     also at every place their schedule sends them
 *   - no solid prop stands on a road tile, unless the art provider says it belongs there
 *   - nothing that is baked into the ground animates without being marked as animated
 */

export function checkMaps(maps, art) {
  const byId = new Map(maps.map((map) => [map.id, map]));
  const problems = [];
  for (const map of maps) {
    const report = (text) => problems.push(`${map.id}: ${text}`);
    checkGround(map, art, report);
    checkFixtures(map, art, report);
    checkDoors(map, byId, report);
    checkPeople(map, art, report);
    checkBaked(map, art, report);
  }
  if (problems.length) console.warn(`Content check: ${problems.length} problem(s)\n  ${problems.join('\n  ')}`);
  else console.log(`Content check: ${maps.length} maps, no problems`);
  return problems;
}

function checkGround(map, art, report) {
  const { rows, legend } = map.description;
  rows.forEach((row, y) => {
    if (row.length !== map.width) report(`row ${y} is ${row.length} tiles long, expected ${map.width}`);
    for (const letter of new Set(row)) if (!(letter in legend)) report(`row ${y} uses "${letter}", which is not in the legend`);
  });
  for (const [letter, tile] of Object.entries(legend)) {
    if (!art.knowsTile(map.indoor, tile)) report(`legend "${letter}" names the unknown tile "${tile}"`);
  }
  if (map.solidAt(map.spawn.x, map.spawn.y)) report(`the spawn point ${map.spawn.x},${map.spawn.y} is not walkable`);
}

function checkFixtures(map, art, report) {
  for (const prop of map.props) {
    const info = art.propInfo(prop.type);
    if (!info) {
      report(`unknown prop type "${prop.type}" at ${prop.x},${prop.y}`);
      continue;
    }
    if (!map.inside(prop.x, prop.y) || !map.inside(prop.x + info.fw - 1, prop.y + info.fh - 1)) {
      report(`prop ${prop.type} at ${prop.x},${prop.y} reaches outside the map`);
    }
    const blocksRoad = info.solid && !info.decor && !art.propBelongsOnRoad(prop.type);
    if (blocksRoad && art.tileIsRoad(map.indoor, map.tileAt(prop.x, prop.y))) report(`solid prop ${prop.type} stands on the road at ${prop.x},${prop.y}`);
  }
  for (const building of map.buildings) {
    const info = art.buildingInfo(building.type);
    if (!info) report(`unknown building type "${building.type}" at ${building.x},${building.y}`);
    else if (!map.inside(building.x, building.y) || !map.inside(building.x + info.fw - 1, building.y + info.fh - 1)) {
      report(`building ${building.type} at ${building.x},${building.y} reaches outside the map`);
    }
  }
}

function checkDoors(map, byId, report) {
  for (const door of map.doors) {
    const at = `door at ${door.x},${door.y}`;
    if (!map.inside(door.x, door.y)) report(`${at} lies outside the map`);
    const target = byId.get(door.to);
    if (!target) report(`${at} leads to "${door.to}", which does not exist`);
    else if (target.solidAt(door.tx, door.ty)) report(`${at} lands on ${door.to} ${door.tx},${door.ty}, which is not walkable`);
  }
}

function checkPeople(map, art, report) {
  const ids = new Set();
  const taken = new Map();
  const stand = (person, x, y, when) => {
    if (map.solidAt(x, y)) report(`${person.id} stands on ${x},${y}${when}, which is not walkable`);
  };
  for (const person of map.people) {
    if (ids.has(person.id)) report(`two people have the id "${person.id}"`);
    ids.add(person.id);
    if (!art.knowsLook(person.look)) report(`${person.id} has the unknown look "${person.look}"`);
    stand(person, person.x, person.y, '');
    const tile = `${person.x},${person.y}`;
    if (taken.has(tile)) report(`${person.id} and ${taken.get(tile)} stand on the same tile ${tile}`);
    taken.set(tile, person.id);
    for (const slot of person.schedule || []) {
      if (slot.x != null) stand(person, slot.x, slot.y, ` from ${slot.from}:00`);
    }
  }
}

function checkBaked(map, art, report) {
  for (const tile of new Set(Object.values(map.description.legend))) {
    if (!art.knowsTile(map.indoor, tile) || art.tileAnimates(map.indoor, tile)) continue;
    if (art.tileChangesOverTime(map.indoor, tile)) report(`tile "${tile}" animates but is baked as a fixed picture`);
  }
  for (const type of new Set(map.props.map((prop) => prop.type))) {
    const info = art.propInfo(type);
    if (!info || !info.decor || art.propAnimates(type)) continue;
    if (art.propChangesOverTime(type)) report(`decoration "${type}" animates but is baked as a fixed picture`);
  }
}
