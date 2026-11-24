/*
 * ch9/lore.js
 * Job: the readable books of Goldmere, the Glasshouse and Halo Court (content key `lore`, systems/lore): each book's title, pages and
 * kind (lore, hint or notes), and the shelf that holds it (a bookshelf or book stack prop on that map at x, y).
 * Tapping that prop opens the book; every hint pays off later in the journey.
 */

export default {
  books: {
    mirror_glass: { title: 'ch9.lore.mirror_glass', kind: 'notes', pages: ['ch9.lore.mirror_glass.1', 'ch9.lore.mirror_glass.2'] },
    old_law: { title: 'ch9.lore.old_law', kind: 'lore', pages: ['ch9.lore.old_law.1', 'ch9.lore.old_law.2', 'ch9.lore.old_law.3'] },
    sleeping_lanterns: { title: 'ch9.lore.sleeping_lanterns', kind: 'hint', pages: ['ch9.lore.sleeping_lanterns.1', 'ch9.lore.sleeping_lanterns.2'] },
    before_law: { title: 'ch9.lore.before_law', kind: 'lore', pages: ['ch9.lore.before_law.1', 'ch9.lore.before_law.2', 'ch9.lore.before_law.3'] }
  },
  shelves: [
    { book: 'mirror_glass', map: 'glasshouse', x: 7, y: 2 },
    { book: 'old_law', map: 'halo_court', x: 1, y: 24 },
    { book: 'sleeping_lanterns', map: 'goldmere_h4', x: 7, y: 2 },
    { book: 'before_law', map: 'goldmere_h3', x: 4, y: 2 }
  ]
};
