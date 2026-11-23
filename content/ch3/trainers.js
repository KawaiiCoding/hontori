/*
 * ch3/trainers.js
 * Job: the duels of chapter 3: Apprentice Tolle (one hontori, the wind already chooses), Warden Zephra's ring duel
 * (three hontori with an earth and a water kind, so no single element sweeps it) and Cole's rematch in Kitewick
 * (three hontori). Levels keep up with the lead hontori (world rule 66); the chapter sits at levels 8 to 11.
 */

export default [
  {
    id: 'tolle',
    name: 'ch3.name.tolle',
    look: 'tolle',
    venue: 'gale',
    rules: ['noCapture', 'windSwap'],
    purse: true,
    team: [{ kind: 'pufflet', stage: 2, level: { ext: 'leadLevel', add: -1, min: 8, none: 8 } }]
  },
  {
    id: 'zephra',
    name: 'ch3.name.zephra',
    look: 'zephra',
    venue: 'gale',
    rules: ['noCapture', 'windSwap'],
    purse: true,
    team: [
      { kind: 'cragnib', stage: 2, level: { ext: 'leadLevel', add: 0, min: 9, none: 10 } },
      { kind: 'skyfin', stage: 2, level: { ext: 'leadLevel', add: 0, min: 9, none: 10 } },
      { kind: 'breezelet', stage: 3, level: { ext: 'leadLevel', add: 1, min: 10, none: 11 } }
    ],
    banner: { name: 'ch3.trainer.loft', element: 'wind', color: '#a8dcf0', rule: 'ch3.trainer.rule' }
  },
  {
    id: 'cole_kitewick',
    name: 'ch1.name.cole',
    look: 'boy',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'hamster', stage: 2, level: { ext: 'leadLevel', add: -1, min: 8, none: 8 } },
      { kind: 'voltmoth', level: { ext: 'leadLevel', add: -1, min: 8, none: 8 } },
      { kind: 'electric', stage: 2, level: { ext: 'leadLevel', add: 0, min: 9, none: 9 } }
    ]
  }
];
