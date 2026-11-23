/*
 * vanes.js  (Hontori: features)
 * Job: Hontori's wind-vane puzzles (puzzle type "vanes", the entrance of Gale Loft) on the engine's gusts
 * (systems/features/Gusts.js): the look of a vane (a sturdy wooden post on a stone foot, iron compass arms, and
 * a bold brass arrow with a red tail fin on top that points the way its gust blows), the soft ring on the
 * ground while the kid stands where the vane can be turned, the faint wind lines over a windy bridge, the
 * sounds, and the entrance test that passes once the bridges are crossed.
 *
 * Public API:
 *   installVanes(game)   registers everything below (through installGusts)
 *     trial.test   "vanes"   { type: 'vanes', puzzle: puzzleId }   passed when that puzzle is solved
 *     and what installGusts registers: gate, world.layer and system "features:gusts", service "gusts",
 *     save section "gusts"
 *   paintVane(ctx, x, y, look, env)   one vane on its tile (x, y: the tile's top-left in map pixels)
 *
 * Puzzle data: see systems/features/Gusts.js (type: 'vanes').
 */

import { installGusts } from '../../systems/features/index.js';

const TYPE = 'vanes';
const ANGLE = [Math.PI / 2, -Math.PI / 2, Math.PI, 0];
const OUTLINE = '#2e2118';
const POST_DARK = '#5a3a1e';
const POST = '#8a5a30';
const POST_LIGHT = '#b07c44';
const STONE_LIGHT = '#b4afa4';
const STONE = '#8e897e';
const STONE_DARK = '#625d55';
const IRON = '#3c3a40';
const BRASS_LIGHT = '#fff0b0';
const BRASS = '#f0c860';
const BRASS_DARK = '#b08434';
const FIN_LIGHT = '#f07a52';
const FIN = '#c83c28';
const RING = '#fff4c8';

/* the arrow seen from a little above: its up and down are shortened */
const SQUASH = 0.8;
const ARROW_W = 31;
const ARROW_H = 24;
const STEPS = 32;
const RING_SECONDS = 1.6;
const RING_DOTS = 44;

/* the arrow, one small cached picture per turned step (at most STEPS, made on first use) */
const arrows = new Map();

function shapeAt(u, v) {
  const a = Math.abs(v);
  if (u >= 5 && u <= 12 && a <= (12 - u) * 0.72 + 0.3) return u > 9 ? 'tip' : 'head';
  if (u >= -8 && u < 5 && a <= 1.1) return v < 0 ? 'shaftLight' : 'shaft';
  if (u >= -13 && u < -7 && a <= 1 + (-7 - u) * 0.75) return v < 0 ? 'finLight' : 'fin';
  return null;
}

const COLORS = { tip: BRASS_LIGHT, head: BRASS, shaftLight: BRASS, shaft: BRASS_DARK, finLight: FIN_LIGHT, fin: FIN };

function arrowArt(step) {
  if (arrows.has(step)) return arrows.get(step);
  let canvas = null;
  try {
    canvas = document.createElement('canvas');
    canvas.width = ARROW_W;
    canvas.height = ARROW_H;
    const ctx = canvas.getContext('2d');
    const angle = (step / STEPS) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const cx = ARROW_W / 2;
    const cy = ARROW_H / 2;
    const grid = [];
    for (let py = 0; py < ARROW_H; py++) {
      const row = [];
      for (let px = 0; px < ARROW_W; px++) {
        const X = px + 0.5 - cx;
        const Y = (py + 0.5 - cy) / SQUASH;
        row.push(shapeAt(X * cos + Y * sin, -X * sin + Y * cos));
      }
      grid.push(row);
    }
    const filled = (px, py) => py >= 0 && py < ARROW_H && px >= 0 && px < ARROW_W && !!grid[py][px];
    for (let py = 0; py < ARROW_H; py++) {
      for (let px = 0; px < ARROW_W; px++) {
        const part = grid[py][px];
        if (part) {
          ctx.fillStyle = COLORS[part];
          ctx.fillRect(px, py, 1, 1);
        } else if (filled(px - 1, py) || filled(px + 1, py) || filled(px, py - 1) || filled(px, py + 1)) {
          /* a dark edge all round, so the arrow reads on grass, sand and water */
          ctx.fillStyle = OUTLINE;
          ctx.fillRect(px, py, 1, 1);
        }
      }
    }
  } catch (error) {
    canvas = null;
  }
  arrows.set(step, canvas);
  return canvas;
}

/* the shortest way round from one direction to the next */
function angleBetween(from, to, k) {
  const a = ANGLE[from] ?? 0;
  let b = ANGLE[to] ?? 0;
  while (b - a > Math.PI) b -= Math.PI * 2;
  while (a - b > Math.PI) b += Math.PI * 2;
  return a + (b - a) * k;
}

function rect(ctx, color, x, y, w, h) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/* a soft ring that breathes on the ground round the foot: this vane can be turned from here */
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

export function paintVane(ctx, x, y, look, env) {
  const t = (env && env.t) || 0;
  const k = look.k < 1 ? look.k * look.k * (3 - 2 * look.k) : 1;
  const angle = angleBetween(look.from, look.dir, k);
  x = Math.round(x);
  y = Math.round(y);
  const cx = x + 8;
  /* its shadow, and the ring when the kid can turn it */
  ctx.fillStyle = 'rgba(20,15,10,0.28)';
  ctx.fillRect(x + 2, y + 13, 13, 2);
  ctx.fillRect(x + 4, y + 15, 9, 1);
  if (look.near) paintRing(ctx, cx, y + 12, t);
  /* a two-step stone foot */
  rect(ctx, OUTLINE, x + 1, y + 8, 14, 7);
  rect(ctx, STONE, x + 2, y + 9, 12, 5);
  rect(ctx, STONE_LIGHT, x + 2, y + 9, 12, 1);
  rect(ctx, STONE_DARK, x + 2, y + 13, 12, 1);
  rect(ctx, OUTLINE, x + 3, y + 5, 10, 4);
  rect(ctx, STONE, x + 4, y + 6, 8, 3);
  rect(ctx, STONE_LIGHT, x + 4, y + 6, 8, 1);
  rect(ctx, STONE_DARK, x + 11, y + 7, 1, 2);
  /* the sturdy post, as tall as a lamp */
  rect(ctx, OUTLINE, cx - 2, y - 16, 5, 22);
  rect(ctx, POST, cx - 1, y - 16, 3, 22);
  rect(ctx, POST_LIGHT, cx - 1, y - 14, 1, 19);
  rect(ctx, POST_DARK, cx + 1, y - 16, 1, 22);
  rect(ctx, IRON, cx - 2, y + 2, 5, 1);
  /* iron compass arms low on the post: the four ways it can point */
  rect(ctx, IRON, cx - 7, y - 4, 15, 1);
  rect(ctx, IRON, cx - 1, y - 6, 3, 4);
  rect(ctx, BRASS_DARK, cx - 8, y - 5, 2, 2);
  rect(ctx, BRASS_DARK, cx + 7, y - 5, 2, 2);
  /* the arrow turns on its cap, high above the arms */
  const step = ((Math.round((angle / (Math.PI * 2)) * STEPS) % STEPS) + STEPS) % STEPS;
  const art = arrowArt(step);
  const ay = y - 18;
  if (art) ctx.drawImage(art, cx - (ARROW_W - 1) / 2, ay - ARROW_H / 2);
  rect(ctx, OUTLINE, cx - 2, ay - 2, 5, 4);
  rect(ctx, BRASS, cx - 1, ay - 1, 3, 2);
  rect(ctx, BRASS_LIGHT, cx - 1, ay - 1, 1, 1);
  rect(ctx, OUTLINE, cx, ay - 5, 1, 3);
  rect(ctx, BRASS, cx, ay - 6, 1, 1);
}

export function installVanes(game) {
  installGusts(game, {
    type: TYPE,
    paintVane,
    streak: { color: 'rgba(236,246,255,0.32)', width: 1, length: 6, speed: 28, density: 0.7 },
    sounds: { turn: 'blip', gust: null, solve: 'confirm' },
  });
  game.registry.add('trial.test', TYPE, (test) => {
    const gusts = game.registry.get('service', 'gusts');
    try {
      return !!(gusts && gusts.solved(test.puzzle));
    } catch (error) {
      return false;
    }
  });
}
