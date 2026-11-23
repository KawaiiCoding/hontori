/*
 * ch3/puzzles.js
 * Job: the Gale Bridges in front of Gale Loft (puzzle type "vanes"): each wind vane turns when used and sends its
 * gust another way; a gust pushes whoever stands on its bridge. The way to the Loft is open when the gusts carry
 * the player across. Vane turns are saved; once solved the gusts are calm for good. Lio can set the vanes back.
 * Each vane stands on open grass at the head of its own bridge, clear of the path, the props and the people.
 * The geometry was proved fair with checkGustField (systems/features/GustField.js) from every reachable state.
 */

export default {
  vanes: {
    map: 'gale_bridges',
    type: 'vanes',
    solved: 'c3:vanes',
    vanes: [
      { x: 10, y: 35, turns: ['down', 'left', 'up'], gusts: ['north'] },
      { x: 11, y: 23, turns: ['left', 'up', 'right'], gusts: ['east'] },
      { x: 22, y: 23, turns: ['down', 'right', 'up'], gusts: ['top'] }
    ],
    gusts: [{ id: 'north', x: [8, 8], y: [29, 34] }, { id: 'east', x: [13, 19], y: [25, 25] }, { id: 'top', x: [24, 24], y: [17, 22] }],
    goal: { x: [13, 26], y: [13, 16] },
    help: { title: 'ch3.vanes.help.title', text: 'ch3.vanes.help' },
    onSolve: [{ wait: 350 }, { sound: 'chime' }, { toast: 'ch3.vanes.1' }, { say: 'ch3.vanes.2', who: 'companion' }]
  }
};
