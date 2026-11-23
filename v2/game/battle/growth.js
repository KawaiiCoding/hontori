/*
 * growth.js  (Hontori game layer)
 * Job: hontori EXP, levels, stats and stages (evolution), and the wand's EXP, level and perks
 * (old src/progress.js, the pure parts).
 *
 * Public API:
 *   STAGE_LV = [1, 5, 10, 20, 25], MAX_LV = 60, WAND_MAX = 10
 *   need(level)              EXP from level L to L + 1: round(12 + 6d + 0.9d^2), d = L - 1
 *   hpAt(level, stage)       20 + 4 (L - 1) + 4 (stage - 1)
 *   atkAt(level, stage)      round(5 + 1.5 (L - 1) + 2 (stage - 1))
 *   staMax(level)            10 + L
 *   stageFor(level)          the highest stage whose level is reached (1 .. 5)
 *   newMember(key, level, element)   a fresh party record
 *   fixMember(member, element)       repair a record the way old saves were repaired (mutates, returns it)
 *   award(member, amount, element)   add EXP (mutates); -> events [{ type: 'level', from, to },
 *                            { type: 'move', move, equipped }, { type: 'canEvolve', to }]
 *   canEvolve(member)        a higher stage is reachable and the player has not said "not yet" (hold)
 *   applyEvolve(member, to)  raise the stage; max hp grows and hp grows by the same amount
 *   wandNeed(level)          round(30 + 25 (L - 1)^1.4)
 *   maxManaAt(level)         min(8, 2 + L)
 *   wandPerks(level)         { level, power 1 + 0.05 (L - 1), captureBonus 0.04 (L - 1), costCut floor((L - 1) / 3),
 *                              tolerance 0.03 (L - 1), maxMana }
 *   wandAward(wand, amount)  wand: { level, exp, mana, maxMana } (mutated); -> levels gained. A level up raises
 *                            max mana and gives the extra mana at once
 */

import { learned } from './moves.js';

export const STAGE_LV = Object.freeze([1, 5, 10, 20, 25]);
export const MAX_LV = 60;
export const WAND_MAX = 10;

export function need(L) {
  const d = L - 1;
  return Math.round(12 + 6 * d + 0.9 * d * d);
}
export function hpAt(L, stage) {
  return 20 + (L - 1) * 4 + ((stage || 1) - 1) * 4;
}
export function atkAt(L, stage) {
  return Math.round(5 + (L - 1) * 1.5 + ((stage || 1) - 1) * 2);
}
export function staMax(L) {
  return 10 + (L || 1);
}
export function stageFor(L) {
  let s = 1;
  for (let i = 1; i < STAGE_LV.length; i++) if (L >= STAGE_LV[i]) s = i + 1;
  return s;
}

function fixMoves(m, element) {
  const ids = learned(m.level, element).map((x) => x.id);
  if (!Array.isArray(m.moves) || !m.moves.length) m.moves = ids.slice(0, 4);
  else if (ids.length) m.moves = m.moves.filter((id, i, a) => ids.includes(id) && a.indexOf(id) === i).slice(0, 4);
  return m;
}

export function newMember(key, level, element) {
  const L = Math.max(1, Math.min(MAX_LV, (level | 0) || 1));
  const s = stageFor(L);
  return fixMoves({ key, nick: null, level: L, exp: 0, stage: s, hp: hpAt(L, s), maxHp: hpAt(L, s), atk: atkAt(L, s) }, element);
}

export function fixMember(m, element) {
  if (!m || typeof m !== 'object') return m;
  m.level = Math.max(1, (m.level | 0) || 1);
  m.exp = Math.max(0, +m.exp || 0);
  m.stage = Math.max(1, Math.min(5, (m.stage | 0) || 1));
  const mh = hpAt(m.level, m.stage);
  if (!(m.maxHp >= mh)) {
    const r = m.maxHp ? m.hp / m.maxHp : 1;
    m.maxHp = mh;
    m.hp = Math.max(1, Math.round(mh * r));
  }
  if (m.hp == null || m.hp > m.maxHp) m.hp = m.maxHp;
  m.atk = atkAt(m.level, m.stage);
  if (m.nick === undefined) m.nick = null;
  if (m.sta == null || m.sta > staMax(m.level)) m.sta = staMax(m.level);
  return fixMoves(m, element);
}

export function canEvolve(m) {
  return stageFor(m.level) > (m.stage || 1) && !m.hold;
}

export function award(m, amount, element) {
  fixMember(m, element);
  const ev = [];
  const from = m.level;
  if (m.level >= MAX_LV) return ev;
  const known = learned(m.level, element).map((x) => x.id);
  m.exp += Math.max(0, Math.round(amount || 0));
  while (m.level < MAX_LV && m.exp >= need(m.level)) {
    m.exp -= need(m.level);
    m.level++;
    const oldMax = m.maxHp;
    m.maxHp = hpAt(m.level, m.stage);
    m.hp = Math.min(m.maxHp, m.hp + (m.maxHp - oldMax));
    m.atk = atkAt(m.level, m.stage);
  }
  if (m.level >= MAX_LV) m.exp = 0;
  if (m.level > from) {
    ev.push({ type: 'level', from, to: m.level });
    delete m.hold;
    if (!Array.isArray(m.moves)) m.moves = [];
    for (const mv of learned(m.level, element)) {
      if (known.includes(mv.id)) continue;
      if (m.moves.length < 4) {
        m.moves.push(mv.id);
        ev.push({ type: 'move', move: mv, equipped: true });
      } else ev.push({ type: 'move', move: mv, equipped: false });
    }
  }
  if (canEvolve(m)) ev.push({ type: 'canEvolve', to: stageFor(m.level) });
  return ev;
}

export function applyEvolve(m, to) {
  m.stage = to || stageFor(m.level);
  delete m.hold;
  const oldMax = m.maxHp;
  m.maxHp = hpAt(m.level, m.stage);
  m.hp = Math.min(m.maxHp, m.hp + (m.maxHp - oldMax));
  m.atk = atkAt(m.level, m.stage);
}

export function wandNeed(L) {
  return Math.round(30 + 25 * Math.pow(L - 1, 1.4));
}
export function maxManaAt(L) {
  return Math.min(8, 2 + L);
}
export function wandPerks(level) {
  const L = level || 1;
  return { level: L, power: 1 + 0.05 * (L - 1), captureBonus: 0.04 * (L - 1), costCut: Math.floor((L - 1) / 3), tolerance: 0.03 * (L - 1), maxMana: maxManaAt(L) };
}

export function wandAward(w, amount) {
  w.level = w.level || 1;
  w.exp = w.exp || 0;
  if (w.level >= WAND_MAX) return 0;
  const from = w.level;
  w.exp += Math.max(0, Math.round(amount || 0));
  while (w.level < WAND_MAX && w.exp >= wandNeed(w.level)) {
    w.exp -= wandNeed(w.level);
    w.level++;
  }
  if (w.level >= WAND_MAX) w.exp = 0;
  const ups = w.level - from;
  if (ups) {
    const mm = maxManaAt(w.level);
    w.mana = Math.min(mm, (w.mana == null ? mm : w.mana) + (mm - (w.maxMana || 3)));
    w.maxMana = mm;
  }
  return ups;
}
