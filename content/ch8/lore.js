/*
 * ch8/lore.js
 * Job: the readable books of Duskmere, the Lantern Room and Hollow Moon (content key `lore`, systems/lore): each book's title, pages and
 * kind (lore, hint or notes), and the shelf that holds it (a bookshelf or book stack prop on that map at x, y).
 * Tapping that prop opens the book; every hint pays off later in the journey.
 */

export default {
  books: {
    dark_spirits: { title: 'ch8.lore.dark_spirits', kind: 'notes', pages: ['ch8.lore.dark_spirits.1', 'ch8.lore.dark_spirits.2'] },
    halo_tourney: { title: 'ch8.lore.halo_tourney', kind: 'hint', pages: ['ch8.lore.halo_tourney.1', 'ch8.lore.halo_tourney.2'] },
    bent_light: { title: 'ch8.lore.bent_light', kind: 'hint', pages: ['ch8.lore.bent_light.1', 'ch8.lore.bent_light.2'] },
    capital: { title: 'ch8.lore.capital', kind: 'lore', pages: ['ch8.lore.capital.1', 'ch8.lore.capital.2'] }
  },
  shelves: [
    { book: 'dark_spirits', map: 'lantern_room', x: 1, y: 2 },
    { book: 'halo_tourney', map: 'hollow_moon', x: 1, y: 6 },
    { book: 'bent_light', map: 'duskmere_h2', x: 6, y: 2 },
    { book: 'capital', map: 'duskmere_h4', x: 7, y: 2 }
  ]
};
