/*
 * chances.js  (engine: battle framework)
 * Job: small helpers for odds.
 *
 * Public API:
 *   clamp(value, lo, hi)
 *   roll(random, chance)     true with that chance (one draw)
 */

export function clamp(value, lo, hi) {
  return Math.max(lo, Math.min(hi, value));
}

export function roll(random, chance) {
  return random() < chance;
}
