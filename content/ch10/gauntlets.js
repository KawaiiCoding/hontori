/*
 * ch10/gauntlets.js
 * Job: the duels of the Athenaeum as runs (content `gauntlets`, run by systems/features/Gauntlet.js, as the
 * Storm Works in chapter 5): before each duel the run keeps a save point, so a lost duel is fought again from
 * that duel, in the same shape. Leaving the chamber ends the run (the next try starts at its first duel).
 *   council_brand   one duel, noSwitch (east chamber)
 *   council_vesk    two duels back to back, noRest: no bed, no ramen, no teddy between them (west chamber)
 *   council_hale    one duel, blind (high chamber)
 *   vael            the Grand Archmage, rule seal, two phases (Vael's study)
 * `music` names the tune the library plays for that battle (Council duel, Vael).
 */

export default {
  council_brand: {
    venue: 'council_east',
    rules: [],
    done: 'c10:brand',
    left: 'ch10.gauntlet.left',
    stages: [
      {
        battle: { opponent: 'cn_brand', music: 'council' },
        before: [{ face: 'cn_brand', dir: 'player' }, { say: 'ch10.ev.brand.go', who: 'cn_brand' }],
        won: [{ say: 'ch10.ev.brand.won', who: 'cn_brand' }]
      }
    ]
  },
  council_vesk: {
    venue: 'council_west',
    rules: ['noRest'],
    done: 'c10:vesk',
    left: 'ch10.gauntlet.left',
    stages: [
      {
        battle: { opponent: 'cn_vesk', music: 'council' },
        before: [{ face: 'cn_vesk', dir: 'player' }, { say: 'ch10.ev.vesk.go', who: 'cn_vesk' }],
        won: [{ say: 'ch10.ev.vesk.mid.1', who: 'cn_vesk' }, { say: 'ch10.ev.vesk.mid.2', who: 'cn_vesk' }]
      },
      {
        battle: { opponent: 'cn_vesk_2', music: 'council' },
        before: [{ say: 'ch10.ev.vesk.go.2', who: 'cn_vesk' }],
        won: [{ say: 'ch10.ev.vesk.won', who: 'cn_vesk' }]
      }
    ]
  },
  council_hale: {
    venue: 'council_high',
    rules: [],
    done: 'c10:hale',
    left: 'ch10.gauntlet.left',
    stages: [
      {
        battle: { opponent: 'cn_hale', music: 'council' },
        before: [{ face: 'cn_hale', dir: 'player' }, { say: 'ch10.ev.hale.go', who: 'cn_hale' }],
        won: [{ say: 'ch10.ev.hale.won', who: 'cn_hale' }]
      }
    ]
  },
  vael: {
    venue: 'vael_study',
    rules: [],
    done: 'c10:vael',
    left: 'ch10.gauntlet.left',
    stages: [
      {
        battle: { opponent: 'vael_duel', music: 'vael' },
        before: [{ face: 'orlen', dir: 'player' }, { say: 'ch10.ev.vael.go', who: 'orlen' }],
        won: []
      }
    ]
  }
};
