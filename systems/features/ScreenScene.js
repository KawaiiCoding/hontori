/*
 * ScreenScene.js  (engine: features)
 * Job: the base of a full-screen moment of its own (a picture story, a drawing prompt, a name entry, an
 * offer card): it builds its DOM in the interface layer on enter, removes it on exit, keeps an optional
 * canvas sized to the screen, and ends with a value that the opener awaits. It knows no game.
 *
 * Public API:
 *   class ScreenScene extends Scene
 *     root                 the scene's element (class "ft-screen" plus the class given)
 *     result               a Promise of the value the scene ended with (null when it was removed from outside)
 *     build(root, params)  override: fill the element (called from enter)
 *     done(value)          end the scene: resolve result and pop it if it is on top
 *     makeCanvas(parent)   a canvas filling its parent; `canvasSize()` gives { width, height, ratio }
 *     prepareCanvas()      resize the canvas to its element when needed; returns its 2d context with the
 *                          transform set to CSS pixels (call from draw)
 *     onKey(event)         override: a key pressed while the scene is on top
 *   openScreen(game, scene, params)   push a ScreenScene and return its result Promise
 *
 * Keys pressed while a text field has focus never reach the game (see guardInput).
 *   guardInput(input)    stop key events on a text field from reaching the game's input
 */

import { Scene } from '../../core/Scene.js';
import { element } from '../../ui/dom.js';
import { installFeatureStyles } from './styles.js';

export function guardInput(input) {
  const stop = (event) => event.stopPropagation();
  input.addEventListener('keydown', stop);
  input.addEventListener('keyup', stop);
  return input;
}

export class ScreenScene extends Scene {
  root = null;
  result;

  #resolve = null;
  #ended = false;
  #canvas = null;
  #ctx = null;
  #size = { width: 0, height: 0, ratio: 1 };
  #className;
  #keys = (event) => {
    if (this.game.scenes.top !== this) return;
    try {
      this.onKey(event);
    } catch (error) {
      console.warn('Features: a key handler failed', error);
    }
  };

  constructor(game, className = '') {
    super(game);
    this.#className = className;
    this.result = new Promise((resolve) => {
      this.#resolve = resolve;
    });
  }

  enter(params = {}) {
    installFeatureStyles();
    this.root = element('div', `ft-screen ${this.#className}`.trim(), this.game.ui.layer);
    this.root.addEventListener('pointerdown', (event) => event.stopPropagation());
    window.addEventListener('keydown', this.#keys);
    try {
      this.build(this.root, params);
    } catch (error) {
      console.warn('Features: a screen failed to build', error);
      this.done(null);
      return;
    }
    /* one layout first, so the fade-in runs (the Clock owns the frame loop) */
    void this.root.offsetWidth;
    this.root.classList.add('on');
  }

  exit() {
    window.removeEventListener('keydown', this.#keys);
    if (this.root) this.root.remove();
    this.root = null;
    this.#canvas = null;
    this.#ctx = null;
    this.#finish(null);
  }

  build() {}

  onKey() {}

  done(value) {
    if (this.#ended) return;
    this.#finish(value);
    if (this.game.scenes.top === this) this.game.scenes.pop();
  }

  get ended() {
    return this.#ended;
  }

  makeCanvas(parent) {
    this.#canvas = element('canvas', 'ft-canvas', parent);
    this.#ctx = this.#canvas.getContext('2d');
    return this.#canvas;
  }

  canvasSize() {
    return this.#size;
  }

  prepareCanvas() {
    const canvas = this.#canvas;
    if (!canvas || !this.#ctx) return null;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (Math.round(width * ratio) !== canvas.width || Math.round(height * ratio) !== canvas.height) {
      canvas.width = Math.max(1, Math.round(width * ratio));
      canvas.height = Math.max(1, Math.round(height * ratio));
    }
    this.#size = { width, height, ratio };
    const g = this.#ctx;
    g.setTransform(ratio, 0, 0, ratio, 0, 0);
    g.imageSmoothingEnabled = false;
    return g;
  }

  #finish(value) {
    if (this.#ended) return;
    this.#ended = true;
    const resolve = this.#resolve;
    this.#resolve = null;
    if (resolve) resolve(value);
  }
}

export function openScreen(game, scene, params) {
  try {
    game.scenes.push(scene, params);
  } catch (error) {
    console.warn('Features: a screen could not open', error);
    return Promise.resolve(null);
  }
  return scene.result;
}
