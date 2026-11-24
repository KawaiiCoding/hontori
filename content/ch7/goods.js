/*
 * ch7/goods.js
 * Job: the goods list of Fenna's shop in Cinderreach (schema section 10). Ember Dust is cheap here (the town
 * sweeps it off its own roofs); Tide Pearls are dear, since water is what the town lacks. The heat cloak is what
 * lets the kid walk down into the Hearth Below. The saddle shows once the lead has grown twice.
 */

export default {
  cinderreach: [
    { item: 'herb', price: 3, tip: 'shared.shop.tip.herb' },
    { item: 'spirit_snack', price: 8, tip: 'shared.shop.tip.spirit_snack' },
    { item: 'ember_dust', price: 5, tip: 'shared.shop.tip.ember_dust' },
    { item: 'tide_pearl', price: 20, tip: 'shared.shop.tip.tide_pearl' },
    { item: 'heat_cloak', price: 30, hideOwned: true, tip: 'ch7.shop.tip.heat_cloak' },
    { item: 'charm', price: 20, hideOwned: true, tip: 'shared.shop.tip.charm' },
    { item: 'blue_backpack', price: 100, hideOwned: true, tip: 'shared.shop.tip.blue_backpack' },
    { item: 'saddle', price: 100, hideOwned: true, if: { ext: 'lead', stage: { gte: 3 } }, tip: 'shared.shop.tip.saddle' }
  ]
};
