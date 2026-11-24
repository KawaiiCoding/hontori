/*
 * ch9/interactions.js
 * Job: chapter 9 prop handlers: the Gilded Spoon tavern (ramen and the guest bed, at capital prices), Fennick's
 * counter, and the benches and guest bed of Halo Court (the rest before the tournament; refused while a
 * tournament run is open).
 */

export default {
  ramen_pot: [{ map: 'goldmere_tavern', then: [{ run: 'ch9.svc.ramen' }] }],
  tavern_counter: [{ map: 'goldmere_tavern', then: [{ run: 'ch9.svc.ramen' }] }],
  guest_bed: [{ map: 'goldmere_tavern', then: [{ run: 'ch9.svc.guestbed' }] }],
  shop_counter: [{ map: 'goldmere_shop', then: [{ shop: 'goldmere' }] }],
  bed: [
    { map: 'goldmere_tavern', then: [{ run: 'ch9.svc.guestbed' }] },
    { map: 'halo_court', then: [{ run: 'ch9.svc.bench' }] }
  ],
  bench: [{ map: 'halo_court', then: [{ run: 'ch9.svc.bench' }] }]
};
