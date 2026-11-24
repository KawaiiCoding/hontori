/*
 * index.js  (Hontori game layer)
 * Job: one import for Hontori's battle rules.
 *
 * Exports: HontoriBattle, hontoriRules, HontoriFighter, the element rules (matrix, weatherMul, ...), the moves
 *          (MOVES, movesFor, staCost, ...), the spells (SPELLS, GRADES, gradeOf, ...), the odds (bindChance,
 *          escapeChance), the intents (pickIntent, intentWeights, quickFoe), hit and rollMiss, growth (levels,
 *          stages, wand), battleRewards, the ring rules (defineRingRule, ringRulesOf, RING_RULES), the phases of a
 *          trainer's hontori, the wand duel (WandDuel, clash) and bringIn.
 */

export { HontoriBattle } from './HontoriBattle.js';
export { hontoriRules } from './rules.js';
export { HontoriFighter, foeMaxHp, STATUS_NAMES } from './HontoriFighter.js';
export * from './elements.js';
export * from './moves.js';
export * from './spells.js';
export * from './chances.js';
export * from './intent.js';
export * from './damage.js';
export * from './growth.js';
export { battleRewards } from './rewards.js';
export { TEXT, line } from './text.js';
export { defineRingRule, ringRulesOf, ringPower, ringRefills, RING_RULES, TIDE_MAX, TIDE_STEP } from './ringRules.js';
export { checkPhases, phasePower, PHASE_POWER } from './phases.js';
export { setupAlly, allyView } from './ally.js';
export { WandDuel, wandDuelRules, clash, isWandDuel, WAND_SPELLS, ANSWER, STRIKE, STRIKE_FLAWLESS, ECHO } from './wandDuel.js';
export { bringIn } from './swap.js';
