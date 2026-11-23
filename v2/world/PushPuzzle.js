/*
 * PushPuzzle.js
 * Job: the rules of a push puzzle on a map, with no drawing: piles that the player pushes one tile
 * by walking into them, pads that want a pile each, and a gate tile that stays shut until every
 * pad holds a pile. Pure logic; the game decides what solving means and how it looks.
 *
 * Public API:
 *   new PushPuzzle({ boxes: [[x, y]], pads: [[x, y]], gate: [x, y] | null })
 *   boxes                    [{ x, y }] where each pile stands now
 *   pads, gate               as given
 *   reset()                  every pile back to its first tile
 *   boxAt(x, y)              the pile on that tile, or null
 *   onPad(x, y)              is that tile a pad
 *   covered()                does every pad hold a pile
 *   blocks(x, y, solved)     does this tile refuse a step: a pile, or the gate while unsolved
 *   push(x, y, dx, dy, isFree)   push the pile on (x, y) one tile along (dx, dy) if isFree(x2, y2)
 *        says the tile beyond is open and no pile or shut gate is there. Returns null when nothing
 *        moved, else { box, onPad, covered }
 */

export class PushPuzzle {
  boxes = [];

  constructor({ boxes = [], pads = [], gate = null } = {}) {
    this.start = boxes.map(([x, y]) => [x, y]);
    this.pads = pads.map(([x, y]) => [x, y]);
    this.gate = Array.isArray(gate) ? [gate[0], gate[1]] : null;
    this.reset();
  }

  reset() {
    this.boxes = this.start.map(([x, y]) => ({ x, y }));
  }

  boxAt(x, y) {
    return this.boxes.find((box) => box.x === x && box.y === y) || null;
  }

  onPad(x, y) {
    return this.pads.some(([px, py]) => px === x && py === y);
  }

  covered() {
    return this.pads.every(([x, y]) => !!this.boxAt(x, y));
  }

  #isGate(x, y) {
    return !!this.gate && this.gate[0] === x && this.gate[1] === y;
  }

  blocks(x, y, solved) {
    if (solved) return false;
    return this.#isGate(x, y) || !!this.boxAt(x, y);
  }

  push(x, y, dx, dy, isFree) {
    const box = this.boxAt(x, y);
    if (!box || (!dx && !dy)) return null;
    const nx = x + dx;
    const ny = y + dy;
    if (this.boxAt(nx, ny) || this.#isGate(nx, ny) || !isFree(nx, ny)) return null;
    box.x = nx;
    box.y = ny;
    return { box, onPad: this.onPad(nx, ny), covered: this.covered() };
  }
}
