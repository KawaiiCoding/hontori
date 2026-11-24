/*
 * ch8/goods.js
 * Job: the goods list of Tallow's shop in Duskmere (schema section 10): little to buy, the plain things a kid
 * needs. Tallow would rather trade for a favour (./scripts.js, ch8.svc.tallow), and buys finds from other
 * lands for more than anyone (the shop's sellRate, ./shops.js).
 */

export default {
  duskmere: [
    { item: 'herb', price: 5, tip: 'shared.shop.tip.herb' },
    { item: 'spirit_snack', price: 12, tip: 'shared.shop.tip.spirit_snack' },
    { item: 'lantern_oil', price: 25, hideOwned: true, if: { has: 'lantern' }, tip: 'ch6.shop.tip.lantern_oil' }
  ]
};
