/*
 * ch7/trainers.js
 * Job: the duels of chapter 7, levels 20 to 23: Apprentice Kell at the door of the Ember Crucible (one hontori),
 * and Warden Brasa in the ring (three, under the ring rule heat: mana does not refill during the fight). Her
 * lead, a grown flarefox, fights in two phases: at half health it flares up once, with one short line
 * (`phases` on the team member, read by the heat rule of the library). A kilnturtle among her team stands up to
 * water leads, so no single element sweeps the ring. Levels keep up with the lead hontori (world rule 66).
 */

export default [
  {
    id: 'kell',
    name: 'ch7.name.kell',
    look: 'kell',
    venue: 'crucible',
    rules: ['noCapture'],
    purse: true,
    team: [{ kind: 'soothound', stage: 3, level: { ext: 'leadLevel', add: -1, min: 20, none: 21 } }]
  },
  {
    id: 'brasa',
    name: 'ch7.name.brasa',
    look: 'brasa',
    venue: 'crucible',
    rules: ['noCapture', 'heat'],
    purse: true,
    team: [
      { kind: 'ashmoth', stage: 3, level: { ext: 'leadLevel', add: 0, min: 21, none: 22 } },
      { kind: 'kilnturtle', stage: 3, level: { ext: 'leadLevel', add: 0, min: 21, none: 22 } },
      {
        kind: 'flarefox',
        stage: 3,
        level: { ext: 'leadLevel', add: 1, min: 22, none: 23 },
        phases: [{ at: 0.5, say: 'ch7.trainer.brasa.phase' }]
      }
    ],
    banner: { name: 'ch7.trainer.crucible', element: 'fire', color: '#ff9a52', rule: 'ch7.trainer.rule' }
  }
];
