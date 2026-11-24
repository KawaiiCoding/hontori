/*
 * CarryChoice.js  (engine: features)
 * Job: a clear "choose who comes with you" screen: a card with a title, one line under it, a grid of every
 * companion that could come (a face, a name, a small line), a counter "3 of 5", a Back button and a Confirm
 * button. A tap picks or unpicks; a locked one is always picked (it never leaves the player); no more than `n`
 * can be picked; Confirm needs at least one. It knows no game: the entries and words come from the caller.
 *
 * Public API:
 *   class CarryChoiceScene   enter({ title, sub, n, entries, words: { confirm, back, count, locked, full } })
 *        entries   [{ id, name, sub, portrait (a canvas or null), picked, locked }]   in the order shown
 *        words     count: '{n} of {max}' (placeholders filled here); locked: the short tag on a locked one;
 *                  full: the line shown when a pick is refused because n are already picked
 *        result    the ids picked, in the order of `entries`; null for Back
 *   chooseCarry(game, options)   open it; a Promise of the ids or null
 */

import { element } from '../../ui/dom.js';
import { Button } from '../../ui/Button.js';
import { ScreenScene, openScreen } from './ScreenScene.js';

const FACE = 56;

function fill(text, params) {
  return String(text || '').replace(/\{(\w+)\}/g, (whole, key) => (params[key] != null ? String(params[key]) : whole));
}

export class CarryChoiceScene extends ScreenScene {
  overlay = true;
  frameRate = 8;

  #picked = new Set();
  #n = 5;
  #entries = [];
  #cards = new Map();
  #count = null;
  #note = null;
  #ok = null;
  #words = {};

  constructor(game) {
    super(game, 'ft-dim');
  }

  build(root, { title = '', sub = '', n = 5, entries = [], words = {} }) {
    this.#n = Math.max(1, Math.floor(Number(n) || 5));
    this.#entries = Array.isArray(entries) ? entries.filter((e) => e && e.id != null) : [];
    this.#words = words;
    for (const e of this.#entries) if (e.locked) this.#picked.add(e.id);
    for (const e of this.#entries) if (e.picked && !e.locked && this.#picked.size < this.#n) this.#picked.add(e.id);
    const card = element('div', 'ft-card ft-carry', root);
    element('h3', '', card, title);
    if (sub) element('p', '', card, sub);
    this.#count = element('div', 'count', card);
    const grid = element('div', 'grid', card);
    for (const e of this.#entries) {
      const cell = element('button', 'pick', grid);
      cell.type = 'button';
      const face = element('canvas', '', cell);
      face.width = FACE;
      face.height = FACE;
      try {
        const g = face.getContext('2d');
        g.imageSmoothingEnabled = false;
        if (e.portrait) g.drawImage(e.portrait, 0, 0, FACE, FACE);
      } catch (error) {
        /* no face: the name still shows */
      }
      element('b', '', cell, e.name || '');
      element('small', '', cell, e.locked ? words.locked || e.sub || '' : e.sub || '');
      element('i', 'tick', cell, '');
      cell.addEventListener('click', () => this.#toggle(e));
      this.#cards.set(e.id, cell);
    }
    this.#note = element('div', 'err', card);
    const row = element('div', 'row', card);
    row.appendChild(new Button(this.game.art, { label: words.back || 'Back', kind: 'alt', onPress: () => this.done(null) }).element);
    this.#ok = new Button(this.game.art, { label: words.confirm || 'OK', kind: 'gold', onPress: () => this.#confirm() });
    row.appendChild(this.#ok.element);
    this.#show();
  }

  onKey(event) {
    if (event.key === 'Escape') this.done(null);
  }

  #toggle(e) {
    if (e.locked) return;
    this.#note.textContent = '';
    if (this.#picked.has(e.id)) this.#picked.delete(e.id);
    else if (this.#picked.size >= this.#n) {
      this.#note.textContent = this.#words.full || '';
      return;
    } else this.#picked.add(e.id);
    try {
      this.game.sound.play('blip');
    } catch (error) {
      /* silent */
    }
    this.#show();
  }

  #show() {
    for (const [id, cell] of this.#cards) {
      const entry = this.#entries.find((e) => e.id === id);
      cell.classList.toggle('on', this.#picked.has(id));
      cell.classList.toggle('lock', !!(entry && entry.locked));
    }
    this.#count.textContent = fill(this.#words.count || '{n} / {max}', { n: this.#picked.size, max: this.#n });
    this.#ok.element.disabled = this.#picked.size < 1;
    this.#ok.element.classList.toggle('off', this.#picked.size < 1);
  }

  #confirm() {
    if (this.#picked.size < 1) return;
    this.done(this.#entries.filter((e) => this.#picked.has(e.id)).map((e) => e.id));
  }
}

export function chooseCarry(game, options) {
  return openScreen(game, new CarryChoiceScene(game), options);
}
