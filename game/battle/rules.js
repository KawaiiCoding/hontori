/*
 * rules.js  (Hontori game layer)
 * Job: Hontori's battle rules in the shape the engine's Battle expects: setup, begin, the player's actions and
 * the checks that refuse an action (old src/battle.js input handlers: moves, breath, sigils, switch, escape,
 * herb, bread).
 *
 * Public API:
 *   hontoriRules       { setup, begin, actions: { move, breath, spell, switch, escape, item }, check }
 *     move    { index }            a move of the hontori on the field; quick foes act first
 *     breath  {}                   only when every move costs more stamina than is left
 *     spell   { kind, accuracy }   one spell per turn; the turn stays open for a move
 *     switch  { index }            costs the turn (the foe acts), except the forced pick after a faint
 *     escape  {}                   wild battles only; a miss costs the turn and makes the next try easier
 *     item    { id }               'herb' (+1 mana, not at full mana), 'bread' (wild only, once: bind +0.15)
 */

import { setupBattle } from './setup.js';
import { bringIn } from './swap.js';
import { beginTurn, runRound, aliveOthers, emitTurn, finish } from './turn.js';
import { meAct, foeAct, BREATH } from './fight.js';
import { checkSpell, canCast, castSpell } from './cast.js';
import { quickFoe } from './intent.js';
import { escapeChance } from './chances.js';
import { BREAD_CALM } from './chances.js';
import { staCost } from './moves.js';
import { matrix, weatherMul, weatherWhy } from './elements.js';
import { me, foe, say, itemCount, useItem } from './common.js';
import { line } from './text.js';

function no(reason, id, vars) {
  return { reason, text: id ? line(id, vars) : '' };
}

export function tiredAll(b) {
  const m = me(b);
  return b.state.moves.every((mv) => m.sta < staCost(mv));
}

function inOrder(b, mine) {
  return quickFoe(foe(b), me(b)) ? [() => foeAct(b), () => meAct(b, mine)] : [() => meAct(b, mine), () => foeAct(b)];
}

function checkMove(b, p) {
  const m = me(b);
  const mv = b.state.moves[p.index];
  if (!mv) return no('invalid');
  if (m.fainted) return canCast(b, 'revive') === true ? no('fainted', 'refuseFaintedStar') : no('fainted', 'refuseFainted');
  if (m.cooldown(mv.id) > 0) return no('rest', 'refuseRest', { move: mv.name });
  if (m.sta < staCost(mv)) return tiredAll(b) ? no('tired', 'refuseTired') : no('stamina', 'refuseStamina', { move: mv.name });
  return null;
}

function checkSwitch(b, p) {
  const S = b.state;
  const side = b.side('me');
  if (!S.forced) {
    if (side.members.length < 2) return no('alone');
    if (S.trainer && S.trainer.noSwitch) return no('noSwitch');
  }
  const t = side.members[p.index];
  if (!t || p.index === side.active || (t.hp == null ? 1 : t.hp) <= 0) return no('invalid');
  return null;
}

function checkItem(b, p) {
  const S = b.state;
  if (p.id === 'herb') return itemCount(b, 'herb') > 0 && S.mana < S.maxMana ? null : no('unavailable');
  if (p.id === 'bread') return itemCount(b, 'bread') > 0 && !S.breadUsed && !S.trainer ? null : no('unavailable');
  return no('unknown');
}

export const hontoriRules = Object.freeze({
  setup: setupBattle,

  begin(b) {
    const S = b.state;
    const m = me(b);
    const f = foe(b);
    say(b, S.trainer ? 'introDuel' : 'introWild', { trainer: (S.trainer && S.trainer.name) || 'A classmate' });
    b.emit('matchup', {
      attack: matrix(m.el, f.el, f.el2), defend: matrix(f.el, m.el, m.el2),
      weatherMe: weatherMul(m.el, S.env), weatherFoe: weatherMul(f.el, S.env),
      whyMe: weatherWhy(m.el, S.env), whyFoe: weatherWhy(f.el, S.env)
    });
    beginTurn(b);
  },

  check(b, action, p) {
    if (action === 'move') return checkMove(b, p);
    if (action === 'breath') {
      if (me(b).fainted) return no('fainted', 'refuseFainted');
      return tiredAll(b) ? null : no('notTired');
    }
    if (action === 'spell') return checkSpell(b, p.kind);
    if (action === 'switch') return checkSwitch(b, p);
    if (action === 'escape') return b.state.trainer ? no('duel', 'refuseDuelEscape') : null;
    if (action === 'item') return checkItem(b, p);
    return null;
  },

  actions: {
    move(b, p) {
      runRound(b, inOrder(b, b.state.moves[p.index]));
    },

    breath(b) {
      runRound(b, inOrder(b, BREATH));
    },

    spell(b, p) {
      castSpell(b, p.kind, p.accuracy);
      if (!b.over) emitTurn(b);
    },

    switch(b, p) {
      const S = b.state;
      const free = S.forced;
      S.forced = false;
      const next = bringIn(b, p.index, { free });
      say(b, 'go', { name: next.name });
      if (free) emitTurn(b);
      else runRound(b, [() => foeAct(b)]);
    },

    escape(b) {
      const S = b.state;
      const chance = escapeChance({ me: me(b), foe: foe(b), tries: S.escTries, quick: quickFoe(foe(b), me(b)) });
      if (b.random() < chance) {
        b.emit('escape', { success: true, chance });
        say(b, 'escaped');
        finish(b, 'fled');
        return;
      }
      S.escTries++;
      b.emit('escape', { success: false, chance });
      say(b, 'blocked');
      runRound(b, [() => {}, () => foeAct(b)]);
    },

    item(b, p) {
      const S = b.state;
      useItem(b, p.id);
      if (p.id === 'herb') {
        S.mana++;
        b.emit('mana', { amount: 1, mana: S.mana, source: 'herb' });
        say(b, 'herb');
      } else if (p.id === 'bread') {
        S.breadUsed = true;
        S.calm = BREAD_CALM;
        b.emit('calm', { amount: BREAD_CALM });
        say(b, 'bread');
      }
    }
  }
});

export { aliveOthers };
