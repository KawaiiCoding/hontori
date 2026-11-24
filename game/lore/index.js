/*
 * game/lore/index.js  (Hontori: lore)
 * Job: Hontori's readable books on the engine's rules (systems/lore): tapping a bookshelf or a book stack that
 * holds a book opens the reader (./reader.js); every book found goes into the Library, a row at the top of the
 * Backpack ("n of N found"), where a found book can be read again and one never read to the end shows "new".
 *
 * Public API:
 *   install(game)   after the story, items and panels lanes, before game.save.load() and game.start()
 *
 * What it registers:
 *   everything of systems/lore (save section "lore", services "loreRules" and "lore", the story's ext "read")
 *   panel "lore" (the Library) and its row in panel "backpack"
 *
 * Words (content `lore.words`, shared): library, librarySub ({n}, {total}), libraryDesc, libraryNote, new,
 *   prev, next, close, kind: { lore, hint, notes }
 */

import { install as installRules, bookOf } from '../../systems/lore/index.js';
import { Button } from '../../ui/Button.js';
import { element } from '../../ui/dom.js';
import { extendPanel, swapPanel } from '../../ui/PanelExtras.js';
import { showBook } from './reader.js';
import { installLoreStyles } from './styles.js';

export function install(game) {
  const { registry } = game;
  const t = (id, params) => {
    try {
      return id ? game.text(id, params) : '';
    } catch (error) {
      return '';
    }
  };
  const words = bookOf(game).words || {};
  const kindWord = (kind) => t(words.kind && words.kind[kind || 'lore']);

  const open = (id, book) => showBook(game, {
    title: t(book.title),
    kind: kindWord(book.kind),
    pages: (book.pages || []).map((page) => t(page)),
    words: { prev: t(words.prev), next: t(words.next), close: t(words.close) },
  });

  const rules = installRules(game, { open });
  const service = registry.get('service', 'lore');

  function build(panel, { refresh }) {
    installLoreStyles();
    panel.note(t(words.libraryNote));
    const row = panel.actions();
    for (const id of rules.foundIds()) {
      const book = rules.get(id);
      const button = new Button(game.art, {
        icon: 'book',
        label: t(book.title),
        desc: kindWord(book.kind),
        wide: true,
        kind: 'alt',
        onPress: async () => {
          try {
            await service.read(id);
          } catch (error) {
            /* the list stays as it was */
          }
          refresh();
        },
      });
      if (rules.isNew(id)) element('span', 'lr-new', button.element.querySelector('.text > span') || button.element, t(words.new));
      row.appendChild(button.element);
    }
  }

  registry.add('panel', 'lore', {
    icon: 'book',
    get title() {
      return t(words.library);
    },
    get sub() {
      return t(words.librarySub, { n: rules.foundCount(), total: rules.total() });
    },
    build,
  });

  /* the Library sits at the top of the Backpack once the first book is found */
  extendPanel(registry, 'backpack', {
    before(panel) {
      if (!rules.foundCount()) return;
      const row = panel.actions();
      const fresh = rules.foundIds().some((id) => rules.isNew(id));
      const button = new Button(game.art, {
        icon: 'book',
        label: t(words.library),
        desc: t(words.librarySub, { n: rules.foundCount(), total: rules.total() }),
        onPress: () => swapPanel(game, 'lore'),
      });
      if (fresh) {
        installLoreStyles();
        element('span', 'lr-new', button.element.querySelector('.text > span') || button.element, t(words.new));
      }
      row.appendChild(button.element);
    },
  });

  return rules;
}
