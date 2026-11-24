/*
 * ch5/puzzles.js
 * Job: the circuit door of the Storm Works on Sparkmoor (puzzle type "circuit", systems/features/Circuits.js):
 * pieces of power line stand in the open yard in front of the door (maps lane spot "circuit": x 10 to 18,
 * y 14 to 16); using one turns it a quarter. The coil (source, spot "source") sends power west; when the line
 * runs unbroken to the lamp beside the door (target), the door lights and opens for
 * good. Sides: 0 down, 1 up, 2 left, 3 right. One way through: west along row 15 to x 17, up to row 14, west to
 * x 16 and up into the lamp. Three loose pieces stand beside the way. Dov can set the pieces back.
 * The debug tools prove the field fair on entering the map (checkCircuitField).
 */

export default {
  circuit: {
    map: 'sparkmoor',
    type: 'circuit',
    solved: 'c5:circuit',
    source: { x: 19, y: 15, out: 2 },
    target: { x: 16, y: 13, in: 0 },
    pieces: [
      { x: 18, y: 15, shape: 'line', turn: 0 },
      { x: 17, y: 15, shape: 'bend', turn: 2 },
      { x: 17, y: 14, shape: 'bend', turn: 1 },
      { x: 16, y: 14, shape: 'bend', turn: 3 },
      { x: 14, y: 15, shape: 'line', turn: 1 },
      { x: 16, y: 15, shape: 'tee', turn: 0 },
      { x: 15, y: 16, shape: 'bend', turn: 2 }
    ],
    help: { title: 'ch5.circuit.help.title', text: 'ch5.circuit.help', icon: 'electric' },
    onSolve: [{ wait: 350 }, { sound: 'chime' }, { toast: 'ch5.circuit.1' }, { say: 'ch5.circuit.2', who: 'companion' }]
  }
};
