/*
 * DialogBox.js
 * Job: the dialog box at the bottom of the screen: a portrait, the speaker's name on a tag in the
 * speaker's colour, and the line typed out letter by letter. A tap (or advance()) first shows the
 * whole line, then moves on. The look is the current game's.
 *
 * Public API:
 *   new DialogBox(layer)     layer: the .ui element
 *   say({ name, text, portrait, color })   show one line; returns a Promise that resolves when the
 *                            player moves on. portrait: a canvas or null; color: CSS colour of the
 *                            frame and the name tag
 *   advance()                show the rest of the line, or move on if it is all shown
 *   typing                   true while letters are still appearing
 *   open                     true while a line waits for the player
 *   hide()                   slide the box away (the script has ended)
 *   setHidden(on)            take the box off screen for a while (a full screen scene is on top)
 *   destroy()                remove it and its timers
 *   DialogScene              the overlay a running script lives in (described further down)
 *
 * Styles: installs its own rules once; colours may come from the theme variables --dialog-top,
 * --dialog-bottom, --dialog-text, --dialog-portrait and --dialog-name-text.
 */

import { Scene } from '../core/Scene.js';
import { element } from './dom.js';
import { ChoiceList } from './ChoiceList.js';

const FIRST_LETTER_MS = 60;
const LETTER_MS = 24;
const COMMA_MS = 80;
const STOP_MS = 140;
/* a tap this soon after a line appears was meant for the line before */
const GUARD_MS = 120;
const SLIDE_MS = 190;
const DEFAULT_COLOR = '#ffd27a';

export class DialogBox {
  typing = false;
  open = false;

  #box;
  #portrait;
  #name;
  #text;
  #more;
  #letters = [];
  #at = 0;
  #timer = 0;
  #hideTimer = 0;
  #shownAt = 0;
  #resolve = null;

  constructor(layer) {
    this.#box = element('div', 'ui-dlg', layer);
    this.#box.hidden = true;
    this.#box.style.setProperty('--c', DEFAULT_COLOR);
    this.#portrait = element('div', 'ui-dlg-por', this.#box);
    const body = element('div', 'ui-dlg-body', this.#box);
    this.#name = element('div', 'ui-dlg-name', body);
    this.#text = element('div', 'ui-dlg-txt', body);
    this.#more = element('div', 'ui-dlg-more', body);
    this.#box.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.advance();
    });
  }

  say({ name, text, portrait, color }) {
    this.#finish();
    clearTimeout(this.#hideTimer);
    const box = this.#box;
    box.style.setProperty('--c', color || DEFAULT_COLOR);
    this.#name.textContent = name || '';
    this.#name.hidden = !name;
    this.#portrait.textContent = '';
    this.#portrait.hidden = !portrait;
    if (portrait) this.#portrait.appendChild(ownCopy(portrait));
    this.#text.textContent = '';
    this.#more.classList.remove('on');
    box.hidden = false;
    /* reading the layout once lets the box slide in from its resting place */
    box.getBoundingClientRect();
    box.classList.add('on');

    this.#letters = Array.from(String(text || ''));
    this.#at = 0;
    this.typing = true;
    this.open = true;
    this.#shownAt = performance.now();
    this.#timer = setTimeout(() => this.#type(), FIRST_LETTER_MS);
    return new Promise((resolve) => {
      this.#resolve = resolve;
    });
  }

  advance() {
    if (!this.open) return;
    if (this.typing) {
      this.#showAll();
      return;
    }
    if (performance.now() - this.#shownAt < GUARD_MS) return;
    this.#finish();
  }

  hide() {
    this.#finish();
    const box = this.#box;
    box.classList.remove('on');
    clearTimeout(this.#hideTimer);
    this.#hideTimer = setTimeout(() => {
      box.hidden = true;
    }, SLIDE_MS);
  }

  setHidden(on) {
    this.#box.style.visibility = on ? 'hidden' : '';
  }

  destroy() {
    this.#finish();
    clearTimeout(this.#hideTimer);
    this.#box.remove();
  }

  #type() {
    if (!this.typing) return;
    const letter = this.#letters[this.#at++];
    if (letter !== undefined) this.#text.textContent += letter;
    if (this.#at >= this.#letters.length) {
      this.#showAll();
      return;
    }
    const delay = /[.!?…]/.test(letter) ? STOP_MS : /[,;:]/.test(letter) ? COMMA_MS : LETTER_MS;
    this.#timer = setTimeout(() => this.#type(), delay);
  }

  #showAll() {
    clearTimeout(this.#timer);
    this.typing = false;
    this.#text.textContent = this.#letters.join('');
    this.#more.classList.add('on');
    /* the whole line is shown: the guard starts again so a double tap does not skip it */
    this.#shownAt = performance.now();
  }

  #finish() {
    clearTimeout(this.#timer);
    this.typing = false;
    this.#more.classList.remove('on');
    const resolve = this.#resolve;
    this.#resolve = null;
    this.open = false;
    if (resolve) resolve();
  }
}

/* the painters cache their portraits: a canvas already on the page is copied, never moved */
function ownCopy(canvas) {
  if (!canvas.parentNode) return canvas;
  const copy = document.createElement('canvas');
  copy.width = canvas.width;
  copy.height = canvas.height;
  copy.getContext('2d').drawImage(canvas, 0, 0);
  return copy;
}

/*
 * DialogScene: the overlay a running script lives in (registry kind "scene"). It pauses the world
 * below without freezing its picture, owns one DialogBox and one ChoiceList, turns the action key,
 * taps and the arrow keys into advance, move, pick and back, and paints the script's darkness and
 * flash over the world.
 *
 *   enter({ onUpdate, onExit })   onUpdate(dt): called every step (a script walks people here);
 *                                 onExit(): the scene was closed (by the script or by a reset)
 *   dialog, choices               the DialogBox and the ChoiceList
 *   darken(to, ms)                fade the picture toward black (to = 1) or back (to = 0); a Promise
 *   flash()                       one white flash
 *   lively                        true while something moves (walking, fading): full frame rate
 */


const CALM_RATE = 12;
const LIVELY_RATE = 30;
const FLASH_SECONDS = 0.5;

export class DialogScene extends Scene {
  overlay = true;
  frameRate = CALM_RATE;
  lively = false;
  dialog = null;
  choices = null;

  #onUpdate = null;
  #onExit = null;
  #dark = 0;
  #fade = null;
  #flash = 0;
  #width = 0;
  #height = 0;
  #lastDy = 0;
  #lastRun = false;
  #onKey = (event) => {
    if (event.key === 'Escape' && this.choices) this.choices.back();
  };

  enter({ onUpdate, onExit } = {}) {
    const { game } = this;
    this.#onUpdate = onUpdate || null;
    this.#onExit = onExit || null;
    this.dialog = new DialogBox(game.ui.layer);
    this.choices = new ChoiceList(game.ui.layer, game.art);
    window.addEventListener('keydown', this.#onKey);
    game.input.clear();
    this.#lastDy = game.input.dy;
    this.#lastRun = game.input.run;
  }

  exit() {
    window.removeEventListener('keydown', this.#onKey);
    this.dialog.destroy();
    this.choices.destroy();
    if (this.#fade) this.#fade.resolve();
    this.#fade = null;
    const onExit = this.#onExit;
    this.#onExit = null;
    if (onExit) onExit();
  }

  pause() {
    this.dialog.setHidden(true);
  }

  resume() {
    this.dialog.setHidden(false);
    this.game.input.clear();
  }

  resize(width, height) {
    this.#width = width;
    this.#height = height;
  }

  darken(to, ms) {
    if (this.#fade) this.#fade.resolve();
    return new Promise((resolve) => {
      if (!(ms > 0)) {
        this.#dark = to;
        this.#fade = null;
        resolve();
        return;
      }
      this.#fade = { from: this.#dark, to, seconds: ms / 1000, t: 0, resolve };
    });
  }

  flash() {
    this.#flash = FLASH_SECONDS;
  }

  update(dt) {
    this.#readInput();
    this.#stepFade(dt);
    if (this.#flash > 0) this.#flash = Math.max(0, this.#flash - dt);
    if (this.#onUpdate) {
      try {
        this.#onUpdate(dt);
      } catch (error) {
        console.warn('DialogScene: a script step failed', error);
      }
    }
    /* the rate follows what is on screen: full while something moves, low while words wait */
    this.frameRate = this.lively || this.#fade || this.#flash > 0 ? LIVELY_RATE : CALM_RATE;
  }

  draw(ctx) {
    if (this.#dark > 0) {
      ctx.globalAlpha = Math.min(1, this.#dark);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, this.#width, this.#height);
    }
    if (this.#flash > 0) {
      ctx.globalAlpha = (this.#flash / FLASH_SECONDS) * 0.85;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, this.#width, this.#height);
    }
    ctx.globalAlpha = 1;
  }

  #readInput() {
    const input = this.game.input;
    const choices = this.choices;
    const act = input.takeAction() || !!input.takeTap();
    const dy = input.dy;
    const run = input.run;
    if (choices.isOpen) {
      if (dy && dy !== this.#lastDy) choices.move(dy);
      if (act) choices.pick();
      else if (run && !this.#lastRun) choices.back();
    } else if (act || (run && !this.#lastRun)) {
      this.dialog.advance();
    }
    this.#lastDy = dy;
    this.#lastRun = run;
  }

  #stepFade(dt) {
    const fade = this.#fade;
    if (!fade) return;
    fade.t = Math.min(fade.seconds, fade.t + dt);
    this.#dark = fade.from + (fade.to - fade.from) * (fade.t / fade.seconds);
    if (fade.t < fade.seconds) return;
    this.#fade = null;
    fade.resolve();
  }
}
