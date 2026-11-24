/*
 * ch9/maps/links.js
 * Job: the parts of the chapter 9 maps that wait for the story. Duskmere's east lane already leads to the Golden Gate
 * (content/ch8/maps/duskmere.js). states: what stands in the way until a condition holds (game/maps/index.js).
 */

export default {
  links: [],
  states: [
    /* the Golden Gate stays shut until the seven rings are shown */
    {
      map: 'golden_gate',
      until: 'c9:gate',
      props: [{ type: 'golden_gate', x: 19, y: 9 }],
      closes: ['goldmere']
    }
  ]
};
