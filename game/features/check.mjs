#!/usr/bin/env node
/*
 * check.mjs  (Hontori: features)
 * Job: prove every world puzzle of the content fair before it ships: the wind vanes (type "vanes"), the tide
 * wheels ("tide"), the power lines ("circuit") and the brazier courts ("braziers": every brazier and carving
 * can be reached, the order names each brazier once, and a way to light one can always be had). Each puzzle is checked on its own map as the content builds
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
import { checkBrazierField } from '../../systems/features/BrazierField.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '../..');
const PROVERS = { vanes: checkGustField, tide: checkTideField, circuit: checkCircuitField, braziers: checkBrazierField, push: checkPush };
const PUSH_LIMIT = 200000;

/* a push puzzle (world/PushPuzzle.js): every pile and pad on open ground, and from the start every pad can be
   covered. A best-first search runs over pushes (closest to covering first): a state is where the piles stand and which open area the player is in;
   the shut gate is a wall until then, and piles are kept within PUSH_REACH tiles of the room the piles and pads
   span (a solution found that way is a real one). Unsolved piles go back on entering the room, so a stuck state
   is always undone by leaving and coming back. With no start, the player starts beside the first pile. */
const PUSH_REACH = 4;
const PUSH_STEPS = [[0, 1], [0, -1], [1, 0], [-1, 0]];

function checkPush(def, { walkable, start }) {
  const problems = [];
  const boxes = (def.boxes || []).map(([x, y]) => [x, y]);
  const pads = (def.pads || []).map(([x, y]) => `${x},${y}`);
  const gate = Array.isArray(def.gate) ? `${def.gate[0]},${def.gate[1]}` : null;
  if (!boxes.length || !pads.length) return ['no piles or no pads'];
  if (boxes.length < pads.length) problems.push('fewer piles than pads');
  for (const [x, y] of boxes) if (!walkable(x, y)) problems.push(`pile at ${x},${y} is not on open ground`);
  for (const key of pads) if (!walkable(...key.split(',').map(Number))) problems.push(`pad at ${key} is not on open ground`);
  if (problems.length) return problems;
  const all = [...boxes, ...pads.map((k) => k.split(',').map(Number))];
  const box = {
    x0: Math.min(...all.map((q) => q[0])) - PUSH_REACH, x1: Math.max(...all.map((q) => q[0])) + PUSH_REACH,
    y0: Math.min(...all.map((q) => q[1])) - PUSH_REACH, y1: Math.max(...all.map((q) => q[1])) + PUSH_REACH,
  };
  const open = (x, y) => walkable(x, y) && `${x},${y}` !== gate;
  const inRoom = (x, y) => x >= box.x0 && x <= box.x1 && y >= box.y0 && y <= box.y1;
  let begin = def.puzzleStart || def.start || null;
  if (!begin) {
    const [bx, by] = boxes[0];
    const side = PUSH_STEPS.map(([dx, dy]) => [bx + dx, by + dy]).find(([x, y]) => open(x, y) && !boxes.some((q) => q[0] === x && q[1] === y));
    begin = side || start;
  }
  if (!begin) return ['no start'];
  /* the room itself can be walked into from the map's start */
  if (start && !(start[0] === begin[0] && start[1] === begin[1])) {
    const taken = new Set(boxes.map(([x, y]) => `${x},${y}`));
    const found = new Set([`${start[0]},${start[1]}`]);
    const walk = [start];
    while (walk.length) {
      const [x, y] = walk.pop();
      for (const [dx, dy] of PUSH_STEPS) {
        const key = `${x + dx},${y + dy}`;
        if (found.has(key) || taken.has(key) || !open(x + dx, y + dy)) continue;
        found.add(key);
        walk.push([x + dx, y + dy]);
      }
    }
    if (!found.has(`${begin[0]},${begin[1]}`)) return [`the piles cannot be reached from the map's start ${start[0]},${start[1]}`];
  }
  /* the tiles the player reaches without pushing, and the smallest of them (names the area) */
  const reach = (px, py, list) => {
    const taken = new Set(list.map(([x, y]) => `${x},${y}`));
    const seen = new Set([`${px},${py}`]);
    const todo = [[px, py]];
    let least = `${px},${py}`;
    while (todo.length) {
      const [x, y] = todo.pop();
      for (const [dx, dy] of PUSH_STEPS) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;
        if (seen.has(key) || taken.has(key) || !open(nx, ny) || !inRoom(nx, ny)) continue;
        seen.add(key);
        if (key < least) least = key;
        todo.push([nx, ny]);
      }
    }
    return { seen, least };
  };
  const done = (list) => pads.every((pad) => list.some(([x, y]) => `${x},${y}` === pad));
  const first = reach(begin[0], begin[1], boxes);
  const keyOf = (least, list) => `${least}|${list.map(([x, y]) => `${x},${y}`).sort().join(';')}`;
  const padXY = pads.map((k) => k.split(',').map(Number));
  /* how far the piles are from covering the pads: the search tries the closest states first */
  const guess = (list) => padXY.reduce((sum, [x, y]) => sum + Math.min(...list.map(([bx, by]) => Math.abs(bx - x) + Math.abs(by - y))), 0);
  const seen = new Set([keyOf(first.least, boxes)]);
  const heap = [];
  const pushHeap = (item) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const up = (i - 1) >> 1;
      if (heap[up][4] <= heap[i][4]) break;
      [heap[up], heap[i]] = [heap[i], heap[up]];
      i = up;
    }
  };
  const popHeap = () => {
    const top = heap[0];
    const last = heap.pop();
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][4] < heap[m][4]) m = l;
        if (r < heap.length && heap[r][4] < heap[m][4]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  const todo = { push: (item) => pushHeap([...item, item[3] + 3 * guess(item[2])]) };
  todo.push([begin[0], begin[1], boxes, 0]);
  while (heap.length) {
    const [px, py, list, pushes] = popHeap();
    if (done(list)) {
      problems.steps = pushes;
      return problems;
    }
    if (seen.size > PUSH_LIMIT) return ['the search grew too large to prove it'];
    const area = reach(px, py, list).seen;
    list.forEach(([bx, by], i) => {
      for (const [dx, dy] of PUSH_STEPS) {
        if (!area.has(`${bx - dx},${by - dy}`)) continue;
        const nx = bx + dx;
        const ny = by + dy;
        if (!open(nx, ny) || !inRoom(nx, ny) || list.some(([x, y]) => x === nx && y === ny)) continue;
        const next = list.map((q, j) => (j === i ? [nx, ny] : q));
        const key = keyOf(reach(bx, by, next).least, next);
        if (seen.has(key)) continue;
        seen.add(key);
        todo.push([bx, by, next, pushes + 1]);
      }
    });
  }
  return ['the pads can never all be covered from the start'];
}
/* the things any shop of the content sells (a way to light a brazier that needs one can always be had) */
const SOLD = new Set();

/* a brazier court is fair only if some way to light always holds: one with no condition, or one that needs a
   thing a shop sells (a hontori of the right element may not be carried) */
function canLight(def) {
  const ways = (def.light && Array.isArray(def.light.ways) ? def.light.ways : []).filter(Boolean);
  if (!ways.length) return null;
  const always = ways.some((way) => !way.if || (way.if.has && SOLD.has(way.if.has)));
  return always ? null : 'no way to light a brazier can always be had (none without a condition, none with a thing a shop sells)';
}

export function provePuzzle(def, map) {
  const prove = PROVERS[def && def.type];
  if (!prove) return [];
  if (!map) return [`no map "${def.map}"`];
  const walkable = (x, y) => x >= 0 && y >= 0 && x < map.w && y < map.h && !map.solid[y][x];
  const start = def.start || (map.spawn ? [map.spawn.x, map.spawn.y] : null);
  if ((def.type || 'push') === 'push') return checkPush(def, { walkable, start });
  return prove(def, { walkable, start, canLight: () => canLight(def) });
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
  for (const folder of await folders()) {
    Object.assign(puzzles, (folder && folder.puzzles) || {});
    for (const list of Object.values((folder && folder.goods) || {})) for (const good of Array.isArray(list) ? list : []) if (good && good.item) SOLD.add(good.item);
  }
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
    if (!def || !PROVERS[def.type || 'push']) continue;
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
