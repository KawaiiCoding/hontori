/*
 * PanelExtras.js
 * Job: the few things a panel with several screens needs beyond the kit: a panel registered by
 * one system can be extended by another (something added before or after what it builds), a
 * panel can change its header when it moves to another of its screens, one panel can give way
 * to another, and a row of segment tabs.
 *
 * Public API:
 *   extendPanel(registry, id, { before, after })   -> true when the panel exists
 *        before(panel, ctx) / after(panel, ctx, made): run around the panel's own build (each call
 *        guarded); made: the body elements the own build added, in order
 *   setHead(panel, art, { icon, title, sub })      change a Panel's header in place
 *   swapPanel(game, id)        the panel on top becomes panel `id` in place (PanelScene.show); over
 *                              anything else a new sheet opens
 *   segments({ tabs: [{ id, label }], current, onPick })   a row of segment tabs (.ui-seg); onPick(id)
 */

import { element } from './dom.js';

export function extendPanel(registry, id, { before, after } = {}) {
  const definition = registry.get('panel', id);
  if (!definition || typeof definition.build !== 'function') return false;
  const own = definition.build;
  definition.build = function build(panel, ctx) {
    if (before) {
      try {
        before(panel, ctx);
      } catch (error) {
        console.warn(`PanelExtras: an addition before panel "${id}" failed`, error);
      }
    }
    const start = panel.add(document.createComment('own'));
    own.call(definition, panel, ctx);
    if (!after) return;
    const made = [];
    for (let node = start.nextSibling; node; node = node.nextSibling) if (node.nodeType === 1) made.push(node);
    try {
      after(panel, ctx, made);
    } catch (error) {
      console.warn(`PanelExtras: an addition after panel "${id}" failed`, error);
    }
  };
  return true;
}

export function setHead(panel, art, { icon, title, sub }) {
  const head = panel.element.querySelector('.ui-head');
  if (!head) return;
  const image = head.querySelector(':scope > img');
  if (image && icon) image.src = art.iconUrl(icon);
  const heading = head.querySelector('h2');
  if (!heading) return;
  heading.textContent = title == null ? '' : String(title);
  if (sub) element('small', '', heading, sub);
}

export function swapPanel(game, id) {
  const top = game.scenes.top;
  /* a panel on top changes in place; anything else gives way to a new sheet */
  if (top && typeof top.show === 'function' && top.show(id)) return;
  if (top && top.overlay && !top.hud) game.scenes.pop();
  game.ui.openPanel(id);
}

export function segments({ tabs, current, onPick }) {
  const row = element('div', 'ui-seg');
  for (const tab of tabs) {
    const button = element('button', tab.id === current ? 'on' : '', row, tab.label);
    button.type = 'button';
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      onPick(tab.id);
    });
  }
  return row;
}
