/*
 * WorldSound.js
 * Job: the system that makes the world audible: the place's music, footsteps, bumps and doors.
 * It only listens to world events and calls the game's sound provider.
 *
 * Public API (registry kind "system"):
 *   new WorldSound()
 *   start(game)
 */

/* walking into a wall thuds at most this often */
const BUMP_GAP_MS = 400;

export class WorldSound {
  #lastBump = 0;

  start(game) {
    const sound = game.sound;
    game.bus.on('map:enter', ({ map, scene }) => sound.enterPlace(map.id, scene.env));
    game.bus.on('world:tick', ({ env }) => sound.follow(env));
    game.bus.on('player:step', () => sound.play('step'));
    game.bus.on('door:enter', () => sound.play('door'));
    game.bus.on('player:bump', () => {
      const now = performance.now();
      if (now - this.#lastBump < BUMP_GAP_MS) return;
      this.#lastBump = now;
      sound.play('bump');
    });
  }
}
