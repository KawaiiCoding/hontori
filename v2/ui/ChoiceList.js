/*
 * ChoiceList.js
 * Job: a choice for the player: a card of options above the dialog box, one of them selected
 * (an arrow and a light frame), the current game's look. Each option may carry a pixel icon and
 * a second line saying what it does; a greyed option can be seen but not chosen.
 *
 * Public API:
 *   new ChoiceList(layer, art)   layer: the .ui element; art: the art provider (for icons)
 *   open(options, { selected, highlight, cancel })
 *        options: [{ label, desc, icon, iconUrl, disabled }] (iconUrl: an image URL instead of a named icon); selected: the option selected first;
 *        highlight: an option drawn in gold as the one to try next (or -1); cancel: the option
 *        that Back picks (or -1: Back does nothing). Returns a Promise of the chosen index.
 *   move(delta)          select the next (1) or previous (-1) option that can be chosen
 *   pick()               choose the selected option
 *   back()               choose the cancel option, if there is one
 *   isOpen
 *   close()              remove the card without a choice (the Promise is left unresolved)
 *   destroy()
 */

import { element, icon } from './dom.js';

/* a tap this soon after the card appears was meant for the line before */
const GUARD_MS = 150;

export class ChoiceList {
  #layer;
  #art;
  #card = null;
  #buttons = [];
  #options = [];
  #selected = 0;
  #cancel = -1;
  #openedAt = 0;
  #resolve = null;

  constructor(layer, art) {
    this.#layer = layer;
    this.#art = art;
  }

  get isOpen() {
    return !!this.#card;
  }

  open(options, { selected = 0, highlight = -1, cancel = -1 } = {}) {
    this.close();
    this.#options = options;
    this.#cancel = cancel;
    this.#openedAt = performance.now();
    const card = this.#card = element('div', 'ui-ch', this.#layer);
    card.setAttribute('role', 'listbox');
    this.#buttons = options.map((option, index) => {
      const button = element('button', index === highlight ? 'hl' : '', card);
      button.type = 'button';
      if (option.iconUrl) {
        const image = element('img', '', button);
        image.alt = '';
        image.draggable = false;
        image.src = option.iconUrl;
      } else if (option.icon) button.appendChild(icon(this.#art, option.icon));
      const text = element('span', 'ct', button, option.label);
      if (option.desc) element('small', '', text, option.desc);
      button.disabled = !!option.disabled;
      button.addEventListener('pointerenter', () => this.#select(index));
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (option.disabled) return;
        this.#select(index);
        this.#choose(index);
      });
      return button;
    });
    this.#select(this.#usable(selected) ? selected : this.#next(selected, 1));
    return new Promise((resolve) => {
      this.#resolve = resolve;
    });
  }

  move(delta) {
    if (this.#card) this.#select(this.#next(this.#selected, delta));
  }

  pick() {
    if (!this.#card || performance.now() - this.#openedAt < GUARD_MS) return;
    if (this.#usable(this.#selected)) this.#choose(this.#selected);
  }

  back() {
    if (this.#card && this.#cancel >= 0) this.#choose(this.#cancel);
  }

  close() {
    if (this.#card) this.#card.remove();
    this.#card = null;
    this.#buttons = [];
    this.#resolve = null;
  }

  destroy() {
    this.close();
  }

  #usable(index) {
    const option = this.#options[index];
    return !!option && !option.disabled;
  }

  #next(from, delta) {
    const n = this.#options.length;
    for (let step = 1; step <= n; step++) {
      const index = (((from + delta * step) % n) + n) % n;
      if (this.#usable(index)) return index;
    }
    return from;
  }

  #select(index) {
    this.#selected = index;
    this.#buttons.forEach((button, i) => button.classList.toggle('sel', i === index));
    const button = this.#buttons[index];
    if (button && button.scrollIntoView) button.scrollIntoView({ block: 'nearest' });
  }

  #choose(index) {
    const resolve = this.#resolve;
    this.close();
    if (resolve) resolve(index);
  }
}
