/*
 * reader.js  (Hontori: lore)
 * Job: the book reader: a panel in the game's card shape over the dimmed world, with the book's title, one
 * paper page at a time, page dots and Prev and Next buttons (Next becomes Close on the last page). Arrow keys
 * turn the pages and Escape closes. It is static: it draws nothing per frame and runs at a low frame rate; its
 * listeners go with its element when it closes.
 *
 * Public API:
 *   showBook(game, { title, kind, pages, words })   -> a Promise of { end } (end: the last page was shown)
 *        title, kind: words already looked up; pages: [text]; words: { prev, next, close, page }
 */

import { element } from '../../ui/dom.js';
import { Panel } from '../../ui/Panel.js';
import { Button } from '../../ui/Button.js';
import { ScreenScene, openScreen } from '../../systems/features/ScreenScene.js';
import { installLoreStyles } from './styles.js';

class ReaderScene extends ScreenScene {
  overlay = true;
  frameRate = 4;

  #pages = [];
  #index = 0;
  #end = false;
  #page = null;
  #kind = '';
  #dots = [];
  #prev = null;
  #next = null;
  #words = {};

  constructor(game) {
    super(game, 'lr-dim');
  }

  build(root, o) {
    installLoreStyles();
    this.#pages = Array.isArray(o.pages) && o.pages.length ? o.pages : [''];
    this.#words = o.words || {};
    this.#kind = o.kind || '';
    const icons = (this.game.theme && this.game.theme.icons) || {};
    const panel = new Panel(this.game.art, { icon: 'book', title: o.title || '', closeIcon: icons.close, onClose: () => this.#close() });
    panel.element.classList.add('lr-book');
    root.appendChild(panel.element);
    root.addEventListener('click', (event) => {
      if (event.target === root) this.#close();
    });
    this.#page = element('div', 'lr-page');
    panel.add(this.#page);
    const dots = element('div', 'lr-dots');
    this.#dots = this.#pages.map(() => element('i', '', dots));
    panel.add(dots);
    const row = panel.actions();
    this.#prev = new Button(this.game.art, { label: this.#words.prev || '<', kind: 'alt', onPress: () => this.#turn(-1) });
    this.#next = new Button(this.game.art, { label: this.#words.next || '>', onPress: () => this.#turn(1) });
    row.append(this.#prev.element, this.#next.element);
    this.#show();
  }

  #show() {
    const text = this.#pages[this.#index] || '';
    this.#page.textContent = '';
    if (this.#kind && this.#index === 0) element('span', 'lr-kind', this.#page, this.#kind);
    this.#page.appendChild(document.createTextNode(text));
    this.#dots.forEach((dot, i) => dot.classList.toggle('on', i === this.#index));
    this.#prev.element.disabled = this.#index === 0;
    const last = this.#index === this.#pages.length - 1;
    this.#next.setText(last ? this.#words.close || 'x' : this.#words.next || '>');
    if (last) this.#end = true;
  }

  #turn(step) {
    const last = this.#index === this.#pages.length - 1;
    if (step > 0 && last) {
      this.#close();
      return;
    }
    const to = Math.max(0, Math.min(this.#pages.length - 1, this.#index + step));
    if (to === this.#index) return;
    this.#index = to;
    try {
      this.game.sound.play('page');
    } catch (error) {
      /* silent */
    }
    this.#show();
  }

  #close() {
    this.done({ end: this.#end });
  }

  onKey(event) {
    if (event.key === 'ArrowRight' || event.key === 'Enter' || event.key === ' ') this.#turn(1);
    else if (event.key === 'ArrowLeft') this.#turn(-1);
    else if (event.key === 'Escape') this.#close();
  }
}

export function showBook(game, options) {
  return openScreen(game, new ReaderScene(game), options);
}
