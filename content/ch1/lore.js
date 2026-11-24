/*
 * ch1/lore.js
 * Job: the readable books of Emberbrook (the Academy and three houses) (content key `lore`, systems/lore): each book's title, pages and
 * kind (lore, hint or notes), and the shelf that holds it (a bookshelf or book stack prop on that map at x, y).
 * Tapping that prop opens the book; every hint pays off later in the journey.
 */

export default {
  books: {
    element_wheel: { title: 'ch1.lore.element_wheel', kind: 'notes', pages: ['ch1.lore.element_wheel.1', 'ch1.lore.element_wheel.2', 'ch1.lore.element_wheel.3'] },
    element_bloom: { title: 'ch1.lore.element_bloom', kind: 'notes', pages: ['ch1.lore.element_bloom.1', 'ch1.lore.element_bloom.2', 'ch1.lore.element_bloom.3'] },
    wren_rootwood: { title: 'ch1.lore.wren_rootwood', kind: 'hint', pages: ['ch1.lore.wren_rootwood.1', 'ch1.lore.wren_rootwood.2'] },
    humming_well: { title: 'ch1.lore.humming_well', kind: 'hint', pages: ['ch1.lore.humming_well.1', 'ch1.lore.humming_well.2', 'ch1.lore.humming_well.3'] },
    shimmers: { title: 'ch1.lore.shimmers', kind: 'hint', pages: ['ch1.lore.shimmers.1', 'ch1.lore.shimmers.2'] }
  },
  shelves: [
    { book: 'element_wheel', map: 'school', x: 1, y: 4 },
    { book: 'element_bloom', map: 'school', x: 18, y: 8 },
    { book: 'wren_rootwood', map: 'house_a1', x: 1, y: 2 },
    { book: 'humming_well', map: 'house_a2', x: 11, y: 2 },
    { book: 'shimmers', map: 'house_a3', x: 1, y: 2 }
  ]
};
