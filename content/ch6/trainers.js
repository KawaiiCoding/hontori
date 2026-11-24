/*
 * ch6/trainers.js
 * Job: the duels of chapter 6, levels 17 to 20: Quarryman Bask in the Old Quarry (two hontori, optional, a good
 * climb toward level 20), Apprentice Dunn in Bedrock Hall (one hontori, world rule 66), and Warden Harrow, who
 * duels wand to wand (ring rule wandDuel: no hontori on the field). Harrow's `wand` is the data the wandDuel
 * rule reads: her focus, and the order she draws her sigils in, which repeats, so a watchful kid can read it
 * (ward = Shield Sigil, seal = Thunder Seal, strike = Rally Rune). Levels keep up with the lead (rule 66).
 */

export default [
  {
    id: 'bask',
    name: 'ch6.name.bask',
    look: 'bask',
    rules: ['noCapture'],
    purse: true,
    team: [
      { kind: 'pebblequail', stage: 3, level: { ext: 'leadLevel', add: -1, min: 17, none: 18 } },
      { kind: 'burrowkit', stage: 3, level: { ext: 'leadLevel', add: 0, min: 18, none: 18 } }
    ]
  },
  {
    id: 'dunn_hollow',
    name: 'ch6.name.dunn_hollow',
    look: 'dunn_hollow',
    venue: 'bedrock',
    rules: ['noCapture'],
    purse: true,
    team: [{ kind: 'slatehorn', stage: 3, level: { ext: 'leadLevel', add: 0, min: 19, none: 19 } }]
  },
  {
    id: 'harrow',
    name: 'ch6.name.harrow',
    look: 'harrow',
    venue: 'bedrock',
    rules: ['noCapture', 'wandDuel'],
    purse: true,
    team: [],
    wand: { focus: 8, kidFocus: 8, pattern: ['shield', 'boost', 'stun', 'boost'] },
    banner: { name: 'ch6.trainer.hall', element: 'earth', color: '#c9a46a', rule: 'ch6.trainer.rule' }
  }
];
