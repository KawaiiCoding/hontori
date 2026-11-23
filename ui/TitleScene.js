/*
 * TitleScene.js
 * Job: the title screen: the game's name and mascot, the save slots of this device, and the
 * choice of how to move. Picking a slot loads it and starts the world. Name, tagline, mascot
 * and the words for a save slot come from the game's theme.
 * Registry kind it reads: "title.action"  id -> { label | label(game), showIf(game), open(game) }  a small
 * text link under the hint (for example entering a code).
 *
 * Public API (registry kind "scene", id "title"):
 *   enter()     no parameters
 *   It reads the slots from game.save (peek), the last slot and the controls from
 *   game.settings, and leaves through game.scenes.reset('world', savedPlace(game)).
 */

import { Scene } from '../core/Scene.js';
import { savedPlace } from '../world/WorldScene.js';
import { element } from './dom.js';

const STARS = 60;
const FADE_OUT_MS = 650;
const CONTROL_CHOICES = [
  ['stick', 'Joystick', 'Stick, A and B'],
  ['tap', 'Tap to move', 'Tap, double tap to run'],
];

export class TitleScene extends Scene {
  #screen = null;
  #mascot = null;
  #time = 0;
  #controls = 'stick';
  #options = [];
  #onKey = (event) => {
    if (this.game.scenes.top !== this) return;
    if (event.key === 'Enter' || event.key === ' ') this.#pick(this.game.settings.get('slot'));
  };

  enter() {
    const { game } = this;
    const { title } = game.theme;
    this.#controls = game.settings.get('controls') || 'stick';
    const screen = element('div', 'ui-title', game.ui.layer);
    this.#screen = screen;

    const stars = element('div', 'stars', screen);
    for (let i = 0; i < STARS; i++) {
      const star = element('div', 'star', stars);
      star.style.left = `${Math.random() * 100}%`;
      star.style.top = `${Math.random() * 70}%`;
      star.style.animationDelay = `${Math.random() * 2.4}s`;
    }
    const mascot = element('canvas', 'mascot', screen);
    mascot.width = title.mascot.pixels;
    mascot.height = title.mascot.pixels;
    this.#mascot = mascot.getContext('2d');
    this.#mascot.imageSmoothingEnabled = false;
    element('div', 'logo', screen, title.name);
    element('div', 'sub', screen, title.tagline);

    const slots = element('div', 'slots', screen);
    for (let slot = 1; slot <= game.save.slots; slot++) this.#addSlot(slots, slot);
    this.#addControls(screen);
    /* small text links under the hint, registered by systems (registry kind "title.action") */
    for (const action of game.registry.all('title.action')) {
      if (!action || (typeof action.showIf === 'function' && !action.showIf(game))) continue;
      const link = element('button', 'link', screen, typeof action.label === 'function' ? action.label(game) : action.label);
      link.type = 'button';
      link.addEventListener('click', (event) => {
        event.stopPropagation();
        try {
          action.open(game);
        } catch (error) {
          console.warn('Title: an action failed', error);
        }
      });
    }
    window.addEventListener('keydown', this.#onKey);
  }

  exit() {
    window.removeEventListener('keydown', this.#onKey);
    const screen = this.#screen;
    screen.classList.add('out');
    setTimeout(() => screen.remove(), FADE_OUT_MS);
  }

  update(dt) {
    this.#time += dt;
  }

  draw(ctx) {
    const { game } = this;
    const { mascot } = game.theme.title;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, game.screen.width, game.screen.height);
    const g = this.#mascot;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, mascot.pixels, mascot.pixels);
    mascot.draw(g, game.art, this.#time);
  }

  #addSlot(parent, slot) {
    const { game } = this;
    const { words } = game.theme;
    const state = game.save.peek(slot);
    const used = !!state && game.registry.has('map', state.world.map);
    const last = used && slot === game.settings.get('slot');
    const button = element('button', `slot${used ? '' : ' empty'}${last ? ' last' : ''}`, parent);
    button.type = 'button';
    element('span', 'n', button, String(slot));
    const text = element('span', 'd', button);
    element('b', '', text, used ? `${words.slot} ${slot}` : words.newSlot);
    element('small', '', text, used ? game.registry.get('map', state.world.map).name : words.emptySlot);
    button.addEventListener('click', () => this.#pick(slot));
  }

  #addControls(parent) {
    const box = element('div', 'ctl', parent);
    element('div', 'ctl-q', box, this.game.theme.words.controls || 'How do you want to move?');
    const row = element('div', 'seg', box);
    const { words } = this.game.theme;
    const choices = CONTROL_CHOICES.map(([mode, label, desc]) => [mode, words[mode] || label, words[`${mode}Desc`] || desc]);
    for (const [mode, label, desc] of choices) {
      const option = element('button', 'opt', row);
      option.type = 'button';
      element('b', '', option, label);
      element('small', '', option, desc);
      option.addEventListener('click', () => this.#choose(mode));
      this.#options.push([mode, option]);
    }
    this.#choose(this.#controls);
  }

  #choose(mode) {
    this.#controls = mode;
    for (const [each, option] of this.#options) option.classList.toggle('on', each === mode);
  }

  #pick(slot) {
    const { game } = this;
    game.settings.set('slot', slot);
    game.chooseControls(this.#controls);
    /* inside the tap, so a phone lets the music start */
    game.sound.unlock();
    game.save.load(slot);
    game.scenes.reset('world', savedPlace(game));
  }
}
