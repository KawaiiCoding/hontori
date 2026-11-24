/*
 * ch7/lore.js
 * Job: the readable books of Cinderreach, the Smoke House and the Ember Crucible (content key `lore`, systems/lore): each book's title, pages and
 * kind (lore, hint or notes), and the shelf that holds it (a bookshelf or book stack prop on that map at x, y).
 * Tapping that prop opens the book; every hint pays off later in the journey.
 */

export default {
  books: {
    swift_smoke: { title: 'ch7.lore.swift_smoke', kind: 'notes', pages: ['ch7.lore.swift_smoke.1', 'ch7.lore.swift_smoke.2'] },
    moon_notes: { title: 'ch7.lore.moon_notes', kind: 'hint', pages: ['ch7.lore.moon_notes.1', 'ch7.lore.moon_notes.2'] },
    window_lights: { title: 'ch7.lore.window_lights', kind: 'lore', pages: ['ch7.lore.window_lights.1', 'ch7.lore.window_lights.2'] }
  },
  shelves: [
    { book: 'swift_smoke', map: 'smoke_house', x: 6, y: 2 },
    { book: 'moon_notes', map: 'ember_crucible', x: 1, y: 20 },
    { book: 'window_lights', map: 'cinderreach_h4', x: 7, y: 2 }
  ]
};
