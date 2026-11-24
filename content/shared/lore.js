/*
 * shared/lore.js
 * Job: the readable books of the kid's home (content key `lore`, systems/lore): each book's title, pages and
 * kind (lore, hint or notes), and the shelf that holds it (a bookshelf or book stack prop on that map at x, y).
 * Tapping that prop opens the book; every hint pays off later in the journey.
 */

export default {
  books: {
    hearth_recipes: { title: 'shared.lore.hearth_recipes', kind: 'notes', pages: ['shared.lore.hearth_recipes.1', 'shared.lore.hearth_recipes.2', 'shared.lore.hearth_recipes.3'] },
    old_tales: { title: 'shared.lore.old_tales', kind: 'lore', pages: ['shared.lore.old_tales.1', 'shared.lore.old_tales.2', 'shared.lore.old_tales.3'] }
  },
  shelves: [
    { book: 'hearth_recipes', map: 'home', x: 11, y: 2 },
    { book: 'old_tales', map: 'home', x: 22, y: 13 }
  ],
  words: {
    library: 'shared.lore.ui.library',
    librarySub: 'shared.lore.ui.sub',
    libraryDesc: 'shared.lore.ui.desc',
    libraryNote: 'shared.lore.ui.note',
    new: 'shared.lore.ui.new',
    prev: 'shared.lore.ui.prev',
    next: 'shared.lore.ui.next',
    close: 'shared.lore.ui.close',
    kind: { lore: 'shared.lore.kind.lore', hint: 'shared.lore.kind.hint', notes: 'shared.lore.kind.notes' }
  }
};
