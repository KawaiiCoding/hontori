/*
 * index.js  (engine: battle scene)
 * Job: one import for the battle screen framework, and the function that registers a game's battle scene.
 *
 * Exports: BattleScene, BattleStage, SigilSurface, inkStroke, Recognizer, pathLength, resample, install, openBattle
 *
 *   install(game, { id, create })
 *       registers registry kind "scene" under id (default 'battle'); create(game) returns the game's
 *       BattleScene subclass. Call it before game.start(...).
 *   openBattle(game, params, id)
 *       pushes that scene and returns a Promise of its outcome: whatever the scene passes to close(),
 *       so a story command can `await` a battle.
 */

import { BattleScene } from './BattleScene.js';

export { BattleScene };
export { BattleStage } from './BattleStage.js';
export { SigilSurface, inkStroke } from './SigilSurface.js';
export { Recognizer, pathLength, resample } from './gesture.js';

const DEFAULT_ID = 'battle';

export function install(game, options) {
  const id = (options && options.id) || DEFAULT_ID;
  const create = options && options.create;
  if (typeof create !== 'function') throw new Error('battle-scene: install needs create(game)');
  game.registry.add('scene', id, (owner) => create(owner));
}

export function openBattle(game, params, id) {
  return game.scenes.open(id || DEFAULT_ID, params).finished;
}
