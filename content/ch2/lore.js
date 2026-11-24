/*
 * ch2/lore.js
 * Job: the readable books of Mossgrove and Rootwood Hall (content key `lore`, systems/lore): each book's title, pages and
 * kind (lore, hint or notes), and the shelf that holds it (a bookshelf or book stack prop on that map at x, y).
 * Tapping that prop opens the book; every hint pays off later in the journey.
 */

export default {
  books: {
    burr_carvings: { title: 'ch2.lore.burr_carvings', kind: 'lore', pages: ['ch2.lore.burr_carvings.1', 'ch2.lore.burr_carvings.2', 'ch2.lore.burr_carvings.3'] },
    gale_winds: { title: 'ch2.lore.gale_winds', kind: 'hint', pages: ['ch2.lore.gale_winds.1', 'ch2.lore.gale_winds.2'] },
    eight_wardens: { title: 'ch2.lore.eight_wardens', kind: 'lore', pages: ['ch2.lore.eight_wardens.1', 'ch2.lore.eight_wardens.2', 'ch2.lore.eight_wardens.3'] }
  },
  shelves: [
    { book: 'burr_carvings', map: 'moss_house1', x: 9, y: 2 },
    { book: 'gale_winds', map: 'rootwood_hall', x: 1, y: 6 },
    { book: 'eight_wardens', map: 'rootwood_hall', x: 22, y: 6 }
  ]
};
