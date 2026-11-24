/*
 * circuit.js  (Hontori: features)
 * Job: Hontori's power-line puzzles (puzzle type "circuit", the door test of the Storm Works) on the engine's
 * circuits (systems/features/Circuits.js): the look of a switch tile (a raised slate block with a copper channel
 * in its shape and a brass turning ring; it turns a quarter round each time it is used), the copper glowing
 * yellow wherever the power reaches, the light running along the finished line, the dynamo that sends the power
 * (a copper coil on an iron box) and the door lamp that lights at the end, the brass socket that marks both ends
 * of the line (bright on the coil, dark at the foot of the door lamp until the line is joined), the soft ring on the floor while the
 * kid stands where a tile can be turned, the sounds, and the entrance test that passes once the lamp is lit.
 *
 * Public API:
 *   installCircuit(game)   registers everything below (through installCircuits)
 *     trial.test   "circuit"   { type: 'circuit', puzzle: puzzleId }   passed when that puzzle is solved
 *     and what installCircuits registers: gate, world.layer and system "features:circuits", service
 *     "circuits", puzzle.reset "circuit", save section "circuits"
 *   paintPiece, paintSource, paintTarget   the three looks (map pixels, x, y the tile's top-left)
 *
 * Puzzle data: see systems/features/Circuits.js (type: 'circuit').
 */

import { installCircuits } from '../../systems/features/index.js';

const TYPE = 'circuit';
const OUTLINE = '#24202a';
const SLATE_LIGHT = '#9a9caa';
const SLATE = '#787a88';
const SLATE_DARK = '#46485a';
const IRON = '#3c3a40';
const IRON_LIGHT = '#5e5c66';
const COPPER_DARK = '#7a3e1e';
const COPPER = '#b8682e';
const COPPER_LIGHT = '#e09458';
const SPARK = '#ffe36a';
const SPARK_LIGHT = '#fff8d0';
const BRASS = '#f0c860';
const BRASS_DARK = '#b08434';
const GLASS = '#9aa6b4';
const GLASS_LIGHT = '#c8d2dc';
const RING = '#ffe9a8';
const RING_SECONDS = 1.6;
const RING_DOTS = 44;
/* side index (up, right, down, left) to an angle on screen */
const SIDE_ANGLE = [-Math.PI / 2, 0, Math.PI / 2, Math.PI];

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

/* a copper channel from the middle of the block out to one side: a dark edge, copper, a bright core */
function channel(ctx, cx, cy, angle, outer, inner) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  const nx = -s;
  const ny = c;
  for (let side = 2; side >= 0; side--) {
    ctx.fillStyle = side === 2 ? OUTLINE : side === 1 ? outer : inner;
    for (let r = side ? 0 : 0.5; r <= 7; r += 0.5) {
      const x = cx + c * r;
      const y = cy + s * r;
      ctx.fillRect(Math.round(x + nx * side - 0.5), Math.round(y + ny * side - 0.5), 1, 1);
      if (side) ctx.fillRect(Math.round(x - nx * side - 0.5), Math.round(y - ny * side - 0.5), 1, 1);
    }
  }
}

/* the two ends of a line look alike: a brass socket plate on the side the line leaves or arrives by. Its
   eye is dark while no power is in it and bright once there is: the coil's is always bright, the goal's lights
   when the line is joined. */
function socket(ctx, cx, cy, angle, lit) {
  const px = Math.round(cx + Math.cos(angle) * 6);
  const py = Math.round(cy + Math.sin(angle) * 6);
  rect(ctx, OUTLINE, px - 4, py - 4, 9, 9);
  rect(ctx, BRASS_DARK, px - 3, py - 3, 7, 7);
  rect(ctx, BRASS, px - 3, py - 3, 7, 1);
  rect(ctx, BRASS, px - 3, py - 3, 1, 7);
  rect(ctx, OUTLINE, px - 2, py - 2, 5, 5);
  rect(ctx, lit ? SPARK : SLATE_DARK, px - 1, py - 1, 3, 3);
  rect(ctx, lit ? SPARK_LIGHT : SLATE, px, py, 1, 1);
}

/* the raised block every part stands on */
function block(ctx, x, y, dark) {
  ctx.fillStyle = 'rgba(20,15,10,0.28)';
  ctx.fillRect(x + 1, y + 14, 15, 2);
  rect(ctx, OUTLINE, x, y - 1, 16, 16);
  rect(ctx, dark ? SLATE_DARK : SLATE, x + 1, y, 14, 11);
  rect(ctx, dark ? SLATE : SLATE_LIGHT, x + 1, y, 14, 1);
  rect(ctx, SLATE_DARK, x + 1, y + 11, 14, 3);
  rect(ctx, IRON, x + 1, y + 13, 14, 1);
}

export function paintPiece(ctx, x, y, look, env) {
  const t = (env && env.t) || 0;
  x = Math.round(x);
  y = Math.round(y);
  const cx = x + 8;
  const cy = y + 5;
  if (look.near) paintRing(ctx, cx, y + 13, t);
  block(ctx, x, y, look.fixed);
  if (look.fixed) {
    /* a fixed piece is bolted down */
    for (const [bx, by] of [[2, 1], [13, 1], [2, 9], [13, 9]]) rect(ctx, IRON_LIGHT, x + bx, y + by, 1, 1);
  } else {
    /* the brass ring it turns on */
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * Math.PI * 2;
      ctx.fillStyle = i % 6 ? BRASS_DARK : BRASS;
      ctx.fillRect(Math.round(cx + Math.cos(a) * 5.5 - 0.5), Math.round(cy + Math.sin(a) * 4.5 - 0.5), 1, 1);
    }
  }
  const glow = look.lit ? Math.max(look.wave || 0, 0.6) : 0;
  const outer = look.lit ? SPARK : COPPER;
  const inner = look.lit ? (glow > 0.8 ? '#ffffff' : SPARK_LIGHT) : COPPER_LIGHT;
  /* the shape's ends before turning, turned by the eased angle (whole quarters when still) */
  for (const side of look.base) channel(ctx, cx, cy, SIDE_ANGLE[side] + look.angle * (Math.PI / 2), outer, inner);
  rect(ctx, OUTLINE, cx - 2, cy - 2, 5, 5);
  rect(ctx, outer, cx - 1, cy - 1, 3, 3);
  rect(ctx, inner, cx, cy, 1, 1);
  if (look.lit && look.wave > 0.5) {
    ctx.globalAlpha = (look.wave - 0.5) * 0.8;
    rect(ctx, SPARK_LIGHT, cx - 2, cy - 2, 5, 5);
    ctx.globalAlpha = 1;
  }
}

export function paintSource(ctx, x, y, look, env) {
  const t = (env && env.t) || 0;
  x = Math.round(x);
  y = Math.round(y);
  const cx = x + 8;
  block(ctx, x, y, true);
  /* the copper stub that leads the power out */
  channel(ctx, cx, y + 5, SIDE_ANGLE[look.out] ?? 0, COPPER_LIGHT, SPARK);
  socket(ctx, cx, y + 5, SIDE_ANGLE[look.out] ?? 0, true);
  /* an iron box with a copper coil on top */
  rect(ctx, OUTLINE, cx - 5, y - 9, 11, 14);
  rect(ctx, IRON, cx - 4, y - 8, 9, 12);
  rect(ctx, IRON_LIGHT, cx - 4, y - 8, 9, 1);
  for (let i = 0; i < 5; i++) {
    rect(ctx, i % 2 ? COPPER : COPPER_LIGHT, cx - 3, y - 6 + i * 2, 7, 1);
    rect(ctx, COPPER_DARK, cx - 3, y - 5 + i * 2, 7, 1);
  }
  /* the spark on its tip: this is where the power comes from */
  rect(ctx, OUTLINE, cx - 1, y - 13, 3, 4);
  rect(ctx, BRASS, cx, y - 12, 1, 3);
  const flick = Math.sin(t * 9) > 0;
  rect(ctx, flick ? SPARK_LIGHT : SPARK, cx - 1 + (flick ? 0 : 1), y - 15, 1, 2);
  rect(ctx, SPARK, cx + (flick ? 1 : -1), y - 14, 1, 1);
}

export function paintTarget(ctx, x, y, look) {
  x = Math.round(x);
  y = Math.round(y);
  const cx = x + 8;
  block(ctx, x, y, true);
  channel(ctx, cx, y + 5, SIDE_ANGLE[look.in] ?? 0, look.lit ? COPPER_LIGHT : COPPER_DARK, look.lit ? SPARK : COPPER);
  /* an iron lamp post with a glass globe */
  rect(ctx, OUTLINE, cx - 2, y - 14, 5, 20);
  rect(ctx, IRON, cx - 1, y - 14, 3, 20);
  rect(ctx, IRON_LIGHT, cx - 1, y - 14, 1, 20);
  rect(ctx, OUTLINE, cx - 4, y - 24, 9, 11);
  const k = look.lit ? look.k : 0;
  rect(ctx, k > 0 ? SPARK : GLASS, cx - 3, y - 23, 7, 9);
  rect(ctx, k > 0 ? SPARK_LIGHT : GLASS_LIGHT, cx - 2, y - 22, 2, 4);
  rect(ctx, BRASS_DARK, cx - 4, y - 25, 9, 2);
  rect(ctx, BRASS, cx - 1, y - 27, 3, 2);
  /* the goal: the socket at the foot of the door lamp, drawn over the post so it is never hidden */
  socket(ctx, cx, y + 5, SIDE_ANGLE[look.in] ?? 0, !!look.lit);
  if (k > 0) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.25 * k;
    ctx.fillStyle = SPARK;
    ctx.fillRect(cx - 7, y - 26, 15, 15);
    ctx.restore();
  }
}

export function installCircuit(game) {
  installCircuits(game, {
    type: TYPE,
    paintPiece,
    paintSource,
    paintTarget,
    light: { r: 46, color: '#ffe8a0', rise: 18 },
    sounds: { turn: 'blip', lit: 'sparkle', solve: 'unlock' },
  });
  game.registry.add('trial.test', TYPE, (test) => {
    const circuits = game.registry.get('service', 'circuits');
    try {
      return !!(circuits && circuits.solved(test.puzzle));
    } catch (error) {
      return false;
    }
  });
}
