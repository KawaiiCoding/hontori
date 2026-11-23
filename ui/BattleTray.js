/*
 * BattleTray.js
 * Job: a tray that slides in above the action row of a battle and scrolls sideways: the spell sheet (chips with
 * a drawing, a name, a cost in orbs and a mastery row) and the party strip (members with a small picture and a
 * health bar). One tray is open at a time per screen; the screen gets the class "tray-open" while a tray that
 * asks for room is open, and its height in the variable --tray, so the card and the message line move above it.
 *
 * Public API:
 *   new BattleTray(parent, { strip, room })   strip: the party look; room: the screen makes room while it is open
 *   tray.open(), tray.close(), tray.toggle(), tray.isOpen
 *   tray.clear()
 *   tray.addChip({ picture, name, note, cost, level, levels, onPress })   -> Chip
 *       picture: svg markup made by the game, or null with `dot` text instead; cost: how many orbs;
 *       level of levels: the mastery row
 *   Chip: element, hidden, set({ picture, dot, name, note, cost, level, levels }), state(name, on)   states: no, hot
 *   tray.addMember({ paint(ctx), name, value, max, color, state, onPress })   state: '' | 'cur' | 'out'
 *       paint draws the member into a 40 x 40 canvas
 */

import { element } from './dom.js';

const ORB = '●';
const MEMBER_PIXELS = 40;

class Chip {
  constructor(parent, o) {
    this.element = element('button', 'bt-chip', parent);
    this.element.type = 'button';
    if (o.onPress) {
      this.element.addEventListener('click', (event) => {
        event.stopPropagation();
        o.onPress();
      });
    }
    this.set(o);
  }

  set hidden(on) {
    this.element.hidden = !!on;
  }

  state(name, on) {
    this.element.classList.toggle(name, !!on);
  }

  set(o) {
    const box = this.element;
    box.textContent = '';
    if (o.picture) box.insertAdjacentHTML('beforeend', o.picture);
    else if (o.dot) element('span', 'dot', box, o.dot);
    box.appendChild(document.createTextNode(o.name || ''));
    if (o.note) element('span', 'd', box, o.note);
    if (o.cost) element('span', 'c', box, ORB.repeat(o.cost));
    if (o.levels) {
      const row = element('span', 'ms', box);
      for (let i = 1; i <= o.levels; i++) element('i', i <= o.level ? 'on' : '', row);
    }
  }
}

export class BattleTray {
  #screen;
  #room;

  constructor(parent, options) {
    this.#screen = parent;
    this.#room = !!(options && options.room);
    this.element = element('div', `bt-tray${options && options.strip ? ' strip' : ''}`, parent);
    this.element.hidden = true;
  }

  get isOpen() {
    return !this.element.hidden;
  }

  open() {
    this.element.hidden = false;
    if (!this.#room) return;
    this.#screen.style.setProperty('--tray', `${this.element.offsetHeight}px`);
    this.#screen.classList.add('tray-open');
  }

  close() {
    if (!this.isOpen) return;
    this.element.hidden = true;
    if (this.#room) this.#screen.classList.remove('tray-open');
  }

  toggle() {
    if (this.isOpen) this.close();
    else this.open();
  }

  clear() {
    this.element.textContent = '';
  }

  addChip(o) {
    return new Chip(this.element, o);
  }

  addMember(o) {
    const button = element('button', `bt-pm${o.state ? ` ${o.state}` : ''}`, this.element);
    button.type = 'button';
    button.style.setProperty('--mc', o.color);
    const canvas = element('canvas', '', button);
    canvas.width = MEMBER_PIXELS;
    canvas.height = MEMBER_PIXELS;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    try {
      o.paint(ctx);
    } catch (error) {
      console.error('BattleTray: a member picture failed', error);
    }
    element('div', '', button, o.name);
    const bar = element('b', o.value / o.max < 0.3 ? 'low' : '', element('div', 'hp', button));
    bar.style.width = `${Math.max(0, Math.round((100 * o.value) / (o.max || 1)))}%`;
    if (o.onPress) button.addEventListener('click', o.onPress);
    return button;
  }
}
