/*
 * ch6/lore.js
 * Job: the readable books of Stonehollow, the Drum Circle and Bedrock Hall (content key `lore`, systems/lore): each book's title, pages and
 * kind (lore, hint or notes), and the shelf that holds it (a bookshelf or book stack prop on that map at x, y).
 * Tapping that prop opens the book; every hint pays off later in the journey.
 */

export default {
  books: {
    drum_ground: { title: 'ch6.lore.drum_ground', kind: 'notes', pages: ['ch6.lore.drum_ground.1', 'ch6.lore.drum_ground.2'] },
    crucible_heat: { title: 'ch6.lore.crucible_heat', kind: 'hint', pages: ['ch6.lore.crucible_heat.1', 'ch6.lore.crucible_heat.2'] },
    first_wonder: { title: 'ch6.lore.first_wonder', kind: 'lore', pages: ['ch6.lore.first_wonder.1', 'ch6.lore.first_wonder.2', 'ch6.lore.first_wonder.3'] },
    dark_tunnels: { title: 'ch6.lore.dark_tunnels', kind: 'hint', pages: ['ch6.lore.dark_tunnels.1', 'ch6.lore.dark_tunnels.2'] },
    wand_sanctum: { title: 'ch6.lore.wand_sanctum', kind: 'notes', pages: ['ch6.lore.wand_sanctum.1', 'ch6.lore.wand_sanctum.2'] }
  },
  shelves: [
    { book: 'drum_ground', map: 'drum_circle', x: 6, y: 12 },
    { book: 'crucible_heat', map: 'bedrock_hall', x: 1, y: 6 },
    { book: 'first_wonder', map: 'bedrock_hall', x: 26, y: 6 },
    { book: 'dark_tunnels', map: 'stonehollow_h2', x: 6, y: 2 },
    { book: 'wand_sanctum', map: 'stonehollow_h4', x: 7, y: 2 }
  ]
};
