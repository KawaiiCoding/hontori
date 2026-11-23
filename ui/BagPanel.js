/*
 * BagPanel.js
 * Job: show the bag inside a Panel: the purse, the four tabs, the rows of things with their uses,
 * and the merchant pouch as a grid of slots. It only shows a view described as data (the items
 * system builds it) and calls back; it knows no item rule. It also holds the few styles the bag
 * and the shop add to the kit, in the kit's shapes and the theme's colours.
 *
 * Public API:
 *   buildBag(panel, view, { art, onTab, refresh })
 *        view: { purse, tabs: [{ id, label, count, icon }], tab, note, empty,
 *                rows: [{ icon, name, n, tag, desc, actions: [{ label, desc, off, drop, sure, keep, run }] }],
 *                pouch: { icon, title, text, hint, slots: [{ icon, name, n, value, desc, each }] } | null }
 *        onTab(id): switch tab; refresh(): build again after an action that keeps the panel open
 *   purseRow(purse)            the purse line as an element (the shop uses it too)
 */

import { element } from './dom.js';
import { Button } from './Button.js';

/* rows move up after a change: a second quick tap must not land on the next thing */
let waitUntil = 0;

export function purseRow(purse) {
  const row = element('div', 'ui-purse');
  element('span', 'pl', row, purse.label);
  for (const coin of purse.coins) {
    const part = element('span', 'pc', row);
    const dot = element('i', '', part);
    const look = coin.look || { light: '#f0a070', dark: '#9a4a22' };
    dot.style.background = `radial-gradient(circle at 35% 30%,#fff 0,${look.light} 35%,${look.dark} 100%)`;
    element('b', '', part, String(coin.n));
    element('small', '', part, coin.word);
  }
  return row;
}

function image(src) {
  const img = element('img');
  img.alt = '';
  img.draggable = false;
  if (src) img.src = src;
  return img;
}

function actionButton(art, parent, action, refresh) {
  const button = new Button(art, { label: action.label, desc: action.desc || null, kind: 'alt', small: true });
  button.element.disabled = !!action.off;
  let sure = false;
  let done = false;
  button.element.addEventListener('click', () => {
    if (action.off || done || Date.now() < waitUntil) return;
    if (action.drop && !sure) {
      sure = true;
      button.setText(action.sure || action.label, action.desc || '');
      setTimeout(() => {
        sure = false;
        if (button.element.isConnected) button.setText(action.label, action.desc || '');
      }, 3000);
      return;
    }
    done = true;
    waitUntil = Date.now() + 450;
    try {
      action.run();
    } catch (error) {
      console.warn('BagPanel: an action failed', error);
    }
    if (action.keep) refresh();
  });
  parent.appendChild(button.element);
}

function row(art, parent, thing, refresh) {
  const box = element('div', 'ui-row', parent);
  box.appendChild(image(thing.icon));
  const info = element('div', 'inf', box);
  const name = element('div', 'nm', info);
  element('span', '', name, thing.n > 1 ? `${thing.name}  x${thing.n}` : thing.name);
  if (thing.tag) element('span', 'ui-tag', name, thing.tag);
  if (thing.desc) element('div', 'sub', info, thing.desc);
  if (thing.actions.length) {
    const buttons = element('div', 'btns', info);
    for (const action of thing.actions) actionButton(art, buttons, action, refresh);
  }
}

function pouchGrid(panel, pouch) {
  const head = element('div', 'ui-pouch');
  element('div', 'pi', head).appendChild(image(pouch.icon));
  const text = element('div', 'pt', head);
  element('b', '', text, pouch.title);
  element('span', '', text, pouch.text);
  panel.add(head);
  const grid = panel.add(element('div', 'ui-slots'));
  const info = panel.add(element('div', 'ui-slotinfo', null, pouch.hint));
  let chosen = null;
  for (const slot of pouch.slots) {
    const button = element('button', 'ui-slot', grid);
    button.type = 'button';
    button.setAttribute('aria-label', slot.name);
    button.appendChild(image(slot.icon));
    if (slot.n > 1) element('i', 'n', button, `x${slot.n}`);
    element('small', '', button, slot.value);
    button.addEventListener('click', () => {
      if (chosen) chosen.classList.remove('on');
      chosen = button;
      button.classList.add('on');
      info.textContent = '';
      element('b', '', info, slot.n > 1 ? `${slot.name}  x${slot.n}` : slot.name);
      if (slot.desc) element('div', '', info, slot.desc);
      element('span', '', info, slot.each);
    });
  }
}

export function buildBag(panel, view, { art, onTab, refresh }) {
  panel.add(purseRow(view.purse));
  const tabs = panel.add(element('div', 'ui-tabs'));
  for (const tab of view.tabs) {
    const button = element('button', `ui-tab${tab.id === view.tab ? ' on' : ''}`, tabs);
    button.type = 'button';
    button.appendChild(image(tab.icon));
    element('b', '', button, tab.label);
    element('small', '', button, tab.count);
    button.addEventListener('click', () => onTab(tab.id));
  }
  if (view.pouch) {
    pouchGrid(panel, view.pouch);
    return;
  }
  if (view.empty && !view.note) {
    panel.add(element('div', 'ui-empty', null, view.empty));
    return;
  }
  const section = panel.add(element('div', 'ui-sec'));
  if (view.note) element('div', 'ui-note', section, view.note);
  if (view.empty) element('div', 'ui-empty', section, view.empty);
  for (const thing of view.rows) row(art, section, thing, refresh);
}
