/*
 * check.mjs  (Hontori game layer)
 * Job: check Hontori's battle rules against values worked out by hand from the old code (src/battle.js,
 * src/moves.js, src/progress.js, src/money.js), then play whole battles to their end with a seeded random.
 *   node game/battle/check.mjs
 *   node systems/battle/check.mjs game/battle/check.mjs    (framework first, then this)
 * Exports failed (the number of failed checks) for the framework runner.
 */

import { seeded, scripted } from '../../systems/battle/random.js';
import {
  HontoriBattle, HontoriFighter, matrix, weatherMul, hit, rollMiss, intentWeights, pickIntent, quickFoe,
  bindChance, escapeChance, escapeBars, need, hpAt, atkAt, staMax, stageFor, newMember, award, applyEvolve,
  wandAward, wandPerks, gradeOf, masteryOf, spellCost, tolerance, staCost, movesFor, battleRewards, foeMaxHp,
  ringRulesOf, RING_RULES
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
const near = (a, b) => Math.abs(a - b) < 1e-9;

const SPECIES = {
  fox: { element: 'fire', name: 'Fire Hontori' },
  hamster: { element: 'electric', name: 'Sparkmouse' },
  frog: { element: 'water', name: 'Puddlehop' },
  sprout: { element: 'grass', name: 'Sproutling' },
  mole: { element: 'earth', name: 'Burrowkin' },
  raven: { element: 'dark', element2: 'wind', name: 'Duskwing' }
};
const species = (k) => SPECIES[k];
const fighter = (o) => new HontoriFighter(Object.assign({ side: 'me', key: 'x', name: 'X', level: 1, hp: 20, maxHp: 20 }, o));
const day = { time: 12, weather: 'clear', indoor: false };

/* element matrix and weather */
ok('matrix strong', matrix('water', 'fire') === 1.6);
ok('matrix weak', matrix('fire', 'water') === 0.6);
ok('matrix dual both strong, capped 2.56', near(matrix('water', 'fire', 'earth'), 2.56));
ok('matrix dual both weak, floor 0.36', near(matrix('fire', 'water', 'earth'), 0.36));
ok('matrix dual mixed', near(matrix('grass', 'water', 'fire'), 0.96));
ok('weather rain feeds water', weatherMul('water', { time: 12, weather: 'rain' }) === 1.3);
ok('weather rain dulls fire', weatherMul('fire', { time: 12, weather: 'rain' }) === 0.7);
ok('weather indoors is 1', weatherMul('water', { time: 12, weather: 'rain', indoor: true }) === 1);
ok('weather clear day fire', weatherMul('fire', day) === 1.2);
ok('weather clear night fire', weatherMul('fire', { time: 22, weather: 'clear' }) === 1);
ok('weather night dark', weatherMul('dark', { time: 22, weather: 'clear' }) === 1.25);
ok('weather fog dark before night', weatherMul('dark', { time: 22, weather: 'fog' }) === 1.2);
ok('weather night light', weatherMul('light', { time: 3, weather: 'rain' }) === 0.85);

/* damage */
{
  const me = fighter({ element: 'fire', atk: 5 });
  const foe = fighter({ side: 'foe', element: 'grass' });
  ok('damage: 5 x 1.25 atk x 1.6 x 1.2 sun = 12', hit(me, foe, 5, { env: day, random: scripted([0.5, 0.5]) }).amount === 12);
  const f2 = fighter({ side: 'foe', element: 'water', level: 2 });
  ok('damage: foe L2 x 0.75 scale = round(6.72) = 7', hit(f2, me, 5, { env: day, foe: true, random: scripted([0.5, 0.5]) }).amount === 7);
  const big = fighter({ element: 'fire', level: 3, atk: 8 });
  big.set('glow', 2);
  big.set('boost', 1.3);
  const r = hit(big, foe, 8, { env: day, random: scripted([0.01, 0]) });
  ok('damage: crit, glow, flawless rune, low spread = 94', r.amount === 94 && r.crit, r);
  me.set('shield', 1.3);
  const w = hit(f2, me, 8, { env: day, foe: true, mult: 2, random: scripted([0.5, 0.5]) });
  ok('damage: unleash into a flawless ward = 4', w.amount === 4 && w.shielded, w);
  const tough = fighter({ side: 'foe', element: 'fire' });
  tough.set('guard', 1);
  tough.set('harden', 2);
  ok('damage: guard and shell quarter it, never below 1', hit(fighter({ element: 'fire' }), tough, 5, { env: { time: 22, weather: 'clear' }, random: scripted([0.5, 0]) }).amount === 1);
  ok('crit chance 8%, 40% with tailwind', !hit(me, foe, 5, { env: day, random: scripted([0.09, 0.5]) }).crit && (big.set('tail', 3), hit(big, foe, 5, { env: day, random: scripted([0.39, 0.5]) }).crit));
  const misted = fighter({ element: 'water' });
  misted.set('mist', 3);
  ok('miss: mist 40%', rollMiss(misted, me, scripted([0.39])).missed);
  ok('miss: everyone 4%', rollMiss(me, foe, scripted([0.039])).missed && !rollMiss(me, foe, scripted([0.04])).missed);
  const veiled = fighter({ element: 'dark' });
  veiled.set('veil', 1);
  ok('veil dodges', rollMiss(me, veiled, scripted([0.9])).dodged);
}

/* intents and turn order */
{
  const me = fighter({ element: 'fire' });
  const fire = fighter({ side: 'foe', element: 'fire' });
  const w = intentWeights(fire, me, '', 2);
  ok('intent weights fire, full hp', w.strike === 5 && near(w.charge, 3.2) && w.guard === 1.3 && w.heal === 0 && w.hex === 1.1, w);
  ok('intent draw 0.5 of 10.6 -> charge', pickIntent(fire, me, '', 2, scripted([0.5])) === 'charge');
  ok('intent draw 0.4 -> strike', pickIntent(fire, me, '', 2, scripted([0.4])) === 'strike');
  const earth = fighter({ side: 'foe', element: 'earth', hp: 6, maxHp: 20 });
  const we = intentWeights(earth, me, 'guard', 3);
  ok('intent weights earth, low hp, after guard', we.guard === 0 && we.heal === 3 && we.charge === 1.6, we);
  const grass = fighter({ side: 'foe', element: 'grass', hp: 13, maxHp: 20 });
  ok('grass may heal twice in a row (old quirk kept)', intentWeights(grass, me, 'heal', 3).heal === 1.5);
  const water = fighter({ side: 'foe', element: 'water' });
  const w1 = intentWeights(water, me, '', 1);
  ok('round 1: no charge, hex halved', w1.charge === 0 && near(w1.hex, 1.35));
  me.set('asleep', 1);
  ok('no hex while yours sleeps', intentWeights(water, me, '', 3).hex === 0);
  fire.set('charged', 1);
  ok('charged -> unleash', pickIntent(fire, me, '', 3, scripted([])) === 'unleash');
  const zap = fighter({ side: 'foe', element: 'electric' });
  ok('electric foe moves first', quickFoe(zap, fighter({ element: 'fire' })));
  const tailed = fighter({ element: 'fire' });
  tailed.set('tail', 3);
  ok('tailwind or a wind hontori moves first', !quickFoe(zap, tailed) && !quickFoe(zap, fighter({ element: 'wind' })));
}

/* binding and escape */
{
  const me = fighter({ element: 'fire', level: 3 });
  const foe = fighter({ side: 'foe', element: 'water', level: 3, hp: 5, maxHp: 24 });
  foe.set('asleep', 2);
  ok('bind chance clamps at 0.85', bindChance({ foe, me, accuracy: 0.6, gradeMul: 1.3, calm: 0.15, charm: true }) === 0.85);
  const strong = fighter({ side: 'foe', element: 'fire', level: 5, hp: 30, maxHp: 30 });
  ok('bind chance floor 0.05', bindChance({ foe: strong, me: fighter({ element: 'water', level: 3 }), accuracy: 0, gradeMul: 0.7 }) === 0.05);
  const mid = fighter({ side: 'foe', element: 'grass', level: 2, hp: 10, maxHp: 21 });
  ok('bind chance mid = 0.47125', near(bindChance({ foe: mid, me: fighter({ element: 'fire', level: 2 }), accuracy: 0.5, gradeMul: 1, wandPower: 1.05, captureBonus: 0.04 }), 0.47125));
  const stunned = fighter({ side: 'foe', element: 'fire', level: 5 });
  stunned.set('stun', 1);
  const ec = escapeChance({ me: fighter({ element: 'fire', level: 3 }), foe: stunned, tries: 1, quick: true });
  ok('escape chance = 0.64, two bars', near(ec, 0.64) && escapeBars(ec) === 2);
}

/* EXP, levels, stages, stamina, wand */
ok('need(1) 12, need(2) 19, need(5) 50', need(1) === 12 && need(2) === 19 && need(5) === 50);
ok('hp and attack per level and stage', hpAt(5, 2) === 40 && atkAt(5, 2) === 13 && atkAt(2, 1) === 7);
ok('stamina max and costs', staMax(3) === 13 && staCost({ pow: 5 }) === 1 && staCost({ pow: 8 }) === 2 && staCost({ pow: 11 }) === 3 && staCost({ util: 'glow' }) === 1);
ok('stage thresholds 5, 10, 20, 25', [4, 5, 9, 10, 19, 20, 24, 25, 60].map(stageFor).join() === '1,2,2,3,3,4,4,5,5');
{
  const m = newMember('fox', 1, 'fire');
  ok('new member', m.hp === 20 && m.atk === 5 && m.moves.join() === 'ember_nip,warm_glow');
  const ev = award(m, 31, 'fire');
  ok('31 EXP: level 1 -> 3, hp 28, atk 8', m.level === 3 && m.exp === 0 && m.maxHp === 28 && m.hp === 28 && m.atk === 8 && ev[0].from === 1 && ev[0].to === 3, m);
  const ev2 = award(m, 28, 'fire');
  ok('level 4 learns Flare Tail', m.level === 4 && ev2.some((e) => e.type === 'move' && e.move.id === 'flare_tail' && e.equipped));
  const ev3 = award(m, 38, 'fire');
  ok('level 5 may evolve to stage 2', m.level === 5 && ev3.some((e) => e.type === 'canEvolve' && e.to === 2));
  applyEvolve(m, 2);
  ok('evolving raises hp and attack', m.stage === 2 && m.maxHp === 40 && m.hp === 40 && m.atk === 13, m);
  const wand = { level: 1, exp: 0, mana: 1, maxMana: 3 };
  ok('wand level up gives its extra mana', wandAward(wand, 30) === 1 && wand.level === 2 && wand.maxMana === 4 && wand.mana === 2, wand);
  const p = wandPerks(4);
  ok('wand perks at level 4', near(p.power, 1.15) && near(p.captureBonus, 0.12) && p.costCut === 1 && p.maxMana === 6);
}

/* spells */
ok('grades', gradeOf(0.55) === 'flawless' && gradeOf(0.549) === 'strong' && gradeOf(0.25) === 'strong' && gradeOf(0.2) === 'weak' && gradeOf(null) === 'strong');
ok('mastery from spell EXP', masteryOf(5) === 1 && masteryOf(6) === 2 && masteryOf(55) === 4 && masteryOf(56) === 5 && masteryOf(0, 3) === 3);
ok('spell costs', spellCost('stun', 4, { costCut: 0 }) === 1 && spellCost('revive', 1, { costCut: 1 }) === 2 && spellCost('mend', 4, { costCut: 3 }) === 1 && spellCost('veil', 1, {}) === 0);
ok('recognition tolerance', near(tolerance(3, { tolerance: 0.06 }), 0.05) && tolerance(5, { tolerance: 0.12 }) === 0.07);
ok('moves brought into battle', movesFor({ level: 7, moves: ['flare_tail', 'nope'] }, 'fire').map((m) => m.id).join() === 'flare_tail,ember_nip,warm_glow,cinder_dash');

/* rewards and money */
{
  const r = battleRewards({ won: true, captured: true, foeLevel: 3, participants: [0, 1], active: 1, trainer: null }, { partySize: 3 });
  ok('capture EXP: base 34, shares 20 / 34 / 10, wand 35', r.exp.map((e) => e.gain).join() === '20,34,10' && r.wandExp === 35 && r.money === null, r);
  const t = battleRewards({ won: true, foeLevel: 2, participants: [0], active: 0, trainer: 'Cole' }, { partySize: 1 });
  ok('duel win: EXP 33, purse 9 once', t.exp[0].gain === 33 && t.money.add === 9 && t.money.purseKey === 'purse:Cole' && t.wandExp === 20, t);
  ok('purse not paid twice', battleRewards({ won: true, foeLevel: 2, trainer: 'Cole' }, { partySize: 1, pursePaid: () => true }).money === null);
  ok('wild loss drops 10% of coins, 1 to 20', [57, 300, 3].map((c) => battleRewards({ won: false, fled: false }, { coins: c }).money.lose).join() === '6,20,1');
  ok('fleeing costs nothing', battleRewards({ won: false, fled: 'foe' }, { coins: 50 }).money === null);
}

/* whole battles */
const lead = (key, level, extra) => Object.assign(newMember(key, level, SPECIES[key].element), extra);
function play(battle, policy, limit) {
  const all = battle.begin();
  for (let i = 0; i < limit && !battle.over; i++) {
    const ev = policy(battle, i);
    all.push(...ev);
    for (const m of [battle.me, battle.foe]) if (m.hp < 0 || m.hp > m.max) throw new Error('hp out of range');
    if (battle.mana < 0 || battle.mana > battle.maxMana) throw new Error('mana out of range');
  }
  return all;
}
function simple(b) {
  if (b.state.forced) return b.switchTo(b.switchTargets()[0]);
  if (b.canCast('bind') === true) return b.castSpell('bind', 0.6);
  if (b.me.hp < b.me.max / 2 && b.canCast('mend') === true) return b.castSpell('mend', 0.4);
  if (b.canCatchBreath()) return b.catchBreath();
  for (let i = 0; i < b.moves.length; i++) if (!b.cooldown(i) && b.me.sta >= b.moveCost(i)) return b.useMove(i);
  return b.switchTargets().length ? b.switchTo(b.switchTargets()[0]) : b.tryEscape();
}
const wandOf = (spells) => ({ mana: 3, maxMana: 3, spells, loadout: spells, perks: wandPerks(1) });

{
  const b = new HontoriBattle({ party: [lead('fox', 3), lead('frog', 2)], species, env: day, enemy: 'sprout', level: 3,
    wand: wandOf(['mend', 'shield', 'bind', 'stun']), items: [{ id: 'herb', n: 2 }] }, { random: seeded(11) });
  const ev = play(b, simple, 300);
  ok('wild battle ends', b.over && ev[ev.length - 1].type === 'end', b.result);
  ok('wild battle: no rule errors', b.errors.length === 0, b.errors.map(String));
  ok('wild battle report', b.report && typeof b.report.mana === 'number' && b.report.party.length === 2 && b.report.foeLevel === 3);
  ok('mana +1 on round 3', !ev.some((e) => e.type === 'mana' && e.source === 'round') || ev.find((e) => e.type === 'mana' && e.source === 'round').mana <= 3);
}
{
  const team = [{ spirit: 'hamster', level: 1 }, { spirit: 'hamster', level: 2 }];
  const b = new HontoriBattle({ party: [lead('fox', 4), lead('mole', 3)], species, env: day,
    trainer: { name: 'Cole', key: 'boy', team, lesson: 'stun', noCapture: true, noSwitch: true, ban: ['sleep'] },
    noCapture: true, wand: wandOf(['mend', 'stun', 'sleep', 'bind']) }, { random: seeded(5) });
  ok('trainer ban removes the spell', !b.loadout.includes('sleep') && b.loadout.includes('stun'));
  const start = b.begin();
  ok('trainer lesson line on round 1', start.some((e) => e.type === 'say' && e.id === 'lesson'));
  ok('first foe is the team head', b.foe.key === 'hamster' && b.foe.level === 1 && b.foe.max === foeMaxHp(1) && b.team.total === 2);
  ok('electric foe acts first', b.quick);
  const rep = b.castSpell('bind', 0.9);
  ok('binding in a duel: the owner pushes it away, no mana spent', rep[0].reason === 'repel' && b.mana === 3);
  ok('no switching in this ring', b.switchTo(1)[0].reason === 'noSwitch' && !b.canSwitch());
  ok('no escape from a duel', b.tryEscape()[0].reason === 'duel');
  const ev = play(b, simple, 300);
  ok('duel ends', b.over, b.result);
  ok('duel: no rule errors', b.errors.length === 0, b.errors.map(String));
  ok('the second hontori steps in after the first falls', b.result !== 'won' || ev.filter((e) => e.type === 'nextFoe').length === 1);
  ok('duel never leaves a fighter fainted', b.report.party.every((p) => p.hp >= 1));
  const first = ev.findIndex((e) => e.type === 'move');
  ok('quick foe moves before yours', first < 0 || ev[first].side === 'foe');
}
{
  const b = new HontoriBattle({ party: [lead('fox', 2)], species, env: day, enemy: 'frog', level: 1, sureBind: true,
    wand: wandOf(['bind']) }, { random: () => 0.999 });
  b.begin();
  b.foe.hp = 2;
  const tries = [];
  for (let i = 0; i < 3 && !b.over; i++) {
    const ev = b.castSpell('bind', 0.5);
    tries.push(...ev.filter((e) => e.type === 'bindTry'));
    if (!b.over) b.state.spellUsed = false;
    b.state.mana = 3;
  }
  ok('story bind: third spiral always holds', tries.length === 3 && !tries[0].success && !tries[1].success && tries[2].success && b.result === 'captured');
  ok('captured report', b.report.captured && b.report.won && b.report.bound.key === 'frog');
}
{
  const b = new HontoriBattle({ party: [lead('fox', 2)], species, env: day, enemy: 'frog', level: 1, wand: wandOf(['bind']) }, { random: () => 0.999 });
  b.begin();
  b.foe.hp = 2;
  for (let i = 0; i < 3 && !b.over; i++) {
    b.castSpell('bind', 0.5);
    b.state.spellUsed = false;
    b.state.mana = 3;
  }
  ok('three failed spirals: the foe slips away', b.result === 'foeFled' && b.report.fled === 'foe');
}

/* the ring rule of Gale Loft: every 3 rounds the wind swaps yours, at no cost of a turn */
{
  const team = [{ spirit: 'mole', level: 1 }, { spirit: 'frog', level: 1 }];
  const setup = () => ({ party: [lead('fox', 6), lead('frog', 5), lead('sprout', 5)], species, env: day,
    trainer: { name: 'Zephra', key: 'girl', team, rules: ['windSwap'], noCapture: true }, noCapture: true, wand: wandOf(['mend']) });
  ok('windSwap is a ring rule; unknown names are left out', ringRulesOf(['windSwap', 'nope', 'windSwap']).join() === 'windSwap' && RING_RULES.includes('windSwap'));
  const b = new HontoriBattle(setup(), { random: seeded(3) });
  ok('the rule is on', b.state.rules.join() === 'windSwap');
  b.begin();
  const swaps = [];
  for (let i = 0; i < 7 && !b.over; i++) {
    b.me.hp = b.me.max;
    b.foe.hp = b.foe.max;
    const ev = b.useMove(0);
    for (const e of ev) if (e.type === 'switch') swaps.push({ round: b.round, e, said: ev.find((x) => x.type === 'say' && x.id === 'windSwap') });
  }
  ok('the wind swaps on rounds 4 and 7', swaps.map((s) => s.round).join() === '4,7' && swaps.every((s) => s.e.by === 'windSwap' && s.e.free && s.said), swaps.map((s) => s.round));
  ok('windSwap: no rule errors', b.errors.length === 0, b.errors.map(String));
  const quiet = new HontoriBattle({ ...setup(), party: [lead('fox', 6)] }, { random: seeded(3) });
  quiet.begin();
  let none = true;
  for (let i = 0; i < 5 && !quiet.over; i++) {
    quiet.me.hp = quiet.me.max;
    if (quiet.useMove(0).some((e) => e.type === 'switch')) none = false;
  }
  ok('with nobody to swap in, the wind does nothing', none);
  const off = new HontoriBattle({ ...setup(), trainer: { ...setup().trainer, rules: [] } }, { random: seeded(3) });
  off.begin();
  let still = true;
  for (let i = 0; i < 5 && !off.over; i++) {
    off.me.hp = off.me.max;
    if (off.useMove(0).some((e) => e.type === 'switch')) still = false;
  }
  ok('without the rule, nobody is swapped', still);
  const full = new HontoriBattle(setup(), { random: seeded(9) });
  play(full, simple, 300);
  ok('a windSwap duel plays to its end', full.over && full.errors.length === 0, full.result);
}

console.log('hontori battle rules: ' + passed + ' passed, ' + failed + ' failed');
export { failed };
if (import.meta.url === 'file://' + process.argv[1]) {
  if (failed) process.exit(1);
  console.log('all checks passing');
}
