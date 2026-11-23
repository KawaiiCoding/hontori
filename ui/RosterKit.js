/*
 * RosterKit.js
 * Job: the shapes of the screens that list companions and abilities: a member card with a face,
 * a name, bars and buttons; a row to pick or unpick something; a grid of small cards; a detail
 * line with a big face; labelled bars, tags, badges, pips and a row of orbs. They only show what
 * they are given and call back; they know no rule. The styles are in styles.js (.ui-mem ...).
 *
 * Public API (every function adds to `parent` and returns the element it made):
 *   face(source, size)                  a canvas copy of a picture (null source: an empty face)
 *   statBar(parent, { frac, kind, label, value })    kind: '' (health) | 'st' | 'xp' | 'wd'
 *   tag(parent, text, kind)             kind: '' (gold) | 'soft' | 'quiet'
 *   badge(parent, { icon, label, color })            an element badge
 *   pips(parent, n, max, word)          diamond pips and a rank word
 *   orbs(parent, { label, n, max })     a dark pill of glowing orbs (mana)
 *   memberCard(parent, art, { face, name, badge, tag, lead, sub, bars, actions })
 *        bars: [statBar options]; actions: [{ icon, label, desc, off, onPress }]
 *   pickRow(parent, { left, title, sub, on, onWord, offWord, onPress })   sub: text or an element
 *   grid(parent)                        a grid for gridCard
 *   gridCard(parent, { face, mark, corner, name, badge, tag, tagKind, dim, onPress })
 *        face: a picture source or null (then `mark` shows instead, a quiet '?')
 *   detail(parent, { face, lines })     lines: [text or element]
 */

import { element } from './dom.js';
import { Button } from './Button.js';

export function face(source, size) {
  const canvas = element('canvas');
  canvas.width = size;
  canvas.height = size;
  if (source) {
    try {
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(source, 0, 0, size, size);
    } catch (error) {
      /* a picture that cannot be copied leaves an empty face */
    }
  }
  return canvas;
}

export function statBar(parent, { frac = 0, kind = '', label, value } = {}) {
  const bar = element('div', `ui-bar${kind ? ` ${kind}` : ''}${label ? ' lb' : ''}`, parent);
  const fill = element('b', '', bar);
  fill.style.width = `${Math.round(100 * Math.max(0, Math.min(1, frac || 0)))}%`;
  if (label) {
    const text = element('span', '', bar);
    element('em', '', text, label);
    element('em', '', text, value == null ? '' : String(value));
  }
  return bar;
}

export function tag(parent, text, kind = '') {
  return element('span', `ui-tag${kind ? ` ${kind}` : ''}`, parent, text);
}

export function badge(parent, { icon, label, color }) {
  const node = element('span', 'ui-elb', parent);
  node.style.setProperty('--ec', color || '#555');
  if (icon) {
    const image = element('img', '', node);
    image.alt = '';
    image.draggable = false;
    image.src = icon;
  }
  element('span', '', node, label);
  return node;
}

export function pips(parent, n, max, word) {
  const box = element('span', 'ui-pips', parent);
  for (let i = 1; i <= max; i++) element('i', i <= n ? 'on' : '', box);
  if (word) element('b', '', box, word);
  return box;
}

export function orbs(parent, { label, n, max }) {
  const row = element('div', 'ui-orbs', parent);
  element('span', '', row, label);
  for (let i = 0; i < max; i++) element('i', i < n ? 'on' : '', row);
  element('span', '', row, `${n} / ${max}`);
  return row;
}

export function memberCard(parent, art, { face: picture, name, badge: badgeInfo, tag: tagText, lead, sub, bars = [], actions = [] }) {
  const card = element('div', `ui-mem${lead ? ' lead' : ''}`, parent);
  const top = element('div', 'top', card);
  const portrait = face(picture, 96);
  portrait.className = 'por';
  top.appendChild(portrait);
  const info = element('div', 'inf', top);
  const title = element('div', 'nm', info);
  element('span', '', title, name);
  if (badgeInfo) badge(title, badgeInfo);
  if (tagText) tag(title, tagText);
  if (sub) element('div', 'sub', info, sub);
  for (const bar of bars) statBar(info, bar);
  if (actions.length) {
    const row = element('div', 'btns', card);
    for (const action of actions) {
      const button = new Button(art, { icon: action.icon, label: action.label, desc: action.desc, kind: 'alt', small: true, onPress: action.off ? null : action.onPress });
      button.element.disabled = !!action.off;
      row.appendChild(button.element);
    }
  }
  return card;
}

export function pickRow(parent, { left, title, sub, on, onWord, offWord, onPress }) {
  const row = element('button', `ui-pick${on ? ' on' : ''}`, parent);
  row.type = 'button';
  if (left) row.appendChild(left);
  const info = element('span', 'inf', row);
  element('span', 'nm', info, title);
  if (sub != null) {
    if (typeof sub === 'string') element('span', 'sub', info, sub);
    else element('span', 'sub', info).appendChild(sub);
  }
  tag(row, on ? onWord : offWord, on ? '' : 'quiet');
  if (onPress) row.addEventListener('click', onPress);
  return row;
}

export function grid(parent) {
  return element('div', 'ui-cards', parent);
}

export function gridCard(parent, { face: picture, mark, corner, name, badge: badgeInfo, tag: tagText, tagKind, dim, onPress }) {
  const card = element('button', `ui-card${dim ? ' dim' : ''}`, parent);
  card.type = 'button';
  if (picture) card.appendChild(face(picture, 96));
  else element('span', 'mark', card, mark || '?');
  if (corner) element('span', 'lv', card, corner);
  if (badgeInfo) badge(card, badgeInfo);
  element('span', 'nm', card, name);
  if (tagText) tag(card, tagText, tagKind);
  if (onPress) card.addEventListener('click', onPress);
  return card;
}

export function detail(parent, { face: picture, lines = [] }) {
  const box = element('div', 'ui-det', parent);
  if (picture) box.appendChild(face(picture, 96));
  const info = element('div', 'inf', box);
  for (const line of lines) {
    if (line == null) continue;
    if (typeof line === 'string') element('div', 'ui-note', info, line);
    else info.appendChild(line);
  }
  return box;
}
