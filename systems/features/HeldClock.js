/*
 * HeldClock.js  (engine: features)
 * Job: maps where the hour and the weather stand still (a town where it is always evening). While the player is
 * on such a map the world's clock and weather are held there every step; leaving the map lets the clock run on
 * from that hour. It knows no game: the game says which maps hold what.
 *
 * Public API:
 *   installHeldClock(game, heldOf)   heldOf(mapId) -> { time, weather } | null (each optional; guarded)
 *     registers world.layer "features:heldClock"
 */

export function installHeldClock(game, heldOf) {
  let mapId = null;
  let held = null;
  game.registry.add('world.layer', 'features:heldClock', {
    update(dt, world) {
      const map = world && world.map;
      if (!map) return;
      if (map.id !== mapId) {
        mapId = map.id;
        try {
          held = typeof heldOf === 'function' ? heldOf(map.id) || null : null;
        } catch (error) {
          held = null;
        }
      }
      if (!held || !world.env) return;
      if (Number.isFinite(held.time) && world.env.time !== held.time) world.env.setTime(held.time);
      if (held.weather && world.env.weather !== held.weather) world.env.setWeather(held.weather);
    },
  });
}
