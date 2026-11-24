/*
 * ch8/trainers.js
 * Job: the duels of chapter 8, levels 23 to 26. The Council captain fights the kid and Nox together (battle mode
 * ally: the kid's lead and Nox's hontori against the captain's two; Nox's side is `ally` on the battle command
 * in ./scripts.js). No apprentice duel at Hollow Moon (the shape break): the captain's attack takes its place.
 * Warden Nox Ardley duels under the ring rule blind (the foe's plan is hidden, one spell slot is sealed).
 * Levels keep up with the lead (world rule 66).
 */

export default [
  {
    id: 'captain',
    name: 'ch8.name.captain',
    look: 'captain',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'cindershade', stage: 4, level: { ext: 'leadLevel', add: 0, min: 23, none: 24 } },
      { kind: 'shadeboar', stage: 4, level: { ext: 'leadLevel', add: 0, min: 23, none: 24 } }
    ]
  },
  {
    id: 'nox',
    name: 'ch8.name.nox',
    look: 'nox',
    venue: 'hollowmoon',
    rules: ['noCapture', 'blind'],
    purse: true,
    team: [
      { kind: 'gloomowl', stage: 4, level: { ext: 'leadLevel', add: 0, min: 24, none: 25 } },
      { kind: 'nightfin', stage: 4, level: { ext: 'leadLevel', add: 0, min: 24, none: 25 } },
      { kind: 'veilcat', stage: 5, level: { ext: 'leadLevel', add: 1, min: 25, none: 26 } }
    ],
    banner: { name: 'ch8.trainer.moon', element: 'dark', color: '#9d8cd8', rule: 'ch8.trainer.rule' }
  }
];
