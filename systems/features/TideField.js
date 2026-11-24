/*
 * TideField.js  (engine: features)
 * Job: the rules of a water-level puzzle, with no picture and no world: basins of tiles that hold water,
 * wheels that open or close the sluice of a basin, and a goal to reach. An open basin drains: its water runs
 * into the basin it spills into (or out to sea when it spills nowhere), and on through every open basin below.
 * A closed basin holds whatever runs into it. A basin with water in it cannot be walked; a dry one can. So a
 * stair of pools is drained from the top down, and the water can be seen moving. It also proves a puzzle fair.
 *
 * Public API:
 *   class TideField
 *     constructor(def)        def: { basins: [{ id, x: [x0, x1], y: [y0, y1], start, spill }],
 *                                    wheels: [{ x, y, basin, open }], goal: { x: [x0, x1], y: [y0, y1] } }
 *                             start: 'high' (1, the default), 'low' (0) or a number of units of water;
 *                             spill: the id of the basin its water runs into (left out: the sea);
 *                             a wheel opens or closes its basin's sluice (open: true to start open)
 *     state                   [open (0 | 1) of every wheel ..., water of every basin ...] (copy it to save it)
 *     load(state), reset()    from a saved list (a list of another length falls back to the start), or to start
 *     low                     true: every basin is dry (a solved puzzle stays walkable both ways)
 *     wheels, basins          the cleaned-up definition
 *     wheelAt(x, y)           the index of the wheel standing on that tile, or -1
 *     basinAt(x, y)           the index of the basin covering that tile, or -1
 *     waterOf(basin)          the water in that basin now (0: dry)
 *     isOpen(wheel)           that wheel's sluice is open
 *     flooded(x, y)           that tile is under water now
 *     turn(index)             open or close that wheel's sluice; the water runs on at once
 *     wouldFlood(index, x, y) turning that wheel now would put the tile (x, y) under water
 *     atGoal(x, y)
 *   checkTideField(def, { walkable, start, limit })
 *                             from every state the player can reach (any tile, any sluices, any water) the
 *                             goal can still be reached, so nobody is ever trapped (a wheel that would flood
 *                             the kid's own tile does not turn). Wheels stand on open ground outside every
 *                             basin; basins do not overlap and do not spill in a ring; the start is dry. Returns
 *                             a list of problems (empty: fair) and, on `steps`, the fewest wheel turns needed.
 */

const STEP = [[0, 1], [0, -1], [-1, 0], [1, 0]];

function inBox(box, x, y) {
  if (!box) return false;
  const [x0, x1] = Array.isArray(box.x) ? box.x : [box.x, box.x];
  const [y0, y1] = Array.isArray(box.y) ? box.y : [box.y, box.y];
  return x >= Math.min(x0, x1) && x <= Math.max(x0, x1) && y >= Math.min(y0, y1) && y <= Math.max(y0, y1);
}

function unitsOf(start) {
  if (start === 'low') return 0;
  if (start === undefined || start === 'high') return 1;
  const n = Math.floor(Number(start));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export class TideField {
  low = false;
  state = [];

  #wheels;
  #basins;
  #goal;

  constructor(def = {}) {
    const raw = (Array.isArray(def.basins) ? def.basins : []).filter((b) => b && b.x !== undefined && b.y !== undefined);
    const ids = raw.map((b, i) => b.id ?? i);
    this.#basins = raw.map((b, i) => {
      const spill = b.spill === undefined || b.spill === null ? -1 : ids.indexOf(b.spill);
      return { id: ids[i], x: b.x, y: b.y, start: unitsOf(b.start), spill: spill === i ? -1 : spill, spillId: b.spill };
    });
    this.#goal = def.goal || null;
    this.#wheels = (Array.isArray(def.wheels) ? def.wheels : []).map((wheel) => ({
      x: wheel.x, y: wheel.y, basin: ids.indexOf(wheel.basin), basinId: wheel.basin, open: !!wheel.open,
    }));
    this.reset();
  }

  get wheels() {
    return this.#wheels;
  }

  get basins() {
    return this.#basins;
  }

  reset() {
    this.state = [...this.#wheels.map((wheel) => (wheel.open ? 1 : 0)), ...this.#basins.map((b) => b.start)];
    this.#settle(this.state);
  }

  load(state) {
    this.reset();
    const n = this.#wheels.length + this.#basins.length;
    if (!Array.isArray(state) || state.length !== n || !state.every((v) => Number.isInteger(v) && v >= 0)) return;
    this.state = state.map((v, i) => (i < this.#wheels.length ? (v ? 1 : 0) : v));
    this.#settle(this.state);
  }

  #open(basin, state) {
    for (let i = 0; i < this.#wheels.length; i++) if (this.#wheels[i].basin === basin && state[i]) return true;
    return false;
  }

  /* the water runs down through every open basin until it rests in a closed one or reaches the sea */
  #settle(state) {
    const w = this.#wheels.length;
    for (let pass = 0; pass <= this.#basins.length; pass++) {
      let moved = false;
      this.#basins.forEach((b, i) => {
        const water = state[w + i];
        if (!water || !this.#open(i, state)) return;
        state[w + i] = 0;
        if (b.spill >= 0) state[w + b.spill] += water;
        moved = true;
      });
      if (!moved) return;
    }
  }

  wheelAt(x, y) {
    return this.#wheels.findIndex((wheel) => wheel.x === x && wheel.y === y);
  }

  basinAt(x, y) {
    for (let i = 0; i < this.#basins.length; i++) if (inBox(this.#basins[i], x, y)) return i;
    return -1;
  }

  waterOf(basin) {
    if (this.low || basin < 0 || basin >= this.#basins.length) return 0;
    return this.state[this.#wheels.length + basin] || 0;
  }

  isOpen(index) {
    return !!this.state[index];
  }

  flooded(x, y) {
    return this.waterOf(this.basinAt(x, y)) > 0;
  }

  #turned(index, state) {
    const next = state.slice();
    next[index] = next[index] ? 0 : 1;
    this.#settle(next);
    return next;
  }

  turn(index) {
    if (!this.#wheels[index]) return -1;
    this.state = this.#turned(index, this.state);
    return this.state[index];
  }

  wouldFlood(index, x, y) {
    const basin = this.basinAt(x, y);
    if (!this.#wheels[index] || basin < 0 || this.low) return false;
    return this.#turned(index, this.state)[this.#wheels.length + basin] > 0;
  }

  atGoal(x, y) {
    return inBox(this.#goal, x, y);
  }
}

export function checkTideField(def, { walkable, start, limit = 200000 } = {}) {
  const problems = [];
  const field = new TideField(def);
  const { wheels, basins } = field;
  if (!wheels.length) problems.push('no wheels');
  if (!basins.length) problems.push('no basins');
  if (!def.goal) problems.push('no goal');
  if (!start || !walkable) return problems.concat('no start or walkable test given');
  (Array.isArray(def.basins) ? def.basins : []).forEach((b, i) => {
    if (!b || b.x === undefined || b.y === undefined) problems.push(`basin ${i} has no box`);
  });
  basins.forEach((b) => {
    if (b.spillId !== undefined && b.spillId !== null && b.spill < 0 && b.spillId !== b.id) problems.push(`basin ${b.id} spills into no basin "${b.spillId}"`);
    /* a ring of spills would carry the water round for ever */
    const seen = new Set();
    for (let at = b.spill; at >= 0; at = basins[at].spill) {
      if (seen.has(at)) {
        problems.push(`basin ${b.id} spills in a ring`);
        break;
      }
      seen.add(at);
    }
  });
  wheels.forEach((wheel, i) => {
    if (!walkable(wheel.x, wheel.y)) problems.push(`wheel ${i} at ${wheel.x},${wheel.y} is not on open ground`);
    if (field.basinAt(wheel.x, wheel.y) >= 0) problems.push(`wheel ${i} at ${wheel.x},${wheel.y} stands in a basin`);
    if (wheel.basin < 0) problems.push(`wheel ${i} names no basin "${wheel.basinId}"`);
  });
  basins.forEach((a, i) => basins.forEach((b, j) => {
    if (j <= i) return;
    const [ax0, ax1] = Array.isArray(a.x) ? a.x : [a.x, a.x];
    const [ay0, ay1] = Array.isArray(a.y) ? a.y : [a.y, a.y];
    for (let y = Math.min(ay0, ay1); y <= Math.max(ay0, ay1); y++) {
      for (let x = Math.min(ax0, ax1); x <= Math.max(ax0, ax1); x++) {
        if (inBox(b, x, y)) {
          problems.push(`basins ${a.id} and ${b.id} overlap at ${x},${y}`);
          return;
        }
      }
    }
  }));
  if (field.flooded(start[0], start[1])) problems.push('the start is under water');
  if (problems.length) return problems;

  const free = (x, y) => walkable(x, y) && field.wheelAt(x, y) < 0;
  const nodes = new Map();
  const edges = new Map();
  const queue = [];
  const push = (x, y, state, from, turns) => {
    const key = `${x},${y}|${state.join('.')}`;
    if (from) edges.get(from).push(key);
    if (nodes.has(key)) return;
    nodes.set(key, { x, y, state, turns });
    edges.set(key, []);
    queue.push(key);
  };
  push(start[0], start[1], field.state.slice(), null, 0);
  /* breadth first, so the first goal node found is reached with the fewest turns (steps cost nothing) */
  let steps = -1;
  while (queue.length) {
    if (nodes.size > limit) return problems.concat('too many states to prove');
    const key = queue.shift();
    const { x, y, state, turns } = nodes.get(key);
    field.load(state);
    if (steps < 0 && field.atGoal(x, y)) steps = turns;
    for (let d = 0; d < 4; d++) {
      const tx = x + STEP[d][0];
      const ty = y + STEP[d][1];
      const wheel = field.wheelAt(tx, ty);
      if (wheel >= 0) {
        if (field.wouldFlood(wheel, x, y)) continue;
        field.turn(wheel);
        push(x, y, field.state.slice(), key, turns + 1);
        field.load(state);
        continue;
      }
      if (!free(tx, ty) || field.flooded(tx, ty)) continue;
      push(tx, ty, state, key, turns);
    }
  }
  const reverse = new Map();
  for (const [from, list] of edges) for (const to of list) {
    if (!reverse.has(to)) reverse.set(to, []);
    reverse.get(to).push(from);
  }
  const ok = new Set();
  const todo = [];
  for (const [key, node] of nodes) if (field.atGoal(node.x, node.y)) {
    ok.add(key);
    todo.push(key);
  }
  while (todo.length) {
    const key = todo.pop();
    for (const from of reverse.get(key) || []) if (!ok.has(from)) {
      ok.add(from);
      todo.push(from);
    }
  }
  if (!ok.size) problems.push('the goal cannot be reached');
  let trapped = 0;
  for (const key of nodes.keys()) if (!ok.has(key)) {
    if (trapped++ < 3) problems.push(`trapped at ${key} (no way on to the goal)`);
  }
  if (trapped > 3) problems.push(`... ${trapped - 3} more trapped states`);
  problems.steps = steps;
  problems.states = nodes.size;
  return problems;
}
