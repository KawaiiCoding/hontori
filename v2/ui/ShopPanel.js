/*
 * ShopPanel.js
 * Job: show a shop inside a Panel: the keeper's face and words, the purse, the goods and the trade
 * pouch as slots, and leaving. Tapping a slot only selects it: a card shows its icon, name, price
 * and what it does, with one clear button. Only that button spends (Buy) or earns (Sell); it is
 * disabled, with the reason, when the purse is too light or the pouch is empty. It only shows a
 * view described as data (the items system builds it) and calls back.
 *
 * Public API:
 *   buildShop(panel, view, { art, line, state, onLine, close })
 *        view: { title, look, greet, purse, words: { buy, pick },
 *                goods: [{ item, icon, name, price, desc, short, can, buy() }],
 *                sell: { label, icon, name, worth, desc, value, run() }, leave }
 *        buy() and sell.run() return the keeper's answer; line: the answer to show (else the greeting);
 *        onLine(text): remember the answer and build again; state: { chosen } kept by the caller so
 *        the selection outlives a rebuild
 */

import { element } from './dom.js';
import { Button } from './Button.js';
import { purseRow } from './BagPanel.js';

function keeperFace(art, look) {
  if (!look) return null;
  try {
    const source = art.portrait('person', look);
    if (!source) return null;
    const canvas = element('canvas');
    canvas.width = 56;
    canvas.height = 56;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(source, 0, 0, 56, 56);
    return canvas;
  } catch (error) {
    return null;
  }
}

function image(src) {
  const img = element('img');
  img.alt = '';
  img.draggable = false;
  if (src) img.src = src;
  return img;
}

/* the selected thing: what it is, what it costs, what it does, and the one button that trades */
function showPick(art, card, pick, onTrade) {
  card.className = 'ui-pick';
  card.textContent = '';
  card.appendChild(image(pick.icon));
  const info = element('div', 'inf', card);
  element('b', '', info, pick.name);
  element('div', 'pr', info, pick.price);
  if (pick.desc) element('div', 'use', info, pick.desc);
  const button = new Button(art, { label: pick.action, desc: pick.can ? null : pick.short, kind: pick.can ? 'gold' : 'alt', onPress: () => {
    if (pick.can) onTrade();
  } });
  button.element.disabled = !pick.can;
  info.appendChild(button.element);
}

export function buildShop(panel, view, { art, line, state = {}, onLine, close }) {
  const say = element('div', 'ui-say');
  const face = keeperFace(art, view.look);
  if (face) say.appendChild(face);
  const words = element('div', '', say);
  element('div', 'who', words, view.title);
  element('div', 'line', words, line || view.greet);
  panel.add(say);
  panel.add(purseRow(view.purse));

  const labels = view.words || {};
  const grid = panel.add(element('div', 'ui-slots'));
  const card = panel.add(element('div', 'ui-pick hint', null, labels.pick || ''));
  const picks = view.goods.map((good) => ({
    key: `good:${good.item}`, icon: good.icon, name: good.name, price: good.price, tag: good.price, desc: good.desc,
    can: good.can, short: good.short, action: labels.buy || view.buyLabel, trade: good.buy,
  }));
  const sell = view.sell;
  if (sell) {
    picks.push({
      key: 'sell', icon: sell.icon, name: sell.name || sell.label, price: sell.worth || '', tag: sell.worth || '', desc: sell.desc,
      can: !!sell.value, short: '', action: sell.label, trade: sell.run,
    });
  }
  let chosen = null;
  for (const pick of picks) {
    const button = element('button', 'ui-slot', grid);
    button.type = 'button';
    button.setAttribute('aria-label', pick.name);
    button.appendChild(image(pick.icon));
    element('small', '', button, pick.tag);
    const select = () => {
      if (chosen) chosen.classList.remove('on');
      chosen = button;
      button.classList.add('on');
      state.chosen = pick.key;
      /* only the button in the card spends or earns; the answer rebuilds the panel with the same selection */
      showPick(art, card, pick, () => onLine(pick.trade()));
    };
    button.addEventListener('click', select);
    if (state.chosen === pick.key) select();
  }

  const row = panel.actions();
  panel.button(row, { label: view.leave, kind: 'alt', onPress: close });
}
