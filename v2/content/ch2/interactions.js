/*
 * ch2/interactions.js
 * Job: chapter 2 prop handlers: the sprout pots follow the trial (src/hall_props.js); Pell's counter.
 */

export default {
  sprout_pot: [
    { if: 'c2:sprouts', then: [{ say: 'ch2.prop.1', who: 'kid' }] },
    { then: [{ say: 'ch2.prop.2', who: 'kid' }] }
  ],
  shop_counter: [{ map: 'moss_house2', then: [{ shop: 'pell' }] }]
};
