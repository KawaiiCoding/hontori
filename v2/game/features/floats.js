/*
 * floats.js  (Hontori: features)
 * Job: one world layer for the things the features show over the world for a moment: the great spirit of
 * the sight test, the fire hontori coming down the chimney, the glowing hook on the water. Each is a small
 * painter that works out its picture from the time, so drawing changes nothing.
 *
 * Public API:
 *   installFloats(game)        registers "world.layer" "features"
 *   addFloat(game, painter)    painter: { draw(ctx, world, now) } in map pixels (the camera is applied);
 *                              returns a function that takes it away again
 */

const FLOATS = new WeakMap();

function listOf(game) {
  let list = FLOATS.get(game);
  if (!list) {
    list = new Set();
    FLOATS.set(game, list);
  }
  return list;
}

export function addFloat(game, painter) {
  const list = listOf(game);
  list.add(painter);
  return () => list.delete(painter);
}

export function installFloats(game) {
  const list = listOf(game);
  game.registry.add('world.layer', 'features', {
    draw(ctx, world) {
      if (!list.size || !world || !world.camera) return;
      const now = performance.now();
      ctx.save();
      ctx.translate(-world.camera.x, -world.camera.y);
      for (const painter of list) {
        try {
          painter.draw(ctx, world, now);
        } catch (error) {
          list.delete(painter);
          console.warn('Features: a float failed and was taken away', error);
        }
      }
      ctx.restore();
    },
  });
}
