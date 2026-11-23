/*
 * flyby.js  (Hontori: features)
 * Job: something small flies once across the view, past the kid, and drops a thing that falls to the kid's
 * feet: the paper bird that brings the Council's letter. It is a picture only (the engine's flights,
 * systems/features/Flights.js): it never stands on the map, blocks nothing, leaves nothing behind, and is
 * gone when the map changes. What is dropped is given by the script itself ({ give } after it).
 *
 * Public API:
 *   installFlyby(game)   registers:
 *     story.command  "ext:flight"   { ext: 'flight', what: 'paper_bird', bring: itemId }
 *        The flyer crosses the view in one straight, gentle line above the kid and flies on; over the kid it
 *        lets the thing go, which falls to the kid's feet and is picked up. The script waits for the fall.
 *   FLYERS               what can fly: { name: { paint(ctx, x, y, info), height, ms, sound } }; a new flyer
 *                        is one more entry
 */

import { fly } from '../../systems/features/index.js';
import { paintCarried } from './kite.js';

const PAPER = '#f6f2e8';
const PAPER_SHADE = '#c8c4bc';
const PAPER_EDGE = '#6a6670';
const EYE = '#7a7a86';
const FALL_MS = 750;
const MARGIN = 18;

/* a folded paper bird flying to the right: a pointed body, a tail, one wing that beats, a closed grey eye */
function paintPaperBird(ctx, x, y, info) {
  const cx = Math.round(x);
  const cy = Math.round(y);
  const up = Math.sin((info.seconds || 0) * 9) > 0;
  /* body: a long folded triangle, beak to the right */
  ctx.fillStyle = PAPER_EDGE;
  ctx.fillRect(cx - 6, cy - 1, 11, 4);
  ctx.fillRect(cx + 5, cy, 2, 2);
  ctx.fillRect(cx - 8, cy - 2, 3, 3);
  ctx.fillStyle = PAPER;
  ctx.fillRect(cx - 5, cy, 10, 1);
  ctx.fillRect(cx + 5, cy, 1, 1);
  ctx.fillRect(cx - 7, cy - 1, 2, 1);
  ctx.fillStyle = PAPER_SHADE;
  ctx.fillRect(cx - 5, cy + 1, 9, 1);
  /* the Council's mark: a small closed eye */
  ctx.fillStyle = EYE;
  ctx.fillRect(cx + 2, cy, 2, 1);
  /* the wing, up or down */
  ctx.fillStyle = PAPER_EDGE;
  if (up) {
    ctx.fillRect(cx - 4, cy - 6, 6, 6);
    ctx.fillStyle = PAPER;
    ctx.fillRect(cx - 3, cy - 5, 2, 5);
    ctx.fillRect(cx - 1, cy - 3, 2, 3);
    ctx.fillStyle = PAPER_SHADE;
    ctx.fillRect(cx - 1, cy - 5, 2, 2);
  } else {
    ctx.fillRect(cx - 4, cy + 1, 6, 6);
    ctx.fillStyle = PAPER_SHADE;
    ctx.fillRect(cx - 3, cy + 2, 2, 4);
    ctx.fillRect(cx - 1, cy + 2, 2, 2);
  }
}

export const FLYERS = {
  paper_bird: { paint: paintPaperBird, height: 58, ms: 3600, sound: 'page' },
};

function sound(game, name) {
  try {
    if (name) game.sound.play(name);
  } catch (error) {
    /* a missing sound never stops the flight */
  }
}

/* the share of the flight's time at which an eased flight has covered this share of its way */
function timeOfShare(share) {
  let low = 0;
  let high = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    if (mid * mid * (3 - 2 * mid) < share) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

async function flyPast(game, world, flyer, bring) {
  const { player, camera } = world;
  const map = world.map;
  const from = { x: camera.x - MARGIN, y: player.y - flyer.height };
  const away = { x: camera.x + camera.width + MARGIN, y: player.y - flyer.height - 12 };
  const share = Math.max(0.1, Math.min(0.9, (player.x - from.x) / (away.x - from.x)));
  const drop = Math.round(timeOfShare(share) * flyer.ms);
  let carrying = !!bring;
  /* the flyer goes on by itself; the script only waits for the thing to reach the kid */
  fly(game, {
    keys: [{ ...from, at: 0 }, { ...away, at: flyer.ms }],
    paint(ctx, x, y, info) {
      flyer.paint(ctx, x, y, info);
      if (carrying) paintCarried(ctx, game, bring, x, y + 4);
    },
    during: [{ at: drop, run: () => { carrying = false; } }],
  });
  await new Promise((resolve) => setTimeout(resolve, drop));
  if (!bring || game.scenes.base !== world || world.map !== map || !world.player) return;
  sound(game, flyer.sound);
  const top = from.y + (away.y - from.y) * share + 4;
  await fly(game, {
    keys: [{ x: player.x, y: top, at: 0 }, { x: player.x + 2, y: player.y - 8, at: FALL_MS }],
    sway: 2,
    paint: (ctx, x, y) => paintCarried(ctx, game, bring, x, y),
  });
}

export function installFlyby(game) {
  game.registry.add('story.command', 'ext:flight', async (node, ctx) => {
    const world = ctx.story.world;
    const flyer = FLYERS[ctx.value(node.what)];
    if (!world || !world.player || !world.camera || !flyer) return undefined;
    try {
      await flyPast(game, world, flyer, ctx.value(node.bring) || null);
    } catch (error) {
      console.warn('Features: a flight past the player failed', error);
    }
    return ctx.story.ended(ctx) ? 'stop' : undefined;
  });
}
