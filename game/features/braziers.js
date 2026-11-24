/*
 * braziers.js  (Hontori: features)
 * Job: Hontori's brazier court (puzzle type "braziers", the door test of the Ember Crucible) on the engine's
 * braziers (systems/features/Braziers.js): the look of a brazier (a dark iron bowl on a stone foot; cold
 * coals, then a flame that catches and settles; a wrong one flares and dies), the carving stone that shows the
 * order (a flame climbing a mountain, up one side and down the other), the soft ring on the floor while the
 * kid can use one, the sounds, and the entrance test that passes once the puzzle is solved.
 *
 * Public API:
 *   installBrazierCourt(game)   registers everything below (through installBraziers)
 *     trial.test   "braziers"   { type: 'braziers', puzzle: puzzleId }   passed when that puzzle is solved
 *     and what installBraziers registers: gate, world.layer and system "features:braziers", service
 *     "braziers", story.command "ext:brazierLit", puzzle.reset "braziers"
 *   paintBrazier, paintCarving   the two looks (map pixels, x, y the tile's top-left)
 */

import { installBraziers } from '../../systems/features/index.js';

const TYPE = 'braziers';
const OUTLINE = '#1c1418';
const IRON = '#3a3238';
const IRON_LIGHT = '#5e5460';
const STONE = '#6e6660';
const STONE_LIGHT = '#958c84';
const STONE_DARK = '#4a443e';
const COAL = '#2a1e1c';
const EMBER = '#a8401c';
const FLAME = ['#ff6a2a', '#ffa03a', '#ffd27a', '#fff4c8'];
const RING = '#ffd9a0';
const RING_DOTS = 40;

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

function ring(ctx, cx, cy, t) {
  const pulse = 0.5 + 0.5 * Math.sin(t * 4);
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

/* a flame of `size` (0..1) standing on (cx, by), flickering with t */
function flame(ctx, cx, by, size, t) {
  if (size <= 0) return;
  const h = Math.round(12 * size);
  for (let layer = 0; layer < FLAME.length; layer++) {
    const lh = Math.max(1, Math.round(h * (1 - layer * 0.22)));
    const lw = Math.max(1, Math.round(8 * size * (1 - layer * 0.22)));
    for (let row = 0; row < lh; row++) {
      const k = row / lh;
      const sway = Math.round(Math.sin(t * 9 + row * 0.7 + layer) * k * 1.4);
      const w = Math.max(1, Math.round(lw * (1 - k * k)));
      rect(ctx, FLAME[layer], cx - (w >> 1) + sway, by - row, w, 1);
    }
  }
}

export function paintBrazier(ctx, x, y, look, env) {
  const t = (env && env.t) || look.t || 0;
  x = Math.round(x);
  y = Math.round(y);
  const cx = x + 8;
  if (look.near) ring(ctx, cx, y + 13, t);
  ctx.fillStyle = 'rgba(15,8,8,0.35)';
  ctx.fillRect(x + 2, y + 13, 12, 3);
  /* the stone foot */
  rect(ctx, OUTLINE, x + 4, y + 2, 8, 13);
  rect(ctx, STONE_DARK, x + 5, y + 3, 6, 11);
  rect(ctx, STONE, x + 5, y + 3, 4, 11);
  rect(ctx, STONE_LIGHT, x + 5, y + 3, 1, 11);
  rect(ctx, OUTLINE, x + 2, y + 12, 12, 3);
  rect(ctx, STONE, x + 3, y + 12, 10, 2);
  /* the iron bowl */
  rect(ctx, OUTLINE, x, y - 3, 16, 6);
  rect(ctx, IRON, x + 1, y - 2, 14, 4);
  rect(ctx, IRON_LIGHT, x + 1, y - 2, 14, 1);
  rect(ctx, OUTLINE, x + 2, y + 2, 12, 1);
  /* the coals */
  const hot = look.lit ? 1 : look.flare;
  for (let i = 0; i < 6; i++) rect(ctx, hot > 0 && i % 2 ? EMBER : COAL, x + 2 + i * 2, y - 3 - (i % 3 === 1 ? 1 : 0), 2, 1);
  if (look.lit) flame(ctx, cx, y - 4, 0.45 + 0.55 * look.k, t);
  else if (look.flare > 0) flame(ctx, cx, y - 4, look.flare, t);
}

export function paintCarving(ctx, x, y, look, env) {
  const t = (env && env.t) || look.t || 0;
  x = Math.round(x);
  y = Math.round(y);
  if (look.near) ring(ctx, x + 8, y + 13, t);
  ctx.fillStyle = 'rgba(15,8,8,0.35)';
  ctx.fillRect(x + 1, y + 13, 14, 3);
  rect(ctx, OUTLINE, x + 1, y - 14, 14, 28);
  rect(ctx, STONE_DARK, x + 2, y - 13, 12, 26);
  rect(ctx, STONE, x + 2, y - 13, 11, 25);
  rect(ctx, STONE_LIGHT, x + 2, y - 13, 11, 1);
  /* the mountain, cut in */
  const peak = [[3, 8], [4, 6], [5, 4], [6, 2], [7, 0], [8, 0], [9, 2], [10, 4], [11, 6], [12, 8]];
  for (const [px, py] of peak) rect(ctx, STONE_DARK, x + px, y - 4 + py, 1, 1);
  /* the flame climbing it: up the west side, over the top, down the east (small marks of red ochre) */
  for (const [px, py] of [[4, 5], [6, 1], [9, 1], [11, 5]]) rect(ctx, EMBER, x + px, y - 4 + py - 2, 1, 2);
  rect(ctx, STONE_DARK, x + 3, y + 6, 10, 1);
  rect(ctx, STONE_DARK, x + 4, y + 8, 8, 1);
}

export function installBrazierCourt(game) {
  installBraziers(game, {
    type: TYPE,
    paintBrazier,
    paintCarving,
    light: { r: 44, color: '#ffa850', rise: 6 },
    sounds: { light: 'sparkle', wrong: 'bump', solve: 'unlock' },
  });
  game.registry.add('trial.test', TYPE, (test) => {
    const braziers = game.registry.get('service', 'braziers');
    try {
      return !!(braziers && braziers.solved(test.puzzle));
    } catch (error) {
      return false;
    }
  });
}
