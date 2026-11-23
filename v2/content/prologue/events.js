/*
 * prologue/events.js
 * Job: a new journey: the picture story, the movement choice, then the fire hontori comes down the chimney
 * at home at night, gives the wand and teaches the V (world rules 1 to 5, 46).
 */

export default [
  {
    id: 'pro_start',
    on: { newGame: true },
    then: [
      { story: 'prologue' },
      { wait: 500 },
      { ask: 'controls' },
      { wait: 3600 },
      { fade: 600 },
      { sound: 'cough' },
      { wait: 700 },
      { say: 'pro.intro.1', who: 'kid' },
      { companion: 'join', kind: 'hontori', entrance: 'chimney', from: 'fireplace' },
      { say: 'pro.intro.2', who: 'companion' },
      { say: 'pro.intro.3', who: 'kid' },
      { say: 'pro.intro.4', who: 'companion' },
      { say: 'pro.intro.5', who: 'companion' },
      { say: 'pro.intro.6', who: 'kid' },
      { say: 'pro.intro.7', who: 'companion' },
      { say: 'pro.intro.9', who: 'companion' },
      { sound: 'wand' },
      { toast: 'pro.intro.8' },
      { wait: 2800 },
      { ext: 'draw', sigil: 'veil', text: 'pro.intro.10' },
      { sound: 'spell' },
      { fx: 'magic', n: 90, dy: -16, at: 'player' },
      { fx: 'sparkle', n: 60, dy: -16, at: 'player' },
      { flash: true },
      { wait: 1200 },
      { say: 'pro.intro.11', who: 'companion' },
      { flag: 'intro' },
      { if: { party: { size: { eq: 0 } } }, then: [{ ext: 'addHontori', kind: 'hontori' }] },
      {
        if: { not: { party: { named: true } } },
        then: [
          { say: 'pro.intro.12', who: 'companion' },
          {
            ask: 'name',
            target: 'lead',
            title: 'pro.intro.13',
            as: 'nick',
            then: [{ say: 'pro.intro.14', who: 'companion' }]
          }
        ]
      },
      { give: 'wand', quiet: true },
      { give: 'ember_dust', quiet: true }
    ]
  }
];
