/*
 * ch10/trainers.js
 * Job: the duels of chapter 10, levels 28 to 30, and the Warden rematches after the end.
 * The Council keeps the rules it took from the schools (owner design), one old rule in each chamber:
 *   Councillor Brand (east, earth and fire)   noSwitch, the rule of Rootwood Hall
 *   Councillor Vesk (west, water and wind)    noRest, the rule of the Storm Works: two duels back to back
 *   Councillor Hale (high, dark and electric) blind, the rule of Hollow Moon
 * Grand Archmage Orlen Vael (dark and light, five hontori) fights under the new rule seal: at the start of each
 * of his turns he seals one of the kid's loadout spells, until only the V is left; the V is never sealed. His
 * ace fights in two phases (`phases` on the team member, as Brasa's): at half health phase two begins with one
 * short line, and from then on drawing the V weakens his shield (the library decides how, shown on screen).
 * Each duel is a run of its own (./gauntlets.js), so a lost duel is fought again from that duel.
 * After the end every Warden offers a friendly duel (`<warden>_last`): the purse is paid on the first win only.
 * Levels keep up with the lead hontori (world rule 66).
 */

const L = (add, min) => ({ ext: 'leadLevel', add, min, none: min });

export default [
  {
    id: 'cn_brand',
    name: 'ch10.name.cn_brand',
    look: 'cn_brand',
    venue: 'athenaeum',
    rules: ['noCapture', 'noSwitch'],
    purse: true,
    team: [
      { kind: 'slatehorn', stage: 5, level: L(0, 28) },
      { kind: 'magmapup', stage: 5, level: L(0, 28) },
      { kind: 'kilnturtle', stage: 4, level: L(1, 28) }
    ],
    banner: { name: 'ch10.trainer.council', element: 'earth', color: '#d8c0a0', rule: 'ch10.trainer.brand.rule' }
  },
  {
    id: 'cn_vesk',
    name: 'ch10.name.cn_vesk',
    look: 'cn_vesk',
    venue: 'athenaeum',
    rules: ['noCapture', 'noRest'],
    purse: true,
    team: [
      { kind: 'driftjelly', stage: 4, level: L(0, 28) },
      { kind: 'stormowl', stage: 4, level: L(0, 28) }
    ],
    banner: { name: 'ch10.trainer.council', element: 'water', color: '#a8d0f0', rule: 'ch10.trainer.vesk.rule' }
  },
  {
    id: 'cn_vesk_2',
    name: 'ch10.name.cn_vesk',
    look: 'cn_vesk',
    venue: 'athenaeum',
    rules: ['noCapture', 'noRest'],
    purse: true,
    team: [
      { kind: 'skyfin', stage: 5, level: L(1, 29) },
      { kind: 'frostwhisk', stage: 5, level: L(1, 29) }
    ],
    banner: { name: 'ch10.trainer.council', element: 'wind', color: '#c8f0e8', rule: 'ch10.trainer.vesk.rule' }
  },
  {
    id: 'cn_hale',
    name: 'ch10.name.cn_hale',
    look: 'cn_hale',
    venue: 'athenaeum',
    rules: ['noCapture', 'blind'],
    purse: true,
    team: [
      { kind: 'thundercaw', stage: 5, level: L(1, 29) },
      { kind: 'nightfin', stage: 4, level: L(1, 29) },
      { kind: 'cindershade', stage: 4, level: L(1, 29) }
    ],
    banner: { name: 'ch10.trainer.council', element: 'dark', color: '#b8a8d8', rule: 'ch10.trainer.hale.rule' }
  },
  {
    id: 'vael_duel',
    name: 'ch3.name.orlen',
    look: 'orlen',
    venue: 'athenaeum',
    rules: ['noCapture', 'seal'],
    purse: true,
    team: [
      { kind: 'gloomowl', stage: 5, level: L(1, 29) },
      { kind: 'prismbird', stage: 5, level: L(1, 29) },
      { kind: 'veilcat', stage: 5, level: L(1, 30) },
      { kind: 'halofawn', stage: 5, level: L(2, 30) },
      {
        kind: 'duskmantle',
        stage: 5,
        level: L(2, 30),
        phases: [{ at: 0.5, say: 'ch10.trainer.vael.phase' }]
      }
    ],
    banner: { name: 'ch10.trainer.vael', element: 'light', color: '#f0e0b0', rule: 'ch10.trainer.vael.rule' }
  },

  /* after the end: the Wardens, once more, for the joy of it */
  {
    id: 'fern_last',
    name: 'ch2.name.fern',
    look: 'warden',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'tortoise', stage: 5, level: L(0, 30) },
      { kind: 'mossram', stage: 5, level: L(0, 30) },
      { kind: 'sunsprout', stage: 5, level: L(1, 30) }
    ]
  },
  {
    id: 'zephra_last',
    name: 'ch3.name.zephra',
    look: 'zephra',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'kestrip', stage: 5, level: L(0, 30) },
      { kind: 'cinderhawk', stage: 5, level: L(0, 30) },
      { kind: 'wind', stage: 5, level: L(1, 30) }
    ]
  },
  {
    id: 'maren_last',
    name: 'ch4.name.maren',
    look: 'maren',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'bellfish', stage: 5, level: L(0, 30) },
      { kind: 'seapup', stage: 5, level: L(0, 30) },
      { kind: 'brinetail', stage: 5, level: L(1, 30) }
    ]
  },
  {
    id: 'volta_last',
    name: 'ch5.name.volta',
    look: 'volta',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'wireling', stage: 5, level: L(0, 30) },
      { kind: 'copperpup', stage: 5, level: L(0, 30) },
      { kind: 'sparkmouse', stage: 5, level: L(1, 30) }
    ]
  },
  {
    id: 'harrow_last',
    name: 'ch6.name.harrow',
    look: 'harrow',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'cragnib', stage: 5, level: L(0, 30) },
      { kind: 'geodeling', stage: 5, level: L(0, 30) },
      { kind: 'rumbletoad', stage: 5, level: L(1, 30) }
    ]
  },
  {
    id: 'brasa_last',
    name: 'ch7.name.brasa',
    look: 'brasa',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'ashmoth', stage: 5, level: L(0, 30) },
      { kind: 'kilnturtle', stage: 5, level: L(0, 30) },
      { kind: 'flarefox', stage: 5, level: L(1, 30) }
    ]
  },
  {
    id: 'nox_last',
    name: 'ch8.name.nox',
    look: 'nox',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'shadepup', stage: 5, level: L(0, 30) },
      { kind: 'mothlight', stage: 5, level: L(0, 30) },
      { kind: 'raven', stage: 5, level: L(1, 30) }
    ]
  },
  {
    id: 'aurel_last',
    name: 'ch9.name.aurel',
    look: 'aurel',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'sunkit', stage: 5, level: L(0, 30) },
      { kind: 'starcat', stage: 5, level: L(0, 30) },
      { kind: 'glimmerbee', stage: 5, level: L(1, 30) }
    ]
  }
];
