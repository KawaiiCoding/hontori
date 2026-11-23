/*
 * ch1/events.js
 * Job: the story events of chapter 1 (src/chapter1.js, the Academy gate from src/engine.js academyTrial).
 */

export default [
  {
    id: 'c1_night',
    on: { auto: true },
    if: { all: [{ all: ['intro', { not: 'c1:morning' }] }, { map: 'home' }] },
    then: [{ quest: 'night', start: true }, { say: 'ch1.ev.1', who: 'companion' }]
  },
  {
    id: 'c1_nightdoor',
    on: { door: { map: 'home', to: 'village' }, block: true },
    if: { all: ['intro', { not: 'c1:morning' }] },
    once: false,
    then: [{ say: 'ch1.ev.2', who: 'mom' }, { say: 'ch1.ev.3', who: 'companion' }]
  },
  {
    id: 'c1_morning',
    on: { interact: ['kid_bed', 'bed'], map: 'home' },
    if: { all: ['intro', { not: 'c1:morning' }] },
    then: [
      { sound: 'sleep' },
      { blackout: 2200, then: [{ time: 8 }] },
      { say: 'ch1.ev.4', who: 'kid' },
      { say: 'ch1.ev.5', who: 'mom' },
      { say: 'ch1.ev.6', who: 'companion' },
      { ext: 'draw', sigil: 'veil', text: 'ch1.ev.7' },
      { sound: 'spell' },
      { fx: 'magic', n: 60, dy: -10 },
      { wait: 900 },
      { say: 'ch1.ev.8', who: 'mom' },
      { say: 'ch1.ev.9', who: 'mom' },
      { say: 'ch1.ev.10', who: 'dad' },
      { say: 'ch1.ev.11', who: 'mom' },
      { say: 'ch1.ev.12', who: 'mom' },
      { say: 'ch1.ev.13', who: 'dad' },
      { say: 'ch1.ev.14', who: 'mom' },
      { say: 'ch1.ev.15', who: 'dad' },
      { money: 25, why: 'ch1.ev.16' },
      { say: 'ch1.ev.17', who: 'companion' },
      { flag: 'c1:morning' },
      { quest: 'academy', start: true }
    ]
  },
  {
    id: 'c1_mapgift',
    on: { door: { map: 'home', to: 'village' }, block: true },
    if: { all: ['c1:morning', { not: { has: 'map' } }] },
    once: false,
    then: [
      { say: 'ch1.ev.18', who: 'mom' },
      { move: 'mom', to: { player: [0, -1] } },
      { face: 'mom', dir: 'player' },
      { say: 'ch1.ev.19', who: 'mom' },
      { flag: 'map:gift' },
      { give: 'map' },
      { say: 'ch1.ev.20', who: 'companion' }
    ]
  },
  {
    id: 'c1_gate',
    /* the south road is really closed: the door out is refused until the Academy is done, and Bram says why */
    on: { door: { map: 'village', to: 'whisperwood' }, block: true },
    if: { not: { quest: 'academy', is: 'done' } },
    once: false,
    then: [
      { place: 'bram', at: { player: [0, 1] }, dir: 1 },
      { say: 'ch1.ev.21', who: 'bram' },
      { say: 'ch1.ev.22', who: 'bram' },
      { say: 'ch1.ev.23', who: 'companion' }
    ]
  },
  {
    id: 'c1_pip',
    on: { talk: 'tobin' },
    then: [
      { say: 'ch1.ev.24', who: 'tobin' },
      { say: 'ch1.ev.25', who: 'tobin' },
      { say: 'ch1.ev.26', who: 'companion' },
      { quest: 'pawprints', start: true },
      { flag: 'c1:pip' }
    ]
  },
  {
    id: 'c1_pond',
    on: { area: { map: 'village', x: [0, 16], y: [0, 14] }, rearm: true },
    if: { all: ['c1:pip', { not: 'c1:brook' }, { hour: [18, 5] }] },
    once: false,
    then: [
      {
        if: { not: { ext: 'spell', has: 'bind' } },
        then: [{ say: 'ch1.ev.27', who: 'kid' }, { say: 'ch1.ev.28', who: 'companion' }, { stop: true }]
      },
      { flag: 'c1:pond' },
      { say: 'ch1.ev.29', who: 'kid' },
      { say: 'ch1.ev.30', who: 'companion' },
      {
        battle: { wild: { kind: 'water', level: 3 }, rules: ['sureBind'] },
        captured: [{ flag: 'c1:brook' }, { say: 'ch1.ev.31', who: 'kid' }, { say: 'ch1.ev.32', who: 'companion' }],
        else: [{ say: 'ch1.ev.33', who: 'companion' }]
      }
    ]
  },
  {
    id: 'c1_fenn',
    on: { talk: ['fenn', 'lark'] },
    then: [
      { say: 'ch1.ev.34', who: 'self' },
      { say: 'ch1.ev.35', who: 'self' },
      { quest: 'elder', start: true },
      { flag: 'c1:fenn' }
    ]
  },
  {
    id: 'c1_well',
    on: { talk: 'elder' },
    if: 'c1:fenn',
    then: [
      { say: 'ch1.ev.36', who: 'elder' },
      { say: 'ch1.ev.37', who: 'elder' },
      { say: 'ch1.ev.38', who: 'elder' },
      { say: 'ch1.ev.39', who: 'elder' },
      { say: 'ch1.ev.40', who: 'elder' },
      { say: 'ch1.ev.41', who: 'companion' },
      { flag: 'c1:well' }
    ]
  },
  {
    id: 'c1_letter',
    on: { auto: true },
    if: {
      all: [
        'c1:morning',
        { quest: 'academy', is: 'done' },
        { quest: 'pawprints', is: 'done' },
        { quest: 'elder', is: 'done' },
        { quest: 'woods', is: 'done' }
      ]
    },
    then: [
      { wait: 600 },
      { ext: 'flight', what: 'paper_bird', bring: 'grey_letter' },
      { say: 'ch1.ev.42', who: 'kid' },
      { say: 'ch1.ev.43', who: 'kid' },
      { say: 'ch1.ev.44', who: 'letter' },
      { say: 'ch1.ev.45', who: 'letter' },
      { say: 'ch1.ev.46', who: 'letter' },
      { say: 'ch1.ev.47', who: 'letter' },
      { say: 'ch1.ev.48', who: 'companion' },
      { give: 'grey_letter' },
      { flag: 'c1:complete' },
      { wait: 500 },
      { say: 'ch1.ev.49', who: 'kid' },
      { say: 'ch1.ev.50', who: 'companion' }
    ]
  },
  {
    id: 'c1_tip_bind',
    on: { battleEnd: { wild: true } },
    if: {
      all: [
        { battle: { won: true, captured: false } },
        { not: { ext: 'spell', has: 'bind' } },
        { not: 'tip:bind' }
      ]
    },
    then: [{ flag: 'tip:bind' }, { say: 'ch1.ev.51', who: 'companion' }]
  },
  {
    id: 'c1_tip_mend',
    on: { battleEnd: { wild: true } },
    if: { all: [{ party: { hurt: true } }, { not: 'tip:mend' }] },
    then: [{ flag: 'tip:mend' }, { say: 'ch1.ev.52', who: 'companion' }]
  },
  {
    id: 'c1_tip_mana',
    on: { auto: true },
    if: { all: ['c1:morning', { ext: 'mana', lte: 1 }] },
    then: [{ flag: 'tip:mana' }, { say: 'ch1.ev.53', who: 'companion' }]
  },
  {
    id: 'c1_tip_rain_fire',
    /* a fire hontori in the rain, once: it shivers, and points to warm ramen and a roof */
    on: { auto: true },
    if: { all: ['c1:morning', { not: 'tip:rainfire' }, { weather: 'rain' }, { indoor: false }, { ext: 'lead', element: 'fire' }] },
    then: [
      { flag: 'tip:rainfire' },
      { say: 'ch1.ev.rainfire.1', who: 'companion' },
      { say: 'ch1.ev.rainfire.2', who: 'kid' }
    ]
  },
  {
    id: 'c1_tip_night',
    on: { auto: true },
    if: {
      all: [
        'c1:morning',
        { hour: [20, 5] },
        { not: { all: ['c1:pip', { not: 'c1:pond' }, { not: 'c1:brook' }] } }
      ]
    },
    then: [{ flag: 'tip:night' }, { say: 'ch1.ev.54', who: 'companion' }]
  },
  {
    id: 'c1_academy_gate',
    on: { door: { map: 'village', to: 'school' }, block: true },
    if: { not: 'c1:academy' },
    once: false,
    then: [{ trial: 'academy' }]
  }
];
