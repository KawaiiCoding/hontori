/*
 * phases.js  (Hontori game layer)
 * Job: the phases of a trainer's hontori (content: a team member's `phases: [{ at, say }]`, at a share of its
 * health). The first time the hontori on the field falls to that share or below (and still stands), it flares
 * up: its blows are PHASE_POWER stronger for the rest of its fight, one short line is said, and a `phase` event
 * lets the screen change the music. Each phase happens once per battle.
 *
 * Public API:
 *   PHASE_POWER            the multiplier on the blows of a hontori in a later phase
 *   checkPhases(b)         call after anything that may hurt the foe; emits phase { index, phase, text } and
 *                          say { id: 'phase', text } (the line is already in the player's language); answers true
 *                          when a phase began (turn.js then runs the ring rules' phase hook)
 *   phasePower(b, fighter) PHASE_POWER for the foe on the field once it has flared up, else 1
 */

import { foe } from './common.js';

export const PHASE_POWER = 1.25;

function memberOnField(b) {
  const S = b.state;
  return S.team ? S.team[S.teamIndex] : null;
}

export function checkPhases(b) {
  const S = b.state;
  const member = memberOnField(b);
  if (!member || !Array.isArray(member.phases) || !member.phases.length) return false;
  const f = foe(b);
  if (!f || f.fainted || !(f.max > 0)) return false;
  if (!S.phases) S.phases = {};
  let began = false;
  member.phases.forEach((phase, i) => {
    const key = `${S.teamIndex}:${i}`;
    const at = Number(phase && phase.at);
    if (S.phases[key] || !(at > 0 && at < 1) || f.hp / f.max > at) return;
    S.phases[key] = true;
    S.flared = S.teamIndex;
    began = true;
    b.emit('phase', { index: S.teamIndex, phase: i + 1, text: (phase && phase.say) || '' });
    if (phase && phase.say) b.emit('say', { id: 'phase', text: phase.say });
  });
  return began;
}

export function phasePower(b, fighter) {
  const S = b.state;
  if (!fighter || fighter.side !== 'foe' || S.flared == null || S.flared !== S.teamIndex) return 1;
  return PHASE_POWER;
}
