/*
 * Toast.js
 * Job: short messages that appear under the top bar for a moment, one after the other.
 *
 * Public API:
 *   new Toast(layer)   layer: the .ui element
 *   show(text)         queue a message
 */

import { readMs } from './readTime.js';
import { element } from './dom.js';

const GAP_MS = 300;

export class Toast {
  #node;
  #queue = [];
  #busy = false;

  constructor(layer) {
    this.#node = element('div', 'ui-toast', layer);
  }

  show(text) {
    /* the same line is never queued twice (a button tapped again and again) */
    const line = String(text);
    if ((this.#busy && this.#node.textContent === line && !this.#queue.length) || this.#queue.includes(line)) return;
    this.#queue.push(line);
    if (!this.#busy) this.#next();
  }

  #next() {
    const text = this.#queue.shift();
    this.#busy = text !== undefined;
    if (!this.#busy) return;
    this.#node.textContent = text;
    /* reading the layout once lets the message fade in from its resting place */
    this.#node.getBoundingClientRect();
    this.#node.classList.add('on');
    setTimeout(() => {
      this.#node.classList.remove('on');
      setTimeout(() => this.#next(), GAP_MS);
    }, readMs(text));
  }
}
