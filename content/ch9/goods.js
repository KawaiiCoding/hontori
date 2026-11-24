/*
 * ch9/goods.js
 * Job: the goods list of Fennick's shop in Goldmere, the best shop of the game (schema section 10): everything at
 * capital prices, and the Sun Crystal for 3 gold (two more mana for good). The saddle shows once the lead has
 * grown twice.
 */

export default {
  goldmere: [
    { item: 'herb', price: 5, tip: 'shared.shop.tip.herb' },
    { item: 'spirit_snack', price: 12, tip: 'shared.shop.tip.spirit_snack' },
    { item: 'ember_dust', price: 20, tip: 'shared.shop.tip.ember_dust' },
    { item: 'tide_pearl', price: 20, tip: 'shared.shop.tip.tide_pearl' },
    { item: 'charm', price: 30, hideOwned: true, tip: 'shared.shop.tip.charm' },
    { item: 'blue_backpack', price: 120, hideOwned: true, tip: 'shared.shop.tip.blue_backpack' },
    { item: 'saddle', price: 120, hideOwned: true, if: { ext: 'lead', stage: { gte: 3 } }, tip: 'shared.shop.tip.saddle' },
    { item: 'sun_crystal', price: 300, hideOwned: true, tip: 'ch9.shop.tip.sun_crystal' }
  ]
};
