/*
 * ch1/interactions.js
 * Job: what chapter 1 adds to the shared prop handlers: The Steaming Bowl counters and its guest bed.
 */

export default {
  ramen_pot: [{ then: [{ run: 'ch1.svc.ramen' }] }],
  tavern_counter: [{ then: [{ run: 'ch1.svc.ramen' }] }],
  guest_bed: [{ then: [{ run: 'ch1.svc.guestbed' }] }],
  bed: [{ map: 'tavern', then: [{ run: 'ch1.svc.guestbed' }] }],
  shop_counter: [{ then: [{ shop: 'nettle' }] }]
};
