/*
 * ch10/story.js
 * Job: the ending picture story (schema section 12, the opening's PictureStory and painter parts, see
 * game/features/storyArt.js). Six panels mirror the opening's seven, with colour coming back instead of going:
 * the veil lifts over the city; the sleepers go home over the hills by night; the child and the water hontori
 * under the fruit tree share an apple again; an old light hontori finds the lit window; Orlen Vael; and the
 * festival, shared once more. Panel 5 follows the mercy choice, so there are two stories that differ only there:
 * ch10_end_mercy (he sees his old spark beside him) and ch10_end_nomercy (it is still beside him, unseen).
 */

const LANTERNS = { part: 'lanterns', from: [-46, -36], to: [46, -36], n: 7, sag: 6 };
const SEAL = [0, -52];
const BASE = {
  size: [176, 120],
  scale: 4,
  panelMs: 2400,
  minMs: 600,
  skip: 'pro.story.skip',
  tap: 'pro.story.tap',
  tapLast: 'ch10.story.tap.last',
  sound: { panel: 'page', last: 'wand' }
};

/* 1. the grey green: the great V crosses the seal, its eye opens, colour spreads back (opening panel 7) */
const LIFT = {
  text: 'ch10.story.1',
  time: 19,
  ms: 2800,
  push: [1, 1.05],
  scene: {
    set: 'festival',
    light: 'dusk',
    veil: { x: SEAL[0], y: SEAL[1], at: [0.6, 1.7], lift: true },
    actors: [
      { person: 'girl', x: -70, y: 22, dir: 3, seed: 0.4 },
      { spirit: 'water', x: -54, y: 23, dir: 2, unseen: 0.4, hop: [1.05, 2.4, 4, 4] },
      { person: 'boy', x: 70, y: 22, dir: 2, seed: 0.6 },
      { spirit: 'sparkmouse', x: 54, y: 23, dir: 3, unseen: 0.4, hop: [1.1, 2.45, 4, 4] },
      { person: 'kid', x: -12, y: 25, dir: 1, scale: 2, clear: true },
      { spirit: 'hontori', x: 13, y: 25, dir: 1, scale: 2, glow: true, light: 30 }
    ],
    extras: [
      LANTERNS,
      { part: 'seal', x: SEAL[0], y: SEAL[1], open: [0.52, 0.68], gone: [0.86, 1.25] },
      { part: 'sigil', from: [13, 2], points: [[-34, -78], [0, -40], [34, -78]], rise: [0.04, 0.22], at: [0.22, 0.56] }
    ]
  }
};

/* 2. night: the sleepers from the jars run home along the hill, as the fox once did (opening panel 5) */
const HOME = {
  text: 'ch10.story.2',
  time: 23,
  ms: 2600,
  push: [1, 1.04],
  scene: {
    set: 'nightTown',
    light: 'night',
    cam: { from: [-20], to: [20] },
    actors: [
      { spirit: 'cinderkit', x: -110, y: 14, dir: 3, glow: true, light: 20, walk: { to: 40, at: [0, 0.95] } },
      { spirit: 'flarefox', x: -128, y: 16, dir: 3, glow: true, light: 20, walk: { to: 22, at: [0.05, 1] } },
      { spirit: 'emberfinch', x: -146, y: 12, dir: 3, glow: true, light: 20, walk: { to: 4, at: [0.1, 1] } },
      { spirit: 'glimmerbee', x: -164, y: 15, dir: 3, glow: true, light: 20, walk: { to: -14, at: [0.15, 1] } }
    ],
    extras: [{ part: 'stars' }, { part: 'moon', x: 44 }, { part: 'smoke' }]
  }
};

/* 3. the fruit tree: grey at first, then gold; the child comes back and shares the apple (opening 1 and 4) */
const APPLE = {
  text: 'ch10.story.3',
  time: 16,
  ms: 2200,
  push: [1.04, 1],
  scene: {
    set: 'orchard',
    zoom: 2,
    light: 'gold',
    haze: true,
    veil: { x: 13, y: 0, at: [0, 0.6], lift: true },
    cam: { from: [4], to: [-4] },
    actors: [
      { person: 'girl', x: -60, y: 9, dir: 3, seed: 0.4, walk: { to: -13, at: [0.1, 0.55] } },
      { spirit: 'water', x: 13, y: 10, dir: 2, sit: true, hop: [0.62, 0.95, 2, 4] }
    ],
    extras: [{ part: 'apple', from: [-6, -2], to: [4, 5], arc: 8, at: [0.66, 0.9] }]
  }
};

/* 4. the lit window: an old light hontori comes out of the night to it (opening panel 6) */
const WINDOW = {
  text: 'ch10.story.4',
  time: 23,
  ms: 1900,
  push: [1, 1.08],
  scene: {
    set: 'window',
    horizon: [0.62, 0.68],
    light: 'night',
    cam: { from: [5], to: [0] },
    actors: [{ spirit: 'firefly', x: 74, y: 22, dir: 2, scale: 2, glow: true, light: 40, walk: { to: 0, at: [0, 0.75] }, turn: [[0.77, 1]] }],
    extras: [{ part: 'kidAtWindow', look: 'kid' }]
  }
};

/* 5. Orlen Vael under the fruit tree with the little spark from his sleeve */
const VAEL_SEES = {
  text: 'ch10.story.5.mercy',
  time: 17,
  ms: 2200,
  push: [1, 1.05],
  scene: {
    set: 'orchard',
    zoom: 2,
    light: 'gold',
    haze: true,
    veil: { x: 10, y: 0, at: [0.1, 0.7], lift: true },
    actors: [
      { person: 'orlen', x: -12, y: 9, dir: 3, seed: 0.5 },
      { spirit: 'lampwisp', x: 12, y: 10, dir: 2, glow: true, light: 18, hop: [0.75, 1.0, 1, 3] }
    ]
  }
};
const VAEL_CLOSED = {
  text: 'ch10.story.5.nomercy',
  time: 17,
  ms: 2200,
  push: [1.04, 1],
  scene: {
    set: 'orchard',
    zoom: 2,
    light: 'grey',
    actors: [
      { person: 'orlen', x: -12, y: 9, dir: 3, seed: 0.5, clear: true },
      { spirit: 'lampwisp', x: 12, y: 10, dir: 2, unseen: 0.5, sit: true }
    ]
  }
};

/* 6. the festival, shared again (opening panel 2), with the kid and the fox in the middle */
const FESTIVAL = {
  text: 'ch10.story.6',
  gold: true,
  time: 19,
  ms: 2600,
  push: [1, 1.04],
  scene: {
    set: 'festival',
    light: 'dusk',
    cam: { from: [-6], to: [6] },
    actors: [
      { person: 'girl', x: -70, y: 22, dir: 3, seed: 0.4, hop: [0, 3.2, 7, 3] },
      { spirit: 'water', x: -54, y: 23, dir: 2, hop: [0.05, 3.25, 7, 4] },
      { person: 'boy', x: 70, y: 22, dir: 2, seed: 0.6, hop: [0.1, 3.3, 7, 3] },
      { spirit: 'sparkmouse', x: 54, y: 23, dir: 3, hop: [0.12, 3.32, 7, 4] },
      { person: 'farmer', x: -106, y: 16, dir: 3, seed: 0.2, wide: true },
      { spirit: 'grass', x: -90, y: 17, dir: 2, wide: true, hop: [0.19, 3.39, 7, 4] },
      { person: 'elder', x: 106, y: 16, dir: 2, seed: 0.3, wide: true },
      { spirit: 'firefly', x: 90, y: 17, dir: 3, wide: true, glow: true, light: 16, hop: [0.26, 3.46, 7, 4] },
      { person: 'kid', x: -12, y: 25, dir: 0, scale: 2, clear: true },
      { spirit: 'hontori', x: 13, y: 25, dir: 0, scale: 2, glow: true, light: 30, hop: [0.3, 3.5, 7, 4] }
    ],
    extras: [Object.assign({ lighter: { spirit: 'light', at: [0.05, 0.95] } }, LANTERNS)]
  }
};

export default {
  ch10_end_mercy: Object.assign({}, BASE, { panels: [LIFT, HOME, APPLE, WINDOW, VAEL_SEES, FESTIVAL] }),
  ch10_end_nomercy: Object.assign({}, BASE, { panels: [LIFT, HOME, APPLE, WINDOW, VAEL_CLOSED, FESTIVAL] })
};
