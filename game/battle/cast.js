/*
 * cast.js  (Hontori game layer)
 * Job: casting a drawn spell: whether it may be cast, its grade, mastery and EXP, and every spell effect,
 * binding included (old src/battle.js canCast, castSpell, bind and the checks in the pointer-up handler).
 *
 * Public API:
 *   canCast(b, kind)          true, or { reason, text } (the old canCast messages)
 *   checkSpell(b, kind)       null, or { reason, text }: not in the loadout ('shape'), a binding in a duel or with
 *                             noCapture ('repel': the owner raises a hand; checked before everything else),
 *                             one spell each turn ('oneSpell'), mana ('mana'), then canCast
 *   castSpell(b, kind, accuracy)   spend the mana, grade the drawing, apply the spell. The turn stays open.
 * Effects (gm = grade multiplier 1.3 / 1 / 0.7):
 *   mend    heal round(7 x wand power x gm), wakes     shield  ward of strength gm     boost  rune of strength gm
 *   stun    chance min(0.95, 0.75 gm): stunned, charge and guard lost
 *   sleep   chance min(0.9, 0.6 gm): asleep 2 turns, charge and guard lost
 *   revive  uses the element's material; hp = min(max, ceil(max / 2 x gm)), wakes
 *   lantern the foe's intent this turn and the next shows (also under the rule blind); the next one is drawn now
 *   mirror  asleep: wakes yours and puts the foe to sleep (2 turns); else a mirror waits 2 rounds and sends the
 *           next sleep spell back (fight.js)
 *   veil    the V: only in a battle whose ring rule brings it in (seal, ringRules.js), which gives it its effect
 *   (rule pure: no binding; a sealed slot under blind or seal cannot be cast; twist flawless: a sigil that is not
 *   Flawless fades with no cost and no effect, event fizzle { kind, grade })
 *   step    Swift Step: the next escape try this battle is much likelier (chances.escapeChance), never certain;
 *           wild battles only
 *   bind    one try of 3 (chances.bindChance); sureBind makes the third try hold; the third miss lets the foe go
 * Events: spell { kind, target, grade, mul, cost, mana, exp, mastery, masteryUp }, heal, item,
 *   bindTry { chance, success, triesLeft }, status, say, end.
 */

import { SPELLS, GRADES, gradeOf, reviveMaterial, MATERIAL_NAMES } from './spells.js';
import { bindChance, BIND_TRIES } from './chances.js';
import { finish } from './turn.js';
import { me, foe, say, itemCount, useItem, spellMastery, costOf, can, hasRule, isBattleSpell, isSealed } from './common.js';
import { runRingRules } from './ringRules.js';
import { pickIntent } from './intent.js';
import { line } from './text.js';

function no(reason, id, vars) {
  return { reason, text: line(id, vars) };
}

export function canCast(b, kind) {
  const S = b.state;
  const m = me(b);
  const f = foe(b);
  if (kind === 'revive') {
    const mat = reviveMaterial(m.el);
    if (!m.fainted) return no('noNeed', 'refuseNoNeed');
    return itemCount(b, mat) > 0 ? true : no('needMaterial', 'refuseNeedMaterial', { material: MATERIAL_NAMES[mat] });
  }
  if (m.fainted) return no('fainted', 'refuseOnlyStar');
  if (kind === 'bind') {
    if (S.trainer || S.noCapture) return no('duel', 'refuseDuelBind');
    if (S.noRoom) return no('noRoom', 'refuseNoRoom');
    if (f.hp / f.max > 0.35) return no('weaken', 'refuseWeaken');
  }
  if (kind === 'mend' && m.hp >= m.max && !m.has('asleep')) return no('well', 'refuseWell');
  if (kind === 'lantern' && S.foresee > 0) return no('foreseen', 'refuseForeseen');
  if (kind === 'mirror' && m.has('mirror')) return no('mirrored', 'refuseMirrored');
  if (kind === 'step') {
    if (S.trainer) return no('duel', 'refuseDuelEscape');
    if (S.stepped) return no('stepped', 'refuseStepped');
  }
  return SPELLS[kind] ? true : no('shape', 'refuseShape');
}

export function checkSpell(b, kind) {
  const S = b.state;
  if (!isBattleSpell(b, kind) || !can(b, kind)) return no('shape', 'refuseShape');
  if (isSealed(b, kind)) return no('sealed', 'refuseSealed', { spell: SPELLS[kind].name });
  if (kind === 'bind' && hasRule(b, 'pure')) return no('pure', 'refusePure');
  if (kind === 'bind' && (S.trainer || S.noCapture)) {
    return no('repel', 'repel', { trainer: (S.trainer && S.trainer.name) || 'Owner' });
  }
  if (S.spellUsed) return no('oneSpell', 'refuseOneSpell');
  if (S.mana < costOf(b, kind)) return no('mana', 'refuseMana', { spell: SPELLS[kind].name });
  const ok = canCast(b, kind);
  return ok === true ? null : ok;
}

function bind(b, acc, gm) {
  const S = b.state;
  const f = foe(b);
  const chance = bindChance({
    foe: f, me: me(b), accuracy: acc, gradeMul: gm, wandPower: S.wandPower,
    captureBonus: S.perks.captureBonus || 0, calm: S.calm, charm: itemCount(b, 'charm') > 0
  });
  if (b.random() < chance || (S.sureBind && S.binds >= 2)) {
    b.emit('bindTry', { chance, success: true, triesLeft: BIND_TRIES - S.binds - 1 });
    S.flags.boundOnce = true;
    say(b, 'bound');
    finish(b, 'captured');
    return;
  }
  S.binds++;
  const left = BIND_TRIES - S.binds;
  b.emit('bindTry', { chance, success: false, triesLeft: left });
  if (S.binds >= BIND_TRIES) {
    say(b, 'slipsAway');
    finish(b, 'foeFled');
    return;
  }
  say(b, 'broke', { left, tries: left === 1 ? 'try left.' : 'tries left.' });
}

export function castSpell(b, kind, accuracy) {
  const S = b.state;
  const m = me(b);
  const f = foe(b);
  const cost = costOf(b, kind);
  const acc = accuracy == null ? 0.5 : accuracy;
  const grade = gradeOf(acc);
  /* the twist flawless: only a Flawless sigil takes effect; any other fades, costing nothing, and may be drawn again */
  if (S.twist === 'flawless' && grade !== 'flawless') {
    b.emit('fizzle', { kind, grade });
    say(b, 'flawlessOnly');
    return;
  }
  S.spellUsed = true;
  S.mana -= cost;
  const G = GRADES[grade];
  const gm = G.mul;
  const before = spellMastery(b, kind);
  S.spellXp[kind] = (S.spellXp[kind] || 0) + G.exp;
  S.wandExp += G.exp;
  const mastery = spellMastery(b, kind);
  S.spellMastery[kind] = mastery;
  /* a ring rule may aim a spell elsewhere (the V under seal goes to the foe's veil) */
  const target = (S.spellTargets && S.spellTargets[kind]) || SPELLS[kind].on;
  b.emit('spell', { kind, target, grade, mul: gm, cost, mana: S.mana, exp: G.exp, mastery, masteryUp: mastery > before });
  say(b, 'spellName', { spell: SPELLS[kind].name });
  if (kind === 'mend') {
    const h = m.heal(Math.round(7 * S.wandPower * gm));
    const woke = m.has('asleep');
    m.set('asleep', 0);
    b.emit('heal', { target: 'me', amount: h, source: 'mend' });
    say(b, woke ? 'mendedAwake' : 'mended');
  } else if (kind === 'shield') {
    m.set('shield', gm);
    say(b, 'shield');
  } else if (kind === 'boost') {
    m.set('boost', gm);
    say(b, 'boost');
  } else if (kind === 'stun') {
    if (b.random() < Math.min(0.95, 0.75 * gm)) {
      f.set('stun', 1);
      f.set('charged', 0);
      f.set('guard', 0);
      say(b, 'stunHold');
    } else say(b, 'stunBreak');
  } else if (kind === 'sleep') {
    if (b.random() < Math.min(0.9, 0.6 * gm)) {
      f.set('asleep', 2);
      f.set('charged', 0);
      f.set('guard', 0);
      say(b, 'sleepHold');
    } else say(b, 'sleepBreak');
  } else if (kind === 'revive') {
    const mat = reviveMaterial(m.el);
    useItem(b, mat);
    m.hp = Math.min(m.max, Math.ceil((m.max / 2) * gm));
    m.set('asleep', 0);
    b.emit('heal', { target: 'me', amount: m.hp, source: 'revive' });
    say(b, 'revived', { material: MATERIAL_NAMES[mat] });
  } else if (kind === 'bind') {
    bind(b, acc, gm);
  } else if (kind === 'step') {
    S.stepped = gm;
    say(b, 'step');
  } else if (kind === 'lantern') {
    /* the foe's plan for this turn and the next one shows, even under blind */
    S.foresee = 2;
    const held = f.has('stun') || f.has('asleep');
    S.nextIntent = held ? S.intent : pickIntent(f, m, S.intent, b.round + 1, b.random);
    b.emit('foresee', { now: S.intent, next: S.nextIntent });
    say(b, 'lanternLit');
  } else if (kind === 'mirror') {
    if (m.has('asleep')) {
      m.set('asleep', 0);
      f.set('asleep', 2);
      f.set('charged', 0);
      f.set('guard', 0);
      say(b, 'mirrorBack');
    } else {
      m.set('mirror', 2);
      say(b, 'mirrorReady');
    }
  }
  /* the ring rules answer a spell of their own (seal: the V cracks the veil) */
  runRingRules(b, 'spell', kind, grade);
}
