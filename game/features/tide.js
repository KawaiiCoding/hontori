/*
 * tide.js  (Hontori: features)
 * Job: Hontori's tide-wheel puzzles (puzzle type "tide", the Sunken Stair under Deepbell Hall) on the engine's
 * tides (systems/features/Tides.js): the look of a tide wheel (a big spoked wooden wheel with brass handles on a
 * stone foot, that rolls a quarter round each time it is used; the sluice in its foot shows dark wood while it
 * holds the water and running blue water while it is open), the soft ring on the ground while the kid stands
 * where it can be turned, the sea water over a flooded basin (the game's own water tiles, with a pale rim where
 * it meets dry stone, rising and draining smoothly), the sounds, and the entrance test that passes once the
 * puzzle is solved.
 *
 * Public API:
 *   installTide(game)   registers everything below (through installTides)
 *     trial.test   "tide"   { type: 'tide', puzzle: puzzleId }   passed when that puzzle is solved
 *     and what installTides registers: gate, world.layer and system "features:tides", service "tides",
 *     puzzle.reset "tide", save section "tides"
 *   paintWheel(ctx, x, y, look, env), paintWater(ctx, px, py, look, art, env)
 *
 * Puzzle data: see systems/features/Tides.js (type: 'tide').
 */

import { installTides } from '../../systems/features/index.js';
import { TILE } from '../../core/units.js';

const TYPE = 'tide';
const OUTLINE = '#2e2118';
const STONE_LIGHT = '#b4afa4';
const STONE = '#8e897e';
const STONE_DARK = '#625d55';
const WOOD_DARK = '#5a3a1e';
const WOOD = '#8a5a30';
const WOOD_LIGHT = '#b07c44';
const BRASS_LIGHT = '#fff0b0';
const BRASS = '#f0c860';
const BRASS_DARK = '#b08434';
const RING = '#d8f0ff';
const RIM = 'rgba(226,244,255,0.75)';
const RIM_SOFT = 'rgba(226,244,255,0.35)';
const RING_SECONDS = 1.6;
const RING_DOTS = 44;
const SPOKES = 6;
const RADIUS = 7;

/* the water tile asks about its neighbours for its shore; over a basin there is only water */
const ALL_WATER = () => 'water';

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function paintRing(ctx, cx, cy, t) {
  const pulse = 0.5 + 0.5 * Math.sin(((t % RING_SECONDS) / RING_SECONDS) * Math.PI * 2);
  const rx = 11 + pulse * 1.5;
  const ry = rx * 0.42;
  ctx.globalAlpha = 0.4 + 0.4 * pulse;
  ctx.fillStyle = RING;
  for (let i = 0; i < RING_DOTS; i++) {
    const a = (i / RING_DOTS) * Math.PI * 2;
    ctx.fillRect(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), 1, 1);
  }
  ctx.globalAlpha = 1;
}

/* a line of whole pixels from the hub outward */
function spoke(ctx, cx, cy, angle, from, to, color) {
  ctx.fillStyle = color;
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  for (let r = from; r <= to; r += 0.5) ctx.fillRect(Math.round(cx + c * r - 0.5), Math.round(cy + s * r - 0.5), 1, 1);
}

export function paintWheel(ctx, x, y, look, env) {
  const t = (env && env.t) || 0;
  const k = look.k < 1 ? look.k * look.k * (3 - 2 * look.k) : 1;
  const n = Math.max(1, look.settings || 2);
  /* every use rolls the wheel one step forward, so the spokes always turn the same way */
  const steps = look.from + ((look.turn - look.from + n) % n) * k;
  const angle = steps * (Math.PI / 2) - Math.PI / 2;
  x = Math.round(x);
  y = Math.round(y);
  const cx = x + 8;
  const cy = y - 4;
  ctx.fillStyle = 'rgba(20,15,10,0.28)';
  ctx.fillRect(x + 2, y + 13, 13, 2);
  ctx.fillRect(x + 4, y + 15, 9, 1);
  if (look.near) paintRing(ctx, cx, y + 12, t);
  /* a low stone foot with a slot the wheel turns in */
  rect(ctx, OUTLINE, x + 1, y + 7, 14, 8);
  rect(ctx, STONE, x + 2, y + 8, 12, 6);
  rect(ctx, STONE_LIGHT, x + 2, y + 8, 12, 1);
  rect(ctx, STONE_DARK, x + 2, y + 13, 12, 1);
  /* the sluice in the foot: a wooden board while it holds, running water while it is open */
  rect(ctx, OUTLINE, x + 5, y + 9, 6, 4);
  if (look.open) {
    const run = Math.floor(t * 8) % 3;
    rect(ctx, '#3f7fb8', x + 6, y + 10, 4, 2);
    rect(ctx, '#bfe4ff', x + 6 + run, y + 10, 1, 1);
    rect(ctx, '#8cc4ee', x + 8 - run, y + 11, 1, 1);
  } else {
    rect(ctx, WOOD, x + 6, y + 10, 4, 2);
    rect(ctx, WOOD_LIGHT, x + 6, y + 10, 4, 1);
  }
  /* two posts holding the axle */
  rect(ctx, OUTLINE, cx - 10, cy - 1, 3, 10);
  rect(ctx, WOOD, cx - 9, cy, 1, 8);
  rect(ctx, OUTLINE, cx + 8, cy - 1, 3, 10);
  rect(ctx, WOOD, cx + 9, cy, 1, 8);
  rect(ctx, WOOD_DARK, cx - 9, cy - 1, 19, 2);
  /* the rim: a dark edge, wood, and a lighter top */
  for (let i = 0; i < 64; i++) {
    const a = (i / 64) * Math.PI * 2;
    const ox = Math.cos(a);
    const oy = Math.sin(a);
    ctx.fillStyle = OUTLINE;
    ctx.fillRect(Math.round(cx + ox * (RADIUS + 1) - 0.5), Math.round(cy + oy * (RADIUS + 1) - 0.5), 1, 1);
    ctx.fillStyle = oy < -0.3 ? WOOD_LIGHT : oy > 0.4 ? WOOD_DARK : WOOD;
    ctx.fillRect(Math.round(cx + ox * RADIUS - 0.5), Math.round(cy + oy * RADIUS - 0.5), 1, 1);
  }
  /* the spokes, each ending in a brass handle beyond the rim */
  for (let i = 0; i < SPOKES; i++) {
    const a = angle + (i / SPOKES) * Math.PI * 2;
    spoke(ctx, cx, cy, a, 1.5, RADIUS - 1, i ? WOOD : WOOD_LIGHT);
    const hx = Math.round(cx + Math.cos(a) * (RADIUS + 2.5) - 1);
    const hy = Math.round(cy + Math.sin(a) * (RADIUS + 2.5) - 1);
    rect(ctx, OUTLINE, hx - 1, hy - 1, 4, 4);
    rect(ctx, i ? BRASS : BRASS_LIGHT, hx, hy, 2, 2);
  }
  /* the hub */
  rect(ctx, OUTLINE, cx - 2, cy - 2, 5, 5);
  rect(ctx, BRASS, cx - 1, cy - 1, 3, 3);
  rect(ctx, BRASS_LIGHT, cx - 1, cy - 1, 1, 1);
  rect(ctx, BRASS_DARK, cx + 1, cy + 1, 1, 1);
}

export function paintWater(ctx, px, py, look, art, env) {
  const fill = Math.max(0, Math.min(1, look.fill));
  ctx.save();
  /* one unit of water is a little see-through, two or more are deep */
  ctx.globalAlpha = 1 - (1 - fill) ** 3;
  try {
    art.drawTile(ctx, false, 'water', px, py, look.tx, look.ty, env, ALL_WATER);
  } catch (error) {
    ctx.fillStyle = '#3f7fb8';
    ctx.fillRect(px, py, TILE, TILE);
  }
  /* a pale rim where the water meets dry stone */
  const e = look.edge;
  const wide = 1;
  ctx.fillStyle = RIM;
  if (e.up) ctx.fillRect(px, py, TILE, wide);
  if (e.down) ctx.fillRect(px, py + TILE - wide, TILE, wide);
  if (e.left) ctx.fillRect(px, py, wide, TILE);
  if (e.right) ctx.fillRect(px + TILE - wide, py, wide, TILE);
  ctx.fillStyle = RIM_SOFT;
  if (e.up) ctx.fillRect(px, py + wide, TILE, 1);
  if (e.left) ctx.fillRect(px + wide, py, 1, TILE);
  ctx.restore();
}

export function installTide(game) {
  installTides(game, {
    type: TYPE,
    paintWheel,
    paintWater,
    sounds: { turn: 'blip', fill: 'splash', drain: 'splash', refuse: 'bump', solve: 'confirm' },
  });
  game.registry.add('trial.test', TYPE, (test) => {
    const tides = game.registry.get('service', 'tides');
    try {
      return !!(tides && tides.solved(test.puzzle));
    } catch (error) {
      return false;
    }
  });
}
