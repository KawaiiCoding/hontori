/*
 * Button.js
 * Job: the game's button: an optional pixel icon, a label and an optional second line.
 *
 * Public API:
 *   new Button(art, { icon, label, desc, kind, small, wide, onPress })
 *        kind: undefined (sky blue, the main action), 'alt' (dark), 'warn' (dark, red text), 'gold'
 *   element               the <button>; append it where it belongs
 *   setText(label, desc)  change the two lines
 *   setIcon(name)
 *   closeButton(art, closeIcon, onPress)   the square close button of a panel header
 */

import { element, icon } from './dom.js';

export class Button {
  #art;
  #icon = null;
  #label;
  #desc = null;

  constructor(art, { icon: iconName, label, desc, kind, small, wide, onPress }) {
    this.#art = art;
    this.element = element('button', `ui-btn${kind ? ` ${kind}` : ''}${small ? ' sm' : ''}${wide ? ' wide' : ''}`);
    this.element.type = 'button';
    if (iconName) this.#icon = this.element.appendChild(icon(art, iconName));
    const text = element('span', 'text', this.element);
    this.#label = element('span', '', text, label);
    if (desc != null) this.#desc = element('small', '', text, desc);
    if (onPress) this.element.addEventListener('click', onPress);
  }

  setText(label, desc) {
    this.#label.textContent = label;
    if (this.#desc && desc != null) this.#desc.textContent = desc;
  }

  setIcon(name) {
    if (this.#icon) this.#icon.src = this.#art.iconUrl(name);
  }
}

export function closeButton(art, closeIcon, onPress) {
  const button = element('button', 'ui-x');
  button.type = 'button';
  button.title = 'Close';
  button.setAttribute('aria-label', 'Close');
  button.appendChild(icon(art, closeIcon));
  button.addEventListener('click', onPress);
  return button;
}
