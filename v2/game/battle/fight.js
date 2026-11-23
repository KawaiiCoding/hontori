/*
 * fight.js  (Hontori game layer)
 * Job: what each fighter does on its part of a round: an attack, the kid's hontori's moves (attacks, utility
 * moves, catching breath) and the foe's intents (old src/battle.js attack, meAct, foeAct).
 *
 * Public API:
 *   attack(b, from, move, mult)   from 'me' | 'foe'; -> damage dealt (0 on a miss or dodge)
 *   meAct(b, move)                move may be BREATH
 *   foeAct(b)                     plays b.state.intent
 *   BREATH                        the "Catch breath" pseudo move: +3 stamina (up to the max), no cost
 * Events: say, move { side, id, name, anim, unleash }, miss { attacker, target, dodged },
 *   damage { target, amount, crit, matchup, weather, shielded, guarded, hp, source }, heal { target, amount, source },
 *   stamina { target, change, sta }, skip { side, why: 'dozing' | 'stunned' | 'asleep' },
 *   foeAction { action: 'charge' | 'guard' | 'heal' | 'hex' }, status (from the fighters)
 * Rules worth knowing: a sleeping hontori that is told to move only wakes up (no cost, no cooldown); any hit that
 * leaves the defender standing wakes it; a rune boost is spent by the next attack even if it misses; a ward is
 * spent only by a hit that lands; the foe's signature move is used for unleash (x2) or, on a strike, 30% of the
 * time when it is not resting.
 */

import { rollMiss, hit } from './damage.js';
import { staCost } from './moves.js';
import { me, foe, say } from './common.js';

export const BREATH = Object.freeze({ id: 'breath', name: 'Catch breath', breath: true, desc: '' });

export function attack(b, from, move, mult) {
  const S = b.state;
  const att = from === 'me' ? me(b) : foe(b);
  const to = from === 'me' ? 'foe' : 'me';
  const def = to === 'me' ? me(b) : foe(b);
  const { missed, dodged } = rollMiss(att, def, b.random);
  if (dodged || missed) {
    if (dodged) def.set('veil', 0);
    b.emit('miss', { attacker: from, target: to, dodged });
    say(b, dodged ? (to === 'me' ? 'dodgedMe' : 'dodgedFoe') : 'missed');
    att.set('boost', 0);
    return 0;
  }
  const r = hit(att, def, move.pow, { env: S.env, mult, wandPower: S.wandPower, foe: from === 'foe', random: b.random });
  def.damage(r.amount);
  att.set('boost', 0);
  if (r.shielded) def.set('shield', 0);
  b.emit('damage', { target: to, amount: r.amount, crit: r.crit, matchup: r.matchup, weather: r.weather, shielded: r.shielded, guarded: r.guarded, hp: def.hp, source: 'move' });
  const notes = [];
  if (r.crit) notes.push('Critical!');
  if (r.shielded) notes.push('Warded');
  if (r.guarded) notes.push('Guarded');
  say(b, notes.length ? 'hitNotes' : 'hitLine', { move: move.name, notes: notes.join(' ') });
  if (def.has('asleep') && def.hp > 0) def.set('asleep', 0);
  return r.amount;
}

function stamina(b, m, change) {
  b.emit('stamina', { target: 'me', change, sta: m.sta });
}

export function meAct(b, move) {
  const m = me(b);
  const f = foe(b);
  if (m.fainted) return;
  if (m.has('asleep')) {
    m.set('asleep', 0);
    b.emit('skip', { side: 'me', why: 'dozing' });
    say(b, 'dozes');
    return;
  }
  if (move.cd) m.setCooldown(move.id, move.cd);
  if (move.breath) {
    const gain = Math.min(m.staMax - m.sta, 3);
    m.sta += gain;
    stamina(b, m, gain);
    say(b, 'breath', { name: m.name });
    return;
  }
  const cost = staCost(move);
  const before = m.sta;
  m.sta = Math.max(0, m.sta - cost);
  stamina(b, m, m.sta - before);
  say(b, 'moveName', { move: move.name });
  b.emit('move', { side: 'me', id: move.id, name: move.name, anim: move.anim || move.id, util: move.util || null });
  if (move.pow) {
    attack(b, 'me', move);
    return;
  }
  switch (move.util) {
    case 'glow': m.set('glow', 3); say(b, 'glow'); break;
    case 'mist': f.set('mist', 3); say(b, 'mist'); break;
    case 'tail': m.set('tail', 3); say(b, 'tail'); break;
    case 'root': m.set('root', 3); say(b, 'root'); break;
    case 'harden': m.set('harden', 2); say(b, 'harden'); break;
    case 'veil': m.set('veil', 1); say(b, 'veil'); break;
    case 'static': {
      const dmg = 1 + (b.random() < 0.5 ? 1 : 0);
      f.damage(dmg);
      b.emit('damage', { target: 'foe', amount: dmg, crit: false, matchup: 1, weather: 1, shielded: false, guarded: false, hp: f.hp, source: 'static' });
      if (b.random() < 0.4) {
        f.set('stun', 1);
        f.set('charged', 0);
        say(b, 'staticStun');
      } else say(b, 'staticMiss');
      break;
    }
    case 'bless': {
      const h = m.heal(6);
      m.set('asleep', 0);
      b.emit('heal', { target: 'me', amount: h, source: 'bless' });
      say(b, 'bless');
      break;
    }
    default: break;
  }
}

export function foeAct(b) {
  const S = b.state;
  const f = foe(b);
  const m = me(b);
  if (f.fainted) return;
  if (f.has('stun')) {
    f.set('stun', 0);
    b.emit('skip', { side: 'foe', why: 'stunned' });
    say(b, 'foeStunned');
    return;
  }
  if (f.has('asleep')) {
    f.tick('asleep');
    b.emit('skip', { side: 'foe', why: 'asleep' });
    say(b, f.has('asleep') ? 'foeSleeps' : 'foeWakes');
    return;
  }
  const intent = S.intent;
  if (intent === 'strike' || intent === 'unleash') {
    const sig = S.foeMoves[1];
    const unleash = intent === 'unleash';
    const use = unleash || (!f.cooldown(sig.id) && b.random() < 0.3) ? sig : S.foeMoves[0];
    if (use.cd) f.setCooldown(use.id, use.cd);
    say(b, unleash ? 'foeUnleash' : 'foeUses', { move: use.name });
    f.set('charged', 0);
    b.emit('move', { side: 'foe', id: use.id, name: use.name, anim: use.anim || use.id, unleash });
    attack(b, 'foe', use, unleash ? 2 : 1);
  } else if (intent === 'charge') {
    say(b, 'foeCharge');
    b.emit('foeAction', { action: 'charge' });
    f.set('charged', 1);
  } else if (intent === 'guard') {
    say(b, 'foeGuard');
    b.emit('foeAction', { action: 'guard' });
  } else if (intent === 'heal') {
    b.emit('foeAction', { action: 'heal' });
    const h = f.heal(4 + f.level);
    b.emit('heal', { target: 'foe', amount: h, source: 'intent' });
    say(b, 'foeHeal');
  } else if (intent === 'hex') {
    say(b, 'foeHex');
    b.emit('foeAction', { action: 'hex' });
    if (m.has('veil')) {
      m.set('veil', 0);
      say(b, 'hexVeil');
    } else if (b.random() < 0.45) {
      m.set('asleep', 1);
      say(b, 'hexSleep');
    } else say(b, 'hexResist');
  }
  S.lastIntent = intent;
}
