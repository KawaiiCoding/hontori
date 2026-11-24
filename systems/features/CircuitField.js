/*
 * CircuitField.js  (engine: features)
 * Job: the rules of a power-line puzzle, with no picture and no world: a source that sends power one way,
 * pieces of line on tiles that can be turned a quarter at a time, and a target that lights when the power
 * reaches it from the right side. Power runs from piece to piece wherever two open ends meet. It also proves
 * a puzzle fair before it ships.
 *
 * Public API:
 *   SIDES                        ['up', 'right', 'down', 'left'] (clockwise; a turn moves every end one step on)
 *   SHAPES                       { line, bend, tee, cross }: the open ends of each shape before it is turned
 *   class CircuitField
 *     constructor(def)           def: { source: { x, y, out: side }, target: { x, y, in: side },
 *                                       pieces: [{ x, y, shape, turn, fixed }] }
 *                                out: the side the power leaves the source by; in: the side of the target the
 *                                power must arrive at (a side name, or a direction number of core/units.js:
 *                                0 down, 1 up, 2 left, 3 right); turn: quarter turns at the start (0..3); fixed: cannot be turned
 *     state                      the turn of every piece (an array; copy it to save it)
 *     load(state), reset()
 *     pieces, source, target     the cleaned-up definition
 *     pieceAt(x, y)              the index of the piece on that tile, or -1
 *     partAt(x, y)               'source' | 'target' | 'piece' | null
 *     open(index)                the open sides of a piece as it is turned now (side indices)
 *     turn(index)                a quarter turn clockwise (nothing for a fixed piece); returns the new turn
 *     power()                    { lit: [true | false per piece], reached, path: [piece indices from the source
 *                                  to the target, in order, when reached] }
 *   checkCircuitField(def, { walkable, start })
 *                                every piece, the source and the target stand on open ground, one to a tile; the
 *                                player can stand next to every piece that can be turned; the target can be lit
 *                                (turns are free and cyclic, so it can then be lit from every state); it is not lit
 *                                at the start. Returns a list of problems (empty: fair), with `steps` the fewest
 *                                quarter turns that light it.
 */

export const SIDES = Object.freeze(['up', 'right', 'down', 'left']);
export const SHAPES = Object.freeze({ line: [0, 2], bend: [0, 1], tee: [0, 1, 2], cross: [0, 1, 2, 3] });
const STEP = [[0, -1], [1, 0], [0, 1], [-1, 0]];
const opposite = (side) => (side + 2) % 4;

/* a number is a direction of core/units.js (0 down, 1 up, 2 left, 3 right), as everywhere in the content */
const FROM_DIR = [2, 0, 3, 1];

function sideOf(name) {
  if (Number.isInteger(name) && name >= 0 && name < 4) return FROM_DIR[name];
  return SIDES.indexOf(name);
}

export class CircuitField {
  state = [];

  #pieces;
  #source;
  #target;

  constructor(def = {}) {
    const src = def.source || {};
    const tgt = def.target || {};
    this.#source = { x: src.x, y: src.y, out: sideOf(src.out) };
    this.#target = { x: tgt.x, y: tgt.y, in: sideOf(tgt.in) };
    this.#pieces = (Array.isArray(def.pieces) ? def.pieces : []).map((piece) => {
      const ends = SHAPES[piece && piece.shape] || SHAPES.line;
      const turn = Number.isInteger(piece.turn) ? ((piece.turn % 4) + 4) % 4 : 0;
      return { x: piece.x, y: piece.y, shape: SHAPES[piece.shape] ? piece.shape : 'line', ends, start: turn, fixed: !!piece.fixed };
    });
    this.reset();
  }

  get pieces() {
    return this.#pieces;
  }

  get source() {
    return this.#source;
  }

  get target() {
    return this.#target;
  }

  reset() {
    this.state = this.#pieces.map((piece) => piece.start);
  }

  load(state) {
    this.reset();
    if (!Array.isArray(state)) return;
    this.#pieces.forEach((piece, i) => {
      const n = state[i];
      if (!piece.fixed && Number.isInteger(n) && n >= 0 && n < 4) this.state[i] = n;
    });
  }

  pieceAt(x, y) {
    return this.#pieces.findIndex((piece) => piece.x === x && piece.y === y);
  }

  partAt(x, y) {
    if (this.#source.x === x && this.#source.y === y) return 'source';
    if (this.#target.x === x && this.#target.y === y) return 'target';
    return this.pieceAt(x, y) >= 0 ? 'piece' : null;
  }

  #openWith(index, turn) {
    const piece = this.#pieces[index];
    return piece ? piece.ends.map((end) => (end + turn) % 4) : [];
  }

  open(index) {
    return this.#openWith(index, this.state[index] || 0);
  }

  turn(index) {
    const piece = this.#pieces[index];
    if (!piece) return -1;
    if (!piece.fixed) this.state[index] = (this.state[index] + 1) % 4;
    return this.state[index];
  }

  power(state = this.state) {
    const lit = this.#pieces.map(() => false);
    const from = new Array(this.#pieces.length).fill(-1);
    const { x, y, out } = this.#source;
    const result = { lit, reached: false, path: [] };
    if (out < 0) return result;
    const first = this.pieceAt(x + STEP[out][0], y + STEP[out][1]);
    if (first < 0 || !this.#openWith(first, state[first]).includes(opposite(out))) return result;
    lit[first] = true;
    const queue = [first];
    let last = -1;
    while (queue.length) {
      const index = queue.shift();
      const piece = this.#pieces[index];
      for (const side of this.#openWith(index, state[index])) {
        const nx = piece.x + STEP[side][0];
        const ny = piece.y + STEP[side][1];
        if (nx === this.#target.x && ny === this.#target.y && this.#target.in === opposite(side)) {
          if (last < 0) last = index;
          continue;
        }
        const next = this.pieceAt(nx, ny);
        if (next < 0 || lit[next] || !this.#openWith(next, state[next]).includes(opposite(side))) continue;
        lit[next] = true;
        from[next] = index;
        queue.push(next);
      }
    }
    if (last >= 0) {
      result.reached = true;
      for (let at = last; at >= 0; at = from[at]) result.path.unshift(at);
    }
    return result;
  }
}

export function checkCircuitField(def, { walkable, start } = {}) {
  const problems = [];
  const field = new CircuitField(def);
  const { pieces, source, target } = field;
  if (!pieces.length) problems.push('no pieces');
  if (source.out < 0) problems.push('the source has no side to send power out of');
  if (target.in < 0) problems.push('the target has no side to take power in');
  if (!start || !walkable) return problems.concat('no start or walkable test given');
  const parts = [['source', source], ['target', target], ...pieces.map((piece, i) => [`piece ${i}`, piece])];
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
  (Array.isArray(def.pieces) ? def.pieces : []).forEach((piece, i) => {
    if (piece && !SHAPES[piece.shape]) problems.push(`piece ${i} has no known shape "${piece.shape}"`);
  });
  if (problems.length) return problems;

  /* where the player can walk: open ground that no part of the puzzle stands on */
  const free = (x, y) => walkable(x, y) && !taken.has(`${x},${y}`);
  const seen = new Set([`${start[0]},${start[1]}`]);
  const todo = [start];
  if (!free(start[0], start[1])) problems.push('the start is not open ground');
  while (todo.length) {
    const [x, y] = todo.pop();
    for (const [dx, dy] of STEP) {
      const key = `${x + dx},${y + dy}`;
      if (seen.has(key) || !free(x + dx, y + dy)) continue;
      seen.add(key);
      todo.push([x + dx, y + dy]);
    }
  }
  pieces.forEach((piece, i) => {
    if (piece.fixed) return;
    if (!STEP.some(([dx, dy]) => seen.has(`${piece.x + dx},${piece.y + dy}`))) problems.push(`piece ${i} at ${piece.x},${piece.y} cannot be reached to turn it`);
  });

  /* the fewest quarter turns that light the target: every simple path of pieces, each turned to fit */
  const startState = field.state.slice();
  if (field.power(startState).reached) problems.push('the target is lit at the start');
  const cost = (i, turn) => (pieces[i].fixed ? (turn === startState[i] ? 0 : Infinity) : (turn - startState[i] + 4) % 4);
  let best = Infinity;
  const used = new Set();
  const walk = (index, entry, spent) => {
    if (spent >= best) return;
    used.add(index);
    for (let turn = 0; turn < 4; turn++) {
      const c = cost(index, turn);
      if (!Number.isFinite(c) || spent + c >= best) continue;
      const ends = pieces[index].ends.map((end) => (end + turn) % 4);
      if (!ends.includes(entry)) continue;
      for (const side of ends) {
        if (side === entry) continue;
        const nx = pieces[index].x + STEP[side][0];
        const ny = pieces[index].y + STEP[side][1];
        if (nx === target.x && ny === target.y && target.in === opposite(side)) {
          best = Math.min(best, spent + c);
          continue;
        }
        const next = field.pieceAt(nx, ny);
        if (next >= 0 && !used.has(next)) walk(next, opposite(side), spent + c);
      }
    }
    used.delete(index);
  };
  const first = source.out >= 0 ? field.pieceAt(source.x + STEP[source.out][0], source.y + STEP[source.out][1]) : -1;
  if (first < 0) problems.push('no piece stands where the source sends its power');
  else walk(first, opposite(source.out), 0);
  if (!Number.isFinite(best)) problems.push('the target can never be lit');
  problems.steps = Number.isFinite(best) ? best : -1;
  return problems;
}
