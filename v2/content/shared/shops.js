/*
 * shared/shops.js
 * Job: the goods list of the Packs and Potions kind of shop and the words of the shop flow (section 10).
 * The saddle is offered only while the lead hontori is at stage 3 or more and none is owned.
 */

export default {
  goods: {
    packs: [
      { item: 'herb', price: { price: 'herb' }, tip: 'shared.shop.tip.herb' },
      { item: 'ember_dust', price: { price: 'ember_dust' }, tip: 'shared.shop.tip.ember_dust' },
      { item: 'tide_pearl', price: { price: 'tide_pearl' }, tip: 'shared.shop.tip.tide_pearl' },
      { item: 'spirit_snack', price: { price: 'spirit_snack' }, tip: 'shared.shop.tip.spirit_snack' },
      { item: 'charm', price: { price: 'charm' }, hideOwned: true, tip: 'shared.shop.tip.charm' },
      {
        item: 'blue_backpack',
        price: { price: 'blue_backpack' },
        hideOwned: true,
        tip: 'shared.shop.tip.blue_backpack'
      },
      {
        item: 'saddle',
        price: { price: 'saddle' },
        hideOwned: true,
        if: { ext: 'lead', stage: { gte: 3 } },
        tip: 'shared.shop.tip.saddle'
      }
    ]
  },
  flow: {
    greet: 'shared.shop.greet',
    buy: 'shared.shop.buy',
    sell: 'shared.shop.sell',
    sellEmpty: 'shared.shop.sell.empty',
    nothingToday: 'shared.shop.none',
    emptyPouch: 'shared.shop.pouch.empty',
    sold: 'shared.shop.sold',
    browse: 'shared.shop.browse',
    good: 'shared.shop.good',
    notEnough: 'shared.shop.short.tag',
    nothing: 'shared.shop.nothing',
    takeTime: 'shared.shop.wait',
    tooDear: 'shared.shop.short',
    got: 'shared.shop.got'
  }
};
