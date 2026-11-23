/*
 * random.js
 * Job: random number sources for the battle rules, so every outcome can be reproduced.
 *
 * Public API:
 *   seeded(seed)       a function returning numbers in [0, 1), the same sequence for the same seed (mulberry32)
 *   scripted(values)   a function returning the given values in order, then 0.5 forever (for checks)
 */

export function seeded(seed) {
  let a = (seed >>> 0) || 1;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function scripted(values) {
  const queue = Array.isArray(values) ? values.slice() : [];
  const random = () => (queue.length ? queue.shift() : 0.5);
  random.left = () => queue.length;
  return random;
}
