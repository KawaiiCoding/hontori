/*
 * Stage.js
 * Job: put extra entities (wild creatures, things on the floor, pushable piles) into the world's
 * depth-sorted picture for as long as the current map is shown, through the world scene's
 * addActor / removeActor. They are drawn with the people and the fixtures, culled by their bounds,
 * and block nobody (a gate makes a thing solid). They leave with the map.
 *
 * Public API:
 *   addToWorld(world, entity)       the entity is drawn on the current map; returns a handle, or null
 *   removeFromWorld(world, handle)  take it out again (true if it was there)
 */

export function addToWorld(world, entity) {
  if (!world || !entity || typeof world.addActor !== 'function') return null;
  world.addActor(entity);
  return { entity };
}

export function removeFromWorld(world, handle) {
  if (!world || !handle || typeof world.removeActor !== 'function') return false;
  return !!world.removeActor(handle.entity);
}
