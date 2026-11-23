/*
 * Ui.js
 * Job: the interface layer over the game picture, and the handful of things every system may
 * ask of it. main.js creates it and puts it on the Game as `game.ui`.
 *
 * Public API:
 *   new Ui(root, game)
 *   layer              the .ui element; kit pieces are added to it
 *   toast(text)        show a short message
 *   openPanel(id)      open the panel registered under registry kind "panel" as a sheet
 *                      (pushes the "panel" scene, which pauses the world below)
 */

import { installStyles } from './styles.js';
import { element } from './dom.js';
import { Toast } from './Toast.js';

export class Ui {
  #game;
  #toast;

  constructor(root, game) {
    installStyles(game.theme);
    this.#game = game;
    this.layer = element('div', 'ui', root);
    this.#toast = new Toast(this.layer);
  }

  toast(text) {
    this.#toast.show(text);
  }

  openPanel(id) {
    this.#game.scenes.open('panel', { id });
  }
}
