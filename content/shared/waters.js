/*
 * shared/waters.js
 * Job: fishing waters (src/fishing.js WATERS): per map the water's name, its fish (item, weight range in kg,
 * night only) and the kinds that bite; rules are the cast odds and the contest.
 */

export default {
  village: {
    name: 'shared.water.village',
    fish: [
      { item: 'minnow', kg: [0.1, 0.3] },
      { item: 'carp', kg: [0.6, 2.2] },
      { item: 'moonfin', kg: [0.4, 1.1], night: true }
    ],
    kinds: ['water', 'frog']
  },
  whisperwood: {
    name: 'shared.water.whisperwood',
    fish: [
      { item: 'trout', kg: [0.4, 1.6] },
      { item: 'perch', kg: [0.2, 0.9] },
      { item: 'glowgill', kg: [0.3, 0.8], night: true }
    ],
    kinds: ['frog', 'water']
  },
  mossgrove: {
    name: 'shared.water.mossgrove',
    fish: [
      { item: 'koi', kg: [0.8, 3] },
      { item: 'bass', kg: [0.7, 2.4] },
      { item: 'starkoi', kg: [1, 3.5], night: true }
    ],
    kinds: ['frog', 'water']
  },
  sea: {
    name: 'shared.water.sea',
    fish: [
      { item: 'mackerel', kg: [0.4, 1.4] },
      { item: 'snapper', kg: [1, 4] },
      { item: 'tidefin', kg: [2, 7], night: true }
    ],
    kinds: ['water', 'frog', 'crab']
  },
  default: 'village',
  rules: {
    hontori: 0.28,
    hontoriRain: 0.4,
    hontoriContest: 0,
    nothing: 0.12,
    bigAtNight: 0.15,
    manaCost: 1,
    contestCasts: 3,
    contestPrize: 20,
    rivalFish: 1
  }
};
