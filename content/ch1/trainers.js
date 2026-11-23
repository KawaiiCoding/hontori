/*
 * ch1/trainers.js
 * Job: the Academy classmates (src/academy.js STUDENTS). A practice duel: no binding, no purse on rematches,
 * the party is healed after. The team grows with the player: max(base, lead level - 1) plus each member's step.
 */

export default [
  {
    id: 'cole',
    name: 'ch1.name.cole',
    look: 'boy',
    venue: 'academy',
    lesson: 'stun',
    rules: ['noCapture', 'practice'],
    purse: true,
    team: [
      { kind: 'hamster', level: { ext: 'leadLevel', add: -1, min: 1 } },
      { kind: 'electric', level: { add: [{ ext: 'leadLevel', add: -1, min: 1 }, 1] } }
    ]
  },
  {
    id: 'mira',
    name: 'ch1.name.mira',
    look: 'girl',
    venue: 'academy',
    lesson: 'sleep',
    rules: ['noCapture', 'practice'],
    purse: true,
    team: [
      { kind: 'squirrel', level: { ext: 'leadLevel', add: -1, min: 2 } },
      { kind: 'frog', level: { ext: 'leadLevel', add: -1, min: 2 } },
      { kind: 'water', level: { add: [{ ext: 'leadLevel', add: -1, min: 2 }, 1] } }
    ]
  }
];
