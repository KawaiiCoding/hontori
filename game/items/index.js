/*
 * index.js  (Hontori game layer: items)
 * Job: Hontori's choices for the engine's items system: the bag's words as the current game says
 * them (src/menu.js), the coin colours of the purse, the tab icons (the leather pouch), the item
 * icons through the game's painters, the party of five, and the party strip.
 *
 * Public API:
 *   HONTORI_ITEMS                 the setup handed to the engine's install (systems/items/index.js)
 *   installHontoriItems(game)     install the items system with that setup, plus the party strip;
 *                                 returns the Items system
 */

import { install } from '../../systems/items/index.js';
import { PartyStrip } from './PartyStrip.js';
import { words } from '../text.js';

/* every word of the bag and the shop is a text id of the content (shared/text.en.js) */
const WORDS = words({
  bag: 'shared.ui.bag.title', purse: 'shared.ui.bag.purse',
  tabPocket: 'shared.ui.bag.tab.pocket', tabSupply: 'shared.ui.bag.tab.supply',
  tabTrade: 'shared.ui.bag.tab.trade', tabKey: 'shared.ui.bag.tab.key',
  notePocket: 'shared.ui.bag.note.pocket', noteSupply: 'shared.ui.bag.note.supply', noteKey: 'shared.ui.bag.note.key',
  emptyPocket: 'shared.ui.bag.empty.pocket', emptySupply: 'shared.ui.bag.empty.supply',
  emptyTrade: 'shared.ui.bag.empty.trade', emptyKey: 'shared.ui.bag.empty.key',
  pouchTitle: 'shared.ui.bag.pouch.title', pouchWorth: 'shared.ui.bag.pouch.worth', pouchHint: 'shared.ui.bag.pouch.hint',
  each: 'shared.ui.bag.each', inUse: 'shared.ui.bag.inUse',
  drop: 'shared.ui.bag.drop', dropSure: 'shared.ui.bag.drop.sure', dropHeld: 'shared.ui.bag.drop.held',
  putBackHeld: 'shared.ui.bag.back.held',
  shopTitle: 'shared.ui.shop.title', shopSellDone: 'shared.ui.shop.sold', shopLeave: 'shared.ui.shop.leave',
  shopBuy: 'shared.ui.shop.buy', shopSell: 'shared.ui.shop.sell', shopShort: 'shared.ui.shop.short',
  shopPick: 'shared.ui.shop.pick', shopPouchWorth: 'shared.ui.shop.pouch.worth',
  party: 'shared.ui.party',
});

/* gold, silver, copper: the purse coins of the current game */
const COIN_LOOKS = [
  { light: '#ffe07a', dark: '#c8901a' },
  { light: '#f2f4f8', dark: '#8a92a6' },
  { light: '#f0a070', dark: '#9a4a22' },
];

/* the clear pixel icon of an item when the painters have one, else its named icon */
function itemIcon(game, item) {
  const art = game.art;
  if (typeof art.itemIconUrl === 'function') {
    const url = art.itemIconUrl(item.id);
    if (url) return url;
  }
  return art.iconUrl(item.icon || 'backpack');
}

function pouchIcon(game) {
  const art = game.art;
  return (typeof art.itemIconUrl === 'function' && art.itemIconUrl('pouch')) || art.iconUrl('coin');
}

export const HONTORI_ITEMS = {
  words: WORDS,
  coinLooks: COIN_LOOKS,
  itemIcon,
  maxParty: 5,
  bonusEffect: 'pocketPlus',
  bagIcon: 'backpack',
};

export function installHontoriItems(game) {
  const tabIcons = {
    pocket: 'backpack', supply: 'heart', key: 'star',
    get trade() {
      return pouchIcon(game);
    },
  };
  const items = install(game, { ...HONTORI_ITEMS, tabIcons });
  game.registry.add('system', 'party-strip', new PartyStrip());
  return items;
}
