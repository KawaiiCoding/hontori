/*
 * ItemBook.js  (engine: items)
 * Job: everything the content says about items, money and shops, gathered once from the loaded
 * content folders (content/schema.md sections 1, 5 and 10). Pure data access: no state, no DOM.
 *
 * Public API:
 *   new ItemBook(folders)     folders: the content folders in load order (shared first)
 *   items                     { id: item }  every item; one id means one thing
 *   money                     { units, prices, sellBack, ... }  the merged money table
 *   pickup                    the words of the pickup flow (pockets0: the pockets everyone has)
 *   pickups                   [{ active, item, map, x, y, ... }]  things that lie in the world
 *   shops                     [{ id, keeper, map, goods, ... }]
 *   people                    { id: person }  for a shopkeeper's name and look
 *   text                      { id: string }  every text table merged (English)
 *   get(id)                   the item, or null
 *   kindOf(id)                'pocket' | 'supply' | 'trade' | 'key'
 *   isKey(id), fillsPocket(id), hasTag(id, tag), effect(id)
 *   price(id)                 the shop price in the smallest unit (0 when not sold)
 *   sellValue(id)             what one sells back for
 *   shop(id), shopOfKeeper(personId), goods(listName), flow(shop)
 */

const KINDS = ['pocket', 'supply', 'trade', 'key'];

export class ItemBook {
  items = {};
  money = { units: [{ per: 1, name: '{n}' }], prices: {}, sellBack: { fraction: 1 / 3, min: 1 } };
  pickup = { pockets0: 5 };
  pickups = [];
  shops = [];
  people = {};
  text = {};
  #goods = {};
  #flow = {};

  constructor(folders = []) {
    for (const folder of folders) {
      if (!folder || typeof folder !== 'object') continue;
      Object.assign(this.items, folder.items || {});
      if (folder.money) this.money = { ...this.money, ...folder.money, prices: { ...this.money.prices, ...(folder.money.prices || {}) } };
      if (folder.pickup) this.pickup = { ...this.pickup, ...folder.pickup };
      if (folder.pickups && Array.isArray(folder.pickups.list)) {
        for (const spot of folder.pickups.list) this.pickups.push({ active: folder.pickups.active, ...spot });
      }
      if (Array.isArray(folder.shops)) this.shops.push(...folder.shops);
      if (Array.isArray(folder.people)) for (const person of folder.people) this.people[person.id] = person;
      Object.assign(this.#goods, folder.goods || {});
      Object.assign(this.#flow, folder.shopFlow || {});
      Object.assign(this.text, folder.text || {});
    }
    this.money.units = [...this.money.units].sort((a, b) => b.per - a.per);
  }

  get(id) {
    return (typeof id === 'string' && this.items[id]) || null;
  }

  kindOf(id) {
    const kind = this.get(id)?.kind;
    return KINDS.includes(kind) ? kind : 'supply';
  }

  isKey(id) {
    return this.kindOf(id) === 'key';
  }

  /* only items marked pocket: true take one of the limited pockets */
  fillsPocket(id) {
    return this.get(id)?.pocket === true;
  }

  hasTag(id, tag) {
    const tags = this.get(id)?.tags;
    return Array.isArray(tags) && tags.includes(tag);
  }

  effect(id) {
    return this.get(id)?.effect || null;
  }

  price(id) {
    return Math.max(0, Math.floor(Number(this.money.prices[id]) || 0));
  }

  sellValue(id) {
    const item = this.get(id);
    if (!item) return 0;
    if (item.kind === 'trade') return Math.max(0, Math.floor(Number(item.value) || 0));
    const price = this.price(id);
    if (!price) return 0;
    const { fraction = 1 / 3, min = 1 } = this.money.sellBack || {};
    return Math.max(min, Math.floor(price * fraction));
  }

  shop(id) {
    return this.shops.find((shop) => shop.id === id) || null;
  }

  shopOfKeeper(personId) {
    return this.shops.find((shop) => shop.keeper === personId) || null;
  }

  goods(listName) {
    const list = this.#goods[listName];
    return Array.isArray(list) ? list : [];
  }

  /* the shared flow words with a shop's own words over them */
  flow(shop) {
    return { ...this.#flow, ...(shop || {}) };
  }
}
