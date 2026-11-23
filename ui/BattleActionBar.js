/*
 * BattleActionBar.js
 * Job: what the player presses in a battle: the row with the resource orbs and the small buttons (spells,
 * items, switch, escape with its chance bars), the grid of move buttons, and the wide button that takes the
 * place of the moves when none of them can be used (it never covers anything: the moves step aside).
 *
 * Public API:
 *   new BattleActionBar(parent, art)
 *   bar.setPips(label, value, max)                 the orbs at the left of the row
 *   bar.addButton({ label, icon, picture, odds, onPress })   -> ActionButton; picture: a large pixel icon;
 *                                                  odds: add three chance bars (setOdds(0..3))
 *   bar.addGap()                                   pushes the following buttons to the right
 *   bar.setMoves(moves, { onPress(index), onHold(index) })
 *       moves [{ name, icon (url), color, kind, cost, desc }]; a press held for 0.45 s calls onHold instead
 *   bar.updateMove(index, { off, cover, edge, hot })   cover: text laid over the button ('Rest 2'); edge: 'up' | 'down'
 *   bar.wide                                       the wide ActionButton in the place of the moves (picture, label, desc)
 *   bar.showWide(on)                               show it instead of the moves, or the moves again
 *   bar.fit(again)                                 call after buttons appear or go (again: the screen changed size): a crowded row first drops
 *                                                  the word of the orbs, then the words of its picture buttons, then every
 *                                                  word (icons, orbs and chance bars stay), so the row always fits the screen
 *   bar.finish()                                   the battle is over: the moves go, the row dims
 *   bar.row, bar.moves                             the elements
 *   bar.dispose()                                  drops pending hold timers
 *   ActionButton: element, hidden, off, hot (setters), setLabel(text), setDesc(text), setPicture(url),
 *                 setCount(n) (a corner number shown when the words are gone), setOdds(level)
 */

import { element } from './dom.js';
import { edgeMark } from './BattleCard.js';

const HOLD_MS = 450;

class ActionButton {
  #label;
  #text;
  #desc = null;
  #count = null;
  #odds = null;

  constructor(parent, o) {
    this.element = element('button', `bt-btn${o.picture ? ' ic' : ''}${o.className ? ` ${o.className}` : ''}`, parent);
    this.element.type = 'button';
    const name = o.picture || o.icon;
    if (name) {
      const image = element('img', '', this.element);
      image.alt = '';
      image.draggable = false;
      image.src = name;
    }
    this.#label = element('span', 'tl', this.element);
    this.#text = document.createTextNode(o.label || '');
    this.#label.appendChild(this.#text);
    if (o.desc !== undefined) this.#desc = element('small', 'ds', this.#label, o.desc);
    if (o.label) this.element.setAttribute('aria-label', o.label);
    if (o.odds) {
      this.#odds = element('span', 'bt-odds', this.element);
      for (let i = 0; i < 3; i++) element('b', '', this.#odds);
    }
    if (o.onPress) this.element.addEventListener('click', o.onPress);
  }

  set hidden(on) {
    this.element.hidden = !!on;
  }

  get hidden() {
    return this.element.hidden;
  }

  set off(on) {
    this.element.classList.toggle('off', !!on);
  }

  set hot(on) {
    this.element.classList.toggle('hot', !!on);
  }

  setLabel(text) {
    this.#text.nodeValue = text;
    this.element.setAttribute('aria-label', text);
  }

  setPicture(url) {
    let image = this.element.querySelector('img');
    if (!url) return;
    if (!image) {
      image = document.createElement('img');
      image.alt = '';
      image.draggable = false;
      this.element.prepend(image);
    }
    image.src = url;
  }

  /* a small number in the corner, shown when the row is so crowded that the words are gone */
  setCount(n) {
    if (!this.#count) this.#count = element('span', 'cnt', this.element);
    this.#count.textContent = n > 0 ? String(n) : '';
  }

  setDesc(text) {
    if (this.#desc) this.#desc.textContent = text;
  }

  setOdds(level) {
    if (this.#odds) this.#odds.setAttribute('data-l', level);
  }
}

export class BattleActionBar {
  #pips;
  #pipLabel;
  #pipKey = '';
  #fitKey = '';
  #buttons = [];
  #timers = new Set();

  constructor(parent) {
    this.row = element('div', 'bt-acts', parent);
    this.moves = element('div', 'bt-moves', parent);
    this.#pips = element('div', 'bt-pips', this.row);
    this.#pipLabel = element('span', 'tl', this.#pips);
    this.wide = new ActionButton(parent, { label: '', desc: '', className: 'bt-breath' });
    this.wide.hidden = true;
  }

  showWide(on) {
    this.wide.hidden = !on;
    this.moves.classList.toggle('away', !!on);
  }

  setPips(label, value, max) {
    const key = `${label}|${value}|${max}`;
    if (key === this.#pipKey) return;
    this.#pipKey = key;
    this.#pipLabel.textContent = label;
    while (this.#pips.children.length > 1) this.#pips.lastChild.remove();
    for (let i = 0; i < max; i++) element('span', `bt-pip${i < value ? ' on' : ''}`, this.#pips);
  }

  addButton(o) {
    return new ActionButton(this.row, o);
  }

  addGap() {
    element('div', 'gap', this.row);
  }

  setMoves(moves, on) {
    this.#clearTimers();
    this.moves.textContent = '';
    this.moves.style.gridTemplateColumns = `repeat(${Math.max(2, moves.length)},1fr)`;
    this.moves.classList.toggle('four', moves.length > 3);
    this.#buttons = moves.map((m, i) => this.#addMove(m, i, on));
  }

  updateMove(index, o) {
    const b = this.#buttons[index];
    if (!b) return;
    b.button.classList.toggle('off', !!o.off);
    b.button.classList.toggle('hot', !!o.hot);
    b.cover.hidden = !o.cover;
    b.cover.textContent = o.cover || '';
    if (b.edge !== (o.edge || '')) {
      b.edge = o.edge || '';
      b.mark.textContent = '';
      if (o.edge) b.mark.appendChild(edgeMark(o.edge, 20));
    }
  }

  fit(again) {
    const row = this.row;
    if (again) this.#fitKey = '';
    let key = '';
    for (const child of row.children) key += child.hidden ? '0' : '1';
    key += this.#pipKey;
    if (key === this.#fitKey) return;
    row.classList.remove('tight', 'tighter', 'tightest');
    /* not laid out yet (no size, or the font still loading): measure again next time */
    if (!row.clientWidth) return;
    this.#fitKey = key;
    for (const level of ['tight', 'tighter', 'tightest']) {
      if (row.scrollWidth <= row.clientWidth) return;
      row.classList.add(level);
    }
  }

  finish() {
    this.moves.style.visibility = 'hidden';
    this.row.style.opacity = '0.4';
    this.showWide(false);
  }

  dispose() {
    this.#clearTimers();
  }

  #addMove(m, index, on) {
    const button = element('button', 'bt-mv', this.moves);
    button.type = 'button';
    button.style.setProperty('--mc', m.color);
    const mark = element('span', 'mark', button);
    const title = element('b', '', button);
    if (m.icon) {
      const image = element('img', 'ic', title);
      image.alt = '';
      image.draggable = false;
      image.src = m.icon;
    }
    title.appendChild(document.createTextNode(m.name));
    element('span', 'kind', button, m.kind);
    element('span', 'sc', button, m.cost);
    element('i', '', button, m.desc);
    const cover = element('span', 'cd', button);
    cover.hidden = true;
    let timer = null;
    let held = false;
    const drop = () => {
      if (timer) {
        clearTimeout(timer);
        this.#timers.delete(timer);
      }
      timer = null;
    };
    button.addEventListener('pointerdown', () => {
      drop();
      held = false;
      timer = setTimeout(() => {
        this.#timers.delete(timer);
        timer = null;
        held = true;
        on.onHold(index);
      }, HOLD_MS);
      this.#timers.add(timer);
    });
    button.addEventListener('pointerup', drop);
    button.addEventListener('pointerleave', drop);
    button.addEventListener('pointercancel', drop);
    button.addEventListener('click', () => {
      const wasHeld = held;
      held = false;
      if (!wasHeld) on.onPress(index);
    });
    return { button, mark, cover, edge: '' };
  }

  #clearTimers() {
    for (const t of this.#timers) clearTimeout(t);
    this.#timers.clear();
  }
}
