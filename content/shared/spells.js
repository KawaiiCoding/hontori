/*
 * shared/spells.js
 * Job: every spell (src/battle.js SPELLS): name, mana cost, colour, target, what it does, its shape and how to draw it.
 * world spells are learned outside battle and never take a battle slot (world rule 58). Starting spell: mend.
 */

export default {
  start: ['mend'],
  list: {
    mend: {
      id: 'mend',
      name: 'shared.spell.mend',
      cost: 1,
      color: '#9cf0a6',
      on: 'me',
      desc: 'shared.spell.mend.desc',
      shape: 'circle',
      howText: 'shared.spell.how.circle'
    },
    shield: {
      id: 'shield',
      name: 'shared.spell.shield',
      cost: 1,
      color: '#8fd8ff',
      on: 'me',
      desc: 'shared.spell.shield.desc',
      shape: 'U',
      howText: 'shared.spell.how.U'
    },
    boost: {
      id: 'boost',
      name: 'shared.spell.boost',
      cost: 1,
      color: '#ffb35a',
      on: 'me',
      desc: 'shared.spell.boost.desc',
      shape: 'peak',
      howText: 'shared.spell.how.peak'
    },
    stun: {
      id: 'stun',
      name: 'shared.spell.stun',
      cost: 2,
      color: '#ffe27a',
      on: 'foe',
      desc: 'shared.spell.stun.desc',
      shape: 'zigzag',
      howText: 'shared.spell.how.zigzag'
    },
    sleep: {
      id: 'sleep',
      name: 'shared.spell.sleep',
      cost: 2,
      color: '#b9a8ff',
      on: 'foe',
      desc: 'shared.spell.sleep.desc',
      shape: 'wave',
      howText: 'shared.spell.how.wave'
    },
    bind: {
      id: 'bind',
      name: 'shared.spell.bind',
      cost: 2,
      color: '#ffd98a',
      on: 'foe',
      desc: 'shared.spell.bind.desc',
      shape: 'spiral',
      howText: 'shared.spell.how.spiral'
    },
    revive: {
      id: 'revive',
      name: 'shared.spell.revive',
      cost: 3,
      color: '#fff0d0',
      on: 'me',
      desc: 'shared.spell.revive.desc',
      shape: 'star',
      howText: 'shared.spell.how.star'
    },
    veil: {
      id: 'veil',
      name: 'shared.spell.veil',
      cost: 0,
      color: '#ffd98a',
      on: 'me',
      desc: 'shared.spell.veil.desc',
      shape: 'V',
      howText: 'shared.spell.how.V',
      world: true
    },
    fish: {
      id: 'fish',
      name: 'shared.spell.fish',
      cost: 1,
      color: '#7fd8ff',
      on: 'me',
      desc: 'shared.spell.fish.desc',
      shape: 'hook',
      howText: 'shared.spell.how.hook',
      world: true
    }
  },
  battleOrder: ['mend', 'shield', 'boost', 'stun', 'sleep', 'bind', 'revive']
};
