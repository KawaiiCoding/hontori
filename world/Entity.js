/*
 * Entity.js
 * Job: the base of everything that has a place in the world and is drawn in depth order.
 *
 * Public API:
 *   id            unique within its map
 *   x, y          position in map pixels; for things that stand, the point where they touch the ground
 *   visible       false hides it from drawing
 *   depth         drawing order: larger is nearer to the viewer (default: y)
 *   bounds        { left, top, right, bottom } of everything it paints, in map pixels; the view
 *                 skips an entity whose bounds are off screen
 *   update(dt, world)   one logic step (default: nothing)
 *   draw(ctx, art, env) paint it; must not throw and must not change game state
 */

export class Entity {
  visible = true;
  bounds = { left: 0, top: 0, right: 0, bottom: 0 };

  constructor(id, x = 0, y = 0) {
    this.id = id;
    this.x = x;
    this.y = y;
  }

  get depth() {
    return this.y;
  }

  update() {}

  draw() {}
}
