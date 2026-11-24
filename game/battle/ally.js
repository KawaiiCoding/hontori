/*
 * ally.js  (Hontori game layer)
 * Job: battle mode "ally": a double battle. Someone fights beside the kid (a Warden, a friend) with a hontori of
 * their own, and a trainer with two or more brings their first two onto the field together. The kid chooses only
 * for their own hontori, whose moves and spells go at the foe in front as always. After the kid's round the ally's
 * hontori acts on its own (it takes the second foe while there is one, else the one in front), then the second
 * foe acts (it goes for the ally while the ally stands, else for the kid's hontori). When the foe in front falls,
 * the second steps up; the battle is won when no foe is left. The ally being worn out loses nothing: the kid
 * fights on alone. A lost battle is the kid's party all fainted, as always.
 *
 * Public API:
 *   setupAlly(b, setup)    after the normal setup: setup.mode === 'ally' and setup.ally { name, key, team:
 *                          [{ spirit, level, stage }] } (the first member fights); also puts the trainer's second
 *                          hontori on the field. Does nothing for any other battle
 *   sideSteps(b)           the two extra halves of a round: [allyAct, partnerAct] (empty without an ally)
 *   promotePartner(b)      the foe in front fell: true when the second foe stepped up (events emitted)
 *   allyView(b)            { ally: { name, owner, key, el, el2, hp, max, level, stage, fainted } | null,
 *                            partner: the same for the second foe | null }   for the screen
 * Events: sideMove { side: 'ally' | 'foe2', target: 'foe' | 'foe2' | 'me' | 'ally', name },
 *   sideDamage { target: 'ally' | 'foe2', amount, hp, max }, damage { target: 'foe' | 'me', ..., source: 'ally' |
 *   'partner' } (as fight.js, a non-move source), sideFaint { target }, sideUp { index, key, name } (the second
 *   foe is now the one in front), say.
 */

import { HontoriFighter, foeMaxHp } from './HontoriFighter.js';
import { MOVES } from './moves.js';
import { hit } from './damage.js';
import { me, foe, say, speciesOf } from './common.js';
import { ringPower } from './ringRules.js';
import { makeFoe } from './setup.js';

function fighterOf(b, side, member, fallbackName) {
  const sp = speciesOf(b.state.species, member.spirit);
  const level = Math.max(1, member.level || 1);
  const max = foeMaxHp(level);
  return new HontoriFighter({
    side, key: member.spirit, element: sp.element, element2: sp.element2, name: sp.name || fallbackName,
    level, hp: max, maxHp: max, stage: member.stage,
  });
}

export function setupAlly(b, s) {
  const S = b.state;
  S.ally = null;
  S.partner = null;
  if (!s || s.mode !== 'ally' || !s.ally) return;
  const team = Array.isArray(s.ally.team) ? s.ally.team.filter((m) => m && m.spirit) : [];
  if (team.length) {
    const f = fighterOf(b, 'ally', team[0], s.ally.name || '');
    S.ally = { name: s.ally.name || '', key: s.ally.key || null, fighter: f, moves: MOVES[f.el] || MOVES.fire };
  }
  if (S.team && S.team.length > 1) {
    const t = S.team[1];
    const sp = speciesOf(S.species, t.spirit);
    S.partner = makeFoe(b, t.spirit, t.level || 1, t.stage, sp.name || t.spirit);
    S.partnerIndex = 1;
  }
}

function strike(b, attacker, defender, from, to, moves) {
  const S = b.state;
  const move = moves[attacker.level >= 12 && b.random() < 0.35 ? 1 : 0] || moves[0];
  b.emit('sideMove', { side: from, target: to, name: move.name });
  const r = hit(attacker, defender, move.pow || 5, {
    env: S.env, mult: ringPower(b, attacker), wandPower: 1, foe: from === 'foe2', random: b.random,
  });
  defender.damage(r.amount);
  if (to === 'ally' || to === 'foe2') b.emit('sideDamage', { target: to, amount: r.amount, hp: defender.hp, max: defender.max });
  else b.emit('damage', { target: to, amount: r.amount, crit: r.crit, matchup: r.matchup, weather: r.weather, shielded: false, guarded: false, hp: defender.hp, source: from === 'ally' ? 'ally' : 'partner' });
  if (defender.fainted && (to === 'ally' || to === 'foe2')) {
    b.emit('sideFaint', { target: to });
    say(b, to === 'ally' ? 'allyDown' : 'partnerDown', { name: defender.name, owner: S.ally ? S.ally.name : '' });
  }
}

function allyAct(b) {
  const S = b.state;
  const a = S.ally && S.ally.fighter;
  if (!a || a.fainted) return;
  const p = S.partner;
  if (p && !p.fainted) strike(b, a, p, 'ally', 'foe2', S.ally.moves);
  else if (!foe(b).fainted) strike(b, a, foe(b), 'ally', 'foe', S.ally.moves);
}

function partnerAct(b) {
  const S = b.state;
  const p = S.partner;
  if (!p || p.fainted) return;
  const moves = MOVES[p.el] || MOVES.fire;
  const a = S.ally && S.ally.fighter;
  if (a && !a.fainted) strike(b, p, a, 'foe2', 'ally', moves);
  else if (!me(b).fainted) strike(b, p, me(b), 'foe2', 'me', moves);
}

export function sideSteps(b) {
  return b.state.ally || b.state.partner ? [() => allyAct(b), () => partnerAct(b)] : [];
}

export function promotePartner(b) {
  const S = b.state;
  const p = S.partner;
  if (!p) return false;
  S.partner = null;
  if (p.fainted) {
    S.teamIndex = Math.max(S.teamIndex, S.partnerIndex);
    return false;
  }
  S.teamIndex = S.partnerIndex;
  const f = b.send('foe', S.partnerIndex, p);
  S.foeMoves = MOVES[f.el] || MOVES.fire;
  S.lastIntent = '';
  S.intent = 'strike';
  b.emit('sideUp', { index: S.partnerIndex, key: f.key, name: f.name, level: f.level, defeated: S.teamIndex, total: S.team.length });
  say(b, 'partnerSteps', { name: f.name });
  return true;
}

function view(f, extra) {
  if (!f) return null;
  return Object.assign({ key: f.key, el: f.el, el2: f.el2, hp: f.hp, max: f.max, level: f.level, stage: f.stage, name: f.name, fainted: f.fainted }, extra);
}

export function allyView(b) {
  const S = b.state;
  return {
    ally: S.ally ? view(S.ally.fighter, { owner: S.ally.name, look: S.ally.key }) : null,
    partner: view(S.partner, {}),
  };
}
