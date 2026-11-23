/*
 * ch2/puzzles.js
 * Job: the Root Maze in front of Rootwood Hall: walk into a leaf pile to push it one tile; the root gate opens when
 * every glowing moss pad holds a pile. Unsolved piles go back each time the room is entered; solved stays solved.
 * The root walls are root_wall props on the map.
 */

export default {
  root_maze: {
    map: 'rootwood_gate',
    type: 'push',
    look: 'leaf',
    boxes: [[2, 6], [13, 6], [6, 9]],
    pads: [[8, 6], [8, 8], [8, 10]],
    gate: [8, 4],
    solved: 'c2:maze',
    resetOnEnter: true,
    onSolve: [{ wait: 350 }, { sound: 'sparkle' }, { toast: 'ch2.maze.1' }, { say: 'ch2.maze.2', who: 'companion' }]
  }
};
