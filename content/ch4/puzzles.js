/*
 * ch4/puzzles.js
 * Job: the Sunken Stair (puzzle type "tide"): three tide wheels, each beside its own pool on the stair. Turning a
 * wheel fills or drains its pool; low water opens the path across it. A pool that drains spills into the pool
 * below it, so the stair is drained from the top down. Each wheel stands on the dry landing above its pool, so the
 * player can always reach it again and is never stranded. Wheel turns are saved; once solved the stair stays dry
 * for good. Isk can set the wheels back.
 * The geometry follows the sunken_stair map (maps lane); the library proves it fair from every reachable state.
 */

export default {
  tide: {
    map: 'sunken_stair',
    type: 'tide',
    solved: 'c4:stair',
    wheels: [
      { x: 20, y: 7, basin: 'upper' },
      { x: 9, y: 16, basin: 'middle' },
      { x: 20, y: 26, basin: 'lower' }
    ],
    basins: [
      { id: 'upper', x: [12, 17], y: [9, 12], start: 'high', spill: 'middle' },
      { id: 'middle', x: [12, 17], y: [19, 22], start: 'high', spill: 'lower' },
      { id: 'lower', x: [12, 17], y: [29, 32], start: 'low' }
    ],
    goal: { x: [14, 16], y: [33, 33] },
    help: { title: 'ch4.tide.help.title', text: 'ch4.tide.help' },
    onSolve: [{ wait: 350 }, { sound: 'splash' }, { toast: 'ch4.tide.1' }, { say: 'ch4.tide.2', who: 'companion' }]
  }
};
