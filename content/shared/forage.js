/*
 * shared/forage.js
 * Job: what plants, rocks and logs may hide (src/money.js). Each spot is tried once a day; about one in three
 * hides something (more with the luck item); the find is a trade good or supply, said by the player, sometimes
 * answered by the companion.
 */

export default {
  chance: 0.35,
  luck: { has: 'charm', add: 0.2 },
  companionChance: 0.5,
  needs: 'intro',
  tables: {
    bush: ['wild_herb', 'herb'],
    butterfly_bush: ['wild_herb', 'feather'],
    flower_patch: ['wild_herb', 'herb'],
    flowerbed: ['wild_herb'],
    garden_bed: ['wild_herb'],
    mushroom_ring: ['glowcap'],
    reeds: ['river_reed', 'feather'],
    rock: ['shiny_pebble'],
    log_pile: ['acorn', 'feather'],
    tree: ['acorn', 'feather'],
    pine: ['acorn'],
    fruit_tree: ['acorn']
  },
  lines: {
    wild_herb: { kid: 'shared.forage.wild_herb', companion: 'shared.forage.wild_herb.rhyme' },
    herb: { kid: 'shared.forage.herb', companion: 'shared.forage.herb.rhyme' },
    feather: { kid: 'shared.forage.feather', companion: 'shared.forage.feather.rhyme' },
    glowcap: { kid: 'shared.forage.glowcap', companion: 'shared.forage.glowcap.rhyme' },
    river_reed: { kid: 'shared.forage.river_reed', companion: 'shared.forage.river_reed.rhyme' },
    shiny_pebble: { kid: 'shared.forage.shiny_pebble', companion: 'shared.forage.shiny_pebble.rhyme' },
    acorn: { kid: 'shared.forage.acorn', companion: 'shared.forage.acorn.rhyme' }
  },
  found: 'shared.forage.found',
  helper: { id: 'pouch', title: 'shared.forage.helper.title', text: 'shared.forage.helper.text', icon: 'coin' }
};
