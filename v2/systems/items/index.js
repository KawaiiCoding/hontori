/*
 * index.js  (engine: items)
 * Job: one call that adds the items system to a game: the bag, the purse, the shops and the party
 * data model, with their save sections, story commands, panels and HUD button.
 *
 * Public API:
 *   install(game, setup)   call before game.save.load() and game.start(); returns the Items system
 *        setup: the options of new Items (Items.js): { content, words, itemIcon, tabIcons, coinLooks,
 *               maxParty, bonusEffect, bagIcon }; every field is optional
 *   Items, ItemBook, Inventory, Money, Party    the parts, for a game layer or a test
 *
 * What it registers:
 *   save sections   "inventory" { items }, "money" { copper, best }, "party" { members }
 *   system          "items"           (also service "items": other systems read the bag, purse and party here)
 *   story.command    give, take, find, money, spend, shop, heal       (commands.js)
 *   story.condition  has, owns, coins, party
 *   story.value      price, coins, item
 *   panel           "backpack" (the bag), "shop" (show(shopId) first; the shop command does that)
 *   hud.button      "backpack" (order 10)
 */

import { Items } from './Items.js';
import { ItemBook } from './ItemBook.js';
import { Inventory, SAVE as INVENTORY_SAVE } from './Inventory.js';
import { Money, SAVE as MONEY_SAVE } from './Money.js';
import { Party, SAVE as PARTY_SAVE } from './Party.js';
import { registerCommands } from './commands.js';
import { buildBag } from '../../ui/BagPanel.js';
import { buildShop } from '../../ui/ShopPanel.js';

export { Items, ItemBook, Inventory, Money, Party };

export function install(game, setup = {}) {
  const items = new Items(setup);
  game.save.define('inventory', INVENTORY_SAVE);
  game.save.define('money', MONEY_SAVE);
  game.save.define('party', PARTY_SAVE);
  game.registry.add('system', 'items', items);
  game.registry.add('service', 'items', items);
  registerCommands(game, items);

  const bagIcon = setup.bagIcon || 'backpack';
  let tab = 'pocket';
  game.registry.add('panel', 'backpack', {
    icon: bagIcon,
    get title() {
      return items.word('bag');
    },
    build(panel, { close, refresh }) {
      const view = items.bagView(tab, close);
      buildBag(panel, view, { art: game.art, refresh, onTab: (id) => { tab = id; refresh(); } });
    },
  });
  game.registry.add('hud.button', 'backpack', {
    icon: bagIcon, label: items.word('bag'), order: 10, open: () => game.ui.openPanel('backpack'),
  });

  let shopId = null;
  let line = '';
  /* what is selected in the shop; it outlives a rebuild of the panel */
  const state = { chosen: null };
  game.registry.add('panel', 'shop', {
    icon: 'coin',
    get title() {
      return (shopId && items.shopView(shopId)?.title) || items.word('shopTitle');
    },
    show(id) {
      shopId = id;
      line = '';
      state.chosen = null;
    },
    build(panel, { close, refresh }) {
      const view = shopId ? items.shopView(shopId) : null;
      if (!view) return;
      buildShop(panel, view, { art: game.art, line, state, close, refresh, onLine: (text) => { line = text || ''; refresh(); } });
    },
  });
  return items;
}
