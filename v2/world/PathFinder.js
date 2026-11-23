/*
 * PathFinder.js
 * Job: the shortest walk over the tile grid from one tile to the nearest of some goal tiles.
 *
 * Public API:
 *   findPath(width, height, fromX, fromY, goals, canWalk)
 *        goals: [[tx, ty], ...]; canWalk(tx, ty) -> boolean
 *        returns the tiles to step on, [[tx, ty], ...], without the start tile
 *        (empty if the start is a goal), or null if no goal can be reached
 */

import { DIR_STEP } from '../core/units.js';

const UNSEEN = -1;
const START = -2;

export function findPath(width, height, fromX, fromY, goals, canWalk) {
  const isGoal = new Uint8Array(width * height);
  for (const [tx, ty] of goals) isGoal[ty * width + tx] = 1;

  const cameFrom = new Int32Array(width * height).fill(UNSEEN);
  const queue = [fromY * width + fromX];
  cameFrom[queue[0]] = START;
  for (let head = 0; head < queue.length; head++) {
    const at = queue[head];
    if (isGoal[at]) return trace(cameFrom, at, width);
    const x = at % width;
    const y = (at - x) / width;
    for (const [dx, dy] of DIR_STEP) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const next = ny * width + nx;
      if (cameFrom[next] !== UNSEEN || !canWalk(nx, ny)) continue;
      cameFrom[next] = at;
      queue.push(next);
    }
  }
  return null;
}

function trace(cameFrom, goal, width) {
  const path = [];
  for (let at = goal; cameFrom[at] !== START; at = cameFrom[at]) {
    const x = at % width;
    path.unshift([x, (at - x) / width]);
  }
  return path;
}
