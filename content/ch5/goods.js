/*
 * ch5/goods.js
 * Job: the goods list of Mags's shop in Coilhaven (schema section 10): the usual goods at city prices, so herbs
 * and snacks are worth planning for before the gauntlet. The saddle shows once the lead has grown twice.
 */

export default {
  coilhaven: [
    { item: 'herb', price: 5, tip: 'shared.shop.tip.herb' },
    { item: 'spirit_snack', price: 12, tip: 'shared.shop.tip.spirit_snack' },
    { item: 'tide_pearl', price: 20, tip: 'shared.shop.tip.tide_pearl' },
    { item: 'ember_dust', price: 20, tip: 'shared.shop.tip.ember_dust' },
    { item: 'charm', price: 30, hideOwned: true, tip: 'shared.shop.tip.charm' },
    { item: 'blue_backpack', price: 120, hideOwned: true, tip: 'shared.shop.tip.blue_backpack' },
    { item: 'saddle', price: 120, hideOwned: true, if: { ext: 'lead', stage: { gte: 3 } }, tip: 'shared.shop.tip.saddle' }
  ]
};
