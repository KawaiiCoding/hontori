/*
 * Sheet.js
 * Job: show a Panel as a sheet that slides up from the bottom over a dimmed world.
 * Tapping the dimmed world dismisses it.
 *
 * Public API:
 *   new Sheet(layer, panel, onDismiss)   layer: the .ui element; panel: a Panel
 *   open()
 *   close()      slide out and remove itself from the page
 */

import { element } from './dom.js';

const SLIDE_MS = 220;

export class Sheet {
  #layer;
  #shade;
  #sheet;

  constructor(layer, panel, onDismiss) {
    this.#layer = layer;
    this.#shade = element('div', 'ui-shade');
    this.#shade.addEventListener('click', onDismiss);
    this.#sheet = panel.element;
    this.#sheet.classList.add('ui-sheet');
  }

  open() {
    this.#layer.append(this.#shade, this.#sheet);
    /* reading the layout once lets the slide start from the closed position */
    this.#sheet.getBoundingClientRect();
    this.#shade.classList.add('on');
    this.#sheet.classList.add('on');
  }

  close() {
    const shade = this.#shade;
    const sheet = this.#sheet;
    shade.classList.remove('on');
    sheet.classList.remove('on');
    shade.style.pointerEvents = 'none';
    setTimeout(() => {
      shade.remove();
      sheet.remove();
    }, SLIDE_MS);
  }
}
