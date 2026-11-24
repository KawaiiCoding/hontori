/*
 * ch4/goods.js
 * Job: the goods list of Saba's shop in Tidewell (schema section 10).
 */

export default {
  tidewell: [
    { item: 'herb', price: { price: 'herb' }, tip: 'shared.shop.tip.herb' },
    { item: 'tide_pearl', price: 9, tip: 'shared.shop.tip.tide_pearl' },
    { item: 'ember_dust', price: { price: 'ember_dust' }, tip: 'shared.shop.tip.ember_dust' },
    { item: 'spirit_snack', price: { price: 'spirit_snack' }, tip: 'shared.shop.tip.spirit_snack' },
    { item: 'night_hook', price: 30, hideOwned: true, if: { ext: 'spell', has: 'fish' }, tip: 'ch4.shop.tip.night_hook' },
    { item: 'charm', price: { price: 'charm' }, hideOwned: true, tip: 'shared.shop.tip.charm' },
    { item: 'saddle', price: { price: 'saddle' }, hideOwned: true, if: { ext: 'lead', stage: { gte: 3 } }, tip: 'shared.shop.tip.saddle' }
  ]
};
