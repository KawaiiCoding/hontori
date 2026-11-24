/*
 * ch4/interactions.js
 * Job: chapter 4 prop handlers: the sign at Tidewell's flooded causeway, the Salt Kettle tavern (ramen and the guest bed), Saba's counter, and the bench
 * in Deepbell Hall where the party rests once per visit before the duels.
 */

export default {
  ramen_pot: [{ map: 'tidewell_tavern', then: [{ run: 'ch4.svc.ramen' }] }],
  tavern_counter: [{ map: 'tidewell_tavern', then: [{ run: 'ch4.svc.ramen' }] }],
  guest_bed: [{ map: 'tidewell_tavern', then: [{ run: 'ch4.svc.guestbed' }] }],
  bed: [{ map: 'tidewell_tavern', then: [{ run: 'ch4.svc.guestbed' }] }],
  shop_counter: [{ map: 'tidewell_shop', then: [{ shop: 'tidewell' }] }],
  bench: [{ map: 'deepbell_hall', then: [{ run: 'ch4.svc.hallbench' }] }],
  /* only the sign at the causeway (the sign at the north road is chapter 5's) */
  slide_sign: [{ map: 'tidewell', if: { all: [{ not: 'c4:bell' }, { area: { map: 'tidewell', x: [44, 52], y: [19, 27] } }] }, then: [{ run: 'ch4.hall.closed' }] }]
};
