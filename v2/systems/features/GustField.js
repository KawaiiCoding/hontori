/*
 * GustField.js  (engine: features)
 * Job: the rules of a wind-vane puzzle, with no picture and no world: vanes that turn through a list of
 * directions, gust zones whose wind blows the way their vane points, and a goal to reach. Inside a windy
 * zone the player may only step with the wind; stepping onto a windy tile carries the player along the
 * wind until they leave the zone or something stops them. It also proves a puzzle fair before it ships.
 *
 * Public API:
 *   DIRS                         { down: 0, up: 1, left: 2, right: 3 } (core/units.js directions)
 *   class GustField
 *     constructor(def)           def: { vanes: [{ x, y, turns: [dir name], start, gusts: [zone index or id] }],
 *                                       gusts: [{ id, x: [x0, x1], y: [y0, y1] }], goal: { x: [x0, x1], y: [y0, y1] } }
 *     state                      the turn index of every vane (an array; copy it to save it)
 *     load(state), reset()       set every vane from a saved list (bad entries fall back to start), or to start
 *     calm                       true: no wind anywhere (a solved puzzle can be crossed both ways)
 *     vaneAt(x, y)               the index of the vane standing on that tile, or -1
 *     turn(index)                the vane points the next way of its list; returns its new direction
 *     dirOf(index)               the direction a vane points (0..3)
 *     zoneAt(x, y)               the index of the gust zone covering that tile, or -1
 *     windAt(x, y)               the direction of the wind on that tile, or -1 where it is calm
 *     allows(fx, fy, tx, ty)     may the player step from one tile to the next (only the wind's rules: walls
 *                                and people are the world's business). Vane tiles never.
 *     carry(x, y, free)          the direction the wind pushes a player standing there, or -1; free(x, y)
 *                                says whether the next tile can be entered
 *     atGoal(x, y)
 *   checkGustField(def, { walkable, start, width, height, limit })
 *                                from every state the player can reach (any tile, any turn of the vanes) the
 *                                goal can still be reached, so nobody is ever trapped (vane turns are saved,
 *                                and a solved puzzle is calm both ways), and no wind loop carries a player
 *                                forever. Returns a list of problems (empty: fair).
 */

export const DIRS = Object.freeze({ down: 0, up: 1, left: 2, right: 3 });
const STEP = [[0, 1], [0, -1], [-1, 0], [1, 0]];
const CARRY_LIMIT = 64;

function dirOf(name) {
  if (Number.isInteger(name) && name >= 0 && name < 4) return name;
  return name in DIRS ? DIRS[name] : -1;
}

function inBox(box, x, y) {
  if (!box) return false;
  const [x0, x1] = Array.isArray(box.x) ? box.x : [box.x, box.x];
  const [y0, y1] = Array.isArray(box.y) ? box.y : [box.y, box.y];
  return x >= Math.min(x0, x1) && x <= Math.max(x0, x1) && y >= Math.min(y0, y1) && y <= Math.max(y0, y1);
}

export class GustField {
  calm = false;
  state = [];

  #vanes;
  #zones;
  #goal;
  #windOf;

  constructor(def = {}) {
    const zones = Array.isArray(def.gusts) ? def.gusts : [];
    this.#zones = zones;
    this.#goal = def.goal || null;
    this.#vanes = (Array.isArray(def.vanes) ? def.vanes : []).map((vane) => {
      const turns = (Array.isArray(vane.turns) ? vane.turns : []).map(dirOf).filter((d) => d >= 0);
      const gusts = (Array.isArray(vane.gusts) ? vane.gusts : [])
        .map((g) => (Number.isInteger(g) ? g : zones.findIndex((zone) => zone && zone.id === g)))
        .filter((g) => g >= 0 && g < zones.length);
      const start = Number.isInteger(vane.start) && vane.start >= 0 && vane.start < turns.length ? vane.start : 0;
      return { x: vane.x, y: vane.y, turns: turns.length ? turns : [0], gusts, start };
    });
    /* each zone listens to the first vane that names it */
    this.#windOf = zones.map((zone, index) => this.#vanes.findIndex((vane) => vane.gusts.includes(index)));
    this.reset();
  }

  get vanes() {
    return this.#vanes;
  }

  get zones() {
    return this.#zones;
  }

  reset() {
    this.state = this.#vanes.map((vane) => vane.start);
  }

  load(state) {
    this.reset();
    if (!Array.isArray(state)) return;
    this.#vanes.forEach((vane, i) => {
      const n = state[i];
      if (Number.isInteger(n) && n >= 0 && n < vane.turns.length) this.state[i] = n;
    });
  }

  vaneAt(x, y) {
    return this.#vanes.findIndex((vane) => vane.x === x && vane.y === y);
  }

  dirOf(index) {
    const vane = this.#vanes[index];
    return vane ? vane.turns[this.state[index] % vane.turns.length] : -1;
  }

  turn(index) {
    const vane = this.#vanes[index];
    if (!vane) return -1;
    this.state[index] = (this.state[index] + 1) % vane.turns.length;
    return this.dirOf(index);
  }

  zoneAt(x, y) {
    for (let i = 0; i < this.#zones.length; i++) if (inBox(this.#zones[i], x, y)) return i;
    return -1;
  }

  windAt(x, y) {
    if (this.calm) return -1;
    const zone = this.zoneAt(x, y);
    if (zone < 0) return -1;
    const vane = this.#windOf[zone];
    return vane < 0 ? -1 : this.dirOf(vane);
  }

  allows(fx, fy, tx, ty) {
    if (this.vaneAt(tx, ty) >= 0) return false;
    const wind = this.windAt(fx, fy);
    /* leaving a windy zone, or stepping inside a calm one, is always allowed */
    if (wind < 0 || this.zoneAt(tx, ty) < 0) return true;
    return tx - fx === STEP[wind][0] && ty - fy === STEP[wind][1];
  }

  carry(x, y, free) {
    const wind = this.windAt(x, y);
    if (wind < 0) return -1;
    const nx = x + STEP[wind][0];
    const ny = y + STEP[wind][1];
    if (this.vaneAt(nx, ny) >= 0) return -1;
    return !free || free(nx, ny) ? wind : -1;
  }

  atGoal(x, y) {
    return inBox(this.#goal, x, y);
  }
}

/* where the wind leaves a player who arrives on (x, y); null for a wind loop */
function settle(field, x, y, free) {
  const seen = new Set();
  let at = [x, y];
  for (let n = 0; n < CARRY_LIMIT; n++) {
    const key = at[0] * 4096 + at[1];
    if (seen.has(key)) return null;
    seen.add(key);
    const d = field.carry(at[0], at[1], free);
    if (d < 0) return at;
    at = [at[0] + STEP[d][0], at[1] + STEP[d][1]];
  }
  return null;
}

export function checkGustField(def, { walkable, start, limit = 200000 } = {}) {
  const problems = [];
  const field = new GustField(def);
  const vanes = field.vanes;
  if (!vanes.length) problems.push('no vanes');
  if (!def.goal) problems.push('no goal');
  if (!start || !walkable) return problems.concat('no start or walkable test given');
  vanes.forEach((vane, i) => {
    if (walkable(vane.x, vane.y)) return;
    problems.push(`vane ${i} at ${vane.x},${vane.y} is not on open ground`);
  });
  const free = (x, y) => walkable(x, y) && field.vaneAt(x, y) < 0;
  const sizes = vanes.map((vane) => vane.turns.length);
  const encode = (x, y, state) => `${x},${y}|${state.join('.')}`;
  const nodes = new Map();
  const edges = new Map();
  const queue = [];
  const startState = field.state.slice();
  const first = settle(field, start[0], start[1], free);
  if (!first) return problems.concat('the start is caught in a wind loop');
  const push = (x, y, state, from) => {
    const key = encode(x, y, state);
    if (from) edges.get(from).push(key);
    if (nodes.has(key)) return;
    nodes.set(key, { x, y, state });
    edges.set(key, []);
    queue.push(key);
  };
  push(first[0], first[1], startState, null);
  while (queue.length) {
    if (nodes.size > limit) return problems.concat('too many states to prove');
    const key = queue.shift();
    const { x, y, state } = nodes.get(key);
    field.load(state);
    for (let d = 0; d < 4; d++) {
      const tx = x + STEP[d][0];
      const ty = y + STEP[d][1];
      const vane = field.vaneAt(tx, ty);
      if (vane >= 0) {
        /* facing a vane: turn it */
        const next = state.slice();
        next[vane] = (next[vane] + 1) % sizes[vane];
        push(x, y, next, key);
        continue;
      }
      if (!free(tx, ty) || !field.allows(x, y, tx, ty)) continue;
      const end = settle(field, tx, ty, free);
      if (!end) {
        problems.push(`a wind loop at ${tx},${ty}`);
        continue;
      }
      push(end[0], end[1], state, key);
    }
  }
  /* which nodes can reach a goal tile, and which can reach the start tile (any vane state) */
  const reverse = new Map();
  for (const [from, list] of edges) for (const to of list) {
    if (!reverse.has(to)) reverse.set(to, []);
    reverse.get(to).push(from);
  }
  const reaching = (target) => {
    const ok = new Set();
    const todo = [];
    for (const [key, node] of nodes) if (target(node)) {
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
    return ok;
  };
  const toGoal = reaching((node) => field.atGoal(node.x, node.y));
  if (!toGoal.size) problems.push('the goal cannot be reached');
  let trapped = 0;
  for (const key of nodes.keys()) if (!toGoal.has(key)) {
    if (trapped++ < 3) problems.push(`trapped at ${key} (no way on to the goal)`);
  }
  if (trapped > 3) problems.push(`... ${trapped - 3} more trapped states`);
  return problems;
}
