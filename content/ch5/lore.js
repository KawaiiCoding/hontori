/*
 * ch5/lore.js
 * Job: the readable books of Coilhaven, the Tinker's Shed and the Storm Works (content key `lore`, systems/lore): each book's title, pages and
 * kind (lore, hint or notes), and the shelf that holds it (a bookshelf or book stack prop on that map at x, y).
 * Tapping that prop opens the book; every hint pays off later in the journey.
 */

export default {
  books: {
    tame_sparks: { title: 'ch5.lore.tame_sparks', kind: 'lore', pages: ['ch5.lore.tame_sparks.1', 'ch5.lore.tame_sparks.2', 'ch5.lore.tame_sparks.3'] },
    wand_duel: { title: 'ch5.lore.wand_duel', kind: 'hint', pages: ['ch5.lore.wand_duel.1', 'ch5.lore.wand_duel.2'] },
    lines_coils: { title: 'ch5.lore.lines_coils', kind: 'hint', pages: ['ch5.lore.lines_coils.1', 'ch5.lore.lines_coils.2'] },
    grey_cloaks: { title: 'ch5.lore.grey_cloaks', kind: 'hint', pages: ['ch5.lore.grey_cloaks.1', 'ch5.lore.grey_cloaks.2'] }
  },
  shelves: [
    { book: 'tame_sparks', map: 'tinker_shed', x: 6, y: 2 },
    { book: 'wand_duel', map: 'storm_works', x: 29, y: 25 },
    { book: 'lines_coils', map: 'coilhaven_h4', x: 2, y: 2 },
    { book: 'grey_cloaks', map: 'coilhaven_h2', x: 7, y: 2 }
  ]
};
