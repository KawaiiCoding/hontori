/*
 * Pending.js
 * Job: the script commands whose owner is another system: the battle command, which hands over to
 * the battle screen, and clear stand-ins for commands, conditions and values whose system is not
 * built. A stand-in never grants progress: a command stops its script (nothing after it runs, so no
 * flag is set and nothing is given), a condition is false, a value is null. With the debug tools it
 * says "Not built yet" once, on the console and as a toast; in a normal start it does nothing. The
 * step can be played as soon as the system exists (CLAUDE.md rule 8). A system that is built
 * registers the real handler before installPending runs, and the stand-in for it is never added.
 *
 * Public API:
 *   BATTLE_SERVICE                       'battle': the id, under registry kind "service", of the battle starter
 *   installBattleCommand(game)           registers "story.command" "battle" (unless it is taken)
 *   pending(game, kind, id, { phase })   register a stand-in unless (kind, id) is taken; true if added
 *        kind: 'story.command' | 'story.condition' | 'story.value'; phase: a word for the debug line
 *   installPending(game)                 the stand-ins of the core schema, call it after every lane:
 *        commands story, puzzle, offer, trial, forage, open, ask:name
 *   pendingList(game)                    [{ kind, id, phase }] every stand-in in place (for a report)
 *
 * The battle starter (registry kind "service", id "battle"):
 *   { start(battle, ctx, node) -> Promise<{ won, lost, fled, captured, wild, ... }> }
 *   battle: the value of the command's `battle` key (schema section 9); node: the whole command.
 *   The starter opens the battle screen, resolves when it has closed, and emits "battle:end" with the
 *   same result. While none is registered the command says so once and goes on as a win.
 *   After the battle the command emits "battle:after" { how: node.after, result } when the command
 *   names one ('wake', 'restore'), then runs the branch of the result: captured, won, lost or fled,
 *   else `else`.
 */

import { STOP } from './Commands.js';

export const BATTLE_SERVICE = 'battle';

const BRANCHES = ['captured', 'won', 'lost', 'fled'];
const LIST = 'story.pending';

function offer(registry, kind, id, value) {
  if (registry.has(kind, id)) return false;
  registry.add(kind, id, value);
  return true;
}

export function installBattleCommand(game) {
  offer(game.registry, 'story.command', 'battle', async (node, ctx) => {
    const story = ctx.story;
    const starter = game.registry.get('service', BATTLE_SERVICE);
    let result = null;
    if (starter && typeof starter.start === 'function') {
      result = await starter.start(node.battle, ctx, node);
    } else {
      story.warnOnce('battle:none', 'Story: no battle starter is registered (service "battle"); the battle counts as won');
      result = { won: true, wild: !!(node.battle && node.battle.wild), standIn: true };
      game.bus.emit('battle:end', result);
    }
    result = result || {};
    ctx.battle = result;
    if (node.after) game.bus.emit('battle:after', { how: node.after, result });
    const branch = BRANCHES.find((key) => result[key] && Array.isArray(node[key]));
    return ctx.run(branch ? node[branch] : node.else);
  });
}

export function pending(game, kind, id, { phase = 'a later phase' } = {}) {
  let told = false;
  const isCommand = kind === 'story.command';
  const added = offer(game.registry, kind, id, () => {
    /* only a debug start says so; a normal start does nothing */
    if (!told && game.debug) {
      told = true;
      const line = `Not built yet: "${id}" (${phase})`;
      console.warn(`Story: ${line}; the script stops here`);
      try {
        game.ui.toast(line);
      } catch (error) {
        /* no interface: the console line stands */
      }
    }
    if (isCommand) return STOP;
    return kind === 'story.condition' ? false : null;
  });
  if (added) game.registry.add(LIST, `${kind}/${id}`, { kind, id, phase });
  return added;
}

export function pendingList(game) {
  return [...game.registry.all(LIST)];
}

export function installPending(game) {
  const command = (id) => pending(game, 'story.command', id);
  for (const id of ['story', 'puzzle', 'offer', 'open', 'ask:name', 'forage', 'trial']) command(id);
}
