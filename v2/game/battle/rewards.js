/*
 * rewards.js  (Hontori game layer)
 * Job: what a finished battle gives: EXP for every party member, wand EXP and money
 * (old src/progress.js onBattleEnd and src/money.js afterBattle).
 *
 * Public API:
 *   battleRewards(report, { partySize, coins, pursePaid })
 *     report: Battle.report. partySize: the party length after the battle (a bound hontori that joined counts).
 *     pursePaid(key): true when that trainer's purse was already paid.
 *     -> { exp: [{ index, gain }], wandExp, money: { add, purseKey } | { lose } | null }
 *   EXP only after a win or a capture: base = round((10 + 6 * foe level) * (1.5 trainer) * (1.2 captured));
 *     the hontori on the field at the end gets all of it, others that fought 0.6, the rest of the party 0.3
 *     (each at least 1). Wand EXP: 10 won + 25 captured + 10 trainer.
 *   Money: a trainer's first win pays 5 + 2 * foe level (purse key 'purse:' + trainer name, or 'purse:duel');
 *     losing to a wild hontori drops round(10% of the coins), at least 1, at most 20. Fleeing costs nothing.
 *   The foe level is the FIRST foe's level, also for a team.
 */

export function battleRewards(report, o) {
  const r = report || {};
  const opts = o || {};
  const lvl = r.foeLevel || 1;
  const trainer = !!r.trainer;
  let money = null;
  const purseKey = 'purse:' + (typeof r.trainer === 'string' ? r.trainer : 'duel');
  if (r.won && trainer && !(opts.pursePaid && opts.pursePaid(purseKey))) money = { add: 5 + 2 * lvl, purseKey };
  else if (!r.won && !r.fled && !r.captured && !trainer) money = { lose: Math.min(20, Math.max(1, Math.round((opts.coins || 0) * 0.1))) };
  const size = opts.partySize == null ? (r.party || []).length : opts.partySize;
  if (!size || !(r.won || r.captured)) return { exp: [], wandExp: 0, money };
  const base = Math.round((10 + lvl * 6) * (trainer ? 1.5 : 1) * (r.captured ? 1.2 : 1));
  const parts = Array.isArray(r.participants) && r.participants.length ? r.participants : [0];
  const active = typeof r.active === 'number' ? r.active : parts[parts.length - 1];
  const exp = [];
  for (let i = 0; i < size; i++) {
    const share = i === active ? 1 : parts.includes(i) ? 0.6 : 0.3;
    exp.push({ index: i, gain: Math.max(1, Math.round(base * share)) });
  }
  const wandExp = (r.won ? 10 : 0) + (r.captured ? 25 : 0) + (trainer ? 10 : 0);
  return { exp, wandExp, money };
}
