/*
 * ch6/maps/links.js
 * Job: where the chapter 6 maps join the older ones, and the parts of a map that wait for the story.
 * links: added to a map for good. states: what stands in the way until a condition holds (game/maps/index.js).
 */

export default {
  links: [
    /* Coilhaven's north gate (content/ch5/maps/coilhaven.js) now leads onto the mountain road; its fence becomes the state below */
    {
      map: 'coilhaven',
      without: [{ type: 'fence_h', x: 31, y: 1 }, { type: 'fence_h', x: 32, y: 1 }],
      doors: [{ x: 31, y: 0, to: 'mountain_road', tx: 19, ty: 62, dir: 1 }, { x: 32, y: 0, to: 'mountain_road', tx: 20, ty: 62, dir: 1 }],
      labels: [{ x: 31, y: 1, name: 'ch6.map.coilhaven.label.north' }]
    }
  ],
  states: [
    /* the north gate stays fenced until chapter 5 is complete */
    {
      map: 'coilhaven',
      until: 'c5:complete',
      props: [{ type: 'fence_h', x: 31, y: 1 }, { type: 'fence_h', x: 32, y: 1 }],
      closes: ['mountain_road']
    }
  ]
};
