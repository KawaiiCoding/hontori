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
 *   bind    one try of 3 (chances.bindChance); sureBind makes the third try hold; the third miss lets the foe go
 * Events: spell { kind, target, grade, mul, cost, mana, exp, mastery, masteryUp }, heal, item,
 *   bindTry { chance, success, triesLeft }, status, say, end.
 */

import { SPELLS, BATTLE_SPELLS, GRADES, gradeOf, reviveMaterial, MATERIAL_NAMES } from './spells.js';
import { bindChance, BIND_TRIES } from './chances.js';
import { finish } from './turn.js';
import { me, foe, say, itemCount, useItem, spellMastery, costOf, can } from './common.js';
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
    if (f.hp / f.max > 0.35) return no('weaken', 'refuseWeaken');
  }
  if (kind === 'mend' && m.hp >= m.max && !m.has('asleep')) return no('well', 'refuseWell');
  return SPELLS[kind] ? true : no('shape', 'refuseShape');
}

export function checkSpell(b, kind) {
  const S = b.state;
  if (!BATTLE_SPELLS.includes(kind) || !can(b, kind)) return no('shape', 'refuseShape');
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
  S.spellUsed = true;
  S.mana -= cost;
  const acc = accuracy == null ? 0.5 : accuracy;
  const grade = gradeOf(acc);
  const G = GRADES[grade];
  const gm = G.mul;
  const before = spellMastery(b, kind);
  S.spellXp[kind] = (S.spellXp[kind] || 0) + G.exp;
  S.wandExp += G.exp;
  const mastery = spellMastery(b, kind);
  S.spellMastery[kind] = mastery;
  b.emit('spell', { kind, target: SPELLS[kind].on, grade, mul: gm, cost, mana: S.mana, exp: G.exp, mastery, masteryUp: mastery > before });
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
  }
}
