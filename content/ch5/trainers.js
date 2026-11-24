/*
 * ch5/trainers.js
 * Job: the duels of chapter 5, levels 14 to 17: the two grey cloaks at the north gate of Coilhaven (only after speaking out), and
 * the Storm Works gauntlet: Apprentice Pim (one hontori), Foreman Grell (two), Warden Volta Quill (three, with
 * a wind and a water kind among them so an earth lead cannot sweep it). The gauntlet (./gauntlets.js) adds
 * the ring rule noRest to its three duels. Levels keep up with the lead hontori (world rule 66).
 */

export default [
  {
    id: 'greycloak_road1',
    name: 'ch5.name.greycloak',
    look: 'greycloak',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'mothspark', level: { ext: 'leadLevel', add: -1, min: 13, none: 14 } },
      { kind: 'rustcat', level: { ext: 'leadLevel', add: -1, min: 13, none: 14 } }
    ]
  },
  {
    id: 'greycloak_road2',
    name: 'ch5.name.greycloak',
    look: 'greycloak',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'thundercaw', stage: 2, level: { ext: 'leadLevel', add: -1, min: 13, none: 14 } },
      { kind: 'inkling', level: { ext: 'leadLevel', add: 0, min: 14, none: 14 } }
    ]
  },
  {
    id: 'pim',
    name: 'ch5.name.pim',
    look: 'pim',
    venue: 'storm',
    rules: ['noCapture'],
    purse: true,
    team: [{ kind: 'sparkmouse', stage: 2, level: { ext: 'leadLevel', add: -1, min: 14, none: 14 } }]
  },
  {
    id: 'foreman',
    name: 'ch5.name.foreman',
    look: 'foreman',
    venue: 'storm',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'boltbug', stage: 2, level: { ext: 'leadLevel', add: 0, min: 14, none: 15 } },
      { kind: 'copperpup', stage: 2, level: { ext: 'leadLevel', add: 0, min: 15, none: 15 } }
    ]
  },
  {
    id: 'volta',
    name: 'ch5.name.volta',
    look: 'volta',
    venue: 'storm',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'stormowl', stage: 2, level: { ext: 'leadLevel', add: 0, min: 15, none: 16 } },
      { kind: 'wireling', stage: 2, level: { ext: 'leadLevel', add: 0, min: 15, none: 16 } },
      { kind: 'lampwisp', stage: 3, level: { ext: 'leadLevel', add: 1, min: 16, none: 17 } }
    ],
    banner: { name: 'ch5.trainer.works', element: 'electric', color: '#ffe27a', rule: 'ch5.trainer.rule' }
  }
];
