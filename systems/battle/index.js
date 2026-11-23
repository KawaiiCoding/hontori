/*
 * index.js  (engine: battle framework)
 * Job: one import for the battle framework. Nothing here names a game.
 *
 * Exports: Battle, Side, Fighter, StatusSet, MoveBook, matchupChart, scaleDamage, product, weightedPick,
 *          totalWeight, gradeFor, levelFromXp, clamp, roll, seeded, scripted
 */

export { Battle } from './Battle.js';
export { Side } from './Side.js';
export { Fighter } from './fighter.js';
export { StatusSet } from './StatusSet.js';
export { MoveBook } from './moves.js';
export { matchupChart } from './elements.js';
export { scaleDamage, product } from './damage.js';
export { weightedPick, totalWeight } from './intent.js';
export { gradeFor, levelFromXp } from './spells.js';
export { clamp, roll } from './chances.js';
export { seeded, scripted } from './random.js';
