/*
 * shared/money.js
 * Job: coins and prices. Coins are counted in copper: 10 copper = 1 silver, 10 silver = 1 gold.
 * A shop item sells back for a third of its price (at least 1); trade goods sell for their item value.
 */

export default {
  units: [
    { per: 100, name: 'shared.money.gold' },
    { per: 10, name: 'shared.money.silver' },
    { per: 1, name: 'shared.money.copper' }
  ],
  prices: {
    herb: 3,
    ember_dust: 15,
    tide_pearl: 15,
    spirit_snack: 8,
    charm: 20,
    ramen: 5,
    guest_bed: 10,
    blue_backpack: 100,
    saddle: 100
  },
  sellBack: { fraction: 0.3333333333333333, min: 1 },
  purse: { base: 5, perLevel: 2, once: true, why: 'shared.money.purse' },
  wildLoss: { fraction: 0.1, min: 1, max: 20, why: 'shared.money.lost' },
  toastAdd: 'shared.money.add',
  toastSpend: 'shared.money.spend',
  sold: 'shared.money.sold',
  helper: { id: 'coins', title: 'shared.money.helper.title', text: 'shared.money.helper.text', icon: 'coin' }
};
