/*
 * ch3/interactions.js
 * Job: chapter 3 prop handlers: the rockslide on the Mossgrove road, the sign at Kitewick's broken bridge, the Kitewick tavern (ramen and the guest bed)
 * and Tilla's counter.
 */

export default {
  rockslide: [{ map: 'mossgrove', if: { not: 'ch3:open' }, then: [{ run: 'ch3.slide' }] }],
  slide_sign: [{ map: 'kitewick', if: { not: 'c3:bridge' }, then: [{ run: 'ch3.bridge' }] }],
  bench: [{ map: 'gale_loft', then: [{ run: 'ch3.svc.loftbench' }] }],
  ramen_pot: [{ map: 'kitewick_tavern', then: [{ run: 'ch3.svc.ramen' }] }],
  tavern_counter: [{ map: 'kitewick_tavern', then: [{ run: 'ch3.svc.ramen' }] }],
  guest_bed: [{ map: 'kitewick_tavern', then: [{ run: 'ch3.svc.guestbed' }] }],
  bed: [{ map: 'kitewick_tavern', then: [{ run: 'ch3.svc.guestbed' }] }],
  shop_counter: [{ map: 'kitewick_shop', then: [{ shop: 'kitewick' }] }]
};
