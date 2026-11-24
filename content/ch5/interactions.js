/*
 * ch5/interactions.js
 * Job: chapter 5 prop handlers: the sign at Tidewell's fenced north road, the Coilhaven tavern (ramen and the
 * guest bed, at city prices), Mags's counter, and the benches by the Storm Works door (the one rest before the
 * gauntlet; refused while a run is open).
 */

export default {
  /* only the sign at the north road (Tidewell has a second sign at the causeway, chapter 4) */
  slide_sign: [{ map: 'tidewell', if: { all: [{ not: 'ch5:open' }, { area: { map: 'tidewell', x: [26, 34], y: [1, 7] } }] }, then: [{ run: 'ch5.roadshut' }] }],
  ramen_pot: [{ map: 'coilhaven_tavern', then: [{ run: 'ch5.svc.ramen' }] }],
  tavern_counter: [{ map: 'coilhaven_tavern', then: [{ run: 'ch5.svc.ramen' }] }],
  guest_bed: [{ map: 'coilhaven_tavern', then: [{ run: 'ch5.svc.guestbed' }] }],
  bed: [{ map: 'coilhaven_tavern', then: [{ run: 'ch5.svc.guestbed' }] }],
  shop_counter: [{ map: 'coilhaven_shop', then: [{ shop: 'coilhaven' }] }],
  bench: [{ map: 'storm_works', then: [{ run: 'ch5.svc.worksbench' }] }]
};
