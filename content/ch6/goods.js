/*
 * ch6/goods.js
 * Job: the goods list of Hobb's shop in Stonehollow (schema section 10): mountain prices, a little cheaper than
 * Coilhaven, and the three things a cave town sells: Lantern Oil, a Miner's Rope and Dugsworth Treats.
 * The oil shows only to a kid who carries the Lantern, so nobody pays for oil with nothing to burn it in.
 */

export default {
  stonehollow: [
    { item: 'lantern_oil', price: 25, hideOwned: true, if: { has: 'lantern' }, tip: 'ch6.shop.tip.lantern_oil' },
    { item: 'miner_rope', price: 40, hideOwned: true, tip: 'ch6.shop.tip.miner_rope' },
    { item: 'dug_treat', price: 10, tip: 'ch6.shop.tip.dug_treat' },
    { item: 'herb', price: 4, tip: 'shared.shop.tip.herb' },
    { item: 'spirit_snack', price: 10, tip: 'shared.shop.tip.spirit_snack' },
    { item: 'tide_pearl', price: 18, tip: 'shared.shop.tip.tide_pearl' },
    { item: 'ember_dust', price: 18, tip: 'shared.shop.tip.ember_dust' },
    { item: 'charm', price: 30, hideOwned: true, tip: 'shared.shop.tip.charm' },
    { item: 'blue_backpack', price: 100, hideOwned: true, tip: 'shared.shop.tip.blue_backpack' },
    { item: 'saddle', price: 100, hideOwned: true, if: { ext: 'lead', stage: { gte: 3 } }, tip: 'shared.shop.tip.saddle' }
  ]
};
