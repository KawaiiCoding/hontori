/*
 * ch10/goods.js
 * Job: the goods of the Emberbrook fair (schema section 10). Coins buy keepsakes that are seen and used (item
 * effect keepsake, ./items.js): Gil's hat for the lead hontori, Wynn's picture of the Great V and Bex's window
 * lantern for the home, and Moll's jar of fair sweets for the kitchen; Moll also sells the usual supplies at
 * village prices. Each keepsake is bought once (hideOwned).
 */

export default {
  fair_hats: [{ item: 'fair_hat', price: 80, hideOwned: true, tip: 'ch10.shop.tip.hat' }],
  fair_pictures: [{ item: 'fair_frame', price: 150, hideOwned: true, tip: 'ch10.shop.tip.frame' }],
  fair_lanterns: [{ item: 'fair_lantern', price: 120, hideOwned: true, tip: 'ch10.shop.tip.lantern' }],
  fair_sweets: [
    { item: 'fair_sweets', price: 40, hideOwned: true, tip: 'ch10.shop.tip.sweets' },
    { item: 'herb', price: 4, tip: 'shared.shop.tip.herb' },
    { item: 'spirit_snack', price: 10, tip: 'shared.shop.tip.spirit_snack' }
  ]
};
