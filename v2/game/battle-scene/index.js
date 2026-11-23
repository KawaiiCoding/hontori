/*
 * index.js  (Hontori game layer)
 * Job: put Hontori's battle screen into the game and start battles on it.
 *
 * Public API:
 *   install(game)
 *       registers the scene "battle" and the save section `battleScene` ({ guideOff, told }).
 *       Call it in main.js before game.start(...).
 *   startBattle(game, setup, options) -> Promise<{ result, report, rewards }>
 *       setup    the battle setup of game/battle/setup.js (party, enemy and level, or trainer; wand, items,
 *                flags, noCapture, sureBind, spells). Left out, `species` is read from the shared content and
 *                `env` from the world scene that is on top (its hour, weather and whether it is indoors).
 *       options  { biome, tutorial, joinsParty, rewards, random }
 *                biome       'meadow' | 'forest' | 'river' | 'indoor' (default from env.indoor)
 *                tutorial    true in the player's first wild battle
 *                joinsParty  true: a bound hontori joins the party; false: it rests in the wand
 *                rewards     { partySize, coins, pursePaid(key) } for battleRewards, or (report) => that
 *                random      () => [0, 1) for the rules (default Math.random)
 *       The Promise resolves when the player leaves the end card (or has run away):
 *         result   'won' | 'captured' | 'lost' | 'fled' | 'foeFled'
 *         report   the rules' report (game/battle/turn.js): party hp and stamina, mana, items used, spell EXP ...
 *         rewards  game/battle battleRewards(report, rewards): { exp: [{ index, gain }], wandExp, money }
 *       It resolves with null if the scene was removed from outside. Nothing is written to the save: the caller
 *       (the story's battle command) applies report and rewards.
 *   speciesFromContent(key)   the default species lookup: { element, element2, name } of a kind
 */

import { install as installScene, openBattle } from '../../systems/battle-scene/index.js';
import { HontoriBattle } from '../battle/index.js';
import { HontoriBattleScene, BATTLE_SCENE_SAVE } from './HontoriBattleScene.js';
import kinds from '../../content/shared/hontori.js';
import kindText from '../../content/shared/text.kinds.en.js';

const SCENE_ID = 'battle';
const byKind = new Map(kinds.map((k) => [k.kind, k]));

export function speciesFromContent(key) {
  const kind = byKind.get(key);
  if (!kind) return null;
  const first = kind.stages && kind.stages[0];
  return { element: kind.element, element2: kind.element2 || null, name: (first && kindText[first.name]) || key };
}

export function install(game) {
  game.save.define('battleScene', BATTLE_SCENE_SAVE);
  installScene(game, { id: SCENE_ID, create: (owner) => new HontoriBattleScene(owner) });
}

function envOfWorld(game) {
  const top = game.scenes.top;
  const env = top && top.env;
  return env ? { time: env.time, weather: env.weather, indoor: !!env.indoor } : { time: 12, weather: 'clear', indoor: false };
}

export function startBattle(game, setup, options) {
  const o = options || {};
  const full = Object.assign({ species: speciesFromContent }, setup);
  full.env = Object.assign(envOfWorld(game), full.env);
  const battle = new HontoriBattle(full, { random: o.random });
  return openBattle(game, {
    battle, env: full.env, species: full.species, biome: o.biome, tutorial: !!o.tutorial, joinsParty: o.joinsParty, rewards: o.rewards
  }, SCENE_ID);
}

export { HontoriBattleScene };
