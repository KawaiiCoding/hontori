/*
 * prologue/story.js
 * Job: the picture story before a new journey (world rule 76, src/prologue.js). Each panel is one line and a scene
 * made of named painter parts; positions are in the 192 x 120 panel. fade 'out' fades the spirits while the panel plays.
 */

export default {
  prologue: {
    size: [192, 120],
    panelMs: 2600,
    minMs: 500,
    skip: 'pro.story.skip',
    tap: 'pro.story.tap',
    tapLast: 'pro.story.tap.last',
    sound: { panel: 'page', last: 'wand' },
    panels: [
      {
        text: 'pro.story.1',
        time: 12,
        scene: {
          ground: 'meadow',
          actors: [
            { person: 'elder', x: 34, y: 104, dir: 0, seed: 0.2 },
            { person: 'kid', x: 96, y: 108, dir: 0, seed: 0.5 },
            { person: 'tansy', x: 150, y: 104, dir: 0, seed: 0.8 },
            { spirit: 'grass', x: 62, y: 100, fade: 1 },
            { spirit: 'water', x: 124, y: 102, fade: 1 },
            { spirit: 'wind', x: 78, y: 60, fade: 1 },
            { spirit: 'light', x: 132, y: 56, fade: 1 }
          ]
        }
      },
      {
        text: 'pro.story.2',
        time: 12,
        scene: {
          ground: 'meadowGrey',
          actors: [
            { person: 'elder', x: 34, y: 104, dir: 0, seed: 0.2 },
            { person: 'kid', x: 96, y: 108, dir: 0, seed: 0.5 },
            { person: 'tansy', x: 150, y: 104, dir: 0, seed: 0.8 },
            { spirit: 'grass', x: 62, y: 100, fade: 'out' },
            { spirit: 'water', x: 124, y: 102, fade: 'out' },
            { spirit: 'wind', x: 78, y: 60, fade: 'out' },
            { spirit: 'light', x: 132, y: 56, fade: 'out' }
          ],
          extras: [{ part: 'eyeClosing', x: 96, y: 24 }]
        }
      },
      {
        text: 'pro.story.3',
        time: 12,
        scene: {
          ground: 'meadowGrey',
          actors: [
            { person: 'baker', x: 40, y: 104, dir: 3, seed: 0.2 },
            { person: 'farmer', x: 150, y: 106, dir: 2, seed: 0.7 },
            { spirit: 'grass', x: 70, y: 100, fade: 0.16 },
            { spirit: 'water', x: 118, y: 102, fade: 0.16 },
            { spirit: 'wind', x: 96, y: 60, fade: 0.16 }
          ]
        }
      },
      {
        text: 'pro.story.4',
        time: 22,
        scene: {
          ground: 'nightVillage',
          extras: [
            { part: 'stars' },
            { part: 'moon', x: 160, y: 22 },
            { part: 'house', x: 22, y: 82 },
            { part: 'house', x: 118, y: 86, lit: true },
            { part: 'spiritFlight', kind: 'hontori', from: [20, 66], to: [138, 66], arc: 18 }
          ]
        }
      },
      {
        text: 'pro.story.5',
        gold: true,
        time: 22,
        scene: {
          ground: 'duskHill',
          actors: [
            { person: 'kid', x: 78, y: 110, dir: 0, seed: 0.5 },
            { spirit: 'hontori', x: 116, y: 104, fade: 1, sit: true }
          ],
          extras: [{ part: 'stars' }, { part: 'sigilDraw', points: [[70, 22], [96, 62], [122, 22]] }]
        }
      }
    ]
  }
};
