/*
 * BrazierField.js  (engine: features)
 * Job: the rules of a lighting-in-order puzzle, with no picture and no world: a few braziers on tiles and the
 * order they must be lit in (shown somewhere in the world, by a carving). Lighting the next one in the order
 * keeps it lit; lighting any other puts every brazier out again, so the player starts over at once. When the
 * last one of the order is lit, the puzzle is solved. It also proves a puzzle fair before it ships.
 *
 * Public API:
 *   class BrazierField
 *     constructor(def)        def: { braziers: [{ id, x, y }], order: [id], carvings: [{ x, y, text }] }
 *     braziers, order, carvings   the cleaned-up definition
 *     lit                     the ids lit so far, in order (a copy; reset() puts them all out)
 *     reset()
 *     brazierAt(x, y)         the brazier on that tile, or null;  carvingAt(x, y): the carving, or null
 *     light(id)               'already' (it burns), 'lit' (the next one), 'solved' (the last one) or 'wrong'
 *                             (out of order: all go out)
 *   checkBrazierField(def, { walkable, start, canLight })
 *                           every brazier and carving stands on open ground, one to a tile; the order names every
 *                           brazier once; the player can stand next to every brazier and every carving; `canLight` (optional: () => problem text or null) says whether a
 *                           way to light one can always be had. Returns a list of problems (empty: fair), with
 *                           `steps` the number of braziers to light.
 */

const STEP = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export class BrazierField {
  #lit = [];

  constructor(def = {}) {
    this.braziers = (Array.isArray(def.braziers) ? def.braziers : [])
      .filter((b) => b && b.id != null)
      .map((b) => ({ id: String(b.id), x: b.x, y: b.y }));
    this.order = (Array.isArray(def.order) ? def.order : []).map(String);
    this.carvings = (Array.isArray(def.carvings) ? def.carvings : [])
      .filter(Boolean)
      .map((c) => ({ x: c.x, y: c.y, text: Array.isArray(c.text) ? c.text.slice() : c.text ? [c.text] : [] }));
  }

  get lit() {
    return this.#lit.slice();
  }

  isLit(id) {
    return this.#lit.includes(String(id));
  }

  reset() {
    this.#lit = [];
  }

  brazierAt(x, y) {
    return this.braziers.find((b) => b.x === x && b.y === y) || null;
  }

  carvingAt(x, y) {
    return this.carvings.find((c) => c.x === x && c.y === y) || null;
  }

  light(id) {
    const key = String(id);
    if (this.#lit.includes(key)) return 'already';
    if (this.order[this.#lit.length] !== key) {
      this.#lit = [];
      return 'wrong';
    }
    this.#lit.push(key);
    return this.#lit.length >= this.order.length ? 'solved' : 'lit';
  }
}

export function checkBrazierField(def, { walkable, start, canLight } = {}) {
  const problems = [];
  const field = new BrazierField(def);
  const { braziers, order, carvings } = field;
  if (!braziers.length) problems.push('no braziers');
  const ids = braziers.map((b) => b.id);
  if (new Set(ids).size !== ids.length) problems.push('two braziers share an id');
  if (order.length !== ids.length || !ids.every((id) => order.includes(id)) || new Set(order).size !== order.length) {
    problems.push('the order must name every brazier exactly once');
  }
  if (!carvings.length) problems.push('no carving shows the order');
  if (!start || !walkable) return problems.concat('no start or walkable test given');
  const parts = [...braziers.map((b) => [`brazier ${b.id}`, b]), ...carvings.map((c, i) => [`carving ${i}`, c])];
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
  for (const [name, part] of parts) {
    if (!STEP.some(([dx, dy]) => seen.has(`${part.x + dx},${part.y + dy}`))) problems.push(`${name} at ${part.x},${part.y} cannot be reached`);
  }
  if (typeof canLight === 'function') {
    const why = canLight();
    if (why) problems.push(why);
  }
  problems.steps = order.length;
  return problems;
}
