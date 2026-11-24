/*
 * ch7/interactions.js
 * Job: chapter 7 prop handlers: the sign at the lava stream on the Ash Road (until Harrow's bridge), the
 * Cinderreach tavern (ramen and the guest bed, at the usual prices), Fenna's counter, and the benches and the
 * guest bed of the Ember Crucible (the rest before the ring, once per visit).
 */

export default {
  slide_sign: [{ map: 'ash_road', if: { not: 'c6:bridge' }, then: [{ run: 'ch7.roadshut' }] }],
  ramen_pot: [{ map: 'cinderreach_tavern', then: [{ run: 'ch7.svc.ramen' }] }],
  tavern_counter: [{ map: 'cinderreach_tavern', then: [{ run: 'ch7.svc.ramen' }] }],
  guest_bed: [{ map: 'cinderreach_tavern', then: [{ run: 'ch7.svc.guestbed' }] }],
  shop_counter: [{ map: 'cinderreach_shop', then: [{ shop: 'cinderreach' }] }],
  bench: [{ map: 'ember_crucible', then: [{ run: 'ch7.svc.bench' }] }],
  bed: [
    { map: 'cinderreach_tavern', then: [{ run: 'ch7.svc.guestbed' }] },
    { map: 'ember_crucible', then: [{ run: 'ch7.svc.bench' }] }
  ]
};
