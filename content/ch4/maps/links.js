/*
 * ch4/maps/links.js
 * Job: where the chapter 4 maps join the older ones, and the parts of a map that wait for the story.
 * links: added to a map for good. states: what stands in the way until a condition holds (game/maps/index.js).
 */

export default {
  links: [
    /* Kitewick's ferry jetty (west of the market deck, content/ch3/maps/kitewick.js) is where the ferry is boarded: the
       story turns a step onto these tiles into the ride (content/ch4/events.js) */
    {
      map: 'kitewick',
      doors: [{ x: 10, y: 26, to: 'ferry', tx: 12, ty: 14, dir: 0 }, { x: 11, y: 26, to: 'ferry', tx: 13, ty: 14, dir: 0 }],
      labels: [{ x: 10, y: 24, name: 'ch4.map.kitewick.label.ferry' }]
    }
  ],
  states: [
    /* the ferry lies at Kitewick's jetty once it has come in */
    {
      map: 'kitewick',
      until: { not: 'c4:open' },
      props: [{ type: 'boat_hull_bow', x: 12, y: 26 }, { type: 'boat_hull_cabin', x: 14, y: 26 }, { type: 'boat_hull_stern', x: 16, y: 26 }]
    },
    /* the drowned bell lies at the foot of the Sunken Stair until it is raised; then it hangs before Deepbell Hall */
    { map: 'sunken_stair', until: 'c4:bell', props: [{ type: 'spirit_bell', x: 14, y: 38 }] },
    { map: 'tidewell', until: { not: 'c4:bell' }, props: [{ type: 'spirit_bell_raised', x: 61, y: 25 }] },
    /* the causeway to Deepbell Hall lies under the tide until the bell is raised */
    {
      map: 'tidewell',
      until: 'c4:bell',
      tiles: [[50, 23, 'w'], [50, 24, 'w'], [51, 23, 'w'], [51, 24, 'w'], [52, 23, 'w'], [52, 24, 'w'], [53, 23, 'w'], [53, 24, 'w'], [54, 23, 'w'], [54, 24, 'w']],
      props: [{ type: 'slide_sign', x: 48, y: 22 }],
      closes: ['deepbell_hall']
    },
    /* the coast road north is fenced off until the way to Coilhaven is open */
    {
      map: 'tidewell',
      until: 'ch5:open',
      tiles: [[28, 2, 'g'], [29, 2, 'g']],
      props: [{ type: 'fence_h', x: 28, y: 2 }, { type: 'fence_h', x: 29, y: 2 }, { type: 'slide_sign', x: 30, y: 3 }],
      closes: ['coast_road']
    }
  ]
};
