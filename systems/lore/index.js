/*
 * systems/lore/index.js  (engine: lore)
 * Job: readable books in a game: the rules (Lore.js) read from the content, a save section, the shelves that
 * hold them, and the story's extension an interaction script uses to open the book on a shelf. It knows no
 * art: the game hands it `open`, which shows a book and says whether it was read to the end.
 *
 * Content (folder key `lore`, merged over every folder):
 *   { books: { <id>: { title: textId, pages: [textId ...], kind?: 'lore' | 'hint' | 'notes' } },
 *     shelves: [{ book, map, x, y }] }   a shelf is a prop already on that map at x, y
 *   The words of the reader and the list live in the game layer's own content (`lore.words`).
 *
 * Public API:
 *   install(game, { open })   -> the Lore rules (also registered as service "loreRules")
 *        open(id, book, ctx): a Promise of { end: true } when the last page was reached (or anything else)
 *   bookOf(game)              the merged content { books, shelves, words }
 *   shelfFor(game, target)    the shelf being used ({ map, x, y } of a story target), or null
 *
 * What it registers:
 *   save section    "lore" (Lore.js SAVE)
 *   service         "loreRules" (the rules) and "lore" ({ rules, read(id) }: open a found book again)
 *   story.command   "ext:read"    { ext: 'read', book }   open that book ('here': the one on the shelf in use); the
 *                                 script waits until it is closed. The book counts as found when it opens and
 *                                 as read once its last page has been shown.
 *   story.condition "ext:read"    { ext: 'read', book } (read to the end) | { ext: 'read', book: 'here' } (the
 *                                 shelf in use holds a book)
 */

import { Lore, SAVE } from './Lore.js';

/* the book name that means "the book on the shelf being used" */
const HERE = 'here';

export function bookOf(game) {
  const book = { books: {}, shelves: [], words: {} };
  for (const folder of game.registry.all('content')) {
    const lore = folder && folder.lore;
    if (!lore) continue;
    Object.assign(book.books, lore.books || {});
    Object.assign(book.words, lore.words || {});
    if (Array.isArray(lore.shelves)) book.shelves.push(...lore.shelves);
  }
  return book;
}

function mapIdOf(map) {
  return map && typeof map === 'object' ? map.id : map;
}

export function shelfFor(game, target) {
  if (!target) return null;
  const here = mapIdOf(target.map);
  return bookOf(game).shelves.find((s) => s.map === here && s.x === target.x && s.y === target.y) || null;
}

export function install(game, { open } = {}) {
  const { registry } = game;
  const book = bookOf(game);
  game.save.define('lore', SAVE);
  const rules = new Lore(book, () => game.save.state.lore, (type, payload) => game.bus.emit(type, payload));
  registry.add('service', 'loreRules', rules);

  const shelfBook = (ctx) => {
    try {
      const shelf = shelfFor(game, ctx && ctx.target);
      return shelf && rules.get(shelf.book) ? shelf.book : null;
    } catch (error) {
      return null;
    }
  };

  async function read(id, ctx) {
    const entry = rules.get(id);
    if (!entry || typeof open !== 'function') return undefined;
    if (rules.markFound(id)) game.save.commit();
    let result = null;
    try {
      result = await open(id, entry, ctx);
    } catch (error) {
      console.warn(`lore: the book "${id}" could not be shown`, error);
    }
    if (result && result.end && rules.markRead(id)) game.save.commit();
    return result;
  }

  registry.add('service', 'lore', { rules, read: (id) => read(id, null) });

  registry.add('story.command', 'ext:read', async (node, ctx) => {
    const id = !node || node.book === HERE ? shelfBook(ctx) : node.book;
    if (!id || !rules.get(id)) return 'pass';
    await read(id, ctx);
    return undefined;
  });

  registry.add('story.condition', 'ext:read', (node, ctx) => {
    if (!node || node.book === HERE) return !!shelfBook(ctx);
    return rules.read(node.book);
  });

  return rules;
}
