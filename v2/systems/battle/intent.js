/*
 * intent.js  (engine: battle framework)
 * Job: a telegraphed intent drawn from weights, the way a computer-run side chooses what to do next.
 *
 * Public API:
 *   weightedPick(weights, random, fallback)   one draw: r = random() * total, then walk the keys in their
 *                                             insertion order subtracting each weight; the first key that brings
 *                                             r to 0 or below wins. fallback (or the first key) if none does.
 *   totalWeight(weights)
 */

export function totalWeight(weights) {
  let tot = 0;
  for (const k in weights) tot += weights[k];
  return tot;
}

export function weightedPick(weights, random, fallback) {
  let r = random() * totalWeight(weights);
  for (const k in weights) {
    r -= weights[k];
    if (r <= 0) return k;
  }
  return fallback !== undefined ? fallback : Object.keys(weights)[0];
}
