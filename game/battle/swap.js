/*
 * swap.js  (Hontori game layer)
 * Job: bring another member of the party onto the field: the one leaving keeps its health and stamina, the
 * new one comes in with its own moves. The player's Switch and the ring rules that swap (the wind of Gale
 * Loft) both go through here, so the battle scene sees one kind of event.
 *
 * Public API:
 *   bringIn(b, index, { free, by })   -> the new fighter. Emits switch { from, to, key, name, free, by }
 *                                     (by: 'player' or the ring rule's id). Says nothing: the caller does.
 */

import { makeMine } from './setup.js';
import { movesFor } from './moves.js';
import { me } from './common.js';

export function bringIn(b, index, { free = false, by = 'player' } = {}) {
  const S = b.state;
  const side = b.side('me');
  const old = me(b);
  const prev = side.members[side.active];
  prev.hp = Math.max(0, old.hp);
  prev.sta = old.sta;
  const from = side.active;
  const next = b.send('me', index, makeMine(b, side.members[index]));
  S.moves = movesFor(side.members[index], next.el);
  b.emit('switch', { from, to: index, key: next.key, name: next.name, free, by });
  return next;
}
