/*
 * spells.js  (engine: battle framework)
 * Job: the two generic halves of a skill-based cast: how well it was performed (a grade from an accuracy) and
 * how practised it is (a level from accumulated EXP).
 *
 * Public API:
 *   gradeFor(accuracy, grades)      grades: [{ id, min }] from best to worst; the first whose min <= accuracy,
 *                                   else the last
 *   levelFromXp(xp, thresholds)     thresholds[i] = EXP needed for level i + 1 (thresholds[0] is level 1);
 *                                   returns 1 .. thresholds.length
 */

export function gradeFor(accuracy, grades) {
  for (const g of grades) if (accuracy >= g.min) return g.id;
  return grades[grades.length - 1].id;
}

export function levelFromXp(xp, thresholds) {
  const x = xp || 0;
  let l = 1;
  while (l < thresholds.length && x >= thresholds[l]) l++;
  return l;
}
