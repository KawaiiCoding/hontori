/*
 * ch4/waters.js
 * Job: the fishing waters of chapter 4 (the format of shared/waters.js): the harbour and the stair are the sea,
 * the Saltmarsh is brackish reed water. Big fish come at night; the Night Hook helps with those.
 */

export default {
  tidewell: {
    name: 'shared.water.sea',
    fish: [
      { item: 'mackerel', kg: [0.4, 1.4] },
      { item: 'snapper', kg: [1, 4] },
      { item: 'tidefin', kg: [2, 7], night: true }
    ],
    kinds: ['seapup', 'brinetail', 'tidecrab', 'water']
  },
  saltmarsh: {
    name: 'ch4.water.saltmarsh',
    fish: [
      { item: 'perch', kg: [0.2, 0.9] },
      { item: 'bass', kg: [0.7, 2.4] },
      { item: 'glowgill', kg: [0.3, 0.8], night: true }
    ],
    kinds: ['marshwick', 'brinetail', 'frog']
  },
  sunken_stair: {
    name: 'shared.water.sea',
    fish: [
      { item: 'mackerel', kg: [0.4, 1.4] },
      { item: 'snapper', kg: [1, 4] },
      { item: 'tidefin', kg: [2, 7], night: true }
    ],
    kinds: ['driftjelly', 'coralet', 'inkling', 'bellfish']
  }
};
