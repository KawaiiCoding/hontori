/*
 * ch2/trainers.js
 * Job: the duels of chapter 2 (src/chapter2.js): one hontori each with Bryn, the ring duel with Warden Fern
 * (no switching), the grey cloak's two hontori. Levels keep up with the lead hontori (world rule 66).
 */

export default [
  {
    id: 'bryn',
    name: 'ch2.name.bryn',
    look: 'apprentice',
    venue: 'rootwood',
    rules: ['noCapture', 'noSwitch'],
    purse: true,
    team: [{ kind: 'tortoise', level: { ext: 'leadLevel', add: -1, min: 4, none: 4 } }]
  },
  {
    id: 'fern',
    name: 'ch2.name.fern',
    look: 'warden',
    venue: 'rootwood',
    rules: ['noCapture', 'noSwitch'],
    purse: true,
    team: [{ kind: 'sunsprout', stage: 2, level: { ext: 'leadLevel', add: 1, min: 6, none: 5 } }],
    banner: { name: 'ch2.trainer.hall', element: 'grass', color: '#7ed957', rule: 'ch2.trainer.rule' }
  },
  {
    id: 'greycloak',
    name: 'ch2.name.greycloak',
    look: 'greycloak',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'raven', level: { ext: 'leadLevel', add: -1, min: 5, none: 5 } },
      { kind: 'firefly', level: { ext: 'leadLevel', add: 0, none: 5 } }
    ]
  }
];
