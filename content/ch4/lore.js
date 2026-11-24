/*
 * ch4/lore.js
 * Job: the readable books of Tidewell, the Lullaby Boat and Deepbell Hall (content key `lore`, systems/lore): each book's title, pages and
 * kind (lore, hint or notes), and the shelf that holds it (a bookshelf or book stack prop on that map at x, y).
 * Tapping that prop opens the book; every hint pays off later in the journey.
 */

export default {
  books: {
    silent_bell: { title: 'ch4.lore.silent_bell', kind: 'lore', pages: ['ch4.lore.silent_bell.1', 'ch4.lore.silent_bell.2', 'ch4.lore.silent_bell.3'] },
    storm_gauntlet: { title: 'ch4.lore.storm_gauntlet', kind: 'hint', pages: ['ch4.lore.storm_gauntlet.1', 'ch4.lore.storm_gauntlet.2'] },
    stair_pools: { title: 'ch4.lore.stair_pools', kind: 'hint', pages: ['ch4.lore.stair_pools.1', 'ch4.lore.stair_pools.2'] },
    night_fish: { title: 'ch4.lore.night_fish', kind: 'hint', pages: ['ch4.lore.night_fish.1', 'ch4.lore.night_fish.2'] }
  },
  shelves: [
    { book: 'silent_bell', map: 'lullaby_boat', x: 1, y: 2 },
    { book: 'storm_gauntlet', map: 'deepbell_hall', x: 1, y: 6 },
    { book: 'stair_pools', map: 'tidewell_h2', x: 6, y: 2 },
    { book: 'night_fish', map: 'tidewell_h3', x: 6, y: 2 }
  ]
};
