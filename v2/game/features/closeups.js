/*
 * closeups.js  (Hontori: features)
 * Job: the school blackboard as a close-up (src/closeup.js): the Element Wheel in chalk. Tap an element
 * to see what it beats (green arrows) and what beats it (red arrows). The matchups are the battle's own.
 *
 * Public API:
 *   installCloseUps(game)   registers "closeup" "blackboard": (frame, { game, text }) => void
 */

import { element } from '../../ui/dom.js';
import { STRONG } from '../battle/elements.js';

/* the order around the wheel, as on the current game's board */
const WHEEL = ['fire', 'grass', 'water', 'electric', 'wind', 'earth', 'dark', 'light'];
const SVG = 'http://www.w3.org/2000/svg';
const GOOD = '#b8f0a0';
const BAD = '#ff9a8a';
const CENTRE = [50, 55];
const RADIUS = 29;
const GAP = 8.5;

const CSS = `
.ft-close.board{border-radius:10px;padding:14px;background:#5a3a22;box-shadow:inset 0 0 0 3px #3a2414,0 14px 40px rgba(0,0,0,.6)}
.ft-close.board .slate{position:relative;border-radius:4px;background:radial-gradient(ellipse at 40% 35%,#2f4a3c,#1d3028);aspect-ratio:1/1;overflow:hidden}
.ft-close.board h3{position:absolute;left:0;right:0;top:3%;margin:0;text-align:center;color:#f4f1e8;font:900 clamp(16px,4.5cqmin,24px) var(--font);letter-spacing:1px;opacity:.9}
.ft-close.board svg{position:absolute;inset:0;width:100%;height:100%}
.ft-close.board .foot{min-height:44px;margin-top:10px;text-align:center;color:#e8f0e0;font:800 clamp(13px,3.6cqmin,16px)/1.35 var(--font);padding:0 4%}
.ft-close.board .foot .good{color:${GOOD}}
.ft-close.board .foot .bad{color:${BAD}}
.ft-close.board .el{position:absolute;width:13%;min-width:44px;aspect-ratio:1/1;transform:translate(-50%,-50%);border-radius:50%;padding:0;background:none;
  border:2px dashed rgba(244,241,232,.55);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:transform .2s,border-color .2s}
.ft-close.board .el img{width:62%;image-rendering:pixelated}
.ft-close.board .el span{position:absolute;top:100%;margin-top:2px;color:#f4f1e8;font:800 clamp(10px,2.8cqmin,13px) var(--font);white-space:nowrap}
.ft-close.board .el.sel{transform:translate(-50%,-50%) scale(1.15);border-color:#fff;border-style:solid}
`;

let styled = false;
let visits = 0;

function style() {
  if (styled) return;
  styled = true;
  const sheet = document.createElement('style');
  sheet.textContent = CSS;
  document.head.appendChild(sheet);
}

function svgNode(name, attributes, parent) {
  const node = document.createElementNS(SVG, name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (parent) parent.appendChild(node);
  return node;
}

function blackboard(frame, { game, text }) {
  style();
  frame.classList.add('board');
  const slate = element('div', 'slate', frame);
  element('h3', '', slate, text('shared.feat.wheel.title'));
  const foot = element('div', 'foot', frame);
  const svg = svgNode('svg', { viewBox: '0 0 100 100' }, slate);
  const defs = svgNode('defs', {}, svg);
  for (const [id, color] of [['ft-ahg', GOOD], ['ft-ahr', BAD]]) {
    const marker = svgNode('marker', { id, viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto' }, defs);
    svgNode('path', { d: 'M0 0 L10 5 L0 10 z', fill: color }, marker);
  }
  svgNode('circle', { cx: CENTRE[0], cy: CENTRE[1], r: RADIUS, fill: 'none', stroke: 'rgba(244,241,232,.22)', 'stroke-width': 0.6, 'stroke-dasharray': '1.5 2' }, svg);
  const arrows = svgNode('g', {}, svg);
  const name = (el) => text(`shared.ui.element.${el}`);
  const and = (list) => list.map(name).join(text('shared.feat.wheel.and'));
  const at = {};
  const buttons = {};

  const arrow = (from, to, color, marker) => {
    const p = at[from];
    const q = at[to];
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    const ux = (q[0] - p[0]) / d;
    const uy = (q[1] - p[1]) / d;
    const x1 = p[0] + ux * GAP;
    const y1 = p[1] + uy * GAP;
    const x2 = q[0] - ux * GAP;
    const y2 = q[1] - uy * GAP;
    const mx = (x1 + x2) / 2 - uy * 5;
    const my = (y1 + y2) / 2 + ux * 5;
    svgNode('path', { d: `M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`, fill: 'none', stroke: color, 'stroke-width': 1.1, 'stroke-linecap': 'round', 'marker-end': `url(#${marker})` }, arrows);
  };

  const pick = (el) => {
    arrows.replaceChildren();
    for (const [key, button] of Object.entries(buttons)) button.classList.toggle('sel', key === el);
    const beats = STRONG[el] || [];
    const beatenBy = WHEEL.filter((other) => (STRONG[other] || []).includes(el));
    for (const target of beats) arrow(el, target, GOOD, 'ft-ahg');
    for (const source of beatenBy) arrow(source, el, BAD, 'ft-ahr');
    foot.replaceChildren();
    element('span', 'good', foot, text('shared.feat.wheel.beats', { element: name(el), list: and(beats) }));
    foot.appendChild(document.createTextNode(' '));
    element('span', 'bad', foot, text('shared.feat.wheel.weak', { list: and(beatenBy) }));
  };

  WHEEL.forEach((el, i) => {
    const angle = -Math.PI / 2 + (i / WHEEL.length) * Math.PI * 2;
    const x = CENTRE[0] + Math.cos(angle) * RADIUS;
    const y = CENTRE[1] + Math.sin(angle) * RADIUS;
    at[el] = [x, y];
    const button = element('button', 'el', slate);
    button.type = 'button';
    const image = element('img', '', button);
    image.alt = '';
    try {
      image.src = game.art.iconUrl(el);
    } catch (error) {
      image.remove();
    }
    element('span', '', button, name(el));
    button.style.left = `${x}%`;
    button.style.top = `${y}%`;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      pick(el);
      try {
        game.sound.play('blip');
      } catch (error) {
        /* silent */
      }
    });
    buttons[el] = button;
  });
  pick(WHEEL[visits++ % WHEEL.length]);
}

export function installCloseUps(game) {
  game.registry.add('closeup', 'blackboard', blackboard);
}
