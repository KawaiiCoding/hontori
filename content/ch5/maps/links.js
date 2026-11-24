/*
 * ch5/maps/links.js
 * Job: where the chapter 5 maps join the older ones. Tidewell's north road already leads to the coast road
 * (content/ch4/maps/tidewell.js and the "ch5:open" state in content/ch4/maps/links.js), so no link is added here.
 * states: the lamp in the square holds its trapped spark until it is freed, and the rod beside the coil on
 * Sparkmoor lights once the power line is joined.
 */

export default {
  links: [],
  states: [
    { map: 'coilhaven', until: 'c5:spark', props: [{ type: 'lamp_jar', x: 28, y: 20 }] },
    { map: 'coilhaven', until: { not: 'c5:spark' }, props: [{ type: 'lamp_jar_open', x: 28, y: 20 }] },
    { map: 'sparkmoor', until: 'c5:circuit', props: [{ type: 'lightning_rod', x: 20, y: 15 }] },
    { map: 'sparkmoor', until: { not: 'c5:circuit' }, props: [{ type: 'lightning_rod_lit', x: 20, y: 15 }] }
  ]
};
