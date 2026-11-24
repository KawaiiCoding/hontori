/*
 * watchers.js  (Hontori: features)
 * Job: Hontori's grey watchers (puzzle type "watchers", the door test of Hollow Moon) on the engine's watchers
 * (systems/features/Watchers.js): a Council grey cloak walking its loop with a lantern, the pale cone of its light
 * on the ground (it flushes warm when it has seen the kid), the soft pools of shadow where nobody is seen, the
 * cold lantern light, and the entrance test that passes once the puzzle is solved.
 *
 * Public API:
 *   installWatcherGround(game)   registers trial.test "watchers" { type: 'watchers', puzzle } and what
 *                                installWatchers registers
 */

import { installWatchers } from '../../systems/features/index.js';

const TYPE = 'watchers';
/* field directions (0 up, 1 right, 2 down, 3 left) to the painters' (0 down, 1 up, 2 left, 3 right) */
const ART_DIR = [1, 3, 0, 2];
const LOOK = 'greycloak';
const CONE = 'rgba(214,226,255,0.32)';
const CONE_EDGE = 'rgba(240,246,255,0.55)';
const CONE_SEEN = 'rgba(255,214,150,0.32)';
const SHADOW = 'rgba(12,8,28,0.42)';
const SHADOW_HERE = 'rgba(12,8,28,0.55)';

export function installWatcherGround(game) {
  const art = game.art;
  installWatchers(game, {
    type: TYPE,
    paintWatcher(ctx, x, y, look, env) {
      const frame = look.moving ? Math.floor(look.t * 6) % 4 : 0;
      art.drawPerson(ctx, LOOK, x, y, ART_DIR[look.dir] ?? 0, frame, env, { npc: true, seed: 0.4 });
    },
    paintCone(ctx, tiles, look) {
      const s = look.tile;
      ctx.fillStyle = look.seen ? CONE_SEEN : CONE;
      for (const [x, y] of tiles) ctx.fillRect(Math.round(x) + 1, Math.round(y) + 1, s - 2, s - 2);
      ctx.fillStyle = CONE_EDGE;
      for (const [x, y] of tiles) ctx.fillRect(Math.round(x) + 1, Math.round(y) + 1, s - 2, 1);
    },
    paintShadow(ctx, x, y, look) {
      ctx.fillStyle = look.here ? SHADOW_HERE : SHADOW;
      ctx.fillRect(x + 2, y + 3, 12, 11);
      ctx.fillRect(x + 1, y + 5, 14, 7);
      ctx.fillRect(x + 4, y + 2, 8, 13);
    },
    light: { r: 30, color: '#dfe8ff', rise: 14 },
    sounds: { caught: 'bump' },
  });
  game.registry.add('trial.test', TYPE, (test) => {
    const watchers = game.registry.get('service', 'watchers');
    try {
      return !!(watchers && watchers.solved(test.puzzle));
    } catch (error) {
      return false;
    }
  });
}
