/*
 * ch8/maps/links.js
 * Job: where the chapter 8 maps join the older ones: the Mothwood exit in Cinderreach's south wall, which opens on
 * c7:complete. It lives here so that Cinderreach has no door to the Mothwood before chapter 8 is in the game.
 */

export default {
  links: [
    /* the Mothwood exit (chapter 8): an opening in Cinderreach's south wall; the wall pieces become the state below */
    {
      map: 'cinderreach',
      without: [{ type: 'stone_wall_h', x: 29, y: 42 }, { type: 'stone_wall_h', x: 30, y: 42 }, { type: 'rock', x: 30, y: 43 }],
      doors: [{ x: 29, y: 43, to: 'mothwood', tx: 21, ty: 1, dir: 0 }, { x: 30, y: 43, to: 'mothwood', tx: 22, ty: 1, dir: 0 }],
      labels: [{ x: 29, y: 42, name: 'ch8.map.cinderreach.label.south' }]
    }
  ],
  states: [
    /* the south wall stays whole until chapter 7 is complete */
    {
      map: 'cinderreach',
      until: 'c7:complete',
      props: [{ type: 'stone_wall_h', x: 29, y: 42 }, { type: 'stone_wall_h', x: 30, y: 42 }],
      closes: ['mothwood']
    }
  ]
};
