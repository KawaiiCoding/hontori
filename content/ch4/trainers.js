/*
 * ch4/trainers.js
 * Job: the duels of chapter 4: Apprentice Isk (one hontori, the tide already rises), Warden Maren's ring duel
 * (three hontori: water kinds with a wind one, so neither a fire nor a grass lead sweeps it) and Mira's rematch
 * in Tidewell (three hontori). Levels keep up with the lead hontori (world rule 66); the chapter sits at 11 to 14.
 */

export default [
  {
    id: 'isk',
    name: 'ch4.name.isk',
    look: 'isk',
    venue: 'deepbell',
    rules: ['noCapture', 'tideRise'],
    purse: true,
    team: [{ kind: 'tidecrab', stage: 2, level: { ext: 'leadLevel', add: -1, min: 11, none: 11 } }]
  },
  {
    id: 'maren',
    name: 'ch4.name.maren',
    look: 'maren',
    venue: 'deepbell',
    rules: ['noCapture', 'tideRise'],
    purse: true,
    team: [
      { kind: 'seapup', stage: 2, level: { ext: 'leadLevel', add: 0, min: 12, none: 13 } },
      { kind: 'driftjelly', stage: 2, level: { ext: 'leadLevel', add: 0, min: 12, none: 13 } },
      { kind: 'brinetail', stage: 3, level: { ext: 'leadLevel', add: 1, min: 13, none: 14 } }
    ],
    banner: { name: 'ch4.trainer.hall', element: 'water', color: '#7cc4e8', rule: 'ch4.trainer.rule' }
  },
  {
    id: 'mira_tidewell',
    name: 'ch1.name.mira',
    look: 'girl',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'frog', stage: 2, level: { ext: 'leadLevel', add: -1, min: 11, none: 11 } },
      { kind: 'coralet', level: { ext: 'leadLevel', add: -1, min: 11, none: 11 } },
      { kind: 'water', stage: 3, level: { ext: 'leadLevel', add: 0, min: 12, none: 12 } }
    ]
  }
];
