/*
 * ch9/puzzles.js
 * Job: the Mirror Gardens (puzzle type "mirrors", built by the library lane): a sun-stone on the east lawn sends a
 * beam of light west; mirrors on stands among the hedges each lean one of two ways ('/' or '\'), and using one
 * swings it to the other. The beam bounces off every mirror it meets; when it reaches the crystal above the gate
 * of Halo Court's garden walk, the gate opens for good (c9:gardens, the trial's entrance). Sides: 0 up, 1 right,
 * 2 down, 3 left. Lean: 0 '/', 1 '\'. A '/' turns a beam going right to up (and up to right, left to down, down
 * to left); a '\' turns right to down (down to right, left to up, up to left).
 * One way through (all four lean '/'): east from the sun-stone, up at A, east at B, up at C, east at D into the
 * crystal. E, F and G are decoys beside the way; a beam that loops or leaves the lawn simply stops. Every part stands on open lawn; the beam is drawn as it runs, so the player sees
 * how far it gets after each turn. Lys at the entrance sets the mirrors back.
 * The spots follow the mirror_gardens map (maps lane); the library proves the field with its checker.
 */

export default {
  mirrors: {
    map: 'mirror_gardens',
    type: 'mirrors',
    solved: 'c9:gardens',
    source: { x: 4, y: 26, out: 1 },
    target: { x: 34, y: 5, in: 3 },
    mirrors: [
      { id: 'A', x: 12, y: 26, lean: 1 },
      { id: 'B', x: 12, y: 14, lean: 1 },
      { id: 'C', x: 24, y: 14, lean: 0 },
      { id: 'D', x: 24, y: 5, lean: 1 },
      { id: 'E', x: 12, y: 5, lean: 0 },
      { id: 'F', x: 24, y: 26, lean: 1 },
      { id: 'G', x: 30, y: 20, lean: 0 }
    ],
    help: { title: 'ch9.mirrors.help.title', text: 'ch9.mirrors.help', icon: 'light' },
    onSolve: [{ wait: 350 }, { sound: 'chime' }, { toast: 'ch9.mirrors.1' }, { say: 'ch9.mirrors.2', who: 'companion' }]
  }
};
