/*
 * MirrorField.js  (engine: features)
 * Job: the rules of a beam-and-mirrors puzzle, with no picture and no world: a source on a tile sends a beam one
 * way; mirrors on tiles lean one of two ways ('/' or '\') and turn the beam a quarter; using a mirror swings it to
 * the other lean. The beam runs over the ground tile by tile until it reaches the target from the right side, or
 * leaves the map, or comes back on itself (it then stops). It also proves a puzzle fair before it ships.
 *
 * Public API:
 *   SIDES                      ['up', 'right', 'down', 'left'] (0 to 3)
 *   class MirrorField
 *     constructor(def)         def: { source: { x, y, out }, target: { x, y, in }, mirrors: [{ id, x, y, lean }] }
 *                              out: the side the beam leaves the source by; in: the side of the target it must
 *                              arrive at; lean 0 '/', 1 '\'
 *     mirrors, source, target  the cleaned-up definition;  state: the lean of each mirror (copy it to save it)
 *     load(state), reset()
 *     mirrorAt(x, y)           index or -1;  partAt(x, y): 'source' | 'target' | 'mirror' | null
 *     turn(index)              swing that mirror to its other lean
 *     beam(inside)             { path: [[x, y], ...] tiles the beam crosses, from the source on, hits: [mirror indices
 *                              in order], reached }   inside(x, y): the map (default: 0..99 both ways)
 *   checkMirrorField(def, { walkable, start, inside })
 *                              every part on open ground, one to a tile; the player can stand next to every mirror;
 *                              some leaning of the mirrors brings the beam to the target; it does not at the start.
 *                              Returns a list of problems (empty: fair), with `steps` the fewest swings that solve it
 */

export const SIDES = Object.freeze(['up', 'right', 'down', 'left']);
const STEP = [[0, -1], [1, 0], [0, 1], [-1, 0]];
/* '/' turns right to up, up to right, left to down, down to left; '\' the other way round */
const TURN = [[1, 0, 3, 2], [3, 2, 1, 0]];

function sideOf(name) {
  if (Number.isInteger(name) && name >= 0 && name < 4) return name;
  const i = SIDES.indexOf(name);
  return i;
}

export class MirrorField {
  state = [];

  constructor(def = {}) {
    const src = def.source || {};
    const tgt = def.target || {};
    this.source = { x: src.x, y: src.y, out: sideOf(src.out) };
    this.target = { x: tgt.x, y: tgt.y, in: sideOf(tgt.in) };
    this.mirrors = (Array.isArray(def.mirrors) ? def.mirrors : []).filter(Boolean)
      .map((m, i) => ({ id: m.id != null ? String(m.id) : String(i), x: m.x, y: m.y, lean: m.lean === 1 ? 1 : 0 }));
    this.reset();
  }

  reset() {
    this.state = this.mirrors.map((m) => m.lean);
  }

  load(state) {
    if (!Array.isArray(state) || state.length !== this.mirrors.length) return;
    this.state = state.map((v) => (v === 1 ? 1 : 0));
  }

  mirrorAt(x, y) {
    return this.mirrors.findIndex((m) => m.x === x && m.y === y);
  }

  partAt(x, y) {
    if (this.source.x === x && this.source.y === y) return 'source';
    if (this.target.x === x && this.target.y === y) return 'target';
    return this.mirrorAt(x, y) >= 0 ? 'mirror' : null;
  }

  turn(index) {
    if (index < 0 || index >= this.state.length) return -1;
    this.state[index] = this.state[index] ? 0 : 1;
    return this.state[index];
  }

  beam(inside, state = this.state) {
    const within = typeof inside === 'function' ? inside : (x, y) => x >= 0 && y >= 0 && x < 100 && y < 100;
    const path = [];
    const hits = [];
    let { x, y } = this.source;
    let dir = this.source.out;
    const seen = new Set();
    if (dir < 0) return { path, hits, reached: false };
    for (let guard = 0; guard < 10000; guard++) {
      x += STEP[dir][0];
      y += STEP[dir][1];
      if (!within(x, y)) break;
      const key = `${x},${y},${dir}`;
      if (seen.has(key)) break;
      seen.add(key);
      path.push([x, y]);
      if (x === this.target.x && y === this.target.y) return { path, hits, reached: (dir + 2) % 4 === this.target.in };
      if (x === this.source.x && y === this.source.y) break;
      const m = this.mirrorAt(x, y);
      if (m >= 0) {
        hits.push(m);
        dir = TURN[state[m] ? 1 : 0][dir];
      }
    }
    return { path, hits, reached: false };
  }
}

export function checkMirrorField(def, { walkable, start, inside } = {}) {
  const problems = [];
  const field = new MirrorField(def);
  const { mirrors, source, target } = field;
  if (!mirrors.length) problems.push('no mirrors');
  if (source.out < 0) problems.push('the source has no side to send the beam out of');
  if (target.in < 0) problems.push('the target has no side to take the beam in');
  if (!start || !walkable) return problems.concat('no start or walkable test given');
  const parts = [['source', source], ['target', target], ...mirrors.map((m) => [`mirror ${m.id}`, m])];
  const taken = new Map();
  for (const [name, part] of parts) {
    if (!Number.isInteger(part.x) || !Number.isInteger(part.y)) {
      problems.push(`${name} has no tile`);
      continue;
    }
    if (!walkable(part.x, part.y)) problems.push(`${name} at ${part.x},${part.y} is not on open ground`);
    const key = `${part.x},${part.y}`;
    if (taken.has(key)) problems.push(`${name} and ${taken.get(key)} share the tile ${key}`);
    taken.set(key, name);
  }
  if (problems.length) return problems;
  const free = (x, y) => walkable(x, y) && !taken.has(`${x},${y}`);
  if (!free(start[0], start[1])) problems.push('the start is not open ground');
  const seen = new Set([`${start[0]},${start[1]}`]);
  const todo = [start];
  while (todo.length) {
    const [x, y] = todo.pop();
    for (const [dx, dy] of STEP) {
      const key = `${x + dx},${y + dy}`;
      if (seen.has(key) || !free(x + dx, y + dy)) continue;
      seen.add(key);
      todo.push([x + dx, y + dy]);
    }
  }
  mirrors.forEach((m) => {
    if (!STEP.some(([dx, dy]) => seen.has(`${m.x + dx},${m.y + dy}`))) problems.push(`mirror ${m.id} at ${m.x},${m.y} cannot be reached to turn it`);
  });
  if (field.beam(inside).reached) problems.push('the beam reaches the target at the start');
  /* every leaning (two each): the fewest swings from the start that bring the beam home */
  const n = mirrors.length;
  if (n > 16) return problems.concat('too many mirrors to prove');
  const startState = field.state.slice();
  let best = Infinity;
  for (let mask = 0; mask < 1 << n; mask++) {
    const state = startState.map((v, i) => ((mask >> i) & 1 ? 1 - v : v));
    if (!field.beam(inside, state).reached) continue;
    let swings = 0;
    for (let i = 0; i < n; i++) if ((mask >> i) & 1) swings++;
    best = Math.min(best, swings);
  }
  if (!Number.isFinite(best)) problems.push('no leaning of the mirrors brings the beam to the target');
  else problems.steps = best;
  return problems;
}

