/*
 * ch10/events.js
 * Job: the story events of chapter 10, the finale: the Athenaeum Stair (open to the tournament winner on
 * c9:complete; the lookout, the rest landing, the locked Council gate and Merrit's sketch), the Athenaeum hall
 * and Vael's note, the three Council chambers, Vael's study and the duel, the Great V over Goldmere, mercy,
 * the new law, Vael's garden of jars, the ending and home; and after the end the Emberbrook fair, the Warden
 * rematches and Vael where he now lives.
 * Every big scene is its own `auto` event that waits for the one before it (fallen, then the Great V, then
 * mercy, then the law), so a journey saved between scenes always picks up at the next one (rule 8).
 * Flags: c10:sketch (the maps lane's ivy side way waits on it), c10:hall, c10:brand, c10:vesk, c10:hale, c10:vael, c10:fallen, c10:greatv, c10:mercy or
 * c10:nomercy, c10:law_shared | c10:law_seen | c10:law_free, c10:law, c10:jars, c10:complete, c10:home, c10:fair.
 */

import P from './places.js';

const JUDGED = { any: ['c10:mercy', 'c10:nomercy'] };
const LAW = { any: ['c10:law_shared', 'c10:law_seen', 'c10:law_free'] };

/* a Warden's friendly duel after the end, wherever they stand (./scripts.js ch10.re.<id>) */
const rematch = (warden) => ({
  id: 'c10_re_' + warden,
  on: { talk: warden },
  if: 'c10:complete',
  once: false,
  /* before every older talk event of the Warden (systems/story/Library.js) */
  priority: 1,
  thenService: false,
  then: [{ run: 'ch10.re.' + warden }]
});

export default [
  {
    id: 'c10_open',
    on: { flag: 'c9:complete' },
    then: [{ quest: 'newlaw', start: true }]
  },

  /* the stair is open only to the tournament winner */
  {
    id: 'c10_stair_shut',
    on: { door: { map: 'goldmere', to: 'athenaeum_stair' }, block: true },
    if: { not: 'c9:complete' },
    once: false,
    then: [{ say: 'ch10.ev.stair.shut.1', who: 'sign' }, { say: 'ch10.ev.stair.shut.2', who: 'kid' }]
  },

  {
    id: 'c10_stair',
    on: { enter: 'athenaeum_stair' },
    delay: 500,
    then: [
      { if: { quest: 'newlaw', is: 'none' }, then: [{ quest: 'newlaw', start: true, quiet: true }] },
      { say: 'ch10.ev.stair.1', who: 'kid' },
      { say: 'ch10.ev.stair.2', who: 'companion' }
    ]
  },
  {
    id: 'c10_lookout',
    on: { area: P.stLookoutBox },
    then: [{ run: 'ch10.lookout' }]
  },
  {
    id: 'c10_lock',
    on: { area: P.stLockBox },
    if: { not: 'c10:sketch' },
    once: false,
    then: [{ run: 'ch10.landing' }]
  },


  /* the Athenaeum */
  {
    id: 'c10_hall',
    on: { enter: 'athenaeum' },
    if: { not: 'c10:hall' },
    delay: 600,
    then: [{ run: 'ch10.hall' }]
  },
  {
    id: 'c10_high_shut',
    on: { door: { map: 'athenaeum', to: 'council_high' }, block: true },
    if: { not: { all: ['c10:brand', 'c10:vesk'] } },
    once: false,
    then: [{ say: 'ch10.ev.high.shut.1', who: 'sign' }, { say: 'ch10.ev.high.shut.2', who: 'kid' }]
  },
  {
    id: 'c10_study_shut',
    on: { door: { map: 'council_high', to: 'vael_study' }, block: true },
    if: { not: 'c10:hale' },
    once: false,
    then: [{ say: 'ch10.ev.study.shut.1', who: 'sign' }, { say: 'ch10.ev.study.shut.2', who: 'kid' }]
  },

  {
    id: 'c10_east',
    on: { enter: 'council_east' },
    if: { not: 'c10:brand' },
    delay: 400,
    then: [{ say: 'ch10.ev.east.1', who: 'kid' }]
  },
  {
    id: 'c10_west',
    on: { enter: 'council_west' },
    if: { not: 'c10:vesk' },
    delay: 400,
    then: [{ say: 'ch10.ev.west.1', who: 'kid' }]
  },
  {
    id: 'c10_high',
    on: { enter: 'council_high' },
    if: { not: 'c10:hale' },
    delay: 400,
    then: [{ say: 'ch10.ev.high.1', who: 'kid' }]
  },
  {
    id: 'c10_brand',
    on: { talk: 'cn_brand' },
    if: { not: 'c10:brand' },
    once: false,
    then: [{ run: 'ch10.brand' }]
  },
  {
    id: 'c10_vesk',
    on: { talk: 'cn_vesk' },
    if: { not: 'c10:vesk' },
    once: false,
    then: [{ run: 'ch10.vesk' }]
  },
  {
    id: 'c10_hale',
    on: { talk: 'cn_hale' },
    if: { not: 'c10:hale' },
    once: false,
    then: [{ run: 'ch10.hale' }]
  },
  {
    id: 'c10_study',
    on: { enter: 'vael_study' },
    if: { not: 'c10:vael' },
    delay: 500,
    then: [{ run: 'ch10.study' }]
  },
  {
    id: 'c10_vael_talk',
    on: { talk: 'orlen' },
    if: { all: [{ map: 'vael_study' }, { not: 'c10:vael' }] },
    once: false,
    thenService: false,
    then: [{ run: 'ch10.vael.ask' }]
  },

  /* the end of the duel, the Great V, mercy and the law: each waits for the one before */
  {
    id: 'c10_fallen',
    on: { auto: true },
    if: { all: ['c10:vael', { not: 'c10:fallen' }, { map: 'vael_study' }] },
    then: [{ run: 'ch10.fallen' }]
  },
  {
    id: 'c10_greatv',
    on: { auto: true },
    if: { all: ['c10:fallen', { map: 'athenaeum' }, { not: 'c10:greatv' }, { not: 'c10:city:wait' }] },
    once: false,
    then: [{ run: 'ch10.city' }]
  },
  {
    id: 'c10_greatv_again',
    on: { talk: 'greycloak' },
    if: { all: ['c10:fallen', { map: 'athenaeum' }, { not: 'c10:greatv' }] },
    once: false,
    thenService: false,
    then: [{ unflag: 'c10:city:wait' }, { run: 'ch10.city' }]
  },
  {
    id: 'c10_mercy',
    on: { auto: true },
    if: { all: ['c10:greatv', { map: 'athenaeum' }, { not: JUDGED }] },
    once: false,
    then: [{ run: 'ch10.mercy' }]
  },
  {
    id: 'c10_law',
    on: { auto: true },
    if: { all: [JUDGED, { map: 'athenaeum' }, { not: 'c10:law' }] },
    once: false,
    then: [{ run: 'ch10.law' }]
  },

  /* Vael's garden, then the ending and home */
  {
    id: 'c10_garden',
    on: { area: P.vgLawnBox },
    if: { all: ['c10:law', { not: 'c10:jars' }] },
    once: false,
    then: [{ run: 'ch10.garden' }]
  },
  {
    id: 'c10_ending',
    on: { auto: true },
    if: { all: ['c10:jars', { not: 'c10:complete' }] },
    then: [{ run: 'ch10.ending' }]
  },
  {
    id: 'c10_home',
    on: { auto: true },
    if: { all: ['c10:complete', { map: 'home' }, { not: 'c10:home' }] },
    then: [{ run: 'ch10.home' }]
  },

  /* after the end */
  {
    id: 'c10_fair',
    on: { area: P.fairGreenBox },
    if: { all: ['c10:complete', { not: 'c10:fair' }] },
    then: [{ run: 'ch10.fair' }]
  },
  {
    id: 'c10_vael_garden',
    on: { talk: 'orlen' },
    if: { all: ['c10:mercy', { map: 'vael_garden' }] },
    once: false,
    thenService: false,
    then: [{ cycle: [[{ say: 'ch10.ev.vael.after.mercy.1', who: 'orlen' }], [{ say: 'ch10.ev.vael.after.mercy.2', who: 'orlen' }]], mode: 'loop' }]
  },
  {
    id: 'c10_vael_study_after',
    on: { talk: 'orlen' },
    if: { all: ['c10:nomercy', { map: 'vael_study' }] },
    once: false,
    thenService: false,
    then: [{ run: 'ch10.vael.closed' }]
  },
  rematch('fern'),
  rematch('zephra'),
  rematch('maren'),
  rematch('volta'),
  rematch('harrow'),
  rematch('brasa'),
  rematch('nox'),
  rematch('aurel')
];
