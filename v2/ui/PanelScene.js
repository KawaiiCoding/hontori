/*
 * PanelScene.js
 * Job: the scene that shows one registered panel as a bottom sheet. It is an overlay: the
 * world below stays visible and paused, and the clock idles while the panel is open.
 *
 * Public API (registry kind "scene", id "panel"):
 *   enter({ id })     id: a panel registered under registry kind "panel":
 *                     { icon, title, sub, build(panel, { game, close, refresh }) }
 *                     build fills the Panel (ui/Panel.js); refresh() builds it again after a
 *                     change; close() closes the sheet.
 *   show(id)          swap to another registered panel in place (the sheet stays where it is)
 *   It closes on the close button, a tap on the dimmed world, or the Escape key.
 */

import { Scene } from '../core/Scene.js';
import { Panel } from './Panel.js';
import { Sheet } from './Sheet.js';
import { setHead } from './PanelExtras.js';

export class PanelScene extends Scene {
  overlay = true;
  /* nothing in a panel moves: the world behind it is refreshed only this often */
  frameRate = 8;

  #definition = null;
  #panel = null;
  #sheet = null;
  #close = () => this.game.scenes.pop();
  #refresh = () => this.#build();
  #onKey = (event) => {
    if (event.key === 'Escape') this.#close();
  };

  enter({ id }) {
    const { game } = this;
    const definition = game.registry.get('panel', id);
    if (!definition) throw new Error(`PanelScene: no panel is registered as "${id}"`);
    this.#definition = definition;
    this.#panel = new Panel(game.art, { icon: definition.icon, title: definition.title, sub: definition.sub,
      closeIcon: game.theme.icons.close, onClose: this.#close,
    });
    this.#build();
    this.#sheet = new Sheet(game.ui.layer, this.#panel, this.#close);
    this.#sheet.open();
    window.addEventListener('keydown', this.#onKey);
  }

  /* show another registered panel in this same sheet: nothing slides down and up again */
  show(id) {
    const definition = this.game.registry.get('panel', id);
    if (!definition || !this.#panel) return false;
    this.#definition = definition;
    setHead(this.#panel, this.game.art, { icon: definition.icon, title: definition.title, sub: definition.sub });
    this.#build();
    return true;
  }

  exit() {
    window.removeEventListener('keydown', this.#onKey);
    this.#sheet.close();
  }

  update() {
    /* presses made while the panel is open are not meant for the world */
    this.game.input.takeAction();
    this.game.input.takeTap();
  }

  #build() {
    this.#panel.clear();
    try {
      this.#definition.build(this.#panel, { game: this.game, close: this.#close, refresh: this.#refresh });
    } catch (error) {
      console.warn('PanelScene: a panel failed to build', error);
    }
  }
}
