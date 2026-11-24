/*
 * travel.js  (Hontori: features)
 * Job: rides from one place to another (the ferry from Kitewick's lake to Tidewell, and any later boat or cart)
 * on the engine's travel (systems/features/Travel.js): the story command that starts a ride, and the look of a
 * crossing: while the boat sails, the water around it streams past the other way in pale foam lines (the boat's
 * own motion is their cause; they stop when it arrives). Paying for the ride is content (a `spend` before it).
 *
 * Public API:
 *   installTravelling(game)   registers:
 *     story.command  "ext:travel"
 *        { ext: 'travel', to: { map, x, y, dir }, via: { map, x, y, dir, heading }, seconds, during: [commands],
 *          after: [commands] }
 *        via: the crossing map (the ferry deck on open water) and the way the boat sails (heading: 0 down,
 *        1 up, 2 left, 3 right); during: run once on the crossing; after: run once on arrival.
 *        The ride starts when the script ends, so `travel` is the last command of its script.
 *     and what installTravel registers: gate, world.layer and system "features:travel", service "travel",
 *     save section "travel"
 *   paintCrossing(ctx, world, look)   the foam streaming past on the water in view
 */

import { installTravel } from '../../systems/features/index.js';
import { TILE } from '../../core/units.js';

const FOAM = 'rgba(232,246,255,0.55)';
const FOAM_SOFT = 'rgba(232,246,255,0.28)';
const SPEED = 46;
const DASH = 5;
/* the water streams the other way from where the boat sails: down, up, left, right */
const AGAINST = [[0, -1], [0, 1], [1, 0], [-1, 0]];

export function paintCrossing(ctx, world, look) {
  const map = world.map;
  const cam = world.camera;
  if (!map || !cam) return;
  const [sx, sy] = AGAINST[look.heading] || AGAINST[0];
  /* it eases in as the boat sets off and out as it comes in */
  const ease = Math.min(1, look.seconds / 1.2, (1 - look.k) * 4 + 0.15);
  if (ease <= 0) return;
  const x0 = Math.max(0, Math.floor(cam.x / TILE));
  const y0 = Math.max(0, Math.floor(cam.y / TILE));
  const x1 = Math.min(map.width - 1, Math.ceil((cam.x + cam.width) / TILE));
  const y1 = Math.min(map.height - 1, Math.ceil((cam.y + cam.height) / TILE));
  const run = look.seconds * SPEED;
  ctx.save();
  ctx.globalAlpha = ease;
  for (let ty = y0; ty <= y1; ty++) {
    for (let tx = x0; tx <= x1; tx++) {
      const seed = (tx * 73856093) ^ (ty * 19349663);
      if ((seed & 3) !== 0 || map.tileAt(tx, ty) !== 'water') continue;
      const lane = ((seed >>> 3) % 13) + 1;
      const shift = (((seed >>> 7) % 97) + run) % (TILE * 2);
      const along = shift - TILE / 2;
      /* one short dash per tile, sliding along the stream and cut at the tile's edges */
      const px = tx * TILE + (sx ? (sx > 0 ? along : TILE - along) : lane) - cam.x;
      const py = ty * TILE + (sy ? (sy > 0 ? along : TILE - along) : lane) - cam.y;
      const left = tx * TILE - cam.x;
      const top = ty * TILE - cam.y;
      if (px < left || py < top || px > left + TILE - 1 || py > top + TILE - 1) continue;
      ctx.fillStyle = (seed >>> 5) & 1 ? FOAM : FOAM_SOFT;
      if (sx) ctx.fillRect(Math.round(px), Math.round(py), Math.min(DASH, left + TILE - Math.round(px)), 1);
      else ctx.fillRect(Math.round(px), Math.round(py), 1, Math.min(DASH, top + TILE - Math.round(py)));
    }
  }
  ctx.restore();
}

export function installTravelling(game) {
  const travel = installTravel(game, { paintCrossing, sounds: { depart: 'splash', arrive: 'bell' } });
  game.registry.add('story.command', 'ext:travel', (node, ctx) => {
    const spec = {
      /* places are plain data in the content, read as they stand */
      to: node.to,
      via: node.via || null,
      seconds: node.seconds === undefined ? undefined : Number(ctx.value(node.seconds)),
      during: node.during,
      after: node.after,
    };
    travel.go(spec);
  });
}
