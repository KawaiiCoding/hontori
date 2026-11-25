/*
 * ch10/quests.js
 * Job: the quests of chapter 10. A New Law is the main road (it starts with c9:complete): the stair, the three
 * Councillors, the Grand Archmage, the Great V, mercy, the law, and the garden of jars. After the end two open
 * quests point at what is still there to enjoy: the Emberbrook fair and a friendly duel with every Warden.
 * Targets come from ./places.js.
 */

import P from './places.js';

const COUNCIL = ['c10:brand', 'c10:vesk', 'c10:hale'];
const WARDENS = ['c10:re:fern', 'c10:re:zephra', 'c10:re:maren', 'c10:re:volta', 'c10:re:harrow', 'c10:re:brasa', 'c10:re:nox', 'c10:re:aurel'];

export default [
  {
    id: 'newlaw',
    icon: 'light',
    title: 'ch10.quest.law',
    desc: 'ch10.quest.law.desc',
    steps: [
      { id: 'stair', text: 'ch10.quest.law.stair', done: 'c10:landing', target: [P.stLock] },
      {
        id: 'council',
        text: {
          pick: [
            [{ all: ['c10:brand', 'c10:vesk'] }, 'ch10.quest.law.council.3'],
            [{ atLeast: 1, of: ['c10:brand', 'c10:vesk'] }, 'ch10.quest.law.council.2']
          ],
          else: 'ch10.quest.law.council.1'
        },
        done: { all: COUNCIL },
        target: [{ if: { not: 'c10:brand' }, ...P.ceBrand }, { if: { not: 'c10:vesk' }, ...P.cwVesk }, P.chHale]
      },
      { id: 'vael', text: 'ch10.quest.law.vael', done: 'c10:vael', target: [P.vsVael] },
      { id: 'city', text: 'ch10.quest.law.city', done: 'c10:greatv', target: [P.ahGreatV] },
      { id: 'mercy', text: 'ch10.quest.law.mercy', done: { any: ['c10:mercy', 'c10:nomercy'] }, target: [P.ahVael] },
      { id: 'law', text: 'ch10.quest.law.write', done: 'c10:law', target: [P.ahVael] },
      { id: 'garden', text: 'ch10.quest.law.garden', done: 'c10:jars', target: [P.vgGate] }
    ]
  },
  {
    id: 'fair',
    icon: 'star',
    title: 'ch10.quest.fair',
    desc: 'ch10.quest.fair.desc',
    steps: [{ id: 'visit', text: 'ch10.quest.fair.visit', done: 'c10:fair', target: [P.fair1] }]
  },
  {
    id: 'wardens',
    icon: 'paw',
    title: 'ch10.quest.wardens',
    desc: 'ch10.quest.wardens.desc',
    steps: [
      {
        id: 'duels',
        text: {
          pick: [
            [{ atLeast: 6, of: WARDENS }, 'ch10.quest.wardens.3'],
            [{ atLeast: 3, of: WARDENS }, 'ch10.quest.wardens.2']
          ],
          else: 'ch10.quest.wardens.1'
        },
        done: { all: WARDENS }
      }
    ]
  }
];
