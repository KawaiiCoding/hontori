/*
 * ch3/lore.js
 * Job: the readable books of Kitewick and Gale Loft (content key `lore`, systems/lore): each book's title, pages and
 * kind (lore, hint or notes), and the shelf that holds it (a bookshelf or book stack prop on that map at x, y).
 * Tapping that prop opens the book; every hint pays off later in the journey.
 */

export default {
  books: {
    kite_mail: { title: 'ch3.lore.kite_mail', kind: 'notes', pages: ['ch3.lore.kite_mail.1', 'ch3.lore.kite_mail.2'] },
    lost_kites: { title: 'ch3.lore.lost_kites', kind: 'hint', pages: ['ch3.lore.lost_kites.1', 'ch3.lore.lost_kites.2'] },
    deepbell_tide: { title: 'ch3.lore.deepbell_tide', kind: 'hint', pages: ['ch3.lore.deepbell_tide.1', 'ch3.lore.deepbell_tide.2'] },
    kind_archmage: { title: 'ch3.lore.kind_archmage', kind: 'lore', pages: ['ch3.lore.kind_archmage.1', 'ch3.lore.kind_archmage.2'] }
  },
  shelves: [
    { book: 'kite_mail', map: 'kite_house', x: 1, y: 2 },
    { book: 'lost_kites', map: 'kitewick_h2', x: 6, y: 2 },
    { book: 'deepbell_tide', map: 'gale_loft', x: 1, y: 6 },
    { book: 'kind_archmage', map: 'kitewick_h3', x: 8, y: 2 }
  ]
};
