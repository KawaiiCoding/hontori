/*
 * ch9/trainers.js
 * Job: the duels of chapter 9, levels 25 to 28: the Ring Tournament of Halo Court (./tournaments.js), four rounds
 * in a row under the ring rule pure (no binding, no items): Brannock (earth and fire), Elsbeth (wind and light),
 * Mira (water, her mother watching), and Cole in the final (electric; flawless sigils only). Each team mixes
 * elements so no single lead sweeps the day. Levels keep up with the lead hontori (world rule 66).
 */

export default [
  {
    id: 'th1',
    name: 'ch9.name.th1',
    look: 'th1',
    venue: 'halo',
    rules: ['noCapture', 'pure'],
    purse: true,
    team: [
      { kind: 'slatehorn', stage: 4, level: { ext: 'leadLevel', add: -1, min: 25, none: 25 } },
      { kind: 'magmapup', stage: 4, level: { ext: 'leadLevel', add: -1, min: 25, none: 25 } },
      { kind: 'glasssnail', stage: 3, level: { ext: 'leadLevel', add: 0, min: 25, none: 26 } }
    ]
  },
  {
    id: 'th2',
    name: 'ch9.name.th2',
    look: 'th2',
    venue: 'halo',
    rules: ['noCapture', 'pure'],
    purse: true,
    team: [
      { kind: 'prismbird', stage: 4, level: { ext: 'leadLevel', add: 0, min: 25, none: 26 } },
      { kind: 'kestrip', stage: 4, level: { ext: 'leadLevel', add: 0, min: 25, none: 26 } },
      { kind: 'halofawn', stage: 4, level: { ext: 'leadLevel', add: 0, min: 26, none: 26 } }
    ]
  },
  {
    id: 'mira_halo',
    name: 'ch1.name.mira',
    look: 'girl',
    venue: 'halo',
    rules: ['noCapture', 'pure'],
    purse: true,
    team: [
      { kind: 'coralet', stage: 4, level: { ext: 'leadLevel', add: 0, min: 26, none: 27 } },
      { kind: 'frog', stage: 5, level: { ext: 'leadLevel', add: 0, min: 26, none: 27 } },
      { kind: 'water', stage: 5, level: { ext: 'leadLevel', add: 1, min: 27, none: 27 } }
    ]
  },
  {
    id: 'cole_halo',
    name: 'ch1.name.cole',
    look: 'boy',
    venue: 'halo',
    rules: ['noCapture', 'pure'],
    purse: true,
    team: [
      { kind: 'voltmoth', stage: 4, level: { ext: 'leadLevel', add: 0, min: 27, none: 27 } },
      { kind: 'hamster', stage: 5, level: { ext: 'leadLevel', add: 1, min: 27, none: 28 } },
      { kind: 'electric', stage: 5, level: { ext: 'leadLevel', add: 1, min: 28, none: 28 } }
    ],
    banner: { name: 'ch9.trainer.halo', element: 'light', color: '#ffe9a8', rule: 'ch9.trainer.rule' }
  }
];
