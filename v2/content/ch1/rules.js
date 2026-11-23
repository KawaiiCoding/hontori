/*
 * ch1/rules.js
 * Job: chapter 1 rules read by systems: doors that exist only while a condition holds, and sleep rules
 * (while Wet Pawprints waits for night, the player wakes at dusk; world rule 74).
 */

export default {
  doors: [{ map: 'village', to: 'whisperwood', if: { quest: 'academy', is: 'done' } }],
  rest: [
    {
      if: { all: ['c1:pip', { not: 'c1:pond' }, { not: 'c1:brook' }] },
      hour: 19,
      toast: 'ch1.ev.55',
      fullRest: true
    }
  ]
};
