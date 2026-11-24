/*
 * turn.js  (Hontori game layer)
 * Job: the round cycle and the endings (old src/battle.js beginTurn, runRound, nextFoe, win, lose, finish).
 *
 * Public API:
 *   beginTurn(b)          round + 1; cooldowns tick; +1 mana on rounds 3, 5, 7, ... (not under heat); the ring rules' roundStart
 *                         (ringRules.js: the wind may swap yours); the foe picks its intent
 *                         (it keeps the old one while stunned or asleep) and guards this round if that is it;
 *                         a fainted hontori with no Dawn Star to hand forces a switch, or loses when nobody is left
 *   runRound(b, steps)    the two halves of a round in order (after each, a foe that still stands may enter its next
 *                         phase: phases.js), then the round end: Deep Root heals 3, glow,
 *                         tailwind and shell count down, the foe's mist counts down, the foe's guard ends
 *   aliveOthers(b)        party indices, other than the one on the field, with hp above 0
 *   hint(b)               the helper line for the player's turn
 *   finish(b, result)     'won' | 'captured' | 'lost' | 'fled' | 'foeFled' -> Battle.report (see below)
 * Events: round, mana { amount, mana, source }, turn { round, intent, quick, forced, hint }, chooseNext { options },
 *   faint { target }, roundEnd, nextFoe { index, key, level, name, defeated, total }, end { result, report }.
 * When a foe faints nothing of the round end runs; a trainer's next hontori steps in and a new round begins.
 * report: { result, won, captured, fled (true | 'foe' | false), foeKey, foeLevel (the first foe's), trainer
 *   (name | true | null), participants, active, party [{ hp, sta }], mana, itemsUsed, spellXp, spellMastery,
 *   wandExp (from sigil grades), seen, bound ({ key, level: 1 } | null), boundOnce, countsAsBattle, rounds }.
 *   In a duel nobody is left fainted: every member that fought keeps at least 1 hp.
 */

import { pickIntent, quickFoe } from './intent.js';
import { reviveMaterial, SPELLS } from './spells.js';
import { MOVES } from './moves.js';
import { makeFoe } from './setup.js';
import { me, foe, say, speciesOf, itemCount, can, costOf } from './common.js';
import { runRingRules, ringRefills } from './ringRules.js';
import { checkPhases } from './phases.js';
import { line } from './text.js';

export function aliveOthers(b) {
  return b.side('me').others((m) => (m.hp == null ? 1 : m.hp) > 0);
}

export function shownIntent(b) {
  const f = foe(b);
  return f.has('stun') ? 'stunned' : f.has('asleep') ? 'asleep' : b.state.intent;
}

export function hint(b) {
  const S = b.state;
  const m = me(b);
  const f = foe(b);
  const weak = f.hp / f.max <= 0.35;
  if (m.fainted) return can(b, 'revive') ? 'hintFaintedStar' : 'hintFainted';
  if (m.has('asleep')) return 'hintAsleep';
  if (!S.trainer && !S.noRoom && can(b, 'bind') && weak && S.mana >= 2 && !S.spellUsed) return S.flags.boundOnce ? 'hintBind' : 'hintBindFirst';
  if (!S.trainer && !S.known.includes('bind') && weak) return 'hintLearnBind';
  if (S.intent === 'charge' && can(b, 'shield')) return 'hintCharge';
  if (S.intent === 'unleash' && can(b, 'shield') && !m.has('shield') && !S.spellUsed) return 'hintUnleash';
  return S.spellUsed ? 'hintMove' : 'hintEither';
}

export function emitTurn(b) {
  const id = hint(b);
  b.emit('turn', { round: b.round, intent: shownIntent(b), quick: quickFoe(foe(b), me(b)), forced: b.state.forced, hint: id, hintText: line(id) });
}

export function beginTurn(b) {
  const S = b.state;
  const f = foe(b);
  b.startRound();
  if (b.round > 1 && b.round % 2 === 1 && S.mana < S.maxMana && ringRefills(b)) {
    S.mana++;
    b.emit('mana', { amount: 1, mana: S.mana, source: 'round' });
  }
  S.spellUsed = false;
  S.forced = false;
  if (b.round > 1) runRingRules(b, 'roundStart');
  const m = me(b);
  if (!(f.has('stun') || f.has('asleep'))) S.intent = pickIntent(f, m, S.lastIntent, b.round, b.random);
  f.set('guard', S.intent === 'guard' && !f.has('stun') && !f.has('asleep'));
  if (m.fainted && !(can(b, 'revive') && S.mana >= costOf(b, 'revive') && itemCount(b, reviveMaterial(m.el)) > 0)) {
    const options = aliveOthers(b);
    if (!options.length) return lose(b);
    S.forced = true;
    emitTurn(b);
    say(b, 'chooseNext');
    b.emit('chooseNext', { options });
    return;
  }
  emitTurn(b);
  const TR = S.trainer;
  if (TR && TR.lesson && b.round === 1 && SPELLS[TR.lesson] && can(b, TR.lesson)) {
    say(b, 'lesson', { trainer: TR.name || 'Rival', spell: SPELLS[TR.lesson].name, how: SPELLS[TR.lesson].how });
  }
}

export function runRound(b, steps) {
  const stop = b.runSteps(steps, () => {
    if (foe(b).fainted) return 'win';
    checkPhases(b);
    return me(b).fainted ? 'faint' : null;
  });
  if (stop === 'win') return win(b);
  if (stop === 'faint') {
    b.emit('faint', { target: 'me' });
    say(b, 'fainted');
  }
  const m = me(b);
  const f = foe(b);
  if (m.has('root') && !m.fainted) {
    const h = m.heal(3);
    m.tick('root');
    if (h) b.emit('heal', { target: 'me', amount: h, source: 'root' });
  }
  for (const k of ['glow', 'tail', 'harden']) m.tick(k);
  f.tick('mist');
  f.set('guard', 0);
  b.emit('roundEnd', { round: b.round });
  beginTurn(b);
}

function nextFoe(b) {
  const S = b.state;
  const old = foe(b);
  S.teamIndex++;
  const t = S.team[S.teamIndex];
  const sp = speciesOf(S.species, t.spirit);
  const level = t.level || old.level;
  const f = b.send('foe', S.teamIndex, makeFoe(b, t.spirit, level, t.stage, sp.name || old.name));
  S.foeMoves = MOVES[f.el] || MOVES.fire;
  S.lastIntent = '';
  S.intent = 'strike';
  b.emit('nextFoe', { index: S.teamIndex, key: f.key, level, name: f.name, defeated: S.teamIndex, total: S.team.length });
  say(b, 'calls', { trainer: S.trainer.name || 'Rival', name: sp.name || 'a hontori' });
  beginTurn(b);
}

function win(b) {
  const S = b.state;
  b.emit('faint', { target: 'foe' });
  if (S.team && S.teamIndex < S.team.length - 1) return nextFoe(b);
  if (S.trainer) say(b, 'wellFought', { trainer: S.trainer.name || 'Rival' });
  finish(b, 'won');
}

function lose(b) {
  say(b, b.state.trainer ? 'loseDuel' : 'loseWild');
  finish(b, 'lost');
}

export function finish(b, result) {
  const S = b.state;
  const TR = S.trainer;
  const side = b.side('me');
  const m = me(b);
  const party = side.members;
  const cur = party[side.active];
  cur.sta = m.sta;
  cur.hp = Math.max(TR ? 1 : 0, m.hp);
  if (TR) for (const i of side.fought) if (party[i] && party[i].hp != null && party[i].hp <= 0) party[i].hp = 1;
  const captured = result === 'captured';
  if (captured && !S.seen.includes(foe(b).key)) S.seen.push(foe(b).key);
  b.finish(result, {
    result,
    won: result === 'won' || captured,
    captured,
    fled: result === 'fled' ? true : result === 'foeFled' ? 'foe' : false,
    foeKey: S.foeKey,
    foeLevel: S.foeLevel,
    trainer: TR ? TR.name || true : null,
    participants: side.fought.slice(),
    active: side.active,
    party: S.partyGiven ? party.map((p) => ({ hp: p.hp, sta: p.sta })) : [],
    mana: S.mana,
    itemsUsed: Object.assign({}, S.used),
    spellXp: Object.assign({}, S.spellXp),
    spellMastery: Object.assign({}, S.spellMastery),
    wandExp: S.wandExp,
    seen: S.seen.slice(),
    bound: captured ? { key: foe(b).key, level: 1 } : null,
    boundOnce: !!S.flags.boundOnce,
    countsAsBattle: !TR && result !== 'fled',
    rounds: b.round
  });
}
