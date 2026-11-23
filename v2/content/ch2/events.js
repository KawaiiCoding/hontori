/*
 * ch2/events.js
 * Job: the story events of chapter 2 (src/chapter2.js): the road south, Rootwood Hall and the Leaf Ring,
 * the grey cloak at the well, the Light in the Well and the Dawn Star.
 */

export default [
  {
    id: 'c2_start',
    on: { flag: 'c1:complete' },
    then: [{ quest: 'leafring', start: true }, { say: 'ch2.ev.24', who: 'companion' }]
  },
  {
    id: 'c2_ranger',
    on: { area: { map: 'whisperwood', x: [22, 27], y: [37, 39] }, rearm: true },
    if: { not: 'c1:complete' },
    once: false,
    then: [{ run: 'ch2.ranger' }]
  },
  {
    id: 'c2_ranger_door',
    on: { door: { map: 'whisperwood', to: 'mossgrove' }, block: true },
    if: { not: 'c1:complete' },
    once: false,
    then: [{ run: 'ch2.ranger' }]
  },
  {
    id: 'c2_maze',
    on: { auto: true },
    if: { all: [{ map: 'rootwood_gate' }, { not: 'c2:maze' }] },
    then: [{ say: 'ch2.ev.25', who: 'ivo' }, { say: 'ch2.ev.26', who: 'ivo' }]
  },
  {
    id: 'c2_arrive',
    on: { auto: true },
    if: { all: [{ map: 'mossgrove' }, 'c1:complete'] },
    then: [{ say: 'ch2.ev.27', who: 'kid' }, { say: 'ch2.ev.28', who: 'companion' }]
  },
  {
    id: 'c2_fern',
    on: { talk: 'fern' },
    if: { all: ['c1:complete', { not: 'c2:ring' }] },
    once: false,
    then: [
      {
        branch: [
          {
            if: { not: 'c2:fern' },
            then: [
              { say: 'ch2.ev.29', who: 'fern' },
              { say: 'ch2.ev.30', who: 'fern' },
              { say: 'ch2.ev.31', who: 'fern' },
              { flag: 'c2:fern' },
              { run: 'ch2.sprouts' }
            ]
          },
          { if: { not: 'c2:sprouts' }, then: [{ run: 'ch2.sprouts' }] },
          { if: { not: 'c2:bryn' }, then: [{ say: 'ch2.ev.32', who: 'fern' }] }
        ],
        else: [{ run: 'ch2.ringduel' }]
      }
    ]
  },
  {
    id: 'c2_bryn',
    on: { talk: 'bryn' },
    if: { not: 'c2:bryn' },
    once: false,
    then: [
      { if: { not: 'c2:sprouts' }, then: [{ say: 'ch2.ev.33', who: 'bryn' }, { stop: true }] },
      { say: 'ch2.ev.34', who: 'bryn' },
      { say: 'ch2.ev.35', who: 'bryn' },
      {
        choose: [
          { text: 'ch2.ev.36', then: [] },
          { text: 'ch2.ev.notyet', then: [{ say: 'ch2.ev.37', who: 'bryn' }, { stop: true }] }
        ],
        cancel: 1
      },
      {
        battle: { opponent: 'bryn' },
        after: 'wake',
        won: [
          { flag: 'c2:bryn' },
          { say: 'ch2.ev.38', who: 'bryn' },
          { say: 'ch2.ev.39', who: 'bryn' },
          { say: 'ch2.ev.40', who: 'companion' }
        ],
        else: [{ say: 'ch2.ev.41', who: 'bryn' }]
      }
    ]
  },
  {
    id: 'c2_grey',
    on: { enter: 'mossgrove' },
    if: { all: ['c2:ring', { not: 'c2:cloak' }, { not: 'c2:cloakmet' }] },
    once: false,
    then: [
      { spawn: 'greycloak', at: { map: 'mossgrove', x: 21, y: 15, dir: 2 } },
      { wait: 400 },
      { say: 'ch2.ev.42', who: 'kid' },
      { say: 'ch2.ev.43', who: 'greycloak' },
      { say: 'ch2.ev.44', who: 'greycloak' },
      { say: 'ch2.ev.45', who: 'greycloak' },
      { say: 'ch2.ev.46', who: 'greycloak' },
      { say: 'ch2.ev.47', who: 'kid' },
      { say: 'ch2.ev.48', who: 'greycloak' },
      { flag: 'c2:cloakmet' },
      { run: 'ch2.cloakduel' }
    ]
  },
  {
    id: 'c2_grey_stand',
    on: { enter: 'mossgrove' },
    if: { all: ['c2:cloakmet', { not: 'c2:cloak' }] },
    once: false,
    then: [{ spawn: 'greycloak', at: { map: 'mossgrove', x: 21, y: 15, dir: 2 } }]
  },
  {
    id: 'c2_grey_again',
    on: { talk: 'greycloak' },
    if: { all: ['c2:cloakmet', { not: 'c2:cloak' }] },
    once: false,
    thenService: false,
    then: [
      { say: 'ch2.ev.49', who: 'greycloak' },
      { say: 'ch2.ev.50', who: 'kid' },
      {
        choose: [
          { text: 'ch2.ev.51', then: [{ run: 'ch2.cloakduel' }] },
          { text: 'ch2.ev.notyet', then: [{ say: 'ch2.ev.52', who: 'greycloak' }] }
        ],
        cancel: 1
      }
    ]
  },
  { id: 'wl_start', on: { flag: 'c1:well' }, then: [{ quest: 'wellight', start: true }] },
  {
    id: 'wl_well',
    on: { interact: 'well', map: 'village' },
    if: { all: ['c1:well', { not: 'wl:free' }] },
    once: false,
    then: [
      {
        branch: [
          { if: { not: { hour: [19, 5] } }, then: [{ say: 'ch2.ev.53', who: 'kid' }] },
          {
            if: { not: 'wl:hum' },
            then: [
              { sound: 'sparkle' },
              { fx: 'sparkle', n: 6, dy: -8 },
              { say: 'ch2.ev.54', who: 'kid' },
              { say: 'ch2.ev.55', who: 'kid' },
              { flag: 'wl:hum' },
              { say: 'ch2.ev.56', who: 'companion' }
            ]
          },
          {
            if: { not: 'c2:ring' },
            then: [{ say: 'ch2.ev.57', who: 'kid' }, { say: 'ch2.ev.58', who: 'companion' }]
          }
        ],
        else: [
          { say: 'ch2.ev.59', who: 'kid' },
          { ext: 'draw', sigil: 'veil', text: 'ch2.ev.60' },
          { sound: 'spell' },
          { fx: 'magic', n: 24, dy: -10 },
          { wait: 700 },
          { sound: 'sparkle' },
          { fx: 'sparkle', n: 20, dy: -24 },
          { wait: 500 },
          { say: 'ch2.ev.61', who: 'lumen' },
          { say: 'ch2.ev.62', who: 'lumen' },
          { flag: 'wl:free' },
          { toast: 'ch2.ev.63' }
        ]
      }
    ]
  },
  {
    id: 'wl_cup',
    on: { talk: 'elder' },
    if: { all: ['wl:free', { not: 'wl:cup' }] },
    then: [
      { say: 'ch2.ev.64', who: 'elder' },
      { say: 'ch2.ev.65', who: 'lumen' },
      { say: 'ch2.ev.66', who: 'elder' },
      { say: 'ch2.ev.67', who: 'lumen' },
      { ext: 'learn', spell: 'revive' },
      { sound: 'wand' },
      { toast: 'ch2.ev.68' },
      { flag: 'wl:cup' },
      { say: 'ch2.ev.69', who: 'elder' }
    ]
  },
  {
    id: 'c2_rowan',
    on: { talk: 'rowan' },
    if: { all: [{ map: 'mossgrove' }, 'c2:ring'] },
    then: [{ say: 'ch2.ev.70', who: 'rowan' }, { say: 'ch2.ev.71', who: 'rowan' }]
  }
];
