/*
 * elements.js  (Hontori game layer)
 * Job: Hontori's element matrix and weather multipliers (old src/battle.js, lines 11 to 44), on the engine's
 * matchupChart.
 *
 * Public API:
 *   ELEMENTS                       the eight elements, in the old order
 *   STRONG                         element -> the elements it beats
 *   matrix1(attacker, defender)    1.6 strong, 0.6 weak, else 1
 *   matrix(attacker, def, def2)    a dual defender takes both matchups multiplied, clamped to 0.36 .. 2.56
 *   isNight(env)                   env.time >= 19 or < 6
 *   weatherMul(element, env)       the weather and time multiplier for an attack of that element (1 indoors)
 *   weatherWhy(element, env)       the short reason line for that multiplier
 * Attacks always use the attacker's MAIN element; only the defender's two elements count.
 */

import { matchupChart } from '../../systems/battle/elements.js';

export const ELEMENTS = Object.freeze(['water', 'fire', 'wind', 'grass', 'electric', 'earth', 'dark', 'light']);

export const STRONG = Object.freeze({
  water: ['fire', 'earth'],
  fire: ['grass', 'wind'],
  wind: ['grass', 'electric'],
  grass: ['water', 'earth'],
  electric: ['water', 'wind'],
  earth: ['electric', 'fire'],
  dark: ['light'],
  light: ['dark']
});

const CHART = matchupChart({ strong: STRONG, strongMul: 1.6, weakMul: 0.6, min: 0.36, max: 2.56 });

export const matrix1 = CHART.single;
export const matrix = CHART.against;

export function isNight(env) {
  return env.time >= 19 || env.time < 6;
}

export function weatherMul(el, env) {
  const w = env.weather;
  const night = isNight(env);
  if (env.indoor) return 1;
  if (w === 'rain') {
    if (el === 'water' || el === 'electric') return 1.3;
    if (el === 'fire') return 0.7;
  }
  if (w === 'wind' && el === 'wind') return 1.3;
  if (w === 'snow') {
    if (el === 'water') return 1.15;
    if (el === 'grass') return 0.8;
  }
  if (w === 'fog' && el === 'dark') return 1.2;
  if (w === 'clear' && !night && (el === 'fire' || el === 'light')) return 1.2;
  if (night && el === 'dark') return 1.25;
  if (night && el === 'light') return 0.85;
  return 1;
}

export function weatherWhy(el, env) {
  const w = env.weather;
  if (w === 'rain') return el === 'fire' ? 'Rain dulls fire' : 'Rain feeds ' + el;
  if (w === 'wind') return 'The wind lifts wind';
  if (w === 'snow') return el === 'grass' ? 'Snow chills grass' : 'Snow helps water';
  if (w === 'fog') return 'Fog hides dark';
  if (isNight(env)) return el === 'dark' ? 'Night deepens dark' : 'Night dims light';
  return 'Sunlight warms ' + el;
}
