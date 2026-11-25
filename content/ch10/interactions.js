/*
 * ch10/interactions.js
 * Job: chapter 10 prop handlers: the rest landing of the Athenaeum Stair, Attendant Odile's ramen cart and her
 * spare cot (the rest before the Council and before Vael; ramen and the cot are free), and the bench by the
 * Athenaeum hall's entry (a rest that heals the party and fills the wand, any time).
 */

export default {
  ramen_cart: [{ map: 'athenaeum_stair', then: [{ run: 'ch10.svc.landing' }] }],
  landing_cot: [{ map: 'athenaeum_stair', then: [{ run: 'ch10.svc.bed' }] }],
  /* a bench by the hall's entry: a rest before each Council duel and before Vael */
  bench: [{ map: 'athenaeum', then: [{ run: 'ch10.svc.hallbench' }] }]
};
