/*
 * Panel.js
 * Job: the game's panel: a rounded card with a header (icon, title, optional second line,
 * close button) and a body that screens fill with rows of buttons and notes.
 *
 * Public API:
 *   new Panel(art, { icon, title, sub, closeIcon, onClose })
 *   element            the panel; a Sheet shows it
 *   clear()            empty the body (before building it again)
 *   actions()          add a row that lays its buttons out evenly; returns the row element
 *   button(row, options)   add a Button (see Button.js) to a row; returns the Button
 *   note(text)         add a small note; returns its element
 *   add(node)          add any element to the body
 */

import { element, icon } from './dom.js';
import { Button, closeButton } from './Button.js';

export class Panel {
  #art;
  #body;

  constructor(art, { icon: iconName, title, sub, closeIcon, onClose }) {
    this.#art = art;
    this.element = element('div', 'ui-panel');
    const head = element('div', 'ui-head', this.element);
    if (iconName) head.appendChild(icon(art, iconName));
    const heading = element('h2', '', head, title);
    if (sub) element('small', '', heading, sub);
    if (onClose) head.appendChild(closeButton(art, closeIcon, onClose));
    this.#body = element('div', '', this.element);
  }

  clear() {
    this.#body.textContent = '';
  }

  actions() {
    return element('div', 'ui-acts', this.#body);
  }

  button(row, options) {
    const button = new Button(this.#art, options);
    row.appendChild(button.element);
    return button;
  }

  note(text) {
    return element('div', 'ui-note', this.#body, text);
  }

  add(node) {
    return this.#body.appendChild(node);
  }
}
