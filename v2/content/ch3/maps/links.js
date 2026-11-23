/*
 * ch3/maps/links.js
 * Job: where the chapter 3 maps join the older ones, and the parts of a map that wait for the story.
 * links: added to a map for good. states: what stands in the way until a condition holds (game/maps/index.js).
 */

export default {
  links: [
    /* Mossgrove's east lane now leaves the map; the heap of the old map is replaced by the state below */
    {
      map: 'mossgrove',
      without: [{ type: 'rockslide', x: 35, y: 14 }, { type: 'rockslide', x: 37, y: 14 }],
      doors: [{ x: 39, y: 15, to: 'whistling_pass', tx: 1, ty: 27, dir: 3 }, { x: 39, y: 16, to: 'whistling_pass', tx: 1, ty: 28, dir: 3 }]
    }
  ],
  states: [
    /* the rockslide lies across the lane until the road is open */
    {
      map: 'mossgrove',
      until: 'ch3:open',
      props: [{ type: 'rockslide', x: 34, y: 14 }, { type: 'rockslide', x: 36, y: 14 }],
      closes: ['whistling_pass']
    },
    /* the rope bridge toward Gale Loft has a gap until it is mended */
    {
      map: 'kitewick',
      until: 'c3:bridge',
      tiles: [[50, 19, 'w'], [51, 19, 'w'], [52, 19, 'w'], [50, 20, 'w'], [51, 20, 'w'], [52, 20, 'w']],
      props: [{ type: 'slide_sign', x: 50, y: 18 }],
      closes: ['gale_bridges']
    }
  ]
};
