/*
 * units.js
 * Job: the fixed measures of the world, shared by every layer.
 *
 * Public API:
 *   TILE            logical pixels per tile side (16)
 *   RENDER_SCALE    real canvas pixels per logical pixel (2)
 *   DOWN, UP, LEFT, RIGHT   facing directions, as the painters number them
 *   DIR_STEP[dir]   [dx, dy] of one step in that direction
 *   dirOfStep(dx, dy)       facing direction of a step (the vertical axis wins a tie)
 *   feetX(tx), feetY(ty)    where something standing on a tile has its feet, in logical pixels
 */

export const TILE = 16;
export const RENDER_SCALE = 2;

export const DOWN = 0;
export const UP = 1;
export const LEFT = 2;
export const RIGHT = 3;

export const DIR_STEP = [[0, 1], [0, -1], [-1, 0], [1, 0]];

export function dirOfStep(dx, dy) {
  if (dy > 0) return DOWN;
  if (dy < 0) return UP;
  return dx < 0 ? LEFT : RIGHT;
}

export function feetX(tx) {
  return tx * TILE + 8;
}

export function feetY(ty) {
  return ty * TILE + 15;
}
