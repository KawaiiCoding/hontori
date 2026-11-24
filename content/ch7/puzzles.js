/*
 * ch7/puzzles.js
 * Job: the brazier court of the Ember Crucible (puzzle type "braziers", built by the library lane), on the
 * Cinderreach map. A lava moat runs in front of the Crucible rock; the crossing (maps spot cool) is cooled into
 * stone by water first (an event in ./events.js sets c7:cooled, which the maps lane's state turns into a path).
 * On the rock stand four braziers (maps spot braziers). The carving south of the moat (spot carvings) shows a
 * flame climbing a mountain: up the west side, over the top, down the east. So the order is west low, west high,
 * east high, east low. Using a brazier lights it (`light`). Lit in that order, the Crucible door opens for good;
 * lit out of order, every brazier goes out with a soft hiss (`wrong`) and can be lit again at once. Kell can put
 * them out to start over.
 *
 * `light.ways`: what lighting needs, tried in order; the first whose `if` holds runs its `then` and the brazier
 * lights. Any fire hontori carried, else one Ember Dust (sold for almost nothing in Cinderreach). When nothing
 * fits, `else` says what would help.
 */

export default {
  braziers: {
    map: 'cinderreach',
    type: 'braziers',
    solved: 'c7:braziers',
    carvings: [{ x: 32, y: 15, text: ['ch7.carving.1', 'ch7.carving.2'] }],
    braziers: [
      { id: 'westLow', x: 21, y: 10 },
      { id: 'westHigh', x: 21, y: 6 },
      { id: 'eastHigh', x: 36, y: 6 },
      { id: 'eastLow', x: 36, y: 10 }
    ],
    order: ['westLow', 'westHigh', 'eastHigh', 'eastLow'],
    light: {
      ways: [
        { if: { ext: 'carries', element: 'fire' }, then: [{ sound: 'sizzle' }] },
        { if: { has: 'ember_dust' }, then: [{ take: 'ember_dust' }, { sound: 'sizzle' }] }
      ],
      else: [{ say: 'ch7.brazier.none', who: 'kid' }]
    },
    wrong: [{ sound: 'sizzle' }, { say: 'ch7.brazier.wrong', who: 'kid' }],
    help: { title: 'ch7.braziers.help.title', text: 'ch7.braziers.help', icon: 'fire' },
    onSolve: [{ wait: 350 }, { sound: 'chime' }, { toast: 'ch7.braziers.1' }, { say: 'ch7.braziers.2', who: 'companion' }]
  }
};
