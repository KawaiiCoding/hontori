/*
 * ch1/wild.js
 * Job: wild hontori of chapter 1 (src/encounters.js, src/whisperwood.js). Indoor maps have none.
 */

export default {
  village: { count: 4, level: [1, 3] },
  whisperwood: {
    count: 6,
    level: [2, 4],
    zones: [
      { x: 10, y: 31, r: 5, kind: 'light', w: 4 },
      { x: 41, y: 8, r: 6, kind: 'wind', w: 4 },
      { x: 41, y: 33, r: 6, kind: 'earth', w: 4 },
      { x: 7, y: 9, r: 6, kind: 'dark', w: 2.5 },
      { x: 29, y: 34, r: 5, kind: 'dark', w: 2.5 }
    ]
  }
};
