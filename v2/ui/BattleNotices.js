/*
 * BattleNotices.js
 * Job: the pieces of a battle screen that tell and never ask: the message line, the foe's intent pill, the turn
 * pill, the pop-up grade of a drawn spell, the matchup banner, the strip with the opponent's face and team
 * dots, the rule label, the title card before a special duel and the end card. Each removes itself when its
 * animation ends; none uses a timer.
 *
 * Public API:
 *   new BattleMessage(parent)            .say(text), .add(text), .text
 *   new BattleIntent(parent)             .set({ drawing (svg path markup), word, note, color, pulse }), .hide()
 *   new BattleTurn(parent)               .set(text, mine)     '' hides it
 *   showGrade(parent, text, color, x, y)             a pill at css pixels x, y that pops and fades
 *   showBanner(parent, nodes)                        the nodes in a row, centred, for 2.7 s
 *   new BattleOwner(parent, { portrait, label, team })   .setOut(count)   team: how many dots (0: none)
 *   showRule(parent, text)
 *   showTitleCard(parent, { crest (svg markup), kicker, title, name, rule, hint, onGone })   -> { hide() }
 *   new BattleEndCard(parent, { kicker, label, color, icon (url), onPress })   .element
 */

import { element } from './dom.js';

function removeWhenDone(node) {
  node.addEventListener('animationend', (event) => {
    if (event.target === node) node.remove();
  });
}

export class BattleMessage {
  #node;

  constructor(parent) {
    this.#node = element('div', 'bt-msg', parent);
  }

  get text() {
    return this.#node.textContent;
  }

  say(text) {
    this.#node.textContent = text || '';
  }

  add(text) {
    this.#node.textContent = `${this.#node.textContent} ${text}`;
  }
}

export class BattleIntent {
  #node;
  #key = '';

  constructor(parent) {
    this.#node = element('div', 'bt-intent', parent);
    this.element = this.#node;
  }

  set(o) {
    this.#node.hidden = false;
    this.#node.classList.toggle('pulse', !!o.pulse);
    const key = `${o.drawing}|${o.word}|${o.note}|${o.color}`;
    if (key === this.#key) return;
    this.#key = key;
    this.#node.style.setProperty('--ic', o.color);
    this.#node.textContent = '';
    this.#node.insertAdjacentHTML('beforeend',
      `<svg viewBox="0 0 30 30"><g fill="none" stroke="${o.color}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${o.drawing}</g></svg>`);
    const text = element('span', '', this.#node, `${o.word} `);
    element('small', '', text, o.note);
  }

  hide() {
    this.#node.hidden = true;
  }
}

export class BattleTurn {
  #node;
  #text = null;

  constructor(parent) {
    this.#node = element('div', 'bt-turn', parent);
  }

  set(text, mine) {
    const key = `${text}|${mine}`;
    if (key === this.#text) return;
    this.#text = key;
    if (text) this.#node.textContent = text;
    this.#node.className = `bt-turn${text ? ' on' : ''}${mine ? ' me' : ''}`;
  }
}

export function showGrade(parent, text, color, x, y) {
  const node = element('div', 'bt-grade', parent, text);
  node.style.setProperty('--gc', color);
  node.style.left = `${x}px`;
  node.style.top = `${y}px`;
  removeWhenDone(node);
  return node;
}

export function showBanner(parent, nodes) {
  const banner = element('div', 'bt-banner', parent);
  const row = element('div', 'vs', banner);
  for (const node of nodes) row.appendChild(node);
  removeWhenDone(banner);
  return banner;
}

export class BattleOwner {
  #dots = [];

  constructor(parent, o) {
    this.element = element('div', 'bt-owner', parent);
    parent.classList.add('owned');
    const face = element('canvas', '', this.element);
    face.width = 96;
    face.height = 96;
    try {
      if (o.portrait) face.getContext('2d').drawImage(o.portrait, 0, 0, 96, 96);
    } catch (error) {
      console.error('BattleOwner: the portrait failed', error);
    }
    element('span', 'nm', this.element, o.label);
    if (o.team) {
      const row = element('span', 'dots', this.element);
      for (let i = 0; i < o.team; i++) this.#dots.push(element('b', '', row));
    }
  }

  setOut(count) {
    this.#dots.forEach((dot, i) => dot.classList.toggle('out', i < count));
  }
}

export function showRule(parent, text) {
  return element('div', 'bt-rule', parent, text);
}

export function showTitleCard(parent, o) {
  const card = element('div', 'bt-title', parent);
  const crest = element('div', 'crest', card);
  crest.insertAdjacentHTML('beforeend', o.crest || '');
  element('small', '', card, o.kicker);
  element('b', '', card, o.title);
  element('span', '', card, o.name);
  if (o.rule) element('em', '', card, o.rule);
  element('div', 'skip', card, o.hint);
  let gone = false;
  const hide = () => {
    if (gone) return;
    gone = true;
    card.classList.add('out');
    card.addEventListener('animationend', (event) => {
      if (event.target === card) card.remove();
    });
    if (o.onGone) o.onGone();
  };
  card.addEventListener('click', hide);
  return { hide };
}

export class BattleEndCard {
  constructor(parent, o) {
    const button = element('button', 'bt-end', parent);
    button.type = 'button';
    button.style.setProperty('--ec', o.color);
    const box = element('span', 'ei', button);
    if (o.icon) {
      const image = element('img', '', box);
      image.alt = '';
      image.src = o.icon;
    }
    const text = element('span', 'et', button);
    element('small', '', text, o.kicker);
    element('b', '', text, o.label);
    element('span', 'ar', button, '›');
    button.addEventListener('click', o.onPress);
    this.element = button;
  }
}
