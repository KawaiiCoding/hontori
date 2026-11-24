#!/usr/bin/env node
/*
 * check.mjs  (Hontori: features)
 * Job: prove every world puzzle of the content fair before it ships: the wind vanes (type "vanes"), the tide
 * wheels ("tide") and the power lines ("circuit"). Each puzzle is checked on its own map as the content builds
 * it (solid ground, props and buildings), from its `start` tile (else the map's spawn), with the engine's
 * provers (systems/features: checkGustField, checkTideField, checkCircuitField): from every state the player
 * can reach, the goal can still be reached, and nothing stands on water or walls.
 *   node game/features/check.mjs                 every content folder the game loads
 *   node game/features/check.mjs fixture.mjs     also the puzzles of a test module that exports
 *                                                { maps: [content map], puzzles: { id: puzzle } }
 * Exit code 1 when a puzzle is not fair.
 *
 * Public API: provePuzzle(def, map) -> problems (with `steps`, the fewest turns, when known)
 *   map: { w, h, solid: [[bool]] , spawn: { x, y } }
 */

import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { checkGustField } from '../../systems/features/GustField.js';
import { checkTideField } from '../../systems/features/TideField.js';
import { checkCircuitField } from '../../systems/features/CircuitField.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '../..');
const PROVERS = { vanes: checkGustField, tide: checkTideField, circuit: checkCircuitField };

export function provePuzzle(def, map) {
  const prove = PROVERS[def && def.type];
  if (!prove) return [];
  if (!map) return [`no map "${def.map}"`];
  const walkable = (x, y) => x >= 0 && y >= 0 && x < map.w && y < map.h && !map.solid[y][x];
  const start = def.start || (map.spawn ? [map.spawn.x, map.spawn.y] : null);
  return prove(def, { walkable, start });
}

/* the content folders the game loads, and any chapter folder written since */
async function folders() {
  const { ORDER, loadFolders } = await import(pathToFileURL(path.join(ROOT, 'content/check.mjs')).href);
  const list = await loadFolders();
  for (const name of fs.readdirSync(path.join(ROOT, 'content'))) {
    if (ORDER.includes(name) || !/^ch\d+$/.test(name) || !fs.existsSync(path.join(ROOT, 'content', name, 'index.js'))) continue;
    try {
      list.push((await import(pathToFileURL(path.join(ROOT, 'content', name, 'index.js')).href)).default);
    } catch (error) {
      console.log(`note: content/${name} could not be loaded (${error.message})`);
    }
  }
  return list;
}

async function main(extra) {
  const { loadWorld } = await import(pathToFileURL(path.join(ROOT, 'content/check.mjs')).href);
  const { MAP_FOLDERS, buildMap } = await import(pathToFileURL(path.join(ROOT, 'game/maps/index.js')).href);
  const mapFolders = MAP_FOLDERS.slice();
  /* chapter maps written since the loader's list was last joined up */
  for (const name of fs.readdirSync(path.join(ROOT, 'content'))) {
    const file = path.join(ROOT, 'content', name, 'maps', 'index.js');
    if (!/^ch\d+$/.test(name) || !fs.existsSync(file)) continue;
    try {
      const folder = (await import(pathToFileURL(file).href)).default;
      if (folder && !mapFolders.includes(folder)) mapFolders.push(folder);
    } catch (error) {
      console.log(`note: content/${name}/maps could not be loaded (${error.message})`);
    }
  }
  const puzzles = {};
  for (const folder of await folders()) Object.assign(puzzles, (folder && folder.puzzles) || {});
  for (const file of extra) {
    const fixture = (await import(pathToFileURL(path.resolve(file)).href)).default;
    mapFolders.push({ maps: fixture.maps || [], text: fixture.text || {} });
    Object.assign(puzzles, fixture.puzzles || {});
  }
  const data = mapFolders.flatMap((folder) => (folder.maps || []).map((m) => buildMap(m, folder.text)));
  const world = loadWorld(undefined, data, mapFolders.flatMap((folder) => folder.links || []));
  if (!world) {
    console.log('PROBLEM: the world could not be loaded from src/');
    return 1;
  }
  const spawns = Object.fromEntries(data.map((m) => [m.id, m.spawn]));
  let bad = 0;
  let count = 0;
  for (const [id, def] of Object.entries(puzzles)) {
    if (!def || !PROVERS[def.type]) continue;
    count++;
    const map = world.maps[def.map] ? { ...world.maps[def.map], spawn: spawns[def.map] } : null;
    const problems = provePuzzle(def, map);
    if (problems.length) {
      bad++;
      problems.forEach((p) => console.log(`PROBLEM: puzzle ${id} (${def.type}, ${def.map}): ${p}`));
    } else console.log(`fair: puzzle ${id} (${def.type}, ${def.map})${problems.steps >= 0 ? `, solved in ${problems.steps} turns at least` : ''}`);
  }
  console.log(bad ? `${bad} of ${count} puzzle(s) not fair.` : `All ${count} puzzle(s) fair.`);
  return bad ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exit(await main(process.argv.slice(2)));
}
