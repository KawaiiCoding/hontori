/*
 * WatcherField.js  (engine: features)
 * Job: the rules of a sneaking puzzle, with no picture and no world: watchers walk set loops tile by tile, each
 * throwing a cone of light ahead of it; the player must cross from a start to a goal without standing in a cone,
 * except on a shadow tile, where nobody is seen. It also proves a puzzle fair before it ships.
 *
 * Time runs in steps: a watcher of speed s moves s tiles each step (a step is one second in the world). A path is a
 * list of points joined by straight lines; the walk loops back to the first point (two points: there and back).
 * The cone of a watcher facing a way is `reach` tiles long and widens by one tile to each side every two tiles:
 * rows 1 and 2 are one tile wide, rows 3 and 4 three, and so on. The watcher's own tile is seen too.
 *
 * Public API:
 *   class WatcherField
 *     constructor(def)        def: { start: [x, y], goal: { x: [x0, x1], y: [y0, y1] } | [x, y], shadows: [[x, y]],
 *                             watchers: [{ path: [[x, y], ...], speed, reach }] }
 *     watchers                [{ tiles: [[x, y]...] (the loop tile by tile), dirs (the way it faces on each), speed,
 *                             reach, period (steps for one loop) }]
 *     start, shadows (a Set of "x,y"), period (steps until every watcher is back where it began)
 *     at(i, step)             { x, y, dir } of watcher i at that step (dir: 0 up, 1 right, 2 down, 3 left)
 *     sees(x, y, step)        the index of a watcher whose cone holds that tile (a shadow is never seen), or -1
 *     cone(i, step)           [[x, y], ...] the tiles of that watcher's cone (its own tile first)
 *     inGoal(x, y), isShadow(x, y)
 *   checkWatcherField(def, { walkable })
 *     the start, the goal and the shadows are open ground and the start is never seen; from the start, walking one
 *     tile a step (or waiting), the goal can be reached unseen; and from every shadow the player can reach, too
 *     (a caught player goes back to the last shadow, and may wait there for any moment). The player is never
 *     faster than one tile a step here, which is slower than in the world. Returns problems (empty: fair), with
 *     `steps` the fewest steps from the start.
 */

const STEP = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const PROOF_LIMIT = 600000;

function dirOf(a, b) {
  const dx = Math.sign(b[0] - a[0]);
  const dy = Math.sign(b[1] - a[1]);
  if (dy < 0) return 0;
  if (dx > 0) return 1;
  if (dy > 0) return 2;
  return 3;
}

function gcd(a, b) {
  return b ? gcd(b, a % b) : a;
}

function loopOf(points) {
  const pts = (Array.isArray(points) ? points : []).filter((p) => Array.isArray(p) && Number.isInteger(p[0]) && Number.isInteger(p[1]));
  if (pts.length < 2) return pts.length ? { tiles: [pts[0]], dirs: [2] } : { tiles: [], dirs: [] };
  const tiles = [];
  const dirs = [];
  for (let k = 0; k < pts.length; k++) {
    const a = pts[k];
    const b = pts[(k + 1) % pts.length];
    const d = dirOf(a, b);
    let [x, y] = a;
    const guard = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
    for (let n = 0; n < guard; n++) {
      tiles.push([x, y]);
      dirs.push(d);
      x += Math.sign(b[0] - x);
      if (x === b[0]) y += Math.sign(b[1] - y);
    }
  }
  return { tiles, dirs };
}

export class WatcherField {
  constructor(def = {}) {
    this.start = Array.isArray(def.start) ? [def.start[0], def.start[1]] : null;
    const goal = def.goal || {};
    if (Array.isArray(goal)) this.goal = { x: [goal[0], goal[0]], y: [goal[1], goal[1]] };
    else this.goal = { x: [].concat(goal.x), y: [].concat(goal.y) };
    if (this.goal.x.length === 1) this.goal.x.push(this.goal.x[0]);
    if (this.goal.y.length === 1) this.goal.y.push(this.goal.y[0]);
    this.shadows = new Set((Array.isArray(def.shadows) ? def.shadows : []).map(([x, y]) => `${x},${y}`));
    this.watchers = (Array.isArray(def.watchers) ? def.watchers : []).filter(Boolean).map((w) => {
      const { tiles, dirs } = loopOf(w.path);
      const speed = Math.max(1, Math.round(Number(w.speed) || 1));
      return { tiles, dirs, speed, reach: Math.max(1, Math.round(Number(w.reach) || 3)), period: Math.max(1, tiles.length / gcd(tiles.length, speed)) };
    });
    this.period = this.watchers.reduce((l, w) => (l * w.period) / gcd(l, w.period), 1);
  }

  at(i, step) {
    const w = this.watchers[i];
    if (!w || !w.tiles.length) return null;
    const k = (((step * w.speed) % w.tiles.length) + w.tiles.length) % w.tiles.length;
    return { x: w.tiles[k][0], y: w.tiles[k][1], dir: w.dirs[k] };
  }

  cone(i, step) {
    const p = this.at(i, step);
    if (!p) return [];
    const w = this.watchers[i];
    const [fx, fy] = STEP[p.dir];
    const sx = -fy;
    const sy = fx;
    const out = [[p.x, p.y]];
    for (let k = 1; k <= w.reach; k++) {
      const half = Math.floor((k - 1) / 2);
      for (let s = -half; s <= half; s++) out.push([p.x + fx * k + sx * s, p.y + fy * k + sy * s]);
    }
    return out;
  }

  isShadow(x, y) {
    return this.shadows.has(`${x},${y}`);
  }

  inGoal(x, y) {
    return x >= this.goal.x[0] && x <= this.goal.x[1] && y >= this.goal.y[0] && y <= this.goal.y[1];
  }

  sees(x, y, step) {
    if (this.isShadow(x, y)) return -1;
    for (let i = 0; i < this.watchers.length; i++) {
      for (const [cx, cy] of this.cone(i, step)) if (cx === x && cy === y) return i;
    }
    return -1;
  }
}

/* breadth-first over (tile, moment): one tile a step or a wait, never seen on arrival */
function search(field, walkable, from, phases) {
  const L = field.period;
  const seen = new Set();
  const todo = [];
  for (const t of phases) {
    const key = `${from[0]},${from[1]},${t % L}`;
    if (!seen.has(key)) {
      seen.add(key);
      todo.push([from[0], from[1], t % L, 0]);
    }
  }
  for (let head = 0; head < todo.length; head++) {
    const [x, y, t, n] = todo[head];
    if (field.inGoal(x, y)) return n;
    if (seen.size > PROOF_LIMIT) return -2;
    const next = (t + 1) % L;
    for (const [dx, dy] of [[0, 0], ...STEP]) {
      const nx = x + dx;
      const ny = y + dy;
      if ((dx || dy) && !walkable(nx, ny)) continue;
      if (field.sees(nx, ny, next) >= 0) continue;
      const key = `${nx},${ny},${next}`;
      if (seen.has(key)) continue;
      seen.add(key);
      todo.push([nx, ny, next, n + 1]);
    }
  }
  return -1;
}

export function checkWatcherField(def, { walkable } = {}) {
  const problems = [];
  const field = new WatcherField(def);
  if (!field.start) problems.push('no start');
  if (!field.watchers.length || field.watchers.some((w) => !w.tiles.length)) problems.push('a watcher has no path');
  if (!walkable) return problems.concat('no walkable test given');
  if (problems.length) return problems;
  const [sx, sy] = field.start;
  if (!walkable(sx, sy)) problems.push(`the start ${sx},${sy} is not open ground`);
  for (const key of field.shadows) if (!walkable(...key.split(',').map(Number))) problems.push(`the shadow ${key} is not open ground`);
  let goalOpen = false;
  for (let x = field.goal.x[0]; x <= field.goal.x[1]; x++) for (let y = field.goal.y[0]; y <= field.goal.y[1]; y++) if (walkable(x, y)) goalOpen = true;
  if (!goalOpen) problems.push('the goal has no open ground');
  for (let t = 0; t < field.period; t++) if (field.sees(sx, sy, t) >= 0) {
    problems.push(`the start is seen at step ${t}`);
    break;
  }
  if (problems.length) return problems;
  const best = search(field, walkable, field.start, [0]);
  if (best === -2) return problems.concat('the search grew too large to prove it');
  if (best < 0) return problems.concat('the goal cannot be reached unseen from the start');
  problems.steps = best;
  /* every shadow the player can stand in: the goal is still reachable from there (waiting is always safe) */
  for (const key of field.shadows) {
    const [x, y] = key.split(',').map(Number);
    const n = search(field, walkable, [x, y], Array.from({ length: Math.min(field.period, 64) }, (v, i) => i));
    if (n === -1) problems.push(`from the shadow ${key} the goal cannot be reached unseen`);
  }
  return problems;
}
