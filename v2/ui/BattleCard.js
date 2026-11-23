/*
 * BattleCard.js
 * Job: the card of one fighter in a battle: name and level, its bars (health, stamina ...) with numbers, its
 * type badges, the advantage mark and the tags of what is on it. Also the two small pictures cards share
 * with the rest of the battle screen: a type badge and the advantage mark.
 *
 * Public API:
 *   new BattleCard(parent, place)     place: 'foe' | 'me' (where the stylesheet puts it)
 *   card.set({ name, level, bars, badges, edge, tags })
 *       bars    [{ kind: '' | 'sta', thin, label, value, max, low }]
 *       badges  [{ icon (image url), label, color }]
 *       edge    'up' | 'down' | 'even' | null     the advantage mark after the badges
 *       tags    [{ text, color }]
 *   card.element
 *   badge({ icon, label, color })     -> a badge element
 *   edgeMark(edge, pixels)            -> an svg element: green arrow up, red arrow down or grey equals
 */

import { element } from './dom.js';

const SVG = 'http://www.w3.org/2000/svg';
const EDGES = {
  up: { color: '#57d07a', path: 'M12 5 L19 14 L14 14 L14 19 L10 19 L10 14 L5 14 Z' },
  down: { color: '#ff6a5a', path: 'M12 19 L19 10 L14 10 L14 5 L10 5 L10 10 L5 10 Z' },
  even: { color: '#8a90a8', path: 'M6 9 H18 V11 H6 Z M6 13 H18 V15 H6 Z' }
};

export function edgeMark(edge, pixels) {
  const e = EDGES[edge] || EDGES.even;
  const svg = document.createElementNS(SVG, 'svg');
  svg.setAttribute('class', 'bt-edge');
  svg.setAttribute('width', pixels || 22);
  svg.setAttribute('height', pixels || 22);
  svg.setAttribute('viewBox', '0 0 24 24');
  const circle = document.createElementNS(SVG, 'circle');
  circle.setAttribute('cx', 12);
  circle.setAttribute('cy', 12);
  circle.setAttribute('r', 11);
  circle.setAttribute('fill', e.color);
  circle.setAttribute('stroke', 'rgba(0,0,0,.45)');
  circle.setAttribute('stroke-width', 1.5);
  const path = document.createElementNS(SVG, 'path');
  path.setAttribute('d', e.path);
  path.setAttribute('fill', '#fff');
  svg.append(circle, path);
  return svg;
}

export function badge(o) {
  const node = element('span', 'bt-badge');
  node.style.setProperty('--ec', o.color || '#555');
  if (o.icon) {
    const image = element('img', '', node);
    image.alt = '';
    image.draggable = false;
    image.src = o.icon;
  }
  element('span', '', node, o.label);
  return node;
}

function rgba(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`;
}

export class BattleCard {
  #name;
  #level;
  #bars = [];
  #barBox;
  #marks;
  #marksKey = '';

  constructor(parent, place) {
    this.element = element('div', `bt-card ${place}`, parent);
    const head = element('div', 'nm', this.element);
    this.#name = element('span', '', head);
    this.#level = element('span', 'lv', head);
    this.#barBox = element('div', '', this.element);
    this.#marks = element('div', 'st', this.element);
  }

  set(o) {
    this.#name.textContent = o.name;
    this.#level.textContent = o.level;
    const bars = o.bars || [];
    while (this.#bars.length < bars.length) this.#bars.push(this.#addBar());
    this.#bars.forEach((bar, i) => {
      const b = bars[i];
      bar.box.hidden = !b;
      if (!b) return;
      bar.box.className = `bt-bar${b.kind ? ` ${b.kind}` : ''}${b.thin ? ' thin' : ''}${b.low ? ' low' : ''}`;
      bar.fill.style.width = `${Math.max(0, Math.min(100, Math.round((100 * b.value) / (b.max || 1))))}%`;
      bar.label.textContent = b.label;
      bar.value.textContent = `${Math.max(0, Math.ceil(b.value))} / ${b.max}`;
    });
    const key = JSON.stringify([o.badges, o.edge, o.tags]);
    if (key === this.#marksKey) return;
    this.#marksKey = key;
    this.#marks.textContent = '';
    for (const b of o.badges || []) this.#marks.appendChild(badge(b));
    if (o.edge) this.#marks.appendChild(edgeMark(o.edge, 24));
    for (const t of o.tags || []) {
      const tag = element('span', 'bt-tag', this.#marks, t.text);
      tag.style.background = rgba(t.color, 0.25);
      tag.style.color = t.color;
    }
  }

  #addBar() {
    const box = element('div', 'bt-bar', this.#barBox);
    const fill = element('b', '', box);
    const text = element('span', '', box);
    return { box, fill, label: element('em', '', text), value: element('em', '', text) };
  }
}
