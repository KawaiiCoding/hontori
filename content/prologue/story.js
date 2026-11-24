/*
 * prologue/story.js
 * Job: the picture story before a new journey (world rule 76): seven short panels that show the cause.
 * Spirits and people shared one world; a law hid the spirits behind a veil; the spirits are still there;
 * one small spirit finds the child who can see; that child lifts the veil.
 *
 * Each panel is one line and a scene made of named painter parts (game/features/storyArt.js lists them).
 * Places are in world pixels (x 0 the middle, y 0 the ground line); times are shares of the panel's action
 * time `ms`. A panel stays for ms plus the reading time of its line, then goes on by itself; a tap goes on sooner.
 * The same child and the same water hontori appear in panels 1, 2, 3, 4 and 7, so the loss has a face.
 */

/* the village green: the lantern string, where the seal hangs, and who stands where */
const LANTERNS = { part: 'lanterns', from: [-46, -36], to: [46, -36], n: 7, sag: 6 };
const SEAL = [0, -52];

/* each pair is a person and the hontori beside them, facing each other: [look, x, y, dir, seed],
   [kind, x, y, dir]. The pairs mirror each other around the middle; the last two only fit a wide screen. */
const FESTIVAL = [
  [['girl', -31, 23, 3, 0.4], ['water', -15, 24, 2]],
  [['boy', 31, 23, 2, 0.6], ['sparkmouse', 15, 24, 3]],
  [['farmer', -71, 13, 3, 0.2], ['grass', -55, 14, 2]],
  [['elder', 71, 13, 2, 0.3], ['pufflet', 55, 14, 3]],
  [['fisher', -108, 19, 3, 0.5, true], ['frog', -92, 20, 2, true]],
  [['baker', 108, 19, 2, 0.9, true], ['salamander', 92, 20, 3, true]]
];
/* when the veil lifts the child and the fire hontori stand in the middle, so the pairs stand aside */
const LIFTED = [
  [['girl', -70, 22, 3, 0.4], ['water', -54, 23, 2]],
  [['boy', 70, 22, 2, 0.6], ['sparkmouse', 54, 23, 3]],
  [['farmer', -106, 16, 3, 0.2, true], ['grass', -90, 17, 2, true]],
  [['elder', 106, 16, 2, 0.3, true], ['pufflet', 90, 17, 3, true]]
];

/* dance: everyone hops through the panel; veiled: the hontori fade as the veil reaches them and the
   people turn to the front one by one; lifted: the hontori are faint until colour returns, then hop */
function village(pairs, mode) {
  const cast = [];
  pairs.forEach(([p, s], i) => {
    const person = { person: p[0], x: p[1], y: p[2], dir: p[3], seed: p[4] };
    const spirit = { spirit: s[0], x: s[1], y: s[2], dir: s[3] };
    if (p[5]) person.wide = true;
    if (s[4]) spirit.wide = true;
    if (mode === 'dance') {
      if (i < 2) person.hop = [i * 0.1, i * 0.1 + 3.2, 7, 3];
      spirit.hop = [0.05 + i * 0.07, 3.25 + i * 0.07, 7, 4];
    } else if (mode === 'veiled') {
      spirit.fades = true;
      person.turn = [[0.78 + (i % 3) * 0.08, 0]];
    } else if (mode === 'lifted') {
      spirit.unseen = 0.4;
      spirit.hop = [1.05 + i * 0.05, 2.4 + i * 0.05, 4, 4];
      person.dir = 0;
      person.turn = [[1.0 + i * 0.05, p[3]]];
    }
    cast.push(person, spirit);
  });
  return cast;
}

export default {
  prologue: {
    size: [176, 120],
    scale: 4,
    panelMs: 2400,
    minMs: 600,
    skip: 'pro.story.skip',
    tap: 'pro.story.tap',
    tapLast: 'pro.story.tap.last',
    sound: { panel: 'page', last: 'wand' },
    panels: [
      /* 1. close: a child shares an apple with her hontori under a fruit tree, in golden light */
      {
        text: 'pro.story.1',
        time: 16,
        ms: 1800,
        push: [1, 1.07],
        scene: {
          set: 'orchard',
          zoom: 2,
          light: 'gold',
          haze: true,
          cam: { from: [-5], to: [5] },
          actors: [
            { person: 'girl', x: -13, y: 9, dir: 3, seed: 0.4, hop: [0.62, 0.95, 1, 2] },
            { spirit: 'water', x: 13, y: 10, dir: 2, hop: [0.5, 1, 2, 4] }
          ],
          extras: [{ part: 'apple', from: [-6, -2], to: [4, 5], arc: 8, at: [0.12, 0.45] }]
        }
      },
      /* 2. wide: the festival at dusk; a light hontori lights the lanterns one by one (the cast is the roundest,
            friendliest first forms) */
      {
        text: 'pro.story.2',
        time: 19,
        ms: 2200,
        push: [1, 1.04],
        scene: {
          set: 'festival',
          light: 'dusk',
          cam: { from: [-6], to: [6] },
          actors: village(FESTIVAL, 'dance'),
          extras: [Object.assign({ lighter: { spirit: 'light', at: [0.05, 0.95] } }, LANTERNS)]
        }
      },
      /* 3. the same green: the seal of the law comes down, grey spreads from it, lanterns go out,
            the spirits turn faint and the people turn away */
      {
        text: 'pro.story.3',
        time: 19,
        ms: 2800,
        push: [1.04, 1],
        scene: {
          set: 'festival',
          light: 'dusk',
          cam: { from: [6], to: [3] },
          veil: { x: SEAL[0], y: SEAL[1], at: [0.34, 1.05] },
          actors: village(FESTIVAL, 'veiled'),
          extras: [Object.assign({ lit: true }, LANTERNS), { part: 'seal', x: SEAL[0], y: SEAL[1], drop: [0, 0.3] }]
        }
      },
      /* 4. close, the fruit tree again, grey: the child walks past; the hontori hops, watches her go, sits */
      {
        text: 'pro.story.4',
        time: 12,
        ms: 2400,
        push: [1.06, 1],
        scene: {
          set: 'orchard',
          zoom: 2,
          light: 'grey',
          veil: 'all',
          cam: { from: [6], to: [-4] },
          actors: [
            { person: 'girl', x: -70, y: 6, dir: 3, seed: 0.4, walk: { to: 76, at: [0, 1.6] } },
            { spirit: 'water', x: 13, y: 12, dir: 2, unseen: 0.5, hop: [0.35, 0.75, 2, 4], turn: [[0.92, 3]], sit: [1.3] }
          ],
          extras: [{ part: 'apple', from: [-1, 13], to: [-1, 13], at: [0, 0] }]
        }
      },
      /* 5. wide, night: the fire hontori runs along the hill above the sleeping town and stops at one lit window */
      {
        text: 'pro.story.5',
        time: 23,
        ms: 2600,
        push: [1, 1.05],
        scene: {
          set: 'nightTown',
          light: 'night',
          cam: { from: [-34], to: [28], at: [0, 1.05] },
          actors: [{ spirit: 'hontori', x: -104, y: 14, dir: 3, scale: 1.5, glow: true, light: 30, walk: { to: 28, at: [0, 0.9] }, turn: [[0.95, 1]] }],
          extras: [{ part: 'stars' }, { part: 'moon', x: -44 }, { part: 'smoke' }]
        }
      },
      /* 6. close: the window; the child inside looks out as the hontori comes and looks up */
      {
        text: 'pro.story.6',
        time: 23,
        ms: 1900,
        push: [1, 1.08],
        scene: {
          set: 'window',
          horizon: [0.62, 0.68],
          light: 'night',
          cam: { from: [5], to: [0] },
          actors: [{ spirit: 'hontori', x: 74, y: 24, dir: 2, scale: 2, glow: true, light: 40, walk: { to: 0, at: [0, 0.75] }, turn: [[0.77, 1]] }],
          extras: [{ part: 'kidAtWindow', look: 'kid' }]
        }
      },
      /* 7. the grey green again: an ember from the hontori draws the V across the seal, its eye opens,
            colour spreads back from it and the spirits are seen */
      {
        text: 'pro.story.7',
        gold: true,
        time: 8,
        ms: 2800,
        push: [1, 1.06],
        scene: {
          set: 'festival',
          light: 'gold',
          veil: { x: SEAL[0], y: SEAL[1], at: [0.66, 1.8], lift: true },
          actors: village(LIFTED, 'lifted').concat([
            { person: 'kid', x: -12, y: 25, dir: 1, scale: 2, clear: true },
            { spirit: 'hontori', x: 13, y: 25, dir: 1, scale: 2, glow: true, light: 30 }
          ]),
          extras: [
            LANTERNS,
            { part: 'seal', x: SEAL[0], y: SEAL[1], open: [0.58, 0.72], gone: [0.9, 1.3] },
            { part: 'sigil', from: [13, 2], points: [[-18, -70], [0, -45], [18, -70]], rise: [0.04, 0.24], at: [0.24, 0.6] }
          ]
        }
      }
    ]
  }
};
