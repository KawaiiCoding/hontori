/*
 * ch6/puzzles.js
 * Job: the boulder tunnels in front of Bedrock Hall, at the back of the Listening Cave (puzzle type "push", the
 * Root Maze's type from chapter 2, look "boulder"): walk into a boulder to push it one tile; the stone door opens
 * when every glowing pad holds a boulder. The cave is dark (map data), so the pads glow on their own and the
 * boulders stand close to them; the Lantern, and more with Lantern Oil, shows more of the room. Unsolved
 * boulders go back each time the cave is entered; solved stays solved. Coordinates are the maps lane's spots
 * boulders, pads and gate (content/ch6/maps/listening_cave.js); behind the gate lies the chamber of carvings.
 */

export default {
  tunnels: {
    map: 'listening_cave',
    type: 'push',
    look: 'boulder',
    boxes: [[17, 14], [22, 15], [27, 14]],
    pads: [[21, 12], [22, 12], [23, 12]],
    gate: [22, 9],
    solved: 'c6:tunnels',
    resetOnEnter: true,
    help: { title: 'ch6.tunnels.help.title', text: 'ch6.tunnels.help', icon: 'earth' },
    onSolve: [{ wait: 350 }, { sound: 'creak' }, { toast: 'ch6.tunnels.1' }, { say: 'ch6.tunnels.2', who: 'companion' }]
  }
};
