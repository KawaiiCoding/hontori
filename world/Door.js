/*
 * Door.js
 * Job: one doorway of a map: the tile that is the door and where stepping on it leads.
 *
 * Public API:
 *   new Door({ x, y, to, tx, ty, dir })
 *   x, y          the door tile on its own map
 *   to            id of the map it leads to
 *   tx, ty, dir   the tile and facing the walker arrives with
 */

export class Door {
  constructor({ x, y, to, tx, ty, dir = 0 }) {
    this.x = x;
    this.y = y;
    this.to = to;
    this.tx = tx;
    this.ty = ty;
    this.dir = dir;
    Object.freeze(this);
  }
}
