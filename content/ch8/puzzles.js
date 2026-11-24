/*
 * ch8/puzzles.js
 * Job: the grey watchers on the crater rim above Hollow Moon, on the Duskmere map (puzzle type "watchers", a new
 * library type): three Council cloaks walk set loops with a lantern each, throwing a cone of light ahead of them.
 * The kid crosses from the crater gate to Hollow Moon's door by staying out of the cones and waiting in the
 * shadows. Caught in a cone means a gentle reset to the last shadow touched: one short line from the watcher, a
 * fade, never a fight. Each path loops through its points; the cone is `reach` tiles long and widens by one tile
 * every two. Geometry is the maps lane's spots on duskmere: watchStart, watchA, watchB, watchC, shadows,
 * hallDoor. The library's checker should prove a safe way exists.
 */

export default {
  watchers: {
    map: 'duskmere',
    type: 'watchers',
    start: [30, 45],
    goal: { x: [40, 42], y: [42, 43] },
    shadows: [[34, 46], [37, 44], [40, 46], [45, 45], [36, 49], [45, 47]],
    watchers: [
      { path: [[31, 45], [38, 45], [38, 47], [31, 47]], speed: 1, reach: 3 },
      { path: [[47, 44], [47, 48], [41, 48], [41, 44]], speed: 1, reach: 3 },
      { path: [[34, 43], [46, 43]], speed: 1, reach: 3 }
    ],
    caught: 'ch8.watchers.caught',
    solved: 'c8:watchers',
    help: { title: 'ch8.watchers.help.title', text: 'ch8.watchers.help', icon: 'dark' },
    onSolve: [{ wait: 350 }, { sound: 'chime' }, { toast: 'ch8.watchers.1' }, { say: 'ch8.watchers.2', who: 'companion' }]
  }
};
