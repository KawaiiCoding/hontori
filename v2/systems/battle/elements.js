/*
 * elements.js  (engine: battle framework)
 * Job: a type matchup chart built from data: which kinds beat which, and by how much.
 *
 * Public API:
 *   matchupChart({ strong, strongMul, weakMul, min, max })
 *     strong: kind -> [kinds it beats]. Returns:
 *       single(attacker, defender)       strongMul if the attacker beats the defender, weakMul if the defender beats
 *                                        the attacker, else 1
 *       against(attacker, def, def2)     a two-kind defender: both matchups multiplied, clamped to min .. max
 *       kinds                            every kind named in the chart
 */

export function matchupChart(o) {
  const strong = o.strong || {};
  const strongMul = o.strongMul == null ? 2 : o.strongMul;
  const weakMul = o.weakMul == null ? 0.5 : o.weakMul;
  const min = o.min == null ? 0 : o.min;
  const max = o.max == null ? Infinity : o.max;
  const single = (a, d) => {
    if (strong[a] && strong[a].includes(d)) return strongMul;
    if (strong[d] && strong[d].includes(a)) return weakMul;
    return 1;
  };
  const against = (a, d, d2) => (d2 ? Math.max(min, Math.min(max, single(a, d) * single(a, d2))) : single(a, d));
  const kinds = [...new Set(Object.keys(strong).concat(...Object.values(strong)))];
  return Object.freeze({ single, against, kinds });
}
