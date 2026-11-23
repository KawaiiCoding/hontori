/*
 * ch2/scripts.js
 * Job: the scripts of chapter 2: Ranger Moss at the muddy road, Ivo at the maze, the sprout trial, the ring duel,
 * the grey cloak's duel.
 */

export default {
  'ch2.svc.maze': [
    { if: 'c2:maze', then: [{ say: 'ch2.ev.1', who: 'ivo' }, { stop: true }] },
    {
      choose: [
        {
          text: 'ch2.ev.2',
          then: [{ puzzle: 'root_maze', do: 'reset' }, { sound: 'step' }, { say: 'ch2.ev.3', who: 'ivo' }]
        },
        { text: 'ch2.ev.4', then: [{ say: 'ch2.ev.5', who: 'ivo' }] }
      ],
      cancel: 1
    }
  ],
  'ch2.sprouts': [
    { say: 'ch2.ev.6', who: 'fern' },
    { ext: 'draw', sigil: 'mend', text: 'ch2.ev.sprout.draw.1' },
    { sound: 'sparkle' },
    { fx: 'sparkle', n: 14, dy: -10 },
    { toast: 'ch2.ev.sprout.awake.1' },
    { wait: 500 },
    { say: 'ch2.ev.7', who: 'fern' },
    { ext: 'draw', sigil: 'mend', text: 'ch2.ev.sprout.draw.2' },
    { sound: 'sparkle' },
    { fx: 'sparkle', n: 14, dy: -10 },
    { toast: 'ch2.ev.sprout.awake.2' },
    { wait: 500 },
    { say: 'ch2.ev.8', who: 'fern' },
    { ext: 'draw', sigil: 'mend', text: 'ch2.ev.sprout.draw.3' },
    { sound: 'sparkle' },
    { fx: 'sparkle', n: 14, dy: -10 },
    { toast: 'ch2.ev.sprout.awake.3' },
    { wait: 500 },
    { flag: 'c2:sprouts' },
    { say: 'ch2.ev.9', who: 'fern' },
    { say: 'ch2.ev.10', who: 'companion' }
  ],
  'ch2.ringduel': [
    { say: 'ch2.ev.11', who: 'fern' },
    { say: 'ch2.ev.12', who: 'fern' },
    {
      choose: [
        { text: 'ch2.ev.13', then: [] },
        { text: 'ch2.ev.notyet', then: [{ say: 'ch2.ev.14', who: 'fern' }, { stop: true }] }
      ],
      cancel: 1
    },
    {
      battle: { opponent: 'fern' },
      after: 'wake',
      won: [
        { flag: 'c2:ring' },
        { ext: 'ring', element: 'grass' },
        { give: 'ring_leaf' },
        { money: 50, why: 'ch2.ev.15' },
        { say: 'ch2.ev.16', who: 'fern' },
        { say: 'ch2.ev.17', who: 'fern' },
        { say: 'ch2.ev.18', who: 'companion' }
      ],
      else: [{ say: 'ch2.ev.19', who: 'fern' }]
    }
  ],
  'ch2.cloakduel': [
    {
      battle: { opponent: 'greycloak' },
      after: 'wake',
      won: [
        { flag: 'c2:cloak' },
        { say: 'ch2.ev.20', who: 'greycloak' },
        {
          move: 'greycloak',
          path: [[21, 16], [21, 17], [21, 18], [21, 19], [21, 20], [21, 21], [21, 22]],
          speed: 300
        },
        { remove: 'greycloak' },
        { say: 'ch2.ev.21', who: 'companion' },
        { if: { not: 'wl:free' }, then: [{ say: 'ch2.ev.22', who: 'companion' }] },
        { offer: 'c2' }
      ],
      else: [{ face: 'greycloak', dir: 2 }, { say: 'ch2.ev.23', who: 'greycloak' }]
    }
  ],
  'ch2.ranger': [
    { say: 'ch2.ev.72', who: 'ranger_moss' },
    { say: 'ch2.ev.73', who: 'ranger_moss' },
    { say: 'ch2.ev.74', who: 'companion' }
  ]
};
