/*
 * ch10/lore.js
 * Job: the readable books of chapter 10 (content key `lore`, systems/lore): the Council's own rule book in the
 * Athenaeum hall (a hint for the three chambers), Orlen Vael's notebook in his study (his fear, and the jar by
 * the old wall), and the final book, the Wanders' Charter, opened from the charter item after the law is made
 * (it has no shelf: it is carried).
 */

import P from './places.js';

export default {
  books: {
    council_rules: { title: 'ch10.lore.council_rules', kind: 'hint', pages: ['ch10.lore.council_rules.1', 'ch10.lore.council_rules.2', 'ch10.lore.council_rules.3'] },
    vael_notebook: { title: 'ch10.lore.vael_notebook', kind: 'notes', pages: ['ch10.lore.vael_notebook.1', 'ch10.lore.vael_notebook.2', 'ch10.lore.vael_notebook.3'] },
    charter: { title: 'ch10.lore.charter', kind: 'lore', pages: ['ch10.lore.charter.1', 'ch10.lore.charter.2', 'ch10.lore.charter.3', 'ch10.lore.charter.4'] }
  },
  shelves: [
    { book: 'council_rules', ...P.ahShelf },
    { book: 'vael_notebook', ...P.vsShelf }
  ]
};
