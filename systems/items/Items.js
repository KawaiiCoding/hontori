/*
 * Items.js  (engine: items)
 * Job: the items system: it owns the bag, the purse and the party (their save sections), turns
 * content into what the bag and shop panels show, and does what a give, a purchase or a sale
 * means (toast, sound, first-touch card, save). It draws nothing; ui/BagPanel.js and
 * ui/ShopPanel.js show what it describes.
 *
 * Public API (registry kind "system", id "items"; also registry kind "service", id "items"):
 *   new Items({ content, words, itemIcon, tabIcons, coinLooks, maxParty, bonusEffect })
 *        content: the content folders in load order (else game.content, else registry kind "content")
 *        itemIcon(game, item): icon URL of an item (default: art.itemIconUrl(id), else art.iconUrl(item.icon))
 *        tabIcons: { pocket, supply, trade, key } icon URLs or icon names; coinLooks: [{ light, dark }] per unit, largest first
 *   start(game)
 *   book, inventory, money, party        ItemBook, Inventory, Money, Party
 *   text(id, params), word(key, params)  content text; the bag's own words
 *   name(id), iconUrl(id)
 *   give(id, n, quiet), take(what, n)    with the toast; take returns { id, n } or null
 *   earn(n, why), pay(n)                 why: a text id, or false for no toast; pay: true if paid
 *   save()                               commit the game (guarded)
 *   bagView(tab, close)                  the bag as data for ui/BagPanel.js
 *   shopView(shopId)                     the shop as data for ui/ShopPanel.js (null for an unknown shop); a shop's
 *                                        `sellRate` (content, default 1) multiplies what the trade pouch sells for
 *   worldMapId()                         the map the player stands on, or null
 */

import { ItemBook } from './ItemBook.js';
import { Inventory } from './Inventory.js';
import { Money } from './Money.js';
import { Party } from './Party.js';
import { WORDS } from './words.js';
import { makeText, test, run, helper } from './bridge.js';

const TABS = ['pocket', 'supply', 'trade', 'key'];
const TAB_WORD = { pocket: 'tabPocket', supply: 'tabSupply', trade: 'tabTrade', key: 'tabKey' };
const NOTE_WORD = { pocket: 'notePocket', supply: 'noteSupply', key: 'noteKey' };
const EMPTY_WORD = { pocket: 'emptyPocket', supply: 'emptySupply', trade: 'emptyTrade', key: 'emptyKey' };

export class Items {
  #options;
  #game = null;
  #words;

  constructor(options = {}) {
    this.#options = options;
    this.#words = { ...WORDS, ...(options.words || {}) };
    this.book = new ItemBook([]);
  }

  start(game) {
    this.#game = game;
    const content = this.#options.content || game.content || [...game.registry.all('content')];
    this.book = new ItemBook(content);
    this.text = makeText(game, this.book.text);
    const emit = (type, payload) => game.bus.emit(type, payload);
    this.inventory = new Inventory(this.book, () => game.save.state.inventory, emit, { bonusEffect: this.#options.bonusEffect });
    this.money = new Money(this.book, () => game.save.state.money, emit, this.text);
    this.party = new Party(() => game.save.state.party, emit, { max: this.#options.maxParty || 5 });
    game.bus.on('scene:change', () => this.#heal());
  }

  /* old or damaged saves are healed once a journey is loaded (the first scene change after a load) */
  #healed = null;
  #heal() {
    const state = this.#game.save.state;
    if (!state.inventory || this.#healed === state.inventory) return;
    this.#healed = state.inventory;
    if (this.inventory.tidy()) this.save();
  }

  word(key, params) {
    const raw = this.#words[key] ?? key;
    return raw.replace(/\{(\w+)\}/g, (all, name) => (params && params[name] != null ? String(params[name]) : all));
  }

  name(id) {
    const item = this.book.get(id);
    return item ? this.text(item.name) : String(id);
  }

  iconUrl(id) {
    const item = this.book.get(id) || { id, icon: id };
    const art = this.#game.art;
    try {
      if (this.#options.itemIcon) return this.#options.itemIcon(this.#game, item);
      if (typeof art.itemIconUrl === 'function') {
        const url = art.itemIconUrl(item.id);
        if (url) return url;
      }
      return art.iconUrl(item.icon || item.id);
    } catch (error) {
      console.warn('items: no icon for', id, error);
      return '';
    }
  }

  #toast(text) {
    if (!text) return;
    try {
      this.#game.ui.toast(text);
    } catch (error) {
      console.warn('items: toast failed', error);
    }
  }

  #sound(name) {
    try {
      this.#game.sound.play(name);
    } catch (error) {
      /* a missing sound is never a reason to stop */
    }
  }

  save() {
    try {
      this.#game.save.commit();
    } catch (error) {
      console.warn('items: save failed', error);
    }
  }

  give(id, n = 1, quiet = false) {
    const added = this.inventory.add(id, n);
    if (added && !quiet) {
      this.#sound('pickup');
      const fills = this.book.fillsPocket(id);
      const pickup = this.book.pickup;
      this.#toast(fills && pickup.pockets
        ? this.text(pickup.pockets, { n: this.inventory.pocketsUsed(), cap: this.inventory.pocketCap() })
        : this.text(pickup.got || '{item}', { item: this.name(id) }));
    }
    if (added) this.save();
    return added;
  }

  take(what, n = 1) {
    const taken = this.inventory.remove(what, n, true);
    if (taken) this.save();
    return taken;
  }

  earn(n, why) {
    const amount = Math.max(0, Math.floor(n) || 0);
    if (!amount) return this.money.get();
    const total = this.money.add(amount);
    const m = this.book.money;
    if (why !== false) {
      this.#sound('pickup');
      this.#toast(this.text(m.toastAdd || '+{coins}  {why}', { coins: this.money.format(amount), why: why ? this.text(why) : '' }).trim());
    }
    if (m.helper) helper(this.#game, { ...m.helper, title: this.text(m.helper.title), text: this.text(m.helper.text) });
    this.save();
    return total;
  }

  pay(n) {
    const amount = Math.max(0, Math.floor(n) || 0);
    if (!this.money.spend(amount)) return false;
    if (amount) this.save();
    return true;
  }

  worldMapId() {
    const scenes = this.#game.scenes;
    const world = [scenes.base, scenes.top].find((scene) => scene && scene.map && scene.player);
    return world ? world.map.id || null : null;
  }

  /* ---------- the bag ---------- */

  bagView(tab, close) {
    const inv = this.inventory;
    const groups = { pocket: [], supply: [], trade: [], key: [] };
    for (const entry of inv.list()) groups[this.book.kindOf(entry.id)].push(entry);
    const tabIcon = (kind) => this.#tabIcon(kind);
    const counts = {
      pocket: `${inv.pocketsUsed()} / ${inv.pocketCap()}`,
      supply: String(groups.supply.length),
      trade: this.money.short(inv.pouchValue()),
      key: String(groups.key.length),
    };
    const current = TABS.includes(tab) ? tab : 'pocket';
    const view = {
      title: this.word('bag'),
      purse: this.#purse(),
      tab: current,
      tabs: TABS.map((id) => ({ id, label: this.word(TAB_WORD[id]), count: counts[id], icon: tabIcon(id) })),
      note: NOTE_WORD[current] && (current === 'pocket' || groups[current].length) ? this.word(NOTE_WORD[current]) : '',
      empty: groups[current].length ? '' : this.word(EMPTY_WORD[current]),
      rows: [],
      pouch: null,
    };
    if (current === 'trade') {
      if (groups.trade.length) view.pouch = this.#pouch(groups.trade, tabIcon('trade'));
    } else {
      view.rows = groups[current].map((entry) => this.#row(entry, close));
    }
    return view;
  }

  #purse() {
    const looks = this.#options.coinLooks || [];
    const units = this.book.money.units;
    const shown = this.money.shownUnits();
    const parts = this.money.parts(this.money.get());
    return {
      label: this.word('purse'),
      coins: parts.filter((part) => shown.includes(part.unit)).map((part) => ({
        n: part.n,
        word: this.money.word(part.unit),
        look: looks[units.indexOf(part.unit)] || null,
      })),
    };
  }

  #pouch(entries, icon) {
    return {
      icon,
      title: this.word('pouchTitle'),
      text: this.word('pouchWorth', { coins: this.money.format(this.inventory.pouchValue()) }),
      hint: this.word('pouchHint'),
      slots: entries.map((entry) => {
        const item = this.book.get(entry.id);
        const value = this.book.sellValue(entry.id);
        return {
          id: entry.id, n: entry.n, icon: this.iconUrl(entry.id), name: this.name(entry.id),
          value: this.money.short(value), desc: item.desc ? this.text(item.desc) : '',
          each: this.word('each', { coins: this.money.format(value) }),
        };
      }),
    };
  }

  #row(entry, close) {
    const game = this.#game;
    const id = entry.id;
    const item = this.book.get(id);
    const ctx = { item: id, kind: 'item' };
    const actions = [];
    for (const action of item.actions || []) {
      if (action.if != null && !test(game, action.if, ctx)) continue;
      const off = (action.off || []).find((rule) => test(game, rule.if, ctx));
      actions.push({
        label: this.text(action.label), desc: off ? this.text(off.text) : this.text(action.desc || ''), off: !!off,
        run: () => {
          close();
          run(game, action.then, ctx).then(() => this.save());
        },
      });
    }
    const putBack = this.#putBack(id);
    if (putBack) actions.push(putBack);
    const tag = actions.length && !(actions.length === 1 && putBack) ? '' : (item.tag ? this.text(item.tag) : this.word('inUse'));
    if (!this.book.isKey(id) && !putBack) {
      const held = this.inventory.holdsBack(id);
      actions.push({ label: this.word('drop'), desc: held ? this.word('dropHeld') : '', off: held, drop: true, sure: this.word('dropSure'), keep: true,
        run: () => this.#drop(id, 'dropped') });
    }
    return {
      id, n: entry.n, icon: this.iconUrl(id), name: this.name(id), tag,
      desc: this.#useText(id),
      actions,
    };
  }

  /* a thing that lies on this map when it is not carried can be put back where it lay */
  #spotOf(id) {
    return this.book.pickups.find((spot) => spot.item === id) || null;
  }

  #putBack(id) {
    const spot = this.#spotOf(id);
    const pickup = this.book.pickup;
    if (!spot || !this.book.fillsPocket(id) || spot.map !== this.worldMapId() || !pickup.putBack) return null;
    if (spot.active != null && !test(this.#game, spot.active, { item: id })) return null;
    const held = this.inventory.holdsBack(id);
    return {
      label: this.text(pickup.putBack), desc: held ? this.word('putBackHeld') : this.text(pickup.putBackDesc || ''), off: held, keep: true,
      run: () => this.#drop(id, 'putBackDone'),
    };
  }

  #drop(id, how) {
    if (this.inventory.holdsBack(id)) {
      this.#toast(this.text(this.book.pickup.bagFull || ''));
      return;
    }
    if (!this.inventory.remove(id, 1)) return;
    const pickup = this.book.pickup;
    const key = how === 'putBackDone' ? pickup.putBackDone : this.#spotOf(id) ? pickup.sentHome : pickup.dropped;
    this.#sound('confirm');
    this.#toast(this.text(key || '{item}', { item: this.name(id) }));
    this.save();
  }

  /* ---------- shops ---------- */

  shopView(shopId) {
    const game = this.#game;
    const shop = this.book.shop(shopId);
    if (!shop) return null;
    const flow = this.book.flow(shop);
    const keeper = this.book.people[shop.keeper] || null;
    const t = (key, params) => (flow[key] ? this.text(flow[key], params) : '');
    const coins = (n) => this.money.format(n);
    const ctx = { shop: shop.id };
    const goods = [];
    for (const good of this.book.goods(shop.goods)) {
      if (!this.book.get(good.item)) continue;
      if (good.if != null && !test(game, good.if, ctx)) continue;
      if (good.hideOwned && this.inventory.has(good.item)) continue;
      const price = this.#price(good);
      const can = this.money.can(price);
      goods.push({
        item: good.item, icon: this.iconUrl(good.item), name: this.name(good.item), price: coins(price),
        short: can ? '' : this.word('shopShort'), can, desc: this.#useText(good.item),
        buy: () => {
          if (!this.money.can(price)) return t('tooDear', { coins: coins(price) });
          this.money.spend(price);
          this.inventory.add(good.item, 1);
          this.#sound('confirm');
          this.#toast(t('got', { item: this.name(good.item), coins: coins(price) }));
          this.save();
          return good.tip ? this.text(good.tip) : t('good', { item: this.name(good.item), coins: coins(price) });
        },
      });
    }
    /* a shop may pay more (or less) for the trade pouch than the book's sell-back value: content `sellRate` */
    const rate = Number(shop.sellRate) > 0 ? Number(shop.sellRate) : 1;
    const pouch = Math.round(this.inventory.pouchValue() * rate);
    return {
      id: shop.id,
      title: keeper ? this.text(keeper.name) : this.word('shopTitle'),
      look: keeper ? keeper.look : null,
      greet: t('greet', { coins: coins(this.money.get()) }),
      purse: this.#purse(),
      buyLabel: t('buy'),
      goods,
      words: { buy: this.word('shopBuy'), pick: this.word('shopPick') },
      sell: {
        label: this.word('shopSell'),
        icon: this.#tabIcon('trade'),
        name: this.word('pouchTitle'),
        worth: coins(pouch),
        desc: pouch ? this.word('shopPouchWorth', { coins: coins(pouch) }) : t('emptyPouch'),
        value: pouch,
        run: () => {
          const value = Math.round(this.inventory.sellPouch() * rate);
          if (!value) return t('emptyPouch');
          this.money.add(value);
          this.#sound('confirm');
          this.#toast(this.text(this.book.money.toastAdd || '+{coins}', { coins: coins(value), why: this.text(this.book.money.sold || '') }).trim());
          this.save();
          return t('sold');
        },
      },
      leave: this.word('shopLeave'),
      browse: t('browse'),
    };
  }

  #tabIcon(kind) {
    const icons = this.#options.tabIcons || {};
    const name = icons[kind] || { pocket: 'backpack', supply: 'heart', trade: 'backpack', key: 'star' }[kind];
    return /^data:|\//.test(name) ? name : this.#game.art.iconUrl(name);
  }

  /* what a thing does, as the bag says it */
  #useText(id) {
    const item = this.book.get(id);
    if (!item) return '';
    return item.use ? this.text(item.use) : item.desc ? this.text(item.desc) : '';
  }

  #price(good) {
    const p = good.price;
    if (typeof p === 'number') return Math.max(0, Math.floor(p));
    if (p && typeof p.price === 'string') return this.book.price(p.price);
    return this.book.price(good.item);
  }
}
