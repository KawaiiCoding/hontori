/*
 * ch8/interactions.js
 * Job: chapter 8 prop handlers: the Duskmere tavern (ramen and the guest bed), Tallow's counter (the favour
 * trade), and the benches and guest bed of Hollow Moon (the rest before the ring duel).
 */

export default {
  ramen_pot: [{ map: 'duskmere_tavern', then: [{ run: 'ch8.svc.ramen' }] }],
  tavern_counter: [{ map: 'duskmere_tavern', then: [{ run: 'ch8.svc.ramen' }] }],
  guest_bed: [{ map: 'duskmere_tavern', then: [{ run: 'ch8.svc.guestbed' }] }],
  bed: [
    { map: 'duskmere_tavern', then: [{ run: 'ch8.svc.guestbed' }] },
    { map: 'hollow_moon', then: [{ run: 'ch8.svc.moonbench' }] }
  ],
  shop_counter: [{ map: 'duskmere_shop', then: [{ run: 'ch8.svc.tallow' }] }],
  bench: [{ map: 'hollow_moon', then: [{ run: 'ch8.svc.moonbench' }] }]
};
