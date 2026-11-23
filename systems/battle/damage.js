/*
 * damage.js  (engine: battle framework)
 * Job: turn a base power and its multipliers into a whole damage number with a random spread.
 *
 * Public API:
 *   scaleDamage({ base, factors, random, spreadLow, spreadWidth, min })
 *     max(min, round(base * every factor * (spreadLow + random() * spreadWidth)))
 *     defaults: spreadLow 1, spreadWidth 0 (no draw is made then), min 1
 *   product(factors)
 */

export function product(factors) {
  let p = 1;
  for (const f of factors || []) p *= f;
  return p;
}

export function scaleDamage(o) {
  const low = o.spreadLow == null ? 1 : o.spreadLow;
  const width = o.spreadWidth || 0;
  const spread = width ? low + o.random() * width : low;
  const min = o.min == null ? 1 : o.min;
  /* multiplied left to right, so a rule written as one long product rounds the same way */
  let v = o.base;
  for (const f of o.factors || []) v *= f;
  return Math.max(min, Math.round(v * spread));
}
