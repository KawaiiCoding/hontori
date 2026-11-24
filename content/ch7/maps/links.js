/*
 * ch7/maps/links.js
 * Job: the parts of the chapter 7 maps that wait for the story. Stonehollow's east road already leads onto the Ash Road
 * (content/ch6/maps/stonehollow.js), so no link is added. states: what stands in the way until a condition holds (game/maps/index.js).
 * The letter "l" of both maps is the tile "lava" (src/tiles_cave.js): solid, and not water, so nothing is fished from it.
 */

export default {
  links: [],
  states: [
    /* the lava stream runs across the Ash Road until Warden Harrow lays the stone bridge */
    {
      map: 'ash_road',
      until: 'c6:bridge',
      tiles: [[19, 14, 'l'], [20, 14, 'l'], [21, 14, 'l'], [19, 15, 'l'], [20, 15, 'l'], [21, 15, 'l']],
      props: [{ type: 'slide_sign', x: 17, y: 13 }]
    },
    /* the moat of the Ember Crucible is open lava until the crossing is cooled: the map itself holds "cooled_lava" there (letter k) */
    {
      map: 'cinderreach',
      until: 'c7:cooled',
      tiles: [[29, 12, 'l'], [30, 12, 'l'], [29, 13, 'l'], [30, 13, 'l']]
    }
  ]
};
