/*
 * check.mjs  (engine: battle framework)
 * Job: check the battle framework with a tiny made-up game, then run the game layer's own check when it is
 * given on the command line.
 *   node systems/battle/check.mjs                                   framework only
 *   node systems/battle/check.mjs game/battle/check.mjs          framework, then that game's rules
 * Prints one line per check and exits with 1 when any fails.
 */

import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import {
  Battle, Fighter, StatusSet, MoveBook, matchupChart, scaleDamage, weightedPick, gradeFor, levelFromXp,
  clamp, seeded, scripted
} from './index.js';

let failed = 0;
let passed = 0;
function ok(name, cond, detail) {
  if (cond) passed++;
  else {
    failed++;
    console.log('FAIL ' + name + (detail !== undefined ? '  got ' + JSON.stringify(detail) : ''));
  }
}
function near(a, b) {
  return Math.abs(a - b) < 1e-9;
}

/* a toy game: each side has one fighter; "hit" deals 3 (or 6 when the attacker is angry), "rage" makes the
   attacker angry for 2 rounds; the bot side hits back; first to 0 hp loses */
const toyRules = {
  setup(b, s) {
    b.addSide('a', [{ n: 'A' }]);
    b.addSide('b', [{ n: 'B' }]);
    b.send('a', 0, new Fighter({ side: 'a', key: 'a', name: 'A', hp: s.hp || 10, maxHp: 10, statuses: ['angry'] }));
    b.send('b', 0, new Fighter({ side: 'b', key: 'b', name: 'B', hp: s.hp || 10, maxHp: 10, statuses: ['angry'] }));
  },
  begin(b) {
    b.emit('say', { text: 'go' });
    b.startRound();
  },
  check(b, action) {
    return action === 'rage' && b.fighter('a').has('angry') ? { reason: 'already', text: 'Already angry.' } : null;
  },
  actions: {
    hit(b) {
      const stop = b.runSteps([
        () => b.emit('damage', { target: 'b', amount: b.fighter('b').damage(b.fighter('a').has('angry') ? 6 : 3) }),
        () => b.emit('damage', { target: 'a', amount: b.fighter('a').damage(b.random() < 0.5 ? 2 : 1) })
      ], () => (b.fighter('b').fainted ? 'win' : b.fighter('a').fainted ? 'lose' : null));
      if (stop) return b.finish(stop, { rounds: b.round });
      b.fighter('a').tick('angry');
      b.startRound();
    },
    rage(b) {
      b.fighter('a').set('angry', 2);
    },
    broken() {
      throw new Error('boom');
    }
  }
};

function toyRun(seed) {
  const b = new Battle(toyRules, {}, { random: seeded(seed) });
  const all = b.begin();
  for (let i = 0; i < 50 && !b.over; i++) all.push(...b.perform(i % 3 === 0 ? 'rage' : 'hit'));
  return { b, all };
}

/* framework: battle flow */
{
  const { b, all } = toyRun(7);
  ok('toy battle ends', b.over && (b.result === 'win' || b.result === 'lose'));
  ok('toy battle has an end event last', all[all.length - 1].type === 'end');
  ok('status changes are events', all.some((e) => e.type === 'status' && e.name === 'angry' && e.value === 2));
  ok('rounds are counted', b.round >= 2 && all.some((e) => e.type === 'round' && e.round === 2));
  ok('no errors', b.errors.length === 0);
  const again = toyRun(7);
  ok('same seed, same events', JSON.stringify(again.all) === JSON.stringify(all));
  const after = b.perform('hit');
  ok('nothing after the end', after.length === 1 && after[0].type === 'refused' && after[0].reason === 'over');
}
{
  const b = new Battle(toyRules, {}, { random: seeded(1) });
  ok('refused before begin', b.perform('hit')[0].reason === 'notBegun');
  b.begin();
  b.perform('rage');
  const r = b.perform('rage');
  ok('rules may refuse', r[0].type === 'refused' && r[0].reason === 'already' && r[0].text === 'Already angry.');
  ok('unknown action refused', b.perform('dance')[0].reason === 'unknown');
  const e = b.perform('broken');
  ok('a throwing rule becomes an error event', e[0].type === 'error' && b.errors.length === 1);
  ok('actions listed', b.actions.join() === 'hit,rage,broken');
}

/* framework: parts */
{
  const changes = [];
  const s = new StatusSet(['burn', 'ward'], (n, v) => changes.push(n + v));
  s.set('burn', 3);
  s.set('burn', 3);
  s.tick('burn');
  s.set('ward', true);
  ok('StatusSet values and ticks', s.get('burn') === 2 && s.get('ward') === 1 && changes.join() === 'burn3,burn2,ward1');
  s.tick('burn', 5);
  ok('tick never below 0', s.get('burn') === 0 && s.list().length === 1);
  let threw = false;
  try { s.set('burnn', 1); } catch (err) { threw = true; }
  ok('unknown status refused', threw);
  const f = new Fighter({ side: 'x', key: 'x', name: 'X', hp: 5, maxHp: 10 });
  ok('Fighter damage and heal clamp', f.damage(7) === 5 && f.hp === 0 && f.fainted && f.heal(25) === 10 && f.hp === 10);
  f.setCooldown('big', 3);
  f.tickCooldowns();
  ok('cooldowns tick', f.cooldown('big') === 2 && f.cooldown('none') === 0);
  const chart = matchupChart({ strong: { a: ['b'], b: ['c'] }, strongMul: 2, weakMul: 0.5, min: 0.25, max: 4 });
  ok('matchup chart', chart.single('a', 'b') === 2 && chart.single('b', 'a') === 0.5 && chart.single('a', 'c') === 1 && chart.against('a', 'b', 'b') === 4);
  ok('scaleDamage', scaleDamage({ base: 10, factors: [1.5, 0.5], random: scripted([0.5]), spreadLow: 0.9, spreadWidth: 0.2 }) === 8);
  ok('scaleDamage minimum', scaleDamage({ base: 1, factors: [0.1], random: scripted([]) }) === 1);
  ok('weightedPick walks in order', weightedPick({ x: 1, y: 3 }, scripted([0.2])) === 'x' && weightedPick({ x: 1, y: 3 }, scripted([0.3])) === 'y');
  ok('weightedPick fallback', weightedPick({}, scripted([0.5]), 'z') === 'z');
  const book = new MoveBook({ t: [{ id: 'b', learnLevel: 5 }, { id: 'a', learnLevel: 1 }, { id: 'c', learnLevel: 1 }] }, 't');
  ok('MoveBook sorts stably by level', book.pool('t').map((m) => m.id).join() === 'a,c,b');
  ok('MoveBook loadout', book.loadout(['c', 'b'], 3, 't', 4).map((m) => m.id).join() === 'c,a');
  ok('gradeFor', gradeFor(0.6, [{ id: 'hi', min: 0.5 }, { id: 'lo', min: 0 }]) === 'hi' && gradeFor(-1, [{ id: 'hi', min: 0.5 }, { id: 'lo', min: 0 }]) === 'lo');
  ok('levelFromXp', levelFromXp(0, [0, 5, 9]) === 1 && levelFromXp(5, [0, 5, 9]) === 2 && levelFromXp(99, [0, 5, 9]) === 3);
  ok('clamp', clamp(5, 0, 1) === 1 && near(clamp(0.5, 0, 1), 0.5));
  const r1 = seeded(42);
  const r2 = seeded(42);
  const xs = [r1(), r1(), r1()];
  const ys = [r2(), r2(), r2()];
  ok('seeded is repeatable and in [0, 1)', xs.every((x, i) => x >= 0 && x < 1 && x === ys[i]));
}

console.log('battle framework: ' + passed + ' passed, ' + failed + ' failed');

const extra = process.argv[2];
if (extra) {
  const mod = await import(pathToFileURL(resolve(extra)).href);
  if (mod && mod.failed) failed += mod.failed;
}
if (failed) process.exit(1);
console.log(extra ? 'all checks passing' : 'all framework checks passing');
